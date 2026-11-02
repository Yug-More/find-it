from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.item import ItemOut


class ClaimStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ClaimCreate(BaseModel):
    message: str = Field(min_length=1, max_length=1000)

    @field_validator("message")
    @classmethod
    def trim_message(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Enter an ownership explanation.")
        return value.strip()


class ClaimStatusUpdate(BaseModel):
    status: ClaimStatus


class ClaimOut(BaseModel):
    id: UUID
    item_id: UUID
    claimant_id: UUID
    message: str
    status: ClaimStatus
    created_at: datetime
    updated_at: datetime | None = None


class ClaimHistoryOut(ClaimOut):
    item: ItemOut | None = None
