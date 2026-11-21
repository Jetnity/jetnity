#!/usr/bin/env python3
"""Build review-only BG1 v8 PRE/POST fragments from exact live v7 definitions.

No database or network calls; writes only the requested review files. Compose PRE, the independently
reviewed transport DDL (without COMMIT), then POST inside one outer transaction.
The first assembled run must ROLLBACK. This factory neither installs the
allocator nor claims the TRIGGER/cleanup/worker permission probes passed.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import re
from pathlib import Path


def sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def once(source: str, old: str, new: str) -> str:
    if source.count(old) != 1:
        raise ValueError(f"Expected exactly one transformation anchor: {old[:100]!r}")
    return source.replace(old, new, 1)


BASE = Path(__file__).resolve().parent
REPO = BASE.parents[2]
EVIDENCE = REPO / 'docs/evidence/official-truth-renewal-20261121'
PARSER = argparse.ArgumentParser(description=__doc__)
PARSER.add_argument('--definitions', type=Path,
                    default=EVIDENCE / 'dev-http-id-v8-live-guard-definitions.json')
PARSER.add_argument('--transport-draft', type=Path,
                    default=EVIDENCE / 'dev-pgnet-owned-trigger-rehearsal-attempt1.sql')
PARSER.add_argument('--helper-source', type=Path,
                    default=BASE / 'dev-pgnet-owned-allocator-assign-request-id-v1.SD.sql')
PARSER.add_argument('--out-dir', type=Path,
                    default=BASE / 'dev-http-id-v8-review')
PARSER.add_argument('--allocator-usage-role', action='append', default=[],
                    help='Explicitly reviewed extra role allowed only USAGE on new schema/sequence; default none.')
PARSER.add_argument('--helper-security-mode', choices=('invoker', 'definer'), default='definer',
                    help='Reviewed permanent helper mode; default bounded DEFINER as approved by Root.')
ARGS = PARSER.parse_args()
if any(not re.fullmatch(r'[a-z][a-z0-9_]*', r) for r in ARGS.allocator_usage_role):
    raise ValueError('Role names must be plain reviewed PostgreSQL identifiers.')
if any(r in ('public', 'postgres', 'supabase_admin') for r in ARGS.allocator_usage_role):
    raise ValueError('Do not add PUBLIC, owner or platform-superuser to the optional USAGE allowlist.')
roles = sorted(set(ARGS.allocator_usage_role))
role_array = 'ARRAY[' + ','.join("'" + r + "'" for r in roles) + ']::text[]'

rows = json.loads(ARGS.definitions.read_text())
defs: dict[str, str] = {}
pins: dict[str, str] = {}
for row in rows:
    name = row['function']
    if name == 'official_v3_guard_alarm_status_v1()':
        name = 'public.' + name
    if row['owner'] != 'postgres' or sha(row['definition']) != row['definition_sha']:
        raise ValueError(f'Unverified live source record: {name}')
    if name in defs:
        raise ValueError(f'Duplicate source: {name}')
    defs[name] = row['definition']
    pins[name] = row['definition_sha']
expected_names = {
    'official_v3_guard_private.assert_catalog_v1()',
    'official_v3_guard_private.audit_v1()',
    'official_v3_guard_private.catalog_status_v1()',
    'official_v3_guard_private.check_control_v1()',
    'official_v3_guard_private.require_open_v1()',
    'public.official_v3_guard_alarm_status_v1()',
}
if set(defs) != expected_names:
    raise ValueError('The exact six live guard definitions are required.')

transport_source = ARGS.transport_draft.read_text()
helper_source = ARGS.helper_source.read_text()
if hashlib.sha256(ARGS.helper_source.read_bytes()).hexdigest() != '7a2fba345aeccef648d0c37a0092cc923a47e3e21557a98e0acc338c607a5c29':
    raise ValueError('The final independently reviewed, fully qualified SD helper file is required.')
helper_match = re.search(
    r'CREATE FUNCTION jetnity_pgnet_allocator_private\.assign_request_id_v1\(\) RETURNS trigger\s+'
    r'LANGUAGE plpgsql VOLATILE SECURITY (?:INVOKER|DEFINER) SET search_path=pg_catalog AS \$assign\$(.*?)\$assign\$;',
    helper_source, re.S)
if helper_match is None:
    raise ValueError('Exact reviewed allocator helper not found.')
helper_sha = sha(helper_match.group(1))
if helper_sha != '16151e29d3859b8574afcc934c2fa4cc6709c82280697e34474b41f711801afa':
    raise ValueError('Allocator helper changed: review and consciously update its source pin first.')
if 'SECURITY ' + ARGS.helper_security_mode.upper() not in helper_match.group(0):
    raise ValueError('Expected helper security mode does not match the reviewed helper source.')
protected_match = re.search(
    r'CREATE FUNCTION pg_temp\.dev_seq_protected_state\(\) RETURNS jsonb\s+'
    r'LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS \$state\$(.*?)\$state\$;',
    transport_source, re.S)
if protected_match is None:
    raise ValueError('Existing independent protected-data snapshot not found in transport draft.')
protected_body = once(protected_match.group(1),
                      " 'catalog',official_v3_guard_private.catalog_status_v1(),\n", '')
protected_function = (
    'CREATE FUNCTION pg_temp.dev_http_v8_data() RETURNS jsonb\n'
    'LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $state$'
    + protected_body + '$state$;\n'
    'REVOKE ALL ON FUNCTION pg_temp.dev_http_v8_data() FROM PUBLIC,anon,authenticated,service_role;\n')

# The mutable sequence VALUE is deliberately absent. Stable generator metadata,
# its own function and every global queue trigger are protected. Managed
# functions/default/owner remain byte-identical to the PRE snapshot.
native_metadata = r"""jsonb_build_object(
 'net_namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('net')),
 'pg_net_extension',(SELECT to_jsonb(e) FROM pg_extension e WHERE e.extname='pg_net'),
 'replication_parameter_acl',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.oid),'[]'::jsonb)
   FROM pg_parameter_acl a WHERE a.parname='session_replication_role'),
 'replication_role_settings',(SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole),'[]'::jsonb)
   FROM pg_db_role_setting s WHERE EXISTS(SELECT 1 FROM unnest(s.setconfig) cfg WHERE cfg LIKE 'session_replication_role=%')),
 'replication_function_settings',(SELECT coalesce(jsonb_agg(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'] ORDER BY p.oid),'[]'::jsonb)
   FROM pg_proc p WHERE EXISTS(SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'session_replication_role=%')),
 'supautils_settings',jsonb_build_object(
   'privileged_role',current_setting('supautils.privileged_role',true),
   'privileged_role_allowed_configs',current_setting('supautils.privileged_role_allowed_configs',true)),
 'queue_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue')),
 'queue_attributes',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.attnum),'[]'::jsonb)
   FROM pg_attribute a WHERE a.attrelid=to_regclass('net.http_request_queue')),
 'queue_defaults',(SELECT coalesce(jsonb_agg(to_jsonb(d)||jsonb_build_object('expression',pg_get_expr(d.adbin,d.adrelid)) ORDER BY d.adnum),'[]'::jsonb)
   FROM pg_attrdef d WHERE d.adrelid=to_regclass('net.http_request_queue')),
 'queue_constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.oid),'[]'::jsonb)
   FROM pg_constraint c WHERE c.conrelid=to_regclass('net.http_request_queue')),
 'queue_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.oid),'[]'::jsonb)
   FROM pg_trigger t WHERE t.tgrelid=to_regclass('net.http_request_queue')),
 'managed_sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue_id_seq')),
 'managed_sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
   WHERE s.seqrelid=to_regclass('net.http_request_queue_id_seq')),
 'net_functions',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::jsonb)
   FROM pg_proc p WHERE p.pronamespace=to_regnamespace('net') AND p.prokind IN('f','p'))
)"""
allocator_metadata = r"""jsonb_build_object(
 'namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('jetnity_pgnet_allocator_private')),
 'sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
   WHERE s.seqrelid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'function',(SELECT (to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
   FROM pg_proc p WHERE p.oid=to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')),
 'global_trigger',(SELECT to_jsonb(t) FROM pg_trigger t
   WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1'),
 'dependencies',(WITH owned_objects(classid,objid) AS (
   VALUES ('pg_namespace'::regclass::oid,to_regnamespace('jetnity_pgnet_allocator_private')::oid),
    ('pg_class'::regclass::oid,to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')::oid),
    ('pg_proc'::regclass::oid,to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')::oid)
   UNION SELECT 'pg_trigger'::regclass::oid,t.oid FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1')
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype),'[]'::jsonb)
  FROM pg_depend d WHERE (d.classid,d.objid) IN(SELECT * FROM owned_objects)
   OR (d.refclassid,d.refobjid) IN(SELECT * FROM owned_objects)),
 'shared_dependencies',(WITH owned_objects(classid,objid) AS (
   VALUES ('pg_namespace'::regclass::oid,to_regnamespace('jetnity_pgnet_allocator_private')::oid),
    ('pg_class'::regclass::oid,to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')::oid),
    ('pg_proc'::regclass::oid,to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')::oid)
   UNION SELECT 'pg_trigger'::regclass::oid,t.oid FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1')
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype),'[]'::jsonb)
  FROM pg_shdepend d WHERE d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
   AND (d.classid,d.objid) IN(SELECT * FROM owned_objects))
)"""
native_metadata = re.sub(r'::(regclass|regnamespace|regprocedure|regtype|oid|jsonb)(?![A-Za-z_])', r'::pg_catalog.\1', native_metadata)
allocator_metadata = re.sub(r'::(regclass|regnamespace|regprocedure|regtype|oid|jsonb)(?![A-Za-z_])', r'::pg_catalog.\1', allocator_metadata)
transport_metadata = "jsonb_build_object('native'," + native_metadata + ", 'allocator'," + allocator_metadata + ')'
catalog_key = 'transport:dev_http_id_allocator_v8'

new_defs: dict[str, str] = {}
name = 'official_v3_guard_private.catalog_status_v1()'
new_defs[name] = once(defs[name],
                     ')\nSELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries',
                     "  UNION ALL SELECT '" + catalog_key + "'," + transport_metadata
                     + '\n)\nSELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries')

name = 'official_v3_guard_private.assert_catalog_v1()'
changed = once(defs[name],
               'DECLARE restore_v7 official_v3_guard_private.bg1_dev_grantor_restore_v7%ROWTYPE;',
               'DECLARE transport_v8 official_v3_guard_private.bg1_dev_http_id_allocator_v8%ROWTYPE;\n'
               ' restore_v7 official_v3_guard_private.bg1_dev_grantor_restore_v7%ROWTYPE;')
changed = once(changed,
               'BEGIN\n  SELECT * INTO STRICT restore_v7',
               "BEGIN\n  IF current_setting('session_replication_role') NOT IN('origin','local') THEN\n"
               "    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;\n"
               '  SELECT * INTO STRICT transport_v8 FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 WHERE singleton;\n'
               '  SELECT * INTO STRICT restore_v7')
changed = once(changed,
               ' OR restore_v7.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN',
               r""" OR transport_v8.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(restore_v7.catalog::text,'UTF8')),'hex')
 OR transport_v8.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(restore_v7)||
   jsonb_build_object('proof_not_before',extract(epoch FROM restore_v7.proof_not_before)))::text,'UTF8')),'hex')
 OR transport_v8.required_generation<=restore_v7.required_generation
 OR transport_v8.proof_not_before<=restore_v7.proof_not_before
 OR transport_v8.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(transport_v8.transport_metadata::text,'UTF8')),'hex')
 OR transport_v8.transport_metadata IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()->'transport:dev_http_id_allocator_v8'
 OR transport_v8.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN""")
new_defs[name] = changed
gate_anchor = ('  FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v WHERE singleton;\n')
gate_successor = (gate_anchor + '  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)\n'
                  '   INTO STRICT required_proof,earliest_proof\n'
                  '  FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v WHERE singleton;\n')
for name in ('official_v3_guard_private.require_open_v1()', 'public.official_v3_guard_alarm_status_v1()'):
    new_defs[name] = once(defs[name], gate_anchor, gate_successor)
new_defs['official_v3_guard_private.require_open_v1()'] = once(
    new_defs['official_v3_guard_private.require_open_v1()'],
    'BEGIN\n  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;',
    "BEGIN\n  IF current_setting('session_replication_role') NOT IN('origin','local') THEN\n"
    "    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;\n"
    '  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;')
new_defs['public.official_v3_guard_alarm_status_v1()'] = once(
    new_defs['public.official_v3_guard_alarm_status_v1()'],
    "BEGIN\n  IF official_v3_guard_private.alarm_status_v1()",
    "BEGIN\n  IF current_setting('session_replication_role') NOT IN('origin','local') THEN RETURN unavailable_value; END IF;\n"
    "  IF official_v3_guard_private.alarm_status_v1()")
for name in new_defs:
    new_defs[name] = new_defs[name].replace("current_setting('session_replication_role')", "pg_catalog.current_setting('session_replication_role')")

pin_values = ',\n '.join("('%s','%s')" % item for item in sorted(pins.items()))
pre = r"""-- REVIEW CANDIDATE ONLY. No BEGIN/COMMIT: integrate inside one Dev transaction.
-- Run PRE before any allocator schema/role/DDL mutation. It takes the existing
-- guard advisory lock and the global queue lock. First assembled run ROLLBACK.
DO $v8_pre$
DECLARE p record;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed' OR auth.uid() IS NOT NULL
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NOT NULL
 OR to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_EXACT_TARGET_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771106,1)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_GUARD_BUSY' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_control_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR (SELECT catalog=official_v3_guard_private.catalog_status_v1()
   FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 WHERE singleton) IS DISTINCT FROM true
 OR official_v3_guard_private.catalog_status_v1() ? 'transport:dev_http_id_allocator_v8'
 OR has_table_privilege(current_user,'net.http_request_queue','TRIGGER') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','INSERT') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','UPDATE') IS DISTINCT FROM true
 OR to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') IS NULL
 OR to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NULL
 OR to_regprocedure('net.http_delete(text,jsonb,jsonb,integer,jsonb)') IS NULL
 OR to_regprocedure('net.wake()') IS NULL
 OR current_setting('supautils.privileged_role_allowed_configs',true) IS NULL
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_BASELINE_OR_TRANSPORT_AUTHORITY_REFUSED' USING ERRCODE='P7998'; END IF;
 FOR p IN SELECT * FROM (VALUES
 @PIN_VALUES@
 ) expected(signature,definition_sha) LOOP
  IF (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid=p.signature::regprocedure) IS DISTINCT FROM 'postgres'
  OR encode(sha256(convert_to(pg_get_functiondef(p.signature::regprocedure),'UTF8')),'hex') IS DISTINCT FROM p.definition_sha
  THEN RAISE EXCEPTION 'DEV_HTTP_V8_LIVE_GUARD_PIN_CHANGED' USING ERRCODE='P7998'; END IF;
 END LOOP;
