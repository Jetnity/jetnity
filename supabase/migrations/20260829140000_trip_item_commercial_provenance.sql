-- S5-B Persistence Foundation (ADR-0197 / ADR-0198 / Option C)
--
-- Eigene Relation public.trip_item_commercial_provenance: höchstens ein
-- Current-Snapshot je trip_item_id. Persistiert nur S5-A-Evidence.
-- CommercialBewertung wird nicht gespeichert.
--
-- Write-Authority: authenticated/anon haben kein INSERT/UPDATE/DELETE.
-- Kontrollierter Write nur über jetnity_internal.trip_item_commercial_provenance_schreiben
-- als SECURITY DEFINER, nicht im PostgREST-Schema, search_path='',
-- PUBLIC/anon/authenticated/service_role ohne EXECUTE.
--
-- Kein Backfill. Keine History. Kein Production-Apply durch Cursor.
-- Flight-Guard-Triggername bleibt trip_items_flug_handelsfelder_schuetzen.

-- ---------------------------------------------------------------------------
-- 1. Privates Schema + NOLOGIN-Writer-Rolle
-- ---------------------------------------------------------------------------

create schema if not exists jetnity_internal;

comment on schema jetnity_internal is
  'Nicht exponiertes Schema für privilegierte S5-B-Writes. Nicht in [api].schemas. Kein PostgREST-RPC.';

revoke all on schema jetnity_internal from public, anon, authenticated, service_role;
grant usage on schema jetnity_internal to postgres;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'jetnity_commercial_writer') then
    create role jetnity_commercial_writer nologin;
  end if;
end
$$;

comment on role jetnity_commercial_writer is
  'NOLOGIN, nicht PostgREST. Einziger EXECUTE-Träger für den S5-B-Provenance-Write. Kein Login, kein Secret, kein Service-Role-Ersatz.';

grant usage on schema jetnity_internal to jetnity_commercial_writer;
revoke usage on schema jetnity_internal from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Current-Snapshot-Relation
-- ---------------------------------------------------------------------------

create table public.trip_item_commercial_provenance (
  trip_item_id uuid primary key,
  trip_id uuid not null,
  user_id uuid not null,
  domain text not null,
  provider_id text not null,
  provider_belegt boolean not null default true,
  source_kind text not null default 'persisted_snapshot',
  source_label text,
  external_ref text,
  provider_offer_id text,
  retrieved_at timestamptz not null,
  observed_at timestamptz not null,
  fresh_until timestamptz,
  requested_currency text,
  quoted_currency text,
  amount numeric,
  amount_status text not null default 'missing',
  persistenz text not null default 'snapshot',
  affiliate_status text not null default 'unknown',
  affiliate_partner_id text,
  affiliate_click_id text,
  affiliate_attribution_ref text,
  availability_status text not null default 'unknown',
  vergleichsschluessel text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_item_commercial_provenance_item_fk
    foreign key (trip_item_id)
    references public.trip_items (id)
    on delete cascade,

  constraint trip_item_commercial_provenance_reise_fk
    foreign key (trip_id, user_id)
    references public.trips (id, user_id)
    on delete cascade,

  constraint trip_item_commercial_provenance_domain_werte
    check (domain in ('flights', 'hotels', 'activities', 'mobility', 'rental_cars')),

  constraint trip_item_commercial_provenance_source_kind
    check (source_kind = 'persisted_snapshot'),

  constraint trip_item_commercial_provenance_persistenz
    check (persistenz = 'snapshot'),

  constraint trip_item_commercial_provenance_provider_belegt
    check (provider_belegt),

  constraint trip_item_commercial_provenance_provider_laenge
    check (char_length(btrim(provider_id)) between 1 and 40),

  constraint trip_item_commercial_provenance_provider_nicht_erfunden
    check (lower(btrim(provider_id)) not in (
      'user', 'manual', 'jetnity', 'assistant', 'llm', 'system', 'unknown'
    )),

  constraint trip_item_commercial_provenance_source_label_laenge
    check (source_label is null or char_length(source_label) <= 200),

  constraint trip_item_commercial_provenance_external_ref_laenge
    check (external_ref is null or char_length(btrim(external_ref)) between 1 and 200),

  constraint trip_item_commercial_provenance_offer_id_laenge
    check (provider_offer_id is null or char_length(btrim(provider_offer_id)) between 1 and 200),

  constraint trip_item_commercial_provenance_amount_status
    check (amount_status in ('quoted', 'missing', 'error')),

  constraint trip_item_commercial_provenance_amount_paar
    check (
      (amount_status = 'quoted' and amount is not null and amount >= 0)
      or (amount_status in ('missing', 'error') and amount is null)
    ),

  constraint trip_item_commercial_provenance_currency_format
    check (
      (requested_currency is null or requested_currency ~ '^[A-Z]{3}$')
      and (quoted_currency is null or quoted_currency ~ '^[A-Z]{3}$')
    ),

  constraint trip_item_commercial_provenance_fresh_until
    check (fresh_until is null or fresh_until >= retrieved_at),

  constraint trip_item_commercial_provenance_observed_at
    check (observed_at = retrieved_at),

  constraint trip_item_commercial_provenance_affiliate_status
    check (affiliate_status in ('unknown', 'absent', 'present')),

  constraint trip_item_commercial_provenance_affiliate_beleg
    check (
      (
        affiliate_status = 'present'
        and (
          affiliate_partner_id is not null
          or affiliate_click_id is not null
          or affiliate_attribution_ref is not null
        )
      )
      or (
        affiliate_status = 'absent'
        and affiliate_partner_id is null
        and affiliate_click_id is null
        and affiliate_attribution_ref is null
      )
      or affiliate_status = 'unknown'
    ),

  constraint trip_item_commercial_provenance_availability
    check (availability_status in ('unknown', 'unavailable')),

  constraint trip_item_commercial_provenance_vergleich_laenge
    check (vergleichsschluessel is null or char_length(vergleichsschluessel) <= 200)
);

