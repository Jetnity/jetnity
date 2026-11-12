-- HS1 V1 UNAPPLIED candidate. Exact S1 untrusted custody; no public/source authority.
-- Owner grant is transaction-local in effect and grantor-specific in catalog.
-- Actual PG17 non-superuser native proof and independent Root gates remain required.
BEGIN;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '30000';
SET LOCAL lock_timeout = '5000';
SET LOCAL idle_in_transaction_session_timeout = '30000';
SET LOCAL intervalstyle = 'postgres';
SET LOCAL datestyle = 'ISO, YMD';
DO $hs1_prerequisites$
DECLARE installer oid;
BEGIN
  IF session_user <> 'postgres' OR current_user <> session_user OR current_database() <> 'postgres'
    OR pg_catalog.current_setting('server_version_num')::integer / 10000 <> 17
    OR pg_catalog.current_setting('server_encoding') <> 'UTF8'
    OR pg_catalog.current_setting('createrole_self_grant') <> '' THEN
    RAISE EXCEPTION 'hs1 installer prerequisite mismatch' USING ERRCODE='P7310';
  END IF;
  SELECT r.oid INTO installer FROM pg_catalog.pg_roles r
    WHERE r.rolname = session_user AND r.rolcanlogin AND NOT r.rolsuper AND r.rolcreaterole;
  IF installer IS NULL
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_database d
      WHERE d.datname=current_database() AND d.datdba=installer AND d.encoding=6)
    OR NOT pg_catalog.has_database_privilege(installer,current_database(),'CREATE')
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=10 AND r.rolsuper)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_default_acl d
      WHERE d.defaclrole=installer AND d.defaclnamespace=0
        AND (d.defaclobjtype NOT IN ('r','S','f','T','n')
          OR d.defaclacl IS DISTINCT FROM pg_catalog.acldefault(d.defaclobjtype,installer))) THEN
    RAISE EXCEPTION 'hs1 creator/default prerequisite mismatch' USING ERRCODE='P7310';
  END IF;
  IF NOT pg_catalog.pg_try_advisory_xact_lock(771103,1) THEN
    RAISE EXCEPTION 'hs1 concurrent installation or recovery' USING ERRCODE='P7310';
  END IF;
END $hs1_prerequisites$;

DO $hs1_collision$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api'))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller')) THEN
    RAISE EXCEPTION 'hs1 names already exist; adoption forbidden' USING ERRCODE='P7310';
  END IF;
END $hs1_collision$;
CREATE ROLE ot_v3_intake_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE ot_v3_intake_caller NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

