-- Jetnity V2 – Phase 1.4b: die 29 obsoleten Legacy-Tabellen entfernen
--
-- Grundlage ist die Einordnung aus Phase 1.4 (`docs/DATENBANK.md` Abschnitt 10).
-- Sie ist gegen den realen Development-Stand erneut geprüft worden, nicht aus
-- den Namen abgeleitet. Der Nachweis je Objekt steht in
-- `docs/LEGACY_ENTFERNUNG.md`; hier stehen nur die Gründe, die die Reihenfolge
-- der Anweisungen bestimmen.
--
-- Was geprüft wurde, bevor eine Zeile geschrieben war:
--
--   * Zeilen        – alle 29 Tabellen sind leer. Es wird keine Daten vernichtet.
--   * Fremdschlüssel – keine Tabelle ausserhalb der 29 verweist auf eine der 29.
--                     Die 50 Fremdschlüssel der 29 zeigen nach aussen
--                     (`auth.users`, `creator_profiles`, `creator_sessions`)
--                     oder untereinander und fallen mit ihrer Tabelle.
--   * Views          – in `public` existiert keine View und keine
--                     materialisierte View.
--   * Publikationen  – `supabase_realtime` führt keine Tabelle.
--   * Anwendungscode – `npm run db:verwendung` findet 8 Tabellen und 2 RPCs,
--                     keine davon in dieser Liste.
--
-- Absichtlich **ohne** `cascade`. Ein `drop … cascade` würde eine unerwartete
-- Abhängigkeit stillschweigend mitnehmen; ohne `cascade` scheitert die
-- Migration stattdessen. Damit ist jede Reihenfolge hier eine geprüfte
-- Aussage und keine Vermutung.

-- ---------------------------------------------------------------------------
-- 1. Abfragefunktionen der Creator-Analytics und des Blog-Publishings
-- ---------------------------------------------------------------------------
-- Diese 18 Signaturen lesen oder schreiben eine der 29 Tabellen. PostgreSQL
-- verfolgt Tabellenbezüge im Rumpf einer Funktion nicht: Sie überlebten den
-- `drop table` und würden erst beim Aufruf mit „relation does not exist"
-- scheitern. Deshalb fallen sie ausdrücklich, und zwar zuerst.
--
-- `publish_due_blog_posts` muss zwingend vor `blog_posts` fallen: Sie gibt
-- `setof blog_posts` zurück und hängt damit hart am Zeilentyp der Tabelle.
-- Ohne diese Reihenfolge bricht der `drop table` ab – nachgewiesen im
-- Trockenlauf.
--
-- Die `jsonb`-Fassungen sind Hüllen um die typisierte Fassung derselben
-- Funktion. Sie fallen vor ihr, damit die Auflösung der Signatur eindeutig
-- bleibt.

drop function if exists public.creator_alerts_eval_all();
drop function if exists public.creator_alerts_eval_current_user();
drop function if exists public.creator_alerts_eval_for(uuid);

drop function if exists public.creator_impact_percentile(jsonb);
drop function if exists public.creator_impact_percentile(integer);
drop function if exists public.creator_metrics_timeseries(jsonb);
drop function if exists public.creator_metrics_timeseries(integer, public.creator_content_type);
drop function if exists public.creator_posting_heatmap(jsonb);
drop function if exists public.creator_posting_heatmap(integer, public.creator_content_type);

drop function if exists public.csm_increment_impressions(uuid);
drop function if exists public.csm_increment_views(uuid);
drop function if exists public.increment_impression(uuid);
drop function if exists public.increment_like(uuid);
drop function if exists public.increment_view(uuid);
drop function if exists public.platform_avg_impact_score();
drop function if exists public.platform_avg_impact_score(integer);

drop function if exists public.publish_due_blog_posts(integer);
drop function if exists public.publish_due_posts();

-- ---------------------------------------------------------------------------
-- 2. Die 29 Tabellen
-- ---------------------------------------------------------------------------
-- In einer Anweisung, damit PostgreSQL die Fremdschlüssel untereinander selbst
-- auflöst – `blog_comments` → `blog_posts`, `creator_alert_events` →
-- `creator_alert_rules`, `media_versions`/`render_jobs` → `edit_docs`,
-- `session_comments` → sich selbst.
--
-- Mit den Tabellen fallen ihre 102 Indizes, 102 Bedingungen, 47 Policies, 9
-- Trigger, 98 Tabellenrechte und die Sequenz `copilot_suggestions_id_seq`.
-- Das ist kein Nebeneffekt, sondern die Definition von `drop table`: Objekte,
-- die einer Tabelle gehören, haben ohne sie keine Bedeutung.

