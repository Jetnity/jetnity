// Dormant identity contracts. A validated graph is data, never origin proof.
import { sha256Hex } from '@/lib/readiness/digest'
import { evidenceSuchschluessel } from '@/lib/readiness/evidence'
import { checkedAtLesen, gültigkeitszeitLesen, quelleUrlLesen } from '@/lib/readiness/official'
import { regelScopeAusEvidenceScope, type RegelScope } from '@/lib/readiness/rule-claims'
import { quellenRegistryErstellen, quellenUrlAufloesen, type QuellenRegistry } from '@/lib/readiness/source-registry'

type Frozen<T> = T extends readonly (infer U)[] ? readonly Frozen<U>[]
  : T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T
type Result<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; reason: ContentIdentityFailure }>

export type ContentIdentityFailure =
  | 'invalid_ref' | 'invalid_support_list' | 'duplicate_content_item_ref'
  | 'invalid_descriptor' | 'invalid_registry' | 'bound_exceeded'
  | 'unknown_source' | 'source_not_official' | 'source_mismatch'
  | 'duplicate_item_version' | 'duplicate_current_item' | 'external_identity_conflict'
  | 'item_identity_drift' | 'missing_item_version' | 'historical_item_version'
  | 'duplicate_representation_version' | 'duplicate_current_representation' | 'representation_identity_drift'
  | 'invalid_url' | 'url_not_authorized' | 'url_conflict' | 'not_registered' | 'ambiguous_url'
  | 'invalid_media_type' | 'invalid_profile' | 'duplicate_profile_version' | 'duplicate_current_profile'
  | 'profile_unavailable' | 'invalid_scope' | 'invalid_evidence_identity'

export const CONTENT_IDENTITY_LIMITS = Object.freeze({
  itemVersions: 1024, representationVersions: 4096, profiles: 128,
  requestUrls: 16, publisherIds: 8, supportRefs: 8, version: 2_147_483_647,
})

/** The ordered pair alone identifies a composition support. */
export type ContentItemRef = Readonly<{ sourceId: string; contentItemId: string }>
export type RepresentationRef = ContentItemRef & Readonly<{ representationId: string }>
export type ContentItemDescriptor = ContentItemRef & Readonly<{
  contentItemVersion: number
  current: boolean
  externalIdNamespace: string
  externalContentId: string
  expectedPublisherIds: readonly string[]
  expectedAuthorityIds: readonly string[]
}>
export type RepresentationDescriptor = RepresentationRef & Readonly<{
  contentItemVersion: number
  representationVersion: number
  current: boolean
  requestUrls: readonly string[]
  expectedFinalUrl: string
  expectedMediaType: string
  identityProfileId: string
  identityProfileVersion: number
  expectedLocale: string | null
  expectedSchema: string | null
}>

export type ContentIdentityBinding = RepresentationRef & Readonly<{
  contentItemVersion: number
  representationVersion: number
  identityProfileId: string
  identityProfileVersion: number
}>

/**
 * Code-owned deterministic contract only; no executor in this slice.
 * Future trusted code must pass frozen descriptors and its bounded UTF-8
 * response text, then rebind the returned tuple. No graph or mutable bytes
 * are passed to the verifier. A verdict is only item/representation identity.
 */
export type ContentIdentityProfileDefinition = Readonly<{
  identityProfileId: string
  identityProfileVersion: number
  current: boolean
  verify: (input: Readonly<{
    item: ContentItemDescriptor
    representation: RepresentationDescriptor
    responseText: string
    finalUrl: string
    mediaType: string
  }>) => Readonly<{ ok: true; identity: ContentIdentityBinding }>
    | Readonly<{ ok: false; reason: 'identity_mismatch' | 'invalid_response' }>
}>

export const OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY: readonly ContentIdentityProfileDefinition[] = Object.freeze([])

type ProfilePin = Omit<ContentIdentityProfileDefinition, 'verify'>
export type ContentIdentityGraph = Readonly<{
  authorityRegistry: Frozen<QuellenRegistry>
  items: readonly ContentItemDescriptor[]
  representations: readonly RepresentationDescriptor[]
  profiles: readonly ProfilePin[]
}>

