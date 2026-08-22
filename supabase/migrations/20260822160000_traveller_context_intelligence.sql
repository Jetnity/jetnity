-- Foundation E: Traveller Context / Multi-Citizenship / Multi-Document
--
-- Expand/Contract: neue Child-Tabellen, deterministischer Backfill,
-- Legacy-Spalten bleiben compatibility-only. Kein Drop.
-- Nur Development anwenden. Production nicht ohne separate Freigabe.

create unique index if not exists trip_travellers_id_reise_uidx
  on public.trip_travellers (id, trip_id, user_id);

comment on column public.trip_travellers.nationality_country_code is
  'DEPRECATED compatibility-only. Kanonische Wahrheit: public.trip_traveller_citizenships.';
comment on column public.trip_travellers.document_type is
  'DEPRECATED compatibility-only. Kanonische Wahrheit: public.trip_traveller_documents.';
comment on column public.trip_travellers.document_issuing_country_code is
  'DEPRECATED compatibility-only. Kanonische Wahrheit: public.trip_traveller_documents.';
comment on column public.trip_travellers.document_expires_on is
  'DEPRECATED compatibility-only. Kanonische Wahrheit: public.trip_traveller_documents.';
comment on column public.trip_travellers.residence_country_code is
  'Aktueller datensparsamer Wohnsitzkontext. Kein historisches Residence-Modell.';

create table public.trip_traveller_citizenships (
  id uuid primary key default gen_random_uuid(),
  traveller_id uuid not null,
  trip_id uuid not null,
  user_id uuid not null default auth.uid(),
  client_ref text not null,
  country_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_traveller_citizenships_client_ref_laenge
    check (char_length(btrim(client_ref)) between 1 and 64),
  constraint trip_traveller_citizenships_country_format
    check (country_code ~ '^[A-Z]{2}$'),
  constraint trip_traveller_citizenships_traveller_fk
    foreign key (traveller_id, trip_id, user_id)
    references public.trip_travellers (id, trip_id, user_id)
    on delete cascade,
  constraint trip_traveller_citizenships_land_eindeutig
    unique (traveller_id, country_code),
  constraint trip_traveller_citizenships_client_eindeutig
    unique (user_id, trip_id, traveller_id, client_ref)
);

comment on table public.trip_traveller_citizenships is
  '1:n Staatsbürgerschaften eines Reisenden. ISO-2 only. Keine freien Länderlabels.';

create unique index trip_traveller_citizenships_id_traveller_uidx
  on public.trip_traveller_citizenships (id, traveller_id, trip_id, user_id);

create index trip_traveller_citizenships_reise_idx
  on public.trip_traveller_citizenships (trip_id, user_id, traveller_id);

create trigger trip_traveller_citizenships_aktualisiert_am
  before update on public.trip_traveller_citizenships
  for each row
  execute function public.setze_aktualisiert_am();

create table public.trip_traveller_documents (
  id uuid primary key default gen_random_uuid(),
  traveller_id uuid not null,
  trip_id uuid not null,
  user_id uuid not null default auth.uid(),
  client_ref text not null,
  document_type text not null,
  issuing_country_code text,
  citizenship_id uuid,
  expires_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_traveller_documents_client_ref_laenge
    check (char_length(btrim(client_ref)) between 1 and 64),
  constraint trip_traveller_documents_type_werte
    check (document_type in ('passport', 'national_id', 'unknown')),
  constraint trip_traveller_documents_issuing_format
    check (issuing_country_code is null or issuing_country_code ~ '^[A-Z]{2}$'),
  constraint trip_traveller_documents_traveller_fk
    foreign key (traveller_id, trip_id, user_id)
    references public.trip_travellers (id, trip_id, user_id)
    on delete cascade,
  constraint trip_traveller_documents_citizenship_fk
    foreign key (citizenship_id, traveller_id, trip_id, user_id)
    references public.trip_traveller_citizenships (id, traveller_id, trip_id, user_id)
    on delete set null (citizenship_id),
  constraint trip_traveller_documents_client_eindeutig
    unique (user_id, trip_id, traveller_id, client_ref)
);

