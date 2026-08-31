-- E5-B3A Persistence Foundation
--
-- Eigene Relation public.trip_item_flight_event_provenance neben trip_items.
-- Eine Zeile = genau eine aktuelle Flight-Occurrence
-- (trip_item × leg × segment × departure|arrival).
--
-- Binding rule: Persisted does not mean provider-proven.
-- Owner-writable trip_items.metadata ist keine Provider-Provenance.
-- Commercial Provenance wird nicht fachfremd überladen.
--
-- Lokale Airport-Wanduhr, explizite IANA-Zone und absoluter Instant
-- bleiben getrennte Fakten. SQL rechnet keine Zone/DST und hängt
-- kein Z an lokale Strings.
--
-- Write-Authority analog S5-B:
-- authenticated/anon haben kein INSERT/UPDATE/DELETE.
-- Kontrollierter Write nur über
-- jetnity_internal.trip_item_flight_event_provenance_schreiben
-- als SECURITY DEFINER, nicht im PostgREST-Schema, search_path='',
-- PUBLIC/anon/authenticated/service_role ohne EXECUTE.
--
-- Full-current-snapshot: ein Write ersetzt alle Occurrences eines
-- Flight-Items atomar. Alte Zeilen dürfen nicht stehen bleiben.
-- occurrence_event_ref wird nur serverseitig erzeugt.
-- provider_belegt=true erfordert eine konkrete, nicht-leere external_ref.
--
-- Kein Backfill. Keine History. Kein Production-Apply durch Cursor.
-- Kein Runtime-Principal. Runtime-Gate bleibt geschlossen.
-- flugNachweisAusUmgebung() bleibt null.

-- ---------------------------------------------------------------------------
-- 1. Privates Schema + NOLOGIN-Writer-Rolle
-- ---------------------------------------------------------------------------

create schema if not exists jetnity_internal;

comment on schema jetnity_internal is
  'Nicht exponiertes Schema für privilegierte server-owned Writes. Nicht in [api].schemas. Kein PostgREST-RPC.';

revoke all on schema jetnity_internal from public, anon, authenticated, service_role;
grant usage on schema jetnity_internal to postgres;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'jetnity_flight_event_writer') then
    create role jetnity_flight_event_writer nologin;
  end if;
end
$$;

comment on role jetnity_flight_event_writer is
  'NOLOGIN, nicht PostgREST. Einziger EXECUTE-Träger für den E5-B3A-Flight-Event-Write. Kein Login, kein Secret, kein Service-Role-Ersatz. Kein Production-Write-Pfad, solange das Runtime-Gate geschlossen ist.';

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'jetnity_flight_event_runtime') then
    create role jetnity_flight_event_runtime nologin noinherit;
  end if;
end
$$;

comment on role jetnity_flight_event_runtime is
  'NOLOGIN NOINHERIT. Zukünftiger server-seitiger Invoker ohne breite DB-Rechte. Darf SET ROLE jetnity_flight_event_writer, erbt aber keine Privilegien. GRANT dieser Rolle an eine Login-Rolle ist ein späteres Product-Owner-Gate. Nicht an anon/authenticated/service_role.';

grant jetnity_flight_event_writer to jetnity_flight_event_runtime;
revoke jetnity_flight_event_writer from anon, authenticated, service_role;
revoke jetnity_flight_event_runtime from anon, authenticated, service_role;

grant usage on schema jetnity_internal to jetnity_flight_event_writer;
revoke usage on schema jetnity_internal from public, anon, authenticated, service_role;

create table if not exists jetnity_internal.flight_event_write_runtime_gate (
  singleton boolean primary key default true check (singleton),
  production_write_path_allocated boolean not null default false,
  allocated_invoker_role name,
  note text not null
);

comment on table jetnity_internal.flight_event_write_runtime_gate is
  'E5-B3A Invocation-Gate. production_write_path_allocated=false bedeutet: die DEFINER-Funktion ist kein ausführbarer Production-Write-Pfad. Runtime-Principal-Zuweisung an eine Login-Rolle bleibt ein späteres Product-Owner-Gate.';

