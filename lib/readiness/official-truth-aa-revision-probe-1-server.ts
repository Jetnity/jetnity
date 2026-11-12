import 'server-only'

// AA revision-probe V1 additions: metadata-only research, closed by Run 0.
import { createHash as aaProbeCreateHash } from 'node:crypto'
import * as aaProbeFs from 'node:fs'
import * as aaProbePath from 'node:path'
import * as aaProbeProcess from 'node:process'
import { performance as aaProbePerformance } from 'node:perf_hooks'
import { setTimeout as aaProbeSetTimeout, clearTimeout as aaProbeClearTimeout } from 'node:timers'
import { AA_REVISION_PROBE_V1_POLICY } from '@/lib/readiness/official-truth-aa-revision-probe-1-policy'
import { chDeAaS1VisaRowResearchFromHtml } from '@/lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server'
// End AA revision-probe V1 imports.
import {
  officialTruthServerOwnedRetrievalLookup,
  serverDns,
  serverHttp,
  serverUhr,
  hopLesen,
  textAus,
  uhrLesen,
  type OfficialTruthServerOwnedRetrievalHttpClient,
  type OfficialTruthServerOwnedRetrievalHttpErgebnis,
  type OfficialTruthServerOwnedRetrievalSperrgrund,
} from './official-truth-retrieval-physical-internal'
import { officialTruthSourceFingerprintProtocol, officialTruthSourceFingerprintV2 } from '@/lib/readiness/official-truth-source-fingerprint-v2'

// BEGIN AA_REVISION_PROBE_V1 — no existing retrieval or Bern behavior changes.
type AaProbeCi = Readonly<{
  runId: string
  runNumber: number
  attempt: 1
  pullRequest: number
  headSha: string
  checkoutSha: string
}>
type AaProbeReason =
  | 'unarmed' | 'caller_input_forbidden' | 'ci_not_selected' | 'event_invalid' | 'source_inventory_invalid'
  | 'claim_unavailable' | 'unexpected_failure' | 'redirect_rejected'
  | 'http_status' | 'http_failed' | 'address_not_permitted' | 'dns_failed'
  | 'dns_empty' | 'timeout' | 'response_too_large' | 'content_type_mismatch'
  | 'framing_unverified' | 'invalid_utf8' | 'empty_body'
  | 'protocol_not_v2' | 'fingerprint_refused' | 'invalid_observation_time'
type AaProbeS1 = Readonly<
  | { status: 'recognized'; reason: null }
  | { status: 'refused'; reason:
      'invalid_html' | 'snapshot_over_limit' | 'invalid_document_structure'
      | 'missing_exact_visa_table' | 'ambiguous_visa_table' | 'swiss_row_missing'
      | 'ambiguous_swiss_row' | 'qualified_or_conflicting_swiss_row' }
>
type AaProbeCommon = Readonly<{
  schema: 'jetnity.aa-revision-probe.v1'
  task: 'CH-DE-AA-REVISION-PROBE-1'
  taskVersion: 1
  sourceUrl: typeof AA_REVISION_PROBE_V1_POLICY.url
  reviewedSourceBlob: string
  researchOnly: true
  sourceCustody: 'not_verified'
  legalApplicability: 'not_verified'
  productionAuthority: false
  acceptedEvidence: 0
  acceptedRules: 0
  databaseWrites: 0
  ci: AaProbeCi | null
}>
export type OfficialTruthAaRevisionProbeV1Result = AaProbeCommon & Readonly<
  | {
      phase: 'blocked'; reason: AaProbeReason; networkAttempted: boolean | null
      observedAt: null; contentType: null; fullBodyByteCount: null
      fingerprintProtocol: null; comparison: 'UNKNOWN'; s1: null
    }
  | {
      phase: 'observed'; reason: null; networkAttempted: true
      observedAt: string; contentType: 'text/html'; fullBodyByteCount: number
      fingerprintProtocol: 2; comparison: 'MATCH' | 'MISMATCH'; s1: AaProbeS1 | null
    }
>

