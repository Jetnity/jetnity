// Builds the UNAPPLIED Stage 3 package from the exact Stage 2 modules and the
// installed V6 guard text. Does not connect to a database and does not invent
// a Production catalog digest.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../../..')
const stage2 = join(root, 'scripts/db/official-truth-at-stage2')
const v6Path = join(root, 'scripts/db/official-truth-at-source-v3/production-bg1-v6.suffix.sql')
const ownerPath = join(root, 'scripts/db/official-truth-v3-private-owner-guards-1/install-candidate.sql')

export const V6_FUNCTION_PINS = Object.freeze([
  ['official_v3_guard_private.catalog_status_v1()', 'catalog_status_v1'],
  ['official_v3_guard_private.assert_catalog_v1()', 'assert_catalog_v1'],
  ['official_v3_guard_private.require_open_v1()', 'require_open_v1'],
  ['public.official_v3_guard_alarm_status_v1()', 'official_v3_guard_alarm_status_v1'],
])
export const OWNER_PIN = 'ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b'

function sha256(text) {
  return createHash('sha256').update(text).digest('hex')
}

function functionBodies(sql) {
  const starts = [...sql.matchAll(/CREATE OR REPLACE FUNCTION /g)].map(match => match.index)
  const found = new Map()
  for (const start of starts) {
    const signature = sql.slice(start, sql.indexOf('\n', start)).replace('CREATE OR REPLACE FUNCTION ', '').trim()
    const marker = sql.indexOf('AS $function$', start)
    const close = sql.indexOf('$function$', marker + 'AS $function$'.length)
    if (marker < 0 || close < 0) throw new Error('Unclosed V6 function: ' + signature)
    found.set(signature, sql.slice(marker + 'AS $function$'.length, close))
  }
  return found
}

export function v6Pins(v6Sql = readFileSync(v6Path, 'utf8')) {
  const bodies = functionBodies(v6Sql)
  const pins = {}
  for (const [signature] of V6_FUNCTION_PINS) {
    const body = bodies.get(signature)
    if (!body) throw new Error('Missing V6 function ' + signature)
    pins[signature] = sha256(body)
  }
  return pins
}

function replaceOnce(text, from, to, label) {
  const first = text.indexOf(from)
  if (first < 0 || text.indexOf(from, first + from.length) >= 0) throw new Error('Expected exactly one splice: ' + label)
  return text.slice(0, first) + to + text.slice(first + from.length)
}

function statement(v6Sql, signature) {
  const header = 'CREATE OR REPLACE FUNCTION ' + signature
  const start = v6Sql.indexOf(header)
  const marker = v6Sql.indexOf('AS $function$', start)
  const close = v6Sql.indexOf('$function$', marker + 'AS $function$'.length)
  const end = v6Sql.indexOf(';', close)
  return v6Sql.slice(start, end + 1)
}

export function guardExtension(v6Sql = readFileSync(v6Path, 'utf8')) {
  let assertFn = statement(v6Sql, 'official_v3_guard_private.assert_catalog_v1()')
  let requireFn = statement(v6Sql, 'official_v3_guard_private.require_open_v1()')
  let alarmFn = statement(v6Sql, 'public.official_v3_guard_alarm_status_v1()')
  assertFn = replaceOnce(
    assertFn,
    '  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;',
    '  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;\n  stage3_v8 official_v3_guard_private.bg1_prod_ch_at_stage3_v8%ROWTYPE;',
    'assert variable',
  )
  assertFn = replaceOnce(
    assertFn,
    '  SELECT * INTO STRICT at_source_v6 FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton;',
    '  SELECT * INTO STRICT at_source_v6 FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton;\n  SELECT * INTO STRICT stage3_v8 FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8 WHERE singleton;',
    'assert read',
  )
  assertFn = replaceOnce(
    assertFn,
    ' OR at_source_v6.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN',
    ` OR stage3_v8.predecessor_catalog_digest IS DISTINCT FROM
   encode(sha256(convert_to(at_source_v6.catalog::text,'UTF8')),'hex')
 OR stage3_v8.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(at_source_v6)||
       jsonb_build_object('proof_not_before',extract(epoch FROM at_source_v6.proof_not_before)))::text,'UTF8')),'hex')
 OR stage3_v8.required_generation<=at_source_v6.required_generation
 OR stage3_v8.proof_not_before<=at_source_v6.proof_not_before
 OR stage3_v8.source_digest IS DISTINCT FROM at_source_v6.source_digest
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR stage3_v8.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN`,
    'assert catalog',
  )
  const v8Select = `  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8 v WHERE v.singleton;
`
  requireFn = replaceOnce(
    requireFn,
    `    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v WHERE v.singleton;
  IF s.generation<required_proof`,
    `    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v WHERE v.singleton;
${v8Select}  IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  IF s.generation<required_proof`,
    'require generation',
  )
  alarmFn = replaceOnce(
    alarmFn,
    `    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v WHERE v.singleton;
  IF current_state.generation<required_proof`,
    `    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v WHERE v.singleton;
${v8Select}  IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
  OR current_state.generation<required_proof`,
    'alarm generation',
  )
  if (assertFn.includes('at_source_v6.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()')) {
    throw new Error('V6 live-catalog equality must move to the V8 row')
  }
  return `-- Append-only guard extension. catalog_status_v1() stays the exact V6 body.
-- Historical digest pins, renew_ch_v1, the HTTP allocator and every earlier
-- lane predicate stay in assert_catalog_v1. V7 remains absent.
DO $stage3_guard_part$
BEGIN
 IF current_setting('jetnity.at_stage3_assembler',true) IS DISTINCT FROM 'package'
 THEN RAISE EXCEPTION 'AT_STAGE3_MODULE_INSTALL_FORBIDDEN' USING ERRCODE='P7996'; END IF;
END $stage3_guard_part$;
${assertFn}
${requireFn}
${alarmFn}
`
}

