# Running the Test Suite

## Prerequisites
- Python 3.11+
- Installed dependencies: `cd ai-service && pip install -r requirements.txt`

## Running Tests
From the `ai-service` directory:
```bash
pytest
```

## Test Structure
Tests in `app/tests/`:
- `conftest.py` - Shared fixtures (`client`, `authed_client`)
- `test_auth.py` - `/auth/me` endpoint
- `test_items.py` - `/items` CRUD + matches
- `test_claims.py` - `/claims` submit/list/update

## Test Fixtures
- `client`: Unauthenticated TestClient
- `authed_client`: JWT-authenticated TestClient (reads secret from `.env` via `get_settings()`)

## Adding New Tests
1. Create `test_*.py` in `app/tests/`
2. Import fixtures from module scope
3. Use `client` (unauthed) or `authed_client` (JWT)
4. Follow existing patterns

# TODO

- Add gemini API key