const REF_FIELDS = ['sourceId', 'contentItemId'] as const
const REPRESENTATION_FIELDS = [...REF_FIELDS, 'representationId'] as const
const ITEM_FIELDS = [...REF_FIELDS, 'contentItemVersion', 'current', 'externalIdNamespace', 'externalContentId',
  'expectedPublisherIds', 'expectedAuthorityIds'] as const
const DESCRIPTOR_FIELDS = [...REPRESENTATION_FIELDS, 'contentItemVersion', 'representationVersion', 'current',
  'requestUrls', 'expectedFinalUrl', 'expectedMediaType', 'identityProfileId', 'identityProfileVersion',
  'expectedLocale', 'expectedSchema'] as const
const PROFILE_FIELDS = ['identityProfileId', 'identityProfileVersion', 'current', 'verify'] as const
const ID = /^[a-z][a-z0-9_-]{1,63}$/
const EXTERNAL_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const MEDIA_TYPE = /^[a-z0-9][a-z0-9!#$&^_.+-]{0,63}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,63}$/

function fail(reason: ContentIdentityFailure): Result<never> { return Object.freeze({ ok: false, reason }) }
function freeze<T>(value: T): Frozen<T> {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value as Frozen<T>
}
function success<T>(value: T): Result<Frozen<T>> { return Object.freeze({ ok: true, value: freeze(value) }) }
function id(value: unknown): value is string { return typeof value === 'string' && ID.test(value) }
function version(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= CONTENT_IDENTITY_LIMITS.version
}
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0 }

/** Exact own data properties: reject accessors, symbols, prototypes and extras. */
function record(value: unknown, fields: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return null
  const keys = Reflect.ownKeys(value)
  if (keys.length !== fields.length || keys.some((key) => typeof key !== 'string' || !fields.includes(key))) return null
  for (const key of fields) {
    const property = Object.getOwnPropertyDescriptor(value, key)
    if (!property || !('value' in property) || !property.enumerable) return null
  }
  return value as Record<string, unknown>
}
function list(value: unknown, max: number): value is unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > max) return false
  if (Reflect.ownKeys(value).length !== value.length + 1) return false
  for (let i = 0; i < value.length; i++) {
    const property = Object.getOwnPropertyDescriptor(value, String(i))
    if (!property || !('value' in property) || !property.enumerable) return false
  }
  return true
}
function refFrom(row: Record<string, unknown>): ContentItemRef | null {
  return id(row.sourceId) && id(row.contentItemId) ? { sourceId: row.sourceId, contentItemId: row.contentItemId } : null
}
function representationFrom(row: Record<string, unknown>): RepresentationRef | null {
  const ref = refFrom(row)
  return ref && id(row.representationId) ? { ...ref, representationId: row.representationId } : null
}
function itemKey(ref: ContentItemRef): string { return JSON.stringify([ref.sourceId, ref.contentItemId]) }
function representationKey(ref: RepresentationRef): string {
  return JSON.stringify([ref.sourceId, ref.contentItemId, ref.representationId])
}
function compareRefs(a: ContentItemRef, b: ContentItemRef): number {
  return compare(a.sourceId, b.sourceId) || compare(a.contentItemId, b.contentItemId)
}