insert into jetnity_internal.flight_event_write_runtime_gate (
  singleton, production_write_path_allocated, allocated_invoker_role, note
) values (
  true,
  false,
  null,
  'E5-B3A definiert den Invocation-Vertrag. GRANT jetnity_flight_event_runtime an eine Anwendungs-Login-Rolle ist ein späteres Gate. Die Funktion ist kein Production-Write-Pfad.'
)
on conflict (singleton) do nothing;

revoke all on table jetnity_internal.flight_event_write_runtime_gate
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Current-Snapshot-Relation: eine Occurrence je Endpunkt
-- ---------------------------------------------------------------------------

create table public.trip_item_flight_event_provenance (
  id uuid primary key default gen_random_uuid(),
  trip_item_id uuid not null,
  trip_id uuid not null,
  user_id uuid not null,
  snapshot_version uuid not null,
  occurrence_event_ref text not null,
  leg_index smallint not null,
  segment_index smallint not null,
  endpoint text not null,
  iata text not null,
  local_date date not null,
  local_time time not null,
  time_zone text not null,
  event_instant timestamptz not null,
  provider_id text not null,
  provider_belegt boolean not null default true,
  source_kind text not null default 'persisted_snapshot',
  source_label text,
  external_ref text not null,
  retrieved_at timestamptz not null,
  observed_at timestamptz not null,
  fresh_until timestamptz,
  persistenz text not null default 'snapshot',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_item_flight_event_provenance_item_fk
    foreign key (trip_item_id)
    references public.trip_items (id)
    on delete cascade,

  constraint trip_item_flight_event_provenance_reise_fk
    foreign key (trip_id, user_id)
    references public.trips (id, user_id)
    on delete cascade,

  constraint trip_item_flight_event_provenance_identity
    unique (trip_item_id, leg_index, segment_index, endpoint),

  constraint trip_item_flight_event_provenance_event_ref
    unique (occurrence_event_ref),

  constraint trip_item_flight_event_provenance_endpoint
    check (endpoint in ('departure', 'arrival')),

  constraint trip_item_flight_event_provenance_iata
    check (iata ~ '^[A-Z]{3}$'),

  constraint trip_item_flight_event_provenance_index_bounds
    check (
      leg_index >= 0
      and leg_index <= 99
      and segment_index >= 0
      and segment_index <= 99
    ),

  constraint trip_item_flight_event_provenance_source_kind
    check (source_kind = 'persisted_snapshot'),

  constraint trip_item_flight_event_provenance_persistenz
    check (persistenz = 'snapshot'),

  constraint trip_item_flight_event_provenance_provider_belegt
    check (provider_belegt),

  constraint trip_item_flight_event_provenance_provider_laenge
    check (char_length(btrim(provider_id)) between 1 and 40),

  constraint trip_item_flight_event_provenance_provider_nicht_erfunden
    check (lower(btrim(provider_id)) not in (
      'user', 'manual', 'jetnity', 'assistant', 'llm', 'system', 'unknown'
    )),

  constraint trip_item_flight_event_provenance_source_label_laenge
    check (source_label is null or char_length(source_label) <= 200),

  constraint trip_item_flight_event_provenance_external_ref_laenge
    check (char_length(btrim(external_ref)) between 1 and 200),

  constraint trip_item_flight_event_provenance_provider_source_ref
    check (
      provider_belegt
      and char_length(btrim(external_ref)) between 1 and 200
    ),

  constraint trip_item_flight_event_provenance_event_ref_laenge
    check (char_length(occurrence_event_ref) between 1 and 200),

  constraint trip_item_flight_event_provenance_time_zone_syntax
    check (
      char_length(time_zone) between 1 and 64
      and time_zone = btrim(time_zone)
      and time_zone !~ '[[:cntrl:]]'
      and time_zone !~ '\.\.'
      and time_zone !~ '\\'
      and time_zone !~ '://'
      and time_zone !~ '^/'
      and time_zone !~ '/$'
      and time_zone !~ '^[Zz]$'
      and time_zone !~ '^[+-][0-9]'
      and time_zone ~ '^[A-Za-z0-9_+\-/]+$'
    ),

  constraint trip_item_flight_event_provenance_fresh_until
    check (fresh_until is null or fresh_until >= retrieved_at),

  constraint trip_item_flight_event_provenance_observed_at
    check (observed_at = retrieved_at)
);

