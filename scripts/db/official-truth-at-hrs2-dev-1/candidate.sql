-- AT-only HRS2 private Dev source-to-method boundary. CH→DE HRS1 remains untouched.
-- Installation never imports, stages a method, approves a rule or exposes an RPC.
BEGIN;
SET LOCAL search_path = pg_catalog;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL idle_in_transaction_session_timeout = '30s';
DO $at_hrs2_preflight$
BEGIN
  IF session_user <> 'postgres' OR current_user <> 'postgres'
    OR current_database() <> 'postgres'
    OR current_setting('server_version_num')::integer / 10000 <> 17
    OR current_setting('jetnity.at_dev_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-HRS2-1'
    OR public.official_v3_guard_alarm_status_v1()->>'status' <> 'current'
    OR to_regclass('official_v3_at_private.whole_originals_v2') IS NULL
    OR to_regclass('official_v3_at_private.verified_visas_v3') IS NOT NULL
    OR EXISTS (SELECT 1 FROM official_v3_method_private.heads_v1
        WHERE method_id='jetnity-destination-primary-at-visa')
    OR EXISTS (SELECT 1 FROM official_v3_method_private.revisions_v1
        WHERE method_id='jetnity-destination-primary-at-visa')
    OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2) <> 3
    OR EXISTS (SELECT 1 FROM official_v3_at_private.whole_originals_v2 o WHERE
       o.disposition <> 'RESEARCH_ONLY' OR o.importable OR o.accepted_fact_count <> 0
       OR o.body_digest <> encode(sha256(o.original_body),'hex')
       OR o.source_retrieved_at <> '2026-11-16T19:45:39Z'::timestamptz
       OR NOT (
         (o.source_id='bmi-visa-nationality-matrix' AND o.editorial_edition='2026-11-06'
          AND o.body_bytes=498415 AND o.body_digest='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778')
         OR (o.source_id='bmi-general-entry' AND o.editorial_edition IS NULL
          AND o.body_bytes=91655 AND o.body_digest='ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e')
         OR (o.source_id='bmeia-bern-how-to-apply' AND o.editorial_edition IS NULL
          AND o.body_bytes=172460 AND o.body_digest='7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18')
       )) THEN
    RAISE EXCEPTION 'at_hrs2_exact_dev_predecessor_required' USING ERRCODE='P7971';
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM pg_advisory_xact_lock(771101,1);
  PERFORM pg_advisory_xact_lock(771102,1);
  PERFORM pg_advisory_xact_lock(771105,1);
END
$at_hrs2_preflight$;