comment on table public.trip_traveller_documents is
  '1:n Reisedokumente eines Reisenden. Keine Nummern, Scans, MRZ oder Biometrie.';

create index trip_traveller_documents_reise_idx
  on public.trip_traveller_documents (trip_id, user_id, traveller_id);

create trigger trip_traveller_documents_aktualisiert_am
  before update on public.trip_traveller_documents
  for each row
  execute function public.setze_aktualisiert_am();

create or replace function public.trip_traveller_kinder_limit_pruefen()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  perform 1
  from public.trip_travellers
  where id = new.traveller_id
    and trip_id = new.trip_id
    and user_id = new.user_id
  for update;

  if tg_table_name = 'trip_traveller_citizenships' then
    if (
      select count(*) from public.trip_traveller_citizenships
      where traveller_id = new.traveller_id
    ) > 8 then
      raise exception 'Ein Reisender trägt höchstens 8 Staatsbürgerschaften.'
        using errcode = 'check_violation';
    end if;
  elsif tg_table_name = 'trip_traveller_documents' then
    if (
      select count(*) from public.trip_traveller_documents
      where traveller_id = new.traveller_id
    ) > 12 then
      raise exception 'Ein Reisender trägt höchstens 12 Reisedokumente.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger trip_traveller_citizenships_limit
  after insert on public.trip_traveller_citizenships
  for each row
  execute function public.trip_traveller_kinder_limit_pruefen();

create trigger trip_traveller_documents_limit
  after insert on public.trip_traveller_documents
  for each row
  execute function public.trip_traveller_kinder_limit_pruefen();

alter table public.trip_readiness_items
  add column if not exists traveller_id uuid;

alter table public.trip_readiness_items
  drop constraint if exists trip_readiness_items_fingerprint_laenge;

alter table public.trip_readiness_items
  add constraint trip_readiness_items_fingerprint_laenge
    check (char_length(context_fingerprint) between 1 and 800);

alter table public.trip_readiness_items
  drop constraint if exists trip_readiness_items_traveller_fk;

alter table public.trip_readiness_items
  add constraint trip_readiness_items_traveller_fk
    foreign key (traveller_id, trip_id, user_id)
    references public.trip_travellers (id, trip_id, user_id)
    on delete cascade;

create index if not exists trip_readiness_items_traveller_idx
  on public.trip_readiness_items (traveller_id, trip_id)
  where traveller_id is not null;

comment on column public.trip_readiness_items.traveller_id is
  'Optional. Nur für traveller-spezifische Vorbereitung. Trip-level bleibt null. Löschen des Reisenden entfernt diese Zeilen (CASCADE).';

insert into public.trip_traveller_citizenships (
  traveller_id, trip_id, user_id, client_ref, country_code
)
select
  t.id,
  t.trip_id,
  t.user_id,
  'citizenship:' || t.nationality_country_code,
  t.nationality_country_code
from public.trip_travellers t
where t.nationality_country_code is not null
  and t.nationality_country_code ~ '^[A-Z]{2}$'
on conflict (traveller_id, country_code) do nothing;

insert into public.trip_traveller_documents (
  traveller_id,
  trip_id,
  user_id,
  client_ref,
  document_type,
  issuing_country_code,
  citizenship_id,
  expires_on
)
select
  t.id,
  t.trip_id,
  t.user_id,
  'document:' || coalesce(t.document_type, 'unknown') || ':' || coalesce(t.document_issuing_country_code, 'xx'),
  coalesce(t.document_type, 'unknown'),
  t.document_issuing_country_code,
  c.id,
  t.document_expires_on
from public.trip_travellers t
left join public.trip_traveller_citizenships c
  on c.traveller_id = t.id
 and c.country_code = t.document_issuing_country_code
where
  t.document_type is not null
  or t.document_issuing_country_code is not null
  or t.document_expires_on is not null
on conflict (user_id, trip_id, traveller_id, client_ref) do nothing;

alter table public.trip_traveller_citizenships enable row level security;
alter table public.trip_traveller_documents enable row level security;

