from uuid import UUID

from fastapi import APIRouter, Depends, Response
from supabase import Client

from app.core.security import get_current_user_id
from app.core.supabase_client import get_supabase
from app.models.item import ItemCreate, ItemMatch, ItemOut, ItemType, ItemUpdate
from app.services.items import create_item, delete_item, find_matches, get_item, list_items, update_item

router = APIRouter(prefix="/items", tags=["items"])


@router.post("", response_model=ItemOut, status_code=201)
def report_item(
    payload: ItemCreate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
) -> ItemOut:
    return create_item(supabase, user_id, payload)


@router.get("", response_model=list[ItemOut])
def browse_items(
    type: ItemType | None = None,
    supabase: Client = Depends(get_supabase),
) -> list[ItemOut]:
    return list_items(supabase, item_type=type.value if type else None)


@router.get("/{item_id}", response_model=ItemOut)
def read_item(item_id: UUID, supabase: Client = Depends(get_supabase)) -> ItemOut:
    return get_item(supabase, item_id)


@router.patch("/{item_id}", response_model=ItemOut)
def update_report(
    item_id: UUID,
    payload: ItemUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
) -> ItemOut:
    return update_item(supabase, user_id, item_id, payload)


@router.delete("/{item_id}", status_code=204)
def delete_report(
    item_id: UUID,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
) -> Response:
    delete_item(supabase, user_id, item_id)
    return Response(status_code=204)


@router.get("/{item_id}/matches", response_model=list[ItemMatch])
def read_item_matches(item_id: UUID, supabase: Client = Depends(get_supabase)) -> list[ItemMatch]:
    return find_matches(supabase, item_id)
