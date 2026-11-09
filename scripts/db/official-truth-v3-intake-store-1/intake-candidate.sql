-- S1 UNAPPLIED candidate. Private UNTRUSTED proposal custody only.
-- No existing Auth, Owner, Accepted Store, Registry or public object is changed.
-- Install once in a fresh run-owned native test database. Hosted apply is gated.
BEGIN;

CREATE ROLE ot_v3_intake_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE ot_v3_intake_caller NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE SCHEMA official_v3_intake_private AUTHORIZATION ot_v3_intake_owner;
CREATE SCHEMA official_v3_intake_api AUTHORIZATION ot_v3_intake_owner;
REVOKE ALL ON SCHEMA official_v3_intake_private, official_v3_intake_api FROM PUBLIC;
GRANT USAGE ON SCHEMA official_v3_intake_api TO ot_v3_intake_caller;
ALTER DEFAULT PRIVILEGES FOR ROLE ot_v3_intake_owner IN SCHEMA official_v3_intake_private REVOKE ALL ON TABLES FROM PUBLIC;
-- Global function default removes PostgreSQL's built-in PUBLIC EXECUTE. A
-- schema-scoped REVOKE alone cannot subtract that global default grant.
ALTER DEFAULT PRIVILEGES FOR ROLE ot_v3_intake_owner REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE ot_v3_intake_owner IN SCHEMA official_v3_intake_private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE ot_v3_intake_owner IN SCHEMA official_v3_intake_api REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE TABLE official_v3_intake_private.operations_v1 (
  operation_id text PRIMARY KEY CHECK (operation_id ~ '^op3_[a-f0-9]{32}$'),
  binding jsonb NOT NULL,
  original_bytes bytea NOT NULL CHECK (octet_length(original_bytes) BETWEEN 1 AND 65536),
  proposal_digest text NOT NULL CHECK (proposal_digest = encode(sha256(original_bytes), 'hex')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  generation integer NOT NULL DEFAULT 0 CHECK (generation BETWEEN 0 AND 2147483646),
  lease_token uuid,
  acquired_at timestamptz,
  expires_at timestamptz,
  CHECK ((generation = 0 AND lease_token IS NULL AND acquired_at IS NULL AND expires_at IS NULL)
    OR (generation > 0 AND lease_token IS NOT NULL AND acquired_at IS NOT NULL AND expires_at IS NOT NULL AND expires_at > acquired_at
      AND expires_at <= acquired_at + interval '900 seconds'))
);
CREATE TABLE official_v3_intake_private.reservations_v1 (
  operation_id text NOT NULL REFERENCES official_v3_intake_private.operations_v1(operation_id),
  generation integer NOT NULL CHECK (generation BETWEEN 1 AND 2147483646),
  lease_token uuid NOT NULL,
  acquired_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL CHECK (expires_at > acquired_at AND expires_at <= acquired_at + interval '900 seconds'),
  PRIMARY KEY (operation_id, generation)
);
CREATE TABLE official_v3_intake_private.completions_v1 (
  operation_id text PRIMARY KEY REFERENCES official_v3_intake_private.operations_v1(operation_id),
  generation integer NOT NULL,
  lease_token uuid NOT NULL,
  outcome jsonb NOT NULL CHECK (octet_length(outcome::text) <= 524288),
  audit jsonb NOT NULL CHECK (octet_length(audit::text) <= 8192),
  escalation_key text CHECK (escalation_key ~ '^source-escalation:v3:[a-f0-9]{64}$'),
  completed_at timestamptz NOT NULL,
  FOREIGN KEY (operation_id, generation) REFERENCES official_v3_intake_private.reservations_v1(operation_id, generation)
);
ALTER TABLE official_v3_intake_private.operations_v1 OWNER TO ot_v3_intake_owner;
ALTER TABLE official_v3_intake_private.reservations_v1 OWNER TO ot_v3_intake_owner;
ALTER TABLE official_v3_intake_private.completions_v1 OWNER TO ot_v3_intake_owner;
ALTER TABLE official_v3_intake_private.operations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_intake_private.operations_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE official_v3_intake_private.reservations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_intake_private.reservations_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE official_v3_intake_private.completions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_intake_private.completions_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_intake_private.operations_v1 TO ot_v3_intake_owner USING (true) WITH CHECK (true);
CREATE POLICY owner_only ON official_v3_intake_private.reservations_v1 TO ot_v3_intake_owner USING (true) WITH CHECK (true);
CREATE POLICY owner_only ON official_v3_intake_private.completions_v1 TO ot_v3_intake_owner USING (true) WITH CHECK (true);
REVOKE ALL ON ALL TABLES IN SCHEMA official_v3_intake_private FROM PUBLIC, ot_v3_intake_caller;

CREATE FUNCTION official_v3_intake_private.exact_keys_v1(v jsonb, expected text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
  SELECT jsonb_typeof(v) = 'object' AND
    (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(CASE WHEN jsonb_typeof(v) = 'object' THEN v ELSE '{}'::jsonb END) AS k)
    = (SELECT array_agg(k ORDER BY k) FROM unnest(expected) AS k)
$$;
CREATE FUNCTION official_v3_intake_private.safe_data_v1(v jsonb, depth integer DEFAULT 0) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE item record; element jsonb; n integer := 0;
BEGIN
  IF v IS NULL OR depth > 24 OR octet_length(v::text) > 524288 THEN RETURN false; END IF;
  IF jsonb_typeof(v) = 'object' THEN
    FOR item IN SELECT key, value FROM jsonb_each(v) LOOP
      n := n + 1;
      IF n > 8192 OR replace(lower(item.key), '_', '') = ANY(ARRAY[
        'sessionid','sessionkey','visitorid','ipaddress','passportphoto','documentphoto','photo','image','file',
        'rawtext','rawhtml','screenshot','address','streetaddress','firstname','lastname','fullname','name','email','phone',
        'passportnumber','documentnumber','mrz','userid','accountid','tripid','travellerid','dateofbirth','dob','biometrics',
        'note','notes','comment','freetext'])
        OR NOT official_v3_intake_private.safe_data_v1(item.value, depth + 1) THEN RETURN false; END IF;
    END LOOP;
  ELSIF jsonb_typeof(v) = 'array' THEN
    FOR element IN SELECT value FROM jsonb_array_elements(v) LOOP
      n := n + 1;
      IF n > 8192 OR NOT official_v3_intake_private.safe_data_v1(element, depth + 1) THEN RETURN false; END IF;
    END LOOP;
  END IF;
  RETURN true;
END $$;
CREATE FUNCTION official_v3_intake_private.binding_valid_v1(b jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
  RETURN official_v3_intake_private.exact_keys_v1(b, ARRAY['schema','kind','operationId','jobId','contextKey','method','runnerId','deliveryId','inputRevision'])
    AND b->'schema' = '3'::jsonb AND b->>'kind' = 'proposal_intake_binding'
    AND b->>'operationId' ~ '^op3_[a-f0-9]{32}$' AND b->>'jobId' ~ '^job3_[a-f0-9]{32}$'
    AND b->>'contextKey' ~ '^official-truth-context:v3:[a-f0-9]{64}$'
    AND b->>'runnerId' ~ '^runner3_[a-f0-9]{32}$' AND b->>'deliveryId' ~ '^delivery3_[a-f0-9]{32}$'
    AND b->>'inputRevision' ~ '^(git:[a-f0-9]{40}|snapshot:[a-f0-9]{64})$'
    AND official_v3_intake_private.exact_keys_v1(b->'method', ARRAY['methodId','revision'])
    AND b->'method'->>'methodId' ~ '^[a-z][a-z0-9_-]{1,63}$'
    AND jsonb_typeof(b->'method'->'revision') = 'number'
    AND b->'method'->>'revision' ~ '^[0-9]+$'
    AND (b->'method'->>'revision')::numeric BETWEEN 1 AND 2147483647;
EXCEPTION WHEN numeric_value_out_of_range OR invalid_text_representation THEN RETURN false;
END $$;

-- json (not jsonb) preserves duplicate object members, including escaped keys.
CREATE FUNCTION official_v3_intake_private.unique_json_v1(v json, depth integer DEFAULT 0) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE item record; element json; names text[] := ARRAY[]::text[];
BEGIN
  IF v IS NULL OR depth > 16 OR octet_length(v::text) > 65536 THEN RETURN false; END IF;
  IF json_typeof(v) = 'object' THEN
    FOR item IN SELECT key, value FROM json_each(v) LOOP
      IF item.key = ANY(names) OR cardinality(names) >= 8192 THEN RETURN false; END IF;
      names := array_append(names, item.key);
      IF NOT official_v3_intake_private.unique_json_v1(item.value, depth + 1) THEN RETURN false; END IF;
    END LOOP;
  ELSIF json_typeof(v) = 'array' THEN
    IF json_array_length(v) > 8192 THEN RETURN false; END IF;
    FOR element IN SELECT value FROM json_array_elements(v) LOOP
      IF NOT official_v3_intake_private.unique_json_v1(element, depth + 1) THEN RETURN false; END IF;
    END LOOP;
  END IF;
  RETURN true;
END $$;

-- S1_RETENTION_SHAPE_BEGIN
CREATE FUNCTION official_v3_intake_private.proposal_shape_v1() RETURNS jsonb
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $shape_function$
  SELECT $shape_json${"revision":2,"root":"proposal","countries":["AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","YE","YT","ZA","ZM","ZW"],"definitions":{"predicate1":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"destination_permission"},"destinationCountryCode":{"type":"country"},"permissionClass":{"type":"enum","values":["entry_clearance","permission_to_enter_or_stay","electronic_travel_authorization","visa","residence_permit"]},"validity":{"type":"literal","value":"valid_on_travel_date"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"lawful_residence"},"countryCode":{"type":"country"},"entitlement":{"type":"literal","value":"entitled_to_reside"},"departure":{"type":"enum","values":["unrestricted","unspecified"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"journey_origin"},"place":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"country"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"region"},"regionCode":{"type":"enum","values":["common_travel_area"]}},"optional":[]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"age_on_travel_date"},"comparison":{"type":"enum","values":["at_most","at_least"]},"years":{"type":"integer","minimum":0,"maximum":120}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"travel_purpose"},"purpose":{"type":"enum","values":["visitor","business","study","medical","transit","work","creative_worker","other"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"document_class"},"documentClass":{"type":"enum","values":["ordinary","diplomatic","official","emergency","refugee_travel_document","laissez_passer"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"issuing_country"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"citizenship_includes"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"credential_citizenship_link"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"nationality_status"},"status":{"type":"enum","values":["british_overseas_territory_citizen","british_national_overseas"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"institution_status"},"status":{"type":"enum","values":["french_ministry_of_education_school","confirmed_german_school"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"group_size_at_least"},"count":{"type":"integer","minimum":2,"maximum":50}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"group_membership"},"role":{"type":"literal","value":"traveller_included"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"authority_confirmation"},"subject":{"type":"literal","value":"institution_status"}},"optional":[]}]},"predicate2":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"destination_permission"},"destinationCountryCode":{"type":"country"},"permissionClass":{"type":"enum","values":["entry_clearance","permission_to_enter_or_stay","electronic_travel_authorization","visa","residence_permit"]},"validity":{"type":"literal","value":"valid_on_travel_date"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"lawful_residence"},"countryCode":{"type":"country"},"entitlement":{"type":"literal","value":"entitled_to_reside"},"departure":{"type":"enum","values":["unrestricted","unspecified"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"journey_origin"},"place":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"country"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"region"},"regionCode":{"type":"enum","values":["common_travel_area"]}},"optional":[]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"age_on_travel_date"},"comparison":{"type":"enum","values":["at_most","at_least"]},"years":{"type":"integer","minimum":0,"maximum":120}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"travel_purpose"},"purpose":{"type":"enum","values":["visitor","business","study","medical","transit","work","creative_worker","other"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"document_class"},"documentClass":{"type":"enum","values":["ordinary","diplomatic","official","emergency","refugee_travel_document","laissez_passer"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"issuing_country"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"citizenship_includes"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"credential_citizenship_link"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"nationality_status"},"status":{"type":"enum","values":["british_overseas_territory_citizen","british_national_overseas"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"institution_status"},"status":{"type":"enum","values":["french_ministry_of_education_school","confirmed_german_school"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"group_size_at_least"},"count":{"type":"integer","minimum":2,"maximum":50}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"group_membership"},"role":{"type":"literal","value":"traveller_included"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"authority_confirmation"},"subject":{"type":"literal","value":"institution_status"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"activity_characteristic"},"characteristic":{"type":"enum","values":["remunerative_activity","income_earning_activity","profit_making_business_operation","business_contacts"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"national_passport_for_citizenship"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"planned_stay_duration"},"comparison":{"type":"enum","values":["at_most","more_than"]},"duration":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]},"counting":{"type":"enum","values":["unspecified","calendar_dates_inclusive","calendar_dates_exit_exclusive"]}},"optional":[]}]},"expression1":{"type":"union","choices":[{"type":"object","properties":{"op":{"type":"literal","value":"atomic"},"predicate":{"ref":"predicate1"},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":["supportVersionIds"]},{"type":"object","properties":{"op":{"type":"enum","values":["all","any"]},"operands":{"type":"array","items":{"ref":"expression1"},"minimum":1,"maximum":8,"unique":false}},"optional":[]},{"type":"object","properties":{"op":{"type":"literal","value":"not"},"operand":{"ref":"expression1"}},"optional":[]}]},"expression2":{"type":"union","choices":[{"type":"object","properties":{"op":{"type":"literal","value":"atomic"},"predicate":{"ref":"predicate2"},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":["supportVersionIds"]},{"type":"object","properties":{"op":{"type":"enum","values":["all","any"]},"operands":{"type":"array","items":{"ref":"expression2"},"minimum":1,"maximum":8,"unique":false}},"optional":[]},{"type":"object","properties":{"op":{"type":"literal","value":"not"},"operand":{"ref":"expression2"}},"optional":[]}]},"context":{"type":"union","choices":[{"type":"object","properties":{"scope":{"type":"object","properties":{"destinationCountryCode":{"type":"country"},"transitCountryCode":{"type":"union","choices":[{"type":"null"},{"type":"country"}]},"citizenship":{"type":"object","properties":{"mode":{"type":"literal","value":"required"},"countryCodes":{"type":"array","items":{"type":"country"},"minimum":1,"maximum":1,"unique":false}},"optional":[]},"credentialOption":{"type":"union","choices":[{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]},{"type":"object","properties":{"mode":{"type":"literal","value":"option"},"documentType":{"type":"enum","values":["passport","national_id","unknown"]},"issuingCountryCode":{"type":"country"},"relatedCitizenshipCountryCode":{"type":"union","choices":[{"type":"null"},{"type":"country"}]}},"optional":[]}]},"residence":{"type":"union","choices":[{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]},{"type":"object","properties":{"mode":{"type":"literal","value":"required"},"countryCode":{"type":"country"}},"optional":[]}]},"requirementType":{"type":"enum","values":["visa","electronic_travel_authorization","passport","identity_document","passport_validity","blank_passport_pages","transit","health","vaccination","health_document","entry_form","insurance","onward_or_return_ticket","booking_or_travel_document","financial_means","other_entry_requirement"]},"validity":{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]}},"optional":[]},"route":{"type":"enum","values":["direct_entry","transit","unresolved"]},"conditions":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"unconditional"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"specified"},"expression":{"ref":"expression2"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unresolved"},"missing":{"type":"array","items":{"type":"enum","values":["document_class","travel_purpose","planned_stay_duration","transit","other_rule_conditions"]},"minimum":1,"maximum":5,"unique":true}},"optional":[]}]}},"optional":[]},{"type":"object","properties":{"contextRevision":{"type":"literal","value":2},"scope":{"type":"object","properties":{"destinationCountryCode":{"type":"country"},"transitCountryCode":{"type":"union","choices":[{"type":"null"},{"type":"country"}]},"citizenship":{"type":"object","properties":{"mode":{"type":"literal","value":"required"},"countryCodes":{"type":"array","items":{"type":"country"},"minimum":1,"maximum":1,"unique":false}},"optional":[]},"credentialOption":{"type":"union","choices":[{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]},{"type":"object","properties":{"mode":{"type":"literal","value":"option"},"documentType":{"type":"enum","values":["passport","national_id","unknown"]},"issuingCountryCode":{"type":"country"},"relatedCitizenshipCountryCode":{"type":"union","choices":[{"type":"null"},{"type":"country"}]}},"optional":[]}]},"residence":{"type":"union","choices":[{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]},{"type":"object","properties":{"mode":{"type":"literal","value":"required"},"countryCode":{"type":"country"}},"optional":[]}]},"requirementType":{"type":"enum","values":["visa","electronic_travel_authorization","passport","identity_document","passport_validity","blank_passport_pages","transit","health","vaccination","health_document","entry_form","insurance","onward_or_return_ticket","booking_or_travel_document","financial_means","other_entry_requirement"]},"validity":{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]}},"optional":[]},"route":{"type":"enum","values":["direct_entry","transit","unresolved"]},"conditions":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"unconditional"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"specified"},"expression":{"ref":"expression2"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unresolved"},"missing":{"type":"array","items":{"type":"enum","values":["document_class","travel_purpose","planned_stay_duration","transit","other_rule_conditions"]},"minimum":1,"maximum":5,"unique":true}},"optional":[]}]},"application":{"type":"object","properties":{"purpose":{"type":"literal","value":"tourism"},"tripStartAndEndWindow":{"type":"object","properties":{"from":{"type":"date"},"through":{"type":"date"}},"optional":[]}},"optional":[]}},"optional":[]}]},"research":{"type":"object","properties":{"key":{"type":"string","pattern":"^research-request:v1:[a-f0-9]{64}$","maximum":84},"ruleScopeKey":{"type":"string","pattern":"^rule-scope:v1:[a-f0-9]{64}$","maximum":78},"factKind":{"type":"enum","values":["requirement_effect","visa_options","stay_limit","passport_validity","blank_passport_pages","transit_conditions","official_actions","temporal_rule"]},"researchReason":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"missing"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"recheck_needed"},"reason":{"type":"enum","values":["valid_from_in_future","valid_until_elapsed","max_age_exceeded"]}},"optional":[]}]}},"optional":[]},"fact1":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"requirement_effect"},"effect":{"type":"enum","values":["required","not_required"]},"visaMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel","unknown"]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"requirement_effect"},"schema":{"type":"literal","value":1},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":1},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"effect":{"type":"enum","values":["required","not_required"]},"visaMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel","unknown"]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"requirement_effect"},"schema":{"type":"literal","value":1},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":1},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression1"}},"optional":[]}]},"outcome":{"type":"object","properties":{"effect":{"type":"enum","values":["required","not_required"]},"visaMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel","unknown"]}]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"visa_options"},"options":{"type":"array","items":{"type":"object","properties":{"visaMode":{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel"]},"eligibility":{"type":"enum","values":["allowed","not_allowed","unknown"]},"mandate":{"type":"enum","values":["mandatory","not_mandatory","unknown"]}},"optional":[]},"minimum":1,"maximum":4,"unique":false}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"visa_options"},"schema":{"type":"literal","value":1},"options":{"type":"array","items":{"type":"union","choices":[{"type":"object","properties":{"visaMode":{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel"]},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":1},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"eligibility":{"type":"enum","values":["allowed","not_allowed","unknown"]},"mandate":{"type":"enum","values":["mandatory","not_mandatory","unknown"]}},"optional":[]},{"type":"object","properties":{"visaMode":{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel"]},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":1},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression1"}},"optional":[]}]},"outcome":{"type":"object","properties":{"eligibility":{"type":"enum","values":["allowed","not_allowed"]},"mandate":{"type":"enum","values":["mandatory","not_mandatory","unknown"]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]}]},"minimum":1,"maximum":4,"unique":false}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"stay_limit"},"perVisit":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]}]},"rollingWindow":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"maximum":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]},"within":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]}},"optional":[]}]},"initialGrant":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]}]},"extension":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"requiresApplication":{"type":"boolean"},"maximumTotal":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]}},"optional":[]}]},"borderDiscretion":{"type":"enum","values":["fixed","may_be_shorter","determined_at_border"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"passport_validity"},"semantics":{"type":"enum","values":["valid_on_entry","valid_through_stay"]},"duration":{"type":"null"}},"optional":["duration"]},{"type":"object","properties":{"kind":{"type":"literal","value":"passport_validity"},"semantics":{"type":"enum","values":["minimum_remaining_from_entry","minimum_remaining_from_planned_departure","minimum_remaining_at_application","expired_document_exception"]},"duration":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"blank_passport_pages"},"minimumPages":{"type":"integer","minimum":1,"maximum":10}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"transit_conditions"},"paths":{"type":"array","items":{"type":"object","properties":{"crossesBorderControl":{"type":"union","choices":[{"type":"null"},{"type":"boolean"}]},"leavesTransitArea":{"type":"union","choices":[{"type":"null"},{"type":"boolean"}]},"transitAirportCodes":{"type":"union","choices":[{"type":"null"},{"type":"array","items":{"type":"string","pattern":"^[A-Z]{3}$","maximum":3},"minimum":1,"maximum":8192,"unique":false}]},"maxTransitDurationMinutes":{"type":"union","choices":[{"type":"null"},{"type":"integer","minimum":1,"maximum":20160}]},"arrivalMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["air","land","sea"]}]},"departureMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["air","land","sea"]}]},"thirdCountryRequired":{"type":"union","choices":[{"type":"null"},{"type":"boolean"}]},"sameFlightRequired":{"type":"union","choices":[{"type":"null"},{"type":"boolean"}]},"onwardTicketRequired":{"type":"union","choices":[{"type":"null"},{"type":"boolean"}]}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"temporal_rule"},"rule":{"type":"object","properties":{"kind":{"type":"literal","value":"relative_duration"},"availableFrom":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"at"},"offsetMinutes":{"type":"literal","value":0}},"optional":[]},{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"before"},"offsetMinutes":{"type":"integer","minimum":1,"maximum":1051200}},"optional":[]},{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"after"},"offsetMinutes":{"type":"integer","minimum":1,"maximum":1051200}},"optional":[]}]}]},"dueBy":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"at"},"offsetMinutes":{"type":"literal","value":0},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]},{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"before"},"offsetMinutes":{"type":"integer","minimum":1,"maximum":1051200},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]},{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"after"},"offsetMinutes":{"type":"integer","minimum":1,"maximum":1051200},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]}]}]}},"optional":["availableFrom","dueBy"]}},"optional":[]}]},"fact2":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"requirement_effect"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"effect":{"type":"enum","values":["required","not_required"]},"visaMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel","unknown"]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"requirement_effect"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression2"}},"optional":[]}]},"outcome":{"type":"object","properties":{"effect":{"type":"enum","values":["required","not_required"]},"visaMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel","unknown"]}]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"visa_options"},"schema":{"type":"literal","value":2},"options":{"type":"array","items":{"type":"union","choices":[{"type":"object","properties":{"visaMode":{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel"]},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"eligibility":{"type":"enum","values":["allowed","not_allowed","unknown"]},"mandate":{"type":"enum","values":["mandatory","not_mandatory","unknown"]}},"optional":[]},{"type":"object","properties":{"visaMode":{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel"]},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression2"}},"optional":[]}]},"outcome":{"type":"object","properties":{"eligibility":{"type":"enum","values":["allowed","not_allowed"]},"mandate":{"type":"enum","values":["mandatory","not_mandatory","unknown"]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]}]},"minimum":1,"maximum":4,"unique":false}},"optional":[]},{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"stay_limit"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"outcome":{"type":"object","properties":{"perVisit":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]}]},"initialGrant":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"quantity":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]},"event":{"type":"literal","value":"permission_to_enter_granted"}},"optional":[]}]},"extension":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"requiresApplication":{"type":"boolean"},"maximumTotal":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]},"applicationDeadline":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"event_deadline"},"action":{"type":"literal","value":"stay_extension_application"},"reference":{"type":"object","properties":{"event":{"type":"literal","value":"current_stay_permission_expiry"},"countryCode":{"type":"country"}},"optional":[]},"relation":{"type":"literal","value":"before"},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]}]},"authority":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"countryCode":{"type":"country"},"role":{"type":"literal","value":"immigration_authority"}},"optional":[]}]}},"optional":[]}]},"borderDiscretion":{"type":"enum","values":["fixed","may_be_shorter","determined_at_border"]}},"optional":[]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"stay_limit"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression2"}},"optional":[]}]},"outcome":{"type":"object","properties":{"perVisit":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]}]},"initialGrant":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"quantity":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]},"event":{"type":"literal","value":"permission_to_enter_granted"}},"optional":[]}]},"extension":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"requiresApplication":{"type":"boolean"},"maximumTotal":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]},"applicationDeadline":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"event_deadline"},"action":{"type":"literal","value":"stay_extension_application"},"reference":{"type":"object","properties":{"event":{"type":"literal","value":"current_stay_permission_expiry"},"countryCode":{"type":"country"}},"optional":[]},"relation":{"type":"literal","value":"before"},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]}]},"authority":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"countryCode":{"type":"country"},"role":{"type":"literal","value":"immigration_authority"}},"optional":[]}]}},"optional":[]}]},"borderDiscretion":{"type":"enum","values":["fixed","may_be_shorter","determined_at_border"]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]}]},{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"temporal_rule"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"outcome":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"event_deadline"},"action":{"type":"literal","value":"stay_extension_application"},"reference":{"type":"object","properties":{"event":{"type":"literal","value":"current_stay_permission_expiry"},"countryCode":{"type":"country"}},"optional":[]},"relation":{"type":"literal","value":"before"},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"temporal_rule"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression2"}},"optional":[]}]},"outcome":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"event_deadline"},"action":{"type":"literal","value":"stay_extension_application"},"reference":{"type":"object","properties":{"event":{"type":"literal","value":"current_stay_permission_expiry"},"countryCode":{"type":"country"}},"optional":[]},"relation":{"type":"literal","value":"before"},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]}]}]},"validity":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"unresolved"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"specified"},"validFrom":{"type":"union","choices":[{"type":"null"},{"type":"date"}]},"validUntil":{"type":"union","choices":[{"type":"null"},{"type":"date"}]}},"optional":[]}]},"proposal":{"type":"object","properties":{"schema":{"type":"literal","value":3},"kind":{"type":"literal","value":"untrusted_research_proposal"},"jobId":{"type":"string","pattern":"^job3_[a-f0-9]{32}$","maximum":37},"operationId":{"type":"string","pattern":"^op3_[a-f0-9]{32}$","maximum":36},"context":{"ref":"context"},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"research":{"ref":"research"},"proposedFact":{"type":"union","choices":[{"type":"object","properties":{"schema":{"type":"literal","value":1},"fact":{"ref":"fact1"}},"optional":[]},{"type":"object","properties":{"schema":{"type":"literal","value":2},"fact":{"ref":"fact2"}},"optional":[]}]},"references":{"type":"array","items":{"type":"object","properties":{"source":{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64}},"optional":[]},"claimedRetrievedAt":{"type":"union","choices":[{"type":"null"},{"type":"timestamp"}]},"claimedValidity":{"ref":"validity"}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]},"evidence":{"type":"object","properties":{"versionId":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"lookupKey":{"type":"string","pattern":"^evidence-key:v3:[a-f0-9]{64}$","maximum":80},"source":{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemVersion":{"type":"integer","minimum":1,"maximum":2147483647},"representationVersion":{"type":"integer","minimum":1,"maximum":2147483647},"identityProfileId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"identityProfileVersion":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"sourceFingerprintProtocol":{"type":"union","choices":[{"type":"literal","value":1},{"type":"literal","value":2}]},"sourceContentHash":{"type":"string","pattern":"^[a-f0-9]{64}$","maximum":64},"retrievedAt":{"type":"timestamp"},"legalValidity":{"ref":"validity"}},"optional":[]},"observation":{"type":"object","properties":{"context":{"ref":"context"},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"fact":{"type":"union","choices":[{"type":"object","properties":{"schema":{"type":"literal","value":1},"fact":{"ref":"fact1"}},"optional":[]},{"type":"object","properties":{"schema":{"type":"literal","value":2},"fact":{"ref":"fact2"}},"optional":[]}]},"evidence":{"ref":"evidence"}},"optional":[]},"conflict":{"type":"object","properties":{"reference":{"type":"string","pattern":"^source-conflict:v3:[a-f0-9]{64}$","maximum":83},"detectedDecisionRef":{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83},"detectedAt":{"type":"timestamp"},"primary":{"ref":"observation"},"counter":{"ref":"observation"},"resolution":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"reference":{"type":"string","pattern":"^conflict-resolution:v3:[a-f0-9]{64}$","maximum":87},"predecessor":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^conflict-resolution:v3:[a-f0-9]{64}$","maximum":87}]},"conflictRef":{"type":"string","pattern":"^source-conflict:v3:[a-f0-9]{64}$","maximum":83},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"resolvedAt":{"type":"timestamp"},"legalAsOfDate":{"type":"date"},"basis":{"type":"enum","values":["corrected_publication","context_distinguished","legal_validity_changed"]},"observations":{"type":"array","items":{"ref":"observation"},"minimum":1,"maximum":2,"unique":false}},"optional":[]}]}},"optional":[]},"archive":{"type":"object","properties":{"schema":{"type":"literal","value":3},"kind":{"type":"literal","value":"resolved_conflict_archive_record"},"head":{"type":"object","properties":{"reference":{"type":"string","pattern":"^conflict-archive:v3:[a-f0-9]{64}$","maximum":84},"revision":{"type":"integer","minimum":1,"maximum":2147483647},"totalConflicts":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"predecessor":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"reference":{"type":"string","pattern":"^conflict-archive:v3:[a-f0-9]{64}$","maximum":84},"revision":{"type":"integer","minimum":1,"maximum":2147483647},"totalConflicts":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]}]},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"factKind":{"type":"enum","values":["requirement_effect","visa_options","stay_limit","passport_validity","blank_passport_pages","transit_conditions","temporal_rule"]},"fromDecisionRef":{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83},"archivedAt":{"type":"timestamp"},"entries":{"type":"array","items":{"ref":"conflict"},"minimum":1,"maximum":8,"unique":false}},"optional":[]},"decision":{"type":"object","properties":{"schema":{"type":"literal","value":3},"kind":{"type":"literal","value":"source_decision_record"},"reference":{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83},"predecessor":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83}]},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"context":{"ref":"context"},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"factKind":{"type":"enum","values":["requirement_effect","visa_options","stay_limit","passport_validity","blank_passport_pages","transit_conditions","temporal_rule"]},"evaluatedAt":{"type":"timestamp"},"legalAsOfDate":{"type":"date"},"primary":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"clear"},"observation":{"ref":"observation"},"qualification":{"type":"object","properties":{"reference":{"type":"string","pattern":"^destination-qualification:v3:[a-f0-9]{64}$","maximum":93},"representedCountryCode":{"type":"country"},"role":{"type":"enum","values":["destination_authority","destination_border_police","destination_embassy"]},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"evidenceVersionId":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"checkedAt":{"type":"timestamp"}},"optional":[]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unclear"},"reason":{"type":"enum","values":["missing","ambiguous_statement","unqualified_destination_authority","invalid_or_unknown_validity"]},"evidence":{"type":"union","choices":[{"type":"null"},{"ref":"evidence"}]}},"optional":[]}]},"counterCheck":{"type":"object","properties":{"attemptPlanRevision":{"type":"integer","minimum":1,"maximum":2147483647},"attempts":{"type":"array","items":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"not_found"},"attemptedAt":{"type":"timestamp"},"source":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64}},"optional":[]}]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unreachable"},"attemptedAt":{"type":"timestamp"},"source":{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64}},"optional":[]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unclear"},"attemptedAt":{"type":"timestamp"},"source":{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64}},"optional":[]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"not_applicable"},"attemptedAt":{"type":"timestamp"},"source":{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64}},"optional":[]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"agrees"},"attemptedAt":{"type":"timestamp"},"comparisonRef":{"type":"string","pattern":"^source-comparison:v3:[a-f0-9]{64}$","maximum":85},"observation":{"ref":"observation"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"compatible"},"attemptedAt":{"type":"timestamp"},"comparisonRef":{"type":"string","pattern":"^source-comparison:v3:[a-f0-9]{64}$","maximum":85},"observation":{"ref":"observation"},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"reproof":{"type":"literal","value":"required_before_acceptance"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"conflicts"},"attemptedAt":{"type":"timestamp"},"comparisonRef":{"type":"string","pattern":"^source-comparison:v3:[a-f0-9]{64}$","maximum":85},"observation":{"ref":"observation"},"conflictRef":{"type":"string","pattern":"^source-conflict:v3:[a-f0-9]{64}$","maximum":83}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"not_comparable"},"attemptedAt":{"type":"timestamp"},"comparisonRef":{"type":"string","pattern":"^source-comparison:v3:[a-f0-9]{64}$","maximum":85},"observation":{"ref":"observation"}},"optional":[]}]},"minimum":1,"maximum":8,"unique":false}},"optional":[]},"knownConflicts":{"type":"array","items":{"ref":"conflict"},"minimum":0,"maximum":8,"unique":false},"historyArchive":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"reference":{"type":"string","pattern":"^conflict-archive:v3:[a-f0-9]{64}$","maximum":84},"revision":{"type":"integer","minimum":1,"maximum":2147483647},"totalConflicts":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]}]},"conclusion":{"type":"enum","values":["clear_primary","primary_unclear","conditions_unresolved","comparable_conflict"]}},"optional":[]},"version":{"type":"object","properties":{"schema":{"type":"literal","value":3},"kind":{"type":"literal","value":"rule_version_record"},"reference":{"type":"string","pattern":"^rule-version:v3:[a-f0-9]{64}$","maximum":80},"revision":{"type":"integer","minimum":1,"maximum":2147483647},"predecessor":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^rule-version:v3:[a-f0-9]{64}$","maximum":80}]},"state":{"type":"literal","value":"accepted"},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"subject":{"ref":"observation"},"sourceDecisionRef":{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83},"operationId":{"type":"string","pattern":"^op3_[a-f0-9]{32}$","maximum":36},"recordedAt":{"type":"timestamp"}},"optional":[]},"transition":{"type":"object","properties":{"schema":{"type":"literal","value":3},"protocolRevision":{"type":"literal","value":1},"operationId":{"type":"string","pattern":"^op3_[a-f0-9]{32}$","maximum":36},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"factKind":{"type":"enum","values":["requirement_effect","visa_options","stay_limit","passport_validity","blank_passport_pages","transit_conditions","temporal_rule"]},"action":{"type":"enum","values":["accept","reaccept"]},"expected":{"type":"object","properties":{"revision":{"type":"integer","minimum":0,"maximum":2147483646},"state":{"type":"enum","values":["missing","accepted","withdrawn","conflicted"]},"versionRef":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^rule-version:v3:[a-f0-9]{64}$","maximum":80}]}},"optional":[]},"next":{"type":"object","properties":{"revision":{"type":"integer","minimum":1,"maximum":2147483647},"state":{"type":"literal","value":"accepted"},"versionRef":{"type":"string","pattern":"^rule-version:v3:[a-f0-9]{64}$","maximum":80}},"optional":[]},"primaryEvidenceVersionId":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"sourceDecisionRef":{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83},"resolutionRefs":{"type":"array","items":{"type":"string","pattern":"^conflict-resolution:v3:[a-f0-9]{64}$","maximum":87},"minimum":0,"maximum":8,"unique":true},"recoverFromVersionRef":{"type":"null"},"invalidatedProjectionRefs":{"type":"array","items":{"type":"string","pattern":"^rule-projection:v3:[a-f0-9]{64}$","maximum":83},"minimum":0,"maximum":64,"unique":true},"reproof":{"type":"literal","value":"required_before_commit"},"commitConfirmation":{"type":"literal","value":"required"}},"optional":[]},"outcome":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"prepared"},"value":{"type":"object","properties":{"proposalDigest":{"type":"string","pattern":"^[a-f0-9]{64}$","maximum":64},"decision":{"ref":"decision"},"previousDecision":{"type":"union","choices":[{"type":"null"},{"ref":"decision"}]},"archiveAppend":{"type":"union","choices":[{"type":"null"},{"ref":"archive"}]},"version":{"ref":"version"},"transition":{"ref":"transition"},"proposalDisposition":{"type":"enum","values":["matched","superseded_by_source"]},"acceptance":{"type":"literal","value":"not_committed"},"reproof":{"type":"literal","value":"required_before_commit"}},"optional":[]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"escalation"},"key":{"type":"string","pattern":"^source-escalation:v3:[a-f0-9]{64}$","maximum":85},"reason":{"type":"enum","values":["primary_unclear","comparable_conflict"]},"decision":{"ref":"decision"},"previousDecision":{"type":"union","choices":[{"type":"null"},{"ref":"decision"}]},"archiveAppend":{"type":"union","choices":[{"type":"null"},{"ref":"archive"}]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"quarantined"},"reason":{"type":"enum","values":["conditions_unresolved","invalid_verification","history_changed","method_not_current"]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unavailable"},"reason":{"type":"enum","values":["method_not_approved","method_unavailable","verification_unavailable","history_unavailable","aborted","temporary_failure"]}},"optional":[]}]},"audit":{"type":"object","properties":{"schema":{"type":"literal","value":3},"kind":{"type":"literal","value":"import_attempt_record"},"operationId":{"type":"string","pattern":"^op3_[a-f0-9]{32}$","maximum":36},"proposalDigest":{"type":"string","pattern":"^[a-f0-9]{64}$","maximum":64},"jobId":{"type":"string","pattern":"^job3_[a-f0-9]{32}$","maximum":37},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"recordedAt":{"type":"timestamp"},"result":{"type":"enum","values":["prepared","escalation","quarantined","unavailable"]},"decisionRef":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83}]},"escalationKey":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^source-escalation:v3:[a-f0-9]{64}$","maximum":85}]}},"optional":[]}}}$shape_json$::jsonb
