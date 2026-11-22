#!/usr/bin/env python3
"""Render fixed Dev-only SQL probes; never connects to a database.

The production generator is deliberately neither imported nor executed.
Only the literal cron.job relation in the independently reviewed shared core
is mapped to the exact private fixture relation. Existing Dev v8 is read only.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
PARENT = HERE.parent
SCHEMA = "jetnity_dev_cron_guard_probe_20261122"
JOBS = SCHEMA + ".jobs_v1"
RECEIPT = SCHEMA + ".before_v1"
CORE_PATH = PARENT / "production-http-allocator-cron-correction-20261122/cron-protection-core.sql"
SOURCE_PATH = ROOT / "docs/evidence/official-truth-production-http-allocator-cron-correction-20261122/02-production-postabort-result.json"


def sha(data: str | bytes) -> str:
    return hashlib.sha256(data.encode() if isinstance(data, str) else data).hexdigest()


def literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


core_bytes = CORE_PATH.read_bytes()
core = core_bytes.decode()
assert core.count("CREATE FUNCTION ") == 5
assert "CREATE OR REPLACE" not in core
mapped_core = core.replace("cron.job", JOBS)
candidate_directory = CORE_PATH.parent
native_definitions_path = candidate_directory / "expected-native-guard-definitions.json"
native_definitions_bytes = native_definitions_path.read_bytes()
native_definitions = json.loads(native_definitions_bytes)
catalog_definition = next(item for item in native_definitions["definitions"]
                          if item["signature"] == "official_v3_guard_private.catalog_status_v1()")
native_catalog = catalog_definition["expected_successor_native_definition"]
assert sha(native_catalog) == catalog_definition["expected_successor_definition_sha256"]
cron_select = core.split("$cron_contract$")[1].strip()
assert cron_select.startswith("SELECT ")
cron_expression = cron_select[len("SELECT "):]
assert native_catalog.count(cron_expression) == 1
for candidate_name in ["10-production-http-id.REHEARSAL-ROLLBACK.sql", "20-production-http-id.INSTALL-COMMIT.sql"]:
    assert (candidate_directory / candidate_name).read_text().count(core) == 1
source_bytes = SOURCE_PATH.read_bytes()
source = json.loads(source_bytes)
assert source["result"]["declared_target"] == "qscbgcdmivbbnzrcyegn"
assert source["status"] == "READ_ONLY_ARCHIVAL_MATCH_OBSERVED"
observed = source["result"]["cron_configurations"]
assert len(observed) == 5
commands = {
    "jetnity-at-production-source-collect-v1": "SELECT official_v3_at_production_private.collect_v1()",
    "jetnity-at-production-source-enqueue-v1": "SELECT official_v3_at_production_private.enqueue_v1()",
    "jetnity-at-production-source-renew-v1": "SELECT official_v3_at_production_private.renew_ch_v1()",
    "jetnity-ch-de-prod-import-v1": "SELECT jetnity_prod_import_scheduler.tick_v1();",
    "jetnity-official-truth-production-guard-v1": "SET statement_timeout='30s'; SET lock_timeout='25s'; SELECT official_v3_guard_private.audit_v1();",
}
seed_rows = []
row_pins = []
for job in sorted(observed, key=lambda j: j["jobid"]):
    command = commands[job["jobname"]]
    assert sha(command) == job["command_sha256"]
    assert job["active"] and job["is_localhost"] and job["expected_database"] and job["postgres_role"]
    assert job["nodeport"] == 5432
    assert job["nodename_sha256"] == sha("localhost")
    seed_rows.append("(" + ",".join([
        str(job["jobid"]), literal(job["schedule"]), literal(command),
        "'localhost'", "5432", "'postgres'", "'postgres'", "true", literal(job["jobname"]),
    ]) + ")")
    row_pins.append("(" + str(job["jobid"]) + "," + literal(job["cron_row_sha256"]) + ")")
SEEDS = ",\n".join(seed_rows)
PINS = ",\n".join(row_pins)

HEADER = """-- DEV ONLY: fixed connector target yfvbxvijcorffwxbxahl.
-- Never run against Production. SQL itself does not authenticate a project ref.
-- No real Cron DML, no HTTP/source/publisher/Owner call, no sequence advance.
-- No GRANT, REVOKE, SET ROLE, owner/role changes, extension or restart action.
-- Only this exact fixture is writable; existing Dev v8/allocator stay installed.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='20s';
SET LOCAL lock_timeout='800ms';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL transaction_timeout='30s';
DO $dev_context$
BEGIN
 IF current_database() IS DISTINCT FROM 'postgres'
 OR current_user IS DISTINCT FROM 'postgres' OR session_user IS DISTINCT FROM 'postgres'
 OR current_setting('server_version_num') IS DISTINCT FROM '170006'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR current_setting('transaction_isolation') IS DISTINCT FROM 'read committed'
 OR (SELECT extversion FROM pg_extension WHERE extname='pg_net') IS DISTINCT FROM '0.20.4'
 OR (SELECT extversion FROM pg_extension WHERE extname='pg_cron') IS DISTINCT FROM '1.6.4'
 OR to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NULL
 OR to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1') IS NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(
  'official_v3_guard_private.catalog_status_v1()')),'UTF8')),'hex')
  IS DISTINCT FROM 'a37bdaaa546ab1bcf3baac301d83de3887765ae16532f149d421a9c1dd0780c4'
 THEN RAISE EXCEPTION 'DEV_CRON_TEST_WRONG_CONTEXT' USING ERRCODE='P7998'; END IF;
 IF has_table_privilege(current_user,'cron.job','SELECT') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'cron.job','MAINTAIN') IS DISTINCT FROM false
 OR has_table_privilege(current_user,'cron.job','UPDATE') IS DISTINCT FROM false
 OR has_table_privilege(current_user,'cron.job','DELETE') IS DISTINCT FROM false
 OR has_table_privilege(current_user,'cron.job','TRUNCATE') IS DISTINCT FROM false
 THEN RAISE EXCEPTION 'DEV_CRON_TEST_EXISTING_RIGHTS_CHANGED' USING ERRCODE='P7998'; END IF;
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8)<>1
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8
  WHERE singleton AND catalog=official_v3_guard_private.catalog_status_v1())
 THEN RAISE EXCEPTION 'DEV_CRON_TEST_EXISTING_V8_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 IF (SELECT count(*) FROM (SELECT 1 FROM pg_roles LIMIT 129) s)>128
 OR (SELECT count(*) FROM (SELECT 1 FROM pg_auth_members LIMIT 513) s)>512
 OR (SELECT count(*) FROM (SELECT 1 FROM cron.job LIMIT 129) s)>128
 OR (SELECT count(*) FROM (SELECT 1 FROM official_v3_source_renewal_private.facts_v1 LIMIT 1001) s)>1000
 OR (SELECT count(*) FROM (SELECT 1 FROM official_v3_at_private.whole_originals_v2 LIMIT 17) s)>16
 THEN RAISE EXCEPTION 'DEV_CRON_TEST_METADATA_CAP' USING ERRCODE='P7998'; END IF;
