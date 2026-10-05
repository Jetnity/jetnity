-- Jetnity V2 – Phase 1.4, Nachtrag: Datenbankrechte an das Rollenmodell binden
--
-- 20260817100100 hat sämtliche administrativen Policies auf
-- `hat_rolle_mindestens('admin')` gestellt. Das war zu grob. Die Anwendung
-- kennt seit Phase 1.3 sechs Rollen und lässt den Administrationsbereich ab
-- `moderator` zu; einzelne Eingriffe verlangen `operator`. Beide Aussagen
-- standen unabhängig voneinander an zwei Stellen und liefen auseinander:
--
--   · `GET /api/admin/security/list` lässt eine Moderation durch
--     (`requireAdminApi()` ohne höhere Anforderung). Danach filtert RLS jede
--     Zeile weg. Die Oberfläche zeigt eine leere Liste – also „nichts
--     vorgefallen“, wo „nicht berechtigt“ gemeint ist.
--   · `POST /api/admin/security/block` lässt einen Betrieb durch
--     (`operator`). Die Policy verlangte `admin`, die Sperre lief ins Leere.
--   · `POST /api/admin/payments/refund` lässt einen Betrieb durch. Für
--     `refunds` gab es überhaupt keine INSERT-Policy und für `payments` keine
--     UPDATE-Policy; die Route konnte nie etwas schreiben.
--   · `GET /api/admin/payments/webhooks` liest `stripe_webhooks`. Die Tabelle
--     hatte weder Recht noch Policy, die Antwort war immer leer.
--
-- Diese Migration führt beide Seiten auf eine gemeinsame Sprache zurück:
-- Fähigkeiten. Jede Fähigkeit hat genau eine Mindestrolle, und zwar in
-- CAPABILITY_MINIMUM (lib/auth/roles.ts) und in den `darf_…()`-Funktionen
-- hier. `lib/auth/faehigkeiten-datenbank.test.ts` vergleicht beide Listen und
-- schlägt fehl, sobald eine allein geändert wird.
--
-- Die Zuordnung ist nicht erfunden, sondern aus den bestehenden Gates der
-- Anwendung abgelesen. Wo es keine Route gibt – Postfächer, DNS-Protokoll,
-- Modellvorschläge –, bleibt es bei `admin`.

-- ---------------------------------------------------------------------------
-- 1. Fähigkeiten
-- ---------------------------------------------------------------------------
--
-- Bewusst SECURITY INVOKER: Die Prüfung selbst braucht keine erhöhten Rechte,
-- `hat_rolle_mindestens()` bringt sie als DEFINER mit. Der feste `search_path`
-- entspricht dem Rest des Schemas; die Rumpfnamen sind ohnehin qualifiziert.

create or replace function public.darf_betrieb_lesen()
returns boolean language sql stable parallel safe
set search_path = pg_catalog
as $$ select public.hat_rolle_mindestens('moderator') $$;

comment on function public.darf_betrieb_lesen() is
  'Fähigkeit betrieb-lesen: Sicherheits- und Zahlungsübersichten. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_betrieb_eingreifen()
returns boolean language sql stable parallel safe
set search_path = pg_catalog
as $$ select public.hat_rolle_mindestens('operator') $$;

comment on function public.darf_betrieb_eingreifen() is
  'Fähigkeit betrieb-eingreifen: IP sperren, Rückerstattung buchen. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_konten_verwalten()
returns boolean language sql stable parallel safe
set search_path = pg_catalog
as $$ select public.hat_rolle_mindestens('moderator') $$;

comment on function public.darf_konten_verwalten() is
  'Fähigkeit konten-verwalten: fremde Profile sehen, Rolle und Status vergeben. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_inhalte_moderieren()
returns boolean language sql stable parallel safe
set search_path = pg_catalog
as $$ select public.hat_rolle_mindestens('moderator') $$;

comment on function public.darf_inhalte_moderieren() is
  'Fähigkeit inhalte-moderieren: fremde Inhalte sichten und beanstanden. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

create or replace function public.darf_konfiguration_verwalten()
returns boolean language sql stable parallel safe
set search_path = pg_catalog
as $$ select public.hat_rolle_mindestens('admin') $$;

comment on function public.darf_konfiguration_verwalten() is
  'Fähigkeit konfiguration-verwalten: Postfächer, DNS-Protokoll, Modellvorschläge. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

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

-- ---------------------------------------------------------------------------
-- 2. Konten: konten-verwalten
-- ---------------------------------------------------------------------------

drop policy creator_profiles_lesen    on public.creator_profiles;
drop policy creator_profiles_aendern  on public.creator_profiles;
drop policy creator_profiles_loeschen on public.creator_profiles;

