-- S2-B2: direkte authenticated/anon-Schreibwege auf trip_items dürfen
-- für kind='flight' keine kommerziellen Handelsfelder setzen oder ändern.
-- current_user ist nicht spoofbar; kein Client-Flag.
-- Ein späterer trusted Write braucht einen getrennten SECURITY DEFINER-Vertrag.
-- Route-Itinerary, User-Intake und Hotel/Activity/Mobility/Rental bleiben unverändert.
-- Nur Development anwenden; Production nicht ohne separate Freigabe.

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
    if new.kind = 'flight' then
      new.price_amount := null;
      new.price_currency := null;
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
  end if;

  return new;
end
$$;

comment on function public.trip_items_flug_handelsfelder_schuetzen() is
  'Verwirft untrusted Flug-Handelsfelder auf direkten authenticated/anon trip_items-Writes. Trusted Writes brauchen einen späteren SECURITY DEFINER-Vertrag.';

revoke all on function public.trip_items_flug_handelsfelder_schuetzen() from public, anon, authenticated;

drop trigger if exists trip_items_flug_handelsfelder_schuetzen on public.trip_items;
create trigger trip_items_flug_handelsfelder_schuetzen
  before insert or update of price_amount, price_currency, provider, external_ref, booking_url, kind
  on public.trip_items
  for each row
  execute function public.trip_items_flug_handelsfelder_schuetzen();