export function readContentItemRef(value: unknown): Result<ContentItemRef> {
  const row = record(value, REF_FIELDS)
  const ref = row && refFrom(row)
  return ref ? success(ref) : fail('invalid_ref')
}
export function contentItemRefKey(value: unknown): Result<string> {
  const ref = readContentItemRef(value)
  return ref.ok ? success(itemKey(ref.value)) : ref
}
export function contentItemRefsEqual(left: unknown, right: unknown): Result<boolean> {
  const a = readContentItemRef(left), b = readContentItemRef(right)
  if (!a.ok) return a
  if (!b.ok) return b
  return success(compareRefs(a.value, b.value) === 0)
}
export function readDistinctContentItemRefs(value: unknown): Result<readonly ContentItemRef[]> {
  if (!list(value, CONTENT_IDENTITY_LIMITS.supportRefs) || !value.length) return fail('invalid_support_list')
  const refs: ContentItemRef[] = []
  const seen = new Set<string>()
  for (const entry of value) {
    const ref = readContentItemRef(entry)
    if (!ref.ok) return ref
    const key = itemKey(ref.value)
    if (seen.has(key)) return fail('duplicate_content_item_ref')
    seen.add(key)
    refs.push(ref.value)
  }
  return success(refs.sort(compareRefs))
}
export function readRepresentationRef(value: unknown): Result<RepresentationRef> {
  const row = record(value, REPRESENTATION_FIELDS)
  const ref = row && representationFrom(row)
  return ref ? success(ref) : fail('invalid_ref')
}
export function representationRefKey(value: unknown): Result<string> {
  const ref = readRepresentationRef(value)
  return ref.ok ? success(representationKey(ref.value)) : ref
}

/** Existing URL validation, narrowed to canonical default-port requests. */
function requestUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value !== value.trim() || /[\s*]/.test(value)) return null
  const canonical = quelleUrlLesen(value)
  if (!canonical) return null
  const url = new URL(canonical)
  if (url.port || url.hostname.endsWith('.localhost')) return null
  url.hash = ''
  return url.toString()
}
function exactUrl(value: unknown): value is string { return requestUrl(value) === value && typeof value === 'string' }
function mediaType(value: unknown): value is string { return typeof value === 'string' && MEDIA_TYPE.test(value) }
function metadataIds(value: unknown): readonly string[] | null {
  if (!list(value, CONTENT_IDENTITY_LIMITS.publisherIds) || !value.length) return null
  const ids: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string' || !EXTERNAL_ID.test(entry) || ids.includes(entry)) return null
    ids.push(entry)
  }
  return ids.sort(compare)
}
function readItem(value: unknown): Result<ContentItemDescriptor> {
  const row = record(value, ITEM_FIELDS), ref = row && refFrom(row)
  if (!row || !ref || !version(row.contentItemVersion) || typeof row.current !== 'boolean'
    || !id(row.externalIdNamespace) || typeof row.externalContentId !== 'string' || !EXTERNAL_ID.test(row.externalContentId)) {
    return fail('invalid_descriptor')
  }
  const publishers = metadataIds(row.expectedPublisherIds), authorities = metadataIds(row.expectedAuthorityIds)
  if (!publishers || !authorities) return fail('invalid_descriptor')
  return success({ ...ref, contentItemVersion: row.contentItemVersion, current: row.current,
    externalIdNamespace: row.externalIdNamespace, externalContentId: row.externalContentId,
    expectedPublisherIds: publishers, expectedAuthorityIds: authorities })
}
function readRepresentation(value: unknown): Result<RepresentationDescriptor> {
  const row = record(value, DESCRIPTOR_FIELDS), ref = row && representationFrom(row)
  if (!row || !ref || !version(row.contentItemVersion) || !version(row.representationVersion)
    || typeof row.current !== 'boolean' || !id(row.identityProfileId) || !version(row.identityProfileVersion)
    || !(row.expectedLocale === null || (typeof row.expectedLocale === 'string' && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/.test(row.expectedLocale)))
    || !(row.expectedSchema === null || id(row.expectedSchema))) return fail('invalid_descriptor')
  if (!mediaType(row.expectedMediaType)) return fail('invalid_media_type')
  if (!list(row.requestUrls, CONTENT_IDENTITY_LIMITS.requestUrls) || !row.requestUrls.length || !exactUrl(row.expectedFinalUrl)) {
    return fail('invalid_url')
  }
  const urls: string[] = []
  for (const url of row.requestUrls) {
    if (!exactUrl(url)) return fail('invalid_url')
    if (urls.includes(url)) return fail('url_conflict')
    urls.push(url)
  }
  return success({ ...ref, contentItemVersion: row.contentItemVersion, representationVersion: row.representationVersion,
    current: row.current, requestUrls: urls.sort(compare), expectedFinalUrl: row.expectedFinalUrl,
    expectedMediaType: row.expectedMediaType, identityProfileId: row.identityProfileId,
    identityProfileVersion: row.identityProfileVersion, expectedLocale: row.expectedLocale, expectedSchema: row.expectedSchema })
}

