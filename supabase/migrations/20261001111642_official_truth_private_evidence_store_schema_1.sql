-- Jetnity V2 – Official Truth private evidence store schema 1
--
-- Repository migration only. Cursor does not apply this file to Development
-- or Production. The filename comes from
-- `supabase migration new official_truth_private_evidence_store_schema_1`.
--
-- Global, reusable, non-personal Official Evidence. Not a user-owned table.
-- No traveller evaluation result is stored. A missing row is not `not_required`.
--
-- Schema `private` stays off the Data API. `supabase/config.toml` exposes only
-- `public` and `graphql_public`. This file does not add `private` there.
--
-- RLS is forced and has no policy. That denies roles which do not bypass RLS.
-- `service_role` bypasses RLS on Supabase, so this file also revokes it.
-- There is no browser read, no browser write, and no public RPC.
--
-- `official_evidence_validity_instant` only compares lossless text. It does not
-- rewrite a stored date-only value into an instant.

create schema if not exists private;

comment on schema private is
  'Unexposed Jetnity-internal schema. Not a Data API schema. Official Evidence here is global infrastructure, not browser-owned traveller data.';

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
revoke all on schema private from service_role;

create function private.official_evidence_validity_instant(wert text)
returns timestamptz
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  jahr integer;
  monat integer;
  tag integer;
  stunde integer;
  minute_wert integer;
  sekunde numeric;
begin
  if wert is null then
    return null;
  end if;

  if wert ~ '^\d{4}-\d{2}-\d{2}$' then
    if to_char(to_date(wert, 'YYYY-MM-DD'), 'YYYY-MM-DD') <> wert then
      return null;
    end if;
    return make_timestamptz(
      substring(wert from 1 for 4)::integer,
      substring(wert from 6 for 2)::integer,
      substring(wert from 9 for 2)::integer,
      0,
      0,
      0,
      'UTC'
    );
  end if;

  if not (
    wert ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$'
    or wert ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\dZ$'
    or wert ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d\dZ$'
    or wert ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d\d\dZ$'
  ) then
    return null;
  end if;

  jahr := substring(wert from 1 for 4)::integer;
  monat := substring(wert from 6 for 2)::integer;
  tag := substring(wert from 9 for 2)::integer;
  stunde := substring(wert from 12 for 2)::integer;
  minute_wert := substring(wert from 15 for 2)::integer;
  sekunde := substring(wert from 18 for 2)::numeric;

  if stunde > 23 or minute_wert > 59 or sekunde > 59 then
    return null;
  end if;

  if to_char(to_date(substring(wert from 1 for 10), 'YYYY-MM-DD'), 'YYYY-MM-DD')
     <> substring(wert from 1 for 10) then
    return null;
  end if;

  -- One fractional digit is a tenth of a second, matching the TypeScript instant.
  if wert ~ '\.\dZ$' then
    sekunde := sekunde + substring(wert from 21 for 1)::numeric / 10;
  elsif wert ~ '\.\d\dZ$' then
    sekunde := sekunde + substring(wert from 21 for 2)::numeric / 100;
  elsif wert ~ '\.\d\d\dZ$' then
    sekunde := sekunde + substring(wert from 21 for 3)::numeric / 1000;
  end if;

  return make_timestamptz(jahr, monat, tag, stunde, minute_wert, sekunde, 'UTC');
exception
  when others then
    return null;
end;
$$;

comment on function private.official_evidence_validity_instant(text) is
  'Comparison helper for a date-only YYYY-MM-DD or a UTC instant. Date-only is midnight UTC only inside this helper. The stored text is unchanged. Not an API.';

revoke all on function private.official_evidence_validity_instant(text) from public;
revoke all on function private.official_evidence_validity_instant(text) from anon;
revoke all on function private.official_evidence_validity_instant(text) from authenticated;
revoke all on function private.official_evidence_validity_instant(text) from service_role;

