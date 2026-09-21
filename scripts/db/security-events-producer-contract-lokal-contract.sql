-- Zukünftiger Mutation-Derived-Producer, nur im lokalen Disposable-Harness.
-- Keine persistente Migration. Kein Development/Preview/Production-Apply.
--
-- Vertrag aus docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md
-- plus TL F1 (review 5267095835): Quote und Cleanup zählen nur
-- trigger-emittierte Zeilen. Die öffentliche Event-Form allein ist keine
-- Herkunft. Herkunft steht in einem privaten Provenienzbuch, das
-- anon/authenticated/service_role weder lesen noch schreiben können.

create schema jetnity_internal;
revoke all on schema jetnity_internal from public, anon, authenticated, service_role;

comment on schema jetnity_internal is
  'Local disposable proof only. Not a Data API schema. Trigger-origin ledger lives here.';

create table public.security_event_producer_quota (
  id text primary key,
  used integer not null default 0,
  cap integer,
  enabled boolean not null default true
);

comment on table public.security_event_producer_quota is
  'Lokaler Nachweis: eine Quotenzeile. used = behaltene trigger-emittierte Zeilen. Kein Production-Budget.';

alter table public.security_event_producer_quota enable row level security;

revoke all on table public.security_event_producer_quota from public, anon, authenticated, service_role;

create table jetnity_internal.security_event_producer_origin (
  event_id uuid primary key
    references public.security_events(id) on delete cascade,
  produced_at timestamptz not null default now(),
  producer text not null default 'blocked_ips_row_trigger',
  constraint security_event_producer_origin_producer_check
    check (producer = 'blocked_ips_row_trigger')
);

comment on table jetnity_internal.security_event_producer_origin is
  'Trigger-only origin ledger. Membership, not public extra shape, decides quota/cleanup.';

alter table jetnity_internal.security_event_producer_origin enable row level security;

revoke all on table jetnity_internal.security_event_producer_origin
  from public, anon, authenticated, service_role;

create or replace function jetnity_internal.security_event_is_trigger_produced(event_id uuid)
returns boolean
language sql
stable
parallel safe
set search_path = ''
as $$
  select exists (
    select 1
      from jetnity_internal.security_event_producer_origin o
     where o.event_id = security_event_is_trigger_produced.event_id
  );
$$;

revoke all on function jetnity_internal.security_event_is_trigger_produced(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.security_events_from_blocked_ips()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid;
  event_type text;
  extra jsonb;
  event_id uuid;
  reserved integer;
  retained bigint;
  quota_used integer;
  quota_cap integer;
  quota_enabled boolean;
begin
  actor := (select auth.uid());
  if actor is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    event_type := 'admin_blocklist_remove';
  else
    event_type := 'admin_blocklist_add';
  end if;

  extra := jsonb_build_object(
    'surface', 'blocked_ips',
    'result', 'ok',
    'op', tg_op
  );

  if octet_length(extra::text) > 256 then
    raise exception 'security_events payload exceeds 256 bytes'
      using errcode = 'P0001';
  end if;

  select q.used, q.cap, q.enabled
    into quota_used, quota_cap, quota_enabled
    from public.security_event_producer_quota q
   where q.id = 'tracked_producer'
   for update;

  if not found then
    raise exception 'security_event producer quota missing'
      using errcode = 'P0001';
  end if;

  if quota_enabled is not true
     or quota_cap is null
     or quota_cap <= 0 then
    raise exception 'security_event producer quota disabled or invalid'
      using errcode = 'P0001';
  end if;

  select count(*)
    into retained
    from jetnity_internal.security_event_producer_origin o
    join public.security_events e on e.id = o.event_id;

  if retained is distinct from quota_used then
    raise exception 'security_event producer quota drifted'
      using errcode = 'P0001';
  end if;

  update public.security_event_producer_quota
     set used = used + 1
   where id = 'tracked_producer'
     and used + 1 <= cap
     and enabled
     and cap > 0
  returning used into reserved;

  if reserved is null then
    raise exception 'security_event producer quota exceeded'
      using errcode = 'P0001';
  end if;

  insert into public.security_events (type, ip, user_id, extra, created_at, metadata)
  values (event_type, null, actor, extra, pg_catalog.now(), null)
  returning id into event_id;

  insert into jetnity_internal.security_event_producer_origin (event_id)
  values (event_id);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

comment on function public.security_events_from_blocked_ips() is
  'Trigger-only mutation-derived producer. Writes public event and private origin atomically. Not a client RPC.';

revoke all on function public.security_events_from_blocked_ips()
  from public, anon, authenticated, service_role;

create trigger security_events_from_blocked_ips_ins_del
after insert or delete on public.blocked_ips
for each row
execute function public.security_events_from_blocked_ips();

create trigger security_events_from_blocked_ips_upd
after update on public.blocked_ips
for each row
when (old is distinct from new)
execute function public.security_events_from_blocked_ips();

-- Cleanup-Vertrag: nur Provenienz-Mitglieder, used im selben Sperrraum.
-- Das Intervall ist ein Testhaken, keine rechtliche Aufbewahrungsfrist.
create or replace function public.security_events_cleanup_tracked_producer(_older_than interval)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted integer;
  remaining bigint;
begin
  perform 1
     from public.security_event_producer_quota q
    where q.id = 'tracked_producer'
    for update;

  if not found then
    raise exception 'security_event producer quota missing'
      using errcode = 'P0001';
  end if;

  delete from public.security_events e
   using jetnity_internal.security_event_producer_origin o
   where o.event_id = e.id
     and e.created_at < pg_catalog.clock_timestamp() - _older_than;

  get diagnostics deleted = row_count;

  select count(*)
    into remaining
    from jetnity_internal.security_event_producer_origin o
    join public.security_events e on e.id = o.event_id;

  update public.security_event_producer_quota
     set used = remaining
   where id = 'tracked_producer';

  return deleted;
end;
$$;

comment on function public.security_events_cleanup_tracked_producer(interval) is
  'Local proof cleanup/quota coupling from private origin, not public shape. Synthetic age only.';

revoke all on function public.security_events_cleanup_tracked_producer(interval)
  from public, anon, authenticated, service_role;
