-- AP-7-S2: Account Traveller Registry persistence / identity / RLS
--
-- Dual-Authority remains binding:
--   Account Registry = reusable current traveller identity/facts.
--   Trip Snapshot = only Current Truth for a concrete trip.
--
-- Additive only. No Registry->Trip live FK, no backfill, no UI/runtime.
-- No passport/document numbers, scans, MRZ, biometrics, DOB or health data.

create table public.account_travellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_ref uuid not null,
  label text,
  residence_country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint account_travellers_user_fk
    foreign key (user_id)
    references auth.users (id)
    on delete cascade,
  constraint account_travellers_label_laenge
    check (label is null or char_length(btrim(label)) between 1 and 40),
  constraint account_travellers_keine_html
    check (label is null or label !~* '<[[:alpha:]/]'),
  constraint account_travellers_keine_ausweisnummern
    check (
      label is null
      or (
        label !~ '[0-9]{6,}'
        and label !~* '(pass(nummer|nr|no|id)?|passport|ausweis|visa|visum|geburt)'
      )
    ),
  constraint account_travellers_residence_format
    check (residence_country_code is null or residence_country_code ~ '^[A-Z]{2}$'),
  constraint account_travellers_client_eindeutig
    unique (user_id, client_ref),
  constraint account_travellers_owner_identity_eindeutig
    unique (id, user_id)
);

comment on table public.account_travellers is
  'Account-owned reusable Traveller Registry. Datensparsam: keine Dokumentnummern, Scans, MRZ, Biometrie, Geburts- oder Gesundheitsdaten. Kein Trip-Live-Link.';
comment on column public.account_travellers.client_ref is
  'Stabile account-scoped UUID-Clientidentität. Keine fact-derived oder positionale Referenz.';

create index account_travellers_owner_idx
  on public.account_travellers (user_id, id);

create trigger account_travellers_aktualisiert_am
  before update on public.account_travellers
  for each row
  execute function public.setze_aktualisiert_am();

create table public.account_traveller_citizenships (
  id uuid primary key default gen_random_uuid(),
  traveller_id uuid not null,
  user_id uuid not null default auth.uid(),
  client_ref uuid not null,
  country_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint account_traveller_citizenships_traveller_fk
    foreign key (traveller_id, user_id)
    references public.account_travellers (id, user_id)
    on delete cascade,
  constraint account_traveller_citizenships_country_format
    check (country_code ~ '^[A-Z]{2}$'),
  constraint account_traveller_citizenships_client_eindeutig
    unique (user_id, traveller_id, client_ref),
  constraint account_traveller_citizenships_land_eindeutig
    unique (traveller_id, country_code),
  constraint account_traveller_citizenships_identity_eindeutig
    unique (id, traveller_id, user_id)
);

comment on table public.account_traveller_citizenships is
  '1:n Staatsbürgerschaften eines Account-Registry-Reisenden. ISO-2 only; keine Primary-/Default-Citizenship.';

create index account_traveller_citizenships_traveller_idx
  on public.account_traveller_citizenships (traveller_id, user_id);

create trigger account_traveller_citizenships_aktualisiert_am
  before update on public.account_traveller_citizenships
  for each row
  execute function public.setze_aktualisiert_am();

create table public.account_traveller_documents (
  id uuid primary key default gen_random_uuid(),
  traveller_id uuid not null,
  user_id uuid not null default auth.uid(),
  client_ref uuid not null,
  document_type text not null,
  issuing_country_code text,
  citizenship_id uuid,
  expires_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint account_traveller_documents_traveller_fk
    foreign key (traveller_id, user_id)
    references public.account_travellers (id, user_id)
    on delete cascade,
  constraint account_traveller_documents_citizenship_fk
    foreign key (citizenship_id, traveller_id, user_id)
    references public.account_traveller_citizenships (id, traveller_id, user_id)
    on delete set null (citizenship_id),
  constraint account_traveller_documents_type_werte
    check (document_type in ('passport', 'national_id', 'unknown')),
  constraint account_traveller_documents_issuing_format
    check (issuing_country_code is null or issuing_country_code ~ '^[A-Z]{2}$'),
  constraint account_traveller_documents_client_eindeutig
    unique (user_id, traveller_id, client_ref)
);

