import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def authed_client():
    """Provide an authenticated TestClient for the FastAPI app."""
    import jwt
    from app.core.config import get_settings
    from app.main import app
    settings = get_settings()
    secret = settings.supabase_jwt_secret
    user_id = "test-user-auth"
    payload = {
        "sub": user_id,
        "aud": "authenticated",
        "iat": int(__import__('time').time()),
        "exp": int(__import__('time').time()) + 3600,
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    test_client = TestClient(app)
    test_client.headers["Authorization"] = f"Bearer {token}"
    test_client.headers["Accept"] = "application/json"
    return test_client


@pytest.fixture
def unauthenticated_client():
    """Provide an unauthenticated TestClient for the FastAPI app."""
    from app.main import app
    return TestClient(app)


class TestAuthAPI:
    """Tests for the /auth API endpoints."""

    def test_get_me_with_valid_token(self, authed_client):
        """GET /auth/me with valid Supabase token should return profile."""
        response = authed_client.get("/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "full_name" in data

    def test_get_me_without_token(self, unauthenticated_client):
        """GET /auth/me without authorization should fail."""
        response = unauthenticated_client.get("/auth/me")
        assert response.status_code == 401

    def test_auth_endpoints_exist(self, authed_client):
        """All auth routes should be registered."""
        # Check /auth/me exists and works with token
        response = authed_client.get("/auth/me")
        assert response.status_code == 200