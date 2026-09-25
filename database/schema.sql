-- FindIt database schema (Supabase Postgres)
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists vector;

-- One row per authenticated user, mirroring auth.users.
create table if not exists profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null,
    full_name text,
    created_at timestamptz not null default now()
);

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
    category text,
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

create policy "Profiles are viewable by authenticated users"
    on profiles for select
    to authenticated
    using (true);

create policy "Users can update their own profile"
    on profiles for update
    to authenticated
    using (auth.uid() = id);

create policy "Open items are viewable by authenticated users"
    on items for select
    to authenticated
    using (true);

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
    with check (auth.uid() = claimant_id);

create policy "Item owners can update claims on their items"
    on claims for update
    to authenticated
    using (auth.uid() in (select user_id from items where items.id = claims.item_id));
