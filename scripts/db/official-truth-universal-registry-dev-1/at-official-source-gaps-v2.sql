-- DEV ONLY. Source candidates for AT gaps, not legal facts or public answers.
-- Reviewed official AT primary domains 2026-11-19; ETIAS not yet in operation.
-- Reisegesundheit is not evidence of an AT vaccination entry requirement.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='50s';
SET LOCAL jetnity.at_gap_target='dev:yfvbxvijcorffwxbxahl:AT-GAPS-V2';
DO $apply$
DECLARE id text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_gap_target',true)
     IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-GAPS-V2'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>23
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='AT')<>7
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>4
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>3
 OR (SELECT count(*) FROM jetnity_source_registry_private.topic_scope_v1
     WHERE source_id='AT:bmeia-visa-fees')<>9
 OR (SELECT research_sourced_slots FROM jetnity_release_review_private.rollout_counts_v1
     WHERE destination_code='AT')<>1000
 OR NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='jetnity-global-source-review-queue-dev'
    AND active AND username='postgres' AND schedule='*/5 * * * *'
    AND command='SELECT jetnity_source_dispatch_private.tick_v1()')
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,776)
 THEN RAISE EXCEPTION 'AT_SOURCE_GAPS_PREDECESSOR_REFUSED' USING ERRCODE='P7996'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();

 -- Explicit BMEIA fraud warnings are first-party Austrian ministry content,
 -- not a presumption about any particular visa's cost or required form.
 INSERT INTO jetnity_source_registry_private.topic_scope_v1(source_id,topic)
 VALUES ('AT:bmeia-visa-fees','fraud_warnings');

 id:=jetnity_source_registry_private.register_research_source_v1(
 'AT','bmi-etias-information',
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/information_zu_etias/start.html',
 ARRAY['electronic_travel_authorization','entry_forms','recent_changes','official_actions']::text[],720);
 IF id<>'AT:bmi-etias-information' THEN RAISE EXCEPTION 'AT_ETIAS_NOT_REGISTERED'; END IF;

 id:=jetnity_source_registry_private.register_research_source_v1(
 'AT','bmi-entry-exit-system',
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/entry_exit_system/start.html',
 ARRAY['recent_changes','transit','dual_nationals','stay_limit']::text[],720);
 IF id<>'AT:bmi-entry-exit-system' THEN RAISE EXCEPTION 'AT_EES_NOT_REGISTERED'; END IF;

 id:=jetnity_source_registry_private.register_research_source_v1(
 'AT','sozial-into-austria',
 'https://www.sozialministerium.gv.at/Themen/Gesundheit/Reiseinformationen/Reisen-nach-%C3%96sterreich.html',
 ARRAY['health_measures','health_documents','customs']::text[],1440);
 IF id<>'AT:sozial-into-austria' THEN RAISE EXCEPTION 'AT_HEALTH_NOT_REGISTERED'; END IF;

 -- BMI already vetted; only the new Austrian government host is admitted.
 PERFORM jetnity_source_dispatch_private.admit_host_v1('AT','www.sozialministerium.gv.at');
 PERFORM jetnity_source_dispatch_private.admit_source_v1(
 'AT:bmi-etias-information',
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/information_zu_etias/start.html');
 PERFORM jetnity_source_dispatch_private.admit_source_v1(
 'AT:bmi-entry-exit-system',
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/entry_exit_system/start.html');
 PERFORM jetnity_source_dispatch_private.admit_source_v1(
 'AT:sozial-into-austria',
 'https://www.sozialministerium.gv.at/Themen/Gesundheit/Reiseinformationen/Reisen-nach-%C3%96sterreich.html');

 IF (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>26
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='AT')<>10
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>1300
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>7
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>4
 OR (SELECT count(*) FROM jetnity_source_registry_private.topic_scope_v1
     WHERE source_id='AT:bmeia-visa-fees')<>10
 OR (SELECT research_sourced_slots FROM jetnity_release_review_private.rollout_counts_v1
     WHERE destination_code='AT')<>1200
 OR (SELECT unsupported_slots FROM jetnity_release_review_private.rollout_counts_v1
     WHERE destination_code='AT')<>100
 OR EXISTS(SELECT 1 FROM jetnity_release_review_private.passport_topic_status_v1
     WHERE customer_answer<>'derzeit nicht verfügbar' OR rule_verified
        OR rule_publishable OR accepted_facts<>0)
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_SOURCE_GAPS_POSTCHECK_ROLLBACK' USING ERRCODE='P7996'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $apply$;
COMMIT;
