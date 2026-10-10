import 'server-only'

import { createContentIdentityGraph, type ContentIdentityProfileDefinition } from '@/lib/readiness/official-truth-content-identity'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { quellenKatalogSnapshotAntwort, type OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
import { retrieveOfficialTruthIsolatedPilotSource } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { CH_DE_COMPACT_RESEARCH_SOURCES, type ChDeCompactSourceKey } from './manifest'

const SOURCE_ID = 'bern-research-only'

/** Negative-only descriptor proposal for the existing isolated research seam.
 * Does not register a source or mint identity. A whole bounded response can
 * reach the verifier, which records only its size and ALWAYS refuses it.
 */
export function chDeCompactQuarantineCatalog(key: ChDeCompactSourceKey) {
  const source = CH_DE_COMPACT_RESEARCH_SOURCES.find(s => s.key === key)
  if (!source) throw Error('invalid_source_selection')
  let completeBodyBytes: number | null = null
  const profile: ContentIdentityProfileDefinition = Object.freeze({
    identityProfileId: `bern-${source.item}-unqualified`, identityProfileVersion: 1, current: true,
    verify(input) {
      const row = ownRecord(input, ['item', 'representation', 'responseText', 'finalUrl', 'mediaType'])
      if (row && typeof row.responseText === 'string' && row.finalUrl === source.url && row.mediaType === 'text/html') {
        const bytes = Buffer.byteLength(row.responseText, 'utf8')
        if (bytes > 0 && bytes <= 65_536) completeBodyBytes = bytes
      }
      return Object.freeze({ ok: false as const, reason: 'identity_mismatch' as const })
    },
  })
  const authority = quellenRegistryErstellen([{ sourceId: SOURCE_ID, sourceClass: 'official_authority',
    publisherName: 'Auswärtiges Amt', authorityName: 'Deutsche Botschaft Bern', domains: ['bern.diplo.de'] }])
  if (!authority.ok) throw Error('research_descriptor_invalid')
  const graph = createContentIdentityGraph(authority.registry, [{ sourceId: SOURCE_ID, contentItemId: source.item,
    contentItemVersion: 1, current: true, externalIdNamespace: 'bern-url-document-id', externalContentId: source.externalId,
    expectedPublisherIds: ['auswaertiges-amt'], expectedAuthorityIds: ['deutsche-botschaft-bern'] }],
  [{ sourceId: SOURCE_ID, contentItemId: source.item, contentItemVersion: 1,
    representationId: `${source.item}-html-de`, representationVersion: 1, current: true,
    requestUrls: [source.url], expectedFinalUrl: source.url, expectedMediaType: 'text/html',
    identityProfileId: profile.identityProfileId, identityProfileVersion: 1, expectedLocale: 'de', expectedSchema: null }], [profile])
  if (!graph.ok) throw Error('research_descriptor_invalid')
  const snapshot = quellenKatalogSnapshotAntwort({ ...authority.registry, contentIdentity: graph.value })
  if (!snapshot) throw Error('research_descriptor_invalid')
  const transport: OfficialTruthSourceCatalogTransport = Object.freeze({ async aufrufen(input: unknown) {
    return ownRecord(input, ['operation'])?.operation === 'read_registry'
      ? { ok: true as const, antwort: snapshot } : { ok: false as const }
  } })
  return { catalog: { transport, identityProfiles: [profile] }, completeBytes: () => completeBodyBytes }
}

/** No arbitrary URL, caller catalog, headers, environment flag or alternate HTTP
 * implementation. Both probes are sequential, with at most one GET and no retry. */
export async function probeChDeCompactOfficialSources() {
  const observations = []
  for (const source of CH_DE_COMPACT_RESEARCH_SOURCES) {
    const startedAt = new Date().toISOString()
    const quarantine = chDeCompactQuarantineCatalog(source.key)
    const result = await retrieveOfficialTruthIsolatedPilotSource(
      { sourceId: SOURCE_ID, url: source.url }, quarantine.catalog)
    const completedAt = new Date().toISOString()
    const bytes = quarantine.completeBytes()
    observations.push(Object.freeze({ source: source.key, url: source.url, startedAt, completedAt,
      status: 'SOURCE_NOT_QUALIFIED' as const,
      reason: result.status === 'blocked' ? result.reason : 'unexpected_identity_success',
      completeBodyBytes: bytes,
      sizeObservation: result.status === 'blocked' && result.reason === 'response_too_large'
        ? 'declared_or_observed_above_65536' : bytes === null ? 'unknown' : 'complete_bounded_body',
      identityQualified: false, privacyQualified: false, legalQualified: false,
      candidateEvidence: 'NOT_CREATED', ruleReview: 'NOT_RUN', acceptedRule: 'NOT_CREATED',
    }))
  }
  return observations
}
