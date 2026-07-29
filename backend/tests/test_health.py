from fastapi.testclient import TestClient

from backend.app.main import app


def test_health_check_returns_backend_status() -> None:
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "backend"}


def test_development_cors_allows_vite_localhost_origin() -> None:
    response = TestClient(app).options(
        "/api/v1/games",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
