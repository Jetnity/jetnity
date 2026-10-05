-- Jetnity V2 – Phase 1.4: Doppelungen und defekte Objekte im Schema
--
-- Die Befunde stammen aus den Supabase-Advisors und aus einem Durchlauf gegen
-- jede aufrufbare Funktion des Schemas (docs/DATENBANK.md, „Funktionen").

-- ---------------------------------------------------------------------------
-- 1. Deckungsgleiche Indizes
-- ---------------------------------------------------------------------------
--
-- Jede Gruppe unten beschreibt dieselben Zeilen mit demselben Zugriffsverfahren.
-- Der zweite Index kostet Schreibarbeit und Speicher, ohne eine Abfrage
-- schneller zu machen. Erhalten bleibt jeweils der Index, der zu einem
-- Schlüssel gehört, sonst der mit dem Namensschema `<tabelle>_<spalte>_idx`.

-- Der eindeutige Index bedient dieselben Zugriffe wie der einfache und
-- garantiert zusätzlich die Eindeutigkeit.
drop index if exists public.airports_iata_idx;
drop index if exists public.airports_icao_idx;

drop index if exists public.airports_name_trgm_idx;
drop index if exists public.airports_city_trgm_idx;
drop index if exists public.airports_country_trgm_idx;

drop index if exists public.idx_blog_posts_status;

-- `username` ist vom Typ `citext` und damit ohnehin ohne Rücksicht auf
-- Groß- und Kleinschreibung eindeutig; der zweite Index fügt nichts hinzu.
drop index if exists public.creator_profiles_username_ci_unique;

-- `session_id` ist Primärschlüssel dieser Tabelle. Daneben standen eine
-- zusätzliche Eindeutigkeitsbedingung und zwei weitere Indizes auf derselben
-- Spalte.
alter table public.creator_session_metrics
  drop constraint if exists creator_session_metrics_session_id_key;
drop index if exists public.csm_session_unique;
drop index if exists public.idx_csm_session;

drop index if exists public.render_jobs_created_idx;
drop index if exists public.idx_session_comments_session;
drop index if exists public.idx_session_saves_user_id;

-- Deckungsgleich mit dem jeweiligen Primärschlüssel.
drop index if exists public.idx_session_metrics_session;
drop index if exists public.idx_smd_session_date;

-- ---------------------------------------------------------------------------
-- 2. Fremdschlüssel ohne Index
-- ---------------------------------------------------------------------------
--
-- Ohne Index muss PostgreSQL beim Löschen einer Elternzeile die Kindtabelle
-- vollständig lesen. Dieselben Spalten stehen zudem in den Bedingungen der
-- Policies aus 20260817100100 – jede Prüfung liest sie.

create index if not exists blog_comments_reviewed_by_idx        on public.blog_comments (reviewed_by);
create index if not exists creator_alert_events_rule_id_idx     on public.creator_alert_events (rule_id);
create index if not exists creator_alert_rules_user_id_idx      on public.creator_alert_rules (user_id);
create index if not exists creator_publish_queue_session_id_idx on public.creator_publish_queue (session_id);
create index if not exists edit_docs_user_id_idx                on public.edit_docs (user_id);
create index if not exists media_versions_edit_doc_id_idx       on public.media_versions (edit_doc_id);
create index if not exists media_versions_session_id_idx        on public.media_versions (session_id);
create index if not exists media_versions_user_id_idx           on public.media_versions (user_id);
create index if not exists render_jobs_edit_id_idx              on public.render_jobs (edit_id);
create index if not exists render_jobs_edit_doc_id_idx          on public.render_jobs (edit_doc_id);
create index if not exists session_cocreations_session_id_idx   on public.session_cocreations (session_id);
create index if not exists session_cocreations_user_id_idx      on public.session_cocreations (user_id);
create index if not exists session_impressions_session_id_idx   on public.session_impressions (session_id);
create index if not exists session_media_user_id_idx            on public.session_media (user_id);
create index if not exists session_snippets_user_id_idx         on public.session_snippets (user_id);
create index if not exists session_stories_session_id_idx       on public.session_stories (session_id);
create index if not exists session_stories_user_id_idx          on public.session_stories (user_id);
create index if not exists session_versions_session_id_idx      on public.session_versions (session_id);
create index if not exists session_views_session_id_idx         on public.session_views (session_id);

-- ---------------------------------------------------------------------------
-- 3. Doppelte Auslöser
-- ---------------------------------------------------------------------------
--
-- Zwei Auslöser mit derselben Aufgabe an derselben Tabelle laufen beide. Bei
-- `updated_at` ist das nur Verschwendung, bei `blog_posts` liefen zwei
-- verschiedene Funktionen für dieselbe Zuordnung des Eigentümers.

drop trigger if exists trg_edit_docs_updated on public.edit_docs;
drop trigger if exists trg_render_jobs_updated on public.render_jobs;
drop trigger if exists blog_posts_biu on public.blog_posts;

-- ---------------------------------------------------------------------------
-- 4. Funktion ohne festgelegten search_path
-- ---------------------------------------------------------------------------
--
-- Ohne `search_path` entscheidet die aufrufende Sitzung, welches `now()` und
-- welches Schema gemeint ist. Bei einer Auslöserfunktion, die an fremden
-- Tabellen hängt, ist das eine offene Flanke. Alle übrigen Funktionen des
-- Schemas haben den Wert bereits gesetzt.

alter function public.tg_set_updated_at() set search_path = pg_catalog, public;

-- ---------------------------------------------------------------------------
-- 5. `admin_payments_summary_30d` instand setzen
-- ---------------------------------------------------------------------------
--
-- Die Funktion versorgt die Kennzahlenleiste im Administrationsbereich
-- (components/admin/home/AdminStatsStrip.tsx). Sie war auf zwei Wegen defekt:
--
--   · Sie las `public.payouts`. Diese Tabelle existiert nicht. Jeder Aufruf
--     endete mit `42P01 relation "public.payouts" does not exist`.
--   · Sie suchte in `information_schema` nach den Spalten `amount_cents` oder
--     `amount`. `public.payments` hat weder das eine noch das andere, sondern
--     `amount_chf`. Der Betrag wäre also selbst bei vorhandener Tabelle mit
--     `0` eingesetzt worden – ohne Fehlermeldung.
--
-- Die neue Fassung liest die Spalten, die es gibt, und rechnet wie der Rest der
-- Anwendung: `status = 'paid'` zählt als Umsatz (app/api/admin/payments/
-- summary/route.ts), Erstattungen kommen aus `public.refunds`.
--
-- Sie ist weiterhin SECURITY DEFINER, prüft die Berechtigung aber jetzt selbst.
-- Vorher konnte jedes angemeldete Konto die Umsatzzahlen der Plattform lesen:
-- Die Funktion umging als DEFINER die Policies auf `payments`, und ein
-- Rechtenachweis fand nicht statt.
--
-- `payouts_cents` bleibt im Rückgabetyp, damit der Aufrufer unverändert
-- bleibt, und liefert 0: Auszahlungen sind in Jetnity V2 kein Begriff. Sobald
-- es einen gibt, gehört er in eine eigene Migration.

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
  where public.hat_rolle_mindestens('admin');
$$;

comment on function public.admin_payments_summary_30d() is
  'Kennzahlen der letzten 30 Tage für den Administrationsbereich. Liefert ohne Rolle admin keine Zeile.';

revoke all on function public.admin_payments_summary_30d() from public, anon, authenticated;
grant execute on function public.admin_payments_summary_30d() to authenticated;
