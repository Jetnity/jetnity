import { z } from 'zod'
import { verifyNationalListResearchText } from '../official-truth-integrated-pilot-1/official-source'
import { NATIONAL_LIST as N } from './manifest'
import { hasClosedNationalListFragment } from './fragment'

// Proposed structural contract only. Neither its success nor a null request ID
// admits real data for retention, passage extraction, research or Official Truth.
export const WHOLE_RESPONSE_CONTRACT = 'govuk-national-list-whole-response-v2-proposed' as const
const manualPath = '/guidance/immigration-rules'
const organisationPath = '/government/organisations/home-office'
const empty = z.object({}).strict()
const text = z.string().min(1).max(65_536).refine(s =>
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u.test(s))

// Strict calendar validation. No Date.parse rollover, local timezone, leap-second
// assumption, transformation or inference of legal effective dates.
function timestamp(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!m) return false
  const [, y, month, day, hour, minute, second, zone] = m
  const year = Number(y), mon = Number(month), d = Number(day)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return year >= 1 && mon >= 1 && mon <= 12 && d >= 1 && d <= days[mon - 1]!
    && Number(hour) < 24 && Number(minute) < 60 && Number(second) < 60
    && (zone === 'Z' || (Number(zone!.slice(1, 3)) < 24 && Number(zone!.slice(4)) < 60 && zone !== '-00:00'))
    && Number.isFinite(Date.parse(value))
}
const date = z.string().refine(timestamp)
// These URLs are only checked, never followed. Exact link identities are pinned
// separately. Asset fields have a single documented government host and no query.
const assetUrl = z.string().refine(value => {
  if (!/^https:\/\/assets\.publishing\.service\.gov\.uk\/[A-Za-z0-9/_-]+\.(?:png|jpg|jpeg|svg)$/.test(value)) return false
  const url = new URL(value)
  return url.href === value && !url.pathname.split('/').includes('..')
})
function link(id: string, path: string, schema: 'manual_section' | 'manual' | 'organisation') {
  return z.object({ api_path: z.literal(`/api/content${path}`), api_url: z.literal(`https://www.gov.uk/api/content${path}`),
    base_path: z.literal(path), content_id: z.literal(id), document_type: z.literal(schema), links: empty,
    locale: z.literal('en'), schema_name: z.literal(schema), title: text.optional(),
    web_url: z.literal(`https://www.gov.uk${path}`), withdrawn: z.literal(false) }).strict()
}
const organisation = link(N.homeOfficeId, organisationPath, 'organisation').extend({
  analytics_identifier: text.optional(),
  details: z.object({ acronym: text.optional(), brand: text.optional(),
    default_news_image: z.object({ high_resolution_url: assetUrl, url: assetUrl }).strict().optional(),
    logo: z.object({ crest: text, formatted_title: text }).strict().optional(),
    organisation_govuk_status: z.object({ status: z.literal('live'), updated_at: date.nullable().optional(),
      url: z.literal(`https://www.gov.uk${organisationPath}`).nullable().optional() }).strict(),
  }).strict(),
}).strict()

// Upstream linked-item schemas allow additionalProperties; this proposal does
// not. Unobserved attachments, withdrawal or scheduling require a new review.
const schema = z.object({ analytics_identifier: z.null(), base_path: z.literal(N.path), content_id: z.literal(N.contentId),
  description: text, details: z.object({ attachments: z.tuple([]), body: text,
    change_history: z.array(z.object({ public_timestamp: date, note: text }).strict()).max(1_024),
    manual: z.object({ base_path: z.literal(manualPath) }).strict(),
    organisations: z.array(z.object({ title: text, abbreviation: text,
      web_url: z.literal(`https://www.gov.uk${organisationPath}`) }).strict()).max(1),
    visually_expanded: z.boolean(),
  }).strict(), document_type: z.literal('manual_section'), first_published_at: date,
  links: z.object({ available_translations: z.tuple([link(N.contentId, N.path, 'manual_section').extend({ public_updated_at: date.optional() }).strict()]),
    manual: z.tuple([link(N.manualId, manualPath, 'manual').extend({ public_updated_at: date.optional() }).strict()]),
    organisations: z.tuple([organisation]), primary_publishing_organisation: z.tuple([organisation]),
  }).strict(), locale: z.literal('en'), phase: z.literal('live'), public_updated_at: date,
  publishing_app: z.literal('manuals-publisher'), publishing_request_id: z.string().nullable(),
  publishing_scheduled_at: z.null(), rendering_app: z.literal('frontend'), scheduled_publishing_delay_seconds: z.null(),
  schema_name: z.literal('manual_section'), title: text, updated_at: date, withdrawn_notice: empty,
}).strict()