function lockThenHold(result) {
  return ` IF session_user<>'postgres' OR current_user<>session_user THEN RETURN ${result}; END IF;
 -- Same ascending order as enqueue (771112,1) and legacy renew_ch_v1 (771112,2).
 PERFORM pg_advisory_xact_lock(771112,1);
 PERFORM pg_advisory_xact_lock(771112,2);
 PERFORM pg_advisory_xact_lock(771112,34);
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)
 THEN RETURN ${result}; END IF;
`
}

function overlayFunction(source, name, tag, result) {
  const start = source.indexOf('CREATE FUNCTION official_v3_at_production_private.' + name)
  const end = source.indexOf('END $' + tag + '$;', start)
  if (start < 0 || end < 0) throw new Error('Missing ' + name)
  let text = 'CREATE OR REPLACE FUNCTION ' + source.slice('CREATE FUNCTION '.length + start, end + ('END $' + tag + '$;').length)
  if (name.startsWith('renew_ch_v3')) {
    text = replaceOnce(text, ` IF session_user<>'postgres' OR current_user<>session_user
 OR NOT pg_try_advisory_xact_lock(771112,34) THEN RETURN 0; END IF;
`, lockThenHold('0'), 'renew lock')
    text = replaceOnce(text, ` INSERT INTO official_v3_at_production_private.ch_visa_facts_v3(version_id,authorization_id,source_operation_id,source_batch_id,source_digest,
  method_epoch,source_checked_at,verified_at,expires_at)
 VALUES(previous+1,a.authorization_id,a.source_operation_id,a.batch_id,a.source_digest,2,checked,instant_at,until_at);`,
      ` IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)
 THEN RETURN 0; END IF;
 INSERT INTO official_v3_at_production_private.ch_visa_facts_v3(version_id,authorization_id,source_operation_id,source_batch_id,source_digest,
  method_epoch,source_checked_at,verified_at,expires_at)
 VALUES(previous+1,a.authorization_id,a.source_operation_id,a.batch_id,a.source_digest,2,checked,instant_at,until_at);`, 'renew insert recheck')
    return text
  }
  const guard = ` IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)
 THEN RETURN ${result}; END IF;
`
  text = replaceOnce(text, '\nBEGIN\n', '\nBEGIN\n' + guard, name)
  return text
}

export function renewalOverlay(core = readFileSync(join(stage2, 'renewal-core.CANDIDATE.sql'), 'utf8')) {
  return `-- Fail-closed hold on the exact Stage 2 functions. No cron and no grant.
DO $stage3_overlay_part$
BEGIN
 IF current_setting('jetnity.at_stage3_assembler',true) IS DISTINCT FROM 'package'
 THEN RAISE EXCEPTION 'AT_STAGE3_MODULE_INSTALL_FORBIDDEN' USING ERRCODE='P7996'; END IF;
END $stage3_overlay_part$;
${overlayFunction(core, 'renew_ch_v3(p_authorization text)', 'renew', '0')}
${overlayFunction(core, 'read_ch_v3(p_citizenship text)', 'read', 'none')}
${overlayFunction(core, 'read_published_ch_v3(p_citizenship text)', 'public_read', 'none')}
REVOKE ALL ON FUNCTION official_v3_at_production_private.renew_ch_v3(text),
 official_v3_at_production_private.read_ch_v3(text),
 official_v3_at_production_private.read_published_ch_v3(text)
 FROM PUBLIC,anon,authenticated,service_role;
`
}

