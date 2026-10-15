# find-it/mobile-app

React Native client for FindIt. It covers sign-up, sign-in, a basic profile, reporting a lost or found item, browsing reports, and opening one report.

Image upload, search, filters, matching, and claims are not in this release.

## Stack

- Expo SDK 57
- React Native
- TypeScript
- React Navigation
- Supabase Auth

## Prerequisites

- Node.js and npm
- Expo Go on a phone, or a simulator, for a device preview
- A Supabase project with the FindIt schema applied, when you want real sign-in

The FastAPI service is not required while sample data is on. Browsing reports also works before Supabase is configured. Submitting a report needs an account.

## Install

From the repository root:

```bash
cd mobile-app
npm install
```

`npm ci` also works once the lock file is in sync with `package.json`.

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
npm run lint
npm run typecheck
```

`npx expo-doctor` checks the Expo project setup.

## Environment

Copy `.env.example` to `.env` when you want to change a value. Do not commit `.env`.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL. Required for sign-in. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key. Required for sign-in. |
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

Sign-in collects email and password. The session is saved with AsyncStorage and restored when the app starts. Sign out clears that session.

New passwords need at least 8 characters. If email confirmation is turned on in Supabase, the app asks the user to check their email before signing in.

Signed-out users can open Welcome, Sign in, Create account, and the public reports list. Reporting a lost or found item sends them to Sign in and explains that an account is required. After they sign in, the app opens the report they were trying to submit.

Signed-in users can open Home, Submit report, Reports, Report details, and Profile. Profile shows the name, when Supabase has one, the email, and Sign out.

## Mock mode

`EXPO_PUBLIC_USE_MOCK` defaults to true. Leave it true for local UI work and tests.

In mock mode the form, list, and details screens use sample data on the device. A signed-in user can still submit, but the report is not sent to the server. Sample reports stay in memory until the app reloads.

## Live submission

Set `EXPO_PUBLIC_USE_MOCK=false` and point `EXPO_PUBLIC_API_URL` at a running `ai-service`.

The client uses the existing item routes:

- `GET /items`
- `GET /items/{id}`
- `POST /items`

Reads do not need a user token. They still need the API and its Supabase configuration.

`POST /items` sends `Authorization: Bearer <supabase-access-token>` from the current session. Signed-out users never call that route. If the session is missing or the API returns 401, the form says to sign in again.

The API builds a Gemini embedding before it saves the item. This app only shows success when the server returns the saved report. If backend Supabase or Gemini configuration is missing, submission fails with the request error. That setup lives in `ai-service`, not in the mobile app.

## Screens

- Welcome, for signed-out users, with report, browse, and account actions
- Sign in and Create account
- Home, for signed-in users
- Submit report, with the existing field validation
- Reports, with loading, empty, and error states, plus pull to refresh
- Report details
- Profile, with sign out

## Structure

```text
App.tsx
src/components/ui
src/components/reports
src/context
src/screens
src/navigation
src/services
src/types
src/constants
src/hooks
src/utils
tests
```
