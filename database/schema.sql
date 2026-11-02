-- FindIt database schema (Supabase Postgres)
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists vector;

-- One row per authenticated user, mirroring auth.users.
create type user_role as enum ('user', 'admin');

create table if not exists profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null,
    full_name text,
    -- Server-managed. Users must never be able to promote themselves.
    role user_role not null default 'user',
    created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on profiles (role);

-- Automatically create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure handle_new_user();

create type item_type as enum ('lost', 'found');
create type item_status as enum ('open', 'resolved');

create table if not exists items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles (id) on delete cascade,
    type item_type not null,
    title text not null,
    description text not null,
    -- Optional AI-generated copy; the user-provided title/description stay above.
    ai_title text,
    ai_description text,
    ai_description_generated_at timestamptz,
    category text,
    color text,
    brand text,
    image_url text,
    location text,
    latitude double precision,
    longitude double precision,
    event_date timestamptz,
    status item_status not null default 'open',
    -- text-embedding-3-small produces 1536-dimensional vectors
    embedding vector(1536),
    created_at timestamptz not null default now()
);

create index if not exists items_type_status_idx on items (type, status);
create index if not exists items_embedding_idx
    on items using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create type claim_status as enum ('pending', 'approved', 'rejected');

create table if not exists claims (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references items (id) on delete cascade,
    claimant_id uuid not null references profiles (id) on delete cascade,
    message text not null,
    status claim_status not null default 'pending',
    created_at timestamptz not null default now()
);

create index if not exists claims_item_id_idx on claims (item_id);

create type notification_kind as enum ('match', 'claim', 'claim_update', 'report');

-- In-app notifications for match, claim, and report events.
create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles (id) on delete cascade,
    kind notification_kind not null,
    title text not null,
    body text not null,
    item_id uuid references items (id) on delete cascade,
    claim_id uuid references claims (id) on delete cascade,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
    on notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
    on notifications (user_id) where not is_read;

-- Finds items of `match_item_type` whose embedding is closest to `query_embedding`,
-- above `match_threshold` cosine similarity, excluding `exclude_item_id` itself.
create or replace function match_items(
    query_embedding vector(1536),
    match_item_type item_type,
    match_count int,
    match_threshold float,
    exclude_item_id uuid
)
returns table (
    id uuid,
    user_id uuid,
    type item_type,
    title text,
    description text,
    category text,
    color text,
    brand text,
    image_url text,
    location text,
    latitude double precision,
    longitude double precision,
    event_date timestamptz,
    status item_status,
    created_at timestamptz,
    similarity float
)
language sql stable
as $$
    select
        items.id,
        items.user_id,
        items.type,
        items.title,
        items.description,
        items.category,
        items.color,
        items.brand,
        items.image_url,
        items.location,
        items.latitude,
        items.longitude,
        items.event_date,
        items.status,
        items.created_at,
        1 - (items.embedding <=> query_embedding) as similarity
    from items
    where items.type = match_item_type
        and items.status = 'open'
        and items.id != exclude_item_id
        and 1 - (items.embedding <=> query_embedding) > match_threshold
    order by items.embedding <=> query_embedding
    limit match_count;
$$;

-- Row Level Security
alter table profiles enable row level security;
alter table items enable row level security;
alter table claims enable row level security;
alter table notifications enable row level security;

create policy "Profiles are viewable by authenticated users"
    on profiles for select
    to authenticated
    using (true);

create policy "Users can update their own profile"
    on profiles for update
    to authenticated
    using (auth.uid() = id);

-- Profile role is server-managed. The update policy above allows users to edit
-- their own profile, so restrict which columns they may write. The backend
-- service role bypasses these grants when an admin changes data.
revoke update on profiles from anon, authenticated;
grant update (email, full_name) on profiles to authenticated;

create policy "Open items are viewable by authenticated users"
    on items for select
    to authenticated
    using (status = 'open');

create policy "Users can view their own items"
    on items for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can create their own items"
    on items for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own items"
    on items for update
    to authenticated
    using (auth.uid() = user_id);

create policy "Item owners and claimants can view claims"
    on claims for select
    to authenticated
    using (
        auth.uid() = claimant_id
        or auth.uid() in (select user_id from items where items.id = claims.item_id)
    );

create policy "Users can create claims on items they do not own"
    on claims for insert
    to authenticated
    with check (
        auth.uid() = claimant_id
        and not exists (
            select 1
            from items
            where items.id = claims.item_id
                and items.user_id = auth.uid()
        )
    );

create policy "Item owners can update claims on their items"
    on claims for update
    to authenticated
    using (auth.uid() in (select user_id from items where items.id = claims.item_id));

create policy "Users can view their own notifications"
    on notifications for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can mark their own notifications read"
    on notifications for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Claim and notification lifecycle (also available as an incremental migration).
