import os
import pytest
from functools import lru_cache

# Ensure the .env is loaded - the app's get_settings() uses lru_cache with env_file=".env"
# Make sure the cwd is right or load it manually
_dot_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), '.env')
if os.path.exists(_dot_env_path):
    from dotenv import load_dotenv
    load_dotenv(_dot_env_path, override=True)


from app.core.config import get_settings
from fastapi.testclient import TestClient


@lru_cache
def get_cached_settings():
    return get_settings()


@pytest.fixture
def client():
    """Provide a TestClient for the FastAPI app (no auth)."""
    return TestClient(app)


@pytest.fixture
def authed_client():
    """Provide an authenticated TestClient for the FastAPI app."""
    settings = get_cached_settings()
    import jwt
    import time
    secret = settings.supabase_jwt_secret
    user_id = "test-user-auth"
    payload = {
        "sub": user_id,
        "aud": "authenticated",
        "iat": time.time(),
        "exp": time.time() + 3600,
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    test_client = TestClient(app)
    test_client.headers["Authorization"] = f"Bearer {token}"
    test_client.headers["Accept"] = "application/json"
    return test_client