-- Provider Readiness S6-A – Persistent Cost Guard Repository Foundation
--
-- REPOSITORY-ONLY. Diese Migration wird in S6-A NICHT auf Production angewendet.
-- Ein späteres Apply allein aktiviert weiterhin keinen Provider:
-- - Runtime-Gate startet false;
-- - es werden keine aktiven Policies angelegt;
-- - es wird keine Login-/Runtime-Rolle zugewiesen;
-- - EXECUTE liegt nur auf einer NOLOGIN Capability-Role.
--
-- Ziel: atomare, instanzübergreifende Reservierung vor einem späteren
-- bezahlten Provider-Call. Keine Reiseinhalte, keine Provider-Antworten,
-- keine Traveller-/Pass-/Citizenship-Daten.

create schema if not exists jetnity_internal;

revoke all on schema jetnity_internal from public, anon, authenticated, service_role;
grant usage on schema jetnity_internal to postgres;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'jetnity_provider_cost_guard_writer') then
    create role jetnity_provider_cost_guard_writer nologin;
  end if;
end
$$;

comment on role jetnity_provider_cost_guard_writer is
  'S6-A NOLOGIN Capability-Role. Darf nur die interne Cost-Guard-Reservierungsfunktion ausführen. Keine Login-/Secret-Zuweisung in S6-A; Production-Runtime-Allokation bleibt ein späteres Product-Owner-Gate.';

revoke jetnity_provider_cost_guard_writer from anon, authenticated, service_role;
grant usage on schema jetnity_internal to jetnity_provider_cost_guard_writer;
revoke usage on schema jetnity_internal from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. Runtime-Gate: hard-off by default
-- ---------------------------------------------------------------------------

create table if not exists jetnity_internal.provider_cost_guard_runtime_gate (
  singleton boolean primary key default true check (singleton),
  production_write_path_allocated boolean not null default false,
  allocated_invoker_role name,
  note text not null,

  constraint provider_cost_guard_runtime_gate_allocation_coherent
    check (
      (not production_write_path_allocated and allocated_invoker_role is null)
      or (production_write_path_allocated and allocated_invoker_role is not null)
    )
);

comment on table jetnity_internal.provider_cost_guard_runtime_gate is
  'S6-A hard-off Gate. false verlangt allocated_invoker_role=null; true verlangt eine explizit dokumentierte Invoker-Rolle. Principal-Zuweisung und Gate-Öffnung benötigen ein separates Product-Owner-Gate.';

insert into jetnity_internal.provider_cost_guard_runtime_gate (
  singleton,
  production_write_path_allocated,
  allocated_invoker_role,
  note
) values (
  true,
  false,
  null,
  'S6-A Repository Foundation. Kein Runtime-Principal, kein Secret, kein >0-Live-Budget und kein Provider aktiviert.'
)
on conflict (singleton) do nothing;

alter table jetnity_internal.provider_cost_guard_runtime_gate enable row level security;
revoke all on table jetnity_internal.provider_cost_guard_runtime_gate
  from public, anon, authenticated, service_role, jetnity_provider_cost_guard_writer;

-- ---------------------------------------------------------------------------
-- 2. Policy – keine Seed-Zeilen, daher zusätzlich fail-closed
-- ---------------------------------------------------------------------------

create table if not exists jetnity_internal.provider_cost_guard_policy (
  id bigint generated always as identity primary key,
  scope text not null,
  period text not null,
  domain text,
  window_seconds integer not null,
  max_requests bigint not null default 0,
  max_cost_microusd bigint not null default 0,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),

  constraint provider_cost_guard_policy_scope
    check (scope in ('caller', 'domain', 'global')),

  constraint provider_cost_guard_policy_period
    check (period in ('window', 'day')),

  constraint provider_cost_guard_policy_domain
    check (
      (scope = 'global' and domain is null)
      or (
        scope in ('caller', 'domain')
        and domain in (
          'flights', 'hotels', 'activities', 'mobility', 'rental_cars',
          'readiness', 'safety', 'seasonal'
        )
      )
    ),

  constraint provider_cost_guard_policy_window
    check (
      (period = 'day' and window_seconds = 86400)
      or (period = 'window' and window_seconds between 1 and 86399)
    ),

  constraint provider_cost_guard_policy_requests
    check (max_requests between 0 and 1000000),

  constraint provider_cost_guard_policy_cost
    check (max_cost_microusd between 0 and 9007199254740991),

  constraint provider_cost_guard_policy_enabled_has_requests
    check (not enabled or max_requests > 0)
);