comment on table public.trip_item_commercial_provenance is
  'S5-B Current-Snapshot je trip_item. Nur persistierte S5-A-Evidence. Keine Bewertung, keine History, kein note, kein Backfill. Dieselbe Provider+Ref darf auf mehreren Items stehen.';

comment on column public.trip_item_commercial_provenance.trip_item_id is
  '1:1-Slot. Lifecycle folgt dem trip_item. ON DELETE CASCADE, keine Waisen.';

comment on column public.trip_item_commercial_provenance.trip_id is
  'Denormalisiert aus trip_items. Keine unabhängige Identität.';

comment on column public.trip_item_commercial_provenance.user_id is
  'Denormalisiert aus trip_items. Owner-Read über auth.uid().';

comment on column public.trip_item_commercial_provenance.source_kind is
  'Immer persisted_snapshot. Client-sourceKind wird nicht übernommen.';

comment on column public.trip_item_commercial_provenance.persistenz is
  'Immer snapshot. live_api wird durch Persistenz nicht vertrauenswürdig.';

create trigger trip_item_commercial_provenance_aktualisiert_am
  before update on public.trip_item_commercial_provenance
  for each row
  execute function public.setze_aktualisiert_am();

-- ---------------------------------------------------------------------------
-- 3. RLS + Grants: Owner-Read, kein Direct-Write, kein anon
-- ---------------------------------------------------------------------------

alter table public.trip_item_commercial_provenance enable row level security;

create policy trip_item_commercial_provenance_lesen
  on public.trip_item_commercial_provenance
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.trip_items i
      where i.id = trip_item_id
        and i.user_id = (select auth.uid())
        and i.trip_id = trip_item_commercial_provenance.trip_id
    )
  );

revoke all on table public.trip_item_commercial_provenance from public, anon, authenticated, service_role;
grant select on table public.trip_item_commercial_provenance to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Kontrollierter Write (nicht exponiert)
-- ---------------------------------------------------------------------------