drop table if exists
  public.admin_email_boxes,
  public.blog_comments,
  public.blog_posts,
  public.copilot_suggestions,
  public.creator_alert_events,
  public.creator_alert_rules,
  public.creator_publish_events,
  public.creator_publish_queue,
  public.creator_publish_schedule,
  public.creator_session_metrics,
  public.creator_uploads,
  public.dns_audit_events,
  public.edit_docs,
  public.insights_bets,
  public.insights_user_settings,
  public.media_versions,
  public.render_jobs,
  public.session_cocreations,
  public.session_comments,
  public.session_impressions,
  public.session_media,
  public.session_metrics,
  public.session_metrics_daily,
  public.session_review_requests,
  public.session_saves,
  public.session_snippets,
  public.session_stories,
  public.session_versions,
  public.session_views;

-- ---------------------------------------------------------------------------
-- 3. Triggerfunktionen, die mit ihren Tabellen ihre Aufgabe verloren haben
-- ---------------------------------------------------------------------------
-- Erst hier, nicht früher: Solange der Trigger existiert, hängt die Funktion
-- an ihm und liesse sich nur mit `cascade` entfernen. Nach dem `drop table`
-- ist der Trigger weg und die Funktion ohne Aufrufer.
--
-- Der Nachweis je Funktion ist eine vollständige Aufzählung ihrer Trigger:
--
--   `set_owner`                – nur `blog_posts.blog_posts_set_owner`
--   `creator_uploads_set_slug` – nur `creator_uploads.trg_creator_uploads_set_slug`
--   `slugify`                  – kein Trigger; einziger Aufrufer war
--                                `creator_uploads_set_slug`
--   `tg_set_updated_at`        – nur `creator_alert_rules`, `creator_publish_queue`,
--                                `edit_docs`, `insights_user_settings`
--   `touch_updated_at`         – nur `creator_publish_schedule`
--   `blog_posts_set_owner`     – kein Trigger. Die Funktion war bereits vorher
--                                unbenutzt: Der gleichnamige Trigger auf
--                                `blog_posts` rief `set_owner` auf, nicht sie
--
-- Nicht entfernt wird `set_updated_at`. Sie hing an `blog_posts` und
-- `render_jobs` – und an `creator_sessions.t_creator_sessions_updated_at`.
-- `creator_sessions` bleibt, also bleibt auch die Funktion. Von den drei
-- inhaltsgleichen `updated_at`-Triggerfunktionen ist sie die einzige mit
-- verbleibendem Aufrufer; damit ist die Dreifachpflege nebenbei aufgelöst.

drop function if exists public.blog_posts_set_owner();
drop function if exists public.creator_uploads_set_slug();
drop function if exists public.slugify(text);
drop function if exists public.set_owner();
drop function if exists public.tg_set_updated_at();
drop function if exists public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Enums, deren letzte Verwendung entfallen ist
-- ---------------------------------------------------------------------------
-- `blog_status` – einzige Spalte war `blog_posts.status`, einzige Funktion
--                 `publish_due_posts()`. Beide sind weg.
-- `creator_content_type` – Spalten `creator_alert_rules.content_type` und
--                 `creator_session_metrics.content_type`, ausserdem die
--                 Signaturen von `creator_metrics_timeseries` und
--                 `creator_posting_heatmap`. Alle vier sind weg.
--
-- `visibility_status` bleibt: `creator_sessions.visibility` benutzt ihn.
--
-- `session_status` bleibt ebenfalls – nicht aus Vorsicht, sondern weil der
-- Nachweis fehlt. Der Typ hat auf dem Branch keine Spalte, keine Funktion und
-- keinen Eintrag in `pg_depend`; er war schon vor dieser Migration verwaist.
-- Seine Werte (`pending`, `approved`, `rejected`) passen sowohl zur entfernten
-- `session_review_requests.status` als auch zur verbleibenden
-- `creator_sessions.review_status` – beide sind `text`. Damit gehört er nicht
-- nachweisbar ausschliesslich zur Legacy-Struktur, und diese Migration
-- entfernt nur, was nachgewiesen ist. Er ist als offener Punkt geführt.

drop type if exists public.blog_status;
drop type if exists public.creator_content_type;
