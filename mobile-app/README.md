# find-it/mobile-app

React Native client for FindIt. The app covers accounts, report photos, search and filters, My Reports, editing and deleting owned reports, match review, ownership claims, and in-app notifications.

## Stack

- Expo SDK 57
- React Native
- TypeScript
- React Navigation
- Supabase Auth and Storage

## Prerequisites

- Node.js and npm
- Expo Go on a phone, or a simulator, for a device preview
- A Supabase project with the FindIt schema applied, when you want real sign-in
- The `report-images` Storage bucket, when you want real photo upload

The FastAPI service is not required while sample data is on. Browsing reports also works before Supabase is configured. Submitting, editing, deleting, claiming, and reviewing live matches need an account and API configuration as described below.

## Install

From the repository root:

```bash
cd mobile-app
npm install
```

`npm ci` also works when the lock file matches `package.json`.

## Run

```bash
npm start
```

Other entry points:

```bash
npm run ios
npm run android
npm run web
```

## Checks

```bash
npm test
npm test -- --runInBand
npm run lint
npm run typecheck
npx expo-doctor
npx expo export --platform web
```

## Environment

Copy `.env.example` to `.env` when you want to change a value. Do not commit `.env`.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL. Required for sign-in and photo upload. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key. Required for sign-in and photo upload. |
| `EXPO_PUBLIC_API_URL` | FastAPI base URL, such as `http://localhost:8000` |
| `EXPO_PUBLIC_USE_MOCK` | `true` uses sample data on the device. `false` calls the API. |

If the Supabase URL or anon key is missing, the app stays open and explains what to set. It does not crash. You can still browse sample reports.

Do not put any of these in the mobile app or in `.env`:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `GEMINI_API_KEY`
- database passwords
- access tokens

Expo ships every `EXPO_PUBLIC_` variable inside the client bundle. The anon key is the public client key. The service-role key and JWT secret belong only in `ai-service`.

The signed-in access token comes from the Supabase session. The app does not read a token from the environment.

## Authentication

Sign-up collects a full name, email, password, and password confirmation. The full name is stored as `full_name` on the Supabase user so the database trigger can create a profile row.

Sign-in collects email and password. The password fields can be shown or hidden. The session is saved with AsyncStorage and restored when the app starts. Sign out clears that session and resets mock report, claim, and notification data when mock mode is on.

Signed-out users can open Welcome, Sign in, Create account, and the public reports list. Reporting a lost or found item sends them to Sign in. After they sign in, the app opens the report they were trying to submit.

Signed-in users use a bottom tab bar: Home, Reports, Report, Activity, and Profile. Stack screens cover Submit report, Report details, My Reports, Edit report, Matches, Claims, Submit claim, and Notifications. Activity groups Matches, Claims, and Notifications.

## Mock mode

`EXPO_PUBLIC_USE_MOCK` defaults to true. Leave it true for local UI work and tests.

In mock mode the form, list, details, search, filters, My Reports, edit, delete, matches, claims, and notifications screens use sample data on the device. A selected photo is kept as a local preview and is not uploaded. Sample data stays in memory until the app reloads or the user signs out.

When mock mode is on, Welcome includes **Continue with demo account**. That loads a local demo session (`demo@findit.local` / `user-1`) so signed-in screens can be reviewed without a live Supabase project. It does nothing when `EXPO_PUBLIC_USE_MOCK=false`.

Resolved reports stay in My Reports and claim history. Mock match discovery, like live discovery, uses owned open reports and excludes resolved candidates.

The sample key fob belongs to the test user `user-1`. The sample water bottle belongs to someone else, so My Reports, owner buttons, matches, and claims can be checked.

## Real API integrations

Set `EXPO_PUBLIC_USE_MOCK=false` and point `EXPO_PUBLIC_API_URL` at a running `ai-service`.

The client uses these routes:

| Method | Path | Use in the app |
| --- | --- | --- |
| `GET` | `/items` | Browse reports and build My Reports / Matches / Claims lists |
| `GET` | `/items/{id}` | Report details |
| `POST` | `/items` | Submit a report |
| `PATCH` | `/items/{id}` | Edit an owned report |
| `DELETE` | `/items/{id}` | Delete an owned report |
| `GET` | `/items/{id}/matches` | Match cards and the Matches screen |
| `POST` | `/items/{id}/claims` | Submit an ownership claim |
| `GET` | `/items/{id}/claims` | Owner claim review |
| `PATCH` | `/claims/{id}` | Approve or reject a pending claim |
| `GET` | `/claims/mine` | Claims submitted by the signed-in user, with related report details |
| `GET` | `/notifications` | Signed-in recipient notifications |
| `PATCH` | `/notifications/{id}/read` | Mark one owned notification read |
| `POST` | `/notifications/read-all` | Mark all owned notifications read |

Reads for browse and details do not need a user token. Protected writes and claim routes send `Authorization: Bearer <supabase-access-token>`.

`GET /items` defaults to open reports and supports `type` and `status` (`open` or `resolved`). Browse, My Reports, and owner claim history combine both status requests, remove duplicate IDs, and sort newest first. Search, category, location, date, and status filters run on the device. Matches use open reports only. If either status request fails, the screen shows an error instead of presenting an incomplete history.

Report-list and detail requests ignore superseded responses and responses arriving after leaving the screen. Refresh returns a promise so report deletion waits for the refreshed list. A failed claims refresh keeps existing rows visible with a retry action.

Match confidence is the API `similarity` value shown as a percentage. The app does not invent match reasons.

Create and edit ask the API to build a Gemini embedding before it saves the item. Claim approval asks the API to mark the item resolved.

## Claim and notification behavior

Apply `database/migrations/20261102_claim_notification_lifecycle.sql` after the earlier hardening migration before using the new live routes. The Claims screen combines `GET /claims/mine` with existing owner-facing claim routes and removes duplicate IDs. Claimant history maps update dates and related report photos, type, and status. The server derives claimant and recipient identity from the bearer token.

Claims require another user's open report. Duplicate active claims are rejected. Only pending claims can be approved or rejected, and only by the owner. Approval resolves the report and rejects other pending claims. Decisions are final; a rejected claimant may submit a new explanation while the report is still open.

Notifications work in live and mock mode. Claim submission notifies the owner; decisions notify the claimant, including competing claims rejected by approval. The screen shows the unread count, marks one notification when opened, and supports mark all as read. Read state changes only after API success. Failures stay visible with retry, and deleted report links lead to the existing report error/retry screen. There are no push notifications. Automatic match notifications remain sample-only; structured ownership questions still require a backend/schema contract.

## Supabase Storage

Photos are uploaded with the signed-in user's session, never with a service-role key. The object path is `{user-id}/{timestamp}-{random}.ext` in the bucket `report-images`.

Create that bucket in the Supabase dashboard and mark it public so report cards can load the public URL. Then add these policies in the SQL editor:

```sql
create policy "Report photos are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'report-images');

create policy "Users upload their own report photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

```

The client uploads new unique objects and does not need Storage UPDATE or DELETE privileges. For an existing bucket, remove the old `Users replace their own report photos` and `Users delete their own report photos` policies if present; the backend uses its server-only service role for cleanup.

Backend replacement, photo removal, and report deletion clean up the previous unreferenced owner photo only after the report change succeeds. Shared/external/invalid URLs are skipped. Storage failures preserve the report change and log a fixed warning. Object names must stay unique and immutable; do not reuse old image URLs.

Live create and edit check the API URL and access token before attempting a photo upload. Photo-library failures show a retryable error and keep the current photo.

The app does not create the bucket. If the bucket or a policy is missing, photo upload fails and the report is not saved.

## Known limitations

- Live create and edit depend on the backend reaching Gemini and Supabase.
- Storage cleanup is best effort. Failed cleanup and uploads abandoned before a successful save need an operational sweep; there is no durable cleanup retry worker.
- Live Matches and owner claim review still load per-report requests. Histories are not paginated because the existing API has no pagination pattern.
- Structured ownership questions, automatic match notifications, and push delivery are not implemented.
- Hosted-service behavior requires staging verification after applying migrations and Storage setup. Offline tests and mock-mode review do not prove live integration.

See [`DEPENDENCY_AUDIT.md`](./DEPENDENCY_AUDIT.md) for the dependency review.