comment on table public.trip_item_flight_event_provenance is
  'E5-B3A Current-Snapshot je Flight-Occurrence. Eine Zeile = Item × Leg × Segment × Departure/Arrival. Keine Commercial-Felder, keine History, kein Backfill, kein Metadata-Store. Lokale Wanduhr, IANA-Zone und Instant bleiben getrennte Fakten. SQL ist kein DST-/Timezone-Resolver.';

comment on column public.trip_item_flight_event_provenance.trip_item_id is
  'Flight-Item. Lifecycle folgt dem trip_item. ON DELETE CASCADE, keine Waisen.';

comment on column public.trip_item_flight_event_provenance.trip_id is
  'Denormalisiert aus trip_items. Keine unabhängige Identität.';

comment on column public.trip_item_flight_event_provenance.user_id is
  'Denormalisiert aus trip_items. Owner-Read über auth.uid().';

comment on column public.trip_item_flight_event_provenance.snapshot_version is
  'Gemeinsame Write-Generation aller aktuellen Occurrences eines Items. Ein Refresh mintet eine neue Version und ersetzt den ganzen Satz.';

comment on column public.trip_item_flight_event_provenance.occurrence_event_ref is
  'Deterministische serverseitige Occurrence-Identität für späteres E5-A. Niemals aus Client-eventRef übernommen.';

comment on column public.trip_item_flight_event_provenance.leg_index is
  '0-basierter Leg-Index der gespeicherten Flight-Option. Teil der Occurrence-Identität.';

comment on column public.trip_item_flight_event_provenance.segment_index is
  '0-basierter Segment-Index innerhalb des Legs. Teil der Occurrence-Identität.';

comment on column public.trip_item_flight_event_provenance.endpoint is
  'Genau departure oder arrival. Verhindert Kollision derselben Segment-IATA an zwei Endpunkten.';

comment on column public.trip_item_flight_event_provenance.iata is
  'Exakter dreistelliger IATA-Code des Endpunkts. Keine IATA-/Land-/Stadt-Inferenz einer Zone.';

comment on column public.trip_item_flight_event_provenance.local_date is
  'Airport-lokales Kalenderdatum als Wanduhr-Fakt. Kein Instant und keine Zone.';

comment on column public.trip_item_flight_event_provenance.local_time is
  'Airport-lokale Uhrzeit ohne Zeitzone. Kein Z-Suffix, kein timestamptz.';

comment on column public.trip_item_flight_event_provenance.time_zone is
  'Explizit provider-beobachteter IANA-Identifier. Nur Syntaxgrenze. Kein DST-Resolver, keine IATA-Inferenz.';

comment on column public.trip_item_flight_event_provenance.event_instant is
  'Bereits eindeutig aufgelöster absoluter timestamptz. Wird nicht aus local_date/local_time/time_zone berechnet.';

comment on column public.trip_item_flight_event_provenance.source_kind is
  'Immer persisted_snapshot. Client-sourceKind wird nicht übernommen.';

comment on column public.trip_item_flight_event_provenance.provider_belegt is
  'Immer true. Ohne konkrete Provider-Source-Referenz external_ref keine belegte Provenance.';

comment on column public.trip_item_flight_event_provenance.external_ref is
  'Pflichtige konkrete Provider-Source-Referenz, analog FlugOption.externalRef. Nicht nullable. occurrence_event_ref ist keine Provider-Referenz.';

comment on column public.trip_item_flight_event_provenance.persistenz is
  'Immer snapshot. live_api wird durch Persistenz nicht vertrauenswürdig.';

create index trip_item_flight_event_provenance_owner_idx
  on public.trip_item_flight_event_provenance (user_id, trip_item_id);

