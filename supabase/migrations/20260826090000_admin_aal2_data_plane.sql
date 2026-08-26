-- Jetnity – QS-2 P1-QS2-01: Admin AAL2 auch auf der Datenebene erzwingen
--
-- Der Application-Guard in PR #80 verlangt zentral currentLevel === 'aal2'.
-- Die Datenbankfähigkeiten durften bislang jedoch allein anhand der Rolle
-- entscheiden. Ein gültiges AAL1-JWT eines echten Admin-/Operator-/Moderator-
-- Kontos hätte damit direkte PostgREST/RPC-Zugriffe trotz gesperrter Admin-UI
-- ermöglicht.
--
-- Diese Migration ändert weder Rollen, Ownership noch Consumer-RLS. Sie zieht
-- ausschließlich die bereits bestehenden administrativen Fähigkeiten auf
-- dieselbe AAL2-Wahrheit wie den Application-Guard.

-- ---------------------------------------------------------------------------
-- 1. Aktuelle Assurance aus dem signierten Supabase-JWT
-- ---------------------------------------------------------------------------

create or replace function public.aktuelles_admin_aal2()
returns boolean
language sql
stable
parallel safe
set search_path = pg_catalog
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
$$;

comment on function public.aktuelles_admin_aal2() is
  'Admin-Datenebene: nur ein aktuell signiertes Supabase-JWT mit aal=aal2 erfüllt die Assurance-Grenze. Fehlender/anderer Wert ist fail closed.';

revoke all on function public.aktuelles_admin_aal2() from public, anon;
grant execute on function public.aktuelles_admin_aal2() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Bestehende Fähigkeiten: Rolle UND AAL2
-- ---------------------------------------------------------------------------
--
-- Die Mindestrollen bleiben exakt unverändert. Dadurch bleiben
-- CAPABILITY_MINIMUM und die Datenbankrollen-Semantik synchron; hinzu kommt nur
-- die zweite, entry-path-unabhängige Assurance-Bedingung.

create or replace function public.darf_betrieb_lesen()
returns boolean language sql stable parallel safe
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('moderator')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_betrieb_lesen() is
  'Fähigkeit betrieb-lesen: mindestens moderator UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_betrieb_eingreifen()
returns boolean language sql stable parallel safe
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('operator')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_betrieb_eingreifen() is
  'Fähigkeit betrieb-eingreifen: mindestens operator UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_konten_verwalten()
returns boolean language sql stable parallel safe
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('moderator')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_konten_verwalten() is
  'Fähigkeit konten-verwalten: mindestens moderator UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_inhalte_moderieren()
returns boolean language sql stable parallel safe
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('moderator')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_inhalte_moderieren() is
  'Fähigkeit inhalte-moderieren: mindestens moderator UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_konfiguration_verwalten()
returns boolean language sql stable parallel safe
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('admin')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_konfiguration_verwalten() is
  'Fähigkeit konfiguration-verwalten: mindestens admin UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

-- Explizit dieselben Ausführungsrechte wie bisher beibehalten.
do $$
declare f text;
begin
  foreach f in array array[
    'darf_betrieb_lesen', 'darf_betrieb_eingreifen', 'darf_konten_verwalten',
    'darf_inhalte_moderieren', 'darf_konfiguration_verwalten'
  ] loop
    execute format('revoke all on function public.%I() from public, anon', f);
    execute format('grant execute on function public.%I() to authenticated, service_role', f);
  end loop;
end $$;
