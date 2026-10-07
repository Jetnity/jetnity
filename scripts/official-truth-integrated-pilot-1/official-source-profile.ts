// Isolated exact passport-guide profile. Never registered in shipped constants.
import { createHash } from 'node:crypto'
import { contentIdentityBinding, type ContentIdentityProfileDefinition } from '@/lib/readiness/official-truth-content-identity'
import { immutable, ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { REVIEWED_PASSPORT_COMPONENTS } from './official-source-reviewed'

export const PASSPORT_GUIDE = immutable({ sourceId: 'govuk', contentItemId: 'uk-border-control',
  contentId: '435fb04f-2b9f-4f44-8b41-2a962e8c46a8', publisherId: 'af07d5a5-df63-4ddc-9383-6a666845ebe9',
  authorityIds: ['3808b369-f1d6-44d3-a5b2-a7b7ac931106', '6667cce2-e809-4e21-ae09-cb0bdc1ddda3',
    '6ccd7811-868d-4a06-b9d5-2a2e87c3f521', '04148522-b0c1-4137-b687-5f3c3bdd561a'],
  requestUrl: 'https://www.gov.uk/api/content/uk-border-control/before-you-leave-for-the-uk',
  finalUrl: 'https://www.gov.uk/api/content/uk-border-control',
  publicUrl: 'https://www.gov.uk/uk-border-control/before-you-leave-for-the-uk',
  profileId: 'govuk-passport-guide-isolated-en' })

/** Conservative compact-JSON representation language; exact reserialization
 * rejects duplicate members and nonstandard escapes, before any identity trust.
 * This is not a general replacement JSON parser or a relaxed legacy parser. */
export function readPassportGuide(text: unknown): Record<string, unknown> | null {
  if (typeof text !== 'string' || Buffer.byteLength(text) > 131_072) return null
  let depth = 0, quoted = false, escaped = false
  for (const character of text) {
    if (quoted) { if (escaped) escaped = false; else if (character === '\\') escaped = true; else if (character === '"') quoted = false }
    else if (character === '"') quoted = true
    else if (character === '{' || character === '[') { if (++depth > 16) return null }
    else if (character === '}' || character === ']') { if (--depth < 0) return null }
  }
  if (depth || quoted) return null
  try {
    const value: unknown = JSON.parse(text)
    if (JSON.stringify(value) !== text) return null
    return ownRecord(value, [...Object.keys(REVIEWED_PASSPORT_COMPONENTS), 'publishing_request_id'])
  } catch { return null }
}

export const PASSPORT_IDENTITY_PROFILE: ContentIdentityProfileDefinition = immutable({
  identityProfileId: PASSPORT_GUIDE.profileId, identityProfileVersion: 1, current: true,
  verify({ item, representation, responseText, finalUrl, mediaType }) {
    const bad = { ok: false as const, reason: 'identity_mismatch' as const }
    if (item.sourceId !== PASSPORT_GUIDE.sourceId || item.contentItemId !== PASSPORT_GUIDE.contentItemId
      || item.externalContentId !== PASSPORT_GUIDE.contentId || item.externalIdNamespace !== 'govuk-content-id'
      || JSON.stringify(item.expectedPublisherIds) !== JSON.stringify([PASSPORT_GUIDE.publisherId])
      || JSON.stringify(item.expectedAuthorityIds) !== JSON.stringify(PASSPORT_GUIDE.authorityIds)
      || representation.identityProfileId !== PASSPORT_GUIDE.profileId || representation.identityProfileVersion !== 1
      || finalUrl !== PASSPORT_GUIDE.finalUrl || mediaType !== 'application/json') return bad
    const row = readPassportGuide(responseText)
    if (!row) return { ok: false, reason: 'invalid_response' }
    if (row.content_id !== PASSPORT_GUIDE.contentId || row.base_path !== '/uk-border-control'
      || row.schema_name !== 'guide' || row.document_type !== 'guide' || row.locale !== 'en'
      || row.phase !== 'live' || row.publishing_app !== 'publisher' || row.rendering_app !== 'frontend') return bad
    const links = row.links as Record<string, unknown> | null
    const ids = (value: unknown) => Array.isArray(value) ? value.map(r => r && typeof r === 'object' ? r.content_id : null) : []
    if (!links || JSON.stringify(ids(links.primary_publishing_organisation)) !== JSON.stringify([PASSPORT_GUIDE.publisherId])
      || JSON.stringify(ids(links.organisations)) !== JSON.stringify(PASSPORT_GUIDE.authorityIds)) return bad
    return { ok: true, identity: contentIdentityBinding(representation) }
  },
})

const qualified = new WeakSet<object>()
/** Full response qualification never drops unused fields or opaque metadata. */
export function qualifyPassportWholeResponse(sourceSnapshot: string) {
  const row = readPassportGuide(sourceSnapshot)
  if (!row) return { ok: false as const, reason: 'passport_response_shape_unqualified' as const }
  // Publishing job/context identifiers have no established non-personal global
  // semantics in this pilot. Do not copy, hash, redact-and-admit or reinterpret them.
  if (row.publishing_request_id !== null) return { ok: false as const, reason: 'opaque_publishing_metadata' as const }
  for (const [key, approved] of Object.entries(REVIEWED_PASSPORT_COMPONENTS)) {
    if (createHash('sha256').update(JSON.stringify(row[key])).digest('hex') !== approved) {
      return { ok: false as const, reason: 'unreviewed_public_component' as const }
    }
  }
  const observation = immutable({ sourceSnapshot, qualification: 'govuk-passport-whole-response-v1' as const })
  qualified.add(observation)
  return { ok: true as const, observation }
}

export function extractQualifiedPassportObservation(observation: unknown) {
  if (!observation || typeof observation !== 'object' || !qualified.has(observation)) return null
  qualified.delete(observation)
  const row = observation as { sourceSnapshot: string }
  const parsed = readPassportGuide(row.sourceSnapshot)
  const details = parsed?.details as { parts?: { slug?: string; body?: string }[] } | undefined
  const matching = details?.parts?.filter(p => p.slug === 'before-you-leave-for-the-uk')
  if (matching?.length !== 1 || typeof matching[0]!.body !== 'string') return null
  return passportFactFromQualifiedChapter(matching[0]!.body)
}

/** Narrow deterministic semantic proposal; qualification and origin are separate. */
export function passportFactFromQualifiedChapter(body: string) {
  if (typeof body !== 'string') return null
  const heading = '<h2 id="youre-from-the-eu-switzerland-norway-iceland-or-liechtenstein">'
  if (body.split(heading).length !== 2) return null
  const section = body.split(heading)[1]!.split('<h2 ')[0]!
  const sentence = '<p>Your identity document should be valid for the whole of your stay.</p>'
  if (section.split(sentence).length !== 2 || !section.includes('<li>a passport</li>')) return null
  // This asserts one passport-validity dimension only. Visa/ETA, admission,
  // route exceptions and other document choices are not a complete entry rule.
  return immutable({ kind: 'passport_validity' as const, semantics: 'valid_through_stay' as const, duration: null })
}
