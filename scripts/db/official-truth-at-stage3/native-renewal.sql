-- Renewal rules against the isolated stub guard. Not a Production catalog proof.
CREATE TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1(
 hold_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 reason text NOT NULL CHECK(reason='append_only_withdrawal'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp());
ALTER TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1 FROM PUBLIC,anon,authenticated,service_role;
CREATE POLICY postgres_only ON official_v3_at_production_private.ch_stage3_renewal_hold_v1
 FOR ALL TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_at_production_private.ch_stage3_renewal_hold_v1
 FOR EACH ROW EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
DO $rules$
DECLARE op text:='atsrc3_'||repeat('a',32); a text:='atrenew3_'||repeat('b',32); d text;
BEGIN
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.batch_qualified_ch_v3(690),'V3 source predicate');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'no renewal authorization');
 d:=official_v3_at_production_private.fixture_digest(690);
 BEGIN
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(a,op,690,82,repeat('0',64),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'wrong digest');
  RAISE EXCEPTION 'undo' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 BEGIN
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(a,op,690,81,d,2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'wrong predecessor');
  RAISE EXCEPTION 'undo' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 BEGIN
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(a,op,690,82,d,2,clock_timestamp()-interval '20 minutes',clock_timestamp()-interval '11 minutes');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'expired Go');
  RAISE EXCEPTION 'undo' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(a,op,690,82,d,2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=1,'authorized synthetic renewal');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3(a)=0,'replay');
 PERFORM official_v3_at_production_private.fixture_expect((SELECT max(version_id)=83 FROM official_v3_at_production_private.ch_visa_facts_v3),'version 83 above expired V2 82');
 PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.read_ch_v3('CH')->>'status'='accepted','private read');
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('CH')->>'status'='unavailable','unpublished');
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('DE')->>'status'='unavailable','DE');
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('FR')->>'status'='unavailable','FR');
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('ES')->>'status'='unavailable','ES');
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('IT')->>'status'='unavailable','IT');
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('IN')->>'status'='unavailable','IN');
 INSERT INTO official_v3_at_production_private.ch_visa_publication_v3(decision,source_operation_id,approved_fact_version) VALUES('release',op,83);
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('CH')->>'sourceAuthorityVersion'='3','synthetic release');
 -- Source failures while no renewal hold exists. Each block rolls itself back.
 BEGIN
  PERFORM official_v3_at_production_private.fixture_seed(692,clock_timestamp()-interval '1 minute','bmi-general-entry');
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES('atrenew3_'||repeat('d',32),op,692,83,official_v3_at_production_private.fixture_digest(692),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('d',32))=0,'changed source without hold');
  PERFORM official_v3_at_production_private.fixture_expect((SELECT count(*)=1 FROM official_v3_at_production_private.ch_visa_facts_v3),'changed source adds no fact');
  RAISE EXCEPTION 'undo changed' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 BEGIN
  PERFORM official_v3_at_production_private.fixture_seed(692,clock_timestamp()-interval '1 minute','bmi-general-entry');
  PERFORM official_v3_at_production_private.fixture_seed(693,clock_timestamp()-interval '1 minute');
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES('atrenew3_'||repeat('e',32),op,693,83,official_v3_at_production_private.fixture_digest(693),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.batch_qualified_ch_v3(693),'reverted batch still qualifies alone');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('e',32))=0,'history blocks a reverted source');
  PERFORM official_v3_at_production_private.fixture_expect((SELECT count(*)=1 FROM official_v3_at_production_private.ch_visa_facts_v3),'reverted source adds no fact');
  RAISE EXCEPTION 'undo reverted' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 BEGIN
  PERFORM official_v3_at_production_private.fixture_seed(691,clock_timestamp()-interval '1 minute',NULL,'bmi-general-entry');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.batch_qualified_ch_v3(691) IS DISTINCT FROM true,'incomplete batch is not qualified');
  RAISE EXCEPTION 'undo incomplete' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 BEGIN
  PERFORM official_v3_at_production_private.fixture_seed(694,clock_timestamp()-interval '1 minute');
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES('atrenew3_'||repeat('f',32),op,694,83,official_v3_at_production_private.fixture_digest(694),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('f',32))=1,'next clean batch renews without a hold');
  RAISE EXCEPTION 'undo valid next' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 BEGIN
  PERFORM official_v3_at_production_private.fixture_seed(694,clock_timestamp()-interval '1 minute');
  INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES('atrenew3_'||repeat('f',32),op,694,83,official_v3_at_production_private.fixture_digest(694),2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
  INSERT INTO official_v3_at_production_private.ch_stage3_renewal_hold_v1(reason) VALUES('append_only_withdrawal');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.renew_ch_v3('atrenew3_'||repeat('f',32))=0,'hold blocks an otherwise valid renewal');
  PERFORM official_v3_at_production_private.fixture_expect(official_v3_at_production_private.read_ch_v3('CH')->>'status'='unavailable','renewal hold closes private read');
  RAISE EXCEPTION 'undo hold' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 INSERT INTO official_v3_at_production_private.ch_visa_publication_v3(decision) VALUES('hold');
 PERFORM official_v3_at_production_private.fixture_expect(public.jetnity_source_bound_at_visa_v1('CH')->>'status'='unavailable','publication hold');
 PERFORM official_v3_at_production_private.fixture_expect(NOT has_function_privilege('anon','official_v3_at_production_private.renew_ch_v3(text)','EXECUTE'),'anon renew denied');
 PERFORM official_v3_at_production_private.fixture_expect(NOT has_table_privilege('service_role','official_v3_at_production_private.ch_renewal_go_v3','INSERT'),'service role denied');
 BEGIN
  UPDATE official_v3_at_production_private.ch_visa_facts_v3 SET version_id=99;
  RAISE EXCEPTION 'update succeeded';
 EXCEPTION WHEN SQLSTATE 'P7999' THEN NULL; END;
END $rules$;
SELECT 'AT_STAGE3_RENEWAL_RULES_PASS' AS proof;
