"""Settings API: local preferences, saved scan roots, and safe artwork-cache actions."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...config import settings
from ...database import get_session
from ...metadata.cache import CacheManager
from ...metadata.runtime import get_metadata_service, metadata_is_configured
from ...models import Game
from ...schemas import (
    CacheOperationResponse,
    CacheStatusResponse,
    MetadataProviderStatusResponse,
    ScanRootCreate,
    ScanRootResponse,
    SettingsOverviewResponse,
    SettingsResponse,
    SettingsUpdate,
)
from ...settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])
service = SettingsService()


def _cache_status(session: Session) -> CacheStatusResponse:
    cache = CacheManager(settings.artwork_cache_dir)
    size_bytes, artwork_count = cache.statistics()
    return CacheStatusResponse(
        location=str(cache.cache_dir),
        size_bytes=size_bytes,
        artwork_count=artwork_count,
        last_metadata_refresh_at=service.last_metadata_refresh(session),
        last_cleanup_at=service.last_cleanup(session),
    )


def _metadata_status(session: Session) -> MetadataProviderStatusResponse:
    queue_size = 0
    if metadata_is_configured():
        queue_size = int(get_metadata_service().get_status()["queue_size"])
    return MetadataProviderStatusResponse(
        configured=metadata_is_configured(),
        queue_size=queue_size,
        last_refresh_at=service.last_metadata_refresh(session),
    )


@router.get("", response_model=SettingsOverviewResponse)
def get_overview(session: Session = Depends(get_session)) -> SettingsOverviewResponse:
    return SettingsOverviewResponse(
        settings=service.get_settings(session),
        scan_roots=service.list_scan_roots(session),
        library_size=service.library_size(session),
        metadata=_metadata_status(session),
        cache=_cache_status(session),
    )


@router.put("", response_model=SettingsResponse)
def update_settings(payload: SettingsUpdate, session: Session = Depends(get_session)) -> SettingsResponse:
    return service.update_settings(session, payload)


@router.post("/scan-roots", response_model=ScanRootResponse, status_code=status.HTTP_201_CREATED)
def add_scan_root(payload: ScanRootCreate, session: Session = Depends(get_session)) -> ScanRootResponse:
    return service.add_scan_root(session, payload)


@router.delete("/scan-roots/{root_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_scan_root(root_id: UUID, session: Session = Depends(get_session)) -> None:
    service.remove_scan_root(session, root_id)


@router.post("/scan-roots/rescan")
def saved_scan_roots(session: Session = Depends(get_session)) -> dict:
    """Return roots for Electron to pass to the existing scan lifecycle."""
    return {"roots": service.active_scan_roots(session)}


@router.get("/cache", response_model=CacheStatusResponse)
def get_cache_status(session: Session = Depends(get_session)) -> CacheStatusResponse:
    return _cache_status(session)


@router.post("/cache/clear", response_model=CacheOperationResponse)
def clear_cache(session: Session = Depends(get_session)) -> CacheOperationResponse:
    cache = CacheManager(settings.artwork_cache_dir)
    removed_count, removed_bytes = cache.remove_files(cache.files())
    service.clear_artwork_references(session)
    service.mark_cleanup(session, datetime.now(timezone.utc))
    return CacheOperationResponse(**_cache_status(session).model_dump(), removed_count=removed_count, removed_bytes=removed_bytes)


@router.post("/cache/rebuild", response_model=CacheOperationResponse)
def rebuild_cache(session: Session = Depends(get_session)) -> CacheOperationResponse:
    cache = CacheManager(settings.artwork_cache_dir)
    referenced = service.referenced_artwork_paths(session)
    for game in session.scalars(select(Game)):
        try:
            referenced.update(path for path in json.loads(game.screenshot_paths or "[]") if isinstance(path, str))
        except json.JSONDecodeError:
            continue
    removable = [path for path in cache.files() if str(path.resolve()) not in referenced]
    removed_count, removed_bytes = cache.remove_files(removable)
    service.mark_cleanup(session, datetime.now(timezone.utc))
    return CacheOperationResponse(**_cache_status(session).model_dump(), removed_count=removed_count, removed_bytes=removed_bytes)


@router.post("/metadata/refresh")
async def refresh_all_metadata(session: Session = Depends(get_session)) -> dict:
    if not metadata_is_configured():
        # Calling this preserves the existing clear configuration error contract.
        get_metadata_service()
    game_ids = list(session.scalars(select(Game.id)))
    queued = await get_metadata_service().refresh_many(game_ids)
    return {"queued_count": queued}
