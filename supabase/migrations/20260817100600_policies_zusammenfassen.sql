-- Jetnity V2 – Phase 1.4: überlappende Policies zusammenfassen
--
-- Nach 20260817100100 melden die Advisors noch zwölfmal
-- `multiple_permissive_policies`: Auf sechs Tabellen gelten für dieselbe Rolle
-- und dieselbe Operation zwei Policies nebeneinander – eine für die eigenen
-- Zeilen, eine für die Administration oder für veröffentlichte Inhalte.
--
-- PostgreSQL wertet bei mehreren zulassenden Policies jede einzeln aus und
-- verknüpft die Ergebnisse mit ODER. Zwei Policies kosten also zwei
-- Auswertungen je Zeile, wo eine mit einem ODER genügt.
--
-- Aufgeteilt bleibt, was verschiedene Zielgruppen hat: Was `anon` lesen darf,
-- steht in einer eigenen Policy für `anon`. Sonst müsste man beim Lesen einer
-- Bedingung erst prüfen, welcher Teil davon für wen gilt.
--
-- Die Zugriffe ändern sich dadurch nicht. `npm run db:sicherheit` weist das
-- vorher wie nachher mit denselben 42 Fällen nach.

-- ---------------------------------------------------------------------------
-- Profile: eigene Zeile oder Administration
-- ---------------------------------------------------------------------------

drop policy profile_eigenes_lesen        on public.creator_profiles;
drop policy profile_verwaltung_lesen     on public.creator_profiles;
drop policy profile_eigenes_aendern      on public.creator_profiles;
drop policy profile_verwaltung_aendern   on public.creator_profiles;
drop policy profile_eigenes_loeschen     on public.creator_profiles;
drop policy profile_verwaltung_loeschen  on public.creator_profiles;

create policy creator_profiles_lesen on public.creator_profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.hat_rolle_mindestens('admin'));

-- Was hier durchkommt, begrenzt der Auslöser `creator_profiles_rollenwechsel`
-- weiter: Rolle und Status folgen den Regeln aus lib/auth/roles.ts.
create policy creator_profiles_aendern on public.creator_profiles
  for update to authenticated
  using (user_id = (select auth.uid()) or public.hat_rolle_mindestens('admin'))
  with check (user_id = (select auth.uid()) or public.hat_rolle_mindestens('admin'));

create policy creator_profiles_loeschen on public.creator_profiles
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.hat_rolle_mindestens('admin'));

-- ---------------------------------------------------------------------------
-- Blogbeiträge: ohne Anmeldung nur Veröffentlichtes
-- ---------------------------------------------------------------------------

drop policy blog_posts_veroeffentlichte_lesen on public.blog_posts;
drop policy blog_posts_eigene                 on public.blog_posts;

create policy blog_posts_oeffentlich_lesen on public.blog_posts
  for select to anon
  using (status = 'published'::public.blog_status);

create policy blog_posts_lesen on public.blog_posts
  for select to authenticated
  using (
    status = 'published'::public.blog_status
    or user_id = (select auth.uid())
  );

create policy blog_posts_eigene_anlegen on public.blog_posts
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy blog_posts_eigene_aendern on public.blog_posts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy blog_posts_eigene_loeschen on public.blog_posts
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Blogkommentare: sichtbare für alle, eigene und Moderation zusätzlich
-- ---------------------------------------------------------------------------

drop policy blog_comments_sichtbare_lesen  on public.blog_comments;
drop policy blog_comments_eigene_anlegen   on public.blog_comments;
drop policy blog_comments_eigene_aendern   on public.blog_comments;
drop policy blog_comments_eigene_loeschen  on public.blog_comments;
drop policy blog_comments_verwaltung       on public.blog_comments;

create policy blog_comments_oeffentlich_lesen on public.blog_comments
  for select to anon using (status = 'visible');

create policy blog_comments_lesen on public.blog_comments
  for select to authenticated
  using (
    status = 'visible'
    or user_id = (select auth.uid())
    or public.hat_rolle_mindestens('admin')
  );

create policy blog_comments_anlegen on public.blog_comments
  for insert to authenticated
  with check (user_id = (select auth.uid()) or public.hat_rolle_mindestens('admin'));

create policy blog_comments_aendern on public.blog_comments
  for update to authenticated
  using (user_id = (select auth.uid()) or public.hat_rolle_mindestens('admin'))
  with check (user_id = (select auth.uid()) or public.hat_rolle_mindestens('admin'));

create policy blog_comments_loeschen on public.blog_comments
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.hat_rolle_mindestens('admin'));

-- ---------------------------------------------------------------------------
-- Creator-Sitzungen
-- ---------------------------------------------------------------------------

drop policy creator_sessions_eigene_lesen      on public.creator_sessions;
drop policy creator_sessions_verwaltung_lesen  on public.creator_sessions;
drop policy creator_sessions_eigene_aendern    on public.creator_sessions;
drop policy creator_sessions_verwaltung_aendern on public.creator_sessions;

create policy creator_sessions_lesen on public.creator_sessions
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      ((select auth.jwt()) ->> 'email') is not null
      and ((select auth.jwt()) ->> 'email') = any (coalesce(shared_with, '{}'::text[]))
    )
    or public.hat_rolle_mindestens('admin')
  );

create policy creator_sessions_aendern on public.creator_sessions
  for update to authenticated
  using (user_id = (select auth.uid()) or public.hat_rolle_mindestens('admin'))
  with check (user_id = (select auth.uid()) or public.hat_rolle_mindestens('admin'));

-- ---------------------------------------------------------------------------
-- Sitzungskommentare und Prüfaufträge
-- ---------------------------------------------------------------------------

drop policy session_comments_eigene                on public.session_comments;
drop policy session_comments_sitzungseigner_lesen  on public.session_comments;

create policy session_comments_lesen on public.session_comments
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.creator_sessions s
      where s.id = session_comments.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy session_comments_eigene_anlegen on public.session_comments
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy session_comments_eigene_aendern on public.session_comments
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_comments_eigene_loeschen on public.session_comments
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy session_review_requests_sitzungseigner_lesen on public.session_review_requests;
drop policy session_review_requests_verwaltung           on public.session_review_requests;

create policy session_review_requests_lesen on public.session_review_requests
  for select to authenticated
  using (
    exists (
      select 1 from public.creator_sessions s
      where s.id = session_review_requests.session_id
        and s.user_id = (select auth.uid())
    )
    or public.hat_rolle_mindestens('admin')
  );

create policy session_review_requests_verwaltung_anlegen on public.session_review_requests
  for insert to authenticated with check (public.hat_rolle_mindestens('admin'));

create policy session_review_requests_verwaltung_aendern on public.session_review_requests
  for update to authenticated
  using (public.hat_rolle_mindestens('admin'))
  with check (public.hat_rolle_mindestens('admin'));

create policy session_review_requests_verwaltung_loeschen on public.session_review_requests
  for delete to authenticated using (public.hat_rolle_mindestens('admin'));

-- ---------------------------------------------------------------------------
-- Tabelle ohne Policy: bewusst
-- ---------------------------------------------------------------------------
--
-- Die Advisors melden `rls_enabled_no_policy` für `stripe_webhooks`. Das ist
-- der gewollte Zustand: Die Tabelle gehört allein dem Webhook, der mit dem
-- Service-Key schreibt. RLS bleibt eingeschaltet, damit ein späterer Grant
-- nicht versehentlich alles öffnet.

comment on table public.stripe_webhooks is
  'Nur über den Service-Key erreichbar. Bewusst ohne Policy und ohne Recht für anon oder authenticated.';
