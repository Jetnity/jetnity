// Dormant, pure National List identity only. No registration or legal extraction.
import type { ContentIdentityProfileDefinition } from './official-truth-content-identity'

type JsonObject = Record<string, unknown>
const INVALID = Object.freeze({ ok: false as const, reason: 'invalid_response' as const })
const MISMATCH = Object.freeze({ ok: false as const, reason: 'identity_mismatch' as const })

export const GOVUK_CONTENT_API_JSON_LIMITS = Object.freeze({
  bytes: 65_536, depth: 16, members: 2_048, membersPerObject: 256,
  elementsPerArray: 1_024, values: 4_096, keyCodeUnits: 128, numberCodeUnits: 64,
})

/** Whole-string grammar/decoded-key scan BEFORE JSON.parse or identity reads. */
export function parseGovukContentApiJson(text: string):
  Readonly<{ ok: true; value: JsonObject }> | typeof INVALID {
  const limits = GOVUK_CONTENT_API_JSON_LIMITS
  // UTF-16 length is a cheap lower bound; cap allocation by TextEncoder too.
  if (typeof text !== 'string' || !text.length || text.length > limits.bytes
    || new TextEncoder().encode(text).length > limits.bytes) return INVALID
  let cursor = 0, members = 0, values = 0
  const invalid = (): never => { throw INVALID }
  const whitespace = () => {
    while (cursor < text.length && ' \t\r\n'.includes(text[cursor]!)) cursor++
  }
  const take = (token: string) => {
    if (text[cursor] !== token) invalid()
    cursor++
  }
  const digit = () => text[cursor] !== undefined && text[cursor]! >= '0' && text[cursor]! <= '9'
  const string = (key: boolean): string => {
    take('"')
    let decoded = '', length = 0, highSurrogate = false
    while (cursor < text.length) {
      let unit = text.charCodeAt(cursor++)
      if (unit === 0x22) {
        if (highSurrogate) invalid()
        return decoded
      }
      if (unit < 0x20) invalid()
      if (unit === 0x5c) {
        const escape = text[cursor++]
        if (escape === 'u') {
          const hex = text.slice(cursor, cursor + 4)
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) invalid()
          unit = Number.parseInt(hex, 16)
          cursor += 4
        } else {
          switch (escape) {
            case '"': unit = 0x22; break
            case '\\': unit = 0x5c; break
            case '/': unit = 0x2f; break
            case 'b': unit = 0x08; break
            case 'f': unit = 0x0c; break
            case 'n': unit = 0x0a; break
            case 'r': unit = 0x0d; break
            case 't': unit = 0x09; break
            default: invalid()
          }
        }
      }
      // Validate the decoded UTF-16 stream, including raw/escaped mixed pairs.
      if (highSurrogate) {
        if (unit < 0xdc00 || unit > 0xdfff) invalid()
        highSurrogate = false
      } else if (unit >= 0xd800 && unit <= 0xdbff) highSurrogate = true
      else if (unit >= 0xdc00 && unit <= 0xdfff) invalid()
      if (key) {
        if (++length > limits.keyCodeUnits) invalid()
        decoded += String.fromCharCode(unit)
      }
    }
    return invalid()
  }
  const number = () => {
    const start = cursor
    if (text[cursor] === '-') cursor++
    if (text[cursor] === '0') cursor++
    else {
      if (!digit() || text[cursor] === '0') invalid()
      while (digit()) cursor++
    }
    if (text[cursor] === '.') {
      cursor++
      if (!digit()) invalid()
      while (digit()) cursor++
    }
    if (text[cursor] === 'e' || text[cursor] === 'E') {
      cursor++
      if (text[cursor] === '+' || text[cursor] === '-') cursor++
      if (!digit()) invalid()
      while (digit()) cursor++
    }
    if (cursor - start > limits.numberCodeUnits || !Number.isFinite(Number(text.slice(start, cursor)))) invalid()
  }
  const value = (parentDepth: number): void => {
    if (++values > limits.values) invalid()
    whitespace()
    const token = text[cursor]
    if (token === '{' || token === '[') {
      const depth = parentDepth + 1
      if (depth > limits.depth) invalid()
      cursor++
      whitespace()
      if (token === '{') {
        const keys = new Set<string>()
        let count = 0
        if (text[cursor] === '}') { cursor++; return }
        while (true) {
          if (++count > limits.membersPerObject || ++members > limits.members) invalid()
          const key = string(true)
          if (keys.has(key) || key === '__proto__' || key === 'prototype' || key === 'constructor') invalid()
          keys.add(key)
          whitespace()
          take(':')
          value(depth)
          whitespace()
          if (text[cursor] === '}') { cursor++; return }
          take(',')
          whitespace()
        }
      } else {
        let count = 0
        if (text[cursor] === ']') { cursor++; return }
        while (true) {
          if (++count > limits.elementsPerArray) invalid()
          value(depth)
          whitespace()
          if (text[cursor] === ']') { cursor++; return }
          take(',')
          whitespace()
        }
      }
    }
    if (token === '"') { string(false); return }
    for (const literal of ['true', 'false', 'null']) {
      if (text.startsWith(literal, cursor)) { cursor += literal.length; return }
    }
    number()
  }
  try {
    whitespace()
    if (text[cursor] !== '{') return INVALID
    value(0)
    whitespace()
    if (cursor !== text.length) return INVALID
    // Scanner and JSON.parse share decoded UTF-16 key semantics; no reviver.
    const parsed: unknown = JSON.parse(text)
    if (!plain(parsed)) return INVALID
    return { ok: true, value: parsed }
  } catch { return INVALID }
}

