import { z } from 'zod'

export const BP1_URL = 'https://verwaltung.bund.de/leistungsverzeichnis/de/leistung/99125003001000/herausgeber/LeiKa-583471/region/000000000000'
const count = z.number().int().min(0).max(9).nullable()
const indicatorsSchema = z.object({
  serviceId: count, publisherId: count, germanHtmlLang: count,
  canonicalLinks: count, exactCanonicalLinks: count,
  visaHeadingCues: count, swissCues: count, exemptionCues: count,
  scriptTags: count, commentOpenings: count, hiddenAttributeCues: count,
  dynamicPopulationCues: count, scriptOnlyShellCues: count,
  rightsCues: count, contactCues: count, externalResourceCues: count,
  repeatedIdentityCues: z.boolean().nullable(), repeatedStatementCues: z.boolean().nullable(),
}).strict()
export type Bp1Indicators = z.infer<typeof indicatorsSchema>

const reasonSchema = z.enum([
  'not_run', 'invalid_arguments', 'content_identity_mismatch', 'representation_url_mismatch',
  'content_type_mismatch', 'address_not_permitted', 'dns_failed', 'dns_empty',
  'redirect_rejected', 'redirect_loop', 'redirect_limit', 'unregistered_domain',
  'redirect_source_mismatch', 'http_status', 'http_failed', 'response_too_large',
  'invalid_utf8', 'empty_body', 'timeout', 'catalog_failed', 'transport_refused',
  'unexpected_identity_success', 'observer_failed',
])
export const bp1ReportSchema = z.object({
  schema: z.literal('jetnity.bp1-observation.v1'), provenance: z.literal('UNQUALIFIED_RESEARCH'),
  sourceUrl: z.literal(BP1_URL), mode: z.enum(['PLAN', 'OBSERVATION']),
  outcome: z.enum(['NOT_RUN', 'INVALID_ARGUMENTS', 'UNQUALIFIED_BODY_OBSERVED', 'REFUSED', 'ERROR']),
  reason: reasonSchema, startedAt: z.string().datetime().nullable(), completedAt: z.string().datetime().nullable(),
  completeBodyBytes: z.number().int().min(1).max(65_536).nullable(),
  byteCountBasis: z.literal('bounded_utf8_stream_end_not_independent_framing_proof'),
  observedMediaType: z.literal('text/html').nullable(),
  indicators: indicatorsSchema,
  indicatorBasis: z.literal('raw_lexical_cues_only_counts_saturate_at_9'),
  renderedStatement: z.literal('NOT_ASSESSED'), legalValidity: z.literal('NOT_ASSESSED'),
  privacyAndRights: z.literal('NOT_CLEARED'), sourceQualified: z.literal(false),
  acceptedRuleCreated: z.literal(false), independentReviewRequired: z.literal(true),
}).strict()
export type Bp1Report = z.infer<typeof bp1ReportSchema>

export function unobservedBp1Indicators(): Bp1Indicators {
  return { serviceId: null, publisherId: null, germanHtmlLang: null,
    canonicalLinks: null, exactCanonicalLinks: null, visaHeadingCues: null,
    swissCues: null, exemptionCues: null, scriptTags: null, commentOpenings: null,
    hiddenAttributeCues: null, dynamicPopulationCues: null, scriptOnlyShellCues: null,
    rightsCues: null, contactCues: null, externalResourceCues: null,
    repeatedIdentityCues: null, repeatedStatementCues: null }
}
function occurrences(text: string, pattern: RegExp): number {
  let n = 0
  for (const _ of text.matchAll(pattern)) { void _; if (++n === 9) break }
  return n
}
/** Lexical inventory, NOT an HTML parser, rendered-text extractor or legal test.
 * Counts include inert/hidden/negated material. Zero means only no matched cue.
 * Unknown syntax/entities/CSS/dynamic content cannot be certified absent. */
