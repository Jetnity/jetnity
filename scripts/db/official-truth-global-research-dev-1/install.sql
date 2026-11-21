-- DEV ONLY. Audit-backed, fail-closed scope index for the user's original
-- 206-destination × 50-priority passport research archive (13 Nov 2026).
-- The archive is NEVER an Official Truth approval. No legal fact, source,
-- method, runtime public RPC or BG1-protected object is created or changed.
-- The two special travel destinations CN-HK/CN-MO are NOT national passports.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='45s';
SET LOCAL jetnity.global_scope_target='dev:yfvbxvijcorffwxbxahl:GLOBAL-206X50-RESEARCH-V1';
DO $pre$
DECLARE destination_codes text[]:=string_to_array('AD,AE,AG,AI,AL,AM,AO,AR,AS,AT,AU,AW,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BM,BN,BO,BR,BS,BT,BW,BY,BZ,CA,CD,CF,CG,CH,CK,CL,CM,CN,CN-HK,CN-MO,CO,CR,CU,CV,CW,CY,CZ,DE,DJ,DK,DM,DO,EE,EG,ES,ET,FI,FJ,FM,FR,GA,GB,GD,GE,GF,GH,GM,GN,GP,GR,GT,GU,GW,GY,HN,HR,HT,HU,ID,IE,IL,IN,IR,IS,IT,JM,JO,JP,KE,KG,KH,KI,KM,KN,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LS,LT,LU,LV,LY,MA,MC,MD,ME,MG,MH,MK,ML,MM,MN,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NG,NI,NL,NO,NP,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PR,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SI,SL,SM,SN,SR,ST,SV,SX,SY,SZ,TC,TD,TG,TH,TJ,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,US,UY,UZ,VC,VE,VG,VI,VN,VU,WS,YE,ZA,ZM,ZW',',');
 passport_codes text[]:=string_to_array('IN,TR,CN,DE,PL,IT,US,UA,RO,FR,NL,GB,AT,ES,HU,SY,CZ,AF,CH,RU,HR,BE,IQ,PT,BG,BR,GR,IR,SK,PK,ER,TH,SO,VN,SE,NG,EG,XK,KR,LK,DK,PH,JP,LB,RS,LT,CA,CM,MA,IL',',');
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.global_scope_target',true) IS DISTINCT FROM
 'dev:yfvbxvijcorffwxbxahl:GLOBAL-206X50-RESEARCH-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_global_research_private') IS NOT NULL
 OR array_length(destination_codes,1)<>206
 OR array_length(passport_codes,1)<>50
 OR (SELECT count(DISTINCT code) FROM unnest(destination_codes) AS v(code))<>206
 OR (SELECT count(DISTINCT code) FROM unnest(passport_codes) AS v(code))<>50
 OR encode(sha256(convert_to(array_to_string(destination_codes,','),'UTF8')),'hex')
  <>'cbd520a6793b5534156ab4597db83536460b5b5f13254ba21e36ba81a4495123'
 OR (SELECT string_agg(code,',' ORDER BY rank) FROM
   official_v3_source_renewal_private.passport_priority_v1)
    IS DISTINCT FROM array_to_string(passport_codes,',')
 OR (SELECT count(*) FROM official_v3_source_renewal_private.passport_priority_v1)<>50
 OR (SELECT count(*) FROM jetnity_followup_research_private.country_packages_v1)<>4
 OR (SELECT count(*) FROM jetnity_followup_research_private.passport_research_v1)<>200
 OR (SELECT count(*) FROM jetnity_next_six_research_private.passports_v1)<>300
 OR (SELECT count(*) FROM jetnity_entry_research_private.topic_sources_v1)<>26
 OR (SELECT count(*) FROM jetnity_next_six_research_private.blocked_index_v1)<>2
 OR (SELECT count(*) FROM jetnity_next_six_research_private.blocked_index_v1
     WHERE dest IN('HR','NL') AND accepted=0 AND issue='AMBIGUOUS_UNSPLIT_V2_2_INDEX')<>2
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR NOT pg_try_advisory_xact_lock(771115,206)
 THEN RAISE EXCEPTION 'GLOBAL_206X50_DEV_RESEARCH_SOURCE_SCOPE_REFUSED'
 USING ERRCODE='P7981'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE SCHEMA jetnity_global_research_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_global_research_private FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION jetnity_global_research_private.deny_mutation_v1()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
 SET search_path=pg_catalog AS $deny$