comment on table jetnity_internal.provider_cost_guard_policy is
  'S6-A operative Limits ohne Reiseinhalt. caller/domain brauchen window+day; global ist optional. Keine Policy wird in S6-A aktiviert oder geseedet.';

create unique index if not exists provider_cost_guard_policy_eindeutig
  on jetnity_internal.provider_cost_guard_policy (
    scope,
    period,
    coalesce(domain, '')
  );

alter table jetnity_internal.provider_cost_guard_policy enable row level security;
revoke all on table jetnity_internal.provider_cost_guard_policy
  from public, anon, authenticated, service_role, jetnity_provider_cost_guard_writer;

-- ---------------------------------------------------------------------------
-- 3. Konservative Reservierungen
-- ---------------------------------------------------------------------------

create table if not exists jetnity_internal.provider_cost_guard_reservation (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  identifier_hash text not null,
  reserved_cost_microusd bigint not null,
  created_at timestamptz not null default clock_timestamp(),

  constraint provider_cost_guard_reservation_domain
    check (domain in (
      'flights', 'hotels', 'activities', 'mobility', 'rental_cars',
      'readiness', 'safety', 'seasonal'
    )),

  constraint provider_cost_guard_reservation_identifier_hash
    check (identifier_hash ~ '^[0-9a-f]{64}$'),

  constraint provider_cost_guard_reservation_cost
    check (reserved_cost_microusd between 0 and 9007199254740991)
);

comment on table jetnity_internal.provider_cost_guard_reservation is
  'Konservative S6-A Vorab-Reservierung. Nur Domain, domänengetrennter serverseitiger Kennungs-HMAC, reservierte Mikro-USD und DB-Zeit. Keine Reise-/Such-/Traveller-/Provider-Payloads.';

create index if not exists provider_cost_guard_reservation_caller_idx
  on jetnity_internal.provider_cost_guard_reservation (
    identifier_hash,
    domain,
    created_at
  );

create index if not exists provider_cost_guard_reservation_domain_idx
  on jetnity_internal.provider_cost_guard_reservation (domain, created_at);

create index if not exists provider_cost_guard_reservation_global_idx
  on jetnity_internal.provider_cost_guard_reservation (created_at);

alter table jetnity_internal.provider_cost_guard_reservation enable row level security;
revoke all on table jetnity_internal.provider_cost_guard_reservation
  from public, anon, authenticated, service_role, jetnity_provider_cost_guard_writer;

-- ---------------------------------------------------------------------------
-- 4. Atomare Reservierung – nur Capability-Role, nicht Data API
-- ---------------------------------------------------------------------------