-- HS1_AFTER_ROLE_CREATION
DO $hs1_bootstrap_memberships$
DECLARE installer oid := session_user::pg_catalog.regrole; owner_id oid; caller_id oid;
BEGIN
  SELECT r.oid INTO owner_id FROM pg_catalog.pg_roles r WHERE r.rolname='ot_v3_intake_owner';
  SELECT r.oid INTO caller_id FROM pg_catalog.pg_roles r WHERE r.rolname='ot_v3_intake_caller';
  IF owner_id IS NULL OR caller_id IS NULL
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid IN (owner_id,caller_id)
      AND (r.rolcanlogin OR r.rolinherit OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
        OR r.rolreplication OR r.rolbypassrls OR r.rolconfig IS NOT NULL OR r.rolconnlimit<>-1 OR r.rolvaliduntil IS NOT NULL))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole IN (owner_id,caller_id))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id))
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid IN (owner_id,caller_id) OR m.member IN (owner_id,caller_id) OR m.grantor IN (owner_id,caller_id))<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid IN (owner_id,caller_id) AND m.member=installer AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>2
    OR pg_catalog.pg_has_role(installer,owner_id,'SET') OR pg_catalog.pg_has_role(installer,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(installer,caller_id,'SET') OR pg_catalog.pg_has_role(installer,caller_id,'USAGE') THEN
    RAISE EXCEPTION 'hs1 exact bootstrap-only role state required' USING ERRCODE='P7311';
  END IF;
END $hs1_bootstrap_memberships$;

GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
DO $hs1_temporary_membership$
DECLARE installer oid := session_user::pg_catalog.regrole;
  owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole;
  caller_id oid := 'ot_v3_intake_caller'::pg_catalog.regrole;
BEGIN
  IF current_user<>session_user
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid IN (owner_id,caller_id) OR m.member IN (owner_id,caller_id) OR m.grantor IN (owner_id,caller_id))<>3
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid IN (owner_id,caller_id) AND m.member=installer AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=installer AND m.grantor=installer
        AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)<>1
    OR NOT pg_catalog.pg_has_role(installer,owner_id,'SET')
    OR pg_catalog.pg_has_role(installer,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(installer,caller_id,'SET')
    OR pg_catalog.pg_has_role(installer,caller_id,'USAGE') THEN
    RAISE EXCEPTION 'hs1 exact temporary SET-only grant required' USING ERRCODE='P7311';
  END IF;
END $hs1_temporary_membership$;

-- HS1_AFTER_TEMPORARY_GRANT
CREATE SCHEMA official_v3_intake_private AUTHORIZATION ot_v3_intake_owner;
CREATE SCHEMA official_v3_intake_api AUTHORIZATION ot_v3_intake_owner;

SET LOCAL ROLE ot_v3_intake_owner;
-- HS1_ORIGINAL_TABLES_BEGIN
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
-- HS1_ORIGINAL_TABLES_END
-- HS1_ORIGINAL_RLS_BEGIN
ALTER TABLE official_v3_intake_private.operations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_intake_private.operations_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE official_v3_intake_private.reservations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_intake_private.reservations_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE official_v3_intake_private.completions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_intake_private.completions_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_intake_private.operations_v1 TO ot_v3_intake_owner USING (true) WITH CHECK (true);
CREATE POLICY owner_only ON official_v3_intake_private.reservations_v1 TO ot_v3_intake_owner USING (true) WITH CHECK (true);
CREATE POLICY owner_only ON official_v3_intake_private.completions_v1 TO ot_v3_intake_owner USING (true) WITH CHECK (true);
-- HS1_ORIGINAL_RLS_END

-- HS1_ORIGINAL_FUNCTIONS_AND_TRIGGERS_BEGIN
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
-- HS1_ORIGINAL_FUNCTIONS_AND_TRIGGERS_END

-- HS1_BEFORE_INITIAL_ACL_CHECK
-- Initial ACLs must be the engine baseline, not a foreign grant normalized away.
DO $hs1_initial_acls$
DECLARE owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole; x record;
BEGIN
  FOR x IN SELECT n.nspacl AS acl,'n'::"char" AS kind,n.nspowner AS owner_id
      FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')
    UNION ALL SELECT c.relacl,'r'::"char",c.relowner FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_intake_private' AND c.relkind='r'
    UNION ALL SELECT p.proacl,'f'::"char",p.proowner FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')
    UNION ALL SELECT t.typacl,'T'::"char",t.typowner FROM pg_catalog.pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')
  LOOP
    IF x.owner_id<>owner_id
      OR EXISTS ((SELECT * FROM pg_catalog.aclexplode(COALESCE(x.acl,pg_catalog.acldefault(x.kind,owner_id)))
        EXCEPT ALL SELECT * FROM pg_catalog.aclexplode(pg_catalog.acldefault(x.kind,owner_id)))
        UNION ALL
        (SELECT * FROM pg_catalog.aclexplode(pg_catalog.acldefault(x.kind,owner_id))
        EXCEPT ALL SELECT * FROM pg_catalog.aclexplode(COALESCE(x.acl,pg_catalog.acldefault(x.kind,owner_id))))) THEN
      RAISE EXCEPTION 'hs1 unexpected initial ACL' USING ERRCODE='P7312';
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api') AND a.attacl IS NOT NULL) THEN
    RAISE EXCEPTION 'hs1 unexpected initial column ACL' USING ERRCODE='P7312';
  END IF;
END $hs1_initial_acls$;

REVOKE EXECUTE ON FUNCTION official_v3_intake_private.exact_keys_v1(jsonb,text[]) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_private.safe_data_v1(jsonb,integer) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_private.binding_valid_v1(jsonb) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_private.unique_json_v1(json,integer) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_private.proposal_shape_v1() FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_private.data_nodes_v1(jsonb,integer,integer,integer) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_private.proposal_retainable_v1(jsonb) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_private.immutable_v1() FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_private.record_v1(text) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_api.capture_v1(jsonb,text,text) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_api.reserve_v1(jsonb,text,integer,integer) FROM PUBLIC RESTRICT;
REVOKE EXECUTE ON FUNCTION official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb) FROM PUBLIC RESTRICT;
GRANT USAGE ON SCHEMA official_v3_intake_api TO ot_v3_intake_caller;
GRANT EXECUTE ON FUNCTION official_v3_intake_api.capture_v1(jsonb,text,text),
  official_v3_intake_api.read_v1(jsonb,text,integer),
  official_v3_intake_api.reserve_v1(jsonb,text,integer,integer),
  official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb) TO ot_v3_intake_caller;
COMMENT ON SCHEMA official_v3_intake_private IS 'S1 candidate v1: untrusted proposal custody only; no Accepted Store or source authority';
COMMENT ON SCHEMA official_v3_intake_api IS 'HS1 v1: hosted non-superuser S1 installation; unused-only recovery; no source authority';

