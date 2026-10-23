// Test-only module graph. No application root imports this file.
// The transpiled copies are the existing engines with one substituted registry
// constant. That substitution is not a live injection route.
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { IncomingMessage } from 'node:http'
import { createRequire } from 'node:module'
import { Socket } from 'node:net'
import { resolve } from 'node:path'
import ts from 'typescript'
import { fixtureTrip } from '../../../../scripts/official-truth-ch-de-application-pilot-1/fixtures'
import {
  applicationCurrentRequestContractDigest,
  type ApplicationContract,
} from '@/lib/readiness/official-truth-ch-de-application-pilot-1/contract-server'
import * as RealContract from '@/lib/readiness/official-truth-ch-de-application-pilot-1/contract-server'
import * as ContentIdentity from '@/lib/readiness/official-truth-content-identity'
import {
  contentIdentityBinding,
  createContentIdentityGraph,
  type ContentIdentityProfileDefinition,
} from '@/lib/readiness/official-truth-content-identity'
import { OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY as POLICY } from '@/lib/readiness/official-truth-whole-source-current-request-1'
import { quellenKatalogLesen, quellenKatalogSnapshotAntwort } from '@/lib/readiness/official-truth-source-catalog-server'
import type { OfficialTruthServerOwnedRetrievalErgebnis } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import type { OfficialTruthExtractorDefinition } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import type * as Evaluation from '@/lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server'

export const SYNTHETIC_PREFIX = 'SYNTHETIC WHOLE SOURCE CURRENT REQUEST ONLY\n'

function syntheticBody(bytes: number): string {
  assert.ok(bytes >= SYNTHETIC_PREFIX.length)
  return SYNTHETIC_PREFIX + 'x'.repeat(bytes - SYNTHETIC_PREFIX.length)
}

const authority = quellenRegistryErstellen([{
  sourceId: POLICY.sourceId,
  sourceClass: 'official_authority',
  publisherName: 'SYNTHETISCHER LOKALTEST',
  authorityName: 'SYNTHETISCHE TESTQUELLE – KEINE BEHÖRDE',
  domains: ['www.fedlex.admin.ch'],
}])
if (!authority.ok) throw new Error('registry')
const sourceRegistry = authority.registry

const item = {
  sourceId: POLICY.sourceId,
  contentItemId: POLICY.contentItemId,
  contentItemVersion: POLICY.contentItemVersion,
  current: true,
  externalIdNamespace: 'eli',
  externalContentId: 'eli-cc-2002-243',
  expectedPublisherIds: ['synthetic'],
  expectedAuthorityIds: ['synthetic'],
}
const representationInput = {
  sourceId: POLICY.sourceId,
  contentItemId: POLICY.contentItemId,
  contentItemVersion: POLICY.contentItemVersion,
  representationId: POLICY.representationId,
  representationVersion: POLICY.representationVersion,
  current: true,
  requestUrls: [POLICY.requestUrl],
  expectedFinalUrl: POLICY.expectedFinalUrl,
  expectedMediaType: POLICY.expectedMediaType,
  identityProfileId: POLICY.identityProfileId,
  identityProfileVersion: POLICY.identityProfileVersion,
  expectedLocale: null,
  expectedSchema: null,
}
const currentProfile: ContentIdentityProfileDefinition = Object.freeze({
  identityProfileId: POLICY.identityProfileId,
  identityProfileVersion: POLICY.identityProfileVersion,
  current: true,
  verify: ({ responseText, representation }) => responseText.startsWith(SYNTHETIC_PREFIX)
    ? { ok: true as const, identity: contentIdentityBinding(representation) }
    : { ok: false as const, reason: 'identity_mismatch' as const },
})
const graph = createContentIdentityGraph(sourceRegistry, [item], [representationInput], [currentProfile])
if (!graph.ok) throw new Error(graph.reason)
const currentRegistry = { ...graph.value.authorityRegistry, contentIdentity: graph.value }
const approvedProfiles = Object.freeze([currentProfile])
const snapshot = quellenKatalogSnapshotAntwort(currentRegistry)
assert.ok(snapshot)

const identityModule = new Proxy(ContentIdentity, {
  get(target, prop, receiver) {
    if (prop === 'OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY') return approvedProfiles
    const value = Reflect.get(target, prop, receiver)
    return typeof value === 'function' ? value.bind(target) : value
  },
})

