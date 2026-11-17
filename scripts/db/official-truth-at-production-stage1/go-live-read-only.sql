-- READ ONLY. Gate for Owner's later Austrian Production visitor activation.
-- No SQL writes, no role changes, no secret reads, no automatic flag setting.
-- Target project MUST be independently verified qscbgcdmivbbnzrcyegn.
BEGIN READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='2s';
DO $require_installed$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR to_regclass('official_v3_guard_private.at_source_monitor_baseline_v1') IS NULL
 OR to_regprocedure('official_v3_at_production_private.source_status_v1()') IS NULL
 OR to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)') IS NULL
 THEN RAISE EXCEPTION 'AT_PRODUCTION_READ_ONLY_NOT_INSTALLED'
 USING ERRCODE='P7978'; END IF;
END $require_installed$;
SELECT jsonb_build_object(
 'project','qscbgcdmivbbnzrcyegn',
 'guardian',public.official_v3_guard_alarm_status_v1()->>'status',
 'sourceMonitor',CASE WHEN to_regprocedure('official_v3_at_production_private.source_status_v1()') IS NOT NULL
 THEN official_v3_at_production_private.source_status_v1()->>'status' ELSE 'NOT_INSTALLED' END,
 'swissVisa',CASE WHEN to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)') IS NOT NULL
 THEN public.jetnity_source_bound_at_visa_v1('CH')->>'status' ELSE 'unavailable' END,
 'unapprovedIndia',CASE WHEN to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)') IS NOT NULL
 THEN public.jetnity_source_bound_at_visa_v1('IN')->>'status' ELSE 'unavailable' END,
 'sourceJobCount',(SELECT count(*) FROM cron.job WHERE active AND username='postgres'
  AND jobname IN('jetnity-at-production-source-enqueue-v1',
    'jetnity-at-production-source-collect-v1',
    'jetnity-at-production-source-renew-v1')),
 'ownerMethodApproved',EXISTS(SELECT 1 FROM official_v3_method_private.heads_v1
  WHERE method_id='jetnity-destination-primary-at-visa'
    AND revision=1 AND method_digest=
      'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
    AND package_digest=
      '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
    AND status='approved'),
 'visitorFlagActivationAllowed',false,
 'note','Manual Owner consent is still mandatory after an independent complete visitor readback'
) AS production_at_read_only_gate;
ROLLBACK;
