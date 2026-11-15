from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest

from app.services.items import find_matches
from app.tests.conftest import TEST_USER_ID


@pytest.mark.parametrize("changes", [{"status": "resolved", "embedding": [0.1]}, {"embedding": None}])
def test_ineligible_source_never_calls_matching_rpc(fake_db, monkeypatch, changes):
    source = fake_db.add_item(TEST_USER_ID, **changes)
    def unexpected(*args):
        pytest.fail("Ineligible source reached vector matching")
    monkeypatch.setattr(fake_db, "rpc", unexpected)
    assert find_matches(fake_db, UUID(source["id"])) == []


def test_matching_filters_same_owner_same_report_type_and_resolved(fake_db, monkeypatch):
    source = fake_db.add_item(TEST_USER_ID, type="lost", embedding=[0.1])
    other = str(uuid4())
    valid = fake_db.add_item(other, type="found")
    invalid = [source, fake_db.add_item(TEST_USER_ID),
               fake_db.add_item(other, type="lost"), fake_db.add_item(other, status="resolved")]
    rows = [{**row, "similarity": 0.9} for row in [valid, *invalid]]
    monkeypatch.setattr(fake_db, "rpc", lambda *args: SimpleNamespace(execute=lambda: SimpleNamespace(data=rows)))
    assert [str(match.item.id) for match in find_matches(fake_db, UUID(source["id"]))] == [valid["id"]]
