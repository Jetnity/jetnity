// Offline compiler for one new, unused Production installation. Never opens a
// database, reads credentials, selects a host from input, or approves a method.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertTransactionBody, compileCandidate, functionsIn } from '../db/official-truth-v3-background-guard-1/build.mjs'

const root = new URL('../../', import.meta.url)
const here = new URL('./', import.meta.url)
const own = 'scripts/db/official-truth-v3-production-install-1/'
const bg = 'scripts/db/official-truth-v3-background-guard-1/'
const quota = 'scripts/db/official-truth-v3-rolling-jobs-quota-1/'
const schedule = 'scripts/db/official-truth-v3-production-import-schedule-1/'
const customerDefinitionsPath = 'scripts/db/official-truth-v3-customer-information-1/definitions.sql'
const historyDefinitionPath = 'scripts/db/official-truth-v3-customer-information-1/history-definition.sql'
const historyGuardDefinitionPath = 'scripts/db/official-truth-v3-customer-information-1/history-guard-definition.sql'
const historyGuardSignature = 'official_v3_guard_private.check_jobs_v1()'
const atomicClaimDefinitionPath = 'scripts/db/official-truth-v3-customer-information-1/atomic-claim-definitions.sql'
const atomicClaimReplacements = ['official_v3_jobs_private.wire_v1(text)',
  'official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text)']
const atomicQueueHelpers = [
  'official_v3_jobs_private.tx_queue_claim_v1(jsonb,jsonb,integer,integer,timestamptz)',
  'official_v3_jobs_private.tx_queue_mutate_v1(jsonb,jsonb,integer,integer,timestamptz)',
]
const customerFunctions = Object.freeze([
  'official_v3_intake_private.proposal_shape_v1()',
  'official_v3_jobs_private.context_v1(jsonb)', 'official_v3_jobs_private.subject_v1(text,jsonb)',
  'official_v3_result_private.context_v1(jsonb)', 'official_v3_result_private.subject_v1(text,jsonb)',
  'official_v3_result_private.proposal_shape_v1()',
])
const customerOwners = ['ot_v3_intake_owner', 'ot_v3_jobs_owner', 'ot_v3_result_owner']
const packagePath = 'scripts/official-truth-product-v3-production/'
const read = path => readFileSync(new URL(path, root), 'utf8')
export const sha256 = value => createHash('sha256').update(value).digest('hex')
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
export const PRODUCTION = Object.freeze({
  project: 'qscbgcdmivbbnzrcyegn', host: 'db.qscbgcdmivbbnzrcyegn.supabase.co', database: 'postgres', port: 5432,
  url: 'https://qscbgcdmivbbnzrcyegn.supabase.co', site: 'https://jetnity.com',
  target: 'production:qscbgcdmivbbnzrcyegn:INSTALL1', hmt: 'production:qscbgcdmivbbnzrcyegn:postgres:PG17',
  bg: 'production:qscbgcdmivbbnzrcyegn:BG1', status: 'production:qscbgcdmivbbnzrcyegn:BG1-STATUS1',
  quota: 'production:qscbgcdmivbbnzrcyegn:ROLLING-QUOTA1',
  subject: 'research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513',
})
/** @type {readonly (readonly [string, string | null, string])[]} */
export const LOGINS = Object.freeze([
  ['ot_v3_method_transport_login', 'ot_v3_method_reader', 'JETNITY_V3_PG_METHOD_PASSWORD'],
  ['ot_v3_intake_transport_login', 'ot_v3_intake_caller', 'JETNITY_V3_PG_INTAKE_PASSWORD'],
  ['ot_v3_jobs_transport_login', 'ot_v3_jobs_caller', 'JETNITY_V3_PG_JOBS_PASSWORD'],
  ['ot_v3_result_writer', null, 'JETNITY_V3_PG_RESULT_WRITER_PASSWORD'],
  ['ot_v3_result_reader', null, 'JETNITY_V3_PG_RESULT_READER_PASSWORD'],
  ['ot_v3_result_verifier', null, 'JETNITY_V3_PG_RESULT_VERIFIER_PASSWORD'],
])
export const INSTALL_ORDER = Object.freeze(['PAI', 'TRANSPORT_LOGINS', 'PG1', 'HMA1', 'HS1', 'HMT1_PRODUCTION',
  'HRS1', 'HM04', 'TRANSPORT_SET_EDGES', 'BG1_PRODUCTION', 'BG1_STATUS_PRODUCTION', 'ROLLING_FRESH_PRODUCTION'])
