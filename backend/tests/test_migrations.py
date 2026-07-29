from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_initial_migration_creates_games_table(tmp_path, monkeypatch) -> None:
    database_path = tmp_path / "migration.db"
    monkeypatch.setenv("LAUNCHER_DATABASE_PATH", str(database_path))
    config = Config("backend/alembic.ini")

    command.upgrade(config, "head")

    inspector = inspect(create_engine(f"sqlite:///{database_path.as_posix()}"))
    assert {"alembic_version", "games"}.issubset(inspector.get_table_names())