create table private.official_sources (
  source_id text primary key,
  source_class text not null,
  publisher_name text not null,
  authority_name text,
  registered_at timestamptz not null default pg_catalog.now(),
  constraint official_sources_source_id_format check (
    source_id ~ '^[a-z][a-z0-9_-]{1,63}$'
  ),
  constraint official_sources_source_class check (
    source_class in ('official_authority', 'licensed_evidence_provider')
  ),
  constraint official_sources_publisher_name check (
    char_length(publisher_name) between 2 and 80
    and publisher_name = btrim(publisher_name)
    and publisher_name !~ '[[:cntrl:]]'
    and position('://' in publisher_name) = 0
  ),
  constraint official_sources_class_authority check (
    (
      source_class = 'official_authority'
      and authority_name is not null
      and char_length(authority_name) between 2 and 80
      and authority_name = btrim(authority_name)
      and authority_name !~ '[[:cntrl:]]'
      and position('://' in authority_name) = 0
    )
    or (
      source_class = 'licensed_evidence_provider'
      and authority_name is null
    )
  )
);

comment on table private.official_sources is
  'Registered Official Evidence source. No real catalog is loaded by this migration. registered_at is the creation instant. There is no updated_at, because this slice has no update writer and no trigger.';

comment on column private.official_sources.authority_name is
  'Required for official_authority. Must stay null for licensed_evidence_provider. A provider is not a government authority.';

create table private.official_source_domains (
  source_id text not null,
  domain text not null,
  constraint official_source_domains_pkey primary key (domain),
  constraint official_source_domains_source_fk
    foreign key (source_id) references private.official_sources (source_id)
    on delete restrict
    on update restrict,
  constraint official_source_domains_domain_shape check (
    char_length(domain) between 1 and 253
    and domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    and domain !~ '\.\.'
    and domain !~ '^[0-9]+(\.[0-9]+)+$'
    and domain <> 'localhost'
    and domain not like '%.localhost'
    and domain not like '%.local'
  )
);

comment on table private.official_source_domains is
  'Normalized registrable hostnames. The primary key is the domain, so one hostname belongs to one source. This does not prove DNS ownership or reject a parent and child hostname pair.';

comment on column private.official_source_domains.domain is
  'Lowercase hostname only. Schemes, userinfo, ports, paths, wildcards and whitespace are rejected by the shape check.';

create index official_source_domains_source_id
  on private.official_source_domains (source_id);

