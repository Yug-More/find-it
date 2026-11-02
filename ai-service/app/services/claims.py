from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.claim import ClaimCreate, ClaimHistoryOut, ClaimOut, ClaimStatus
from app.services.claim_rpc import call_claim_rpc
from app.services.items import get_item

TABLE = "claims"


def create_claim(supabase: Client, item_id: UUID, claimant_id: str, payload: ClaimCreate) -> ClaimOut:
    rows = call_claim_rpc(supabase, "submit_item_claim", {
        "p_item": str(item_id), "p_actor": claimant_id, "p_message": payload.message,
    })
    return ClaimOut(**rows[0])


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
    rows = call_claim_rpc(supabase, "decide_item_claim", {
        "p_claim": str(claim_id), "p_actor": requester_id, "p_status": new_status.value,
    })
    return ClaimOut(**rows[0])


def list_my_claims(supabase: Client, requester_id: str) -> list[ClaimHistoryOut]:
    result = (supabase.table(TABLE).select("*, item:items(*)")
              .eq("claimant_id", requester_id).order("created_at", desc=True).execute())
    return [ClaimHistoryOut(**row) for row in result.data]
