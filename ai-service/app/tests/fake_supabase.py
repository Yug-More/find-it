"""A tiny in-memory stand-in for the Supabase client used by the test suite.

The endpoint tests previously talked to a real Supabase project. That made them
depend on live credentials, network access, and pre-existing rows. This fake
implements only the query surface the app uses, so the tests are deterministic.
"""

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from postgrest.exceptions import APIError


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
        self.selection = args[0] if args else "*"
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
                row.setdefault("updated_at", row["created_at"])
            if self.table == "notifications":
                row.setdefault("is_read", False)
                row.setdefault("item_id", None)
                row.setdefault("claim_id", None)
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
        data = [dict(row) for row in matches]
        if "item:items" in getattr(self, "selection", ""):
            for row in data:
                row["item"] = next((dict(item) for item in self.db.tables["items"] if item["id"] == row["item_id"]), None)
        return SimpleNamespace(data=data)


class FakeSupabase:
    def __init__(self, profile_id: str | None = None):
        self.tables: dict[str, list[dict]] = {
            "profiles": [],
            "items": [],
            "claims": [],
            "notifications": [],
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
    """HTTP contract fake; transaction/privilege behavior is tested in database/tests."""

    def __init__(self, db: FakeSupabase, name: str, params: dict):
        self.db = db
        self.name = name
        self.params = params

    @staticmethod
    def fail(code: str, message: str):
        raise APIError({"code": code, "message": message, "details": None, "hint": None})

    def notify(self, user_id: str, item: dict, claim: dict, kind: str, title: str):
        self.db.table("notifications").insert({
            "user_id": user_id, "kind": kind, "title": title,
            "body": f"Claim update for {item['title']}",
            "item_id": item["id"], "claim_id": claim["id"],
        }).execute()

    def execute(self):
        if self.name == "match_items":
            return SimpleNamespace(data=[])
        if self.name == "submit_item_claim":
            return self.submit()
        if self.name == "decide_item_claim":
            return self.decide()
        raise AssertionError(f"Unimplemented RPC: {self.name}")

    def submit(self):
        p = self.params
        item = next((r for r in self.db.tables["items"] if r["id"] == p["p_item"]), None)
        if not item:
            self.fail("PT404", "Item not found")
        if item["user_id"] == p["p_actor"]:
            self.fail("PT400", "Self claim")
        if item["status"] != "open":
            self.fail("PT409", "Resolved")
        if any(
            r["item_id"] == item["id"] and r["claimant_id"] == p["p_actor"]
            and r["status"] in ("pending", "approved") for r in self.db.tables["claims"]
        ):
            self.fail("PT409", "Duplicate")
        claim = self.db.add_claim(item["id"], p["p_actor"], message=p["p_message"].strip())
        self.notify(item["user_id"], item, claim, "claim", "New ownership claim")
        return SimpleNamespace(data=[claim])

    def decide(self):
        p = self.params
        claim = next((r for r in self.db.tables["claims"] if r["id"] == p["p_claim"]), None)
        if not claim:
            self.fail("PT404", "Claim not found")
        item = next(r for r in self.db.tables["items"] if r["id"] == claim["item_id"])
        if item["user_id"] != p["p_actor"]:
            self.fail("PT403", "Non owner")
        if claim["status"] != "pending" or p["p_status"] not in ("approved", "rejected"):
            self.fail("PT409", "Transition")
        if p["p_status"] == "approved" and item["status"] != "open":
            self.fail("PT409", "Resolved")
        claim.update(status=p["p_status"], updated_at=_now())
        changed = [claim]
        if p["p_status"] == "approved":
            item["status"] = "resolved"
            for other in self.db.tables["claims"]:
                if other["item_id"] == item["id"] and other["status"] == "pending":
                    other.update(status="rejected", updated_at=_now())
                    changed.append(other)
        for row in changed:
            self.notify(row["claimant_id"], item, row, "claim_update", "Claim " + row["status"])
        return SimpleNamespace(data=[dict(claim)])
