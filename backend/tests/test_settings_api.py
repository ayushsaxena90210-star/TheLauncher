from pathlib import Path

from fastapi.testclient import TestClient


def test_settings_persist_scan_roots_and_overview(client: TestClient, tmp_path: Path) -> None:
    initial = client.get("/api/v1/settings")
    assert initial.status_code == 200
    assert initial.json()["settings"]["theme"] == "system"

    updated = client.put("/api/v1/settings", json={"theme": "dark", "scan_options": {"queue_metadata": False}})
    assert updated.status_code == 200
    assert updated.json() == {"theme": "dark", "scan_options": {"queue_metadata": False}}

    root = tmp_path / "Games"
    root.mkdir()
    added = client.post("/api/v1/settings/scan-roots", json={"path": str(root)})
    assert added.status_code == 201
    assert client.post("/api/v1/settings/scan-roots", json={"path": str(root)}).status_code == 409
    assert client.post("/api/v1/settings/scan-roots/rescan").json()["roots"] == [str(root.resolve())]

    overview = client.get("/api/v1/settings").json()
    assert overview["settings"]["theme"] == "dark"
    assert overview["scan_roots"][0]["path"] == str(root.resolve())
    assert overview["library_size"] == 0
    assert overview["metadata"]["provider"] == "IGDB"

    assert client.delete(f"/api/v1/settings/scan-roots/{added.json()['id']}").status_code == 204


def test_cache_actions_stay_within_artwork_cache(client: TestClient, tmp_path: Path) -> None:
    cache_dir = tmp_path / "assets" / "covers"
    cache_dir.mkdir(parents=True)
    cached = cache_dir / "cover.jpg"
    cached.write_bytes(b"cover")
    outside = tmp_path / "game.exe"
    outside.write_bytes(b"game")

    status = client.get("/api/v1/settings/cache")
    assert status.status_code == 200
    assert status.json()["artwork_count"] == 1

    cleared = client.post("/api/v1/settings/cache/clear")
    assert cleared.status_code == 200
    assert cleared.json()["removed_count"] == 1
    assert not cached.exists()
    assert outside.exists()