/**
 * Complete graph validation. The explicit profile argument is a pure test
 * seam, never a caller registration boundary. Functions are checked but never
 * invoked/retained; the graph exposes only copied profile pins.
 * All-version URL reservations belong to a representation stream in R1.
 * There is no retire/rebind operation. Even historical rows need a current
 * code profile; incompatible history makes this complete graph ineligible.
 */
export function createContentIdentityGraph(
  authorityRegistry: QuellenRegistry,
  itemVersions: unknown,
  representationVersions: unknown,
  profileDefinitions: readonly ContentIdentityProfileDefinition[] = OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY,
): Result<ContentIdentityGraph> {
  if (!list(itemVersions, CONTENT_IDENTITY_LIMITS.itemVersions)
    || !list(representationVersions, CONTENT_IDENTITY_LIMITS.representationVersions)
    || !list(profileDefinitions, CONTENT_IDENTITY_LIMITS.profiles)) return fail('bound_exceeded')
  // Rebuild rather than trusting object identity or freezing a caller's object.
  // Existing registry validation is the sole domain-overlap implementation.
  let registry: QuellenRegistry
  try {
    if (!record(authorityRegistry, ['sources', 'blockedDomains'])
      || !Array.isArray(authorityRegistry.sources) || !Array.isArray(authorityRegistry.blockedDomains)) return fail('invalid_registry')
    const checked = quellenRegistryErstellen(authorityRegistry.sources, { blockedDomains: authorityRegistry.blockedDomains })
    if (!checked.ok) return fail('invalid_registry')
    registry = checked.registry
  } catch { return fail('invalid_registry') }

  const profiles: ProfilePin[] = []
  const profileVersions = new Set<string>(), currentProfiles = new Set<string>()
  for (const entry of profileDefinitions) {
    const row = record(entry, PROFILE_FIELDS)
    if (!row || !id(row.identityProfileId) || !version(row.identityProfileVersion)
      || typeof row.current !== 'boolean' || typeof row.verify !== 'function') return fail('invalid_profile')
    const key = JSON.stringify([row.identityProfileId, row.identityProfileVersion])
    if (profileVersions.has(key)) return fail('duplicate_profile_version')
    if (row.current && currentProfiles.has(row.identityProfileId)) return fail('duplicate_current_profile')
    profileVersions.add(key)
    if (row.current) currentProfiles.add(row.identityProfileId)
    profiles.push({ identityProfileId: row.identityProfileId, identityProfileVersion: row.identityProfileVersion, current: row.current })
  }
  profiles.sort((a, b) => compare(a.identityProfileId, b.identityProfileId) || a.identityProfileVersion - b.identityProfileVersion)

  const sources = new Map(registry.sources.map((source) => [source.sourceId, source]))
  const items: ContentItemDescriptor[] = []
  const byVersion = new Map<string, ContentItemDescriptor>(), currentItems = new Set<string>()
  const externalOwners = new Map<string, string>(), externalByItem = new Map<string, string>()
  for (const entry of itemVersions) {
    const parsed = readItem(entry)
    if (!parsed.ok) return parsed
    const item = parsed.value, key = itemKey(item)
    const source = sources.get(item.sourceId)
    if (!source) return fail('unknown_source')
    if (source.sourceClass !== 'official_authority') return fail('source_not_official')
    const versionKey = JSON.stringify([item.sourceId, item.contentItemId, item.contentItemVersion])
    if (byVersion.has(versionKey)) return fail('duplicate_item_version')
    if (item.current && currentItems.has(key)) return fail('duplicate_current_item')
    const external = JSON.stringify([item.sourceId, item.externalIdNamespace, item.externalContentId])
    if (externalOwners.has(external) && externalOwners.get(external) !== key) return fail('external_identity_conflict')
    if (externalByItem.has(key) && externalByItem.get(key) !== external) return fail('item_identity_drift')
    externalOwners.set(external, key)
    externalByItem.set(key, external)
    byVersion.set(versionKey, item)
    if (item.current) currentItems.add(key)
    items.push(item)
  }
  items.sort((a, b) => compareRefs(a, b) || a.contentItemVersion - b.contentItemVersion)

  const representations: RepresentationDescriptor[] = []
  const repVersions = new Set<string>(), currentReps = new Set<string>()
  const streamFormats = new Map<string, string>(), urlOwners = new Map<string, string>()
  const currentUrls = new Set<string>()
  for (const entry of representationVersions) {
    const parsed = readRepresentation(entry)
    if (!parsed.ok) return parsed
    const rep = parsed.value, key = representationKey(rep)
    const item = byVersion.get(JSON.stringify([rep.sourceId, rep.contentItemId, rep.contentItemVersion]))
    if (!item) return fail('missing_item_version')
    if (rep.current && !item.current) return fail('historical_item_version')
    const versionKey = JSON.stringify([rep.sourceId, rep.contentItemId, rep.representationId, rep.representationVersion])
    if (repVersions.has(versionKey)) return fail('duplicate_representation_version')
    if (rep.current && currentReps.has(key)) return fail('duplicate_current_representation')
    const format = JSON.stringify([rep.expectedMediaType, rep.expectedLocale])
    if (streamFormats.has(key) && streamFormats.get(key) !== format) return fail('representation_identity_drift')
    if (!profiles.some((profile) => profile.identityProfileId === rep.identityProfileId
      && profile.identityProfileVersion === rep.identityProfileVersion && profile.current)) return fail('profile_unavailable')
    // A final target may also be listed as a request; that is one binding.
    for (const url of new Set([...rep.requestUrls, rep.expectedFinalUrl])) {
      const authority = quellenUrlAufloesen(registry, url)
      if (!authority.ok) return fail('url_not_authorized')
      if (authority.source.sourceId !== rep.sourceId) return fail('source_mismatch')
      if (urlOwners.has(url) && urlOwners.get(url) !== key) return fail('url_conflict')
      if (rep.current && currentUrls.has(url)) return fail('url_conflict')
      urlOwners.set(url, key)
      if (rep.current) currentUrls.add(url)
    }
    repVersions.add(versionKey)
    if (rep.current) currentReps.add(key)
    streamFormats.set(key, format)
    representations.push(rep)
  }
  representations.sort((a, b) => compareRefs(a, b) || compare(a.representationId, b.representationId)
    || a.representationVersion - b.representationVersion)
  return success({ authorityRegistry: registry, items, representations, profiles })
}

