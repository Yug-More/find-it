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
python -m pip install -r requirements-dev.txt
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
| PATCH  | `/claims/{id}`            | Approve/reject a pending claim (owner only)    |
| GET    | `/claims/mine`             | Signed-in claimant history, including related item and update date |
| GET    | `/notifications`           | Signed-in recipient notifications |
| PATCH  | `/notifications/{id}/read` | Mark one owned notification read |
| POST   | `/notifications/read-all`  | Mark all owned notifications read (204) |

Health, item browse/details, and match reads are public. Account, claim, notification, and report-write routes require an `Authorization: Bearer <supabase-access-token>` header.
# Testing

Run the test suite from the `ai-service` directory with `pytest`.


## Claim and notification lifecycle

Apply `database/migrations/20261102_claim_notification_lifecycle.sql` after the earlier hardening migration before running this version. Fresh projects use the updated `database/schema.sql`.

Claims are allowed on another user's open lost or found report. One pending or approved claim per claimant/report is allowed through the API; after rejection the claimant may submit a new explanation. Only owners can decide, and only pending claims become approved or rejected. Repeated/final-state decisions return 409, unauthorized decisions 403, and missing claims/reports 404. Approval resolves the report and rejects all competing pending claims without removing history.

Submission and decisions call service-role-only database functions. They lock the report first and commit claim changes and notifications in one transaction. A notification failure rolls back the mutation. Direct authenticated claim writes are revoked so clients cannot bypass the lifecycle. Existing owner-facing claim routes remain supported. `GET /claims/mine` uses the verified token subject, ignores client user IDs, and returns `updated_at` plus a nested `item` using the existing item model.

Claim submission notifies the report owner. Approval/rejection notifies the claimant; competing claimants receive rejection notifications when another claim wins. Notification reads and read updates use the verified recipient, not a body/query user ID. Clients cannot create notifications. Read updates are idempotent. Notifications retain the existing foreign-key cascade behavior when a report or claim is deleted. These are in-app updates; no push delivery or automatic match events are added.

## Report image cleanup

After a successful image replacement, image removal, or report deletion, the backend attempts to remove the previous unreferenced image from `report-images`. Only canonical public URLs in the configured Supabase project and `{authenticated-owner-id}/{filename}` folder qualify. External, other-owner, malformed, encoded, nested, signed, and shared URLs are skipped. New uploads and the report save complete before cleanup. Failures log a fixed operational warning without URLs or credentials; the successful report change remains successful.

Storage deletion uses the existing server-only service-role client. Client uploads still need the owner-folder insert policy documented in the mobile README. Keep uploaded object names unique and immutable; do not reuse old object URLs for new reports. Cleanup is best effort, with no durable retry worker. Uploads abandoned before a successful report save and objects left after cleanup failures need an operational sweep. Supabase Storage and Postgres cannot share an atomic transaction.
