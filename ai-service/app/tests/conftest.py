import os
import time
from functools import lru_cache

import pytest

# Ensure the .env is loaded - the app's get_settings() uses lru_cache with env_file=".env"
# Make sure the cwd is right or load it manually
_dot_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
if os.path.exists(_dot_env_path):
    from dotenv import load_dotenv
    load_dotenv(_dot_env_path, override=True)

# Keep the suite runnable from a clean checkout without a local .env. All
# external calls are faked in the fixtures below.
os.environ.setdefault("SUPABASE_URL", "https://test-project.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-api-key")


from app.core.config import get_settings
from app.main import app
from fastapi.testclient import TestClient
from jwt.algorithms import RSAAlgorithm


TEST_USER_ID = "00000000-0000-4000-8000-000000000001"
TEST_KID = "test-key-id"


@lru_cache
def get_cached_settings():
    return get_settings()


@pytest.fixture(scope="session")
def rsa_private_key():
    """Generate a throwaway RSA keypair used to sign test tokens."""
    from cryptography.hazmat.primitives.asymmetric import rsa

    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(scope="session")
def jwks(rsa_private_key):
    """A JWKS payload containing the public half of the test keypair."""
    import json

    public_jwk = json.loads(RSAAlgorithm.to_jwk(rsa_private_key.public_key()))
    public_jwk.update({"kid": TEST_KID, "alg": "RS256", "use": "sig"})
    return {"keys": [public_jwk]}


@pytest.fixture
def mock_jwks(monkeypatch, jwks):
    """Serve the test JWKS instead of calling the real Supabase project."""
    monkeypatch.setattr("app.core.security._fetch_jwks", lambda settings: jwks)
    return jwks


@pytest.fixture
def token_factory(rsa_private_key):
    """Build RS256-signed Supabase-style access tokens."""
    import jwt

    def create_token(
        user_id: str = TEST_USER_ID,
        *,
        kid: str = TEST_KID,
        expires_in: int = 3600,
        algorithm: str = "RS256",
        key=None,
        **overrides,
    ) -> str:
        now = int(time.time())
        payload = {
            "sub": user_id,
            "aud": "authenticated",
            "iat": now,
            "exp": now + expires_in,
        }
        payload.update(overrides)
        return jwt.encode(
            payload,
            key if key is not None else rsa_private_key,
            algorithm=algorithm,
            headers={"kid": kid} if kid else None,
        )

    return create_token


@pytest.fixture(autouse=True)
def fake_db(request, monkeypatch):
    """Route all database/embedding calls through deterministic in-memory fakes.

    Integration tests are explicitly marked and must run against real Supabase
    and Gemini services, so they bypass this fixture.
    """
    if request.node.get_closest_marker("integration"):
        yield None
        return

    from app.core.supabase_client import get_supabase
    from app.services import items as items_service
    from app.tests.fake_supabase import FakeSupabase

    fake = FakeSupabase(profile_id=TEST_USER_ID)
    app.dependency_overrides[get_supabase] = lambda: fake
    monkeypatch.setattr(
        items_service,
        "get_text_embedding",
        lambda text: [0.0] * get_settings().embedding_dimensions,
    )

    yield fake

    app.dependency_overrides.pop(get_supabase, None)


@pytest.fixture
def client():
    """Provide a TestClient for the FastAPI app (no auth)."""
    return TestClient(app)


@pytest.fixture
def unauthenticated_client():
    """Provide an unauthenticated TestClient for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def authed_client(mock_jwks, token_factory):
    """Provide an authenticated TestClient signed with the test RS256 key."""
    token = token_factory()
    test_client = TestClient(app)
    test_client.headers["Authorization"] = f"Bearer {token}"
    test_client.headers["Accept"] = "application/json"
    return test_client
