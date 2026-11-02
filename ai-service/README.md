# find-it/ai-service/

The core backend for FindIt, built with FastAPI. Handles users, claims, security, and AI-powered image/description embeddings.

## Setup

1. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and fill in your Supabase and Gemini credentials:

   ```bash
   cp .env.example .env
   ```

   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: Project Settings > API in your Supabase project.
   - `SUPABASE_JWT_SECRET`: Project Settings > API > JWT Settings.
   - `GEMINI_API_KEY`: free API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey), used to generate embeddings. The Gemini API free tier (separate from any Google AI Pro/Plus subscription) is enough for this project.

4. Apply the database schema (see [`../database/schema.sql`](../database/schema.sql)) to your Supabase project via the SQL editor or `supabase db push`.

5. Run the API:

   ```bash
   uvicorn app.main:app --reload
   ```

   The API is now available at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

## Testing

```bash
# Unit/contract suite: fully faked, offline, no credentials required
pytest

# Integration suite: real Supabase project + real Gemini embeddings
RUN_INTEGRATION=1 pytest -m integration -v
```

The integration suite reads credentials from `.env`, creates a temporary item
through the API (which generates a real embedding), verifies it in Supabase,
then deletes it. Set `INTEGRATION_TEST_USER_ID` to choose which existing profile
owns test rows; otherwise the first profile in the project is used.

## Backfilling embeddings

Seeded rows and older reports can have a `NULL` embedding, which excludes them
from match search. Fill them in with the backfill script:

```bash
# Show what would change, without writing
python scripts/backfill_embeddings.py --dry-run

# Embed at most 100 items, pausing between Gemini calls
python scripts/backfill_embeddings.py --limit 100 --delay 0.5
```

Run it from `ai-service` so `.env` is loaded. The script only selects rows whose
embedding is still `NULL`, so it is safe to run more than once. Failures are
reported per item and the run continues; the exit code is non-zero if any item
failed.

## Structure

```
app/
    main.py          FastAPI app + router registration
    core/             config, Supabase client, JWT auth dependency
    models/           Pydantic request/response schemas
    services/         business logic (items, claims, profiles, embeddings)
    routers/          HTTP route definitions
    tests/            pytest unit tests + opt-in integration tests
scripts/
    backfill_embeddings.py   fill missing item embeddings
```

## Endpoints

| Method | Path                     | Description                                   |
| ------ | ------------------------ | ---------------------------------------------- |
| GET    | `/health`                | Liveness check                                 |
| GET    | `/auth/me`                | Current user's profile                         |
| POST   | `/items`                  | Report a lost/found item (generates embedding) |
| GET    | `/items`                  | Browse items (`?type=lost/found`, `?status=open/resolved`) |
| GET    | `/items/{id}`             | Get a single item                              |
| PATCH  | `/items/{id}`             | Update a report (owner only)                   |
| DELETE | `/items/{id}`             | Delete a report (owner only)                   |
| GET    | `/items/{id}/matches`     | Find likely matches for an item                |
| POST   | `/items/{id}/claims`      | Submit a claim on an item                      |
| GET    | `/items/{id}/claims`      | List claims on an item (owner only)            |
| PATCH  | `/claims/{id}`            | Approve/reject a claim (owner only)            |

All endpoints except `/health`, `/items` (browse/read) require an `Authorization: Bearer <supabase-access-token>` header.
# Testing

Run the test suite from the `ai-service` directory with `pytest`.
