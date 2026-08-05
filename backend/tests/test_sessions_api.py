from datetime import datetime, timezone

from fastapi.testclient import TestClient


def create_game(
    client: TestClient,
    title: str = "TestGame",
    executable_path: str = "C:/Games/Test/test.exe",
) -> dict:
    response = client.post(
        "/api/v1/games",
        json={"title": title, "executable_path": executable_path},
    )
    assert response.status_code == 201
    return response.json()


def test_create_session_for_valid_game(client: TestClient) -> None:
    game = create_game(client)

    response = client.post("/api/v1/sessions", json={"game_id": game["id"]})

    assert response.status_code == 201
    data = response.json()
    assert data["game_id"] == game["id"]
    assert data["started_at"] is not None
    assert data["ended_at"] is None
    assert data["duration_seconds"] is None


def test_create_session_for_nonexistent_game(client: TestClient) -> None:
    response = client.post(
        "/api/v1/sessions",
        json={"game_id": "00000000-0000-0000-0000-000000000000"},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "game_not_found"


def test_complete_session(client: TestClient) -> None:
    game = create_game(client)
    session = client.post("/api/v1/sessions", json={"game_id": game["id"]}).json()
    ended_at = datetime.now(timezone.utc).isoformat()

    response = client.patch(
        f"/api/v1/sessions/{session['id']}",
        json={"ended_at": ended_at, "duration_seconds": 1800},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["ended_at"] is not None
    assert data["duration_seconds"] == 1800


def test_complete_nonexistent_session(client: TestClient) -> None:
    response = client.patch(
        "/api/v1/sessions/00000000-0000-0000-0000-000000000000",
        json={
            "ended_at": datetime.now(timezone.utc).isoformat(),
            "duration_seconds": 0,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "session_not_found"


def test_complete_already_completed_session(client: TestClient) -> None:
    game = create_game(client)
    session = client.post("/api/v1/sessions", json={"game_id": game["id"]}).json()
    ended_at = datetime.now(timezone.utc).isoformat()
    client.patch(
        f"/api/v1/sessions/{session['id']}",
        json={"ended_at": ended_at, "duration_seconds": 100},
    )

    response = client.patch(
        f"/api/v1/sessions/{session['id']}",
        json={"ended_at": ended_at, "duration_seconds": 100},
    )

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "session_already_completed"


def test_recent_sessions_returns_ordered_by_last_played(client: TestClient) -> None:
    game_a = create_game(client, "Game A", "C:/Games/A/a.exe")
    game_b = create_game(client, "Game B", "C:/Games/B/b.exe")
    client.post("/api/v1/sessions", json={"game_id": game_a["id"]})
    client.post("/api/v1/sessions", json={"game_id": game_b["id"]})

    response = client.get("/api/v1/sessions/recent")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["game_title"] == "Game B"
    assert data[1]["game_title"] == "Game A"


def test_recent_sessions_respects_limit(client: TestClient) -> None:
    for i in range(5):
        game = create_game(client, f"Game {i}", f"C:/Games/G{i}/g{i}.exe")
        client.post("/api/v1/sessions", json={"game_id": game["id"]})

    response = client.get("/api/v1/sessions/recent?limit=2")

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_recent_sessions_deduplicates_games(client: TestClient) -> None:
    game = create_game(client)
    client.post("/api/v1/sessions", json={"game_id": game["id"]})
    client.post("/api/v1/sessions", json={"game_id": game["id"]})

    response = client.get("/api/v1/sessions/recent")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_delete_game_cascades_sessions(client: TestClient) -> None:
    game = create_game(client)
    client.post("/api/v1/sessions", json={"game_id": game["id"]})

    client.delete(f"/api/v1/games/{game['id']}")

    response = client.get("/api/v1/sessions/recent")
    assert response.status_code == 200
    assert len(response.json()) == 0


def test_recover_orphaned_sessions(client: TestClient) -> None:
    from backend.app.database import get_session
    from backend.app.main import app
    from backend.app.services import SessionService

    game = create_game(client)
    client.post("/api/v1/sessions", json={"game_id": game["id"]})

    db_session = next(app.dependency_overrides[get_session]())
    try:
        recovered_count = SessionService().recover_orphaned_sessions(db_session)
        assert recovered_count == 1
    finally:
        db_session.close()

    recent = client.get("/api/v1/sessions/recent").json()
    assert len(recent) == 1
    assert recent[0]["total_play_time_seconds"] == 0


def test_game_activity_returns_totals_and_session_history(client: TestClient) -> None:
    game = create_game(client)
    created = client.post("/api/v1/sessions", json={"game_id": game["id"]}).json()
    client.patch(
        f"/api/v1/sessions/{created['id']}",
        json={"ended_at": datetime.now(timezone.utc).isoformat(), "duration_seconds": 120},
    )

    response = client.get(f"/api/v1/sessions/games/{game['id']}/activity")

    assert response.status_code == 200
    assert response.json()["total_play_time_seconds"] == 120
    assert response.json()["launch_count"] == 1
    assert len(response.json()["sessions"]) == 1

