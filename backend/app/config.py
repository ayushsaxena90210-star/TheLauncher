import os
from pathlib import Path

from pydantic import BaseModel


class Settings(BaseModel):
    """Runtime settings for the local FastAPI service."""

    app_name: str = "The Launcher API"
    api_prefix: str = "/api/v1"

    @property
    def database_path(self) -> Path:
        configured_path = os.getenv("LAUNCHER_DATABASE_PATH")
        if configured_path:
            return Path(configured_path).expanduser().resolve()

        project_root = Path(__file__).resolve().parents[2]
        return project_root / "database" / "the-launcher.db"

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.database_path.as_posix()}"


settings = Settings()
