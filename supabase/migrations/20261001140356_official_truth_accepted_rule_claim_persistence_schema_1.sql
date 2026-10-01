-- Jetnity V2 – Official Truth accepted Rule Claim persistence schema 1
--
-- Repository migration only. Cursor does not apply this file to Development
-- or Production. The filename comes from
-- `supabase migration new official_truth_accepted_rule_claim_persistence_schema_1`.
-- The timestamp was not typed by hand.
--
-- This file stores only rows equivalent to an already accepted Rule Claim.
-- It does not store a candidate, a model proposal, a research gap, an
-- unresolved conflict, or stale candidate facts as accepted truth.
-- Canonical acceptance stays in regelKandidatAkzeptieren(). SQL is not a
-- second Official-Truth engine.
--
-- rule_scope_key is stored, not computed. A later trusted server writer
-- derives it through the TypeScript rule-scope contract. This file does not
-- check that the key matches the typed scope columns.
--
-- Support minimums and distinct official source counts stay with that writer.
-- There is no trigger and no counting function for those acceptance rules.
--
-- A deferred constraint trigger requires each accepted claim to have at least
-- one matching typed fact row when the transaction commits. It does not
-- accept a rule and it does not count supports. Airport codes have no finite
-- maximum. A private immutable helper checks that a present list is
-- non-empty, IATA-shaped, sorted and unique.
--
-- Schema private stays off the Data API. This file does not change
-- supabase/config.toml and does not change default privileges.

alter table private.official_sources
  add constraint official_sources_id_and_class_key
  unique (source_id, source_class);

comment on constraint official_sources_id_and_class_key on private.official_sources is
  'Lets a claim support row and an official action reference source identity together with source class. source_id is already unique. The extra key does not change which source rows are valid.';

alter table private.official_evidence_versions
  add column rule_scope_key text not null,
  add constraint official_evidence_versions_rule_scope_key_format
    check (rule_scope_key ~ '^rule-scope:v1:[a-f0-9]{64}$'),
  add constraint official_evidence_versions_support_fk_key
    unique (version_id, rule_scope_key, lifecycle, validation_state, source_id);

comment on column private.official_evidence_versions.rule_scope_key is
  'Source-neutral rule scope key. Not computed in SQL. The source-specific lookup key is unchanged. Existing evidence lifecycle and validation values are unchanged.';

comment on constraint official_evidence_versions_support_fk_key on private.official_evidence_versions is
  'Referenced by claim support so PostgreSQL can prove the exact version, the same rule scope key, the stored lifecycle, the stored validation state, and the same source id.';

