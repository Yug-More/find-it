import os

import pytest


def pytest_collection_modifyitems(config, items):
    """Skip integration tests unless RUN_INTEGRATION=1 is set."""
    if os.environ.get("RUN_INTEGRATION") == "1":
        return

    skip = pytest.mark.skip(
        reason="integration tests require real services; run with RUN_INTEGRATION=1"
    )
    for item in items:
        if item.get_closest_marker("integration"):
            item.add_marker(skip)


@pytest.fixture(scope="session")
def real_settings():
    """Load and validate the real Supabase/Gemini configuration."""
    from app.core.config import get_settings

    settings = get_settings()
    missing = []
    if not settings.supabase_url or "test-project.supabase.co" in settings.supabase_url:
        missing.append("SUPABASE_URL")
    if (
        not settings.supabase_service_role_key
        or settings.supabase_service_role_key == "test-service-role-key"
    ):
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if not settings.gemini_api_key or settings.gemini_api_key == "test-gemini-api-key":
        missing.append("GEMINI_API_KEY")

    if missing:
        pytest.fail(
            "RUN_INTEGRATION=1 requires real credentials. "
            f"Missing/placeholder: {', '.join(missing)}. "
            "Fill them in ai-service/.env before running integration tests."
        )
    return settings


@pytest.fixture(scope="session")
def real_supabase(real_settings):
    """A Supabase client using the project's real URL and service-role key."""
    from app.core.supabase_client import get_supabase

    return get_supabase()


@pytest.fixture(scope="session")
def integration_user_id(real_supabase):
    """Resolve a real profile to own rows created during the test run.

    Set INTEGRATION_TEST_USER_ID to use a specific profile, otherwise the first
    profile in the project is used. Integration tests that need to write data
    are skipped when the project has no profiles.
    """
    configured_id = os.environ.get("INTEGRATION_TEST_USER_ID")
    if configured_id:
        result = (
            real_supabase.table("profiles")
            .select("id")
            .eq("id", configured_id)
            .execute()
        )
        if not result.data:
            pytest.fail(
                f"INTEGRATION_TEST_USER_ID={configured_id} does not exist in profiles"
            )
        return configured_id

    result = real_supabase.table("profiles").select("id").limit(1).execute()
    if not result.data:
        pytest.skip(
            "No profiles found. Create a Supabase auth user and set "
            "INTEGRATION_TEST_USER_ID to its profile id."
        )
    return result.data[0]["id"]
