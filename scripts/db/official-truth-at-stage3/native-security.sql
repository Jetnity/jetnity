-- After the real V6/V8 package prefix. Renewal must stay fail-closed because the
-- historical catalog chain does not match this synthetic database.
SELECT 'AT_STAGE3_PACKAGE_PREFIX_APPLIED' AS proof;
DO $blocked$
DECLARE a text:='atrenew3_'||repeat('b',32);
 d text:=official_v3_at_production_private.fixture_digest(690);
BEGIN
 INSERT INTO official_v3_at_production_private.ch_renewal_go_v3 VALUES(
  a,'atsrc3_'||repeat('a',32),690,82,d,2,clock_timestamp(),clock_timestamp()+interval '5 minutes');
 PERFORM official_v3_at_production_private.fixture_expect(
  official_v3_at_production_private.renew_ch_v3(a)=0,'real catalog chain blocks synthetic renewal');
 PERFORM official_v3_at_production_private.fixture_expect(
  (SELECT count(*)=0 FROM official_v3_at_production_private.ch_visa_facts_v3),'no fact published by the blocked renewal');
 PERFORM official_v3_at_production_private.fixture_expect(
  (SELECT count(*)=0 FROM official_v3_at_production_private.ch_visa_publication_v3),'publication journal stays empty');
 PERFORM official_v3_at_production_private.fixture_expect(
  public.jetnity_source_bound_at_visa_v1('CH')->>'status'='unavailable','public RPC stays unavailable');
 PERFORM official_v3_at_production_private.fixture_expect(
  NOT has_function_privilege('anon','official_v3_at_production_private.renew_ch_v3(text)','EXECUTE'),'anon cannot renew');
 PERFORM official_v3_at_production_private.fixture_expect(
  NOT has_function_privilege('authenticated','official_v3_at_production_private.read_ch_v3(text)','EXECUTE'),'authenticated cannot read private facts');
 PERFORM official_v3_at_production_private.fixture_expect(
  NOT has_table_privilege('service_role','official_v3_at_production_private.ch_renewal_go_v3','INSERT'),'service role cannot authorize');
 PERFORM official_v3_at_production_private.fixture_expect(
  (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid='official_v3_guard_private.bg1_prod_ch_at_stage3_v8'::regclass),
  'V8 RLS forced');
 PERFORM official_v3_at_production_private.fixture_expect(
  to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NULL,'V7 marker reserved');
 PERFORM official_v3_at_production_private.fixture_expect(
  (SELECT command FROM cron.job WHERE jobname='jetnity-ch-de-prod-import-v1')='SELECT official_v3_ch_de_private.import_v1()','CH to DE unchanged');
 PERFORM official_v3_at_production_private.fixture_expect(
  (SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1')='SELECT official_v3_at_production_private.renew_ch_v1()','old renew command unchanged');
 PERFORM official_v3_at_production_private.fixture_expect(
  (SELECT count(*)=3 FROM official_v3_at_production_private.ch_source_originals_v3),'historical originals remain');
END $blocked$;
SELECT 'AT_STAGE3_REAL_GUARD_BLOCKS_SYNTHETIC_RENEWAL' AS proof;
