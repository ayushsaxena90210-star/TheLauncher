"""Application-lifetime construction of the metadata service."""

from __future__ import annotations

from fastapi import HTTPException, status

from ..config import settings
from .cache import CacheManager
from .igdb_provider import IGDBProvider
from .oauth import OAuthManager
from .service import MetadataService

_service: MetadataService | None = None


def metadata_is_configured() -> bool:
    return bool(settings.twitch_client_id and settings.twitch_client_secret)


def get_metadata_service() -> MetadataService:
    """Return the singleton worker, or a clear local configuration error."""
    global _service
    if _service is None:
        if not metadata_is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "metadata_not_configured",
                    "message": "Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET to enable metadata fetching.",
                },
            )
        cache = CacheManager(settings.artwork_cache_dir)
        _service = MetadataService(IGDBProvider(OAuthManager(settings.twitch_client_id, settings.twitch_client_secret)), cache.ensure_directory())
    return _service


def start_metadata_worker() -> None:
    get_metadata_service().start_worker()


async def stop_metadata_worker() -> None:
    if _service is not None:
        await _service.stop_worker()
