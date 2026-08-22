-- Jetnity V2 – Foundation C: Travel Readiness
--
-- Eigene Readiness-Domäne. Kein neuer trip_items.kind.
-- Speichert nur den Nutzer-Vorbereitungsstand, keine offiziellen Visa-/
-- Einreiseregeln und keine sensiblen Dokumentdaten.
--
-- Nur Development/Preview/Test anwenden. Nicht auf Production anwenden.
-- reise_anlegen() und reise_aendern() bleiben unverändert.

create unique index if not exists trip_items_id_reise_uidx
  on public.trip_items (id, trip_id, user_id);

create table public.trip_readiness_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid not null default auth.uid(),
  client_ref text not null,
  kind text not null,
  user_status text not null default 'open',
  evidence text not null default 'user',
  country_code text,
  trip_item_id uuid,
  title text,
  context_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_readiness_items_kind_werte
    check (kind in (
      'entry_check',
      'visa_check',
      'travel_document_check',
      'insurance_check',
      'ticket_confirmation_check',
      'booking_confirmation_check',
      'preparation'
    )),
  constraint trip_readiness_items_status_werte
    check (user_status in ('open', 'done', 'skipped')),
  constraint trip_readiness_items_evidence_werte
    check (evidence = 'user'),
  constraint trip_readiness_items_country_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint trip_readiness_items_client_ref_laenge
    check (char_length(btrim(client_ref)) between 1 and 64),
  constraint trip_readiness_items_fingerprint_laenge
    check (char_length(context_fingerprint) between 1 and 500),
  constraint trip_readiness_items_title_laenge
    check (title is null or char_length(btrim(title)) between 1 and 80),
  constraint trip_readiness_items_title_nur_preparation
    check (
      (kind = 'preparation' and title is not null)
      or (kind <> 'preparation' and title is null)
    ),
  constraint trip_readiness_items_keine_html
    check (title is null or title !~* '<[[:alpha:]/]'),
  constraint trip_readiness_items_keine_ausweisnummern
    check (title is null or title !~ '[0-9]{6,}'),
  constraint trip_readiness_items_reise_fk
    foreign key (trip_id, user_id)
    references public.trips (id, user_id)
    on delete cascade,
  constraint trip_readiness_items_punkt_fk
    foreign key (trip_item_id, trip_id, user_id)
    references public.trip_items (id, trip_id, user_id)
    on delete set null,
  constraint trip_readiness_items_client_eindeutig
    unique (user_id, trip_id, client_ref)
);

comment on table public.trip_readiness_items is
  'Nutzer-Vorbereitungsstand einer Reise. Keine offizielle Visa-/Einreisewahrheit und keine sensiblen Dokumentdaten.';
comment on column public.trip_readiness_items.user_status is
  'Nur User Evidence: open, done oder skipped. Nie eine offizielle Bestätigung.';
comment on column public.trip_readiness_items.evidence is
  'In Foundation C nur user. Der Browser darf keine offizielle Quelle setzen.';
comment on column public.trip_readiness_items.context_fingerprint is
  'Deterministischer Reisekontext zum Zeitpunkt der Nutzeraktion. Abweichung macht den Check stale.';
comment on column public.trip_readiness_items.country_code is
  'ISO-3166-1-alpha-2 nur wenn bekannt. Kein freies Country-Label.';
comment on column public.trip_readiness_items.title is
  'Nur für preparation. Keine Passnummern, Ausweis- oder Gesundheitsdaten.';

create index trip_readiness_items_reise_idx
  on public.trip_readiness_items (trip_id, user_id, kind);

create index trip_readiness_items_punkt_idx
  on public.trip_readiness_items (trip_item_id, trip_id)
  where trip_item_id is not null;

create trigger trip_readiness_items_aktualisiert_am
  before update on public.trip_readiness_items
  for each row
  execute function public.setze_aktualisiert_am();

alter table public.trip_readiness_items enable row level security;

create policy trip_readiness_items_lesen on public.trip_readiness_items
  for select to authenticated using (user_id = (select auth.uid()));

create policy trip_readiness_items_anlegen on public.trip_readiness_items
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy trip_readiness_items_aendern on public.trip_readiness_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy trip_readiness_items_loeschen on public.trip_readiness_items
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on table public.trip_readiness_items from public;
revoke all on table public.trip_readiness_items from anon;
grant select, insert, update, delete on table public.trip_readiness_items to authenticated;
