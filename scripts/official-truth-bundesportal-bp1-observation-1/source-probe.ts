import 'server-only'

import { createContentIdentityGraph, type ContentIdentityProfileDefinition } from '@/lib/readiness/official-truth-content-identity'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { quellenKatalogSnapshotAntwort, type OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
import { retrieveOfficialTruthIsolatedPilotSource } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { BP1_URL, bp1Report, bp1Refusal, observeBp1Text, type Bp1Indicators, type Bp1Report } from './observations'

// Local proposals, NOT publisher-issued source/profile IDs or registered truth.
const SOURCE = 'bundesportal-bp1-unqualified-research'
const ITEM = 'bp1-unqualified-research-proposal'

/** Fresh state for each call. Test-visible construction, never accepts caller descriptors. */
export function bp1QuarantineCatalog() {
  let observation: Readonly<{ bytes: number; indicators: Bp1Indicators }> | null = null
  let closed = false
  const profile: ContentIdentityProfileDefinition = Object.freeze({
    identityProfileId: 'bp1-unqualified-research-profile', identityProfileVersion: 1, current: true,
    verify(input) {
      observation = null
      if (!closed) {
        const row = ownRecord(input, ['item', 'representation', 'responseText', 'finalUrl', 'mediaType'])
        if (row && typeof row.responseText === 'string' && row.finalUrl === BP1_URL && row.mediaType === 'text/html') {
          const bytes = Buffer.byteLength(row.responseText, 'utf8')
          if (bytes > 0 && bytes <= 65_536) observation = Object.freeze({ bytes, indicators: observeBp1Text(row.responseText) })
        }
      }
      return Object.freeze({ ok: false as const, reason: 'identity_mismatch' as const })
    },
  })
  const authority = quellenRegistryErstellen([{ sourceId: SOURCE, sourceClass: 'official_authority',
    publisherName: 'Unqualified Bundesportal research proposal', authorityName: 'Unqualified AA research proposal',
    domains: ['verwaltung.bund.de'] }])
  if (!authority.ok) throw Error('research_descriptor_invalid')
  const graph = createContentIdentityGraph(authority.registry, [{ sourceId: SOURCE, contentItemId: ITEM,
    contentItemVersion: 1, current: true, externalIdNamespace: 'unqualified-bp1-url-proposal',
    externalContentId: '99125003001000', expectedPublisherIds: ['LeiKa-583471'], expectedAuthorityIds: ['auswaertiges-amt'] }],
  [{ sourceId: SOURCE, contentItemId: ITEM, contentItemVersion: 1,
    representationId: 'bp1-unqualified-html-de-proposal', representationVersion: 1, current: true,
    requestUrls: [BP1_URL], expectedFinalUrl: BP1_URL, expectedMediaType: 'text/html',
    identityProfileId: profile.identityProfileId, identityProfileVersion: 1, expectedLocale: 'de', expectedSchema: null }], [profile])
  if (!graph.ok) throw Error('research_descriptor_invalid')
  const snapshot = quellenKatalogSnapshotAntwort({ ...authority.registry, contentIdentity: graph.value })
  if (!snapshot) throw Error('research_descriptor_invalid')
  const transport: OfficialTruthSourceCatalogTransport = Object.freeze({ async aufrufen(input: unknown) {
    return ownRecord(input, ['operation'])?.operation === 'read_registry'
      ? { ok: true as const, antwort: snapshot } : { ok: false as const }
  } })
  return { request: Object.freeze({ sourceId: SOURCE, url: BP1_URL }),
    catalog: { transport, identityProfiles: [profile] },
    takeObservation() { const value = observation; observation = null; closed = true; return value },
  }
}

/** Sole network-capable entry. NO arguments, overrides, retries or fallback.
 * Call only after independent exact-head TL review AND separate finite permission.
 * This function does not authenticate that human process or guarantee global non-use. */
export async function observeBp1Once(...unexpected: readonly unknown[]): Promise<Bp1Report> {
  if (unexpected.length) return bp1Report({ mode: 'PLAN', outcome: 'INVALID_ARGUMENTS', reason: 'invalid_arguments' })
  const startedAt = new Date().toISOString()
  let quarantine: ReturnType<typeof bp1QuarantineCatalog> | undefined
  try {
    quarantine = bp1QuarantineCatalog()
    const result = await retrieveOfficialTruthIsolatedPilotSource(quarantine.request, quarantine.catalog)
    const observed = quarantine.takeObservation()
    const completedAt = new Date().toISOString()
    // Discard ALL unexpected trusted success, including any diagnostic observation.
    if (result.status !== 'blocked') return bp1Report({ mode: 'OBSERVATION', outcome: 'ERROR',
      reason: 'unexpected_identity_success', startedAt, completedAt })
    const usable = result.reason === 'content_identity_mismatch' ? observed : null
    return bp1Report({ mode: 'OBSERVATION', outcome: usable ? 'UNQUALIFIED_BODY_OBSERVED' : 'REFUSED',
      reason: bp1Refusal(result.reason), startedAt, completedAt,
      completeBodyBytes: usable?.bytes, indicators: usable?.indicators })
  } catch {
    return bp1Report({ mode: 'OBSERVATION', outcome: 'ERROR', reason: 'observer_failed',
      startedAt, completedAt: new Date().toISOString() })
  } finally { quarantine?.takeObservation() }
}
