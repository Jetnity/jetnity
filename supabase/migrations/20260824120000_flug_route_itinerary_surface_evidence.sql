-- PR #38 R14 Blocker 29: gültiges surfaceFromAirportCode überlebt die kanonische Persistenz.
-- Ersetzt public.flug_route_itinerary_metadata, ohne bereits angewandte Migrationen umzuschreiben.
-- Client-countryCode/city/country bleiben verworfen. Nur gültige IATA-Evidence bleibt.
-- Nur Development anwenden; Production nicht ohne separate Freigabe.

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
  _seg_kanon jsonb;
  _punkt jsonb;
  _code text;
  _surface text;
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

      if _seg ? 'surfaceFromAirportCode'
         and jsonb_typeof(_seg -> 'surfaceFromAirportCode') is distinct from 'null' then
        if jsonb_typeof(_seg -> 'surfaceFromAirportCode') <> 'string' then
          return '{}'::jsonb;
        end if;
        _surface := nullif(upper(btrim(coalesce(_seg ->> 'surfaceFromAirportCode', ''))), '');
        if _surface is null or _surface !~ '^[A-Z]{3}$' then
          return '{}'::jsonb;
        end if;
      else
        _surface := null;
      end if;

      _seg_kanon := jsonb_build_object(
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
      );

      if _surface is not null then
        _seg_kanon := _seg_kanon || jsonb_build_object('surfaceFromAirportCode', _surface);
      end if;

      _segs := _segs || jsonb_build_array(_seg_kanon);
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
  'Baut trip_items.metadata aus IATA + public.airports. Client-countryCode/city/country werden verworfen. Gültiges surfaceFromAirportCode bleibt als IATA. Ungültige Eingaben ergeben {}.';

revoke all on function public.flug_route_itinerary_metadata(text, jsonb) from public, anon;
grant execute on function public.flug_route_itinerary_metadata(text, jsonb) to authenticated;