END $dev_context$;
LOCK TABLE cron.job IN ACCESS SHARE MODE NOWAIT;
"""

EXISTING_STATE = r"""
CREATE FUNCTION pg_temp.dev_cron_existing_state() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $existing_state$
 SELECT jsonb_build_object(
 'catalog_sha256',encode(sha256(convert_to(official_v3_guard_private.catalog_status_v1()::text,'UTF8')),'hex'),
 'v8_sha256',(SELECT encode(sha256(convert_to(to_jsonb(b)::text,'UTF8')),'hex')
  FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 b WHERE singleton),
 'roles_sha256',(SELECT encode(sha256(convert_to(coalesce(jsonb_agg(jsonb_build_object(
  'oid',oid,'name',rolname,'super',rolsuper,'inherit',rolinherit,'create_role',rolcreaterole,
  'create_db',rolcreatedb,'login',rolcanlogin,'replication',rolreplication,
  'bypass_rls',rolbypassrls,'limit',rolconnlimit,'valid_until',rolvaliduntil,
  'config_sha256',encode(sha256(convert_to(coalesce(rolconfig::text,''),'UTF8')),'hex')
 ) ORDER BY oid),'[]'::jsonb)::text,'UTF8')),'hex') FROM pg_roles),
 'memberships_sha256',(SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(m)
  ORDER BY m.oid),'[]'::jsonb)::text,'UTF8')),'hex') FROM pg_auth_members m),
 'explicit_acls_sha256',(WITH a AS (
  SELECT 'schema:'||oid::text key,nspacl::text value FROM pg_namespace
   WHERE nspacl IS NOT NULL AND nspname NOT LIKE 'pg_temp_%'
  UNION ALL SELECT 'relation:'||c.oid::text,c.relacl::text FROM pg_class c
   JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE c.relacl IS NOT NULL AND n.nspname NOT LIKE 'pg_temp_%'
  UNION ALL SELECT 'function:'||p.oid::text,p.proacl::text FROM pg_proc p
   JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE p.proacl IS NOT NULL AND n.nspname NOT LIKE 'pg_temp_%'
  UNION ALL SELECT 'type:'||t.oid::text,t.typacl::text FROM pg_type t
   JOIN pg_namespace n ON n.oid=t.typnamespace
   WHERE t.typacl IS NOT NULL AND n.nspname NOT LIKE 'pg_temp_%'
  UNION ALL SELECT 'database:'||oid::text,datacl::text FROM pg_database WHERE datacl IS NOT NULL
  UNION ALL SELECT 'default:'||oid::text,to_jsonb(d)::text FROM pg_default_acl d
 ) SELECT encode(sha256(convert_to(coalesce(jsonb_object_agg(key,value),'{}'::jsonb)::text,'UTF8')),'hex') FROM a),
 'cron_sha256',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(j)::text,'|'
  ORDER BY jobid),''),'UTF8')),'hex') FROM cron.job j),
 'facts_sha256',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(f)::text,'|'
  ORDER BY fact_id),''),'UTF8')),'hex') FROM official_v3_source_renewal_private.facts_v1 f),
 'originals_sha256',(SELECT encode(sha256(convert_to(coalesce(string_agg(
  ((to_jsonb(o)-'original_body')||jsonb_build_object('actual_sha',encode(sha256(original_body),'hex')))::text,
  '|' ORDER BY source_id COLLATE "C"),''),'UTF8')),'hex') FROM official_v3_at_private.whole_originals_v2 o),
 'publisher_definition_sha256',encode(sha256(convert_to(pg_get_functiondef(
  'official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure),'UTF8')),'hex'),
 'allocator_definition_sha256',encode(sha256(convert_to(pg_get_functiondef(
  'jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure),'UTF8')),'hex')
 )
$existing_state$;
"""

ISOLATE = """DO $fixture_mutex$
BEGIN
 IF NOT pg_try_advisory_xact_lock(771122,8101) OR NOT pg_try_advisory_xact_lock(771122,8102)
 THEN RAISE EXCEPTION 'DEV_CRON_FIXTURE_BUSY' USING ERRCODE='P7998'; END IF;
END $fixture_mutex$;
"""

FIXTURE_SHAPE = f"""DO $fixture_shape$
BEGIN
 IF (SELECT nspowner FROM pg_namespace WHERE nspname='{SCHEMA}')
   IS DISTINCT FROM 'postgres'::regrole::oid
 OR EXISTS(SELECT 1 FROM pg_namespace n,
   LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a
   WHERE n.nspname='{SCHEMA}' AND a.grantee<>n.nspowner)
 OR (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='{SCHEMA}')<>4
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='{SCHEMA}' AND (c.relowner<>'postgres'::regrole
    OR c.relname NOT IN('jobs_v1','jobs_v1_pkey','before_v1','before_v1_pkey')
    OR c.relkind NOT IN('r','i')))
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace,
   LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
   WHERE n.nspname='{SCHEMA}' AND a.grantee<>c.relowner)
 OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='{SCHEMA}')
 OR (SELECT count(*) FROM {RECEIPT})<>1
 THEN RAISE EXCEPTION 'DEV_CRON_FIXTURE_SHAPE_OR_PRIVACY_CHANGED' USING ERRCODE='P7998'; END IF;
END $fixture_shape$;
"""

PIN_CHECK = f"""DO $fixture_pins$
BEGIN
 IF (SELECT count(*) FROM {JOBS})<>5 OR EXISTS(
  SELECT 1 FROM (VALUES {PINS}) p(jobid,expected_sha)
  LEFT JOIN {JOBS} j USING(jobid)
  WHERE encode(sha256(convert_to(to_jsonb(j)::text,'UTF8')),'hex') IS DISTINCT FROM p.expected_sha)
 THEN RAISE EXCEPTION 'DEV_CRON_FIXTURE_NOT_EXACT_OBSERVED_PRODUCTION_ROWS' USING ERRCODE='P7998'; END IF;
END $fixture_pins$;
"""

setup = HEADER + ISOLATE + EXISTING_STATE + f"""
DO $no_existing_fixture$
BEGIN
 IF to_regnamespace('{SCHEMA}') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_CRON_FIXTURE_ALREADY_EXISTS_NO_REUSE' USING ERRCODE='P7998'; END IF;
END $no_existing_fixture$;
CREATE TEMP TABLE pg_temp.dev_cron_setup_before ON COMMIT DROP AS
 SELECT pg_temp.dev_cron_existing_state() AS state;
CREATE SCHEMA {SCHEMA};
CREATE TABLE {JOBS}(
 jobid bigint PRIMARY KEY,schedule text,command text,nodename text,nodeport integer,
 database text,username text,active boolean,jobname text
);
CREATE TABLE {RECEIPT}(singleton boolean PRIMARY KEY CHECK(singleton),state jsonb NOT NULL);
INSERT INTO {JOBS}(jobid,schedule,command,nodename,nodeport,database,username,active,jobname) VALUES
{SEEDS};
INSERT INTO {RECEIPT} SELECT true,state FROM pg_temp.dev_cron_setup_before;
""" + FIXTURE_SHAPE + PIN_CHECK + f"""
DO $setup_preserves_existing$
BEGIN
 IF pg_temp.dev_cron_existing_state() IS DISTINCT FROM (SELECT state FROM {RECEIPT} WHERE singleton)
 THEN RAISE EXCEPTION 'DEV_CRON_SETUP_CHANGED_EXISTING_STATE_OR_ACL' USING ERRCODE='P7998'; END IF;
END $setup_preserves_existing$;
DROP FUNCTION pg_temp.dev_cron_existing_state();
SELECT 'DEV_CRON_PRIVATE_FIXTURE_SETUP_READY' AS result,
 true AS exact_five_archived_rows,true AS existing_state_and_rights_unchanged,
 false AS production_accessed,false AS real_cron_changed,false AS http_started;
COMMIT;
"""

# Negative cases execute native PostgreSQL operations on the exact mapped core.
# Each mutation lives in its own PL/pgSQL exception subtransaction and is rolled
# back even when the expected rejection was observed. No failed case is skipped.
negative_cases = [
    ("changed_command", f"UPDATE {JOBS} SET command='SELECT 0;' WHERE jobid=5;", "unchanged"),
    ("changed_target", f"UPDATE {JOBS} SET nodename='fixture.invalid' WHERE jobid=5;", "unchanged"),
    ("changed_active", f"UPDATE {JOBS} SET active=false WHERE jobid=5;", "unchanged"),
    ("deleted_job", f"DELETE FROM {JOBS} WHERE jobid=5;", "unchanged"),
    ("new_unrelated_job", f"INSERT INTO {JOBS} SELECT 900,schedule,command,nodename,nodeport,database,username,active,'unrelated-fixture-job' FROM {JOBS} WHERE jobid=5;", "unchanged"),
    ("duplicate_relevant_name", f"INSERT INTO {JOBS} SELECT 901,schedule,command,nodename,nodeport,database,username,active,jobname FROM {JOBS} WHERE jobid=5;", "capture"),
    ("null_command", f"UPDATE {JOBS} SET command=NULL WHERE jobid=5;", "unchanged"),
    ("row_cap_129", f"INSERT INTO {JOBS} SELECT n,'* * * * *','SELECT 0;','localhost',5432,'postgres','postgres',true,'extra-'||n::text FROM generate_series(1000,1123) n;", "cap"),
    ("row_bytes_cap", f"UPDATE {JOBS} SET command=repeat('x',65537) WHERE jobid=5;", "cap"),
]

trial_blocks = []
for name, mutation, check in negative_cases:
    action = "PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);"
    if check == "capture":
        action = "PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,pg_temp.dev_cron_fixture_catalog());"
    if check == "cap":
        action = "PERFORM pg_temp.prod_http_cron_snapshot();"
    trial_blocks.append(f"""
DO $test_{name}$
DECLARE before_snapshot jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  {mutation}
  BEGIN
   {action}
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_EXPECTED_NEGATIVE_{name.upper()}'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_NEGATIVE_DID_NOT_RESTORE_{name.upper()}' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('{name}',true);
END $test_{name}$;
""")

fixture_catalog = """
CREATE FUNCTION pg_temp.dev_cron_fixture_catalog() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $fixture_catalog$
 SELECT jsonb_build_object('unchanged_predecessor_fixture','fixed',
  'transport:production_http_id_allocator_v4',jsonb_build_object(
   'cron_contract',pg_temp.prod_http_cron_contract(),'allocator_fixture','fixed'))
$fixture_catalog$;
"""

rehearsal = HEADER + ISOLATE + EXISTING_STATE + FIXTURE_SHAPE + PIN_CHECK + f"""
LOCK TABLE {JOBS} IN ACCESS SHARE MODE NOWAIT;
-- Guard/queue locks are existing permissions; no own/legacy sequence is advanced.
DO $real_dev_barrier$
BEGIN
 IF NOT pg_try_advisory_xact_lock(771106,1)
 THEN RAISE EXCEPTION 'DEV_CRON_EXISTING_GUARD_BUSY' USING ERRCODE='P7998'; END IF;
END $real_dev_barrier$;
LOCK TABLE net.http_request_queue IN SHARE ROW EXCLUSIVE MODE NOWAIT;
CREATE TEMP TABLE pg_temp.dev_cron_existing_before ON COMMIT DROP AS SELECT
 pg_temp.dev_cron_existing_state() state,
 (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton) guard_state,
 (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1) own_sequence,
 (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM net.http_request_queue_id_seq) legacy_sequence;
CREATE TEMP TABLE pg_temp.dev_cron_results(test_name text PRIMARY KEY,passed boolean NOT NULL) ON COMMIT DROP;
""" + mapped_core + fixture_catalog + """
DO $positive$
DECLARE before_snapshot jsonb; captured jsonb;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 captured:=pg_temp.dev_cron_fixture_catalog();
 PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,captured);
 PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);
 IF jsonb_array_length(before_snapshot->'contract') IS DISTINCT FROM 5
 THEN RAISE EXCEPTION 'DEV_CRON_POSITIVE_CONTRACT_COUNT' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('unchanged_positive',true);
END $positive$;
""" + "".join(trial_blocks) + f"""
DO $update_restore$
DECLARE before_snapshot jsonb; after_snapshot jsonb; saved_command text; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 SELECT command INTO STRICT saved_command FROM {JOBS} WHERE jobid=5;
 BEGIN
  UPDATE {JOBS} SET command='SELECT 0;' WHERE jobid=5;
  UPDATE {JOBS} SET command=saved_command WHERE jobid=5;
  after_snapshot:=pg_temp.prod_http_cron_snapshot();
  IF after_snapshot->'configuration_sha256' IS DISTINCT FROM before_snapshot->'configuration_sha256'
  OR after_snapshot->'row_versions_sha256' IS NOT DISTINCT FROM before_snapshot->'row_versions_sha256'
  THEN RAISE EXCEPTION 'DEV_CRON_ABA_FIXTURE_NOT_ESTABLISHED'; END IF;
  BEGIN
   PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_UPDATE_RESTORE_WAS_ACCEPTED'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_ABA_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('update_restore_rowversion_negative',true);
END $update_restore$;
DO $unrelated_before_capture$
DECLARE initial_snapshot jsonb; with_extra jsonb;
BEGIN
 initial_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  INSERT INTO {JOBS} SELECT 900,schedule,command,nodename,nodeport,database,username,active,
   'unrelated-fixture-job' FROM {JOBS} WHERE jobid=5;
  with_extra:=pg_temp.prod_http_cron_snapshot();
  IF (with_extra->>'row_count')::integer<>6 OR jsonb_array_length(with_extra->'contract')<>5
  THEN RAISE EXCEPTION 'DEV_CRON_EXTRA_EXISTING_JOB_FIXTURE_INVALID'; END IF;
  PERFORM pg_temp.prod_http_validate_cron_capture(with_extra,pg_temp.dev_cron_fixture_catalog());
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM initial_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_EXTRA_EXISTING_JOB_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('unrelated_existing_job_preserved',true);
END $unrelated_before_capture$;
CREATE TEMP TABLE pg_temp.dev_cron_sealed_fixture(singleton boolean PRIMARY KEY,catalog jsonb) ON COMMIT DROP;
DO $single_capture$
DECLARE before_snapshot jsonb; captured jsonb; late_catalog jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 captured:=pg_temp.dev_cron_fixture_catalog();
 PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,captured);
 BEGIN
  UPDATE {JOBS} SET command='SELECT 0;' WHERE jobid=5;
  late_catalog:=pg_temp.dev_cron_fixture_catalog();
  IF late_catalog IS NOT DISTINCT FROM captured
  THEN RAISE EXCEPTION 'DEV_CRON_LATE_DRIFT_FIXTURE_INVALID'; END IF;
  -- Exactly the validated variable is stored; there is no second live capture.
  INSERT INTO pg_temp.dev_cron_sealed_fixture VALUES(true,captured);
  IF (SELECT catalog FROM pg_temp.dev_cron_sealed_fixture WHERE singleton) IS DISTINCT FROM captured
  OR (SELECT catalog FROM pg_temp.dev_cron_sealed_fixture WHERE singleton) IS NOT DISTINCT FROM late_catalog
  THEN RAISE EXCEPTION 'DEV_CRON_UNVALIDATED_LATE_CATALOG_WAS_STORED'; END IF;
  BEGIN
   PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,late_catalog);
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_LATE_CAPTURE_WAS_ACCEPTED'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 OR EXISTS(SELECT 1 FROM pg_temp.dev_cron_sealed_fixture)
 THEN RAISE EXCEPTION 'DEV_CRON_SINGLE_CAPTURE_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('late_drift_never_adopted_by_sealed_fixture',true);