BEGIN RAISE EXCEPTION 'GLOBAL_RESEARCH_ONLY_IMMUTABLE' USING ERRCODE='P7981'; END $deny$;
REVOKE ALL ON FUNCTION jetnity_global_research_private.deny_mutation_v1()
 FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE jetnity_global_research_private.archive_v1(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 snapshot_label text NOT NULL CHECK(snapshot_label='206_destinations_50_priority_passports_20261113'),
 origin_sha256 text NOT NULL CHECK(origin_sha256=
 '4d8e9804598788a1070016f69ecd6e28c72dfdee78b56aafbd647d23e4243e9d'),
 original_upload_sha256 text NOT NULL CHECK(original_upload_sha256=
 '6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5'),
 tracker_sha256 text NOT NULL CHECK(tracker_sha256=
 '33aba1b3640541c2cabe4ec3e7dd569a6db8ed24ce83ef866ebad9255612c153'),
 passport_csv_sha256 text NOT NULL CHECK(passport_csv_sha256=
 '4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358'),
 country_code_set_sha256 text NOT NULL CHECK(country_code_set_sha256=
 'cbd520a6793b5534156ab4597db83536460b5b5f13254ba21e36ba81a4495123'),
 research_only boolean NOT NULL DEFAULT true CHECK(research_only),
 content_verified_for_legal_use boolean NOT NULL DEFAULT false CHECK(NOT content_verified_for_legal_use),
 customer_publication_allowed boolean NOT NULL DEFAULT false CHECK(NOT customer_publication_allowed)
);
INSERT INTO jetnity_global_research_private.archive_v1
 (snapshot_label,origin_sha256,original_upload_sha256,tracker_sha256,
  passport_csv_sha256,country_code_set_sha256)
VALUES('206_destinations_50_priority_passports_20261113',
 '4d8e9804598788a1070016f69ecd6e28c72dfdee78b56aafbd647d23e4243e9d',
 '6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5',
 '33aba1b3640541c2cabe4ec3e7dd569a6db8ed24ce83ef866ebad9255612c153',
 '4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358',
 'cbd520a6793b5534156ab4597db83536460b5b5f13254ba21e36ba81a4495123');

CREATE TABLE jetnity_global_research_private.destinations_v1(
 destination_code text PRIMARY KEY CHECK(destination_code~'^[A-Z]{2}(-[A-Z]{2})?$'),
 original_index_path text NOT NULL UNIQUE,
 archive_slice_count integer NOT NULL CHECK(archive_slice_count IN(50,51)),
 archive_extra_slice_ignored boolean NOT NULL,
 review_order integer NOT NULL UNIQUE CHECK(review_order BETWEEN 1 AND 1206),
 ambiguous_index boolean NOT NULL DEFAULT false,
 research_state text NOT NULL DEFAULT 'RESEARCH_ONLY' CHECK(research_state='RESEARCH_ONLY'),
 government_source_qualified boolean NOT NULL DEFAULT false CHECK(NOT government_source_qualified),
 auto_publish_allowed boolean NOT NULL DEFAULT false CHECK(NOT auto_publish_allowed),
 CHECK(archive_extra_slice_ignored=(archive_slice_count=51)),
 CHECK(original_index_path='records/dest/'||destination_code||'/index.json')
);
INSERT INTO jetnity_global_research_private.destinations_v1
 (destination_code,original_index_path,archive_slice_count,archive_extra_slice_ignored,
 review_order,ambiguous_index)