export function resolveCurrentContentRepresentation(graph: ContentIdentityGraph, value: unknown): Result<RepresentationDescriptor> {
  const url = requestUrl(value)
  if (!url) return fail('invalid_url')
  const matches = graph.representations.filter((rep) => rep.current && (rep.expectedFinalUrl === url || rep.requestUrls.includes(url)))
  if (!matches.length) return fail('not_registered')
  if (matches.length !== 1) return fail('ambiguous_url')
  const rep = matches[0]!
  const authority = quellenUrlAufloesen(graph.authorityRegistry, url)
  if (!authority.ok) return fail('url_not_authorized')
  if (authority.source.sourceId !== rep.sourceId) return fail('source_mismatch')
  // Copy also for a structurally forged test graph; never freeze caller data.
  return success({ ...rep, requestUrls: [...rep.requestUrls] })
}

export type ContentEvidenceLookup = Readonly<{ key: string; canonical: string; scope: Frozen<RegelScope> }>
/** Future serialization only. Both existing semantic projection and v2 serializer are reused. */
export function contentEvidenceLookupV3(scope: unknown, representation: unknown): Result<ContentEvidenceLookup> {
  const ref = readRepresentationRef(representation)
  if (!ref.ok) return ref
  const cell = regelScopeAusEvidenceScope(scope)
  if (!cell.ok) return fail('invalid_scope')
  // Source-bearing Evidence scope must not silently become another authority.
  const source = (scope as Record<string, unknown>).sourceId
  if (source !== undefined && (typeof source !== 'string' || source.trim() !== ref.value.sourceId)) return fail('source_mismatch')
  const legacy = evidenceSuchschluessel({ ...cell.scope, sourceId: ref.value.sourceId })
  if (!legacy.ok) return fail('invalid_scope')
  const fields: Record<string, unknown> = JSON.parse(legacy.canonical)
  const regulatoryCell = Object.fromEntries(Object.entries(fields).filter(([key]) => key !== 'v' && key !== 'sourceId'))
  const canonical = JSON.stringify({ v: 3, ...ref.value, ...regulatoryCell })
  return success({ canonical, key: `evidence-key:v3:${sha256Hex(canonical)}`, scope: cell.scope })
}