END $v8_pre$;
LOCK TABLE net.http_request_queue IN SHARE ROW EXCLUSIVE MODE;
@PROTECTED_FUNCTION@
CREATE TEMP TABLE dev_http_v8_before(
 singleton boolean PRIMARY KEY CHECK(singleton),catalog jsonb NOT NULL,
 protected_data jsonb NOT NULL,guard_state jsonb NOT NULL,original_native jsonb NOT NULL,
 fact_sequence regclass NOT NULL,fact_sequence_state jsonb NOT NULL
) ON COMMIT DROP;
DO $v8_snapshot$
DECLARE f regclass; fs jsonb;
BEGIN
 f:=pg_get_serial_sequence('official_v3_source_renewal_private.facts_v1','fact_id')::regclass;
 IF f IS NULL THEN RAISE EXCEPTION 'DEV_HTTP_V8_FACT_SEQUENCE_MISSING' USING ERRCODE='P7998'; END IF;
 EXECUTE format('SELECT jsonb_build_object(''last_value'',last_value::text,''log_cnt'',log_cnt::text,''is_called'',is_called) FROM %s',f) INTO STRICT fs;
 INSERT INTO pg_temp.dev_http_v8_before
 SELECT true,official_v3_guard_private.catalog_status_v1(),pg_temp.dev_http_v8_data(),
  (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton),
  @NATIVE_METADATA@,f,fs;
 IF (SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass)<>0
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_PREEXISTING_QUEUE_TRIGGER_UNREVIEWED' USING ERRCODE='P7998'; END IF;
END $v8_snapshot$;
-- Insert independently reviewed allocator CREATE SCHEMA/SEQUENCE/FUNCTION/TRIGGER
-- and narrowly approved object USAGE grants HERE. No HTTP/new source/fact call.
-- Do not call the OLD v7 catalog assertion after those grants and before POST.
"""
pre = pre.replace('@PIN_VALUES@', pin_values).replace('@PROTECTED_FUNCTION@', protected_function).replace('@NATIVE_METADATA@', native_metadata)

post = r"""-- REVIEW CANDIDATE ONLY: companion POST after reviewed allocator DDL, same TX.
DO $v8_transport_gate$
DECLARE prior pg_temp.dev_http_v8_before%ROWTYPE; current_native jsonb;
 item record; relation_owner oid; acl_value aclitem[]; allowed_roles text[]:=@ROLE_ARRAY@;
