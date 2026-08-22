-- Foundation D Round 3: letzte Route-Country-Truth in der Datenbank.
-- Clientwerte für countryCode/city/country werden verworfen.
-- Punkte entstehen aus IATA + public.airports. Keine eindeutige Referenz → null.
-- Nur Development anwenden; Production nicht ohne separate Freigabe.

create or replace function public.flug_route_punkt_aus_iata(_code text)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'airportCode', _norm,
    'countryCode', case when _treffer = 1 then _country_code else null end,
    'city', case when _treffer = 1 then _city else null end,
    'country', case when _treffer = 1 then _country else null end
  )
  from (
    select case
      when _code is not null and _code ~ '^[A-Z]{3}$' then _code
      else null
    end as _norm
  ) n
  cross join lateral (
    select
      count(*)::integer as _treffer,
      min(a.country_code) as _country_code,
      nullif(left(btrim(coalesce(min(a.city), '')), 120), '') as _city,
      nullif(left(btrim(coalesce(min(a.country), '')), 120), '') as _country
    from public.airports a
    where n._norm is not null
      and a.iata = n._norm
  ) r
$$;

comment on function public.flug_route_punkt_aus_iata(text) is
  'Baut einen Route-Punkt aus IATA + public.airports. Keine Client-Länder. 0 oder mehrere Treffer ergeben null.';

revoke all on function public.flug_route_punkt_aus_iata(text) from public, anon;
grant execute on function public.flug_route_punkt_aus_iata(text) to authenticated;


create or replace function public.flug_route_itinerary_metadata(_kind text, _itinerary jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  _leg jsonb;
  _seg jsonb;
  _punkt jsonb;
  _code text;
  _legs jsonb := '[]'::jsonb;
  _segs jsonb;
  _kanon jsonb;
  _huelle jsonb;
  _seite text;
begin
  if coalesce(_kind, '') <> 'flight' then
    return '{}'::jsonb;
  end if;

  if _itinerary is null or jsonb_typeof(_itinerary) <> 'object' then
    return '{}'::jsonb;
  end if;

  if coalesce(_itinerary ->> 'v', '') <> '1'
     or coalesce(_itinerary ->> 'type', '') <> 'flight_route_itinerary' then
    return '{}'::jsonb;
  end if;

  if jsonb_typeof(_itinerary -> 'legs') <> 'array' then
    return '{}'::jsonb;
  end if;

  if jsonb_array_length(_itinerary -> 'legs') not between 1 and 6 then
    return '{}'::jsonb;
  end if;

  for _leg in select value from jsonb_array_elements(_itinerary -> 'legs')
  loop
    if jsonb_typeof(_leg -> 'segments') <> 'array' then
      return '{}'::jsonb;
    end if;
    if jsonb_array_length(_leg -> 'segments') not between 1 and 8 then
      return '{}'::jsonb;
    end if;

    _segs := '[]'::jsonb;

    for _seg in select value from jsonb_array_elements(_leg -> 'segments')
    loop
      if jsonb_typeof(_seg) <> 'object' then
        return '{}'::jsonb;
      end if;

      foreach _seite in array array['origin', 'destination']
      loop
        _punkt := _seg -> _seite;
        if _punkt is null or jsonb_typeof(_punkt) <> 'object' then
          return '{}'::jsonb;
        end if;

        _code := nullif(upper(btrim(coalesce(_punkt ->> 'airportCode', ''))), '');
        if _code is not null and _code !~ '^[A-Z]{3}$' then
          return '{}'::jsonb;
        end if;
      end loop;

      if coalesce(_seg ->> 'departureDate', '') <> ''
         and coalesce(_seg ->> 'departureDate', '') !~ '^\d{4}-\d{2}-\d{2}$' then
        return '{}'::jsonb;
      end if;
      if coalesce(_seg ->> 'arrivalDate', '') <> ''
         and coalesce(_seg ->> 'arrivalDate', '') !~ '^\d{4}-\d{2}-\d{2}$' then
        return '{}'::jsonb;
      end if;
      if coalesce(_seg ->> 'departureTime', '') <> ''
         and coalesce(_seg ->> 'departureTime', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
        return '{}'::jsonb;
      end if;
      if coalesce(_seg ->> 'arrivalTime', '') <> ''
         and coalesce(_seg ->> 'arrivalTime', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
        return '{}'::jsonb;
      end if;

      _segs := _segs || jsonb_build_array(
        jsonb_build_object(
          'origin', public.flug_route_punkt_aus_iata(
            nullif(upper(btrim(coalesce(_seg #>> '{origin,airportCode}', ''))), '')
          ),
          'destination', public.flug_route_punkt_aus_iata(
            nullif(upper(btrim(coalesce(_seg #>> '{destination,airportCode}', ''))), '')
          ),
          'departureDate', nullif(_seg ->> 'departureDate', ''),
          'departureTime', nullif(_seg ->> 'departureTime', ''),
          'arrivalDate', nullif(_seg ->> 'arrivalDate', ''),
          'arrivalTime', nullif(_seg ->> 'arrivalTime', '')
        )
      );
    end loop;

    _legs := _legs || jsonb_build_array(jsonb_build_object('segments', _segs));
  end loop;

  _kanon := jsonb_build_object(
    'v', 1,
    'type', 'flight_route_itinerary',
    'legs', _legs
  );
  _huelle := jsonb_build_object('routeItinerary', _kanon);
  if char_length(_huelle::text) > 8192 then
    return '{}'::jsonb;
  end if;

  return _huelle;
end
$$;

comment on function public.flug_route_itinerary_metadata(text, jsonb) is
  'Baut trip_items.metadata aus IATA + public.airports. Client-countryCode/city/country werden verworfen. Ungültige Eingaben ergeben {}.';

revoke all on function public.flug_route_itinerary_metadata(text, jsonb) from public, anon;
grant execute on function public.flug_route_itinerary_metadata(text, jsonb) to authenticated;