END $single_capture$;
DO $null_capture$
DECLARE before_snapshot jsonb; rejected_count integer:=0; malformed jsonb;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN PERFORM pg_temp.prod_http_validate_cron_capture(NULL,pg_temp.dev_cron_fixture_catalog());
 EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected_count:=rejected_count+1; END;
 BEGIN PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,NULL);
 EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected_count:=rejected_count+1; END;
 BEGIN PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,'{{}}'::jsonb);
 EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected_count:=rejected_count+1; END;
 FOR malformed IN SELECT v FROM (VALUES
  ('{{"contract":{{}}}}'::jsonb),('{{"contract":"scalar"}}'::jsonb),
  ('{{"contract":null}}'::jsonb),('{{"contract":[]}}'::jsonb)) shape(v)
 LOOP
  BEGIN PERFORM pg_temp.prod_http_validate_cron_capture(malformed,pg_temp.dev_cron_fixture_catalog());
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected_count:=rejected_count+1; END;
 END LOOP;
 IF rejected_count<>7 THEN RAISE EXCEPTION 'DEV_CRON_NULL_OR_MALFORMED_CAPTURE_ACCEPTED' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('null_missing_and_malformed_capture_fail_closed',true);
END $null_capture$;
DO $final_preservation$
DECLARE b pg_temp.dev_cron_existing_before%ROWTYPE;
BEGIN
 SELECT * INTO STRICT b FROM pg_temp.dev_cron_existing_before;
 IF pg_temp.dev_cron_existing_state() IS DISTINCT FROM b.state
 OR (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton) IS DISTINCT FROM b.guard_state
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM b.own_sequence
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM net.http_request_queue_id_seq) IS DISTINCT FROM b.legacy_sequence
 OR (SELECT count(*) FROM pg_temp.dev_cron_results)<>14
 OR EXISTS(SELECT 1 FROM pg_temp.dev_cron_results WHERE passed IS DISTINCT FROM true)
 THEN RAISE EXCEPTION 'DEV_CRON_REHEARSAL_PRESERVATION_OR_TEST_COUNT_FAILED' USING ERRCODE='P7998'; END IF;
