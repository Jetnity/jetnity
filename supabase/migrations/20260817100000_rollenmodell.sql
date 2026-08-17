-- Jetnity V2 – Phase 1.4: ein Rollenmodell, eine Autorität
--
-- Ausgangslage: Vier Stellen entschieden unabhängig voneinander, wer
-- Administrator ist.
--
--   1. `creator_profiles.role`   – die Anwendung (lib/auth/admin-guard.ts)
--   2. `creator_profiles.is_admin` – die Funktion `is_admin(uuid)`
--   3. die Tabelle `app_admins`  – die Policies auf `creator_profiles`
--   4. die Tabelle `admin_domains` – eine domainbasierte Freigabe
--
-- Vier Autoritäten heißen: Wer eine entzieht, hat nichts entzogen. Diese
-- Migration legt die Grundlage dafür, dass nur noch `creator_profiles.role`
-- zählt. Sie ist rein additiv – das Entfernen der übrigen drei erfolgt in
-- 20260817100200, nachdem die Policies umgestellt sind.
--
-- Die Rangfolge ist dieselbe wie in lib/auth/roles.ts. `lib/auth/roles.test.ts`
-- vergleicht beide Listen, damit sie nicht auseinanderlaufen können.

-- ---------------------------------------------------------------------------
-- 1. Rangfolge der Rollen
-- ---------------------------------------------------------------------------

-- Unbekannte Rolle ergibt NULL, nicht 0. Ein Tippfehler in einer Policy führt
-- damit zu „kein Zugriff“ statt zu „Zugriff wie ein Nutzer“.
create or replace function public.rollenrang(rolle text)
returns integer
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select case rolle
           when 'user'      then 0
           when 'creator'   then 10
           when 'moderator' then 20
           when 'operator'  then 30
           when 'admin'     then 40
           when 'owner'     then 50
         end
$$;

comment on function public.rollenrang(text) is
  'Rangfolge der Jetnity-Rollen. Identisch zu RANK in lib/auth/roles.ts. Unbekannte Rolle ergibt NULL.';

-- ---------------------------------------------------------------------------
-- 2. Rolle des angemeldeten Kontos
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER, weil die Funktion aus Policies auf `creator_profiles`
-- heraus aufgerufen wird. Als INVOKER würde die Abfrage erneut durch die
-- Policies derselben Tabelle laufen und rekursieren.
--
-- `(select auth.uid())` statt `auth.uid()`: PostgreSQL wertet die Unterabfrage
-- einmal je Anweisung aus (InitPlan) statt einmal je Zeile.
create or replace function public.aktuelle_rolle()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.creator_profiles p
  where p.user_id = (select auth.uid())
  limit 1
$$;

comment on function public.aktuelle_rolle() is
  'Rolle des angemeldeten Kontos aus creator_profiles. Einzige Rollenquelle der Datenbank.';

-- Fail-closed: Ohne Anmeldung, ohne Profil, mit unbekannter Rolle oder mit
-- unbekanntem Mindestwert ist das Ergebnis `false`, nie NULL.
create or replace function public.hat_rolle_mindestens(minimum text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
           public.rollenrang(public.aktuelle_rolle()) >= public.rollenrang(minimum),
           false)
$$;

comment on function public.hat_rolle_mindestens(text) is
  'Erreicht das angemeldete Konto mindestens diese Rolle? Fail-closed: unbekannt ergibt false.';

-- Nur angemeldete Konten werten diese Funktionen aus; `anon` braucht sie nicht,
-- weil keine Policy für `anon` sie aufruft.
revoke all on function public.rollenrang(text) from public;
revoke all on function public.aktuelle_rolle() from public;
revoke all on function public.hat_rolle_mindestens(text) from public;
grant execute on function public.rollenrang(text) to authenticated, service_role;
grant execute on function public.aktuelle_rolle() to authenticated, service_role;
grant execute on function public.hat_rolle_mindestens(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Bestandsdaten auf das Rollenmodell bringen
-- ---------------------------------------------------------------------------

-- Wer über eine der abzulösenden Autoritäten Administrator war, behält den
-- Zugang – jetzt über die Rolle. Ohne diesen Schritt würde Schritt
-- 20260817100200 bestehenden Administratoren stillschweigend den Zugang
-- entziehen.
update public.creator_profiles p
   set role = 'admin'
 where coalesce(public.rollenrang(p.role), -1) < public.rollenrang('admin')
   and (p.is_admin = true
        or exists (select 1 from public.app_admins a where a.user_id = p.user_id));

-- `basic` war der bisherige Vorgabewert und ist keine Rolle des Modells.
-- `parseRole()` liefert dafür null, die Anwendung behandelt solche Konten also
-- ohnehin als rollenlos.
update public.creator_profiles
   set role = 'user'
 where role is null or public.rollenrang(role) is null;

update public.creator_profiles
   set status = 'active'
 where status is null;

-- ---------------------------------------------------------------------------
-- 4. Rolle und Status verbindlich machen
-- ---------------------------------------------------------------------------

alter table public.creator_profiles
  alter column role set default 'user',
  alter column role set not null;

alter table public.creator_profiles
  drop constraint if exists creator_profiles_role_check;

alter table public.creator_profiles
  add constraint creator_profiles_role_check
  check (public.rollenrang(role) is not null);

-- Der bisherige CHECK erlaubte nur `active` und `banned`, die Anwendung kennt
-- vier Zustände (ACCOUNT_STATUSES in lib/auth/roles.ts). `setUserStatus` mit
-- `pending` oder `disabled` scheiterte deshalb an der Datenbank.
alter table public.creator_profiles
  drop constraint if exists creator_profiles_status_check;

alter table public.creator_profiles
  add constraint creator_profiles_status_check
  check (status in ('active', 'pending', 'disabled', 'banned'));

-- Ein Profil ohne Konto lässt sich weder anmelden noch zuordnen; die Rolle
-- darin wäre für niemanden wirksam.
alter table public.creator_profiles
  alter column user_id set not null;

comment on column public.creator_profiles.role is
  'Einzige Rollenquelle. Zulässige Werte siehe public.rollenrang(text) und lib/auth/roles.ts.';
comment on column public.creator_profiles.status is
  'Kontostatus: active, pending, disabled, banned. Entspricht ACCOUNT_STATUSES in lib/auth/roles.ts.';