BEGIN
 SELECT * INTO STRICT prior FROM pg_temp.dev_http_v8_before WHERE singleton;
 IF NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND granted
  AND relation='net.http_request_queue'::regclass AND mode='ShareRowExclusiveLock')
 OR NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_sequence s ON s.seqrelid=c.oid
  WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass
   AND c.relkind='S' AND c.relpersistence='p' AND c.relowner='postgres'::regrole
   AND s.seqtypid='bigint'::regtype AND s.seqincrement=1 AND s.seqcache=1
   AND s.seqmin=1 AND s.seqmax=9223372036854775807 AND NOT s.seqcycle)
 OR NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure
   AND p.proowner='postgres'::regrole AND p.prosecdef=@EXPECTED_SECDEF@ AND p.provolatile='v'
   AND p.prorettype='trigger'::regtype AND p.pronargs=0 AND p.proconfig=ARRAY['search_path=pg_catalog']
   AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')='@HELPER_SHA@')
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid='net.http_request_queue'::regclass
   AND t.tgname='jetnity_pgnet_request_id_v1' AND t.tgtype=7 AND t.tgenabled='O'
   AND NOT t.tgisinternal AND t.tgconstraint=0 AND t.tgnargs=0 AND t.tgqual IS NULL
   AND t.tgfoid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_GLOBAL_ALLOCATOR_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 current_native:=@NATIVE_METADATA@;
 -- CREATE TRIGGER legitimately changes only relhastriggers plus the one new trigger.
 IF (current_native-'queue_triggers'-'queue_relation') IS DISTINCT FROM
      (prior.original_native-'queue_triggers'-'queue_relation')
 OR ((current_native->'queue_relation')-'relhastriggers') IS DISTINCT FROM
      ((prior.original_native->'queue_relation')-'relhastriggers')
 OR current_native#>'{queue_relation,relhastriggers}' IS DISTINCT FROM 'true'::jsonb
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_MANAGED_TRANSPORT_CHANGED' USING ERRCODE='P7998'; END IF;
 SELECT n.nspowner,n.nspacl INTO STRICT relation_owner,acl_value FROM pg_namespace n
 WHERE n.oid='jetnity_pgnet_allocator_private'::regnamespace;
 IF relation_owner<>'postgres'::regrole THEN
  RAISE EXCEPTION 'DEV_HTTP_V8_ALLOCATOR_SCHEMA_OWNER' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM aclexplode(coalesce(acl_value,acldefault('n',relation_owner))) LOOP
  IF item.grantee<>'postgres'::regrole AND
   (item.grantee=0 OR pg_get_userbyid(item.grantee)::text<>ALL(allowed_roles)
    OR item.privilege_type<>'USAGE' OR item.is_grantable OR item.grantor<>'postgres'::regrole)
  THEN RAISE EXCEPTION 'DEV_HTTP_V8_SCHEMA_GRANT_UNREVIEWED' USING ERRCODE='P7998'; END IF;
 END LOOP;
 SELECT c.relowner,c.relacl INTO STRICT relation_owner,acl_value FROM pg_class c
 WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass;
 FOR item IN SELECT * FROM aclexplode(coalesce(acl_value,acldefault('S',relation_owner))) LOOP
  IF item.grantee<>'postgres'::regrole AND
   (item.grantee=0 OR pg_get_userbyid(item.grantee)::text<>ALL(allowed_roles)
    OR item.privilege_type<>'USAGE' OR item.is_grantable OR item.grantor<>'postgres'::regrole)
  THEN RAISE EXCEPTION 'DEV_HTTP_V8_SEQUENCE_GRANT_UNREVIEWED' USING ERRCODE='P7998'; END IF;
 END LOOP;
 FOR item IN SELECT unnest(allowed_roles) role_name LOOP
  IF has_schema_privilege(item.role_name,'jetnity_pgnet_allocator_private','USAGE') IS DISTINCT FROM true
   OR has_sequence_privilege(item.role_name,'jetnity_pgnet_allocator_private.http_request_id_v1','USAGE') IS DISTINCT FROM true
  THEN RAISE EXCEPTION 'DEV_HTTP_V8_APPROVED_USAGE_GRANT_MISSING' USING ERRCODE='P7998'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure
  AND a.grantee<>'postgres'::regrole)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_TRIGGER_FUNCTION_NOT_PRIVATE' USING ERRCODE='P7998'; END IF;
