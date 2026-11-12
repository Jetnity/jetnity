import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import net from 'node:net'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'

import { loadFixtureModule } from '../../scripts/official-truth-ch-de-application-pilot-1/fixtures'
import { AA_REVISION_PROBE_V1_POLICY as policy } from './official-truth-aa-revision-probe-1-policy'
import {
  probeOfficialTruthAaReviewedRevisionV1,
  type OfficialTruthAaRevisionProbeV1Result,
  type OfficialTruthServerOwnedRetrievalLookup,
} from './official-truth-server-owned-retrieval'
import { AA_CH_DE_VISA_REVIEWED_SOURCE_CANDIDATE as reviewed } from './official-truth-ch-de-aa-visa-mapping-candidate-1/reviewed-source'
import * as fingerprint from './official-truth-source-fingerprint-v2'
import { chDeAaS1VisaRowResearchFromHtml } from './official-truth-ch-de-aa-s1-visa-row-research-server'

const readerPath = 'lib/readiness/official-truth-server-owned-retrieval.ts'
const testPath = 'lib/readiness/official-truth-aa-revision-probe-1.test.ts'
const reviewedPath = 'lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/reviewed-source.ts'
const legacyNativePath = 'scripts/db/official-truth-accepted-store-trip-integration-1/native-loader.ts'
const legacyProducerPath = 'lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts'
const legacyR2Path = 'lib/readiness/official-truth-content-identity-r2.test.ts'
const legacyProofPins = [
  { path: legacyNativePath, bytes: 6_501, sha256: '49ab7d7c68afcc30d80251db85e47041e2962f0c83cecf7f63964ce64aa4b298' },
  { path: legacyProducerPath, bytes: 9_176, sha256: '74a83b4b62711da43f4f6efdf94e4dd162bfcad5c06af253af3300dd59a27572' },
  { path: legacyR2Path, bytes: 41_838, sha256: 'be7a0b62e55c557faf05963befd5b717b7ea245bc71d2a85eb4fd0d3f5225c16' },
] as const
const entry = 'probeOfficialTruthAaReviewedRevisionV1'
const sentinel = 'SYNTHETIC_PRIVATE_HTML_HEADER_COOKIE_ERROR_SENTINEL'
const workspace = '/aa-probe-fixture/workspace'
const temp = '/aa-probe-fixture/temp'
const eventPath = temp + '/_github_workflow/event.json'
const headSha = 'c'.repeat(40), checkoutSha = 'd'.repeat(40)
const sha = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex')
const sourceBytes = new Map(policy.sourceInventory.map(pin => [pin.path, fs.readFileSync(pin.path)] as const))

function html(extra = '', row = '<tr><td>Schweiz</td><td>Nein</td></tr>'): string {
  return [
    '<!doctype html><html><head><title>SYNTHETIC RESEARCH FIXTURE ONLY</title></head><body>',
    '<h1>Übersicht zur Visumpflicht bzw. -freiheit bei Einreise in die Bundesrepublik Deutschland</h1>',
    '<table><thead><tr><th>Staaten und Gebietskörperschaften</th><th>Visumpflicht für Deutschland: Ja/Nein</th></tr></thead>',
    '<tbody>' + row + '</tbody></table><p>' + sentinel + '</p>',
    '<p>' + 'x'.repeat(70_000) + '</p>' + extra,
    '</body></html>',
  ].join('\n')
}
const baselineBody = html()
const baselinePin = fingerprint.officialTruthSourceFingerprintV2(baselineBody, policy.binding)
assert(baselinePin)

function eventValue(): Record<string, unknown> {
  const repository = { id: policy.repositoryId, full_name: policy.repository }
  return {
    action: 'opened', number: 17, repository,
    pull_request: {
      number: 17, head: { ref: policy.headBranch, sha: headSha, repo: { ...repository } },
      base: { ref: policy.baseBranch, sha: policy.baseSha, repo: { ...repository } },
    },
  }
}
function environment(): Record<string, unknown> {
  return {
    GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'pull_request', GITHUB_JOB: 'verify',
    GITHUB_RUN_ATTEMPT: '1', GITHUB_RUN_NUMBER: '1', GITHUB_RUN_ID: '43150000001',
    GITHUB_REPOSITORY: policy.repository, GITHUB_REPOSITORY_ID: String(policy.repositoryId),
    GITHUB_WORKFLOW: 'CI', GITHUB_HEAD_REF: policy.headBranch, GITHUB_BASE_REF: 'main',
    GITHUB_REF: 'refs/pull/17/merge', GITHUB_SHA: checkoutSha,
    GITHUB_WORKFLOW_REF: policy.repository + '/.github/workflows/ci.yml@refs/pull/17/merge',
    GITHUB_WORKSPACE: workspace, RUNNER_TEMP: temp, GITHUB_EVENT_PATH: eventPath,
  }
}