$shape_function$;
-- S1_RETENTION_SHAPE_END

CREATE FUNCTION official_v3_intake_private.data_nodes_v1(v jsonb, depth integer DEFAULT 0, max_depth integer DEFAULT 16, max_nodes integer DEFAULT 8192) RETURNS integer
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE child jsonb; n integer := 1; next_n integer;
BEGIN
  IF v IS NULL OR depth > max_depth THEN RETURN -1; END IF;
  IF jsonb_typeof(v) = 'object' THEN
    FOR child IN SELECT value FROM jsonb_each(v) LOOP
      next_n := official_v3_intake_private.data_nodes_v1(child,depth+1,max_depth,max_nodes);
      IF next_n < 0 THEN RETURN -1; END IF;
      n := n + 1 + next_n;
      IF n > max_nodes THEN RETURN -1; END IF;
    END LOOP;
  ELSIF jsonb_typeof(v) = 'array' THEN
    FOR child IN SELECT value FROM jsonb_array_elements(v) LOOP
      next_n := official_v3_intake_private.data_nodes_v1(child,depth+1,max_depth,max_nodes);
      IF next_n < 0 THEN RETURN -1; END IF;
      n := n + next_n;
      IF n > max_nodes THEN RETURN -1; END IF;
    END LOOP;
  END IF;
  RETURN n;