END $final_preservation$;
SELECT 'DEV_CRON_SHARED_CORE_REHEARSAL_ROLLBACK_PASS' AS result,
 (SELECT jsonb_agg(test_name ORDER BY test_name) FROM pg_temp.dev_cron_results) AS passed_tests,
 14 AS passed_count,true AS live_v8_roles_acls_facts_originals_and_counters_preserved,
 false AS production_installer_executed,false AS real_cron_changed,false AS http_started,
 false AS physical_cron_freeze_proven,false AS entire_concurrent_history_observed;
ROLLBACK;
"""

writer = HEADER + FIXTURE_SHAPE + PIN_CHECK + f"""
SET LOCAL application_name='jetnity-dev-cron-fixture-writer-20261122';
DO $writer_mutex$
BEGIN
 IF NOT pg_try_advisory_xact_lock(771122,8101)
 THEN RAISE EXCEPTION 'DEV_CRON_WRITER_ALREADY_RUNNING' USING ERRCODE='P7998'; END IF;
END $writer_mutex$;
-- Explicitly compatible with the reader's ACCESS SHARE; this is the race tested.
LOCK TABLE {JOBS} IN ROW EXCLUSIVE MODE NOWAIT;
UPDATE {JOBS} SET command='SELECT 0;' WHERE jobid=5;
DO $wait_for_reader_observation$
DECLARE deadline timestamptz:=clock_timestamp()+interval '10 seconds';
BEGIN
 LOOP
  EXIT WHEN EXISTS(SELECT 1 FROM pg_locks l WHERE l.locktype='advisory'
   AND l.database=(SELECT oid FROM pg_database WHERE datname=current_database())
   AND l.classid=771122 AND l.objid=8103 AND l.objsubid=2 AND l.granted
   AND l.pid IS DISTINCT FROM pg_backend_pid()
   AND EXISTS(SELECT 1 FROM pg_locks r WHERE r.locktype='advisory' AND r.pid=l.pid
    AND r.database=l.database AND r.classid=771122 AND r.objid=8102 AND r.objsubid=2 AND r.granted));
  IF clock_timestamp()>=deadline
  THEN RAISE EXCEPTION 'DEV_CRON_READER_HANDSHAKE_NOT_OBSERVED' USING ERRCODE='P7998'; END IF;
  PERFORM pg_sleep(0.025);
 END LOOP;
