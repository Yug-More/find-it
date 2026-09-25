from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProfileOut(BaseModel):
    id: UUID
    email: str
    full_name: str | None
    created_at: datetime
