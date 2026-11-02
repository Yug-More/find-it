from pydantic import BaseModel

from app.models.item import ItemStatus


class AdminItemUpdate(BaseModel):
    status: ItemStatus