create trigger trip_item_flight_event_provenance_aktualisiert_am
  before update on public.trip_item_flight_event_provenance
  for each row
  execute function public.setze_aktualisiert_am();

-- ---------------------------------------------------------------------------
-- 3. RLS + Grants: Owner-Read, kein Direct-Write, kein anon
-- ---------------------------------------------------------------------------

alter table public.trip_item_flight_event_provenance enable row level security;

create policy trip_item_flight_event_provenance_lesen
  on public.trip_item_flight_event_provenance
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.trip_items i
      where i.id = trip_item_id
        and i.user_id = (select auth.uid())
        and i.trip_id = trip_item_flight_event_provenance.trip_id
        and i.kind = 'flight'
    )
  );

revoke all on table public.trip_item_flight_event_provenance from public, anon, authenticated, service_role;
grant select on table public.trip_item_flight_event_provenance to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Kontrollierter Write (nicht exponiert)
-- ---------------------------------------------------------------------------

create or replace function jetnity_internal.trip_item_flight_event_provenance_schreiben(_eingabe jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  _item public.trip_items%rowtype;
  _uid uuid := (select auth.uid());
  _gate_allocated boolean := false;
  _gate_role name;
  _key text;
  _seen text[] := '{}';
  _occ jsonb;
  _snapshot_version uuid := gen_random_uuid();
  _provider_id text;
  _source_kind text;
  _source_label text;
  _external_ref text;
  _retrieved_at timestamptz;
  _observed_at timestamptz;
  _fresh_until timestamptz;
  _retrieved_text text;
  _observed_text text;
  _fresh_text text;
  _leg_index smallint;
  _segment_index smallint;
  _endpoint text;
  _iata text;
  _local_date date;
  _local_time time;
  _time_zone text;
  _event_instant timestamptz;
  _event_instant_text text;
  _local_date_text text;
  _local_time_text text;
  _event_ref text;
  _occurrence_count integer := 0;
  _absolute_instant_muster text :=
    '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,6})?(Z|[+-][0-9]{2}:[0-9]{2})$';
begin
  if _eingabe is null or jsonb_typeof(_eingabe) <> 'object' then
    raise exception 'Flight-Event-Provenance-Write braucht ein JSON-Objekt.'
      using errcode = '22023';
  end if;

  -- Rohe Client-/Browser-Felder dürfen nicht als Persistenzvertrag durchgehen.
  if (_eingabe ? 'sourceKind')
     or (_eingabe ? 'providerId')
     or (_eingabe ? 'externalRef')
     or (_eingabe ? 'retrievedAt')
     or (_eingabe ? 'observedAt')
     or (_eingabe ? 'freshUntil')
     or (_eingabe ? 'sourceLabel')
     or (_eingabe ? 'akteur')
     or (_eingabe ? 'actor')
     or (_eingabe ? 'eventRef')
     or (_eingabe ? 'event_ref')
     or (_eingabe ? 'occurrence_event_ref')
     or (_eingabe ? 'timeZone')
     or (_eingabe ? 'localDate')
     or (_eingabe ? 'localTime')
     or (_eingabe ? 'eventInstant')
     or (_eingabe ? 'instant')
     or (_eingabe ? 'trusted')
     or (_eingabe ? 'providerProven')
     or (_eingabe ? 'convertedAmount')
     or (_eingabe ? 'convertedCurrency')
  then
    raise exception 'unvalidated raw payload reject'
      using errcode = '22023';
  end if;

  if exists (
    select 1
      from jsonb_object_keys(_eingabe) as k(key)
     where k.key not in (
       'vertrag',
       'mint',
       'trip_item_id',
       'provider_id',
       'source_kind',
       'persistenz',
       'source_label',
       'external_ref',
       'retrieved_at',
       'observed_at',
       'fresh_until',
       'occurrences',
       'domain'
     )
  ) then
    raise exception 'unvalidated raw payload reject'
      using errcode = '22023';
  end if;

  if (_eingabe ->> 'vertrag') is distinct from 'jetnity.flight_event_persistence.v1'
     or (_eingabe ->> 'mint') is distinct from 'e5b2a_validated_snapshot'
  then
    raise exception 'unvalidated raw payload reject'
      using errcode = '22023';
  end if;

  select g.production_write_path_allocated, g.allocated_invoker_role
    into _gate_allocated, _gate_role
    from jetnity_internal.flight_event_write_runtime_gate g
   where g.singleton;

  if coalesce(_gate_allocated, false) is not true or _gate_role is null then
    raise exception 'production write path unallocated'
      using errcode = '42501';
  end if;

  if _uid is null then
    raise exception 'null principal reject'
      using errcode = '42501';
  end if;

  select *
    into _item
    from public.trip_items
   where id = nullif(_eingabe ->> 'trip_item_id', '')::uuid
   for update;

  if not found then
    raise exception 'trip_item nicht gefunden'
      using errcode = '22023';
  end if;

  if _item.user_id is distinct from _uid then
    raise exception 'Flight Event Provenance darf nur zur eigenen Reise gehören.'
      using errcode = '42501';
  end if;

  if _item.kind is distinct from 'flight' then
    raise exception 'non_flight reject'
      using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(_eingabe ->> 'domain', '')), '') is not null
     and btrim(_eingabe ->> 'domain') is distinct from 'flights' then
    raise exception 'wrong kind/domain reject'
      using errcode = '22023';
  end if;

  _source_kind := nullif(btrim(coalesce(_eingabe ->> 'source_kind', '')), '');
  if _source_kind is null then
    _source_kind := 'persisted_snapshot';
  end if;
  if _source_kind is distinct from 'persisted_snapshot' then
    raise exception 'forged source reject'
      using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(_eingabe ->> 'persistenz', '')), '') is not null
     and btrim(_eingabe ->> 'persistenz') is distinct from 'snapshot' then
    raise exception 'forged source reject'
      using errcode = '22023';
  end if;

  _provider_id := nullif(btrim(coalesce(_eingabe ->> 'provider_id', '')), '');
  if _provider_id is null then
    raise exception 'missing_provider'
      using errcode = '22023';
  end if;
  if lower(_provider_id) in ('user', 'manual', 'jetnity', 'assistant', 'llm', 'system', 'unknown') then
    raise exception 'erfundene_provider_id'
      using errcode = '22023';
  end if;

  _source_label := nullif(btrim(coalesce(_eingabe ->> 'source_label', '')), '');
  _external_ref := nullif(btrim(coalesce(_eingabe ->> 'external_ref', '')), '');
  if _external_ref is null then
    raise exception 'missing_external_ref'
      using errcode = '22023';
  end if;
  if char_length(_external_ref) > 200 then
    raise exception 'invalid_external_ref'
      using errcode = '22023';
  end if;

  if jsonb_typeof(_eingabe -> 'occurrences') is distinct from 'array' then
    raise exception 'invalid_occurrences'
      using errcode = '22023';
  end if;

  if jsonb_array_length(_eingabe -> 'occurrences') > 200 then
    raise exception 'too_many_occurrences'
      using errcode = '22023';
  end if;

  _retrieved_text := nullif(coalesce(_eingabe ->> 'retrieved_at', ''), '');
  if _retrieved_text is null or _retrieved_text !~ _absolute_instant_muster then
    raise exception 'invalid_retrieved_at' using errcode = '22023';
  end if;
  begin
    _retrieved_at := _retrieved_text::timestamptz;
  exception when others then
    raise exception 'invalid_retrieved_at' using errcode = '22023';
  end;
  if _retrieved_at > clock_timestamp() + interval '5 minutes' then
    raise exception 'retrieved_at_in_future' using errcode = '22023';
  end if;

  _observed_text := nullif(coalesce(_eingabe ->> 'observed_at', ''), '');
  if _observed_text is null then
    _observed_at := _retrieved_at;
  else
    if _observed_text !~ _absolute_instant_muster then
      raise exception 'invalid_observed_at' using errcode = '22023';
    end if;
    begin
      _observed_at := _observed_text::timestamptz;
    exception when others then
      raise exception 'invalid_observed_at' using errcode = '22023';
    end;
  end if;
  if _observed_at is distinct from _retrieved_at then
    raise exception 'observed_at_mismatch' using errcode = '22023';
  end if;

  _fresh_text := nullif(coalesce(_eingabe ->> 'fresh_until', ''), '');
  if _fresh_text is not null then
    if _fresh_text !~ _absolute_instant_muster then
      raise exception 'invalid_fresh_until' using errcode = '22023';
    end if;
    begin
      _fresh_until := _fresh_text::timestamptz;
    exception when others then
      raise exception 'invalid_fresh_until' using errcode = '22023';
    end;
    if _fresh_until < _retrieved_at then
      raise exception 'fresh_until_before_retrieved_at' using errcode = '22023';
    end if;
  end if;

  -- Pass 1: Occurrence-Identität und getrennte Zeitfakten prüfen.
  -- Keine Zeitzonenrechnung, kein AT TIME ZONE, kein Z an lokale Strings.
  for _occ in
    select value
      from jsonb_array_elements(_eingabe -> 'occurrences')
  loop
    if _occ is null or jsonb_typeof(_occ) <> 'object' then
      raise exception 'invalid_occurrence' using errcode = '22023';
    end if;

    if (_occ ? 'eventRef')
       or (_occ ? 'event_ref')
       or (_occ ? 'occurrence_event_ref')
       or (_occ ? 'akteur')
       or (_occ ? 'actor')
       or (_occ ? 'trusted')
       or (_occ ? 'providerProven')
       or (_occ ? 'timeZone')
       or (_occ ? 'localDate')
       or (_occ ? 'localTime')
       or (_occ ? 'eventInstant')
       or (_occ ? 'instant')
       or (_occ ? 'sourceKind')
    then
      raise exception 'unvalidated raw payload reject'
        using errcode = '22023';
    end if;

    if exists (
      select 1
        from jsonb_object_keys(_occ) as k(key)
       where k.key not in (
         'leg_index',
         'segment_index',
         'endpoint',
         'iata',
         'local_date',
         'local_time',
         'time_zone',
         'event_instant'
       )
    ) then
      raise exception 'unvalidated raw payload reject'
        using errcode = '22023';
    end if;

    begin
      _leg_index := (_occ ->> 'leg_index')::smallint;
      _segment_index := (_occ ->> 'segment_index')::smallint;
    exception when others then
      raise exception 'malformed occurrence identity' using errcode = '22023';
    end;
    if _leg_index is null or _segment_index is null
       or _leg_index < 0 or _segment_index < 0
       or _leg_index > 99 or _segment_index > 99 then
      raise exception 'malformed occurrence identity' using errcode = '22023';
    end if;

    _endpoint := nullif(btrim(coalesce(_occ ->> 'endpoint', '')), '');
    if _endpoint is distinct from 'departure' and _endpoint is distinct from 'arrival' then
      raise exception 'malformed occurrence identity' using errcode = '22023';
    end if;

    _iata := coalesce(_occ ->> 'iata', '');
    if _iata !~ '^[A-Z]{3}$' then
      raise exception 'invalid_iata' using errcode = '22023';
    end if;

    _key := _leg_index::text || '/' || _segment_index::text || '/' || _endpoint;
    if _key = any(_seen) then
      raise exception 'occurrence_identity_collision' using errcode = '22023';
    end if;
    _seen := array_append(_seen, _key);

    _local_date_text := coalesce(_occ ->> 'local_date', '');
    _local_time_text := coalesce(_occ ->> 'local_time', '');
    if _local_date_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'invalid_local_date' using errcode = '22023';
    end if;
    if _local_time_text !~ '^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$' then
      raise exception 'invalid_local_time' using errcode = '22023';
    end if;
    begin
      _local_date := _local_date_text::date;
      _local_time := _local_time_text::time;
    exception when others then
      raise exception 'invalid_local_wall_clock' using errcode = '22023';
    end;

    _time_zone := coalesce(_occ ->> 'time_zone', '');
    if _time_zone is distinct from btrim(_time_zone)
       or char_length(_time_zone) not between 1 and 64
       or _time_zone ~ '[[:cntrl:]]'
       or _time_zone ~ '\.\.'
       or _time_zone ~ '\\'
       or _time_zone ~ '://'
       or _time_zone ~ '^/'
       or _time_zone ~ '/$'
       or _time_zone ~ '^[Zz]$'
       or _time_zone ~ '^[+-][0-9]'
       or _time_zone !~ '^[A-Za-z0-9_+\-/]+$'
    then
      raise exception 'invalid_time_zone' using errcode = '22023';
    end if;

    _event_instant_text := coalesce(_occ ->> 'event_instant', '');
    if _event_instant_text !~ _absolute_instant_muster then
      raise exception 'invalid_event_instant' using errcode = '22023';
    end if;
    begin
      _event_instant := _event_instant_text::timestamptz;
    exception when others then
      raise exception 'invalid_event_instant' using errcode = '22023';
    end;

    _occurrence_count := _occurrence_count + 1;
  end loop;

  -- Atomarer Current-Snapshot: zuerst den alten Satz entfernen.
  -- Ein leerer neuer Satz ist gültig und hinterlässt keine stale Zeilen.
  delete from public.trip_item_flight_event_provenance
   where trip_item_id = _item.id;

  for _occ in
    select value
      from jsonb_array_elements(_eingabe -> 'occurrences')
  loop
    _leg_index := (_occ ->> 'leg_index')::smallint;
    _segment_index := (_occ ->> 'segment_index')::smallint;
    _endpoint := _occ ->> 'endpoint';
    _iata := _occ ->> 'iata';
    _local_date := (_occ ->> 'local_date')::date;
    _local_time := (_occ ->> 'local_time')::time;
    _time_zone := _occ ->> 'time_zone';
    _event_instant := (_occ ->> 'event_instant')::timestamptz;
    _event_ref :=
      'jetnity.flight_event.v1:'
      || _item.id::text
      || ':'
      || _leg_index::text
      || ':'
      || _segment_index::text
      || ':'
      || _endpoint
      || ':'
      || _iata;

    insert into public.trip_item_flight_event_provenance (
      trip_item_id, trip_id, user_id, snapshot_version, occurrence_event_ref,
      leg_index, segment_index, endpoint, iata,
      local_date, local_time, time_zone, event_instant,
      provider_id, provider_belegt, source_kind, source_label, external_ref,
      retrieved_at, observed_at, fresh_until, persistenz
    ) values (
      _item.id, _item.trip_id, _item.user_id, _snapshot_version, _event_ref,
      _leg_index, _segment_index, _endpoint, _iata,
      _local_date, _local_time, _time_zone, _event_instant,
      _provider_id, true, 'persisted_snapshot', _source_label, _external_ref,
      _retrieved_at, _observed_at, _fresh_until, 'snapshot'
    );
  end loop;

  return jsonb_build_object(
    'ok', true,
    'trip_item_id', _item.id,
    'snapshot_version', _snapshot_version,
    'occurrence_count', _occurrence_count,
    'source_kind', 'persisted_snapshot',
    'persistenz', 'snapshot',
    'provider_id', _provider_id
  );
end
$$;

comment on function jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb) is
  'E5-B3A privilegierter Flight-Event-Write. SECURITY DEFINER, search_path leer, nicht in public. Nimmt nur jetnity.flight_event_persistence.v1 / e5b2a_validated_snapshot. Erzeugt occurrence_event_ref serverseitig. Ersetzt den Current-Snapshot eines Flight-Items atomar. Fail-closed ohne auth.uid(), bei Non-Flight und bei geschlossenem Runtime-Gate. EXECUTE nur jetnity_flight_event_writer. KEIN Production-Write-Pfad, solange jetnity_internal.flight_event_write_runtime_gate.production_write_path_allocated=false. Kein Service-Role-Pfad. SQL rechnet keine Zeitzone.';

revoke all on function jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)
  to jetnity_flight_event_writer;
