// Local development entry only. No source/configuration/DTO injection surface.
// Trust boundary: this host loader, esbuild and Node's interpreter/builtins are
// the local software TCB. We bind the actual emitted application/worker bytes,
// not a post-hoc hash of this already-loaded file or a compiler attestation.
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { Worker } from 'node:worker_threads'
import { build, version as esbuildVersion, type Loader } from 'esbuild'
import type { runSyntheticIntegratedPilot, PilotFault } from './engine'
import type { PilotMode } from './corpus'
import type { ControlledImplementationSnapshot } from './controlled-runtime-context'

type PilotResult = Awaited<ReturnType<typeof runSyntheticIntegratedPilot>>
type CapturedFile = Readonly<{ path: string; utf8: string }>
type FileDescriptor = Readonly<{ path: string; parts: readonly string[]; sha256: string; bytes: number }>
type Prepared = Readonly<{ snapshot: ControlledImplementationSnapshot; bootstrap: string }>
const prepared = new WeakMap<object, Prepared>()
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const contextRelative = 'scripts/official-truth-integrated-pilot-1/controlled-runtime-context.ts'
const entryRelative = 'scripts/official-truth-integrated-pilot-1/engine.ts'
const order = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
const hash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex')
const externals = ['http', 'https', 'punycode', 'stream', 'url', 'zlib', 'node:buffer', 'node:net'] as const
const contextSource = 'export function consumeControlledImplementationSnapshot() { return __otConsumeSnapshot(); }\n'
const markerSource = 'export {};\n'
export const CONTROLLED_PILOT_FAULTS = Object.freeze(['none', 'unknown_body_field', 'changed_fresh_body', 'changed_final_url', 'reversed_clock',
  'future_original', 'duplicate_support', 'missing_support', 'non_null_proposal', 'missing_origin', 'scope_substitution',
  'stale_original', 'invalid_utf8', 'missing_execution_context', 'cloned_execution_result', 'replayed_execution_context',
  'substituted_fact_reference', 'foreign_composition_seal', 'ledger_clone', 'ledger_foreign', 'ledger_replay', 'ledger_closed',
  'expired_original', 'two_eligible_versions', 'same_item_two_representations', 'eligibility_revoked'] as const satisfies readonly PilotFault[])

// This literal is itself retained in the snapshot and is the exact Worker eval
// input. Engine, dependency and build output files are never reopened by it.
const bootstrap = `
'use strict';
const { parentPort, workerData } = require('node:worker_threads');
const { createHash } = require('node:crypto');
const { runInThisContext } = require('node:vm');
const sha = s => createHash('sha256').update(s, 'utf8').digest('hex');
const freeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { for (const v of Object.values(o)) freeze(v); Object.freeze(o); } return o; };
(async () => {
  const snapshot = freeze(workerData.snapshot);
  const files = new Map(snapshot.files.map(f => [f.path, f.utf8]));
  const metadata = JSON.parse(files.get('controlled-build/build.json'));
  const read = d => { const s = d.parts.map(p => { if (!files.has(p)) throw Error('missing'); return files.get(p); }).join(''); if (sha(s) !== d.sha256 || Buffer.byteLength(s) !== d.bytes) throw Error('changed'); return s; };
  for (const d of metadata.inputs) read(d);
  const code = read(metadata.output);
  if (sha(files.get('controlled-build/worker.cjs')) !== metadata.workerSha256) throw Error('worker_changed');
  let active = true;
  const consume = () => { if (!active) return null; active = false; return snapshot; };
  const allowed = new Set(metadata.externals);
  const restrictedRequire = spec => { if (!allowed.has(spec)) throw Error('external_denied'); return require(spec); };
  const entry = { exports: {} };
  const load = runInThisContext('(function(require,module,exports,__otConsumeSnapshot){' + code + '\\n})', { filename: 'controlled-pilot.cjs' });
  load(restrictedRequire, entry, entry.exports, consume);
  const result = await entry.exports.runSyntheticIntegratedPilot(workerData.mode, workerData.fault);
  active = false;
  parentPort.postMessage({ ok: true, value: result });
})().catch(() => parentPort.postMessage({ ok: false }));
`

