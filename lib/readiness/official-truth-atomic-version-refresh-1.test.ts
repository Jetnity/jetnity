import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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
import { OwnedTestLifetime } from '../../scripts/db/official-truth-atomic-version-refresh-1/test-lifetime'
import { LocalPgConnection } from '../../scripts/db/official-truth-integrated-pilot-1/pg-wire'

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

test('test lifetime abort restores nested hooks, releases pending work and forbids its continuation', async () => {
  const parent = new AbortController(), reason = Error('unit_parent_abort')
  const lifetime = new OwnedTestLifetime(parent.signal), original = LocalPgConnection.connect
  lifetime.installConnectOwnership()
  const restore = lifetime.patchConnect(async () => { throw Error('unit_must_not_connect') })
  let release!: () => void, laterWork = 0
  const gate = new Promise<void>(resolve => { release = resolve })
  lifetime.onStop(release)
  const pending = lifetime.run(async () => { await gate; lifetime.check(); laterWork++ })
  assert.notEqual(LocalPgConnection.connect, original)
  parent.abort(reason)
  await assert.rejects(pending, error => error === reason)
  assert.equal(LocalPgConnection.connect, original)
  restore(); assert.equal(LocalPgConnection.connect, original, 'late finally must not reinstall an abandoned wrapper')
  await assert.rejects(lifetime.run(async () => { laterWork++ }), error => error === reason)
  const state = await lifetime.dispose()
  assert.equal(laterWork, 0); assert.equal(state.pending, 0); assert.equal(state.started, state.settled)
})

test('test lifetime retains cleanup failures without throwing from the abort listener', async () => {
  const parent = new AbortController(), lifetime = new OwnedTestLifetime(parent.signal)
  const cleanupError = Error('unit_cleanup_failure')
  let released = false
  lifetime.onStop(() => { released = true })
  lifetime.onStop(() => { throw cleanupError })
  assert.doesNotThrow(() => parent.abort(Error('unit_parent_abort')))
  assert.equal(released, true, 'one cleanup failure must not prevent later releases')
  await assert.rejects(lifetime.dispose(), (error: unknown) => error instanceof AggregateError && error.errors.includes(cleanupError))
})