const IDENTITY = '@/lib/readiness/official-truth-content-identity'
const nodeRequire = createRequire(import.meta.url)
/** Same engines as production. esModuleInterop matches the Node loader used by the real modules. */
function load<T>(file: string, dependencies: Record<string, unknown>): T {
  const source = readFileSync(file, 'utf8')
  const compiled = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const loaded = { exports: {} as T }
  const localRequire = (id: string) => dependencies[id] ?? nodeRequire(id.startsWith('@/') ? resolve(id.slice(2)) : id.startsWith('.') ? resolve(file, '..', id) : id)
  new Function('require', 'module', 'exports', compiled)(localRequire, loaded, loaded.exports)
  return loaded.exports
}

const material = load<Record<string, unknown>>('lib/readiness/official-truth-retrieved-material.ts', { [IDENTITY]: identityModule })
const evidence = load<Record<string, unknown>>('lib/readiness/evidence.ts', { [IDENTITY]: identityModule })
const ruleCandidate = load<Record<string, unknown>>('lib/readiness/official-truth-rule-candidate.ts', {
  '@/lib/readiness/evidence': evidence,
})
const ruleClaims = load<typeof import('@/lib/readiness/rule-claims')>('lib/readiness/rule-claims.ts', {
  '@/lib/readiness/evidence': evidence,
})
const candidate = load<Record<string, unknown>>('lib/readiness/official-truth-retrieved-candidate-evidence.ts', {
  '@/lib/readiness/evidence': evidence,
  '@/lib/readiness/official-truth-retrieved-material': material,
})
const accepted = load<Record<string, unknown>>('lib/readiness/official-truth-accepted-evidence.ts', {
  '@/lib/readiness/evidence': evidence,
  '@/lib/readiness/official-truth-retrieved-candidate-evidence': candidate,
})
const packet = load<typeof import('@/lib/readiness/official-truth-rule-review-packet')>('lib/readiness/official-truth-rule-review-packet.ts', {
  '@/lib/readiness/official-truth-accepted-evidence': accepted,
  '@/lib/readiness/official-truth-retrieved-material': material,
  '@/lib/readiness/official-truth-rule-candidate': ruleCandidate,
})
const fingerprint = load<typeof import('@/lib/readiness/official-truth-rule-review-fingerprint')>('lib/readiness/official-truth-rule-review-fingerprint.ts', {
  '@/lib/readiness/official-truth-rule-review-packet': packet,
})
const decision = load<typeof import('@/lib/readiness/official-truth-rule-review-decision-intent')>('lib/readiness/official-truth-rule-review-decision-intent.ts', {
  '@/lib/readiness/official-truth-rule-review-packet': packet,
  '@/lib/readiness/official-truth-rule-review-fingerprint': fingerprint,
})
const extractor = load<typeof import('@/lib/readiness/official-truth-trusted-fact-extractor-registry')>('lib/readiness/official-truth-trusted-fact-extractor-registry.ts', {
  [IDENTITY]: identityModule,
})
type HttpScript = {
  fault: BodyFault
  payload: Buffer
  status: number
  contentType: string
  contentEncoding: string | null
  location: string | null
  declaredLength: string | null
  complete: boolean
}

const httpState = { calls: 0, cancels: 0, pulled: 0 }
let activeScript: HttpScript | null = null

function rawPairs(script: HttpScript): string[] {
  if (script.fault === 'duplicate') {
    return ['Content-Type', 'text/html', 'Content-Type', 'application/json', 'Content-Length', '4']
  }
  const pairs = ['Content-Type', script.contentType]
  if (script.contentEncoding) pairs.push('Content-Encoding', script.contentEncoding)
  if (script.location) pairs.push('Location', script.location)
  if (script.declaredLength != null) pairs.push('Content-Length', script.declaredLength)
  return pairs
}