const AA_PROBE_SOURCE_PATHS = Object.freeze([
  'lib/readiness/official-truth-server-owned-retrieval.ts',
  'lib/readiness/official-truth-aa-revision-probe-1.test.ts',
  'lib/readiness/official-truth-bounded-response-body.ts',
  'lib/readiness/official-truth-source-fingerprint-v2.ts',
  'lib/readiness/digest.ts',
  'lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server.ts',
  '.github/workflows/ci.yml',
  'package.json',
  'package-lock.json',
  'scripts/server-only-test-register.mjs',
  'scripts/db/official-truth-accepted-store-trip-integration-1/native-loader.ts',
  'lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts',
  'lib/readiness/official-truth-content-identity-r2.test.ts',
  'lib/readiness/official-truth-retrieval-physical-internal.ts',
  'lib/readiness/official-truth-aa-revision-probe-1-server.ts',
] as const)
const AA_PROBE_EVENT_MAX = 262_144
const AA_PROBE_SOURCE_MAX = 1_048_576

function aaProbeCommon(ci: AaProbeCi | null): AaProbeCommon {
  return Object.freeze({
    schema: 'jetnity.aa-revision-probe.v1' as const,
    task: 'CH-DE-AA-REVISION-PROBE-1' as const,
    taskVersion: 1 as const,
    sourceUrl: AA_REVISION_PROBE_V1_POLICY.url,
    reviewedSourceBlob: AA_REVISION_PROBE_V1_POLICY.reviewedSourceBlob,
    researchOnly: true as const,
    sourceCustody: 'not_verified' as const,
    legalApplicability: 'not_verified' as const,
    productionAuthority: false as const,
    acceptedEvidence: 0 as const, acceptedRules: 0 as const, databaseWrites: 0 as const,
    ci,
  })
}
function aaProbeBlocked(reason: AaProbeReason, attempted: boolean | null, ci: AaProbeCi | null):
  OfficialTruthAaRevisionProbeV1Result {
  return Object.freeze({
    ...aaProbeCommon(ci), phase: 'blocked' as const, reason,
    networkAttempted: attempted, observedAt: null, contentType: null,
    fullBodyByteCount: null, fingerprintProtocol: null, comparison: 'UNKNOWN' as const, s1: null,
  })
}
function aaProbeInteger(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,14}$/.test(value)) return null
  const number = Number(value)
  return Number.isSafeInteger(number) ? number : null
}
function aaProbeRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype ? value as Record<string, unknown> : null
}
function aaProbeSha(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
}
function aaProbeDirectory(path: string): boolean {
  if (!aaProbePath.isAbsolute(path) || aaProbePath.resolve(path) !== path
    || aaProbeFs.realpathSync(path) !== path) return false
  const stat = aaProbeFs.lstatSync(path)
  return stat.isDirectory() && !stat.isSymbolicLink()
}

/** Bounded reads only; never readFile an event or source after a racy size check. */
function aaProbeReadRegular(root: string, file: string, maximum: number): Buffer {
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > AA_PROBE_SOURCE_MAX
    || !aaProbeDirectory(root) || aaProbePath.resolve(file) !== file) throw new Error('aa_probe_input')
  const relative = aaProbePath.relative(root, file)
  const parts = relative.split(aaProbePath.sep)
  if (!relative || aaProbePath.isAbsolute(relative)
    || parts.some(part => !part || part === '.' || part === '..' || !/^[A-Za-z0-9_.-]+$/.test(part))) {
    throw new Error('aa_probe_input')
  }
  let parent = root
  for (const part of parts.slice(0, -1)) {
    parent = aaProbePath.join(parent, part)
    if (!aaProbeDirectory(parent)) throw new Error('aa_probe_input')
  }
  const before = aaProbeFs.lstatSync(file)
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1
    || !Number.isSafeInteger(before.size) || before.size < 1 || before.size > maximum) {
    throw new Error('aa_probe_input')
  }
  const fd = aaProbeFs.openSync(file, aaProbeFs.constants.O_RDONLY | aaProbeFs.constants.O_NOFOLLOW)
  try {
    const opened = aaProbeFs.fstatSync(fd)
    if (!opened.isFile() || opened.nlink !== 1 || opened.dev !== before.dev || opened.ino !== before.ino
      || opened.size !== before.size || opened.mtimeMs !== before.mtimeMs || opened.ctimeMs !== before.ctimeMs) {
      throw new Error('aa_probe_input')
    }
    const buffer = Buffer.alloc(maximum + 1)
    let used = 0
    while (used < buffer.byteLength) {
      const read = aaProbeFs.readSync(fd, buffer, used, buffer.byteLength - used, null)
      if (!Number.isSafeInteger(read) || read < 0 || read > buffer.byteLength - used) throw new Error('aa_probe_input')
      if (read === 0) break
      used += read
    }
    const after = aaProbeFs.fstatSync(fd)
    if (used !== opened.size || used > maximum || !after.isFile() || after.nlink !== 1
      || after.dev !== opened.dev || after.ino !== opened.ino || after.size !== opened.size
      || after.mtimeMs !== opened.mtimeMs || after.ctimeMs !== opened.ctimeMs) {
      throw new Error('aa_probe_input')
    }
    return Buffer.from(buffer.subarray(0, used))
  } finally {
    aaProbeFs.closeSync(fd)
  }
}

