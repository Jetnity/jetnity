import {
  OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY,
  type ContentIdentityProfileDefinition,
} from '@/lib/readiness/official-truth-content-identity'

export const OFFICIAL_TRUTH_CH_DE_SOURCE_BUDGET_128K_1 = Object.freeze({
  sourceId: 'de-bern-embassy-research-only',
  contentItemId: 'bern-visa-entry-2611474',
  contentItemVersion: 1,
  representationId: 'bern-visa-entry-html-de',
  representationVersion: 1,
  identityProfileId: 'de-bern-entry-page-unqualified',
  identityProfileVersion: 1,
  requestUrl: 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474',
  mediaType: 'text/html',
  maxBytes: 131_072,
})

type Candidate = Readonly<{
  sourceId: string
  contentItemId: string
  contentItemVersion: number
  representationId: string
  representationVersion: number
  identityProfileId: string
  identityProfileVersion: number
}>

type Item = Readonly<{
  sourceId: string
  contentItemId: string
  contentItemVersion: number
  current: boolean
}>

type Representation = Readonly<{
  sourceId: string
  contentItemId: string
  contentItemVersion: number
  representationId: string
  representationVersion: number
  identityProfileId: string
  identityProfileVersion: number
  current: boolean
  requestUrls: readonly string[]
  expectedFinalUrl: string
  expectedMediaType: string
}>

export function officialTruthChDeSourceBudget128k1(
  identity: Candidate,
  item: Item,
  representation: Representation,
  requestUrl: string,
  currentUrl: string,
  mediaType: string,
  identityProfile: ContentIdentityProfileDefinition,
): number | null {
  const candidate = OFFICIAL_TRUTH_CH_DE_SOURCE_BUDGET_128K_1
  const approvedProfile = OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.find((profile) =>
    profile.current
    && profile.identityProfileId === candidate.identityProfileId
    && profile.identityProfileVersion === candidate.identityProfileVersion)
  if (!approvedProfile || identityProfile !== approvedProfile) return null
  const exactIdentity = identity.sourceId === candidate.sourceId
    && identity.contentItemId === candidate.contentItemId
    && identity.contentItemVersion === candidate.contentItemVersion
    && identity.representationId === candidate.representationId
    && identity.representationVersion === candidate.representationVersion
    && identity.identityProfileId === candidate.identityProfileId
    && identity.identityProfileVersion === candidate.identityProfileVersion
  const exactCurrentItem = item.sourceId === candidate.sourceId
    && item.contentItemId === candidate.contentItemId
    && item.contentItemVersion === candidate.contentItemVersion
    && item.current === true
  const exactRepresentation = representation.sourceId === candidate.sourceId
    && representation.contentItemId === candidate.contentItemId
    && representation.contentItemVersion === candidate.contentItemVersion
    && representation.representationId === candidate.representationId
    && representation.representationVersion === candidate.representationVersion
    && representation.identityProfileId === candidate.identityProfileId
    && representation.identityProfileVersion === candidate.identityProfileVersion
    && representation.current === true
    && representation.requestUrls.length === 1
    && representation.requestUrls[0] === candidate.requestUrl
    && representation.expectedFinalUrl === candidate.requestUrl
    && representation.expectedMediaType === candidate.mediaType
  return exactIdentity && exactCurrentItem && exactRepresentation
    && requestUrl === candidate.requestUrl
    && currentUrl === candidate.requestUrl
    && mediaType === candidate.mediaType
    ? candidate.maxBytes
    : null
}

export function officialTruthChDeSourceFingerprintV2Allowed(
  registry: unknown,
  identity: Candidate,
  finalUrl: string,
  mediaType: string,
): boolean {
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) return false
  const graph = (registry as { contentIdentity?: unknown }).contentIdentity
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) return false
  const contentGraph = graph as {
    items?: readonly Item[]
    representations?: readonly Representation[]
  }
  if (!Array.isArray(contentGraph.items) || !Array.isArray(contentGraph.representations)) return false
  const item = contentGraph.items.find((entry) =>
    entry.sourceId === identity.sourceId
    && entry.contentItemId === identity.contentItemId
    && entry.contentItemVersion === identity.contentItemVersion)
  const representation = contentGraph.representations.find((entry) =>
    entry.sourceId === identity.sourceId
    && entry.contentItemId === identity.contentItemId
    && entry.representationId === identity.representationId
    && entry.contentItemVersion === identity.contentItemVersion
    && entry.representationVersion === identity.representationVersion
    && entry.identityProfileId === identity.identityProfileId
    && entry.identityProfileVersion === identity.identityProfileVersion)
  const profile = OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.find((entry) =>
    entry.current
    && entry.identityProfileId === identity.identityProfileId
    && entry.identityProfileVersion === identity.identityProfileVersion)
  return !!item && !!representation && !!profile
    && officialTruthChDeSourceBudget128k1(identity, item, representation,
      OFFICIAL_TRUTH_CH_DE_SOURCE_BUDGET_128K_1.requestUrl, finalUrl, mediaType, profile) === 131_072
}
