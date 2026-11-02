from uuid import UUID

from fastapi import APIRouter, Depends, Response
from supabase import Client

from app.core.security import get_current_user_id
from app.core.supabase_client import get_supabase
from app.models.notification import NotificationOut
from app.services.notifications import list_notifications, mark_all_notifications_read, mark_notification_read

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def read_notifications(
    user_id: str = Depends(get_current_user_id), supabase: Client = Depends(get_supabase),
) -> list[NotificationOut]:
    return list_notifications(supabase, user_id)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def read_notification(
    notification_id: UUID,
    user_id: str = Depends(get_current_user_id), supabase: Client = Depends(get_supabase),
) -> NotificationOut:
    return mark_notification_read(supabase, notification_id, user_id)


@router.post("/read-all", status_code=204)
def read_all_notifications(
    user_id: str = Depends(get_current_user_id), supabase: Client = Depends(get_supabase),
) -> Response:
    mark_all_notifications_read(supabase, user_id)
    return Response(status_code=204)
