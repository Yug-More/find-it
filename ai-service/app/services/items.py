from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.item import ItemCreate, ItemMatch, ItemOut
from app.services.embeddings import get_text_embedding

TABLE = "items"
MATCH_COUNT = 10
MATCH_THRESHOLD = 0.75


def _embedding_text(item: ItemCreate) -> str:
    parts = [item.title, item.description, item.category or "", item.color or "", item.brand or ""]
    return " ".join(part for part in parts if part)


def create_item(supabase: Client, user_id: str, payload: ItemCreate) -> ItemOut:
    embedding = get_text_embedding(_embedding_text(payload))

    row = {
        "user_id": user_id,
        "type": payload.type.value,
        "title": payload.title,
        "description": payload.description,
        "category": payload.category,
        "color": payload.color,
        "brand": payload.brand,
        "image_url": payload.image_url,
        "location": payload.location,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "event_date": payload.event_date.isoformat() if payload.event_date else None,
        "embedding": embedding,
    }
    result = supabase.table(TABLE).insert(row).execute()
    return ItemOut(**result.data[0])


def list_items(supabase: Client, item_type: str | None = None) -> list[ItemOut]:
    query = supabase.table(TABLE).select("*").eq("status", "open")
    if item_type:
        query = query.eq("type", item_type)
    result = query.order("created_at", desc=True).execute()
    return [ItemOut(**row) for row in result.data]


def get_item(supabase: Client, item_id: UUID) -> ItemOut:
    result = supabase.table(TABLE).select("*").eq("id", str(item_id)).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return ItemOut(**result.data[0])


def find_matches(supabase: Client, item_id: UUID) -> list[ItemMatch]:
    """Find candidate matches for an item, searching the opposite item type."""
    result = supabase.table(TABLE).select("*").eq("id", str(item_id)).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    source = result.data[0]
    opposite_type = "found" if source["type"] == "lost" else "lost"

    matches = supabase.rpc(
        "match_items",
        {
            "query_embedding": source["embedding"],
            "match_item_type": opposite_type,
            "match_count": MATCH_COUNT,
            "match_threshold": MATCH_THRESHOLD,
            "exclude_item_id": str(item_id),
        },
    ).execute()

    return [
        ItemMatch(item=ItemOut(**row), similarity=row["similarity"])
        for row in matches.data
    ]
