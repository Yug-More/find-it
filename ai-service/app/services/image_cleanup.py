import logging
import re
from urllib.parse import urlsplit

from supabase import Client

from app.core.config import get_settings

logger = logging.getLogger(__name__)
BUCKET = "report-images"


def owned_image_path(image_url: str | None, user_id: str, supabase_url: str) -> str | None:
    """Only accept canonical public URLs in this project's owner upload folder."""
    if not image_url or not re.fullmatch(r"[A-Za-z0-9-]+", user_id):
        return None
    try:
        if any(ord(char) <= 32 or ord(char) == 127 for char in image_url):
            return None
        url, project = urlsplit(image_url), urlsplit(supabase_url)
        if url.geturl() != image_url:
            return None
        if (url.scheme, url.netloc) != (project.scheme, project.netloc):
            return None
        if url.query or url.fragment or url.username or url.password:
            return None
        prefix = project.path.rstrip("/") + f"/storage/v1/object/public/{BUCKET}/"
        if not url.path.startswith(prefix):
            return None
        path = url.path[len(prefix):]
        parts = path.split("/")
        if len(parts) != 2 or parts[0] != user_id:
            return None
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", parts[1]) or ".." in parts[1]:
            return None
        return path
    except ValueError:
        return None


def cleanup_report_image(supabase: Client, image_url: str | None, user_id: str) -> None:
    """Best effort after a committed report change; never turn success into failure."""
    try:
        path = owned_image_path(image_url, user_id, get_settings().supabase_url)
        if not path:
            return
        # Legacy reports may share an image. Leave referenced objects alone.
        references = supabase.table("items").select("id").eq("image_url", image_url).execute()
        if references.data:
            return
        supabase.storage.from_(BUCKET).remove([path])
    except Exception:
        # Exception strings can contain signed URLs, credentials, or request data.
        logger.warning("Report image cleanup failed; the report change was preserved.")