function capturedParts(path: string, utf8: string, files: CapturedFile[]): FileDescriptor {
  const raw = Buffer.from(utf8, 'utf8'), parts: string[] = []
  // Each part fits the existing stricter implementation capsule bounds; byte
  // boundaries never split a UTF-8 code point. Metadata records reconstruction.
  for (let offset = 0; offset < raw.length;) {
    let end = Math.min(offset + 120_000, raw.length)
    while (end < raw.length && (raw[end]! & 0xc0) === 0x80) end--
    const name = raw.length > 120_000 ? `${path}.part-${String(parts.length).padStart(4, '0')}` : path
    const text = new TextDecoder('utf-8', { fatal: true }).decode(raw.subarray(offset, end))
    files.push(Object.freeze({ path: name, utf8: text })); parts.push(name); offset = end
  }
  if (!parts.length) throw Error('controlled_runtime_empty_input')
  return Object.freeze({ path, parts: Object.freeze(parts), sha256: hash(utf8), bytes: raw.length })
}

/** Capture/build first, then grant only an opaque one-shot execution handle. */
export async function prepareControlledSyntheticPilot(): Promise<object> {
  if (arguments.length !== 0) throw Error('controlled_runtime_authority_required')
  const captured = new Map<string, string>()
  const record = (path: string, utf8: string) => {
    if (!/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9_./@-]+$/.test(path) || path.length > 220) throw Error('controlled_runtime_path_denied')
    const prior = captured.get(path)
    if (prior !== undefined && prior !== utf8) throw Error('controlled_runtime_dependency_changed')
    captured.set(path, utf8)
    if (captured.size > 512) throw Error('controlled_runtime_input_bound')
  }
  const read = (path: string) => {
    const name = relative(root, path).replaceAll('\\', '/')
    const prior = captured.get(name)
    if (prior !== undefined) return prior
    const utf8 = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path))
    record(name, utf8); return utf8
  }
  // Lock/package configuration is evidence, while the actual build input bytes
  // below are authoritative for this invocation, including every loaded package.
  read(resolve(root, 'package.json')); read(resolve(root, 'package-lock.json'))
  const tsconfig = read(resolve(root, 'tsconfig.json'))
  const result = await build({
    absWorkingDir: root, entryPoints: [entryRelative], bundle: true,
    platform: 'node', target: 'node22', format: 'cjs', mainFields: ['module', 'main'],
    minify: true, sourcemap: false, legalComments: 'none', charset: 'utf8',
    write: false, metafile: true, logLevel: 'silent', preserveSymlinks: true,
    tsconfigRaw: tsconfig,
    plugins: [{ name: 'captured-implementation-only', setup(builder) {
      builder.onResolve({ filter: /controlled-runtime-context/ }, args => {
        if (args.importer !== resolve(root, entryRelative) || args.path !== './controlled-runtime-context') throw Error('controlled_runtime_context_import_denied')
        return { path: resolve(root, contextRelative) }
      })
      builder.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'controlled' }))
      builder.onLoad({ filter: /.*/, namespace: 'controlled' }, () => {
        record('controlled-build/server-only.js', markerSource)
        return { contents: markerSource, loader: 'js' }
      })
      builder.onLoad({ filter: /.*/, namespace: 'file' }, args => {
        const source = read(args.path)
        for (let directory = dirname(args.path); directory.startsWith(root); directory = dirname(directory)) {
          const metadata = resolve(directory, 'package.json')
          if (existsSync(metadata)) read(metadata)
          if (directory === root) break
        }
        if (args.path === resolve(root, contextRelative)) {
          record('controlled-build/context.js', contextSource)
          return { contents: contextSource, loader: 'js' }
        }
        const extension = extname(args.path).slice(1)
        const loader: Loader = extension === 'json' ? 'json' : extension === 'ts' ? 'ts' : extension === 'tsx' ? 'tsx' : 'js'
        return { contents: source, loader }
      })
    } }],
  })
  if (result.outputFiles?.length !== 1 || !result.metafile) throw Error('controlled_runtime_build_failed')
  const runtimeImports = [...new Set(Object.values(result.metafile.outputs).flatMap(o => o.imports.filter(i => i.external).map(i => i.path)))].sort(order)
  if (runtimeImports.some(name => !(externals as readonly string[]).includes(name))) throw Error('controlled_runtime_external_denied')
  // All loaded source/dependency bytes must still equal the bytes used to build.
  // Later changes are harmless: the prepared handle owns its captured output.
  for (const [path, utf8] of captured) {
    if (!path.startsWith('controlled-build/') && readFileSync(resolve(root, path), 'utf8') !== utf8) throw Error('controlled_runtime_dependency_changed')
  }
  const files: CapturedFile[] = []
  const inputs = [...captured].sort(([a], [b]) => order(a, b)).map(([path, source]) => capturedParts(path, source, files))
  const output = capturedParts('controlled-build/pilot.cjs', result.outputFiles[0]!.text, files)
  files.push(Object.freeze({ path: 'controlled-build/worker.cjs', utf8: bootstrap }))
  files.push(Object.freeze({ path: 'controlled-build/build.json', utf8: JSON.stringify({
    schema: 'ot-controlled-build-v1', builder: { name: 'esbuild', version: esbuildVersion },
    options: { platform: 'node', target: 'node22', format: 'cjs', mainFields: ['module', 'main'],
      minify: true, sourcemap: false, legalComments: 'none', charset: 'utf8', preserveSymlinks: true },
    runtime: { node: process.version, versions: process.versions, platform: process.platform, arch: process.arch },
    inputs, output, workerSha256: hash(bootstrap), externals: runtimeImports,
    substitutions: [{ input: contextRelative, loaded: 'controlled-build/context.js' },
      { input: 'server-only', loaded: 'controlled-build/server-only.js' }],
    // Metafile explains which captured inputs contributed bytes to emitted code.
    graph: result.metafile,
  }) }))
  files.sort((a, b) => order(a.path, b.path))
  if (files.reduce((sum, file) => sum + Buffer.byteLength(file.utf8), 0) > 5_000_000) throw Error('controlled_runtime_snapshot_bound')
  const snapshot: ControlledImplementationSnapshot = Object.freeze({ schema: 'ot-controlled-implementation-snapshot-v1', files: Object.freeze(files) })
  const handle = Object.freeze(Object.create(null) as object)
  prepared.set(handle, Object.freeze({ snapshot, bootstrap }))
  return handle
}