END $v8_transport_gate$;

CREATE TABLE official_v3_guard_private.bg1_dev_http_id_allocator_v8(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 transport_metadata jsonb NOT NULL CHECK(jsonb_typeof(transport_metadata)='object'),
 transport_metadata_digest text NOT NULL CHECK(transport_metadata_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
 catalog jsonb NOT NULL CHECK(jsonb_typeof(catalog)='object')
);
ALTER TABLE official_v3_guard_private.bg1_dev_http_id_allocator_v8 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_dev_http_id_allocator_v8 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_dev_http_id_allocator_v8 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.bg1_dev_http_id_allocator_v8
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.bg1_dev_http_id_allocator_v8
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.bg1_dev_http_id_allocator_v8 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

@NEW_FUNCTIONS@

-- Append-only successor. No INSERT/UPDATE to state, incidents, runs, owner
-- operations, old baselines or receipts, and no audit/resume/control call here.
INSERT INTO official_v3_guard_private.bg1_dev_http_id_allocator_v8
 (singleton,predecessor_catalog_digest,predecessor_baseline_digest,transport_metadata,
  transport_metadata_digest,required_generation,proof_not_before,catalog)
SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 meta.value,encode(sha256(convert_to(meta.value::text,'UTF8')),'hex'),
 greatest(v.required_generation+1,s.generation+1),
 greatest(v.proof_not_before+interval '1 microsecond',clock_timestamp()),
 official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v
CROSS JOIN official_v3_guard_private.state_v1 s
CROSS JOIN LATERAL (SELECT official_v3_guard_private.catalog_status_v1()->'transport:dev_http_id_allocator_v8' value) meta
WHERE v.singleton AND s.singleton;

DO $v8_post$
DECLARE before_row pg_temp.dev_http_v8_before%ROWTYPE; live_catalog jsonb; fstate jsonb; item record;
BEGIN
 SELECT * INTO STRICT before_row FROM pg_temp.dev_http_v8_before WHERE singleton;
 live_catalog:=official_v3_guard_private.catalog_status_v1();
 IF pg_temp.dev_http_v8_data() IS DISTINCT FROM before_row.protected_data
 OR (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton) IS DISTINCT FROM before_row.guard_state
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_ORIGINAL_DATA_OR_LATCH_CHANGED' USING ERRCODE='P7998'; END IF;
 EXECUTE format('SELECT jsonb_build_object(''last_value'',last_value::text,''log_cnt'',log_cnt::text,''is_called'',is_called) FROM %s',before_row.fact_sequence)
 INTO STRICT fstate;
 IF fstate IS DISTINCT FROM before_row.fact_sequence_state
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_FACT_SEQUENCE_CHANGED' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
 @POST_PINS@
 ) p(signature,definition_sha) LOOP
  IF encode(sha256(convert_to(pg_get_functiondef(item.signature::regprocedure),'UTF8')),'hex') IS DISTINCT FROM item.definition_sha
  THEN RAISE EXCEPTION 'DEV_HTTP_V8_INSTALLED_GUARD_BODY_MISMATCH' USING ERRCODE='P7998'; END IF;
 END LOOP;
 -- Every old catalog key survives exactly; only the four reviewed definitions
 -- may change. Their entire pg_proc row outside definition remains identical.
 IF EXISTS(SELECT 1 FROM jsonb_each(before_row.catalog) prior
  LEFT JOIN jsonb_each(live_catalog) actual ON actual.key=prior.key
  WHERE CASE WHEN prior.key IN (
   'function:'||'official_v3_guard_private.catalog_status_v1()'::regprocedure::oid,
   'function:'||'official_v3_guard_private.assert_catalog_v1()'::regprocedure::oid,
   'function:'||'official_v3_guard_private.require_open_v1()'::regprocedure::oid,
   'function:'||'public.official_v3_guard_alarm_status_v1()'::regprocedure::oid)
   THEN prior.value-'definition' IS DISTINCT FROM actual.value-'definition'
   ELSE prior.value IS DISTINCT FROM actual.value END)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_UNEXPECTED_OLD_CATALOG_DELTA' USING ERRCODE='P7998'; END IF;
 -- New entries are restricted to the exact new baseline and transport objects.
 IF EXISTS(
  WITH base AS (SELECT c.oid,c.reltoastrelid FROM pg_class c
    WHERE c.oid='official_v3_guard_private.bg1_dev_http_id_allocator_v8'::regclass),
  relations AS (SELECT oid FROM base UNION SELECT reltoastrelid FROM base WHERE reltoastrelid<>0
    UNION SELECT indexrelid FROM pg_index WHERE indrelid IN(SELECT oid FROM base UNION SELECT reltoastrelid FROM base)),
  relation_types AS (SELECT oid,typarray FROM pg_type WHERE typrelid IN(SELECT oid FROM relations)),
  objects AS (
   SELECT 'pg_class'::regclass::oid classid,oid objid FROM relations
   UNION SELECT 'pg_type'::regclass,oid FROM relation_types
   UNION SELECT 'pg_type'::regclass,typarray FROM relation_types WHERE typarray<>0
   UNION SELECT 'pg_constraint'::regclass,oid FROM pg_constraint WHERE conrelid IN(SELECT oid FROM base)
   UNION SELECT 'pg_trigger'::regclass,oid FROM pg_trigger WHERE tgrelid IN(SELECT oid FROM base)
   UNION SELECT 'pg_policy'::regclass,oid FROM pg_policy WHERE polrelid IN(SELECT oid FROM base)
   UNION SELECT 'pg_attrdef'::regclass,oid FROM pg_attrdef WHERE adrelid IN(SELECT oid FROM base)
   UNION SELECT 'pg_namespace'::regclass,'jetnity_pgnet_allocator_private'::regnamespace
   UNION SELECT 'pg_class'::regclass,'jetnity_pgnet_allocator_private.http_request_id_v1'::regclass
   UNION SELECT 'pg_proc'::regclass,'jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure
   UNION SELECT 'pg_trigger'::regclass,oid FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass
     AND tgname='jetnity_pgnet_request_id_v1'
  ), additions AS (SELECT actual.* FROM jsonb_each(live_catalog) actual
    WHERE NOT before_row.catalog ? actual.key)
  SELECT 1 FROM additions a WHERE NOT CASE
   WHEN a.key='transport:dev_http_id_allocator_v8' THEN true
   WHEN split_part(a.key,':',1) IN('relation','type','constraint','trigger','policy','default','index')
     THEN EXISTS(SELECT 1 FROM objects o WHERE o.objid=split_part(a.key,':',2)::oid)
   WHEN split_part(a.key,':',1)='attribute'
     THEN split_part(a.key,':',2)::oid IN(SELECT oid FROM relations)
   WHEN split_part(a.key,':',1) IN('dependency','shared')
     THEN EXISTS(SELECT 1 FROM objects o
       WHERE o.classid=(a.value->>'classid')::oid AND o.objid=(a.value->>'objid')::oid
       OR split_part(a.key,':',1)='dependency' AND o.classid=(a.value->>'refclassid')::oid AND o.objid=(a.value->>'refobjid')::oid)
   ELSE false END
 ) THEN RAISE EXCEPTION 'DEV_HTTP_V8_UNEXPECTED_NEW_CATALOG_ENTRY' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_control_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8)<>1
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v
   CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton
   AND v.required_generation>s.generation AND v.proof_not_before>s.last_proof_started
   AND v.catalog=live_catalog)
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_FRESH_PROOF_NOT_ENFORCED' USING ERRCODE='P7998'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RAISE EXCEPTION 'DEV_HTTP_V8_OPEN_BEFORE_NEW_FULL_PROOF' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL;
 END;
