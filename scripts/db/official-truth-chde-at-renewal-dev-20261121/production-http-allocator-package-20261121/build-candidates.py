#!/usr/bin/env python3
"""Offline-only assembly. Reads pinned repository evidence, writes this folder.

No database client, socket, subprocess, network, credential, or SQL execution.
Missing independent Production bindings render explicit pre-DDL STOP conditions.
This builds review candidates, never an execution permission or a native PASS.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
EVIDENCE = ROOT / "docs/evidence/official-truth-production-readonly-v2-20261121/execution.json"
OLD_GUARD = ROOT / "scripts/db/official-truth-bg1-self-heal-dev-1/production-bg1-v3-chain-exact.CANDIDATE-ROLLBACK.sql"
AT_STAGE1 = ROOT / "scripts/db/official-truth-at-production-stage1/install.sql"
AT_RENEW = ROOT / "scripts/db/official-truth-at-production-schedule-v2/batch-switch-v3.CANDIDATE.sql"
NEW_BASE = "official_v3_guard_private.bg1_production_http_allocator_v4"
TRANSPORT_KEY = "transport:production_http_id_allocator_v4"
SEQ = "jetnity_pgnet_allocator_private.http_request_id_v1"
HELPER = "jetnity_pgnet_allocator_private.assign_request_id_v1()"
TRIGGER = "jetnity_pgnet_request_id_v1"
SCHEMA = "jetnity_pgnet_allocator_private"


def sha(value: str | bytes) -> str:
    return hashlib.sha256(value.encode() if isinstance(value, str) else value).hexdigest()


def sql_literal(value: str | None) -> str:
    return "NULL::text" if value is None else "'" + value.replace("'", "''") + "'"


def exact_once(text: str, old: str, new: str) -> str:
    if text.count(old) != 1:
        raise ValueError(f"Expected exactly one transformation anchor: {old[:120]!r}")
    return text.replace(old, new, 1)


def function_source(path: Path, name: str) -> tuple[str, str, str]:
    source = path.read_text()
    pattern = re.compile(r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+" + re.escape(name) + r"\s*\(", re.I)
    matches = list(pattern.finditer(source))
    if len(matches) != 1:
        raise ValueError(f"Ambiguous function {name} in {path}")
    start = matches[0].start()
    as_match = re.search(r"\bAS\s+(\$[A-Za-z0-9_]*\$)", source[matches[0].end():], re.I)
    if as_match is None:
        raise ValueError(f"No dollar body for {name}")
    body_start = matches[0].end() + as_match.end()
    tag = as_match.group(1)
    body_end = source.index(tag, body_start)
    return source[start:body_start], source[body_start:body_end], tag + ";\n"


evidence = json.loads(EVIDENCE.read_text())
attempts = evidence["execution"]["attempts"]
observed = {row["signature"]: row for row in attempts[0]["result"]["function_metadata"] if row["present"]}
api_source_path = HERE / "reviewed-net-api-definitions.json"
api_source = json.loads(api_source_path.read_text())
if len(api_source["definitions"]) != 3:
    raise ValueError("Exactly three existing public net API definitions are required")
for api in api_source["definitions"]:
    if sha(api["native_definition"]) != observed[api["signature"]]["definition_sha256"]:
        raise ValueError("Archived public net API bytes no longer match actual Production V2")
originals: dict[str, tuple[str, str, str]] = {}
provenance = []
for signature, path in [
    ("official_v3_guard_private.catalog_status_v1()", OLD_GUARD),
    ("official_v3_guard_private.assert_catalog_v1()", OLD_GUARD),
    ("official_v3_guard_private.audit_v1()", OLD_GUARD),
    ("official_v3_guard_private.require_open_v1()", OLD_GUARD),
    ("public.official_v3_guard_alarm_status_v1()", OLD_GUARD),
    ("official_v3_at_production_private.enqueue_v1()", AT_STAGE1),
    ("official_v3_at_production_private.collect_v1()", AT_STAGE1),
    ("official_v3_at_production_private.renew_ch_v1()", AT_RENEW),
]:
    parts = function_source(path, signature[:-2])
    if sha(parts[1]) != observed[signature]["body_sha256"]:
        raise ValueError(f"Local source no longer matches actual V2 bytes: {signature}")
    originals[signature] = parts
    provenance.append({
        "signature": signature,
        "source": str(path.relative_to(ROOT)),
        "source_sha256": sha(path.read_bytes()),
        "body_sha256": sha(parts[1]),
        "v2_definition_sha256": observed[signature]["definition_sha256"],
        "body_exactly_matches_actual_v2": True,
        "source_statement_is_not_claimed_to_be_native_pg_get_functiondef_format": True,
    })

pins_path = HERE / "required-production-bindings.json"
if not pins_path.exists():
    pins_path.write_text(json.dumps({
        "schema": "jetnity-production-http-allocator-required-bindings-v1",
        "status": "PREPARED_ONLY_MISSING_INDEPENDENT_BINDINGS",
        "target": "qscbgcdmivbbnzrcyegn",
        "old_catalog_sha256": "7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e",
        "old_baseline_canonical_sha256": None,
        "native_transport_sha256": None,
        "control_definition_sha256": None,
        "retirements_definition_sha256": None,
        "immutable_definition_sha256": None,
        "scheduler_definition_sha256": None,
        "source_history_sha256": None,
        "owner_history_sha256": None,
        "installed_successor_canonical_sha256": None,
        "pg_net_0195_worker_review": None,
        "resolve_before_rehearsal": [
            "Execute only the separately approved finite 01-required-bindings.READONLY.sql; preserve raw result and exact file SHA.",
            "Independently inspect returned fixed function definitions, producer inventory, queue/default/index/constraint shape, replica authority and history digests.",
            "Bind non-NULL SHA values to that reviewed result; never populate them by accepting an arbitrary live snapshot automatically.",
            "Review the actual pg_net 0.19.5 worker transaction/queue-lock contract; Dev used 0.20.4. The three SQL net APIs have identical observed definition SHAs, which does not prove worker identity.",
            "Rebuild and independently review the exact candidate bytes; obtain a separate bounded Production rehearsal Go. No install Go is inferred.",
        ],
        "resolve_before_install": [
            "Actual native Production ROLLBACK rehearsal including source barrier, DDL/ID override, guard negatives and exact restoration must pass on the approved bytes.",
            "Review the independently read post-rehearsal state and prepare exact installation bytes; obtain a separate explicit COMMIT Go.",
        ],
        "resolve_before_fence": [
            "Pin the actually committed successor canonical SHA from an independent readback, not from this unexecuted draft.",
            "Review the exact fail-closed scope; obtain the specifically approved fence rehearsal or fence COMMIT authorization.",
        ],
    }, indent=2) + "\n")
pins = json.loads(pins_path.read_text())
if pins["target"] != "qscbgcdmivbbnzrcyegn":
    raise ValueError("Wrong fixed Production target")
for key, value in pins.items():
    if key.endswith("sha256") and value is not None and re.fullmatch(r"[a-f0-9]{64}", value) is None:
        raise ValueError(f"Malformed binding {key}")
pins["required_before_rehearsal"] = ["native_transport_sha256"]
for obsolete in ["old_baseline_canonical_sha256", "control_definition_sha256",
                 "retirements_definition_sha256", "immutable_definition_sha256",
                 "scheduler_definition_sha256", "source_history_sha256", "owner_history_sha256"]:
    # These draft fields have been superseded by the fixed V2 catalog anchor and
    # complete locked comparison, not silently accepted or populated from live data.
    if pins.get(obsolete) is not None:
        raise ValueError(f"Review before discarding a manually bound obsolete pin: {obsolete}")
    pins.pop(obsolete, None)
pins["safely_replaced_by_existing_pinned_chain"] = {
    "control_retirement_immutable_pins": "Taken only from old catalog after fixed V2 catalog SHA, pinned catalog/assert definitions, complete equality and original lineage checks pass.",
    "history_and_owner_frozen_hashes": "No prior live digest is required. Complete locked row multisets and counters are compared before/after; natural appended history is not silently deleted or rejected merely for being newer.",
    "old_baseline_canonical_digest": "Known V2 catalog SHA, required_generation=1344 and proof_not_before=2026-11-20T22:51:44.959438Z plus all unchanged original chain checks anchor the predecessor; its full canonical row is bound transactionally to the new successor.",
}
pins_path.write_text(json.dumps(pins, indent=2) + "\n")
worker_review_path = ROOT / "docs/evidence/official-truth-production-http-allocator-20261121/pg-net-0.19.5-transport-source-review.json"
worker_review_sha = "7ec6c65732acc5681a3f79d4cd612276461289576c5a8582a2bd1044d15fdef2"
if not worker_review_path.is_file() or sha(worker_review_path.read_bytes()) != worker_review_sha:
    raise ValueError("Pinned upstream pg_net 0.19.5 static transport review missing or changed")
pins["pg_net_0195_worker_review"] = {
    "evidence_path": str(worker_review_path.relative_to(ROOT)),
    "sha256": worker_review_sha,
    "upstream_commit": "a7792bfd913c7859e14025d606624982706c2a7f",
    "static_id_transport_review_complete": True,
    "hosted_binary_identity_or_runtime_proof": False,
}
pins["resolve_before_rehearsal"] = [
    "Obtain a separate exact Go for 01-required-bindings.READONLY.sql; one bounded catalog read, no automatic retry or mutation.",
    "Independently inspect the safe queue/default/type predicates and returned function fingerprints; match unfamiliar producer definitions to reviewed local source bytes. Unknown or unmatched definitions remain STOP.",
    "Bind only native_transport_sha256 from that reviewed result. Do not accept an opaque current digest without the substantive shape/function review; no automatic live snapshot acceptance.",
    "Rebuild and review the exact candidate bytes and matching source provenance. The verified V2 catalog anchors existing control leaves; complete locked before/after comparison preserves current history.",
    "Obtain a separate bounded Production ROLLBACK rehearsal Go. Neither the first READ Go nor a static source review authorizes that rehearsal or any COMMIT.",
]
pins["resolve_before_install"] = [
    "10-production-http-id.REHEARSAL-ROLLBACK.sql must actually pass in the approved Production scope; no isolated/native/static substitute is claimed.",
    "11-production-http-id.POSTREHEARSAL-READONLY.sql must independently confirm restoration of the original definitions/chain and absence of new own objects.",
    "Review the exact 20 installation bytes and actual rehearsal/readback evidence; obtain a separate explicit COMMIT Go. The immutable snapshots are not hand-edited to match current drift.",
]
pins_path.write_text(json.dumps(pins, indent=2) + "\n")

absent_relations = [r["schema"] + "." + r["table"] for r in attempts[0]["result"]["known_id_path_presence"] if not r["present"]]
absent_values = ",".join("(" + sql_literal(name) + ")" for name in absent_relations)

# All request-ID columns under the reviewed bigint request-id naming contract.
# A new matching table/domain/inherited or partitioned object is a STOP, never skipped.
inventory_sql = """WITH actual AS (
 SELECT n.nspname::text AS schema_name,c.relname::text AS table_name,
  a.attname::text AS column_name,c.relpersistence::text AS persistence,
  c.relkind::text AS kind,c.relispartition,
  EXISTS(SELECT 1 FROM pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid) AS inherited,
  a.atttypid='pg_catalog.int8'::pg_catalog.regtype AS exact_bigint,
  a.attgenerated='' AND a.attidentity='' AS ordinary_column
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 JOIN pg_attribute a ON a.attrelid=c.oid
 JOIN pg_type typ ON typ.oid=a.atttypid
 WHERE c.relkind IN('r','p','f','v','m') AND c.relpersistence IN('p','u')
 AND n.nspname NOT IN('pg_catalog','information_schema')
 AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
 AND a.attnum>0 AND NOT a.attisdropped
 AND (a.atttypid='pg_catalog.int8'::pg_catalog.regtype OR typ.typbasetype='pg_catalog.int8'::pg_catalog.regtype)
 AND (a.attname ~ '(^|_)request_id$'
   OR n.nspname='net' AND c.relname IN('http_request_queue','_http_response') AND a.attname='id')
), expected(schema_name,table_name,column_name,persistence) AS (VALUES
 ('jetnity_prod_import_scheduler','dispatches_v1','net_request_id','p'),
 ('official_v3_at_production_private','watch_requests_v1','request_id','p'),
 ('net','http_request_queue','id','u'),('net','_http_response','id','u')),
 differences AS (
 (SELECT schema_name,table_name,column_name,persistence FROM actual EXCEPT SELECT * FROM expected)
 UNION ALL (SELECT * FROM expected EXCEPT SELECT schema_name,table_name,column_name,persistence FROM actual)
 ) SELECT (SELECT count(*) FROM actual)=4 AND NOT EXISTS(SELECT 1 FROM differences)
 AND NOT EXISTS(SELECT 1 FROM actual WHERE kind<>'r' OR relispartition OR inherited
 OR NOT exact_bigint OR NOT ordinary_column)
 AND NOT EXISTS(SELECT 1 FROM (VALUES """ + absent_values + """) absent(relation_name)
  WHERE to_regclass(absent.relation_name) IS NOT NULL) AS exact_inventory"""

native_expr = """jsonb_build_object(
 'net_namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('net')),
 'pg_net_extension',(SELECT to_jsonb(e) FROM pg_extension e WHERE e.extname='pg_net'),
 'replication_parameter_acl',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.oid),'[]'::pg_catalog.jsonb)
   FROM pg_parameter_acl a WHERE a.parname='session_replication_role'),
 'replication_role_settings',(SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole),'[]'::pg_catalog.jsonb)
   FROM pg_db_role_setting s WHERE EXISTS(SELECT 1 FROM unnest(s.setconfig) cfg WHERE cfg LIKE 'session_replication_role=%')),
 'replication_function_settings',(SELECT coalesce(jsonb_agg(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'] ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p WHERE EXISTS(SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'session_replication_role=%')),
 'supautils_settings',jsonb_build_object(
   'privileged_role',current_setting('supautils.privileged_role',true),
   'privileged_role_allowed_configs',current_setting('supautils.privileged_role_allowed_configs',true)),
 'queue_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue')),
 'queue_attributes',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.attnum),'[]'::pg_catalog.jsonb)
   FROM pg_attribute a WHERE a.attrelid=to_regclass('net.http_request_queue')),
 'queue_defaults',(SELECT coalesce(jsonb_agg(to_jsonb(d)||jsonb_build_object('expression',pg_get_expr(d.adbin,d.adrelid)) ORDER BY d.adnum),'[]'::pg_catalog.jsonb)
   FROM pg_attrdef d WHERE d.adrelid=to_regclass('net.http_request_queue')),
 'queue_constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.oid),'[]'::pg_catalog.jsonb)
   FROM pg_constraint c WHERE c.conrelid=to_regclass('net.http_request_queue')),
 'queue_indexes',(SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid),'[]'::pg_catalog.jsonb)
   FROM pg_index i WHERE i.indrelid=to_regclass('net.http_request_queue')),
 'queue_rules',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.oid),'[]'::pg_catalog.jsonb)
   FROM pg_rewrite r WHERE r.ev_class=to_regclass('net.http_request_queue')),
 'queue_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.oid),'[]'::pg_catalog.jsonb)
   FROM pg_trigger t WHERE t.tgrelid=to_regclass('net.http_request_queue')),
 'managed_sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue_id_seq')),
 'managed_sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
   WHERE s.seqrelid=to_regclass('net.http_request_queue_id_seq')),
 'net_functions',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p WHERE p.pronamespace=to_regnamespace('net') AND p.prokind IN('f','p')),
 'stored_transport_consumers',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE p.prokind IN('f','p') AND n.nspname NOT IN('pg_catalog','information_schema','net','official_v3_guard_private','jetnity_pgnet_allocator_private')
   AND n.nspname NOT LIKE 'pg_temp%' AND n.nspname NOT LIKE 'pg_toast%'
   AND (p.prosrc ~ 'net[.]http_(get|post|delete)[[:space:]]*[(]'
     OR p.prosrc LIKE '%net.http_request_queue%'))
)"""

queue_shape_sql = """WITH expected(name,type_name,required_not_null) AS (VALUES
 ('id','pg_catalog.int8',true),('method','pg_catalog.text',true),('url','pg_catalog.text',true),
 ('headers','pg_catalog.jsonb',true),('body','pg_catalog.bytea',false),('timeout_milliseconds','pg_catalog.int4',true)),
 actual AS (SELECT * FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue') AND attnum>0)
SELECT (SELECT count(*) FROM actual)=6
 AND NOT EXISTS(SELECT 1 FROM expected e LEFT JOIN actual a ON a.attname=e.name
  WHERE a.attnum IS NULL OR a.attisdropped OR a.atttypid<>to_regtype(e.type_name)
  OR a.attnotnull IS DISTINCT FROM e.required_not_null OR a.attgenerated<>'' OR a.attidentity<>'')
 AND (SELECT count(*) FROM pg_attrdef WHERE adrelid=to_regclass('net.http_request_queue'))=1
 AND EXISTS(SELECT 1 FROM pg_attrdef d JOIN actual a ON a.attnum=d.adnum
  WHERE d.adrelid=to_regclass('net.http_request_queue') AND a.attname='id'
  AND pg_get_expr(d.adbin,d.adrelid)='nextval(''net.http_request_queue_id_seq''::regclass)')
 AS exact_queue_shape_and_legacy_default"""

allocator_expr = """jsonb_build_object(
 'namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('jetnity_pgnet_allocator_private')),
 'sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s WHERE s.seqrelid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'function',(SELECT (to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
   FROM pg_proc p WHERE p.oid=to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')),
 'global_trigger',(SELECT to_jsonb(t) FROM pg_trigger t
   WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1'),
 'dependencies',(WITH owned_objects(classid,objid) AS (
   VALUES ('pg_namespace'::pg_catalog.regclass::pg_catalog.oid,to_regnamespace('jetnity_pgnet_allocator_private')::pg_catalog.oid),
    ('pg_class'::pg_catalog.regclass::pg_catalog.oid,to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')::pg_catalog.oid),
    ('pg_proc'::pg_catalog.regclass::pg_catalog.oid,to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')::pg_catalog.oid)
   UNION SELECT 'pg_trigger'::pg_catalog.regclass::pg_catalog.oid,t.oid FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1')
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype),'[]'::pg_catalog.jsonb)
  FROM pg_depend d WHERE (d.classid,d.objid) IN(SELECT * FROM owned_objects)
   OR (d.refclassid,d.refobjid) IN(SELECT * FROM owned_objects)),
 'shared_dependencies',(WITH owned_objects(classid,objid) AS (
   VALUES ('pg_namespace'::pg_catalog.regclass::pg_catalog.oid,to_regnamespace('jetnity_pgnet_allocator_private')::pg_catalog.oid),
    ('pg_class'::pg_catalog.regclass::pg_catalog.oid,to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')::pg_catalog.oid),
    ('pg_proc'::pg_catalog.regclass::pg_catalog.oid,to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')::pg_catalog.oid)
   UNION SELECT 'pg_trigger'::pg_catalog.regclass::pg_catalog.oid,t.oid FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1')
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype),'[]'::pg_catalog.jsonb)
  FROM pg_shdepend d WHERE d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
   AND (d.classid,d.objid) IN(SELECT * FROM owned_objects))
)"""
transport_expr = "jsonb_build_object('native'," + native_expr + ",'allocator'," + allocator_expr + ")"

source_history_expr = """jsonb_build_object(
 'pins',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(x)::text,'|' ORDER BY x.source_id COLLATE \"C\"),''),'UTF8')),'hex') FROM official_v3_at_production_private.source_pins_v1 x),
 'originals',(SELECT encode(sha256(convert_to(coalesce(string_agg(((to_jsonb(x)-'raw_body')||jsonb_build_object('actual_body_sha256',encode(sha256(x.raw_body),'hex')))::text,'|' ORDER BY x.source_id COLLATE \"C\"),''),'UTF8')),'hex') FROM official_v3_at_production_private.first_originals_v1 x),
 'facts',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(x)::text,'|' ORDER BY x.version_id),''),'UTF8')),'hex') FROM official_v3_at_production_private.ch_visa_facts_v1 x),
 'pin_count',(SELECT count(*) FROM official_v3_at_production_private.source_pins_v1),
 'original_count',(SELECT count(*) FROM official_v3_at_production_private.first_originals_v1),
 'fact_count',(SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v1)
)"""
owner_history_expr = """(SELECT jsonb_build_object('count',count(*),'sha256',encode(sha256(convert_to(coalesce(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text COLLATE \"C\"),''),'UTF8')),'hex')) FROM official_v3_guard_private.owner_operations_v1 x)"""

# Publisher's own qualification barrier is before all old BG1/source/renewal work.
# None of these predicates change a qualification flag, source body or fact.
qualification_barrier = """
 -- Production HTTP allocator prerequisite: real legal/customer source evidence.
 -- A transport repair never qualifies a source or turns research into a fact.
 IF session_user<>'postgres' OR current_user<>session_user THEN RETURN 0; END IF;
 IF (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.source_pins_v1
   WHERE source_qualified IS DISTINCT FROM true OR research_only IS DISTINCT FROM false)
 OR (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.first_originals_v1
   WHERE legal_source_approved IS DISTINCT FROM true OR customer_rule_approved IS DISTINCT FROM true)
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1 p
   JOIN official_v3_at_production_private.first_originals_v1 o USING(source_id)
   WHERE o.raw_sha=p.original_sha AND o.raw_bytes=p.original_bytes
    AND encode(sha256(o.raw_body),'hex')=p.original_sha)<>3
 THEN RETURN 0; END IF;
"""
new_functions: dict[str, str] = {}
for signature, (prefix, body, suffix) in originals.items():
    if signature.endswith(".audit_v1()") or signature.endswith(".enqueue_v1()") or signature.endswith(".collect_v1()"):
        continue
    if signature.endswith(".renew_ch_v1()"):
        body = exact_once(body, "\nBEGIN\n", "\nBEGIN\n" + qualification_barrier)
    elif signature.endswith(".catalog_status_v1()"):
        anchor = '\n)\nSELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries\n'
        body = exact_once(body, anchor, "\n UNION ALL SELECT '" + TRANSPORT_KEY + "'," + transport_expr + anchor)
    elif signature.endswith(".assert_catalog_v1()"):
        body = exact_once(body, "DECLARE bg1_v3", "DECLARE allocator_v4 " + NEW_BASE + "%ROWTYPE;\n bg1_v3")
        body = exact_once(body, "\nBEGIN\n", "\nBEGIN\n  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN\n    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;\n  SELECT * INTO STRICT allocator_v4 FROM " + NEW_BASE + " WHERE singleton;\n")
        old = " OR bg1_v3.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN"
        new = """ OR encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR allocator_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR allocator_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR allocator_v4.required_generation<=bg1_v3.required_generation
 OR allocator_v4.proof_not_before<=bg1_v3.proof_not_before
 OR allocator_v4.publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
 OR allocator_v4.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.transport_metadata::text,'UTF8')),'hex')
 OR allocator_v4.transport_metadata IS DISTINCT FROM (official_v3_guard_private.catalog_status_v1()->'""" + TRANSPORT_KEY + """')
 OR allocator_v4.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN"""
        body = exact_once(body, old, new)
    elif signature.endswith(".require_open_v1()"):
        body = exact_once(body, "\nBEGIN\n", "\nBEGIN\n  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN\n    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;\n")
        anchor = "    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;\n"
        body = exact_once(body, anchor, anchor + "  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)\n    INTO STRICT required_proof,earliest_proof FROM " + NEW_BASE + " v WHERE v.singleton;\n")
    elif signature == "public.official_v3_guard_alarm_status_v1()":
        body = exact_once(body, "\nBEGIN\n", "\nBEGIN\n  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN RETURN unavailable_value; END IF;\n")
        anchor = "    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;\n"
        body = exact_once(body, anchor, anchor + "  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)\n    INTO STRICT required_proof,earliest_proof FROM " + NEW_BASE + " v WHERE v.singleton;\n")
    else:
        raise ValueError(signature)
    new_functions[signature] = prefix + body + suffix

helper_body = """
BEGIN
 IF TG_RELID<>'net.http_request_queue'::pg_catalog.regclass OR TG_OP<>'INSERT'
 OR TG_WHEN<>'BEFORE' OR TG_LEVEL<>'ROW' OR TG_NARGS<>0
 OR TG_NAME<>'jetnity_pgnet_request_id_v1'
 OR pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
  RAISE EXCEPTION 'PROD_ALLOCATOR_EXACT_QUEUE_TRIGGER_REQUIRED' USING ERRCODE='P7998';
 END IF;
 -- Every regular queue producer receives its ID from the same private allocator.
 -- Incoming/default IDs are ignored. Legitimate nested triggers are allowed.
 NEW.id:=pg_catalog.nextval('jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass);
 RETURN NEW;
END """
helper_create = "CREATE FUNCTION " + HELPER + " RETURNS trigger\nLANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $assign$" + helper_body + "$assign$;\n"
fence_body = helper_body[:helper_body.index(" -- Every regular")] + " RAISE EXCEPTION 'PROD_HTTP_ID_ALLOCATOR_FENCED_FORWARD_REPAIR_REQUIRED' USING ERRCODE='P7998';\nEND "
fence_replace = "CREATE OR REPLACE FUNCTION " + HELPER + " RETURNS trigger\nLANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $assign$" + fence_body + "$assign$;\n"

# Additional SQL rendering is below; its outputs have no execution capability.
readonly_header = """-- PREPARED ONLY; NOT EXECUTED. Separate exact Production READ Go required.
-- Fixed connector target qscbgcdmivbbnzrcyegn; SQL marker checks do not authenticate a project ref.
-- One transaction, no retry, no automatic installation, no app/guard routine invocation.
-- Catalog bindings only; no source/fact/Owner data rows, raw function bodies or configuration values.
-- Missing fixed objects/columns, over-cap results or SQL/service errors mean STOP.
-- Missing optional hooks/schema is inspected only through catalog lookups, never FROM an absent table.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
SET LOCAL transaction_timeout='20s';
SET LOCAL row_security=off;
"""
binding_signatures = list(observed) + [
    "official_v3_guard_private.check_control_v1()",
    "official_v3_guard_private.check_retirements_v1()",
    "official_v3_guard_private.immutable_v1()",
    "official_v3_guard_private.latch_incident_v1(timestamp with time zone,text)",
    "jetnity_prod_import_scheduler.tick_v1()",
    "net.wake()",
]
values = ",\n ".join("(" + sql_literal(s) + ")" for s in binding_signatures)
baseline_canonical = "(to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))"
binding_sql = readonly_header + """
WITH expected_functions(signature) AS (VALUES
 """ + values + """), context AS MATERIALIZED (
 SELECT coalesce(current_database()='postgres' AND current_user='postgres' AND session_user='postgres'
 AND current_setting('server_version_num')::integer/10000=17
 AND current_setting('server_encoding')='UTF8'
 AND current_setting('transaction_read_only')='on'
 AND current_setting('transaction_isolation')='repeatable read'
 AND current_setting('session_replication_role') IN('origin','local')
 AND EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolbypassrls)
 AND to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NOT NULL
 AND to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 AND to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 AND to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 AND to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 AND to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NULL
 AND to_regclass('""" + NEW_BASE + """') IS NULL
 AND to_regnamespace('jetnity_pgnet_allocator_private') IS NULL,false) AS ok
), cap AS MATERIALIZED (
 SELECT (SELECT count(*) FROM pg_proc WHERE pronamespace=to_regnamespace('net') AND prokind IN('f','p'))<=64
 AND (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.prokind IN('f','p') AND n.nspname NOT IN('pg_catalog','information_schema','net','official_v3_guard_private','jetnity_pgnet_allocator_private')
  AND n.nspname NOT LIKE 'pg_temp%' AND n.nspname NOT LIKE 'pg_toast%'
  AND (p.prosrc ~ 'net[.]http_(get|post|delete)[[:space:]]*[(]' OR p.prosrc LIKE '%net.http_request_queue%'))<=64
 AND (SELECT count(*) FROM pg_db_role_setting s WHERE EXISTS(SELECT 1 FROM unnest(s.setconfig) cfg WHERE cfg LIKE 'session_replication_role=%'))<=64
 AND (SELECT count(*) FROM pg_proc p WHERE EXISTS(SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'session_replication_role=%'))<=64
 AND (SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue'))<=32
 AND NOT EXISTS(SELECT 1 FROM expected_functions e LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.signature)
  WHERE p.oid IS NULL OR p.prokind NOT IN('f','p') OR octet_length(p.prosrc)>65536) AS ok
), functions AS MATERIALIZED (
 SELECT e.signature,pg_get_userbyid(p.proowner) AS owner,p.prosecdef,p.provolatile,
 encode(sha256(convert_to(coalesce(to_jsonb(p.proconfig)::text,'null'),'UTF8')),'hex') AS config_sha256,
 encode(sha256(convert_to(coalesce(to_jsonb(p.proacl)::text,'null'),'UTF8')),'hex') AS acl_sha256,
 pg_get_function_result(p.oid) AS result_type,
 encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') AS definition_sha256,
 encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') AS body_sha256
 FROM expected_functions e JOIN pg_proc p ON p.oid=to_regprocedure(e.signature)
 CROSS JOIN context c CROSS JOIN cap b WHERE c.ok AND b.ok
), queue_shape AS MATERIALIZED (
 """ + queue_shape_sql + """
), inventory AS MATERIALIZED (
 """ + inventory_sql + """
), values_if_bounded AS MATERIALIZED (
 SELECT CASE WHEN c.ok AND b.ok AND i.exact_inventory AND q.exact_queue_shape_and_legacy_default THEN
 jsonb_build_object('native_transport',""" + native_expr + """)
 END AS value,c.ok AS context_ok,b.ok AS caps_ok,i.exact_inventory,q.exact_queue_shape_and_legacy_default
 FROM context c CROSS JOIN cap b CROSS JOIN inventory i CROSS JOIN queue_shape q
), result_document AS (
 SELECT jsonb_build_object(
  'package','PROD_HTTP_ALLOCATOR_BINDINGS_20261121','declared_target','qscbgcdmivbbnzrcyegn',
  'project_ref_authenticated_by_sql',false,'observed_at',statement_timestamp(),
  'result',CASE WHEN NOT context_ok THEN 'STOP_CONTEXT' WHEN NOT caps_ok THEN 'STOP_MISSING_OR_OVER_CAP'
   WHEN NOT exact_inventory THEN 'STOP_ID_INVENTORY_CHANGED'
   WHEN NOT exact_queue_shape_and_legacy_default THEN 'STOP_QUEUE_SHAPE_OR_LEGACY_DEFAULT_CHANGED'
   WHEN value IS NULL THEN 'STOP_NULL_BINDINGS'
   ELSE 'BINDINGS_READ_REVIEW_REQUIRED_NO_EXECUTION_PERMISSION' END,
  'context_ok',context_ok,'caps_ok',caps_ok,'exact_four_id_paths',exact_inventory,
  'exact_queue_shape_and_legacy_default',exact_queue_shape_and_legacy_default,
  'legacy_id_default_sha256',(SELECT encode(sha256(convert_to(pg_get_expr(d.adbin,d.adrelid),'UTF8')),'hex')
    FROM pg_attrdef d JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
    WHERE d.adrelid=to_regclass('net.http_request_queue') AND a.attname='id'),
  'functions',(SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY signature),'[]'::jsonb) FROM functions f),
  'native_transport_sha256',encode(sha256(convert_to((value->'native_transport')::text,'UTF8')),'hex'),
  'native_transport_raw_values_returned',false,
  'transport_safe_shape',jsonb_build_object(
   'extension_version',value#>>'{native_transport,pg_net_extension,extversion}',
   'queue_owner',(SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid=to_regclass('net.http_request_queue')),
   'queue_attribute_count',jsonb_array_length(value#>'{native_transport,queue_attributes}'),
   'queue_default_count',jsonb_array_length(value#>'{native_transport,queue_defaults}'),
   'queue_constraint_count',jsonb_array_length(value#>'{native_transport,queue_constraints}'),
   'queue_index_count',jsonb_array_length(value#>'{native_transport,queue_indexes}'),
   'queue_rule_count',jsonb_array_length(value#>'{native_transport,queue_rules}'),
   'queue_trigger_count',jsonb_array_length(value#>'{native_transport,queue_triggers}'),
   'net_function_count',jsonb_array_length(value#>'{native_transport,net_functions}'),
   'stored_transport_consumer_count',jsonb_array_length(value#>'{native_transport,stored_transport_consumers}'),
   'supautils_privileged_role_is_expected',current_setting('supautils.privileged_role',true)='supabase_privileged_role',
   'supautils_allows_replica_parameter',position('session_replication_role' IN current_setting('supautils.privileged_role_allowed_configs',true))>0),
  'transport_function_fingerprints',(SELECT coalesce(jsonb_agg(jsonb_build_object(
    'signature',p.oid::pg_catalog.regprocedure::text,'owner',pg_get_userbyid(p.proowner),
    'definition_sha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'),
    'body_sha256',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')) ORDER BY p.oid),'[]'::jsonb)
   FROM pg_proc p WHERE p.oid IN(SELECT (v->>'oid')::oid FROM jsonb_array_elements(value#>'{native_transport,net_functions}') v
    UNION SELECT (v->>'oid')::oid FROM jsonb_array_elements(value#>'{native_transport,stored_transport_consumers}') v)),
  'hooks_absent',to_regclass('supabase_functions.hooks') IS NULL,
  'queue_insert',has_table_privilege(current_user,'net.http_request_queue','INSERT'),
  'queue_update',has_table_privilege(current_user,'net.http_request_queue','UPDATE'),
  'queue_trigger',has_table_privilege(current_user,'net.http_request_queue','TRIGGER'),
  'server_version_num',current_setting('server_version_num'),
  'read_only',current_setting('transaction_read_only')='on',
  'raw_history_or_source_body_returned',false,'product_routine_invoked',false,
  'worker_binary_or_0195_source_contract_verified',false,
  'repair_permission',false,'followup_query_permission',false) AS document
 FROM values_if_bounded
)
SELECT CASE WHEN octet_length(document::text)<=1048576 THEN document ELSE
 jsonb_build_object('result','STOP_OUTPUT_OVER_1048576_BYTES','repair_permission',false,
 'followup_query_permission',false) END AS result FROM result_document;
ROLLBACK;
"""
(HERE / "01-required-bindings.READONLY.sql").write_text(binding_sql)

header = """-- PREPARED REVIEW CANDIDATE ONLY. NOT EXECUTED. No Production action is authorized by this file.
-- Fixed external target: qscbgcdmivbbnzrcyegn; SQL target markers alone are not project authentication.
-- PostgreSQL 17 / recorded Production pg_net 0.19.5. Four exact ID paths; hooks is absent.
-- NULL binding pins below stop before any TEMP object or DDL. Resolve only through the finite,
-- separately approved 01-required-bindings.READONLY.sql plus independent source review/rebuild.
-- Ordinary net API INSERT producers in origin/local only. No replica/direct-UPDATE/hostile-DBA guarantee.
-- No managed owner/default change, no role grants, no manual HTTP/wake, no status/reset/qualification change.
-- New source barrier, allocator, trigger and append-only BG1 successor belong to the same transaction.
-- Keep expired facts unavailable. A later natural complete BG1 proof is required; never invoke audit here.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL transaction_timeout='90s';
SET LOCAL row_security=off;
"""
required_keys = ["native_transport_sha256"]
missing_values = ",\n ".join("(" + sql_literal(key) + "," + sql_literal(pins[key]) + ")" for key in required_keys)
known_functions_values = ",\n ".join("(" + sql_literal(signature) + "," + sql_literal(row["definition_sha256"]) + ")" for signature, row in observed.items())
missing_function_values = ",\n ".join("(" + sql_literal(signature) + "," + sql_literal(pins[key]) + ")" for signature, key in [
])

preflight = """
-- This is an evidence gate, not a substitute for the Owner's separate execution Go.
DO $production_pins_before_any_ddl$
DECLARE missing text[]; item record; old_catalog jsonb; expected_control_digest text;
BEGIN
 SELECT array_agg(name ORDER BY name) INTO missing FROM (VALUES
 """ + missing_values + """
 ) p(name,value) WHERE value IS NULL OR value !~ '^[a-f0-9]{64}$';
 IF missing IS NOT NULL THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_MISSING_INDEPENDENT_BINDINGS: %',array_to_string(missing,', ')
   USING ERRCODE='P7998'; END IF;
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('server_encoding')<>'UTF8'
 OR current_setting('transaction_isolation')<>'read committed'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NOT NULL
 OR to_regclass('official_v3_guard_private.at_legal_source_guard_baseline_v4') IS NOT NULL
 OR to_regclass('""" + NEW_BASE + """') IS NOT NULL
 OR to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR to_regclass('supabase_functions.hooks') IS NOT NULL
 OR (SELECT extversion FROM pg_extension WHERE extname='pg_net') IS DISTINCT FROM '0.19.5'
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_WRONG_OR_CHANGED_PRODUCTION_LINEAGE' USING ERRCODE='P7998'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolbypassrls AND NOT rolsuper)
 OR has_database_privilege(current_user,current_database(),'CREATE') IS DISTINCT FROM true
 OR has_schema_privilege(current_user,'net','USAGE') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','INSERT') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','UPDATE') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','SELECT') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','TRIGGER') IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_ORDINARY_AUTHORITY_MISSING' USING ERRCODE='42501'; END IF;
 FOR item IN SELECT * FROM (VALUES
 """ + known_functions_values + """
 ) expected(signature,digest) LOOP
  IF to_regprocedure(item.signature) IS NULL
  OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(item.signature)),'UTF8')),'hex') IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_STOP_FUNCTION_PIN: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 -- Same first existing guard lock as audit and Owner closures; never take it late.
 IF NOT pg_try_advisory_xact_lock(771106,1) THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_GUARD_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771106,32) THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_IMPORT_PRODUCER_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771112,1) THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_AT_ENQUEUE_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771112,2) THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_AT_RENEWAL_BUSY' USING ERRCODE='P7998'; END IF;
 -- The exact V2 catalog SHA anchors every existing protected control definition.
 -- Read expected leaf pins only FROM THAT VERIFIED BLOB, never from current pg_proc.
 SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
 IF encode(sha256(convert_to(old_catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR old_catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_FIXED_V2_CATALOG_ANCHOR_MISMATCH' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT signature FROM (VALUES
  ('official_v3_guard_private.check_control_v1()'),('official_v3_guard_private.check_retirements_v1()'),
  ('official_v3_guard_private.immutable_v1()')) required(signature) LOOP
  expected_control_digest:=old_catalog->('function:'||to_regprocedure(item.signature)::oid)->>'definition';
  IF expected_control_digest IS NULL OR expected_control_digest !~ '^[a-f0-9]{64}$'
  OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(item.signature)),'UTF8')),'hex') IS DISTINCT FROM expected_control_digest
  THEN RAISE EXCEPTION 'PROD_HTTP_STOP_EXISTING_PINNED_CONTROL_CHANGED: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 -- Existing functions are called only AFTER the independently anchored digest checks.
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_control_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR (SELECT count(*) FROM official_v3_guard_private.bg1_transient_baseline_v3)<>1
 OR (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton)
  IS DISTINCT FROM '7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton
  AND required_generation=1344 AND proof_not_before='2026-11-20T22:51:44.959438Z'::timestamptz)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_OLD_GUARD_OR_BASELINE_NOT_EXACT' USING ERRCODE='P7998'; END IF;
END $production_pins_before_any_ddl$;

-- GLOBAL BARRIER FIRST: covers every ordinary net queue INSERT/worker writer.
-- A new READ COMMITTED statement follows this acquisition before any MAX read.
LOCK TABLE net.http_request_queue IN SHARE ROW EXCLUSIVE MODE;
-- Fixed NOWAIT ledger/history locks close producer/collector races without waiting
-- on an inverted caller hierarchy. Any busy relation stops the entire transaction.
LOCK TABLE net._http_response IN SHARE MODE NOWAIT;
LOCK TABLE jetnity_prod_import_scheduler.dispatches_v1 IN SHARE MODE NOWAIT;
LOCK TABLE jetnity_prod_import_scheduler.cycles_v1 IN SHARE MODE NOWAIT;
LOCK TABLE jetnity_prod_import_scheduler.state_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.watch_requests_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.watch_batches_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.watch_observations_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.source_pins_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.first_originals_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.ch_visa_facts_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_guard_private.owner_operations_v1 IN SHARE MODE NOWAIT;
LOCK TABLE cron.job IN SHARE MODE NOWAIT;

CREATE FUNCTION pg_temp.prod_http_inventory_exact() RETURNS boolean
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $inventory$
""" + inventory_sql + """
$inventory$;
REVOKE ALL ON FUNCTION pg_temp.prod_http_inventory_exact() FROM PUBLIC;
CREATE FUNCTION pg_temp.prod_http_native_state() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $native$
 SELECT """ + native_expr + """
$native$;
REVOKE ALL ON FUNCTION pg_temp.prod_http_native_state() FROM PUBLIC;
CREATE FUNCTION pg_temp.prod_http_allocator_state() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $allocator$
 SELECT """ + allocator_expr + """
$allocator$;
REVOKE ALL ON FUNCTION pg_temp.prod_http_allocator_state() FROM PUBLIC;
"""

protected_tables = [
    ("official_v3_guard_private.baselines_v1", 3),
    ("official_v3_guard_private.status_baseline_v1", 1),
    ("official_v3_guard_private.rolling_quota_baseline_v1", 1),
    ("official_v3_guard_private.admin_runtime_baseline_v1", 1),
    ("official_v3_guard_private.saved_offers_baseline_v1", 1),
    ("official_v3_guard_private.weather_quota_baseline_v1", 1),
    ("official_v3_guard_private.at_source_monitor_baseline_v1", 1),
    ("official_v3_guard_private.at_batch_switch_baseline_v2", 1),
    ("official_v3_guard_private.bg1_transient_baseline_v3", 1),
    ("official_v3_guard_private.owner_operations_v1", 2048),
    ("official_v3_guard_private.state_v1", 1),
    ("official_v3_guard_private.incidents_v1", 2048),
    ("official_v3_guard_private.runs_v1", 20000),
    ("official_v3_at_production_private.source_pins_v1", 3),
    ("official_v3_at_production_private.first_originals_v1", 3),
    ("official_v3_at_production_private.ch_visa_facts_v1", 1000),
    ("official_v3_at_production_private.watch_requests_v1", 10000),
    ("official_v3_at_production_private.watch_batches_v1", 10000),
    ("official_v3_at_production_private.watch_observations_v1", 10000),
    ("jetnity_prod_import_scheduler.dispatches_v1", 10000),
    ("jetnity_prod_import_scheduler.cycles_v1", 1000),
    ("jetnity_prod_import_scheduler.state_v1", 1),
    ("net.http_request_queue", 10000),
    ("net._http_response", 10000),
    ("cron.job", 128),
]
table_values = ",\n  ".join("(" + sql_literal(name) + "," + str(cap) + ")" for name, cap in protected_tables)
snapshot_functions = """
-- Hash complete row multisets, not only ID prefixes or counts. No raw row leaves SQL.
-- Identifiers below are a literal allowlist, never data-supplied SQL or an arbitrary relation sweep.
CREATE FUNCTION pg_temp.prod_http_protected_state() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $protected$
DECLARE item record; n bigint; digest text; result jsonb:='{}'::jsonb;
 f regclass; state_value jsonb;
BEGIN
 IF (SELECT count(*) FROM (SELECT 1 FROM official_v3_at_production_private.first_originals_v1 LIMIT 4) limited)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.first_originals_v1 WHERE raw_body IS NULL OR octet_length(raw_body)>1048576)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_ORIGINAL_BYTES_CAP' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
  """ + table_values + """
 ) fixed(relation_name,row_cap) LOOP
  IF to_regclass(item.relation_name) IS NULL THEN
   RAISE EXCEPTION 'PROD_HTTP_STOP_PROTECTED_RELATION_MISSING: %',item.relation_name USING ERRCODE='P7998'; END IF;
  EXECUTE format('SELECT count(*) FROM (SELECT 1 FROM %s LIMIT %s) bounded',
   to_regclass(item.relation_name),item.row_cap+1) INTO n;
  IF n>item.row_cap THEN
   RAISE EXCEPTION 'PROD_HTTP_STOP_PROTECTED_HISTORY_CAP: %',item.relation_name USING ERRCODE='P7998'; END IF;
  EXECUTE format('SELECT encode(sha256(convert_to(coalesce(string_agg(row_sha,''|'' ORDER BY row_sha COLLATE "C"),''''),''UTF8'')),''hex'') FROM (SELECT encode(sha256(convert_to(to_jsonb(x)::text,''UTF8'')),''hex'') row_sha FROM %s x) rows',
   to_regclass(item.relation_name)) INTO digest;
  result:=result||jsonb_build_object(item.relation_name,jsonb_build_object('count',n,'sha256',digest));
 END LOOP;
 f:=pg_get_serial_sequence('official_v3_at_production_private.ch_visa_facts_v1','version_id')::pg_catalog.regclass;
 IF f IS NULL THEN RAISE EXCEPTION 'PROD_HTTP_STOP_FACT_SEQUENCE_MISSING' USING ERRCODE='P7998'; END IF;
 EXECUTE format('SELECT jsonb_build_object(''last_value'',last_value::text,''log_cnt'',log_cnt::text,''is_called'',is_called) FROM %s',f)
 INTO STRICT state_value;
 RETURN result||jsonb_build_object('fact_sequence',jsonb_build_object('oid',f::oid,'state',state_value,
  'parameters',(SELECT to_jsonb(s) FROM pg_sequence s WHERE seqrelid=f)),
  'legacy_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called) FROM net.http_request_queue_id_seq));
END $protected$;
REVOKE ALL ON FUNCTION pg_temp.prod_http_protected_state() FROM PUBLIC;

CREATE TEMP TABLE pg_temp.prod_http_before(
 singleton boolean PRIMARY KEY CHECK(singleton),catalog jsonb NOT NULL,native jsonb NOT NULL,
 protected_state jsonb NOT NULL,source_history jsonb NOT NULL,owner_history jsonb NOT NULL,
 legacy_value bigint NOT NULL,legacy_called boolean NOT NULL,history_max bigint NOT NULL,
 first_id bigint NOT NULL,source_unqualified boolean NOT NULL,
 guard_function_rows jsonb NOT NULL
) ON COMMIT DROP;

DO $fresh_locked_high_water_and_snapshot$
DECLARE seq pg_sequence%ROWTYPE; last_number bigint; called boolean; hwm bigint; base bigint;
 native jsonb; source_history jsonb; owner_history jsonb; functions jsonb; unqualified boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND granted
  AND locktype='relation' AND relation='net.http_request_queue'::pg_catalog.regclass
  AND mode='ShareRowExclusiveLock')
 OR pg_temp.prod_http_inventory_exact() IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_GLOBAL_LOCK_OR_EXACT_INVENTORY_MISSING' USING ERRCODE='P7998'; END IF;
 IF (""" + queue_shape_sql + """) IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_EXACT_QUEUE_SHAPE_AND_LEGACY_NEXTVAL_DEFAULT_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass)
 OR EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='net.http_request_queue'::pg_catalog.regclass)
 OR EXISTS(SELECT 1 FROM pg_rewrite WHERE ev_class='net.http_request_queue'::pg_catalog.regclass)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_QUEUE_TRIGGER_CONSTRAINT_OR_RULE_UNREVIEWED' USING ERRCODE='P7998'; END IF;
 SELECT * INTO STRICT seq FROM pg_sequence WHERE seqrelid='net.http_request_queue_id_seq'::pg_catalog.regclass;
 IF seq.seqtypid<>'pg_catalog.int8'::pg_catalog.regtype OR seq.seqincrement<>1 OR seq.seqcache<>1
 OR seq.seqcycle OR seq.seqmin<>1 OR seq.seqmax<>9223372036854775807
 OR NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=seq.seqrelid AND relkind='S'
   AND relpersistence='u' AND relowner='supabase_admin'::pg_catalog.regrole)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_LEGACY_METADATA_CHANGED' USING ERRCODE='P7998'; END IF;
 -- This is intentionally the first mutable value/MAX read, after all barriers.
 SELECT last_value,is_called INTO STRICT last_number,called FROM net.http_request_queue_id_seq;
 SELECT greatest(coalesce((SELECT max(net_request_id) FROM jetnity_prod_import_scheduler.dispatches_v1),0),
  coalesce((SELECT max(request_id) FROM official_v3_at_production_private.watch_requests_v1),0),
  coalesce((SELECT max(id) FROM net.http_request_queue),0),
  coalesce((SELECT max(id) FROM net._http_response),0)) INTO hwm;
 base:=greatest(211::bigint,last_number,hwm);
 -- 1024 deliberately unused numbers, then first_id=base+1025. Never seed from 211 alone.
 -- The spare upper bound also covers this candidate's two IDs and restart probes.
 IF last_number<1 OR hwm<211 OR base>9223372036854775807-2048
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_INVALID_MISSING_HISTORY_OR_RANGE_EXHAUSTED' USING ERRCODE='P7998'; END IF;
 native:=pg_temp.prod_http_native_state();
 IF encode(sha256(convert_to(native::text,'UTF8')),'hex') IS DISTINCT FROM """ + sql_literal(pins["native_transport_sha256"]) + """
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_REVIEWED_NATIVE_TRANSPORT_CHANGED' USING ERRCODE='P7998'; END IF;
 IF (SELECT count(*) FROM (SELECT 1 FROM official_v3_at_production_private.first_originals_v1 LIMIT 4) limited)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.first_originals_v1 WHERE raw_body IS NULL OR octet_length(raw_body)>1048576)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_ORIGINAL_BYTES_CAP' USING ERRCODE='P7998'; END IF;
 source_history:=""" + source_history_expr + ";\n owner_history:=" + owner_history_expr + """;
 SELECT (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)=3
 AND (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)=3
 AND NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.source_pins_v1 WHERE source_qualified AND NOT research_only)
 AND NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.first_originals_v1 WHERE legal_source_approved OR customer_rule_approved)
 AND NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_visa_facts_v1 WHERE expires_at>clock_timestamp())
 INTO unqualified;
 IF unqualified IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_SOURCE_QUALIFICATION_STATE_CHANGED_REVIEW_REQUIRED' USING ERRCODE='P7998'; END IF;
 SELECT jsonb_object_agg(p.oid::text,to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody']) INTO functions
 FROM pg_proc p WHERE p.oid IN(
  'official_v3_guard_private.catalog_status_v1()'::pg_catalog.regprocedure,
  'official_v3_guard_private.assert_catalog_v1()'::pg_catalog.regprocedure,
  'official_v3_guard_private.require_open_v1()'::pg_catalog.regprocedure,
  'public.official_v3_guard_alarm_status_v1()'::pg_catalog.regprocedure,
  'official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure);
 INSERT INTO pg_temp.prod_http_before VALUES(true,official_v3_guard_private.catalog_status_v1(),
  native,pg_temp.prod_http_protected_state(),source_history,owner_history,last_number,called,hwm,base+1025,unqualified,functions);
 IF (SELECT catalog FROM pg_temp.prod_http_before WHERE singleton) IS DISTINCT FROM
  (SELECT catalog FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_OLD_CATALOG_CHANGED_WHILE_WAITING' USING ERRCODE='P7998'; END IF;
END $fresh_locked_high_water_and_snapshot$;
SAVEPOINT production_before_install;
"""

allocator_ddl = """
CREATE SCHEMA jetnity_pgnet_allocator_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_pgnet_allocator_private FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
DO $create_owned_logged_sequence$
DECLARE first_number bigint;
BEGIN
 SELECT first_id INTO STRICT first_number FROM pg_temp.prod_http_before WHERE singleton;
 EXECUTE format('CREATE SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH %s CACHE 1 NO CYCLE',first_number);
END $create_owned_logged_sequence$;
REVOKE ALL ON SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
""" + helper_create + """
REVOKE ALL ON FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE TRIGGER jetnity_pgnet_request_id_v1 BEFORE INSERT ON net.http_request_queue
 FOR EACH ROW EXECUTE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1();

DO $exact_owned_allocator_and_managed_delta$
DECLARE original pg_temp.prod_http_before%ROWTYPE; native jsonb;
BEGIN
 SELECT * INTO STRICT original FROM pg_temp.prod_http_before WHERE singleton;
 IF NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_sequence s ON s.seqrelid=c.oid
  WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass
  AND c.relkind='S' AND c.relpersistence='p' AND c.relowner='postgres'::pg_catalog.regrole
  AND s.seqtypid='pg_catalog.int8'::pg_catalog.regtype AND s.seqincrement=1 AND s.seqcache=1
  AND s.seqmin=1 AND s.seqmax=9223372036854775807 AND NOT s.seqcycle)
 OR NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
  AND p.proowner='postgres'::pg_catalog.regrole AND p.prosecdef AND p.provolatile='v'
  AND p.prorettype='pg_catalog.trigger'::pg_catalog.regtype AND p.pronargs=0
  AND p.proconfig=ARRAY['search_path=pg_catalog']
  AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')='""" + sha(helper_body) + """')
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass
  AND tgname='jetnity_pgnet_request_id_v1' AND tgtype=7 AND tgenabled='O'
  AND NOT tgisinternal AND tgconstraint=0 AND tgnargs=0 AND tgqual IS NULL
  AND tgfoid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure)
 THEN RAISE EXCEPTION 'PROD_HTTP_NEW_ALLOCATOR_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE oid='jetnity_pgnet_allocator_private'::pg_catalog.regnamespace
  AND nspowner='postgres'::pg_catalog.regrole)
 OR EXISTS(SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a
  WHERE n.oid='jetnity_pgnet_allocator_private'::pg_catalog.regnamespace
   AND (n.nspowner<>'postgres'::pg_catalog.regrole OR a.grantee<>'postgres'::pg_catalog.regrole))
 OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('S',c.relowner))) a
  WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass
   AND a.grantee<>'postgres'::pg_catalog.regrole)
 OR EXISTS(SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
   AND a.grantee<>'postgres'::pg_catalog.regrole)
 THEN RAISE EXCEPTION 'PROD_HTTP_PRIVATE_ALLOCATOR_ACL_NOT_OWNER_ONLY' USING ERRCODE='P7998'; END IF;
 native:=pg_temp.prod_http_native_state();
 IF (native-'queue_relation'-'queue_triggers') IS DISTINCT FROM (original.native-'queue_relation'-'queue_triggers')
 OR ((native->'queue_relation')-'relhastriggers') IS DISTINCT FROM ((original.native->'queue_relation')-'relhastriggers')
 OR native#>'{queue_relation,relhastriggers}' IS DISTINCT FROM 'true'::jsonb
 THEN RAISE EXCEPTION 'PROD_HTTP_UNEXPECTED_MANAGED_TRANSPORT_DELTA' USING ERRCODE='P7998'; END IF;
END $exact_owned_allocator_and_managed_delta$;
"""

guard_ddl = """
-- A new immutable Production-v3 successor; none of the old baseline rows are rewritten.
CREATE TABLE """ + NEW_BASE + """(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 publisher_function_digest text NOT NULL CHECK(publisher_function_digest~'^[a-f0-9]{64}$'),
 transport_metadata jsonb NOT NULL CHECK(jsonb_typeof(transport_metadata)='object'),
 transport_metadata_digest text NOT NULL CHECK(transport_metadata_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
 catalog jsonb NOT NULL CHECK(jsonb_typeof(catalog)='object')
);
ALTER TABLE """ + NEW_BASE + """ ENABLE ROW LEVEL SECURITY;
ALTER TABLE """ + NEW_BASE + """ FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON """ + NEW_BASE + """ TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON """ + NEW_BASE + """
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON """ + NEW_BASE + """
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON """ + NEW_BASE + """ FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

""" + "\n".join(new_functions.values()) + """
INSERT INTO """ + NEW_BASE + """(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,publisher_function_digest,
 transport_metadata,transport_metadata_digest,required_generation,proof_not_before,catalog)
SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex'),
 meta.value,encode(sha256(convert_to(meta.value::text,'UTF8')),'hex'),
 greatest(s.generation,v.required_generation)+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_transient_baseline_v3 v
CROSS JOIN official_v3_guard_private.state_v1 s
CROSS JOIN LATERAL (SELECT official_v3_guard_private.catalog_status_v1()->'""" + TRANSPORT_KEY + """' AS value) meta
WHERE v.singleton AND s.singleton;
"""

new_bodies = {}
for signature, statement in new_functions.items():
    tag_match = re.search(r"\bAS\s+(\$[A-Za-z0-9_]*\$)", statement, re.I)
    assert tag_match is not None
    body = statement[tag_match.end():statement.index(tag_match.group(1), tag_match.end())]
    new_bodies[signature] = sha(body)
new_body_values = ",\n  ".join("(" + sql_literal(signature) + "," + sql_literal(digest) + ")" for signature, digest in new_bodies.items())

catalog_delta_check = """
 -- Preserve every old catalog key and every old function attribute except the
 -- five reviewed definitions. This is not a whole-current-catalog blind reseal.
 IF EXISTS(SELECT 1 FROM jsonb_each(original.catalog) old
  LEFT JOIN jsonb_each(live_catalog) actual ON actual.key=old.key
  WHERE CASE WHEN old.key IN (
   'function:'||'official_v3_guard_private.catalog_status_v1()'::pg_catalog.regprocedure::oid,
   'function:'||'official_v3_guard_private.assert_catalog_v1()'::pg_catalog.regprocedure::oid,
   'function:'||'official_v3_guard_private.require_open_v1()'::pg_catalog.regprocedure::oid,
   'function:'||'public.official_v3_guard_alarm_status_v1()'::pg_catalog.regprocedure::oid,
   'function:'||'official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure::oid)
  THEN (old.value-'definition') IS DISTINCT FROM (actual.value-'definition')
  ELSE old.value IS DISTINCT FROM actual.value END)
 THEN RAISE EXCEPTION 'PROD_HTTP_UNEXPECTED_PREDECESSOR_CATALOG_DELTA' USING ERRCODE='P7998'; END IF;
 IF EXISTS(
 WITH base AS (SELECT oid,reltoastrelid FROM pg_class WHERE oid='""" + NEW_BASE + """'::pg_catalog.regclass),
 relations AS (SELECT oid FROM base UNION SELECT reltoastrelid FROM base WHERE reltoastrelid<>0
  UNION SELECT indexrelid FROM pg_index WHERE indrelid IN(SELECT oid FROM base UNION SELECT reltoastrelid FROM base)),
 relation_types AS (SELECT oid,typarray FROM pg_type WHERE typrelid IN(SELECT oid FROM relations)),
 objects AS (
  SELECT 'pg_class'::pg_catalog.regclass::oid AS classid,oid AS objid FROM relations
  UNION SELECT 'pg_type'::pg_catalog.regclass,oid FROM relation_types
  UNION SELECT 'pg_type'::pg_catalog.regclass,typarray FROM relation_types WHERE typarray<>0
  UNION SELECT 'pg_constraint'::pg_catalog.regclass,oid FROM pg_constraint WHERE conrelid IN(SELECT oid FROM base)
  UNION SELECT 'pg_trigger'::pg_catalog.regclass,oid FROM pg_trigger WHERE tgrelid IN(SELECT oid FROM base)
  UNION SELECT 'pg_policy'::pg_catalog.regclass,oid FROM pg_policy WHERE polrelid IN(SELECT oid FROM base)
  UNION SELECT 'pg_attrdef'::pg_catalog.regclass,oid FROM pg_attrdef WHERE adrelid IN(SELECT oid FROM base)
  UNION SELECT 'pg_namespace'::pg_catalog.regclass,'jetnity_pgnet_allocator_private'::pg_catalog.regnamespace
  UNION SELECT 'pg_class'::pg_catalog.regclass,'jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass
  UNION SELECT 'pg_proc'::pg_catalog.regclass,'jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
  UNION SELECT 'pg_trigger'::pg_catalog.regclass,oid FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass
   AND tgname='jetnity_pgnet_request_id_v1'
 ), additions AS (SELECT a.* FROM jsonb_each(live_catalog) a WHERE NOT (original.catalog ? a.key))
 SELECT 1 FROM additions a WHERE NOT CASE
  WHEN a.key='""" + TRANSPORT_KEY + """' THEN true
  WHEN split_part(a.key,':',1) IN('relation','index') THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_class'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='type' THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_type'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='constraint' THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_constraint'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='trigger' THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_trigger'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='policy' THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_policy'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='default' THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_attrdef'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='attribute' THEN split_part(a.key,':',2)::oid IN(SELECT oid FROM relations)
  WHEN split_part(a.key,':',1) IN('dependency','shared') THEN EXISTS(SELECT 1 FROM objects o
   WHERE (o.classid=(a.value->>'classid')::oid AND o.objid=(a.value->>'objid')::oid)
   OR (split_part(a.key,':',1)='dependency' AND o.classid=(a.value->>'refclassid')::oid AND o.objid=(a.value->>'refobjid')::oid))
  ELSE false END)
 THEN RAISE EXCEPTION 'PROD_HTTP_UNEXPECTED_ADDITIVE_CATALOG_OBJECT' USING ERRCODE='P7998'; END IF;
"""
postcheck = """
DO $exact_successor_postcheck$
DECLARE original pg_temp.prod_http_before%ROWTYPE; live_catalog jsonb; item record; function_rows jsonb;
BEGIN
 SELECT * INTO STRICT original FROM pg_temp.prod_http_before WHERE singleton;
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='""" + NEW_BASE + """'::pg_catalog.regclass
  AND relkind='r' AND relpersistence='p' AND relowner='postgres'::pg_catalog.regrole
  AND relrowsecurity AND relforcerowsecurity)
 OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
  WHERE c.oid='""" + NEW_BASE + """'::pg_catalog.regclass AND a.grantee<>'postgres'::pg_catalog.regrole)
 OR (SELECT count(*) FROM pg_policy WHERE polrelid='""" + NEW_BASE + """'::pg_catalog.regclass)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_policy WHERE polrelid='""" + NEW_BASE + """'::pg_catalog.regclass
  AND polname='postgres_only' AND polcmd='*' AND polpermissive
  AND polroles=ARRAY['postgres'::pg_catalog.regrole::oid]
  AND pg_get_expr(polqual,polrelid)='true' AND pg_get_expr(polwithcheck,polrelid)='true')
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='""" + NEW_BASE + """'::pg_catalog.regclass)<>2
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='""" + NEW_BASE + """'::pg_catalog.regclass
  AND tgenabled='O' AND NOT tgisinternal AND tgconstraint=0 AND tgnargs=0 AND tgqual IS NULL
  AND tgfoid='official_v3_guard_private.immutable_v1()'::pg_catalog.regprocedure
  AND ((tgname='immutable_rows' AND tgtype=27) OR (tgname='immutable_truncate' AND tgtype=34)))<>2
 THEN RAISE EXCEPTION 'PROD_HTTP_NEW_BASELINE_OWNER_ACL_RLS_IMMUTABILITY_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 IF pg_temp.prod_http_protected_state() IS DISTINCT FROM original.protected_state
 THEN RAISE EXCEPTION 'PROD_HTTP_PREDECESSOR_DATA_COUNTER_OR_CRON_CHANGED' USING ERRCODE='P7998'; END IF;
 SELECT jsonb_object_agg(p.oid::text,to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody']) INTO function_rows
 FROM pg_proc p WHERE p.oid::text IN(SELECT jsonb_object_keys(original.guard_function_rows));
 IF function_rows IS DISTINCT FROM original.guard_function_rows THEN
  RAISE EXCEPTION 'PROD_HTTP_OLD_FUNCTION_OWNER_ACL_CONFIG_CHANGED' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
  """ + new_body_values + """
 ) expected(signature,digest) LOOP
  IF encode(sha256(convert_to((SELECT prosrc FROM pg_proc WHERE oid=to_regprocedure(item.signature)),'UTF8')),'hex') IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_NEW_FUNCTION_SOURCE_MISMATCH: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 IF encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.audit_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
  IS DISTINCT FROM 'b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff'
 OR encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.check_control_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
  IS DISTINCT FROM original.catalog->('function:'||'official_v3_guard_private.check_control_v1()'::pg_catalog.regprocedure::oid)->>'definition'
 THEN RAISE EXCEPTION 'PROD_HTTP_AUDIT_OR_CONTROL_CHANGED' USING ERRCODE='P7998'; END IF;
 live_catalog:=official_v3_guard_private.catalog_status_v1();
 """ + catalog_delta_check + """
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_control_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 IF (SELECT count(*) FROM """ + NEW_BASE + """)<>1
 OR NOT EXISTS(SELECT 1 FROM """ + NEW_BASE + """ v CROSS JOIN official_v3_guard_private.state_v1 s
  WHERE v.singleton AND s.singleton AND v.required_generation>s.generation
  AND v.proof_not_before>s.last_proof_started AND v.catalog=live_catalog)
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
 THEN RAISE EXCEPTION 'PROD_HTTP_FRESH_NATURAL_FULL_PROOF_NOT_ENFORCED' USING ERRCODE='P7998'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RAISE EXCEPTION 'PROD_HTTP_OPEN_BEFORE_NEW_FULL_PROOF' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN
  IF SQLERRM<>'bg1 recovery fresh full proof required' THEN RAISE; END IF;
 END;
 IF NOT original.source_unqualified OR official_v3_at_production_private.renew_ch_v1() IS DISTINCT FROM 0
 OR pg_temp.prod_http_protected_state() IS DISTINCT FROM original.protected_state
 THEN RAISE EXCEPTION 'PROD_HTTP_UNQUALIFIED_SOURCE_PUBLISHER_NOT_CLOSED' USING ERRCODE='P7998'; END IF;
 -- The new qualifier barrier is the exact first operational block in the pinned body.
 -- No source/fact/Owner/state write, audit call or accepted positive renewal occurred.
END $exact_successor_postcheck$;
"""

rehearsal_probes = """
-- Real queue INSERT ... RETURNING proof, but neither net.http_* nor net.wake is called.
-- Explicit incoming IDs prevent the managed default's non-transactional nextval.
-- The queue barrier and final ROLLBACK prevent these uncommitted rows reaching the worker.
CREATE TEMP TABLE pg_temp.prod_http_insert_proof(first_id bigint,second_id bigint) ON COMMIT DROP;
DO $real_queue_id_override$
DECLARE wanted bigint; first_number bigint; second_number bigint;
BEGIN
 SELECT first_id INTO STRICT wanted FROM pg_temp.prod_http_before WHERE singleton;
 INSERT INTO net.http_request_queue(id,method,url,headers,timeout_milliseconds)
 VALUES(0,'GET','https://example.invalid/production-id-rollback-proof-1','{}'::jsonb,1000)
 RETURNING id INTO STRICT first_number;
 INSERT INTO net.http_request_queue(id,method,url,headers,timeout_milliseconds)
 VALUES(211,'GET','https://example.invalid/production-id-rollback-proof-2','{}'::jsonb,1000)
 RETURNING id INTO STRICT second_number;
 IF first_number IS DISTINCT FROM wanted OR second_number IS DISTINCT FROM wanted+1
 OR first_number<=211 OR second_number<=first_number
 THEN RAISE EXCEPTION 'PROD_HTTP_REAL_QUEUE_OVERRIDE_FAILED' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.prod_http_insert_proof VALUES(first_number,second_number);
END $real_queue_id_override$;

CREATE TEMP TABLE pg_temp.prod_http_probe_state ON COMMIT DROP AS
SELECT pg_temp.prod_http_allocator_state() AS allocator,
 pg_temp.prod_http_protected_state() AS protected_state,
 official_v3_guard_private.catalog_status_v1() AS catalog,
 (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1) AS sequence_state;

SAVEPOINT production_owned_sequence_restart;
DO $owned_sequence_restart_probe$
DECLARE restart_number bigint;
BEGIN
 SELECT first_id+10 INTO STRICT restart_number FROM pg_temp.prod_http_before WHERE singleton;
 EXECUTE format('ALTER SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 RESTART WITH %s',restart_number);
 IF (SELECT last_value FROM jetnity_pgnet_allocator_private.http_request_id_v1)<>restart_number
 OR (SELECT is_called FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM false
 THEN RAISE EXCEPTION 'PROD_HTTP_OWN_RESTART_NOT_OBSERVED' USING ERRCODE='P7998'; END IF;
END $owned_sequence_restart_probe$;
ROLLBACK TO SAVEPOINT production_owned_sequence_restart;
DO $owned_sequence_restart_restored$
BEGIN
 IF (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
   FROM jetnity_pgnet_allocator_private.http_request_id_v1)
  IS DISTINCT FROM (SELECT sequence_state FROM pg_temp.prod_http_probe_state)
 OR pg_temp.prod_http_allocator_state() IS DISTINCT FROM (SELECT allocator FROM pg_temp.prod_http_probe_state)
 OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM (SELECT catalog FROM pg_temp.prod_http_probe_state)
 THEN RAISE EXCEPTION 'PROD_HTTP_OWN_RESTART_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
END $owned_sequence_restart_restored$;

-- Narrow pre-COMMIT dependency-removal rehearsal only. The persisted recovery path is Fence.
SAVEPOINT production_uncommitted_helper_drop;
DO $exact_own_trigger_dependency$
BEGIN
 IF (SELECT count(*) FROM pg_depend WHERE refclassid='pg_proc'::pg_catalog.regclass
  AND refobjid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_depend d JOIN pg_trigger t ON t.oid=d.objid
  WHERE d.classid='pg_trigger'::pg_catalog.regclass AND d.refclassid='pg_proc'::pg_catalog.regclass
  AND d.refobjid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
  AND d.objsubid=0 AND d.refobjsubid=0 AND d.deptype='n'
  AND t.tgrelid='net.http_request_queue'::pg_catalog.regclass AND t.tgname='jetnity_pgnet_request_id_v1')
 THEN RAISE EXCEPTION 'PROD_HTTP_DROP_SCOPE_NOT_EXACTLY_OWN_TRIGGER' USING ERRCODE='P7998'; END IF;
END $exact_own_trigger_dependency$;
DROP FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() CASCADE;
DO $own_drop_observed$
BEGIN
 IF to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()') IS NOT NULL
 OR EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass
  AND tgname='jetnity_pgnet_request_id_v1')
 OR to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1') IS NULL
 THEN RAISE EXCEPTION 'PROD_HTTP_OWN_DROP_SCOPE_FAILED' USING ERRCODE='P7998'; END IF;
END $own_drop_observed$;
ROLLBACK TO SAVEPOINT production_uncommitted_helper_drop;
DO $own_drop_exactly_restored$
BEGIN
 IF pg_temp.prod_http_allocator_state() IS DISTINCT FROM (SELECT allocator FROM pg_temp.prod_http_probe_state)
 OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM (SELECT catalog FROM pg_temp.prod_http_probe_state)
 OR pg_temp.prod_http_protected_state() IS DISTINCT FROM (SELECT protected_state FROM pg_temp.prod_http_probe_state)
 THEN RAISE EXCEPTION 'PROD_HTTP_OWN_DROP_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
END $own_drop_exactly_restored$;

SAVEPOINT production_helper_drift_negative;
""" + fence_replace + """
DO $real_guard_helper_drift_refusal$
BEGIN
 BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  RAISE EXCEPTION 'PROD_HTTP_GUARD_ACCEPTED_CHANGED_ALLOCATOR_HELPER' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7905' THEN
  IF SQLERRM<>'production rolling protected catalog changed' THEN RAISE; END IF;
 END;
END $real_guard_helper_drift_refusal$;
ROLLBACK TO SAVEPOINT production_helper_drift_negative;
DO $baseline_immutability_negatives$
BEGIN
 BEGIN
  UPDATE """ + NEW_BASE + """ SET required_generation=required_generation WHERE singleton;
  RAISE EXCEPTION 'PROD_HTTP_BASELINE_UPDATE_NOT_DENIED' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7901' THEN NULL; END;
 BEGIN
  DELETE FROM """ + NEW_BASE + """ WHERE singleton;
  RAISE EXCEPTION 'PROD_HTTP_BASELINE_DELETE_NOT_DENIED' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7901' THEN NULL; END;
 BEGIN
  TRUNCATE """ + NEW_BASE + """;
  RAISE EXCEPTION 'PROD_HTTP_BASELINE_TRUNCATE_NOT_DENIED' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7901' THEN NULL; END;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF pg_temp.prod_http_allocator_state() IS DISTINCT FROM (SELECT allocator FROM pg_temp.prod_http_probe_state)
 OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM (SELECT catalog FROM pg_temp.prod_http_probe_state)
 OR pg_temp.prod_http_protected_state() IS DISTINCT FROM (SELECT protected_state FROM pg_temp.prod_http_probe_state)
 THEN RAISE EXCEPTION 'PROD_HTTP_NEGATIVES_DID_NOT_RESTORE' USING ERRCODE='P7998'; END IF;
END $baseline_immutability_negatives$;

-- Roll back the entire actual new allocator/source-barrier/BG1 installation.
ROLLBACK TO SAVEPOINT production_before_install;
DO $full_predecessor_restoration$
DECLARE original pg_temp.prod_http_before%ROWTYPE;
BEGIN
 SELECT * INTO STRICT original FROM pg_temp.prod_http_before WHERE singleton;
 IF to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR to_regclass('""" + NEW_BASE + """') IS NOT NULL
 OR EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass)
 OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM original.catalog
 OR pg_temp.prod_http_native_state() IS DISTINCT FROM original.native
 OR pg_temp.prod_http_protected_state() IS DISTINCT FROM original.protected_state
 OR pg_temp.prod_http_inventory_exact() IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'PROD_HTTP_FULL_INSTALL_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_control_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
END $full_predecessor_restoration$;
SELECT jsonb_build_object('result','PROD_HTTP_QUALIFICATION_ALLOCATOR_GUARD_DDL_ROLLBACK_PASS',
 'fresh_locked_hwm',history_max::text,'legacy_value',legacy_value::text,
 'first_probed_id',first_id::text,'second_probed_id',(first_id+1)::text,
 'unused_safety_gap',1024,'original_legacy_sequence_and_history_preserved',true,
 'whole_installation_rolled_back_before_final_result',true,'http_or_wake_called',false,
 'positive_renewal_proven',false,'commit_authorization',false,
 'next_required_step','Independent readback and separate explicit exact installation Go') AS result
FROM pg_temp.prod_http_before WHERE singleton;
ROLLBACK;
"""

install_tail = """
-- No probe ID is consumed by this COMMIT candidate. The first ordinary queue INSERT
-- after COMMIT gets first_id. Old defaults may still consume old IDs, then the trigger
-- replaces them; never reset that managed counter to conceal gaps.
DO $installation_no_probe_and_range_postcheck$
DECLARE first_number bigint; current_number bigint; called boolean;
BEGIN
 SELECT first_id INTO STRICT first_number FROM pg_temp.prod_http_before WHERE singleton;
 SELECT last_value,is_called INTO STRICT current_number,called FROM jetnity_pgnet_allocator_private.http_request_id_v1;
 IF current_number<>first_number OR called IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'PROD_HTTP_UNEXPECTED_ALLOCATION_BEFORE_COMMIT' USING ERRCODE='P7998'; END IF;
 IF pg_temp.prod_http_protected_state() IS DISTINCT FROM (SELECT protected_state FROM pg_temp.prod_http_before WHERE singleton)
 THEN RAISE EXCEPTION 'PROD_HTTP_ORIGINAL_STATE_CHANGED_BEFORE_COMMIT' USING ERRCODE='P7998'; END IF;
END $installation_no_probe_and_range_postcheck$;
SELECT jsonb_build_object('result','PROD_HTTP_INSTALL_CHECKS_COMPLETE_COMMIT_STILL_MUST_SUCCEED',
 'fresh_locked_hwm',b.history_max::text,'legacy_value',b.legacy_value::text,'first_id',b.first_id::text,
 'unused_safety_gap',1024,
 'successor_canonical_sha256',encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 'required_generation',v.required_generation,'proof_not_before',v.proof_not_before,
 'helper_definition_sha256',encode(sha256(convert_to(pg_get_functiondef('jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure),'UTF8')),'hex'),
 'source_qualification_changed',false,'positive_facts_added',false,'http_or_wake_called',false,
 'natural_fresh_complete_bg1_proof_required',true,'postcommit_readback_required',true) AS result
FROM pg_temp.prod_http_before b CROSS JOIN """ + NEW_BASE + """ v WHERE b.singleton AND v.singleton;
RELEASE SAVEPOINT production_before_install;
COMMIT;
-- A result row before COMMIT is not proof that COMMIT succeeded. Preserve both actual
-- execution completion and separate native readback. Do not reopen/reset any status.
-- After COMMIT: never drop the trigger/schema or rewind either counter as rollback.
-- Use the separately approved 30/40 Fence files to stop new captured queue INSERTs.
"""

common_install = header + preflight + snapshot_functions + allocator_ddl + guard_ddl + postcheck
(HERE / "10-production-http-id.REHEARSAL-ROLLBACK.sql").write_text(common_install + rehearsal_probes)
(HERE / "20-production-http-id.INSTALL-COMMIT.sql").write_text(common_install + install_tail)

# Exact function source provenance is machine readable and reproducible without PG.
(HERE / "source-provenance.json").write_text(json.dumps({
    "schema": "production-http-allocator-offline-source-bindings-v1",
    "v2_execution_path": str(EVIDENCE.relative_to(ROOT)),
    "v2_execution_sha256": sha(EVIDENCE.read_bytes()),
    "production_originals": provenance,
    "existing_net_api_source": {
        "path": str(api_source_path.relative_to(ROOT)),
        "sha256": sha(api_source_path.read_bytes()),
        "all_three_definitions_exactly_match_production_v2": True,
        "existing_managed_api_definitions_modified": False,
    },
    "new_body_sha256": new_bodies,
    "helper_body_sha256": sha(helper_body),
    "fence_body_sha256": sha(fence_body),
    "audit_and_control_definition_changes": False,
    "pg_net_upstream_static_review": pins["pg_net_0195_worker_review"],
    "actual_postgres_parse_or_execution": False,
}, indent=2) + "\n")

# Fence keeps the committed numbering lineage. It never rewinds/removes the allocator.
fence_header = """-- PREPARED POST-COMMIT FENCE CANDIDATE ONLY; NOT EXECUTED.
-- Fixed Production target qscbgcdmivbbnzrcyegn. Separate exact Fence authorization required.
-- Pin the ACTUALLY COMMITTED successor from an independent readback first.
-- Missing pin is an immediate pre-DDL STOP; it cannot be filled from this draft's new row.
-- Denies subsequent captured origin/local queue INSERTs; pending queued work is preserved
-- and can still be delivered. Replica/direct UPDATE/hostile DBA are outside this trigger contract.
-- assert_catalog refuses the helper delta immediately when invoked. Public alarm changes
-- only via the existing natural audit/freshness design: no fake audit, instant-alarm claim or reset.
-- Permanent recovery is a reviewed forward repair; never drop/rewind into the old allocator.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL transaction_timeout='90s';
SET LOCAL row_security=off;
"""
fence_pre = """
DO $production_fence_installed_pins$
DECLARE expected_successor_sha text:=""" + sql_literal(pins["installed_successor_canonical_sha256"]) + """;
 b jsonb; item record; actual_digest text;
BEGIN
 IF expected_successor_sha IS NULL OR expected_successor_sha !~ '^[a-f0-9]{64}$' THEN
  RAISE EXCEPTION 'PROD_FENCE_STOP_INDEPENDENT_COMMITTED_SUCCESSOR_PIN_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regclass('""" + NEW_BASE + """') IS NULL
 OR to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1') IS NULL
 OR to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()') IS NULL
 THEN RAISE EXCEPTION 'PROD_FENCE_STOP_EXACT_INSTALLED_TARGET_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771106,1) THEN
  RAISE EXCEPTION 'PROD_FENCE_STOP_EXISTING_GUARD_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771106,32) THEN
  RAISE EXCEPTION 'PROD_FENCE_STOP_IMPORT_PRODUCER_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771112,1) THEN
  RAISE EXCEPTION 'PROD_FENCE_STOP_AT_ENQUEUE_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771112,2) THEN
  RAISE EXCEPTION 'PROD_FENCE_STOP_AT_RENEWAL_BUSY' USING ERRCODE='P7998'; END IF;
 SELECT to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before))
 INTO STRICT b FROM """ + NEW_BASE + """ v WHERE singleton;
 IF encode(sha256(convert_to(b::text,'UTF8')),'hex') IS DISTINCT FROM expected_successor_sha
 THEN RAISE EXCEPTION 'PROD_FENCE_STOP_INSTALLED_SUCCESSOR_PIN_MISMATCH' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
  """ + new_body_values + """
 ) expected(signature,digest) LOOP
  SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') INTO actual_digest
  FROM pg_proc WHERE oid=to_regprocedure(item.signature);
  IF actual_digest IS DISTINCT FROM item.digest
  OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(item.signature)),'UTF8')),'hex')
   IS DISTINCT FROM b->'catalog'->('function:'||to_regprocedure(item.signature)::oid)->>'definition'
  THEN RAISE EXCEPTION 'PROD_FENCE_STOP_GUARD_OR_PUBLISHER_PIN_CHANGED: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
  AND p.proowner='postgres'::pg_catalog.regrole AND p.prosecdef AND p.provolatile='v'
  AND p.prorettype='pg_catalog.trigger'::pg_catalog.regtype AND p.proconfig=ARRAY['search_path=pg_catalog'] AND p.pronargs=0
  AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')='""" + sha(helper_body) + """'
  AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')=b#>>'{transport_metadata,allocator,function,definition}')
 THEN RAISE EXCEPTION 'PROD_FENCE_STOP_EXACT_NORMAL_HELPER_REQUIRED' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM b->'catalog'
 THEN RAISE EXCEPTION 'PROD_FENCE_STOP_EXISTING_CATALOG_DRIFT_REQUIRES_SPECIFIC_REVIEW' USING ERRCODE='P7998'; END IF;
 -- Freshness may already be unavailable. This operation closes transport; it cannot open it.
END $production_fence_installed_pins$;
"""
fixed_locks = preflight[preflight.index("LOCK TABLE net.http_request_queue"):preflight.index("CREATE FUNCTION pg_temp.prod_http_inventory_exact")]
temp_functions = preflight[preflight.index("CREATE FUNCTION pg_temp.prod_http_inventory_exact"):]
protected_fn_only = snapshot_functions.split("CREATE TEMP TABLE pg_temp.prod_http_before", 1)[0]
fence_setup = fixed_locks + temp_functions + protected_fn_only + """
CREATE TEMP TABLE pg_temp.prod_http_fence_before ON COMMIT DROP AS SELECT
 pg_temp.prod_http_native_state() AS native,
 pg_temp.prod_http_allocator_state() AS allocator,
 pg_temp.prod_http_protected_state() AS protected_state,
 official_v3_guard_private.catalog_status_v1() AS catalog,
 (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1) AS own_sequence,
 (SELECT to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before))
  FROM """ + NEW_BASE + """ v WHERE singleton) AS successor;
DO $production_fence_lock_and_scope$
BEGIN
 IF pg_temp.prod_http_inventory_exact() IS DISTINCT FROM true
 OR NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND granted
  AND relation='net.http_request_queue'::pg_catalog.regclass AND mode='ShareRowExclusiveLock')
 OR (SELECT count(*) FROM pg_temp.prod_http_fence_before)<>1
 THEN RAISE EXCEPTION 'PROD_FENCE_STOP_GLOBAL_LOCK_OR_SCOPE_CHANGED' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $production_fence_lock_and_scope$;
SAVEPOINT production_before_fence;
"""
fence_proof = """
DO $production_fence_real_insert_denial$
DECLARE actual jsonb; original jsonb;
BEGIN
 BEGIN
  INSERT INTO net.http_request_queue(id,method,url,headers,timeout_milliseconds)
  VALUES(0,'GET','https://example.invalid/production-fence-rollback-proof','{}'::jsonb,1000);
  RAISE EXCEPTION 'PROD_FENCE_QUEUE_INSERT_WAS_NOT_DENIED' USING ERRCODE='P7999';
 EXCEPTION WHEN SQLSTATE 'P7998' THEN
  IF SQLERRM<>'PROD_HTTP_ID_ALLOCATOR_FENCED_FORWARD_REPAIR_REQUIRED' THEN RAISE; END IF;
 END;
 -- Explicit ID avoided the legacy nextval default; deny occurs before own nextval.
 actual:=pg_temp.prod_http_allocator_state();
 SELECT allocator INTO STRICT original FROM pg_temp.prod_http_fence_before;
 IF (actual-'function') IS DISTINCT FROM (original-'function')
 OR ((actual->'function')-'definition') IS DISTINCT FROM ((original->'function')-'definition')
 OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
   WHERE oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure)<>'""" + sha(fence_body) + """'
 OR pg_temp.prod_http_native_state() IS DISTINCT FROM (SELECT native FROM pg_temp.prod_http_fence_before)
 OR pg_temp.prod_http_protected_state() IS DISTINCT FROM (SELECT protected_state FROM pg_temp.prod_http_fence_before)
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
   FROM jetnity_pgnet_allocator_private.http_request_id_v1)
  IS DISTINCT FROM (SELECT own_sequence FROM pg_temp.prod_http_fence_before)
 OR (SELECT to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before))
   FROM """ + NEW_BASE + """ v WHERE singleton)
  IS DISTINCT FROM (SELECT successor FROM pg_temp.prod_http_fence_before)
 THEN RAISE EXCEPTION 'PROD_FENCE_CHANGED_MORE_THAN_OWN_HELPER_DEFINITION' USING ERRCODE='P7998'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  RAISE EXCEPTION 'PROD_FENCE_CATALOG_DID_NOT_REFUSE' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7905' THEN
  IF SQLERRM<>'production rolling protected catalog changed' THEN RAISE; END IF;
 END;
 -- No call to audit, latch/resume reset, source qualification or positive Publisher.
END $production_fence_real_insert_denial$;
"""
fence_rollback_tail = """
ROLLBACK TO SAVEPOINT production_before_fence;
DO $production_fence_complete_restoration$
BEGIN
 IF pg_temp.prod_http_native_state() IS DISTINCT FROM (SELECT native FROM pg_temp.prod_http_fence_before)
 OR pg_temp.prod_http_allocator_state() IS DISTINCT FROM (SELECT allocator FROM pg_temp.prod_http_fence_before)
 OR pg_temp.prod_http_protected_state() IS DISTINCT FROM (SELECT protected_state FROM pg_temp.prod_http_fence_before)
 OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM (SELECT catalog FROM pg_temp.prod_http_fence_before)
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM (SELECT own_sequence FROM pg_temp.prod_http_fence_before)
 THEN RAISE EXCEPTION 'PROD_FENCE_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $production_fence_complete_restoration$;
SELECT jsonb_build_object('result','PROD_HTTP_FENCE_REAL_DENIAL_AND_ROLLBACK_PASS',
 'fence_active',false,'http_or_wake_called',false,'sequence_consumed_or_rewound',false,
 'original_committed_lineage_preserved',true,'commit_permission',false) AS result;
ROLLBACK;
"""
fence_commit_tail = """
SELECT jsonb_build_object('result','PROD_HTTP_FENCE_CHECKS_COMPLETE_COMMIT_STILL_MUST_SUCCEED',
 'captured_future_queue_inserts_denied',true,'existing_queue_retained',true,
 'sequence_consumed_or_rewound',false,'original_history_preserved',true,
 'catalog_refuses_when_invoked',true,'public_alarm_immediately_unavailable_claimed',false,
 'natural_audit_observation_required',true,'forward_repair_required',true) AS result;
RELEASE SAVEPOINT production_before_fence;
COMMIT;
-- Preserve actual COMMIT completion; independently observe the real next audit/alarm.
-- Existing queued requests may still be delivered. This is not a cancellation API.
-- Do not reseal this deliberate mismatch or reset the latch/generation to make it green.
"""
fence_common = fence_header + fence_pre + fence_setup + fence_replace + fence_proof
(HERE / "30-production-http-id.FENCE-ROLLBACK.sql").write_text(fence_common + fence_rollback_tail)
(HERE / "40-production-http-id.FENCE-COMMIT.sql").write_text(fence_common + fence_commit_tail)

readback = """-- PREPARED ONLY / NOT EXECUTED. Separate exact post-install Production READ scope.
-- Expected new definitions are checked before calling the known read-only Guard/status functions.
-- This captures a COMMITTED successor pin for a later Fence; it does not authorize a Fence.
-- One transaction, no retry. No audit/Publisher/HTTP/Owner routine, role change or counter allocation.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
SET LOCAL transaction_timeout='20s';
SET LOCAL row_security=off;
DO $postcommit_pinned_read_context$
DECLARE item record;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_read_only')<>'on'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regclass('""" + NEW_BASE + """') IS NULL
 THEN RAISE EXCEPTION 'PROD_HTTP_READBACK_WRONG_INSTALLED_CONTEXT' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
  """ + new_body_values + """
 ) expected(signature,digest) LOOP
  IF (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid=to_regprocedure(item.signature)) IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_READBACK_CHANGED_DEFINITION: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $postcommit_pinned_read_context$;
SELECT jsonb_build_object('result','PROD_HTTP_COMMITTED_READBACK_OBSERVED',
 'observed_at',statement_timestamp(),'postmaster_started_at',pg_postmaster_start_time(),
 'read_only',current_setting('transaction_read_only')='on',
 'successor_canonical_sha256',encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 'catalog_sha256',encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 'transport_metadata_sha256',v.transport_metadata_digest,
 'publisher_definition_sha256',v.publisher_function_digest,
 'required_generation',v.required_generation,'proof_not_before',v.proof_not_before,
 'own_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1),
 'own_sequence_logged',(SELECT relpersistence='p' FROM pg_class WHERE oid='jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass),
 'helper_definition_sha256',encode(sha256(convert_to(pg_get_functiondef('jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure),'UTF8')),'hex'),
 'public_guard_status',public.official_v3_guard_alarm_status_v1(),
 'fresh_complete_state_run_count',(SELECT count(*) FROM official_v3_guard_private.state_v1 s
  JOIN official_v3_guard_private.runs_v1 r ON r.generation=s.generation AND r.due_at=s.last_due
   AND r.started_at=s.last_started AND r.proof_started_at=s.last_proof_started AND r.finished_at=s.last_finished
  WHERE s.singleton AND r.outcome='complete' AND s.generation>=v.required_generation
   AND r.proof_started_at>=v.proof_not_before AND s.incident_generation=s.resumed_generation
   AND s.last_finished<=s.last_started+interval '30 seconds'
   AND s.valid_until=s.last_due+interval '5 minutes 30 seconds'
   AND statement_timestamp()>=s.last_finished AND statement_timestamp()<s.valid_until),
 'natural_http_operational_proof_performed_by_this_query',false,
 'positive_source_renewal_proven',false,'fence_or_followup_permission',false) AS result
FROM """ + NEW_BASE + """ v WHERE v.singleton;
ROLLBACK;
"""
(HERE / "50-production-http-id.POSTCOMMIT-READONLY.sql").write_text(readback)

postrehearsal = """-- PREPARED ONLY / NOT EXECUTED. Separate explicitly scoped post-rehearsal READ.
-- Use only after the actual complete 10-ROLLBACK and service completion were recorded.
-- This is NOT covered by the earlier one-time V2 Go or automatically by 01's READ Go.
-- Fixed Production target qscbgcdmivbbnzrcyegn; SQL does not authenticate project identity.
-- Confirms restored V2 definitions/chain and no allocator/trigger/successor installation.
-- No HTTP, Publisher, audit, Owner routine, DDL, data write, role or counter allocation.
-- Natural work may advance rows/counters between transactions. The exact original
-- row/counter restoration belongs to 10's locked before/after proof; this read does
-- not invent a new frozen history expectation or retroactively authorize installation.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
SET LOCAL transaction_timeout='20s';
SET LOCAL row_security=off;
DO $independent_old_production_restoration$
DECLARE item record; old_catalog jsonb;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_read_only')<>'on'
 OR current_setting('transaction_isolation')<>'repeatable read'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR to_regclass('""" + NEW_BASE + """') IS NOT NULL
 OR EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass('net.http_request_queue'))
 THEN RAISE EXCEPTION 'PROD_HTTP_POSTREHEARSAL_CONTEXT_OR_OBJECT_RESTORATION_FAILED' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
 """ + known_functions_values + """
 ) expected(signature,digest) LOOP
  IF to_regprocedure(item.signature) IS NULL
  OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(item.signature)),'UTF8')),'hex') IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_POSTREHEARSAL_OLD_DEFINITION_NOT_EXACT: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
 IF encode(sha256(convert_to(old_catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM old_catalog
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_transient_baseline_v3
  WHERE singleton AND required_generation=1344 AND proof_not_before='2026-11-20T22:51:44.959438Z'::timestamptz)
 OR (""" + inventory_sql + """) IS DISTINCT FROM true
 OR (""" + queue_shape_sql + """) IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'PROD_HTTP_POSTREHEARSAL_OLD_CHAIN_OR_TRANSPORT_SHAPE_CHANGED' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $independent_old_production_restoration$;
SELECT jsonb_build_object('result','PROD_HTTP_POSTREHEARSAL_ORIGINAL_LINEAGE_AND_OBJECT_ABSENCE_CONFIRMED',
 'observed_at',statement_timestamp(),'read_only',current_setting('transaction_read_only')='on',
 'old_catalog_sha256',encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 'old_required_generation',v.required_generation,'old_proof_not_before',v.proof_not_before,
 'own_allocator_namespace_absent',to_regnamespace('jetnity_pgnet_allocator_private') IS NULL,
 'new_successor_absent',to_regclass('""" + NEW_BASE + """') IS NULL,
 'queue_trigger_count',(SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass),
 'legacy_sequence_now',(SELECT jsonb_build_object('last_value',last_value::text,'is_called',is_called) FROM net.http_request_queue_id_seq),
 'native_transport_sha256',encode(sha256(convert_to((""" + native_expr + """)::text,'UTF8')),'hex'),
 'public_guard_status',public.official_v3_guard_alarm_status_v1(),
 'natural_progress_between_transactions_allowed',true,
 'locked_history_restoration_proof_must_be_read_from_actual_10_result',true,
 'http_or_publisher_or_owner_action',false,'installation_permission',false) AS result
FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
ROLLBACK;
"""
(HERE / "11-production-http-id.POSTREHEARSAL-READONLY.sql").write_text(postrehearsal)

print("Prepared-only files rebuilt; no SQL, network or database operation was performed.")
