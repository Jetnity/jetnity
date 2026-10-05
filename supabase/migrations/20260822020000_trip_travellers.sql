-- Jetnity V2 – Foundation C: individueller Reisendenkontext
--
-- Trip-spezifisch, datensparsam. Keine Dokumentnummern, keine Scans,
-- keine Gesundheitsakte. Nur Development. Nicht Production.

create table public.trip_travellers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid not null default auth.uid(),
  client_ref text not null,
  label text,
  nationality_country_code text,
  residence_country_code text,
  document_type text,
  document_issuing_country_code text,
  document_expires_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_travellers_client_ref_laenge
    check (char_length(btrim(client_ref)) between 1 and 64),
  constraint trip_travellers_label_laenge
    check (label is null or char_length(btrim(label)) between 1 and 40),
  constraint trip_travellers_keine_html
    check (label is null or label !~* '<[[:alpha:]/]'),
  constraint trip_travellers_keine_ausweisnummern
    check (
      label is null
      or (
        label !~ '[0-9]{6,}'
        and label !~* '(pass(nummer|nr|no|id)?|passport|ausweis|visa|visum|geburt)'
      )
    ),
  constraint trip_travellers_nationality_format
    check (nationality_country_code is null or nationality_country_code ~ '^[A-Z]{2}$'),
  constraint trip_travellers_residence_format
    check (residence_country_code is null or residence_country_code ~ '^[A-Z]{2}$'),
  constraint trip_travellers_issuing_format
    check (
      document_issuing_country_code is null
      or document_issuing_country_code ~ '^[A-Z]{2}$'
    ),
  constraint trip_travellers_document_type_werte
    check (document_type is null or document_type in ('passport', 'national_id', 'unknown')),
  constraint trip_travellers_reise_fk
    foreign key (trip_id, user_id)
    references public.trips (id, user_id)
    on delete cascade,
  constraint trip_travellers_client_eindeutig
    unique (user_id, trip_id, client_ref)
);

comment on table public.trip_travellers is
  'Datensparsamer Reisendenkontext einer Reise. Keine Dokumentnummern, keine Gesundheitsdaten.';
comment on column public.trip_travellers.nationality_country_code is
  'ISO-3166-1-alpha-2 nur wenn bekannt. Kein freies Nationalitätslabel.';
comment on column public.trip_travellers.document_expires_on is
  'Nur Ablaufdatum. Niemals eine Pass- oder Ausweisnummer.';

create index trip_travellers_reise_idx
  on public.trip_travellers (trip_id, user_id);

create trigger trip_travellers_aktualisiert_am
  before update on public.trip_travellers
  for each row
  execute function public.setze_aktualisiert_am();

alter table public.trip_travellers enable row level security;

create policy trip_travellers_lesen on public.trip_travellers
  for select to authenticated using (user_id = (select auth.uid()));

create policy trip_travellers_anlegen on public.trip_travellers
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy trip_travellers_aendern on public.trip_travellers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy trip_travellers_loeschen on public.trip_travellers
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on table public.trip_travellers from public;
revoke all on table public.trip_travellers from anon;
grant select, insert, update, delete on table public.trip_travellers to authenticated;