function gate(pins) {
  const rows = [
    ...V6_FUNCTION_PINS.map(([signature]) => `  ('${signature}','${pins[signature]}'),`),
    `  ('jetnity_ot_auth.require_current_owner_session_v1()','${OWNER_PIN}')`,
  ].join('\n')
  return `-- UNAPPLIED package body. Refuses to run unless the probe or commit
-- candidate set the assembler marker in the same transaction.
DO $stage3_assembler$
BEGIN
 IF current_setting('jetnity.at_stage3_assembler',true) IS DISTINCT FROM 'package'
 OR session_user<>'postgres' OR current_user<>session_user
 OR current_setting('server_version_num')::integer/10000<>17
 THEN RAISE EXCEPTION 'AT_STAGE3_MODULE_INSTALL_FORBIDDEN' USING ERRCODE='P7996'; END IF;
END $stage3_assembler$;
CREATE TEMP TABLE at_stage3_package_token(singleton boolean);
INSERT INTO at_stage3_package_token VALUES(true);
CREATE TEMP TABLE at_stage2_exact_predecessor(singleton boolean);
DO $stage3_gate$
DECLARE digest text;
BEGIN
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_v6') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 THEN RAISE EXCEPTION 'AT_STAGE3_V6_PARENT_REQUIRED' USING ERRCODE='P7996'; END IF;
 -- Ascending legacy order, then the Stage 3 install key. Blocks until free.
 PERFORM pg_advisory_xact_lock(771112,1);
 PERFORM pg_advisory_xact_lock(771112,2);
 PERFORM pg_advisory_xact_lock(771112,34);
 PERFORM pg_advisory_xact_lock(771112,35);
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 THEN RAISE EXCEPTION 'AT_STAGE3_V6_PARENT_REQUIRED' USING ERRCODE='P7996'; END IF;
 digest:=current_setting('jetnity.at_stage3_expected_v6_catalog_digest',true);
 IF digest IS NULL OR digest!~'^[a-f0-9]{64}$'
 OR digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
   FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton)
 THEN RAISE EXCEPTION 'AT_STAGE3_V6_CATALOG_DIGEST_REQUIRES_FRESH_READBACK' USING ERRCODE='P7996'; END IF;
 CREATE TEMP TABLE at_stage3_pre_catalog(catalog jsonb);
 INSERT INTO at_stage3_pre_catalog SELECT official_v3_guard_private.catalog_status_v1();
 IF (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM at_stage3_pre_catalog)
  IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
   FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton)
 THEN RAISE EXCEPTION 'AT_STAGE3_V6_LIVE_CATALOG_DRIFT %', (
  SELECT coalesce(live.key,stored.key) FROM jsonb_each((SELECT catalog FROM at_stage3_pre_catalog)) live
  FULL JOIN jsonb_each((SELECT catalog FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton)) stored USING (key)
  WHERE live.value IS DISTINCT FROM stored.value LIMIT 1) USING ERRCODE='P7996'; END IF;
 -- Full historical V6 chain, while assert_catalog_v1 is still the V6 body.
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF EXISTS(
  SELECT 1 FROM (VALUES
${rows}
  ) AS expected(signature,body_sha)
  WHERE to_regprocedure(expected.signature) IS NULL
  OR (SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
      WHERE p.oid=to_regprocedure(expected.signature)) IS DISTINCT FROM expected.body_sha)
 THEN RAISE EXCEPTION 'AT_STAGE3_V6_PARENT_FUNCTION_DRIFT' USING ERRCODE='P7996'; END IF;
 IF to_regprocedure('official_v3_at_production_private.renew_ch_v1()') IS NULL
 OR (SELECT publisher_function_digest FROM official_v3_guard_private.bg1_production_http_allocator_v4 WHERE singleton)
    IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::regprocedure),'UTF8')),'hex')
 OR (SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1' AND active)
    IS DISTINCT FROM 'SELECT official_v3_at_production_private.renew_ch_v1()'
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-ch-de-prod-import-v1')<>1
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>3
 THEN RAISE EXCEPTION 'AT_STAGE3_HISTORICAL_LANE_DRIFT' USING ERRCODE='P7996'; END IF;
END $stage3_gate$;
CREATE TEMP TABLE at_stage3_lane_snapshot AS
 SELECT jobname,md5(command) AS command_md5,command FROM cron.job
 WHERE jobname IN ('jetnity-at-production-source-collect-v1','jetnity-at-production-source-enqueue-v1',
  'jetnity-at-production-source-renew-v1','jetnity-at-production-source-qualified-renew-v2',
  'jetnity-ch-de-prod-import-v1','jetnity-official-truth-production-guard-v1');
CREATE TEMP TABLE at_stage3_count_snapshot AS
 SELECT
  (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2) AS qualifications_v2,
  (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2) AS originals_v2,
  (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3) AS qualifications_v3,
  (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3) AS originals_v3,
  (SELECT count(*) FROM official_v3_at_production_private.ch_source_owner_decisions_v3) AS owner_decisions,
  (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v1) AS facts_v1,
  (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v2) AS facts_v2;
`
}

function objectsAndClose() {
  return `CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_stage3_v8(
 singleton boolean PRIMARY KEY CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 source_digest text NOT NULL CHECK(source_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_prod_ch_at_stage3_v8 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_prod_ch_at_stage3_v8 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE official_v3_guard_private.bg1_prod_ch_at_stage3_v8
 FROM PUBLIC,anon,authenticated,service_role;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_prod_ch_at_stage3_v8
 FOR ALL TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON
 official_v3_guard_private.bg1_prod_ch_at_stage3_v8 FOR EACH ROW
 EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON
 official_v3_guard_private.bg1_prod_ch_at_stage3_v8 FOR EACH STATEMENT
 EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1(
 hold_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 reason text NOT NULL CHECK(reason='append_only_withdrawal'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE official_v3_at_production_private.ch_stage3_renewal_hold_v1
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE official_v3_at_production_private.ch_stage3_renewal_hold_v1_hold_id_seq
 FROM PUBLIC,anon,authenticated,service_role;
CREATE POLICY postgres_only ON official_v3_at_production_private.ch_stage3_renewal_hold_v1
 FOR ALL TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON
 official_v3_at_production_private.ch_stage3_renewal_hold_v1 FOR EACH ROW
 EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON
 official_v3_at_production_private.ch_stage3_renewal_hold_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
`
}

