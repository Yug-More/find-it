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
