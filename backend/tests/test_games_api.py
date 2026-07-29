from fastapi.testclient import TestClient


def create_game(client: TestClient, executable_path: str = "C:/Games/Alpha/alpha.exe") -> dict:
    response = client.post(
        "/api/v1/games",
        json={
            "title": "Alpha",
            "executable_path": executable_path,
            "install_path": "C:/Games/Alpha",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_games_crud_lifecycle(client: TestClient) -> None:
    created = create_game(client)
    game_id = created["id"]

    listed = client.get("/api/v1/games")
    assert listed.status_code == 200
    assert [game["id"] for game in listed.json()] == [game_id]

    fetched = client.get(f"/api/v1/games/{game_id}")
    assert fetched.status_code == 200
    assert fetched.json()["title"] == "Alpha"

    updated = client.patch(f"/api/v1/games/{game_id}", json={"title": "Alpha Remastered"})
    assert updated.status_code == 200
    assert updated.json()["title"] == "Alpha Remastered"

    deleted = client.delete(f"/api/v1/games/{game_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/games/{game_id}").json()["detail"]["code"] == "game_not_found"


def test_games_reject_duplicate_executable_paths(client: TestClient) -> None:
    create_game(client)

    duplicate = client.post(
        "/api/v1/games",
        json={"title": "Copy", "executable_path": "C:/Games/Alpha/alpha.exe"},
    )

    assert duplicate.status_code == 409
    assert duplicate.json()["detail"]["code"] == "duplicate_executable_path"


def test_games_validate_absolute_paths(client: TestClient) -> None:
    response = client.post(
        "/api/v1/games",
        json={"title": "Relative", "executable_path": "relative/game.exe"},
    )

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "validation_error"