function binding(pins) {
  return `CREATE FUNCTION official_v3_guard_private.stage3_parent_binding_v1()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $function$
DECLARE v6 official_v3_guard_private.bg1_prod_ch_at_source_v6%ROWTYPE;
 v8 official_v3_guard_private.bg1_prod_ch_at_stage3_v8%ROWTYPE;
BEGIN
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL THEN
  RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
 SELECT * INTO STRICT v6 FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton;
 SELECT * INTO STRICT v8 FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8 WHERE singleton;
 IF v8.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(v6.catalog::text,'UTF8')),'hex')
 OR v8.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(v6)||
   jsonb_build_object('proof_not_before',extract(epoch FROM v6.proof_not_before)))::text,'UTF8')),'hex')
 OR v8.required_generation<=v6.required_generation
 OR v8.proof_not_before<=v6.proof_not_before
 OR v8.source_digest IS DISTINCT FROM v6.source_digest
 OR v8.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
 OR (SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
     WHERE p.oid=to_regprocedure('official_v3_guard_private.catalog_status_v1()'))
    IS DISTINCT FROM '${pins['official_v3_guard_private.catalog_status_v1()']}'
 OR encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::regprocedure),'UTF8')),'hex')
    IS DISTINCT FROM (SELECT publisher_function_digest FROM official_v3_guard_private.bg1_production_http_allocator_v4 WHERE singleton)
 THEN RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END
$function$;
REVOKE ALL ON FUNCTION official_v3_guard_private.stage3_parent_binding_v1()
 FROM PUBLIC,anon,authenticated,service_role;
`
}