export type ContentEvidenceIdentity = ContentIdentityBinding & Readonly<{
  identitySchema: 2
  lookupKey: string
  canonicalUrl: string
  contentType: string
  sourceContentHash: string
  retrievedAt: string
  validFrom: string | null
  validUntil: string | null
}>
const EVIDENCE_FIELDS = [...REPRESENTATION_FIELDS, 'contentItemVersion', 'representationVersion', 'identityProfileId',
  'identityProfileVersion', 'identitySchema', 'lookupKey', 'canonicalUrl', 'contentType', 'sourceContentHash',
  'retrievedAt', 'validFrom', 'validUntil'] as const

/** Calendar hardening for supplied timestamps only; no current-time authority. */
function validTime(value: unknown, dateOnly: boolean): value is string {
  if (typeof value !== 'string' || value !== value.trim()) return false
  if (!(dateOnly ? gültigkeitszeitLesen(value) : checkedAtLesen(value))) return false
  const year = Number(value.slice(0, 4)), month = Number(value.slice(5, 7)), day = Number(value.slice(8, 10))
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]!) return false
  return value.length === 10 || (Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60 && Number(value.slice(17, 19)) < 60)
}

/** Future observation identity, not accepted Evidence or live-origin proof. */
export function contentEvidenceVersionV2(value: unknown): Result<Readonly<{
  identity: ContentEvidenceIdentity; canonical: string; versionId: string
}>> {
  const row = record(value, EVIDENCE_FIELDS), ref = row && representationFrom(row)
  if (!row || !ref || row.identitySchema !== 2 || !version(row.contentItemVersion) || !version(row.representationVersion)
    || !id(row.identityProfileId) || !version(row.identityProfileVersion)
    || typeof row.lookupKey !== 'string' || !/^evidence-key:v3:[a-f0-9]{64}$/.test(row.lookupKey)
    || !exactUrl(row.canonicalUrl) || !mediaType(row.contentType)
    || typeof row.sourceContentHash !== 'string' || !/^[a-f0-9]{64}$/.test(row.sourceContentHash)
    || !validTime(row.retrievedAt, false) || !(row.validFrom === null || validTime(row.validFrom, true))
    || !(row.validUntil === null || validTime(row.validUntil, true))) return fail('invalid_evidence_identity')
  if (row.validFrom !== null && row.validUntil !== null && Date.parse(row.validFrom) > Date.parse(row.validUntil)) {
    return fail('invalid_evidence_identity')
  }
  const identity: ContentEvidenceIdentity = {
    identitySchema: 2, sourceId: ref.sourceId, contentItemId: ref.contentItemId, contentItemVersion: row.contentItemVersion,
    representationId: ref.representationId, representationVersion: row.representationVersion,
    identityProfileId: row.identityProfileId, identityProfileVersion: row.identityProfileVersion,
    lookupKey: row.lookupKey, canonicalUrl: row.canonicalUrl, contentType: row.contentType,
    sourceContentHash: row.sourceContentHash, retrievedAt: row.retrievedAt, validFrom: row.validFrom, validUntil: row.validUntil,
  }
  const canonical = JSON.stringify(identity)
  return success({ identity, canonical, versionId: `ev2_${sha256Hex(canonical).slice(0, 32)}` })
}
