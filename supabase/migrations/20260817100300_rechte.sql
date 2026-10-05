-- Jetnity V2 – Phase 1.4: Tabellen- und Funktionsrechte auf das Nötige begrenzen
--
-- Bis hierher hatten `anon` und `authenticated` auf allen 39 Tabellen sämtliche
-- Rechte: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES und TRIGGER.
-- Einzige Schranke war RLS.
--
-- Das ist aus zwei Gründen zu wenig.
--
-- Erstens greift TRUNCATE an RLS vorbei – die Regel gilt für Zeilen, TRUNCATE
-- arbeitet auf der Tabelle. Gemessen: `truncate table public.airports` als
-- `anon` lieferte `ok:0`, also Erfolg. Über PostgREST ist das nicht direkt
-- auslösbar, denn die Schnittstelle kennt nur SELECT, INSERT, UPDATE, DELETE
-- und RPC. Ein Recht, das niemand braucht und dessen einzige Schranke die
-- Schnittstelle davor ist, gehört trotzdem nicht vergeben.
--
-- Zweitens ist RLS als alleinige Schranke ein einzelner Punkt, an dem alles
-- hängt. Eine vergessene Policy auf einer neuen Tabelle wäre bei aktiviertem
-- RLS zwar dicht – aber eine versehentlich zu weit gefasste Policy trifft
-- sofort auf volle Tabellenrechte. Zwei unabhängige Schranken sind besser.
--
-- Die Regel dieser Datei: Ein Recht wird genau dann vergeben, wenn für dieselbe
-- Rolle, dieselbe Tabelle und dieselbe Operation eine Policy existiert.
-- `scripts/db/rechte.mjs` prüft diese Übereinstimmung; `npm run db:rechte`
-- schlägt fehl, sobald Rechte und Policies auseinanderlaufen.

-- ---------------------------------------------------------------------------
-- 1. Bisherige Rechte zurücknehmen
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Standardrechte für künftige Objekte: Eine neue Tabelle bekommt keine Rechte
-- geschenkt. Wer sie über die Schnittstelle erreichbar machen will, schreibt
-- den Grant in die Migration, die die Tabelle anlegt – zusammen mit der Policy.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Tabellenrechte, passend zu den Policies aus 20260817100100
-- ---------------------------------------------------------------------------

-- Ohne Anmeldung lesbar: Referenzdaten und veröffentlichte Inhalte.
grant select on table public.airports      to anon;
grant select on table public.blog_posts    to anon;
grant select on table public.blog_comments to anon;

-- Angemeldete Konten.
grant select                         on table public.airports                 to authenticated;
grant select, insert, update, delete on table public.admin_email_boxes        to authenticated;
grant select, insert, update, delete on table public.blocked_ips              to authenticated;
grant select, insert, update, delete on table public.blog_comments            to authenticated;
grant select, insert, update, delete on table public.blog_posts               to authenticated;
grant select, insert, update, delete on table public.copilot_suggestions      to authenticated;
grant select                         on table public.creator_alert_events     to authenticated;
grant select, insert, update, delete on table public.creator_alert_rules      to authenticated;
grant select, insert, update, delete on table public.creator_profiles         to authenticated;
grant select                         on table public.creator_publish_events   to authenticated;
grant select, insert, update, delete on table public.creator_publish_queue    to authenticated;
grant select, insert                 on table public.creator_publish_schedule to authenticated;
grant select, insert, update, delete on table public.creator_session_metrics  to authenticated;
grant select, insert, update, delete on table public.creator_sessions         to authenticated;
grant select, insert, update, delete on table public.creator_uploads          to authenticated;
grant select                         on table public.dns_audit_events         to authenticated;
grant select, insert, update, delete on table public.edit_docs                to authenticated;
grant select, insert, update, delete on table public.insights_bets            to authenticated;
grant select, insert, update, delete on table public.insights_user_settings   to authenticated;
grant select, insert                 on table public.media_versions           to authenticated;
grant select                         on table public.payments                 to authenticated;
grant select                         on table public.refunds                  to authenticated;
grant select, insert, update, delete on table public.render_jobs              to authenticated;
grant select                         on table public.security_events          to authenticated;
grant select, insert, update, delete on table public.session_cocreations      to authenticated;
grant select, insert, update, delete on table public.session_comments         to authenticated;
grant select, insert, update, delete on table public.session_impressions      to authenticated;
grant select, insert, update, delete on table public.session_media            to authenticated;
grant select                         on table public.session_metrics          to authenticated;
grant select                         on table public.session_metrics_daily    to authenticated;
grant select, insert, update, delete on table public.session_review_requests  to authenticated;
grant select, insert, update, delete on table public.session_saves            to authenticated;
grant select, insert, update, delete on table public.session_snippets         to authenticated;
grant select, insert, update, delete on table public.session_stories          to authenticated;
grant select, insert, delete         on table public.session_versions         to authenticated;
grant select, insert, update, delete on table public.session_views            to authenticated;

-- `stripe_webhooks` erhält bewusst kein Recht. Die Tabelle gehört allein dem
-- Webhook, der mit dem Service-Key schreibt.

-- ---------------------------------------------------------------------------
-- 3. Funktionsrechte
-- ---------------------------------------------------------------------------
--
-- 22 der Funktionen im Schema sind SECURITY DEFINER und liefen bis hierher für
-- jeden Aufrufer – auch ohne Anmeldung. Die Advisors melden das als
-- `anon_security_definer_function_executable`. Ein Beispiel, gemessen:
-- `select public.creator_alerts_eval_all()` als `anon` lieferte `ok:1`. Die
-- Funktion wertet die Regeln sämtlicher Konten aus und schreibt Ereigniszeilen.
--
-- Auslöserfunktionen sind davon nicht betroffen: PostgreSQL prüft EXECUTE beim
-- Anlegen des Auslösers, nicht bei jedem Auslösen.

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as signatur
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind in ('f', 'p')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signatur);
  end loop;
end $$;

-- Was die Anwendung wirklich aufruft, steht in `scripts/db/verwendung.mjs`.
-- Es sind zwei RPCs: `admin_payments_summary_30d` (Kennzahlenleiste im
-- Administrationsbereich) und `admin_security_overview` – letztere existiert
-- in der Datenbank nicht, siehe docs/DATENBANK.md.
grant execute on function public.admin_payments_summary_30d() to authenticated;

-- Die Rollenfunktionen werden aus Policies heraus ausgewertet und brauchen
-- deshalb das Recht der auswertenden Rolle.
grant execute on function public.rollenrang(text)            to authenticated, service_role;
grant execute on function public.aktuelle_rolle()            to authenticated, service_role;
grant execute on function public.hat_rolle_mindestens(text)  to authenticated, service_role;

-- Alle übrigen Funktionen bleiben ohne Recht für `anon` und `authenticated`.
-- Es sind Reste des Creator-Hubs; acht davon laufen ohnehin in einen Fehler
-- (Nachweis in docs/DATENBANK.md). Sie werden mit dem Creator-Hub entfernt,
-- nicht vorher – erst ist die Einordnung der Altlasten abzuschließen.