function finish() {
  return `CREATE FUNCTION official_v3_guard_private.stage3_added_key_allowed_v1(added text, allowed_oid oid[])
 RETURNS boolean LANGUAGE plpgsql STABLE SET search_path TO 'pg_catalog' AS $allow$
DECLARE parts text[];
BEGIN
 IF added ~ '^relation:[0-9]+$' THEN
  RETURN substring(added from '^relation:([0-9]+)$')::oid = ANY(allowed_oid);
 ELSIF added ~ '^function:[0-9]+$' THEN
  RETURN substring(added from '^function:([0-9]+)$')::oid = ANY(allowed_oid);
 ELSIF added ~ '^attribute:[0-9]+:-?[0-9]+$' THEN
  RETURN substring(added from '^attribute:([0-9]+):')::oid = ANY(allowed_oid);
 ELSIF added ~ '^type:[0-9]+$' OR added ~ '^constraint:[0-9]+$' OR added ~ '^policy:[0-9]+$'
  OR added ~ '^default:[0-9]+$' OR added ~ '^index:[0-9]+$' THEN
  RETURN substring(added from '^[a-z]+:([0-9]+)$')::oid = ANY(allowed_oid);
 ELSIF added ~ '^rewrite:[0-9]+$' THEN
  RETURN EXISTS(SELECT 1 FROM pg_rewrite r WHERE r.oid=substring(added from '^rewrite:([0-9]+)$')::oid AND r.ev_class=ANY(allowed_oid));
 ELSIF added ~ '^trigger:[0-9]+$' THEN
  RETURN EXISTS(SELECT 1 FROM pg_trigger t WHERE t.oid=substring(added from '^trigger:([0-9]+)$')::oid
   AND (t.tgrelid=ANY(allowed_oid) OR (t.tgisinternal AND t.tgconstraint IN (
    SELECT c.oid FROM pg_constraint c WHERE c.contype='f' AND c.conrelid=ANY(allowed_oid)))));
 ELSIF added = 'dependency:'||'pg_proc'::regclass::oid::text||':'||
  to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)')::oid::text||':0:'||
  'pg_language'::regclass::oid::text||':'||(SELECT oid::text FROM pg_language WHERE lanname='plpgsql')||':0:n'
 THEN RETURN true;
 ELSIF added ~ '^dependency:[0-9]+:[0-9]+:[0-9]+:[0-9]+:[0-9]+:[0-9]+:[^:]+$'
  OR added ~ '^shared:[0-9]+:[0-9]+:[0-9]+:[0-9]+:[0-9]+:[0-9]+:[^:]+$' THEN
  parts:=string_to_array(substring(added from '^[a-z]+:(.*)$'),':');
  RETURN (CASE WHEN added LIKE 'dependency:%' THEN parts[2] ELSE parts[3] END)::oid = ANY(allowed_oid)
   OR (CASE WHEN added LIKE 'dependency:%' THEN parts[5] ELSE parts[6] END)::oid = ANY(allowed_oid);
 ELSIF added ~ '^description:[0-9]+:[0-9]+:[0-9]+$' THEN
  RETURN substring(added from '^description:[0-9]+:([0-9]+):')::oid = ANY(allowed_oid);
 ELSE RETURN false; END IF;
END $allow$;
REVOKE ALL ON FUNCTION official_v3_guard_private.stage3_added_key_allowed_v1(text,oid[])
 FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION official_v3_guard_private.stage3_require_allowed_delta_v1()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog' AS $delta$
DECLARE pre jsonb; post jsonb; changed text; added text; allowed_change text[]; allowed_oid oid[];
BEGIN
 SELECT catalog INTO STRICT pre FROM at_stage3_pre_catalog;
 post:=official_v3_guard_private.catalog_status_v1();
 allowed_change:=ARRAY[
  'function:'||to_regprocedure('official_v3_guard_private.assert_catalog_v1()')::oid::text,
  'function:'||to_regprocedure('official_v3_guard_private.require_open_v1()')::oid::text,
  'function:'||to_regprocedure('public.official_v3_guard_alarm_status_v1()')::oid::text,
  'function:'||to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)')::oid::text];
 SELECT coalesce(array_agg(DISTINCT object_id),ARRAY[]::oid[]) INTO allowed_oid FROM (
  SELECT to_regclass(name)::oid AS object_id FROM unnest(ARRAY[
   'official_v3_guard_private.bg1_prod_ch_at_stage3_v8',
   'official_v3_at_production_private.ch_stage3_renewal_hold_v1',
   'official_v3_at_production_private.ch_renewal_go_v3',
   'official_v3_at_production_private.ch_visa_facts_v3',
   'official_v3_at_production_private.ch_visa_publication_v3',
   'official_v3_at_production_private.ch_stage3_renewal_hold_v1_hold_id_seq',
   'official_v3_at_production_private.ch_visa_publication_v3_decision_seq_seq']::text[]) AS name
  UNION SELECT to_regprocedure(name)::oid FROM unnest(ARRAY[
   'official_v3_at_production_private.stage2_evidence_ch_v3(bigint,text)',
   'official_v3_at_production_private.stage2_history_ch_v3(bigint,text)',
   'official_v3_at_production_private.stage2_method_ch_v3()',
   'official_v3_at_production_private.renew_ch_v3(text)',
   'official_v3_at_production_private.read_ch_v3(text)',
   'official_v3_at_production_private.read_published_ch_v3(text)',
   'official_v3_guard_private.stage3_parent_binding_v1()',
   'official_v3_guard_private.stage3_require_allowed_delta_v1()',
   'official_v3_guard_private.stage3_added_key_allowed_v1(text,oid[])']::text[]) AS name
  UNION SELECT reltoastrelid FROM pg_class WHERE oid IN (
   to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8'),
   to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1'),
   to_regclass('official_v3_at_production_private.ch_renewal_go_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_facts_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_publication_v3')) AND reltoastrelid<>0
  UNION SELECT indexrelid FROM pg_index WHERE indrelid IN (
   to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8'),
   to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1'),
   to_regclass('official_v3_at_production_private.ch_renewal_go_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_facts_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_publication_v3'))
   OR indrelid IN (SELECT reltoastrelid FROM pg_class WHERE oid IN (
   to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8'),
   to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1'),
   to_regclass('official_v3_at_production_private.ch_renewal_go_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_facts_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_publication_v3')) AND reltoastrelid<>0)
  UNION SELECT oid FROM pg_type WHERE typrelid IN (
   to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8'),
   to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1'),
   to_regclass('official_v3_at_production_private.ch_renewal_go_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_facts_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_publication_v3'))
  UNION SELECT typarray FROM pg_type WHERE typrelid IN (
   to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8'),
   to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1'),
   to_regclass('official_v3_at_production_private.ch_renewal_go_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_facts_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_publication_v3')) AND typarray<>0
  UNION SELECT oid FROM pg_constraint WHERE conrelid IN (
   to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8'),
   to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1'),
   to_regclass('official_v3_at_production_private.ch_renewal_go_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_facts_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_publication_v3'))
  UNION SELECT oid FROM pg_trigger WHERE tgrelid IN (
   to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8'),
   to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1'),
   to_regclass('official_v3_at_production_private.ch_renewal_go_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_facts_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_publication_v3'))
  UNION SELECT t.oid FROM pg_trigger t
   WHERE t.tgisinternal AND t.tgconstraint IN (
    SELECT c.oid FROM pg_constraint c WHERE c.contype='f' AND c.conrelid IN (
     to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8'),
     to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1'),
     to_regclass('official_v3_at_production_private.ch_renewal_go_v3'),
     to_regclass('official_v3_at_production_private.ch_visa_facts_v3'),
     to_regclass('official_v3_at_production_private.ch_visa_publication_v3')))
  UNION SELECT oid FROM pg_policy WHERE polrelid IN (
   to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8'),
   to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1'),
   to_regclass('official_v3_at_production_private.ch_renewal_go_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_facts_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_publication_v3'))
  UNION SELECT oid FROM pg_attrdef WHERE adrelid IN (
   to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8'),
   to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1'),
   to_regclass('official_v3_at_production_private.ch_renewal_go_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_facts_v3'),
   to_regclass('official_v3_at_production_private.ch_visa_publication_v3'))
 ) AS owned(object_id) WHERE object_id IS NOT NULL;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(pre) AS old_key
  WHERE NOT post ? old_key AND old_key IS DISTINCT FROM
   'dependency:'||'pg_proc'::regclass::oid::text||':'||
   to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)')::oid::text||':0:'||
   'pg_language'::regclass::oid::text||':'||(SELECT oid::text FROM pg_language WHERE lanname='sql')||':0:n') THEN
  RAISE EXCEPTION 'AT_STAGE3_FOREIGN_CATALOG_DRIFT removed %', (
   SELECT old_key FROM jsonb_object_keys(pre) AS old_key
   WHERE NOT post ? old_key AND old_key IS DISTINCT FROM
    'dependency:'||'pg_proc'::regclass::oid::text||':'||
    to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)')::oid::text||':0:'||
    'pg_language'::regclass::oid::text||':'||(SELECT oid::text FROM pg_language WHERE lanname='sql')||':0:n'
   LIMIT 1) USING ERRCODE='P7996'; END IF;
 FOR changed IN SELECT each.key FROM jsonb_each(post) AS each
  WHERE pre ? each.key AND each.value IS DISTINCT FROM pre->each.key LOOP
  IF changed=ANY(allowed_change) AND NOT EXISTS(
   SELECT 1 FROM jsonb_each(post->changed) AS field(key,value)
   WHERE field.key<>'definition'
   AND NOT (changed=('function:'||to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)')::oid::text)
    AND field.key='prolang'
    AND (pre->changed->>'prolang')::oid=(SELECT oid FROM pg_language WHERE lanname='sql')
    AND (post->changed->>'prolang')::oid=(SELECT oid FROM pg_language WHERE lanname='plpgsql'))
   AND field.value IS DISTINCT FROM (pre->changed)->field.key)
  THEN CONTINUE; END IF;
  IF changed ~ '^relation:[0-9]+$' AND NOT EXISTS(
   SELECT 1 FROM jsonb_each(post->changed) AS field(key,value)
   WHERE field.key<>'relhastriggers' AND field.value IS DISTINCT FROM (pre->changed)->field.key)
  AND EXISTS(SELECT 1 FROM pg_constraint c
   WHERE c.contype='f' AND c.confrelid=substring(changed from '^relation:([0-9]+)$')::oid
   AND c.conrelid=ANY(allowed_oid))
  THEN CONTINUE; END IF;
  RAISE EXCEPTION 'AT_STAGE3_FOREIGN_CATALOG_DRIFT changed %', changed USING ERRCODE='P7996';
 END LOOP;
 FOR added IN SELECT each.key FROM jsonb_each(post) AS each WHERE NOT pre ? each.key LOOP
  IF NOT official_v3_guard_private.stage3_added_key_allowed_v1(added, allowed_oid) THEN
   RAISE EXCEPTION 'AT_STAGE3_FOREIGN_CATALOG_DRIFT added %', added USING ERRCODE='P7996'; END IF;
 END LOOP;
END $delta$;
REVOKE ALL ON FUNCTION official_v3_guard_private.stage3_require_allowed_delta_v1()
 FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO official_v3_guard_private.bg1_prod_ch_at_stage3_v8(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,
 source_digest,required_generation,proof_not_before,catalog)
SELECT true,
 encode(sha256(convert_to(v6.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v6)||
  jsonb_build_object('proof_not_before',extract(epoch FROM v6.proof_not_before)))::text,'UTF8')),'hex'),
 v6.source_digest,s.generation+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v6
CROSS JOIN official_v3_guard_private.state_v1 s
WHERE v6.singleton AND s.singleton;
DO $stage3_close$
DECLARE before_row at_stage3_count_snapshot%ROWTYPE;
BEGIN
 PERFORM official_v3_guard_private.stage3_require_allowed_delta_v1();
 PERFORM official_v3_guard_private.stage3_parent_binding_v1();
 SELECT * INTO STRICT before_row FROM at_stage3_count_snapshot;
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8)<>1
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_visa_publication_v3)<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v3)<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>before_row.qualifications_v2
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2)<>before_row.originals_v2
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>before_row.qualifications_v3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>before_row.originals_v3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_owner_decisions_v3)<>before_row.owner_decisions
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v1)<>before_row.facts_v1
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v2)<>before_row.facts_v2
 OR EXISTS(SELECT 1 FROM cron.job j JOIN at_stage3_lane_snapshot s USING(jobname)
   WHERE j.command IS DISTINCT FROM s.command)
 OR (SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1')
    IS DISTINCT FROM 'SELECT official_v3_at_production_private.renew_ch_v1()'
 OR EXISTS(SELECT 1 FROM cron.job WHERE command LIKE '%renew_ch_v3%')
 OR (SELECT proparallel FROM pg_proc WHERE oid=to_regprocedure('official_v3_at_production_private.renew_ch_v1()'))<>'u'
 OR (SELECT proparallel FROM pg_proc WHERE oid=to_regprocedure('official_v3_guard_private.assert_catalog_v1()'))<>'u'
 OR has_function_privilege('anon','official_v3_at_production_private.renew_ch_v3(text)','EXECUTE')
 OR has_function_privilege('service_role','official_v3_at_production_private.read_ch_v3(text)','EXECUTE')
 OR has_table_privilege('service_role','official_v3_at_production_private.ch_stage3_renewal_hold_v1','INSERT')
 OR NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid='official_v3_guard_private.bg1_prod_ch_at_stage3_v8'::regclass)
 OR NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid='official_v3_at_production_private.ch_visa_facts_v3'::regclass)
 THEN RAISE EXCEPTION 'AT_STAGE3_LANE_OR_PUBLICATION_DRIFT' USING ERRCODE='P7996'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RAISE EXCEPTION 'AT_STAGE3_PREMATURE_GUARD_OPEN' USING ERRCODE='P7996';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL;
 END;
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
 THEN RAISE EXCEPTION 'AT_STAGE3_ALARM_STILL_CURRENT_BEFORE_NATURAL_PROOF' USING ERRCODE='P7996'; END IF;
 -- Full chain again, now the V8 body. Failure aborts the transaction.
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $stage3_close$;
`
}