create or replace function jetnity_internal.trip_item_commercial_provenance_schreiben(_eingabe jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  _item public.trip_items%rowtype;
  _bestehend public.trip_item_commercial_provenance%rowtype;
  _uid uuid := (select auth.uid());
  _kind text;
  _domain text;
  _source_kind text;
  _akteur text;
  _provider_id text;
  _source_label text;
  _external_ref text;
  _offer_id text;
  _retrieved_at timestamptz;
  _observed_at timestamptz;
  _fresh_until timestamptz;
  _requested_currency text;
  _quoted_currency text;
  _amount numeric;
  _amount_status text;
  _affiliate_status text;
  _affiliate_partner text;
  _affiliate_click text;
  _affiliate_ref text;
  _availability text;
  _vergleich text;
  _hat_affiliate_beleg boolean;
begin
  if _eingabe is null or jsonb_typeof(_eingabe) <> 'object' then
    raise exception 'Commercial-Provenance-Write braucht ein JSON-Objekt.'
      using errcode = '22023';
  end if;

  if (_eingabe ? 'convertedAmount') or (_eingabe ? 'convertedCurrency') or (_eingabe ? 'conversionEvidence') then
    raise exception 'conversion_without_evidence'
      using errcode = '22023';
  end if;

  select *
    into _item
    from public.trip_items
   where id = nullif(_eingabe ->> 'trip_item_id', '')::uuid;

  if not found then
    raise exception 'trip_item nicht gefunden'
      using errcode = '22023';
  end if;

  if _uid is not null and _item.user_id is distinct from _uid then
    raise exception 'Commercial Provenance darf nur zur eigenen Reise gehören.'
      using errcode = '42501';
  end if;

  _kind := _item.kind;
  if _kind = 'note' then
    raise exception 'note reject'
      using errcode = '22023';
  end if;

  _domain := case _kind
    when 'flight' then 'flights'
    when 'stay' then 'hotels'
    when 'activity' then 'activities'
    when 'transfer' then 'mobility'
    when 'rental_car' then 'rental_cars'
    else null
  end;

  if _domain is null then
    raise exception 'wrong kind/domain reject'
      using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(_eingabe ->> 'domain', '')), '') is not null
     and btrim(_eingabe ->> 'domain') is distinct from _domain then
    raise exception 'wrong kind/domain reject'
      using errcode = '22023';
  end if;

  _akteur := nullif(btrim(coalesce(_eingabe ->> 'akteur', '')), '');
  if _akteur is not null and _akteur is distinct from 'provider_adapter' then
    raise exception 'forged actor reject'
      using errcode = '22023';
  end if;

  _source_kind := nullif(btrim(coalesce(_eingabe ->> 'sourceKind', _eingabe ->> 'source_kind')), '');
  if _source_kind in ('user_intake', 'manual', 'assistant', 'llm') then
    raise exception 'forged source reject'
      using errcode = '22023';
  end if;

  _provider_id := nullif(btrim(coalesce(_eingabe ->> 'providerId', _eingabe ->> 'provider_id')), '');
  if _provider_id is null then
    raise exception 'missing_provider'
      using errcode = '22023';
  end if;
  if lower(_provider_id) in ('user', 'manual', 'jetnity', 'assistant', 'llm', 'system', 'unknown') then
    raise exception 'erfundene_provider_id'
      using errcode = '22023';
  end if;

  _source_label := nullif(btrim(coalesce(_eingabe ->> 'sourceLabel', _eingabe ->> 'source_label')), '');
  _external_ref := nullif(btrim(coalesce(_eingabe ->> 'externalRef', _eingabe ->> 'external_ref')), '');
  _offer_id := nullif(btrim(coalesce(_eingabe ->> 'providerOfferId', _eingabe ->> 'provider_offer_id')), '');

  begin
    _retrieved_at := nullif(
      coalesce(_eingabe ->> 'retrievedAt', _eingabe ->> 'retrieved_at'),
      ''
    )::timestamptz;
  exception when others then
    raise exception 'invalid_retrieved_at' using errcode = '22023';
  end;
  if _retrieved_at is null then
    raise exception 'invalid_retrieved_at' using errcode = '22023';
  end if;
  if _retrieved_at > clock_timestamp() + interval '5 minutes' then
    raise exception 'retrieved_at_in_future' using errcode = '22023';
  end if;

  begin
    _observed_at := nullif(
      coalesce(_eingabe ->> 'observedAt', _eingabe ->> 'observed_at'),
      ''
    )::timestamptz;
  exception when others then
    raise exception 'invalid_observed_at' using errcode = '22023';
  end;
  _observed_at := coalesce(_observed_at, _retrieved_at);
  if _observed_at is distinct from _retrieved_at then
    raise exception 'observed_at_mismatch' using errcode = '22023';
  end if;

  begin
    _fresh_until := nullif(
      coalesce(_eingabe ->> 'freshUntil', _eingabe ->> 'fresh_until'),
      ''
    )::timestamptz;
  exception when others then
    raise exception 'invalid_fresh_until' using errcode = '22023';
  end;
  if _fresh_until is not null and _fresh_until < _retrieved_at then
    raise exception 'fresh_until_before_retrieved_at' using errcode = '22023';
  end if;

  _requested_currency := nullif(upper(btrim(coalesce(
    _eingabe ->> 'requestedCurrency', _eingabe ->> 'requested_currency', ''
  ))), '');
  _quoted_currency := nullif(upper(btrim(coalesce(
    _eingabe ->> 'quotedCurrency', _eingabe ->> 'quoted_currency', ''
  ))), '');
  if _requested_currency is not null and _requested_currency !~ '^[A-Z]{3}$' then
    raise exception 'invalid_currency' using errcode = '22023';
  end if;
  if _quoted_currency is not null and _quoted_currency !~ '^[A-Z]{3}$' then
    raise exception 'invalid_currency' using errcode = '22023';
  end if;

  begin
    _amount := nullif(coalesce(_eingabe ->> 'amount', ''), '')::numeric;
  exception when others then
    raise exception 'invalid_amount' using errcode = '22023';
  end;
  if _amount is not null and _amount < 0 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  _amount_status := nullif(btrim(coalesce(_eingabe ->> 'amountStatus', _eingabe ->> 'amount_status')), '');
  if _amount_status is null then
    _amount_status := case when _amount is null then 'missing' else 'quoted' end;
  end if;
  if _amount_status not in ('quoted', 'missing', 'error') then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;
  if _amount_status = 'quoted' and _amount is null then
    raise exception 'amount_status_widerspruch' using errcode = '22023';
  end if;
  if _amount_status in ('missing', 'error') and _amount is not null then
    raise exception 'amount_status_widerspruch' using errcode = '22023';
  end if;

  _affiliate_partner := nullif(btrim(coalesce(
    _eingabe #>> '{affiliate,partnerId}',
    _eingabe ->> 'affiliate_partner_id',
    ''
  )), '');
  _affiliate_click := nullif(btrim(coalesce(
    _eingabe #>> '{affiliate,clickId}',
    _eingabe ->> 'affiliate_click_id',
    ''
  )), '');
  _affiliate_ref := nullif(btrim(coalesce(
    _eingabe #>> '{affiliate,attributionRef}',
    _eingabe ->> 'affiliate_attribution_ref',
    ''
  )), '');
  _hat_affiliate_beleg := _affiliate_partner is not null
    or _affiliate_click is not null
    or _affiliate_ref is not null;
  _affiliate_status := nullif(btrim(coalesce(
    _eingabe #>> '{affiliate,status}',
    _eingabe ->> 'affiliate_status',
    ''
  )), '');
  if _affiliate_status is null then
    _affiliate_status := case when _hat_affiliate_beleg then 'present' else 'unknown' end;
  end if;
  if _affiliate_status = 'present' and not _hat_affiliate_beleg then
    raise exception 'invalid_affiliate_claim' using errcode = '22023';
  end if;
  if _affiliate_status = 'absent' and _hat_affiliate_beleg then
    raise exception 'invalid_affiliate_claim' using errcode = '22023';
  end if;
  if _affiliate_status not in ('unknown', 'absent', 'present') then
    raise exception 'invalid_affiliate_claim' using errcode = '22023';
  end if;
  if _affiliate_status = 'absent' then
    _affiliate_partner := null;
    _affiliate_click := null;
    _affiliate_ref := null;
  end if;

  _availability := nullif(btrim(coalesce(
    _eingabe ->> 'availability',
    _eingabe ->> 'availabilityStatus',
    _eingabe ->> 'availability_status',
    ''
  )), '');
  if _availability is distinct from 'unavailable' then
    _availability := 'unknown';
  end if;

  _vergleich := nullif(btrim(coalesce(
    _eingabe ->> 'vergleichsschluessel', ''
  )), '');

  select * into _bestehend
    from public.trip_item_commercial_provenance
   where trip_item_id = _item.id;

  if found then
    if _bestehend.domain is distinct from _domain
       or _bestehend.provider_id is distinct from _provider_id
       or _bestehend.external_ref is null
       or _external_ref is null
       or _bestehend.external_ref is distinct from _external_ref then
      raise exception 'refresh_identity_mismatch' using errcode = '22023';
    end if;
  end if;

  insert into public.trip_item_commercial_provenance (
    trip_item_id, trip_id, user_id, domain,
    provider_id, provider_belegt, source_kind, source_label,
    external_ref, provider_offer_id,
    retrieved_at, observed_at, fresh_until,
    requested_currency, quoted_currency,
    amount, amount_status, persistenz,
    affiliate_status, affiliate_partner_id, affiliate_click_id, affiliate_attribution_ref,
    availability_status, vergleichsschluessel
  ) values (
    _item.id, _item.trip_id, _item.user_id, _domain,
    _provider_id, true, 'persisted_snapshot', _source_label,
    _external_ref, _offer_id,
    _retrieved_at, _observed_at, _fresh_until,
    _requested_currency, _quoted_currency,
    _amount, _amount_status, 'snapshot',
    _affiliate_status, _affiliate_partner, _affiliate_click, _affiliate_ref,
    _availability, _vergleich
  )
  on conflict (trip_item_id) do update set
    provider_id = excluded.provider_id,
    source_label = excluded.source_label,
    external_ref = excluded.external_ref,
    provider_offer_id = excluded.provider_offer_id,
    retrieved_at = excluded.retrieved_at,
    observed_at = excluded.observed_at,
    fresh_until = excluded.fresh_until,
    requested_currency = excluded.requested_currency,
    quoted_currency = excluded.quoted_currency,
    amount = excluded.amount,
    amount_status = excluded.amount_status,
    affiliate_status = excluded.affiliate_status,
    affiliate_partner_id = excluded.affiliate_partner_id,
    affiliate_click_id = excluded.affiliate_click_id,
    affiliate_attribution_ref = excluded.affiliate_attribution_ref,
    availability_status = excluded.availability_status,
    vergleichsschluessel = excluded.vergleichsschluessel,
    updated_at = now();

  -- Kontrollierte Display-Projektion. booking_url wird nicht erfunden.
  update public.trip_items
     set provider = _provider_id,
         external_ref = _external_ref,
         price_amount = case
           when _amount is not null and _quoted_currency is not null then _amount
           else null
         end,
         price_currency = case
           when _amount is not null and _quoted_currency is not null then _quoted_currency
           else null
         end
   where id = _item.id;

  return jsonb_build_object(
    'ok', true,
    'trip_item_id', _item.id,
    'domain', _domain,
    'source_kind', 'persisted_snapshot',
    'persistenz', 'snapshot',
    'provider_id', _provider_id,
    'external_ref', _external_ref
  );
