from uuid import uuid4

import pytest
from postgrest.exceptions import APIError

from app.tests.conftest import TEST_USER_ID

OTHER = "00000000-0000-4000-8000-000000000002"
THIRD = "00000000-0000-4000-8000-000000000003"


def test_claimant_history_scoped_with_related_report(authed_client, fake_db):
    item = fake_db.add_item(OTHER, image_url="https://example.com/photo.jpg", status="resolved")
    mine = fake_db.add_claim(item["id"], TEST_USER_ID, status="approved")
    fake_db.add_claim(item["id"], THIRD)
    response = authed_client.get("/claims/mine?user_id=" + THIRD)
    assert response.status_code == 200
    assert [row["id"] for row in response.json()] == [mine["id"]]
    row = response.json()[0]
    assert row["item"]["image_url"] == item["image_url"]
    assert row["item"]["status"] == "resolved"
    assert row["updated_at"]


def test_claimant_history_empty(authed_client):
    assert authed_client.get("/claims/mine").json() == []


@pytest.mark.parametrize("path,method", [
    ("/claims/mine", "get"), ("/notifications", "get"),
    ("/notifications/read-all", "post"), (f"/notifications/{uuid4()}/read", "patch"),
    (f"/claims/{uuid4()}", "patch"), (f"/items/{uuid4()}/claims", "post"),
])
def test_lifecycle_requires_auth(client, path, method):
    assert getattr(client, method)(path).status_code == 401


def test_submit_notifies_owner_and_rejects_duplicate(authed_client, fake_db):
    item = fake_db.add_item(OTHER)
    path = f"/items/{item['id']}/claims"
    response = authed_client.post(path, json={"message": " My notebook "})
    assert response.status_code == 201
    assert response.json()["claimant_id"] == TEST_USER_ID
    assert response.json()["message"] == "My notebook"
    assert authed_client.post(path, json={"message": "Duplicate"}).status_code == 409
    notes = fake_db.tables["notifications"]
    assert len(notes) == 1
    assert notes[0]["user_id"] == OTHER
    assert notes[0]["claim_id"] == response.json()["id"]


@pytest.mark.parametrize("owner,status,expected", [(TEST_USER_ID,"open",400), (OTHER,"resolved",409)])
def test_ineligible_claim(authed_client, fake_db, owner, status, expected):
    item = fake_db.add_item(owner, status=status)
    assert authed_client.post(f"/items/{item['id']}/claims", json={"message": "My item"}).status_code == expected
    assert not fake_db.tables["claims"]
    assert not fake_db.tables["notifications"]


def test_claim_message_cannot_be_blank(authed_client, fake_db):
    item = fake_db.add_item(OTHER)
    assert authed_client.post(f"/items/{item['id']}/claims", json={"message": "   "}).status_code == 422


@pytest.mark.parametrize("decision", ["approved", "rejected"])
def test_non_owner_cannot_decide(authed_client, fake_db, decision):
    item = fake_db.add_item(OTHER)
    claim = fake_db.add_claim(item["id"], TEST_USER_ID)
    assert authed_client.patch(f"/claims/{claim['id']}", json={"status": decision}).status_code == 403
    assert not fake_db.tables["notifications"]


@pytest.mark.parametrize("old,new", [("pending","pending"),("approved","approved"),("approved","rejected"),("rejected","approved"),("rejected","rejected")])
def test_invalid_transition_conflicts(authed_client, fake_db, old, new):
    item = fake_db.add_item(TEST_USER_ID)
    claim = fake_db.add_claim(item["id"], OTHER, status=old)
    assert authed_client.patch(f"/claims/{claim['id']}", json={"status": new}).status_code == 409


def test_approval_resolves_rejects_competitors_and_notifies(authed_client, fake_db):
    item = fake_db.add_item(TEST_USER_ID)
    first = fake_db.add_claim(item["id"], OTHER)
    second = fake_db.add_claim(item["id"], THIRD)
    response = authed_client.patch(f"/claims/{first['id']}", json={"status":"approved"})
    assert response.status_code == 200
    assert response.json()["status"] == "approved"
    assert fake_db.tables["items"][0]["status"] == "resolved"
    assert {r["id"]: r["status"] for r in fake_db.tables["claims"]} == {first["id"]: "approved", second["id"]: "rejected"}
    assert {n["user_id"] for n in fake_db.tables["notifications"]} == {OTHER, THIRD}
    assert authed_client.get(f"/items/{item['id']}/claims").status_code == 200


def test_missing_claim_and_item(authed_client):
    assert authed_client.patch(f"/claims/{uuid4()}", json={"status":"approved"}).status_code == 404
    assert authed_client.post(f"/items/{uuid4()}/claims", json={"message":"Mine"}).status_code == 404


def test_unknown_database_error_is_sanitized(authed_client, fake_db, monkeypatch):
    def fail(*args):
        raise APIError({"code":"XX000", "message":"private-token sql credentials", "details":None, "hint":None})
    monkeypatch.setattr(fake_db, "rpc", fail)
    response = authed_client.patch(f"/claims/{uuid4()}", json={"status":"approved"})
    assert response.status_code == 503
    assert "private-token" not in response.text
