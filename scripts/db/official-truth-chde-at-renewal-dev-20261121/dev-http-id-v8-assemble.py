from pathlib import Path
import hashlib
import re

SQL = Path(__file__).resolve().parent
FRAGMENTS = SQL / 'dev-http-id-v8-review'
r1 = (SQL / 'dev-pgnet-owned-allocator-trigger-rehearsal.ROLLBACK.sql').read_text()
helper = (SQL / 'dev-pgnet-owned-allocator-assign-request-id-v1.SD.sql').read_text()
assert hashlib.sha256(helper.encode()).hexdigest() == '7a2fba345aeccef648d0c37a0092cc923a47e3e21557a98e0acc338c607a5c29'
helper = helper[helper.index('CREATE FUNCTION'):]
prefix = r1[r1.index('BEGIN TRANSACTION'):r1.index('SAVEPOINT dev_allocator_install;')]
guard_lock = "\nDO $guard_lock_first$ BEGIN\n IF NOT pg_try_advisory_xact_lock(771106,1) THEN\n  RAISE EXCEPTION 'DEV_HTTP_V8_GUARD_BUSY' USING ERRCODE='P7998';\n END IF;\nEND $guard_lock_first$;\n"
prefix = prefix.replace("SET LOCAL idle_in_transaction_session_timeout='30s';", "SET LOCAL idle_in_transaction_session_timeout='30s';" + guard_lock)
core = r1[r1.index('CREATE SCHEMA jetnity_pgnet_allocator_private'):r1.index('DO $allocator_insert_probe$')]
fn_start = core.index('CREATE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1()')
trig_start = core.index('CREATE TRIGGER jetnity_pgnet_request_id_v1')
core = core[:fn_start] + helper + core[trig_start:]
core = core.replace('FROM PUBLIC,anon,authenticated,service_role;', 'FROM PUBLIC,anon,authenticated,service_role,supabase_functions_admin,supabase_read_only_user;')
pre = (FRAGMENTS / 'dev-http-id-v8-guard.PRE.sql').read_text()
post = (FRAGMENTS / 'dev-http-id-v8-guard.POST.sql').read_text()
assert "16151e29d3859b8574afcc934c2fa4cc6709c82280697e34474b41f711801afa" in post
assert "net.http_delete(text,jsonb,jsonb,integer,jsonb)" in pre
assert 'R2_TAIL_PENDING' not in post
negative = (FRAGMENTS / 'dev-http-id-v8-guard.NEGATIVE.sql').read_text()
assert 'COMMIT;' not in negative
header = """-- DEV ONLY: own LOGGED HTTP allocator + exact BG1 v8 successor.
-- Root assembly of separately reviewed, source-pinned fragments.
-- First execution is a complete transactional rehearsal; no HTTP or source call.
-- Scope: regular pg_net API producers in origin/local, not replica/direct UPDATE.
-- Managed table/sequence ownership, default and public API remain unchanged.
-- Production is excluded. Exact executed bytes and results live in evidence.
"""
rollback_end = """
ROLLBACK TO SAVEPOINT dev_http_v8_install;
DO $v8_full_rollback$
BEGIN
 IF to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NOT NULL
 OR pg_temp.dev_allocator_runtime_state() IS DISTINCT FROM
   (SELECT state FROM pg_temp.dev_allocator_before WHERE singleton)
 OR pg_temp.dev_http_v8_data() IS DISTINCT FROM
   (SELECT protected_data FROM pg_temp.dev_http_v8_before WHERE singleton)
 OR (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton) IS DISTINCT FROM
   (SELECT guard_state FROM pg_temp.dev_http_v8_before WHERE singleton)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_FULL_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current' THEN
  RAISE EXCEPTION 'DEV_HTTP_V8_ORIGINAL_GUARD_NOT_CURRENT' USING ERRCODE='P7998'; END IF;
END $v8_full_rollback$;
SELECT 'DEV_HTTP_ID_ALLOCATOR_V8_FULL_REHEARSAL_ROLLBACK_PASS' AS result,
 (SELECT historical_max::text FROM pg_temp.dev_allocator_before WHERE singleton) AS historical_high_water,
 (SELECT first_unused::text FROM pg_temp.dev_allocator_before WHERE singleton) AS allocator_seed,
 true AS original_guard_catalog_latch_sources_facts_restored,
 true AS allocator_and_v8_removed,true AS original_managed_sequence_unchanged,
 false AS network_delivery_tested,false AS persistent_install,false AS production_accessed;
ROLLBACK;
"""
rehearsal = header + prefix + pre + '\nSAVEPOINT dev_http_v8_install;\n' + core + post + negative + rollback_end
(SQL / 'dev-pgnet-owned-allocator-v8.REHEARSAL-ROLLBACK.sql').write_text(rehearsal)
install_end = """
DO $install_allocator_unused$
DECLARE expected bigint;
BEGIN
 SELECT first_unused INTO STRICT expected FROM pg_temp.dev_allocator_before WHERE singleton;
 IF (SELECT last_value FROM jetnity_pgnet_allocator_private.http_request_id_v1)<>expected
 OR (SELECT is_called FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM false
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
     FROM net.http_request_queue_id_seq) IS DISTINCT FROM
   (SELECT state->'legacy_sequence' FROM pg_temp.dev_allocator_before WHERE singleton)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_INSTALL_CONSUMED_OR_CHANGED_SEQUENCE' USING ERRCODE='P7998'; END IF;
END $install_allocator_unused$;
SELECT 'DEV_HTTP_ID_ALLOCATOR_V8_INSTALL_READY_FOR_COMMIT' AS result,
 (SELECT first_unused::text FROM pg_temp.dev_allocator_before WHERE singleton) AS allocator_seed,
 false AS new_http_request_started,false AS new_visa_fact,
 false AS fresh_fullproof_observed,false AS production_accessed;
COMMIT;
"""
installer = header + prefix + pre + core + post + install_end
(SQL / 'dev-pgnet-owned-allocator-v8.INSTALL-DEV-COMMIT.sql').write_text(installer)
for name in ('dev-pgnet-owned-allocator-v8.REHEARSAL-ROLLBACK.sql','dev-pgnet-owned-allocator-v8.INSTALL-DEV-COMMIT.sql'):
 p = SQL / name
 print(name, len(p.read_bytes()), hashlib.sha256(p.read_bytes()).hexdigest())
