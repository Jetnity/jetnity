// Additive, fixed Dev status successor. Never executes SQL or changes the
// installed BG1 artifacts; the provider owns the surrounding transaction.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertTransactionBody, functionsIn } from './build.mjs'

const here = new URL('./', import.meta.url)
const PREDECESSOR = 'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950'
const sha = value => createHash('sha256').update(value).digest('hex')
const read = name => readFileSync(new URL(name, here), 'utf8')
const quote = value => "'" + value.replaceAll("'", "''") + "'"
function replaceOne(value, before, after) {
  assert.equal(value.split(before).length, 2, 'one exact status successor source marker')
  return value.replace(before, after)
}

export function compileStatusMigrationBody() {
  const predecessor = read('provider-migration-body.sql')
  assert.equal(sha(predecessor), PREDECESSOR, 'the actually installed BG1 provider artifact is immutable')
  const originalFunctions = functionsIn(predecessor)
  const originalCatalog = originalFunctions.filter(f => f.signature === 'official_v3_guard_private.catalog_v1()')
  assert.equal(originalCatalog.length, 1)
  const catalogQuery = originalCatalog[0].body.trim()
  // Same complete object graph, with exactly one additional public name. All
  // overloads, incoming/outgoing dependencies, ACLs and annotations are covered.
  const statusCatalogQuery = replaceOne(catalogQuery,
    "'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1'",
    "'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1'")
  const catalog = `CREATE FUNCTION official_v3_guard_private.catalog_status_v1() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog SET jit=off AS $status_catalog$
${statusCatalogQuery}
$status_catalog$;`
  const contexts = [...predecessor.matchAll(/DO \$context\$[\s\S]*?END \$context\$;/g)]
  assert.equal(contexts.length, 1)
  let context = replaceOne(contexts[0][0],
    "current_setting('jetnity.bg1_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1'",
    "current_setting('jetnity.bg1_status_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1-STATUS1'")
  context = replaceOne(context,
    "OR EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='official_v3_guard_private')",
    "OR NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='official_v3_guard_private')")
  const quiescenceStart = context.indexOf('IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (')
  const quiescenceEnd = context.indexOf(' THEN\n    RAISE EXCEPTION', quiescenceStart)
  assert.ok(quiescenceStart > 0 && quiescenceEnd > quiescenceStart)
  const quiescence = context.slice(quiescenceStart, quiescenceEnd)
  const expectedFunctions = originalFunctions.map(f => `(${quote(f.signature)},${quote(sha(f.body))})`).join(',\n    ')
  let source = read('parts/status-rpc.sql')
  for (const [marker, value] of [
    ['/* STATUS_CONTEXT */', context], ['/* ORIGINAL_FUNCTIONS */', expectedFunctions],
    ['/* ORIGINAL_CATALOG */', catalogQuery], ['/* STATUS_CATALOG */', catalog],
    ['/* FINAL_QUIESCENCE */', quiescence],
  ]) source = replaceOne(source, marker, value)
  source = source.replaceAll('BG1_PROVIDER_SHA256', PREDECESSOR)
  const functions = functionsIn(source)
  assert.deepEqual(functions.map(f => f.signature), [
    'official_v3_guard_private.catalog_status_v1()', 'official_v3_guard_private.assert_catalog_v1()',
    'public.official_v3_guard_alarm_status_v1()',
  ])
  const approved = functions.map(f => ({
    signature: f.signature, hash: sha(f.body), language: f.name.endsWith('.catalog_status_v1') ? 'sql' : 'plpgsql',
    volatile: f.name.endsWith('.catalog_status_v1') ? 's' : 'v',
    config: f.name.endsWith('.catalog_status_v1') ? ['search_path=pg_catalog', 'jit=off'] : ['search_path=pg_catalog'],
    result: f.name.endsWith('.assert_catalog_v1') ? 'void' : 'jsonb',
    grantees: f.name.startsWith('public.') ? ['anon', 'postgres'] : ['postgres'],
  }))
  source = replaceOne(source, '/* STATUS_FUNCTIONS */', quote(JSON.stringify(approved)) + '::jsonb')
  const body = '-- BG1-STATUS1: fixed Dev-only additive status RPC; provider transaction required.\n' + source.trimEnd() + '\n'
  assertTransactionBody(body)
  return body
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'status_build_mode_required')
  const output = compileStatusMigrationBody(), path = new URL('status-rpc-provider-migration-body.sql', here)
  if (process.argv[2] === '--write') writeFileSync(path, output)
  else assert.equal(readFileSync(path, 'utf8'), output, 'additive status SQL matches its exact reviewed source')
}
