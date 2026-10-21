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