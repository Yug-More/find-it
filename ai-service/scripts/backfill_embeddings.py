"""Backfill embeddings for items that do not have one yet.

Items created through the API get an embedding, but seeded rows and older
reports can have a NULL embedding, which makes them invisible to match search.
This script embeds their title, description, category, color, and brand.

Run it from the ``ai-service`` directory so ``.env`` is loaded:

    python scripts/backfill_embeddings.py --dry-run
    python scripts/backfill_embeddings.py --limit 100
    python -m scripts.backfill_embeddings

The script is idempotent: it only looks at rows whose embedding is still NULL.
"""

from __future__ import annotations

import argparse
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, TextIO

# Support `python scripts/backfill_embeddings.py` as well as `python -m ...`.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from supabase import Client

from app.core.config import get_settings
from app.core.supabase_client import get_supabase
from app.services.embeddings import embedding_text, get_text_embedding

SELECT_COLUMNS = "id, title, description, category, color, brand"
PAGE_SIZE = 100

Embedder = Callable[[str], list[float]]


@dataclass
class BackfillSummary:
    """Counts from one backfill run."""

    found: int = 0
    updated: int = 0
    would_update: int = 0
    skipped: int = 0
    failed: int = 0


def fetch_missing(supabase: Client, limit: int | None = None) -> list[dict]:
    """Return items with a NULL embedding, oldest first."""
    rows: list[dict] = []
    offset = 0

    while limit is None or len(rows) < limit:
        size = PAGE_SIZE if limit is None else min(PAGE_SIZE, limit - len(rows))
        result = (
            supabase.table("items")
            .select(SELECT_COLUMNS)
            .is_("embedding", "null")
            .order("created_at")
            .range(offset, offset + size - 1)
            .execute()
        )
        batch = result.data or []
        rows.extend(batch)
        if len(batch) < size:
            break
        offset += len(batch)

    return rows


def backfill(
    supabase: Client,
    *,
    dry_run: bool = False,
    limit: int | None = None,
    delay: float = 0.0,
    embed: Embedder | None = None,
    sleep: Callable[[float], None] = time.sleep,
    out: TextIO | None = None,
) -> BackfillSummary:
    """Embed every item that is missing a vector.

    Embedding failures and skipped rows are reported but do not stop the run,
    so one bad row cannot block the whole backfill.
    """
    stdout = out or sys.stdout
    embedder = embed or get_text_embedding
    expected_dimensions = get_settings().embedding_dimensions

    rows = fetch_missing(supabase, limit)
    summary = BackfillSummary(found=len(rows))

    if not rows:
        print("No items need embeddings.", file=stdout)
        return summary

    for index, row in enumerate(rows, start=1):
        label = f"[{index}/{len(rows)}] {row['id']}"
        text = embedding_text(
            row["title"],
            row["description"],
            row.get("category"),
            row.get("color"),
            row.get("brand"),
        )

        if not text.strip():
            summary.skipped += 1
            print(f"{label} skipped: nothing to embed", file=stdout)
            continue

        try:
            vector = embedder(text)
        except Exception as exc:
            summary.failed += 1
            print(f"{label} failed: {exc}", file=sys.stderr)
            continue

        if len(vector) != expected_dimensions:
            summary.failed += 1
            print(
                f"{label} failed: expected {expected_dimensions} dimensions, "
                f"got {len(vector)}",
                file=sys.stderr,
            )
            continue

        if dry_run:
            summary.would_update += 1
            print(f"{label} would embed: {row['title']}", file=stdout)
        else:
            supabase.table("items").update({"embedding": vector}).eq(
                "id", row["id"]
            ).execute()
            summary.updated += 1
            print(f"{label} embedded: {row['title']}", file=stdout)

        if delay and index < len(rows):
            sleep(delay)

    return summary


def _positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("must be at least 1")
    return parsed


def _non_negative_float(value: str) -> float:
    parsed = float(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("must be zero or greater")
    return parsed


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate embeddings for items whose embedding is NULL."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="report what would be embedded without writing to the database",
    )
    parser.add_argument(
        "--limit",
        type=_positive_int,
        help="maximum number of items to process",
    )
    parser.add_argument(
        "--delay",
        type=_non_negative_float,
        default=0.0,
        help="seconds to sleep between Gemini calls (default: 0)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    summary = backfill(
        get_supabase(),
        dry_run=args.dry_run,
        limit=args.limit,
        delay=args.delay,
    )

    if summary.found == 0:
        return 0

    print(
        f"{summary.updated} updated, {summary.would_update} would update, "
        f"{summary.skipped} skipped, {summary.failed} failed."
    )
    return 1 if summary.failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
