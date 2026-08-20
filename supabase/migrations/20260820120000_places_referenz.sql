-- Jetnity V2 – Phase 3.1: kanonische Ortsreferenz
--
-- `public.places` ist die lokale, provider-unabhängige Ortsbasis für
-- Reiseziel und Abreise. Die Suche hängt nicht an GeoNames-Webservices,
-- Google oder einem Flugprovider. Inhalt kommt aus dem kontrollierten
-- Import (`npm run places:importieren`), nicht aus dieser Datei.
--
-- `trips.origin` und `trip_stages.name` bleiben der menschenlesbare Text.
-- Die neuen Spalten tragen die kanonische Referenz. Altbestand ohne sie
-- bleibt lesbar.
--
-- Nur Development/Preview anwenden. Production nicht ohne ausdrückliche
-- Freigabe.

create table public.places (
  id text primary key
    constraint places_id_laenge check (char_length(btrim(id)) between 1 and 80),
  source text not null
    constraint places_source_werte check (source in ('geonames', 'ourairports')),
  source_id text not null
    constraint places_source_id_laenge check (char_length(btrim(source_id)) between 1 and 40),
  name text not null
    constraint places_name_laenge check (char_length(btrim(name)) between 1 and 120),
  typ text not null
    constraint places_typ_werte check (typ in ('country', 'region', 'city', 'island', 'airport')),
  country text
    constraint places_country_laenge check (country is null or char_length(btrim(country)) between 1 and 80),
  country_code text
    constraint places_country_code_form check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  region text
    constraint places_region_laenge check (region is null or char_length(btrim(region)) between 1 and 80),
  lat double precision
    constraint places_lat_bereich check (lat is null or (lat >= -90 and lat <= 90)),
  lon double precision
    constraint places_lon_bereich check (lon is null or (lon >= -180 and lon <= 180)),
  iata text
    constraint places_iata_form check (iata is null or iata ~ '^[A-Z]{3}$'),
  keywords text
    constraint places_keywords_laenge check (keywords is null or char_length(keywords) <= 800),
  updated_at timestamptz,
  constraint places_quelle_eindeutig unique (source, source_id)
);

comment on table public.places is
  'Lokale Ortsbasis für Reiseziel und Abreise. Import aus GeoNames und public.airports. Kein Live-Geocoding.';
comment on column public.places.id is
  'Stabile Jetnity-ID: geonames:<id> oder airport:<IATA>.';

create index places_name_trgm on public.places using gin (name extensions.gin_trgm_ops);
create index places_keywords_trgm on public.places using gin (keywords extensions.gin_trgm_ops);
create index places_typ_idx on public.places (typ);

alter table public.places enable row level security;

create policy places_lesen on public.places
  for select to anon, authenticated using (true);

grant select on table public.places to anon;
grant select on table public.places to authenticated;

alter table public.trips
  add column if not exists origin_place_id text references public.places(id);

alter table public.trip_stages
  add column if not exists place_id text references public.places(id);

comment on column public.trips.origin_place_id is
  'Kanonischer Abreiseort. origin bleibt der Anzeigetext. Null bei Altbestand.';
comment on column public.trip_stages.place_id is
  'Kanonischer Etappenort. name bleibt der Anzeigetext. Null bei Altbestand.';

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

  insert into public.trips (
    user_id, client_ref, title, origin, origin_place_id, start_date, end_date, travellers,
    currency, budget_amount, status, pace, interests, travel_wish
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
    nullif(btrim(coalesce(_reise ->> 'travel_wish', '')), '')
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
    s.id
  from jsonb_array_elements(_tage) with ordinality as t(wert, nr)
  left join lateral (
    select st.id
      from public.trip_stages st
     where st.trip_id = _trip_id
       and st.position = coalesce(
             (t.wert ->> 'stage_position')::smallint,
             case
               when (select count(*) from public.trip_stages x where x.trip_id = _trip_id) = 1
                 then 1
               else null
             end
           )
     order by st.created_at, st.id
     limit 1
  ) as s on true;

  update public.trip_days d
     set stage_id = s.id
    from public.trip_stages s
   where d.trip_id = _trip_id
     and d.stage_id is null
     and s.trip_id = _trip_id
     and d.day_date is not null
     and s.arrival_date is not null
     and s.departure_date is not null
     and d.day_date >= s.arrival_date
     and d.day_date <= s.departure_date
     and not exists (
           select 1
             from public.trip_stages s2
            where s2.trip_id = _trip_id
              and s2.id <> s.id
              and s2.arrival_date is not null
              and s2.departure_date is not null
              and d.day_date >= s2.arrival_date
              and d.day_date <= s2.departure_date
              and (s2.position < s.position or (s2.position = s.position and s2.id < s.id))
         );

  with etappen as (
    select
      st.id,
      row_number() over (order by st.position, st.id) as nr,
      count(*) over () as anzahl
    from public.trip_stages st
    where st.trip_id = _trip_id
  ),
  tage as (
    select
      d.id,
      row_number() over (order by d.day_index, d.id) as nr,
      count(*) over () as anzahl
    from public.trip_days d
    where d.trip_id = _trip_id
      and d.stage_id is null
  )
  update public.trip_days d
     set stage_id = e.id
    from tage t
    join etappen e
      on e.nr = least(
           e.anzahl,
           greatest(1, ceil(t.nr::numeric * e.anzahl / greatest(t.anzahl, 1)))
         )
   where d.id = t.id
     and e.anzahl > 0;

  insert into public.trip_items (
    trip_id, user_id, day_id, stage_id, kind, title, note, position,
    starts_on, starts_at, ends_on, ends_at,
    price_amount, price_currency, provider, external_ref, booking_url
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
    (nullif(p.wert ->> 'price_amount', ''))::numeric,
    nullif(upper(btrim(coalesce(p.wert ->> 'price_currency', ''))), ''),
    nullif(btrim(coalesce(p.wert ->> 'provider', '')), ''),
    nullif(btrim(coalesce(p.wert ->> 'external_ref', '')), ''),
    nullif(btrim(coalesce(p.wert ->> 'booking_url', '')), '')
  from jsonb_array_elements(_tage) with ordinality as t(wert, nr)
  cross join lateral jsonb_array_elements(coalesce(t.wert -> 'items', '[]'::jsonb))
    with ordinality as p(wert, pos)
  join public.trip_days d
    on d.trip_id = _trip_id
   and d.day_index = coalesce((t.wert ->> 'day_index')::smallint, t.nr::smallint);

  insert into public.trip_items (
    trip_id, user_id, day_id, stage_id, kind, title, note, position,
    starts_on, starts_at, ends_on, ends_at,
    price_amount, price_currency, provider, external_ref, booking_url
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
    (nullif(p.wert ->> 'price_amount', ''))::numeric,
    nullif(upper(btrim(coalesce(p.wert ->> 'price_currency', ''))), ''),
    nullif(btrim(coalesce(p.wert ->> 'provider', '')), ''),
    nullif(btrim(coalesce(p.wert ->> 'external_ref', '')), ''),
    nullif(btrim(coalesce(p.wert ->> 'booking_url', '')), '')
  from jsonb_array_elements(_ungeplante) with ordinality as p(wert, pos);

  return _trip_id;
end
$$;

comment on function public.reise_anlegen(jsonb) is
  'Legt eine Reise samt Etappen, Tagen und Planpunkten für das aufrufende Konto an. Idempotent über trips.client_ref. SECURITY INVOKER. Schreibt optionale Ortsreferenzen, wenn sie in der Nutzlast stehen. Kindzeilen zählen die Fassung nicht hoch.';
