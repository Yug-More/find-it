# FindIt Database

Supabase Postgres schema and seed data.

- [`schema.sql`](./schema.sql) - tables, indexes, trigger, RLS policies, and `match_items`.
- [`seeds.sql`](./seeds.sql) - sample lost/found items.

## Setup

1. Open the Supabase **SQL Editor**, paste all of [`schema.sql`](./schema.sql), and run it.
2. Create test users under **Authentication -> Users**. The `on_auth_user_created` trigger creates a matching `profiles` row.

`schema.sql` creates the required `vector` extension. If extension creation is blocked, enable **vector** under **Database -> Extensions** first.

For an existing database, apply [`migrations/20261021_schema_hardening.sql`](./migrations/20261021_schema_hardening.sql) instead of resetting.

## Seed data

`seeds.sql` uses psql variables `:user_alice` through `:user_eve`. Map them to real profile IDs first:

```sql
select id, email from public.profiles;
```

The Supabase SQL Editor does not support psql variables. Replace each token with a quoted UUID:

```sql
-- from
(:'user_alice', 'lost', ...)
-- to
('11111111-1111-4111-8111-111111111111', 'lost', ...)
```

Then run the file. With `psql`, edit the `\set` lines and run `psql "$SUPABASE_DB_URL" -f database/seeds.sql`.

Seeded rows have `NULL` embeddings, so they cannot appear in match results until embeddings are generated through `POST /items` or a backfill script. Running the seeds twice creates duplicates.

Items also support optional AI-generated copy in `ai_title`, `ai_description`, and `ai_description_generated_at`. User-provided `title` and `description` remain the source of truth.

## Notifications

`notifications` stores in-app updates for matches, claims, and reports. Each row belongs to one profile and can link to an item and/or claim. Users can read and mark only their own notifications; rows are created by the backend service role.

## RLS

RLS is enabled on all tables. Policies apply to the `authenticated` role.

| Table | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `profiles` | All authenticated | None (Auth trigger only) | Own row | None |
| `items` | Open items and own items | Own rows | Own rows | None |
| `claims` | Claimant or item owner | Own claims, not on own items | Item owner | None |
| `notifications` | Own rows | None (service role only) | Own rows | None |

The API uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. Keep it server-side. Ownership checks and the “cannot claim your own item” rule are enforced in both the database and the backend.

## `match_items`

```sql
match_items(
    query_embedding vector(1536),
    match_item_type item_type,
    match_count int,
    match_threshold float,
    exclude_item_id uuid
)
```

Returns open items of the opposite type whose cosine similarity exceeds `match_threshold`, ordered by similarity, excluding `exclude_item_id`. Includes `color` and `brand` so match results satisfy the API item model. The backend uses `match_count = 10` and `match_threshold = 0.75`.

`vector(1536)` must match `EMBEDDING_DIMENSIONS` in `ai-service/.env`. Changing dimensions requires updating the column, RPC, index, config, and all stored embeddings.

## Reset

Clear report data but keep profiles:

```sql
delete from public.notifications;
delete from public.claims;
delete from public.items;
```

Rebuild the schema from scratch:

```sql
begin;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.match_items(vector, item_type, integer, double precision, uuid);
drop function if exists public.handle_new_user() cascade;

drop table if exists public.notifications cascade;
drop table if exists public.claims cascade;
drop table if exists public.items cascade;
drop table if exists public.profiles cascade;

drop type if exists public.notification_kind;
drop type if exists public.claim_status;
drop type if exists public.item_status;
drop type if exists public.item_type;

commit;
```

Then rerun `schema.sql`. Existing Auth users remain, but their profiles must be recreated:

```sql
insert into public.profiles (id, email, full_name)
select id, email, raw_user_meta_data ->> 'full_name'
from auth.users
on conflict (id) do nothing;
```
