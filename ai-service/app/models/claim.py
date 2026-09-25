from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class ClaimStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ClaimCreate(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class ClaimStatusUpdate(BaseModel):
    status: ClaimStatus


class ClaimOut(BaseModel):
    id: UUID
    item_id: UUID
    claimant_id: UUID
    message: str
    status: ClaimStatus
    created_at: datetime
