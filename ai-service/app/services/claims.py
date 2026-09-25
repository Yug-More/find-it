from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.claim import ClaimCreate, ClaimOut, ClaimStatus
from app.services.items import get_item

TABLE = "claims"


def create_claim(supabase: Client, item_id: UUID, claimant_id: str, payload: ClaimCreate) -> ClaimOut:
    item = get_item(supabase, item_id)
    if str(item.user_id) == claimant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot claim your own item",
        )

    row = {
        "item_id": str(item_id),
        "claimant_id": claimant_id,
        "message": payload.message,
        "status": ClaimStatus.pending.value,
    }
    result = supabase.table(TABLE).insert(row).execute()
    return ClaimOut(**result.data[0])


def list_claims_for_item(supabase: Client, item_id: UUID, requester_id: str) -> list[ClaimOut]:
    item = get_item(supabase, item_id)
    if str(item.user_id) != requester_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the item owner can view its claims",
        )

    result = (
        supabase.table(TABLE)
        .select("*")
        .eq("item_id", str(item_id))
        .order("created_at", desc=True)
        .execute()
    )
    return [ClaimOut(**row) for row in result.data]


def update_claim_status(
    supabase: Client, claim_id: UUID, requester_id: str, new_status: ClaimStatus
) -> ClaimOut:
    claim_result = supabase.table(TABLE).select("*").eq("id", str(claim_id)).execute()
    if not claim_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")

    claim = claim_result.data[0]
    item = get_item(supabase, UUID(claim["item_id"]))
    if str(item.user_id) != requester_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the item owner can update this claim",
        )

    result = (
        supabase.table(TABLE)
        .update({"status": new_status.value})
        .eq("id", str(claim_id))
        .execute()
    )

    if new_status == ClaimStatus.approved:
        supabase.table("items").update({"status": "resolved"}).eq("id", claim["item_id"]).execute()

    return ClaimOut(**result.data[0])