const NATIONAL_ID = '2b25b3d4-4eaa-4859-a34e-c7869c114c15'
const HOME_OFFICE_ID = '06056197-bc69-4147-aa28-070bca132178'
const MANUAL_ID = '87e2748f-2e9b-4681-8baa-778b6d326a8a'
const NATIONAL_PATH = '/guidance/immigration-rules/immigration-rules-appendix-eta-national-list'
const MANUAL_PATH = '/guidance/immigration-rules'
const HOME_OFFICE_PATH = '/government/organisations/home-office'
const ORIGIN = 'https://www.gov.uk'
const REQUEST_URL = `${ORIGIN}/api/content${NATIONAL_PATH}`
const PROFILE_ID = 'govuk-eta-national-list-content-api-en'
const ROOT_KEYS = ['analytics_identifier', 'base_path', 'content_id', 'description', 'details',
  'document_type', 'first_published_at', 'links', 'locale', 'phase', 'public_updated_at',
  'publishing_app', 'publishing_request_id', 'publishing_scheduled_at', 'rendering_app',
  'scheduled_publishing_delay_seconds', 'schema_name', 'title', 'updated_at', 'withdrawn_notice']
const DETAILS_KEYS = ['attachments', 'body', 'change_history', 'manual', 'organisations', 'visually_expanded']
const RELATIONS = ['available_translations', 'manual', 'organisations', 'primary_publishing_organisation']
const LINK_KEYS = ['api_path', 'api_url', 'base_path', 'content_id', 'document_type', 'links',
  'locale', 'schema_name', 'web_url', 'withdrawn']

function plain(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
}
function shape(value: unknown, required: readonly string[], optional: readonly string[] = []): JsonObject {
  if (!plain(value) || required.some((key) => !Object.hasOwn(value, key))
    || Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key))) throw INVALID
  return value
}
function strings(row: JsonObject, keys: readonly string[]): void {
  if (keys.some((key) => typeof row[key] !== 'string')) throw INVALID
}
function pins(row: JsonObject, expected: Readonly<Record<string, string | boolean>>): void {
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (typeof row[key] !== typeof expectedValue) throw INVALID
    if (row[key] !== expectedValue) throw MISMATCH
  }
}
function singleton(value: unknown, expected: string): boolean {
  return Array.isArray(value) && value.length === 1 && value[0] === expected
}

