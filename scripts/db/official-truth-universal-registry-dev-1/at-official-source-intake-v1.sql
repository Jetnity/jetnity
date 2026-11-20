-- DEV ONLY, additive generic intake of official Austrian research pages.
-- No new country-specific monitor or legal facts. Run after registry + dispatcher.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.at_source_target='dev:yfvbxvijcorffwxbxahl:AT-SOURCE-BATCH-V1';
DO $batch$
DECLARE id text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_source_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-SOURCE-BATCH-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>19
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>0
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.requests_v1)<>0
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-global-source-review-queue-dev'
  AND active AND command='SELECT jetnity_source_dispatch_private.tick_v1()')<>1
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
  WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,774)
 THEN RAISE EXCEPTION 'AT_SOURCE_BATCH_DEV_PREDECESSOR_REQUIRED' USING ERRCODE='P7995'; END IF;

 id:=jetnity_source_registry_private.register_research_source_v1(
  'AT','bmi-border-entry',
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/einreise/start.html',
  ARRAY['visa','passport','passport_validity','dual_nationals','financial_means','onward_return_ticket','booking_or_travel_document','stay_limit']::text[],720);
 IF id<>'AT:bmi-border-entry' THEN RAISE EXCEPTION 'AT_SOURCE_1'; END IF;
 id:=jetnity_source_registry_private.register_research_source_v1(
  'AT','bmi-child-entry',
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start-2.html',
  ARRAY['minors','parental_consent','identity_document','passport_validity','financial_means','onward_return_ticket']::text[],720);
 IF id<>'AT:bmi-child-entry' THEN RAISE EXCEPTION 'AT_SOURCE_2'; END IF;
 id:=jetnity_source_registry_private.register_research_source_v1(
  'AT','bmeia-visa-fees',
  'https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/',
  ARRAY['visa','entry_forms','form_costs','entry_fees','official_actions']::text[],720);
 IF id<>'AT:bmeia-visa-fees' THEN RAISE EXCEPTION 'AT_SOURCE_3'; END IF;
 id:=jetnity_source_registry_private.register_research_source_v1(
  'AT','bmf-customs-travel',
  'https://www.bmf.gv.at/themen/zoll/reise/einreise-aus-nicht-eu-staaten/freimengen-freigrenze.html',
  ARRAY['customs']::text[],1440);
 IF id<>'AT:bmf-customs-travel' THEN RAISE EXCEPTION 'AT_SOURCE_4'; END IF;

 PERFORM jetnity_source_dispatch_private.admit_host_v1('AT','www.bmi.gv.at');
 PERFORM jetnity_source_dispatch_private.admit_host_v1('AT','www.bmeia.gv.at');
 PERFORM jetnity_source_dispatch_private.admit_host_v1('AT','www.bmf.gv.at');
 PERFORM jetnity_source_dispatch_private.admit_source_v1('AT:bmi-border-entry',
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/einreise/start.html');
 PERFORM jetnity_source_dispatch_private.admit_source_v1('AT:bmi-child-entry',
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start-2.html');
 PERFORM jetnity_source_dispatch_private.admit_source_v1('AT:bmeia-visa-fees',
  'https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/');
 PERFORM jetnity_source_dispatch_private.admit_source_v1('AT:bmf-customs-travel',
  'https://www.bmf.gv.at/themen/zoll/reise/einreise-aus-nicht-eu-staaten/freimengen-freigrenze.html');
 IF (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>23
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='AT')<>7
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>3
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>4
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>1150
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_SOURCE_BATCH_POSTCHECK_ROLLBACK' USING ERRCODE='P7995'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $batch$;
COMMIT;