SELECT d.code,'records/dest/'||d.code||'/index.json',
 CASE WHEN d.code IN('AU','CN-HK','CN-MO','KE','MV','NZ','SA','TZ','ZA') THEN 51 ELSE 50 END,
 d.code IN('AU','CN-HK','CN-MO','KE','MV','NZ','SA','TZ','ZA'),
 COALESCE(array_position(ARRAY['AT','IT','FR','ES','PT','GR','HR','NL','GB','US','TR','TH','AE']::text[],d.code),
 1000+d.ordinal::integer),
 d.code IN('HR','NL')
FROM unnest(string_to_array('AD,AE,AG,AI,AL,AM,AO,AR,AS,AT,AU,AW,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BM,BN,BO,BR,BS,BT,BW,BY,BZ,CA,CD,CF,CG,CH,CK,CL,CM,CN,CN-HK,CN-MO,CO,CR,CU,CV,CW,CY,CZ,DE,DJ,DK,DM,DO,EE,EG,ES,ET,FI,FJ,FM,FR,GA,GB,GD,GE,GF,GH,GM,GN,GP,GR,GT,GU,GW,GY,HN,HR,HT,HU,ID,IE,IL,IN,IR,IS,IT,JM,JO,JP,KE,KG,KH,KI,KM,KN,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LS,LT,LU,LV,LY,MA,MC,MD,ME,MG,MH,MK,ML,MM,MN,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NG,NI,NL,NO,NP,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PR,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SI,SL,SM,SN,SR,ST,SV,SX,SY,SZ,TC,TD,TG,TH,TJ,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,US,UY,UZ,VC,VE,VG,VI,VN,VU,WS,YE,ZA,ZM,ZW',',')) WITH ORDINALITY d(code,ordinal);

CREATE TABLE jetnity_global_research_private.passport_priority_v1(
 priority_rank integer PRIMARY KEY CHECK(priority_rank BETWEEN 1 AND 50),
 citizenship_code text NOT NULL UNIQUE CHECK(citizenship_code~'^[A-Z]{2}$'),
 research_only boolean NOT NULL DEFAULT true CHECK(research_only)
);
INSERT INTO jetnity_global_research_private.passport_priority_v1(priority_rank,citizenship_code)
SELECT rank,code FROM official_v3_source_renewal_private.passport_priority_v1 ORDER BY rank;

CREATE TABLE jetnity_global_research_private.topics_v1(
 topic text PRIMARY KEY CHECK(topic~'^[a-z_]{3,64}$'),
 research_only boolean NOT NULL DEFAULT true CHECK(research_only),
 positive_rule_allowed boolean NOT NULL DEFAULT false CHECK(NOT positive_rule_allowed)
);
INSERT INTO jetnity_global_research_private.topics_v1(topic)
SELECT DISTINCT topic FROM jetnity_entry_research_private.topic_sources_v1 ORDER BY topic;

CREATE TABLE jetnity_global_research_private.cases_v1(
 destination_code text NOT NULL REFERENCES jetnity_global_research_private.destinations_v1(destination_code),
 citizenship_code text NOT NULL REFERENCES jetnity_global_research_private.passport_priority_v1(citizenship_code),
 priority_rank integer NOT NULL REFERENCES jetnity_global_research_private.passport_priority_v1(priority_rank),
 document_scope text NOT NULL DEFAULT 'ordinary_national_passport'
  CHECK(document_scope='ordinary_national_passport'),
 original_slice_path text NOT NULL,
 source_snapshot_class text NOT NULL DEFAULT 'RESEARCH_ONLY_UNVERIFIED_CONTENT'
  CHECK(source_snapshot_class='RESEARCH_ONLY_UNVERIFIED_CONTENT'),
 customer_status text NOT NULL DEFAULT 'derzeit nicht verfügbar'
  CHECK(customer_status='derzeit nicht verfügbar'),
 primary_source_verified boolean NOT NULL DEFAULT false CHECK(NOT primary_source_verified),
 legal_rule_qualified boolean NOT NULL DEFAULT false CHECK(NOT legal_rule_qualified),
 accepted_fact_count integer NOT NULL DEFAULT 0 CHECK(accepted_fact_count=0),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(NOT publication_allowed),
 source_checked_at timestamptz CHECK(source_checked_at IS NULL),
 legal_valid_until timestamptz CHECK(legal_valid_until IS NULL),
 PRIMARY KEY(destination_code,citizenship_code),
 UNIQUE(destination_code,priority_rank),
 CHECK(original_slice_path='records/dest/'||destination_code||'/'||citizenship_code||'.json')
);
INSERT INTO jetnity_global_research_private.cases_v1
 (destination_code,citizenship_code,priority_rank,original_slice_path)