type FsFault = 'symlink' | 'directory' | 'hardlink' | 'growth' | 'claim_sync' | 'claim_close'
class FixtureFs {
  readonly files = new Map<string, Buffer>()
  readonly directories = new Set<string>(['/', workspace, temp])
  readonly descriptors = new Map<number, { path: string; position: number; claim: boolean }>()
  readonly inodes = new Map<string, number>()
  nextFd = 30
  claimCreates = 0
  claimModes: number[] = []
  fault: FsFault | null = null
  faultPath = ''
  constructor(event: Buffer) {
    for (const [path, bytes] of sourceBytes) this.files.set(join(workspace, path), bytes)
    this.files.set(eventPath, event)
    for (const file of this.files.keys()) {
      let parent = dirname(file)
      while (parent !== '/') { this.directories.add(parent); parent = dirname(parent) }
    }
  }
  stat(path: string) {
    const file = this.files.get(path), directory = this.directories.has(path)
    if (!file && !directory) throw new Error(sentinel)
    if (!this.inodes.has(path)) this.inodes.set(path, this.inodes.size + 1)
    const bad = path === this.faultPath
    return {
      dev: 1, ino: this.inodes.get(path)!, size: file?.length ?? 0,
      nlink: bad && this.fault === 'hardlink' ? 2 : 1, mtimeMs: 1, ctimeMs: 1,
      isFile: () => !!file && !(bad && this.fault === 'directory'),
      isDirectory: () => directory || (bad && this.fault === 'directory'),
      isSymbolicLink: () => bad && this.fault === 'symlink',
    }
  }
  module() {
    return {
      constants: fs.constants,
      realpathSync: (path: string) => {
        this.stat(path)
        return path === this.faultPath && this.fault === 'symlink' ? path + '-symlink-target' : path
      },
      lstatSync: (path: string) => this.stat(path),
      fstatSync: (fd: number) => this.stat(this.descriptors.get(fd)!.path),
      openSync: (path: string, flags: number, mode?: number) => {
        assert.equal(flags & fs.constants.O_NOFOLLOW, fs.constants.O_NOFOLLOW)
        const claim = (flags & fs.constants.O_EXCL) !== 0
        if (claim) {
          assert.equal(flags & fs.constants.O_CREAT, fs.constants.O_CREAT)
          assert.equal(flags & fs.constants.O_WRONLY, fs.constants.O_WRONLY)
          if (this.files.has(path) || this.directories.has(path)) throw new Error(sentinel)
          this.files.set(path, Buffer.alloc(0))
          this.claimCreates += 1
          this.claimModes.push(mode!)
        } else this.stat(path)
        const fd = ++this.nextFd
        this.descriptors.set(fd, { path, position: 0, claim })
        return fd
      },
      readSync: (fd: number, target: Buffer, offset: number, length: number) => {
        const record = this.descriptors.get(fd)!
        if (record.path === this.faultPath && this.fault === 'growth' && record.position === 0) {
          this.files.set(record.path, Buffer.concat([this.files.get(record.path)!, Buffer.from('x')]))
        }
        const file = this.files.get(record.path)!
        const count = Math.min(length, Math.max(0, file.length - record.position))
        file.copy(target, offset, record.position, record.position + count)
        record.position += count
        return count
      },
      writeSync: (fd: number, bytes: Buffer, offset: number, length: number) => {
        const record = this.descriptors.get(fd)!
        assert.equal(record.claim, true)
        this.files.set(record.path, Buffer.concat([this.files.get(record.path)!, bytes.subarray(offset, offset + length)]))
        return length
      },
      fsyncSync: (fd: number) => {
        assert.equal(this.descriptors.get(fd)?.claim, true)
        if (this.fault === 'claim_sync') throw new Error(sentinel)
      },
      closeSync: (fd: number) => {
        const record = this.descriptors.get(fd)!
        this.descriptors.delete(fd)
        if (record.claim && this.fault === 'claim_close') throw new Error(sentinel)
      },
    }
  }
}

type Scenario = {
  body?: string | Buffer
  expectedBody?: string
  status?: number
  headers?: Record<string, string | string[]>
  framing?: boolean | 'missing' | 'throws'
  streamThrows?: boolean
  dns?: 'private' | 'error' | 'empty'
  timer?: 'before_dns' | 'during_body'
  clock?: 'after_headers' | 'after_body' | 'after_hash' | 'after_s1'
  s1Throws?: boolean
  event?: Record<string, unknown>
  eventBytes?: Buffer
  env?: Record<string, unknown>
  policy?: Record<string, unknown>
  fs?: FixtureFs
  fault?: FsFault
  faultPath?: string
}
type RequestOptions = {
  method: string; protocol: string; hostname: string; port: number; path: string
  headers: Record<string, string>; lookup: OfficialTruthServerOwnedRetrievalLookup
  servername: string; rejectUnauthorized: boolean
}

