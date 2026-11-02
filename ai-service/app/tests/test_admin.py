import pytest

from app.tests.conftest import TEST_USER_ID


def _promote(fake_db) -> None:
    fake_db.tables["profiles"][0]["role"] = "admin"


class TestAdminAccess:
    def test_admin_routes_require_a_token(self, unauthenticated_client):
        response = unauthenticated_client.get("/admin/users")

        assert response.status_code == 401

    def test_regular_users_are_forbidden(self, authed_client):
        for path in ("/admin/users", "/admin/items", "/admin/claims"):
            response = authed_client.get(path)
            assert response.status_code == 403, path

    def test_missing_profile_is_forbidden(self, authed_client, fake_db):
        fake_db.tables["profiles"].clear()

        response = authed_client.get("/admin/users")

        assert response.status_code == 403

    def test_admin_role_is_returned_by_auth_me(self, authed_client, fake_db):
        _promote(fake_db)

        response = authed_client.get("/auth/me")

        assert response.status_code == 200
        assert response.json()["role"] == "admin"


class TestAdminAPI:
    @pytest.fixture
    def admin_client(self, authed_client, fake_db):
        _promote(fake_db)
        return authed_client

    def test_lists_users_and_roles(self, admin_client, fake_db):
        fake_db.table("profiles").insert(
            {
                "id": "00000000-0000-4000-8000-000000000002",
                "email": "second@example.com",
                "full_name": "Second User",
            }
        ).execute()

        response = admin_client.get("/admin/users")

        assert response.status_code == 200
        users = response.json()
        assert len(users) == 2
        assert {user["role"] for user in users} == {"user", "admin"}

    def test_lists_open_and_resolved_items(self, admin_client, fake_db):
        fake_db.add_item(TEST_USER_ID, title="Open item")
        fake_db.add_item(TEST_USER_ID, title="Resolved item", status="resolved")

        response = admin_client.get("/admin/items")

        assert response.status_code == 200
        assert {item["title"] for item in response.json()} == {"Open item", "Resolved item"}

    def test_filters_items_by_status(self, admin_client, fake_db):
        fake_db.add_item(TEST_USER_ID, title="Open item")
        fake_db.add_item(TEST_USER_ID, title="Resolved item", status="resolved")

        response = admin_client.get("/admin/items?status=resolved")

        assert response.status_code == 200
        assert [item["title"] for item in response.json()] == ["Resolved item"]

    def test_changes_item_status(self, admin_client, fake_db):
        item = fake_db.add_item(TEST_USER_ID, title="Open item")

        response = admin_client.patch(f"/admin/items/{item['id']}", json={"status": "resolved"})

        assert response.status_code == 200
        assert response.json()["status"] == "resolved"

    def test_deletes_item(self, admin_client, fake_db):
        item = fake_db.add_item(TEST_USER_ID, title="Delete me")

        response = admin_client.delete(f"/admin/items/{item['id']}")

        assert response.status_code == 204
        assert fake_db.table("items").select("*").execute().data == []

    def test_unknown_item_returns_404(self, admin_client):
        missing = "00000000-0000-4000-8000-999999999999"

        assert admin_client.patch(
            f"/admin/items/{missing}", json={"status": "resolved"}
        ).status_code == 404
        assert admin_client.delete(f"/admin/items/{missing}").status_code == 404

    def test_lists_claims_and_filters_by_status(self, admin_client, fake_db):
        item = fake_db.add_item(TEST_USER_ID)
        fake_db.add_claim(item["id"], "00000000-0000-4000-8000-000000000002", status="pending")
        fake_db.add_claim(item["id"], "00000000-0000-4000-8000-000000000003", status="approved")

        all_response = admin_client.get("/admin/claims")
        approved_response = admin_client.get("/admin/claims?status=approved")

        assert all_response.status_code == 200
        assert len(all_response.json()) == 2
        assert approved_response.status_code == 200
        assert [claim["status"] for claim in approved_response.json()] == ["approved"]
