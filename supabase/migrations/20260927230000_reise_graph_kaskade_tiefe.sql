-- Jetnity V1 Kontolöschung: Graph-Revision bei Löschkaskade
--
-- public.reise_graph_geaendert() bleibt SECURITY INVOKER. Die neun
-- Statement-Trigger bleiben. jetnity.graph_mutation = '1' bleibt die erste
-- Abkürzung von reise_anlegen() und reise_aendern().
--
-- Eine normale Verschachtelung (pg_trigger_depth() > 1) kehrt vor dem
-- UPDATE zurück.
--
-- Die Fremdschlüssel-Kaskade auth.users → public.trips → Kindzeilen ist
-- auf PostgreSQL 16 anders: Statement-Trigger mit Übergangstabelle feuern
-- erst am Ende der äusseren Anweisung und mit Tiefe 1. Die Elternzeile ist
-- dann nicht mehr sichtbar. Das UPDATE auf public.trips verlangt trotzdem
-- das Recht und bricht für die Auth-Rolle mit 42501 ab
-- (permission denied for table trips). Sieht der Aufruf keine betroffene
-- Reise mehr, oder darf er public.trips nicht lesen, kehrt die Funktion
-- vor dem UPDATE zurück.
--
-- Kein SECURITY DEFINER. Keine neuen Rechte. Kein Sonderfall für einen
-- Rollennamen.


create or replace function public.reise_graph_geaendert()
returns trigger
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
declare
  _eltern boolean;
begin
  if current_setting('jetnity.graph_mutation', true) = '1' then
    return null;
  end if;

  if pg_trigger_depth() > 1 then
    return null;
  end if;

  begin
    select exists (
      select 1
        from public.trips as reise
       where reise.id in (select distinct trip_id from geaendert)
    ) into _eltern;
  exception
    when insufficient_privilege then
      return null;
  end;

  if not coalesce(_eltern, false) then
    return null;
  end if;

  update public.trips
     set revision = revision + 1
   where id in (select distinct trip_id from geaendert);

  return null;
end
$$;

comment on function public.reise_graph_geaendert() is
  'AFTER STATEMENT auf trip_stages, trip_days und trip_items: erhöht trips.revision der noch sichtbaren Reisen. Übersprungen bei jetnity.graph_mutation, bei Trigger-Tiefe über 1 und wenn die Elternreise in dieser Anweisung schon weg ist oder nicht gelesen werden darf. SECURITY INVOKER.';

revoke all on function public.reise_graph_geaendert() from public, anon, authenticated;