/** JSON.parse supplies grammar validation; this pass rejects duplicate decoded keys. */
function aaProbeEvent(bytes: Buffer): Record<string, unknown> | null {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return null
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  const stack: (Set<string> | null)[] = []
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '{') stack.push(new Set())
    else if (char === '[') stack.push(null)
    else if (char === '}' || char === ']') stack.pop()
    else if (char === '"') {
      const start = index
      index += 1
      for (; index < text.length; index += 1) {
        if (text[index] === '\\') index += 1
        else if (text[index] === '"') break
      }
      const key: unknown = JSON.parse(text.slice(start, index + 1))
      let next = index + 1
      while (next < text.length && /\s/.test(text[next]!)) next += 1
      if (text[next] === ':') {
        const keys = stack[stack.length - 1]
        if (!keys || typeof key !== 'string' || keys.has(key)) return null
        keys.add(key)
      }
    }
  }
  return aaProbeRecord(JSON.parse(text))
}
function aaProbeRepository(value: unknown): boolean {
  const repo = aaProbeRecord(value)
  return repo?.id === AA_REVISION_PROBE_V1_POLICY.repositoryId
    && repo.full_name === AA_REVISION_PROBE_V1_POLICY.repository
}
type AaProbeSelection =
  | { ok: true; ci: AaProbeCi; runnerTemp: string }
  | { ok: false; reason: AaProbeReason; ci: AaProbeCi | null }