-- HS1_BEFORE_EXACT_PACKAGE_CHECK
-- All fourteen originals: exact identity, declaration properties and full body.
DO $hs1_function_pins$
DECLARE x record; p pg_catalog.pg_proc%ROWTYPE;
  owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole;
  caller_id oid := 'ot_v3_intake_caller'::pg_catalog.regrole; expected_types oid[]; actual_types oid[];
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_proc function_inventory JOIN pg_catalog.pg_namespace n ON n.oid=function_inventory.pronamespace
    WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api'))<>14 THEN
    RAISE EXCEPTION 'hs1 function inventory mismatch' USING ERRCODE='P7312';
  END IF;
  FOR x IN SELECT * FROM (VALUES
    ('official_v3_intake_private','exact_keys_v1','jsonb,text[]',ARRAY['v','expected']::text[],'boolean','sql','i',false,0,'d3d8130512d809af7ec2578b88d30412e3dfec516a158c74f0a6fe1d09d486ba'),
    ('official_v3_intake_private','safe_data_v1','jsonb,integer',ARRAY['v','depth']::text[],'boolean','plpgsql','i',false,1,'bce43ae05fa0cff183a1de7afedd8bca5e16f0cfc3e160c9b83fec33d09f0abf'),
    ('official_v3_intake_private','binding_valid_v1','jsonb',ARRAY['b']::text[],'boolean','plpgsql','i',false,0,'8f556b9db0b3786f9c247c9432a9e6a8631b66ee92019ac8aa082cf58aa4f7c1'),
    ('official_v3_intake_private','unique_json_v1','json,integer',ARRAY['v','depth']::text[],'boolean','plpgsql','i',false,1,'d9c536f2969d815c42b8cd00bbb7145808906519a575aff0dd9361f5070e7609'),
    ('official_v3_intake_private','proposal_shape_v1','',NULL::text[],'jsonb','sql','i',false,0,'4ba4184c3733a3849ebf450822f37b46187931f916635c905ca5a3e3704231a9'),
    ('official_v3_intake_private','data_nodes_v1','jsonb,integer,integer,integer',ARRAY['v','depth','max_depth','max_nodes']::text[],'integer','plpgsql','i',false,3,'ca39c759aa56b45e6974d3fecf953b2bf4d679c2bffbf0783f366f42fd621b85'),
    ('official_v3_intake_private','shape_matches_v1','jsonb,jsonb,jsonb,jsonb,integer',ARRAY['v','s','defs','countries','depth']::text[],'boolean','plpgsql','i',false,1,'760ebdb9782c8709c0ede579e94c30f47a74840683772e11b04a2b3f74fc598a'),
    ('official_v3_intake_private','proposal_retainable_v1','jsonb',ARRAY['v']::text[],'boolean','plpgsql','i',false,0,'d30b3540a097ab1832d09bdd67fa922efecaecbfdbae34eb3bfdbdca635cf797'),
    ('official_v3_intake_private','immutable_v1','',NULL::text[],'trigger','plpgsql','v',false,0,'ff1c2db432d3aa48e50b7a043982831be983dc54c6ea16155f4d690a91dcdc86'),
    ('official_v3_intake_private','record_v1','text',ARRAY['p_operation']::text[],'jsonb','sql','v',false,0,'f34089ca87adef99d16d63de7391c5c200e770928c476304d8324b4beb1844f3'),
    ('official_v3_intake_api','capture_v1','jsonb,text,text',ARRAY['p_binding','p_original','p_digest']::text[],'jsonb','plpgsql','v',true,0,'5488c6a3d2613b99f58890fcd2aac7205d3f766ce298102a8a655019787fa1b7'),
    ('official_v3_intake_api','read_v1','jsonb,text,integer',ARRAY['p_binding','p_digest','p_bytes']::text[],'jsonb','plpgsql','v',true,0,'3c3cbff368a4e196247964d35a350ef1d554d685b2a807573aa4f987bfbe17d4'),
    ('official_v3_intake_api','reserve_v1','jsonb,text,integer,integer',ARRAY['p_binding','p_digest','p_bytes','p_lease_ms']::text[],'jsonb','plpgsql','v',true,0,'82055d6a6f736a116c90a500d294d77953a338731e0a5047f5fd9dac6c8746d7'),
    ('official_v3_intake_api','finish_v1','jsonb,text,integer,integer,uuid,jsonb,jsonb',ARRAY['p_binding','p_digest','p_bytes','p_generation','p_token','p_outcome','p_audit']::text[],'jsonb','plpgsql','v',true,0,'d4fa49784f32d0feccdc7e9beaa6cb1e552fb0117be51e91b40b3b4a8556f262')
  ) v(schema_name,function_name,arg_types,arg_names,result_type,language_name,volatility,definer,defaults,body_hash)
  LOOP
    SELECT COALESCE(pg_catalog.array_agg(t::pg_catalog.regtype::oid ORDER BY position),'{}'::oid[]) INTO expected_types
      FROM pg_catalog.unnest(pg_catalog.string_to_array(x.arg_types,',')) WITH ORDINALITY a(t,position);
    SELECT f.* INTO p FROM pg_catalog.pg_proc f JOIN pg_catalog.pg_namespace n ON n.oid=f.pronamespace
      WHERE n.nspname=x.schema_name AND f.proname=x.function_name;
    SELECT COALESCE(pg_catalog.array_agg(t ORDER BY position),'{}'::oid[]) INTO actual_types
      FROM pg_catalog.unnest(p.proargtypes) WITH ORDINALITY a(t,position);
    IF NOT FOUND OR p.oid IS NULL OR p.proowner<>owner_id OR actual_types IS DISTINCT FROM expected_types
      OR p.pronargs<>pg_catalog.cardinality(expected_types) OR p.proargnames IS DISTINCT FROM x.arg_names
      OR p.proallargtypes IS NOT NULL OR p.proargmodes IS NOT NULL
      OR p.prorettype<>x.result_type::pg_catalog.regtype OR p.prokind<>'f' OR p.proretset
      OR p.prolang<>(SELECT l.oid FROM pg_catalog.pg_language l WHERE l.lanname=x.language_name)
      OR p.provolatile::text<>x.volatility OR p.proparallel<>'u' OR p.prosecdef<>x.definer
      OR p.proisstrict OR p.proleakproof OR p.provariadic<>0 OR p.prosupport<>0 OR p.probin IS NOT NULL
      OR p.prosqlbody IS NOT NULL OR p.procost<>100 OR p.prorows<>0
      OR p.pronargdefaults<>x.defaults OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog']
      OR pg_catalog.pg_get_expr(p.proargdefaults,0) IS DISTINCT FROM
        (CASE x.defaults WHEN 0 THEN NULL WHEN 3 THEN '0, 16, 8192' ELSE '0' END)
      OR pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')<>x.body_hash
      OR (SELECT count(*) FROM pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',owner_id))))
        <>(CASE WHEN x.definer THEN 2 ELSE 1 END)
      OR EXISTS (SELECT 1 FROM pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',owner_id))) a
        WHERE a.grantor<>owner_id OR a.privilege_type<>'EXECUTE' OR a.is_grantable
          OR NOT (a.grantee=owner_id OR x.definer AND a.grantee=caller_id)) THEN
      RAISE EXCEPTION 'hs1 exact function mismatch' USING ERRCODE='P7312';
    END IF;
  END LOOP;
END $hs1_function_pins$;
DO $hs1_structure$
DECLARE owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole;
  caller_id oid := 'ot_v3_intake_caller'::pg_catalog.regrole;
  private_id oid := 'official_v3_intake_private'::pg_catalog.regnamespace;
  api_id oid := 'official_v3_intake_api'::pg_catalog.regnamespace;
  x record; c pg_catalog.pg_class%ROWTYPE; a pg_catalog.pg_attribute%ROWTYPE;
  immutable_id oid; actual jsonb; expected jsonb;
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_namespace n WHERE n.oid IN (private_id,api_id) AND n.nspowner=owner_id)<>2
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id) OR d.defaclnamespace IN (private_id,api_id))
    OR pg_catalog.has_database_privilege(owner_id,current_database(),'CREATE')
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class class_inventory WHERE class_inventory.relnamespace=api_id)
    OR (SELECT count(*) FROM pg_catalog.pg_class class_inventory WHERE class_inventory.relnamespace=private_id)<>6
    OR (SELECT count(*) FROM pg_catalog.pg_type t WHERE t.typnamespace=private_id)<>6
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_type t WHERE t.typnamespace=api_id) THEN
    RAISE EXCEPTION 'hs1 schema/class/type inventory mismatch' USING ERRCODE='P7312';
  END IF;
  FOR x IN SELECT n.* FROM pg_catalog.pg_namespace n WHERE n.oid IN (private_id,api_id) LOOP
    IF (SELECT count(*) FROM pg_catalog.aclexplode(COALESCE(x.nspacl,pg_catalog.acldefault('n',owner_id))))
        <>(CASE WHEN x.oid=api_id THEN 3 ELSE 2 END)
      OR EXISTS (SELECT 1 FROM pg_catalog.aclexplode(COALESCE(x.nspacl,pg_catalog.acldefault('n',owner_id))) e
        WHERE e.grantor<>owner_id OR e.is_grantable
          OR NOT (e.grantee=owner_id AND e.privilege_type IN ('CREATE','USAGE')
            OR x.oid=api_id AND e.grantee=caller_id AND e.privilege_type='USAGE')) THEN
      RAISE EXCEPTION 'hs1 schema ACL mismatch' USING ERRCODE='P7312';
    END IF;
  END LOOP;
  FOR x IN SELECT * FROM (VALUES
    ('operations_v1',9,ARRAY[1]::smallint[]),
    ('reservations_v1',5,ARRAY[1,2]::smallint[]),
    ('completions_v1',7,ARRAY[1]::smallint[])
  ) v(table_name,column_count,primary_columns) LOOP
    SELECT r.* INTO c FROM pg_catalog.pg_class r WHERE r.relnamespace=private_id AND r.relname=x.table_name;
    IF c.oid IS NULL OR c.relkind<>'r' OR c.relowner<>owner_id OR c.relpersistence<>'p'
      OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity OR c.relispartition OR c.reloftype<>0
      OR c.relreplident<>'d' OR c.reloptions IS NOT NULL
      OR c.relam<>(SELECT m.oid FROM pg_catalog.pg_am m WHERE m.amname='heap')
      OR c.reltablespace<>0 OR c.relnatts<>x.column_count
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid)
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid)
      OR EXISTS ((SELECT * FROM pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',owner_id)))
          EXCEPT ALL SELECT * FROM pg_catalog.aclexplode(pg_catalog.acldefault('r',owner_id)))
        UNION ALL (SELECT * FROM pg_catalog.aclexplode(pg_catalog.acldefault('r',owner_id))
          EXCEPT ALL SELECT * FROM pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',owner_id)))))
      OR (SELECT count(*) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid)<>1
      OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class r ON r.oid=i.indexrelid
        WHERE i.indrelid=c.oid AND r.relname=x.table_name||'_pkey' AND r.relnamespace=private_id
          AND r.relowner=owner_id AND r.relkind='i' AND r.reloptions IS NULL AND r.relacl IS NULL
          AND r.reltablespace=0 AND r.relam=(SELECT m.oid FROM pg_catalog.pg_am m WHERE m.amname='btree')
          AND i.indisprimary AND i.indisunique AND i.indisvalid AND i.indisready AND i.indislive AND i.indimmediate
          AND NOT i.indnullsnotdistinct AND NOT i.indisreplident AND NOT i.indisclustered
          AND i.indexprs IS NULL AND i.indpred IS NULL
          AND i.indnatts=pg_catalog.cardinality(x.primary_columns) AND i.indnkeyatts=i.indnatts
          AND ARRAY(SELECT k FROM pg_catalog.unnest(i.indkey) k)=x.primary_columns
          AND ARRAY(SELECT co FROM pg_catalog.unnest(i.indcollation) co)=CASE WHEN x.table_name='reservations_v1'
            THEN ARRAY[(SELECT t.typcollation FROM pg_catalog.pg_type t WHERE t.oid='text'::pg_catalog.regtype),0::oid]
            ELSE ARRAY[(SELECT t.typcollation FROM pg_catalog.pg_type t WHERE t.oid='text'::pg_catalog.regtype)] END
          AND NOT EXISTS (SELECT 1 FROM pg_catalog.unnest(i.indoption) o WHERE o<>0)
          AND ARRAY(SELECT op.opcname::text FROM pg_catalog.unnest(i.indclass) WITH ORDINALITY z(oid,position)
            JOIN pg_catalog.pg_opclass op ON op.oid=z.oid JOIN pg_catalog.pg_namespace ns ON ns.oid=op.opcnamespace
            WHERE ns.nspname='pg_catalog' ORDER BY z.position)
            =CASE WHEN x.table_name='reservations_v1' THEN ARRAY['text_ops','int4_ops'] ELSE ARRAY['text_ops'] END) THEN
      RAISE EXCEPTION 'hs1 table/index mismatch' USING ERRCODE='P7312';
    END IF;
    -- Composite and automatic array type PUBLIC USAGE are the exact engine
    -- baseline. They do not supply the absent schema USAGE or table rights.
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_type t JOIN pg_catalog.pg_type ar ON ar.oid=t.typarray
      WHERE t.oid=c.reltype AND t.typname=x.table_name AND t.typnamespace=private_id AND t.typowner=owner_id
        AND t.typtype='c' AND t.typcategory='C' AND t.typrelid=c.oid AND t.typelem=0 AND t.typbasetype=0
        AND ar.typname='_'||x.table_name AND ar.typnamespace=private_id AND ar.typowner=owner_id
        AND ar.typtype='b' AND ar.typcategory='A' AND ar.typrelid=0 AND ar.typelem=t.oid AND ar.typbasetype=0)
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_type t WHERE (t.oid=c.reltype OR t.typelem=c.reltype)
        AND t.typnamespace=private_id AND
          (t.typnotnull OR t.typdefault IS NOT NULL OR t.typdefaultbin IS NOT NULL)) THEN
      RAISE EXCEPTION 'hs1 row/array type mismatch' USING ERRCODE='P7312';
    END IF;
    IF (SELECT count(*) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid)<>1
      OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid AND p.polname='owner_only'
        AND p.polcmd='*' AND p.polpermissive AND p.polroles=ARRAY[owner_id]
        AND pg_catalog.pg_get_expr(p.polqual,p.polrelid)='true'
        AND pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)='true') THEN
      RAISE EXCEPTION 'hs1 FORCE RLS policy mismatch' USING ERRCODE='P7312';
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_type t WHERE t.typnamespace=private_id AND
    EXISTS ((SELECT * FROM pg_catalog.aclexplode(COALESCE(t.typacl,pg_catalog.acldefault('T',owner_id)))
       EXCEPT ALL SELECT * FROM pg_catalog.aclexplode(pg_catalog.acldefault('T',owner_id)))
      UNION ALL (SELECT * FROM pg_catalog.aclexplode(pg_catalog.acldefault('T',owner_id))
       EXCEPT ALL SELECT * FROM pg_catalog.aclexplode(COALESCE(t.typacl,pg_catalog.acldefault('T',owner_id)))))) THEN
    RAISE EXCEPTION 'hs1 type ACL mismatch' USING ERRCODE='P7312';
  END IF;
  FOR x IN SELECT * FROM (VALUES
    ('operations_v1',1,'operation_id','text',true,NULL::text),
    ('operations_v1',2,'binding','jsonb',true,NULL),
    ('operations_v1',3,'original_bytes','bytea',true,NULL),
    ('operations_v1',4,'proposal_digest','text',true,NULL),
    ('operations_v1',5,'created_at','timestamp with time zone',true,'clock_timestamp()'),
    ('operations_v1',6,'generation','integer',true,'0'),
    ('operations_v1',7,'lease_token','uuid',false,NULL),
    ('operations_v1',8,'acquired_at','timestamp with time zone',false,NULL),
    ('operations_v1',9,'expires_at','timestamp with time zone',false,NULL),
    ('reservations_v1',1,'operation_id','text',true,NULL),
    ('reservations_v1',2,'generation','integer',true,NULL),
    ('reservations_v1',3,'lease_token','uuid',true,NULL),
    ('reservations_v1',4,'acquired_at','timestamp with time zone',true,NULL),
    ('reservations_v1',5,'expires_at','timestamp with time zone',true,NULL),
    ('completions_v1',1,'operation_id','text',true,NULL),
    ('completions_v1',2,'generation','integer',true,NULL),
    ('completions_v1',3,'lease_token','uuid',true,NULL),
    ('completions_v1',4,'outcome','jsonb',true,NULL),
    ('completions_v1',5,'audit','jsonb',true,NULL),
    ('completions_v1',6,'escalation_key','text',false,NULL),
    ('completions_v1',7,'completed_at','timestamp with time zone',true,NULL)
  ) v(table_name,position,column_name,type_name,not_null,default_expr) LOOP
    SELECT a0.* INTO a FROM pg_catalog.pg_attribute a0 JOIN pg_catalog.pg_class c0 ON c0.oid=a0.attrelid
      WHERE c0.relnamespace=private_id AND c0.relname=x.table_name AND a0.attnum=x.position;
    IF a.attname IS DISTINCT FROM x.column_name OR a.attisdropped OR a.atttypid<>x.type_name::pg_catalog.regtype
      OR a.attnotnull<>x.not_null OR a.attgenerated<>'' OR a.attidentity<>'' OR a.atthasmissing
      OR a.attacl IS NOT NULL OR a.attoptions IS NOT NULL OR a.attfdwoptions IS NOT NULL
      OR a.atttypmod<>-1 OR a.attndims<>0 OR a.attstattarget<>-1 OR a.attcompression<>''
      OR a.attstorage<>(SELECT t.typstorage FROM pg_catalog.pg_type t WHERE t.oid=a.atttypid)
      OR a.attcollation<>(SELECT t.typcollation FROM pg_catalog.pg_type t WHERE t.oid=a.atttypid)
      OR (SELECT pg_catalog.pg_get_expr(d.adbin,d.adrelid) FROM pg_catalog.pg_attrdef d
        WHERE d.adrelid=a.attrelid AND d.adnum=a.attnum) IS DISTINCT FROM x.default_expr THEN
      RAISE EXCEPTION 'hs1 exact column mismatch' USING ERRCODE='P7312';
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM pg_catalog.pg_attrdef d JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=d.adrelid
    WHERE class_inventory.relnamespace=private_id)<>2 OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute attribute_inventory JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=attribute_inventory.attrelid
    WHERE class_inventory.relnamespace IN (private_id,api_id) AND (attribute_inventory.attacl IS NOT NULL OR attribute_inventory.attisdropped)) THEN
    RAISE EXCEPTION 'hs1 column/default inventory mismatch' USING ERRCODE='P7312';
  END IF;
  SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_array(class_inventory.relname,k.contype,
      pg_catalog.pg_get_constraintdef(k.oid,false)) ORDER BY class_inventory.relname,k.contype,pg_catalog.pg_get_constraintdef(k.oid,false)) INTO actual
    FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=k.conrelid WHERE class_inventory.relnamespace=private_id;
  SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_array(v.table_name,v.kind,v.definition)
    ORDER BY v.table_name,v.kind,v.definition) INTO expected FROM (VALUES
    ('operations_v1','p','PRIMARY KEY (operation_id)'),
    ('operations_v1','c','CHECK ((operation_id ~ ''^op3_[a-f0-9]{32}$''::text))'),
    ('operations_v1','c','CHECK (((octet_length(original_bytes) >= 1) AND (octet_length(original_bytes) <= 65536)))'),
    ('operations_v1','c','CHECK ((proposal_digest = encode(sha256(original_bytes), ''hex''::text)))'),
    ('operations_v1','c','CHECK (((generation >= 0) AND (generation <= 2147483646)))'),
    ('operations_v1','c','CHECK ((((generation = 0) AND (lease_token IS NULL) AND (acquired_at IS NULL) AND (expires_at IS NULL)) OR ((generation > 0) AND (lease_token IS NOT NULL) AND (acquired_at IS NOT NULL) AND (expires_at IS NOT NULL) AND (expires_at > acquired_at) AND (expires_at <= (acquired_at + ''00:15:00''::interval)))))'),
    ('reservations_v1','p','PRIMARY KEY (operation_id, generation)'),
    ('reservations_v1','c','CHECK (((generation >= 1) AND (generation <= 2147483646)))'),
    ('reservations_v1','c','CHECK (((expires_at > acquired_at) AND (expires_at <= (acquired_at + ''00:15:00''::interval))))'),
    ('reservations_v1','f','FOREIGN KEY (operation_id) REFERENCES official_v3_intake_private.operations_v1(operation_id)'),
    ('completions_v1','p','PRIMARY KEY (operation_id)'),
    ('completions_v1','c','CHECK ((octet_length((outcome)::text) <= 524288))'),
    ('completions_v1','c','CHECK ((octet_length((audit)::text) <= 8192))'),
    ('completions_v1','c','CHECK ((escalation_key ~ ''^source-escalation:v3:[a-f0-9]{64}$''::text))'),
    ('completions_v1','f','FOREIGN KEY (operation_id) REFERENCES official_v3_intake_private.operations_v1(operation_id)'),
    ('completions_v1','f','FOREIGN KEY (operation_id, generation) REFERENCES official_v3_intake_private.reservations_v1(operation_id, generation)')
  ) v(table_name,kind,definition);
  IF actual IS DISTINCT FROM expected OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=k.conrelid
    WHERE class_inventory.relnamespace=private_id AND (k.connamespace<>private_id OR k.condeferrable OR k.condeferred
      OR NOT k.convalidated OR NOT k.conislocal OR k.coninhcount<>0 OR k.conparentid<>0
      OR k.contype='c' AND k.connoinherit
      OR k.contype='f' AND (k.confupdtype<>'a' OR k.confdeltype<>'a' OR k.confmatchtype<>'s'))) THEN
    RAISE EXCEPTION 'hs1 exact constraint mismatch' USING ERRCODE='P7312';
  END IF;
  SELECT p.oid INTO immutable_id FROM pg_catalog.pg_proc p WHERE p.pronamespace=private_id AND p.proname='immutable_v1';
  IF (SELECT count(*) FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=g.tgrelid
      WHERE class_inventory.relnamespace=private_id AND NOT g.tgisinternal)<>3
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=g.tgrelid
      WHERE class_inventory.relnamespace=private_id AND NOT g.tgisinternal AND
        (g.tgname<>'immutable_v1' OR g.tgfoid<>immutable_id OR g.tgtype<>27 OR g.tgenabled<>'O'
          OR g.tgconstraint<>0 OR g.tgdeferrable OR g.tginitdeferred OR g.tgnargs<>0
          OR g.tgargs<>''::bytea OR g.tgattr<>''::pg_catalog.int2vector OR g.tgqual IS NOT NULL
          OR g.tgoldtable IS NOT NULL OR g.tgnewtable IS NOT NULL OR g.tgparentid<>0))
    OR (SELECT count(*) FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=g.tgrelid
      WHERE class_inventory.relnamespace=private_id AND g.tgisinternal)<>12
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=g.tgrelid
      JOIN pg_catalog.pg_proc p ON p.oid=g.tgfoid JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      LEFT JOIN pg_catalog.pg_constraint k ON k.oid=g.tgconstraint
      WHERE class_inventory.relnamespace=private_id AND g.tgisinternal AND
        (n.nspname<>'pg_catalog' OR k.contype IS DISTINCT FROM 'f' OR k.connamespace<>private_id
          OR g.tgenabled<>'O' OR g.tgdeferrable OR g.tginitdeferred OR g.tgnargs<>0
          OR g.tgargs<>''::bytea OR g.tgattr<>''::pg_catalog.int2vector OR g.tgqual IS NOT NULL
          OR g.tgoldtable IS NOT NULL OR g.tgnewtable IS NOT NULL OR g.tgparentid<>0
          OR NOT (p.proname='RI_FKey_check_ins' AND g.tgtype=5 AND g.tgrelid=k.conrelid AND g.tgconstrrelid=k.confrelid
            OR p.proname='RI_FKey_check_upd' AND g.tgtype=17 AND g.tgrelid=k.conrelid AND g.tgconstrrelid=k.confrelid
            OR p.proname='RI_FKey_noaction_del' AND g.tgtype=9 AND g.tgrelid=k.confrelid AND g.tgconstrrelid=k.conrelid
            OR p.proname='RI_FKey_noaction_upd' AND g.tgtype=17 AND g.tgrelid=k.confrelid AND g.tgconstrrelid=k.conrelid)))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=k.conrelid
      WHERE class_inventory.relnamespace=private_id AND k.contype='f' AND
        (SELECT count(DISTINCT g.tgfoid) FROM pg_catalog.pg_trigger g WHERE g.tgconstraint=k.oid AND g.tgisinternal)<>4) THEN
    RAISE EXCEPTION 'hs1 exact trigger mismatch' USING ERRCODE='P7312';
  END IF;