const httpsMock = {
  Agent: class {
    destroy() {}
  },
  request(_options: unknown, callback: (response: IncomingMessage) => void) {
    const emitter = new EventEmitter()
    const request = Object.assign(emitter, {
      destroy() { emitter.emit('close') },
      end() {
        httpState.calls += 1
        const script = activeScript
        if (!script || script.fault === 'hang') return
        const incoming = new IncomingMessage(new Socket())
        const pairs = rawPairs(script)
        incoming.rawHeaders = pairs
        incoming.headers = {}
        for (let index = 0; index < pairs.length; index += 2) {
          const key = pairs[index]!.toLowerCase()
          if (incoming.headers[key] == null) incoming.headers[key] = pairs[index + 1]!
        }
        incoming.statusCode = script.status
        incoming.complete = script.complete
        const destroy = incoming.destroy.bind(incoming)
        incoming.destroy = ((error?: Error) => {
          httpState.cancels += 1
          return destroy(error)
        }) as typeof incoming.destroy
        callback(incoming)
        if (script.status >= 300 && script.status < 400) return
        if (script.fault === 'duplicate' || script.fault === 'over-cap' || script.fault === 'legacy-cap') return
        if (script.fault === 'throw' || script.fault === 'error') {
          incoming.destroy(new Error('synthetic-stream'))
          return
        }
        const deliver = () => {
          if (script.payload.byteLength > 0) {
            httpState.pulled += script.payload.byteLength
            const mid = Math.max(1, Math.floor(script.payload.byteLength / 2))
            incoming.push(script.payload.subarray(0, mid))
            if (mid < script.payload.byteLength) incoming.push(script.payload.subarray(mid))
          }
          incoming.complete = script.complete
          incoming.push(null)
        }
        if (script.fault === 'late') setTimeout(deliver, 40)
        else deliver()
      },
    })
    return request
  },
}

const dnsMock = {
  lookup(_hostname: string, _options: unknown, callback: (error: NodeJS.ErrnoException | null, addresses: { address: string; family: number }[]) => void) {
    callback(null, [{ address: '8.8.8.8', family: 4 }])
  },
}

const retrieval = load<typeof import('@/lib/readiness/official-truth-server-owned-retrieval')>('lib/readiness/official-truth-server-owned-retrieval.ts', {
  [IDENTITY]: identityModule,
  'node:https': httpsMock,
  'node:dns': dnsMock,
  '@/lib/readiness/official-truth-source-catalog-server': {
    quellenKatalogLesen: async (deps?: Parameters<typeof quellenKatalogLesen>[0]) => deps
      ? quellenKatalogLesen(deps)
      : { ok: true as const, registry: currentRegistry },
  },
})

const binding = contentIdentityBinding(graph.value.representations[0]!)
const definition: OfficialTruthExtractorDefinition = {
  extractorId: 'otx_synthetic_whole_source',
  extractorVersion: 1,
  current: true,
  factKind: 'requirement_effect',
  sourceFamilyId: 'otf_synthetic_whole_source',
  contentItemRefs: [{ sourceId: POLICY.sourceId, contentItemId: POLICY.contentItemId }],
  representations: [binding],
  urlAllowlist: [{ kind: 'exact', canonicalUrl: POLICY.requestUrl }],
  contentTypes: ['text/html'],
  schemaFamily: 'ots_synthetic_whole_source',
  policyId: null,
  policyVersion: null,
  requiredFieldPaths: [],
  match: (context) => context.supports.length === 1 && context.supports[0]!.sourceSnapshot.startsWith(SYNTHETIC_PREFIX)
    ? { ok: true }
    : { ok: false, reason: 'structure_not_recognized' },
  extract: () => ({ ok: true, fact: { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' } }),
}

const draft = {
  id: 'synthetic-whole-source-v1',
  digest: '0'.repeat(64),
  applicationScope: 'ch-ordinary-tourism-direct-de-v1' as const,
  travelDates: { from: '2026-11-01', through: '2026-11-08' },
  source: {
    sourceId: POLICY.sourceId,
    url: POLICY.requestUrl,
    binding,
    coverage: {
      destinationCountryCodes: ['DE'],
      transitCountryCodes: [],
      requirementTypes: ['visa' as const],
      citizenship: { mode: 'exact' as const, countryCodes: ['CH'] },
      residence: { mode: 'not_applicable' as const },
      documents: { mode: 'exact' as const, options: [{ documentType: 'passport' as const, issuingCountryCode: 'CH' }] },
    },
  },
  extractorId: definition.extractorId,
  extractorVersion: definition.extractorVersion,
  validity: (text: string) => text.startsWith(SYNTHETIC_PREFIX) ? { validFrom: null, validUntil: null } : null,
  sourceProtocol: 3 as const,
  policyId: POLICY.policyId,
  policyVersion: POLICY.policyVersion,
}
const digest = applicationCurrentRequestContractDigest(draft)
assert.ok(digest)
export const currentContract: ApplicationContract = { ...draft, digest: digest! }

export type BodyFault =
  | 'none' | 'redirect' | 'framing-false' | 'framing-missing' | 'short' | 'long' | 'over-cap' | 'legacy-cap'
  | 'no-length' | 'gzip' | 'media' | 'timeout' | 'throw' | 'bom' | 'bad-utf8' | 'late'
  | 'duplicate' | 'stream-overflow' | 'truncated' | 'error' | 'hang'

export type RetrievalObservation = {
  result: OfficialTruthServerOwnedRetrievalErgebnis
  calls: number
  cancels: number
  pulled: number
}

function bytesFor(fault: BodyFault, text: string): Buffer {
  if (fault === 'bom') return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text)])
  if (fault === 'bad-utf8') return Buffer.from([0xff, 0xfe, 0xfd])
  return Buffer.from(text)
}

