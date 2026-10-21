# Running the Test Suite

## Prerequisites
- Python 3.11+
- Installed dependencies: `cd ai-service && pip install -r requirements.txt`

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