// Deterministic offline compiler. Six additive validators, two bounded pure
// history/checker optimizations, the closed atomic claim and five BG1 successor
// bodies are permitted. Both new helpers have owner-only execution authority.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertTransactionBody, functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'
import { compileHistoryDefinition, HISTORY_SIGNATURE } from './history-build.mjs'
import { compileHistoryGuardDefinition, HISTORY_GUARD_SIGNATURE } from './history-guard-build.mjs'
import { compileAtomicClaimDefinitions, ATOMIC_CLAIM_REPLACEMENTS, ATOMIC_QUEUE_HELPER_SIGNATURES } from './atomic-claim-build.mjs'

export { ATOMIC_CLAIM_REPLACEMENTS, ATOMIC_QUEUE_HELPER_SIGNATURES }

const here = new URL('./', import.meta.url)
const read = (name, base = here) => readFileSync(new URL(name, base), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
export const TARGET = 'dev:yfvbxvijcorffwxbxahl:CUSTOMER-INFORMATION1'
export const BASELINE = 'official_v3_guard_private.customer_information_baseline_v1'
export const BUSINESS_REPLACEMENTS = Object.freeze([
  'official_v3_intake_private.proposal_shape_v1()',
  'official_v3_jobs_private.context_v1(jsonb)',
  'official_v3_jobs_private.subject_v1(text,jsonb)',
  'official_v3_result_private.context_v1(jsonb)',
  'official_v3_result_private.subject_v1(text,jsonb)',
  'official_v3_result_private.proposal_shape_v1()',
])
export const PERFORMANCE_REPLACEMENTS = Object.freeze([HISTORY_SIGNATURE, HISTORY_GUARD_SIGNATURE])
export const GUARD_REPLACEMENTS = Object.freeze([
  'official_v3_guard_private.jobs_catalog_v1()',
  'official_v3_guard_private.hrs_catalog_v1()',
  'official_v3_guard_private.assert_catalog_v1()',
  'official_v3_guard_private.require_open_v1()',
  'public.official_v3_guard_alarm_status_v1()',
])
const owners = ['ot_v3_intake_owner', 'ot_v3_jobs_owner', 'ot_v3_result_owner']
const ownerOf = signature => signature.startsWith('official_v3_intake_private.') ? owners[0]
  : signature.startsWith('official_v3_jobs_private.') || signature.startsWith('official_v3_jobs_api.')
    || signature === HISTORY_GUARD_SIGNATURE ? owners[1]
    : signature.startsWith('official_v3_result_private.') ? owners[2] : 'postgres'
function once(value, marker, replacement) {
  assert.equal(value.split(marker).length, 2, 'exact customer source anchor: ' + marker.slice(0, 100))
  return value.replace(marker, () => replacement)
}
function metadata(f, created = false) {
  return { signature: f.signature, name: f.name, owner: ownerOf(f.signature), hash: sha(f.body),
    created,
    language: /LANGUAGE\s+(\w+)/i.exec(f.options)[1].toLowerCase(), definer: /SECURITY DEFINER/i.test(f.options),
    volatile: /\bIMMUTABLE\b/.test(f.options) ? 'i' : /\bSTABLE\b/.test(f.options) ? 's' : 'v',
    config: [...f.options.matchAll(/SET\s+(\w+)\s*=\s*('[^']*'|[^\s]+)/gi)].map(m =>
      ({ timezone: 'TimeZone', datestyle: 'DateStyle' }[m[1].toLowerCase()] ?? m[1]) + '='
      + (m[1].toLowerCase() === 'search_path' && !m[2].startsWith("'") ? m[2].replaceAll(',', ', ') : m[2].replace(/^'|'$/g, ''))) }
}
function definition(f, body, created = false) {
  const sql = 'CREATE ' + (created ? '' : 'OR REPLACE ') + 'FUNCTION ' + f.name + '(' + f.args + ') ' + f.options
    + 'AS $customer_body$' + body + '$customer_body$;'
  const owner = ownerOf(f.signature)
  const privateAcl = created ? '\nREVOKE ALL ON FUNCTION ' + f.signature
    + ' FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_caller;' : ''
  const owned = owner === 'postgres' ? sql + privateAcl : 'SET LOCAL ROLE ' + owner + ';\n' + sql + privateAcl + '\nRESET ROLE;'
  // The original BG1 checker is jobs-owned inside the postgres-owned guard
  // schema. Restore this one temporary DDL permission before any catalog seal.
  return f.signature === HISTORY_GUARD_SIGNATURE
    ? 'GRANT CREATE ON SCHEMA official_v3_guard_private TO ot_v3_jobs_owner;\n' + owned
      + '\nREVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_jobs_owner;'
    : owned
}

export function compileCustomerInformationMigration() {
  const pins = JSON.parse(read('pins.json'))
  const predecessorFiles = Object.entries(pins.predecessors).map(([path, expected]) => {
    const sql = read(path)
    assert.equal(sha(sql), expected, 'installed predecessor file is immutable: ' + path)
    return sql
  })
  const current = new Map(predecessorFiles.flatMap(functionsIn).map(f => [f.signature, f]))
  assert.equal(predecessorFiles.join('\n').split('ALTER FUNCTION ' + HISTORY_GUARD_SIGNATURE + ' OWNER TO ot_v3_jobs_owner;').length, 2,
    'the existing BG1 checker retains its exact historical jobs owner')
  const old = name => { const f = current.get(name); assert.ok(f, 'known predecessor: ' + name); return f }
  const supplied = read('definitions.sql')
  assert.equal(sha(supplied), pins.definitionsDigest, 'exact reviewed six-definition artifact')
  const dataDefinitions = functionsIn(supplied)
  assert.deepEqual(dataDefinitions.map(f => f.signature).sort(), [...BUSINESS_REPLACEMENTS].sort())
  const history = read('history-definition.sql')
  assert.equal(history, compileHistoryDefinition().sql, 'exact reviewed independent history definition')
  const historyGuard = read('history-guard-definition.sql'), compiledGuard = compileHistoryGuardDefinition()
  assert.equal(historyGuard, compiledGuard.sql, 'exact reviewed independent BG1 membership definition')
  assert.equal(sha(historyGuard), pins.historyGuardDefinitionsDigest, 'exact separate membership artifact pin')
  const historyDefinitions = [...functionsIn(history), ...functionsIn(historyGuard)]
  assert.deepEqual(historyDefinitions.map(f => f.signature), [...PERFORMANCE_REPLACEMENTS])
  const atomic = read('atomic-claim-definitions.sql'), compiledAtomic = compileAtomicClaimDefinitions()
  assert.equal(atomic, compiledAtomic.sql, 'exact independently reviewed closed atomic claim definitions')
  assert.equal(sha(atomic), pins.atomicClaimDefinitionsDigest, 'exact separate atomic artifact pin')
  const atomicDefinitions = functionsIn(atomic)
  assert.equal(ATOMIC_QUEUE_HELPER_SIGNATURES.length, 2)
  assert.deepEqual(atomicDefinitions.map(f => f.signature).sort(), [...ATOMIC_CLAIM_REPLACEMENTS, ...ATOMIC_QUEUE_HELPER_SIGNATURES].sort())
  const helpers = ATOMIC_QUEUE_HELPER_SIGNATURES.map(signature => {
    const helper = atomicDefinitions.find(f => f.signature === signature)
    assert.ok(helper && !current.has(signature), 'each exact new private helper has no predecessor overload')
    assert.equal(sha(helper.body), pins.functions[signature].after, 'new owner-only helper body pin')
    assert.equal(pins.functions[signature].before, null, 'new helper is not an existing function replacement')
    return helper
  })
  const business = [...dataDefinitions, ...historyDefinitions, ...atomicDefinitions.filter(f => !ATOMIC_QUEUE_HELPER_SIGNATURES.includes(f.signature))]
  for (const f of business) {
    assert.equal(sha(old(f.signature).body), pins.functions[f.signature].before, 'original function pin: ' + f.signature)
    assert.equal(sha(f.body), pins.functions[f.signature].after, 'reviewed successor pin: ' + f.signature)
    const before = metadata(old(f.signature)), after = metadata(f)
    assert.notEqual(before.hash, after.hash, 'every declared validator changes')
    assert.deepEqual({ ...before, hash: null }, { ...after, hash: null }, 'validator authority/signature/options are unchanged')
    assert.equal(f.args, old(f.signature).args, 'argument names and types remain exact')
  }
  const definitions = [...helpers.map(f => definition(f, f.body, true)), ...business.map(f => definition(old(f.signature), f.body))]
  const rollingDigest = pins.predecessors['../official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql']
  assert.match(rollingDigest, /^[a-f0-9]{64}$/)
  for (const signature of GUARD_REPLACEMENTS) {
    const f = old(signature)
    let body = f.body
    if (signature === GUARD_REPLACEMENTS[0] || signature === GUARD_REPLACEMENTS[1]) {
      body = once(body, 'official_v3_guard_private.rolling_quota_baseline_v1', BASELINE)
    } else if (signature === GUARD_REPLACEMENTS[2]) {
      body = once(body, 'rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE;',
        'rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE;\n  customer ' + BASELINE + '%ROWTYPE;')
      body = once(body, 'BEGIN\n', 'BEGIN\n  SELECT * INTO STRICT customer FROM ' + BASELINE + ' WHERE singleton;\n')
      body = once(body, 'OR rolling.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()',
        "OR customer.predecessor_provider_digest<>" + quote(rollingDigest)
        + "\n    OR customer.definitions_digest<>" + quote(pins.definitionsDigest)
        + "\n    OR customer.history_definition_digest<>" + quote(pins.historyDefinitionsDigest)
        + "\n    OR customer.history_guard_definition_digest<>" + quote(pins.historyGuardDefinitionsDigest)
        + "\n    OR customer.atomic_claim_definition_digest<>" + quote(pins.atomicClaimDefinitionsDigest)
        + "\n    OR customer.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')"
        + "\n    OR customer.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')"
        + '\n    OR customer.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()')
    } else {
      const oldProof = 'SELECT greatest(q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)\n    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q\n      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g\n      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r\n      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE q.singleton AND g.singleton AND r.singleton AND b.singleton;'
      const newProof = 'SELECT greatest(c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)\n    INTO STRICT required_proof,earliest_proof FROM ' + BASELINE + ' c\n      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q\n      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g\n      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r\n      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;'
      body = once(body, oldProof, newProof)
    }
    definitions.push(definition(f, body))
  }
  const successorDefinitions = definitions.join('\n\n')
  const successors = functionsIn(successorDefinitions)
  assert.equal(successors.length, 17)
  assert.equal(new Set(successors.map(f => f.signature)).size, 17)
  const approved = JSON.stringify(successors.map(f => metadata(f, ATOMIC_QUEUE_HELPER_SIGNATURES.includes(f.signature))))
  const catalogQuery = old('official_v3_guard_private.catalog_status_v1()').body.trim()
  let prefix = read('preflight.sql')
  prefix = once(prefix, '/* PREDECESSOR_FUNCTIONS */', [...current.values()].map(f => '(' + quote(f.signature) + ',' + quote(sha(f.body)) + ')').join(',\n    '))
  prefix = once(prefix, '/* STATUS_CATALOG_QUERY */', catalogQuery)
  const jobs = read('../official-truth-v3-hosted-durable-jobs-1/install-candidate.sql')
  const jobsCatalog = functionsIn(jobs).find(f => f.signature === 'official_v3_jobs_private.assert_catalog_v1()')
  const queries = [...jobsCatalog.body.matchAll(/SELECT q\.value INTO actual_value FROM \(\n([\s\S]*?)\n\s*\) q;\n\s*SELECT fingerprint INTO bound_value FROM official_v3_jobs_private\.catalog_binding_v1 WHERE object_identity='([^']+)'/g)]
  assert.equal(queries.length, 15, 'same complete HM04 subcatalog inventory as the rolling predecessor')
  const captureJobs = "result_value:='{}'::jsonb;\n" + queries.map(m => 'SELECT q.value INTO current_value FROM (\n' + m[1]
    + '\n) q;\nresult_value:=result_value||jsonb_build_object(' + quote(m[2]) + ',current_value);').join('\n')
    + "\nSELECT fingerprint INTO current_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='package-context';\nresult_value:=result_value||jsonb_build_object('package-context',current_value);"
  const hrs = functionsIn(read('../official-truth-v3-hosted-result-store-1/install-candidate.sql'))
    .find(f => f.signature === 'official_v3_result_private.catalog_v1()')
  const hrsQuery = hrs.body.trim().replace(/^BEGIN\s+RETURN\s*\(/, '').replace(/\);\s*END\s*$/, '').trim()
  assert.ok(hrsQuery.startsWith('WITH '))
  let delta = read('delta.sql')
  delta = once(delta, '/* APPROVED_FUNCTIONS */', quote(approved) + '::jsonb')
  delta = once(delta, '/* CAPTURE_JOBS */', captureJobs)
  delta = once(delta, '/* CAPTURE_HRS */', hrsQuery)
  const output = [
    '-- CUSTOMER-INFORMATION1: fixed Dev successor. Provider transaction required; no business data or audit writes.',
    "SET LOCAL jetnity.customer_information_target=" + quote(TARGET) + ';',
    "SET LOCAL search_path=pg_catalog; SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='5s';",
    "SET LOCAL idle_in_transaction_session_timeout='30s'; SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO, YMD';",
    prefix,
    ...owners.map(owner => 'GRANT ' + owner + ' TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;'),
    read('baseline.sql'), successorDefinitions,
    ...owners.map(owner => 'REVOKE ' + owner + ' FROM postgres GRANTED BY postgres;'),
    delta, read('postcheck.sql'),
  ].join('\n\n').replaceAll('ROLLING_PROVIDER_SHA256', rollingDigest).replaceAll('DEFINITIONS_SHA256', pins.definitionsDigest)
    .replaceAll('HISTORY_DEFINITION_SHA256', pins.historyDefinitionsDigest).trimEnd() + '\n'
  const completeOutput = output.replaceAll('HISTORY_GUARD_DEFINITION_SHA256', pins.historyGuardDefinitionsDigest)
    .replaceAll('ATOMIC_CLAIM_DEFINITION_SHA256', pins.atomicClaimDefinitionsDigest)
  assertTransactionBody(completeOutput)
  assert.equal(functionsIn(completeOutput).length, 17)
  const inventory = successors.map(f => ({ signature: f.signature,
    before: current.has(f.signature) ? sha(old(f.signature).body) : null, after: sha(f.body) }))
  const readback = read('readback-template.sql').replace('/* APPROVED_FUNCTIONS */', quote(JSON.stringify(inventory)) + '::jsonb')
    .replaceAll('ROLLING_PROVIDER_SHA256', rollingDigest).replaceAll('DEFINITIONS_SHA256', pins.definitionsDigest)
    .replaceAll('HISTORY_DEFINITION_SHA256', pins.historyDefinitionsDigest)
    .replaceAll('HISTORY_GUARD_DEFINITION_SHA256', pins.historyGuardDefinitionsDigest)
    .replaceAll('ATOMIC_CLAIM_DEFINITION_SHA256', pins.atomicClaimDefinitionsDigest)
    .replaceAll('MIGRATION_SHA256', sha(completeOutput))
  return { migration: completeOutput, readback, inventory, digest: sha(completeOutput) }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'customer_build_mode_required')
  const compiled = compileCustomerInformationMigration()
  for (const [name, value] of [['provider-migration-body.sql', compiled.migration], ['readback.sql', compiled.readback]]) {
    if (process.argv[2] === '--write') writeFileSync(new URL(name, here), value)
    else assert.equal(read(name), value, 'customer SQL matches reviewed generator: ' + name)
  }
}
