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

## Structure

```
app/
    main.py          FastAPI app + router registration
    core/             config, Supabase client, JWT auth dependency
    models/           Pydantic request/response schemas
    services/         business logic (items, claims, profiles, embeddings)
    routers/          HTTP route definitions
```

## Endpoints

| Method | Path                     | Description                                   |
| ------ | ------------------------ | ---------------------------------------------- |
| GET    | `/health`                | Liveness check                                 |
| GET    | `/auth/me`                | Current user's profile                         |
| POST   | `/items`                  | Report a lost/found item (generates embedding) |
| GET    | `/items`                  | Browse open items (optional `?type=lost/found`)|
| GET    | `/items/{id}`             | Get a single item                              |
| GET    | `/items/{id}/matches`     | Find likely matches for an item                |
| POST   | `/items/{id}/claims`      | Submit a claim on an item                      |
| GET    | `/items/{id}/claims`      | List claims on an item (owner only)            |
| PATCH  | `/claims/{id}`            | Approve/reject a claim (owner only)            |

All endpoints except `/health`, `/items` (browse/read) require an `Authorization: Bearer <supabase-access-token>` header.