create policy trip_traveller_citizenships_lesen on public.trip_traveller_citizenships
  for select to authenticated using (user_id = (select auth.uid()));

create policy trip_traveller_citizenships_anlegen on public.trip_traveller_citizenships
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy trip_traveller_citizenships_aendern on public.trip_traveller_citizenships
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy trip_traveller_citizenships_loeschen on public.trip_traveller_citizenships
  for delete to authenticated using (user_id = (select auth.uid()));

create policy trip_traveller_documents_lesen on public.trip_traveller_documents
  for select to authenticated using (user_id = (select auth.uid()));

create policy trip_traveller_documents_anlegen on public.trip_traveller_documents
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy trip_traveller_documents_aendern on public.trip_traveller_documents
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy trip_traveller_documents_loeschen on public.trip_traveller_documents
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on table public.trip_traveller_citizenships from public;
revoke all on table public.trip_traveller_citizenships from anon;
grant select, insert, update, delete on table public.trip_traveller_citizenships to authenticated;

revoke all on table public.trip_traveller_documents from public;
revoke all on table public.trip_traveller_documents from anon;
grant select, insert, update, delete on table public.trip_traveller_documents to authenticated;

create or replace function public.party_schreiben(_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  _uid uuid := auth.uid();
  _trip uuid;
  _eintrag jsonb;
  _citizenship jsonb;
  _document jsonb;
  _traveller_id uuid;
  _label text;
  _residence text;
  _client_ref text;
  _country text;
  _doc_type text;
  _issuing text;
  _expires date;
  _cit_ref text;
  _cit_id uuid;
  _count int := 0;
begin
  if _uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  if _payload is null or jsonb_typeof(_payload) <> 'object' then
    raise exception 'INVALID_PAYLOAD' using errcode = '22023';
  end if;

  begin
    _trip := (_payload ->> 'tripId')::uuid;
  exception
    when others then
      raise exception 'INVALID_TRIP' using errcode = '22023';
  end;

  if _trip is null then
    raise exception 'INVALID_TRIP' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.trips t
    where t.id = _trip and t.user_id = _uid
  ) then
    raise exception 'TRIP_NOT_FOUND' using errcode = '42501';
  end if;

  if jsonb_typeof(_payload -> 'party') <> 'array' then
    raise exception 'INVALID_PARTY' using errcode = '22023';
  end if;

  if jsonb_array_length(_payload -> 'party') > 20 then
    raise exception 'PARTY_LIMIT' using errcode = 'check_violation';
  end if;

  for _eintrag in select value from jsonb_array_elements(_payload -> 'party')
  loop
    _count := _count + 1;
    _client_ref := nullif(btrim(coalesce(_eintrag ->> 'clientRef', '')), '');
    if _client_ref is null or char_length(_client_ref) > 64 then
      raise exception 'INVALID_CLIENT_REF' using errcode = '22023';
    end if;

    _label := nullif(btrim(coalesce(_eintrag ->> 'label', '')), '');
    if _label is not null then
      if char_length(_label) > 40
         or _label ~* '<[[:alpha:]/]'
         or _label ~ '[0-9]{6,}'
         or _label ~* '(pass(nummer|nr|no|id)?|passport|ausweis|visa|visum|geburt)' then
        raise exception 'INVALID_LABEL' using errcode = '22023';
      end if;
    end if;

    _residence := nullif(upper(btrim(coalesce(_eintrag ->> 'residenceCountryCode', ''))), '');
    if _residence is not null and _residence !~ '^[A-Z]{2}$' then
      raise exception 'INVALID_RESIDENCE' using errcode = '22023';
    end if;

    insert into public.trip_travellers as t (
      trip_id, user_id, client_ref, label, residence_country_code
    ) values (
      _trip, _uid, _client_ref, _label, _residence
    )
    on conflict (user_id, trip_id, client_ref) do update
      set label = excluded.label,
          residence_country_code = excluded.residence_country_code,
          updated_at = now()
    returning t.id into _traveller_id;

    delete from public.trip_traveller_documents
    where traveller_id = _traveller_id and trip_id = _trip and user_id = _uid;

    delete from public.trip_traveller_citizenships
    where traveller_id = _traveller_id and trip_id = _trip and user_id = _uid;

    if jsonb_typeof(_eintrag -> 'citizenships') = 'array' then
      if jsonb_array_length(_eintrag -> 'citizenships') > 8 then
        raise exception 'CITIZENSHIP_LIMIT' using errcode = 'check_violation';
      end if;
      for _citizenship in select value from jsonb_array_elements(_eintrag -> 'citizenships')
      loop
        _country := nullif(upper(btrim(coalesce(_citizenship ->> 'countryCode', ''))), '');
        _cit_ref := nullif(btrim(coalesce(_citizenship ->> 'clientRef', '')), '');
        if _country is null or _country !~ '^[A-Z]{2}$' then
          raise exception 'INVALID_CITIZENSHIP' using errcode = '22023';
        end if;
        if _cit_ref is null then
          _cit_ref := 'citizenship:' || _country;
        end if;
        if char_length(_cit_ref) > 64 then
          raise exception 'INVALID_CLIENT_REF' using errcode = '22023';
        end if;
        insert into public.trip_traveller_citizenships (
          traveller_id, trip_id, user_id, client_ref, country_code
        ) values (
          _traveller_id, _trip, _uid, _cit_ref, _country
        )
        on conflict (traveller_id, country_code) do nothing;
      end loop;
    end if;

    if jsonb_typeof(_eintrag -> 'documents') = 'array' then
      if jsonb_array_length(_eintrag -> 'documents') > 12 then
        raise exception 'DOCUMENT_LIMIT' using errcode = 'check_violation';
      end if;
      for _document in select value from jsonb_array_elements(_eintrag -> 'documents')
      loop
        _doc_type := nullif(btrim(coalesce(_document ->> 'documentType', '')), '');
        if _doc_type is null or _doc_type not in ('passport', 'national_id', 'unknown') then
          raise exception 'INVALID_DOCUMENT_TYPE' using errcode = '22023';
        end if;
        _issuing := nullif(upper(btrim(coalesce(_document ->> 'issuingCountryCode', ''))), '');
        if _issuing is not null and _issuing !~ '^[A-Z]{2}$' then
          raise exception 'INVALID_ISSUING' using errcode = '22023';
        end if;
        _cit_ref := nullif(btrim(coalesce(_document ->> 'citizenshipClientRef', '')), '');
        _cit_id := null;
        if _cit_ref is not null then
          select c.id into _cit_id
          from public.trip_traveller_citizenships c
          where c.traveller_id = _traveller_id
            and c.trip_id = _trip
            and c.user_id = _uid
            and c.client_ref = _cit_ref
          limit 1;
          if _cit_id is null then
            raise exception 'FOREIGN_CITIZENSHIP' using errcode = '42501';
          end if;
        end if;
        begin
          _expires := nullif(_document ->> 'expiresOn', '')::date;
        exception
          when others then
            raise exception 'INVALID_EXPIRY' using errcode = '22023';
        end;
        insert into public.trip_traveller_documents (
          traveller_id, trip_id, user_id, client_ref, document_type,
          issuing_country_code, citizenship_id, expires_on
        ) values (
          _traveller_id,
          _trip,
          _uid,
          coalesce(nullif(btrim(coalesce(_document ->> 'clientRef', '')), ''), 'document:' || _doc_type || ':' || coalesce(_issuing, 'xx')),
          _doc_type,
          _issuing,
          _cit_id,
          _expires
        );
      end loop;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'written', _count);
end;
$$;

revoke all on function public.party_schreiben(jsonb) from public;
revoke all on function public.party_schreiben(jsonb) from anon;
grant execute on function public.party_schreiben(jsonb) to authenticated;

comment on function public.party_schreiben(jsonb) is
  'Atomarer Traveller-Write: Parent plus Citizenships plus Documents. SECURITY INVOKER. Keine Legacy-Credential-Spalten.';