/** Forged, cloned, foreign, reused and closed handles cannot start a worker. */
export async function executePreparedControlledSyntheticPilot(handle: unknown, mode: PilotMode, fault: PilotFault = 'none'): Promise<PilotResult> {
  const captured = handle !== null && typeof handle === 'object' ? prepared.get(handle) : undefined
  if (!captured) throw Error('controlled_runtime_authority_required')
  prepared.delete(handle as object)
  if (arguments.length > 3 || (mode !== 'primary' && mode !== 'composed') || !CONTROLLED_PILOT_FAULTS.includes(fault)) throw Error('controlled_runtime_authority_required')
  return new Promise<PilotResult>((resolveResult, reject) => {
    const worker = new Worker(captured.bootstrap, { eval: true, execArgv: [], env: {},
      workerData: { snapshot: captured.snapshot, mode, fault }, stdout: true, stderr: true,
      resourceLimits: { maxOldGenerationSizeMb: 256 } })
    worker.stdout.resume(); worker.stderr.resume()
    let settled = false
    const finish = (result?: PilotResult) => {
      if (settled) return
      settled = true; clearTimeout(timeout); void worker.terminate()
      if (result) resolveResult(result)
      else reject(Error('controlled_runtime_execution_failed'))
    }
    const timeout = setTimeout(() => finish(), 30_000)
    worker.once('message', (message: { ok: boolean; value?: PilotResult }) => finish(message.ok ? message.value : undefined))
    worker.once('error', () => finish())
    worker.once('exit', () => finish())
  })
}

export async function runControlledSyntheticPilot(mode: PilotMode, fault: PilotFault = 'none'): Promise<PilotResult> {
  if (arguments.length > 2) throw Error('controlled_runtime_authority_required')
  return executePreparedControlledSyntheticPilot(await prepareControlledSyntheticPilot(), mode, fault)
}