function fixture(options: Scenario = {}) {
  const files = options.fs ?? new FixtureFs(options.eventBytes ?? Buffer.from(JSON.stringify(options.event ?? eventValue())))
  files.fault = options.fault ?? files.fault
  files.faultPath = options.faultPath ?? files.faultPath
  const state = {
    dns: 0, requests: [] as RequestOptions[], destroyed: 0, agentsDestroyed: 0,
    timerCleared: false, now: 0, s1: 0, bodyChunks: 0, timerCallback: null as (() => void) | null,
  }
  const value = options.body ?? baselineBody
  const bytes = typeof value === 'string' ? Buffer.from(value, 'utf8') : value
  const expectedPin = fingerprint.officialTruthSourceFingerprintV2(options.expectedBody ?? baselineBody, policy.binding)
  assert(expectedPin)
  class FakeAgent {
    constructor(settings: unknown) { assert.deepEqual(settings, { keepAlive: false, maxSockets: 1 }) }
    destroy() { state.agentsDestroyed += 1 }
  }
  const fakeHttps = {
    Agent: FakeAgent,
    request: (request: RequestOptions, callback: (message: unknown) => void) => {
      state.requests.push(request)
      const listeners = new Map<string, (error?: NodeJS.ErrnoException) => void>()
      let ended = false, destroyed = false, bodyFinished = false
      const close = () => { if (!ended) { ended = true; listeners.get('close')?.() } }
      const message = {
        statusCode: options.status ?? 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'content-length': String(bytes.byteLength), 'set-cookie': sentinel,
          ...options.headers,
        },
        get complete(): boolean | undefined {
          if (options.framing === 'throws') throw new Error(sentinel)
          if (options.framing === 'missing') return undefined
          return bodyFinished && (options.framing ?? true)
        },
        destroy() { destroyed = true; state.destroyed += 1; close() },
        async *[Symbol.asyncIterator]() {
          try {
            if (options.timer === 'during_body') {
              state.bodyChunks += 1
              yield bytes.subarray(0, Math.min(5, bytes.byteLength))
              state.timerCallback?.()
              throw new Error(sentinel)
            }
            if (options.streamThrows) {
              state.bodyChunks += 1
              yield bytes.subarray(0, Math.min(20, bytes.byteLength))
              throw new Error(sentinel)
            }
            if (!destroyed && bytes.byteLength) {
              state.bodyChunks += 1
              yield bytes
            }
            bodyFinished = true
            if (options.clock === 'after_body') state.now = policy.timeoutMs
          } finally { close() }
        },
      }
      return {
        on(name: string, listener: (error?: NodeJS.ErrnoException) => void) { listeners.set(name, listener); return this },
        destroy() { destroyed = true; state.destroyed += 1; close() },
        end() {
          if (options.timer === 'before_dns') { state.timerCallback?.(); return }
          request.lookup(request.hostname, {}, error => {
            if (error) { listeners.get('error')?.(error); close(); return }
            if (options.clock === 'after_headers') state.now = policy.timeoutMs
            if (!destroyed) callback(message)
          })
        },
      }
    },
  }
  const module = loadFixtureModule<{
    probeOfficialTruthAaReviewedRevisionV1: typeof probeOfficialTruthAaReviewedRevisionV1
  }>(readerPath, {
    'node:fs': files.module(),
    'node:path': { dirname, join, relative, resolve, isAbsolute: (path: string) => path.startsWith('/'), sep: '/' },
    'node:process': { env: { ...environment(), ...options.env }, cwd: () => workspace },
    'node:perf_hooks': { performance: { now: () => state.now } },
    'node:timers': {
      setTimeout: (callback: () => void, milliseconds: number) => {
        assert.equal(milliseconds, 10_000)
        state.timerCallback = callback
        return { synthetic: true }
      },
      clearTimeout: () => { state.timerCleared = true },
    },
    'node:dns': {
      lookup: (hostname: string, settings: unknown, callback: (error: Error | null, addresses?: unknown) => void) => {
        state.dns += 1
        assert.equal(hostname, 'www.auswaertiges-amt.de')
        assert.deepEqual(settings, { all: true, verbatim: true })
        if (options.dns === 'error') callback(new Error(sentinel))
        else callback(null, options.dns === 'empty' ? [] : [{ address: options.dns === 'private' ? '127.0.0.1' : '8.8.8.8', family: 4 }])
      },
    },
    'node:net': { default: net },
    'node:https': { default: fakeHttps },
    '@/lib/readiness/official-truth-aa-revision-probe-1-policy': {
      AA_REVISION_PROBE_V1_POLICY: { ...policy, runNumber: 1, expectedV2Pin: expectedPin, ...options.policy },
    },
    '@/lib/readiness/official-truth-source-fingerprint-v2': {
      ...fingerprint,
      officialTruthSourceFingerprintV2: (body: unknown, binding: unknown) => {
        const hash = fingerprint.officialTruthSourceFingerprintV2(body, binding)
        if (options.clock === 'after_hash') state.now = policy.timeoutMs
        return hash
      },
    },
    '@/lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server': {
      chDeAaS1VisaRowResearchFromHtml: (body: unknown) => {
        state.s1 += 1
        if (options.s1Throws) throw new Error(sentinel)
        const result = chDeAaS1VisaRowResearchFromHtml(body)
        if (options.clock === 'after_s1') state.now = policy.timeoutMs
        return result
      },
    },
    '@/lib/readiness/official-truth-source-catalog-server': {
      quellenKatalogLesen: () => { throw new Error('SYNTHETIC_CATALOG_CALL_FORBIDDEN') },
    },
  })
  return { invoke: module.probeOfficialTruthAaReviewedRevisionV1, state, files }
}