end
$$;

comment on function jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb) is
  'S5-B privilegierter Write. SECURITY DEFINER, search_path leer, nicht in public. Mintet nur persisted_snapshot/snapshot. Prüft Ownership, Kind/Domain, Actor/Source und Refresh-Identität. Kein Service-Role-Pfad.';

revoke all on function jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)
  to jetnity_commercial_writer;

-- ---------------------------------------------------------------------------
-- 5. Legacy-Guard-Matrix. Flight-Triggername bleibt unverändert.
-- ---------------------------------------------------------------------------

create or replace function public.trip_items_flug_handelsfelder_schuetzen()
returns trigger
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.kind in ('flight', 'stay', 'activity', 'note') then
      new.price_amount := null;
      new.price_currency := null;
      new.provider := null;
      new.external_ref := null;
      new.booking_url := null;
    elsif new.kind in ('transfer', 'rental_car') then
      new.provider := null;
      new.external_ref := null;
      new.booking_url := null;
    end if;
    return new;
  end if;

  if new.kind = 'flight' then
    if old.kind is distinct from 'flight' then
      new.price_amount := null;
      new.price_currency := null;
      new.provider := null;
      new.external_ref := null;
      new.booking_url := null;
    else
      new.price_amount := old.price_amount;
      new.price_currency := old.price_currency;
      new.provider := old.provider;
      new.external_ref := old.external_ref;
      new.booking_url := old.booking_url;
    end if;
    return new;
  end if;

  if new.kind in ('stay', 'activity', 'note') then
    if old.kind is distinct from new.kind then
      new.price_amount := null;
      new.price_currency := null;
      new.provider := null;
      new.external_ref := null;
      new.booking_url := null;
    else
      new.price_amount := old.price_amount;
      new.price_currency := old.price_currency;
      new.provider := old.provider;
      new.external_ref := old.external_ref;
      new.booking_url := old.booking_url;
    end if;
    return new;
  end if;

  if new.kind in ('transfer', 'rental_car') then
    if old.kind is distinct from new.kind then
      new.provider := null;
      new.external_ref := null;
      new.booking_url := null;
    else
      new.provider := old.provider;
      new.external_ref := old.external_ref;
      new.booking_url := old.booking_url;
    end if;
  end if;

  return new;
