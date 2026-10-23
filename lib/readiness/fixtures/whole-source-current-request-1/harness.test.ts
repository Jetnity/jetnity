// Test-only module graph. No application root imports this file.
// The transpiled copies are the existing engines with one substituted registry
// constant. That substitution is not a live injection route.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
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
import { quellenKatalogSnapshotAntwort } from '@/lib/readiness/official-truth-source-catalog-server'
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
const retrieval = load<typeof import('@/lib/readiness/official-truth-server-owned-retrieval')>('lib/readiness/official-truth-server-owned-retrieval.ts', {
  [IDENTITY]: identityModule,
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

export async function observeRetrieval(options: {
  bytes?: number
  fault?: BodyFault
  engine?: 'substituted' | 'production'
  profiles?: 'approved' | 'clone' | 'absent'
  extra?: Record<string, unknown>
  timeoutMs?: number
}): Promise<RetrievalObservation> {
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

let lastPacket: unknown = null
let lastRetrieval: OfficialTruthServerOwnedRetrievalErgebnis | null = null
let activeTrip = fixtureTrip()

const evaluator = load<typeof Evaluation>('lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts', {
  './contract-server': {
    ...RealContract,
    applicationPilotEnabled: () => true,
    applicationContract: () => currentContract,
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
      const observed = await observeRetrieval({ bytes: pilotBytes, fault: 'none', engine: 'substituted', profiles: 'approved' })
      assert.deepEqual(eingabe, { sourceId: POLICY.sourceId, url: POLICY.requestUrl })
      lastRetrieval = observed.result
      return observed.result
    },
  },
  '@/lib/readiness/official-truth-rule-review-packet': {
    ...packet,
    officialTruthRegelReviewBelege: (input: unknown) => {
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
          body: (async function* () { state.pulled += 1; yield Buffer.from('x') })(),
          framingComplete: () => true, cancel: () => undefined,
        }
      },
    },
  )
  return { graph: true as const, reason: null, result, calls: state.calls, pulled: state.pulled }
}

export async function observePilot(bytes: number) {
  pilotBytes = bytes
  lastPacket = null
  lastRetrieval = null
  activeTrip = fixtureTrip()
  const trip = activeTrip
  const result = await evaluator.evaluateApplicationPilot(trip, new AbortController().signal)
  return {
    result,
    retrieval: lastRetrieval as OfficialTruthServerOwnedRetrievalErgebnis | null,
    packet: lastPacket,
    trip,
  }
}