create table private.official_rule_claims (
  claim_id bigint generated always as identity,
  rule_scope_key text not null,
  fact_kind text not null,
  evidence_quality text not null,
  lifecycle text not null,
  validation_state text not null,
  accepted_at timestamptz not null,
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
  constraint official_rule_claims_pkey primary key (claim_id),
  constraint official_rule_claims_scope_link unique (claim_id, rule_scope_key),
  constraint official_rule_claims_kind_link unique (claim_id, fact_kind, requirement_type),
  constraint official_rule_claims_one_accepted_fact unique (rule_scope_key, fact_kind),
  constraint official_rule_claims_rule_scope_key_format check (
    rule_scope_key ~ '^rule-scope:v1:[a-f0-9]{64}$'
  ),
  constraint official_rule_claims_fact_kind check (
    fact_kind in (
      'requirement_effect',
      'visa_options',
      'stay_limit',
      'passport_validity',
      'blank_passport_pages',
      'transit_conditions',
      'official_actions',
      'temporal_rule'
    )
  ),
  constraint official_rule_claims_evidence_quality check (
    evidence_quality in (
      'explicit_primary_statement',
      'composed_from_multiple_primary_sources'
    )
  ),
  constraint official_rule_claims_lifecycle check (lifecycle = 'accepted'),
  constraint official_rule_claims_validation_state check (validation_state = 'valid'),
  constraint official_rule_claims_kind_binds_type check (
    (
      fact_kind = 'visa_options'
      and requirement_type = 'visa'
    )
    or (
      fact_kind = 'passport_validity'
      and requirement_type = 'passport_validity'
    )
    or (
      fact_kind = 'blank_passport_pages'
      and requirement_type = 'blank_passport_pages'
    )
    or (
      fact_kind = 'transit_conditions'
      and requirement_type = 'transit'
    )
    or fact_kind in (
      'requirement_effect',
      'stay_limit',
      'official_actions',
      'temporal_rule'
    )
  ),
  constraint official_rule_claims_target check (
    (
      destination_country_code is not null
      or transit_country_code is not null
    )
    and (destination_country_code is null or destination_country_code ~ '^[A-Z]{2}$')
    and (transit_country_code is null or transit_country_code ~ '^[A-Z]{2}$')
  ),
  constraint official_rule_claims_citizenship_set check (
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
  constraint official_rule_claims_credential_option check (
    (
      credential_option_mode = 'not_applicable'
      and document_type is null
      and issuing_country_code is null
      and related_citizenship_country_code is null
    )
    or (
      credential_option_mode = 'option'
      and document_type is not null
      and document_type in ('passport', 'national_id', 'unknown')
      and issuing_country_code is not null
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
  constraint official_rule_claims_residence check (
    (
      residence_mode = 'not_applicable'
      and residence_country_code is null
    )
    or (
      residence_mode = 'required'
      and residence_country_code is not null
      and residence_country_code ~ '^[A-Z]{2}$'
    )
  ),
  constraint official_rule_claims_requirement_type check (
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
  constraint official_rule_claims_validity_scope check (
    (
      validity_mode = 'not_applicable'
      and travel_date is null
    )
    or (
      validity_mode = 'travel_date'
      and travel_date is not null
      and travel_date ~ '^\d{4}-\d{2}-\d{2}$'
      and private.official_evidence_validity_instant(travel_date) is not null
    )
  )
);

comment on table private.official_rule_claims is
  'One current accepted rule claim. claim_id is a database surrogate, not Product Truth and not the rule scope key. There is one accepted fact per rule scope key and fact kind. This table has no history of candidates. A deferred constraint trigger requires the matching typed fact payload at commit.';

comment on column private.official_rule_claims.claim_id is
  'Persistence identity. Generated by the database. Not a regulatory identifier.';

comment on column private.official_rule_claims.rule_scope_key is
  'Stored source-neutral key. SQL does not derive it and does not prove it matches the typed scope columns.';

comment on column private.official_rule_claims.evidence_quality is
  'Only the two qualities that can be accepted. The other evidence qualities are not stored here.';

comment on column private.official_rule_claims.lifecycle is
  'Fixed to accepted. A candidate lifecycle cannot be inserted.';

comment on column private.official_rule_claims.accepted_at is
  'Audit instant supplied by the later trusted writer. The database does not default it.';

comment on column private.official_rule_claims.issuing_country_code is
  'Document issuer. This column is not a citizenship and is not copied into related_citizenship_country_code.';

comment on column private.official_rule_claims.related_citizenship_country_code is
  'Explicit document-to-citizenship relation. Null means unlinked. A non-null value must belong to citizenship_country_codes.';

comment on column private.official_rule_claims.requirement_type is
  'Closed Official requirement taxonomy. Health and vaccination values here are regulatory metadata, not a personal health record.';

create table private.official_rule_claim_support (
  claim_id bigint not null,
  rule_scope_key text not null,
  version_id text not null,
  source_id text not null,
  evidence_lifecycle text not null,
  evidence_validation_state text not null,
  source_class text not null,
  constraint official_rule_claim_support_pkey primary key (claim_id, version_id),
  constraint official_rule_claim_support_claim_fk
    foreign key (claim_id, rule_scope_key)
    references private.official_rule_claims (claim_id, rule_scope_key)
    on delete restrict
    on update restrict,
  constraint official_rule_claim_support_evidence_fk
    foreign key (
      version_id,
      rule_scope_key,
      evidence_lifecycle,
      evidence_validation_state,
      source_id
    )
    references private.official_evidence_versions (
      version_id,
      rule_scope_key,
      lifecycle,
      validation_state,
      source_id
    )
    on delete restrict
    on update restrict,
  constraint official_rule_claim_support_source_fk
    foreign key (source_id, source_class)
    references private.official_sources (source_id, source_class)
    on delete restrict
    on update restrict,
  constraint official_rule_claim_support_rule_scope_key_format check (
    rule_scope_key ~ '^rule-scope:v1:[a-f0-9]{64}$'
  ),
  constraint official_rule_claim_support_version_id_format check (
    version_id ~ '^ev1_[a-f0-9]{32}$'
  ),
  constraint official_rule_claim_support_source_id_format check (
    source_id ~ '^[a-z][a-z0-9_-]{1,63}$'
  ),
  constraint official_rule_claim_support_evidence_lifecycle check (
    evidence_lifecycle = 'accepted'
  ),
  constraint official_rule_claim_support_evidence_validation_state check (
    evidence_validation_state = 'valid'
  ),
  constraint official_rule_claim_support_source_class check (
    source_class = 'official_authority'
  )
);

comment on table private.official_rule_claim_support is
  'Links one accepted claim to one exact evidence version. The foreign keys prove the same rule scope key, accepted evidence lifecycle, valid evidence validation, the evidence source id, and official authority. How many supports are required, and that composed quality uses distinct sources, is the trusted writer''s responsibility. A licensed provider cannot be the source class of a support row.';

create table private.official_rule_claim_requirement_effect (
  claim_id bigint not null,
  fact_kind text not null,
  requirement_type text not null,
  effect text not null,
  visa_mode text,
  constraint official_rule_claim_requirement_effect_pkey primary key (claim_id),
  constraint official_rule_claim_requirement_effect_kind check (
    fact_kind = 'requirement_effect'
  ),
  constraint official_rule_claim_requirement_effect_fk
    foreign key (claim_id, fact_kind, requirement_type)
    references private.official_rule_claims (claim_id, fact_kind, requirement_type)
    on delete restrict
    on update restrict
    deferrable initially deferred,
  constraint official_rule_claim_requirement_effect_effect check (
    effect in ('required', 'not_required', 'conditional')
  ),
  constraint official_rule_claim_requirement_effect_visa_mode check (
    (
      requirement_type <> 'visa'
      and visa_mode is null
    )
    or (
      requirement_type = 'visa'
      and (
        visa_mode is null
        or visa_mode in (
          'visa_exempt',
          'visa_on_arrival',
          'electronic_visa',
          'visa_before_travel',
          'unknown'
        )
      )
    )
  ),
  constraint official_rule_claim_requirement_effect_contradiction check (
    not (
      requirement_type = 'visa'
      and effect = 'required'
      and visa_mode = 'visa_exempt'
    )
    and not (
      requirement_type = 'visa'
      and effect = 'not_required'
      and visa_mode in ('visa_on_arrival', 'electronic_visa', 'visa_before_travel')
    )
  )
);

comment on table private.official_rule_claim_requirement_effect is
  'Accepted requirement effect. effect unknown is not a stored value. A non-visa requirement cannot carry a visa mode.';

create table private.official_rule_claim_visa_options (
  claim_id bigint not null,
  fact_kind text not null,
  requirement_type text not null,
  ordinal smallint not null,
  visa_mode text not null,
  eligibility text not null,
  mandate text not null,
  constraint official_rule_claim_visa_options_pkey primary key (claim_id, ordinal),
  constraint official_rule_claim_visa_options_mode_key unique (claim_id, visa_mode),
  constraint official_rule_claim_visa_options_kind check (fact_kind = 'visa_options'),
  constraint official_rule_claim_visa_options_type check (requirement_type = 'visa'),
  constraint official_rule_claim_visa_options_ordinal check (ordinal between 1 and 4),
  constraint official_rule_claim_visa_options_fk
    foreign key (claim_id, fact_kind, requirement_type)
    references private.official_rule_claims (claim_id, fact_kind, requirement_type)
    on delete restrict
    on update restrict
    deferrable initially deferred,
  constraint official_rule_claim_visa_options_visa_mode check (
    visa_mode in (
      'visa_exempt',
      'visa_on_arrival',
      'electronic_visa',
      'visa_before_travel'
    )
  ),
  constraint official_rule_claim_visa_options_eligibility check (
    eligibility in ('allowed', 'not_allowed', 'unknown')
  ),
  constraint official_rule_claim_visa_options_mandate check (
    mandate in ('mandatory', 'not_mandatory', 'unknown')
  )
);

comment on table private.official_rule_claim_visa_options is
  'Concrete visa modes for requirement type visa. At most four rows by ordinal. visa_mode unknown is not stored. A deferred constraint trigger requires at least one row before the claim transaction can commit.';

create table private.official_rule_claim_stay_limit (
  claim_id bigint not null,
  fact_kind text not null,
  requirement_type text not null,
  per_visit_value integer,
  per_visit_unit text,
  rolling_maximum_value integer,
  rolling_maximum_unit text,
  rolling_within_value integer,
  rolling_within_unit text,
  initial_grant_value integer,
  initial_grant_unit text,
  extension_requires_application boolean,
  extension_maximum_total_value integer,
  extension_maximum_total_unit text,
  border_discretion text not null,
  constraint official_rule_claim_stay_limit_pkey primary key (claim_id),
  constraint official_rule_claim_stay_limit_kind check (fact_kind = 'stay_limit'),
  constraint official_rule_claim_stay_limit_fk
    foreign key (claim_id, fact_kind, requirement_type)
    references private.official_rule_claims (claim_id, fact_kind, requirement_type)
    on delete restrict
    on update restrict
    deferrable initially deferred,
  constraint official_rule_claim_stay_limit_border check (
    border_discretion in ('fixed', 'may_be_shorter', 'determined_at_border')
  ),
  constraint official_rule_claim_stay_limit_per_visit check (
    (
      per_visit_value is null
      and per_visit_unit is null
    )
    or (
      per_visit_value is not null
      and per_visit_unit is not null
      and (
        (per_visit_unit = 'days' and per_visit_value between 1 and 3660)
        or (per_visit_unit = 'months' and per_visit_value between 1 and 120)
        or (per_visit_unit = 'years' and per_visit_value between 1 and 10)
      )
    )
  ),
  constraint official_rule_claim_stay_limit_initial_grant check (
    (
      initial_grant_value is null
      and initial_grant_unit is null
    )
    or (
      initial_grant_value is not null
      and initial_grant_unit is not null
      and (
        (initial_grant_unit = 'days' and initial_grant_value between 1 and 3660)
        or (initial_grant_unit = 'months' and initial_grant_value between 1 and 120)
        or (initial_grant_unit = 'years' and initial_grant_value between 1 and 10)
      )
    )
  ),
  constraint official_rule_claim_stay_limit_rolling check (
    (
      rolling_maximum_value is null
      and rolling_maximum_unit is null
      and rolling_within_value is null
      and rolling_within_unit is null
    )
    or (
      rolling_maximum_value is not null
      and rolling_maximum_unit is not null
      and rolling_within_value is not null
      and rolling_within_unit is not null
      and (
        (rolling_maximum_unit = 'days' and rolling_maximum_value between 1 and 3660)
        or (rolling_maximum_unit = 'months' and rolling_maximum_value between 1 and 120)
        or (rolling_maximum_unit = 'years' and rolling_maximum_value between 1 and 10)
      )
      and (
        (rolling_within_unit = 'days' and rolling_within_value between 1 and 3660)
        or (rolling_within_unit = 'months' and rolling_within_value between 1 and 120)
        or (rolling_within_unit = 'years' and rolling_within_value between 1 and 10)
      )
    )
  ),
  constraint official_rule_claim_stay_limit_rolling_order check (
    rolling_maximum_unit is distinct from rolling_within_unit
    or rolling_within_value > rolling_maximum_value
  ),
  constraint official_rule_claim_stay_limit_extension check (
    (
      extension_requires_application is null
      and extension_maximum_total_value is null
      and extension_maximum_total_unit is null
    )
    or (
      extension_requires_application is not null
      and extension_maximum_total_value is not null
      and extension_maximum_total_unit is not null
      and (
        (extension_maximum_total_unit = 'days' and extension_maximum_total_value between 1 and 3660)
        or (extension_maximum_total_unit = 'months' and extension_maximum_total_value between 1 and 120)
        or (extension_maximum_total_unit = 'years' and extension_maximum_total_value between 1 and 10)
      )
    )
  ),
  constraint official_rule_claim_stay_limit_some_duration check (
    per_visit_value is not null
    or rolling_maximum_value is not null
    or initial_grant_value is not null
    or extension_maximum_total_value is not null
  )
);

comment on table private.official_rule_claim_stay_limit is
  'Typed stay durations. Units are not converted. Same-unit rolling windows require the within value to be greater than the maximum. At least one duration group is required.';

create table private.official_rule_claim_passport_validity (
  claim_id bigint not null,
  fact_kind text not null,
  requirement_type text not null,
  semantics text not null,
  duration_value integer,
  duration_unit text,
  constraint official_rule_claim_passport_validity_pkey primary key (claim_id),
  constraint official_rule_claim_passport_validity_kind check (
    fact_kind = 'passport_validity'
  ),
  constraint official_rule_claim_passport_validity_type check (
    requirement_type = 'passport_validity'
  ),
  constraint official_rule_claim_passport_validity_fk
    foreign key (claim_id, fact_kind, requirement_type)
    references private.official_rule_claims (claim_id, fact_kind, requirement_type)
    on delete restrict
    on update restrict
    deferrable initially deferred,
  constraint official_rule_claim_passport_validity_semantics check (
    semantics in (
      'valid_on_entry',
      'valid_through_stay',
      'minimum_remaining_from_entry',
      'minimum_remaining_from_planned_departure',
      'minimum_remaining_at_application',
      'expired_document_exception'
    )
  ),
  constraint official_rule_claim_passport_validity_duration check (
    (
      semantics in ('valid_on_entry', 'valid_through_stay')
      and duration_value is null
      and duration_unit is null
    )
    or (
      semantics in (
        'minimum_remaining_from_entry',
        'minimum_remaining_from_planned_departure',
        'minimum_remaining_at_application',
        'expired_document_exception'
      )
      and duration_value is not null
      and duration_unit is not null
      and (
        (duration_unit = 'days' and duration_value between 1 and 3660)
        or (duration_unit = 'months' and duration_value between 1 and 120)
        or (duration_unit = 'years' and duration_value between 1 and 10)
      )
    )
  )
);

comment on table private.official_rule_claim_passport_validity is
  'Passport validity semantics. valid_on_entry and valid_through_stay store no duration. Other semantics require a duration of at least 1. Zero is not a stand-in for a valid passport.';

create table private.official_rule_claim_blank_pages (
  claim_id bigint not null,
  fact_kind text not null,
  requirement_type text not null,
  minimum_pages integer not null,
  constraint official_rule_claim_blank_pages_pkey primary key (claim_id),
  constraint official_rule_claim_blank_pages_kind check (
    fact_kind = 'blank_passport_pages'
  ),
  constraint official_rule_claim_blank_pages_type check (
    requirement_type = 'blank_passport_pages'
  ),
  constraint official_rule_claim_blank_pages_fk
    foreign key (claim_id, fact_kind, requirement_type)
    references private.official_rule_claims (claim_id, fact_kind, requirement_type)
    on delete restrict
    on update restrict
    deferrable initially deferred,
  constraint official_rule_claim_blank_pages_minimum check (
    minimum_pages between 1 and 10
  )
);

comment on table private.official_rule_claim_blank_pages is
  'Accepted blank-page minimum for requirement type blank_passport_pages. The integer is 1 through 10.';

create function private.official_rule_claim_transit_airports_ok(codes text[])
returns boolean
language sql
immutable
security invoker
set search_path = pg_catalog
as $$
  select
    codes is not null
    and cardinality(codes) >= 1
    and coalesce((
      select bool_and(
        item.code is not null
        and item.code ~ '^[A-Z]{3}$'
        and (item.previous is null or item.code > item.previous)
      )
      from (
        select
          code,
          lag(code) over (order by ordinality) as previous
        from unnest(codes) with ordinality as airport(code, ordinality)
      ) as item
    ), false);
$$;

comment on function private.official_rule_claim_transit_airports_ok(text[]) is
  'True when a present airport list is non-empty, IATA-shaped, sorted and unique. There is no finite maximum. Not an API.';

create table private.official_rule_claim_transit_paths (
  claim_id bigint not null,
  fact_kind text not null,
  requirement_type text not null,
  ordinal smallint not null,
  crosses_border_control boolean,
  leaves_transit_area boolean,
  transit_airport_codes text[],
  max_transit_duration_minutes integer,
  arrival_mode text,
  departure_mode text,
  third_country_required boolean,
  same_flight_required boolean,
  onward_ticket_required boolean,
  constraint official_rule_claim_transit_paths_pkey primary key (claim_id, ordinal),
  constraint official_rule_claim_transit_paths_kind check (
    fact_kind = 'transit_conditions'
  ),
  constraint official_rule_claim_transit_paths_type check (requirement_type = 'transit'),
  constraint official_rule_claim_transit_paths_ordinal check (ordinal between 1 and 8),
  constraint official_rule_claim_transit_paths_fk
    foreign key (claim_id, fact_kind, requirement_type)
    references private.official_rule_claims (claim_id, fact_kind, requirement_type)
    on delete restrict
    on update restrict
    deferrable initially deferred,
  constraint official_rule_claim_transit_paths_modes check (
    (arrival_mode is null or arrival_mode in ('air', 'land', 'sea'))
    and (departure_mode is null or departure_mode in ('air', 'land', 'sea'))
  ),
  constraint official_rule_claim_transit_paths_minutes check (
    max_transit_duration_minutes is null
    or max_transit_duration_minutes between 1 and 20160
  ),
  constraint official_rule_claim_transit_paths_airports check (
    transit_airport_codes is null
    or private.official_rule_claim_transit_airports_ok(transit_airport_codes)
  ),
  constraint official_rule_claim_transit_paths_some_condition check (
    crosses_border_control is not null
    or leaves_transit_area is not null
    or transit_airport_codes is not null
    or max_transit_duration_minutes is not null
    or arrival_mode is not null
    or departure_mode is not null
    or third_country_required is not null
    or same_flight_required is not null
    or onward_ticket_required is not null
  )
);

comment on table private.official_rule_claim_transit_paths is
  'Accepted transit paths for requirement type transit. Unknown fields stay null. At most eight paths by ordinal. Airport codes are an IATA shape only and are not checked against an airport catalog. A combined arrival-mode string is not a column. A deferred constraint trigger requires at least one path before the claim transaction can commit.';

comment on column private.official_rule_claim_transit_paths.transit_airport_codes is
  'Null when the path is not limited to explicit airports. Otherwise a non-empty list of sorted unique IATA-shaped codes, with no finite maximum. Existence is not proved.';

create table private.official_rule_claim_actions (
  claim_id bigint not null,
  fact_kind text not null,
  requirement_type text not null,
  ordinal smallint not null,
  action_source_id text not null,
  source_class text not null,
  purpose text not null,
  href text not null,
  visa_mode text,
  constraint official_rule_claim_actions_pkey primary key (claim_id, ordinal),
  constraint official_rule_claim_actions_kind check (fact_kind = 'official_actions'),
  constraint official_rule_claim_actions_ordinal check (ordinal between 1 and 4),
  constraint official_rule_claim_actions_fk
    foreign key (claim_id, fact_kind, requirement_type)
    references private.official_rule_claims (claim_id, fact_kind, requirement_type)
    on delete restrict
    on update restrict
    deferrable initially deferred,
  constraint official_rule_claim_actions_source_fk
    foreign key (action_source_id, source_class)
    references private.official_sources (source_id, source_class)
    on delete restrict
    on update restrict,
  constraint official_rule_claim_actions_source_id_format check (
    action_source_id ~ '^[a-z][a-z0-9_-]{1,63}$'
  ),
  constraint official_rule_claim_actions_source_class check (
    source_class = 'official_authority'
  ),
  constraint official_rule_claim_actions_purpose check (
    purpose in ('application', 'form', 'appointment', 'information')
  ),
  constraint official_rule_claim_actions_href check (
    char_length(href) between 12 and 500
    and href ~ '^https://'
    and href !~ '[[:space:][:cntrl:]]'
    and href !~ '^https://[^/?#]*@'
    and href !~* '^https://localhost([:/?#]|$)'
    and href !~* '^https://[^/?#]+\.localhost([:/?#]|$)'
    and href !~* '^https://[^/?#]+\.local([:/?#]|$)'
  ),
  constraint official_rule_claim_actions_visa_mode check (
    (
      requirement_type <> 'visa'
      and visa_mode is null
    )
    or (
      requirement_type = 'visa'
      and (
        visa_mode is null
        or visa_mode in (
          'visa_exempt',
          'visa_on_arrival',
          'electronic_visa',
          'visa_before_travel'
        )
      )
    )
  )
);

comment on table private.official_rule_claim_actions is
  'Accepted official actions. The source foreign key requires official authority, so a licensed provider cannot be the action source. The href check is a canonical HTTPS shape only. It does not resolve the host through the Source Registry. At most four actions by ordinal. A deferred constraint trigger requires at least one action before the claim transaction can commit.';

create table private.official_rule_claim_temporal_rule (
  claim_id bigint not null,
  fact_kind text not null,
  requirement_type text not null,
  temporal_kind text not null,
  available_from_anchor text,
  available_from_relation text,
  available_from_offset_minutes integer,
  due_by_anchor text,
  due_by_relation text,
  due_by_offset_minutes integer,
  due_by_semantics text,
  constraint official_rule_claim_temporal_rule_pkey primary key (claim_id),
  constraint official_rule_claim_temporal_rule_kind check (fact_kind = 'temporal_rule'),
  constraint official_rule_claim_temporal_rule_fk
    foreign key (claim_id, fact_kind, requirement_type)
    references private.official_rule_claims (claim_id, fact_kind, requirement_type)
    on delete restrict
    on update restrict
    deferrable initially deferred,
  constraint official_rule_claim_temporal_rule_temporal_kind check (
    temporal_kind = 'relative_duration'
  ),
  constraint official_rule_claim_temporal_rule_available check (
    (
      available_from_anchor is null
      and available_from_relation is null
      and available_from_offset_minutes is null
    )
    or (
      available_from_anchor is not null
      and available_from_anchor in (
        'trip_departure',
        'destination_arrival',
        'transit_arrival',
        'border_crossing'
      )
      and available_from_relation is not null
      and available_from_relation in ('before', 'at', 'after')
      and available_from_offset_minutes is not null
      and (
        (available_from_relation = 'at' and available_from_offset_minutes = 0)
        or (
          available_from_relation in ('before', 'after')
          and available_from_offset_minutes between 1 and 1051200
        )
      )
    )
  ),
  constraint official_rule_claim_temporal_rule_due check (
    (
      due_by_anchor is null
      and due_by_relation is null
      and due_by_offset_minutes is null
      and due_by_semantics is null
    )
    or (
      due_by_anchor is not null
      and due_by_anchor in (
        'trip_departure',
        'destination_arrival',
        'transit_arrival',
        'border_crossing'
      )
      and due_by_relation is not null
      and due_by_relation in ('before', 'at', 'after')
      and due_by_offset_minutes is not null
      and due_by_semantics is not null
      and due_by_semantics in ('mandatory', 'recommended')
      and (
        (due_by_relation = 'at' and due_by_offset_minutes = 0)
        or (
          due_by_relation in ('before', 'after')
          and due_by_offset_minutes between 1 and 1051200
        )
      )
    )
  ),
  constraint official_rule_claim_temporal_rule_some_group check (
    available_from_anchor is not null
    or due_by_anchor is not null
  ),
  constraint official_rule_claim_temporal_rule_same_anchor check (
    available_from_anchor is null
    or due_by_anchor is null
    or available_from_anchor <> due_by_anchor
    or (
      case available_from_relation
        when 'before' then -available_from_offset_minutes
        when 'after' then available_from_offset_minutes
        else 0
      end
      <=
      case due_by_relation
        when 'before' then -due_by_offset_minutes
        when 'after' then due_by_offset_minutes
        else 0
      end
    )
  )
);

comment on table private.official_rule_claim_temporal_rule is
  'Accepted relative temporal rule. At least one of available-from or due-by is required. Offsets use the technical minute bound. This table does not schedule notifications.';

alter table private.official_rule_claims enable row level security;
alter table private.official_rule_claims force row level security;
alter table private.official_rule_claim_support enable row level security;
alter table private.official_rule_claim_support force row level security;
alter table private.official_rule_claim_requirement_effect enable row level security;
alter table private.official_rule_claim_requirement_effect force row level security;
alter table private.official_rule_claim_visa_options enable row level security;
alter table private.official_rule_claim_visa_options force row level security;
alter table private.official_rule_claim_stay_limit enable row level security;
alter table private.official_rule_claim_stay_limit force row level security;
alter table private.official_rule_claim_passport_validity enable row level security;
alter table private.official_rule_claim_passport_validity force row level security;
alter table private.official_rule_claim_blank_pages enable row level security;
alter table private.official_rule_claim_blank_pages force row level security;
alter table private.official_rule_claim_transit_paths enable row level security;
alter table private.official_rule_claim_transit_paths force row level security;
alter table private.official_rule_claim_actions enable row level security;
alter table private.official_rule_claim_actions force row level security;
alter table private.official_rule_claim_temporal_rule enable row level security;
alter table private.official_rule_claim_temporal_rule force row level security;

revoke all on table private.official_rule_claims from public;
revoke all on table private.official_rule_claims from anon;
revoke all on table private.official_rule_claims from authenticated;
revoke all on table private.official_rule_claims from service_role;

revoke all on table private.official_rule_claim_support from public;
revoke all on table private.official_rule_claim_support from anon;
revoke all on table private.official_rule_claim_support from authenticated;
revoke all on table private.official_rule_claim_support from service_role;

revoke all on table private.official_rule_claim_requirement_effect from public;
revoke all on table private.official_rule_claim_requirement_effect from anon;
revoke all on table private.official_rule_claim_requirement_effect from authenticated;
revoke all on table private.official_rule_claim_requirement_effect from service_role;

revoke all on table private.official_rule_claim_visa_options from public;
revoke all on table private.official_rule_claim_visa_options from anon;
revoke all on table private.official_rule_claim_visa_options from authenticated;
revoke all on table private.official_rule_claim_visa_options from service_role;

revoke all on table private.official_rule_claim_stay_limit from public;
revoke all on table private.official_rule_claim_stay_limit from anon;
revoke all on table private.official_rule_claim_stay_limit from authenticated;
revoke all on table private.official_rule_claim_stay_limit from service_role;

revoke all on table private.official_rule_claim_passport_validity from public;
revoke all on table private.official_rule_claim_passport_validity from anon;
revoke all on table private.official_rule_claim_passport_validity from authenticated;
revoke all on table private.official_rule_claim_passport_validity from service_role;

revoke all on table private.official_rule_claim_blank_pages from public;
revoke all on table private.official_rule_claim_blank_pages from anon;
revoke all on table private.official_rule_claim_blank_pages from authenticated;
revoke all on table private.official_rule_claim_blank_pages from service_role;

revoke all on table private.official_rule_claim_transit_paths from public;
revoke all on table private.official_rule_claim_transit_paths from anon;
revoke all on table private.official_rule_claim_transit_paths from authenticated;
revoke all on table private.official_rule_claim_transit_paths from service_role;

revoke all on table private.official_rule_claim_actions from public;
revoke all on table private.official_rule_claim_actions from anon;
revoke all on table private.official_rule_claim_actions from authenticated;
revoke all on table private.official_rule_claim_actions from service_role;

revoke all on table private.official_rule_claim_temporal_rule from public;
revoke all on table private.official_rule_claim_temporal_rule from anon;
revoke all on table private.official_rule_claim_temporal_rule from authenticated;
revoke all on table private.official_rule_claim_temporal_rule from service_role;

create function private.official_rule_claim_fact_payload_present(claim bigint, kind text)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select case kind
    when 'requirement_effect' then exists (
      select 1 from private.official_rule_claim_requirement_effect where claim_id = claim
    )
    when 'visa_options' then exists (
      select 1 from private.official_rule_claim_visa_options where claim_id = claim
    )
    when 'stay_limit' then exists (
      select 1 from private.official_rule_claim_stay_limit where claim_id = claim
    )
    when 'passport_validity' then exists (
      select 1 from private.official_rule_claim_passport_validity where claim_id = claim
    )
    when 'blank_passport_pages' then exists (
      select 1 from private.official_rule_claim_blank_pages where claim_id = claim
    )
    when 'transit_conditions' then exists (
      select 1 from private.official_rule_claim_transit_paths where claim_id = claim
    )
    when 'official_actions' then exists (
      select 1 from private.official_rule_claim_actions where claim_id = claim
    )
    when 'temporal_rule' then exists (
      select 1 from private.official_rule_claim_temporal_rule where claim_id = claim
    )
    else false
  end;
$$;

comment on function private.official_rule_claim_fact_payload_present(bigint, text) is
  'True when the claim has at least one row in the typed fact table for its own fact kind. Not an acceptance engine and not an API.';

create function private.official_rule_claim_require_fact_payload()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  candidate bigint;
  kind text;
  targets bigint[];
begin
  if tg_table_name = 'official_rule_claims' then
    if tg_op = 'DELETE' then
      return null;
    end if;
    targets := array[new.claim_id];
  elsif tg_op = 'DELETE' then
    targets := array[old.claim_id];
  elsif tg_op = 'UPDATE' and old.claim_id is distinct from new.claim_id then
    targets := array[old.claim_id, new.claim_id];
  else
    targets := array[new.claim_id];
  end if;

  foreach candidate in array targets loop
    select c.fact_kind into kind
    from private.official_rule_claims as c
    where c.claim_id = candidate;
    if not found then
      continue;
    end if;
    if not private.official_rule_claim_fact_payload_present(candidate, kind) then
      raise exception 'accepted rule claim % has no persisted % fact payload', candidate, kind
        using errcode = '23514';
    end if;
  end loop;
  return null;
end;
$$;

comment on function private.official_rule_claim_require_fact_payload() is
  'Deferred constraint trigger. Requires the matching fact payload at commit. It does not count supports. Not an API.';

create constraint trigger official_rule_claims_fact_payload
after insert or update on private.official_rule_claims
deferrable initially deferred
for each row
execute function private.official_rule_claim_require_fact_payload();

create constraint trigger official_rule_claim_requirement_effect_fact_payload
after insert or update or delete on private.official_rule_claim_requirement_effect
deferrable initially deferred
for each row
execute function private.official_rule_claim_require_fact_payload();

create constraint trigger official_rule_claim_visa_options_fact_payload
after insert or update or delete on private.official_rule_claim_visa_options
deferrable initially deferred
for each row
execute function private.official_rule_claim_require_fact_payload();

create constraint trigger official_rule_claim_stay_limit_fact_payload
after insert or update or delete on private.official_rule_claim_stay_limit
deferrable initially deferred
for each row
execute function private.official_rule_claim_require_fact_payload();

create constraint trigger official_rule_claim_passport_validity_fact_payload
after insert or update or delete on private.official_rule_claim_passport_validity
deferrable initially deferred
for each row
execute function private.official_rule_claim_require_fact_payload();

create constraint trigger official_rule_claim_blank_pages_fact_payload
after insert or update or delete on private.official_rule_claim_blank_pages
deferrable initially deferred
for each row
execute function private.official_rule_claim_require_fact_payload();

create constraint trigger official_rule_claim_transit_paths_fact_payload
after insert or update or delete on private.official_rule_claim_transit_paths
deferrable initially deferred
for each row
execute function private.official_rule_claim_require_fact_payload();

create constraint trigger official_rule_claim_actions_fact_payload
after insert or update or delete on private.official_rule_claim_actions
deferrable initially deferred
for each row
execute function private.official_rule_claim_require_fact_payload();

create constraint trigger official_rule_claim_temporal_rule_fact_payload
after insert or update or delete on private.official_rule_claim_temporal_rule
deferrable initially deferred
for each row
execute function private.official_rule_claim_require_fact_payload();

revoke all on function private.official_rule_claim_transit_airports_ok(text[]) from public;
revoke all on function private.official_rule_claim_transit_airports_ok(text[]) from anon;
revoke all on function private.official_rule_claim_transit_airports_ok(text[]) from authenticated;
revoke all on function private.official_rule_claim_transit_airports_ok(text[]) from service_role;

revoke all on function private.official_rule_claim_fact_payload_present(bigint, text) from public;
revoke all on function private.official_rule_claim_fact_payload_present(bigint, text) from anon;
revoke all on function private.official_rule_claim_fact_payload_present(bigint, text) from authenticated;
revoke all on function private.official_rule_claim_fact_payload_present(bigint, text) from service_role;

revoke all on function private.official_rule_claim_require_fact_payload() from public;
revoke all on function private.official_rule_claim_require_fact_payload() from anon;
revoke all on function private.official_rule_claim_require_fact_payload() from authenticated;
revoke all on function private.official_rule_claim_require_fact_payload() from service_role;
