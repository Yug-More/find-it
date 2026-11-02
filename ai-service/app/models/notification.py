from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel


class NotificationKind(str, Enum):
    match = "match"
    claim = "claim"
    claim_update = "claim_update"
    report = "report"


class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    kind: NotificationKind
    title: str
    body: str
    item_id: UUID | None
    claim_id: UUID | None
    is_read: bool
    created_at: datetime