SELECT d.destination_code,p.citizenship_code,p.priority_rank,
 'records/dest/'||d.destination_code||'/'||p.citizenship_code||'.json'
FROM jetnity_global_research_private.destinations_v1 d
CROSS JOIN jetnity_global_research_private.passport_priority_v1 p;

-- Only postgres can query. This view has no positive country or topic rule;
-- 10,300 × 26 logical slots without 267,800 mutable/materialized fake facts.
CREATE VIEW jetnity_global_research_private.topic_matrix_v1
WITH (security_invoker=true) AS
SELECT c.destination_code,c.citizenship_code,c.priority_rank,t.topic,
  'derzeit nicht verfügbar'::text AS visitor_status,
  false::boolean AS source_approved, false::boolean AS publishable
FROM jetnity_global_research_private.cases_v1 c
CROSS JOIN jetnity_global_research_private.topics_v1 t;

DO $rls$
DECLARE tbl text;
BEGIN
 FOREACH tbl IN ARRAY ARRAY['archive_v1','destinations_v1','passport_priority_v1','topics_v1','cases_v1'] LOOP
  EXECUTE format('ALTER TABLE jetnity_global_research_private.%I ENABLE ROW LEVEL SECURITY',tbl);
  EXECUTE format('ALTER TABLE jetnity_global_research_private.%I FORCE ROW LEVEL SECURITY',tbl);
  EXECUTE format('CREATE POLICY postgres_only ON jetnity_global_research_private.%I TO postgres USING(true) WITH CHECK(true)',tbl);
  EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_global_research_private.%I FOR EACH ROW EXECUTE FUNCTION jetnity_global_research_private.deny_mutation_v1()',tbl);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_global_research_private.%I FOR EACH STATEMENT EXECUTE FUNCTION jetnity_global_research_private.deny_mutation_v1()',tbl);
 END LOOP;
END $rls$;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_global_research_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_global_research_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_global_research_private FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_global_research_private.archive_v1)<>1
 OR (SELECT count(*) FROM jetnity_global_research_private.destinations_v1)<>206
 OR (SELECT count(*) FROM jetnity_global_research_private.passport_priority_v1)<>50
 OR (SELECT count(*) FROM jetnity_global_research_private.topics_v1)<>26
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_research_private.destinations_v1 WHERE archive_slice_count=51)<>9
 OR (SELECT count(*) FROM jetnity_global_research_private.destinations_v1 WHERE destination_code IN('CN-HK','CN-MO'))<>2
 OR (SELECT count(*) FROM jetnity_global_research_private.destinations_v1 WHERE ambiguous_index)<>2
 OR (SELECT count(*) FROM jetnity_global_research_private.topic_matrix_v1)<>267800
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
  WHERE customer_status<>'derzeit nicht verfügbar' OR publication_allowed
    OR primary_source_verified OR legal_rule_qualified OR accepted_fact_count<>0
    OR source_checked_at IS NOT NULL OR legal_valid_until IS NOT NULL)
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='jetnity_global_research_private' AND c.relkind='r'
  AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
    OR has_table_privilege('anon',c.oid,'SELECT')
    OR has_table_privilege('authenticated',c.oid,'SELECT')
    OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR has_schema_privilege('anon','jetnity_global_research_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_global_research_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_global_research_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'GLOBAL_206X50_PRIVATE_RESEARCH_IMPORT_POSTCHECK_REFUSED'
 USING ERRCODE='P7981'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
