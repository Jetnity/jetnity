import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { PILOT_FAULTS, runSyntheticIntegratedPilot } from '../../scripts/official-truth-integrated-pilot-1/engine'
import { consumeControlledImplementationSnapshot } from '../../scripts/official-truth-integrated-pilot-1/controlled-runtime-context'
import {
  CONTROLLED_PILOT_FAULTS, executePreparedControlledSyntheticPilot, prepareControlledSyntheticPilot, runControlledSyntheticPilot,
} from '../../scripts/official-truth-integrated-pilot-1/controlled-runtime'
import { verifyLocalIntegratedPilotBundle } from './official-truth-integrated-pilot-bundle'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const runtimeRelative = 'scripts/official-truth-integrated-pilot-1/controlled-runtime.ts'
const corpusRelative = 'scripts/official-truth-integrated-pilot-1/corpus.ts'
const sha = (text: string) => createHash('sha256').update(text).digest('hex')
type Runtime = typeof import('../../scripts/official-truth-integrated-pilot-1/controlled-runtime')
type Result = Awaited<ReturnType<Runtime['runControlledSyntheticPilot']>>
type Descriptor = { path: string; parts: string[]; bytes: number; sha256: string }

/** Each mutation touches only this disposable copy, never the shared checkout. */
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'ot-controlled-runtime-'))
  for (const path of ['lib', 'types', 'scripts/official-truth-integrated-pilot-1']) {
    mkdirSync(dirname(resolve(directory, path)), { recursive: true })
    cpSync(resolve(root, path), resolve(directory, path), { recursive: true, filter: p => !p.endsWith('.test.ts') })
  }
  for (const path of ['package.json', 'package-lock.json', 'tsconfig.json']) cpSync(resolve(root, path), resolve(directory, path))
  symlinkSync(resolve(root, 'node_modules'), resolve(directory, 'node_modules'), 'dir')
  const runtime = createRequire(import.meta.url)(resolve(directory, runtimeRelative)) as Runtime
  return { directory, runtime, close: () => rmSync(directory, { recursive: true, force: true }) }
}

function historicalFiles(result: Result): Map<string, string> {
  assert.equal(result.status, 'synthetic_bundle_verified')
  if (result.status !== 'synthetic_bundle_verified') throw Error('positive_control_missing')
  const files = new Map<string, string>()
  for (const artifact of result.envelope.bundle.artifacts) {
    if (artifact.artifactType !== 'implementation_bundle') continue
    const manifest = JSON.parse(new TextDecoder().decode(artifact.canonicalBytes))
    const capsule = JSON.parse(Buffer.from(manifest.content.bundleBase64, 'base64').toString('utf8'))
    for (const file of capsule.files as { path: string; utf8: string }[]) {
      assert.equal(files.has(file.path), false, 'one unambiguous captured file')
      files.set(file.path, file.utf8)
    }
  }
  return files
}

