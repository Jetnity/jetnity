-- Assertions run against the identical core/Stage1 V3 comparator and wrapper.
-- Method/guard are isolated controlled fixtures, not a complete hosted BG1 proof.
REVOKE ALL ON FUNCTION public.jetnity_source_bound_at_visa_v1(text) FROM PUBLIC;
GRANT USAGE ON SCHEMA at_stage2_fixture_api TO anon;
GRANT EXECUTE ON FUNCTION public.jetnity_source_bound_at_visa_v1(text) TO anon;

DO $checks$
DECLARE op text:='atsrc3_'||repeat('a',32); a text:='atrenew3_'||repeat('b',32);
 d text; checked timestamptz;
BEGIN
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'no source or renewal approval');
 INSERT INTO official_v3_at_production_private.ch_source_owner_decisions_v3
 SELECT op,'rule_neutral_ch_at_visa_only',original_sha,original_bytes,1,'CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY',2,clock_timestamp()
 FROM official_v3_at_production_private.ch_source_qualifications_v3 WHERE source_id='bmeia-bern-how-to-apply';
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.batch_qualified_ch_v3(1),'real V3 source predicate');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'source approval alone cannot renew');
 PERFORM official_v3_at_production_private.fixture_expect((SELECT count(*)=0 FROM official_v3_at_production_private.ch_visa_facts_v3),'initial fact table empty');
 d:=official_v3_at_production_private.fixture_digest(1);
 BEGIN
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(a,op,1,42,repeat('0',64),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'wrong digest');
  RAISE EXCEPTION 'undo synthetic invalid grant' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 BEGIN
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(a,op,1,41,d,2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'wrong predecessor');
  RAISE EXCEPTION 'undo synthetic invalid grant' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 BEGIN
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(a,op,1,42,d,2,clock_timestamp()-interval '20 minutes',clock_timestamp()-interval '11 minutes');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'expired separate Go');
  RAISE EXCEPTION 'undo synthetic invalid grant' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(a,op,1,42,d,2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=1,'one authorized synthetic renewal');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'replay denied');
 PERFORM official_v3_at_production_private.fixture_expect((SELECT count(*)=1 AND max(version_id)=43 FROM official_v3_at_production_private.ch_visa_facts_v3),'monotonic private V3 fact');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.read_ch_v3('CH')->>'status'='accepted','private readback');
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('CH')->>'status'='unavailable','no public release by renewal');
 INSERT INTO official_v3_at_production_private.ch_visa_publication_v3(decision,source_operation_id,approved_fact_version) VALUES('release',op,43);
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('CH')->>'sourceAuthorityVersion'='3','separate synthetic release');
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('IN')->>'status'='unavailable','other passport');
 UPDATE official_v3_guard_private.fixture_guard SET ok=false;
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('CH')->>'status'='unavailable','BG1 failure');
 UPDATE official_v3_guard_private.fixture_guard SET ok=true;
 UPDATE official_v3_method_private.heads_v1 SET status='revoked';
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('CH')->>'status'='unavailable','method revocation');
 UPDATE official_v3_method_private.heads_v1 SET status='approved';
 BEGIN
  PERFORM official_v3_at_production_private.fixture_seed(2,clock_timestamp()-interval '2 minutes');
  SELECT min(observed_at) INTO checked FROM official_v3_at_production_private.watch_observations_v1 WHERE batch_id=2;
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES('atrenew3_'||repeat('c',32),op,2,43,official_v3_at_production_private.fixture_digest(2),2,checked,checked+interval '5 minutes');
  INSERT INTO official_v3_at_production_private.ch_visa_facts_v3(version_id,authorization_id,source_operation_id,source_batch_id,source_digest,method_epoch,source_checked_at,verified_at,expires_at)
   VALUES(44,'atrenew3_'||repeat('c',32),op,2,official_v3_at_production_private.fixture_digest(2),2,checked,checked+interval '1 second',checked+interval '2 seconds');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.batch_qualified_ch_v3(2),'sources still fresh on expiry test');
  PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('CH')->>'status'='unavailable','expired fact despite fresh source');
  RAISE EXCEPTION 'undo synthetic expired fact' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 BEGIN
  INSERT INTO official_v3_at_production_private.ch_visa_publication_v3(decision) VALUES('hold');
  PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('CH')->>'status'='unavailable','independent DB rollback hold');
  RAISE EXCEPTION 'undo synthetic hold' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 -- V3 predicate refuses unfinished newer batch; no old fact fallback.
 PERFORM official_v3_at_production_private.fixture_seed(2,clock_timestamp()-interval '1 minute',NULL,'bmi-general-entry');
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('CH')->>'status'='unavailable','new incomplete batch');
 PERFORM official_v3_at_production_private.fixture_seed(3,clock_timestamp()-interval '1 minute','bmi-general-entry');
 INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES('atrenew3_'||repeat('d',32),op,3,43,official_v3_at_production_private.fixture_digest(3),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('d',32))=0,'actual changed source');
 PERFORM official_v3_at_production_private.fixture_seed(4,clock_timestamp()-interval '1 minute');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.batch_qualified_ch_v3(4),'reverted latest batch alone looks identical');
 INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES('atrenew3_'||repeat('e',32),op,4,43,official_v3_at_production_private.fixture_digest(4),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('e',32))=0,'historical semantic drift cannot auto-heal');
 PERFORM official_v3_at_production_private.fixture_expect((SELECT count(*)=1 FROM official_v3_at_production_private.ch_visa_facts_v3),'no additional fact');
 PERFORM official_v3_at_production_private.fixture_expect(NOT has_function_privilege('anon','official_v3_at_production_private.renew_ch_v3(text)','EXECUTE'),'anon cannot renew');
 PERFORM official_v3_at_production_private.fixture_expect(NOT has_function_privilege('authenticated','official_v3_at_production_private.read_ch_v3(text)','EXECUTE'),'authenticated cannot read private facts');
 PERFORM official_v3_at_production_private.fixture_expect(NOT has_table_privilege('service_role','official_v3_at_production_private.ch_renewal_go_v3','INSERT'),'service role cannot authorize');
 BEGIN
  UPDATE official_v3_at_production_private.ch_visa_facts_v3 SET version_id=99;
  RAISE EXCEPTION 'immutable UPDATE unexpectedly succeeded';
 EXCEPTION WHEN SQLSTATE 'P7999' THEN NULL; END;
 BEGIN
  DELETE FROM official_v3_at_production_private.ch_renewal_go_v3;
  RAISE EXCEPTION 'immutable DELETE unexpectedly succeeded';
 EXCEPTION WHEN SQLSTATE 'P7999' THEN NULL; END;
 BEGIN
  TRUNCATE official_v3_at_production_private.ch_visa_publication_v3;
  RAISE EXCEPTION 'immutable TRUNCATE unexpectedly succeeded';
 EXCEPTION WHEN SQLSTATE 'P7999' THEN NULL; END;
END $checks$;
SET LOCAL ROLE anon;
DO $anon$ BEGIN IF public.jetnity_source_bound_at_visa_v1('CH')->>'status' IS DISTINCT FROM 'unavailable' THEN RAISE EXCEPTION 'anon old fact leaked'; END IF; END $anon$;
RESET ROLE;
SELECT 'AT_STAGE2_NATIVE_SYNTHETIC_PASS' AS proof;
ROLLBACK;
DO $rollback$
BEGIN
 IF to_regnamespace('official_v3_at_production_private') IS NOT NULL OR to_regnamespace('official_v3_guard_private') IS NOT NULL OR to_regnamespace('official_v3_method_private') IS NOT NULL OR to_regnamespace('at_stage2_fixture_api') IS NOT NULL
 THEN RAISE EXCEPTION 'AT_STAGE2_ROLLBACK_LEAK'; END IF;
END $rollback$;
SELECT 'AT_STAGE2_ROLLBACK_PASS' AS proof;
