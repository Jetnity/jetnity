// Offline fixed-Dev compiler. Existing artifacts, OIDs, roles and RPCs remain.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { REPLACEMENTS, compileCycle4RecoveryMigration } from '../official-truth-v3-dev-cycle4-recovery-1/build.mjs'
import { assertTransactionBody, functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const here = new URL('./', import.meta.url)
const read = name => readFileSync(new URL(name, here), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
const json = value => quote(JSON.stringify(value)) + '::jsonb'
export const BASELINE = 'official_v3_guard_private.cycle4_attempt2_baseline_v1'
export const RETIREMENTS = 'official_v3_guard_private.retired_cycle4_attempt2_v1'
export const TARGET = 'dev:yfvbxvijcorffwxbxahl:CYCLE4-ATTEMPT2-RECOVERY1'
export const PREDECESSOR = 'e12dc341cc01de2a459826e8b1c6a3a9b4dd48b40dd8cd1c765660007b7694f3'
export { REPLACEMENTS } from '../official-truth-v3-dev-cycle4-recovery-1/build.mjs'
const owners = ['ot_v3_jobs_owner', 'ot_v3_result_owner']
const ownerOf = signature => signature.startsWith('official_v3_jobs_private.')
  || /\.(?:recovery_jobs|close_jobs|check_retired_jobs)_v1\(/.test(signature) ? owners[0]
  : /\.(?:recovery_hrs|check_retired_hrs)_v1\(/.test(signature) ? owners[1] : 'postgres'
function once(value, marker, replacement) {
  assert.equal(value.split(marker).length, 2, 'exact cycle4 source anchor: ' + marker.slice(0, 120))
  return value.replace(marker, () => replacement)
}
// Reuse the reviewed installer machinery without rewriting its applied bytes.
// The transformations only select the new fixed case and predecessor; all
// authority/catalog/row-preservation checks stay in the same original template.
function template(name) {
  const hashes = JSON.parse(read('template-hashes.json'))
  let value = read('../official-truth-v3-dev-cycle4-recovery-1/' + name)
  assert.equal(sha(value), hashes[name], 'immutable inherited installer template: ' + name)
  for (const [before, after] of [
    ['cycle4_recovery_baseline_v1', 'cycle4_attempt2_baseline_v1'],
    ['retired_cycle4_attempts_v1', 'retired_cycle4_attempt2_v1'],
    ['refresh_retirement_baseline_v1', 'cycle4_recovery_baseline_v1'],
    ['predecessor_refresh_digest', 'predecessor_cycle4_digest'],
    ['CYCLE4-RECOVERY1', 'CYCLE4-ATTEMPT2-RECOVERY1'],
    ['jetnity.cycle4_recovery_target', 'jetnity.cycle4_attempt2_recovery_target'],
    ['ch_de_cycle4_unknown', 'ch_de_cycle4_attempt2_unknown'],
    ['cycle4Scope', 'cycle4Attempt2Scope'], ['P7923', 'P7924'],
  ]) value = value.replaceAll(before, after)
  if (name === 'parts.sql') {
    value = once(value, 's.start_count=11 AND s.operation_count=45', 's.start_count=12 AND s.operation_count=46')
    value = once(value, "OR (SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication')<>6",
      "OR (SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication')<>6\n"
      + '      OR (SELECT count(*) FROM official_v3_result_private.originals_v1)<>26\n'
      + '      OR (SELECT count(*) FROM official_v3_result_private.qualifications_v1)<>14')
  }
  if (name === 'parts.sql' || name === 'preflight.sql') value = once(value,
    '(SELECT count(*) FROM official_v3_guard_private.retired_refresh_attempts_v1)<>1',
    '(SELECT count(*) FROM official_v3_guard_private.retired_refresh_attempts_v1)<>1\n'
      + '      OR (SELECT count(*) FROM official_v3_guard_private.retired_cycle4_attempts_v1)<>1')
  return value
}
function metadata(f) {
  return { signature: f.signature, name: f.name, owner: ownerOf(f.signature), hash: sha(f.body),
    language: /LANGUAGE\s+(\w+)/i.exec(f.options)[1].toLowerCase(), definer: /SECURITY DEFINER/i.test(f.options),
    volatile: /\bIMMUTABLE\b/.test(f.options) ? 'i' : /\bSTABLE\b/.test(f.options) ? 's' : 'v',
    config: [...f.options.matchAll(/SET\s+(\w+)\s*=\s*('[^']*'|[^\s]+)/gi)].map(m =>
      ({ timezone: 'TimeZone', datestyle: 'DateStyle' }[m[1].toLowerCase()] ?? m[1]) + '='
      + (m[1] === 'search_path' && !m[2].startsWith("'") ? m[2].replaceAll(',', ', ') : m[2].replace(/^'|'$/g, ''))) }
}
function definition(f, body) {
  const sql = 'CREATE OR REPLACE FUNCTION ' + f.name + '(' + f.args + ') ' + f.options + 'AS $cycle4_body$' + body + '$cycle4_body$;'
  return ownerOf(f.signature) === 'postgres' ? sql : 'SET LOCAL ROLE ' + ownerOf(f.signature) + ';\n' + sql + '\nRESET ROLE;'
}
const hrsTables = [
  ['originals', 'version_id', null], ['extractions', 'version_id', null], ['qualifications', 'reference', 'valid_until'],
  ['decisions', 'reference', null], ['archive_pages', 'reference', null], ['versions', 'reference', 'committed_at'],
  ['projections', 'reference', 'published_at'], ['operations', null, 'recorded_at'], ['outbox', 'escalation_key', 'recorded_at'],
]
const row = (timestamp, alias = 'r') => timestamp
  ? '(to_jsonb(' + alias + ')||jsonb_build_object(' + quote(timestamp) + ',extract(epoch FROM ' + alias + '.' + timestamp + ')))'
  : 'to_jsonb(' + alias + ')'
const digest = value => "encode(sha256(convert_to(" + value + "::text,'UTF8')),'hex')"
// Hash the complete existing rows, including their complete before_state and
// real Owner receipt. This avoids recursively duplicating all older snapshots
// inside the bounded new snapshot; the original rows remain immutable.
const previousRetirements = 'jsonb_build_object(' + [
  ['first', 'retired_attempts_v1'], ['later', 'retired_later_attempts_v1'], ['refresh', 'retired_refresh_attempts_v1'],
  ['cycle4', 'retired_cycle4_attempts_v1'],
].map(([kind, table]) => quote(kind) + ",COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',"
  + digest(row('retired_at')) + ",'ownerOperationDigest'," + digest(row('recorded_at', 'prior_receipt'))
  + ') ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.' + table
  + " r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb)").join(',') + ')'

export function compileCycle4Attempt2RecoveryMigration() {
  const predecessor = read('../official-truth-v3-dev-cycle4-recovery-1/provider-migration-body.sql')
  assert.equal(compileCycle4RecoveryMigration().migration, predecessor, 'applied Cycle4 compiler remains immutable')
  const refresh = read('../official-truth-v3-dev-refresh-retirement-1/provider-migration-body.sql')
  assert.equal(sha(predecessor), PREDECESSOR, 'installed Cycle4 Attempt1 provider artifact is immutable')
  const customer = read('../official-truth-v3-customer-information-1/provider-migration-body.sql')
  assert.equal(sha(customer), 'cd886ead66b92ec48ee9c5c5a214f310bc6e6645e1fc15f88a78650fcb95b37f')
  const pins = JSON.parse(read('../official-truth-v3-customer-information-1/pins.json'))
  const files = Object.entries(pins.predecessors).map(([path, hash]) => {
    const sql = read('../official-truth-v3-customer-information-1/' + path)
    assert.equal(sha(sql), hash, 'installed predecessor immutable: ' + path)
    return sql
  })
  const current = new Map([...files, customer, refresh, predecessor].flatMap(functionsIn).map(f => [f.signature, f]))
  const old = signature => { const f = current.get(signature); assert.ok(f, signature); return f }
  const evidenceText = read('original-evidence.json'), evidence = JSON.parse(evidenceText)
  const originalCycle4 = JSON.parse(read('../official-truth-v3-dev-cycle4-recovery-1/original-evidence.json'))
  assert.equal(evidence.project, 'yfvbxvijcorffwxbxahl')
  assert.equal(evidence.start.attempt_key, 'execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99')
  assert.equal(evidence.subject.start_count, 12); assert.equal(evidence.subject.operation_count, 46)
  assert.equal(evidence.subject.current_job.attempt, 2)
  assert.deepEqual([evidence.counts.firstRetirements, evidence.counts.laterRetirements, evidence.counts.refreshRetirements,
    evidence.counts.cycle4Retirements, evidence.counts.versions, evidence.counts.publications], [1, 2, 1, 1, 6, 6])
  assert.deepEqual([evidence.cycle.id, evidence.cycle.state, evidence.cycle.last_status, evidence.cycle.phase_attempts,
    evidence.cycle.published, evidence.dispatches.length], [4, 'blocked', 'retry_budget_exhausted', 8, 0, 9])
  assert.ok(evidence.dispatches.every(d => d.processed_at !== null))
  assert.deepEqual([evidence.completions, evidence.executionResults, evidence.executionDispositions], [[], [], []])
  assert.equal(evidence.qualification.reference, 'hrs1-verification:v3:5846df774a2ae3d828d910f5ca339cad0f6170ed7e7e0fe9079f5e53bdcea7f6')
  assert.deepEqual(evidence.qualifications.filter(q => q.reference !== originalCycle4.qualification.reference), [evidence.qualification])
  assert.deepEqual(evidence.hrsHead, originalCycle4.hrsHead)
  assert.deepEqual([evidence.counts.originals, evidence.counts.qualifications],
    [originalCycle4.counts.originals + 2, originalCycle4.counts.qualifications + 1], 'two actual originals and one actual new qualification')
  const cycle3 = read('../official-truth-v3-dev-terminal-cycle3-review-1/review-cycle3.sql')
  assert.equal(sha(cycle3), '3ba60a5202c58c8653e2f7da3a20ca67a2223e83e02554f052fc05f099ead8ce')
  const scheduler = new Map([
    read('../official-truth-v3-dev-import-schedule-1/core.sql'),
    read('../official-truth-v3-dev-import-schedule-1/preview-renewal.sql'),
    read('../official-truth-v3-dev-terminal-cycle-review-1/review-cycle2.sql'), cycle3,
  ].flatMap(functionsIn).map(f => [f.signature, f]))
  const priorReviews = [2, 3].map(id => {
    const original = evidence['cycle' + id + 'Review']
    const binding = Object.fromEntries(Object.entries(original).filter(([key]) => key === 'cycle_id'
      || key === 'evidence_digest' || key === 'prior_cycle2_evidence_digest' || key.endsWith('_sha256')))
    return '(SELECT to_jsonb(r)-\'reviewed_at\'-\'reviewed_head\'-\'runtime_commit\'-\'ready_deployment\'-\'ci_run\'-\'ui_version\''
      + ' FROM jetnity_dev_import_scheduler.terminal_cycle' + id + '_review_v1 r) IS DISTINCT FROM ' + json(binding)
  }).join('\n    OR ')
  const schedulerCheck = `IF to_regclass('jetnity_dev_import_scheduler.terminal_cycle3_review_v1') IS NULL
    OR (SELECT to_jsonb(c) FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE id=4) IS DISTINCT FROM ${json(evidence.cycle)}
    OR (SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE cycle_id=4)
      IS DISTINCT FROM ${json(evidence.dispatches)}
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='active' OR state='blocked' AND id NOT IN(2,3,4))
    OR ${priorReviews}
    OR NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton AND NOT enabled)
    OR NOT EXISTS(SELECT 1 FROM cron.job WHERE jobid=5 AND jobname='jetnity-ch-de-dev-import-v1'
      AND schedule='* * * * *' AND command='SELECT jetnity_dev_import_scheduler.run_v1();'
      AND database='postgres' AND username='postgres' AND nodename='localhost' AND nodeport=5432 AND NOT active) THEN
    RAISE EXCEPTION 'cycle4 exact disabled drained original sender and immutable reviews required' USING ERRCODE='P7923';
  END IF;`
  const substitutions = {
    CYCLE4_ATTEMPT: evidence.start.attempt_key, CYCLE4_CLAIM: evidence.start.claim_operation_id,
    CYCLE4_RESERVED_AT: evidence.start.reserved_at, CYCLE4_INTAKE: evidence.intake.operation_id,
    CYCLE4_DELIVERY: evidence.intake.binding.deliveryId, CYCLE4_RUNNER: evidence.intake.binding.runnerId,
    CYCLE4_QUALIFICATION: evidence.qualification.reference, CYCLE4_DECISION: evidence.qualification.decisionRef,
    CYCLE4_PRIOR_VERSION: evidence.hrsHead.version_ref, CYCLE4_LEASE_EXPIRES: evidence.subject.current_job.lease.expiresAt,
    ORIGINAL_EVIDENCE_SHA256: sha(evidenceText), CYCLE4_PROVIDER_SHA256: PREDECESSOR,
    '/* EXACT_SUBJECT */': json(evidence.subject), '/* EXACT_CLAIM */': json(JSON.parse(evidence.start.claim_text)),
    '/* EXACT_HRS_HEAD */': json(evidence.hrsHead), '/* EXACT_ORIGINAL_IDS */': json(evidence.qualification.originalIds),
    '/* EXACT_HISTORY_POINTER */': json(evidence.qualification.historyPointer), '/* EXACT_INTAKE */': json(evidence.intake),
    '/* PREVIOUS_RETIREMENTS */': previousRetirements,
    '/* CYCLE4_SCHEDULER_CHECK */': schedulerCheck,
  }
  const substitute = text => Object.entries(substitutions).reduce((value, [key, replacement]) => value.replaceAll(key, replacement), text)
  const source = substitute(template('parts.sql'))
  const block = name => {
    const start = '-- ' + name + '_BEGIN\n', end = '-- ' + name + '_END'
    assert.equal(source.split(start).length, 2); assert.equal(source.split(end).length, 2)
    return source.slice(source.indexOf(start) + start.length, source.indexOf(end)).trimEnd()
  }
  const inventory = 'jsonb_build_object(' + hrsTables.map(([table, key, timestamp]) => quote(table)
    + ",COALESCE((SELECT jsonb_agg(jsonb_build_object('id'," + (key ? 'r.' + key : "jsonb_build_array(r.operation_kind,r.operation_id)")
    + ",'digest'," + digest(row(timestamp)) + ') ORDER BY ' + (key ? 'r.' + key + ' COLLATE "C"' : 'r.operation_kind COLLATE "C",r.operation_id COLLATE "C"')
    + ') FROM official_v3_result_private.' + table + "_v1 r),'[]'::jsonb)").join(',\n') + ')'
  const checks = hrsTables.map(([table, key, timestamp]) => `
    IF jsonb_typeof(evidence#>'{result,inventory,${table}}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh ${table} inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,${table}}') LOOP
      SELECT ${digest(row(timestamp))} INTO actual FROM official_v3_result_private.${table}_v1 r
        WHERE ${key ? 'r.' + key + "=entry->>'id'" : "r.operation_kind=entry#>>'{id,0}' AND r.operation_id=entry#>>'{id,1}'"};
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh ${table} changed' USING ERRCODE='P7906'; END IF;
    END LOOP;`).join('\n')
  const bodies = new Map()
  let f = old(REPLACEMENTS[0])
  bodies.set(f.signature, once(f.body, "  IF s.current_job->'attempt'='1'::jsonb THEN", block('CYCLE4_JOBS') + "\n  IF s.current_job->'attempt'='1'::jsonb THEN"))
  f = old(REPLACEMENTS[1])
  const oldHrsCase = '  IF h.version_ref=' + quote(evidence.hrsHead.version_ref) + ' THEN'
  bodies.set(f.signature, once(f.body, oldHrsCase,
    once(block('CYCLE4_HRS'), '/* CYCLE4_HRS_INVENTORY */', inventory) + '\n' + oldHrsCase))
  f = old(REPLACEMENTS[2])
  bodies.set(f.signature, once(f.body, "  IF j->>'cycle4Scope'='ch_de_cycle4_unknown' THEN",
    block('CYCLE4_SNAPSHOT') + "\n  IF j->>'cycle4Scope'='ch_de_cycle4_unknown' THEN"))
  f = old(REPLACEMENTS[3])
  let body = once(f.body, "  ELSE RAISE EXCEPTION 'bg1 fixed retirement kind required'", block('CYCLE4_CLOSE') + "\n  ELSE RAISE EXCEPTION 'bg1 fixed retirement kind required'")
  body = once(body, "IF evidence->>'kind' IN ('ch_de_later_unknown','ch_de_refresh_unknown','ch_de_cycle4_unknown') THEN PERFORM official_v3_guard_private.begin_jobs_v1(); END IF;",
    "IF evidence->>'kind' IN ('ch_de_later_unknown','ch_de_refresh_unknown','ch_de_cycle4_unknown','ch_de_cycle4_attempt2_unknown') THEN PERFORM official_v3_guard_private.begin_jobs_v1(); END IF;")
  bodies.set(f.signature, body)
  f = old(REPLACEMENTS[4]); bodies.set(f.signature, '\nBEGIN\n' + f.body.trim() + ';\n' + block('CYCLE4_CHECK_JOBS') + '\nEND ')
  f = old(REPLACEMENTS[5]); bodies.set(f.signature, '\nDECLARE entry jsonb; actual text;\nBEGIN\n' + f.body.trim()
    + ";\n  IF evidence->>'kind'='ch_de_cycle4_attempt2_unknown' THEN\n" + checks + '\n  END IF;\nEND ')
  for (const [signature, field, argument] of [[REPLACEMENTS[6], 'intake_operation_id', 'operation_value'], [REPLACEMENTS[7], 'attempt_key', 'attempt_value']])
    bodies.set(signature, old(signature).body.trimEnd() + '\n  OR EXISTS(SELECT 1 FROM ' + RETIREMENTS + ' WHERE ' + field + '=' + argument + ')\n')
  bodies.set(REPLACEMENTS[8], old(REPLACEMENTS[8]).body.trimEnd() + '\n' + block('CYCLE4_RETIRED_STATE') + '\n')
  f = old(REPLACEMENTS[9]); bodies.set(f.signature, '\nDECLARE retired record; op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb;\nBEGIN\n'
    + f.body.trim() + ';\n' + block('CYCLE4_CHECK_RETIREMENTS') + '\nEND ')
  f = old(REPLACEMENTS[10]); body = f.body
  body = once(body, "  IF snapshot->>'kind'='ch_de_cycle4_unknown' THEN\n", "  IF snapshot->>'kind'='ch_de_cycle4_attempt2_unknown' THEN\n    INSERT INTO " + RETIREMENTS
    + " VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',\n"
    + "      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);\n  ELSIF snapshot->>'kind'='ch_de_cycle4_unknown' THEN\n")
  bodies.set(f.signature, body)
  for (const signature of REPLACEMENTS.slice(11, 13)) bodies.set(signature,
    once(old(signature).body, 'official_v3_guard_private.cycle4_recovery_baseline_v1', BASELINE))
  f = old(REPLACEMENTS[13]); body = f.body
  body = once(body, 'cycle4 official_v3_guard_private.cycle4_recovery_baseline_v1%ROWTYPE;',
    'cycle4 official_v3_guard_private.cycle4_recovery_baseline_v1%ROWTYPE;\n  attempt2 ' + BASELINE + '%ROWTYPE;')
  body = once(body, 'BEGIN\n', 'BEGIN\n  SELECT * INTO STRICT attempt2 FROM ' + BASELINE + ' WHERE singleton;\n')
  body = once(body, 'OR cycle4.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()',
    "OR attempt2.predecessor_provider_digest<>'" + PREDECESSOR + "'\n    OR attempt2.original_evidence_digest<>'" + sha(evidenceText)
    + "'\n    OR attempt2.predecessor_catalog_digest IS DISTINCT FROM " + digest('cycle4.catalog')
    + "\n    OR attempt2.predecessor_cycle4_digest IS DISTINCT FROM " + digest("(to_jsonb(cycle4)||jsonb_build_object('proof_not_before',extract(epoch FROM cycle4.proof_not_before)))")
    + '\n    OR attempt2.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()')
  bodies.set(f.signature, body)
  for (const signature of REPLACEMENTS.slice(14, 16)) {
    body = once(old(signature).body, 'SELECT greatest(k.required_generation,', 'SELECT greatest(a.required_generation,k.required_generation,')
    body = once(body, 'greatest(k.proof_not_before,', 'greatest(a.proof_not_before,k.proof_not_before,')
    body = once(body, 'FROM official_v3_guard_private.cycle4_recovery_baseline_v1 k',
      'FROM ' + BASELINE + ' a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k')
    body = once(body, 'WHERE k.singleton AND f.singleton', 'WHERE a.singleton AND k.singleton AND f.singleton')
    bodies.set(signature, body)
  }
  f = old(REPLACEMENTS[16])
  const resume = block('CYCLE4_RESUME').replace(/^  IF NOT FOUND THEN\n/, '')
    .replace(/    RETURN jsonb_build_object\('reply',jsonb_build_object\('status','blocked'\),'authority',false\);\n  END IF;$/, '')
  const originalResume = "    IF q#>>'{body,purpose}'='resume' AND t.attempt_key='execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea' THEN"
  bodies.set(f.signature, once(f.body, originalResume, resume + originalResume))
  const definitions = REPLACEMENTS.map(signature => definition(old(signature), bodies.get(signature))).join('\n\n')
  const successors = functionsIn(definitions)
  assert.deepEqual(successors.map(f => f.signature), REPLACEMENTS)
  for (const next of successors) {
    const before = metadata(old(next.signature)), after = metadata(next)
    assert.notEqual(before.hash, after.hash)
    assert.deepEqual({ ...before, hash: null }, { ...after, hash: null }, 'same function authority and options')
    assert.equal(next.args, old(next.signature).args)
  }
  let preflight = template('preflight.sql')
  preflight = once(preflight, '/* PREDECESSOR_FUNCTIONS */', [...current.values(), ...scheduler.values()]
    .map(f => '(' + quote(f.signature) + ',' + quote(sha(f.body)) + ')').join(',\n    '))
  preflight = once(preflight, '/* STATUS_CATALOG_QUERY */', old('official_v3_guard_private.catalog_status_v1()').body.trim())
  const hm04 = functionsIn(read('../official-truth-v3-hosted-durable-jobs-1/install-candidate.sql'))
    .find(f => f.signature === 'official_v3_jobs_private.assert_catalog_v1()')
  const queries = [...hm04.body.matchAll(/SELECT q\.value INTO actual_value FROM \(\n([\s\S]*?)\n\s*\) q;\n\s*SELECT fingerprint INTO bound_value FROM official_v3_jobs_private\.catalog_binding_v1 WHERE object_identity='([^']+)'/g)]
  assert.equal(queries.length, 15)
  const captureJobs = "result_value:='{}'::jsonb;\n" + queries.map(m => 'SELECT q.value INTO current_value FROM (\n' + m[1]
    + '\n) q;\nresult_value:=result_value||jsonb_build_object(' + quote(m[2]) + ',current_value);').join('\n')
    + "\nSELECT fingerprint INTO current_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='package-context';\nresult_value:=result_value||jsonb_build_object('package-context',current_value);"
  const hrs = functionsIn(read('../official-truth-v3-hosted-result-store-1/install-candidate.sql')).find(f => f.signature === 'official_v3_result_private.catalog_v1()')
  const hrsQuery = hrs.body.trim().replace(/^BEGIN\s+RETURN\s*\(/, '').replace(/\);\s*END\s*$/, '').trim()
  let delta = once(template('delta.sql'), '/* APPROVED_FUNCTIONS */', json(successors.map(metadata)))
  delta = once(delta, '/* CAPTURE_JOBS */', captureJobs); delta = once(delta, '/* CAPTURE_HRS */', hrsQuery)
  const migration = substitute([
    '-- CYCLE4-ATTEMPT2-RECOVERY1: exact Dev unknown START; provider transaction required. Installer records no retirement.',
    'SET LOCAL jetnity.cycle4_attempt2_recovery_target=' + quote(TARGET) + ';',
    "SET LOCAL search_path=pg_catalog; SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='5s';",
    "SET LOCAL idle_in_transaction_session_timeout='30s'; SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO, YMD';",
    preflight,
    ...owners.map(owner => 'GRANT ' + owner + ' TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;'),
    'GRANT CREATE ON SCHEMA official_v3_guard_private TO ' + owners.join(',') + ';',
    template('baseline.sql'), definitions,
    'REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ' + owners.join(',') + ';',
    ...owners.map(owner => 'REVOKE ' + owner + ' FROM postgres GRANTED BY postgres;'),
    delta, template('postcheck.sql'),
  ].join('\n\n').trimEnd() + '\n')
  assertTransactionBody(migration)
  assert.equal(functionsIn(migration).length, REPLACEMENTS.length)
  assert.doesNotMatch(migration, /\/\* (?:EXACT_|CAPTURE_|PREDECESSOR_|APPROVED_|CYCLE4_)/)
  const functionInventory = successors.map(f => ({ signature: f.signature, before: sha(old(f.signature).body), after: sha(f.body) }))
  const readback = substitute(once(template('readback-template.sql'), '/* APPROVED_FUNCTIONS */', json(functionInventory)))
    .replaceAll('MIGRATION_SHA256', sha(migration))
  return { migration, readback, inventory: functionInventory, digest: sha(migration), evidenceDigest: sha(evidenceText) }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'cycle4_build_mode_required')
  const compiled = compileCycle4Attempt2RecoveryMigration()
  for (const [name, value] of [['provider-migration-body.sql', compiled.migration], ['readback.sql', compiled.readback]]) {
    if (process.argv[2] === '--write') writeFileSync(new URL(name, here), value)
    else assert.equal(read(name), value, 'exact cycle4 compiled artifact: ' + name)
  }
}
