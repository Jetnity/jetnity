-- Jetnity V2 – Phase 2.2 Nachtrag: Fassung bei Stammdaten auf trips
--
-- Direkte Updates von title, origin, Zeitraum, Reisenden, Währung, Budget,
-- Status, Tempo, Interessen oder Reisewunsch erhöhen trips.revision, wenn der
-- Schreibweg die Fassung nicht bereits selbst setzt.
--
-- reise_aendern() schreibt revision = revision + 1 in demselben UPDATE wie die
-- Stammdaten. Der Auslöser erkennt das und zählt nicht ein zweites Mal.
-- Der Kind-Trigger (UPDATE trips SET revision = revision + 1) nennt keine der
-- Stammdatenspalten und löst diesen Auslöser nicht aus.


create or replace function public.reise_stamm_geaendert()
returns trigger
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Kontrollierte Schreiber (reise_aendern) setzen die Fassung selbst.
  if new.revision is distinct from old.revision then
    return new;
  end if;

  if new.title is not distinct from old.title
     and new.origin is not distinct from old.origin
     and new.start_date is not distinct from old.start_date
     and new.end_date is not distinct from old.end_date
     and new.travellers is not distinct from old.travellers
     and new.currency is not distinct from old.currency
     and new.budget_amount is not distinct from old.budget_amount
     and new.status is not distinct from old.status
     and new.pace is not distinct from old.pace
     and new.interests is not distinct from old.interests
     and new.travel_wish is not distinct from old.travel_wish then
    return new;
  end if;

  new.revision := old.revision + 1;
  return new;
end
$$;

comment on function public.reise_stamm_geaendert() is
  'BEFORE UPDATE der Stammdatenspalten auf trips: erhöht revision, wenn der Schreibweg sie nicht bereits gesetzt hat. SECURITY INVOKER. RLS bleibt die Eigentumsprüfung.';

revoke all on function public.reise_stamm_geaendert() from public, anon, authenticated;

create trigger trips_stamm_fassung
  before update of title, origin, start_date, end_date, travellers, currency,
                   budget_amount, status, pace, interests, travel_wish
  on public.trips
  for each row
  execute function public.reise_stamm_geaendert();

comment on column public.trips.revision is
  'Technische Fassung des Reisegraphen. Steigt bei jeder fachlichen Änderung an der Reise oder ihren Kindzeilen. Ein Änderungsvorschlag nennt die Fassung, auf der er beruht.';