-- Apply after 20261021_schema_hardening.sql. No historical claims are removed.
begin;

alter table public.claims add column if not exists updated_at timestamptz;
update public.claims set updated_at = created_at where updated_at is null;
alter table public.claims alter column updated_at set default now();
alter table public.claims alter column updated_at set not null;
create index if not exists claims_claimant_created_idx on public.claims (claimant_id, created_at desc);

-- Mutations must go through the trusted API so direct table writes cannot skip
-- lifecycle checks or forge notification events. Existing read policies remain.
revoke insert, update, delete on public.claims from public, anon, authenticated;
revoke insert, update, delete on public.notifications from public, anon, authenticated;
grant update (is_read) on public.notifications to authenticated;

-- These functions are service-role-only. p_actor is populated from the verified
-- bearer token by FastAPI, never from the request body or query parameters.
create or replace function public.submit_item_claim(p_item uuid, p_actor uuid, p_message text)
returns setof public.claims
language plpgsql security definer set search_path = '' as $$
declare
    report public.items%rowtype;
    claim public.claims%rowtype;
begin
    select * into report from public.items where id = p_item for update;
    if not found then raise sqlstate 'PT404' using message = 'Item not found'; end if;
    if report.user_id = p_actor then
        raise sqlstate 'PT400' using message = 'You cannot claim your own item';
    end if;
    if report.status <> 'open' then
        raise sqlstate 'PT409' using message = 'This report is no longer open for claims.';
    end if;
    if p_message is null or length(btrim(p_message)) < 1 or length(p_message) > 1000 then
        raise sqlstate 'PT400' using message = 'Enter an ownership explanation of 1 to 1000 characters.';
    end if;
    -- The report lock serializes submission and decisions for this item,
    -- including concurrent requests by the same claimant.
    if exists (select 1 from public.claims where item_id = p_item
               and claimant_id = p_actor and status in ('pending', 'approved')) then
        raise sqlstate 'PT409' using message = 'You already have an active claim on this report.';
    end if;
    insert into public.claims (item_id, claimant_id, message)
        values (p_item, p_actor, btrim(p_message)) returning * into claim;
    insert into public.notifications (user_id, kind, title, body, item_id, claim_id)
        values (report.user_id, 'claim', 'New ownership claim',
                'Someone claimed ' || report.title || '. Review the explanation before you decide.', p_item, claim.id);
    return next claim;
end;
$$;

create or replace function public.decide_item_claim(p_claim uuid, p_actor uuid, p_status public.claim_status)
returns setof public.claims
language plpgsql security definer set search_path = '' as $$
declare
    report public.items%rowtype;
    claim public.claims%rowtype;
    other public.claims%rowtype;
    report_id uuid;
begin
    select item_id into report_id from public.claims where id = p_claim;
    if not found then raise sqlstate 'PT404' using message = 'Claim not found'; end if;
    -- Always lock the report before claims to avoid deadlocks between decisions.
    select * into report from public.items where id = report_id for update;
    if not found then raise sqlstate 'PT404' using message = 'Item not found'; end if;
    if report.user_id <> p_actor then
        raise sqlstate 'PT403' using message = 'Only the item owner can update this claim';
    end if;
    select * into claim from public.claims where id = p_claim for update;
    if not found then raise sqlstate 'PT404' using message = 'Claim not found'; end if;
    if p_status is null or p_status not in ('approved', 'rejected') or claim.status <> 'pending' then
        raise sqlstate 'PT409' using message = 'Only pending claims can be approved or rejected.';
    end if;
    if p_status = 'approved' and report.status <> 'open' then
        raise sqlstate 'PT409' using message = 'This report is already resolved.';
    end if;
    update public.claims set status = p_status, updated_at = now() where id = p_claim returning * into claim;
    insert into public.notifications (user_id, kind, title, body, item_id, claim_id)
        values (claim.claimant_id, 'claim_update',
                case when p_status = 'approved' then 'Claim approved' else 'Claim rejected' end,
                'Your claim for ' || report.title || ' was ' || p_status::text || '.', report.id, claim.id);
    if p_status = 'approved' then
        update public.items set status = 'resolved' where id = report.id;
        for other in
            update public.claims set status = 'rejected', updated_at = now()
            where item_id = report.id and status = 'pending' returning *
        loop
            insert into public.notifications (user_id, kind, title, body, item_id, claim_id)
                values (other.claimant_id, 'claim_update', 'Claim rejected',
                        'Another claim for ' || report.title || ' was approved.', report.id, other.id);
        end loop;
    end if;
    return next claim;
end;
$$;

revoke execute on function public.submit_item_claim(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.decide_item_claim(uuid, uuid, public.claim_status) from public, anon, authenticated;
grant execute on function public.submit_item_claim(uuid, uuid, text) to service_role;
grant execute on function public.decide_item_claim(uuid, uuid, public.claim_status) to service_role;

commit;
