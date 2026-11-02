# Running the Test Suite

## Prerequisites
- Python 3.11+
- Installed dependencies: `cd ai-service && pip install -r requirements-dev.txt`

## Running Tests
From the `ai-service` directory:

```bash
# Unit/contract suite (no network, no credentials required)
pytest

# Integration suite (real Supabase + Gemini; writes and cleans up test rows)
RUN_INTEGRATION=1 pytest -m integration -v
```

Integration tests use the first row in `profiles` unless
`INTEGRATION_TEST_USER_ID` is set to a specific profile id. Create a Supabase
auth user first if the project has no profiles. Like the unit suite, the
integration suite loads credentials from `ai-service/.env`. If they are missing
or still placeholders, the integration run fails with a clear message instead of
silently using fakes.

## Test Structure
Tests in `app/tests/`:
- `conftest.py` - Shared fixtures (`client`, `authed_client`, `token_factory`, `fake_db`)
- `test_security.py` - JWT verification (RS256/JWKS and legacy HS256)
- `test_auth.py` - `/auth/me` endpoint
- `test_items.py` - `/items` CRUD + matches
- `test_claims.py` - `/claims` submit/list/update
- `integration/test_live_services.py` - real Supabase + Gemini end-to-end checks

## Test Fixtures
- `client`: Unauthenticated TestClient
- `authed_client`: TestClient authenticated with an RS256 token signed by a
  throwaway test keypair; the Supabase JWKS response is mocked, so no network
  access or `SUPABASE_JWT_SECRET` is required
- `token_factory`: Build RS256 tokens with custom `kid`, expiry, or claims
- `fake_db`: In-memory Supabase fake (autouse), so endpoint tests never touch a
  real project or the Gemini API

## Adding New Tests
1. Create `test_*.py` in `app/tests/`
2. Import fixtures from module scope
3. Use `client` (unauthed) or `authed_client` (JWT)
4. Follow existing patterns

# TODO

- Add gemini API key

The integration tests are skipped by default. To run them against real services (needs credentials in `.env`):

```bash
RUN_INTEGRATION=1 pytest -m integration -v
```


Lifecycle coverage lives in `test_claim_lifecycle.py`, `test_notifications.py`, and `test_image_cleanup.py`. These verify token-derived ownership, history mapping, conflicts, notification access and read updates, and Storage deletion validation/failure handling. `fake_supabase.py` supports the API contracts; it is not a proof of database transaction behavior.

Run `cd database && npm ci && npm test` from the repository root for the real lifecycle SQL/RLS/rollback tests in embedded PostgreSQL. Those tests omit the unrelated vector extension and do not replace hosted-service or multi-connection concurrency checks. The existing live integration suite remains opt-in and requires actual credentials.
