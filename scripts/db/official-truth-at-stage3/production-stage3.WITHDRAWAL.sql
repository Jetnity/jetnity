-- UNAPPLIED withdrawal. Append-only hold. Historical originals, V6 and the
-- reserved V7 marker stay. No DROP, DELETE or TRUNCATE of source history.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='20s';
SET LOCAL lock_timeout='3s';
DO $stage3_withdraw_gate$
DECLARE quals bigint; originals bigint; owners bigint; facts bigint; renew text;
BEGIN
 IF current_setting('jetnity.at_stage3_withdrawal',true) IS DISTINCT FROM
    'production:qscbgcdmivbbnzrcyegn:AT-STAGE3-WITHDRAWAL'
 OR session_user<>'postgres' OR current_user<>session_user
 OR current_setting('server_version_num')::integer/10000<>17
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)<>0
 OR NOT pg_try_advisory_xact_lock(771112,36)
 THEN RAISE EXCEPTION 'AT_STAGE3_WITHDRAWAL_PREDECESSOR_STOP' USING ERRCODE='P7997'; END IF;
 SELECT count(*) INTO quals FROM official_v3_at_production_private.ch_source_qualifications_v3;
 SELECT count(*) INTO originals FROM official_v3_at_production_private.ch_source_originals_v3;
 SELECT count(*) INTO owners FROM official_v3_at_production_private.ch_source_owner_decisions_v3;
 SELECT count(*) INTO facts FROM official_v3_at_production_private.ch_visa_facts_v3;
 SELECT command INTO renew FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1';
 INSERT INTO official_v3_at_production_private.ch_visa_publication_v3(decision) VALUES('hold');
 INSERT INTO official_v3_at_production_private.ch_stage3_renewal_hold_v1(reason) VALUES('append_only_withdrawal');
 IF (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>quals
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>originals
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_owner_decisions_v3)<>owners
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v3)<>facts
 OR (SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1') IS DISTINCT FROM renew
 OR (SELECT decision FROM official_v3_at_production_private.ch_visa_publication_v3 ORDER BY decision_seq DESC LIMIT 1)<>'hold'
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)<>1
 THEN RAISE EXCEPTION 'AT_STAGE3_WITHDRAWAL_HISTORY_DRIFT' USING ERRCODE='P7997'; END IF;
END $stage3_withdraw_gate$;
COMMIT;
