// CH→DE AA source qualification V1 — offline-only, no accepted authority.
// A matching synthetic URL/HTML observation cannot establish real HTTP
// completeness, publisher provenance, source registry approval or legal truth.
// The only output is research material; this file is not a retrieval adapter.
import 'server-only'

import {
  chDeAaS1VisaRowResearchFromHtml,
  type ChDeAaVisaTableResearchResult,
} from './official-truth-ch-de-aa-s1-visa-row-research-server'

export const CH_DE_AA_SOURCE_QUALIFICATION_OFFLINE_1 = Object.freeze({
  sourceCandidateId: 'de-aa-staatenliste-visumpflicht',
  canonicalUrl: 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820',
  mediaType: 'text/html',
  maxResearchBodyBytes: 131_072,
  existingTransportBodyMaxBytes: 65_536,
  researchStatus: 'RESEARCH_ONLY',
  databaseImportStatus: 'NOT_APPROVED_FOR_DATABASE_IMPORT',
  registeredSource: false,
  registeredRepresentation: false,
  registeredIdentityProfile: false,
  runtimeRetrievalEnabled: false,
  trustedFactEnabled: false,
  acceptedStoreEnabled: false,
} as const)

const ENVELOPE_FIELDS = [
  'requestUrl', 'finalUrl', 'mediaType', 'httpStatus', 'redirectCount', 'html',
] as const

type OfflineEnvelope = {
  requestUrl: string
  finalUrl: string
  mediaType: string
  httpStatus: number
  redirectCount: number
  html: string
}

type ResearchParserReason = Extract<ChDeAaVisaTableResearchResult, { status: 'blocked' }>['reason']

export type ChDeAaSourceOfflineQualification =
  | Readonly<{
      status: 'blocked'
      reason:
        | 'invalid_envelope'
        | 'wrong_source_url'
        | 'redirect_not_qualified'
        | 'wrong_media_type'
        | 'wrong_http_status'
        | 'invalid_html'
        | 'research_body_over_limit'
        | 'research_table_blocked'
      parserReason?: ResearchParserReason
    }>
  | Readonly<{
      status: 'research_only_observation'
      researchStatus: 'RESEARCH_ONLY'
      databaseImportStatus: 'NOT_APPROVED_FOR_DATABASE_IMPORT'
      country: 'CH'
      destination: 'DE'
      requirementType: 'visa'
      swissVisaDutyCell: 'Nein'
      sourceCandidateUrl: typeof CH_DE_AA_SOURCE_QUALIFICATION_OFFLINE_1.canonicalUrl
      observedUtf8Bytes: number
      requiresSourceSpecificBudgetQualification: boolean
      sourceCustody: 'not_verified'
      responseCompleteness: 'not_verified'
      identityProfile: 'not_registered'
      legalApplicability: 'not_verified'
      sourceFingerprint: null
      checkedAt: null
      validFrom: null
      validUntil: null
      acceptedEvidence: 0
      acceptedRules: 0
      databaseWrites: 0
    }>

function block(
  reason: Extract<ChDeAaSourceOfflineQualification, { status: 'blocked' }>['reason'],
  parserReason?: ResearchParserReason,
): ChDeAaSourceOfflineQualification {
  return Object.freeze(parserReason
    ? { status: 'blocked', reason, parserReason }
    : { status: 'blocked', reason })
}

/**
 * Only accept six own, enumerable data properties of a plain record. In
 * particular a caller-supplied response receipt, Content-Length, source ID,
 * timestamp, hash or "approved" flag cannot acquire authority here.
 */
function envelope(value: unknown): OfflineEnvelope | null {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return null
  const keys = Reflect.ownKeys(value)
  if (keys.length !== ENVELOPE_FIELDS.length ||
      keys.some((key) => typeof key !== 'string' || !ENVELOPE_FIELDS.includes(key as typeof ENVELOPE_FIELDS[number]))) {
    return null
  }
  for (const field of ENVELOPE_FIELDS) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field)
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) return null
  }
  return value as OfflineEnvelope
}

/**
 * A research-only diagnostic of an *untrusted in-memory test envelope*.
 * A real HTTP request/redirect/frame/Content-Length must be verified by
 * the distinct server-owned transport and its separately gated #1131 work.
 * Even when this observation succeeds, there is no source admission.
 */
export function chDeAaSourceQualificationOffline1(value: unknown): ChDeAaSourceOfflineQualification {
  const input = envelope(value)
  if (!input) return block('invalid_envelope')

  const pinned = CH_DE_AA_SOURCE_QUALIFICATION_OFFLINE_1
  if (input.requestUrl !== pinned.canonicalUrl || input.finalUrl !== pinned.canonicalUrl) {
    return block('wrong_source_url')
  }
  if (input.redirectCount !== 0) return block('redirect_not_qualified')
  if (input.mediaType !== pinned.mediaType) return block('wrong_media_type')
  if (input.httpStatus !== 200) return block('wrong_http_status')
  if (typeof input.html !== 'string' || !input.html.trim()) return block('invalid_html')

  const observedUtf8Bytes = Buffer.byteLength(input.html, 'utf8')
  if (observedUtf8Bytes > pinned.maxResearchBodyBytes) return block('research_body_over_limit')
  const parsed = chDeAaS1VisaRowResearchFromHtml(input.html)
  if (parsed.status === 'blocked') return block('research_table_blocked', parsed.reason)

  return Object.freeze({
    status: 'research_only_observation',
    researchStatus: 'RESEARCH_ONLY',
    databaseImportStatus: 'NOT_APPROVED_FOR_DATABASE_IMPORT',
    country: 'CH',
    destination: 'DE',
    requirementType: 'visa',
    swissVisaDutyCell: 'Nein',
    sourceCandidateUrl: pinned.canonicalUrl,
    observedUtf8Bytes,
    requiresSourceSpecificBudgetQualification:
      observedUtf8Bytes > pinned.existingTransportBodyMaxBytes,
    sourceCustody: 'not_verified',
    responseCompleteness: 'not_verified',
    identityProfile: 'not_registered',
    legalApplicability: 'not_verified',
    sourceFingerprint: null,
    checkedAt: null,
    validFrom: null,
    validUntil: null,
    acceptedEvidence: 0,
    acceptedRules: 0,
    databaseWrites: 0,
  })
}
