-- Jetnity V2 – Phase 1.4: Policies neu aufbauen
--
-- Der Bestand war über Jahre gewachsen: 151 Policies auf 39 Tabellen, davon
-- viele doppelt unter zwei Namen (`admin read payments` und
-- `payments admin read`), 21 an die Rolle `service_role` gebunden, die RLS
-- ohnehin umgeht, und der überwiegende Teil an die Sammelrolle `public`, die
-- jede Rolle einschließt – auch `anon`.
--
-- Gemessen wurde vorher und nachher mit `npm run db:rls`: Das Skript legt drei
-- Konten an, füllt jede Tabelle mit einer Zeile und probiert jede Kombination
-- aus Rolle, Tabelle und Operation aus. Die Belege stehen in
-- docs/DATENBANK.md.
--
-- Grundsätze dieses Neuaufbaus:
--
--   1. Jede Policy nennt ihre Rolle. `to public` gibt es nicht mehr – wer
--      `anon` mitmeint, schreibt es hin.
--   2. Keine Policy für `service_role`. Die Rolle hat BYPASSRLS; solche
--      Policies sind wirkungslos und verdecken, wer wirklich zugreifen darf.
--   3. `(select auth.uid())` statt `auth.uid()`. PostgreSQL wertet die
--      Unterabfrage einmal je Anweisung aus statt einmal je Zeile.
--   4. Genau eine Policy je Tabelle, Operation und Zielgruppe.
--   5. Administrativer Zugriff ausschließlich über
--      `public.hat_rolle_mindestens('admin')`.
--
-- Behobene Fehler, jeder einzeln nachgewiesen:
--
--   · `creator_sessions` und `session_review_requests` verglichen
--     `creator_profiles.id` mit `auth.uid()`. `id` ist ein eigener Schlüssel
--     (`uuid_generate_v4()`), die Kontokennung steht in `user_id`. Die beiden
--     Administrations-Policies konnten nie zutreffen.
--   · Die Policies auf `creator_profiles` erlaubten jedem Konto, die eigene
--     Zeile beliebig zu ändern – einschließlich `role`. Ein gewöhnlicher
--     Nutzer konnte sich damit selbst zum `owner` machen. Gemessen:
--     `update creator_profiles set role='owner'` als `authenticated`
--     lieferte `ok:1`. Der Auslöser wird weiter unten gesetzt.
--   · `creator_uploads` erlaubte `anon` das Anlegen beliebiger Zeilen, solange
--     `is_virtual = true` war. Gemessen: `ok:1`.
--   · `creator_uploads` und `session_comments` waren für `anon` vollständig
--     lesbar (`USING true`). Keine Stelle im Anwendungscode liest diese
--     Tabellen; der offene Lesezugriff entfällt.
--   · Rollen oberhalb von `admin` – also `owner` – waren von jeder
--     Administrations-Policy ausgeschlossen, weil dort `role = 'admin'` stand
--     statt eines Rangvergleichs.

-- ---------------------------------------------------------------------------
-- Alle bisherigen Policies des Schemas entfernen
-- ---------------------------------------------------------------------------
--
-- Einzeln aufzuzählen wäre eine Liste von 151 Namen, die niemand gegenlesen
-- kann. Der Neuaufbau darunter ist die vollständige Beschreibung.

do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Referenzdaten: für alle lesbar
-- ---------------------------------------------------------------------------

-- Flughäfen speisen die öffentliche Suche unter /api/search/airports. Geschrieben
-- wird dort mit dem Service-Key, deshalb gibt es keine Schreib-Policy.
create policy airports_lesen on public.airports
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Konten und Rollen
-- ---------------------------------------------------------------------------

create policy profile_eigenes_lesen on public.creator_profiles
  for select to authenticated using (user_id = (select auth.uid()));

create policy profile_verwaltung_lesen on public.creator_profiles
  for select to authenticated using (public.hat_rolle_mindestens('admin'));

create policy profile_eigenes_anlegen on public.creator_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Was hier erlaubt ist, begrenzt der Auslöser `creator_profiles_rollenwechsel`
-- weiter unten: Rolle und Status darf niemand an sich selbst ändern.
create policy profile_eigenes_aendern on public.creator_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy profile_verwaltung_aendern on public.creator_profiles
  for update to authenticated
  using (public.hat_rolle_mindestens('admin'))
  with check (public.hat_rolle_mindestens('admin'));

create policy profile_eigenes_loeschen on public.creator_profiles
  for delete to authenticated using (user_id = (select auth.uid()));

create policy profile_verwaltung_loeschen on public.creator_profiles
  for delete to authenticated using (public.hat_rolle_mindestens('admin'));

-- ---------------------------------------------------------------------------
-- Administration und Betrieb
-- ---------------------------------------------------------------------------