END $v8_post$;
SELECT 'DEV_HTTP_ID_ALLOCATOR_V8_SEALED_FRESH_FULL_PROOF_REQUIRED' AS result,
 false AS positive_renewal_proven,false AS production_permission,false AS committed;
-- Outer caller must ROLLBACK for rehearsal. Separate reviewed COMMIT installer
-- must require fresh natural complete audit+cron binding before claiming current.
"""
new_function_sql = '\n'.join(new_defs[n].rstrip() + ';\n' for n in new_defs)
post_pins = dict(pins)
post_pins.update({n: sha(d) for n, d in new_defs.items()})
post_values = ',\n '.join("('%s','%s')" % item for item in sorted(post_pins.items()))
post = (post.replace('@ROLE_ARRAY@', role_array).replace('@HELPER_SHA@', helper_sha)
        .replace('@EXPECTED_SECDEF@', 'true' if ARGS.helper_security_mode == 'definer' else 'false')
        .replace('@NATIVE_METADATA@', native_metadata).replace('@NEW_FUNCTIONS@', new_function_sql)
        .replace('@POST_PINS@', post_values))
if re.search(r'@[A-Z_]+@', pre + post):
    raise ValueError('Unresolved factory placeholder.')
if any(token in '\n'.join(new_defs.values()) for token in ('UPDATE official_v3_guard_private.state_v1', 'SET ROLE')):
    raise ValueError('Unexpected control-state or authority mutation in guard transform.')

ARGS.out_dir.mkdir(parents=True, exist_ok=True)
(ARGS.out_dir / 'dev-http-id-v8-guard.PRE.sql').write_text(pre)
(ARGS.out_dir / 'dev-http-id-v8-guard.POST.sql').write_text(post)
(ARGS.out_dir / 'dev-http-id-v8-transport-metadata.sql').write_text('SELECT ' + transport_metadata + ';\n')
manifest = {
    'status': 'SOURCE_REVIEW_DRAFT_NOT_EXECUTED_NOT_INSTALLED',
    'input_live_file_sha256': hashlib.sha256(ARGS.definitions.read_bytes()).hexdigest(),
    'input_transport_draft_sha256': hashlib.sha256(ARGS.transport_draft.read_bytes()).hexdigest(),
    'input_final_helper_sha256': hashlib.sha256(ARGS.helper_source.read_bytes()).hexdigest(),
    'allocator_helper_prosrc_sha256': helper_sha,
    'expected_allocator_helper_security_mode': ARGS.helper_security_mode,
    'optional_allocator_usage_roles': roles,
    'modified_functions': sorted(new_defs),
    'unchanged_audit_and_control': {n: pins[n] for n in pins if n.endswith(('audit_v1()', 'check_control_v1()'))},
    'expected_after_definition_sha256': post_pins,
    'pre_sha256': sha(pre), 'post_sha256': sha(post),
    'requires': ['actual TRIGGER authority proof', 'exact native allocator/cleanup ROLLBACK',
                 'reviewed seed above all 16 ID ledgers and native sequence',
                 'actual producer-role USAGE proof', 'native assembled v8 ROLLBACK',
                 'separate COMMIT decision and independent readback',
                 'fresh natural BG1 complete proof before current',
                 'later actual pg_net RETURNING and worker delivery proof'],
    'runtime_limit': 'Normal O trigger covers origin/local sessions, not session_replication_role=replica.',
}
(ARGS.out_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
diff = ''.join(''.join(difflib.unified_diff(defs[n].splitlines(True), new_defs[n].splitlines(True),
    fromfile='live-v7/' + n, tofile='candidate-v8/' + n)) for n in sorted(new_defs))
(ARGS.out_dir / 'guard-transform-review.diff').write_text(diff)
(ARGS.out_dir / 'README.md').write_text('''# BG1 v8 transport successor — review draft

No database action or installation was performed by this factory. These files
are fragments for a separately reviewed, exact Dev transaction, not a runnable
approved installer. Production is excluded.

## Assembly contract

1. Open the separately reviewed Dev transaction in READ COMMITTED with UTC,
   short statement/lock/idle timeouts and fixed Dev identity checks.
2. Run PRE **before all permanent transport DDL/grants**. PRE checks all six
   live guard definition pins, original v7 current, privileges and source/history
   proofs; locks the existing guard and the complete managed queue; snapshots
   old catalog/data/latch/managed metadata and the fact sequence.
3. Insert the independently reviewed allocator installation: logged private
   postgres sequence, exact pinned helper in the manifest's security mode, one BEFORE INSERT ROW trigger,
   seed greater than all 16 request-ID paths and the managed sequence. Actual
   producer roles and narrowly allowed USAGE grants require native proof.
   Optional grantees must be explicitly passed with --allocator-usage-role.
   Default factory output requires the bounded DEFINER helper and permits only
   postgres-owned private ACLs; no new schema/sequence PUBLIC grants.
4. Run POST in the **same** transaction. Do not call the old v7 assert between
   transport grants and POST. POST preserves all old keys except the exact four
   reviewed definition changes and accepts new catalog keys only for the named
   new objects. Audit and control definitions remain byte-identical.
5. First assembled execution must ROLLBACK and independently read back original
   catalog/roles/owner receipts/facts/sequence/managed queue. No COMMIT is in
   these fragments. A separate installer must be reviewed before persistence.
6. After an eventual separate COMMIT, the existing genuine natural full audit
   must reach the new generation and proof time; correlate its complete row to
   the actual successful cron execution. Until then status remains unavailable.

## Meaningful native gates still open

- Real CREATE TRIGGER authority, native INSERT RETURNING and exact cleanup
  dependency/transaction rollback proof; catalog privileges alone do not prove it.
- Trigger tamper (own function), own-sequence parameter and extra-grant negative
  cases must cause the real v8 assert to refuse inside disposable savepoints.
- Full assembled v8 SQL compile/execute and canonical pg_get_functiondef hashes.
  Python source validation and deterministic transforms are not native SQL proof.
- Exact startup/continuation highwater and supported pg_net delivery behavior.
- Native functions consume their old default sequence even when a transaction
  rolls back if id is omitted. Do not claim those nextval gaps were undone.
- Normal trigger tgenabled=O covers origin/local sessions, not replica sessions.
  Do not claim replica-mode inserts are covered; queue UPDATE is not renumbered.
- Supautils can allow SET even without pg_parameter_acl privilege. The catalog
  pins its privileged-role allowed-config list and parameter/role/function
  overrides; assert/require/status explicitly refuse a replica-mode context.

## Rollback boundary

Before COMMIT, transactional rollback removes new DDL/rows and restores prior
metadata. After new IDs have been issued, removing the trigger would return to
the lagging managed allocator and is not a safe functional rollback. Preserve
the new counter and prefer a reviewed fail-closed fence/forward successor.
Research-only qualification and expired facts remain unchanged; no positive
renewal, owner action or source authorization is asserted by this transport work.
''')
print(json.dumps({'out_dir': str(ARGS.out_dir), 'pre_sha256': sha(pre), 'post_sha256': sha(post),
                  'modified_functions': sorted(new_defs), 'db_actions': 0}, indent=2))
