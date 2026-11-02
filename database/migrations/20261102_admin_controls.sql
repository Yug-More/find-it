-- Apply after 20261021_schema_hardening.sql.
-- Adds a server-managed role for basic admin controls.
--
-- Promote an admin from the Supabase SQL editor (never from the mobile app):
--   update public.profiles set role = 'admin' where email = 'admin@example.com';

begin;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'user_role') then
        execute 'create type public.user_role as enum (''user'', ''admin'')';
    end if;
end $$;

alter table public.profiles
    add column if not exists role public.user_role not null default 'user';

create index if not exists profiles_role_idx on public.profiles (role);

-- The existing "Users can update their own profile" policy must not let a user
-- promote themselves. Revoke table-level UPDATE and grant only profile text
-- columns. The backend service role bypasses these grants for admin operations.
revoke update on public.profiles from anon, authenticated;
grant update (email, full_name) on public.profiles to authenticated;

commit;