END $wait_for_reader_observation$;
SELECT 'DEV_CRON_CONCURRENT_WRITER_OBSERVED_AND_ROLLED_BACK' AS result,
 false AS committed,false AS real_cron_changed,false AS http_started;
ROLLBACK;
"""

reader = HEADER + FIXTURE_SHAPE + mapped_core + f"""
SET LOCAL application_name='jetnity-dev-cron-fixture-reader-20261122';
DO $reader_mutex$
BEGIN
 IF NOT pg_try_advisory_xact_lock(771122,8102)
 THEN RAISE EXCEPTION 'DEV_CRON_READER_ALREADY_RUNNING' USING ERRCODE='P7998'; END IF;
END $reader_mutex$;
LOCK TABLE {JOBS} IN ACCESS SHARE MODE NOWAIT;
DO $concurrent_refusal$
DECLARE deadline timestamptz:=clock_timestamp()+interval '10 seconds';
 rejected boolean:=false;
BEGIN
 LOOP
  EXIT WHEN pg_temp.prod_http_cron_writers_absent() IS DISTINCT FROM true
   AND EXISTS(SELECT 1 FROM pg_locks w WHERE w.locktype='relation'
    AND w.database=(SELECT oid FROM pg_database WHERE datname=current_database())
    AND w.relation='{JOBS}'::regclass AND w.mode='RowExclusiveLock' AND w.granted
    AND w.pid IS DISTINCT FROM pg_backend_pid()
    AND EXISTS(SELECT 1 FROM pg_locks m WHERE m.locktype='advisory' AND m.pid=w.pid
     AND m.database=w.database AND m.classid=771122 AND m.objid=8101 AND m.objsubid=2 AND m.granted));
  IF clock_timestamp()>=deadline
  THEN RAISE EXCEPTION 'DEV_CRON_CONCURRENT_WRITER_NOT_OBSERVED' USING ERRCODE='P7998'; END IF;
  PERFORM pg_sleep(0.025);
 END LOOP;
 BEGIN
  PERFORM pg_temp.prod_http_cron_snapshot();
 EXCEPTION WHEN SQLSTATE 'P7998' THEN
  IF SQLERRM IS DISTINCT FROM 'PROD_HTTP_CRON_WRITER_OBSERVED' THEN RAISE; END IF;
  rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_CONCURRENT_WRITER_ACCEPTED' USING ERRCODE='P7998'; END IF;
 -- Transactional acknowledgement is acquired only after actual native refusal.
 IF NOT pg_try_advisory_xact_lock(771122,8103)
 THEN RAISE EXCEPTION 'DEV_CRON_READER_ACK_ALREADY_HELD' USING ERRCODE='P7998'; END IF;
 deadline:=clock_timestamp()+interval '10 seconds';
 LOOP
  EXIT WHEN pg_temp.prod_http_cron_writers_absent() IS TRUE;
  IF clock_timestamp()>=deadline
  THEN RAISE EXCEPTION 'DEV_CRON_WRITER_ROLLBACK_NOT_OBSERVED' USING ERRCODE='P7998'; END IF;
  PERFORM pg_sleep(0.025);
 END LOOP;
 IF jsonb_array_length(pg_temp.prod_http_cron_snapshot()->'contract') IS DISTINCT FROM 5
 THEN RAISE EXCEPTION 'DEV_CRON_POSTWRITER_POSITIVE_FAILED' USING ERRCODE='P7998'; END IF;
