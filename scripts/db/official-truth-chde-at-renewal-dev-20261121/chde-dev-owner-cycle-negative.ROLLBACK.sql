-- Dev PG17 only; synthetic blocked-CYCLE fixture, actual auth.sessions witness call, ROLLBACK.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='2s';
CREATE TEMP TABLE pg_temp.chde_blocked_cycle_fixture(
 id bigint PRIMARY KEY, state text NOT NULL CHECK(state IN ('blocked','published','active')),
 phase_attempts integer NOT NULL CHECK(phase_attempts BETWEEN 0 AND 8),
 last_status text NOT NULL, original_created_at timestamptz NOT NULL
) ON COMMIT DROP;
INSERT INTO pg_temp.chde_blocked_cycle_fixture VALUES
 (41,'blocked',8,'retry_budget_exhausted','2026-11-16 07:43:00+00');
CREATE TEMP TABLE pg_temp.chde_review_receipt_fixture(
 cycle_id bigint PRIMARY KEY, review_state text NOT NULL
) ON COMMIT DROP;
CREATE FUNCTION pg_temp.chde_checked_operator_recovery_v1(p_cycle_id bigint)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $test$
DECLARE expected record;
BEGIN
 SELECT * INTO STRICT expected FROM pg_temp.chde_blocked_cycle_fixture WHERE id=p_cycle_id FOR SHARE;
 IF expected.state<>'blocked' OR expected.phase_attempts<>8
   OR expected.last_status<>'retry_budget_exhausted'
 THEN RAISE EXCEPTION 'CHDE_REVIEW_WRONG_CYCLE' USING ERRCODE='42501';END IF;
 PERFORM official_v3_guard_private.owner_session_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 THEN RAISE EXCEPTION 'CHDE_BG1_NOT_HEALTHY' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_temp.chde_review_receipt_fixture
   WHERE cycle_id=p_cycle_id AND review_state='owner_reviewed_signed')
 THEN RAISE EXCEPTION 'CHDE_NO_OWNER_REVIEW_RECEIPT' USING ERRCODE='42501';END IF;
 RAISE EXCEPTION 'CHDE_NEW_ATTESTED_SCHEDULER_SUCCESSOR_NOT_INSTALLED' USING ERRCODE='42501';
END $test$;
REVOKE ALL ON FUNCTION pg_temp.chde_checked_operator_recovery_v1(bigint) FROM PUBLIC,anon,authenticated,service_role;
DO $check$
DECLARE rejected integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR (SELECT count(*) FROM pg_temp.chde_blocked_cycle_fixture WHERE state='blocked')<>1
 OR (SELECT count(*) FROM pg_temp.chde_review_receipt_fixture)<>0
 OR auth.uid() IS NOT NULL
 THEN RAISE EXCEPTION 'CHDE_DEV_NEGATIVE_REVIEW_PRECONDITION' USING ERRCODE='P7997';END IF;
 BEGIN
  PERFORM pg_temp.chde_checked_operator_recovery_v1(41);
  RAISE EXCEPTION 'CHDE_UNAUTHORIZED_OPERATOR_BYPASS' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE '42501' THEN rejected:=rejected+1;
 END;
 BEGIN
  PERFORM pg_temp.chde_checked_operator_recovery_v1(404);
  RAISE EXCEPTION 'CHDE_ABSENT_CYCLE_BYPASS' USING ERRCODE='P7997';
 EXCEPTION WHEN NO_DATA_FOUND THEN rejected:=rejected+1;
 END;
 IF rejected<>2 OR has_function_privilege('anon','pg_temp.chde_checked_operator_recovery_v1(bigint)','EXECUTE')
 OR has_function_privilege('authenticated','pg_temp.chde_checked_operator_recovery_v1(bigint)','EXECUTE')
 OR (SELECT count(*) FROM pg_temp.chde_blocked_cycle_fixture WHERE state='blocked')<>1
 THEN RAISE EXCEPTION 'CHDE_FAIL_CLOSED_GATES_NOT_PROVEN' USING ERRCODE='P7997';END IF;
END $check$;
SELECT 'DEV_CHDE_OPERATOR_REVIEW_FAIL_CLOSED_PG17_ROLLBACK_PASS' result,
 2 AS refused_missing_owner_or_wrong_cycle,
 false AS old_cycle_rewritten,
 false AS new_source_qualifications,
 false AS new_public_claims;
ROLLBACK;
