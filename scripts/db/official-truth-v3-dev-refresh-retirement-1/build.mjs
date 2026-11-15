// Offline fixed-Dev compiler. Existing artifacts, OIDs, roles and RPCs remain.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertTransactionBody, functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const here = new URL('./', import.meta.url)
const read = name => readFileSync(new URL(name, here), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
const json = value => quote(JSON.stringify(value)) + '::jsonb'
export const BASELINE = 'official_v3_guard_private.refresh_retirement_baseline_v1'
export const RETIREMENTS = 'official_v3_guard_private.retired_refresh_attempts_v1'
export const TARGET = 'dev:yfvbxvijcorffwxbxahl:REFRESH-RETIREMENT1'
export const PREDECESSOR = 'cd886ead66b92ec48ee9c5c5a214f310bc6e6645e1fc15f88a78650fcb95b37f'
export const REPLACEMENTS = Object.freeze([
  'official_v3_guard_private.recovery_jobs_v1()',
  'official_v3_guard_private.recovery_hrs_v1()',
  'official_v3_guard_private.recovery_snapshot_v1()',
  'official_v3_guard_private.close_jobs_v1(text)',
  'official_v3_guard_private.check_retired_jobs_v1(jsonb)',
  'official_v3_guard_private.check_retired_hrs_v1(jsonb)',
  'official_v3_guard_private.intake_retired_v1(text)',
  'official_v3_guard_private.attempt_retired_v1(text)',
  'official_v3_guard_private.retired_state_v1(text)',
  'official_v3_guard_private.check_retirements_v1()',
  'public.official_v3_guard_retire_v1(text,text)',
  'official_v3_guard_private.jobs_catalog_v1()',
  'official_v3_guard_private.hrs_catalog_v1()',
  'official_v3_guard_private.assert_catalog_v1()',
  'official_v3_guard_private.require_open_v1()',
  'public.official_v3_guard_alarm_status_v1()',
  'official_v3_jobs_private.tx_execution_read_v1(jsonb,jsonb,integer,integer,timestamptz)',
])
const owners = ['ot_v3_jobs_owner', 'ot_v3_result_owner']
const ownerOf = signature => signature.startsWith('official_v3_jobs_private.')
  || /\.(?:recovery_jobs|close_jobs|check_retired_jobs)_v1\(/.test(signature) ? owners[0]
  : /\.(?:recovery_hrs|check_retired_hrs)_v1\(/.test(signature) ? owners[1] : 'postgres'
function once(value, marker, replacement) {
  assert.equal(value.split(marker).length, 2, 'exact refresh source anchor: ' + marker.slice(0, 120))
  return value.replace(marker, () => replacement)
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
  const sql = 'CREATE OR REPLACE FUNCTION ' + f.name + '(' + f.args + ') ' + f.options + 'AS $refresh_body$' + body + '$refresh_body$;'
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
const previousRetirements = "(SELECT jsonb_build_object('first',COALESCE((SELECT jsonb_agg("
  + row('retired_at') + " ORDER BY attempt_key) FROM official_v3_guard_private.retired_attempts_v1 r),'[]'::jsonb),"
  + "'later',COALESCE((SELECT jsonb_agg(" + row('retired_at')
  + " ORDER BY attempt_number) FROM official_v3_guard_private.retired_later_attempts_v1 r),'[]'::jsonb)))"

export function compileRefreshRetirementMigration() {
  const predecessor = read('../official-truth-v3-customer-information-1/provider-migration-body.sql')
  assert.equal(sha(predecessor), PREDECESSOR, 'installed customer provider artifact is immutable')
  const pins = JSON.parse(read('../official-truth-v3-customer-information-1/pins.json'))
  const files = Object.entries(pins.predecessors).map(([path, hash]) => {
    const sql = read('../official-truth-v3-customer-information-1/' + path)
    assert.equal(sha(sql), hash, 'installed predecessor immutable: ' + path)
    return sql
  })
  const current = new Map([...files, predecessor].flatMap(functionsIn).map(f => [f.signature, f]))
  const old = signature => { const f = current.get(signature); assert.ok(f, signature); return f }
  const evidenceText = read('original-evidence.json'), evidence = JSON.parse(evidenceText)
  assert.equal(evidence.project, 'yfvbxvijcorffwxbxahl')
  assert.equal(evidence.start.attempt_key, 'execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea')
  assert.equal(evidence.subject.start_count, 9); assert.equal(evidence.subject.operation_count, 41)
  assert.deepEqual([evidence.counts.firstRetirements, evidence.counts.laterRetirements, evidence.counts.versions, evidence.counts.publications], [1, 2, 5, 5])
  const substitutions = {
    REFRESH_ATTEMPT: evidence.start.attempt_key, REFRESH_CLAIM: evidence.start.claim_operation_id,
    REFRESH_RESERVED_AT: evidence.start.reserved_at, REFRESH_INTAKE: evidence.intake.operation_id,
    REFRESH_DELIVERY: evidence.intake.binding.deliveryId, REFRESH_RUNNER: evidence.intake.binding.runnerId,
    REFRESH_QUALIFICATION: evidence.qualification.reference, REFRESH_DECISION: evidence.qualification.decisionRef,
    ORIGINAL_EVIDENCE_SHA256: sha(evidenceText), CUSTOMER_PROVIDER_SHA256: PREDECESSOR,
    '/* EXACT_SUBJECT */': json(evidence.subject), '/* EXACT_CLAIM */': json(JSON.parse(evidence.start.claim_text)),
    '/* EXACT_HRS_HEAD */': json(evidence.hrsHead), '/* EXACT_ORIGINAL_IDS */': json(evidence.qualification.originalIds),
    '/* EXACT_HISTORY_POINTER */': json(evidence.qualification.historyPointer), '/* EXACT_INTAKE */': json(evidence.intake),
    '/* PREVIOUS_RETIREMENTS */': previousRetirements,
  }
  const substitute = text => Object.entries(substitutions).reduce((value, [key, replacement]) => value.replaceAll(key, replacement), text)
  const source = substitute(read('parts.sql'))
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
  bodies.set(f.signature, once(f.body, "  IF s.current_job->'attempt'='1'::jsonb THEN", block('REFRESH_JOBS') + "\n  IF s.current_job->'attempt'='1'::jsonb THEN"))
  f = old(REPLACEMENTS[1])
  bodies.set(f.signature, once(f.body, '  IF h.context_key<>', once(block('REFRESH_HRS'), '/* REFRESH_HRS_INVENTORY */', inventory) + '\n  IF h.context_key<>'))
  f = old(REPLACEMENTS[2])
  bodies.set(f.signature, once(f.body, '  n:=(j#>>\'{leasedJob,attempt}\')::integer;', block('REFRESH_SNAPSHOT') + '\n  n:=(j#>>\'{leasedJob,attempt}\')::integer;'))
  f = old(REPLACEMENTS[3])
  let body = once(f.body, "  ELSE RAISE EXCEPTION 'bg1 fixed retirement kind required'", block('REFRESH_CLOSE') + "\n  ELSE RAISE EXCEPTION 'bg1 fixed retirement kind required'")
  body = once(body, "IF evidence->>'kind'='ch_de_later_unknown' THEN PERFORM official_v3_guard_private.begin_jobs_v1(); END IF;",
    "IF evidence->>'kind' IN ('ch_de_later_unknown','ch_de_refresh_unknown') THEN PERFORM official_v3_guard_private.begin_jobs_v1(); END IF;")
  bodies.set(f.signature, body)
  f = old(REPLACEMENTS[4]); bodies.set(f.signature, '\nBEGIN\n' + f.body.trim() + ';\n' + block('REFRESH_CHECK_JOBS') + '\nEND ')
  f = old(REPLACEMENTS[5]); bodies.set(f.signature, '\nDECLARE entry jsonb; actual text;\nBEGIN\n' + f.body.trim()
    + ";\n  IF evidence->>'kind'='ch_de_refresh_unknown' THEN\n" + checks + '\n  END IF;\nEND ')
  for (const [signature, field, argument] of [[REPLACEMENTS[6], 'intake_operation_id', 'operation_value'], [REPLACEMENTS[7], 'attempt_key', 'attempt_value']])
    bodies.set(signature, old(signature).body.trimEnd() + '\n  OR EXISTS(SELECT 1 FROM ' + RETIREMENTS + ' WHERE ' + field + '=' + argument + ')\n')
  bodies.set(REPLACEMENTS[8], old(REPLACEMENTS[8]).body.trimEnd() + '\n' + block('REFRESH_RETIRED_STATE') + '\n')
  f = old(REPLACEMENTS[9]); bodies.set(f.signature, '\nDECLARE retired record; op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb;\nBEGIN\n'
    + f.body.trim() + ';\n' + block('REFRESH_CHECK_RETIREMENTS') + '\nEND ')
  f = old(REPLACEMENTS[10]); body = f.body
  body = once(body, 'IF n=1 AND EXISTS(', "IF n=1 AND snapshot->>'kind'<>'ch_de_refresh_unknown' AND EXISTS(")
  body = once(body, '  IF n=1 THEN\n', "  IF snapshot->>'kind'='ch_de_refresh_unknown' THEN\n    INSERT INTO " + RETIREMENTS
    + " VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',\n"
    + "      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);\n  ELSIF n=1 THEN\n")
  body = once(body, 'IF n>1 THEN PERFORM official_v3_guard_private.require_open_v1(); END IF;',
    "IF n>1 OR snapshot->>'kind'='ch_de_refresh_unknown' THEN PERFORM official_v3_guard_private.require_open_v1(); END IF;")
  bodies.set(f.signature, body)
  for (const signature of REPLACEMENTS.slice(11, 13)) bodies.set(signature,
    once(old(signature).body, 'official_v3_guard_private.customer_information_baseline_v1', BASELINE))
  f = old(REPLACEMENTS[13]); body = f.body
  body = once(body, 'customer official_v3_guard_private.customer_information_baseline_v1%ROWTYPE;',
    'customer official_v3_guard_private.customer_information_baseline_v1%ROWTYPE;\n  refresh ' + BASELINE + '%ROWTYPE;')
  body = once(body, 'BEGIN\n', 'BEGIN\n  SELECT * INTO STRICT refresh FROM ' + BASELINE + ' WHERE singleton;\n')
  body = once(body, 'OR customer.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()',
    "OR refresh.predecessor_provider_digest<>'" + PREDECESSOR + "'\n    OR refresh.original_evidence_digest<>'" + sha(evidenceText)
    + "'\n    OR refresh.predecessor_catalog_digest IS DISTINCT FROM " + digest('customer.catalog')
    + "\n    OR refresh.predecessor_customer_digest IS DISTINCT FROM " + digest("(to_jsonb(customer)||jsonb_build_object('proof_not_before',extract(epoch FROM customer.proof_not_before)))")
    + '\n    OR refresh.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()')
  bodies.set(f.signature, body)
  for (const signature of REPLACEMENTS.slice(14, 16)) {
    body = once(old(signature).body, 'SELECT greatest(c.required_generation,', 'SELECT greatest(f.required_generation,c.required_generation,')
    body = once(body, 'greatest(c.proof_not_before,', 'greatest(f.proof_not_before,c.proof_not_before,')
    body = once(body, 'FROM official_v3_guard_private.customer_information_baseline_v1 c',
      'FROM ' + BASELINE + ' f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c')
    body = once(body, 'WHERE c.singleton AND q.singleton', 'WHERE f.singleton AND c.singleton AND q.singleton')
    bodies.set(signature, body)
  }
  f = old(REPLACEMENTS[16])
  bodies.set(f.signature, once(f.body,
    "  IF NOT FOUND THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;",
    block('REFRESH_RESUME')))
  const definitions = REPLACEMENTS.map(signature => definition(old(signature), bodies.get(signature))).join('\n\n')
  const successors = functionsIn(definitions)
  assert.deepEqual(successors.map(f => f.signature), REPLACEMENTS)
  for (const next of successors) {
    const before = metadata(old(next.signature)), after = metadata(next)
    assert.notEqual(before.hash, after.hash)
    assert.deepEqual({ ...before, hash: null }, { ...after, hash: null }, 'same function authority and options')
    assert.equal(next.args, old(next.signature).args)
  }
  let preflight = read('preflight.sql')
  preflight = once(preflight, '/* PREDECESSOR_FUNCTIONS */', [...current.values()].map(f => '(' + quote(f.signature) + ',' + quote(sha(f.body)) + ')').join(',\n    '))
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
  let delta = once(read('delta.sql'), '/* APPROVED_FUNCTIONS */', json(successors.map(metadata)))
  delta = once(delta, '/* CAPTURE_JOBS */', captureJobs); delta = once(delta, '/* CAPTURE_HRS */', hrsQuery)
  const migration = substitute([
    '-- REFRESH-RETIREMENT1: exact Dev unknown START; provider transaction required. Installer records no retirement.',
    'SET LOCAL jetnity.refresh_retirement_target=' + quote(TARGET) + ';',
    "SET LOCAL search_path=pg_catalog; SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='5s';",
    "SET LOCAL idle_in_transaction_session_timeout='30s'; SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO, YMD';",
    preflight,
    ...owners.map(owner => 'GRANT ' + owner + ' TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;'),
    'GRANT CREATE ON SCHEMA official_v3_guard_private TO ' + owners.join(',') + ';',
    read('baseline.sql'), definitions,
    'REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ' + owners.join(',') + ';',
    ...owners.map(owner => 'REVOKE ' + owner + ' FROM postgres GRANTED BY postgres;'),
    delta, read('postcheck.sql'),
  ].join('\n\n').trimEnd() + '\n')
  assertTransactionBody(migration)
  assert.equal(functionsIn(migration).length, REPLACEMENTS.length)
  assert.doesNotMatch(migration, /\/\* (?:EXACT_|CAPTURE_|PREDECESSOR_|APPROVED_|REFRESH_)/)
  const functionInventory = successors.map(f => ({ signature: f.signature, before: sha(old(f.signature).body), after: sha(f.body) }))
  const readback = substitute(once(read('readback-template.sql'), '/* APPROVED_FUNCTIONS */', json(functionInventory)))
    .replaceAll('MIGRATION_SHA256', sha(migration))
  return { migration, readback, inventory: functionInventory, digest: sha(migration), evidenceDigest: sha(evidenceText) }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'refresh_build_mode_required')
  const compiled = compileRefreshRetirementMigration()
  for (const [name, value] of [['provider-migration-body.sql', compiled.migration], ['readback.sql', compiled.readback]]) {
    if (process.argv[2] === '--write') writeFileSync(new URL(name, here), value)
    else assert.equal(read(name), value, 'exact refresh compiled artifact: ' + name)
  }
}