export function observeBp1Text(text: string): Bp1Indicators {
  if (!text || Buffer.byteLength(text, 'utf8') > 65_536) return unobservedBp1Indicators()
  const serviceId = occurrences(text, /99125003001000/g)
  const publisherId = occurrences(text, /LeiKa-583471/g)
  const swissCues = occurrences(text, /schweiz/gi)
  const exemptionCues = occurrences(text, /visumfrei|visumbefreit|keine[rnms]?\s+visumpflicht|nicht\s+der\s+visumpflicht/gi)
  let canonicalLinks = 0, exactCanonicalLinks = 0
  for (const [tag] of text.matchAll(/<link\b[^>]{0,2048}>/gi)) {
    if (!/\brel\s*=\s*["']canonical["']/i.test(tag)) continue
    canonicalLinks = Math.min(9, canonicalLinks + 1)
    const href = /\bhref\s*=\s*(["'])([^"']*)\1/i.exec(tag)?.[2]
    if (href === BP1_URL) exactCanonicalLinks = Math.min(9, exactCanonicalLinks + 1)
  }
  return Object.freeze({ serviceId, publisherId, canonicalLinks, exactCanonicalLinks, swissCues, exemptionCues,
    germanHtmlLang: occurrences(text, /<html\b[^>]{0,2048}\blang\s*=\s*["']de(?:-DE)?["']/gi),
    visaHeadingCues: occurrences(text, /<h[1-6]\b[^>]{0,512}>[^<]{0,512}\bvisum\b/gi),
    scriptTags: occurrences(text, /<script\b/gi), commentOpenings: occurrences(text, /<!--/g),
    hiddenAttributeCues: occurrences(text, /\bhidden\b|aria-hidden\s*=\s*["']true["']|display\s*:\s*none|visibility\s*:\s*hidden/gi),
    dynamicPopulationCues: occurrences(text, /innerHTML|document\.write|__NEXT_DATA__|ng-app|data-reactroot|hydrate/gi),
    scriptOnlyShellCues: occurrences(text, /javascript[^<\n]{0,100}(?:aktivieren|erforderlich|required|enable)|enable[^<\n]{0,100}javascript/gi),
    rightsCues: occurrences(text, /urheberrecht|copyright|lizenz|nutzungsbedingungen|datenschutz/gi),
    contactCues: occurrences(text, /mailto:|tel:|kontakt|[a-z0-9._%+-]{1,128}@[a-z0-9.-]{1,128}\.[a-z]{2,24}/gi),
    externalResourceCues: occurrences(text, /\b(?:src|href|action)\s*=\s*["'](?:https?:)?\/\//gi),
    repeatedIdentityCues: serviceId > 1 || publisherId > 1 || canonicalLinks > 1,
    repeatedStatementCues: swissCues > 1 || exemptionCues > 1,
  })
}
export function bp1Report(input: Pick<Bp1Report, 'mode' | 'outcome' | 'reason'> & Partial<Pick<Bp1Report,
  'startedAt' | 'completedAt' | 'completeBodyBytes' | 'indicators'>>): Bp1Report {
  const report = bp1ReportSchema.parse({
    schema: 'jetnity.bp1-observation.v1', provenance: 'UNQUALIFIED_RESEARCH', sourceUrl: BP1_URL,
    mode: input.mode, outcome: input.outcome, reason: input.reason,
    startedAt: input.startedAt ?? null, completedAt: input.completedAt ?? null,
    completeBodyBytes: input.completeBodyBytes ?? null,
    byteCountBasis: 'bounded_utf8_stream_end_not_independent_framing_proof',
    observedMediaType: input.completeBodyBytes == null ? null : 'text/html',
    indicators: input.indicators ?? unobservedBp1Indicators(),
    indicatorBasis: 'raw_lexical_cues_only_counts_saturate_at_9',
    renderedStatement: 'NOT_ASSESSED', legalValidity: 'NOT_ASSESSED', privacyAndRights: 'NOT_CLEARED',
    sourceQualified: false, acceptedRuleCreated: false, independentReviewRequired: true,
  })
  Object.freeze(report.indicators)
  return Object.freeze(report)
}
export function bp1Refusal(reason: unknown): Bp1Report['reason'] {
  const parsed = reasonSchema.safeParse(reason)
  return parsed.success ? parsed.data : 'transport_refused'
}
/** Strict validation and size check before stdout, never serialize an exception. */
export function serializeBp1Report(report: Bp1Report): string {
  const text = JSON.stringify(bp1ReportSchema.parse(report)) + '\n'
  if (Buffer.byteLength(text, 'utf8') > 8192) throw Error('diagnostic_bound_exceeded')
  return text
}