const blockedReasons: readonly string[] = [
  'unarmed', 'caller_input_forbidden', 'ci_not_selected', 'event_invalid', 'source_inventory_invalid',
  'claim_unavailable', 'unexpected_failure', 'redirect_rejected', 'http_status', 'http_failed',
  'address_not_permitted', 'dns_failed', 'dns_empty', 'timeout', 'response_too_large',
  'content_type_mismatch', 'framing_unverified', 'invalid_utf8', 'empty_body',
  'protocol_not_v2', 'fingerprint_refused', 'invalid_observation_time',
]
const s1Reasons: readonly string[] = [
  'invalid_html', 'snapshot_over_limit', 'invalid_document_structure', 'missing_exact_visa_table',
  'ambiguous_visa_table', 'swiss_row_missing', 'ambiguous_swiss_row', 'qualified_or_conflicting_swiss_row',
]
const resultKeys = [
  'acceptedEvidence', 'acceptedRules', 'ci', 'comparison', 'contentType', 'databaseWrites',
  'fingerprintProtocol', 'fullBodyByteCount', 'legalApplicability', 'networkAttempted',
  'observedAt', 'phase', 'productionAuthority', 'reason', 'researchOnly', 'reviewedSourceBlob',
  's1', 'schema', 'sourceCustody', 'sourceUrl', 'task', 'taskVersion',
].sort()
function finiteResult(result: OfficialTruthAaRevisionProbeV1Result): void {
  assert.deepEqual(Object.keys(result).sort(), resultKeys)
  assert.equal(result.schema, 'jetnity.aa-revision-probe.v1')
  assert.equal(result.task, 'CH-DE-AA-REVISION-PROBE-1')
  assert.equal(result.taskVersion, 1)
  assert.equal(result.sourceUrl, policy.url)
  assert.equal(result.reviewedSourceBlob, policy.reviewedSourceBlob)
  assert.equal(result.researchOnly, true)
  assert.equal(result.sourceCustody, 'not_verified')
  assert.equal(result.legalApplicability, 'not_verified')
  assert.equal(result.productionAuthority, false)
  assert.equal(result.acceptedEvidence, 0)
  assert.equal(result.acceptedRules, 0)
  assert.equal(result.databaseWrites, 0)
  assert(Buffer.byteLength(JSON.stringify(result), 'utf8') <= 2_048)
  assert.equal(JSON.stringify(result).includes(sentinel), false)
  assert.equal(JSON.stringify(result).includes('<html'), false)
  assert.equal(JSON.stringify(result).includes('"sourceSnapshot"'), false)
  assert.equal(JSON.stringify(result).includes('"sourceContentHash"'), false)
  if (result.ci) {
    assert.deepEqual(Object.keys(result.ci).sort(), ['attempt', 'checkoutSha', 'headSha', 'pullRequest', 'runId', 'runNumber'])
    assert.match(result.ci.headSha, /^[0-9a-f]{40}$/)
    assert.match(result.ci.checkoutSha, /^[0-9a-f]{40}$/)
    assert.match(result.ci.runId, /^[1-9][0-9]{0,14}$/)
    assert.equal(result.ci.attempt, 1)
    assert(Number.isSafeInteger(result.ci.runNumber) && result.ci.runNumber > 0)
    assert(Number.isSafeInteger(result.ci.pullRequest) && result.ci.pullRequest > 0)
  }
  if (result.phase === 'blocked') {
    assert(blockedReasons.includes(result.reason))
    assert(result.networkAttempted === true || result.networkAttempted === false || result.networkAttempted === null)
    assert.equal(result.comparison, 'UNKNOWN')
    assert.equal(result.contentType, null)
    assert.equal(result.fullBodyByteCount, null)
    assert.equal(result.fingerprintProtocol, null)
    assert.equal(result.observedAt, null)
    assert.equal(result.s1, null)
  } else {
    assert.equal(result.phase, 'observed')
    assert.equal(result.reason, null)
    assert.equal(result.networkAttempted, true)
    assert.equal(result.contentType, 'text/html')
    assert.equal(result.fingerprintProtocol, 2)
    assert(Number.isSafeInteger(result.fullBodyByteCount) && result.fullBodyByteCount > 65_536 && result.fullBodyByteCount <= 131_072)
    assert.match(result.observedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    assert(result.comparison === 'MATCH' || result.comparison === 'MISMATCH')
    if (result.comparison === 'MISMATCH') assert.equal(result.s1, null)
    else {
      assert(result.s1)
      assert.deepEqual(Object.keys(result.s1).sort(), ['reason', 'status'])
      assert(['recognized', 'refused'].includes(result.s1.status))
      if (result.s1.status === 'recognized') assert.equal(result.s1.reason, null)
      else assert(s1Reasons.includes(result.s1.reason))
    }
  }
}
async function refusal(f: ReturnType<typeof fixture>, reason: string, noNetwork = true): Promise<void> {
  const result = await f.invoke()
  finiteResult(result)
  assert.equal(result.phase, 'blocked')
  assert.equal(result.reason, reason)
  if (noNetwork) {
    assert.equal(result.networkAttempted, false)
    assert.equal(f.state.dns, 0)
    assert.equal(f.state.requests.length, 0)
  } else {
    assert.equal(f.state.requests.length, 1)
    assert.equal(f.state.timerCleared, true)
    assert(f.state.agentsDestroyed > 0)
  }
  assert.equal(f.files.descriptors.size, 0)
}

function staticString(node: ts.Node): string | null {
  if (ts.isStringLiteralLike(node)) return node.text
  if (ts.isParenthesizedExpression(node)) return staticString(node.expression)
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text
    for (const span of node.templateSpans) {
      const middle = staticString(span.expression)
      if (middle === null) return null
      value += middle + span.literal.text
    }
    return value
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = staticString(node.left), right = staticString(node.right)
    if (left !== null && right !== null) return left + right
  }
  return null
}
function readerModule(file: string, value: string): boolean {
  let clean = value.replace(/[?#].*$/, '')
  try { clean = clean.startsWith('file:') ? fileURLToPath(clean) : decodeURIComponent(clean) }
  catch { return false }
  clean = clean.replace(/\.[cm]?[jt]sx?$/, '')
  const target = clean.startsWith('@/') ? resolve(clean.slice(2))
    : clean.startsWith('.') ? resolve(dirname(file), clean) : resolve(clean)
  return target === resolve(readerPath.replace(/\.ts$/, ''))
}
function importBoundary(file: string, source: string): void {
  const owned = file === readerPath || file === testPath
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
  let passiveNamespaces = 0, r2ReaderImports = 0
  if (file === legacyNativePath) {
    assert.equal(Buffer.byteLength(source, 'utf8'), legacyProofPins[0].bytes)
    assert.equal(sha(source), legacyProofPins[0].sha256)
  }
  const visit = (node: ts.Node): void => {
    if (!owned && ((ts.isIdentifier(node) && node.text === entry) || staticString(node) === entry)) {
      assert.fail('AA probe entry may only be consumed by its exact test')
    }
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)
      && readerModule(file, node.moduleSpecifier.text) && !node.importClause?.isTypeOnly) {
      const clause = node.importClause
      assert(clause && !clause.name && clause.namedBindings, 'No default or side-effect Reader forwarding')
      if (ts.isNamespaceImport(clause.namedBindings)) {
        // TASK V1/A1: one exact, unchanged private test-port transport. No file skip.
        assert.equal(file, legacyNativePath)
        assert.equal(clause.namedBindings.name.text, 'retrieval')
        passiveNamespaces += 1
      } else {
        assert(ts.isNamedImports(clause.namedBindings))
        for (const name of clause.namedBindings.elements) {
          if ((name.propertyName?.text ?? name.name.text) === entry) {
            assert.equal(file, testPath)
            assert.equal(name.propertyName, undefined)
            assert.equal(name.name.text, entry)
          }
        }
      }
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
      && readerModule(file, node.moduleSpecifier.text) && !node.isTypeOnly) {
      assert(node.exportClause && ts.isNamedExports(node.exportClause), 'Reader wildcard forwarding is forbidden')
      for (const name of node.exportClause.elements) assert.notEqual(name.propertyName?.text ?? name.name.text, entry)
    }
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)
      && node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)
      && readerModule(file, node.moduleReference.expression.text)) {
      assert.fail('Reader import-equals namespace forwarding is forbidden')
    }
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
      || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      const target = node.arguments[0] ? staticString(node.arguments[0]) : null
      if (target !== null && readerModule(file, target)) {
        // Preserve an existing narrow R2 test form, never a namespace/rest/aliased binding.
        const awaited = node.parent
        const declaration = ts.isAwaitExpression(awaited) ? awaited.parent : null
        assert(node.expression.kind === ts.SyntaxKind.ImportKeyword && file === legacyR2Path
          && declaration && ts.isVariableDeclaration(declaration) && ts.isObjectBindingPattern(declaration.name),
        'Dynamic Reader loading must remain a directly awaited named test destructuring')
        r2ReaderImports += 1
        assert.equal(declaration.name.elements.length, 1)
        for (const element of declaration.name.elements) {
          assert(!element.dotDotDotToken && !element.propertyName && !element.initializer && ts.isIdentifier(element.name),
            'No rest, alias, default or nested dynamic Reader binding')
          assert.equal(element.name.text, 'decideOfficialTruthServerOwnedRetrieval')
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  if (file === legacyNativePath) assert.equal(passiveNamespaces, 1)
  if (file === legacyR2Path) assert.equal(r2ReaderImports, 1)
}
function astNodes(root: ts.Node): ts.Node[] {
  const result: ts.Node[] = []
  const visit = (node: ts.Node): void => { result.push(node); ts.forEachChild(node, visit) }
  visit(root)
  return result
}
function expressionWithoutTypes(value: ts.Expression): ts.Expression {
  while (ts.isAsExpression(value) || ts.isParenthesizedExpression(value)) value = value.expression
  return value
}
function legacyPrivatePortBoundary(): void {
  for (const pin of legacyProofPins) {
    const actual = sourceBytes.get(pin.path)
    assert(actual, 'legacy proof inventory must be complete')
    assert.equal(actual.byteLength, pin.bytes)
    assert.equal(sha(actual), pin.sha256)
    const selected = policy.sourceInventory.find(row => row.path === pin.path)
    assert(selected)
    assert.equal(selected.bytes, pin.bytes)
    assert.equal(selected.sha256, pin.sha256)
  }
  const nativeTree = ts.createSourceFile(legacyNativePath,
    sourceBytes.get(legacyNativePath)!.toString('utf8'), ts.ScriptTarget.Latest, true)
  const runtime = nativeTree.statements.find(statement =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === 'nativeProductRuntime')
  assert(runtime && ts.isFunctionDeclaration(runtime) && runtime.body)
  const nodes = astNodes(runtime.body)
  const ports = nodes.filter(node => ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'sourcePort')
  assert.equal(ports.length, 1)
  const port = ports[0]!
  assert(ts.isVariableDeclaration(port) && port.initializer && ts.isObjectLiteralExpression(port.initializer))
  assert.equal(port.parent.parent.parent, runtime.body)
  assert.equal(port.initializer.properties.length, 2)
  const spread = port.initializer.properties[0]!, replacement = port.initializer.properties[1]!
  assert(ts.isSpreadAssignment(spread) && ts.isIdentifier(spread.expression) && spread.expression.text === 'retrieval')
  assert(ts.isPropertyAssignment(replacement) && ts.isIdentifier(replacement.name)
    && replacement.name.text === 'loadOfficialTruthServerOwnedRetrievalWithCatalogTransport')
  const loads = runtime.body.statements.filter(statement =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === 'load')
  assert.equal(loads.length, 1)
  const load = loads[0]!
  assert(ts.isFunctionDeclaration(load) && load.body && !load.modifiers?.length)
  const portNames = nodes.filter(node => ts.isIdentifier(node) && node.text === 'sourcePort')
  assert.equal(portNames.length, 2, 'private declaration plus internal Reader-return only')
  const portReturns = astNodes(load.body).filter(node =>
    ts.isReturnStatement(node) && node.expression && ts.isIdentifier(node.expression) && node.expression.text === 'sourcePort')
  assert.equal(portReturns.length, 1)
  const portReturn = portReturns[0]!
  assert(ts.isIfStatement(portReturn.parent) && portReturn.parent.thenStatement === portReturn)
  const condition = portReturn.parent.expression
  assert(ts.isBinaryExpression(condition) && condition.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
    && ts.isIdentifier(condition.left) && condition.left.text === 'target'
    && ts.isCallExpression(condition.right) && ts.isIdentifier(condition.right.expression)
    && condition.right.expression.text === 'resolve' && condition.right.arguments.length === 1)
  assert.equal(staticString(condition.right.arguments[0]!), 'lib/readiness/official-truth-server-owned-retrieval')
  const publicReturns = runtime.body.statements.filter(ts.isReturnStatement)
  assert.equal(publicReturns.length, 1)
  const publicReturn = publicReturns[0]!
  assert(publicReturn.expression && ts.isObjectLiteralExpression(publicReturn.expression))
  const expectedModules: Record<string, string> = {
    producer: 'lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts',
    reader: 'lib/readiness/official-truth-accepted-store-trip-integration-1/reader-server.ts',
    request: 'lib/readiness/official-truth-accepted-store-trip-integration-1/request-server.ts',
    database: 'lib/readiness/official-truth-accepted-store-trip-integration-1/database-server.ts',
    lifetime: 'lib/readiness/official-truth-accepted-store-trip-integration-1/lifetime-server.ts',
    archive: 'lib/readiness/official-truth-accepted-store-trip-integration-1/archive-server.ts',
    reproof: 'lib/readiness/official-truth-accepted-store-trip-integration-1/reproof-server.ts',
    custody: 'lib/readiness/official-truth-accepted-store-trip-integration-1/custody-server.ts',
    trips: 'lib/trips/daten.ts', factory: 'lib/supabase/server.ts',
    context: 'lib/readiness/official-truth-ch-de-application-pilot-1/context.ts',
    tripBinding: 'lib/readiness/official-truth-accepted-store-trip-integration-1/trip-binding-server.ts',
    rate: 'lib/readiness/rate-limit.ts',
  }
  const returned: Record<string, string> = {}
  for (const property of publicReturn.expression.properties) {
    assert(ts.isPropertyAssignment(property) && ts.isIdentifier(property.name), 'no public namespace/port spread or shorthand')
    const call = expressionWithoutTypes(property.initializer)
    assert(ts.isCallExpression(call) && ts.isIdentifier(call.expression) && call.expression.text === 'load' && call.arguments.length === 1)
    const argument = call.arguments[0]!
    let path = staticString(argument)
    if (path === null && ts.isBinaryExpression(argument) && argument.operatorToken.kind === ts.SyntaxKind.PlusToken
      && ts.isIdentifier(argument.left) && argument.left.text === 'root') {
      const suffix = staticString(argument.right)
      assert(suffix)
      path = 'lib/readiness/official-truth-accepted-store-trip-integration-1/' + suffix
    }
    assert(path)
    assert.notEqual(path, readerPath)
    assert.equal(Object.hasOwn(returned, property.name.text), false)
    returned[property.name.text] = path
  }
  assert.deepEqual(returned, expectedModules)
  const producerTree = ts.createSourceFile(legacyProducerPath,
    sourceBytes.get(legacyProducerPath)!.toString('utf8'), ts.ScriptTarget.Latest, true)
  const imports = producerTree.statements.filter(statement => ts.isImportDeclaration(statement)
    && ts.isStringLiteral(statement.moduleSpecifier) && readerModule(legacyProducerPath, statement.moduleSpecifier.text))
  assert.equal(imports.length, 1)
  const selected = imports[0]!
  assert(ts.isImportDeclaration(selected) && selected.importClause && !selected.importClause.isTypeOnly
    && !selected.importClause.name && selected.importClause.namedBindings
    && ts.isNamedImports(selected.importClause.namedBindings))
  const elements = selected.importClause.namedBindings.elements
  assert.equal(elements.length, 1)
  assert.equal(elements[0]!.propertyName, undefined)
  assert.equal(elements[0]!.name.text, 'loadOfficialTruthServerOwnedRetrievalWithCatalogTransport')
}
function importInventory(): void {
  for (const required of ['.cursor', '.github', '.jetnity', 'app', 'apps', 'components', 'data', 'docs', 'lib', 'public', 'scripts', 'styles', 'supabase', 'tests', 'types', 'widgets']) {
    assert(fs.statSync(required).isDirectory(), 'complete checkout required for probe import inventory')
    const walk = (directory: string) => {
      for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = join(directory, item.name).replace(/\\/g, '/')
        assert(!item.isSymbolicLink(), 'probe import inventory requires ordinary checkout entries')
        if (item.isDirectory()) walk(file)
        else if (item.isFile() && /\.[cm]?[jt]sx?$/.test(file)) importBoundary(file, fs.readFileSync(file, 'utf8'))
      }
    }
    walk(required)
  }
  for (const item of fs.readdirSync('.', { withFileTypes: true })) {
    if (item.isFile() && /\.[cm]?[jt]sx?$/.test(item.name)) {
      importBoundary(item.name, fs.readFileSync(item.name, 'utf8'))
    }
  }
  for (const source of [
    "import { probeOfficialTruthAaReviewedRevisionV1 as p } from '@/lib/readiness/official-truth-server-owned-retrieval'",
    "import * as reader from '@/lib/readiness/official-truth-server-owned-retrieval'",
    "import reader from '@/lib/readiness/official-truth-server-owned-retrieval'",
    "export * from '@/lib/readiness/official-truth-server-owned-retrieval'",
    "export { probeOfficialTruthAaReviewedRevisionV1 as x } from '@/lib/readiness/official-truth-server-owned-retrieval'",
    "void import('@/lib/readiness/official-truth-server-owned-' + 'retrieval')",
    "import r = require('@/lib/readiness/official-truth-server-owned-retrieval')",
    "import * as r from 'file://" + resolve(readerPath) + "'",
    "import * as r from '@/lib/readiness/official-truth-server-owned-%72etrieval.ts'",
    "const r = require('@/lib/readiness/official-truth-server-owned-retrieval')",
    "const name = 'probeOfficialTruthAa' + 'ReviewedRevisionV1'",
  ]) assert.throws(() => importBoundary('app/probe-forbidden.ts', source))
  assert.throws(() => importBoundary(testPath,
    "import { probeOfficialTruthAaReviewedRevisionV1 as renamed } from './official-truth-server-owned-retrieval'"))
  for (const source of [
    "const reader = await import('./official-truth-server-owned-retrieval')",
    "const { ...reader } = await import('./official-truth-server-owned-retrieval')",
    "const { decideOfficialTruthServerOwnedRetrieval: alias } = await import('./official-truth-server-owned-retrieval')",
  ]) assert.throws(() => importBoundary(legacyR2Path, source))
  assert.throws(() => importBoundary(legacyNativePath, sourceBytes.get(legacyNativePath)!.toString('utf8') + '\n'))
  assert.throws(() => importBoundary('lib/readiness/new-reader.test.ts',
    "const { decideOfficialTruthServerOwnedRetrieval } = await import('./official-truth-server-owned-retrieval')"))
  importBoundary(legacyR2Path,
    "const { decideOfficialTruthServerOwnedRetrieval } = await import('./official-truth-server-owned-retrieval')")
}

