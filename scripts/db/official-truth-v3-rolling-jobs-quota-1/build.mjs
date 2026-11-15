// Deterministic, offline-only successor compiler. It never opens a database.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertTransactionBody, functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const here = new URL('./', import.meta.url)
const guard = new URL('../official-truth-v3-background-guard-1/', here)
const read = (name, base = here) => readFileSync(new URL(name, base), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
const target = 'research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
export const ROLLING_PREDECESSORS = Object.freeze({
  jobs: '9d9623206dfd82a9cbd465aef6e36ea48fe0534ff02a85d1a857b2672ec67818',
  hrs: 'ba036a9394baf8a0a4194850ed25e0dba0c97ed8dabfd7842d0c5bf8bbcc4d16',
  bg1: 'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950',
  status: '71e2f9f080b8af0b7100d49b70520f8c34dffdc1bc84f3912b20aff413adf97c',
  recovery: 'b7cc8c0d061bef261a0d9ab3824672b7759502ab0d26c68139e5cfcf6525eaf7',
  gap: '96f86b8d5432508a3172ea483c8804cf405027f1bb565422df683615f061f5d7',
})
export const ROLLING_REPLACEMENTS = Object.freeze([
  'official_v3_jobs_private.assert_history_v1(text)',
  'official_v3_jobs_private.tx_execution_start_v1(jsonb,jsonb,integer,integer,timestamptz)',
  'official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz)',
  'official_v3_guard_private.jobs_catalog_v1()',
  'official_v3_guard_private.hrs_catalog_v1()',
  'official_v3_guard_private.assert_catalog_v1()',
  'official_v3_guard_private.require_open_v1()',
  'public.official_v3_guard_alarm_status_v1()',
])
// Pure byte memo only. It is deliberately separate from the unchanged job
// validation memo: computing canonical bytes never certifies a job or a row.
export const ROLLING_CANONICAL_MEMO_DECLARATION = `
  canonical_memo_key_one text COLLATE "C"; canonical_memo_key_two text COLLATE "C";
  canonical_memo_value_one text; canonical_memo_value_two text;
  canonical_memo_bytes_one integer:=0; canonical_memo_bytes_two integer:=0;`
function once(value, marker, replacement) {
  assert.equal(value.split(marker).length, 2, 'exact rolling source anchor: ' + marker.slice(0, 120))
  return value.replace(marker, () => replacement)
}
const ownerOf = signature => signature.startsWith('official_v3_jobs_private.') ? 'ot_v3_jobs_owner' : 'postgres'
function metadata(f) {
  return { signature: f.signature, name: f.name, owner: ownerOf(f.signature), hash: sha(f.body),
    language: /LANGUAGE\s+(\w+)/i.exec(f.options)[1].toLowerCase(), definer: /SECURITY DEFINER/i.test(f.options),
    volatile: /\bIMMUTABLE\b/.test(f.options) ? 'i' : /\bSTABLE\b/.test(f.options) ? 's' : 'v',
    config: [...f.options.matchAll(/SET\s+(\w+)\s*=\s*('[^']*'|[^\s]+)/gi)].map(m =>
      ({ timezone: 'TimeZone', datestyle: 'DateStyle' }[m[1].toLowerCase()] ?? m[1]) + '=' + (m[1].toLowerCase() === 'search_path' && !m[2].startsWith("'") ? m[2].replaceAll(',', ', ') : m[2].replace(/^'|'$/g, ''))) }
}
function definition(f, body) {
  const sql = 'CREATE OR REPLACE FUNCTION ' + f.name + '(' + f.args + ') ' + f.options + 'AS $rolling_body$' + body + '$rolling_body$;'
  return ownerOf(f.signature) === 'postgres' ? sql : 'SET LOCAL ROLE ot_v3_jobs_owner;\n' + sql + '\nRESET ROLE;'
}

export function compileRollingQuotaMigrationBody() {
  const jobs = read('../official-truth-v3-hosted-durable-jobs-1/install-candidate.sql')
  const hrs = read('../official-truth-v3-hosted-result-store-1/install-candidate.sql')
  const stack = [read('provider-migration-body.sql', guard), read('status-rpc-provider-migration-body.sql', guard),
    read('recovery-provider-migration-body.sql', guard), read('recovery-gap-provider-migration-body.sql', guard)]
  for (const [value, expected] of [[jobs, ROLLING_PREDECESSORS.jobs], [hrs, ROLLING_PREDECESSORS.hrs],
    ...stack.map((value, i) => [value, ROLLING_PREDECESSORS[['bg1', 'status', 'recovery', 'gap'][i]]])])
    assert.equal(sha(value), expected, 'installed predecessor files are immutable')
  const current = new Map([jobs, ...stack].flatMap(functionsIn).map(f => [f.signature, f]))
  const old = name => { const f = current.get(name); assert.ok(f, name); return f }
  const bodies = new Map()
  let f = old(ROLLING_REPLACEMENTS[0]), body = f.body
  body = once(body, 'command_identity jsonb;', 'command_identity jsonb; quota jsonb;')
  body = once(body, '\nBEGIN\n', ROLLING_CANONICAL_MEMO_DECLARATION + '\nBEGIN\n')
  body = once(body, '    envelope_canonical:=official_v3_jobs_private.canonical_v1(e,0);', read('canonical-envelope.sql').trimEnd())
  body = once(body, '  IF ops<>s.operation_count OR starts<>s.start_count OR ops>256 OR starts>64 OR cardinality(unresolved)>1',
    "  quota:=official_v3_jobs_private.rolling_usage_v2(k);\n  IF ops<>s.operation_count OR starts<>s.start_count\n    OR (quota->>'operations')::integer+(quota->>'credit')::integer>256 OR (quota->>'starts')::integer>64 OR cardinality(unresolved)>1")
  bodies.set(f.signature, body)
  f = old(ROLLING_REPLACEMENTS[1]); body = once(f.body, 'attempt text; token text;', 'attempt text; token text; quota jsonb;')
  body = once(body, '  IF s.start_count>=64 OR s.operation_count>=256 OR s.operation_count+1>256 THEN',
    "  quota:=official_v3_jobs_private.rolling_usage_v2(s.job_key);\n  IF (quota->>'clock_ok')::boolean IS NOT TRUE OR (quota->>'starts')::integer>=64\n    OR (quota->>'operations')::integer+1>256 THEN")
  bodies.set(f.signature, body)
  f = old(ROLLING_REPLACEMENTS[2]); body = once(f.body, 'terminal boolean:=false;', 'terminal boolean:=false; quota jsonb;')
  body = once(body, "  IF COALESCE(s.operation_count,0)+1+(CASE WHEN new_credit IS NULL THEN 0 ELSE 1 END)>256\n    OR (c->>'action'='claim' AND next_record->>'state'='leased' AND s.start_count>=64) THEN",
    "  quota:=official_v3_jobs_private.rolling_usage_v2(c->>'jobKey');\n  IF (quota->>'clock_ok')::boolean IS NOT TRUE\n    OR (quota->>'operations')::integer+1+(CASE WHEN new_credit IS NULL THEN 0 ELSE 1 END)>256\n    OR (c->>'action'='claim' AND next_record->>'state'='leased' AND (quota->>'starts')::integer>=64) THEN")
  bodies.set(f.signature, body)
  bodies.set(ROLLING_REPLACEMENTS[3], '\nSELECT key,value FROM official_v3_guard_private.rolling_quota_baseline_v1 b,\nLATERAL jsonb_each(b.jobs_catalog) WHERE b.singleton\n')
  bodies.set(ROLLING_REPLACEMENTS[4], '\nSELECT hrs_catalog FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton\n')
  f = old(ROLLING_REPLACEMENTS[5]); body = once(f.body,
    'gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;',
    'gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;\n  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE;')
  body = once(body, 'BEGIN\n', 'BEGIN\n  SELECT * INTO STRICT rolling FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;\n')
  body = once(body, 'OR gap_baseline.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()',
    "OR rolling.predecessor_provider_digest<>'GAP_PROVIDER_SHA256'\n    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(gap_baseline.catalog::text,'UTF8')),'hex')\n    OR rolling.predecessor_gap_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(gap_baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM gap_baseline.proof_not_before)))::text,'UTF8')),'hex')\n    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at)) FROM official_v3_jobs_private.rolling_policy_v2 p)\n    OR rolling.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()")
  bodies.set(f.signature, body)
  const oldProof = 'SELECT greatest(g.required_generation,r.required_generation,b.required_generation),greatest(g.proof_not_before,r.proof_not_before,b.proof_not_before)\n    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.gap_recovery_baseline_v1 g\n      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r\n      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE g.singleton AND r.singleton AND b.singleton;'
  const newProof = 'SELECT greatest(q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)\n    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q\n      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g\n      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r\n      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE q.singleton AND g.singleton AND r.singleton AND b.singleton;'
  for (const name of ROLLING_REPLACEMENTS.slice(6)) bodies.set(name, once(old(name).body, oldProof, newProof))
  const definitions = ROLLING_REPLACEMENTS.map(name => definition(old(name), bodies.get(name))).join('\n\n').replaceAll('GAP_PROVIDER_SHA256', ROLLING_PREDECESSORS.gap)
  const policy = read('policy.sql')
  const successors = functionsIn(definitions)
  assert.deepEqual(successors.map(f => f.signature), ROLLING_REPLACEMENTS)
  for (const f of successors) {
    const before = metadata(old(f.signature)), after = metadata(f)
    assert.notEqual(before.hash, after.hash)
    assert.deepEqual({ ...before, hash: null }, { ...after, hash: null }, 'only existing function body changes')
  }
  const oldPart = read('parts/recovery.sql', guard)
  let prefix = oldPart.slice(oldPart.indexOf('CREATE TEMP TABLE bg1_recovery_before'), oldPart.indexOf('-- PO-authorized, transaction-local elevation'))
  prefix = once(prefix, "IF to_regclass('official_v3_guard_private.recovery_baseline_v1') IS NOT NULL\n    OR to_regclass('official_v3_guard_private.retired_later_attempts_v1') IS NOT NULL\n    OR to_regprocedure('official_v3_guard_private.recovery_canonical_v1(jsonb,integer)') IS NOT NULL THEN",
    "IF to_regclass('official_v3_guard_private.rolling_quota_baseline_v1') IS NOT NULL\n    OR to_regclass('official_v3_jobs_private.rolling_policy_v2') IS NOT NULL\n    OR to_regprocedure('official_v3_jobs_private.rolling_usage_v2(text)') IS NOT NULL\n    OR to_regprocedure('official_v3_guard_private.ch_de_quota_v2()') IS NOT NULL THEN")
  prefix = once(prefix, 'SELECT catalog FROM official_v3_guard_private.status_baseline_v1 WHERE singleton', 'SELECT catalog FROM official_v3_guard_private.gap_recovery_baseline_v1 WHERE singleton')
  prefix = once(prefix, "ARRAY['ot_v3_jobs_owner','ot_v3_result_owner']", "ARRAY['ot_v3_jobs_owner']")
  prefix = once(prefix, "'official_v3_guard_private.owner_operations_v1','official_v3_guard_private.retired_attempts_v1','official_v3_guard_private.status_baseline_v1'",
    "'official_v3_guard_private.owner_operations_v1','official_v3_guard_private.retired_attempts_v1','official_v3_guard_private.status_baseline_v1',\n    'official_v3_guard_private.recovery_baseline_v1','official_v3_guard_private.retired_later_attempts_v1','official_v3_guard_private.gap_recovery_baseline_v1'")
  prefix = once(prefix, '/* PREDECESSOR_FUNCTIONS */', [...current.values()].map(f => '(' + quote(f.signature) + ',' + quote(sha(f.body)) + ')').join(',\n    '))
  prefix = once(prefix, '/* STATUS_CATALOG_QUERY */', old('official_v3_guard_private.catalog_status_v1()').body.trim())
  prefix = prefix.replaceAll('bg1_recovery_before', 'rolling_before')
  const contexts = [...stack[3].matchAll(/DO \$context\$[\s\S]*?END \$context\$;/g)]
  assert.equal(contexts.length, 1)
  const context = once(contexts[0][0], "current_setting('jetnity.bg1_gap_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1-RECOVERY3'",
    "current_setting('jetnity.rolling_quota_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:ROLLING-QUOTA1'")
  const qs = context.indexOf('IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (')
  const qe = context.indexOf(' THEN\n    RAISE EXCEPTION', qs)
  assert.ok(qs > 0 && qe > qs)
  const jobsCatalog = functionsIn(jobs).find(f => f.signature === 'official_v3_jobs_private.assert_catalog_v1()')
  const queries = [...jobsCatalog.body.matchAll(/SELECT q\.value INTO actual_value FROM \(\n([\s\S]*?)\n\s*\) q;\n\s*SELECT fingerprint INTO bound_value FROM official_v3_jobs_private\.catalog_binding_v1 WHERE object_identity='([^']+)'/g)]
  assert.equal(queries.length, 15)
  const captureJobs = "result_value:='{}'::jsonb;\n" + queries.map(m => 'SELECT q.value INTO current_value FROM (\n' + m[1] + '\n) q;\nresult_value:=result_value||jsonb_build_object(' + quote(m[2]) + ',current_value);').join('\n')
    + "\nSELECT fingerprint INTO current_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='package-context';\nresult_value:=result_value||jsonb_build_object('package-context',current_value);"
  const hrsCatalog = functionsIn(hrs).find(f => f.signature === 'official_v3_result_private.catalog_v1()')
  assert.ok(hrsCatalog)
  const hrsQuery = hrsCatalog.body.trim().replace(/^BEGIN\s+RETURN\s*\(/, '').replace(/\);\s*END\s*$/, '').trim()
  assert.ok(hrsQuery.startsWith('WITH '))
  let delta = read('delta.sql')
  delta = once(delta, '/* APPROVED_FUNCTIONS */', quote(JSON.stringify([...successors, ...functionsIn(policy)].map(metadata))) + '::jsonb')
  delta = once(delta, '/* CAPTURE_JOBS */', captureJobs)
  delta = once(delta, '/* CAPTURE_HRS */', hrsQuery)
  let post = oldPart.slice(oldPart.indexOf('DO $recovery_postcheck$')).replaceAll('bg1_recovery_before', 'rolling_before')
  post = once(post, "  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1) THEN\n    RAISE EXCEPTION 'bg1 recovery installer cannot retire an attempt' USING ERRCODE='P7901'; END IF;\n", '')
  post = once(post, '/* FINAL_QUIESCENCE */', context.slice(qs, qe))
  const output = [
    '-- ROLLING-QUOTA1: exact Dev CH→DE successor; provider transaction required. No counter reset or history deletion.',
    "SET LOCAL jetnity.rolling_quota_target='dev:yfvbxvijcorffwxbxahl:ROLLING-QUOTA1';",
    "SET LOCAL search_path=pg_catalog; SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='5s';",
    "SET LOCAL idle_in_transaction_session_timeout='30s'; SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO, YMD';",
    context, prefix, read('constraints-before.sql'),
    'GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;',
    policy, definitions, read('constraints.sql'),
    'REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;', delta, post,
  ].join('\n\n').replaceAll('GAP_PROVIDER_SHA256', ROLLING_PREDECESSORS.gap).replaceAll('ROLLING_JOB_KEY', target) + '\n'
  assertTransactionBody(output)
  assert.equal(functionsIn(output).length, 10)
  return output
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'rolling_build_mode_required')
  const output = compileRollingQuotaMigrationBody(), path = new URL('provider-migration-body.sql', here)
  if (process.argv[2] === '--write') writeFileSync(path, output)
  else assert.equal(readFileSync(path, 'utf8'), output, 'rolling SQL matches reviewed generator')
}