create policy creator_profiles_lesen on public.creator_profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.darf_konten_verwalten());

-- Was hier durchkommt, begrenzt der Auslöser `creator_profiles_rollenwechsel`:
-- Rolle und Status folgen canAssignRole() aus lib/auth/roles.ts. Eine
-- Moderation sieht damit zwar jedes Konto, kann aber weiterhin niemanden auf
-- ihre eigene Stufe oder darüber heben.
create policy creator_profiles_aendern on public.creator_profiles
  for update to authenticated
  using (user_id = (select auth.uid()) or public.darf_konten_verwalten())
  with check (user_id = (select auth.uid()) or public.darf_konten_verwalten());

create policy creator_profiles_loeschen on public.creator_profiles
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.darf_konten_verwalten());

-- ---------------------------------------------------------------------------
-- 3. Betrieb lesen: Sicherheit und Zahlungen
-- ---------------------------------------------------------------------------

drop policy security_events_verwaltung_lesen on public.security_events;

create policy security_events_lesen on public.security_events
  for select to authenticated using (public.darf_betrieb_lesen());

drop policy payments_verwaltung_lesen on public.payments;

create policy payments_lesen on public.payments
  for select to authenticated using (public.darf_betrieb_lesen());

drop policy refunds_verwaltung_lesen on public.refunds;

create policy refunds_lesen on public.refunds
  for select to authenticated using (public.darf_betrieb_lesen());

-- `stripe_webhooks` war bis hierher weder gelesen noch geschrieben werden
-- können. Die Tabelle führt nur Kennung, Ereignisart und Zeitpunkt – keine
-- Nutzlast, keine Kundendaten. Der Webhook selbst schreibt weiterhin
-- ausschliesslich mit dem Service-Key; eine Schreibpolicy gibt es bewusst
-- nicht.
create policy stripe_webhooks_lesen on public.stripe_webhooks
  for select to authenticated using (public.darf_betrieb_lesen());

comment on table public.stripe_webhooks is
  'Geschrieben allein über den Service-Key. Lesbar ab der Fähigkeit betrieb-lesen; die Tabelle führt keine Nutzlast.';

-- ---------------------------------------------------------------------------
-- 4. Betrieb eingreifen: sperren und erstatten
-- ---------------------------------------------------------------------------

drop policy blocked_ips_verwaltung on public.blocked_ips;

create policy blocked_ips_lesen on public.blocked_ips
  for select to authenticated using (public.darf_betrieb_lesen());

create policy blocked_ips_eingriff_anlegen on public.blocked_ips
  for insert to authenticated with check (public.darf_betrieb_eingreifen());

create policy blocked_ips_eingriff_aendern on public.blocked_ips
  for update to authenticated
  using (public.darf_betrieb_eingreifen())
  with check (public.darf_betrieb_eingreifen());

create policy blocked_ips_eingriff_loeschen on public.blocked_ips
  for delete to authenticated using (public.darf_betrieb_eingreifen());

-- `POST /api/admin/payments/refund` legt eine Zeile in `refunds` an und setzt
-- die Zahlung auf `refunded`. Beides war der Datenbank bisher nicht erlaubt.
create policy refunds_eingriff_anlegen on public.refunds
  for insert to authenticated with check (public.darf_betrieb_eingreifen());

create policy payments_eingriff_aendern on public.payments
  for update to authenticated
  using (public.darf_betrieb_eingreifen())
  with check (public.darf_betrieb_eingreifen());

-- ---------------------------------------------------------------------------
-- 5. Inhalte moderieren
-- ---------------------------------------------------------------------------

drop policy blog_comments_lesen    on public.blog_comments;
drop policy blog_comments_anlegen  on public.blog_comments;
drop policy blog_comments_aendern  on public.blog_comments;
drop policy blog_comments_loeschen on public.blog_comments;

create policy blog_comments_lesen on public.blog_comments
  for select to authenticated
  using (
    status = 'visible'
    or user_id = (select auth.uid())
    or public.darf_inhalte_moderieren()
  );

create policy blog_comments_anlegen on public.blog_comments
  for insert to authenticated
  with check (user_id = (select auth.uid()) or public.darf_inhalte_moderieren());

create policy blog_comments_aendern on public.blog_comments
  for update to authenticated
  using (user_id = (select auth.uid()) or public.darf_inhalte_moderieren())
  with check (user_id = (select auth.uid()) or public.darf_inhalte_moderieren());

create policy blog_comments_loeschen on public.blog_comments
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.darf_inhalte_moderieren());

drop policy creator_sessions_lesen   on public.creator_sessions;
drop policy creator_sessions_aendern on public.creator_sessions;

