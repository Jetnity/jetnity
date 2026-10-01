-- Jetnity V2 – Official Truth trusted accepted-store writer 1
--
-- Repository migration only. Cursor does not apply this file to Development
-- or Production. The filename comes from
-- `supabase migration new official_truth_trusted_store_writer_1`.
-- The timestamp was not typed by hand.
--
-- One public gateway: public.official_truth_store_accepted_v1(jsonb).
-- It is a transaction transport for rows the TypeScript writer already
-- accepted. It does not decide whether research evidence is true, does not
-- recompute rule_scope_key, and does not count supports.
--
-- Exact duplicate: idempotent no-op. The stored row is not replaced.
-- Conflicting duplicate: fail closed. There is no UPDATE and no DELETE.
-- accepted_at is an audit instant. A later identical claim keeps the first
-- accepted_at.
--
-- Support source_id and source_class are read from the stored evidence
-- version and official_sources. A caller-supplied source class is ignored.
-- Official-action source_class is read from official_sources the same way.
-- This function does not insert source catalog rows.
--
-- The deferred fact-payload trigger stays in force. Before the gateway
-- returns, those constraints are set immediate so the check runs as the
-- function owner. The trigger is not disabled and not replaced.
--
-- search_path is empty. Relation and function references in the body are
-- schema-qualified. EXECUTE is granted only to service_role.

