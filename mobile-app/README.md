# find-it/mobile-app

React Native client for FindIt. The app covers accounts, report photos, search and filters, My Reports, editing and deleting owned reports, match review, ownership claims, and mock notifications.

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
| `PATCH` | `/claims/{id}` | Approve or reject a claim |

Reads for browse and details do not need a user token. Protected writes and claim routes send `Authorization: Bearer <supabase-access-token>`.

`GET /items` returns open reports and can filter by `type`. Search, category, location, date, and status filters run on the device against that list. A resolved report is not in the live list until the API returns it.

Match confidence is the API `similarity` value shown as a percentage. The app does not invent match reasons.

Create and edit ask the API to build a Gemini embedding before it saves the item. Claim approval asks the API to mark the item resolved.

## Mock-only features

- Notifications. There is no notification table or endpoint yet. Mock mode shows sample match and claim updates on the device. Live mode shows an empty notifications list with that limitation explained on screen.

## Required backend contracts still owned by teammates

- Structured ownership-verification questions. The live claim API accepts one `message` field. The app treats that as the ownership explanation and shows optional local writing prompts. A question-and-answer contract would need a backend and schema change.
- Live notifications for match and claim events.
- Returning resolved reports from `GET /items` when the product needs them in browse and My Reports.

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

create policy "Users replace their own report photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete their own report photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

The app does not create the bucket. If the bucket or a policy is missing, photo upload fails and the report is not saved.

## Known limitations

- Live search and filters only see the open reports returned by `GET /items`.
- Replacing a photo uploads a new file and leaves the previous object in storage.
- Create and edit fail when the API cannot reach Gemini or Supabase.
- Live Matches loads one match request per owned open report.
- Live Claims loads owned-report claims only. A claimant history list across all items is not available from the current API.
- Notifications are mock-only.
