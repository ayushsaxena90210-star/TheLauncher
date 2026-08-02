import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

# Load backend/.env if it exists (development convenience).
_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env", override=False)


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

    @property
    def twitch_client_id(self) -> str:
        return os.getenv("TWITCH_CLIENT_ID", "")

    @property
    def twitch_client_secret(self) -> str:
        return os.getenv("TWITCH_CLIENT_SECRET", "")

    @property
    def artwork_cache_dir(self) -> Path:
        return self.database_path.parent / "assets" / "covers"


settings = Settings()