create policy admin_email_boxes_verwaltung on public.admin_email_boxes
  for all to authenticated
  using (public.hat_rolle_mindestens('admin'))
  with check (public.hat_rolle_mindestens('admin'));

create policy dns_audit_events_verwaltung_lesen on public.dns_audit_events
  for select to authenticated using (public.hat_rolle_mindestens('admin'));

-- Bisher gab es hier nur Lesepolicies. Die Oberfläche (SecurityWidget) und die
-- Routen `api/admin/security/block` und `…/unblock` schreiben aber über den
-- Client des angemeldeten Kontos – das Sperren einer IP war dadurch
-- wirkungslos. Schreiben gehört zum Zweck der Tabelle.
create policy blocked_ips_verwaltung on public.blocked_ips
  for all to authenticated
  using (public.hat_rolle_mindestens('admin'))
  with check (public.hat_rolle_mindestens('admin'));

create policy security_events_verwaltung_lesen on public.security_events
  for select to authenticated using (public.hat_rolle_mindestens('admin'));

create policy payments_verwaltung_lesen on public.payments
  for select to authenticated using (public.hat_rolle_mindestens('admin'));

create policy refunds_verwaltung_lesen on public.refunds
  for select to authenticated using (public.hat_rolle_mindestens('admin'));

-- Stripe-Ereignisse schreibt und liest nur der Webhook mit dem Service-Key.
-- Für `anon` und `authenticated` gibt es bewusst keine Policy.

create policy copilot_suggestions_verwaltung on public.copilot_suggestions
  for all to authenticated
  using (public.hat_rolle_mindestens('admin'))
  with check (public.hat_rolle_mindestens('admin'));

-- ---------------------------------------------------------------------------
-- Blog
-- ---------------------------------------------------------------------------

create policy blog_posts_veroeffentlichte_lesen on public.blog_posts
  for select to anon, authenticated using (status = 'published'::public.blog_status);

create policy blog_posts_eigene on public.blog_posts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy blog_comments_sichtbare_lesen on public.blog_comments
  for select to anon, authenticated using (status = 'visible');

create policy blog_comments_eigene_anlegen on public.blog_comments
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy blog_comments_eigene_aendern on public.blog_comments
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy blog_comments_eigene_loeschen on public.blog_comments
  for delete to authenticated using (user_id = (select auth.uid()));

create policy blog_comments_verwaltung on public.blog_comments
  for all to authenticated
  using (public.hat_rolle_mindestens('admin'))
  with check (public.hat_rolle_mindestens('admin'));

-- ---------------------------------------------------------------------------
-- Creator-Sitzungen und deren Anhänge
--
-- Diese Tabellen stammen aus dem Creator-Hub und werden von der Anwendung
-- derzeit nicht gelesen (Nachweis: `npm run db:verwendung`). Sie bleiben
-- vorerst bestehen (siehe docs/DATENBANK.md, „Einordnung der Altlasten"),
-- werden hier aber auf das Nötige zurückgeführt: Eigentümerzugriff für
-- angemeldete Konten, kein Zugriff für `anon`.
-- ---------------------------------------------------------------------------

create policy creator_sessions_eigene_lesen on public.creator_sessions
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      ((select auth.jwt()) ->> 'email') is not null
      and ((select auth.jwt()) ->> 'email') = any (coalesce(shared_with, '{}'::text[]))
    )
  );

create policy creator_sessions_eigene_anlegen on public.creator_sessions
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy creator_sessions_eigene_aendern on public.creator_sessions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy creator_sessions_eigene_loeschen on public.creator_sessions
  for delete to authenticated using (user_id = (select auth.uid()));

create policy creator_sessions_verwaltung_lesen on public.creator_sessions
  for select to authenticated using (public.hat_rolle_mindestens('admin'));

create policy creator_sessions_verwaltung_aendern on public.creator_sessions
  for update to authenticated
  using (public.hat_rolle_mindestens('admin'))
  with check (public.hat_rolle_mindestens('admin'));

create policy creator_uploads_eigene on public.creator_uploads
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy creator_session_metrics_eigene on public.creator_session_metrics
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy creator_alert_rules_eigene on public.creator_alert_rules
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy creator_alert_events_eigene_lesen on public.creator_alert_events
  for select to authenticated using (user_id = (select auth.uid()));

