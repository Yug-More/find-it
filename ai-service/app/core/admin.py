from fastapi import Depends, HTTPException, status
from supabase import Client

from app.core.security import get_current_user_id
from app.core.supabase_client import get_supabase
from app.models.profile import UserRole


def require_admin(
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
) -> str:
    """Return the signed-in user id only when their profile role is admin.

    The role lives in the database, not in the JWT, so a stale or tampered client
    claim cannot grant access. The service role bypasses RLS for this lookup.
    """
    result = supabase.table("profiles").select("role").eq("id", user_id).execute()
    if not result.data or result.data[0].get("role") != UserRole.admin.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required for this request.",
        )
    return user_id