create function public.official_truth_store_accepted_v1(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  operation text;
  body jsonb;
  fact jsonb;
  neu_version_id text;
  neu_previous_version_id text;
  neu_lifecycle text;
  neu_validation_state text;
  neu_source_id text;
  neu_canonical_url text;
  neu_retrieved_at text;
  neu_source_content_hash text;
  neu_valid_from text;
  neu_valid_until text;
  neu_lookup_key text;
  neu_extraction_note text;
  neu_rule_scope_key text;
  neu_destination text;
  neu_transit text;
  neu_citizenship_mode text;
  neu_citizenship text[];
  neu_credential_mode text;
  neu_document_type text;
  neu_issuing text;
  neu_related text;
  neu_residence_mode text;
  neu_residence text;
  neu_requirement_type text;
  neu_validity_mode text;
  neu_travel_date text;
  neu_fact_kind text;
  neu_evidence_quality text;
  neu_accepted_at timestamptz;
  neu_support text[];
  stored_support text[];
  incoming_fact jsonb;
  stored_fact jsonb;
  stored_claim_id bigint;
  new_claim_id bigint;
  exact_match boolean;
  present boolean;
  support_expected bigint;
  support_written bigint;
  action_source_class text;
  action_row record;
  option_row record;
  path_row record;
  path_airports text[];
begin
  if payload is null or pg_catalog.jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'official truth store payload is not an object'
      using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'operation') is distinct from 'string' then
    raise exception 'official truth store operation is not supported'
      using errcode = '22023';
  end if;

  operation := payload ->> 'operation';

  if operation = 'accepted_evidence' then
    body := payload -> 'evidence';
    if body is null or pg_catalog.jsonb_typeof(body) is distinct from 'object' then
      raise exception 'official truth store evidence is not an object'
        using errcode = '22023';
    end if;

    neu_version_id := body ->> 'version_id';
    neu_previous_version_id := body ->> 'previous_version_id';
    neu_lifecycle := body ->> 'lifecycle';
    neu_validation_state := body ->> 'validation_state';
    neu_source_id := body ->> 'source_id';
    neu_canonical_url := body ->> 'canonical_url';
    neu_retrieved_at := body ->> 'retrieved_at';
    neu_source_content_hash := body ->> 'source_content_hash';
    neu_valid_from := body ->> 'valid_from';
    neu_valid_until := body ->> 'valid_until';
    neu_lookup_key := body ->> 'lookup_key';
    neu_extraction_note := body ->> 'extraction_note';
    neu_rule_scope_key := body ->> 'rule_scope_key';
    neu_destination := body ->> 'destination_country_code';
    neu_transit := body ->> 'transit_country_code';
    neu_citizenship_mode := body ->> 'citizenship_mode';
    neu_credential_mode := body ->> 'credential_option_mode';
    neu_document_type := body ->> 'document_type';
    neu_issuing := body ->> 'issuing_country_code';
    neu_related := body ->> 'related_citizenship_country_code';
    neu_residence_mode := body ->> 'residence_mode';
    neu_residence := body ->> 'residence_country_code';
    neu_requirement_type := body ->> 'requirement_type';
    neu_validity_mode := body ->> 'validity_mode';
    neu_travel_date := body ->> 'travel_date';

    if pg_catalog.jsonb_typeof(body -> 'citizenship_country_codes') is distinct from 'array' then
      raise exception 'official truth store citizenship list is invalid'
        using errcode = '22023';
    end if;

    select pg_catalog.array_agg(item.value order by item.ordinality)::pg_catalog.text[]
    into neu_citizenship
    from pg_catalog.jsonb_array_elements_text(body -> 'citizenship_country_codes')
      with ordinality as item(value, ordinality);
    if neu_citizenship is null then
      neu_citizenship := '{}'::pg_catalog.text[];
    end if;

    exact_match := exists (
      select 1
      from private.official_evidence_versions as existing
      where existing.version_id = neu_version_id
        and existing.previous_version_id is not distinct from neu_previous_version_id
        and existing.lifecycle is not distinct from neu_lifecycle
        and existing.validation_state is not distinct from neu_validation_state
        and existing.source_id is not distinct from neu_source_id
        and existing.canonical_url is not distinct from neu_canonical_url
        and existing.retrieved_at is not distinct from neu_retrieved_at
        and existing.source_content_hash is not distinct from neu_source_content_hash
        and existing.valid_from is not distinct from neu_valid_from
        and existing.valid_until is not distinct from neu_valid_until
        and existing.lookup_key is not distinct from neu_lookup_key
        and existing.extraction_note is not distinct from neu_extraction_note
        and existing.rule_scope_key is not distinct from neu_rule_scope_key
        and existing.destination_country_code is not distinct from neu_destination
        and existing.transit_country_code is not distinct from neu_transit
        and existing.citizenship_mode is not distinct from neu_citizenship_mode
        and existing.citizenship_country_codes is not distinct from neu_citizenship
        and existing.credential_option_mode is not distinct from neu_credential_mode
        and existing.document_type is not distinct from neu_document_type
        and existing.issuing_country_code is not distinct from neu_issuing
        and existing.related_citizenship_country_code is not distinct from neu_related
        and existing.residence_mode is not distinct from neu_residence_mode
        and existing.residence_country_code is not distinct from neu_residence
        and existing.requirement_type is not distinct from neu_requirement_type
        and existing.validity_mode is not distinct from neu_validity_mode
        and existing.travel_date is not distinct from neu_travel_date
    );

    if exact_match then
      return pg_catalog.jsonb_build_object(
        'ok', true,
        'operation', 'accepted_evidence',
        'outcome', 'idempotent',
        'version_id', neu_version_id
      );
    end if;

    present := exists (
      select 1
      from private.official_evidence_versions as existing
      where existing.version_id = neu_version_id
    );

    if present then
      raise exception 'conflicting official evidence version'
        using errcode = '23505';
    end if;

    insert into private.official_evidence_versions (
      version_id,
      previous_version_id,
      lifecycle,
      validation_state,
      source_id,
      canonical_url,
      retrieved_at,
      source_content_hash,
      valid_from,
      valid_until,
      lookup_key,
      extraction_note,
      destination_country_code,
      transit_country_code,
      citizenship_mode,
      citizenship_country_codes,
      credential_option_mode,
      document_type,
      issuing_country_code,
      related_citizenship_country_code,
      residence_mode,
      residence_country_code,
      requirement_type,
      validity_mode,
      travel_date,
      rule_scope_key
    ) values (
      neu_version_id,
      neu_previous_version_id,
      neu_lifecycle,
      neu_validation_state,
      neu_source_id,
      neu_canonical_url,
      neu_retrieved_at,
      neu_source_content_hash,
      neu_valid_from,
      neu_valid_until,
      neu_lookup_key,
      neu_extraction_note,
      neu_destination,
      neu_transit,
      neu_citizenship_mode,
      neu_citizenship,
      neu_credential_mode,
      neu_document_type,
      neu_issuing,
      neu_related,
      neu_residence_mode,
      neu_residence,
      neu_requirement_type,
      neu_validity_mode,
      neu_travel_date,
      neu_rule_scope_key
    );

    return pg_catalog.jsonb_build_object(
      'ok', true,
      'operation', 'accepted_evidence',
      'outcome', 'inserted',
      'version_id', neu_version_id
    );
  end if;

  if operation is distinct from 'accepted_rule_claim' then
    raise exception 'official truth store operation is not supported'
      using errcode = '22023';
  end if;

  body := payload -> 'claim';
  if body is null or pg_catalog.jsonb_typeof(body) is distinct from 'object' then
    raise exception 'official truth store claim is not an object'
      using errcode = '22023';
  end if;

  fact := body -> 'fact';
  if fact is null or pg_catalog.jsonb_typeof(fact) is distinct from 'object' then
    raise exception 'official truth store fact is not an object'
      using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'accepted_at') is distinct from 'string' then
    raise exception 'official truth store accepted_at is invalid'
      using errcode = '22023';
  end if;

  neu_accepted_at := (payload ->> 'accepted_at')::pg_catalog.timestamptz;
  neu_rule_scope_key := body ->> 'rule_scope_key';
  neu_fact_kind := body ->> 'fact_kind';
  neu_evidence_quality := body ->> 'evidence_quality';
  neu_lifecycle := body ->> 'lifecycle';
  neu_validation_state := body ->> 'validation_state';
  neu_destination := body ->> 'destination_country_code';
  neu_transit := body ->> 'transit_country_code';
  neu_citizenship_mode := body ->> 'citizenship_mode';
  neu_credential_mode := body ->> 'credential_option_mode';
  neu_document_type := body ->> 'document_type';
  neu_issuing := body ->> 'issuing_country_code';
  neu_related := body ->> 'related_citizenship_country_code';
  neu_residence_mode := body ->> 'residence_mode';
  neu_residence := body ->> 'residence_country_code';
  neu_requirement_type := body ->> 'requirement_type';
  neu_validity_mode := body ->> 'validity_mode';
  neu_travel_date := body ->> 'travel_date';

  if pg_catalog.jsonb_typeof(body -> 'citizenship_country_codes') is distinct from 'array' then
    raise exception 'official truth store citizenship list is invalid'
      using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(body -> 'support_version_ids') is distinct from 'array' then
    raise exception 'official truth store support list is invalid'
      using errcode = '22023';
  end if;

  select pg_catalog.array_agg(item.value order by item.ordinality)::pg_catalog.text[]
  into neu_citizenship
  from pg_catalog.jsonb_array_elements_text(body -> 'citizenship_country_codes')
    with ordinality as item(value, ordinality);
  if neu_citizenship is null then
    neu_citizenship := '{}'::pg_catalog.text[];
  end if;

  select pg_catalog.array_agg(item.value order by item.value)::pg_catalog.text[]
  into neu_support
  from pg_catalog.jsonb_array_elements_text(body -> 'support_version_ids') as item(value);
  if neu_support is null then
    neu_support := '{}'::pg_catalog.text[];
  end if;

  if neu_fact_kind = 'requirement_effect' then
    incoming_fact := pg_catalog.jsonb_build_object(
      'effect', fact ->> 'effect',
      'visa_mode', fact ->> 'visa_mode'
    );
  elsif neu_fact_kind = 'visa_options' then
    if pg_catalog.jsonb_typeof(fact -> 'options') is distinct from 'array' then
      raise exception 'official truth store visa options are invalid'
        using errcode = '22023';
    end if;
    select pg_catalog.jsonb_build_object(
      'options',
      coalesce(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'ordinal', (option_item.value ->> 'ordinal')::pg_catalog.int4,
            'visa_mode', option_item.value ->> 'visa_mode',
            'eligibility', option_item.value ->> 'eligibility',
            'mandate', option_item.value ->> 'mandate'
          )
          order by (option_item.value ->> 'ordinal')::pg_catalog.int4
        ),
        '[]'::pg_catalog.jsonb
      )
    )
    into incoming_fact
    from pg_catalog.jsonb_array_elements(fact -> 'options') as option_item(value);
  elsif neu_fact_kind = 'stay_limit' then
    incoming_fact := pg_catalog.jsonb_build_object(
      'per_visit_value', case when fact -> 'per_visit_value' = 'null'::pg_catalog.jsonb or fact -> 'per_visit_value' is null then null else (fact ->> 'per_visit_value')::pg_catalog.int4 end,
      'per_visit_unit', fact ->> 'per_visit_unit',
      'rolling_maximum_value', case when fact -> 'rolling_maximum_value' = 'null'::pg_catalog.jsonb or fact -> 'rolling_maximum_value' is null then null else (fact ->> 'rolling_maximum_value')::pg_catalog.int4 end,
      'rolling_maximum_unit', fact ->> 'rolling_maximum_unit',
      'rolling_within_value', case when fact -> 'rolling_within_value' = 'null'::pg_catalog.jsonb or fact -> 'rolling_within_value' is null then null else (fact ->> 'rolling_within_value')::pg_catalog.int4 end,
      'rolling_within_unit', fact ->> 'rolling_within_unit',
      'initial_grant_value', case when fact -> 'initial_grant_value' = 'null'::pg_catalog.jsonb or fact -> 'initial_grant_value' is null then null else (fact ->> 'initial_grant_value')::pg_catalog.int4 end,
      'initial_grant_unit', fact ->> 'initial_grant_unit',
      'extension_requires_application', case when fact -> 'extension_requires_application' = 'null'::pg_catalog.jsonb or fact -> 'extension_requires_application' is null then null else (fact ->> 'extension_requires_application')::pg_catalog.bool end,
      'extension_maximum_total_value', case when fact -> 'extension_maximum_total_value' = 'null'::pg_catalog.jsonb or fact -> 'extension_maximum_total_value' is null then null else (fact ->> 'extension_maximum_total_value')::pg_catalog.int4 end,
      'extension_maximum_total_unit', fact ->> 'extension_maximum_total_unit',
      'border_discretion', fact ->> 'border_discretion'
    );
  elsif neu_fact_kind = 'passport_validity' then
    incoming_fact := pg_catalog.jsonb_build_object(
      'semantics', fact ->> 'semantics',
      'duration_value', case when fact -> 'duration_value' = 'null'::pg_catalog.jsonb or fact -> 'duration_value' is null then null else (fact ->> 'duration_value')::pg_catalog.int4 end,
      'duration_unit', fact ->> 'duration_unit'
    );
  elsif neu_fact_kind = 'blank_passport_pages' then
    incoming_fact := pg_catalog.jsonb_build_object(
      'minimum_pages', (fact ->> 'minimum_pages')::pg_catalog.int4
    );
  elsif neu_fact_kind = 'transit_conditions' then
    if pg_catalog.jsonb_typeof(fact -> 'paths') is distinct from 'array' then
      raise exception 'official truth store transit paths are invalid'
        using errcode = '22023';
    end if;
    select pg_catalog.jsonb_build_object(
      'paths',
      coalesce(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'ordinal', (path_item.value ->> 'ordinal')::pg_catalog.int4,
            'crosses_border_control', case when path_item.value -> 'crosses_border_control' = 'null'::pg_catalog.jsonb or path_item.value -> 'crosses_border_control' is null then null else (path_item.value ->> 'crosses_border_control')::pg_catalog.bool end,
            'leaves_transit_area', case when path_item.value -> 'leaves_transit_area' = 'null'::pg_catalog.jsonb or path_item.value -> 'leaves_transit_area' is null then null else (path_item.value ->> 'leaves_transit_area')::pg_catalog.bool end,
            'transit_airport_codes', path_item.value -> 'transit_airport_codes',
            'max_transit_duration_minutes', case when path_item.value -> 'max_transit_duration_minutes' = 'null'::pg_catalog.jsonb or path_item.value -> 'max_transit_duration_minutes' is null then null else (path_item.value ->> 'max_transit_duration_minutes')::pg_catalog.int4 end,
            'arrival_mode', path_item.value ->> 'arrival_mode',
            'departure_mode', path_item.value ->> 'departure_mode',
            'third_country_required', case when path_item.value -> 'third_country_required' = 'null'::pg_catalog.jsonb or path_item.value -> 'third_country_required' is null then null else (path_item.value ->> 'third_country_required')::pg_catalog.bool end,
            'same_flight_required', case when path_item.value -> 'same_flight_required' = 'null'::pg_catalog.jsonb or path_item.value -> 'same_flight_required' is null then null else (path_item.value ->> 'same_flight_required')::pg_catalog.bool end,
            'onward_ticket_required', case when path_item.value -> 'onward_ticket_required' = 'null'::pg_catalog.jsonb or path_item.value -> 'onward_ticket_required' is null then null else (path_item.value ->> 'onward_ticket_required')::pg_catalog.bool end
          )
          order by (path_item.value ->> 'ordinal')::pg_catalog.int4
        ),
        '[]'::pg_catalog.jsonb
      )
    )
    into incoming_fact
    from pg_catalog.jsonb_array_elements(fact -> 'paths') as path_item(value);
  elsif neu_fact_kind = 'official_actions' then
    if pg_catalog.jsonb_typeof(fact -> 'actions') is distinct from 'array' then
      raise exception 'official truth store official actions are invalid'
        using errcode = '22023';
    end if;
    select pg_catalog.jsonb_build_object(
      'actions',
      coalesce(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'ordinal', (action_item.value ->> 'ordinal')::pg_catalog.int4,
            'action_source_id', action_item.value ->> 'action_source_id',
            'purpose', action_item.value ->> 'purpose',
            'href', action_item.value ->> 'href',
            'visa_mode', action_item.value ->> 'visa_mode'
          )
          order by (action_item.value ->> 'ordinal')::pg_catalog.int4
        ),
        '[]'::pg_catalog.jsonb
      )
    )
    into incoming_fact
    from pg_catalog.jsonb_array_elements(fact -> 'actions') as action_item(value);
  elsif neu_fact_kind = 'temporal_rule' then
    incoming_fact := pg_catalog.jsonb_build_object(
      'temporal_kind', fact ->> 'temporal_kind',
      'available_from_anchor', fact ->> 'available_from_anchor',
      'available_from_relation', fact ->> 'available_from_relation',
      'available_from_offset_minutes', case when fact -> 'available_from_offset_minutes' = 'null'::pg_catalog.jsonb or fact -> 'available_from_offset_minutes' is null then null else (fact ->> 'available_from_offset_minutes')::pg_catalog.int4 end,
      'due_by_anchor', fact ->> 'due_by_anchor',
      'due_by_relation', fact ->> 'due_by_relation',
      'due_by_offset_minutes', case when fact -> 'due_by_offset_minutes' = 'null'::pg_catalog.jsonb or fact -> 'due_by_offset_minutes' is null then null else (fact ->> 'due_by_offset_minutes')::pg_catalog.int4 end,
      'due_by_semantics', fact ->> 'due_by_semantics'
    );
  else
    incoming_fact := null;
  end if;

  select existing.claim_id
  into stored_claim_id
  from private.official_rule_claims as existing
  where existing.rule_scope_key = neu_rule_scope_key
    and existing.fact_kind = neu_fact_kind;

  if found then
    select pg_catalog.array_agg(support.version_id order by support.version_id)::pg_catalog.text[]
    into stored_support
    from private.official_rule_claim_support as support
    where support.claim_id = stored_claim_id;
    if stored_support is null then
      stored_support := '{}'::pg_catalog.text[];
    end if;

    stored_fact := case neu_fact_kind
      when 'requirement_effect' then (
        select pg_catalog.jsonb_build_object(
          'effect', fact_row.effect,
          'visa_mode', fact_row.visa_mode
        )
        from private.official_rule_claim_requirement_effect as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'visa_options' then (
        select pg_catalog.jsonb_build_object(
          'options',
          coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'ordinal', fact_row.ordinal::pg_catalog.int4,
                'visa_mode', fact_row.visa_mode,
                'eligibility', fact_row.eligibility,
                'mandate', fact_row.mandate
              )
              order by fact_row.ordinal
            ),
            '[]'::pg_catalog.jsonb
          )
        )
        from private.official_rule_claim_visa_options as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'stay_limit' then (
        select pg_catalog.jsonb_build_object(
          'per_visit_value', fact_row.per_visit_value,
          'per_visit_unit', fact_row.per_visit_unit,
          'rolling_maximum_value', fact_row.rolling_maximum_value,
          'rolling_maximum_unit', fact_row.rolling_maximum_unit,
          'rolling_within_value', fact_row.rolling_within_value,
          'rolling_within_unit', fact_row.rolling_within_unit,
          'initial_grant_value', fact_row.initial_grant_value,
          'initial_grant_unit', fact_row.initial_grant_unit,
          'extension_requires_application', fact_row.extension_requires_application,
          'extension_maximum_total_value', fact_row.extension_maximum_total_value,
          'extension_maximum_total_unit', fact_row.extension_maximum_total_unit,
          'border_discretion', fact_row.border_discretion
        )
        from private.official_rule_claim_stay_limit as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'passport_validity' then (
        select pg_catalog.jsonb_build_object(
          'semantics', fact_row.semantics,
          'duration_value', fact_row.duration_value,
          'duration_unit', fact_row.duration_unit
        )
        from private.official_rule_claim_passport_validity as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'blank_passport_pages' then (
        select pg_catalog.jsonb_build_object('minimum_pages', fact_row.minimum_pages)
        from private.official_rule_claim_blank_pages as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'transit_conditions' then (
        select pg_catalog.jsonb_build_object(
          'paths',
          coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'ordinal', fact_row.ordinal::pg_catalog.int4,
                'crosses_border_control', fact_row.crosses_border_control,
                'leaves_transit_area', fact_row.leaves_transit_area,
                'transit_airport_codes', pg_catalog.to_jsonb(fact_row.transit_airport_codes),
                'max_transit_duration_minutes', fact_row.max_transit_duration_minutes,
                'arrival_mode', fact_row.arrival_mode,
                'departure_mode', fact_row.departure_mode,
                'third_country_required', fact_row.third_country_required,
                'same_flight_required', fact_row.same_flight_required,
                'onward_ticket_required', fact_row.onward_ticket_required
              )
              order by fact_row.ordinal
            ),
            '[]'::pg_catalog.jsonb
          )
        )
        from private.official_rule_claim_transit_paths as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'official_actions' then (
        select pg_catalog.jsonb_build_object(
          'actions',
          coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'ordinal', fact_row.ordinal::pg_catalog.int4,
                'action_source_id', fact_row.action_source_id,
                'purpose', fact_row.purpose,
                'href', fact_row.href,
                'visa_mode', fact_row.visa_mode
              )
              order by fact_row.ordinal
            ),
            '[]'::pg_catalog.jsonb
          )
        )
        from private.official_rule_claim_actions as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'temporal_rule' then (
        select pg_catalog.jsonb_build_object(
          'temporal_kind', fact_row.temporal_kind,
          'available_from_anchor', fact_row.available_from_anchor,
          'available_from_relation', fact_row.available_from_relation,
          'available_from_offset_minutes', fact_row.available_from_offset_minutes,
          'due_by_anchor', fact_row.due_by_anchor,
          'due_by_relation', fact_row.due_by_relation,
          'due_by_offset_minutes', fact_row.due_by_offset_minutes,
          'due_by_semantics', fact_row.due_by_semantics
        )
        from private.official_rule_claim_temporal_rule as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      else null
    end;

    exact_match := exists (
      select 1
      from private.official_rule_claims as existing
      where existing.claim_id = stored_claim_id
        and existing.rule_scope_key is not distinct from neu_rule_scope_key
        and existing.fact_kind is not distinct from neu_fact_kind
        and existing.evidence_quality is not distinct from neu_evidence_quality
        and existing.lifecycle is not distinct from neu_lifecycle
        and existing.validation_state is not distinct from neu_validation_state
        and existing.destination_country_code is not distinct from neu_destination
        and existing.transit_country_code is not distinct from neu_transit
        and existing.citizenship_mode is not distinct from neu_citizenship_mode
        and existing.citizenship_country_codes is not distinct from neu_citizenship
        and existing.credential_option_mode is not distinct from neu_credential_mode
        and existing.document_type is not distinct from neu_document_type
        and existing.issuing_country_code is not distinct from neu_issuing
        and existing.related_citizenship_country_code is not distinct from neu_related
        and existing.residence_mode is not distinct from neu_residence_mode
        and existing.residence_country_code is not distinct from neu_residence
        and existing.requirement_type is not distinct from neu_requirement_type
        and existing.validity_mode is not distinct from neu_validity_mode
        and existing.travel_date is not distinct from neu_travel_date
    )
    and stored_support is not distinct from neu_support
    and stored_fact is not distinct from incoming_fact;

    if exact_match then
      return pg_catalog.jsonb_build_object(
        'ok', true,
        'operation', 'accepted_rule_claim',
        'outcome', 'idempotent',
        'claim_id', stored_claim_id
      );
    end if;

    raise exception 'conflicting official rule claim'
      using errcode = '23505';
  end if;

  insert into private.official_rule_claims (
    rule_scope_key,
    fact_kind,
    evidence_quality,
    lifecycle,
    validation_state,
    accepted_at,
    destination_country_code,
    transit_country_code,
    citizenship_mode,
    citizenship_country_codes,
    credential_option_mode,
    document_type,
    issuing_country_code,
    related_citizenship_country_code,
    residence_mode,
    residence_country_code,
    requirement_type,
    validity_mode,
    travel_date
  ) values (
    neu_rule_scope_key,
    neu_fact_kind,
    neu_evidence_quality,
    neu_lifecycle,
    neu_validation_state,
    neu_accepted_at,
    neu_destination,
    neu_transit,
    neu_citizenship_mode,
    neu_citizenship,
    neu_credential_mode,
    neu_document_type,
    neu_issuing,
    neu_related,
    neu_residence_mode,
    neu_residence,
    neu_requirement_type,
    neu_validity_mode,
    neu_travel_date
  )
  returning claim_id into new_claim_id;

  if neu_fact_kind = 'requirement_effect' then
    insert into private.official_rule_claim_requirement_effect (
      claim_id, fact_kind, requirement_type, effect, visa_mode
    ) values (
      new_claim_id,
      neu_fact_kind,
      neu_requirement_type,
      fact ->> 'effect',
      fact ->> 'visa_mode'
    );
  elsif neu_fact_kind = 'visa_options' then
    for option_row in
      select entry.value as value
      from pg_catalog.jsonb_array_elements(fact -> 'options') as entry(value)
    loop
      insert into private.official_rule_claim_visa_options (
        claim_id, fact_kind, requirement_type, ordinal, visa_mode, eligibility, mandate
      ) values (
        new_claim_id,
        neu_fact_kind,
        neu_requirement_type,
        (option_row.value ->> 'ordinal')::pg_catalog.int2,
        option_row.value ->> 'visa_mode',
        option_row.value ->> 'eligibility',
        option_row.value ->> 'mandate'
      );
    end loop;
  elsif neu_fact_kind = 'stay_limit' then
    insert into private.official_rule_claim_stay_limit (
      claim_id,
      fact_kind,
      requirement_type,
      per_visit_value,
      per_visit_unit,
      rolling_maximum_value,
      rolling_maximum_unit,
      rolling_within_value,
      rolling_within_unit,
      initial_grant_value,
      initial_grant_unit,
      extension_requires_application,
      extension_maximum_total_value,
      extension_maximum_total_unit,
      border_discretion
    ) values (
      new_claim_id,
      neu_fact_kind,
      neu_requirement_type,
      case when fact -> 'per_visit_value' = 'null'::pg_catalog.jsonb or fact -> 'per_visit_value' is null then null else (fact ->> 'per_visit_value')::pg_catalog.int4 end,
      fact ->> 'per_visit_unit',
      case when fact -> 'rolling_maximum_value' = 'null'::pg_catalog.jsonb or fact -> 'rolling_maximum_value' is null then null else (fact ->> 'rolling_maximum_value')::pg_catalog.int4 end,
      fact ->> 'rolling_maximum_unit',
      case when fact -> 'rolling_within_value' = 'null'::pg_catalog.jsonb or fact -> 'rolling_within_value' is null then null else (fact ->> 'rolling_within_value')::pg_catalog.int4 end,
      fact ->> 'rolling_within_unit',
      case when fact -> 'initial_grant_value' = 'null'::pg_catalog.jsonb or fact -> 'initial_grant_value' is null then null else (fact ->> 'initial_grant_value')::pg_catalog.int4 end,
      fact ->> 'initial_grant_unit',
      case when fact -> 'extension_requires_application' = 'null'::pg_catalog.jsonb or fact -> 'extension_requires_application' is null then null else (fact ->> 'extension_requires_application')::pg_catalog.bool end,
      case when fact -> 'extension_maximum_total_value' = 'null'::pg_catalog.jsonb or fact -> 'extension_maximum_total_value' is null then null else (fact ->> 'extension_maximum_total_value')::pg_catalog.int4 end,
      fact ->> 'extension_maximum_total_unit',
      fact ->> 'border_discretion'
    );
  elsif neu_fact_kind = 'passport_validity' then
    insert into private.official_rule_claim_passport_validity (
      claim_id, fact_kind, requirement_type, semantics, duration_value, duration_unit
    ) values (
      new_claim_id,
      neu_fact_kind,
      neu_requirement_type,
      fact ->> 'semantics',
      case when fact -> 'duration_value' = 'null'::pg_catalog.jsonb or fact -> 'duration_value' is null then null else (fact ->> 'duration_value')::pg_catalog.int4 end,
      fact ->> 'duration_unit'
    );
  elsif neu_fact_kind = 'blank_passport_pages' then
    insert into private.official_rule_claim_blank_pages (
      claim_id, fact_kind, requirement_type, minimum_pages
    ) values (
      new_claim_id,
      neu_fact_kind,
      neu_requirement_type,
      (fact ->> 'minimum_pages')::pg_catalog.int4
    );
  elsif neu_fact_kind = 'transit_conditions' then
    for path_row in
      select entry.value as value
      from pg_catalog.jsonb_array_elements(fact -> 'paths') as entry(value)
    loop
      if path_row.value -> 'transit_airport_codes' is null
        or path_row.value -> 'transit_airport_codes' = 'null'::pg_catalog.jsonb then
        path_airports := null;
      elsif pg_catalog.jsonb_typeof(path_row.value -> 'transit_airport_codes') is distinct from 'array' then
        raise exception 'official truth store transit airports are invalid'
          using errcode = '22023';
      else
        select pg_catalog.array_agg(code.value order by code.ordinality)
        into path_airports
        from pg_catalog.jsonb_array_elements_text(path_row.value -> 'transit_airport_codes')
          with ordinality as code(value, ordinality);
      end if;

      insert into private.official_rule_claim_transit_paths (
        claim_id,
        fact_kind,
        requirement_type,
        ordinal,
        crosses_border_control,
        leaves_transit_area,
        transit_airport_codes,
        max_transit_duration_minutes,
        arrival_mode,
        departure_mode,
        third_country_required,
        same_flight_required,
        onward_ticket_required
      ) values (
        new_claim_id,
        neu_fact_kind,
        neu_requirement_type,
        (path_row.value ->> 'ordinal')::pg_catalog.int2,
        case when path_row.value -> 'crosses_border_control' = 'null'::pg_catalog.jsonb or path_row.value -> 'crosses_border_control' is null then null else (path_row.value ->> 'crosses_border_control')::pg_catalog.bool end,
        case when path_row.value -> 'leaves_transit_area' = 'null'::pg_catalog.jsonb or path_row.value -> 'leaves_transit_area' is null then null else (path_row.value ->> 'leaves_transit_area')::pg_catalog.bool end,
        path_airports,
        case when path_row.value -> 'max_transit_duration_minutes' = 'null'::pg_catalog.jsonb or path_row.value -> 'max_transit_duration_minutes' is null then null else (path_row.value ->> 'max_transit_duration_minutes')::pg_catalog.int4 end,
        path_row.value ->> 'arrival_mode',
        path_row.value ->> 'departure_mode',
        case when path_row.value -> 'third_country_required' = 'null'::pg_catalog.jsonb or path_row.value -> 'third_country_required' is null then null else (path_row.value ->> 'third_country_required')::pg_catalog.bool end,
        case when path_row.value -> 'same_flight_required' = 'null'::pg_catalog.jsonb or path_row.value -> 'same_flight_required' is null then null else (path_row.value ->> 'same_flight_required')::pg_catalog.bool end,
        case when path_row.value -> 'onward_ticket_required' = 'null'::pg_catalog.jsonb or path_row.value -> 'onward_ticket_required' is null then null else (path_row.value ->> 'onward_ticket_required')::pg_catalog.bool end
      );
    end loop;
  elsif neu_fact_kind = 'official_actions' then
    for action_row in
      select entry.value as value
      from pg_catalog.jsonb_array_elements(fact -> 'actions') as entry(value)
    loop
      select source.source_class
      into action_source_class
      from private.official_sources as source
      where source.source_id = action_row.value ->> 'action_source_id';

      if not found then
        raise exception 'official action source is not stored'
          using errcode = '23503';
      end if;

      insert into private.official_rule_claim_actions (
        claim_id,
        fact_kind,
        requirement_type,
        ordinal,
        action_source_id,
        source_class,
        purpose,
        href,
        visa_mode
      ) values (
        new_claim_id,
        neu_fact_kind,
        neu_requirement_type,
        (action_row.value ->> 'ordinal')::pg_catalog.int2,
        action_row.value ->> 'action_source_id',
        action_source_class,
        action_row.value ->> 'purpose',
        action_row.value ->> 'href',
        action_row.value ->> 'visa_mode'
      );
    end loop;
  elsif neu_fact_kind = 'temporal_rule' then
    insert into private.official_rule_claim_temporal_rule (
      claim_id,
      fact_kind,
      requirement_type,
      temporal_kind,
      available_from_anchor,
      available_from_relation,
      available_from_offset_minutes,
      due_by_anchor,
      due_by_relation,
      due_by_offset_minutes,
      due_by_semantics
    ) values (
      new_claim_id,
      neu_fact_kind,
      neu_requirement_type,
      fact ->> 'temporal_kind',
      fact ->> 'available_from_anchor',
      fact ->> 'available_from_relation',
      case when fact -> 'available_from_offset_minutes' = 'null'::pg_catalog.jsonb or fact -> 'available_from_offset_minutes' is null then null else (fact ->> 'available_from_offset_minutes')::pg_catalog.int4 end,
      fact ->> 'due_by_anchor',
      fact ->> 'due_by_relation',
      case when fact -> 'due_by_offset_minutes' = 'null'::pg_catalog.jsonb or fact -> 'due_by_offset_minutes' is null then null else (fact ->> 'due_by_offset_minutes')::pg_catalog.int4 end,
      fact ->> 'due_by_semantics'
    );
  end if;

  support_expected := pg_catalog.jsonb_array_length(body -> 'support_version_ids');

  insert into private.official_rule_claim_support (
    claim_id,
    rule_scope_key,
    version_id,
    source_id,
    evidence_lifecycle,
    evidence_validation_state,
    source_class
  )
  select
    new_claim_id,
    neu_rule_scope_key,
    version.version_id,
    version.source_id,
    version.lifecycle,
    version.validation_state,
    source.source_class
  from pg_catalog.jsonb_array_elements_text(body -> 'support_version_ids') as requested(version_id)
  join private.official_evidence_versions as version
    on version.version_id = requested.version_id
   and version.rule_scope_key = neu_rule_scope_key
  join private.official_sources as source
    on source.source_id = version.source_id;

  get diagnostics support_written = row_count;

  if support_written is distinct from support_expected then
    raise exception 'support evidence version is not stored for this rule scope'
      using errcode = '23503';
  end if;

  set constraints
    private.official_rule_claims_fact_payload,
    private.official_rule_claim_requirement_effect_fact_payload,
    private.official_rule_claim_visa_options_fact_payload,
    private.official_rule_claim_stay_limit_fact_payload,
    private.official_rule_claim_passport_validity_fact_payload,
    private.official_rule_claim_blank_pages_fact_payload,
    private.official_rule_claim_transit_paths_fact_payload,
    private.official_rule_claim_actions_fact_payload,
    private.official_rule_claim_temporal_rule_fact_payload
    immediate;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'operation', 'accepted_rule_claim',
    'outcome', 'inserted',
    'claim_id', new_claim_id
  );
end;
$fn$;

comment on function public.official_truth_store_accepted_v1(jsonb) is
  'Trusted transport for one accepted evidence version or one accepted rule claim. Not an Official-Truth engine. Exact duplicates return without writing. Conflicts fail closed. No source catalog write. EXECUTE is service_role only.';

revoke all on function public.official_truth_store_accepted_v1(jsonb) from public;
revoke all on function public.official_truth_store_accepted_v1(jsonb) from anon;
revoke all on function public.official_truth_store_accepted_v1(jsonb) from authenticated;
revoke all on function public.official_truth_store_accepted_v1(jsonb) from service_role;
grant execute on function public.official_truth_store_accepted_v1(jsonb) to service_role;
