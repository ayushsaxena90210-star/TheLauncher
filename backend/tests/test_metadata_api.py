from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.api.v1 import metadata as metadata_api


class FakeMetadataService:
    def __init__(self) -> None:
        self.queued: list[str] = []

    async def enqueue(self, game_id) -> bool:
        value = str(game_id)
        if value in self.queued:
            return False
        self.queued.append(value)
        return True

    async def refresh(self, game_id):
        return type("Result", (), {"game_id": game_id, "state": "success", "message": "Metadata refreshed."})()

    def get_status(self) -> dict:
        return {"queue_size": len(self.queued), "processing": None, "recent": []}

    def get_game_status(self, game_id) -> str | None:
        return "queued" if str(game_id) in self.queued else None


def create_game(client: TestClient, tmp_path: Path) -> dict:
    executable = tmp_path / "Example.exe"
    executable.touch()
    response = client.post("/api/v1/games", json={"title": "Example", "executable_path": str(executable)})
    assert response.status_code == 201
    return response.json()


def test_metadata_queue_status_and_refresh(client: TestClient, tmp_path: Path, monkeypatch) -> None:
    fake_service = FakeMetadataService()
    monkeypatch.setattr(metadata_api, "get_metadata_service", lambda: fake_service)
    game = create_game(client, tmp_path)

    queued = client.post(f"/api/v1/metadata/games/{game['id']}/enqueue")
    assert queued.status_code == 202
    assert queued.json()["state"] == "queued"
    assert client.post(f"/api/v1/metadata/games/{game['id']}/enqueue").json()["state"] == "pending"

    status = client.get(f"/api/v1/metadata/games/{game['id']}/status")
    assert status.status_code == 200
    assert status.json()["metadata_status"] == "queued"

    refreshed = client.post(f"/api/v1/metadata/games/{game['id']}/refresh")
    assert refreshed.status_code == 200
    assert refreshed.json()["state"] == "success"


def test_metadata_cover_is_served_only_from_cache(client: TestClient, tmp_path: Path) -> None:
    game = create_game(client, tmp_path)
    cache_dir = tmp_path / "assets" / "covers"
    cache_dir.mkdir(parents=True)
    cover = cache_dir / f"{game['id']}.jpg"
    cover.write_bytes(b"fake-jpeg")

    updated = client.patch(f"/api/v1/games/{game['id']}", json={"cover_path": str(cover)})
    assert updated.status_code == 200
    cover_response = client.get(f"/api/v1/metadata/games/{game['id']}/cover")
    assert cover_response.status_code == 200
    assert cover_response.headers["content-type"] == "image/jpeg"

    outside = tmp_path / "outside.jpg"
    outside.write_bytes(b"not-cache")
    assert client.patch(f"/api/v1/games/{game['id']}", json={"cover_path": str(outside)}).status_code == 200
    assert client.get(f"/api/v1/metadata/games/{game['id']}/cover").status_code == 404
