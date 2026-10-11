import 'server-only'

import {
  decideOfficialTruthServerOwnedRetrieval,
  type OfficialTruthServerOwnedRetrievalAbhaengigkeiten,
  type OfficialTruthServerOwnedRetrievalDnsResolver,
  type OfficialTruthServerOwnedRetrievalHttpClient,
  type OfficialTruthServerOwnedRetrievalSperrgrund,
} from '@/lib/readiness/official-truth-server-owned-retrieval'
import type {
  OfficialTruthSourceCatalogAbhaengigkeiten,
  OfficialTruthSourceCatalogTransport,
} from '@/lib/readiness/official-truth-source-catalog-server'

export const OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1 = Object.freeze({
  sourceId: 'de-bern-embassy-research-only',
  contentItemId: 'bern-visa-entry-2611474',
  contentItemVersion: 1,
  representationId: 'bern-visa-entry-html-de',
  representationVersion: 1,
  identityProfileId: 'de-bern-entry-page-unqualified',
  identityProfileVersion: 1,
  sourceUrl: 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474',
  mediaType: 'text/html',
  sourceFamily: 'german_embassy_bern_research_candidate',
  mockMaxBytes: 131_072,
})

export type OfficialTruthBernResearchQuarantineFlags = Readonly<{
  html_scripts_present: boolean
  analytics_or_tracking_indicators_present: boolean
  possible_personal_metadata_present: boolean
  embedded_external_asset_indicators_present: boolean
  copyright_or_rights_indicators_present: boolean
  unknown_dynamic_sections: boolean
}>

export type OfficialTruthBernResearchQuarantineResult = Readonly<{
  status: 'research_only_quarantine'
  phase: 'not_run' | 'blocked'
  reason: OfficialTruthServerOwnedRetrievalSperrgrund | 'unexpected_identity_success' | 'not_authorized' | 'already_consumed'
  sourceFamily: typeof OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.sourceFamily
  sourceUrl: typeof OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.sourceUrl
  networkAttempted: false
  bodyByteCount: number | null
} & OfficialTruthBernResearchQuarantineFlags>

export type OfficialTruthBernResearchOneShotState = Readonly<{
  consumed: boolean
  attempts: number
}>

export type OfficialTruthBernResearchOneShotDecision = Readonly<{
  ok: false
  reason: 'not_authorized' | 'already_consumed'
  next: OfficialTruthBernResearchOneShotState
}>

export type OfficialTruthBernResearchQuarantineMockBodyDecision = Readonly<
  | {
      ok: true
      bodyByteCount: number
      flags: OfficialTruthBernResearchQuarantineFlags
    }
  | {
      ok: false
      reason: 'invalid_utf8' | 'empty_body' | 'response_too_large' | 'content_length_mismatch' | 'invalid_request'
    }
>

type OfflineRequest = Readonly<{
  operation: 'offline_mock'
}>

type OfflineAbhaengigkeiten = Readonly<{
  now: () => Date
  resolve: OfficialTruthServerOwnedRetrievalDnsResolver
  http: OfficialTruthServerOwnedRetrievalHttpClient
  timeoutMs?: number
}>

type Observation = {
  bodyByteCount: number | null
  flags: OfficialTruthBernResearchQuarantineFlags | null
}

const CONSERVATIVE_FLAGS: OfficialTruthBernResearchQuarantineFlags = Object.freeze({
  html_scripts_present: true,
  analytics_or_tracking_indicators_present: true,
  possible_personal_metadata_present: true,
  embedded_external_asset_indicators_present: true,
  copyright_or_rights_indicators_present: true,
  unknown_dynamic_sections: true,
})

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

function row(value: unknown, fields: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  if (![Object.prototype, null].includes(Object.getPrototypeOf(value))) return null
  const keys = Reflect.ownKeys(value)
  if (keys.length !== fields.length || keys.some((key) => typeof key !== 'string' || !fields.includes(key))) return null
  for (const key of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) return null
  }
  return value as Record<string, unknown>
}

function parseRequest(value: unknown): OfflineRequest | null {
  const parsed = row(value, ['operation'])
  return parsed?.operation === 'offline_mock' ? { operation: 'offline_mock' } : null
}

