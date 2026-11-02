from uuid import uuid4

from app.tests.conftest import TEST_USER_ID

OTHER = "00000000-0000-4000-8000-000000000002"


def note(db, user, **changes):
    return db.table("notifications").insert({"user_id":user,"kind":"claim","title":"Claim", "body":"Review the claim", **changes}).execute().data[0]


def test_notifications_scoped_and_empty(authed_client, fake_db):
    assert authed_client.get("/notifications").json() == []
    mine = note(fake_db, TEST_USER_ID)
    note(fake_db, OTHER)
    response = authed_client.get("/notifications?user_id=" + OTHER)
    assert response.status_code == 200
    assert [n["id"] for n in response.json()] == [mine["id"]]


def test_read_is_owned_and_idempotent(authed_client, fake_db):
    mine = note(fake_db, TEST_USER_ID)
    other = note(fake_db, OTHER)
    path = f"/notifications/{mine['id']}/read"
    for _ in range(2):
        response = authed_client.patch(path)
        assert response.status_code == 200
        assert response.json()["is_read"] is True
    assert authed_client.patch(f"/notifications/{other['id']}/read").status_code == 403
    assert authed_client.patch(f"/notifications/{uuid4()}/read").status_code == 404
    assert fake_db.tables["notifications"][1]["is_read"] is False


def test_mark_all_is_user_scoped(authed_client, fake_db):
    note(fake_db, TEST_USER_ID)
    note(fake_db, TEST_USER_ID, is_read=True)
    other = note(fake_db, OTHER)
    assert authed_client.post("/notifications/read-all").status_code == 204
    assert all(n["is_read"] for n in fake_db.tables["notifications"] if n["user_id"] == TEST_USER_ID)
    assert next(n for n in fake_db.tables["notifications"] if n["id"] == other["id"])["is_read"] is False


def test_clients_cannot_create_notifications(authed_client):
    assert authed_client.post("/notifications", json={"user_id": OTHER}).status_code == 405
