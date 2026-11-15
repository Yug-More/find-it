# Final demo script

## Local setup and backup

Use Node 24 and npm with the committed lockfile:

```bash
cd mobile-app
npm ci
EXPO_PUBLIC_USE_MOCK=true npm run web
```

On Windows, set `EXPO_PUBLIC_USE_MOCK=true` in an ignored `.env` instead of the
inline environment assignment. No backend or credentials are needed for the demo.
Click **Continue with demo account**. This resets the local seven-report fixtures,
claim history and notifications. The account is `demo@findit.local`, ID `user-1`;
there is no demo password and it does not authenticate against a live service.
Reloading or signing out clears local changes. Re-enter the demo for a fresh run.

## Demonstration order and expected results

1. Before demo sign-in, browse reports. Search Toyota, open filters, choose Found
   with no matching text, then clear filters. Signed-out users cannot submit.
2. Enter the demo. Home and the five navigation tabs appear.
3. Submit a lost report: “Blue notebook”, Other, King Library, a valid past date,
   and a descriptive sentence. First try an empty form to show validation. Save
   without a photo; success links to report details.
4. Submit a found report. Select a disposable photo if the device supports it;
   show preview/replacement/removal. Mock mode retains the local image only.
5. Open My reports, edit the notebook, return and verify updated text. Create a
   disposable second report and demonstrate the delete confirmation. Explicit
   deletion removes related history; use resolution to preserve it.
6. Open Matches. “Toyota key fob found” is paired with the owned Toyota key fob.
   The fixed 81% demo estimate is illustrative, not a live embedding result.
7. Open that found report and submit a specific ownership explanation. Claims
   shows the new pending claim; the demo cannot decide another owner's claim.
8. Claims also includes an existing pending claim on the owned Toyota report.
   Reject it and show retained rejected history. To also demonstrate approval,
   sign out and re-enter demo to restore the original pending fixture.
9. Approve that pending owner claim in the confirmation dialog. The report is
   resolved immediately, the claim is approved, and competing pending claims
   would be rejected. Approval is the current end of the return workflow;
   there is no separate physical-handover step.
10. Open My reports and verify the resolved Toyota report remains. Open Matches:
    it is no longer used as an open source. Claims retains approved/rejected rows.
11. Open Notifications, show read/unread text and mark all as read. Open a related
    report from a notification. Sample match notifications are seeded only;
    live events are claim submission and claim decisions.
12. Open Profile, show demo identity, sign out, and verify Welcome returns.

## Live services

Follow the root, mobile, backend and database READMEs. Use two development accounts,
apply existing migrations in filename order (including admin and lifecycle), create
the public `report-images` bucket and owner-folder upload policy, configure Supabase
Auth and Gemini, and run FastAPI on a reachable host. Set mock mode false and set
the mobile API URL plus public Supabase URL/anon key. Server keys stay in backend
configuration. Never show environment files or tokens during the presentation.

Use a phone-reachable address instead of localhost on physical devices. For hosted
web, use HTTPS for the API and configure CORS for the actual frontend origin.
Deploy FastAPI using `uvicorn app.main:app --host 0.0.0.0 --port 8000` behind the
hosting platform's HTTPS proxy; deployment itself has not been performed here.

Run the opt-in integration suite exactly as documented in
`ai-service/app/tests/README.md`, then rehearse the two-account claim and notification
flow. Live setup requires team-held credentials and has not been verified here.
If services fail, restart the local mock demo and state clearly that it is mock mode.
