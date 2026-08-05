from fastapi import APIRouter

from .games import router as games_router
from .metadata import router as metadata_router
from .sessions import router as sessions_router
from .scanner import router as scanner_router
from .settings import router as settings_router

router = APIRouter()
router.include_router(games_router)
router.include_router(metadata_router)
router.include_router(sessions_router)
router.include_router(scanner_router)
router.include_router(settings_router)
