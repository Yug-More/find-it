from functools import lru_cache

from google import genai
from google.genai import types

from app.core.config import get_settings


@lru_cache
def _get_genai_client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key)


def get_text_embedding(text: str) -> list[float]:
    """Generate a vector embedding for a piece of text (item title + description)."""
    client = _get_genai_client()
    settings = get_settings()
    result = client.models.embed_content(
        model=settings.embedding_model,
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=settings.embedding_dimensions),
    )
    return result.embeddings[0].values