async function syntheticPreflight(): Promise<void> {
  assert(Object.isFrozen(policy) && Object.isFrozen(policy.binding) && Object.isFrozen(policy.sourceInventory))
  assert.equal(policy.url, reviewed.requestUrl)
  assert.equal(policy.url, reviewed.canonicalUrl)
  assert.equal(policy.url, reviewed.finalUrl)
  assert.equal(policy.expectedV2Pin, reviewed.sourceContentHash)
  assert.equal(reviewed.sourceFingerprintProtocol, 2)
  assert.deepEqual(policy.binding, { ...reviewed.binding, canonicalUrl: reviewed.canonicalUrl, contentType: reviewed.contentType })
  assert.equal(sha(fs.readFileSync(reviewedPath)), policy.reviewedSourceSha256)
  assert.equal(policy.reviewedSourceBlob, 'e00f71f993fe558d657ca409436ee62410869b25')
  assert.equal(policy.maxBytes, 131_072)
  assert.equal(policy.timeoutMs, 10_000)
  assert.equal(policy.sourceInventory.length, 13)
  for (const pin of policy.sourceInventory) {
    assert(Object.isFrozen(pin))
    const bytes = sourceBytes.get(pin.path)
    assert(bytes)
    assert.equal(bytes.byteLength, pin.bytes)
    assert.equal(sha(bytes), pin.sha256)
  }
  legacyPrivatePortBoundary()
  importInventory()

  for (const runNumber of [0, -1, 1.5, Number.NaN, '1', null]) {
    await refusal(fixture({ policy: { runNumber } }), 'unarmed')
  }
  const caller = fixture()
  const callerResult = await (caller.invoke as (...args: unknown[]) => Promise<OfficialTruthAaRevisionProbeV1Result>)({ url: sentinel })
  finiteResult(callerResult)
  assert.equal(callerResult.reason, 'caller_input_forbidden')
  assert.equal(caller.state.requests.length + caller.state.dns, 0)

  const wrongEnvironment: [string, unknown][] = [
    ['GITHUB_ACTIONS', 'false'], ['GITHUB_EVENT_NAME', 'push'], ['GITHUB_JOB', 'official_truth_v3_ui'],
    ['GITHUB_RUN_ATTEMPT', '2'], ['GITHUB_RUN_ATTEMPT', '01'], ['GITHUB_RUN_NUMBER', '2'],
    ['GITHUB_RUN_NUMBER', '1x'], ['GITHUB_RUN_NUMBER', '01'], ['GITHUB_RUN_NUMBER', 1],
    ['GITHUB_RUN_ID', '0'], ['GITHUB_RUN_ID', '9007199254740992'], ['GITHUB_REPOSITORY', 'foreign/repo'],
    ['GITHUB_REPOSITORY_ID', '1'], ['GITHUB_WORKFLOW', 'Other'], ['GITHUB_HEAD_REF', 'other'],
    ['GITHUB_BASE_REF', 'develop'], ['GITHUB_SHA', 'bad'], ['GITHUB_ACTIONS', undefined],
  ]
  for (const [key, value] of wrongEnvironment) await refusal(fixture({ env: { [key]: value } }), 'ci_not_selected')
  for (const [key, value] of [
    ['GITHUB_REF', 'refs/pull/18/merge'],
    ['GITHUB_WORKFLOW_REF', policy.repository + '/.github/workflows/other.yml@refs/pull/17/merge'],
    ['GITHUB_WORKSPACE', '/foreign'], ['GITHUB_EVENT_PATH', '/outside/event.json'],
  ]) await refusal(fixture({ env: { [key!]: value } }), 'event_invalid')

  const mutations: ((event: Record<string, unknown>) => void)[] = [
    e => { e.action = ['opened'] },
    e => { e.number = '17' },
    e => { e.repository = { id: 1, full_name: policy.repository } },
    e => { const pr = e.pull_request as Record<string, unknown>; pr.number = 18 },
    e => { const pr = e.pull_request as Record<string, unknown>; (pr.head as Record<string, unknown>).repo = { id: 1, full_name: 'fork/repo' } },
    e => { const pr = e.pull_request as Record<string, unknown>; (pr.base as Record<string, unknown>).repo = { id: 1, full_name: 'fork/repo' } },
    e => { const pr = e.pull_request as Record<string, unknown>; (pr.head as Record<string, unknown>).ref = 'other' },
    e => { const pr = e.pull_request as Record<string, unknown>; (pr.base as Record<string, unknown>).sha = 'f'.repeat(40) },
    e => { const pr = e.pull_request as Record<string, unknown>; (pr.base as Record<string, unknown>).ref = 'develop' },
    e => { const pr = e.pull_request as Record<string, unknown>; (pr.head as Record<string, unknown>).sha = 7 },
  ]
  for (const mutate of mutations) { const e = eventValue(); mutate(e); await refusal(fixture({ event: e }), 'event_invalid') }
  for (const bytes of [
    Buffer.from('{broken'), Buffer.from('[]'), Buffer.from([0xff, 0xfe]),
    Buffer.from('\ufeff' + JSON.stringify(eventValue())), Buffer.alloc(262_145, 32),
    Buffer.from(JSON.stringify(eventValue()).replace('"number":17', '"number":17,"number":17')),
    Buffer.from(JSON.stringify(eventValue()).replace('"number":17', '"number":17,"num\\u0062er":17')),
  ]) await refusal(fixture({ eventBytes: bytes }), 'event_invalid')
  for (const fault of ['symlink', 'directory', 'hardlink', 'growth'] as const) {
    await refusal(fixture({ fault, faultPath: eventPath }), 'event_invalid')
    await refusal(fixture({ fault, faultPath: join(workspace, readerPath) }), 'source_inventory_invalid')
  }
  await refusal(fixture({ fault: 'symlink', faultPath: dirname(join(workspace, readerPath)) }), 'source_inventory_invalid')
  for (const sourceInventory of [
    [], policy.sourceInventory.slice(1),
    policy.sourceInventory.map((pin, i) => i === 0 ? { ...pin, bytes: pin.bytes + 1 } : pin),
    policy.sourceInventory.map((pin, i) => i === 0 ? { ...pin, sha256: '0'.repeat(64) } : pin),
    policy.sourceInventory.map((pin, i) => i === 0 ? { ...pin, path: '../reader.ts' } : pin),
  ]) await refusal(fixture({ policy: { sourceInventory } }), 'source_inventory_invalid')
  const changedSource = fixture()
  changedSource.files.files.set(join(workspace, readerPath), Buffer.from('changed'))
  await refusal(changedSource, 'source_inventory_invalid')

  for (const fault of ['claim_sync', 'claim_close'] as const) {
    const failed = fixture({ fault })
    await refusal(failed, 'claim_unavailable')
    assert.equal(failed.files.claimCreates, 1)
    failed.files.fault = null
    await refusal(fixture({ fs: failed.files }), 'claim_unavailable')
  }
  const positive = fixture()
  const result = await positive.invoke()
  finiteResult(result)
  assert.equal(result.phase, 'observed')
  assert.equal(result.comparison, 'MATCH')
  assert.deepEqual(result.s1, { status: 'recognized', reason: null })
  assert.equal(positive.state.s1, 1)
  assert.equal(positive.state.dns, 1)
  assert.equal(positive.state.requests.length, 1)
  assert.equal(positive.files.claimCreates, 1)
  assert.deepEqual(positive.files.claimModes, [0o600])
  assert.equal(positive.files.descriptors.size, 0)
  assert.equal(positive.state.timerCleared, true)
  assert(positive.state.agentsDestroyed > 0)
  const request = positive.state.requests[0]!
  assert.deepEqual({
    method: request.method, protocol: request.protocol, hostname: request.hostname, port: request.port,
    path: request.path, headers: request.headers, servername: request.servername, rejectUnauthorized: request.rejectUnauthorized,
  }, {
    method: 'GET', protocol: 'https:', hostname: 'www.auswaertiges-amt.de', port: 443,
    path: '/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820',
    headers: { 'accept-encoding': 'identity', 'cache-control': 'no-cache' },
    servername: 'www.auswaertiges-amt.de', rejectUnauthorized: true,
  })
  await refusal(fixture({ fs: positive.files }), 'claim_unavailable')
  assert.equal(positive.files.claimCreates, 1)

  for (const body of [html('<p>changed footnote</p>'), baselineBody.replace('Schweiz', 'Schweiz (1)')]) {
    const f = fixture({ body }), observed = await f.invoke()
    finiteResult(observed)
    assert.equal(observed.comparison, 'MISMATCH')
    assert.equal(f.state.s1, 0)
  }
  for (const body of [baselineBody.replace(/\n/g, '\r\n'), baselineBody.replace(/\n/g, '\r')]) {
    const observed = await fixture({ body }).invoke()
    finiteResult(observed)
    assert.equal(observed.comparison, 'MATCH')
  }
  const changedBinding = await fixture({ policy: { binding: { ...policy.binding, contentItemVersion: 2 } } }).invoke()
  finiteResult(changedBinding)
  assert.equal(changedBinding.comparison, 'MISMATCH')
  const qualified = html('', '<tr><td>Schweiz</td><td>Nein (1)</td></tr>')
  const s1Refused = await fixture({ body: qualified, expectedBody: qualified }).invoke()
  finiteResult(s1Refused)
  assert.equal(s1Refused.comparison, 'MATCH')
  assert.deepEqual(s1Refused.s1, { status: 'refused', reason: 'qualified_or_conflicting_swiss_row' })

  for (const status of [300, 301, 302, 303, 304, 305, 307, 308, 399]) {
    await refusal(fixture({ status, headers: { location: 'https://example.invalid/' + sentinel } }), 'redirect_rejected', false)
  }
  for (const status of [201, 202, 204, 206, 400, 404, 500]) await refusal(fixture({ status }), 'http_status', false)
  for (const value of ['application/json', 'text/html; charset=iso-8859-1', 'text/html, text/plain', 'text/html; bad=1']) {
    await refusal(fixture({ headers: { 'content-type': value } }), 'content_type_mismatch', false)
  }
  await refusal(fixture({ headers: { 'content-encoding': 'gzip' } }), 'http_failed', false)
  await refusal(fixture({ headers: { 'content-length': 'not-a-number' } }), 'http_failed', false)
  await refusal(fixture({ headers: { 'content-length': '131073' } }), 'response_too_large', false)
  await refusal(fixture({ body: Buffer.alloc(131_073, 120), headers: { 'content-length': '1' } }), 'response_too_large', false)
  await refusal(fixture({ body: '' }), 'empty_body', false)
  await refusal(fixture({ body: Buffer.from([0xef, 0xbb, 0xbf, 65]) }), 'invalid_utf8', false)
  await refusal(fixture({ body: Buffer.from([0xc3, 0x28]) }), 'invalid_utf8', false)
  await refusal(fixture({ body: '<html>tiny</html>' }), 'protocol_not_v2', false)
  await refusal(fixture({ streamThrows: true }), 'http_failed', false)
  await refusal(fixture({ framing: false }), 'framing_unverified', false)
  await refusal(fixture({ framing: 'missing' }), 'framing_unverified', false)
  await refusal(fixture({ framing: 'throws' }), 'http_failed', false)
  await refusal(fixture({ dns: 'private' }), 'address_not_permitted', false)
  await refusal(fixture({ dns: 'error' }), 'dns_failed', false)
  await refusal(fixture({ dns: 'empty' }), 'dns_empty', false)
  for (const timer of ['before_dns', 'during_body'] as const) await refusal(fixture({ timer }), 'timeout', false)
  for (const clock of ['after_headers', 'after_body', 'after_hash', 'after_s1'] as const) {
    const late = fixture({ clock })
    await refusal(late, 'timeout', false)
    if (clock === 'after_headers') assert.equal(late.state.bodyChunks, 0)
    if (clock === 'after_hash') assert.equal(late.state.s1, 0)
    if (clock === 'after_s1') assert.equal(late.state.s1, 1)
  }
  await refusal(fixture({ s1Throws: true }), 'http_failed', false)
}

// A thrown preflight assertion exits this one awaited flow before the real call.
// All fixture results above remain synthetic and are never emitted as source evidence.
test('AA revision probe V1: synthetic preflight precedes the single closed native CI entry', async () => {
  await syntheticPreflight()
  const actual = await probeOfficialTruthAaReviewedRevisionV1()
  finiteResult(actual)
  if (actual.ci !== null) console.log('AA_REVISION_PROBE_V1 ' + JSON.stringify(actual))
  // MATCH, MISMATCH and a controlled transport refusal are observations, not retry instructions.
  // No real-body assertion, response object, new observed hash or artifact is printed.
})
