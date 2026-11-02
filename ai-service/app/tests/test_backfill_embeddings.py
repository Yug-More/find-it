from types import SimpleNamespace

import pytest

import scripts.backfill_embeddings as backfill_module
from scripts.backfill_embeddings import backfill, fetch_missing


class FakeQuery:
    def __init__(self, db: "FakeSupabase", table: str):
        self.db = db
        self.table = table
        self.operation = "select"
        self.filters: list[tuple[str, object]] = []
        self.range_bounds: tuple[int, int] | None = None
        self.payload: dict | None = None

    def select(self, *args, **kwargs):
        return self

    def is_(self, column: str, value: str):
        assert value == "null"
        self.filters.append((column, None))
        return self

    def order(self, column: str):
        return self

    def range(self, start: int, end: int):
        self.range_bounds = (start, end)
        return self

    def update(self, row: dict):
        self.operation = "update"
        self.payload = dict(row)
        return self

    def eq(self, column: str, value):
        self.filters.append((column, value))
        return self

    def execute(self):
        rows = self.db.tables[self.table]
        matched = [
            row
            for row in rows
            if all(row.get(column) == value for column, value in self.filters)
        ]

        if self.operation == "update":
            for row in matched:
                row.update(self.payload or {})
            return SimpleNamespace(data=matched)

        if self.range_bounds:
            start, end = self.range_bounds
            matched = matched[start : end + 1]
        return SimpleNamespace(data=[dict(row) for row in matched])


class FakeSupabase:
    def __init__(self, rows: list[dict]):
        self.tables = {"items": rows}

    def table(self, name: str) -> FakeQuery:
        return FakeQuery(self, name)


def make_row(item_id: str, *, embedding=None, title="Blue notebook", **overrides) -> dict:
    row = {
        "id": item_id,
        "title": title,
        "description": "A blue notebook left in the library.",
        "category": "Other",
        "color": "Blue",
        "brand": None,
        "embedding": embedding,
    }
    row.update(overrides)
    return row


@pytest.fixture(autouse=True)
def small_dimensions(monkeypatch):
    monkeypatch.setattr(
        backfill_module,
        "get_settings",
        lambda: SimpleNamespace(embedding_dimensions=2),
    )


def test_fetch_missing_returns_only_rows_without_embeddings():
    db = FakeSupabase(
        [
            make_row("one"),
            make_row("two"),
            make_row("three", embedding=[0.1, 0.2]),
        ]
    )

    rows = fetch_missing(db)

    assert [row["id"] for row in rows] == ["one", "two"]


def test_fetch_missing_honors_limit():
    db = FakeSupabase([make_row("one"), make_row("two"), make_row("three")])

    rows = fetch_missing(db, limit=2)

    assert len(rows) == 2


def test_backfill_updates_every_missing_embedding():
    db = FakeSupabase([make_row("one"), make_row("two", title="Red umbrella")])
    texts: list[str] = []

    def embed(text: str) -> list[float]:
        texts.append(text)
        return [0.1, 0.2]

    summary = backfill(db, embed=embed)

    assert summary.found == 2
    assert summary.updated == 2
    assert summary.failed == 0
    assert all(row["embedding"] == [0.1, 0.2] for row in db.tables["items"])
    assert texts[0] == "Blue notebook A blue notebook left in the library. Other Blue"
    assert "Red umbrella" in texts[1]


def test_backfill_dry_run_does_not_write():
    db = FakeSupabase([make_row("one")])

    summary = backfill(db, dry_run=True, embed=lambda text: [0.1, 0.2])

    assert summary.would_update == 1
    assert summary.updated == 0
    assert db.tables["items"][0]["embedding"] is None


def test_backfill_continues_after_a_failure():
    db = FakeSupabase([make_row("one"), make_row("two", title="Red umbrella")])

    def embed(text: str) -> list[float]:
        if "Blue notebook" in text:
            raise RuntimeError("Gemini is down")
        return [0.1, 0.2]

    summary = backfill(db, embed=embed)

    assert summary.failed == 1
    assert summary.updated == 1
    assert db.tables["items"][1]["embedding"] == [0.1, 0.2]


def test_backfill_rejects_wrong_dimensions():
    db = FakeSupabase([make_row("one")])

    summary = backfill(db, embed=lambda text: [0.1])

    assert summary.failed == 1
    assert summary.updated == 0
    assert db.tables["items"][0]["embedding"] is None


def test_backfill_skips_rows_without_text():
    db = FakeSupabase(
        [make_row("one", title="", description="", category=None, color=None)]
    )

    summary = backfill(db, embed=lambda text: [0.1, 0.2])

    assert summary.skipped == 1
    assert summary.updated == 0
