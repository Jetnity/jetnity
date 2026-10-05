-- Jetnity V2 – Phase 1.4: `admin_security_overview` herstellen
--
-- Die Karten „Security & Health" auf der Startseite des Administrationsbereichs
-- (components/admin/home/AdminHealthCards.tsx) rufen diese Funktion auf. Es gab
-- sie nie. Der Aufruf endete in `42883 function does not exist`, die Komponente
-- fing den Fehler ab und rechnete mit einer leeren Liste weiter – und meldete
-- damit „RLS aktiv 0/0" und „Alle Tabellen geschützt". Eine Sicherheitsanzeige,
-- die ohne Daten Entwarnung gibt, ist schlechter als gar keine.
--
-- Die Funktion beantwortet genau die Frage, die die Karten stellen: Auf welchen
-- Tabellen des Schemas ist Row Level Security eingeschaltet, und wie viele
-- Policies hängen daran? Der bisherige Parameter `tables text[]` entfällt. Er
-- führte eine zweite, im Anwendungscode gepflegte Tabellenliste – darin stand
-- unter anderem `payouts`, das es nicht gibt. Über den Katalog zu gehen kann
-- keine Tabelle übersehen und altert nicht mit.

create or replace function public.admin_security_overview()
returns table (
  table_name text,
  rls_enabled boolean,
  policy_count integer
)
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select c.relname::text,
         c.relrowsecurity,
         (select count(*)::integer from pg_policy p where p.polrelid = c.oid)
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and public.hat_rolle_mindestens('admin')
  order by c.relname;
$$;

comment on function public.admin_security_overview() is
  'RLS-Zustand und Policy-Anzahl je Tabelle in public. Liefert ohne Rolle admin keine Zeile.';

-- SECURITY DEFINER ist nötig: `pg_policy` ist für gewöhnliche Rollen lesbar,
-- der Katalog verrät aber die Bedingungen jeder Policy. Die Funktion gibt nur
-- die Anzahl heraus und prüft die Rolle selbst, wie
-- `admin_payments_summary_30d`.
revoke all on function public.admin_security_overview() from public, anon, authenticated;
grant execute on function public.admin_security_overview() to authenticated;
