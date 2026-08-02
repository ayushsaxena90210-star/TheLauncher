"""IGDB metadata provider using the Twitch-authenticated IGDB v4 API.

Queries the IGDB ``/v4/games`` endpoint with Apicalypse body syntax.
Enforces rate limits (4 req/s, 8 concurrent) via a semaphore and a
simple token-bucket limiter.  Uses OAuthManager for token lifecycle.
"""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import date

import httpx

from .errors import ProviderError
from .oauth import OAuthManager
from .provider import MetadataProvider, MetadataResult

logger = logging.getLogger(__name__)

_IGDB_BASE = "https://api.igdb.com/v4"
_MAX_CONCURRENT = 8
_MAX_PER_SECOND = 4
_REQUEST_TIMEOUT = 15.0


class _RateLimiter:
    """Simple token-bucket rate limiter for IGDB's 4 req/s limit."""

    def __init__(self, rate: float = _MAX_PER_SECOND) -> None:
        self._rate = rate
        self._tokens = rate
        self._last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_refill
            self._tokens = min(self._rate, self._tokens + elapsed * self._rate)
            self._last_refill = now

            if self._tokens < 1.0:
                wait = (1.0 - self._tokens) / self._rate
                await asyncio.sleep(wait)
                self._tokens = 0.0
                self._last_refill = time.monotonic()
            else:
                self._tokens -= 1.0


class IGDBProvider(MetadataProvider):
    """Concrete MetadataProvider backed by the IGDB v4 API."""

    def __init__(self, oauth: OAuthManager) -> None:
        self._oauth = oauth
        self._semaphore = asyncio.Semaphore(_MAX_CONCURRENT)
        self._limiter = _RateLimiter()

    @property
    def provider_name(self) -> str:
        return "igdb"

    async def search(self, title: str) -> list[MetadataResult]:
        """Search IGDB for games matching *title*."""
        if not title or not title.strip():
            return []

        # Escape double quotes in title for Apicalypse syntax.
        safe_title = title.replace('"', '\\"')
        body = (
            f'search "{safe_title}";'
            " fields name,summary,first_release_date,cover.image_id,genres.name;"
            " limit 10;"
        )

        try:
            data = await self._request("/games", body)
        except ProviderError:
            raise
        except Exception as exc:
            raise ProviderError(f"IGDB search failed: {exc}") from exc

        results: list[MetadataResult] = []
        if not isinstance(data, list):
            return results

        for item in data:
            if not isinstance(item, dict) or "name" not in item:
                continue

            release_date_str: str | None = None
            raw_date = item.get("first_release_date")
            if isinstance(raw_date, int):
                try:
                    release_date_str = date.fromtimestamp(raw_date).isoformat()
                except (OSError, ValueError, OverflowError):
                    pass

            cover_image_id: str | None = None
            cover = item.get("cover")
            if isinstance(cover, dict):
                cover_image_id = cover.get("image_id")

            genres: list[str] = []
            raw_genres = item.get("genres")
            if isinstance(raw_genres, list):
                for genre in raw_genres:
                    if isinstance(genre, dict) and "name" in genre:
                        genres.append(genre["name"])

            results.append(
                MetadataResult(
                    provider_name=self.provider_name,
                    external_id=int(item.get("id", 0)),
                    title=str(item["name"]),
                    summary=item.get("summary"),
                    release_date=release_date_str,
                    genres=genres,
                    cover_image_id=cover_image_id,
                )
            )

        return results

    async def _request(self, endpoint: str, body: str, *, retry: bool = True) -> list | dict:
        """Make a rate-limited, authenticated POST to IGDB."""
        await self._limiter.acquire()
        async with self._semaphore:
            token = await self._oauth.get_token()
            headers = {
                "Client-ID": self._oauth.client_id,
                "Authorization": f"Bearer {token}",
            }

            for attempt in range(3):
                try:
                    async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
                        response = await client.post(
                            f"{_IGDB_BASE}{endpoint}",
                            content=body,
                            headers=headers,
                        )

                    if response.status_code == 200:
                        return response.json()

                    if response.status_code == 401 and retry:
                        # Token may have been invalidated externally.
                        self._oauth.invalidate()
                        token = await self._oauth.get_token()
                        headers["Authorization"] = f"Bearer {token}"
                        continue

                    if response.status_code == 429:
                        retry_after = float(response.headers.get("Retry-After", 1.0))
                        logger.warning("IGDB rate limited; waiting %.1fs.", retry_after)
                        await asyncio.sleep(retry_after)
                        continue

                    if response.status_code in (500, 502, 503, 504):
                        logger.warning("IGDB returned %d on attempt %d.", response.status_code, attempt + 1)
                        if attempt < 2:
                            await asyncio.sleep(1.0 * (2 ** attempt))
                        continue

                    raise ProviderError(f"IGDB returned {response.status_code}: {response.text[:200]}")

                except httpx.HTTPError as exc:
                    logger.warning("IGDB network error on attempt %d: %s", attempt + 1, exc)
                    if attempt < 2:
                        await asyncio.sleep(1.0 * (2 ** attempt))
                    else:
                        raise ProviderError(f"IGDB request failed after 3 attempts: {exc}") from exc

            raise ProviderError("IGDB request failed after 3 attempts.")