END $concurrent_refusal$;
""" + PIN_CHECK + """
SELECT 'DEV_CRON_CONCURRENT_WRITER_REFUSAL_AND_RECOVERY_PASS' AS result,
 true AS access_share_and_writer_were_concurrent,true AS exact_core_refused_other_pid_writer,
 true AS writer_rollback_observed,true AS fixture_original_rows_restored,
 false AS real_cron_changed,false AS http_started,false AS physical_cron_freeze_proven;
ROLLBACK;
"""

cleanup = HEADER + ISOLATE + EXISTING_STATE + f"""
-- This cleanup is safe after any earlier failed file. Existing foreign objects
-- cause STOP; no CASCADE, no broad cleanup and no unreviewed identifier input.
CREATE TEMP TABLE pg_temp.dev_cron_cleanup_state(before_state jsonb,had_fixture boolean) ON COMMIT DROP;
DO $cleanup_exact_fixture$
DECLARE state_before jsonb;
BEGIN
 IF to_regnamespace('{SCHEMA}') IS NULL THEN
  INSERT INTO pg_temp.dev_cron_cleanup_state VALUES(pg_temp.dev_cron_existing_state(),false);
  RETURN;
 END IF;
 IF (SELECT nspowner FROM pg_namespace WHERE nspname='{SCHEMA}') IS DISTINCT FROM 'postgres'::regrole::oid
 OR (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='{SCHEMA}')<>4
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='{SCHEMA}' AND (c.relowner<>'postgres'::regrole
   OR c.relname NOT IN('jobs_v1','jobs_v1_pkey','before_v1','before_v1_pkey')))
 OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='{SCHEMA}')
 THEN RAISE EXCEPTION 'DEV_CRON_CLEANUP_UNEXPECTED_OBJECTS_STOP' USING ERRCODE='P7998'; END IF;
 SELECT state INTO STRICT state_before FROM {RECEIPT} WHERE singleton;
 IF state_before IS DISTINCT FROM pg_temp.dev_cron_existing_state()
 THEN RAISE EXCEPTION 'DEV_CRON_CLEANUP_EXISTING_STATE_CHANGED_STOP' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_cleanup_state VALUES(state_before,true);
 DROP TABLE {JOBS};
 DROP TABLE {RECEIPT};
 DROP SCHEMA {SCHEMA};