const settings = `SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL jetnity.at_stage3_assembler='package';
`

export function buildPackage() {
  const v6Sql = readFileSync(v6Path, 'utf8')
  const pins = v6Pins(v6Sql)
  const core = readFileSync(join(stage2, 'renewal-core.CANDIDATE.sql'), 'utf8')
  const wrapper = readFileSync(join(stage2, 'public-wrapper.CANDIDATE.sql'), 'utf8')
  const owner = readFileSync(ownerPath, 'utf8')
  const ownerStart = owner.indexOf('create function jetnity_ot_auth.require_current_owner_session_v1()')
  const ownerAs = owner.indexOf('as $$', ownerStart)
  const ownerMarker = 'as $$'
  const ownerClose = owner.indexOf('$$', ownerAs + ownerMarker.length)
  const ownerBody = owner.slice(ownerAs + ownerMarker.length, ownerClose)
  if (sha256(ownerBody) !== OWNER_PIN) throw new Error('Owner session body pin drifted')
  const body = [
    '-- UNAPPLIED Stage 3 body. No BEGIN/COMMIT. The probe and the commit candidate wrap it.',
    gate(pins),
    objectsAndClose(),
    core.trimEnd(),
    `ALTER TABLE official_v3_at_production_private.ch_renewal_go_v3
 DROP CONSTRAINT ch_renewal_go_v3_batch_id_key;`,
    wrapper.trimEnd(),
    renewalOverlay(core).trimEnd(),
    guardExtension(v6Sql).trimEnd(),
    binding(pins).trimEnd(),
    finish().trimEnd(),
    '',
  ].join('\n')
  if (body.includes('CREATE OR REPLACE FUNCTION official_v3_guard_private.catalog_status_v1')) {
    throw new Error('catalog_status_v1 must stay the V6 function')
  }
  const marked = [...body.matchAll(/-- (?:Full historical V6 chain|Full chain again, now the V8 body)[^\n]*\n[ \t]*PERFORM official_v3_guard_private\.assert_catalog_v1\(\);\n/g)]
  if (marked.length !== 2) throw new Error('production body must mark both assert_catalog_v1 calls, found ' + marked.length)
  const isolatedBody = `-- SYNTHETIC ISOLATED GUARD COMPOSITION. NOT A PRODUCTION INSTALLER.
-- The production probe and commit candidate keep both assert_catalog_v1() calls.
-- This file removes only those two marked calls so a synthetic parent can exercise
-- the guard transition. Never execute this file on Production.
${body.replaceAll(/-- (?:Full historical V6 chain|Full chain again, now the V8 body)[^\n]*\n[ \t]*PERFORM official_v3_guard_private\.assert_catalog_v1\(\);\n/g, '')}`
  const probeHeader = `-- UNAPPLIED atomic probe. ROLLBACK only. No Production execution by this repository.
-- Release sets, in this same session and before the file, the fresh read-only
-- V6 catalog digest: SET jetnity.at_stage3_expected_v6_catalog_digest='<64 hex>';
-- An empty or mismatched digest fails closed. This file does not embed one.
BEGIN;
${settings}`
  const commitHeader = `-- UNAPPLIED commit candidate. Do not execute without a separate Production PO-Go.
-- Same digest rule as the probe. Never install a module from this directory alone.
BEGIN;
${settings}`
  const probe = `${probeHeader}${body}ROLLBACK;
DO $stage3_probe_clean$
BEGIN
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.ch_visa_facts_v3') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 THEN RAISE EXCEPTION 'AT_STAGE3_ROLLBACK_LEAK' USING ERRCODE='P7996'; END IF;
END $stage3_probe_clean$;
SELECT 'AT_STAGE3_ROLLBACK_PROBE_CLEAN' AS proof;
`
  const commit = `${commitHeader}${body}COMMIT;
`
  const withdrawalBody = `-- UNAPPLIED withdrawal. Append-only hold. Historical originals, V6 and the
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
 THEN RAISE EXCEPTION 'AT_STAGE3_WITHDRAWAL_PREDECESSOR_STOP' USING ERRCODE='P7997'; END IF;
 PERFORM pg_advisory_xact_lock(771112,1);
 PERFORM pg_advisory_xact_lock(771112,2);
 PERFORM pg_advisory_xact_lock(771112,34);
 IF (SELECT count(*) FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)<>0
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
`
  const preflight = `-- READ ONLY. Does not install, renew, publish or set a visitor flag.
-- Copy v6_catalog_digest from the notice into the release session GUC.
-- Publication count is dynamic so a V6 database without Stage 3 tables still plans.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
DO $preflight$
DECLARE publication_count bigint; payload jsonb;
BEGIN
 IF to_regclass('official_v3_at_production_private.ch_visa_publication_v3') IS NULL THEN
  publication_count:=NULL;
 ELSE
  EXECUTE 'SELECT count(*) FROM official_v3_at_production_private.ch_visa_publication_v3' INTO publication_count;
 END IF;
 payload:=jsonb_build_object(
  'bg1',public.official_v3_guard_alarm_status_v1()->>'status',
  'v6_catalog_digest',(SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton),
  'v7_hold',to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL,
  'v8_present',to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NOT NULL,
  'owner_decision_count',(SELECT count(*) FROM official_v3_at_production_private.ch_source_owner_decisions_v3),
  'publication_count',to_jsonb(publication_count),
  'legacy_cron',(SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1' AND active),
  'ch_de_cron',(SELECT count(*) FROM cron.job WHERE jobname='jetnity-ch-de-prod-import-v1'),
  'catalog_status_sha256',(SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
    WHERE p.oid=to_regprocedure('official_v3_guard_private.catalog_status_v1()')),
  'decision','STOP_UNTIL_FRESH_READBACK_AND_SEPARATE_PO_GO');
 RAISE NOTICE 'AT_STAGE3_PREFLIGHT %', payload;
END $preflight$;
ROLLBACK;
`
  const readback = `-- READ ONLY post-commit shape. Not evidence of a fresh Production readback.
-- Running this file does not prove Production. The release chat must execute it
-- itself after a separately authorized commit and record the actual row.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SELECT jsonb_build_object(
 'executed_by_repository',false,
 'fresh_production_readback','OPEN_PO_GATE',
 'v8',to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NOT NULL,
 'v7',to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL,
 'v8_catalog_digest',(SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
   FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8 WHERE singleton),
 'publication',(SELECT count(*) FROM official_v3_at_production_private.ch_visa_publication_v3),
 'renewal_hold',(SELECT count(*) FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1),
 'legacy_cron',(SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1'),
 'alarm',public.official_v3_guard_alarm_status_v1()->>'status') AS readback;
ROLLBACK;
`
  return {
    pins,
    body,
    isolatedBody,
    probe,
    commit,
    withdrawal: withdrawalBody + 'COMMIT;\n',
    withdrawalRehearsal: withdrawalBody + `ROLLBACK;
DO $stage3_withdraw_clean$
BEGIN
 IF to_regclass('official_v3_at_production_private.ch_stage3_renewal_hold_v1') IS NOT NULL
 AND (SELECT count(*) FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1)<>0
 THEN RAISE EXCEPTION 'AT_STAGE3_WITHDRAWAL_ROLLBACK_LEAK' USING ERRCODE='P7997'; END IF;
END $stage3_withdraw_clean$;
SELECT 'AT_STAGE3_WITHDRAWAL_ROLLBACK_CLEAN' AS proof;
`,
    preflight,
    readback,
    order: [
      'production-read-only-preflight.sql',
      'production-stage3.ROLLBACK-PROBE.sql',
      'production-stage3.COMMIT-CANDIDATE.sql',
      'production-post-commit-readback.sql',
      'production-stage3.WITHDRAWAL-REHEARSAL.sql',
      'production-stage3.WITHDRAWAL.sql',
    ],
  }
}

