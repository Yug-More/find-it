from uuid import UUID

from fastapi import APIRouter, Depends
from supabase import Client

from app.core.security import get_current_user_id
from app.core.supabase_client import get_supabase
from app.models.claim import ClaimCreate, ClaimOut, ClaimStatusUpdate
from app.services.claims import create_claim, list_claims_for_item, update_claim_status

router = APIRouter(tags=["claims"])


@router.post("/items/{item_id}/claims", response_model=ClaimOut, status_code=201)
def submit_claim(
    item_id: UUID,
    payload: ClaimCreate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
) -> ClaimOut:
    return create_claim(supabase, item_id, user_id, payload)


@router.get("/items/{item_id}/claims", response_model=list[ClaimOut])
def read_item_claims(
    item_id: UUID,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
) -> list[ClaimOut]:
    return list_claims_for_item(supabase, item_id, user_id)


@router.patch("/claims/{claim_id}", response_model=ClaimOut)
def change_claim_status(
    claim_id: UUID,
    payload: ClaimStatusUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
) -> ClaimOut:
    return update_claim_status(supabase, claim_id, user_id, payload.status)
