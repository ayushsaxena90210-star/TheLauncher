import json
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ...database import get_session
from ...config import settings
from ...metadata.cache import CacheManager
from ...repositories import GameRepository
from ...schemas import MetadataGameStatusResponse, MetadataRefreshResponse, MetadataStatusResponse, ScreenshotResponse
from ...metadata.runtime import get_metadata_service

router = APIRouter(prefix="/metadata", tags=["metadata"])
repository = GameRepository()


def _require_game(session: Session, game_id: UUID) -> None:
    if repository.get(session, game_id) is None:
        raise HTTPException(status_code=404, detail={"code": "game_not_found", "message": f"Game {game_id} was not found."})


@router.post("/games/{game_id}/enqueue", response_model=MetadataRefreshResponse, status_code=status.HTTP_202_ACCEPTED)
async def enqueue_metadata(game_id: UUID, session: Session = Depends(get_session)) -> dict:
    _require_game(session, game_id)
    service = get_metadata_service()
    queued = await service.enqueue(game_id)
    return {"game_id": str(game_id), "state": "queued" if queued else "pending", "message": None if queued else "Already queued."}


@router.post("/games/{game_id}/refresh", response_model=MetadataRefreshResponse)
async def refresh_metadata(game_id: UUID, session: Session = Depends(get_session)) -> dict:
    _require_game(session, game_id)
    result = await get_metadata_service().refresh(game_id)
    return {"game_id": str(result.game_id), "state": result.state, "message": result.message}


@router.get("/status", response_model=MetadataStatusResponse)
def metadata_status() -> dict:
    return get_metadata_service().get_status()


@router.get("/games/{game_id}/status", response_model=MetadataGameStatusResponse)
def game_metadata_status(game_id: UUID, session: Session = Depends(get_session)) -> dict:
    _require_game(session, game_id)
    return {"game_id": str(game_id), "metadata_status": get_metadata_service().get_game_status(game_id)}


@router.get("/games/{game_id}/cover")
def game_cover(game_id: UUID, session: Session = Depends(get_session)) -> Response:
    game = repository.get(session, game_id)
    if game is None:
        raise HTTPException(status_code=404, detail={"code": "game_not_found", "message": f"Game {game_id} was not found."})
    if not game.cover_path:
        raise HTTPException(status_code=404, detail={"code": "cover_not_found", "message": "This game has no cached cover artwork."})
    cover = Path(game.cover_path)
    if not CacheManager(settings.artwork_cache_dir).contains(cover) or not cover.is_file():
        raise HTTPException(status_code=404, detail={"code": "cover_not_found", "message": "The cached cover artwork is unavailable."})
    return FileResponse(cover, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=86400"})


@router.get("/games/{game_id}/screenshots", response_model=list[ScreenshotResponse])
def game_screenshots(game_id: UUID, session: Session = Depends(get_session)) -> list[dict]:
    game = repository.get(session, game_id)
    if game is None:
        raise HTTPException(status_code=404, detail={"code": "game_not_found", "message": f"Game {game_id} was not found."})
    try:
        paths = json.loads(game.screenshot_paths or "[]")
    except json.JSONDecodeError:
        paths = []
    cache = CacheManager(settings.artwork_cache_dir)
    return [{"index": index} for index, value in enumerate(paths) if isinstance(value, str) and cache.contains(Path(value)) and Path(value).is_file()]


@router.get("/games/{game_id}/screenshots/{index}")
def game_screenshot(game_id: UUID, index: int, session: Session = Depends(get_session)) -> Response:
    game = repository.get(session, game_id)
    if game is None:
        raise HTTPException(status_code=404, detail={"code": "game_not_found", "message": f"Game {game_id} was not found."})
    try:
        paths = json.loads(game.screenshot_paths or "[]")
        screenshot = Path(paths[index])
    except (IndexError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=404, detail={"code": "screenshot_not_found", "message": "The cached screenshot is unavailable."})
    if not CacheManager(settings.artwork_cache_dir).contains(screenshot) or not screenshot.is_file():
        raise HTTPException(status_code=404, detail={"code": "screenshot_not_found", "message": "The cached screenshot is unavailable."})
    return FileResponse(screenshot, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=86400"})
