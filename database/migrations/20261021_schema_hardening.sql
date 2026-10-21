-- Apply these hardening changes to an existing FindIt database.
-- Fresh projects can run schema.sql directly instead.

begin;

-- Optional AI-generated copy alongside the user-provided title/description.
alter table public.items
    add column if not exists ai_title text,
    add column if not exists ai_description text,
    add column if not exists ai_description_generated_at timestamptz;

do $$
begin
    if not exists (
        select 1 from pg_type where typname = 'notification_kind'
    ) then
        create type notification_kind as enum ('match', 'claim', 'claim_update', 'report');
    end if;
end $$;

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    kind notification_kind not null,
    title text not null,
    body text not null,
    item_id uuid references public.items (id) on delete cascade,
    claim_id uuid references public.claims (id) on delete cascade,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
    on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
    on public.notifications (user_id) where not is_read;

drop policy if exists "Open items are viewable by authenticated users" on public.items;
create policy "Open items are viewable by authenticated users"
    on public.items for select
    to authenticated
    using (status = 'open');

drop policy if exists "Users can view their own items" on public.items;
create policy "Users can view their own items"
    on public.items for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Users can create claims on items they do not own" on public.claims;
create policy "Users can create claims on items they do not own"
    on public.claims for insert
    to authenticated
    with check (
        auth.uid() = claimant_id
        and not exists (
            select 1
            from public.items
            where items.id = claims.item_id
                and items.user_id = auth.uid()
        )
    );

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
    on public.notifications for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Users can mark their own notifications read" on public.notifications;
create policy "Users can mark their own notifications read"
    on public.notifications for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Return type changes, so the function must be dropped before recreation.
drop function if exists public.match_items(vector, item_type, integer, double precision, uuid);

create function match_items(
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

commit;
