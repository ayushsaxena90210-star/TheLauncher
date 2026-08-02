from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from backend.app.database import Base, get_session
from backend.app.main import app
from backend.app import main
from backend.app.api.v1 import scanner as scanner_api
from backend.app import models  # noqa: F401


@pytest.fixture
def client(tmp_path, monkeypatch) -> Generator[TestClient, None, None]:
    class NoopMetadataService:
        async def enqueue_many(self, game_ids) -> int:
            return len(game_ids)

    # Metadata integration tests replace their own endpoint dependency.  The
    # shared API fixture must never make live Twitch/IGDB requests.
    monkeypatch.setattr(main, "start_metadata_worker", lambda: None)
    async def stop_worker() -> None:
        return None
    monkeypatch.setattr(main, "stop_metadata_worker", stop_worker)
    monkeypatch.setattr(scanner_api, "get_metadata_service", lambda: NoopMetadataService())
    monkeypatch.setenv("LAUNCHER_DATABASE_PATH", str(tmp_path / "migration.db"))
    engine = create_engine(
        f"sqlite:///{(tmp_path / 'test.db').as_posix()}",
        connect_args={"check_same_thread": False},
    )
    testing_session = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    @event.listens_for(engine, "connect")
    def _enable_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)

    def override_get_session() -> Generator[Session, None, None]:
        session = testing_session()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    engine.dispose()
