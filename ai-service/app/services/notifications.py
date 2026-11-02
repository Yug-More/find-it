from uuid import UUID

from fastapi import HTTPException
from supabase import Client

from app.models.notification import NotificationOut


def list_notifications(supabase: Client, user_id: str) -> list[NotificationOut]:
    result = (supabase.table("notifications").select("*").eq("user_id", user_id)
              .order("created_at", desc=True).execute())
    return [NotificationOut(**row) for row in result.data]


def mark_notification_read(supabase: Client, notification_id: UUID, user_id: str) -> NotificationOut:
    result = supabase.table("notifications").select("*").eq("id", str(notification_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    if result.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="This notification belongs to another account.")
    updated = (supabase.table("notifications").update({"is_read": True})
               .eq("id", str(notification_id)).eq("user_id", user_id).execute())
    if not updated.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return NotificationOut(**updated.data[0])


def mark_all_notifications_read(supabase: Client, user_id: str) -> None:
    (supabase.table("notifications").update({"is_read": True})
     .eq("user_id", user_id).eq("is_read", False).execute())
