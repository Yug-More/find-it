"""Tests for Supabase JWT verification (RS256/JWKS and legacy HS256)."""

from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core import security
from app.tests.conftest import TEST_USER_ID


def _credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


@pytest.fixture
def settings(monkeypatch):
    """Use deterministic settings without a legacy JWT secret by default."""
    test_settings = SimpleNamespace(
        supabase_url="https://test-project.supabase.co",
        supabase_service_role_key="test-service-role-key",
        supabase_jwt_secret=None,
    )
    monkeypatch.setattr(security, "get_settings", lambda: test_settings)
    return test_settings


@pytest.fixture
def jwks_response(monkeypatch, jwks):
    """Mock the JWKS fetch so tests never hit the network."""
    monkeypatch.setattr(security, "_fetch_jwks", lambda settings: jwks)
    return jwks


def test_valid_kid_returns_user_id(settings, jwks_response, token_factory):
    token = token_factory(user_id=TEST_USER_ID)

    assert security.get_current_user_id(_credentials(token)) == TEST_USER_ID


def test_unknown_kid_is_rejected(settings, jwks_response, token_factory):
    token = token_factory(kid="unknown-key-id")

    with pytest.raises(HTTPException) as exc:
        security.get_current_user_id(_credentials(token))

    assert exc.value.status_code == 401


def test_tampered_signature_is_rejected(settings, jwks_response, token_factory):
    token = token_factory()
    header, payload, signature = token.split(".")
    replacement = "A" if signature[5] != "A" else "B"
    tampered_signature = f"{signature[:5]}{replacement}{signature[6:]}"
    tampered_token = f"{header}.{payload}.{tampered_signature}"

    with pytest.raises(HTTPException) as exc:
        security.get_current_user_id(_credentials(tampered_token))

    assert exc.value.status_code == 401


def test_expired_token_is_rejected(settings, jwks_response, token_factory):
    token = token_factory(expires_in=-60)

    with pytest.raises(HTTPException) as exc:
        security.get_current_user_id(_credentials(token))

    assert exc.value.status_code == 401


def test_missing_bearer_token_is_rejected(settings):
    with pytest.raises(HTTPException) as exc:
        security.get_current_user_id(None)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Missing bearer token"


def test_legacy_hs256_token_still_works(settings, monkeypatch, token_factory):
    settings.supabase_jwt_secret = "legacy-test-secret"
    token = token_factory(
        user_id=TEST_USER_ID,
        kid=None,
        algorithm="HS256",
        key="legacy-test-secret",
    )

    assert security.get_current_user_id(_credentials(token)) == TEST_USER_ID


def test_jwks_are_fetched_with_service_role_header(settings, monkeypatch):
    calls = []

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"keys": []}

    def fake_get(url, headers=None):
        calls.append((url, headers))
        return FakeResponse()

    monkeypatch.setattr(security.requests, "get", fake_get)

    assert security._fetch_jwks(settings) == {"keys": []}
    assert calls == [
        (
            f"{settings.supabase_url}{security.JWKS_PATH}",
            {"apikey": settings.supabase_service_role_key},
        )
    ]
