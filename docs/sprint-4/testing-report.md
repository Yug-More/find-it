# Testing report

Verification date: November 14, 2026, America/Los_Angeles. Starting main:
`f77e4bdd97e04169fcbc8d11b8b71cb9ee12ba57`.

## Environment

macOS arm64; Node 24.11.1; npm 11.6.2; Python 3.13.2 in ignored
`ai-service/.venv`; Expo SDK 58.0.25. Dependencies installed from committed npm
lockfiles and backend requirements. Mobile and backend `.env` files were absent.
No credentials, production data or live services were used for acceptance.

## Automated results

- Mobile `npm ci`: passed, including a clean reinstall after the targeted lockfile update.
- `npm test -- --runInBand`: **33 suites, 137 tests passed**.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npx expo-doctor`: **20/20 checks passed**.
- `EXPO_PUBLIC_USE_MOCK=true npx expo export --platform web`: passed, output in ignored `dist`.
- Backend `.venv/bin/python -m pytest`: **102 passed, 6 skipped**. Six opt-in live
  tests require credentials; these skips are not live acceptance. One dependency
  deprecation warning concerns Starlette's AnyIO portal alias.
- Database `npm ci` and `npm test`: **6 passed**. The real lifecycle SQL runs in
  PGlite with vector-specific extension/index/RPC omitted; no hosted Storage or
  multi-connection locking guarantee is established by these tests.
- `git diff --check`: passed.
- Audit: **28 affected package entries (27 moderate, 1 low); no high or critical**.
  Production-install graph: **3 moderate entries**. Audit exits nonzero for those
  findings. Initial high-severity Zod finding was remediated within its consumer's
  supported range; remaining incompatible updates are documented in
  [dependency audit](../../mobile-app/DEPENDENCY_AUDIT.md).

New regression cases cover stale session restore, rejected restore promises,
failed-sign-out preservation, session-loss cleanup, upload-boundary validation,
resolved/missing-embedding sources, self/same-owner/type candidate exclusions,
repeatable demo states, relevant mock matches, and related-data retry.
Existing suites cover auth forms/protection, report forms/management, filters,
image selection, real response mapping, claims, notifications, storage cleanup,
JWT verification, server-admin authorization, and SQL privilege/rollback behavior.

Credential-free CI now defines mobile, backend and database jobs. Hosted results
must be checked on the PR; local passes alone do not establish hosted success.

## Browser mock walkthrough

Ran Expo web locally with `EXPO_PUBLIC_USE_MOCK=true`. Used a browser viewport
at **360 × 800**, **390 × 844**, and **430 × 932**. Screenshots were inspected for
selected forms, matching, claims, report details and notifications. No horizontal
overflow was found in the inspected layouts; DOM bounds were also checked on Claims.
This was representative responsive coverage, not every screen at every size.

Observed successful behavior:

- Signed-out browse/details, missing-live-sign-in configuration and disabled submit.
- Demo account entry and Home/navigation.
- Search and empty results; every category chip; Lost/Found type, Open/Resolved
  status, combined location filter, inclusive date range, invalid range, clear filters.
- Required report validation; lost and found submission without photos.
- Web photo selection and preview using a disposable repository icon, then saving
  the photo through owner edit and seeing it on report details. The image remained
  local; this was not a Supabase upload. Photo picker replacement/removal and native
  permission cases also have automated coverage; not every native case was repeated manually.
- My Reports after deletion; owner edit saved text; delete confirmation and removal
  of a disposable mock report.
- Relevant key-fob match and estimated-confidence text, navigation in both directions.
- Claim validation/submission; pending history; owner rejection with confirmation;
  reset demonstration and owner approval; approved/resolved history on details.
- Notification read/unread states, mark all read, and navigation to a resolved report.
- Profile identity, sign-out returning to Welcome, fresh demo reset.

The preview was restarted after a clean `npm ci` replaced its running dependency
files. This setup interruption was resolved before continuing the walkthrough.

## Not performed / remaining acceptance

- Real sign-up/sign-in, email confirmation, expired live JWT refresh and two-account
  hosted claims/notifications. Form/session and API contract behavior is automated.
- Hosted Gemini embeddings/pgvector matching or Supabase Auth/Storage/RLS checks.
- iOS/Android device permission prompts, native keyboard/safe-area behavior and
  actual Storage replacement/delete cleanup.
- Every loading/error/retry/confirmation state manually at all three widths.
  Automated tests exercise representative failures; remaining manual cases need
  team acceptance before declaring exhaustive cross-device readiness.
- Deployed application testing, native push, admin role promotion, Canvas upload.

## Known limits and final readiness

The core recovery workflow is demonstrated locally in mock mode. Approval is the
existing resolution step; no independent physical-return confirmation exists.
Live matching embeds text, not photo pixels/location/date as independent signals.
Structured verification questions and automatic live match events remain deferred.
Image cleanup is best effort and does not cover admin deletion or abandoned uploads.
Public API report reads expose history as implemented; never use private student
information in demo reports. No schema, migrations or existing team SQL seeds changed.

Before final submission: teammates review the PR and hosted checks, complete the
remaining live/device acceptance or disclose it, fill meeting records, insert the
real spreadsheet link, and finalize the presentation and instructor checklist.