END $$;

-- Fixed finite reader. Only private functions can supply a shape. There is no
-- dynamic SQL, registry copy, URL whitelist shortcut or acceptance authority.
CREATE FUNCTION official_v3_intake_private.shape_matches_v1(v jsonb, s jsonb, defs jsonb, countries jsonb, depth integer DEFAULT 0) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE item record; child jsonb; scalar text; normalized text; typ text; count_n integer;
BEGIN
  IF v IS NULL OR s IS NULL OR depth > 24 THEN RETURN false; END IF;
  IF s ? 'ref' THEN
    RETURN official_v3_intake_private.shape_matches_v1(v, defs->(s->>'ref'), defs, countries, depth);
  END IF;
  typ := s->>'type';
  IF typ = 'literal' THEN RETURN v = s->'value'; END IF;
  IF typ = 'null' THEN RETURN v = 'null'::jsonb; END IF;
  IF typ = 'boolean' THEN RETURN jsonb_typeof(v) = 'boolean'; END IF;
  IF typ = 'integer' THEN
    IF jsonb_typeof(v) <> 'number' THEN RETURN false; END IF;
    RETURN (v::text)::numeric = trunc((v::text)::numeric) AND (v::text)::numeric BETWEEN (s->>'minimum')::numeric AND (s->>'maximum')::numeric;
  END IF;
  IF typ IN ('string','enum','country','date','timestamp') THEN
    IF jsonb_typeof(v) <> 'string' THEN RETURN false; END IF;
    scalar := v #>> '{}';
    IF typ = 'enum' THEN RETURN (s->'values') @> jsonb_build_array(scalar); END IF;
    IF typ = 'string' THEN RETURN length(scalar) <= (s->>'maximum')::integer AND scalar ~ (s->>'pattern'); END IF;
    IF typ = 'country' THEN
      -- Same bounded ECMA whitespace trim/uppercase as the existing country reader.
      normalized := upper(btrim(scalar, chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||chr(5760)||chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279)));
      RETURN length(scalar) <= 8 AND countries @> jsonb_build_array(normalized);
    END IF;
    IF typ = 'date' THEN
      IF scalar !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN RETURN false; END IF;
      RETURN to_char(scalar::date,'YYYY-MM-DD') = scalar;
    END IF;
    IF scalar !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$' THEN RETURN false; END IF;
    RETURN to_char(scalar::timestamptz AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') = scalar;
  END IF;
  IF typ = 'union' THEN
    FOR child IN SELECT value FROM jsonb_array_elements(s->'choices') LOOP
      IF official_v3_intake_private.shape_matches_v1(v,child,defs,countries,depth) IS TRUE THEN RETURN true; END IF;
    END LOOP;
    RETURN false;
  END IF;
  IF typ = 'array' THEN
    IF jsonb_typeof(v) <> 'array' THEN RETURN false; END IF;
    count_n := jsonb_array_length(v);
    IF count_n NOT BETWEEN (s->>'minimum')::integer AND (s->>'maximum')::integer THEN RETURN false; END IF;
    IF s->'unique' = 'true'::jsonb AND (SELECT count(DISTINCT value) FROM jsonb_array_elements(v)) <> count_n THEN RETURN false; END IF;
    FOR child IN SELECT value FROM jsonb_array_elements(v) LOOP
      IF official_v3_intake_private.shape_matches_v1(child,s->'items',defs,countries,depth+1) IS NOT TRUE THEN RETURN false; END IF;
    END LOOP;
    RETURN true;
  END IF;
  IF typ = 'object' THEN
    IF jsonb_typeof(v) <> 'object' THEN RETURN false; END IF;
    IF EXISTS (SELECT 1 FROM jsonb_object_keys(v) k WHERE NOT (s->'properties' ? k)) THEN RETURN false; END IF;
    FOR item IN SELECT key,value FROM jsonb_each(s->'properties') LOOP
      IF NOT (v ? item.key) THEN
        IF NOT (s->'optional' ? item.key) THEN RETURN false; END IF;
      ELSIF official_v3_intake_private.shape_matches_v1(v->item.key,item.value,defs,countries,depth+1) IS NOT TRUE THEN RETURN false;
      END IF;
    END LOOP;
    RETURN true;
  END IF;
  RETURN false;
EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow OR invalid_text_representation OR numeric_value_out_of_range THEN RETURN false;
END $$;

CREATE FUNCTION official_v3_intake_private.proposal_retainable_v1(v jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE shape jsonb := official_v3_intake_private.proposal_shape_v1();
BEGIN
  IF official_v3_intake_private.data_nodes_v1(v) < 0 THEN RETURN false; END IF;
  RETURN official_v3_intake_private.shape_matches_v1(v,shape->'definitions'->(shape->>'root'),shape->'definitions',shape->'countries');
END $$;

CREATE FUNCTION official_v3_intake_private.immutable_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
  IF TG_TABLE_NAME <> 'operations_v1' OR TG_OP <> 'UPDATE' THEN
    RAISE EXCEPTION USING ERRCODE = 'P7301', MESSAGE = 'intake_immutable';
  END IF;
  IF NEW.operation_id IS DISTINCT FROM OLD.operation_id OR NEW.binding IS DISTINCT FROM OLD.binding
    OR NEW.original_bytes IS DISTINCT FROM OLD.original_bytes OR NEW.proposal_digest IS DISTINCT FROM OLD.proposal_digest
    OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.generation <> OLD.generation + 1
    OR NEW.acquired_at < OLD.expires_at OR NEW.lease_token = OLD.lease_token
    OR EXISTS (SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id = OLD.operation_id) THEN
    RAISE EXCEPTION USING ERRCODE = 'P7301', MESSAGE = 'intake_immutable';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_intake_private.operations_v1
FOR EACH ROW EXECUTE FUNCTION official_v3_intake_private.immutable_v1();
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_intake_private.reservations_v1
FOR EACH ROW EXECUTE FUNCTION official_v3_intake_private.immutable_v1();
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_intake_private.completions_v1
FOR EACH ROW EXECUTE FUNCTION official_v3_intake_private.immutable_v1();

CREATE FUNCTION official_v3_intake_private.record_v1(p_operation text) RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = pg_catalog AS $$
  SELECT jsonb_build_object('reference', jsonb_build_object('binding', o.binding, 'proposalDigest', o.proposal_digest, 'bytes', octet_length(o.original_bytes)),
    'text', convert_from(o.original_bytes, 'UTF8'), 'outcome', c.outcome, 'audit', c.audit)
  FROM official_v3_intake_private.operations_v1 o
  LEFT JOIN official_v3_intake_private.completions_v1 c USING (operation_id)
  WHERE o.operation_id = p_operation
$$;

CREATE FUNCTION official_v3_intake_api.capture_v1(p_binding jsonb, p_original text, p_digest text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE proposal jsonb; original bytea; held official_v3_intake_private.operations_v1%ROWTYPE;
BEGIN
  IF official_v3_intake_private.binding_valid_v1(p_binding) IS NOT TRUE OR p_original IS NULL
    OR octet_length(p_original) NOT BETWEEN 1 AND 65536 OR p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$' THEN
    RETURN jsonb_build_object('status','invalid');
  END IF;
  original := convert_to(p_original, 'UTF8');
  IF encode(sha256(original),'hex') <> p_digest THEN RETURN jsonb_build_object('status','invalid'); END IF;
  BEGIN
    IF official_v3_intake_private.unique_json_v1(p_original::json) IS NOT TRUE THEN RETURN jsonb_build_object('status','invalid'); END IF;
    proposal := p_original::jsonb;
  EXCEPTION WHEN invalid_text_representation OR untranslatable_character OR numeric_value_out_of_range THEN RETURN jsonb_build_object('status','invalid'); END;
  IF official_v3_intake_private.exact_keys_v1(proposal, ARRAY['schema','kind','jobId','operationId','context','contextKey','research','proposedFact','references']) IS NOT TRUE
    OR official_v3_intake_private.proposal_retainable_v1(proposal) IS NOT TRUE
    OR official_v3_intake_private.safe_data_v1(proposal) IS NOT TRUE OR proposal->'schema' IS DISTINCT FROM '3'::jsonb
    OR proposal->>'kind' IS DISTINCT FROM 'untrusted_research_proposal'
    OR proposal->>'operationId' IS DISTINCT FROM p_binding->>'operationId'
    OR proposal->>'jobId' IS DISTINCT FROM p_binding->>'jobId' OR proposal->>'contextKey' IS DISTINCT FROM p_binding->>'contextKey' THEN
    RETURN jsonb_build_object('status','invalid');
  END IF;
  INSERT INTO official_v3_intake_private.operations_v1(operation_id,binding,original_bytes,proposal_digest)
    VALUES(p_binding->>'operationId',p_binding,original,p_digest) ON CONFLICT(operation_id) DO NOTHING;
  SELECT * INTO held FROM official_v3_intake_private.operations_v1 WHERE operation_id = p_binding->>'operationId' FOR UPDATE;
  IF held.binding <> p_binding OR held.original_bytes <> original OR held.proposal_digest <> p_digest THEN
    RETURN jsonb_build_object('status','collision');
  END IF;
  RETURN jsonb_build_object('status','recorded','record',official_v3_intake_private.record_v1(held.operation_id));
END $$;

CREATE FUNCTION official_v3_intake_api.read_v1(p_binding jsonb, p_digest text, p_bytes integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE held official_v3_intake_private.operations_v1%ROWTYPE;
BEGIN
  IF official_v3_intake_private.binding_valid_v1(p_binding) IS NOT TRUE OR p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$'
    OR p_bytes IS NULL OR p_bytes NOT BETWEEN 1 AND 65536 THEN RETURN jsonb_build_object('status','invalid'); END IF;
  SELECT * INTO held FROM official_v3_intake_private.operations_v1 WHERE operation_id = p_binding->>'operationId' FOR SHARE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','not_attempted'); END IF;
  IF held.binding <> p_binding OR held.proposal_digest <> p_digest OR octet_length(held.original_bytes) <> p_bytes THEN
    RETURN jsonb_build_object('status','collision');
  END IF;
  RETURN jsonb_build_object('status','recorded','record',official_v3_intake_private.record_v1(held.operation_id));
END $$;

CREATE FUNCTION official_v3_intake_api.reserve_v1(p_binding jsonb, p_digest text, p_bytes integer, p_lease_ms integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE held official_v3_intake_private.operations_v1%ROWTYPE; acquired timestamptz; expires timestamptz; ticket uuid;
BEGIN
  IF official_v3_intake_private.binding_valid_v1(p_binding) IS NOT TRUE OR p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$'
    OR p_bytes IS NULL OR p_bytes NOT BETWEEN 1 AND 65536 OR p_lease_ms IS NULL OR p_lease_ms NOT BETWEEN 1 AND 900000 THEN
    RETURN jsonb_build_object('status','invalid');
  END IF;
  SELECT * INTO held FROM official_v3_intake_private.operations_v1 WHERE operation_id = p_binding->>'operationId' FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','not_attempted'); END IF;
  IF held.binding <> p_binding OR held.proposal_digest <> p_digest OR octet_length(held.original_bytes) <> p_bytes THEN
    RETURN jsonb_build_object('status','collision');
  END IF;
  IF EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id = held.operation_id) THEN
    RETURN jsonb_build_object('status','completed','record',official_v3_intake_private.record_v1(held.operation_id));
  END IF;
  acquired := clock_timestamp();
  IF held.expires_at > acquired THEN RETURN jsonb_build_object('status','busy'); END IF;
  IF held.generation >= 2147483646 THEN RETURN jsonb_build_object('status','unavailable'); END IF;
  expires := acquired + p_lease_ms * interval '1 millisecond'; ticket := gen_random_uuid();
  UPDATE official_v3_intake_private.operations_v1 SET generation = held.generation + 1,
    lease_token = ticket, acquired_at = acquired, expires_at = expires WHERE operation_id = held.operation_id;
  INSERT INTO official_v3_intake_private.reservations_v1 VALUES(held.operation_id, held.generation + 1, ticket, acquired, expires);
  IF clock_timestamp() >= expires THEN RAISE EXCEPTION USING ERRCODE = 'P7302', MESSAGE = 'intake_lease_elapsed'; END IF;
  RETURN jsonb_build_object('status','acquired', 'generation', held.generation + 1, 'leaseToken', ticket::text,
    'acquiredAt', to_char(acquired AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'expiresAt', to_char(expires AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'record',official_v3_intake_private.record_v1(held.operation_id));
END $$;

CREATE FUNCTION official_v3_intake_api.finish_v1(p_binding jsonb, p_digest text, p_bytes integer,
  p_generation integer, p_token uuid, p_outcome jsonb, p_audit jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE held official_v3_intake_private.operations_v1%ROWTYPE; finished official_v3_intake_private.completions_v1%ROWTYPE;
  decision jsonb; expected_key text; now_at timestamptz; shape jsonb := official_v3_intake_private.proposal_shape_v1();
BEGIN
  IF official_v3_intake_private.binding_valid_v1(p_binding) IS NOT TRUE OR p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$'
    OR p_bytes IS NULL OR p_bytes NOT BETWEEN 1 AND 65536 OR p_generation IS NULL OR p_generation NOT BETWEEN 1 AND 2147483646
    OR p_token IS NULL OR p_outcome IS NULL OR p_audit IS NULL OR octet_length(p_outcome::text) > 524288 OR octet_length(p_audit::text) > 8192
    OR official_v3_intake_private.safe_data_v1(p_outcome) IS NOT TRUE OR official_v3_intake_private.safe_data_v1(p_audit) IS NOT TRUE THEN
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  IF official_v3_intake_private.data_nodes_v1(p_outcome,0,24,65536) < 0
    OR official_v3_intake_private.data_nodes_v1(p_audit) < 0
    OR official_v3_intake_private.shape_matches_v1(p_outcome,shape->'definitions'->'outcome',shape->'definitions',shape->'countries') IS NOT TRUE
    OR official_v3_intake_private.shape_matches_v1(p_audit,shape->'definitions'->'audit',shape->'definitions',shape->'countries') IS NOT TRUE THEN
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  IF official_v3_intake_private.exact_keys_v1(p_audit, ARRAY['schema','kind','operationId','proposalDigest','jobId','contextKey','method','recordedAt','result','decisionRef','escalationKey']) IS NOT TRUE
    OR p_audit->'schema' IS DISTINCT FROM '3'::jsonb OR p_audit->>'kind' IS DISTINCT FROM 'import_attempt_record'
    OR p_audit->>'operationId' IS DISTINCT FROM p_binding->>'operationId' OR p_audit->>'jobId' IS DISTINCT FROM p_binding->>'jobId'
    OR p_audit->>'contextKey' IS DISTINCT FROM p_binding->>'contextKey' OR p_audit->'method' IS DISTINCT FROM p_binding->'method'
    OR p_audit->>'proposalDigest' IS DISTINCT FROM p_digest OR p_audit->>'result' IS DISTINCT FROM p_outcome->>'status'
    OR (p_audit->>'recordedAt' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$') IS NOT TRUE THEN
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  IF p_outcome->>'status' = 'prepared' THEN
    IF official_v3_intake_private.exact_keys_v1(p_outcome, ARRAY['status','value']) IS NOT TRUE
      OR official_v3_intake_private.exact_keys_v1(p_outcome->'value', ARRAY['proposalDigest','decision','previousDecision','archiveAppend','version','transition','proposalDisposition','acceptance','reproof']) IS NOT TRUE
      OR p_outcome->'value'->>'proposalDigest' IS DISTINCT FROM p_digest
      OR (p_outcome->'value'->>'proposalDisposition' IN ('matched','superseded_by_source')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'value'->'previousDecision') IN ('null','object')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'value'->'archiveAppend') IN ('null','object')) IS NOT TRUE
      OR jsonb_typeof(p_outcome->'value'->'version') IS DISTINCT FROM 'object'
      OR jsonb_typeof(p_outcome->'value'->'transition') IS DISTINCT FROM 'object'
      OR p_outcome->'value'->>'acceptance' IS DISTINCT FROM 'not_committed'
      OR p_outcome->'value'->>'reproof' IS DISTINCT FROM 'required_before_commit' THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
    decision := p_outcome->'value'->'decision';
  ELSIF p_outcome->>'status' = 'escalation' THEN
    IF official_v3_intake_private.exact_keys_v1(p_outcome, ARRAY['status','key','reason','decision','previousDecision','archiveAppend']) IS NOT TRUE
      OR (p_outcome->>'key' ~ '^source-escalation:v3:[a-f0-9]{64}$') IS NOT TRUE
      OR (p_outcome->>'reason' IN ('primary_unclear','comparable_conflict')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'previousDecision') IN ('null','object')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'archiveAppend') IN ('null','object')) IS NOT TRUE THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
    decision := p_outcome->'decision'; expected_key := p_outcome->>'key';
  ELSIF p_outcome->>'status' IN ('quarantined','unavailable') THEN
    IF official_v3_intake_private.exact_keys_v1(p_outcome, ARRAY['status','reason']) IS NOT TRUE
      OR (p_outcome->>'status' = 'quarantined' AND (p_outcome->>'reason' IN ('conditions_unresolved','invalid_verification','history_changed','method_not_current')) IS NOT TRUE)
      OR (p_outcome->>'status' = 'unavailable' AND (p_outcome->>'reason' IN ('method_not_approved','method_unavailable','verification_unavailable','history_unavailable','aborted','temporary_failure')) IS NOT TRUE) THEN
      RETURN jsonb_build_object('status','unconfirmed'); END IF;
  ELSE RETURN jsonb_build_object('status','unconfirmed'); END IF;
  IF p_audit->>'decisionRef' IS DISTINCT FROM decision->>'reference' OR p_audit->>'escalationKey' IS DISTINCT FROM expected_key
    OR (p_outcome->>'status' IN ('prepared','escalation') AND (
      jsonb_typeof(decision) IS DISTINCT FROM 'object'
      OR (decision->>'reference' ~ '^source-decision:v3:[a-f0-9]{64}$') IS NOT TRUE
      OR decision->>'contextKey' IS DISTINCT FROM p_binding->>'contextKey' OR decision->'method' IS DISTINCT FROM p_binding->'method')) THEN
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  SELECT * INTO held FROM official_v3_intake_private.operations_v1 WHERE operation_id = p_binding->>'operationId' FOR UPDATE;
  IF NOT FOUND OR held.binding <> p_binding OR held.proposal_digest <> p_digest OR octet_length(held.original_bytes) <> p_bytes THEN
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  SELECT * INTO finished FROM official_v3_intake_private.completions_v1 WHERE operation_id = held.operation_id;
  IF FOUND THEN
    IF finished.generation = p_generation AND finished.lease_token = p_token AND finished.outcome = p_outcome AND finished.audit = p_audit THEN
      RETURN jsonb_build_object('status','recorded');
    END IF;
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  now_at := clock_timestamp();
  IF held.generation IS DISTINCT FROM p_generation OR held.lease_token IS DISTINCT FROM p_token
    OR (held.expires_at > now_at) IS NOT TRUE THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
  BEGIN
    IF (p_audit->>'recordedAt')::timestamptz > now_at THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
  EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RETURN jsonb_build_object('status','unconfirmed'); END;
  INSERT INTO official_v3_intake_private.completions_v1 VALUES(held.operation_id,p_generation,p_token,p_outcome,p_audit,expected_key,clock_timestamp());
  -- Linearization is under the held operation lock. This is not source authority,
  -- nor a claim that a deferred trigger can certify arbitrary future COMMIT work.
  IF clock_timestamp() >= held.expires_at THEN RAISE EXCEPTION USING ERRCODE = 'P7302', MESSAGE = 'intake_lease_elapsed'; END IF;
  RETURN jsonb_build_object('status','recorded');
END $$;

ALTER FUNCTION official_v3_intake_private.exact_keys_v1(jsonb,text[]) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_private.safe_data_v1(jsonb,integer) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_private.binding_valid_v1(jsonb) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_private.unique_json_v1(json,integer) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_private.proposal_shape_v1() OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_private.data_nodes_v1(jsonb,integer,integer,integer) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_private.proposal_retainable_v1(jsonb) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_private.immutable_v1() OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_private.record_v1(text) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_api.capture_v1(jsonb,text,text) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_api.reserve_v1(jsonb,text,integer,integer) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb) OWNER TO ot_v3_intake_owner;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_v3_intake_private FROM PUBLIC, ot_v3_intake_caller;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_v3_intake_api FROM PUBLIC, ot_v3_intake_caller;
GRANT EXECUTE ON FUNCTION official_v3_intake_api.capture_v1(jsonb,text,text), official_v3_intake_api.read_v1(jsonb,text,integer),
  official_v3_intake_api.reserve_v1(jsonb,text,integer,integer), official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)
  TO ot_v3_intake_caller;
-- CREATE runs as the installer, whose default grants survive ALTER OWNER.
-- Reject any such inherited foreign privilege and atomically roll back this
-- whole candidate. Never change existing installer defaults to make it pass.
DO $$
DECLARE owner_oid oid := 'ot_v3_intake_owner'::regrole; caller_oid oid := 'ot_v3_intake_caller'::regrole;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    CROSS JOIN LATERAL aclexplode(CASE WHEN array_ndims(p.proacl) = 1 THEN p.proacl ELSE acldefault('f',p.proowner) END) a
    WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')
      AND (p.proowner <> owner_oid OR a.grantee <> owner_oid AND
        (n.nspname <> 'official_v3_intake_api' OR a.grantee <> caller_oid OR a.privilege_type <> 'EXECUTE' OR a.is_grantable))
  ) OR EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN LATERAL aclexplode(CASE WHEN array_ndims(c.relacl) = 1 THEN c.relacl ELSE acldefault('r',c.relowner) END) a
    WHERE n.nspname = 'official_v3_intake_private' AND c.relkind = 'r' AND (c.relowner <> owner_oid OR a.grantee <> owner_oid)
  ) OR EXISTS (
    SELECT 1 FROM pg_namespace n
    CROSS JOIN LATERAL aclexplode(CASE WHEN array_ndims(n.nspacl) = 1 THEN n.nspacl ELSE acldefault('n',n.nspowner) END) a
    WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')
      AND (n.nspowner <> owner_oid OR a.grantee <> owner_oid AND
        (n.nspname <> 'official_v3_intake_api' OR a.grantee <> caller_oid OR a.privilege_type <> 'USAGE' OR a.is_grantable))
  ) THEN RAISE EXCEPTION USING ERRCODE = 'P7304', MESSAGE = 'intake_privilege_boundary_invalid'; END IF;
END $$;
COMMENT ON SCHEMA official_v3_intake_private IS 'S1 candidate v1: untrusted proposal custody only; no Accepted Store or source authority';
COMMIT;
