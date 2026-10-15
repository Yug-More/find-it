# find-it/mobile-app

React Native client for FindIt. Sprint 2 covers accounts, report photos, search and filters, My Reports, and editing or deleting a report you created.

Image search, matching, claims, notifications, and admin tools are later work.

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

The FastAPI service is not required while sample data is on. Browsing reports also works before Supabase is configured. Submitting, editing, or deleting a report needs an account.

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

Sign-in collects email and password. The password fields can be shown or hidden. The session is saved with AsyncStorage and restored when the app starts. Sign out clears that session.

New passwords need at least 8 characters. If email confirmation is turned on in Supabase, the app asks the user to check their email before signing in.

Signed-out users can open Welcome, Sign in, Create account, and the public reports list. Reporting a lost or found item sends them to Sign in and explains that an account is required. After they sign in, the app opens the report they were trying to submit.

Signed-in users can open Home, Submit report, Reports, Report details, My Reports, Edit report, and Profile.

## Mock mode

`EXPO_PUBLIC_USE_MOCK` defaults to true. Leave it true for local UI work and tests.

In mock mode the form, list, details, search, filters, My Reports, edit, and delete screens use sample data on the device. A selected photo is kept as a local preview and is not uploaded. Sample reports stay in memory until the app reloads.

The sample key fob belongs to the test user `user-1`. The sample water bottle belongs to someone else, so My Reports and the owner buttons can be checked.

## Real API mode

Set `EXPO_PUBLIC_USE_MOCK=false` and point `EXPO_PUBLIC_API_URL` at a running `ai-service`.

The client uses these item routes:

- `GET /items`
- `GET /items/{id}`
- `POST /items`
- `PATCH /items/{id}`
- `DELETE /items/{id}`

Reads do not need a user token. They still need the API and its Supabase configuration. `GET /items` returns open reports and can filter by `type`. Search, category, location, date, and status filters run on the device against that list. A resolved report is not in the live list until the API returns it.

`POST`, `PATCH`, and `DELETE` send `Authorization: Bearer <supabase-access-token>` from the current session. Signed-out users never call those routes. If the session is missing or the API returns 401, the screen says to sign in again. A 403 means the account does not own the report.

Create and edit ask the API to build a Gemini embedding before it saves the item. This app only shows success when the server returns the saved report. If backend Supabase or Gemini configuration is missing, the request fails with the server message. That setup lives in `ai-service`, not in the mobile app.

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
- Matching, claims, and notifications are not in this app.
- Expo Doctor may report that `expo` and `jest-expo` are a patch behind the newest SDK 57 release. This project keeps the versions already used on main.
