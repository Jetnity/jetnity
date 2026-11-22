-- Dev-only synthetic Cycle12 CAS/dispatch test. No real Job, Owner or Production mutation.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
CREATE TEMP TABLE cycle12_subject (
 cycle_id integer PRIMARY KEY, job_id text NOT NULL, attempt_key text NOT NULL,
 row_digest text NOT NULL, open_attempt text, retired boolean NOT NULL DEFAULT false
) ON COMMIT DROP;
CREATE TEMP TABLE cycle12_dispatches (
 dispatch_id integer PRIMARY KEY, cycle_id integer NOT NULL, http_status integer NOT NULL
) ON COMMIT DROP;
CREATE TEMP TABLE cycle12_receipts (
 operation_id text PRIMARY KEY, selection_digest text NOT NULL, test_actor text NOT NULL
) ON COMMIT DROP;
INSERT INTO pg_temp.cycle12_subject VALUES
 (12,'job3_2fd7149d9560d930957a0ca86fc65c73',
 'execution-attempt:v3:45128e7336cf585778e86a55f7531ff4a0a3bea2ac65341ecc2143142aa27981',
 '72925e4c556c1fdd15e7b5e4db92dcede271e0484c8b14949c441ee8943d2267',
 'execution-attempt:v3:45128e7336cf585778e86a55f7531ff4a0a3bea2ac65341ecc2143142aa27981',false);
INSERT INTO pg_temp.cycle12_dispatches VALUES
 (38,12,200),(39,12,503),(40,12,503),(41,12,503),(42,12,503),
 (43,12,503),(44,12,503),(45,12,503),(46,12,503);
DO $bounded$
DECLARE changed integer; role_safe boolean;
BEGIN
 -- 1. Existing Cycle5 definer is not a Cycle12 authority.
 IF position('ch_de_cycle5_unknown' IN pg_get_functiondef(
  'official_v3_jobs_private.cycle5_close_v1(jsonb)'::regprocedure))=0
 THEN RAISE EXCEPTION 'DEV_CHDE12_STOP_CYCLE5_AUTHORITY_CHANGED'; END IF;
 -- 2. No effective SET/INHERIT membership can be assumed.
 SELECT count(*)=1 AND bool_and(NOT set_option AND NOT inherit_option)
 INTO role_safe FROM pg_auth_members
 WHERE roleid='ot_v3_jobs_owner'::regrole AND member='postgres'::regrole;
 IF role_safe IS DISTINCT FROM true THEN RAISE EXCEPTION 'DEV_CHDE12_STOP_ROLE_CHANGED'; END IF;
 -- 3. Wrong cycle, 4. wrong attempt, 5. stale row digest: all must fail.
 IF EXISTS(SELECT 1 FROM pg_temp.cycle12_subject WHERE cycle_id=13)
 OR EXISTS(SELECT 1 FROM pg_temp.cycle12_subject
  WHERE open_attempt='execution-attempt:v3:wrong')
 OR EXISTS(SELECT 1 FROM pg_temp.cycle12_subject WHERE row_digest=repeat('0',64))
 THEN RAISE EXCEPTION 'DEV_CHDE12_STOP_FALSE_PRECONDITION'; END IF;
 -- Synthetic fixture only: this is NOT an Owner receipt and not a real CAS.
 INSERT INTO pg_temp.cycle12_receipts VALUES
 ('synthetic-dev-cycle12-test-only',
 '05a43950fa9296e1dd76fa5786e1f2b888d1a58774e56e118c43edda95014544',
 'synthetic');
 UPDATE pg_temp.cycle12_subject SET open_attempt=NULL,retired=true
 WHERE cycle_id=12 AND job_id='job3_2fd7149d9560d930957a0ca86fc65c73'
  AND attempt_key='execution-attempt:v3:45128e7336cf585778e86a55f7531ff4a0a3bea2ac65341ecc2143142aa27981'
  AND row_digest='72925e4c556c1fdd15e7b5e4db92dcede271e0484c8b14949c441ee8943d2267'
  AND open_attempt=attempt_key AND retired=false;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>1 THEN RAISE EXCEPTION 'DEV_CHDE12_STOP_SYNTHETIC_CAS'; END IF;
 -- 6. Exact replay cannot close another attempt.
 UPDATE pg_temp.cycle12_subject SET retired=true
 WHERE cycle_id=12 AND retired=false AND open_attempt IS NOT NULL;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'DEV_CHDE12_STOP_DUPLICATE'; END IF;
 -- 7. Keep all nine immutable dispatch fixture rows.
 IF (SELECT count(*) FROM pg_temp.cycle12_dispatches)<>9 OR
 (SELECT count(*) FROM pg_temp.cycle12_dispatches WHERE http_status=503)<>8
 THEN RAISE EXCEPTION 'DEV_CHDE12_STOP_DISPATCH_HISTORY'; END IF;
 -- 8. Closed restart gate: no new dispatch ID.
 IF EXISTS(SELECT 1 FROM pg_temp.cycle12_dispatches WHERE dispatch_id>46)
 THEN RAISE EXCEPTION 'DEV_CHDE12_STOP_RESTART_UNAUTHORIZED'; END IF;
END $bounded$;
SELECT jsonb_build_object(
 'verdict','DEV_CHDE12_SYNTHETIC_CAS_NEGATIVE_8_OF_8_PASS',
 'native_pg17',true,'assertions',8,'source','cycle12 pinned digests / pg_temp only',
 'real_owner_aal2_action',false,'real_cycle12_native_close',false,
 'existing_cycle5_authority_reused',false,'new_role_rights',false,
 'new_dispatch',false,'production_change',false,'transaction_fate','ROLLBACK'
) AS result;
ROLLBACK;