CREATE TEMP TABLE at_hrs2_before (singleton boolean PRIMARY KEY, catalog jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO at_hrs2_before VALUES (true,official_v3_guard_private.catalog_status_v1());

CREATE TABLE official_v3_at_private.verified_visas_v3 (
  citizenship_country_code text NOT NULL CHECK (citizenship_country_code='CH'),
  rule_version integer NOT NULL CHECK(rule_version BETWEEN 1 AND 2147483646),
  destination_country_code text NOT NULL DEFAULT 'AT' CHECK(destination_country_code='AT'),
  document_type text NOT NULL DEFAULT 'passport' CHECK(document_type='passport'),
  route_type text NOT NULL DEFAULT 'direct_entry' CHECK(route_type='direct_entry'),
  requirement_type text NOT NULL DEFAULT 'visa' CHECK(requirement_type='visa'),
  visa_effect text NOT NULL CHECK(visa_effect='not_required'),
  visa_mode text NOT NULL CHECK(visa_mode='visa_exempt'),
  method_id text NOT NULL CHECK(method_id='jetnity-destination-primary-at-visa'),
  method_revision integer NOT NULL CHECK(method_revision=1),
  method_digest text NOT NULL CHECK(method_digest='cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'),
  package_digest text NOT NULL CHECK(package_digest='55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'),
  method_epoch integer NOT NULL CHECK(method_epoch BETWEEN 1 AND 2147483646),
  source_retrieved_at timestamptz NOT NULL,
  verified_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  chain_digest text NOT NULL CHECK(chain_digest ~ '^[0-9a-f]{64}$'),
  PRIMARY KEY(citizenship_country_code,rule_version),
  CONSTRAINT at_hrs2_valid_times CHECK (source_retrieved_at<=verified_at AND
      expires_at>verified_at AND expires_at<=verified_at+interval '1 hour')
);
ALTER TABLE official_v3_at_private.verified_visas_v3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_private.verified_visas_v3 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE official_v3_at_private.verified_visas_v3 FROM PUBLIC,anon,authenticated,service_role;
CREATE POLICY at_v3_postgres_only ON official_v3_at_private.verified_visas_v3 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER at_verified_immutable_v3 BEFORE UPDATE OR DELETE ON official_v3_at_private.verified_visas_v3
 FOR EACH ROW EXECUTE FUNCTION official_v3_at_private.refuse_original_mutation_v2();
CREATE TRIGGER at_verified_truncate_immutable_v3 BEFORE TRUNCATE ON official_v3_at_private.verified_visas_v3
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_at_private.refuse_original_mutation_v2();

-- Source custody: full original byte digest and exact current published text;
-- no caller-supplied HTML, source IDs, passports, approval or timestamps.
CREATE FUNCTION official_v3_at_private.source_current_v3() RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $source_current$
DECLARE b record; e record; v record; youngest timestamptz;
BEGIN
  IF (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>3 THEN RETURN false; END IF;
  SELECT * INTO STRICT b FROM official_v3_at_private.whole_originals_v2
    WHERE source_id='bmeia-bern-how-to-apply';
  SELECT * INTO STRICT e FROM official_v3_at_private.whole_originals_v2
    WHERE source_id='bmi-general-entry';
  SELECT * INTO STRICT v FROM official_v3_at_private.whole_originals_v2
    WHERE source_id='bmi-visa-nationality-matrix';
  youngest:=pg_catalog.clock_timestamp();
  IF b.source_retrieved_at<>e.source_retrieved_at OR e.source_retrieved_at<>v.source_retrieved_at
    OR b.source_retrieved_at > youngest OR b.source_retrieved_at <= youngest-interval '24 hours'
    OR b.disposition<>'RESEARCH_ONLY' OR e.disposition<>'RESEARCH_ONLY' OR v.disposition<>'RESEARCH_ONLY'
    OR b.importable OR e.importable OR v.importable
    OR b.accepted_fact_count<>0 OR e.accepted_fact_count<>0 OR v.accepted_fact_count<>0
    OR b.body_bytes<>172460 OR e.body_bytes<>91655 OR v.body_bytes<>498415
    OR b.official_url<>'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/'
    OR e.official_url<>'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html'
    OR v.official_url<>'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'
    OR b.editorial_edition IS NOT NULL OR e.editorial_edition IS NOT NULL OR v.editorial_edition<>'2026-11-06'
    OR b.body_digest<>'7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18'
    OR e.body_digest<>'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e'
    OR v.body_digest<>'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
    OR b.body_digest<>encode(sha256(b.original_body),'hex')
    OR e.body_digest<>encode(sha256(e.original_body),'hex')
    OR v.body_digest<>encode(sha256(v.original_body),'hex')
    OR position('Schweizer Staatsangehörige können mit ihrem gültigen Personalausweis oder Reisepass' IN
       convert_from(b.original_body,'UTF8'))=0
    OR position('brauchen zur Einreise nach Österreich kein Visum' IN
       convert_from(b.original_body,'UTF8'))=0
    OR position('EU-, EWR- und Schweizer' IN convert_from(e.original_body,'UTF8'))=0
    OR position('(Stand: 6.11.2026)' IN convert_from(v.original_body,'UTF8'))=0
  THEN RETURN false; END IF;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $source_current$;
REVOKE ALL ON FUNCTION official_v3_at_private.source_current_v3() FROM PUBLIC,anon,authenticated,service_role;

-- Authenticated owner AAL2 is required in MA1's existing approve_v1 path.
-- The private importer additionally checks the *real* current approved head.
-- No client/RPC role receives this function.
CREATE FUNCTION official_v3_at_private.import_ch_visa_v3() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $import_ch$
DECLARE h official_v3_method_private.heads_v1%ROWTYPE;
  source_at timestamptz; checked timestamptz; version integer; chain text;
BEGIN
  IF session_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('jetnity.at_dev_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-HRS2-1'
    OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
    OR NOT official_v3_at_private.source_current_v3() THEN
    RAISE EXCEPTION 'at_hrs2_import_not_admitted' USING ERRCODE='P7972';
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  SELECT * INTO STRICT h FROM official_v3_method_private.heads_v1
    WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
  PERFORM official_v3_method_private.require_current_locked_v1(
    'jetnity-destination-primary-at-visa',1,
    'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
    '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',h.epoch);
  SELECT min(source_retrieved_at) INTO STRICT source_at FROM official_v3_at_private.whole_originals_v2;
  SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_digest,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    INTO STRICT chain FROM official_v3_at_private.whole_originals_v2;
  checked:=clock_timestamp();
  IF checked>=source_at+interval '24 hours' THEN
    RAISE EXCEPTION 'at_hrs2_source_expired' USING ERRCODE='P7972'; END IF;
  SELECT coalesce(max(rule_version),0)+1 INTO STRICT version
    FROM official_v3_at_private.verified_visas_v3 WHERE citizenship_country_code='CH';
  INSERT INTO official_v3_at_private.verified_visas_v3(
    citizenship_country_code,rule_version,visa_effect,visa_mode,
    method_id,method_revision,method_digest,package_digest,method_epoch,
    source_retrieved_at,verified_at,expires_at,chain_digest)
  VALUES('CH',version,'not_required','visa_exempt','jetnity-destination-primary-at-visa',1,
    'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
    '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',
    h.epoch,source_at,checked,checked+interval '1 hour',chain);
  PERFORM official_v3_guard_private.assert_catalog_v1();
  RETURN jsonb_build_object('status','stored','country','CH','ruleVersion',version,'acceptedFacts',1);
END $import_ch$;
REVOKE ALL ON FUNCTION official_v3_at_private.import_ch_visa_v3() FROM PUBLIC,anon,authenticated,service_role;

-- Pure private readback; the public HTTP connection requires a subsequent
-- audited BG1 catalog successor. It is NOT exposed by this migration.
CREATE FUNCTION official_v3_at_private.visa_status_v3(p_citizenship_country_code text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $visitor$
DECLARE h official_v3_method_private.heads_v1%ROWTYPE;
  fact official_v3_at_private.verified_visas_v3%ROWTYPE;
  chain text; instant timestamptz;
  unavailable jsonb:=jsonb_build_object('status','unavailable','message','derzeit nicht verfügbar');
BEGIN
  IF p_citizenship_country_code<>'CH'
    OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
    OR NOT official_v3_at_private.source_current_v3() THEN RETURN unavailable; END IF;
  SELECT * INTO fact FROM official_v3_at_private.verified_visas_v3
    WHERE citizenship_country_code='CH' ORDER BY rule_version DESC LIMIT 1;
  IF NOT FOUND THEN RETURN unavailable; END IF;
  SELECT * INTO h FROM official_v3_method_private.heads_v1
    WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
  IF NOT FOUND OR fact.method_epoch<>h.epoch THEN RETURN unavailable; END IF;
  PERFORM official_v3_method_private.require_current_locked_v1(
    'jetnity-destination-primary-at-visa',1,
    'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
    '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',fact.method_epoch);
  SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_digest,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    INTO chain FROM official_v3_at_private.whole_originals_v2;
  instant:=clock_timestamp();
  IF chain IS DISTINCT FROM fact.chain_digest OR instant>=fact.expires_at
    OR instant<fact.verified_at OR instant>=fact.source_retrieved_at+interval '24 hours' THEN
    RETURN unavailable; END IF;
  RETURN jsonb_build_object('status','accepted','citizenshipCountryCode','CH',
    'destinationCountryCode','AT','documentType','passport','visaEffect','not_required',
    'visaMode','visa_exempt','ruleVersion',fact.rule_version,
    'sourceCheckedAt',to_char(fact.source_retrieved_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'verifiedAt',to_char(fact.verified_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'expiresAt',to_char(fact.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'sourceUrls',jsonb_build_array(
      'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',
      'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
      'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/'));
EXCEPTION WHEN OTHERS THEN RETURN unavailable;
END $visitor$;
REVOKE ALL ON FUNCTION official_v3_at_private.visa_status_v3(text) FROM PUBLIC,anon,authenticated,service_role;

DO $at_hrs2_post$
BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  IF official_v3_guard_private.catalog_status_v1()
     IS DISTINCT FROM (SELECT catalog FROM at_hrs2_before WHERE singleton)
   OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
   OR (SELECT count(*) FROM official_v3_at_private.verified_visas_v3)<>0
   OR NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class
          WHERE oid='official_v3_at_private.verified_visas_v3'::regclass)
   OR has_function_privilege('anon','official_v3_at_private.visa_status_v3(text)','EXECUTE')
   OR has_function_privilege('authenticated','official_v3_at_private.import_ch_visa_v3()','EXECUTE')
   OR has_schema_privilege('anon','official_v3_at_private','USAGE')
  THEN RAISE EXCEPTION 'at_hrs2_unreviewed_guard_or_permission_delta' USING ERRCODE='P7971'; END IF;
END $at_hrs2_post$;
COMMIT;
