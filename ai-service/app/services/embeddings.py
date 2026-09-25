from functools import lru_cache

from openai import OpenAI

from app.core.config import get_settings


@lru_cache
def _get_openai_client() -> OpenAI:
    return OpenAI(api_key=get_settings().openai_api_key)


def get_text_embedding(text: str) -> list[float]:
    """Generate a vector embedding for a piece of text (item title + description)."""
    client = _get_openai_client()
    settings = get_settings()
    response = client.embeddings.create(model=settings.embedding_model, input=text)
    return response.data[0].embedding
