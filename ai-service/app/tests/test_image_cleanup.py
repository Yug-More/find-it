from unittest.mock import MagicMock

import pytest

from app.core.config import get_settings
from app.services.image_cleanup import owned_image_path
from app.tests.conftest import TEST_USER_ID
from app.tests.fixtures import sample_item_create

BASE = get_settings().supabase_url.rstrip("/")
PREFIX = BASE + "/storage/v1/object/public/report-images/"
OTHER = "00000000-0000-4000-8000-000000000002"


@pytest.mark.parametrize("url", [
    None, "", "file://photo.jpg",
    " " + PREFIX + TEST_USER_ID + "/photo.jpg",
    PREFIX + TEST_USER_ID + "/pho\nto.jpg",
    PREFIX + TEST_USER_ID + "/photo.jpg?", "https://other.example/photo.jpg",
    PREFIX + OTHER + "/photo.jpg", PREFIX + TEST_USER_ID + "/../photo.jpg",
    PREFIX + TEST_USER_ID + "/%2e%2e.jpg", PREFIX + TEST_USER_ID + "/sub/photo.jpg",
    PREFIX + TEST_USER_ID + "/photo.jpg?token=secret", PREFIX + TEST_USER_ID + "/photo.jpg#fragment",
    PREFIX + TEST_USER_ID + "/.hidden", PREFIX + TEST_USER_ID + "/photo..jpg",
    PREFIX.replace("report-images", "other-bucket") + TEST_USER_ID + "/photo.jpg",
    PREFIX.replace("https://", "http://") + TEST_USER_ID + "/photo.jpg",
    "https://test-project.supabase.co.evil.test/storage/v1/object/public/report-images/" + TEST_USER_ID + "/photo.jpg",
    "https://user@test-project.supabase.co/storage/v1/object/public/report-images/" + TEST_USER_ID + "/photo.jpg",
])
def test_cleanup_rejects_untrusted_paths(url):
    assert owned_image_path(url, TEST_USER_ID, BASE) is None


def test_accepts_only_owner_folder_in_expected_bucket():
    assert owned_image_path(PREFIX + TEST_USER_ID + "/123-abc.jpg", TEST_USER_ID, BASE) == TEST_USER_ID + "/123-abc.jpg"


@pytest.fixture
def storage(fake_db):
    fake_db.storage = MagicMock()
    return fake_db.storage.from_.return_value


@pytest.mark.parametrize("new_image", [None, PREFIX + TEST_USER_ID + "/new.jpg"])
def test_replace_or_remove_only_cleans_old_after_save(authed_client, fake_db, storage, new_image):
    old = PREFIX + TEST_USER_ID + "/old.jpg"
    item = fake_db.add_item(TEST_USER_ID, image_url=old)
    def verify_saved(paths):
        assert fake_db.tables["items"][0]["image_url"] == new_image
        assert paths == [TEST_USER_ID + "/old.jpg"]
    storage.remove.side_effect = verify_saved
    response = authed_client.patch(f"/items/{item['id']}", json={**sample_item_create(), "image_url":new_image})
    assert response.status_code == 200
    storage.remove.assert_called_once()
    fake_db.storage.from_.assert_called_once_with("report-images")


def test_delete_cleans_only_after_report_deleted(authed_client, fake_db, storage):
    item = fake_db.add_item(TEST_USER_ID, image_url=PREFIX + TEST_USER_ID + "/old.jpg")
    def verify_deleted(paths):
        assert not fake_db.tables["items"]
    storage.remove.side_effect = verify_deleted
    assert authed_client.delete(f"/items/{item['id']}").status_code == 204
    storage.remove.assert_called_once_with([TEST_USER_ID + "/old.jpg"])


@pytest.mark.parametrize("old", [None, "https://external.example/photo.jpg", PREFIX + OTHER + "/photo.jpg"])
def test_delete_without_owned_image_skips_cleanup(authed_client, fake_db, storage, old):
    item = fake_db.add_item(TEST_USER_ID, image_url=old)
    assert authed_client.delete(f"/items/{item['id']}").status_code == 204
    storage.remove.assert_not_called()


def test_unauthorized_change_never_deletes_storage(authed_client, fake_db, storage):
    item = fake_db.add_item(OTHER, image_url=PREFIX + OTHER + "/photo.jpg")
    assert authed_client.delete(f"/items/{item['id']}").status_code == 403
    assert authed_client.patch(f"/items/{item['id']}", json=sample_item_create()).status_code == 403
    storage.remove.assert_not_called()


def test_shared_image_is_preserved(authed_client, fake_db, storage):
    url = PREFIX + TEST_USER_ID + "/shared.jpg"
    item = fake_db.add_item(TEST_USER_ID, image_url=url)
    fake_db.add_item(OTHER, image_url=url)
    assert authed_client.delete(f"/items/{item['id']}").status_code == 204
    storage.remove.assert_not_called()


def test_cleanup_failure_preserves_success_without_secrets(authed_client, fake_db, storage, caplog):
    item = fake_db.add_item(TEST_USER_ID, image_url=PREFIX + TEST_USER_ID + "/old.jpg")
    storage.remove.side_effect = RuntimeError("secret-token private-url")
    response = authed_client.patch(f"/items/{item['id']}", json={**sample_item_create(), "image_url": None})
    assert response.status_code == 200
    assert response.json()["image_url"] is None
    assert "cleanup failed" in caplog.text
    assert "secret-token" not in caplog.text


def test_failed_save_does_not_clean_old_image(authed_client, fake_db, storage, monkeypatch):
    item = fake_db.add_item(TEST_USER_ID, image_url=PREFIX + TEST_USER_ID + "/old.jpg")
    def fail(text):
        from fastapi import HTTPException
        raise HTTPException(503, "Embedding unavailable")
    monkeypatch.setattr("app.services.items.get_text_embedding", fail)
    assert authed_client.patch(f"/items/{item['id']}", json=sample_item_create()).status_code == 503
    storage.remove.assert_not_called()
    assert fake_db.tables["items"][0]["image_url"].endswith("old.jpg")


def test_unchanged_image_is_not_cleaned(authed_client, fake_db, storage):
    url = PREFIX + TEST_USER_ID + "/old.jpg"
    item = fake_db.add_item(TEST_USER_ID, image_url=url)
    assert authed_client.patch(f"/items/{item['id']}", json={**sample_item_create(), "image_url":url}).status_code == 200
    storage.remove.assert_not_called()