export function manifestFor(pkg) {
  const files = {
    'production-stage3.PACKAGE-BODY.sql': pkg.body,
    'production-stage3.ROLLBACK-PROBE.sql': pkg.probe,
    'production-stage3.COMMIT-CANDIDATE.sql': pkg.commit,
    'production-stage3.WITHDRAWAL.sql': pkg.withdrawal,
    'production-stage3.WITHDRAWAL-REHEARSAL.sql': pkg.withdrawalRehearsal,
    'production-read-only-preflight.sql': pkg.preflight,
    'production-post-commit-readback.sql': pkg.readback,
  }
  const entries = Object.entries(files).map(([name, text]) => ({
    name,
    sha256: sha256(text),
    bytes: Buffer.byteLength(text),
  }))
  return {
    schema: 'jetnity.official-truth-at-stage3.unapplied-package.v1',
    status: 'UNAPPLIED',
    productionExecution: 'NOT_RUN',
    freshProductionReadback: 'OPEN_PO_GATE',
    v7EmergencyMarker: 'RESERVED_ABSENT',
    parentFunctionSha256: pkg.pins,
    order: pkg.order,
    files: entries,
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pkg = buildPackage()
  const files = {
    'production-stage3.PACKAGE-BODY.sql': pkg.body,
    'production-stage3.ROLLBACK-PROBE.sql': pkg.probe,
    'production-stage3.COMMIT-CANDIDATE.sql': pkg.commit,
    'production-stage3.WITHDRAWAL.sql': pkg.withdrawal,
    'production-stage3.WITHDRAWAL-REHEARSAL.sql': pkg.withdrawalRehearsal,
    'production-read-only-preflight.sql': pkg.preflight,
    'production-post-commit-readback.sql': pkg.readback,
    'renewal-overlay.sql': renewalOverlay(),
    'native-isolated-guard.sql': pkg.isolatedBody,
    'PACKAGE-MANIFEST.json': JSON.stringify(manifestFor(pkg), null, 2) + '\n',
  }
  for (const [name, text] of Object.entries(files)) writeFileSync(join(here, name), text)
  console.log(JSON.stringify(pkg.pins, null, 2))
}
