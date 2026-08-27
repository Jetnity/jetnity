-- Jetnity – P1-AAL2-PROD-01: Admin AAL2 Data-Plane Alignment
--
-- Forward-only Alignment nach Production-Head
-- `20260827010000_reise_anlegen_zero_stage_fail_closed`.
--
-- Application-Guard (PR #80 / ADR-0169) verlangt bereits currentLevel === 'aal2'.
-- Production besitzt live keine `public.aktuelles_admin_aal2()`; die fünf
-- `darf_*()`-Capabilities prüfen dort nur die Mindestrolle. Ein privilegiertes
-- AAL1-JWT kann deshalb direkte PostgREST/RPC-Pfade nutzen.
--
-- Development hat dieselbe Semantik bereits über die historische Version
-- `20260826052735_admin_aal2_data_plane`. Das Repository führt sie als
-- `20260826090000_admin_aal2_data_plane.sql`. Diese Datei wird bewusst nicht
-- umbenannt, gelöscht oder rückwirkend geändert.
--
-- Diese neue Migration setzt denselben engen Vertrag idempotent:
-- administrative Fähigkeit = unveränderte Mindestrolle UND
-- signierter JWT-Claim auth.jwt() ->> 'aal' = 'aal2'.
--
-- Keine Tabellen-, Ownership-, Consumer-RLS- oder Rollenmodell-Änderung.
-- Kein Production-Apply durch diese Datei allein: Apply bleibt
-- ausdrückliches Product-Owner-Gate.

-- ---------------------------------------------------------------------------
-- 1. Aktuelle Assurance aus dem signierten Supabase-JWT
-- ---------------------------------------------------------------------------

create or replace function public.aktuelles_admin_aal2()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
$$;

comment on function public.aktuelles_admin_aal2() is
  'Admin-Datenebene: nur ein aktuell signiertes Supabase-JWT mit aal=aal2 erfüllt die Assurance-Grenze. Fehlender/anderer/malformed Wert ist fail closed. Faktor-Existenz, nextLevel, User-Metadata und Break-Glass ersetzen AAL2 nicht.';

revoke all on function public.aktuelles_admin_aal2() from public, anon;
grant execute on function public.aktuelles_admin_aal2() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Bestehende Fähigkeiten: Rolle UND AAL2
-- ---------------------------------------------------------------------------
--
-- Mindestrollen bleiben exakt die Werte aus CAPABILITY_MINIMUM /
-- 20260817100800_faehigkeiten.sql. Nur die zweite AND-Bedingung kommt hinzu.

create or replace function public.darf_betrieb_lesen()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('moderator')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_betrieb_lesen() is
  'Fähigkeit betrieb-lesen: mindestens moderator UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_betrieb_eingreifen()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('operator')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_betrieb_eingreifen() is
  'Fähigkeit betrieb-eingreifen: mindestens operator UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_konten_verwalten()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('moderator')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_konten_verwalten() is
  'Fähigkeit konten-verwalten: mindestens moderator UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_inhalte_moderieren()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('moderator')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_inhalte_moderieren() is
  'Fähigkeit inhalte-moderieren: mindestens moderator UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_konfiguration_verwalten()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('admin')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_konfiguration_verwalten() is
  'Fähigkeit konfiguration-verwalten: mindestens admin UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

-- Explizit dieselben Ausführungsrechte wie bisher: authenticated + service_role,
-- kein public/anon. Break-Glass bleibt eine UI-Grant-Art ohne DB-Recht.
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