test('actual native parent signal owns every test hook and keeps the complete fixed matrix', () => {
  const native = read(`${packageRoot}native.test.ts`), lifetime = read(`${packageRoot}test-lifetime.ts`)
  const inOrder = (source: string, before: string, after: string) => {
    const first = source.indexOf(before), second = source.indexOf(after)
    assert.ok(first >= 0, `required source boundary missing: ${before}`)
    assert.ok(second >= 0, `required source boundary missing: ${after}`)
    assert.ok(first < second, 'required source boundaries are out of order')
  }
  const parentBinding = 'new OwnedTestLifetime(t.signal)', firstAwait = 'await lifetime.run(abortLifetimeRegression)'
  const actualStop = 'this.stopCluster(cluster)', finalDrain = 'this.teardown = this.drainAll()'
  inOrder(native, parentBinding, firstAwait)
  assert.match(native, /timeout: 1_200_000/)
  assert.match(native, /AbortSignal\.any\(\[lifetime\.signal, signal\]\)/)
  assert.match(native, /actual parent-lifetime abort stops pending SQL and connection gate/)
  assert.match(native, /t\.signal\.throwIfAborted\(\)/)
  assert.doesNotMatch(native, /LocalPgConnection\.connect\s*=/)
  assert.match(native, /lifetime\.track\(deferred\.commitBefore/)
  assert.match(native, /lifetime\.track\(delayed\.commitBefore/)
  assert.match(native, /lifetime\.onStop\([\s\S]*?readerResume\.resolve\(\); writerResume\.resolve\(\)/)
  assert.match(native, /\['unknown_commit', 'readback_failure', 'cleanup_after_bound', 'reader_after_bound'\]/)
  inOrder(lifetime, actualStop, finalDrain)
  // These deliberately broken source copies must fail the same guard. No
  // native/runtime file or execution evidence is changed by this unit probe.
  assert.throws(() => inOrder(native.replace(parentBinding, ''), parentBinding, firstAwait))
  assert.throws(() => inOrder(native.replace(parentBinding, 'new OwnedTestLifetime(new AbortController().signal)'), parentBinding, firstAwait))
  assert.throws(() => inOrder(lifetime.replace(actualStop, ''), actualStop, finalDrain))
  assert.throws(() => inOrder(native.replace(firstAwait, ''), parentBinding, firstAwait))
  assert.throws(() => inOrder(lifetime.replace(finalDrain, ''), actualStop, finalDrain))
  assert.doesNotMatch(lifetime, /\bfetch\s*\(|DATABASE_URL|SUPABASE|pg_terminate_backend|process\.kill/)
})

test('R9 graph representation reverses exactly to the pinned worker and leaves every other SQL byte unchanged', () => {
  const sql = read('scripts/db/official-truth-integrated-pilot-1/semantic-v2.sql')
  const reference = read(`${packageRoot}graph-reference-r9.fixture.sql`)
  const digest = (value: string) => createHash('sha256').update(value).digest('hex')
  assert.equal(digest(reference), 'e01025d2ff40c374835729519c9e62e9c7eff03bcd8f68f6847d4983e2204f0c')
  const worker = sql.match(/^CREATE FUNCTION official_provenance_private\.validate_inspected_graph_v2\([\s\S]*?END \$\$;\n/m)?.[0]
  const renamed = reference.match(/^CREATE FUNCTION official_refresh_graph_reference_r9\.validate_inspected_graph_v2\([\s\S]*?END \$\$;\n/m)?.[0]
  assert.ok(worker && renamed)
  const original = renamed.replace('official_refresh_graph_reference_r9.validate_inspected_graph_v2', 'official_provenance_private.validate_inspected_graph_v2')
  assert.equal(Buffer.byteLength(original), 6147)
  assert.equal(digest(original), '17af51e55da5c3ed65007904ddaf62f7875f28a8b3e9b91a71edb88c8976ea39')
  let reversed = worker
  const reverse = (before: string, after: string) => {
    assert.equal(reversed.split(before).length, 2, 'each selected representation hunk exists exactly once')
    reversed = reversed.replace(before, after)
  }
  reverse(" graph jsonb := '{}'::jsonb; adjacency jsonb; starts jsonb := '[]'::jsonb; work jsonb[] := '{}'::jsonb[]; work_head integer:=1; work_tail integer:=0; item jsonb;",
    " graph jsonb := '{}'::jsonb; starts jsonb := '[]'::jsonb; work jsonb; item jsonb;")
  reverse("  adjacency:='[]'::jsonb;\n", '')
  reverse('   adjacency:=adjacency||pg_catalog.to_jsonb(target);', '   graph:=pg_catalog.jsonb_set(graph,ARRAY[key],graph->key||pg_catalog.to_jsonb(target));')
  reverse('  graph:=pg_catalog.jsonb_set(graph,ARRAY[key],adjacency);\n', '')
  reverse(' -- R9: the pending FIFO is exactly work[work_head..work_tail]. Simple local\n -- element assignments retain expanded-array storage and release consumed items.\n -- At most 16 expansions per node enqueue at most 16*E+R items; E+R+1<=1024.\n FOR item IN SELECT pg_catalog.jsonb_array_elements(starts) LOOP\n  work_tail:=work_tail+1; work[work_tail]:=item;\n END LOOP;', ' work:=starts;')
  reverse(' WHILE work_head<=work_tail LOOP', ' WHILE pg_catalog.jsonb_array_length(work)>0 LOOP')
  reverse("  item:=work[work_head]; work[work_head]:=NULL; work_head:=work_head+1; key:=item->>'key'; depth:=(item->>'depth')::integer;",
    "  item:=work->0; work:=work-0; key:=item->>'key'; depth:=(item->>'depth')::integer;")
  reverse("   work_tail:=work_tail+1;\n   work[work_tail]:=pg_catalog.jsonb_build_object('key',target,'depth',depth+1,'path',item->'path'||pg_catalog.to_jsonb(key));",
    "   work:=work||pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('key',target,'depth',depth+1,'path',item->'path'||pg_catalog.to_jsonb(key)));")
  reverse("   IF work_tail-work_head+1>16384 THEN RAISE EXCEPTION 'bound_exceeded'; END IF;",
    "   IF pg_catalog.jsonb_array_length(work)>16384 THEN RAISE EXCEPTION 'bound_exceeded'; END IF;")
  assert.equal(reversed, original, 'all validation, error order, paths, counters and relaxation are unchanged')
  assert.equal(digest(sql.replace(worker, () => original)), 'f1e610c259f91b4e429b376f13f6b6a7068da2467ea8da1d607b87cee5c7c2af')
})

test('R9 owner-only graph oracle checks exact native failures without opening a runtime path', () => {
  const reference = read(`${packageRoot}graph-reference-r9.fixture.sql`), native = read(`${packageRoot}native.test.ts`)
  const fixtureRead = "const graphReferenceSql = readFileSync(new URL('./graph-reference-r9.fixture.sql', import.meta.url), 'utf8')"
  const parentPreparation = (source: string) => {
    const anchors = ["test('atomic refresh:", 'new OwnedTestLifetime(t.signal)', 'await lifetime.run(abortLifetimeRegression)', fixtureRead,
      'validateGraphReferenceSource(graphReferenceSql)', 'const primary = await lifetime.run(']
    const positions = anchors.map(anchor => source.indexOf(anchor))
    assert.ok(positions.every(position => position >= 0), 'every R9 parent preparation anchor must exist')
    assert.ok(positions.every((position, index) => index === 0 || positions[index - 1]! < position), 'R9 reference preparation must stay inside the bound parent')
    assert.equal(source.split(fixtureRead).length - 1, 1, 'exactly one R9 fixture read')
  }
  parentPreparation(native)
  assert.throws(() => parentPreparation(fixtureRead + '\n' + native.replace(fixtureRead, '')))
  assert.throws(() => parentPreparation(native.replace('new OwnedTestLifetime(t.signal)', 'new OwnedTestLifetime(new AbortController().signal)')))
  assert.throws(() => parentPreparation(native.replace(fixtureRead, '')))
  assert.throws(() => parentPreparation(native.replace('validateGraphReferenceSource(graphReferenceSql)', '')))
  assert.equal((reference.match(/^CREATE FUNCTION /gm) ?? []).length, 1)
  assert.match(reference, /REVOKE ALL ON SCHEMA official_refresh_graph_reference_r9 FROM PUBLIC;/)
  assert.match(reference, /REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_refresh_graph_reference_r9 FROM PUBLIC;/)
  assert.doesNotMatch(reference, /^GRANT |CREATE (?:TYPE|TABLE)|SECURITY DEFINER/m)
  for (const file of ['contract.ts', 'refresh.ts', 'test-lifetime.ts', 'fixtures.ts']) {
    assert.doesNotMatch(read(`${packageRoot}${file}`), /graph-reference-r9|official_refresh_graph_reference_r9|GET STACKED DIAGNOSTICS/)
  }
  assert.match(native, /await h\.compareGraphWorker\('primary'\)/)
  assert.match(native, /await c\.compareGraphWorker\('composed'\)/)
  assert.match(native, /GET STACKED DIAGNOSTICS state_=RETURNED_SQLSTATE,message_=MESSAGE_TEXT/)
  assert.match(native, /state_ IS DISTINCT FROM \(fixture_->>'sqlstate'\) OR message_ IS DISTINCT FROM \(fixture_->>'message'\)/)
  assert.match(native, /'later deeper shared path refuses depth17'[^\n]+message: 'bound_exceeded'/)
  assert.match(native, /'cycle before an already dominating visit'[^\n]+message: 'cycle'/)
  assert.match(native, /'later deeper shared path accepts exact depth16'[^\n]+sqlstate: null, message: null/)
  assert.match(native, /assert\.equal\(cases\.length, 14\)/)
  assert.match(native, /assert\.equal\(delta\[0\]!\.calls, 1\)/)
  assert.match(native, /R9 structural graph-worker equivalence; no canonical acceptance claim/)
})