function analysiereHtml(text: string): OfficialTruthBernResearchQuarantineFlags {
  const scripts = /<script\b|javascript:/i.test(text)
  const analytics = /(matomo|_paq\b|piwik|google-analytics|googletagmanager|gtag\(|analytics|tracking|fbclid|gclid|dclid|msclkid)/i.test(text)
  const personen = /(mailto:|\b(?:e-?mail|telefon|tel:|kontakt|ansprechpartner|impressum|pressestelle)\b|@[a-z0-9.-]+\.[a-z]{2,})/i.test(text)
  const externeAssets = /(?:src|href)\s*=\s*['"]https?:\/\/(?!bern\.diplo\.de)([^'"/]+)[^'"\s>]*/i.test(text)
  const rights = /(copyright|urheberrecht|rights reserved|alle rechte vorbehalten|©)/i.test(text)
  const dynamisch = scripts || /<iframe\b|<template\b|{{|\bwindow\.[a-z0-9_$]+|data-reactroot|ng-[a-z0-9_-]+/i.test(text)
  return Object.freeze({
    html_scripts_present: scripts,
    analytics_or_tracking_indicators_present: analytics,
    possible_personal_metadata_present: personen,
    embedded_external_asset_indicators_present: externeAssets,
    copyright_or_rights_indicators_present: rights,
    unknown_dynamic_sections: dynamisch,
  })
}

function utf8Body(body: Uint8Array): { ok: true; text: string } | { ok: false; reason: 'invalid_utf8' | 'empty_body' } {
  if (!(body instanceof Uint8Array)) return { ok: false, reason: 'invalid_utf8' }
  if (body.byteLength === 0) return { ok: false, reason: 'empty_body' }
  if (body.byteLength >= 3 && body[0] === 0xef && body[1] === 0xbb && body[2] === 0xbf) return { ok: false, reason: 'invalid_utf8' }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(body)
    if (!text) return { ok: false, reason: 'empty_body' }
    return { ok: true, text }
  } catch {
    return { ok: false, reason: 'invalid_utf8' }
  }
}

function catalogAntwort(profileId: string, profileVersion: number): Readonly<Record<string, unknown>> {
  const source = OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1
  return freeze({
    ok: true,
    operation: 'read_registry',
    identity_schema: 2,
    sources: [
      {
        source_id: source.sourceId,
        source_class: 'official_authority',
        publisher_name: 'German Embassy Bern research candidate',
        authority_name: 'Auswärtiges Amt',
        domains: ['bern.diplo.de'],
      },
    ],
    blocked_domains: [],
    content_items: [
      {
        source_id: source.sourceId,
        content_item_id: source.contentItemId,
        external_id_namespace: 'de-bern-research-document-id',
        external_content_id: '2611474',
      },
    ],
    item_versions: [
      {
        source_id: source.sourceId,
        content_item_id: source.contentItemId,
        content_item_version: source.contentItemVersion,
        current: true,
        expected_publisher_ids: ['auswaertiges-amt'],
        expected_authority_ids: ['auswaertiges-amt'],
      },
    ],
    representations: [
      {
        source_id: source.sourceId,
        content_item_id: source.contentItemId,
        content_item_version: source.contentItemVersion,
        representation_id: source.representationId,
        representation_version: source.representationVersion,
        current: true,
        expected_final_url: source.sourceUrl,
        expected_media_type: source.mediaType,
        identity_profile_id: profileId,
        identity_profile_version: profileVersion,
        expected_locale: 'de',
        expected_schema: null,
      },
    ],
    representation_urls: [
      {
        source_id: source.sourceId,
        content_item_id: source.contentItemId,
        representation_id: source.representationId,
        representation_version: source.representationVersion,
        url: source.sourceUrl,
        request_ordinal: 1,
        is_final: true,
      },
    ],
    url_reservations: [
      {
        url: source.sourceUrl,
        source_id: source.sourceId,
        content_item_id: source.contentItemId,
        representation_id: source.representationId,
      },
    ],
  })
}

function quarantineCatalog(observation: Observation): Required<Pick<OfficialTruthSourceCatalogAbhaengigkeiten, 'transport' | 'identityProfiles'>> {
  const source = OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1
  const profileId = `research-${source.identityProfileId}`
  const profileVersion = source.identityProfileVersion
  const antwort = catalogAntwort(profileId, profileVersion)
  const transport: OfficialTruthSourceCatalogTransport = Object.freeze({
    async aufrufen(input: Readonly<Record<string, unknown>>) {
      return row(input, ['operation'])?.operation === 'read_registry'
        ? { ok: true as const, antwort }
        : { ok: false as const }
    },
  })
  const profile = Object.freeze({
    identityProfileId: profileId,
    identityProfileVersion: profileVersion,
    current: true,
    verify(input: Readonly<{
      item: Readonly<Record<string, unknown>>
      representation: Readonly<Record<string, unknown>>
      responseText: string
      finalUrl: string
      mediaType: string
    }>) {
      if (input.finalUrl === source.sourceUrl && input.mediaType === source.mediaType) {
        observation.bodyByteCount = Buffer.byteLength(input.responseText, 'utf8')
        observation.flags = analysiereHtml(input.responseText)
      }
      return Object.freeze({ ok: false as const, reason: 'identity_mismatch' as const })
    },
  })
  return Object.freeze({ transport, identityProfiles: [profile] })
}

function result(
  phase: OfficialTruthBernResearchQuarantineResult['phase'],
  reason: OfficialTruthBernResearchQuarantineResult['reason'],
  observation: Observation,
): OfficialTruthBernResearchQuarantineResult {
  const flags = observation.flags ?? CONSERVATIVE_FLAGS
  return freeze({
    status: 'research_only_quarantine',
    phase,
    reason,
    sourceFamily: OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.sourceFamily,
    sourceUrl: OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.sourceUrl,
    networkAttempted: false,
    bodyByteCount: observation.bodyByteCount,
    ...flags,
  })
}

export function officialTruthBernResearchQuarantineNotRun(): OfficialTruthBernResearchQuarantineResult {
  return result('not_run', 'not_authorized', { bodyByteCount: null, flags: null })
}

/** Future permit is reserved and never callable in this task. First refused attempt
 * is consumed and cannot be retried automatically. */
export function officialTruthBernResearchQuarantineOneShotVersuch(
  state: OfficialTruthBernResearchOneShotState = { consumed: false, attempts: 0 },
): OfficialTruthBernResearchOneShotDecision {
  if (state.consumed) {
    return freeze({ ok: false, reason: 'already_consumed', next: { consumed: true, attempts: state.attempts } })
  }
  return freeze({ ok: false, reason: 'not_authorized', next: { consumed: true, attempts: state.attempts + 1 } })
}

/** Offline-only modeled body policy for the exact Bern candidate. This is not wired
 * to any live transport path and cannot activate a real 131072-byte fetch. */
export function officialTruthBernResearchQuarantineMockBody(
  input: unknown,
): OfficialTruthBernResearchQuarantineMockBodyDecision {
  const parsed = row(input, ['body', 'declaredLength'])
  if (!parsed || !(parsed.body instanceof Uint8Array)
    || !(parsed.declaredLength === null
      || (typeof parsed.declaredLength === 'number' && Number.isInteger(parsed.declaredLength) && parsed.declaredLength >= 0))) {
    return Object.freeze({ ok: false, reason: 'invalid_request' })
  }
  const body = parsed.body
  if (body.byteLength > OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.mockMaxBytes) {
    return Object.freeze({ ok: false, reason: 'response_too_large' })
  }
  if (parsed.declaredLength !== null && parsed.declaredLength !== body.byteLength) {
    return Object.freeze({ ok: false, reason: 'content_length_mismatch' })
  }
  const utf8 = utf8Body(body)
  if (!utf8.ok) return utf8
  return Object.freeze({ ok: true, bodyByteCount: body.byteLength, flags: analysiereHtml(utf8.text) })
}

/** Protected offline-only mocked path. Uses the same retrieval security internals
 * (`decideOfficialTruthServerOwnedRetrieval`) with fixed source/canonical URL. */
export async function decideOfficialTruthBernResearchQuarantineOfflineMock(
  input: unknown,
  abhaengigkeiten: OfflineAbhaengigkeiten,
): Promise<OfficialTruthBernResearchQuarantineResult> {
  if (!parseRequest(input)) return result('blocked', 'invalid_request', { bodyByteCount: null, flags: null })
  const observation: Observation = { bodyByteCount: null, flags: null }
  const catalog = quarantineCatalog(observation)
  const deps: OfficialTruthServerOwnedRetrievalAbhaengigkeiten = {
    catalog,
    now: abhaengigkeiten.now,
    resolve: abhaengigkeiten.resolve,
    http: abhaengigkeiten.http,
    timeoutMs: abhaengigkeiten.timeoutMs,
  }
  const retrieval = await decideOfficialTruthServerOwnedRetrieval(
    {
      sourceId: OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.sourceId,
      url: OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.sourceUrl,
    },
    deps,
  )
  if (retrieval.status !== 'blocked') return result('blocked', 'unexpected_identity_success', observation)
  return result('blocked', retrieval.reason, observation)
}
