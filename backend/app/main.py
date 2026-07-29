from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .api.v1.router import router as api_v1_router
from .config import settings
from .errors import validation_error_handler
from .migrations import upgrade_database


class HealthResponse(BaseModel):
    status: str
    service: str


@asynccontextmanager
async def lifespan(_: FastAPI):
    upgrade_database()
    yield


app = FastAPI(title=settings.app_name, version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    # The renderer calls the local API directly only while Vite is serving it.
    # Keep this deliberately limited to the standard local development origins.
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.include_router(api_v1_router, prefix=settings.api_prefix)


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health_check() -> HealthResponse:
    """Return a stable local-process health signal for Electron and development tools."""

    return HealthResponse(status="ok", service="backend")