export type WholeResponseReason = 'invalid_response' | 'identity_mismatch' | 'unexpected_response_fields'
  | 'invalid_response_field' | 'source_time_conflict' | 'invalid_reference_time'
  | 'unreviewed_attachment' | 'unreviewed_scheduling' | 'unreviewed_withdrawal' | 'unsafe_source_fragment'

/** Complete bounded structure check; returns only finite enums, never input,
 * Zod issues/paths, raw hashes, locators or unqualified metadata values. */
export function checkNationalListWholeResponse(raw: string, retrievedAt: string):
  { ok: true; status: 'STRUCTURE_ONLY'; contract: typeof WHOLE_RESPONSE_CONTRACT }
  | { ok: false; reason: WholeResponseReason } {
  // The existing permitted adapter invokes the canonical full scanner before
  // interpreting identity. Do not add another importer of the frozen profile.
  const identity = verifyNationalListResearchText(raw)
  if (!identity.ok) return { ok: false, reason: identity.reason }
  const value = JSON.parse(raw) as Record<string, unknown>
  const validated = schema.safeParse(value)
  if (!validated.success) {
    // Category only: never expose an untrusted path, key, value or Zod message.
    if (validated.error.issues.some(i => i.code === 'unrecognized_keys')) return { ok: false, reason: 'unexpected_response_fields' }
    if (value.publishing_scheduled_at !== null || value.scheduled_publishing_delay_seconds !== null) return { ok: false, reason: 'unreviewed_scheduling' }
    if (value.withdrawn_notice && typeof value.withdrawn_notice === 'object' && Object.keys(value.withdrawn_notice).length) return { ok: false, reason: 'unreviewed_withdrawal' }
    const details = value.details as Record<string, unknown> | undefined
    if (details && Array.isArray(details.attachments) && details.attachments.length) return { ok: false, reason: 'unreviewed_attachment' }
    return { ok: false, reason: 'invalid_response_field' }
  }
  if (!timestamp(retrievedAt)) return { ok: false, reason: 'invalid_reference_time' }
  const row = validated.data, retrieved = Date.parse(retrievedAt)
  if (!hasClosedNationalListFragment(row.details.body)) return { ok: false, reason: 'unsafe_source_fragment' }
  const first = Date.parse(row.first_published_at), updated = Date.parse(row.updated_at), published = Date.parse(row.public_updated_at)
  // All are publishing-system instants. No law-validity fields are generated.
  const linkedTimes = [row.links.manual[0].public_updated_at, row.links.available_translations[0].public_updated_at,
    row.links.organisations[0].details.organisation_govuk_status.updated_at,
    row.links.primary_publishing_organisation[0].details.organisation_govuk_status.updated_at]
  if (first > published || published > updated || updated > retrieved
    || row.details.change_history.some(h => Date.parse(h.public_timestamp) < first || Date.parse(h.public_timestamp) > updated)
    || linkedTimes.some(t => t != null && Date.parse(t) > retrieved)) return { ok: false, reason: 'source_time_conflict' }
  return { ok: true, status: 'STRUCTURE_ONLY', contract: WHOLE_RESPONSE_CONTRACT }
}
