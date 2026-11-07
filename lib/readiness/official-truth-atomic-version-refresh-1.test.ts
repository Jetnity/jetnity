import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { test } from 'node:test'
import { ATOMIC_REFRESH_COMMON, ATOMIC_REFRESH_LIMITS, ATOMIC_REFRESH_ROLE, ownAtomicRefreshRequest } from '../../scripts/db/official-truth-atomic-version-refresh-1/contract'
import { refreshPersistedCanonicalVersion } from '../../scripts/db/official-truth-atomic-version-refresh-1/refresh'
import type { LocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { PILOT_CORPUS, pilotBody, derivePilotValidity } from '../../scripts/official-truth-integrated-pilot-1/corpus'
import { persistedCanonicalReadContract } from '../../scripts/db/official-truth-persisted-canonical-read-1/contract'
import { provenanceCanonical } from './official-truth-autonomous-provenance-artifact'
import { requirementsProviderAus } from './provider'

const root = new URL('../../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const packageRoot = 'scripts/db/official-truth-atomic-version-refresh-1/'

test('refresh refuses foreign cluster/context without exposing or acquiring authority', async () => {
  const cluster = {} as LocalProofCluster, key = 'ab'.repeat(32)
  for (const input of [undefined, null, {}, { mode: 'primary', current: true }, { callback: () => true }]) {
    const result = await refreshPersistedCanonicalVersion(cluster, input, key)
    assert.equal(result.status, 'refused'); assert.equal(result.commitStatus, 'not_attempted')
    assert.equal(result.positiveRealVisaCells, 0); assert.equal(result.syntheticVisaCells, 0)
    assert.equal(result.productionAcceptedRead, 'NOT_AUTHORIZED'); assert.equal(result.reusablePositiveCache, false)
    assert.equal('readback' in result, false); assert.equal('sourceContent' in result, false)
    assert.ok(Object.isFrozen(result))
  }
  assert.equal((await Reflect.apply(refreshPersistedCanonicalVersion, null, [cluster, {}, key, undefined, { current: true }])).status, 'refused')
  assert.deepEqual(ATOMIC_REFRESH_LIMITS, { operationMs: 120_000, producerExitMs: 2_000, producerPollMs: 20 })
  assert.ok(Object.isFrozen(ATOMIC_REFRESH_COMMON)); assert.equal(ATOMIC_REFRESH_ROLE, 'ot_original_refresh')
})

test('closed ownership precheck rejects getters, sparse/augmented arrays and injected clocks', () => {
  const base = { mode: 'primary', expectedPredecessor: `ot-provenance-v1:${'a'.repeat(64)}`, envelope: {},
    bodies: [new Uint8Array([1])], reviewId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', witness: { sequence: '1', eventHash: 'a'.repeat(64) } }
  let reads = 0
  const getter = { ...base }; Object.defineProperty(getter, 'mode', { enumerable: true, get() { reads++; return 'primary' } })
  assert.throws(() => ownAtomicRefreshRequest(getter)); assert.equal(reads, 0)
  const bodies = [new Uint8Array([1])]; Object.defineProperty(bodies, '0', { enumerable: true, get() { reads++; return new Uint8Array([1]) } })
  assert.throws(() => ownAtomicRefreshRequest({ ...base, bodies })); assert.equal(reads, 0)
  for (const bodies of [Array(1), Object.assign([new Uint8Array([1])], { caller: true }), []]) assert.throws(() => ownAtomicRefreshRequest({ ...base, bodies }))
  for (const extra of [{ now: Date.now() }, { authority: true }, { connection: {} }, { currentVersions: [] }, { registry: {} }]) assert.throws(() => ownAtomicRefreshRequest({ ...base, ...extra }))
  for (const sequence of ['-1', '01', '100000', '99999', '', 1]) assert.throws(() => ownAtomicRefreshRequest({ ...base, witness: { ...base.witness, sequence } }))
  assert.throws(() => ownAtomicRefreshRequest({ ...base, witness: { ...base.witness, renew: true } }))
})

test('direct SQL capability pins exactly the frozen code-owned fictional corpus', () => {
  const sql = read(`${packageRoot}refresh-candidate.sql`)
  const encoded = sql.match(/\$fixed\$([\s\S]+?)\$fixed\$::jsonb/)?.[1]; assert.ok(encoded)
  const { current, ...policy } = PILOT_CORPUS.policy; void current
  const expected = { contracts: (['primary', 'composed'] as const).map(mode => persistedCanonicalReadContract(mode)), registry: PILOT_CORPUS.registry,
    extractors: PILOT_CORPUS.extractors.map(({ current, match, extract, ...descriptor }) => { void current; void match; void extract; return descriptor }), policy,
    bodies: Object.fromEntries((['primary_rule', 'composed_effect', 'composed_mode'] as const).map(item => [item, pilotBody(item)])),
    scopeCanonical: provenanceCanonical(PILOT_CORPUS.scope), ruleScopeKey: PILOT_CORPUS.ruleScopeKey,
    validity: Object.fromEntries((['primary_rule', 'composed_effect', 'composed_mode'] as const).map(item => [item, derivePilotValidity(item, pilotBody(item))])) }
  assert.deepEqual(JSON.parse(encoded), JSON.parse(JSON.stringify(expected)))
  assert.ok(sql.indexOf('PERFORM official_provenance_api.publish_local_integrated_v2(') < sql.indexOf('FROM official_original_private.head h WHERE h.singleton FOR UPDATE'))
  assert.doesNotMatch(sql, /CREATE OR REPLACE|\bcheckpoint\s*\(|\bcursor\s*\(|SET\s+(?:LOCAL\s+)?(?:statement_timeout|lock_timeout|idle_in_transaction_session_timeout)/i)
  assert.equal((sql.match(/CREATE ROLE /g) ?? []).length, 1)
  assert.equal((sql.match(/GRANT EXECUTE ON FUNCTION/g) ?? []).length, 1)
  assert.doesNotMatch(sql, /GRANT\s+(?:ot_original_producer|ot_original_lifecycle|ot_provenance_writer)\b/)
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/); assert.match(sql, /FORCE ROW LEVEL SECURITY/)
  const rollback = read(`${packageRoot}refresh-candidate.rollback.sql`)
  assert.doesNotMatch(rollback, /CASCADE|DELETE FROM|TRUNCATE|UPDATE\s/i)
  assert.match(rollback, /DROP FUNCTION [^;]+ RESTRICT;/); assert.match(rollback, /DROP TABLE [^;]+ RESTRICT;/)
})

test('new package stays outside app imports, hosted commands and activation', () => {
  for (const file of ['contract.ts', 'refresh.ts']) {
    const source = read(`${packageRoot}${file}`)
    assert.doesNotMatch(source, /\bfetch\s*\(|createClient|DATABASE_URL|SUPABASE|\bcursor\s*\(|\bcheckpoint\s*\(|alternateSameIdentityReceipt/)
    assert.doesNotMatch(source, /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["'](?:node:)?(?:http|https|net|undici)["']/)
  }
  const walk = (dir: string): string[] => readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(`${dir}/${entry.name}`)
    : /\.[cm]?[jt]sx?$/.test(entry.name) && !/\.test\.[jt]sx?$/.test(entry.name) ? [join(dir, entry.name)] : [])
  const visited = new Set<string>()
  const visit = (path: string) => {
    assert.equal(path.startsWith(packageRoot), false, `application reaches local refresh: ${path}`)
    if (visited.has(path)) return; visited.add(path)
    for (const match of read(path).matchAll(/(?:\bfrom\s+|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)["']([^"']+)["']/g)) {
      const spec = match[1]!, base = spec.startsWith('@/') ? spec.slice(2) : spec.startsWith('.') ? normalize(join(dirname(path), spec)) : null
      if (!base) continue
      const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, `${base}/index.ts`, `${base}/index.tsx`]
        .find(candidate => /\.[cm]?[jt]sx?$/.test(candidate) && existsSync(new URL(candidate, root)))
      if (resolved) visit(resolved)
    }
  }
  for (const dir of ['app', 'components', 'lib']) for (const path of walk(dir)) visit(path)
  assert.equal(requirementsProviderAus(), null)
})

test('CI keeps complete native proofs mandatory with unchanged existing test commands', () => {
  const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }
  assert.equal(pkg.scripts['test:refresh-native'], 'node --import ./scripts/server-only-test-register.mjs --import tsx --test scripts/db/official-truth-atomic-version-refresh-1/native.test.ts')
  assert.equal(pkg.scripts.test, 'npm run test:core && npm run test:persisted-native && npm run test:refresh-native')
  const workflow = read('.github/workflows/ci.yml')
  assert.equal((workflow.match(/name: Typecheck, Lint & Build/g) ?? []).length, 1)
  assert.match(workflow, /needs: \[verify, persisted_native, refresh_native\]/)
  assert.match(workflow, /REFRESH_NATIVE_RESULT: \$\{\{ needs.refresh_native.result \}\}/)
  assert.match(workflow, /"\$REFRESH_NATIVE_RESULT" != "success"/)
  assert.match(workflow, /if: \$\{\{ always\(\) \}\}/)
})
