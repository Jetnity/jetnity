-- TW6-B Nachtrag: TypeScript und SQL teilen dieselbe fail-closed Ableitung.
-- user + stage_position darf nicht zu legacy_fallback werden.
-- single_destination bei mehreren Stages ist immer unassigned.
-- Keine neue Tabelle. Keine RLS-/Ownership-Änderung.
-- Nur Development anwenden; Production nicht ohne separate Product-Owner-Freigabe.
--
-- Identisch zu lib/trips/day-stage-assignment.ts
-- dayStageAssignmentSourceAbleiten():
--   stages <= 1                         → single_destination
--   claimed in (user, unassigned,
--               single_destination)     → unassigned
--   claimed unbekannt                   → 22023
--   claimed legacy_fallback|null
--     + vorhandene stage_position       → legacy_fallback
--   sonst                               → unassigned

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
  _assignment_source text;
  _claimed_source text;
  _stage_count integer;
  _has_day_position boolean;
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
  _claimed_source := nullif(btrim(coalesce(_reise ->> 'day_stage_assignment_source', '')), '');
  if _claimed_source is not null
     and _claimed_source not in ('legacy_fallback', 'unassigned', 'single_destination', 'user') then
    raise exception 'Die Tageszuordnung ist ungültig.' using errcode = '22023';
  end if;
  select exists (
    select 1
      from jsonb_array_elements(_tage) as t(wert)
     where nullif(btrim(coalesce(t.wert ->> 'stage_position', '')), '') is not null
  ) into _has_day_position;

  -- Kanonische Ableitung, identisch zu dayStageAssignmentSourceAbleiten().
  -- Reservierte oder falsche Claims werden nicht zu legacy_fallback.
  if _stage_count <= 1 then
    _assignment_source := 'single_destination';
  elsif _claimed_source in ('user', 'unassigned', 'single_destination') then
    _assignment_source := 'unassigned';
  elsif _has_day_position
     and (_claimed_source is null or _claimed_source = 'legacy_fallback') then
    _assignment_source := 'legacy_fallback';
  else
    _assignment_source := 'unassigned';
  end if;

  insert into public.trips (
    user_id, client_ref, title, origin, origin_place_id, start_date, end_date, travellers,
    currency, budget_amount, status, pace, interests, travel_wish, day_stage_assignment_source
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
    _assignment_source
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
      when _assignment_source = 'unassigned' then null
      else s.id
    end
  from jsonb_array_elements(_tage) with ordinality as t(wert, nr)
  left join lateral (
    select st.id
      from public.trip_stages st
     where st.trip_id = _trip_id
       and _assignment_source <> 'unassigned'
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

  if _assignment_source = 'legacy_fallback' then
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
  end if;

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
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'flight' then null
      else (nullif(p.wert ->> 'price_amount', ''))::numeric
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'flight' then null
      else nullif(upper(btrim(coalesce(p.wert ->> 'price_currency', ''))), '')
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'flight' then null
      else nullif(btrim(coalesce(p.wert ->> 'provider', '')), '')
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'flight' then null
      else nullif(btrim(coalesce(p.wert ->> 'external_ref', '')), '')
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'flight' then null
      else nullif(btrim(coalesce(p.wert ->> 'booking_url', '')), '')
    end,
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
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'flight' then null
      else (nullif(p.wert ->> 'price_amount', ''))::numeric
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'flight' then null
      else nullif(upper(btrim(coalesce(p.wert ->> 'price_currency', ''))), '')
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'flight' then null
      else nullif(btrim(coalesce(p.wert ->> 'provider', '')), '')
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'flight' then null
      else nullif(btrim(coalesce(p.wert ->> 'external_ref', '')), '')
    end,
    case
      when coalesce(nullif(p.wert ->> 'kind', ''), 'note') = 'flight' then null
      else nullif(btrim(coalesce(p.wert ->> 'booking_url', '')), '')
    end,
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
  'Legt eine Reise samt Etappen, Tagen und Planpunkten für das aufrufende Konto an. Idempotent über trips.client_ref. SECURITY INVOKER. Schreibt optionale Ortsreferenzen, Mobilitäts- und Mietwagenfakten und eine validierte Flug-Itinerary nach trip_items.metadata. Übernimmt einen manuellen Buchungsstatus nur als user, niemals als provider. Gebucht nur für flight, stay, transfer und rental_car. Kommerzielle Flugfelder (price_amount, price_currency, provider, external_ref, booking_url) kommen nicht aus der JSON-Nutzlast; ohne vertrauenswürdigen Nachweis bleiben sie null. day_stage_assignment_source folgt derselben fail-closed Ableitung wie TypeScript: user, unassigned und single_destination bei mehreren Stages werden unassigned und übernehmen keine Client-stage_position. legacy_fallback entsteht nur bei fehlendem oder explizitem legacy-Claim plus vorhandener stage_position; das mintet für einen direkten Client noch historische Provenance und bleibt ein offenes Product-Gate. Nur Development, bis Production separat freigegeben ist.';

revoke all on function public.reise_anlegen(jsonb) from public, anon;
grant execute on function public.reise_anlegen(jsonb) to authenticated;
