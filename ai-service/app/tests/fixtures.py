import uuid
from datetime import datetime


def sample_item_create():
    """A sample item creation payload matching the ItemCreate Pydantic model."""
    return {
        "type": "lost",
        "title": "Blue notebook",
        "description": "A blue notebook left in a study room.",
        "category": "Other",
        "color": "Blue",
        "location": "King Library",
        "event_date": "2026-01-15",
    }


def sample_item_response():
    """A sample item response from the API (mock shape)."""
    return {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "type": "found",
        "title": "Gray hoodie",
        "description": "A gray hoodie left on a chair.",
        "category": "Clothing",
        "color": "Gray",
        "brand": "Champion",
        "image_url": None,
        "location": "Student Union",
        "latitude": None,
        "longitude": None,
        "event_date": "2026-02-04T00:00:00Z",
        "status": "open",
        "created_at": "2026-02-04T20:00:00.000Z",
    }