END $hs1_structure$;
-- Inbound consumers and off-package role dependencies are refused before any
-- teardown. DROP ... RESTRICT is an additional transactional guard, not CASCADE.
DO $hs1_dependency_boundary$
DECLARE foreign_dependency boolean; owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole;
  caller_id oid := 'ot_v3_intake_caller'::pg_catalog.regrole;
BEGIN
  WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n
  WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
  SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
    JOIN scope_objects r ON r.classid=d.refclassid AND r.objid=d.refobjid
    WHERE NOT EXISTS (SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
      JOIN scope_objects o ON o.classid=d.classid AND o.objid=d.objid WHERE d.deptype IN ('e','x'))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_shdepend d
      WHERE d.refclassid='pg_catalog.pg_authid'::pg_catalog.regclass AND d.refobjid IN (owner_id,caller_id)
        AND NOT (d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
          AND EXISTS (SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid))
        AND NOT (d.dbid=0 AND d.classid='pg_catalog.pg_auth_members'::pg_catalog.regclass
          AND EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.oid=d.objid
            AND m.roleid IN (owner_id,caller_id) AND m.member=session_user::pg_catalog.regrole)))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_shseclabel s WHERE s.classoid='pg_catalog.pg_authid'::pg_catalog.regclass
      AND s.objoid IN (owner_id,caller_id))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid
      WHERE d.objsubid<>0 OR NOT (d.classoid='pg_catalog.pg_namespace'::pg_catalog.regclass AND
        (d.objoid='official_v3_intake_private'::pg_catalog.regnamespace
          AND d.description='S1 candidate v1: untrusted proposal custody only; no Accepted Store or source authority'
         OR d.objoid='official_v3_intake_api'::pg_catalog.regnamespace
          AND d.description='HS1 v1: hosted non-superuser S1 installation; unused-only recovery; no source authority')))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_shdescription d WHERE d.classoid='pg_catalog.pg_authid'::pg_catalog.regclass
      AND d.objoid IN (owner_id,caller_id))
    OR pg_catalog.obj_description('official_v3_intake_private'::pg_catalog.regnamespace,'pg_namespace')
      IS DISTINCT FROM 'S1 candidate v1: untrusted proposal custody only; no Accepted Store or source authority'
    OR pg_catalog.obj_description('official_v3_intake_api'::pg_catalog.regnamespace,'pg_namespace')
      IS DISTINCT FROM 'HS1 v1: hosted non-superuser S1 installation; unused-only recovery; no source authority'
    INTO foreign_dependency;
  IF foreign_dependency THEN
    RAISE EXCEPTION 'hs1 foreign object/dependency or label' USING ERRCODE='P7312';
  END IF;
