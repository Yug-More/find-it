# Repository inspection

Inspection date: November 14, 2026 (America/Los_Angeles).

## Starting state

- Repository: https://github.com/Yug-More/find-it
- Main and fetched origin/main: `f77e4bdd97e04169fcbc8d11b8b71cb9ee12ba57`.
- Working tree, index, and untracked-file list were clean before implementation.
- Main tracked origin/main. No other local branch existed.
- Fetched remote branches included earlier frontend, authentication, Sprint 2,
  redesign, backend-hardening, integration, lifecycle, admin, and SDK branches.
- All PRs #1–#11 were merged. No open PR needed a prerequisite merge.
- GitHub returned no open or closed issues, milestones, workflows, or recent runs.
  Default issue labels existed. No issue or milestone was created for this work.
- No local evidence of overlapping uncommitted teammate work was found. This does
  not establish whether a teammate has private work on another machine.

## Prior work preserved

- Sprint 1 evidence: PR #1 report flow; PR #2 authentication and protected reporting.
- Sprint 2 evidence: PR #3 photos, search, filters, My Reports, edit/delete, tests.
- Later integration evidence: PRs #5–#6 matches, claims, notifications, design system;
  #7 backend tests and RLS; #8 history/error recovery; #9 transactional claims,
  recipient notifications and image cleanup; #10 server-verified admin controls;
  #11 Expo SDK 58. No tracked Sprint 3 report or meeting log exists, so these later
  changes cannot be assigned invented Sprint 3 dates, hours, or meeting records.
- Git history confirms Yug's mobile/integration work, Marl's backend/auth and SDK
  work, and Brody's database/admin/backfill and testing work.

## Findings driving changes

Resolved source reports and reports without embeddings could still reach vector
matching. The result boundary did not exclude the source owner's other reports.
The demo paired keys with a water bottle. Session restoration could race a newer
auth event or reject without ending loading. Claims, matches, and related-detail
requests lacked complete stale-response protection. Match refresh failures could
be hidden behind retained rows. Image size/type checks at selection did not
protect the upload boundary against missing or inaccurate metadata. Mock data was
reset by Profile before sign-out success, rather than by session lifecycle.

## Existing contracts and limits

Reports use only `open` and `resolved`. Claims use `pending`, `approved`, `rejected`.
Approval resolves the report and rejects competing pending claims atomically with
notifications. Rejection preserves an open report and history. Explicit deletion
cascades report claims/notifications; resolving preserves them. No separate physical
handover confirmation exists. This behavior is retained and explained in the demo.

Public API browse/detail/history uses the server connection and is broader than
direct authenticated database RLS. Report descriptions/photos are public through
this API; do not enter private identification details or credentials. Matching uses
text embeddings (title, description, category, color, brand); it does not analyze
photo pixels or independently score location/date.

No live credentials were supplied or used. The hosted migration state, Storage
bucket/policies, provider reachability, native photo permissions, email confirmation,
and cross-account live behavior require staging verification. Administration already
has database-managed roles and server checks; no new admin features were added.
