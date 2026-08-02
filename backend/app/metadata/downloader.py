"""Cover artwork downloader with validation and local caching.

Downloads cover images from IGDB's CDN, validates content type and size,
verifies the image is valid using Pillow, and saves to the local cache.
"""

from __future__ import annotations

import logging
from io import BytesIO
from pathlib import Path
from uuid import UUID

import httpx

from .errors import DownloadError

logger = logging.getLogger(__name__)

_IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload"
_COVER_SIZE = "t_cover_big"  # 264x374
_MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
_DOWNLOAD_TIMEOUT = 30.0


async def download_cover(
    image_id: str,
    game_id: UUID,
    cache_dir: Path,
    *,
    force: bool = False,
) -> Path | None:
    """Download a cover image from IGDB CDN and cache it locally.

    Returns the local file path on success, or ``None`` on failure.
    Failures are logged but never raised — callers can still persist
    text metadata even if artwork fails.

    Args:
        image_id: IGDB cover ``image_id`` from the search results.
        game_id: UUID of the game record (used as cache filename).
        cache_dir: Directory for cached artwork files.
        force: If ``True``, delete existing cached file and re-download.
    """
    if not image_id:
        return None

    cache_dir.mkdir(parents=True, exist_ok=True)
    target_path = cache_dir / f"{game_id}.jpg"

    # Reuse cached artwork unless forced.
    if target_path.exists() and not force:
        logger.debug("Cover already cached: %s", target_path)
        return target_path

    # Delete existing file when forcing refresh.
    if target_path.exists() and force:
        target_path.unlink(missing_ok=True)

    url = f"{_IGDB_IMAGE_BASE}/{_COVER_SIZE}/{image_id}.jpg"

    try:
        async with httpx.AsyncClient(timeout=_DOWNLOAD_TIMEOUT, follow_redirects=True) as client:
            response = await client.get(url)

        if response.status_code != 200:
            logger.warning("Cover download returned %d for %s.", response.status_code, url)
            return None

        content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
        if content_type not in _ALLOWED_CONTENT_TYPES:
            logger.warning("Cover rejected: unexpected content-type %s for %s.", content_type, url)
            return None

        data = response.content
        if len(data) > _MAX_FILE_SIZE:
            logger.warning("Cover rejected: %d bytes exceeds %d limit.", len(data), _MAX_FILE_SIZE)
            return None

        if not _is_valid_image(data):
            logger.warning("Cover rejected: Pillow could not verify image from %s.", url)
            return None

        # Validate target path stays within cache directory.
        resolved = target_path.resolve()
        if not resolved.is_relative_to(cache_dir.resolve()):
            logger.error("Path traversal detected: %s is not under %s.", resolved, cache_dir)
            return None

        target_path.write_bytes(data)
        logger.info("Cover saved: %s (%d bytes).", target_path, len(data))
        return target_path

    except httpx.HTTPError as exc:
        logger.warning("Cover download failed for %s: %s", url, exc)
        return None
    except OSError as exc:
        logger.warning("Cover write failed for %s: %s", target_path, exc)
        return None


def _is_valid_image(data: bytes) -> bool:
    """Verify that *data* contains a valid image using Pillow."""
    try:
        from PIL import Image

        image = Image.open(BytesIO(data))
        image.verify()
        return True
    except Exception:
        return False
