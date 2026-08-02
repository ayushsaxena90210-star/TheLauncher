from pathlib import Path

from alembic import command
from alembic.config import Config

from .config import settings


def upgrade_database() -> None:
    """Apply versioned Alembic migrations before serving local API requests."""

    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    backend_root = Path(__file__).resolve().parents[1]
    config = Config(str(backend_root / "alembic.ini"))
    command.upgrade(config, "head")
