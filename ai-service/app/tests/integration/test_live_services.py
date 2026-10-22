"""End-to-end checks against the real Supabase project and Gemini API.

Run from ``ai-service`` with real credentials in ``.env``:

    RUN_INTEGRATION=1 pytest -m integration -v

These tests write a uniquely titled item, exercise embedding generation through
both create and update, and delete the item afterwards.
"""

import uuid

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.integration


@pytest.fixture
def real_client(integration_user_id):
    """A TestClient that writes to the real database as an existing profile."""
    from app.core.security import get_current_user_id
    from app.main import app

    app.dependency_overrides[get_current_user_id] = lambda: integration_user_id
    client = TestClient(app)
    client.headers["Accept"] = "application/json"

    yield client

    app.dependency_overrides.pop(get_current_user_id, None)


def test_supabase_connection(real_supabase, integration_user_id):
    result = (
        real_supabase.table("profiles")
        .select("id, email, full_name")
        .eq("id", integration_user_id)
        .execute()
    )

    assert result.data, "Expected the integration user's profile to exist"
    assert result.data[0]["id"] == integration_user_id


def test_gemini_embedding(real_settings):
    from app.services.embeddings import get_text_embedding

    embedding = get_text_embedding("A blue notebook left in the library.")

    assert len(embedding) == real_settings.embedding_dimensions
    assert all(isinstance(value, float) for value in embedding)
    assert any(value != 0 for value in embedding)


def test_profile_endpoint(real_client, integration_user_id):
    response = real_client.get("/auth/me")

    assert response.status_code == 200, response.text
    assert response.json()["id"] == integration_user_id


def test_item_lifecycle(real_client, real_supabase, integration_user_id):
    unique_title = f"Integration test item {uuid.uuid4().hex[:8]}"
    payload = {
        "type": "lost",
        "title": unique_title,
        "description": "Temporary item created by the integration test suite.",
        "category": "Other",
        "color": "Blue",
        "location": "Integration test location",
        "event_date": "2026-01-15",
    }
    item_id = None

    try:
        create_response = real_client.post("/items", json=payload)
        assert create_response.status_code == 201, create_response.text
        item = create_response.json()
        item_id = item["id"]
        assert item["title"] == unique_title
        assert item["user_id"] == integration_user_id

        read_response = real_client.get(f"/items/{item_id}")
        assert read_response.status_code == 200, read_response.text
        assert read_response.json()["id"] == item_id

        update_response = real_client.patch(
            f"/items/{item_id}",
            json={**payload, "title": f"{unique_title} updated"},
        )
        assert update_response.status_code == 200, update_response.text
        assert update_response.json()["title"] == f"{unique_title} updated"

        matches_response = real_client.get(f"/items/{item_id}/matches")
        assert matches_response.status_code == 200, matches_response.text
        assert isinstance(matches_response.json(), list)

        delete_response = real_client.delete(f"/items/{item_id}")
        assert delete_response.status_code == 204, delete_response.text
        item_id = None
    finally:
        # Clean up even if an assertion above failed.
        if item_id:
            real_supabase.table("items").delete().eq("id", item_id).execute()


def test_created_item_is_embedded(real_client, real_supabase, integration_user_id):
    """Verify the API persisted a non-null embedding for a created item."""
    unique_title = f"Integration embedding item {uuid.uuid4().hex[:8]}"
    payload = {
        "type": "found",
        "title": unique_title,
        "description": "Temporary item used to verify Gemini embeddings are stored.",
        "category": "Other",
        "event_date": "2026-01-16",
    }
    item_id = None

    try:
        response = real_client.post("/items", json=payload)
        assert response.status_code == 201, response.text
        item_id = response.json()["id"]

        result = (
            real_supabase.table("items")
            .select("embedding, created_at")
            .eq("id", item_id)
            .execute()
        )
        assert result.data
        assert result.data[0]["embedding"] is not None
    finally:
        if item_id:
            real_supabase.table("items").delete().eq("id", item_id).execute()


def test_health(real_client):
    response = real_client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