create table private.official_evidence_versions (
  version_id text primary key,
  previous_version_id text,
  lifecycle text not null,
  validation_state text not null,
  source_id text not null,
  canonical_url text not null,
  retrieved_at text not null,
  source_content_hash text not null,
  valid_from text,
  valid_until text,
  lookup_key text not null,
  extraction_note text,
  destination_country_code text,
  transit_country_code text,
  citizenship_mode text not null,
  citizenship_country_codes text[] not null,
  credential_option_mode text not null,
  document_type text,
  issuing_country_code text,
  related_citizenship_country_code text,
  residence_mode text not null,
  residence_country_code text,
  requirement_type text not null,
  validity_mode text not null,
  travel_date text,
  constraint official_evidence_versions_previous_fk
    foreign key (previous_version_id)
    references private.official_evidence_versions (version_id)
    on delete restrict
    on update restrict,
  constraint official_evidence_versions_source_fk
    foreign key (source_id)
    references private.official_sources (source_id)
    on delete restrict
    on update restrict,
  constraint official_evidence_versions_version_id_format check (
    version_id ~ '^ev1_[a-f0-9]{32}$'
  ),
  constraint official_evidence_versions_previous_format check (
    previous_version_id is null
    or (
      previous_version_id ~ '^ev1_[a-f0-9]{32}$'
      and previous_version_id <> version_id
    )
  ),
  constraint official_evidence_versions_lifecycle check (
    lifecycle in ('candidate', 'accepted', 'conflicted', 'superseded')
  ),
  constraint official_evidence_versions_validation_state check (
    validation_state in ('pending', 'valid', 'rejected')
  ),
  constraint official_evidence_versions_hash check (
    source_content_hash ~ '^[a-f0-9]{64}$'
  ),
  constraint official_evidence_versions_lookup_key check (
    lookup_key ~ '^evidence-key:v2:[a-f0-9]{64}$'
  ),
  constraint official_evidence_versions_canonical_url check (
    char_length(canonical_url) between 12 and 500
    and canonical_url ~ '^https://'
    and canonical_url !~ '[[:space:][:cntrl:]]'
    and canonical_url !~ '^https://[^/?#]*@'
    and canonical_url !~* '^https://localhost([:/?#]|$)'
    and canonical_url !~* '^https://[^/?#]+\.localhost([:/?#]|$)'
    and canonical_url !~* '^https://[^/?#]+\.local([:/?#]|$)'
  ),
  constraint official_evidence_versions_retrieved_at check (
    retrieved_at ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$'
    and private.official_evidence_validity_instant(retrieved_at) is not null
  ),
  constraint official_evidence_versions_validity_window check (
    (valid_from is null or private.official_evidence_validity_instant(valid_from) is not null)
    and (valid_until is null or private.official_evidence_validity_instant(valid_until) is not null)
    and (
      valid_from is null
      or valid_until is null
      or private.official_evidence_validity_instant(valid_from)
         <= private.official_evidence_validity_instant(valid_until)
    )
  ),
  constraint official_evidence_versions_extraction_note check (
    extraction_note is null
    or (
      char_length(extraction_note) between 1 and 240
      and extraction_note = btrim(extraction_note)
      and extraction_note !~ '[[:cntrl:]]'
    )
  ),
  constraint official_evidence_versions_target check (
    (
      destination_country_code is not null
      or transit_country_code is not null
    )
    and (destination_country_code is null or destination_country_code ~ '^[A-Z]{2}$')
    and (transit_country_code is null or transit_country_code ~ '^[A-Z]{2}$')
  ),
  constraint official_evidence_versions_citizenship_set check (
    citizenship_mode in ('not_applicable', 'required')
    and citizenship_country_codes is not null
    and citizenship_country_codes::text ~ '^\{([A-Z]{2}(,[A-Z]{2}){0,7})?\}$'
    and cardinality(citizenship_country_codes) <= 8
    and (cardinality(citizenship_country_codes) < 2 or citizenship_country_codes[1] < citizenship_country_codes[2])
    and (cardinality(citizenship_country_codes) < 3 or citizenship_country_codes[2] < citizenship_country_codes[3])
    and (cardinality(citizenship_country_codes) < 4 or citizenship_country_codes[3] < citizenship_country_codes[4])
    and (cardinality(citizenship_country_codes) < 5 or citizenship_country_codes[4] < citizenship_country_codes[5])
    and (cardinality(citizenship_country_codes) < 6 or citizenship_country_codes[5] < citizenship_country_codes[6])
    and (cardinality(citizenship_country_codes) < 7 or citizenship_country_codes[6] < citizenship_country_codes[7])
    and (cardinality(citizenship_country_codes) < 8 or citizenship_country_codes[7] < citizenship_country_codes[8])
    and (
      (citizenship_mode = 'not_applicable' and cardinality(citizenship_country_codes) = 0)
      or (citizenship_mode = 'required' and cardinality(citizenship_country_codes) between 1 and 8)
    )
  ),
  constraint official_evidence_versions_credential_option check (
    (
      credential_option_mode = 'not_applicable'
      and document_type is null
      and issuing_country_code is null
      and related_citizenship_country_code is null
    )
    or (
      credential_option_mode = 'option'
      and document_type in ('passport', 'national_id', 'unknown')
      and issuing_country_code ~ '^[A-Z]{2}$'
      and (
        related_citizenship_country_code is null
        or (
          citizenship_mode = 'required'
          and related_citizenship_country_code ~ '^[A-Z]{2}$'
          and related_citizenship_country_code = any (citizenship_country_codes)
        )
      )
    )
  ),
  constraint official_evidence_versions_residence check (
    (
      residence_mode = 'not_applicable'
      and residence_country_code is null
    )
    or (
      residence_mode = 'required'
      and residence_country_code ~ '^[A-Z]{2}$'
    )
  ),
  constraint official_evidence_versions_requirement_type check (
    requirement_type in (
      'visa',
      'electronic_travel_authorization',
      'passport',
      'identity_document',
      'passport_validity',
      'blank_passport_pages',
      'transit',
      'health',
      'vaccination',
      'health_document',
      'entry_form',
      'insurance',
      'onward_or_return_ticket',
      'booking_or_travel_document',
      'financial_means',
      'other_entry_requirement'
    )
  ),
  constraint official_evidence_versions_validity_scope check (
    (
      validity_mode = 'not_applicable'
      and travel_date is null
    )
    or (
      validity_mode = 'travel_date'
      and travel_date ~ '^\d{4}-\d{2}-\d{2}$'
      and private.official_evidence_validity_instant(travel_date) is not null
    )
  )
);

