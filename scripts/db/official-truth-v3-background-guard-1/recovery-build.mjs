// RECOVERY2-R1: deterministic additive Dev successor, never a database runner.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertTransactionBody, functionsIn } from './build.mjs'

const here = new URL('./', import.meta.url)
export const RECOVERY_PREDECESSORS = Object.freeze({
  bg1: 'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950',
  status: '71e2f9f080b8af0b7100d49b70520f8c34dffdc1bc84f3912b20aff413adf97c',
})
const sha = value => createHash('sha256').update(value).digest('hex')
const read = name => readFileSync(new URL(name, here), 'utf8')
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
function once(value, marker, replacement) {
  assert.equal(value.split(marker).length, 2, 'one recovery source marker: ' + marker)
  return value.replace(marker, replacement)
}
export const RECOVERY_REPLACEMENTS = Object.freeze([
  'official_v3_guard_private.recovery_jobs_v1()',
  'official_v3_guard_private.close_jobs_v1(text)',
  'official_v3_guard_private.recovery_hrs_v1()',
  'official_v3_guard_private.check_retired_hrs_v1(jsonb)',
  'official_v3_guard_private.recovery_snapshot_v1()',
  'official_v3_guard_private.intake_retired_v1(text)',
  'official_v3_guard_private.attempt_retired_v1(text)',
  'official_v3_guard_private.retired_state_v1(text)',
  'official_v3_guard_private.check_retirements_v1()',
  'public.official_v3_guard_review_v1()',
  'public.official_v3_guard_retire_v1(text,text)',
  'official_v3_guard_private.assert_catalog_v1()',
  'official_v3_guard_private.require_open_v1()',
  'public.official_v3_guard_alarm_status_v1()',
])
const ownerOf = signature => /\.(?:recovery_jobs|close_jobs)_v1\(/.test(signature) ? 'ot_v3_jobs_owner'
  : /\.(?:recovery_hrs|check_retired_hrs)_v1\(/.test(signature) ? 'ot_v3_result_owner' : 'postgres'
function options(f) {
  return {
    signature: f.signature, name: f.name, owner: ownerOf(f.signature), hash: sha(f.body),
    language: /LANGUAGE\s+(\w+)/i.exec(f.options)[1].toLowerCase(),
    definer: /SECURITY DEFINER/i.test(f.options), volatile: /\bIMMUTABLE\b/.test(f.options) ? 'i' : /\bSTABLE\b/.test(f.options) ? 's' : 'v',
    config: [...f.options.matchAll(/SET\s+(\w+)\s*=\s*('[^']*'|[^\s]+)/gi)].map(m =>
      ({ timezone: 'TimeZone', datestyle: 'DateStyle' }[m[1].toLowerCase()] ?? m[1]) + '=' + m[2].replace(/^'|'$/g, '')),
  }
}
export function compileRecoveryMigrationBody() {
  const bg1 = read('provider-migration-body.sql'), status = read('status-rpc-provider-migration-body.sql')
  assert.equal(sha(bg1), RECOVERY_PREDECESSORS.bg1, 'installed BG1 is immutable')
  assert.equal(sha(status), RECOVERY_PREDECESSORS.status, 'installed status successor is immutable')
  const current = new Map([...functionsIn(bg1), ...functionsIn(status)].map(f => [f.signature, f]))
  const old = signature => { const f = current.get(signature); assert.ok(f, signature); return f }
  const statusCatalog = old('official_v3_guard_private.catalog_status_v1()').body.trim()
  const contexts = [...status.matchAll(/DO \$context\$[\s\S]*?END \$context\$;/g)]
  assert.equal(contexts.length, 1)
  const context = once(contexts[0][0], "current_setting('jetnity.bg1_status_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1-STATUS1'",
    "current_setting('jetnity.bg1_recovery_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1-RECOVERY2'")
  const quiescenceStart = context.indexOf('IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (')
  const quiescenceEnd = context.indexOf(' THEN\n    RAISE EXCEPTION', quiescenceStart)
  assert.ok(quiescenceStart > 0 && quiescenceEnd > quiescenceStart)
  let source = read('parts/recovery.sql')
  const hrs = read('../official-truth-v3-hosted-result-store-1/install-candidate.sql')
  assert.equal(sha(hrs), 'ba036a9394baf8a0a4194850ed25e0dba0c97ed8dabfd7842d0c5bf8bbcc4d16', 'canonical algorithm comes from the immutable HRS predecessor')
  const canonical = functionsIn(hrs).find(f => f.signature === 'official_v3_result_private.canonical_v1(jsonb,integer)')
  assert.ok(canonical)
  const canonicalBody = canonical.body.replaceAll('official_v3_result_private.canonical_v1', 'official_v3_guard_private.recovery_canonical_v1')
  for (const [marker, value] of [
    ['/* RECOVERY_CONTEXT */', context],
    ['/* PREDECESSOR_FUNCTIONS */', [...current.values()].map(f => '(' + quote(f.signature) + ',' + quote(sha(f.body)) + ')').join(',\n    ')],
    ['/* STATUS_CATALOG_QUERY */', statusCatalog],
    ['/* FINAL_QUIESCENCE */', context.slice(quiescenceStart, quiescenceEnd)],
    ['/* RECOVERY_CANONICAL_BODY */', canonicalBody],
    ['/* LEGACY_RETIREMENTS_BODY */', old('official_v3_guard_private.check_retirements_v1()').body.trim() + ';'],
    ['/* LEGACY_RETIRED_HRS_BODY */', old('official_v3_guard_private.check_retired_hrs_v1(jsonb)').body.trim() + ';'],
    ['/* LEGACY_JOBS_BODY */', old('official_v3_guard_private.recovery_jobs_v1()').body.trim() + ';'],
  ]) source = once(source, marker, value)
  source = source.replaceAll('BG1_PROVIDER_SHA256', RECOVERY_PREDECESSORS.bg1).replaceAll('STATUS_PROVIDER_SHA256', RECOVERY_PREDECESSORS.status)
  const functions = functionsIn(source), replacements = functions.filter(f => current.has(f.signature))
  assert.deepEqual(replacements.map(f => f.signature), RECOVERY_REPLACEMENTS)
  assert.deepEqual(functions.filter(f => !current.has(f.signature)).map(f => f.signature), ['official_v3_guard_private.recovery_canonical_v1(jsonb,integer)'])
  for (const f of replacements) {
    const before = options(old(f.signature)), after = options(f)
    assert.notEqual(after.hash, before.hash, 'actual replacement: ' + f.signature)
    assert.deepEqual({ ...after, hash: null }, { ...before, hash: null }, 'unchanged owner and execution attributes: ' + f.signature)
  }
  source = once(source, '/* APPROVED_FUNCTIONS */', quote(JSON.stringify(functions.map(options))) + '::jsonb')
  const body = '-- BG1-RECOVERY2: fixed Dev initial CH-DE pilot, attempts 2..4; provider transaction required.\n' + source.trimEnd() + '\n'
  assertTransactionBody(body)
  return body
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'recovery_build_mode_required')
  const output = compileRecoveryMigrationBody(), path = new URL('recovery-provider-migration-body.sql', here)
  if (process.argv[2] === '--write') writeFileSync(path, output)
  else assert.equal(readFileSync(path, 'utf8'), output, 'recovery SQL matches reviewed source')
}