end
$$;

comment on function public.trip_items_flug_handelsfelder_schuetzen() is
  'S5-B Guard-Matrix auf direkten authenticated/anon trip_items-Writes. Flight unverändert fail-closed. Stay/Activity/Note: ganze Legacy-Menge. Transfer/Rental: provider/external_ref/booking_url untrusted, User-Intake-Preis bleibt. Trusted Writes brauchen jetnity_internal.trip_item_commercial_provenance_schreiben.';

revoke all on function public.trip_items_flug_handelsfelder_schuetzen() from public, anon, authenticated;

drop trigger if exists trip_items_flug_handelsfelder_schuetzen on public.trip_items;
create trigger trip_items_flug_handelsfelder_schuetzen
  before insert or update of price_amount, price_currency, provider, external_ref, booking_url, kind
  on public.trip_items
  for each row
  execute function public.trip_items_flug_handelsfelder_schuetzen();

-- ---------------------------------------------------------------------------
-- 6. reise_anlegen: untrusted JSON darf keine Provider-Hard-Truth mehr setzen
-- ---------------------------------------------------------------------------

create or replace function public.reise_anlegen(_reise jsonb)
returns uuid
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
declare
  _uid uuid := (select auth.uid());
  _client_ref text;
  _trip_id uuid;
  _etappen jsonb;
  _tage jsonb;
  _ungeplante jsonb;
  _punkte integer;
  _assignment_mode text;
  _claimed_mode text;
  _stage_count integer;
  _has_valid_position boolean;
  _invalid_position boolean;
