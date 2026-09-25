from fastapi import APIRouter, Depends
from supabase import Client

from app.core.security import get_current_user_id
from app.core.supabase_client import get_supabase
from app.models.profile import ProfileOut
from app.services.profiles import get_profile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=ProfileOut)
def read_current_profile(
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
) -> ProfileOut:
    return get_profile(supabase, user_id)