for (const mode of ['primary', 'composed'] as const) {
  test(`${mode}: captured source/dependencies/emitted build really execute and yield a fully verified historical envelope`, async () => {
    const result = await runControlledSyntheticPilot(mode)
    const files = historicalFiles(result)
    assert.equal(result.status, 'synthetic_bundle_verified')
    if (result.status !== 'synthetic_bundle_verified') return
    assert.equal(result.trace.actualFactIdentity, true)
    assert.equal(result.trace.proof, true)
    assert.equal(result.trace.extracted, true)
    assert.equal(result.trace.publicationCount, 0, 'a worker result is not a PostgreSQL commit')
    assert.equal(result.trace.storageCalls, 0)
    assert.equal(verifyLocalIntegratedPilotBundle(result.envelope).ok, true)
    const metadata = JSON.parse(files.get('controlled-build/build.json')!)
    assert.equal(metadata.schema, 'ot-controlled-build-v1')
    assert.equal(metadata.builder.name, 'esbuild')
    assert.equal(metadata.runtime.node, process.version)
    const reconstruct = (descriptor: Descriptor) => {
      assert.ok(descriptor.parts.length)
      const text = descriptor.parts.map(path => { assert.ok(files.has(path), path); return files.get(path)! }).join('')
      assert.equal(sha(text), descriptor.sha256, descriptor.path)
      assert.equal(Buffer.byteLength(text), descriptor.bytes, descriptor.path)
      return text
    }
    const inputs = metadata.inputs as Descriptor[]
    inputs.forEach(reconstruct)
    assert.equal(reconstruct(inputs.find(d => d.path === corpusRelative)!), readFileSync(resolve(root, corpusRelative), 'utf8'))
    assert.ok(inputs.some(d => d.path.startsWith('node_modules/zod/')))
    assert.ok(inputs.some(d => d.path === 'package-lock.json'))
    assert.ok(reconstruct(metadata.output).includes('runSyntheticIntegratedPilot'))
    assert.equal(sha(files.get('controlled-build/worker.cjs')!), metadata.workerSha256)
    assert.equal(metadata.externals.some((s: string) => /(?:fs|module|child_process|worker_threads)/.test(s)), false)
    assert.deepEqual(metadata.substitutions, [
      { input: 'scripts/official-truth-integrated-pilot-1/controlled-runtime-context.ts', loaded: 'controlled-build/context.js' },
      { input: 'server-only', loaded: 'controlled-build/server-only.js' },
    ])
    // Only historical byte values cross realms; no held executable/context/seal.
    assert.deepEqual(Object.keys(result).sort(), ['envelope', 'fault', 'mode', 'stages', 'status', 'trace'])
    assert.ok(result.envelope.bundle.receiptBytes instanceof Uint8Array)
    assert.doesNotMatch(JSON.stringify(result), /"(?:seal|executionContext|token|extract)":/)
  })
}

test('ordinary imports, forged DTO injection and a fabricated worker-like global grant no snapshot authority', async () => {
  assert.deepEqual([...CONTROLLED_PILOT_FAULTS].sort(), [...PILOT_FAULTS].sort(), 'host/worker finite fault ingress must stay synchronized')
  const globalRecord = globalThis as typeof globalThis & { __otConsumeSnapshot?: () => unknown }
  globalRecord.__otConsumeSnapshot = () => ({ schema: 'ot-controlled-implementation-snapshot-v1', files: [] })
  try {
    assert.equal(consumeControlledImplementationSnapshot(), null)
    const direct = await runSyntheticIntegratedPilot('primary')
    assert.equal(direct.status, 'blocked')
    if (direct.status === 'blocked') assert.equal(direct.reason, 'runtime_context_missing')
    assert.equal(direct.trace.originalHttp, 0)
    assert.equal(direct.trace.receiptProjected, false)
    assert.equal('envelope' in direct, false)
    await assert.rejects(executePreparedControlledSyntheticPilot({ snapshot: globalRecord.__otConsumeSnapshot() }, 'primary'), /authority_required/)
    await assert.rejects(Reflect.apply(prepareControlledSyntheticPilot, null, [{ root }]), /authority_required/)
    await assert.rejects(Reflect.apply(runControlledSyntheticPilot, null, ['primary', 'none', { snapshot: {} }]), /authority_required/)
  } finally { delete globalRecord.__otConsumeSnapshot }
})

test('prepared handle is identity-bound, one-shot, rejects accessors and concurrent replay before loading code', async () => {
  const handle = await prepareControlledSyntheticPilot()
  let getterRead = false
  const forged = Object.defineProperty({}, 'snapshot', { get() { getterRead = true; throw Error('must_not_read') } })
  for (const value of [null, 'handle', {}, structuredClone(handle), { ...handle }, forged]) {
    await assert.rejects(executePreparedControlledSyntheticPilot(value, 'primary'), /authority_required/)
  }
  assert.equal(getterRead, false)
  const first = executePreparedControlledSyntheticPilot(handle, 'primary')
  await assert.rejects(executePreparedControlledSyntheticPilot(handle, 'composed'), /authority_required/)
  assert.equal((await first).status, 'synthetic_bundle_verified')
  await assert.rejects(executePreparedControlledSyntheticPilot(handle, 'primary'), /authority_required/)
  const closed = await prepareControlledSyntheticPilot()
  await assert.rejects(Reflect.apply(executePreparedControlledSyntheticPilot, null, [closed, 'primary', 'none', { files: [] }]), /authority_required/)
  await assert.rejects(executePreparedControlledSyntheticPilot(closed, 'primary'), /authority_required/)
})

