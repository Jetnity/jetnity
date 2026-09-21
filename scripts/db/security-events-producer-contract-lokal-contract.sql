-- Zukünftiger Mutation-Derived-Producer, nur im lokalen Disposable-Harness.
-- Keine persistente Migration. Kein Development/Preview/Production-Apply.
--
-- Vertrag aus docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md:
-- - kein actor-JWT INSERT auf security_events
-- - AFTER-ROW-Trigger auf blocked_ips
-- - trigger-only SECURITY DEFINER, search_path='', keine Client-RPC
-- - eine Quotenreservation je qualifizierender Zeile
-- - Quelle + Event + Quote in derselben Transaktion, fail-closed
-- - used = aktuell behaltene tracked Producer-Zeilen
-- - Cleanup und used-Abgleich im selben Sperr-/Transaktionsraum

create table public.security_event_producer_quota (
  id text primary key,
  used integer not null default 0,
  cap integer,
  enabled boolean not null default true
);

comment on table public.security_event_producer_quota is
  'Lokaler Nachweis: eine Quotenzeile. used = behaltene tracked Producer-Zeilen. Kein Production-Budget.';

alter table public.security_event_producer_quota enable row level security;

revoke all on table public.security_event_producer_quota from public, anon, authenticated, service_role;

create or replace function public.security_event_is_tracked_producer(
  typ text,
  ereignis_ip text,
  metadaten jsonb,
  extra jsonb
)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select typ in ('admin_blocklist_add', 'admin_blocklist_remove')
     and ereignis_ip is null
     and metadaten is null
     and extra is not null
     and extra = jsonb_build_object(
           'surface', 'blocked_ips',
           'result', 'ok',
           'op', extra ->> 'op'
         )
     and extra ->> 'op' in ('INSERT', 'UPDATE', 'DELETE');
$$;

revoke all on function public.security_event_is_tracked_producer(text, text, jsonb, jsonb)
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
    from public.security_events e
   where public.security_event_is_tracked_producer(e.type, e.ip, e.metadata, e.extra);

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
  values (event_type, null, actor, extra, pg_catalog.now(), null);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

comment on function public.security_events_from_blocked_ips() is
  'Trigger-only mutation-derived producer. Not a client RPC. Local proof fixture only.';

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

-- Cleanup-Vertrag: nur tracked Producer-Zeilen, used im selben Sperrraum.
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
   where public.security_event_is_tracked_producer(e.type, e.ip, e.metadata, e.extra)
     and e.created_at < pg_catalog.clock_timestamp() - _older_than;

  get diagnostics deleted = row_count;

  select count(*)
    into remaining
    from public.security_events e
   where public.security_event_is_tracked_producer(e.type, e.ip, e.metadata, e.extra);

  update public.security_event_producer_quota
     set used = remaining
   where id = 'tracked_producer';

  return deleted;
end;
$$;

comment on function public.security_events_cleanup_tracked_producer(interval) is
  'Local proof cleanup/quota coupling. Synthetic age only. Not a retention policy.';

revoke all on function public.security_events_cleanup_tracked_producer(interval)
  from public, anon, authenticated, service_role;