function aaProbeSelect(): AaProbeSelection {
  const policy = AA_REVISION_PROBE_V1_POLICY
  const selectedRun: number = policy.runNumber
  if (!Number.isSafeInteger(selectedRun) || selectedRun <= 0) return { ok: false, reason: 'unarmed', ci: null }
  const env = aaProbeProcess.env
  const run = aaProbeInteger(env.GITHUB_RUN_NUMBER), runId = aaProbeInteger(env.GITHUB_RUN_ID)
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'pull_request'
    || env.GITHUB_JOB !== policy.job || env.GITHUB_RUN_ATTEMPT !== '1'
    || env.GITHUB_REPOSITORY !== policy.repository
    || env.GITHUB_REPOSITORY_ID !== String(policy.repositoryId)
    || env.GITHUB_WORKFLOW !== policy.workflowName || run !== selectedRun || runId === null
    || env.GITHUB_HEAD_REF !== policy.headBranch || env.GITHUB_BASE_REF !== policy.baseBranch
    || !aaProbeSha(env.GITHUB_SHA) || !aaProbeSha(policy.baseSha)) {
    return { ok: false, reason: 'ci_not_selected', ci: null }
  }
  const workspace = env.GITHUB_WORKSPACE, runnerTemp = env.RUNNER_TEMP, eventPath = env.GITHUB_EVENT_PATH
  if (typeof workspace !== 'string' || typeof runnerTemp !== 'string' || typeof eventPath !== 'string'
    || workspace !== aaProbeProcess.cwd()) return { ok: false, reason: 'event_invalid', ci: null }
  let event: Record<string, unknown> | null
  try {
    if (!aaProbeDirectory(workspace) || !aaProbeDirectory(runnerTemp)) return { ok: false, reason: 'event_invalid', ci: null }
    event = aaProbeEvent(aaProbeReadRegular(runnerTemp, eventPath, AA_PROBE_EVENT_MAX))
  } catch { return { ok: false, reason: 'event_invalid', ci: null } }
  const pr = aaProbeRecord(event?.pull_request), head = aaProbeRecord(pr?.head), base = aaProbeRecord(pr?.base)
  const number = event?.number
  if (!event || !pr || !head || !base || typeof number !== 'number' || !Number.isSafeInteger(number) || number < 1
    || pr.number !== number || typeof event.action !== 'string' || !['opened', 'synchronize', 'reopened'].includes(event.action)
    || !aaProbeRepository(event.repository) || !aaProbeRepository(head.repo) || !aaProbeRepository(base.repo)
    || head.ref !== policy.headBranch || base.ref !== policy.baseBranch || base.sha !== policy.baseSha
    || !aaProbeSha(head.sha) || env.GITHUB_REF !== 'refs/pull/' + String(number) + '/merge'
    || env.GITHUB_WORKFLOW_REF !== policy.repository + '/' + policy.workflowPath + '@' + env.GITHUB_REF) {
    return { ok: false, reason: 'event_invalid', ci: null }
  }
  const ci: AaProbeCi = Object.freeze({
    runId: String(runId), runNumber: selectedRun, attempt: 1 as const,
    pullRequest: Number(number), headSha: head.sha, checkoutSha: env.GITHUB_SHA,
  })
  try {
    if (policy.sourceInventory.length !== AA_PROBE_SOURCE_PATHS.length) throw new Error('aa_probe_inventory')
    for (let index = 0; index < AA_PROBE_SOURCE_PATHS.length; index += 1) {
      const pin = policy.sourceInventory[index]
      if (!pin || pin.path !== AA_PROBE_SOURCE_PATHS[index] || !Number.isSafeInteger(pin.bytes)
        || pin.bytes < 1 || pin.bytes > AA_PROBE_SOURCE_MAX || !/^[0-9a-f]{64}$/.test(pin.sha256)) {
        throw new Error('aa_probe_inventory')
      }
      const bytes = aaProbeReadRegular(workspace, aaProbePath.join(workspace, pin.path), pin.bytes)
      if (bytes.byteLength !== pin.bytes || aaProbeCreateHash('sha256').update(bytes).digest('hex') !== pin.sha256) {
        throw new Error('aa_probe_inventory')
      }
    }
  } catch { return { ok: false, reason: 'source_inventory_invalid', ci } }
  return { ok: true, ci, runnerTemp }
}
function aaProbeClaim(runnerTemp: string, ci: AaProbeCi): boolean {
  try {
    if (!aaProbeDirectory(runnerTemp)) return false
    const file = aaProbePath.join(runnerTemp, '.jetnity-aa-revision-probe-v1-' + ci.runId + '-1.claim')
    const fd = aaProbeFs.openSync(file,
      aaProbeFs.constants.O_WRONLY | aaProbeFs.constants.O_CREAT | aaProbeFs.constants.O_EXCL | aaProbeFs.constants.O_NOFOLLOW,
      0o600)
    try {
      const marker = Buffer.from('CH-DE-AA-REVISION-PROBE-1\n' + ci.runId + '\n' + ci.headSha + '\n', 'utf8')
      let written = 0
      while (written < marker.byteLength) {
        const count = aaProbeFs.writeSync(fd, marker, written, marker.byteLength - written)
        if (!Number.isSafeInteger(count) || count <= 0 || count > marker.byteLength - written) return false
        written += count
      }
      aaProbeFs.fsyncSync(fd)
    } finally { aaProbeFs.closeSync(fd) }
    return true
  } catch { return false }
}
function aaProbeHttpReason(reason: OfficialTruthServerOwnedRetrievalSperrgrund): AaProbeReason {
  switch (reason) {
    case 'address_not_permitted': case 'dns_failed': case 'dns_empty': case 'timeout':
    case 'http_failed': case 'http_status': case 'response_too_large': case 'content_type_mismatch':
    case 'invalid_utf8': case 'empty_body': return reason
    default: return 'http_failed'
  }
}
async function aaProbePhysical(ci: AaProbeCi): Promise<OfficialTruthAaRevisionProbeV1Result> {
  const controller = new AbortController()
  const started = aaProbePerformance.now()
  const timer = aaProbeSetTimeout(() => {
    try { controller.abort() } catch { /* no native error text is emitted */ }
  }, AA_REVISION_PROBE_V1_POLICY.timeoutMs)
  const state: {
    attempted: boolean
    reply: Extract<OfficialTruthServerOwnedRetrievalHttpErgebnis, { ok: true }> | null
    failure: AaProbeReason | null
    bytes: Uint8Array | null
  } = { attempted: false, reply: null, failure: null, bytes: null }
  const expired = () => {
    const now = aaProbePerformance.now()
    return controller.signal.aborted || !Number.isFinite(started) || !Number.isFinite(now)
      || now < started || now - started >= AA_REVISION_PROBE_V1_POLICY.timeoutMs
  }
  const physical: OfficialTruthServerOwnedRetrievalHttpClient = async request => {
    if (expired()) return { ok: false, reason: 'timeout' }
    state.attempted = true
    const reply = await serverHttp(request)
    if (!reply.ok) return reply
    state.reply = reply
    if (expired()) {
      try { reply.cancel?.() } catch { /* a late response never starts body processing */ }
      return { ok: false, reason: 'timeout' }
    }
    if (reply.status !== 200) {
      state.failure = reply.status >= 300 && reply.status < 400 ? 'redirect_rejected' : 'http_status'
      try { reply.cancel?.() } catch { /* no follow-up and no untrusted error output */ }
      return { ok: false, reason: 'http_failed' }
    }
    return reply
  }
  try {
    if (expired()) return aaProbeBlocked('timeout', false, ci)
    const hop = await hopLesen(physical, AA_REVISION_PROBE_V1_POLICY.url,
      officialTruthServerOwnedRetrievalLookup(serverDns), controller.signal, () => AA_REVISION_PROBE_V1_POLICY.maxBytes)
    if (expired()) return aaProbeBlocked('timeout', state.attempted, ci)
    if (hop.art === 'redirect') return aaProbeBlocked('redirect_rejected', state.attempted, ci)
    if (hop.art === 'blocked') return aaProbeBlocked(state.failure ?? aaProbeHttpReason(hop.reason), state.attempted, ci)
    state.bytes = hop.bytes
    if (hop.contentType !== 'text/html') return aaProbeBlocked('content_type_mismatch', state.attempted, ci)
    if (state.reply?.framingComplete?.() !== true) return aaProbeBlocked('framing_unverified', state.attempted, ci)
    const text = textAus(hop.bytes)
    if (!text.ok) return aaProbeBlocked(text.reason, state.attempted, ci)
    if (officialTruthSourceFingerprintProtocol(text.text, hop.bytes.byteLength) !== 2) {
      return aaProbeBlocked('protocol_not_v2', state.attempted, ci)
    }
    const hash = officialTruthSourceFingerprintV2(text.text, AA_REVISION_PROBE_V1_POLICY.binding)
    if (expired()) return aaProbeBlocked('timeout', state.attempted, ci)
    if (hash === null) return aaProbeBlocked('fingerprint_refused', state.attempted, ci)
    const matches = hash === AA_REVISION_PROBE_V1_POLICY.expectedV2Pin
    let s1: AaProbeS1 | null = null
    if (matches) {
      const observation = chDeAaS1VisaRowResearchFromHtml(text.text)
      s1 = observation.status === 'research_visa_table_observation'
        ? Object.freeze({ status: 'recognized' as const, reason: null })
        : Object.freeze({ status: 'refused' as const, reason: observation.reason })
    }
    if (expired()) return aaProbeBlocked('timeout', state.attempted, ci)
    const observedAt = uhrLesen(serverUhr)
    if (observedAt === null) return aaProbeBlocked('invalid_observation_time', state.attempted, ci)
    if (expired()) return aaProbeBlocked('timeout', state.attempted, ci)
    return Object.freeze({
      ...aaProbeCommon(ci), phase: 'observed' as const, reason: null, networkAttempted: true as const,
      observedAt, contentType: 'text/html' as const, fullBodyByteCount: hop.bytes.byteLength,
      fingerprintProtocol: 2 as const, comparison: matches ? 'MATCH' as const : 'MISMATCH' as const, s1,
    })
  } catch {
    return aaProbeBlocked(expired() ? 'timeout' : 'http_failed', state.attempted, ci)
  } finally {
    aaProbeClearTimeout(timer)
    try { controller.abort() } catch { /* never expose native exception text */ }
    try { state.reply?.cancel?.() } catch { /* no retry */ }
    state.bytes?.fill(0)
  }
}

/** One reviewed CI research observation. No production inputs or trusted receipt.
 * Only the single inventoried test caller may consume this entry. Run 0 is closed.
 * The existing DB-backed live retrieval and held Bern entry are unchanged. */
export async function probeOfficialTruthAaReviewedRevisionV1(): Promise<OfficialTruthAaRevisionProbeV1Result> {
  if (arguments.length !== 0) return aaProbeBlocked('caller_input_forbidden', false, null)
  let ci: AaProbeCi | null = null
  let physicalStarted = false
  try {
    const selected = aaProbeSelect()
    if (!selected.ok) return aaProbeBlocked(selected.reason, false, selected.ci)
    ci = selected.ci
    if (!aaProbeClaim(selected.runnerTemp, ci)) return aaProbeBlocked('claim_unavailable', false, ci)
    physicalStarted = true
    return await aaProbePhysical(ci)
  } catch {
    return aaProbeBlocked('unexpected_failure', physicalStarted ? null : false, ci)
  }
}
// END AA_REVISION_PROBE_V1