END $hs1_dependency_boundary$;
DO $hs1_effective_privileges$
DECLARE actor record; obj record; owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole;
  caller_id oid := 'ot_v3_intake_caller'::pg_catalog.regrole;
BEGIN
  -- PUBLIC and every explicitly granted ACL are covered by the exact catalogs.
  -- These effective checks also reject platform-role paths into the new scope.
  FOR actor IN SELECT r.oid,r.rolname FROM pg_catalog.pg_roles r
    WHERE r.rolname IN ('anon','authenticated','service_role','ot_v3_intake_caller') LOOP
    IF pg_catalog.has_schema_privilege(actor.oid,'official_v3_intake_private','USAGE,CREATE')
      OR pg_catalog.has_schema_privilege(actor.oid,'official_v3_intake_api','CREATE')
      OR (actor.oid<>caller_id AND pg_catalog.has_schema_privilege(actor.oid,'official_v3_intake_api','USAGE'))
      OR (actor.oid=caller_id AND NOT pg_catalog.has_schema_privilege(actor.oid,'official_v3_intake_api','USAGE'))
      OR pg_catalog.pg_has_role(actor.oid,owner_id,'USAGE') OR pg_catalog.pg_has_role(actor.oid,owner_id,'SET') THEN
      RAISE EXCEPTION 'hs1 effective schema/owner privilege' USING ERRCODE='P7312';
    END IF;
    FOR obj IN SELECT c.oid FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_intake_private' AND c.relkind='r' LOOP
      IF pg_catalog.has_table_privilege(actor.oid,obj.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
        OR pg_catalog.has_any_column_privilege(actor.oid,obj.oid,'SELECT,INSERT,UPDATE,REFERENCES') THEN
        RAISE EXCEPTION 'hs1 effective table/column privilege' USING ERRCODE='P7312';
      END IF;
    END LOOP;
    FOR obj IN SELECT p.oid,n.nspname FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api') LOOP
      IF pg_catalog.has_function_privilege(actor.oid,obj.oid,'EXECUTE')
        IS DISTINCT FROM (actor.oid=caller_id AND obj.nspname='official_v3_intake_api') THEN
        RAISE EXCEPTION 'hs1 effective function privilege' USING ERRCODE='P7312';
      END IF;
    END LOOP;
  END LOOP;
END $hs1_effective_privileges$;

-- HS1_BEFORE_TEMPORARY_GRANT_REMOVAL
RESET ROLE;
REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres RESTRICT;

-- HS1_AFTER_TEMPORARY_GRANT_REMOVAL
DO $hs1_bootstrap_memberships$
DECLARE installer oid := session_user::pg_catalog.regrole; owner_id oid; caller_id oid;
BEGIN
  SELECT r.oid INTO owner_id FROM pg_catalog.pg_roles r WHERE r.rolname='ot_v3_intake_owner';
  SELECT r.oid INTO caller_id FROM pg_catalog.pg_roles r WHERE r.rolname='ot_v3_intake_caller';
  IF owner_id IS NULL OR caller_id IS NULL
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid IN (owner_id,caller_id)
      AND (r.rolcanlogin OR r.rolinherit OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
        OR r.rolreplication OR r.rolbypassrls OR r.rolconfig IS NOT NULL OR r.rolconnlimit<>-1 OR r.rolvaliduntil IS NOT NULL))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole IN (owner_id,caller_id))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id))
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid IN (owner_id,caller_id) OR m.member IN (owner_id,caller_id) OR m.grantor IN (owner_id,caller_id))<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid IN (owner_id,caller_id) AND m.member=installer AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>2
    OR pg_catalog.pg_has_role(installer,owner_id,'SET') OR pg_catalog.pg_has_role(installer,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(installer,caller_id,'SET') OR pg_catalog.pg_has_role(installer,caller_id,'USAGE') THEN
    RAISE EXCEPTION 'hs1 exact bootstrap-only role state required' USING ERRCODE='P7311';
  END IF;
END $hs1_bootstrap_memberships$;

COMMIT;