create or replace function jetnity_internal.provider_cost_guard_reservieren(_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  _domain text;
  _identifier_hash text;
  _cost_text text;
  _cost bigint;
  _now timestamptz;
  _gate_open boolean := false;
  _allocated_invoker_role name;
  _has_caller_window boolean := false;
  _has_caller_day boolean := false;
  _has_domain_window boolean := false;
  _has_domain_day boolean := false;
  _policy record;
  _count bigint;
  _cost_sum numeric;
  _oldest timestamptz;
  _retry integer;
begin
  if _payload is null or jsonb_typeof(_payload) <> 'object' then
    return jsonb_build_object('ok', false, 'retryAfterSec', 1);
  end if;

  if (_payload ->> 'version') is distinct from 'jetnity.provider_cost_guard.reserve.v1' then
    return jsonb_build_object('ok', false, 'retryAfterSec', 1);
  end if;

  _domain := btrim(coalesce(_payload ->> 'domain', ''));
  if _domain not in (
    'flights', 'hotels', 'activities', 'mobility', 'rental_cars',
    'readiness', 'safety', 'seasonal'
  ) then
    return jsonb_build_object('ok', false, 'retryAfterSec', 1);
  end if;

  _identifier_hash := lower(btrim(coalesce(_payload ->> 'identifierHash', '')));
  if _identifier_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'retryAfterSec', 1);
  end if;

  _cost_text := btrim(coalesce(_payload ->> 'reservedCostMicrousd', ''));
  if _cost_text !~ '^[0-9]{1,16}$' then
    return jsonb_build_object('ok', false, 'retryAfterSec', 1);
  end if;

  _cost := _cost_text::bigint;
  if _cost < 0 or _cost > 9007199254740991 then
    return jsonb_build_object('ok', false, 'retryAfterSec', 1);
  end if;

  -- Eine einzige globale Transaktionssperre macht Policy-Prüfung + Insert
  -- instanzübergreifend atomar. Kein Vercel-Prozessspeicher ist Truth.
  perform pg_advisory_xact_lock(hashtext('jetnity_internal.provider_cost_guard'), 0);

  select g.production_write_path_allocated, g.allocated_invoker_role
    into _gate_open, _allocated_invoker_role
    from jetnity_internal.provider_cost_guard_runtime_gate g
   where g.singleton = true;

  -- S6-A kennt bewusst noch keine Production-Login-Rolle. Selbst ein späterer
  -- boolescher Gate-Flip reicht daher nicht: die Allokation muss explizit eine
  -- Invoker-Rolle dokumentieren. Die eigentliche Principal-/Membership-Prüfung
  -- wird erst zusammen mit der späteren Product-Owner-gated Runtime-Zuweisung
  -- definiert.
  if not found
     or coalesce(_gate_open, false) is not true
     or _allocated_invoker_role is null
  then
    return jsonb_build_object('ok', false, 'retryAfterSec', 1);
  end if;

  -- caller + domain müssen jeweils Window UND Day besitzen.
  -- global ist optional, wird aber geprüft sobald eine globale Policy aktiv ist.
  select
    coalesce(bool_or(p.scope = 'caller' and p.period = 'window'), false),
    coalesce(bool_or(p.scope = 'caller' and p.period = 'day'), false),
    coalesce(bool_or(p.scope = 'domain' and p.period = 'window'), false),
    coalesce(bool_or(p.scope = 'domain' and p.period = 'day'), false)
    into
      _has_caller_window,
      _has_caller_day,
      _has_domain_window,
      _has_domain_day
    from jetnity_internal.provider_cost_guard_policy p
   where p.enabled
     and (p.scope = 'global' or p.domain = _domain);

  if not _has_caller_window
     or not _has_caller_day
     or not _has_domain_window
     or not _has_domain_day
  then
    return jsonb_build_object('ok', false, 'retryAfterSec', 1);
  end if;

  _now := clock_timestamp();

  for _policy in
    select p.scope, p.period, p.window_seconds, p.max_requests, p.max_cost_microusd
      from jetnity_internal.provider_cost_guard_policy p
     where p.enabled
       and (p.scope = 'global' or p.domain = _domain)
     order by p.scope, p.period
  loop
    if _policy.scope = 'caller' then
      select count(*), coalesce(sum(r.reserved_cost_microusd), 0), min(r.created_at)
        into _count, _cost_sum, _oldest
        from jetnity_internal.provider_cost_guard_reservation r
       where r.domain = _domain
         and r.identifier_hash = _identifier_hash
         and r.created_at >= _now - make_interval(secs => _policy.window_seconds);
    elsif _policy.scope = 'domain' then
      select count(*), coalesce(sum(r.reserved_cost_microusd), 0), min(r.created_at)
        into _count, _cost_sum, _oldest
        from jetnity_internal.provider_cost_guard_reservation r
       where r.domain = _domain
         and r.created_at >= _now - make_interval(secs => _policy.window_seconds);
    else
      select count(*), coalesce(sum(r.reserved_cost_microusd), 0), min(r.created_at)
        into _count, _cost_sum, _oldest
        from jetnity_internal.provider_cost_guard_reservation r
       where r.created_at >= _now - make_interval(secs => _policy.window_seconds);
    end if;

    if _count >= _policy.max_requests
       or _cost_sum + _cost::numeric > _policy.max_cost_microusd::numeric
    then
      _retry := greatest(
        1,
        ceil(
          extract(
            epoch from (
              coalesce(_oldest, _now)
              + make_interval(secs => _policy.window_seconds)
              - _now
            )
          )
        )::integer
      );

      return jsonb_build_object('ok', false, 'retryAfterSec', _retry);
    end if;
  end loop;

  insert into jetnity_internal.provider_cost_guard_reservation (
    domain,
    identifier_hash,
    reserved_cost_microusd,
    created_at
  ) values (
    _domain,
    _identifier_hash,
    _cost,
    _now
  );

  return jsonb_build_object('ok', true);
exception
  when others then
    -- Fehler dürfen niemals einen späteren bezahlten Call freigeben.
    return jsonb_build_object('ok', false, 'retryAfterSec', 1);
end
$$;

comment on function jetnity_internal.provider_cost_guard_reservieren(jsonb) is
  'S6-A atomare Vorab-Reservierung für spätere bezahlte Provider-Calls. SECURITY DEFINER mit leerem search_path. Gate false + fehlende Policies + fehlende Allokationsrolle sind hard-off. Kein Production-Principal in S6-A. EXECUTE ausschließlich jetnity_provider_cost_guard_writer.';

revoke all on function jetnity_internal.provider_cost_guard_reservieren(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function jetnity_internal.provider_cost_guard_reservieren(jsonb)
  to jetnity_provider_cost_guard_writer;
