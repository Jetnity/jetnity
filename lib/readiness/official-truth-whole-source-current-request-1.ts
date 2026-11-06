import { OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_BYTES } from '@/lib/readiness/official-truth-source-fingerprint-v3'

/** Structural pins only. This module does not import the content-identity registry. */
type CurrentRequestBinding = Readonly<{
  sourceId: string
  contentItemId: string
  contentItemVersion: number
  representationId: string
  representationVersion: number
  identityProfileId: string
  identityProfileVersion: number
}>
type CurrentRequestProfile = Readonly<{ identityProfileId: string; identityProfileVersion: number; current: boolean }>
type CurrentRequestItem = Readonly<{ current: boolean; sourceId: string; contentItemId: string; contentItemVersion: number }>
type CurrentRequestRepresentation = CurrentRequestBinding & Readonly<{
  current: boolean
  requestUrls: readonly string[]
  expectedFinalUrl: string
  expectedMediaType: string
}>

const REQUEST_URL = 'https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2002/243/20201215/de/html/fedlex-data-admin-ch-eli-cc-2002-243-20201215-de-html-9.html'

/**
 * Dormant unqualified candidate. It is not an admitted source, profile,
 * extractor or application contract. Production has no compiled profile.
 */
export const OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY = Object.freeze({
  policyId: 'fedlex-fza-current-request-384k-v1',
  policyVersion: 1,
  sourceProtocol: 3 as const,
  usage: 'current_request_only' as const,
  sourceId: 'fedlex-federal-chancellery-unqualified-research',
  contentItemId: 'eli-cc-2002-243',
  contentItemVersion: 1,
  representationId: 'cc-20201215-de-html-9',
  representationVersion: 1,
  identityProfileId: 'fedlex-fza-20201215-html-9-unqualified',
  identityProfileVersion: 1,
  requestUrl: REQUEST_URL,
  expectedFinalUrl: REQUEST_URL,
  expectedMediaType: 'text/html',
  redirectAllowance: 0,
  maxBytes: OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_BYTES,
  maxUtf16Units: OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_BYTES,
})

export type OfficialTruthWholeSourceCurrentRequestGraph = Readonly<{
  items: readonly CurrentRequestItem[]
  representations: readonly CurrentRequestRepresentation[]
}>

const WALK_DEPTH = 12

/** Own-data walk. Getters are not invoked. Binary buffers are not scanned. */
export function officialTruthProtocol3MarkerPresent(value: unknown): boolean {
  const seen = new Set<object>()
  const visit = (node: unknown, depth: number): boolean => {
    if (depth > WALK_DEPTH || !node || typeof node !== 'object') return false
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(node)) return false
    if (node instanceof Uint8Array || node instanceof ArrayBuffer || node instanceof DataView) return false
    if (seen.has(node)) return false
    seen.add(node)
    for (const key of Reflect.ownKeys(node)) {
      if (typeof key !== 'string') continue
      const descriptor = Object.getOwnPropertyDescriptor(node, key)
      if (!descriptor || !('value' in descriptor)) continue
      if (key === 'sourceFingerprintProtocol' && descriptor.value === 3) return true
      if (visit(descriptor.value, depth + 1)) return true
    }
    return false
  }
  return visit(value, 0)
}

/** The object inside the supplied server registry, never a field-wise clone. */
export function officialTruthWholeSourceCurrentRequestProfile<T extends CurrentRequestProfile>(
  serverProfiles: readonly T[],
): T | null {
  if (!Array.isArray(serverProfiles)) return null
  const matches = serverProfiles.filter((profile) => profile
    && profile.current === true
    && profile.identityProfileId === OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY.identityProfileId
    && profile.identityProfileVersion === OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY.identityProfileVersion)
  return matches.length === 1 ? matches[0]! : null
}

function sameBinding(identity: CurrentRequestBinding, representation: CurrentRequestRepresentation): boolean {
  const policy = OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY
  return identity.sourceId === policy.sourceId
    && identity.contentItemId === policy.contentItemId
    && identity.contentItemVersion === policy.contentItemVersion
    && identity.representationId === policy.representationId
    && identity.representationVersion === policy.representationVersion
    && identity.identityProfileId === policy.identityProfileId
    && identity.identityProfileVersion === policy.identityProfileVersion
    && representation.sourceId === policy.sourceId
    && representation.contentItemId === policy.contentItemId
    && representation.contentItemVersion === policy.contentItemVersion
    && representation.representationId === policy.representationId
    && representation.representationVersion === policy.representationVersion
    && representation.identityProfileId === policy.identityProfileId
    && representation.identityProfileVersion === policy.identityProfileVersion
}

/**
 * Exact dormant tuple. Body size, hostname suffix and caller protocol are not inputs.
 * `serverProfiles` must be the code-owned registry array the caller actually holds.
 */
export function officialTruthWholeSourceCurrentRequestAllowed(selection: Readonly<{
  serverProfiles: readonly CurrentRequestProfile[]
  identity: CurrentRequestBinding
  canonicalUrl: string
  contentType: string
  requestUrl: string
  graph: OfficialTruthWholeSourceCurrentRequestGraph | null | undefined
}>): boolean {
  const policy = OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY
  if (!officialTruthWholeSourceCurrentRequestProfile(selection.serverProfiles)) return false
  const graph = selection.graph
  if (!graph || !Array.isArray(graph.items) || !Array.isArray(graph.representations)) return false
  if (selection.requestUrl !== policy.requestUrl || selection.canonicalUrl !== policy.expectedFinalUrl) return false
  if (selection.contentType !== policy.expectedMediaType) return false
  const items = graph.items.filter((item) => item.current
    && item.sourceId === policy.sourceId && item.contentItemId === policy.contentItemId)
  if (items.length !== 1 || items[0]!.contentItemVersion !== policy.contentItemVersion) return false
  const representations = graph.representations.filter((representation) => representation.current
    && representation.sourceId === policy.sourceId
    && representation.contentItemId === policy.contentItemId
    && representation.representationId === policy.representationId)
  if (representations.length !== 1) return false
  const representation = representations[0]!
  if (!sameBinding(selection.identity, representation)) return false
  if (representation.requestUrls.length !== 1 || representation.requestUrls[0] !== policy.requestUrl) return false
  if (representation.expectedFinalUrl !== policy.expectedFinalUrl) return false
  if (representation.expectedMediaType !== policy.expectedMediaType) return false
  return true
}