create policy creator_publish_queue_eigene on public.creator_publish_queue
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy creator_publish_events_eigene_lesen on public.creator_publish_events
  for select to authenticated
  using (
    exists (
      select 1 from public.creator_sessions s
      where s.id = creator_publish_events.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy creator_publish_schedule_eigene_lesen on public.creator_publish_schedule
  for select to authenticated
  using (
    exists (
      select 1 from public.creator_sessions s
      where s.id = creator_publish_schedule.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy creator_publish_schedule_eigene_anlegen on public.creator_publish_schedule
  for insert to authenticated
  with check (
    exists (
      select 1 from public.creator_sessions s
      where s.id = creator_publish_schedule.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy edit_docs_eigene on public.edit_docs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy media_versions_eigene_lesen on public.media_versions
  for select to authenticated using (user_id = (select auth.uid()));

create policy media_versions_eigene_anlegen on public.media_versions
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy render_jobs_eigene on public.render_jobs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_cocreations_eigene on public.session_cocreations
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_comments_eigene on public.session_comments
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_comments_sitzungseigner_lesen on public.session_comments
  for select to authenticated
  using (
    exists (
      select 1 from public.creator_sessions s
      where s.id = session_comments.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy session_impressions_eigene on public.session_impressions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_media_eigene on public.session_media
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_saves_eigene on public.session_saves
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_snippets_eigene on public.session_snippets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_stories_eigene on public.session_stories
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_versions_eigene_lesen on public.session_versions
  for select to authenticated using (user_id = (select auth.uid()));

create policy session_versions_eigene_anlegen on public.session_versions
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy session_versions_eigene_loeschen on public.session_versions
  for delete to authenticated using (user_id = (select auth.uid()));

create policy session_views_eigene on public.session_views
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_metrics_sitzungseigner_lesen on public.session_metrics
  for select to authenticated
  using (
    exists (
      select 1 from public.creator_sessions s
      where s.id = session_metrics.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy session_metrics_daily_sitzungseigner_lesen on public.session_metrics_daily
  for select to authenticated
  using (
    exists (
      select 1 from public.creator_sessions s
      where s.id = session_metrics_daily.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy session_review_requests_sitzungseigner_lesen on public.session_review_requests
  for select to authenticated
  using (
    exists (
      select 1 from public.creator_sessions s
      where s.id = session_review_requests.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy session_review_requests_verwaltung on public.session_review_requests
  for all to authenticated
  using (public.hat_rolle_mindestens('admin'))
  with check (public.hat_rolle_mindestens('admin'));

-- ---------------------------------------------------------------------------
-- Insights
-- ---------------------------------------------------------------------------

create policy insights_bets_eigene on public.insights_bets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy insights_user_settings_eigene on public.insights_user_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Rechteausweitung über das eigene Profil verhindern
-- ---------------------------------------------------------------------------
--
-- RLS allein reicht dafür nicht: `USING` sieht die alte Zeile, `WITH CHECK` die
-- neue, und keine der beiden Bedingungen kann beide vergleichen. Genau das ist
-- hier nötig – erlaubt sein soll „Profil ändern", nicht „Rolle ändern".
--
-- Die Regeln entsprechen `canAssignRole()` in lib/auth/roles.ts:
--   · niemand ändert die eigene Rolle oder den eigenen Status,
--   · wer eingreift, muss echt höher stehen als die bisherige und die künftige
--     Rolle – `owner` ausgenommen, sonst gäbe es keine Nachfolge,
--   · Statusänderungen ab `moderator`.
--
-- Ohne angemeldetes Konto greift der Auslöser nicht: Dann stammt die Änderung
-- aus einem Kontext mit BYPASSRLS (Service-Key, Wartung), den keine Policy
-- erreicht.

create or replace function public.creator_profiles_rollenwechsel_pruefen()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  handelnder uuid := (select auth.uid());
  rang_handelnder integer;
begin
  if handelnder is null then
    return new;
  end if;

  rang_handelnder := public.rollenrang(public.aktuelle_rolle());

  if new.role is distinct from old.role then
    if old.user_id = handelnder then
      raise exception 'Die eigene Rolle lässt sich nicht ändern.'
        using errcode = 'check_violation';
    end if;
    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then
      raise exception 'Keine Berechtigung, Rollen zu vergeben.'
        using errcode = 'insufficient_privilege';
    end if;
    if rang_handelnder < public.rollenrang('owner')
       and (rang_handelnder <= coalesce(public.rollenrang(old.role), -1)
            or rang_handelnder <= coalesce(public.rollenrang(new.role), -1)) then
      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  if new.status is distinct from old.status then
    if old.user_id = handelnder then
      raise exception 'Der eigene Kontostatus lässt sich nicht ändern.'
        using errcode = 'check_violation';
    end if;
    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then
      raise exception 'Keine Berechtigung, den Kontostatus zu ändern.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  return new;
end
$$;

comment on function public.creator_profiles_rollenwechsel_pruefen() is
  'Verhindert Selbstbeförderung und Rollenvergabe oberhalb des eigenen Rangs. Entspricht canAssignRole() in lib/auth/roles.ts.';

drop trigger if exists creator_profiles_rollenwechsel on public.creator_profiles;

create trigger creator_profiles_rollenwechsel
  before update on public.creator_profiles
  for each row execute function public.creator_profiles_rollenwechsel_pruefen();
