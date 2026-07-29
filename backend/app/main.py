from fastapi import FastAPI
from pydantic import BaseModel

from .config import settings


class HealthResponse(BaseModel):
    status: str
    service: str


app = FastAPI(title=settings.app_name, version="0.1.0")


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health_check() -> HealthResponse:
    """Return a stable local-process health signal for Electron and development tools."""

    return HealthResponse(status="ok", service="backend")
