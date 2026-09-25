from fastapi import HTTPException, status
from supabase import Client

from app.models.profile import ProfileOut

TABLE = "profiles"


def get_profile(supabase: Client, user_id: str) -> ProfileOut:
    result = supabase.table(TABLE).select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return ProfileOut(**result.data[0])
