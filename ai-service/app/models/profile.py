from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel


class UserRole(str, Enum):
    user = "user"
    admin = "admin"


class ProfileOut(BaseModel):
    id: UUID
    email: str
    full_name: str | None
    role: UserRole = UserRole.user
    created_at: datetime
