from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.claim import ClaimOut, ClaimStatus
from app.models.item import ItemOut, ItemStatus, ItemType
from app.models.profile import ProfileOut

ITEMS_TABLE = "items"
CLAIMS_TABLE = "claims"
PROFILES_TABLE = "profiles"


def list_users(supabase: Client) -> list[ProfileOut]:
    result = (
        supabase.table(PROFILES_TABLE)
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return [ProfileOut(**row) for row in result.data]


def list_all_items(
    supabase: Client,
    item_type: ItemType | None = None,
    item_status: ItemStatus | None = None,
) -> list[ItemOut]:
    query = supabase.table(ITEMS_TABLE).select("*")
    if item_type:
        query = query.eq("type", item_type.value)
    if item_status:
        query = query.eq("status", item_status.value)

    result = query.order("created_at", desc=True).execute()
    return [ItemOut(**row) for row in result.data]


def update_item_status(supabase: Client, item_id: UUID, new_status: ItemStatus) -> ItemOut:
    result = (
        supabase.table(ITEMS_TABLE)
        .update({"status": new_status.value})
        .eq("id", str(item_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return ItemOut(**result.data[0])


def delete_item(supabase: Client, item_id: UUID) -> None:
    existing = supabase.table(ITEMS_TABLE).select("id").eq("id", str(item_id)).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    supabase.table(ITEMS_TABLE).delete().eq("id", str(item_id)).execute()


def list_all_claims(
    supabase: Client,
    claim_status: ClaimStatus | None = None,
) -> list[ClaimOut]:
    query = supabase.table(CLAIMS_TABLE).select("*")
    if claim_status:
        query = query.eq("status", claim_status.value)

    result = query.order("created_at", desc=True).execute()
    return [ClaimOut(**row) for row in result.data]