comment on table private.official_evidence_versions is
  'One global evidence version. Scope is typed columns. Source class and authority stay on official_sources. No official result column is stored.';

comment on column private.official_evidence_versions.valid_from is
  'Lossless bound: date-only YYYY-MM-DD or UTC instant YYYY-MM-DDTHH:MM:SS[.f]Z. A date-only value is not stored as timestamptz.';

comment on column private.official_evidence_versions.valid_until is
  'Lossless bound: date-only YYYY-MM-DD or UTC instant YYYY-MM-DDTHH:MM:SS[.f]Z. A date-only value is not stored as timestamptz.';

comment on column private.official_evidence_versions.retrieved_at is
  'Retrieval instant in the TypeScript UTC text form. Not a date-only value. version_id is stored separately and is not recomputed from a reformatted clock value.';

comment on column private.official_evidence_versions.issuing_country_code is
  'Document issuer. This column is not a citizenship and is not copied into related_citizenship_country_code.';

comment on column private.official_evidence_versions.related_citizenship_country_code is
  'Explicit document-to-citizenship relation. Null means unlinked. A non-null value must belong to citizenship_country_codes.';

comment on column private.official_evidence_versions.citizenship_country_codes is
  'Sorted unique ISO-3166-1 alpha-2 shape, at most eight codes. Empty only when citizenship_mode is not_applicable. Shape only, not a geopolitical catalog.';

comment on column private.official_evidence_versions.requirement_type is
  'Closed Official requirement taxonomy. Null is not allowed and is not a stand-in for not required.';

create index official_evidence_versions_lookup_retrieved
  on private.official_evidence_versions (
    lookup_key,
    private.official_evidence_validity_instant(retrieved_at) desc
  );

create index official_evidence_versions_source_history
  on private.official_evidence_versions (
    source_id,
    private.official_evidence_validity_instant(retrieved_at) desc
  );

create index official_evidence_versions_accepted_lookup
  on private.official_evidence_versions (
    lookup_key,
    private.official_evidence_validity_instant(retrieved_at) desc
  )
  where lifecycle = 'accepted' and validation_state = 'valid';

create index official_evidence_versions_previous
  on private.official_evidence_versions (previous_version_id)
  where previous_version_id is not null;

alter table private.official_sources enable row level security;
alter table private.official_sources force row level security;
alter table private.official_source_domains enable row level security;
alter table private.official_source_domains force row level security;
alter table private.official_evidence_versions enable row level security;
alter table private.official_evidence_versions force row level security;

revoke all on table private.official_sources from public;
revoke all on table private.official_sources from anon;
revoke all on table private.official_sources from authenticated;
revoke all on table private.official_sources from service_role;

revoke all on table private.official_source_domains from public;
revoke all on table private.official_source_domains from anon;
revoke all on table private.official_source_domains from authenticated;
revoke all on table private.official_source_domains from service_role;

revoke all on table private.official_evidence_versions from public;
revoke all on table private.official_evidence_versions from anon;
revoke all on table private.official_evidence_versions from authenticated;
revoke all on table private.official_evidence_versions from service_role;