begin
  if _uid is null then
    raise exception 'Um eine Reise zu speichern, ist eine Anmeldung erforderlich.'
      using errcode = '42501';
  end if;

  if _reise is null or jsonb_typeof(_reise) <> 'object' then
    raise exception 'Die Reise muss ein JSON-Objekt sein.' using errcode = '22023';
  end if;

  if pg_column_size(_reise) > 262144 then
    raise exception 'Die Reise ist zu gross.' using errcode = '22023';
  end if;

  _client_ref := _reise ->> 'client_ref';
  if _client_ref is null or char_length(_client_ref) not between 1 and 64 then
    raise exception 'Die Reise trägt keine brauchbare Kennung.' using errcode = '22023';
  end if;

  _etappen := coalesce(_reise -> 'stages', '[]'::jsonb);
  _tage := coalesce(_reise -> 'days', '[]'::jsonb);
  _ungeplante := coalesce(_reise -> 'ungeplante', '[]'::jsonb);

  if jsonb_typeof(_etappen) <> 'array'
     or jsonb_typeof(_tage) <> 'array'
     or jsonb_typeof(_ungeplante) <> 'array' then
    raise exception 'stages, days und ungeplante müssen Listen sein.' using errcode = '22023';
  end if;

  if jsonb_array_length(_etappen) > 50 then
    raise exception 'Eine Reise trägt höchstens 50 Etappen.' using errcode = '22023';
  end if;

  if jsonb_array_length(_tage) > 366 then
    raise exception 'Eine Reise trägt höchstens 366 Tage.' using errcode = '22023';
  end if;

  select coalesce(sum(jsonb_array_length(coalesce(t.wert -> 'items', '[]'::jsonb))), 0)
         + jsonb_array_length(_ungeplante)
    into _punkte
    from jsonb_array_elements(_tage) as t(wert);

  if _punkte > 1000 then
    raise exception 'Eine Reise trägt höchstens 1000 Planpunkte.' using errcode = '22023';
  end if;

  _stage_count := jsonb_array_length(_etappen);
  _claimed_mode := nullif(btrim(coalesce(
    _reise ->> 'day_stage_assignment_mode',
    _reise ->> 'day_stage_assignment_source',
    ''
  )), '');
  if _claimed_mode is not null
     and _claimed_mode not in (
       'legacy_fallback', 'unassigned', 'single_destination', 'explicit', 'user'
     ) then
    raise exception 'Die Tageszuordnung ist ungültig.' using errcode = '22023';
  end if;

  select exists (
    select 1
      from jsonb_array_elements(_tage) as t(wert)
     where nullif(btrim(coalesce(t.wert ->> 'stage_position', '')), '') is not null
       and (
         btrim(t.wert ->> 'stage_position') !~ '^[0-9]+$'
         or (btrim(t.wert ->> 'stage_position'))::smallint < 1
         or (btrim(t.wert ->> 'stage_position'))::smallint > greatest(_stage_count, 0)
         or not exists (
           select 1
             from jsonb_array_elements(_etappen) with ordinality as e(wert, nr)
            where coalesce((e.wert ->> 'position')::smallint, e.nr::smallint)
                  = (btrim(t.wert ->> 'stage_position'))::smallint
         )
       )
  ) into _invalid_position;
  if _invalid_position then
    raise exception 'Die Tageszuordnung ist ungültig.' using errcode = '22023';
  end if;

  select exists (
    select 1
      from jsonb_array_elements(_tage) as t(wert)
     where nullif(btrim(coalesce(t.wert ->> 'stage_position', '')), '') is not null
  ) into _has_valid_position;

  -- Kanonische Ableitung, identisch zu dayStageAssignmentModeAbleiten().
  -- Neue Requests minten niemals legacy_fallback.
  -- single_destination gilt nur bei genau einer Stage. 0 Stages sind fail-closed.
  if _stage_count < 1 then
    raise exception 'Die Tageszuordnung ist ungültig.' using errcode = '22023';
  elsif _stage_count = 1 then
    _assignment_mode := 'single_destination';
  elsif _has_valid_position then
    _assignment_mode := 'explicit';
  else
    _assignment_mode := 'unassigned';
  end if;

  insert into public.trips (
    user_id, client_ref, title, origin, origin_place_id, start_date, end_date, travellers,
    currency, budget_amount, status, pace, interests, travel_wish, day_stage_assignment_mode
  )
  values (
    _uid,
    _client_ref,
    btrim(coalesce(_reise ->> 'title', '')),
    nullif(btrim(coalesce(_reise ->> 'origin', '')), ''),
    nullif(btrim(coalesce(_reise ->> 'origin_place_id', '')), ''),
    (_reise ->> 'start_date')::date,
    (_reise ->> 'end_date')::date,
    coalesce((_reise ->> 'travellers')::smallint, 1),
    coalesce(nullif(_reise ->> 'currency', ''), 'CHF'),
    (_reise ->> 'budget_amount')::numeric,
    'draft',
    coalesce(nullif(_reise ->> 'pace', ''), 'balanced'),
    coalesce(
      (select array_agg(distinct w)
         from jsonb_array_elements_text(coalesce(_reise -> 'interests', '[]'::jsonb)) as w),
      '{}'::text[]
    ),
    nullif(btrim(coalesce(_reise ->> 'travel_wish', '')), ''),
    _assignment_mode
  )
  on conflict (user_id, client_ref) do nothing
  returning id into _trip_id;

  if _trip_id is null then
    select id into _trip_id
      from public.trips
      where user_id = _uid and client_ref = _client_ref;
    return _trip_id;
  end if;

  perform set_config('jetnity.graph_mutation', '1', true);

  insert into public.trip_stages (
    trip_id, user_id, position, name, country_code, arrival_date, departure_date,
    latitude, longitude, place_id
  )
  select
    _trip_id,
    _uid,
    coalesce((e.wert ->> 'position')::smallint, e.nr::smallint),
    btrim(coalesce(e.wert ->> 'name', '')),
    nullif(upper(btrim(coalesce(e.wert ->> 'country_code', ''))), ''),
    (e.wert ->> 'arrival_date')::date,
    (e.wert ->> 'departure_date')::date,
    (nullif(e.wert ->> 'latitude', ''))::double precision,
    (nullif(e.wert ->> 'longitude', ''))::double precision,
    nullif(btrim(coalesce(e.wert ->> 'place_id', '')), '')
  from jsonb_array_elements(_etappen) with ordinality as e(wert, nr);

  insert into public.trip_days (trip_id, user_id, day_index, day_date, title, stage_id)
  select
    _trip_id,
    _uid,
    coalesce((t.wert ->> 'day_index')::smallint, t.nr::smallint),
    (t.wert ->> 'day_date')::date,
    nullif(btrim(coalesce(t.wert ->> 'title', '')), ''),
    case
      when _assignment_mode = 'unassigned' then null
      else s.id
    end
  from jsonb_array_elements(_tage) with ordinality as t(wert, nr)
  left join lateral (
    select st.id
      from public.trip_stages st
     where st.trip_id = _trip_id
       and _assignment_mode <> 'unassigned'
       and st.position = coalesce(
             (t.wert ->> 'stage_position')::smallint,
             case
               when _assignment_mode = 'single_destination'
                 then 1
               else null
             end
           )
     order by st.created_at, st.id
     limit 1
  ) as s on true;

  insert into public.trip_items (
    trip_id, user_id, day_id, stage_id, kind, title, note, position,
    starts_on, starts_at, ends_on, ends_at,
    price_amount, price_currency, provider, external_ref, booking_url,
    booking_status, booking_source, booking_confirmed_at,
    mobility_mode, origin_place_id, destination_place_id, origin_name, destination_name,
    connection_ref, mobility_changes, mobility_evidence,
    rental_supplier, vehicle_class, transmission, rental_evidence,
    metadata
  )
  select
    _trip_id,
    _uid,
    d.id,
    d.stage_id,
    coalesce(nullif(p.wert ->> 'kind', ''), 'note'),
    btrim(coalesce(p.wert ->> 'title', '')),
    nullif(btrim(coalesce(p.wert ->> 'note', '')), ''),
    coalesce((p.wert ->> 'position')::smallint, p.pos::smallint),
    (nullif(p.wert ->> 'starts_on', ''))::date,
    (nullif(p.wert ->> 'starts_at', ''))::time,
    (nullif(p.wert ->> 'ends_on', ''))::date,
    (nullif(p.wert ->> 'ends_at', ''))::time,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then (nullif(p.wert ->> 'price_amount', ''))::numeric
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then nullif(upper(btrim(coalesce(p.wert ->> 'price_currency', ''))), '')
      else null
    end,
    null,
    null,
    null,
    case
      when btrim(coalesce(p.wert ->> 'booking_status', '')) = 'booked'
           and coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('flight', 'stay', 'transfer', 'rental_car')
        then 'booked'
      else 'unconfirmed'
    end,
    case
      when btrim(coalesce(p.wert ->> 'booking_status', '')) = 'booked'
           and coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('flight', 'stay', 'transfer', 'rental_car')
        then 'user'
      else null
    end,
    case
      when btrim(coalesce(p.wert ->> 'booking_status', '')) = 'booked'
           and coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('flight', 'stay', 'transfer', 'rental_car')
        then coalesce(
          nullif(p.wert ->> 'booking_confirmed_at', '')::timestamptz,
          now()
        )
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'transfer'
           and nullif(btrim(coalesce(p.wert ->> 'mobility_mode', '')), '')
               in ('rail', 'bus', 'ferry', 'transfer')
        then btrim(p.wert ->> 'mobility_mode')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then nullif(btrim(coalesce(p.wert ->> 'origin_place_id', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then nullif(btrim(coalesce(p.wert ->> 'destination_place_id', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then nullif(btrim(coalesce(p.wert ->> 'origin_name', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then nullif(btrim(coalesce(p.wert ->> 'destination_name', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'transfer'
        then nullif(btrim(coalesce(p.wert ->> 'connection_ref', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'transfer'
        then nullif(p.wert ->> 'mobility_changes', '')::smallint
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'transfer'
           and (
             nullif(btrim(coalesce(p.wert ->> 'mobility_mode', '')), '')
               in ('rail', 'bus', 'ferry', 'transfer')
             or nullif(btrim(coalesce(p.wert ->> 'origin_name', '')), '') is not null
             or nullif(btrim(coalesce(p.wert ->> 'destination_name', '')), '') is not null
           )
        then 'user'
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'rental_car'
        then nullif(btrim(coalesce(p.wert ->> 'rental_supplier', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'rental_car'
           and nullif(btrim(coalesce(p.wert ->> 'vehicle_class', '')), '')
               in ('economy', 'compact', 'intermediate', 'fullsize', 'suv', 'van', 'luxury')
        then btrim(p.wert ->> 'vehicle_class')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'rental_car'
           and nullif(btrim(coalesce(p.wert ->> 'transmission', '')), '')
               in ('automatic', 'manual')
        then btrim(p.wert ->> 'transmission')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'rental_car'
           and (
             nullif(btrim(coalesce(p.wert ->> 'rental_supplier', '')), '') is not null
             or nullif(btrim(coalesce(p.wert ->> 'vehicle_class', '')), '') is not null
             or nullif(btrim(coalesce(p.wert ->> 'origin_name', '')), '') is not null
             or nullif(btrim(coalesce(p.wert ->> 'destination_name', '')), '') is not null
           )
        then 'user'
      else null
    end,
    public.flug_route_itinerary_metadata(
      coalesce(nullif(p.wert ->> 'kind', ''), 'note'),
      p.wert -> 'route_itinerary'
    )
  from jsonb_array_elements(_tage) with ordinality as t(wert, nr)
  cross join lateral jsonb_array_elements(coalesce(t.wert -> 'items', '[]'::jsonb))
    with ordinality as p(wert, pos)
  join public.trip_days d
    on d.trip_id = _trip_id
   and d.day_index = coalesce((t.wert ->> 'day_index')::smallint, t.nr::smallint);

  insert into public.trip_items (
    trip_id, user_id, day_id, stage_id, kind, title, note, position,
    starts_on, starts_at, ends_on, ends_at,
    price_amount, price_currency, provider, external_ref, booking_url,
    booking_status, booking_source, booking_confirmed_at,
    mobility_mode, origin_place_id, destination_place_id, origin_name, destination_name,
    connection_ref, mobility_changes, mobility_evidence,
    rental_supplier, vehicle_class, transmission, rental_evidence,
    metadata
  )
  select
    _trip_id,
    _uid,
    null,
    null,
    coalesce(nullif(p.wert ->> 'kind', ''), 'note'),
    btrim(coalesce(p.wert ->> 'title', '')),
    nullif(btrim(coalesce(p.wert ->> 'note', '')), ''),
    coalesce((p.wert ->> 'position')::smallint, p.pos::smallint),
    (nullif(p.wert ->> 'starts_on', ''))::date,
    (nullif(p.wert ->> 'starts_at', ''))::time,
    (nullif(p.wert ->> 'ends_on', ''))::date,
    (nullif(p.wert ->> 'ends_at', ''))::time,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then (nullif(p.wert ->> 'price_amount', ''))::numeric
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then nullif(upper(btrim(coalesce(p.wert ->> 'price_currency', ''))), '')
      else null
    end,
    null,
    null,
    null,
    case
      when btrim(coalesce(p.wert ->> 'booking_status', '')) = 'booked'
           and coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('flight', 'stay', 'transfer', 'rental_car')
        then 'booked'
      else 'unconfirmed'
    end,
    case
      when btrim(coalesce(p.wert ->> 'booking_status', '')) = 'booked'
           and coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('flight', 'stay', 'transfer', 'rental_car')
        then 'user'
      else null
    end,
    case
      when btrim(coalesce(p.wert ->> 'booking_status', '')) = 'booked'
           and coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('flight', 'stay', 'transfer', 'rental_car')
        then coalesce(
          nullif(p.wert ->> 'booking_confirmed_at', '')::timestamptz,
          now()
        )
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'transfer'
           and nullif(btrim(coalesce(p.wert ->> 'mobility_mode', '')), '')
               in ('rail', 'bus', 'ferry', 'transfer')
        then btrim(p.wert ->> 'mobility_mode')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then nullif(btrim(coalesce(p.wert ->> 'origin_place_id', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then nullif(btrim(coalesce(p.wert ->> 'destination_place_id', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then nullif(btrim(coalesce(p.wert ->> 'origin_name', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') in ('transfer', 'rental_car')
        then nullif(btrim(coalesce(p.wert ->> 'destination_name', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'transfer'
        then nullif(btrim(coalesce(p.wert ->> 'connection_ref', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'transfer'
        then nullif(p.wert ->> 'mobility_changes', '')::smallint
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'transfer'
           and (
             nullif(btrim(coalesce(p.wert ->> 'mobility_mode', '')), '')
               in ('rail', 'bus', 'ferry', 'transfer')
             or nullif(btrim(coalesce(p.wert ->> 'origin_name', '')), '') is not null
             or nullif(btrim(coalesce(p.wert ->> 'destination_name', '')), '') is not null
           )
        then 'user'
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'rental_car'
        then nullif(btrim(coalesce(p.wert ->> 'rental_supplier', '')), '')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'rental_car'
           and nullif(btrim(coalesce(p.wert ->> 'vehicle_class', '')), '')
               in ('economy', 'compact', 'intermediate', 'fullsize', 'suv', 'van', 'luxury')
        then btrim(p.wert ->> 'vehicle_class')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'rental_car'
           and nullif(btrim(coalesce(p.wert ->> 'transmission', '')), '')
               in ('automatic', 'manual')
        then btrim(p.wert ->> 'transmission')
      else null
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'rental_car'
           and (
             nullif(btrim(coalesce(p.wert ->> 'rental_supplier', '')), '') is not null
             or nullif(btrim(coalesce(p.wert ->> 'vehicle_class', '')), '') is not null
             or nullif(btrim(coalesce(p.wert ->> 'origin_name', '')), '') is not null
             or nullif(btrim(coalesce(p.wert ->> 'destination_name', '')), '') is not null
           )
        then 'user'
      else null
    end,
    public.flug_route_itinerary_metadata(
      coalesce(nullif(p.wert ->> 'kind', ''), 'note'),
      p.wert -> 'route_itinerary'
    )
  from jsonb_array_elements(_ungeplante) with ordinality as p(wert, pos);

  return _trip_id;
end
$$;


comment on function public.reise_anlegen(jsonb) is
  'Legt eine Reise samt Etappen, Tagen und Planpunkten für das aufrufende Konto an. Idempotent über trips.client_ref. SECURITY INVOKER. Kommerzielle Flight/Stay/Activity/Note-Handelsfelder und Transfer/Rental-Providerfelder kommen nicht aus der JSON-Nutzlast. Transfer/Rental-Preis bleibt User-Intake. Provider-Hard-Truth nur über jetnity_internal.trip_item_commercial_provenance_schreiben. day_stage_assignment_mode unverändert fail-closed.';

revoke all on function public.reise_anlegen(jsonb) from public, anon;
grant execute on function public.reise_anlegen(jsonb) to authenticated;