comment on table public.account_traveller_documents is
  '1:n Reisedokument-Metadaten eines Account-Registry-Reisenden. Keine Nummern, Scans, MRZ oder Biometrie. Issuer ist nicht Citizenship.';
comment on column public.account_traveller_documents.citizenship_id is
  'Optionale explizite Relation zu einer Staatsbürgerschaft desselben Registry-Reisenden und Owners; niemals aus issuing_country_code ableiten.';

create index account_traveller_documents_traveller_idx
  on public.account_traveller_documents (traveller_id, user_id);
create index account_traveller_documents_citizenship_idx
  on public.account_traveller_documents (citizenship_id, traveller_id, user_id)
  where citizenship_id is not null;

create trigger account_traveller_documents_aktualisiert_am
  before update on public.account_traveller_documents
  for each row
  execute function public.setze_aktualisiert_am();

create or replace function public.account_traveller_kinder_limit_pruefen()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Serialisiert Child-Writes desselben Registry-Reisenden. Dadurch kann ein
  -- paralleles INSERT/UPDATE/Reparenting die 8/12-Grenzen nicht via MVCC
  -- überschreiten. Der Parent-FK bindet gleichzeitig denselben Owner.
  perform 1
  from public.account_travellers
  where id = new.traveller_id
    and user_id = new.user_id
  for no key update;

  if tg_table_name = 'account_traveller_citizenships' then
    if (
      select count(*)
      from public.account_traveller_citizenships
      where traveller_id = new.traveller_id
        and user_id = new.user_id
    ) > 8 then
      raise exception 'Ein Registry-Reisender trägt höchstens 8 Staatsbürgerschaften.'
        using errcode = 'check_violation';
    end if;
  elsif tg_table_name = 'account_traveller_documents' then
    if (
      select count(*)
      from public.account_traveller_documents
      where traveller_id = new.traveller_id
        and user_id = new.user_id
    ) > 12 then
      raise exception 'Ein Registry-Reisender trägt höchstens 12 Reisedokumente.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.account_traveller_kinder_limit_pruefen() is
  'SECURITY INVOKER. Erzwingt höchstens 8 Citizenships bzw. 12 Documents je account-owned Registry-Reisendem auch bei UPDATE/Reparenting; serialisiert über FOR NO KEY UPDATE auf dem Parent.';

create trigger account_traveller_citizenships_limit
  after insert or update on public.account_traveller_citizenships
  for each row
  execute function public.account_traveller_kinder_limit_pruefen();

create trigger account_traveller_documents_limit
  after insert or update on public.account_traveller_documents
  for each row
  execute function public.account_traveller_kinder_limit_pruefen();

alter table public.account_travellers enable row level security;
alter table public.account_traveller_citizenships enable row level security;
alter table public.account_traveller_documents enable row level security;

create policy account_travellers_lesen on public.account_travellers
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy account_travellers_anlegen on public.account_travellers
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy account_travellers_aendern on public.account_travellers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy account_travellers_loeschen on public.account_travellers
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy account_traveller_citizenships_lesen on public.account_traveller_citizenships
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy account_traveller_citizenships_anlegen on public.account_traveller_citizenships
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy account_traveller_citizenships_aendern on public.account_traveller_citizenships
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy account_traveller_citizenships_loeschen on public.account_traveller_citizenships
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy account_traveller_documents_lesen on public.account_traveller_documents
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy account_traveller_documents_anlegen on public.account_traveller_documents
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy account_traveller_documents_aendern on public.account_traveller_documents
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy account_traveller_documents_loeschen on public.account_traveller_documents
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.account_travellers from public;
revoke all on table public.account_travellers from anon;
revoke all on table public.account_traveller_citizenships from public;
revoke all on table public.account_traveller_citizenships from anon;
revoke all on table public.account_traveller_documents from public;
revoke all on table public.account_traveller_documents from anon;

grant select, insert, update, delete on table public.account_travellers to authenticated;
grant select, insert, update, delete on table public.account_traveller_citizenships to authenticated;
grant select, insert, update, delete on table public.account_traveller_documents to authenticated;

revoke all on function public.account_traveller_kinder_limit_pruefen() from public;
revoke all on function public.account_traveller_kinder_limit_pruefen() from anon;
