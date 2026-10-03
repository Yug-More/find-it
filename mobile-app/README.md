# find-it/mobile-app

Sprint 1 React Native client for FindIt. It covers reporting a lost or found item, browsing reports, and opening one report.

This release does not include sign-in, image upload, search, filters, matching, or claims.

## Stack

- Expo SDK 57
- React Native
- TypeScript
- React Navigation

## Prerequisites

- Node.js and npm
- Expo Go on a phone, or a simulator, for a device preview

The FastAPI service is not required while sample data is on.

## Install

From the repository root:

```bash
cd mobile-app
npm install
```

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

Copy `.env.example` to `.env` only when you need to change a value. Do not commit `.env`.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | FastAPI base URL, such as `http://localhost:8000` |
| `EXPO_PUBLIC_USE_MOCK` | `true` uses sample data on the device. `false` calls the API for reads. |

Do not put access tokens or other secrets in `.env`. Expo ships every `EXPO_PUBLIC_` variable inside the client bundle. A future sign-in flow should pass the Supabase access token into `createReport` from the session. This release never reads a token from the environment.

With the default `EXPO_PUBLIC_USE_MOCK=true`, the form, list, and details screens work without the API.

## Live API

The client follows the existing item routes:

- `POST /items`
- `GET /items`
- `GET /items/{id}`

`GET /items` and `GET /items/{id}` do not require a user token. They still need `ai-service` running with its Supabase configuration. Set `EXPO_PUBLIC_USE_MOCK=false` and `EXPO_PUBLIC_API_URL` to try those reads.

`POST /items` is not available in this release.

- The route requires `Authorization: Bearer <supabase-access-token>`.
- There is no sign-in screen, and the app does not store a token.
- Submitting with mock mode off, and no session token, shows an authentication error and does not call the server.
- Even after sign-in exists, the backend generates a Gemini embedding before it saves an item, so create also depends on `GEMINI_API_KEY`.

Sample reports submitted in the app stay in memory on the device. They are cleared when the app reloads.

## Screens

- Home, with actions for a lost item, a found item, and the reports list
- Submit report, with required-field validation
- Reports, with loading, empty, and error states, plus pull to refresh
- Report details

## Structure

```text
App.tsx
src/components/ui
src/components/reports
src/screens
src/navigation
src/services
src/types
src/constants
src/hooks
src/utils
tests
```