type RetrievalOptions = {
  bytes?: number
  fault?: BodyFault
  engine?: 'substituted' | 'production'
  entry?: 'privileged' | 'injected'
  profiles?: 'approved' | 'clone' | 'absent'
  extra?: Record<string, unknown>
  timeoutMs?: number
}

function scriptFor(fault: BodyFault, text: string): HttpScript {
  const payload = fault === 'stream-overflow' ? Buffer.alloc(393_217, 0x78) : bytesFor(fault, text)
  let declaredLength: string | null = String(payload.byteLength)
  if (fault === 'short') declaredLength = String(Math.max(0, payload.byteLength - 1))
  if (fault === 'long') declaredLength = String(payload.byteLength + 1)
  if (fault === 'over-cap') declaredLength = '393217'
  if (fault === 'legacy-cap') declaredLength = '65537'
  if (fault === 'truncated') declaredLength = String(payload.byteLength + 8)
  if (fault === 'no-length' || fault === 'redirect' || fault === 'stream-overflow') declaredLength = null
  if (fault === 'duplicate') declaredLength = '4'
  return {
    fault,
    payload: fault === 'over-cap' || fault === 'duplicate' || fault === 'hang' || fault === 'redirect' ? Buffer.alloc(0) : payload,
    status: fault === 'redirect' ? 302 : 200,
    contentType: fault === 'media' ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8',
    contentEncoding: fault === 'gzip' ? 'gzip' : null,
    location: fault === 'redirect' ? POLICY.requestUrl : null,
    declaredLength,
    complete: fault !== 'framing-false' && fault !== 'framing-missing',
  }
}

async function privilegedOnce(options: RetrievalOptions): Promise<RetrievalObservation> {
  const fault = options.fault ?? 'none'
  httpState.calls = 0
  httpState.cancels = 0
  httpState.pulled = 0
  activeScript = scriptFor(fault, syntheticBody(options.bytes ?? SYNTHETIC_PREFIX.length))
  try {
    const result = await retrieval.loadOfficialTruthServerOwnedRetrieval({
      sourceId: POLICY.sourceId, url: POLICY.requestUrl, ...options.extra,
    })
    return { result, calls: httpState.calls, cancels: httpState.cancels, pulled: httpState.pulled }
  } finally {
    activeScript = null
  }
}