test('captured bytes execute after dependency deletion; missing dependency prevents a new capture', async () => {
  const copy = fixture()
  try {
    const handle = await copy.runtime.prepareControlledSyntheticPilot()
    const original = readFileSync(resolve(copy.directory, corpusRelative), 'utf8')
    rmSync(resolve(copy.directory, corpusRelative))
    const result = await copy.runtime.executePreparedControlledSyntheticPilot(handle, 'primary')
    assert.equal(historicalFiles(result).get(corpusRelative), original)
    await assert.rejects(copy.runtime.prepareControlledSyntheticPilot(), /Could not resolve/)
  } finally { copy.close() }
})

test('disk edits after capture cannot replace an executable; a new capture runs the changed dependency', async () => {
  const copy = fixture()
  try {
    const handle = await copy.runtime.prepareControlledSyntheticPilot()
    const original = readFileSync(resolve(copy.directory, corpusRelative), 'utf8')
    writeFileSync(resolve(copy.directory, corpusRelative), `${original}\nthrow Error('changed_dependency_executed');\n`)
    const result = await copy.runtime.executePreparedControlledSyntheticPilot(handle, 'composed')
    assert.equal(historicalFiles(result).get(corpusRelative), original)
    // The second build must use the new bytes, so execution fails at the added
    // throw. No stale module cache and no late disk archive can pass this test.
    const changed = await copy.runtime.prepareControlledSyntheticPilot()
    await assert.rejects(copy.runtime.executePreparedControlledSyntheticPilot(changed, 'composed'), /execution_failed/)
    await assert.rejects(copy.runtime.executePreparedControlledSyntheticPilot(changed, 'composed'), /authority_required/)
  } finally { copy.close() }
})

test('foreign-runtime handles and new uncaptured filesystem dependencies fail closed', async () => {
  const copy = fixture()
  try {
    const foreign = await copy.runtime.prepareControlledSyntheticPilot()
    await assert.rejects(executePreparedControlledSyntheticPilot(foreign, 'primary'), /authority_required/)
    const original = readFileSync(resolve(copy.directory, corpusRelative), 'utf8')
    writeFileSync(resolve(copy.directory, corpusRelative), `${original}\nimport { readFileSync } from 'node:fs'; console.log(readFileSync('/forbidden'));\n`)
    await assert.rejects(copy.runtime.prepareControlledSyntheticPilot(), /external_denied/)
    // A foreign caller cannot burn the rightful owner's private membership.
    assert.equal((await copy.runtime.executePreparedControlledSyntheticPilot(foreign, 'primary')).status, 'synthetic_bundle_verified')
  } finally { copy.close() }
})

test('worker-local snapshot accessor is consumed once; a second engine invocation has no authority', async () => {
  const copy = fixture()
  try {
    const path = resolve(copy.directory, 'scripts/official-truth-integrated-pilot-1/engine.ts')
    const original = readFileSync(path, 'utf8')
    assert.ok(original.includes('export async function runSyntheticIntegratedPilot('))
    writeFileSync(path, original.replace('export async function runSyntheticIntegratedPilot(', 'async function firstInvocation(') + `
export async function runSyntheticIntegratedPilot(mode: PilotMode, fault: PilotFault) {
  const first = await firstInvocation(mode, fault)
  if (first.status !== 'synthetic_bundle_verified') throw Error('first_invocation_failed')
  return firstInvocation(mode, fault)
}
`)
    const result = await copy.runtime.runControlledSyntheticPilot('primary')
    assert.equal(result.status, 'blocked')
    if (result.status === 'blocked') assert.equal(result.reason, 'runtime_context_missing')
    assert.equal(result.trace.originalHttp, 0)
    assert.equal(result.trace.actualFactIdentity, false)
    assert.equal('envelope' in result, false)
  } finally { copy.close() }
})
