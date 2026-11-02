from uuid import UUID

from fastapi import APIRouter, Depends, Response
from supabase import Client

from app.core.admin import require_admin
from app.core.supabase_client import get_supabase
from app.models.admin import AdminItemUpdate
from app.models.claim import ClaimOut, ClaimStatus
from app.models.item import ItemOut, ItemStatus, ItemType
from app.models.profile import ProfileOut
from app.services.admin import (
    delete_item,
    list_all_claims,
    list_all_items,
    list_users,
    update_item_status,
)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


@router.get("/users", response_model=list[ProfileOut])
def read_users(supabase: Client = Depends(get_supabase)) -> list[ProfileOut]:
    return list_users(supabase)


@router.get("/items", response_model=list[ItemOut])
def read_all_items(
    type: ItemType | None = None,
    status: ItemStatus | None = None,
    supabase: Client = Depends(get_supabase),
) -> list[ItemOut]:
    return list_all_items(supabase, item_type=type, item_status=status)


@router.patch("/items/{item_id}", response_model=ItemOut)
def change_item_status(
    item_id: UUID,
    payload: AdminItemUpdate,
    supabase: Client = Depends(get_supabase),
) -> ItemOut:
    return update_item_status(supabase, item_id, payload.status)


@router.delete("/items/{item_id}", status_code=204)
def remove_item(item_id: UUID, supabase: Client = Depends(get_supabase)) -> Response:
    delete_item(supabase, item_id)
    return Response(status_code=204)


@router.get("/claims", response_model=list[ClaimOut])
def read_all_claims(
    status: ClaimStatus | None = None,
    supabase: Client = Depends(get_supabase),
) -> list[ClaimOut]:
    return list_all_claims(supabase, claim_status=status)