const foundation = Object.freeze({ PAI: 'profile-authority-integrity-1', PG1: 'official-truth-v3-private-owner-guards-1',
  HMA1: 'official-truth-v3-hosted-method-authority-1', HS1: 'official-truth-v3-hosted-intake-store-1',
  HMT1_PRODUCTION: 'official-truth-v3-human-method-transport-1', HRS1: 'official-truth-v3-hosted-result-store-1',
  HM04: 'official-truth-v3-hosted-durable-jobs-1' })
const compilerInputs = Object.freeze([
  ...['build.mjs', 'source-pins.json', 'binding.json', 'activate-background-guard.sql'].map(path => packagePath + path),
  ...['preflight.sql', 'provider-preflight.sql', 'scheduler-preflight.sql', 'preserve-before.sql', 'preserve-after.sql', 'rolling-prefix.sql',
    'rolling-policy.sql', 'rolling-catalog.sql', 'rolling-postcheck.sql', 'verify-installed.sql'].map(path => own + 'parts/' + path),
])
const operationalInputs = Object.freeze([
  ...['README.md', 'activate-background-guard.sql', 'configure-credentials.sql'].map(path => packagePath + path),
  own + 'README.md',
  ...['provider-prerequisites.sql', 'core.sql', 'monitoring.sql', 'activate.sql', 'deactivate.sql', 'readback.sql', 'README.md'].map(path => schedule + path),
])
function identity(path) {
  const value = readFileSync(new URL(path, root))
  return { path, bytes: value.length, sha256: sha256(value) }
}
export function verifySourcePins() {
  const pins = JSON.parse(readFileSync(new URL('source-pins.json', here), 'utf8'))
  for (const pin of pins) {
    const bytes = readFileSync(new URL(pin.path, root))
    assert.equal(bytes.length, pin.bytes, 'production immutable source bytes: ' + pin.path)
    assert.equal(sha256(bytes), pin.sha256, 'production immutable source hash: ' + pin.path)
  }
  return pins
}
function once(value, marker, next) {
  assert.equal(value.split(marker).length, 2, 'exact production compiler anchor: ' + marker.slice(0, 100))
  return value.replace(marker, () => next)
}
function token(value, marker, next, expected) {
  assert.equal(value.split(marker).length - 1, expected, 'exact production token inventory: ' + marker)
  return value.replaceAll(marker, next)
}
function body(source) {
  let result = once(source, '\nBEGIN;', '\n')
  result = once(result, '\nCOMMIT;', '\n')
  const isolation = 'SET TRANSACTION ISOLATION LEVEL READ COMMITTED;'
  assert.ok(result.split(isolation).length <= 2, 'at most one original outer isolation statement')
  if (result.includes(isolation)) result = once(result, isolation, '-- Outer Production transaction owns isolation.')
  // HM04 contains one pinned parsed SQL BEGIN ATOMIC function. The generic
  // BG1 scanner predates that form; validate its surrounding body separately.
  // This changes no emitted bytes. The PG17 proof parses the actual whole file.
  const atomic = /CREATE FUNCTION official_v3_jobs_private\.ma1_require_v1\(m text,r integer,d text,p text,e integer\) RETURNS void\nLANGUAGE sql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp\nBEGIN ATOMIC\n  SELECT official_v3_method_private\.require_current_locked_v1\(m,r,d,p,e\);\nEND;/g
  if (result.includes('BEGIN ATOMIC')) {
    const blocks = [...result.matchAll(atomic)]
    assert.equal(blocks.length, 1, 'one pinned HM04 parsed SQL function')
    assertTransactionBody(result.replace(atomic, 'SELECT true;'))
  } else assertTransactionBody(result)
  return result
}
function definition(f, text = f.body) {
  return 'CREATE OR REPLACE FUNCTION ' + f.name + '(' + f.args + ') ' + f.options + 'AS $production_body$' + text + '$production_body$;'
}
function getFunction(source, signature) {
  const selected = functionsIn(source).filter(f => f.signature === signature)
  assert.equal(selected.length, 1, 'one pinned function: ' + signature)
  return selected[0]
}
function functionMetadata(f) {
  const owner = f.name.startsWith('official_v3_jobs_private.') || f.name.startsWith('official_v3_jobs_api.')
    || f.signature === historyGuardSignature ? 'ot_v3_jobs_owner'
    : f.name.startsWith('official_v3_intake_private.') ? 'ot_v3_intake_owner'
      : f.name.startsWith('official_v3_result_private.') ? 'ot_v3_result_owner' : 'postgres'
  return { signature: f.signature, name: f.name, owner,
    hash: sha256(f.body), language: /LANGUAGE\s+(\w+)/i.exec(f.options)[1].toLowerCase(),
    definer: /SECURITY DEFINER/i.test(f.options), volatile: /\bIMMUTABLE\b/.test(f.options) ? 'i' : /\bSTABLE\b/.test(f.options) ? 's' : 'v',
    config: [...f.options.matchAll(/SET\s+(\w+)\s*=\s*('[^']*'|[^\s]+)/gi)].map(m =>
      ({ timezone: 'TimeZone', datestyle: 'DateStyle' }[m[1].toLowerCase()] ?? m[1]) + '=' +
      (m[1].toLowerCase() === 'search_path' && !m[2].startsWith("'") ? m[2].replaceAll(',', ', ') : m[2].replace(/^'|'$/g, ''))) }
}
function compileHmt() {
  const original = body(read('scripts/db/' + foundation.HMT1_PRODUCTION + '/install-candidate.sql'))
  const context = /DO \$hmt1_context\$[\s\S]*?\$hmt1_context\$;/.exec(original)?.[0]
  assert.ok(context)
  const productionContext = once(context, "'dev:yfvbxvijcorffwxbxahl:postgres:E18B6824905662'", quote(PRODUCTION.hmt))
  return '-- Production HMT1. Identical four invoker wrappers and exact preconditions; own fixed target.\n'
    + once(original, context, productionContext)
}
function compileBg() {
  let source = compileCandidate()
  source = once(source, 'BEGIN ISOLATION LEVEL READ COMMITTED;\n', '')
  source = once(source, 'COMMIT;\n', '')
  source = once(source, "current_setting('jetnity.bg1_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1'",
    "current_setting('jetnity.bg1_target',true) IS DISTINCT FROM " + quote(PRODUCTION.bg))
  source = once(source, 'bg1 exact Dev predecessor required', 'bg1 exact fresh Production predecessor required')
  assertTransactionBody(source)
  return source
}
function compileStatus(productionBg) {
  const original = read(bg + 'status-rpc-provider-migration-body.sql')
  let source = once(original, "SET LOCAL jetnity.bg1_status_target='dev:yfvbxvijcorffwxbxahl:BG1-STATUS1';", '')
  source = once(source, "current_setting('jetnity.bg1_status_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1-STATUS1'",
    "current_setting('jetnity.bg1_status_target',true) IS DISTINCT FROM " + quote(PRODUCTION.status))
  // The only executable differences in BG1 are the fixed context. Its protected
  // function bodies remain identical; this new artifact binds its own parent.
  const oldDigest = sha256(read(bg + 'provider-migration-body.sql'))
  const occurrences = source.split(oldDigest).length - 1
  assert.equal(occurrences, 3, 'status binds exactly three predecessor artifact references')
  source = token(source, oldDigest, sha256(productionBg), occurrences)
  const approved = functions => functions.map(f => ({
    signature: f.signature, hash: sha256(f.body), language: f.name.endsWith('.catalog_status_v1') ? 'sql' : 'plpgsql',
    volatile: f.name.endsWith('.catalog_status_v1') ? 's' : 'v',
    config: f.name.endsWith('.catalog_status_v1') ? ['search_path=pg_catalog', 'jit=off'] : ['search_path=pg_catalog'],
    result: f.name.endsWith('.assert_catalog_v1') ? 'void' : 'jsonb',
    grantees: f.name.startsWith('public.') ? ['anon', 'postgres'] : ['postgres'],
  }))
  const originalFunctions = functionsIn(original), productionFunctions = functionsIn(source)
  assert.equal(originalFunctions.length, 3)
  assert.deepEqual(productionFunctions.map(f => f.signature), originalFunctions.map(f => f.signature))
  // The status assertion itself binds the parent digest. Recompute its exact
  // approved body identity after that parameter changes; no contract is waived.
  source = once(source, quote(JSON.stringify(approved(originalFunctions))) + '::jsonb',
    quote(JSON.stringify(approved(productionFunctions))) + '::jsonb')
  source = once(source, '-- BG1-STATUS1: fixed Dev-only additive status RPC; provider transaction required.',
    '-- Production status RPC; fixed newly installed BG1 predecessor. No positive heartbeat is manufactured.')
  assertTransactionBody(source)
  return source
}
function compileRolling(productionBg, productionStatus, binding) {
  const oldRolling = read(quota + 'provider-migration-body.sql')
  const current = new Map([...functionsIn(read('scripts/db/' + foundation.HM04 + '/install-candidate.sql')),
    ...functionsIn(productionBg), ...functionsIn(productionStatus)].map(f => [f.signature, f]))
  // This fresh, still-unused installation captures its own complete baseline.
  // Retain every historical input byte; replace only the same six reviewed
  // validator bodies used by the additive Dev successor before that capture.
  const customerSource = read(customerDefinitionsPath)
  const customer = customerFunctions.map(signature => getFunction(customerSource, signature))
  assert.equal(functionsIn(customerSource).length, customerFunctions.length)
  const oldCustomer = [...functionsIn(read('scripts/db/' + foundation.HS1 + '/install-candidate.sql')),
    ...functionsIn(read('scripts/db/' + foundation.HRS1 + '/install-candidate.sql'))]
  for (const f of oldCustomer) if (customerFunctions.includes(f.signature)) current.set(f.signature, f)
  const replacementNames = ['official_v3_jobs_private.assert_history_v1(text)',
    'official_v3_jobs_private.tx_execution_start_v1(jsonb,jsonb,integer,integer,timestamptz)',
    'official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz)',
    'official_v3_guard_private.jobs_catalog_v1()', 'official_v3_guard_private.hrs_catalog_v1()',
    'official_v3_guard_private.assert_catalog_v1()', 'official_v3_guard_private.require_open_v1()',
    'public.official_v3_guard_alarm_status_v1()', historyGuardSignature, ...atomicClaimReplacements]
  const historySource = read(historyDefinitionPath)
  assert.equal(functionsIn(historySource).length, 1, 'one separately reviewed bounded history-memo successor')
  const replacements = replacementNames.slice(0, 5).map(signature => definition(getFunction(
    signature === 'official_v3_jobs_private.assert_history_v1(text)' ? historySource : oldRolling, signature)))
  let catalog = read(own + 'parts/rolling-catalog.sql')
  catalog = token(catalog, 'PRODUCTION_BG_SHA256', sha256(productionBg), 1)
  catalog = token(catalog, 'PRODUCTION_STATUS_SHA256', sha256(productionStatus), 1)
  replacements.push(catalog.trim())
  const oldProof = "SELECT greatest(q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)\n    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q\n      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g\n      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r\n      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE q.singleton AND g.singleton AND r.singleton AND b.singleton;"
  const newProof = "SELECT greatest(q.required_generation,b.required_generation),greatest(q.proof_not_before,b.proof_not_before)\n    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q\n      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE q.singleton AND b.singleton;"
  for (const signature of replacementNames.slice(6, 8)) {
    const f = getFunction(oldRolling, signature)
    replacements.push(definition(f, once(f.body, oldProof, newProof)))
  }
  const historyGuardSource = read(historyGuardDefinitionPath)
  assert.equal(functionsIn(historyGuardSource).length, 1, 'one separately reviewed bounded journal-membership successor')
  replacements.push(definition(getFunction(historyGuardSource, historyGuardSignature)))
  const atomicSource = read(atomicClaimDefinitionPath)
  assert.deepEqual(functionsIn(atomicSource).map(f => f.signature), [...atomicClaimReplacements, ...atomicQueueHelpers],
    'exact atomic wire/API successors and two private orchestration helpers')
  for (const signature of atomicClaimReplacements) replacements.push(definition(getFunction(atomicSource, signature)))
  const definitions = [...replacements.map((sql, index) => replacementNames[index] === historyGuardSignature
    ? 'GRANT CREATE ON SCHEMA official_v3_guard_private TO ot_v3_jobs_owner;\nSET LOCAL ROLE ot_v3_jobs_owner;\n'
      + sql + '\nRESET ROLE;\nREVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_jobs_owner;'
    : functionMetadata(getFunction(sql, replacementNames[index])).owner === 'ot_v3_jobs_owner'
      ? 'SET LOCAL ROLE ot_v3_jobs_owner;\n' + sql + '\nRESET ROLE;' : sql),
    ...customer.map(f => 'SET LOCAL ROLE ' + functionMetadata(f).owner + ';\n' + definition(f) + '\nRESET ROLE;')].join('\n\n')
  const successors = functionsIn(definitions)
  assert.deepEqual(successors.map(f => f.signature), [...replacementNames, ...customerFunctions])
  for (const f of successors) {
    assert.ok(current.has(f.signature), 'replacement belongs to the actual fresh predecessor')
    const before = functionMetadata(current.get(f.signature)), after = functionMetadata(f)
    assert.deepEqual({ ...before, hash: null }, { ...after, hash: null }, 'same native signature/owner/options')
    assert.equal(f.args, current.get(f.signature).args, 'same complete argument contract')
  }
  const queueHelpers = atomicQueueHelpers.map(signature => {
    const helper = getFunction(atomicSource, signature)
    assert.ok(!current.has(signature), 'atomic helper is new to the exact unused predecessor')
    assert.equal(helper.args, 'q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz')
    return helper
  })
  const queueHelpersSql = queueHelpers.map(helper => 'SET LOCAL ROLE ot_v3_jobs_owner;\n' + definition(helper)
    + '\nREVOKE ALL ON FUNCTION ' + helper.signature
    + ' FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;\nRESET ROLE;').join('\n\n')
  let policy = read(own + 'parts/rolling-policy.sql')
  policy = token(policy, 'PRODUCTION_METHOD_BINDING', quote(JSON.stringify({ methodId: binding.methodId, revision: binding.revision,
    methodDigest: binding.methodDigest, packageDigest: binding.packageDigest })) + '::jsonb', 2)
  policy = token(policy, 'PRODUCTION_STATUS_SHA256', sha256(productionStatus), 1)
  let prefix = read(own + 'parts/rolling-prefix.sql')
  prefix = token(prefix, '/* PREDECESSOR_FUNCTIONS */', [...current.values()].map(f => '(' + quote(f.signature) + ',' + quote(sha256(f.body)) + ')').join(',\n'), 1)
  prefix = token(prefix, '/* STATUS_CATALOG_QUERY */', getFunction(productionStatus, 'official_v3_guard_private.catalog_status_v1()').body.trim(), 1)
  prefix = once(prefix, "OR to_regclass('official_v3_guard_private.rolling_quota_baseline_v1') IS NOT NULL",
    "OR to_regclass('official_v3_guard_private.rolling_quota_baseline_v1') IS NOT NULL"
      + atomicQueueHelpers.map(signature => '\n    OR to_regprocedure(' + quote(signature) + ') IS NOT NULL').join(''))
  let constraints = read(quota + 'constraints-before.sql')
  constraints = once(constraints, " IF (SELECT count(*) FROM official_v3_jobs_private.subjects_v1\n     WHERE job_key='ROLLING_JOB_KEY' AND kind='rule_research')<>1 THEN\n   RAISE EXCEPTION 'rolling quota requires exact existing CH DE subject' USING ERRCODE='P7911'; END IF;",
    " IF EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1) THEN\n   RAISE EXCEPTION 'production rolling quota requires an unused job store' USING ERRCODE='P7911'; END IF;")
  let delta = read(quota + 'delta.sql')
  delta = once(delta, 'cardinality(replacement_ids)<>8', 'cardinality(replacement_ids)<>17')
  delta = once(delta, "expected.signature NOT IN ('official_v3_jobs_private.rolling_usage_v2(text)','official_v3_guard_private.ch_de_quota_v2()')",
    "expected.signature NOT IN ('official_v3_jobs_private.rolling_usage_v2(text)','official_v3_guard_private.ch_de_quota_v2()'," + atomicQueueHelpers.map(quote).join(',') + ')')
  delta = once(delta, "       OR (expected.signature='official_v3_guard_private.ch_de_quota_v2()' AND (actual.pronargs<>0 OR actual.proargnames IS NOT NULL))",
    "       OR (expected.signature='official_v3_guard_private.ch_de_quota_v2()' AND (actual.pronargs<>0 OR actual.proargnames IS NOT NULL))\n"
      + '       OR (expected.signature IN (' + atomicQueueHelpers.map(quote).join(',') + ')'
      + " AND (actual.pronargs<>5 OR actual.proargnames IS DISTINCT FROM ARRAY['q','b','e','remaining','deadline']::text[]\n"
      + "         OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a WHERE a.grantee<>actual.proowner)))")
  delta = token(delta, 'predecessor_gap_digest', 'predecessor_status_digest', 1)
  delta = token(delta, 'official_v3_guard_private.gap_recovery_baseline_v1', 'official_v3_guard_private.status_baseline_v1', 1)
  delta = token(delta, 'GAP_PROVIDER_SHA256', sha256(productionStatus), 1)
  delta = token(delta, '/* APPROVED_FUNCTIONS */', quote(JSON.stringify([...successors, ...queueHelpers, ...functionsIn(policy)].map(functionMetadata))) + '::jsonb', 1)
  const jobs = read('scripts/db/' + foundation.HM04 + '/install-candidate.sql')
  const queries = [...getFunction(jobs, 'official_v3_jobs_private.assert_catalog_v1()').body.matchAll(/SELECT q\.value INTO actual_value FROM \(\n([\s\S]*?)\n\s*\) q;\n\s*SELECT fingerprint INTO bound_value FROM official_v3_jobs_private\.catalog_binding_v1 WHERE object_identity='([^']+)'/g)]
  assert.equal(queries.length, 15)
  const captureJobs = "result_value:='{}'::jsonb;\n" + queries.map(m => 'SELECT q.value INTO current_value FROM (\n' + m[1] + '\n) q;\nresult_value:=result_value||jsonb_build_object(' + quote(m[2]) + ',current_value);').join('\n')
    + "\nSELECT fingerprint INTO current_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='package-context';\nresult_value:=result_value||jsonb_build_object('package-context',current_value);"
  delta = token(delta, '/* CAPTURE_JOBS */', captureJobs, 1)
  const hrs = read('scripts/db/' + foundation.HRS1 + '/install-candidate.sql')
  const hrsQuery = getFunction(hrs, 'official_v3_result_private.catalog_v1()').body.trim().replace(/^BEGIN\s+RETURN\s*\(/, '').replace(/\);\s*END\s*$/, '')
  delta = token(delta, '/* CAPTURE_HRS */', hrsQuery, 1)
  const output = [prefix, constraints,
    ...customerOwners.map(owner => 'GRANT ' + owner + ' TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;'),
    policy, definitions, queueHelpersSql, read(quota + 'constraints.sql'),
    ...customerOwners.map(owner => 'REVOKE ' + owner + ' FROM postgres GRANTED BY postgres;'), delta, read(own + 'parts/rolling-postcheck.sql')].join('\n\n')
    .replaceAll('ROLLING_JOB_KEY', PRODUCTION.subject)
  assertTransactionBody(output)
  assert.equal(functionsIn(output).length, 21)
  assert.ok(!/(?:FROM |JOIN |CREATE TABLE )official_v3_guard_private\.(?:recovery_baseline_v1|gap_recovery_baseline_v1|retired_later_attempts_v1)|dev:yfvbx/.test(output), 'no Dev repair chain in fresh Production quota')
  return output
}
export function compileProductionArtifacts() {
  const pins = verifySourcePins()
  assert.equal(pins.filter(pin => pin.path === customerDefinitionsPath).length, 1,
    'fresh Production customer definitions require their own exact source pin')
  assert.equal(pins.filter(pin => pin.path === historyDefinitionPath).length, 1,
    'fresh Production history definition requires its own exact source pin')
  assert.equal(pins.filter(pin => pin.path === historyGuardDefinitionPath).length, 1,
    'fresh Production journal-membership definition requires its own exact source pin')
  assert.equal(pins.filter(pin => pin.path === atomicClaimDefinitionPath).length, 1,
    'fresh Production atomic claim requires its own exact source pin')
  const bindingText = readFileSync(new URL('binding.json', here), 'utf8').trim()
  const binding = JSON.parse(bindingText)
  assert.equal(binding.methodId, 'jetnity-destination-primary-ch-de-visa')
  assert.equal(binding.methodDigest, '44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3')
  assert.equal(binding.packageDigest, '0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9')
  const components = Object.fromEntries(Object.entries(foundation).map(([label, path]) => [label,
    label === 'HMT1_PRODUCTION' ? compileHmt() : body(read('scripts/db/' + path + '/install-candidate.sql'))]))
  components.TRANSPORT_LOGINS = LOGINS.filter(([, role]) => role).map(([login]) =>
    'CREATE ROLE ' + login + ' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION CONNECTION LIMIT 2;\nGRANT CONNECT ON DATABASE postgres TO ' + login + ';').join('\n')
  components.TRANSPORT_SET_EDGES = LOGINS.filter(([, role]) => role).map(([login, role]) =>
    'GRANT ' + role + ' TO ' + login + ' WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;').join('\n')
  components.BG1_PRODUCTION = compileBg()
  components.BG1_STATUS_PRODUCTION = compileStatus(components.BG1_PRODUCTION)
  components.ROLLING_FRESH_PRODUCTION = compileRolling(components.BG1_PRODUCTION, components.BG1_STATUS_PRODUCTION, binding)
  const preflight = read(own + 'parts/preflight.sql')
  const schedulerFunctions = [...functionsIn(read(schedule + 'core.sql')), ...functionsIn(read(schedule + 'monitoring.sql'))]
  assert.deepEqual(schedulerFunctions.map(f => f.name), ['jetnity_prod_import_scheduler.preserve_request_v1',
    'jetnity_prod_import_scheduler.tick_v1', 'public.jetnity_production_import_status_v1'])
  const schedulerPreflight = token(read(own + 'parts/scheduler-preflight.sql'), '/* SCHEDULER_FUNCTIONS */',
    quote(JSON.stringify(schedulerFunctions.map(f => ({ ...functionMetadata(f),
      grantees: f.name.startsWith('public.') ? ['anon', 'postgres'] : ['postgres'] })))) + '::jsonb', 1)
  const targetSetup = `SET LOCAL jetnity.hmt1_target=${quote(PRODUCTION.hmt)};\nSET LOCAL jetnity.hrs1_install_context='root_selected_complete_binding_v1';\nSET LOCAL jetnity.hrs1_binding=${quote(bindingText)};\nSET LOCAL jetnity.bg1_target=${quote(PRODUCTION.bg)};\nSET LOCAL jetnity.bg1_status_target=${quote(PRODUCTION.status)};\nSET LOCAL jetnity.rolling_quota_target=${quote(PRODUCTION.quota)};`
  const source = '-- GENERATED Production install. Requires explicit PO approval and independently selected fixed project.\n'
    + 'BEGIN ISOLATION LEVEL READ COMMITTED;\n' + preflight + '\n-- PRODUCTION_SCHEDULER_PREFLIGHT\n'
    + schedulerPreflight + '\n' + read(own + 'parts/preserve-before.sql') + '\n' + targetSetup + '\n'
    + INSTALL_ORDER.map(label => '\n-- PRODUCTION_STAGE ' + label + '\n' + components[label]).join('\n')
    + '\n' + read(own + 'parts/preserve-after.sql') + '\n' + read(own + 'parts/verify-installed.sql') + '\nCOMMIT;\n'
  const installAndGuard = once(source, '\nCOMMIT;\n', '\n-- PRODUCTION_STAGE FIRST_REAL_BACKGROUND_AUDIT\n'
    + body(read(packagePath + 'activate-background-guard.sql'))
    + "\nSELECT jsonb_build_object('schema',1,'target','qscbgcdmivbbnzrcyegn','core','installed',"
    + "'guardStatus',public.official_v3_guard_alarm_status_v1(),'sourceImport','not_started',"
    + "'ownerApproval','not_created','importPlan','disabled') AS production_execution_readback;\nCOMMIT;\n")
  const artifacts = new Map([[own + 'install.sql', source], [own + 'install-and-start-guard.sql', installAndGuard],
    [own + 'hmt-production.sql', components.HMT1_PRODUCTION],
    [own + 'bg-production.sql', components.BG1_PRODUCTION], [own + 'status-production.sql', components.BG1_STATUS_PRODUCTION],
    [own + 'rolling-production.sql', components.ROLLING_FRESH_PRODUCTION],
    ['scripts/official-truth-product-v3-production/preflight.sql', 'BEGIN;\nSET TRANSACTION READ ONLY;\n' + preflight + '\n' + read(own + 'parts/provider-preflight.sql') + '\nROLLBACK;\n'],
    ['scripts/official-truth-product-v3-production/verify.sql', 'BEGIN;\nSET TRANSACTION READ ONLY;\n' + read(own + 'parts/verify-installed.sql') + '\nROLLBACK;\n']])
  const manifest = { schema: 1, status: 'UNAPPLIED', target: PRODUCTION, installOrder: INSTALL_ORDER,
    customerInformation: { contextRevision: 3, retentionRevision: 3, definitions: customerDefinitionsPath,
      definitionsSha256: sha256(read(customerDefinitionsPath)), replacedFunctions: customerFunctions,
      baseline: 'fresh rolling baseline before the first genuine audit', publicationAuthority: 'unchanged' },
    historyValidation: { definition: historyDefinitionPath, definitionSha256: sha256(read(historyDefinitionPath)),
      function: 'official_v3_jobs_private.assert_history_v1(text)',
      scope: 'complete original job checks with bounded exact-byte reuse and fixed-key success checks; every historical row remains validated',
      jobMemo: { entries: 8, keyBytes: 1048576 }, subjectMemoBytes: 1048576,
      canonicalAndNodeMemoBytes: { total: 65536, recentCanonical: 32768, canonicalSubtrees: 16384, nodeCounts: 16384 },
      apiDeadlineMs: 5000, quotas: 'unchanged' },
    journalMembership: { definition: historyGuardDefinitionPath, definitionSha256: sha256(read(historyGuardDefinitionPath)),
      function: historyGuardSignature, scope: 'one successful exact-byte witness per subject and invocation; all original rows and checks retained',
      memo: { entries: 1, keyBytes: 65536 }, authority: 'unchanged' },
    atomicQueue: { definition: atomicClaimDefinitionPath, definitionSha256: sha256(read(atomicClaimDefinitionPath)),
      replacements: atomicClaimReplacements, privateHelpers: atomicQueueHelpers, phase: 'authorized',
      operations: ['queue_claim', 'queue_mutate'], actions: ['enqueue', 'claim', 'complete', 'fail'],
      singleSubjectFullHistoryChecks: 3, apiDeadlineMs: 5000, mutationBudgetMs: 5000, authority: 'unchanged',
      fallbackAfterSelection: false, historicalAdapterProtocol: 'unchanged' },
    bindingSha256: sha256(bindingText), runtimeEnvironment: LOGINS.map(([login, role, key]) => ({ key, login, role })),
    sources: pins, compilerInputs: compilerInputs.map(identity), operationalInputs: operationalInputs.map(identity),
    artifacts: [...artifacts].map(([path, value]) => ({ path, bytes: Buffer.byteLength(value), sha256: sha256(value) })),
    executionOrder: [packagePath + 'preflight.sql', schedule + 'provider-prerequisites.sql',
      { transaction: [schedule + 'core.sql', schedule + 'monitoring.sql'], state: 'disabled' },
      own + 'install-and-start-guard.sql', packagePath + 'configure-credentials.sql',
      packagePath + 'verify.sql', 'fixed-runtime-TLS-and-Owner-AAL2', 'normal-first-source-import-and-public-acceptance',
      schedule + 'activate.sql', 'automatic-cycle-and-independent-monitor-acceptance'],
    activation: { separate: true, source: 'scripts/db/official-truth-v3-production-import-schedule-1', ownerApproval: 'fresh Production AAL2',
      productionReads: 'UNAPPLIED', remoteCredentials: 'NOT_READ', research206: 'RESEARCH_ONLY' } }
  artifacts.set('scripts/official-truth-product-v3-production/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
  return artifacts
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--check', '--write'].includes(process.argv[2]), 'production_build_mode_required')
  for (const [path, output] of compileProductionArtifacts()) {
    if (process.argv[2] === '--write') writeFileSync(new URL(path, root), output)
    else assert.equal(read(path), output, 'Production artifact exactly matches pinned compiler: ' + path)
  }
}
