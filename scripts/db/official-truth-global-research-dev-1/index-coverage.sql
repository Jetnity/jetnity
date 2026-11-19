-- ADDITIVE DEV-only foreign key index coverage. These four research
-- tables are already forcibly RLS and append-only; no legal fact, method,
-- source, public API, cron or Production object is modified.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.global_index_target='dev:yfvbxvijcorffwxbxahl:GLOBAL-FK-4-V1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.global_index_target',true) IS DISTINCT FROM
 'dev:yfvbxvijcorffwxbxahl:GLOBAL-FK-4-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_global_research_private.cases_v1') IS NULL
 OR to_regclass('jetnity_global_source_monitor_private.requests_v1') IS NULL
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.observations_v1)<>11
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
  WHERE publication_allowed OR accepted_fact_count<>0)
 OR to_regclass('jetnity_global_research_private.cases_v1_citizenship_fkey_idx') IS NOT NULL
 OR to_regclass('jetnity_global_research_private.cases_v1_rank_fkey_idx') IS NOT NULL
 OR to_regclass('jetnity_global_source_monitor_private.requests_v1_source_fkey_idx') IS NOT NULL
 OR to_regclass('jetnity_global_source_monitor_private.first_originals_v1_batch_fkey_idx') IS NOT NULL
 OR NOT pg_try_advisory_xact_lock(771115,404)
 THEN RAISE EXCEPTION 'GLOBAL_4_FK_DEV_INDEX_PREDECESSOR_REFUSED' USING ERRCODE='P7983'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE INDEX cases_v1_citizenship_fkey_idx
 ON jetnity_global_research_private.cases_v1(citizenship_code,destination_code);
CREATE INDEX cases_v1_rank_fkey_idx
 ON jetnity_global_research_private.cases_v1(priority_rank,destination_code);
CREATE INDEX requests_v1_source_fkey_idx
 ON jetnity_global_source_monitor_private.requests_v1(dest,source_key,batch_id);
CREATE INDEX first_originals_v1_batch_fkey_idx
 ON jetnity_global_source_monitor_private.first_originals_v1(batch_id,dest,source_key);

DO $post$
BEGIN
 IF (SELECT count(*) FROM pg_class c JOIN pg_index i ON i.indexrelid=c.oid
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname IN ('jetnity_global_research_private','jetnity_global_source_monitor_private')
 AND c.relname IN ('cases_v1_citizenship_fkey_idx','cases_v1_rank_fkey_idx',
    'requests_v1_source_fkey_idx','first_originals_v1_batch_fkey_idx')
 AND i.indisvalid AND i.indisready AND i.indislive)<>4
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.observations_v1)<>11
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
 WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR EXISTS(SELECT 1 FROM jetnity_global_source_monitor_private.observations_v1
 WHERE approved OR published_facts<>0)
 OR (SELECT bool_and(c.relrowsecurity AND c.relforcerowsecurity AND
 NOT has_table_privilege('anon',c.oid,'SELECT') AND
 NOT has_table_privilege('authenticated',c.oid,'SELECT') AND
 NOT has_table_privilege('service_role',c.oid,'SELECT'))
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE
 n.nspname IN ('jetnity_global_research_private','jetnity_global_source_monitor_private')
 AND c.relkind='r') IS NOT TRUE
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'GLOBAL_4_FK_DEV_INDEX_POSTCHECK_REFUSED' USING ERRCODE='P7983'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;