create policy creator_sessions_lesen on public.creator_sessions
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      ((select auth.jwt()) ->> 'email') is not null
      and ((select auth.jwt()) ->> 'email') = any (coalesce(shared_with, '{}'::text[]))
    )
    or public.darf_inhalte_moderieren()
  );

create policy creator_sessions_aendern on public.creator_sessions
  for update to authenticated
  using (user_id = (select auth.uid()) or public.darf_inhalte_moderieren())
  with check (user_id = (select auth.uid()) or public.darf_inhalte_moderieren());

drop policy session_review_requests_lesen                on public.session_review_requests;
drop policy session_review_requests_verwaltung_anlegen   on public.session_review_requests;
drop policy session_review_requests_verwaltung_aendern   on public.session_review_requests;
drop policy session_review_requests_verwaltung_loeschen  on public.session_review_requests;

create policy session_review_requests_lesen on public.session_review_requests
  for select to authenticated
  using (
    exists (
      select 1 from public.creator_sessions s
      where s.id = session_review_requests.session_id
        and s.user_id = (select auth.uid())
    )
    or public.darf_inhalte_moderieren()
  );

create policy session_review_requests_moderation_anlegen on public.session_review_requests
  for insert to authenticated with check (public.darf_inhalte_moderieren());

create policy session_review_requests_moderation_aendern on public.session_review_requests
  for update to authenticated
  using (public.darf_inhalte_moderieren())
  with check (public.darf_inhalte_moderieren());

create policy session_review_requests_moderation_loeschen on public.session_review_requests
  for delete to authenticated using (public.darf_inhalte_moderieren());

-- ---------------------------------------------------------------------------
-- 6. Konfiguration verwalten
-- ---------------------------------------------------------------------------

drop policy admin_email_boxes_verwaltung on public.admin_email_boxes;

create policy admin_email_boxes_konfiguration on public.admin_email_boxes
  for all to authenticated
  using (public.darf_konfiguration_verwalten())
  with check (public.darf_konfiguration_verwalten());

drop policy dns_audit_events_verwaltung_lesen on public.dns_audit_events;

create policy dns_audit_events_konfiguration_lesen on public.dns_audit_events
  for select to authenticated using (public.darf_konfiguration_verwalten());

drop policy copilot_suggestions_verwaltung on public.copilot_suggestions;

create policy copilot_suggestions_konfiguration on public.copilot_suggestions
  for all to authenticated
  using (public.darf_konfiguration_verwalten())
  with check (public.darf_konfiguration_verwalten());

-- ---------------------------------------------------------------------------
-- 7. Tabellenrechte nachziehen
-- ---------------------------------------------------------------------------
--
-- Es gilt weiter die Regel aus 20260817100300: ein Recht genau dann, wenn für
-- dieselbe Rolle und dieselbe Operation eine Policy existiert. `npm run
-- db:rechte` prüft das.

grant update on table public.payments        to authenticated;
grant insert on table public.refunds         to authenticated;
grant select on table public.stripe_webhooks to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Funktionen mit eigener Prüfung
-- ---------------------------------------------------------------------------
--
-- Beide sind SECURITY DEFINER und umgehen damit die Policies. Sie prüfen die
-- Berechtigung selbst und müssen dieselbe Fähigkeit verlangen wie die
-- Oberfläche, die sie aufruft – sonst entsteht genau der Bruch, den diese
-- Migration behebt. Die Kennzahlenleiste und die Karte „Security & Health“
-- stehen im Administrationsbereich, der ab `moderator` offen ist.

create or replace function public.admin_payments_summary_30d()
returns table (
  total_revenue_cents bigint,
  refunds_cents bigint,
  payouts_cents bigint,
  orders_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce((select sum(round(p.amount_chf * 100))::bigint
              from public.payments p
              where p.created_at >= now() - interval '30 days'
                and p.status = 'paid'), 0),
    coalesce((select sum(round(r.amount_chf * 100))::bigint
              from public.refunds r
              where r.created_at >= now() - interval '30 days'), 0),
    0::bigint,
    coalesce((select count(*)
              from public.payments p
              where p.created_at >= now() - interval '30 days'
                and p.status = 'paid'), 0)
  where public.darf_betrieb_lesen();
$$;

comment on function public.admin_payments_summary_30d() is
  'Kennzahlen der letzten 30 Tage. Payouts sind 0, solange es keine Auszahlungstabelle gibt. Liefert ohne die Fähigkeit betrieb-lesen keine Zeile.';

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
    and public.darf_betrieb_lesen()
  order by c.relname;
$$;

comment on function public.admin_security_overview() is
  'RLS-Zustand und Policy-Anzahl je Tabelle in public. Liefert ohne die Fähigkeit betrieb-lesen keine Zeile.';
