import os
from functools import lru_cache

# Load .env dynamically
_dot_env_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    '.env'
)
if os.path.exists(_dot_env_path):
    from dotenv import load_dotenv
    load_dotenv(_dot_env_path, override=True)


from app.core.config import get_settings


@lru_cache
def get_settings_cached():
    return get_settings()


def create_test_jwt(user_id: str | None = None) -> str:
    """Create a valid Supabase-style JWT for testing."""
    settings = get_settings_cached()
    secret = settings.supabase_jwt_secret
    import time
    import jwt as pyjwt
    from uuid import uuid4
    if user_id is None:
        user_id = str(uuid4())
    payload = {
        "sub": user_id,
        "aud": "authenticated",
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
    }
    return pyjwt.encode(payload, secret, algorithm="HS256")