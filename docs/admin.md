# Basic Admin Controls

Admin controls let a server-verified admin review and moderate FindIt data. They
do not change the claim lifecycle or notification behavior.

## Apply the migration

For an existing database, run this after the earlier schema migrations, before
deploying the matching backend:

```text
database/migrations/20261102_admin_controls.sql
```

Fresh projects get the same changes from `database/schema.sql`.

The migration:

- adds `public.user_role` (`user`, `admin`)
- adds `public.profiles.role` with a default of `user`
- adds `profiles_role_idx`
- revokes table-level `UPDATE` on `profiles` from `anon` and `authenticated`
- grants column-level `UPDATE` only on `email` and `full_name`

Because the existing profile RLS policy lets users update their own row, the
column grants are required to stop a user from promoting themselves.

## Promote the first admin

Run this in the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

There is deliberately no in-app role-management endpoint. Role changes stay a
database-operator action.

## Backend

Admin access is enforced by `ai-service/app/core/admin.py`. It resolves the
token `sub` through `get_current_user_id`, then looks up `profiles.role` with the
service role. A missing profile or non-admin role returns `403`.

All admin routes require `Authorization: Bearer <supabase-access-token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/users` | List profiles and roles |
| GET | `/admin/items?status=&type=` | List every report, including resolved |
| PATCH | `/admin/items/{id}` | Set report status to `open` or `resolved` |
| DELETE | `/admin/items/{id}` | Delete a report and cascade its claims/notifications |
| GET | `/admin/claims?status=` | Read-only claim overview |

The admin routes are read/moderate operations. Claim approval and rejection
remain owner-only through `/claims/{id}`.

## Mobile

`ProfileScreen` fetches `/auth/me` for a live session and shows **Admin
controls** only when the returned role is `admin`. The row opens `AdminScreen`,
which provides report, user, and claim sections.

The UI gate is convenience only. The API independently rejects non-admins.

## Tests

```bash
cd ai-service
.venv/bin/python -m pytest

cd ../mobile-app
npm test
npm run typecheck
```

Backend coverage is in `ai-service/app/tests/test_admin.py`. Mobile coverage is
in `mobile-app/tests/adminService.test.ts`, `mobile-app/tests/adminProfile.test.tsx`,
and `mobile-app/tests/AdminScreen.test.tsx`.

## Current limits

- No admin role-management UI; promote through SQL.
- No audit log for admin actions.
- Admin claims are read-only.
- Deleting a report cascades database rows but does not remove the report photo
  from Supabase Storage.
