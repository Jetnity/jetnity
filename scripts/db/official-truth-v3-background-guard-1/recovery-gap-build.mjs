// RECOVERY3: one actually skipped Claim3 followed by the real unknown Start4.
// Deterministic provider artifact only. This module never connects to a database.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertTransactionBody, functionsIn } from './build.mjs'

const here = new URL('./', import.meta.url)
const sha = value => createHash('sha256').update(value).digest('hex')
const read = name => readFileSync(new URL(name, here), 'utf8')
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
function once(value, marker, replacement) {
  assert.equal(value.split(marker).length, 2, 'one gap recovery source anchor: ' + marker.slice(0, 100))
  return value.replace(marker, () => replacement)
}
export const GAP_RECOVERY_PREDECESSORS = Object.freeze({
  bg1: 'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950',
  status: '71e2f9f080b8af0b7100d49b70520f8c34dffdc1bc84f3912b20aff413adf97c',
  recovery2: 'b7cc8c0d061bef261a0d9ab3824672b7759502ab0d26c68139e5cfcf6525eaf7',
  recovery2Builder: 'aedf7e4d49ce21a517ce0e5a7a72f058f412e014479a6ad8821eaaec73d5ded4',
  recovery2Part: '67d20d1a6f8fecb72236617c9ffe42e309296f161a3f68425923b93f607ab92f',
})
export const GAP_RECOVERY_REPLACEMENTS = Object.freeze([
  'official_v3_guard_private.recovery_jobs_v1()',
  'official_v3_guard_private.check_retired_jobs_v1(jsonb)',
  'official_v3_guard_private.recovery_intake_v1(jsonb)',
  'official_v3_guard_private.check_retired_s1_v1(jsonb)',
  'official_v3_guard_private.check_retirements_v1()',
  'official_v3_guard_private.intake_retired_v1(text)',
  'official_v3_guard_private.assert_catalog_v1()',
  'official_v3_guard_private.require_open_v1()',
  'public.official_v3_guard_alarm_status_v1()',
])
const ownerOf = signature => /\.(?:recovery_jobs|check_retired_jobs)_v1\(/.test(signature) ? 'ot_v3_jobs_owner'
  : /\.(?:recovery_intake|check_retired_s1)_v1\(/.test(signature) ? 'ot_v3_intake_owner' : 'postgres'
function options(f) {
  return { signature: f.signature, name: f.name, owner: ownerOf(f.signature), hash: sha(f.body),
    language: /LANGUAGE\s+(\w+)/i.exec(f.options)[1].toLowerCase(), definer: /SECURITY DEFINER/i.test(f.options),
    volatile: /\bIMMUTABLE\b/.test(f.options) ? 'i' : /\bSTABLE\b/.test(f.options) ? 's' : 'v',
    config: [...f.options.matchAll(/SET\s+(\w+)\s*=\s*('[^']*'|[^\s]+)/gi)].map(m =>
      ({ timezone: 'TimeZone', datestyle: 'DateStyle' }[m[1].toLowerCase()] ?? m[1]) + '=' + m[2].replace(/^'|'$/g, '')) }
}
function definition(f, body) {
  const sql = 'CREATE OR REPLACE FUNCTION ' + f.name + '(' + f.args + ') ' + f.options + 'AS $gap3_body$' + body + '$gap3_body$;'
  return ownerOf(f.signature) === 'postgres' ? sql : 'SET LOCAL ROLE ' + ownerOf(f.signature) + ';\n' + sql + '\nRESET ROLE;'
}

export function compileGapRecoveryMigrationBody() {
  const bg1 = read('provider-migration-body.sql'), status = read('status-rpc-provider-migration-body.sql')
  const recovery2 = read('recovery-provider-migration-body.sql'), oldPart = read('parts/recovery.sql')
  for (const [value, expected] of [[bg1, GAP_RECOVERY_PREDECESSORS.bg1], [status, GAP_RECOVERY_PREDECESSORS.status],
    [recovery2, GAP_RECOVERY_PREDECESSORS.recovery2], [oldPart, GAP_RECOVERY_PREDECESSORS.recovery2Part],
    [read('recovery-build.mjs'), GAP_RECOVERY_PREDECESSORS.recovery2Builder]]) {
    assert.equal(sha(value), expected, 'all installed Recovery2 artifacts remain immutable')
  }
  const current = new Map([...functionsIn(bg1), ...functionsIn(status), ...functionsIn(recovery2)].map(f => [f.signature, f]))
  const old = signature => { const f = current.get(signature); assert.ok(f, signature); return f }
  let template = read('parts/recovery-gap.sql')
  function block(name) {
    const start = '-- ' + name + '_BEGIN\n', end = '-- ' + name + '_END'
    assert.equal(template.split(start).length, 2); assert.equal(template.split(end).length, 2)
    return template.slice(template.indexOf(start) + start.length, template.indexOf(end)).trimEnd()
  }
  const gapJobs = block('GAP_JOBS'), gapS1 = block('GAP_S1')
  template = template.slice(0, template.indexOf('-- The generator embeds')).trimEnd() + '\n'

  const contexts = [...recovery2.matchAll(/DO \$context\$[\s\S]*?END \$context\$;/g)]
  assert.equal(contexts.length, 1)
  const context = once(contexts[0][0], "current_setting('jetnity.bg1_recovery_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1-RECOVERY2'",
    "current_setting('jetnity.bg1_gap_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1-RECOVERY3'")
  const quiescenceStart = context.indexOf('IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (')
  const quiescenceEnd = context.indexOf(' THEN\n    RAISE EXCEPTION', quiescenceStart)
  assert.ok(quiescenceStart > 0 && quiescenceEnd > quiescenceStart)

  const prefixStart = oldPart.indexOf('CREATE TEMP TABLE bg1_recovery_before')
  const prefixEnd = oldPart.indexOf('-- PO-authorized, transaction-local elevation')
  assert.ok(prefixStart > 0 && prefixEnd > prefixStart)
  let preflight = oldPart.slice(prefixStart, prefixEnd)
  preflight = once(preflight, "IF to_regclass('official_v3_guard_private.recovery_baseline_v1') IS NOT NULL\n    OR to_regclass('official_v3_guard_private.retired_later_attempts_v1') IS NOT NULL\n    OR to_regprocedure('official_v3_guard_private.recovery_canonical_v1(jsonb,integer)') IS NOT NULL THEN",
    "IF to_regclass('official_v3_guard_private.gap_recovery_baseline_v1') IS NOT NULL THEN")
  preflight = once(preflight, 'SELECT catalog FROM official_v3_guard_private.status_baseline_v1 WHERE singleton',
    'SELECT catalog FROM official_v3_guard_private.recovery_baseline_v1 WHERE singleton')
  preflight = once(preflight, "ARRAY['ot_v3_jobs_owner','ot_v3_result_owner']", "ARRAY['ot_v3_jobs_owner','ot_v3_intake_owner']")
  preflight = once(preflight, "'official_v3_guard_private.owner_operations_v1','official_v3_guard_private.retired_attempts_v1','official_v3_guard_private.status_baseline_v1'",
    "'official_v3_guard_private.owner_operations_v1','official_v3_guard_private.retired_attempts_v1','official_v3_guard_private.status_baseline_v1',\n    'official_v3_guard_private.recovery_baseline_v1','official_v3_guard_private.retired_later_attempts_v1'")
  preflight = once(preflight, '/* PREDECESSOR_FUNCTIONS */', [...current.values()].map(f => '(' + quote(f.signature) + ',' + quote(sha(f.body)) + ')').join(',\n    '))
  preflight = once(preflight, '/* STATUS_CATALOG_QUERY */', old('official_v3_guard_private.catalog_status_v1()').body.trim())
  preflight = preflight.replaceAll('bg1_recovery_before', 'bg1_gap_before').replaceAll('$recovery_predecessor$', '$gap_predecessor$')

  const bodies = new Map()
  let f = old(GAP_RECOVERY_REPLACEMENTS[0]), body = f.body
  body = once(body, 'n integer; expected integer:=1; fence jsonb; seed text; input_revision text;',
    'n integer; expected integer:=1; fence jsonb; seed text; input_revision text; candidate jsonb;')
  body = once(body, 'OR s.start_count<>n OR s.current_job', 'OR (s.start_count<>n AND NOT(n=4 AND s.start_count=3)) OR s.current_job')
  body = once(body, "IF expected<>n THEN RAISE EXCEPTION 'bg1 complete preceding retirement chain required'",
    "IF expected<>n AND NOT(n=4 AND s.start_count=3 AND expected=3) THEN RAISE EXCEPTION 'bg1 complete preceding retirement chain required'")
  const returnMarker = "  RETURN jsonb_build_object('attemptKey',t.attempt_key,'jobKey',t.job_key,'claimOperationId',t.claim_operation_id,"
  const lastReturn = body.lastIndexOf(returnMarker)
  assert.ok(lastReturn > body.indexOf(returnMarker), 'only the outer later-attempt return changes')
  body = body.slice(0, lastReturn) + body.slice(lastReturn).replace(returnMarker, returnMarker.replace('RETURN ', 'candidate:='))
  body = once(body, "'inputRevision',input_revision,'startCount',s.start_count,'operationCount',s.operation_count,'preceding',preceding);\nEND",
    "'inputRevision',input_revision,'startCount',s.start_count,'operationCount',s.operation_count,'preceding',preceding);\n  IF n=4 AND s.start_count=3 THEN\n" + gapJobs + '\n  END IF;\n  RETURN candidate;\nEND')
  bodies.set(f.signature, body)

  f = old(GAP_RECOVERY_REPLACEMENTS[1])
  bodies.set(f.signature, '\nDECLARE candidate jsonb:=evidence->\'job\';\nBEGIN\n' + f.body.trim() + ';\n'
    + "  IF candidate ? 'skippedClaims' THEN\n" + gapJobs + '\n  END IF;\nEND ')
  f = old(GAP_RECOVERY_REPLACEMENTS[2])
  bodies.set(f.signature, '\nDECLARE gap_job jsonb:=job_value;\nBEGIN\n' + gapS1 + '\n' + f.body.trim() + ';\nEND ')
  f = old(GAP_RECOVERY_REPLACEMENTS[3])
  bodies.set(f.signature, '\nDECLARE gap_job jsonb:=evidence->\'job\';\nBEGIN\n' + f.body.trim() + ';\n' + gapS1 + '\nEND ')

  f = old(GAP_RECOVERY_REPLACEMENTS[4]); body = f.body
  body = once(body, 'expected integer; current_number integer:=2;', 'expected integer; current_number integer:=2; gap_case boolean;')
  body = once(body, "j:=retired.before_state->'job';", "j:=retired.before_state->'job';\n    gap_case:=retired.attempt_number=4 AND j ? 'skippedClaims';")
  body = once(body, 'IF retired.attempt_number<>current_number OR retired.attempt_number NOT BETWEEN 2 AND 4',
    'IF (retired.attempt_number<>current_number AND NOT(gap_case AND current_number=3)) OR retired.attempt_number NOT BETWEEN 2 AND 4')
  body = once(body, "j->>'startCount' IS DISTINCT FROM retired.attempt_number::text", "j->>'startCount' IS DISTINCT FROM (CASE WHEN gap_case THEN 3 ELSE retired.attempt_number END)::text")
  body = once(body, "jsonb_array_length(j->'preceding') IS DISTINCT FROM retired.attempt_number-1",
    "jsonb_array_length(j->'preceding') IS DISTINCT FROM (CASE WHEN gap_case THEN 2 ELSE retired.attempt_number-1 END)")
  body = once(body, 'current_number:=current_number+1;', 'current_number:=retired.attempt_number+1;')
  bodies.set(f.signature, body)

  f = old(GAP_RECOVERY_REPLACEMENTS[5])
  bodies.set(f.signature, f.body.trimEnd() + "\n  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1\n    WHERE attempt_number=4 AND before_state#>>'{job,skippedClaims,0,kind}'='claim_without_execution_start'\n      AND before_state#>'{job,skippedClaims,0,attempt}'='3'::jsonb\n      AND before_state#>>'{job,skippedClaims,0,intakeOperationId}'=operation_value)\n")

  f = old(GAP_RECOVERY_REPLACEMENTS[6]); body = f.body
  body = once(body, 'predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;',
    'predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;\n  gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;')
  body = once(body, 'BEGIN\n', 'BEGIN\n  SELECT * INTO STRICT gap_baseline FROM official_v3_guard_private.gap_recovery_baseline_v1 WHERE singleton;\n')
  body = once(body, 'OR successor.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()',
    "OR gap_baseline.recovery2_provider_digest<>'RECOVERY2_PROVIDER_SHA256'\n    OR gap_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(successor.catalog::text,'UTF8')),'hex')\n    OR gap_baseline.predecessor_recovery_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(successor)||jsonb_build_object('proof_not_before',extract(epoch FROM successor.proof_not_before)))::text,'UTF8')),'hex')\n    OR gap_baseline.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()")
  bodies.set(f.signature, body)

  const oldProof = 'SELECT greatest(r.required_generation,b.required_generation),greatest(r.proof_not_before,b.proof_not_before)\n    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.recovery_baseline_v1 r\n      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE r.singleton AND b.singleton;'
  const newProof = 'SELECT greatest(g.required_generation,r.required_generation,b.required_generation),greatest(g.proof_not_before,r.proof_not_before,b.proof_not_before)\n    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.gap_recovery_baseline_v1 g\n      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r\n      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE g.singleton AND r.singleton AND b.singleton;'
  for (const signature of GAP_RECOVERY_REPLACEMENTS.slice(7)) bodies.set(signature, once(old(signature).body, oldProof, newProof))
  const definitions = GAP_RECOVERY_REPLACEMENTS.map(signature => definition(old(signature), bodies.get(signature)))
    .join('\n\n').replaceAll('RECOVERY2_PROVIDER_SHA256', GAP_RECOVERY_PREDECESSORS.recovery2)

  let suffix = oldPart.slice(oldPart.indexOf('CREATE TEMP TABLE bg1_recovery_objects'))
  const helperStart = suffix.indexOf("    IF before_catalog ? ('function:'||actual.oid) THEN")
  const helperEnd = suffix.indexOf('  END LOOP;\n  IF cardinality(replacement_ids)', helperStart)
  assert.ok(helperStart > 0 && helperEnd > helperStart)
  suffix = suffix.slice(0, helperStart) + "    IF NOT before_catalog ? ('function:'||actual.oid) THEN\n      RAISE EXCEPTION 'bg1 gap recovery forbids new functions' USING ERRCODE='P7901'; END IF;\n    replacement_ids:=array_append(replacement_ids,actual.oid);\n" + suffix.slice(helperEnd)
  suffix = once(suffix, 'cardinality(replacement_ids)<>14', 'cardinality(replacement_ids)<>9')
  const tableStart = suffix.indexOf("  FOREACH table_name IN ARRAY ARRAY['retired_later_attempts_v1','recovery_baseline_v1'] LOOP")
  const tableEnd = suffix.indexOf('    IF relation_id IS NULL', tableStart)
  assert.ok(tableStart > 0 && tableEnd > tableStart)
  suffix = suffix.slice(0, tableStart) + "  FOREACH table_name IN ARRAY ARRAY['gap_recovery_baseline_v1'] LOOP\n    relation_id:=to_regclass('official_v3_guard_private.'||table_name);\n    expected_columns:='[[\"singleton\",\"boolean\",true,false],[\"recovery2_provider_digest\",\"text\",true,false],[\"predecessor_catalog_digest\",\"text\",true,false],[\"predecessor_recovery_digest\",\"text\",true,false],[\"required_generation\",\"bigint\",true,false],[\"proof_not_before\",\"timestamp with time zone\",true,false],[\"catalog\",\"jsonb\",true,false]]'::jsonb;\n" + suffix.slice(tableEnd)
  suffix = once(suffix, "\n        OR t.tgisinternal AND t.tgrelid='official_v3_guard_private.owner_operations_v1'::regclass\n          AND t.tgconstrrelid=relation_id AND t.tgconstraint IN (SELECT c.oid FROM pg_constraint c\n          WHERE c.conrelid=relation_id AND c.contype='f' AND c.confrelid='official_v3_guard_private.owner_operations_v1'::regclass\n            AND c.conkey=ARRAY[6]::smallint[] AND c.confkey=ARRAY[1]::smallint[])", '')
  const insertStart = suffix.indexOf('  INSERT INTO official_v3_guard_private.recovery_baseline_v1\n')
  const insertEnd = suffix.indexOf('\nEND $recovery_delta$;', insertStart)
  assert.ok(insertStart > 0 && insertEnd > insertStart)
  suffix = suffix.slice(0, insertStart) + "  INSERT INTO official_v3_guard_private.gap_recovery_baseline_v1\n  SELECT true,'RECOVERY2_PROVIDER_SHA256',encode(sha256(convert_to(before_catalog::text,'UTF8')),'hex'),\n    encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex'),\n    s.generation+1,clock_timestamp(),after_catalog FROM official_v3_guard_private.state_v1 s\n      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 prior WHERE s.singleton AND prior.singleton;" + suffix.slice(insertEnd)
  suffix = suffix.replaceAll('bg1_recovery_before', 'bg1_gap_before').replaceAll('bg1_recovery_objects', 'bg1_gap_objects')
    .replaceAll('$recovery_delta$', '$gap_delta$').replaceAll('$recovery_postcheck$', '$gap_postcheck$')
  suffix = once(suffix, "  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1) THEN\n    RAISE EXCEPTION 'bg1 recovery installer cannot retire an attempt' USING ERRCODE='P7901'; END IF;\n", '')

  const functions = functionsIn(definitions)
  assert.deepEqual(functions.map(f => f.signature), GAP_RECOVERY_REPLACEMENTS)
  for (const next of functions) {
    const before = options(old(next.signature)), after = options(next)
    assert.notEqual(after.hash, before.hash)
    assert.deepEqual({ ...after, hash: null }, { ...before, hash: null }, 'existing OID/owner/options remain unchanged: ' + next.signature)
  }
  suffix = once(suffix, '/* APPROVED_FUNCTIONS */', quote(JSON.stringify(functions.map(options))) + '::jsonb')
  suffix = once(suffix, '/* FINAL_QUIESCENCE */', context.slice(quiescenceStart, quiescenceEnd))
  for (const [marker, value] of [['/* GAP_CONTEXT */', context], ['/* GAP_PREFLIGHT */', preflight],
    ['/* GAP_FUNCTIONS */', definitions], ['/* GAP_SUFFIX */', suffix]]) template = once(template, marker, value)
  template = template.replaceAll('BG1_PROVIDER_SHA256', GAP_RECOVERY_PREDECESSORS.bg1)
    .replaceAll('STATUS_PROVIDER_SHA256', GAP_RECOVERY_PREDECESSORS.status)
    .replaceAll('RECOVERY2_PROVIDER_SHA256', GAP_RECOVERY_PREDECESSORS.recovery2)
  assert.equal(functionsIn(template).length, 9)
  const output = '-- BG1-RECOVERY3: fixed Dev Claim3 without Start, actual unknown Start4; provider transaction required.\n' + template.trimEnd() + '\n'
  assertTransactionBody(output)
  return output
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'gap_recovery_build_mode_required')
  const output = compileGapRecoveryMigrationBody(), path = new URL('recovery-gap-provider-migration-body.sql', here)
  if (process.argv[2] === '--write') writeFileSync(path, output)
  else assert.equal(readFileSync(path, 'utf8'), output, 'gap recovery SQL matches reviewed source')
}
