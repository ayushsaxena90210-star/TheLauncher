import time
from pathlib import Path

from fastapi.testclient import TestClient
from backend.app.api.v1.scanner import service as scanner_service


def wait_for_completion(client: TestClient, scan_id: str) -> dict:
    for _ in range(100):
        response = client.get(f"/api/v1/scanner/scans/{scan_id}")
        assert response.status_code == 200
        scan = response.json()
        if scan["state"] != "scanning":
            return scan
        time.sleep(0.01)
    raise AssertionError("Scanner did not finish in time")


def test_scanner_discovers_games_and_excludes_helpers(client: TestClient, tmp_path: Path) -> None:
    root = tmp_path / "Games"
    nested = root / "Nested"
    nested.mkdir(parents=True)
    (root / "alpha.exe").touch()
    (root / "unins000.exe").touch()
    (root / "QuickSFV.exe").touch()
    (nested / "beta.exe").touch()
    (nested / "Launcher.exe").touch()
    (nested / "LanguageSelector.exe").touch()

    started = client.post("/api/v1/scanner/scans", json={"roots": [str(root)]})
    assert started.status_code == 201
    scan = wait_for_completion(client, started.json()["scan_id"])

    assert scan["state"] == "completed"
    assert scan["summary"]["directories_visited"] == 2
    assert scan["summary"]["executables_checked"] == 6
    assert scan["summary"]["games_detected"] == 2
    assert scan["summary"]["excluded_items"] == 4
    assert {candidate["display_name"] for candidate in scan["candidates"]} == {"alpha", "beta"}


def test_scanner_marks_existing_game_and_batch_imports_selected(client: TestClient, tmp_path: Path) -> None:
    root = tmp_path / "Library"
    root.mkdir()
    existing = root / "existing.exe"
    discovered = root / "discovered.exe"
    existing.touch()
    discovered.touch()
    create = client.post("/api/v1/games", json={"title": "Existing", "executable_path": str(existing)})
    assert create.status_code == 201

    started = client.post("/api/v1/scanner/scans", json={"roots": [str(root)]})
    scan = wait_for_completion(client, started.json()["scan_id"])
    existing_candidate = next(candidate for candidate in scan["candidates"] if candidate["display_name"] == "existing")
    discovered_candidate = next(candidate for candidate in scan["candidates"] if candidate["display_name"] == "discovered")
    assert existing_candidate["already_imported"] is True
    assert existing_candidate["reason_skipped"] == "Already in your library."

    imported = client.post(
        f"/api/v1/scanner/scans/{scan['scan_id']}/imports",
        json={"candidate_ids": [existing_candidate["id"], discovered_candidate["id"]]},
    )
    assert imported.status_code == 200
    assert imported.json()["imported_count"] == 1
    assert imported.json()["skipped_count"] == 1
    assert imported.json()["summary"]["successfully_imported_games"] == 1
    assert len(client.get("/api/v1/games").json()) == 2


def test_scanner_rejects_candidate_from_another_scan(client: TestClient, tmp_path: Path) -> None:
    root = tmp_path / "Games"
    root.mkdir()
    (root / "game.exe").touch()
    first = wait_for_completion(client, client.post("/api/v1/scanner/scans", json={"roots": [str(root)]}).json()["scan_id"])
    second = wait_for_completion(client, client.post("/api/v1/scanner/scans", json={"roots": [str(root)]}).json()["scan_id"])

    response = client.post(
        f"/api/v1/scanner/scans/{second['scan_id']}/imports",
        json={"candidate_ids": [first["candidates"][0]["id"]]},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_scan_candidate"


def test_scanner_can_be_cancelled(client: TestClient, tmp_path: Path, monkeypatch) -> None:
    root = tmp_path / "LargeLibrary"
    root.mkdir()
    for index in range(30):
        (root / f"game-{index}.exe").touch()
    original_is_executable = scanner_service._detector.is_executable

    def slow_is_executable(path: Path) -> bool:
        time.sleep(0.01)
        return original_is_executable(path)

    monkeypatch.setattr(scanner_service._detector, "is_executable", slow_is_executable)
    started = client.post("/api/v1/scanner/scans", json={"roots": [str(root)]})
    cancelled = client.post(f"/api/v1/scanner/scans/{started.json()['scan_id']}/cancel")
    assert cancelled.status_code == 200
    scan = wait_for_completion(client, started.json()["scan_id"])
    assert scan["state"] == "cancelled"
