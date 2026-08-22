-- Foundation D Round 4: jeder persistierte Flight-routeItinerary wird kanonisiert.
-- BEFORE INSERT/UPDATE OF metadata, kind auf public.trip_items.
-- Andere Metadata-Schlüssel bleiben. Nicht-Flight bleibt unverändert.
-- Nur Development anwenden; Production nicht ohne separate Freigabe.

create or replace function public.trip_items_route_itinerary_schuetzen()
returns trigger
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
declare
  _huelle jsonb;
  _rest jsonb;
begin
  if new.kind is distinct from 'flight' then
    return new;
  end if;

  if new.metadata is null or jsonb_typeof(new.metadata) <> 'object' then
    return new;
  end if;

  if not (new.metadata ? 'routeItinerary') then
    return new;
  end if;

  _rest := new.metadata - 'routeItinerary';
  _huelle := public.flug_route_itinerary_metadata(new.kind, new.metadata -> 'routeItinerary');

  if _huelle ? 'routeItinerary' then
    new.metadata := _rest || _huelle;
  else
    new.metadata := _rest;
  end if;

  return new;
end
$$;

comment on function public.trip_items_route_itinerary_schuetzen() is
  'Kanonisiert trip_items.metadata.routeItinerary aus IATA + public.airports. Ungültige Route wird entfernt. Andere Schlüssel bleiben.';

revoke all on function public.trip_items_route_itinerary_schuetzen() from public, anon, authenticated;

drop trigger if exists trip_items_route_itinerary_schuetzen on public.trip_items;
create trigger trip_items_route_itinerary_schuetzen
  before insert or update of metadata, kind
  on public.trip_items
  for each row
  execute function public.trip_items_route_itinerary_schuetzen();
