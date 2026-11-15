# Product backlog update

## Completed in the repository

- P0: accounts and protected report actions; lost/found CRUD, owner checks.
- P0: pending claim submission, owner approval/rejection, duplicate prevention,
  competing-claim handling, resolved and claimant history, recipient notifications.
- P1: search/type/category/status/location/date filters, photos and cleanup,
  confidence display, retry states, and secure basic admin roles (earlier merged PRs).
- P0: Sprint 4 matching exclusions, restoration race/error recovery, centralized
  mock cleanup, user-specific navigation reset, and stale-request protection.
- P1: upload-boundary validation, realistic demo fixtures, regression tests,
  CI definition, dependency remediation and final documentation.

## Remaining acceptance work

- P0, Marl/Brody/Yug: apply and verify existing migrations and Storage policies
  in a development Supabase project; run the opt-in live tests and two-account demo.
- P1, Yug: remaining browser/device matrix from testing report, including photo
  permissions and actual uploads on supported phones.
- P1, team: review PR/checks, finalize course documents and presentation, insert
  the real backlog spreadsheet link, and submit through Canvas.

## Deferred

- P2: structured ownership questions; no schema/API contract exists. The current
  message-based explanation remains supported.
- P2: automatic match notifications and native push; no event/delivery infrastructure.
- P2: independent physical-return confirmation; current approval already resolves
  reports. A new state requires a shared product/schema decision.
- P2: pagination, durable failed-upload cleanup, admin audit logs and flag/archive
  moderation; these are not included in the existing contracts.
- P1: remaining transitive build/test dependency advisories; incompatible major
  overrides are deferred. See the mobile dependency audit for exact findings.

Confidence is an estimate. Photo, location and date collection do not establish
that the matching service independently analyzes those signals.