/** Calendar/time-zone validation only, never a freshness or legal-date decision. */
function timestamp(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const match = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|[+-](\d{2}):(\d{2}))$/.exec(value)
  if (!match) return false
  const [, year, month, day, hour, minute, second, zoneHour, zoneMinute] = match
  const y = Number(year), m = Number(month), d = Number(day)
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  // Leap-second claims require an external table; conservatively reject them.
  return y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= days[m - 1]!
    && Number(hour) < 24 && Number(minute) < 60 && Number(second) < 60
    && (zoneHour === undefined || (Number(zoneHour) < 24 && Number(zoneMinute) < 60))
}
function optionalStrings(row: JsonObject, keys: readonly string[]): void {
  for (const key of keys) if (Object.hasOwn(row, key) && typeof row[key] !== 'string') throw INVALID
}
function organisationDetails(value: unknown): void {
  const details = shape(value, ['organisation_govuk_status'], ['acronym', 'brand', 'default_news_image', 'logo'])
  optionalStrings(details, ['acronym', 'brand'])
  if (Object.hasOwn(details, 'default_news_image')) {
    strings(shape(details.default_news_image, ['high_resolution_url', 'url']), ['high_resolution_url', 'url'])
  }
  if (Object.hasOwn(details, 'logo')) strings(shape(details.logo, ['crest', 'formatted_title']), ['crest', 'formatted_title'])
  const status = shape(details.organisation_govuk_status, ['status'], ['updated_at', 'url'])
  for (const key of ['updated_at', 'url']) {
    if (Object.hasOwn(status, key) && status[key] !== null && typeof status[key] !== 'string') throw INVALID
  }
  pins(status, { status: 'live' })
}
function link(value: unknown, contentId: string, path: string, schema: string): void {
  if (!Array.isArray(value) || value.length !== 1) throw INVALID
  const organisation = schema === 'organisation'
  const row = shape(value[0], organisation ? [...LINK_KEYS, 'details'] : LINK_KEYS,
    organisation ? ['title', 'analytics_identifier'] : ['title', 'public_updated_at'])
  optionalStrings(row, ['title', 'analytics_identifier'])
  if (Object.hasOwn(row, 'public_updated_at') && !timestamp(row.public_updated_at)) throw INVALID
  shape(row.links, [])
  if (organisation) organisationDetails(row.details)
  pins(row, { content_id: contentId, base_path: path, locale: 'en', schema_name: schema,
    document_type: schema, withdrawn: false, api_path: `/api/content${path}`,
    api_url: `${ORIGIN}/api/content${path}`, web_url: `${ORIGIN}${path}` })
}

export const GOVUK_ETA_NATIONAL_LIST_CONTENT_API_IDENTITY_PROFILE: ContentIdentityProfileDefinition = Object.freeze({
  identityProfileId: PROFILE_ID,
  identityProfileVersion: 1,
  current: true,
  verify({ item, representation: rep, responseText, finalUrl, mediaType }) {
    if (item.current !== true || item.externalIdNamespace !== 'govuk-content-id'
      || item.externalContentId !== NATIONAL_ID
      || !singleton(item.expectedPublisherIds, HOME_OFFICE_ID) || !singleton(item.expectedAuthorityIds, HOME_OFFICE_ID)
      || rep.sourceId !== item.sourceId || rep.contentItemId !== item.contentItemId
      || rep.contentItemVersion !== item.contentItemVersion || rep.current !== true
      || rep.identityProfileId !== PROFILE_ID || rep.identityProfileVersion !== 1
      || !singleton(rep.requestUrls, REQUEST_URL) || rep.expectedFinalUrl !== REQUEST_URL
      || rep.expectedMediaType !== 'application/json' || rep.expectedLocale !== 'en' || rep.expectedSchema !== 'manual_section'
      || finalUrl !== REQUEST_URL || mediaType !== 'application/json') return MISMATCH
    const parsed = parseGovukContentApiJson(responseText)
    if (!parsed.ok) return parsed
    try {
      // The binding task requires all twenty keys, including the five observations
      // the earlier audit permitted to be absent. No observation is an item pin.
      const root = shape(parsed.value, ROOT_KEYS)
      strings(root, ['title', 'description'])
      if (!timestamp(root.public_updated_at) || !timestamp(root.updated_at)) throw INVALID
      shape(root.withdrawn_notice, [])
      const details = shape(root.details, DETAILS_KEYS)
      if (!Array.isArray(details.attachments) || typeof details.body !== 'string'
        || !Array.isArray(details.change_history) || !Array.isArray(details.organisations)
        || typeof details.visually_expanded !== 'boolean') throw INVALID
      pins(shape(details.manual, ['base_path']), { base_path: MANUAL_PATH })
      const links = shape(root.links, RELATIONS)
      link(links.available_translations, NATIONAL_ID, NATIONAL_PATH, 'manual_section')
      link(links.manual, MANUAL_ID, MANUAL_PATH, 'manual')
      link(links.organisations, HOME_OFFICE_ID, HOME_OFFICE_PATH, 'organisation')
      link(links.primary_publishing_organisation, HOME_OFFICE_ID, HOME_OFFICE_PATH, 'organisation')
      pins(root, { content_id: NATIONAL_ID, base_path: NATIONAL_PATH, locale: 'en', schema_name: 'manual_section',
        document_type: 'manual_section', phase: 'live', publishing_app: 'manuals-publisher', rendering_app: 'frontend' })
      return Object.freeze({ ok: true as const, identity: Object.freeze({
        sourceId: item.sourceId, contentItemId: item.contentItemId, contentItemVersion: item.contentItemVersion,
        representationId: rep.representationId, representationVersion: rep.representationVersion,
        identityProfileId: rep.identityProfileId, identityProfileVersion: rep.identityProfileVersion,
      }) })
    } catch (error) { return error === MISMATCH ? MISMATCH : INVALID }
  },
})
