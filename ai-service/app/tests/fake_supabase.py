"""A tiny in-memory stand-in for the Supabase client used by the test suite.

The endpoint tests previously talked to a real Supabase project. That made them
depend on live credentials, network access, and pre-existing rows. This fake
implements only the query surface the app uses, so the tests are deterministic.
"""

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4


def _now() -> datetime:
    return datetime.now(timezone.utc)


class FakeQuery:
    def __init__(self, db: "FakeSupabase", table: str):
        self.db = db
        self.table = table
        self.operation = "select"
        self.filters: list[tuple[str, object]] = []
        self.payload: dict | None = None
        self.order_by: tuple[str, bool] | None = None

    def select(self, *args, **kwargs):
        self.operation = "select"
        return self

    def insert(self, row: dict):
        self.operation = "insert"
        self.payload = dict(row)
        return self

    def update(self, row: dict):
        self.operation = "update"
        self.payload = dict(row)
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def eq(self, column: str, value):
        self.filters.append((column, value))
        return self

    def order(self, column: str, desc: bool = False):
        self.order_by = (column, desc)
        return self

    def execute(self):
        rows = self.db.tables[self.table]

        if self.operation == "insert":
            row = dict(self.payload or {})
            row.setdefault("id", str(uuid4()))
            row.setdefault("created_at", _now())
            if self.table == "items":
                row.setdefault("status", "open")
            if self.table == "claims":
                row.setdefault("status", "pending")
            rows.append(row)
            return SimpleNamespace(data=[dict(row)])

        matches = [
            row
            for row in rows
            if all(row.get(column) == value for column, value in self.filters)
        ]

        if self.operation == "update":
            for row in matches:
                row.update(self.payload or {})
            return SimpleNamespace(data=[dict(row) for row in matches])

        if self.operation == "delete":
            self.db.tables[self.table] = [row for row in rows if row not in matches]
            return SimpleNamespace(data=[])

        if self.order_by:
            column, desc = self.order_by
            matches = sorted(matches, key=lambda row: row.get(column), reverse=desc)
        return SimpleNamespace(data=[dict(row) for row in matches])


class FakeSupabase:
    def __init__(self, profile_id: str | None = None):
        self.tables: dict[str, list[dict]] = {
            "profiles": [],
            "items": [],
            "claims": [],
        }
        if profile_id:
            self.tables["profiles"].append(
                {
                    "id": profile_id,
                    "email": "test-user@example.com",
                    "full_name": "Test User",
                    "created_at": _now(),
                }
            )

    def table(self, name: str) -> FakeQuery:
        return FakeQuery(self, name)

    def rpc(self, name: str, params: dict) -> "FakeRpc":
        return FakeRpc(self, name, params)

    def add_item(self, user_id: str, **overrides) -> dict:
        row = {
            "user_id": user_id,
            "type": "found",
            "title": "Sample item",
            "description": "Sample description",
            "category": "Other",
            "color": None,
            "brand": None,
            "image_url": None,
            "location": None,
            "latitude": None,
            "longitude": None,
            "event_date": None,
            "status": "open",
        }
        row.update(overrides)
        return self.table("items").insert(row).execute().data[0]

    def add_claim(self, item_id: str, claimant_id: str, **overrides) -> dict:
        row = {
            "item_id": item_id,
            "claimant_id": claimant_id,
            "message": "Sample claim",
            "status": "pending",
        }
        row.update(overrides)
        return self.table("claims").insert(row).execute().data[0]


class FakeRpc:
    def __init__(self, db: FakeSupabase, name: str, params: dict):
        self.db = db
        self.name = name
        self.params = params

    def execute(self):
        # No seeded matches in the fake database.
        return SimpleNamespace(data=[])
