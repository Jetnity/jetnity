-- Jetnity V2 – Phase 1.5: aus dem Creator-Profil wird ein generisches Profil
--
-- Die Rolle eines Kontos liegt seit Phase 1.3 an genau einer Stelle – und diese
-- Stelle heisst `creator_profiles`, die Tabelle der alten Produktidee. Phase
-- 1.3 hat den Namen deshalb in `ROLE_TABLE` (lib/auth/admin-guard.ts)
-- zusammengeführt, damit die Umstellung eine einzelne Änderung bleibt. Phase
-- 1.4 hat sie auf 1.5 verschoben, weil zuerst das Rollenmodell und die Rechte
-- stehen mussten. Beides steht.
--
-- Ein Umbenennen allein wäre zu wenig. Eine Tabelle namens `profiles`, die
-- weiterhin `instagram`, `tiktok`, `youtube`, `twitter`, `facebook`, `bio`,
-- `website` und `username` führt, ist kein generisches Profil – sie ist das
-- Creator-Profil unter neuem Namen. Diese Migration tut deshalb beides:
-- umbenennen und die Spalten der öffentlichen Creator-Identität entfernen.
--
-- ---------------------------------------------------------------------------
-- Nachweis vor dem Entfernen, gemessen auf Development
-- ---------------------------------------------------------------------------
--
--   Zeilen in der Tabelle       0 – es werden keine Daten vernichtet
--   Eingehende Fremdschlüssel   keine
--   Abhängige Views             keine
--   Anwendungscode              keine der neun Spalten wird gelesen oder
--                               geschrieben. Verwendet werden ausschliesslich
--                               user_id, email, display_name, role, status,
--                               created_at und last_seen_at
--                               (app/(admin)/admin/users/*, components/admin/UsersTable.tsx)
--   `name` im Repository        nur scripts/auth/testkonto.ts, in diesem Zweig
--                               auf display_name umgestellt
--   `username` im Repository    nur die Saat von scripts/db/sicherheit.mjs und
--                               scripts/db/rls.mjs, in diesem Zweig entfernt
--
-- Was bleibt, ist das, was ein Reisekonto braucht: `user_id`, `email`,
-- `display_name`, `avatar_url`, `role`, `status`, `created_at`, `last_seen_at`.
-- Persönliche Reisepräferenzen kommen später und bekommen dann eigene Spalten
-- oder eine eigene Tabelle – nicht die freigewordenen Creator-Spalten.

-- ---------------------------------------------------------------------------
-- 1. Doppelter Auslöser
-- ---------------------------------------------------------------------------
--
-- Auf der Tabelle sassen zwei Auslöser mit derselben Wirkung:
-- `set_profile_core_from_auth()` schreibt E-Mail **und** Anzeigename aus
-- `auth.users` zurück, `set_profile_email_from_auth()` nur die E-Mail. Der
-- zweite ist vollständig im ersten enthalten. Zwei Auslöser für dieselbe
-- Zuweisung sind keine Absicherung, sondern zwei Stellen, an denen sie
-- auseinanderlaufen kann.

drop trigger trg_profile_set_email on public.creator_profiles;
drop function public.set_profile_email_from_auth();

-- Dazu zwei verwaiste Stapelfassungen derselben Zuweisung: kein Auslöser, kein
-- EXECUTE-Recht für `anon` oder `authenticated`, kein Aufrufer im Code. Sie
-- waren in [docs/DATENBANK.md] Abschnitt 11 als offener Punkt geführt.
drop function public.sync_creator_profile_core();
drop function public.sync_creator_profile_emails();

-- ---------------------------------------------------------------------------
-- 2. Spalten der öffentlichen Creator-Identität
-- ---------------------------------------------------------------------------
--
-- Ohne `cascade`: Hängt etwas an einer der Spalten, das der Nachweis oben nicht
-- nennt, soll die Migration scheitern. Der Index `creator_profiles_facebook_idx`
-- und die Bedingungen `creator_profiles_username_format_ck` sowie
-- `creator_profiles_username_key` gehören zu ihren Spalten und fallen mit ihnen
-- – das ist kein `cascade`, sondern der Umfang eines `drop column`.

alter table public.creator_profiles
  drop column instagram,
  drop column tiktok,
  drop column youtube,
  drop column twitter,
  drop column facebook,
  drop column bio,
  drop column website,
  drop column username,
  -- `name` und `display_name` hielten dieselbe Aussage. Der Auslöser füllt
  -- `display_name`, die Oberfläche liest `display_name`; `name` wurde nur von
  -- einem Testskript geschrieben und nie gelesen.
  drop column name;

-- Damit verwendet keine Spalte im Cluster mehr den Typ `citext`. Die Extension
-- bleibt stehen: Sie liegt im Schema `extensions`, kostet nichts und eine
-- Extension zu entfernen ist eine eigene Handlung mit eigenem Nachweis.

-- ---------------------------------------------------------------------------
-- 3. Umbenennen
-- ---------------------------------------------------------------------------
--
-- Rechte und RLS-Schalter hängen an der Tabelle und wandern mit. Bedingungen
-- und Indizes behalten beim Umbenennen der Tabelle ihre alten Namen; sie
-- werden deshalb einzeln nachgezogen. Ein Name, der noch `creator` sagt,
-- während die Tabelle `profiles` heisst, führt beim nächsten Lesen in die
-- Irre.

alter table public.creator_profiles rename to profiles;

alter table public.profiles rename constraint creator_profiles_pkey            to profiles_pkey;
alter table public.profiles rename constraint creator_profiles_user_id_fkey    to profiles_user_id_fkey;
alter table public.profiles rename constraint creator_profiles_user_id_key     to profiles_user_id_key;
alter table public.profiles rename constraint creator_profiles_role_check      to profiles_role_check;

-- Der Statuscheck wird nicht umbenannt, sondern neu gesetzt. Grund:
-- `lib/auth/roles-datenbank.test.ts` liest die zulässigen Werte aus der
-- **letzten** `add constraint …_status_check`-Anweisung der Migrationen. Ein
-- reines Umbenennen würde diese Anweisung nicht erneuern, und der Test läse
-- weiter die Fassung von Phase 1.4 – eine Prüfung, die nur noch zufällig auf
-- die Wirklichkeit zeigt.
alter table public.profiles drop constraint creator_profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check
  check (status = any (array['active'::text, 'pending'::text, 'disabled'::text, 'banned'::text]));

-- Qualifiziert, weil die Baseline `search_path` auf leer setzt und der
-- Reproduzierbarkeitsnachweis alle Migrationen in einer Sitzung abspielt.
alter index public.idx_creator_profiles_created_at rename to profiles_created_at_idx;
alter index public.idx_creator_profiles_email      rename to profiles_email_idx;

alter policy creator_profiles_lesen    on public.profiles rename to profiles_lesen;
alter policy creator_profiles_aendern  on public.profiles rename to profiles_aendern;
alter policy creator_profiles_loeschen on public.profiles rename to profiles_loeschen;
alter policy profile_eigenes_anlegen   on public.profiles rename to profiles_anlegen;

comment on table public.profiles is
  'Generisches Konto-Profil: Identität, Rolle und Kontostatus. Einzige Autorität für die Rolle (ADR-0027); ROLE_TABLE in lib/auth/admin-guard.ts nennt diesen Namen.';

-- ---------------------------------------------------------------------------
-- 4. Auslöser und Funktionen nachziehen
-- ---------------------------------------------------------------------------
--
-- `creator_profiles_rollenwechsel_pruefen()` nennt die Tabelle in ihrem Rumpf
-- nicht – sie arbeitet auf `new`/`old` und auf `rollenrang()`. Ein Umbenennen
-- genügt deshalb; der Auslöser folgt der Funktion über ihre Kennung.

alter function public.creator_profiles_rollenwechsel_pruefen() rename to profil_rollenwechsel_pruefen;
alter trigger creator_profiles_rollenwechsel on public.profiles rename to profiles_rollenwechsel;

comment on function public.profil_rollenwechsel_pruefen() is
  'Auslöser auf public.profiles: setzt canAssignRole() aus lib/auth/roles.ts in der Datenbank durch. Die eigene Rolle und der eigene Status bleiben unveränderlich.';

-- Diese Funktion nennt die Tabelle. PostgreSQL verfolgt Tabellenbezüge im
-- Rumpf nicht; ohne neuen Rumpf griffe sie nach dem Umbenennen ins Leere und
-- schlüge erst beim Auslösen fehl. `npm run db:rechte` prüft genau das.
alter function public.set_profile_core_from_auth() rename to profil_kerndaten_aus_auth;
alter trigger trg_profile_core on public.profiles rename to profiles_kerndaten_aus_auth;

create or replace function public.profil_kerndaten_aus_auth()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.profiles p
  set
    email = coalesce(u.email, p.email),
    display_name = coalesce(
      p.display_name,
      (u.raw_user_meta_data ->> 'full_name'),
      (u.raw_user_meta_data ->> 'name'),
      split_part(u.email, '@', 1)
    )
  from auth.users u
  where p.user_id = new.user_id and u.id = new.user_id;
  return new;
end
$$;

comment on function public.profil_kerndaten_aus_auth() is
  'Auslöser auf public.profiles: übernimmt E-Mail und Anzeigename aus auth.users, ohne einen bereits gesetzten Anzeigenamen zu überschreiben.';

-- `aktuelle_rolle()` ist die Grundlage jeder rollengebundenen Policy. Sie liest
-- die Tabelle und braucht deshalb einen neuen Rumpf.
create or replace function public.aktuelle_rolle()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.user_id = (select auth.uid())
  limit 1
$$;

comment on function public.aktuelle_rolle() is
  'Rolle des angemeldeten Kontos aus public.profiles. SECURITY DEFINER, damit die Policies auf profiles selbst nicht in einen Zirkel laufen.';
