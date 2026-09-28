from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class ItemType(str, Enum):
    lost = "lost"
    found = "found"


class ItemStatus(str, Enum):
    open = "open"
    resolved = "resolved"


class ItemCreate(BaseModel):
    type: ItemType
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=2000)
    category: str | None = None
    color: str | None = None
    brand: str | None = None
    image_url: str | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    event_date: datetime | None = None


class ItemOut(BaseModel):
    id: UUID
    user_id: UUID
    type: ItemType
    title: str
    description: str
    category: str | None
    color: str | None
    brand: str | None
    image_url: str | None
    location: str | None
    latitude: float | None
    longitude: float | None
    event_date: datetime | None
    status: ItemStatus
    created_at: datetime


class ItemMatch(BaseModel):
    item: ItemOut
    similarity: float