async function injectedOnce(options: RetrievalOptions): Promise<RetrievalObservation> {
  const fault = options.fault ?? 'none'
  const text = syntheticBody(options.bytes ?? SYNTHETIC_PREFIX.length)
  const payload = bytesFor(fault, text)
  const state = { calls: 0, cancels: 0, pulled: 0 }
  const headers = new Headers()
  if (fault === 'gzip') headers.set('content-encoding', 'gzip')
  headers.set('content-type', fault === 'media' ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8')
  if (fault === 'redirect') headers.set('location', POLICY.requestUrl)
  if (fault !== 'no-length' && fault !== 'redirect') {
    const declared = fault === 'short' ? payload.byteLength - 1
      : fault === 'long' ? payload.byteLength + 1
        : fault === 'over-cap' ? 393_217
          : fault === 'legacy-cap' ? 65_537
            : payload.byteLength
    headers.set('content-length', String(declared))
  }
  const http = async () => {
    state.calls += 1
    if (fault === 'timeout') await new Promise((resolve) => setTimeout(resolve, 40))
    if (fault === 'redirect') {
      return { ok: true as const, status: 302, headers, body: null, cancel: () => { state.cancels += 1 } }
    }
    const body = (async function* () {
      if (fault === 'throw') throw new Error('synthetic-stream')
      if (fault === 'late') await new Promise((resolve) => setTimeout(resolve, 40))
      state.pulled += payload.byteLength
      const mid = Math.max(1, Math.floor(payload.byteLength / 2))
      yield payload.subarray(0, mid)
      if (mid < payload.byteLength) yield payload.subarray(mid)
    })()
    return {
      ok: true as const,
      status: 200,
      headers,
      body,
      cancel: () => { state.cancels += 1 },
      ...(fault === 'framing-missing' ? {} : { framingComplete: () => fault !== 'framing-false' }),
    }
  }
  const profiles = options.profiles === 'absent' ? undefined
    : options.profiles === 'clone'
      ? [Object.freeze({ ...currentProfile, verify: currentProfile.verify })]
      : approvedProfiles
  const catalog = {
    ...(profiles ? { identityProfiles: profiles } : {}),
    transport: { aufrufen: async () => ({ ok: true as const, antwort: snapshot }) },
  }
  const decide = options.engine === 'production'
    ? (await import('@/lib/readiness/official-truth-server-owned-retrieval')).decideOfficialTruthServerOwnedRetrieval
    : retrieval.decideOfficialTruthServerOwnedRetrieval
  const timeoutMs = options.timeoutMs ?? (fault === 'timeout' || fault === 'late' ? 5 : 1_000)
  const result = await decide(
    { sourceId: POLICY.sourceId, url: POLICY.requestUrl, ...options.extra },
    { now: () => new Date(), resolve: async () => [{ address: '8.8.8.8', family: 4 as const }], timeoutMs, catalog, http },
  )
  return { result, calls: state.calls, cancels: state.cancels, pulled: state.pulled }
}

async function retrieveOnce(options: RetrievalOptions): Promise<RetrievalObservation> {
  if (options.entry === 'injected' || options.engine === 'production') return injectedOnce(options)
  return privilegedOnce(options)
}

export function observeRetrieval(options: RetrievalOptions): Promise<RetrievalObservation> {
  return exclusive(() => retrieveOnce(options))
}

let lastPacket: unknown = null
let lastPacketInput: { supports?: { umschlag?: { material?: Record<string, unknown> } }[] } | null = null
let lastRetrieval: OfficialTruthServerOwnedRetrievalErgebnis | null = null
let activeTrip = fixtureTrip()
let contractOverride: ApplicationContract | null = null
let receiptMode: 'legacy' | 'v2' | null = null
let tail: Promise<void> = Promise.resolve()

function exclusive<T>(run: () => Promise<T>): Promise<T> {
  const result = tail.then(run, run)
  tail = result.then(() => undefined, () => undefined)
  return result
}

const evaluator = load<typeof Evaluation>('lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts', {
  './contract-server': {
    ...RealContract,
    applicationPilotEnabled: () => true,
    applicationContract: () => contractOverride ?? currentContract,
  },
  './database-server': {
    pilotGrant: async () => ({
      id: '77777777-7777-4777-8777-777777777777',
      contractId: currentContract.id,
      contractDigest: currentContract.digest,
      expiresAt: '2026-10-23T23:59:59.000Z',
    }),
  },
  '@/lib/readiness/official-truth-fact-entry-authority-server': {
    loadOfficialTruthFactEntryAuthority: async () => ({ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }),
  },
  '@/lib/readiness/official-truth-source-catalog-server': {
    quellenKatalogLesen: async () => ({ ok: true, registry: currentRegistry }),
  },
  '@/lib/readiness/official-truth-server-owned-retrieval': {
    loadOfficialTruthServerOwnedRetrieval: async (eingabe: unknown) => {
      if (receiptMode === 'legacy' || receiptMode === 'v2') {
        const sourceSnapshot = 'legacy-receipt'
        const receipt = {
          ...binding,
          identitySchema: 2 as const,
          status: 'server_owned_official_retrieval' as const,
          sourceId: POLICY.sourceId,
          requestUrl: POLICY.requestUrl,
          canonicalUrl: POLICY.expectedFinalUrl,
          retrievedAt: new Date().toISOString(),
          contentType: 'text/html',
          sourceSnapshot,
          sourceContentHash: 'ab'.repeat(32),
          ...(receiptMode === 'v2' ? { sourceFingerprintProtocol: 2 as const } : {}),
          redirectCount: 0,
        }
        lastRetrieval = receipt
        return receipt
      }
      const observed = await retrieveOnce({ bytes: pilotBytes, fault: 'none', entry: 'privileged' })
      assert.deepEqual(eingabe, { sourceId: POLICY.sourceId, url: POLICY.requestUrl })
      lastRetrieval = observed.result
      return observed.result
    },
  },
  '@/lib/readiness/official-truth-rule-review-packet': {
    ...packet,
    officialTruthRegelReviewBelege: (input: unknown) => {
      lastPacketInput = input as typeof lastPacketInput
      const built = packet.officialTruthRegelReviewBelege(input)
      lastPacket = built
      return built
    },
  },
  '@/lib/readiness/official-truth-rule-review-fingerprint': fingerprint,
  '@/lib/readiness/official-truth-rule-review-decision-intent': decision,
  '@/lib/readiness/rule-claims': ruleClaims,
  '@/lib/readiness/official-truth-trusted-fact-extractor-registry': {
    officialTruthTrustedFactExtrahieren: (input: unknown) => extractor.officialTruthTrustedFactExtrahierenMitDefinitionen(input, [definition]),
    consumeOfficialTruthTrustedFactExecutionContext: extractor.consumeOfficialTruthTrustedFactExecutionContext,
  },
  '@/lib/trips/daten': { reiseLaden: async () => ({ problem: null, zeilen: [activeTrip] }) },
})

let pilotBytes = SYNTHETIC_PREFIX.length

export async function observeMutated(kind: 'url' | 'media' | 'version' | 'stale' | 'source' | 'item' | 'representation' | 'profile' | 'duplicate') {
  const nextItem = { ...item, ...(kind === 'item' ? { contentItemId: 'eli-cc-2002-244' } : {}), ...(kind === 'stale' ? { current: false } : {}) }
  const nextRep = {
    ...representationInput,
    ...(kind === 'url' ? { requestUrls: ['https://www.fedlex.admin.ch/synthetic-other'], expectedFinalUrl: 'https://www.fedlex.admin.ch/synthetic-other' } : {}),
    ...(kind === 'media' ? { expectedMediaType: 'text/plain' } : {}),
    ...(kind === 'version' ? { representationVersion: 2 } : {}),
    ...(kind === 'stale' ? { current: false } : {}),
    ...(kind === 'source' ? { sourceId: 'synthetic-other-authority' } : {}),
    ...(kind === 'item' ? { contentItemId: 'eli-cc-2002-244' } : {}),
    ...(kind === 'representation' ? { representationId: 'cc-20201215-de-html-8' } : {}),
    ...(kind === 'profile' ? { identityProfileId: 'synthetic-other-profile', identityProfileVersion: 1 } : {}),
  }
  const reps = kind === 'duplicate'
    ? [representationInput, { ...representationInput, representationVersion: 2 }]
    : [nextRep]
  const built = createContentIdentityGraph(sourceRegistry, [nextItem], reps, kind === 'profile' ? [{ ...currentProfile, identityProfileId: 'synthetic-other-profile' }] : [currentProfile])
  if (!built.ok) return { graph: false as const, reason: built.reason, calls: 0, pulled: 0, result: null }
  const registry = { ...built.value.authorityRegistry, contentIdentity: built.value }
  const antwort = quellenKatalogSnapshotAntwort(registry)
  if (!antwort) return { graph: false as const, reason: 'snapshot', calls: 0, pulled: 0, result: null }
  const state = { calls: 0, pulled: 0 }
  const headers = new Headers({ 'content-type': 'text/html; charset=utf-8', 'content-length': '65537' })
  const result = await retrieval.decideOfficialTruthServerOwnedRetrieval(
    { sourceId: POLICY.sourceId, url: kind === 'url' ? nextRep.expectedFinalUrl : POLICY.requestUrl },
    {
      now: () => new Date(),
      resolve: async () => [{ address: '8.8.8.8', family: 4 as const }],
      timeoutMs: 1_000,
      catalog: { identityProfiles: approvedProfiles, transport: { aufrufen: async () => ({ ok: true, antwort }) } },
      http: async () => {
        state.calls += 1
        return {
          ok: true as const, status: 200, headers,
          body: (async function* () { state.pulled += 1; yield Buffer.alloc(1, 0x78) })(),
          framingComplete: () => true, cancel: () => undefined,
        }
      },
    },
  )
  return { graph: true as const, reason: null, result, calls: state.calls, pulled: state.pulled }
}

async function runPilot(bytes: number) {
  pilotBytes = bytes
  lastPacket = null
  lastPacketInput = null
  lastRetrieval = null
  activeTrip = fixtureTrip()
  const trip = activeTrip
  const result = await evaluator.evaluateApplicationPilot(trip, new AbortController().signal)
  return {
    result,
    retrieval: lastRetrieval as OfficialTruthServerOwnedRetrievalErgebnis | null,
    packet: lastPacket,
    input: lastPacketInput,
    trip,
  }
}

export function observePilot(bytes: number) {
  return exclusive(() => runPilot(bytes))
}

export function observeContractDrift(kind: 'policy' | 'version' | 'protocol' | 'legacy' | 'v2') {
  return exclusive(async () => {
    contractOverride = kind === 'policy' ? { ...currentContract, policyId: 'other-policy' }
      : kind === 'version' ? { ...currentContract, policyVersion: 9 }
        : kind === 'protocol' ? { ...currentContract, sourceProtocol: undefined }
          : currentContract
    receiptMode = kind === 'legacy' ? 'legacy' : kind === 'v2' ? 'v2' : null
    try {
      return await evaluator.evaluateApplicationPilot(fixtureTrip(), new AbortController().signal)
    } finally {
      contractOverride = null
      receiptMode = null
    }
  })
}

export function observeExactProfileSeams() {
  return exclusive(async () => {
    httpState.calls = 0
    httpState.cancels = 0
    httpState.pulled = 0
    activeScript = scriptFor('legacy-cap', syntheticBody(SYNTHETIC_PREFIX.length))
    const input = { sourceId: POLICY.sourceId, url: POLICY.requestUrl }
    const transport = { aufrufen: async () => ({ ok: true as const, antwort: snapshot }) }
    try {
      const cataloged = await retrieval.loadOfficialTruthServerOwnedRetrievalWithCatalogTransport(input, transport)
      const isolated = await retrieval.retrieveOfficialTruthIsolatedPilotSource(input, {
        transport, identityProfiles: approvedProfiles,
      })
      const injected = await injectedOnce({ fault: 'legacy-cap', entry: 'injected', profiles: 'approved' })
      return {
        cataloged, isolated, injected,
        nativeCalls: httpState.calls, nativePulled: httpState.pulled,
      }
    } finally {
      activeScript = null
    }
  })
}

export function observeMarkerLoss() {
  return exclusive(async () => {
    const pilot = await runPilot(SYNTHETIC_PREFIX.length)
    const input = lastPacketInput
    const material = input?.supports?.[0]?.umschlag?.material
    if (!material || !pilot.retrieval || pilot.retrieval.status !== 'server_owned_official_retrieval' || !pilot.packet) {
      throw new Error('current-request packet was not built')
    }
    const replay = (next: Record<string, unknown>) => packet.officialTruthRegelReviewBelege({
      ...input,
      supports: [{
        ...input.supports![0],
        umschlag: { ...input.supports![0]!.umschlag, material: next },
      }],
    })
    const removedMaterial = { ...material }
    delete removedMaterial.sourceFingerprintProtocol
    const evidenceRemoved = (evidence.evidenceKandidatAusAktuellemMaterial as (
      modell: unknown, material: unknown, registry: unknown,
    ) => { ok: boolean; reason?: string })({}, removedMaterial, currentRegistry)
    const built = pilot.packet as {
      kandidat: { scope: unknown; key: string }
      evidenceVersions: { versionId: string }[]
    }
    const retrieval = pilot.retrieval
    const versionId = built.evidenceVersions[0]!.versionId
    const one = {
      versionId,
      sourceId: POLICY.sourceId,
      retrieval: {
        ...contentIdentityBinding(retrieval),
        identitySchema: 2 as const,
        status: retrieval.status,
        sourceId: retrieval.sourceId,
        canonicalUrl: retrieval.canonicalUrl,
        retrievedAt: retrieval.retrievedAt,
        contentType: retrieval.contentType,
        sourceSnapshot: retrieval.sourceSnapshot,
        sourceContentHash: retrieval.sourceContentHash,
        redirectCount: retrieval.redirectCount,
        sourceFingerprintProtocol: 3 as const,
      },
    }
    const legacyHash = (evidence.evidenceQuellenFingerprint as (text: string) => string | null)(retrieval.sourceSnapshot)
    if (!legacyHash) throw new Error('legacy fingerprint')
    const legacyRetrieval = Object.fromEntries(Object.entries(one.retrieval).filter(([key]) => key !== 'sourceFingerprintProtocol'))
    const baseInput = {
      factKind: 'requirement_effect' as const,
      requirementType: 'visa' as const,
      scope: built.kandidat.scope,
      scopeKey: built.kandidat.key,
      supports: [one],
      policy: null,
      registry: currentRegistry,
    }
    const run = (evidenceQuality: 'explicit_primary_statement' | 'composed_from_multiple_primary_sources', supports: unknown[]) =>
      extractor.officialTruthTrustedFactExtrahierenMitDefinitionen({ ...baseInput, evidenceQuality, supports }, [definition])
    return {
      pilot,
      removed: replay(removedMaterial),
      changed: replay({ ...material, sourceFingerprintProtocol: 2 }),
      unknown: replay({ ...material, sourceFingerprintProtocol: 9 }),
      evidenceRemoved,
      composed: run('composed_from_multiple_primary_sources', [one]),
      multi: run('explicit_primary_statement', [one, { ...one, versionId: `ev2_${'b'.repeat(32)}` }]),
      mixed: run('explicit_primary_statement', [one, {
        ...one,
        versionId: `ev2_${'c'.repeat(32)}`,
        retrieval: { ...legacyRetrieval, sourceContentHash: legacyHash },
      }]),
    }
  })
}

export function observeGeneratedProtocol3Store() {
  const generated = { sourceFingerprintProtocol: 3 as const, sourceSnapshot: 'x'.repeat(393_216) }
  const store = load<typeof import('@/lib/readiness/official-truth-store-server')>('lib/readiness/official-truth-store-server.ts', {
    '@/lib/readiness/official-truth-server-held-source-registry': {
      officialTruthServerHeldEvidenceAnnehmen: async () => ({ status: 'accepted_evidence' as const, evidence: generated }),
    },
    '@/lib/readiness/rule-claims': {
      regelKandidatAkzeptieren: () => ({ ok: true as const, claim: generated }),
    },
  })
  const held = load<typeof import('@/lib/readiness/official-truth-server-held-source-registry')>('lib/readiness/official-truth-server-held-source-registry.ts', {
    '@/lib/readiness/official-truth-source-catalog-server': {
      quellenKatalogLesen: async () => ({ ok: true as const, registry: currentRegistry }),
    },
    '@/lib/readiness/official-truth-retrieved-material': {
      officialTruthAbgerufenMaterialPruefen: () => ({ status: 'retrieved_material' as const, ...generated }),
    },
    '@/lib/readiness/official-truth-accepted-evidence': {
      officialTruthAkzeptierteEvidenceAusAbruf: () => ({ status: 'accepted_evidence' as const, evidence: generated }),
    },
    '@/lib/readiness/official-truth-rule-review-packet': {
      officialTruthRegelReviewPacket: () => ({ status: 'rule_review_packet' as const, supports: [generated] }),
    },
    '@/lib/readiness/official-truth-rule-candidate': {
      officialTruthRegelKandidatAusEvidence: () => ({ ok: true as const, kandidat: generated }),
    },
  })
  return exclusive(async () => {
    let calls = 0
    const transport = { aufrufen: async () => { calls += 1; return { ok: true as const, antwort: {} } } }
    const envelope = {
      request: { synthetic: true }, descriptors: [], sourceId: POLICY.sourceId,
      material: {
        canonicalUrl: POLICY.requestUrl, retrievedAt: '2026-10-23T00:00:00.000Z',
        sourceSnapshot: 'x', contentType: 'text/html',
      },
    }
    const evidenceStored = await store.akzeptierteEvidenceSpeichern(envelope, () => new Date(), { extractionNote: null }, { transport })
    const claimStored = await store.akzeptierteRegelClaimSpeichern({
      kandidat: { proposal: null }, trustedRuleFact: { kind: 'requirement_effect' },
    }, { transport })
    const material = await held.officialTruthServerHeldMaterialPruefen(envelope, () => new Date())
    const accepted = await held.officialTruthServerHeldEvidenceAnnehmen(envelope, () => new Date(), { extractionNote: null })
    const review = await held.officialTruthServerHeldReviewPacket({
      supports: [{ umschlag: envelope, uhr: () => new Date(), extraktion: { extractionNote: null } }],
      metadata: { factKind: 'requirement_effect', evidenceQuality: 'explicit_primary_statement', proposal: null },
    })
    const kandidat = await held.officialTruthServerHeldRegelKandidat([], { factKind: 'requirement_effect' })
    return { evidenceStored, claimStored, material, accepted, review, kandidat, calls }
  })
}
