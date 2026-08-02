from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .api.v1.router import router as api_v1_router
from .config import settings
from .database import SessionLocal
from .errors import validation_error_handler
from .migrations import upgrade_database
from .metadata.runtime import start_metadata_worker, stop_metadata_worker
from .services import SessionService


class HealthResponse(BaseModel):
    status: str
    service: str


@asynccontextmanager
async def lifespan(_: FastAPI):
    upgrade_database()
    with SessionLocal() as db:
        SessionService().recover_orphaned_sessions(db)
    if settings.twitch_client_id and settings.twitch_client_secret:
        start_metadata_worker()
    try:
        yield
    finally:
        await stop_metadata_worker()



app = FastAPI(title=settings.app_name, version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.include_router(api_v1_router, prefix=settings.api_prefix)


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health_check() -> HealthResponse:
    """Return a stable local-process health signal for Electron and development tools."""

    return HealthResponse(status="ok", service="backend")