END $cleanup_exact_fixture$;
DO $cleanup_post$
BEGIN
 IF to_regnamespace('{SCHEMA}') IS NOT NULL
 OR pg_temp.dev_cron_existing_state() IS DISTINCT FROM (SELECT before_state FROM pg_temp.dev_cron_cleanup_state)
 THEN RAISE EXCEPTION 'DEV_CRON_CLEANUP_ABSENCE_OR_PRESERVATION_FAILED' USING ERRCODE='P7998'; END IF;
END $cleanup_post$;
DROP FUNCTION pg_temp.dev_cron_existing_state();
SELECT 'DEV_CRON_PRIVATE_FIXTURE_CLEANUP_READY_TO_COMMIT' AS result,
 (SELECT had_fixture FROM pg_temp.dev_cron_cleanup_state) AS fixture_was_present,
 true AS exact_fixture_absent_before_commit,true AS existing_state_and_rights_preserved,
 false AS production_accessed,false AS real_cron_changed,false AS http_started;
COMMIT;
-- Root must independently read actual post-commit absence; pre-commit output
-- alone is deliberately not called a durable cleanup proof.
"""

files = {
    "00-setup-private-fixture.DEV-COMMIT.sql": setup,
    "10-shared-core-rehearsal.DEV-ROLLBACK.sql": rehearsal,
    "20-concurrent-writer.DEV-ROLLBACK.sql": writer,
    "21-concurrent-reader.DEV-ROLLBACK.sql": reader,
    "30-cleanup-private-fixture.DEV-COMMIT.sql": cleanup,
}
for name, value in files.items():
    (HERE / name).write_text(value)

manifest = {
    "package": "DEV_CRON_GUARD_VALIDATION_20261122",
    "target": "yfvbxvijcorffwxbxahl",
    "execution_status": "NOT_EXECUTED",
    "native_parser_status": "NOT_RUN",
    "core_path": str(CORE_PATH.relative_to(ROOT)),
    "core_sha256": sha(core_bytes),
    "core_mapping": {"from": "cron.job", "to": JOBS, "literal_replacement_count": core.count("cron.job")},
    "mapped_core_sha256": sha(mapped_core),
    "durable_catalog_expression_binding": {
        "source": str(native_definitions_path.relative_to(ROOT)),
        "source_sha256": sha(native_definitions_bytes),
        "native_catalog_definition_sha256": sha(native_catalog),
        "exact_shared_expression_sha256": sha(cron_expression),
        "exact_occurrences_in_native_catalog_definition": native_catalog.count(cron_expression),
        "native_core_expression_tested_via_shared_function": True,
        "whole_production_catalog_function_executed_in_dev": False,
    },
    "fixture_receipt_source": str(SOURCE_PATH.relative_to(ROOT)),
    "fixture_receipt_source_sha256": sha(source_bytes),
    "files": [{"file": name, "sha256": sha(value), "bytes": len(value.encode())} for name, value in files.items()],
    "required_order": ["00", "10", "20 and 21 concurrently", "30 even after failure", "independent Root post-commit read"],
    "claims_excluded": ["Production installer runtime", "new Production authorization", "real Cron DML freeze", "all intermediate ABA histories observed", "HTTP/positive renewal", "unexecuted tests passed"],
    "writes": ["new exact private fixture schema and two tables", "fixture rows only", "session-local temporary test helpers/results"],
    "existing_role_acl_changes": False,
    "existing_dev_v8_modified": False,
}
(HERE / "MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps({"rendered_files": len(files), "core_sha256": sha(core_bytes), "execution_status": "NOT_EXECUTED"}))
