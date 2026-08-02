"""Central metadata orchestrator.

Manages a background queue of game IDs, coordinates provider lookups,
matching, artwork downloads, and database updates.  Completely unaware
of Twitch OAuth or IGDB specifics — it programs against MetadataProvider.

In-memory status tracking provides UI status indicators (queued, fetching,
success, failed) without expanding the database schema.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session as DbSession

from ..database import SessionLocal
from ..models import Game
from ..repositories import GameRepository
from .downloader import download_cover
from .errors import MetadataError
from .matcher import best_match
from .provider import MetadataProvider
from .title_normalizer import normalize_for_search

logger = logging.getLogger(__name__)


@dataclass
class MetadataStatus:
    """In-memory status of a single game's metadata lookup."""

    game_id: UUID
    state: str = "queued"  # queued | fetching | success | failed
    message: str | None = None


@dataclass
class MetadataServiceState:
    """Global in-memory state for the metadata background worker."""

    queue_size: int = 0
    processing: MetadataStatus | None = None
    recent: list[MetadataStatus] = field(default_factory=list)
    _max_recent: int = 20


class MetadataService:
    """Orchestrates asynchronous metadata enrichment for imported games."""

    def __init__(
        self,
        provider: MetadataProvider,
        artwork_cache_dir: Path,
    ) -> None:
        self._provider = provider
        self._cache_dir = artwork_cache_dir
        self._repo = GameRepository()
        self._queue: asyncio.Queue[UUID] = asyncio.Queue()
        self._pending_ids: set[UUID] = set()
        self._state = MetadataServiceState()
        self._worker_task: asyncio.Task | None = None
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start_worker(self) -> None:
        """Start the background metadata worker (call once during lifespan)."""
        if self._worker_task is None or self._worker_task.done():
            self._worker_task = asyncio.create_task(self._worker())
            logger.info("Metadata background worker started.")

    async def stop_worker(self) -> None:
        """Stop the background metadata worker gracefully."""
        if self._worker_task and not self._worker_task.done():
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            logger.info("Metadata background worker stopped.")

    async def enqueue(self, game_id: UUID) -> bool:
        """Add a game ID to the metadata queue.  Returns False if already pending."""
        async with self._lock:
            if game_id in self._pending_ids:
                logger.debug("Game %s already in metadata queue.", game_id)
                return False
            self._pending_ids.add(game_id)

        await self._queue.put(game_id)
        self._state.queue_size = self._queue.qsize()
        logger.info("Enqueued game %s for metadata lookup.", game_id)
        return True

    async def enqueue_many(self, game_ids: list[UUID]) -> int:
        """Enqueue multiple game IDs.  Returns count actually enqueued."""
        count = 0
        for game_id in game_ids:
            if await self.enqueue(game_id):
                count += 1
        return count

    async def refresh(self, game_id: UUID) -> MetadataStatus:
        """Force a synchronous metadata refresh for one game (manual refresh)."""
        return await self._process_game(game_id, force=True)

    def get_status(self) -> dict:
        """Return a snapshot of the metadata worker's state."""
        return {
            "queue_size": self._queue.qsize(),
            "processing": _status_dict(self._state.processing),
            "recent": [_status_dict(s) for s in self._state.recent],
        }

    def get_game_status(self, game_id: UUID) -> str | None:
        """Return the in-memory status for a specific game, or None."""
        if self._state.processing and self._state.processing.game_id == game_id:
            return self._state.processing.state
        for status in self._state.recent:
            if status.game_id == game_id:
                return status.state
        async_lock_check = game_id in self._pending_ids
        if async_lock_check:
            return "queued"
        return None

    # ------------------------------------------------------------------
    # Background worker
    # ------------------------------------------------------------------

    async def _worker(self) -> None:
        """Process the metadata queue indefinitely."""
        while True:
            try:
                game_id = await self._queue.get()
                self._state.queue_size = self._queue.qsize()
                await self._process_game(game_id, force=False)
                self._queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("Unexpected error in metadata worker.")

    async def _process_game(self, game_id: UUID, *, force: bool) -> MetadataStatus:
        """Run the complete metadata pipeline for a single game."""
        status = MetadataStatus(game_id=game_id, state="fetching")
        self._state.processing = status

        try:
            # 1. Load game from database.
            with SessionLocal() as session:
                game = self._repo.get(session, game_id)
                if game is None:
                    status.state = "failed"
                    status.message = "Game not found."
                    self._record_status(status, game_id)
                    return status

                # Skip if already has metadata and not a forced refresh.
                if not force and game.igdb_id is not None:
                    status.state = "success"
                    status.message = "Already has metadata."
                    self._record_status(status, game_id)
                    return status

                search_title = normalize_for_search(game.title)

            if not search_title:
                status.state = "failed"
                status.message = "Title could not be normalized."
                self._record_status(status, game_id)
                return status

            # 2. Search provider.
            results = await self._provider.search(search_title)

            if not results:
                status.state = "failed"
                status.message = "No results from provider."
                self._record_status(status, game_id)
                return status

            # 3. Match.
            match = best_match(search_title, results)

            if match is None:
                status.state = "failed"
                status.message = "No match above confidence threshold."
                self._record_status(status, game_id)
                return status

            matched = match.result

            # 4. Download artwork.
            cover_path: Path | None = None
            if matched.cover_image_id:
                cover_path = await download_cover(
                    matched.cover_image_id, game_id, self._cache_dir, force=force
                )

            # 5. Persist metadata.
            with SessionLocal() as session:
                game = self._repo.get(session, game_id)
                if game is None:
                    status.state = "failed"
                    status.message = "Game deleted during metadata fetch."
                    self._record_status(status, game_id)
                    return status

                if matched.summary:
                    game.description = matched.summary
                if matched.release_date:
                    try:
                        game.release_date = date.fromisoformat(matched.release_date)
                    except ValueError:
                        pass
                if matched.genres:
                    game.genres = ", ".join(matched.genres)
                if cover_path:
                    game.cover_path = str(cover_path.resolve())

                game.igdb_id = matched.external_id
                game.metadata_source = matched.provider_name
                game.metadata_confidence = round(match.confidence, 2)

                session.commit()

            status.state = "success"
            status.message = f"Matched '{matched.title}' (confidence: {match.confidence:.0%})."
            logger.info(
                "Metadata applied for game %s: '%s' (confidence %.2f).",
                game_id, matched.title, match.confidence,
            )

        except MetadataError as exc:
            status.state = "failed"
            status.message = str(exc)
            logger.warning("Metadata lookup failed for %s: %s", game_id, exc)

        except Exception as exc:
            status.state = "failed"
            status.message = f"Unexpected error: {exc}"
            logger.exception("Metadata lookup crashed for %s.", game_id)

        self._record_status(status, game_id)
        return status

    def _record_status(self, status: MetadataStatus, game_id: UUID) -> None:
        """Move the status to the recent list and clean up pending set."""
        self._state.processing = None
        self._state.recent = [s for s in self._state.recent if s.game_id != game_id]
        self._state.recent.insert(0, status)
        if len(self._state.recent) > self._state._max_recent:
            self._state.recent = self._state.recent[:self._state._max_recent]
        self._pending_ids.discard(game_id)


def _status_dict(status: MetadataStatus | None) -> dict | None:
    if status is None:
        return None
    return {
        "game_id": str(status.game_id),
        "state": status.state,
        "message": status.message,
    }
