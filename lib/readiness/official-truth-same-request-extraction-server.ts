// lib/readiness/official-truth-same-request-extraction-server.ts
//
// Eine Serverausführung: der bestehende Beweisgraph, genau seine
// eingefrorene Registry, danach die serverseitige HTTPS-Lesung, und erst
// dann der deterministische Extraktorrahmen.
// Der Aufrufer liefert denselben Forschungsumschlag wie der Beweis.
// Er liefert keinen Graphen, keine Registry, keine Evidence, keinen Abruf,
// keinen Fakt, keinen Extraktor und keine Politik.
// Eine zweite Katalog-RPC gibt es nicht. Gesperrte Domains, die der
// Katalogvertrag nicht wiedergeben kann, scheitern vor dem Netz.
// Zusammengesetzte Qualität scheitert vor dem Netz, weil keine
// codeeigene Kompositionspolitik existiert. Diese Datei erfindet keine.
// Das Produktions-Extraktorregister bleibt leer. Ein Erfolg ist internes
// Material, keine Annahme und kein Seitenrohtext.

import 'server-only'

import { akzeptierteEvidenceLesen, type EvidenceVersion } from '@/lib/readiness/evidence'
import type { OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
import {
  loadOfficialTruthSameRequestProof,
  type OfficialTruthSameRequestProofErgebnis,
  type OfficialTruthSameRequestProofSperrgrund,
} from '@/lib/readiness/official-truth-same-request-proof-server'
import type { OfficialTruthServerHeldSameRequestSupport } from '@/lib/readiness/official-truth-server-held-source-registry'
import {
  loadOfficialTruthServerOwnedRetrievalWithCatalogTransport,
  type OfficialTruthServerOwnedRetrievalErgebnis,
  type OfficialTruthServerOwnedRetrievalSperrgrund,
} from '@/lib/readiness/official-truth-server-owned-retrieval'
import {
  officialTruthTrustedFactExtrahieren,
  type OfficialTruthExtractorHerkunft,
  type OfficialTruthTrustedFactExtractorErgebnis,
  type OfficialTruthTrustedFactExtractorSperrgrund,
} from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { regelScopeAusEvidenceScope, type RegelFakt, type RegelFaktArt, type RegelKandidat } from '@/lib/readiness/rule-claims'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'

const GRUND = /^[a-z][a-z0-9_]{0,80}$/
const ABRUF_GRUENDE = new Set<string>([
  'invalid_url',
  'insecure_scheme',
  'credentials',
  'unregistered_domain',
  'blocked_domain',
  'caller_authority_forbidden',
  'sensitive_personal_field',
  'unexpected_fields',
  'invalid_request',
  'catalog_not_configured',
  'catalog_failed',
  'tracking_parameter',
  'url_source_mismatch',
  'redirect_source_mismatch',
  'source_not_official_authority',
  'address_not_permitted',
  'non_default_port',
  'dns_failed',
  'dns_empty',
  'redirect_rejected',
  'redirect_loop',
  'redirect_limit',
  'http_status',
  'http_failed',
  'response_too_large',
  'invalid_utf8',
  'empty_body',
  'timeout',
  'invalid_retrieval_time',
  'invalid_source_snapshot',
])

export type OfficialTruthSameRequestExtractionSperrgrund =
  | OfficialTruthSameRequestProofSperrgrund
  | OfficialTruthServerOwnedRetrievalSperrgrund
  | OfficialTruthTrustedFactExtractorSperrgrund
  | 'composition_policy_unavailable'
  | 'blocked_domain_not_replayable'
  | 'source_changed_since_evidence'
  | 'source_url_changed_since_evidence'
  | 'support_binding_mismatch'
  | 'representation_not_eligible'

export type OfficialTruthSameRequestRetrievalProvenienz = {
  readonly versionId: string
  readonly sourceId: string
  readonly canonicalUrl: string
  readonly retrievedAt: string
  readonly contentType: string | null
  readonly sourceContentHash: string
}

/**
 * Internes Material einer Ausführung. Kein Bearer, keine API-Antwort,
 * keine Annahme. Der Seitenrohtext ist hier nicht mehr enthalten.
 */
export type OfficialTruthSameRequestExtractionErgebnis =
  | {
      readonly status: 'same_request_trusted_fact_material'
      readonly registry: QuellenRegistry
      readonly evidenceVersions: readonly EvidenceVersion[]
      readonly kandidat: RegelKandidat
      readonly reviewPacketKey: string
      readonly ruleScopeKey: string
      readonly factKind: RegelFaktArt
      readonly evidenceQuality: 'explicit_primary_statement'
      readonly supportVersionIds: readonly string[]
      readonly serverReferenceTime: string
      readonly freshness: 'current'
      readonly grant: 'role'
      readonly capability: 'official-truth-freigeben'
      readonly trustedRuleFact: RegelFakt
      readonly extractorId: string
      readonly extractorVersion: number
      readonly schemaFamily: string
      readonly policyId: null
      readonly policyVersion: null
      readonly provenance: readonly OfficialTruthExtractorHerkunft[]
      readonly retrievals: readonly OfficialTruthSameRequestRetrievalProvenienz[]
    }
  | {
      readonly status: 'blocked'
      readonly reason: OfficialTruthSameRequestExtractionSperrgrund
    }

type Beweis = Extract<OfficialTruthSameRequestProofErgebnis, { status: 'same_request_proof' }>

type SaubererAbruf = {
  readonly status: 'server_owned_official_retrieval'
  readonly sourceId: string
  readonly canonicalUrl: string
  readonly retrievedAt: string
  readonly contentType: string | null
  readonly sourceSnapshot: string
  readonly sourceContentHash: string
  readonly redirectCount: number
}

type Gebunden = {
  readonly versionId: string
  readonly sourceId: string
  readonly abruf: SaubererAbruf
}

/**
 * Testnaht. Der Beweisloader, die Lesung und der Extraktor sind
 * Einspritzungen. Eine Route darf diese Naht nicht als Autorität aufrufen.
 * Die Naht nimmt keine Uhr, keinen Katalog und keine Definitionen.
 */
export type OfficialTruthSameRequestExtractionAbhaengigkeiten = {
  readonly loadProof: (eingabe: unknown) => Promise<OfficialTruthSameRequestProofErgebnis>
  readonly retrieve: (
    eingabe: unknown,
    transport: OfficialTruthSourceCatalogTransport,
  ) => Promise<OfficialTruthServerOwnedRetrievalErgebnis>
  readonly extract: (eingabe: unknown) => OfficialTruthTrustedFactExtractorErgebnis
}

function blockiert(reason: OfficialTruthSameRequestExtractionSperrgrund): OfficialTruthSameRequestExtractionErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function grundOder(
  reason: unknown,
  ersatz: OfficialTruthSameRequestExtractionSperrgrund,
): OfficialTruthSameRequestExtractionSperrgrund {
  if (typeof reason === 'string' && GRUND.test(reason)) return reason as OfficialTruthSameRequestExtractionSperrgrund
  return ersatz
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function tiefEinfrieren<T>(wert: T): T {
  if (!wert || typeof wert !== 'object') return wert
  if (Array.isArray(wert)) {
    for (const eintrag of wert) tiefEinfrieren(eintrag)
    return Object.freeze(wert) as T
  }
  for (const eintrag of Object.values(wert)) tiefEinfrieren(eintrag)
  return Object.freeze(wert) as T
}

function gleicheIds(links: readonly string[], rechts: readonly string[]): boolean {
  return links.length === rechts.length && links.every((id, index) => id === rechts[index])
}

/**
 * Der Katalogvertrag kennt keine gesperrten Domains. Eine Registry mit
 * diesem Zustand wird nicht beschnitten. Sie scheitert geschlossen.
 * Der Transport liest nur `read_registry` und nur die bereits eingefrorene
 * Zeilenkopie. Er sieht keine Umgebung und kein Netz.
 */
function wiedergabe(
  registry: QuellenRegistry,
):
  | { ok: true; transport: OfficialTruthSourceCatalogTransport }
  | { ok: false; reason: 'blocked_domain_not_replayable' | 'support_binding_mismatch' } {
  if (!registry || typeof registry !== 'object' || !Array.isArray(registry.sources) || !Array.isArray(registry.blockedDomains)) {
    return { ok: false, reason: 'support_binding_mismatch' }
  }
  if (registry.blockedDomains.length > 0) return { ok: false, reason: 'blocked_domain_not_replayable' }

  const sources: Record<string, unknown>[] = []
  for (const quelle of registry.sources) {
    const satz = datensatz(quelle)
    if (!satz) return { ok: false, reason: 'support_binding_mismatch' }
    if (typeof satz.sourceId !== 'string' || typeof satz.publisherName !== 'string') {
      return { ok: false, reason: 'support_binding_mismatch' }
    }
    if (satz.sourceClass !== 'official_authority' && satz.sourceClass !== 'licensed_evidence_provider') {
      return { ok: false, reason: 'support_binding_mismatch' }
    }
    if (satz.authorityName !== null && typeof satz.authorityName !== 'string') {
      return { ok: false, reason: 'support_binding_mismatch' }
    }
    if (!Array.isArray(satz.domains) || satz.domains.some((domain) => typeof domain !== 'string')) {
      return { ok: false, reason: 'support_binding_mismatch' }
    }
    sources.push({
      source_id: satz.sourceId,
      source_class: satz.sourceClass,
      publisher_name: satz.publisherName,
      authority_name: satz.authorityName,
      domains: [...satz.domains],
    })
  }

  const antwort = Object.freeze({
    ok: true as const,
    operation: 'read_registry' as const,
    sources: Object.freeze(
      sources.map((zeile) =>
        Object.freeze({
          ...zeile,
          domains: Object.freeze([...(zeile.domains as string[])]),
        }),
      ),
    ),
  })

  return {
    ok: true,
    transport: {
      async aufrufen(payload) {
        const satz = datensatz(payload)
        if (!satz) return { ok: false }
        const namen = Object.keys(satz)
        if (namen.length !== 1 || namen[0] !== 'operation' || satz.operation !== 'read_registry') return { ok: false }
        return { ok: true, antwort }
      },
    },
  }
}

function stuetzeIstAbleitbar(support: OfficialTruthServerHeldSameRequestSupport | undefined): support is OfficialTruthServerHeldSameRequestSupport {
  if (!support) return false
  return (
    typeof support.versionId === 'string' &&
    typeof support.sourceId === 'string' &&
    typeof support.canonicalUrl === 'string' &&
    typeof support.sourceContentHash === 'string'
  )
}

function abrufLesen(
  wert: unknown,
): { ok: true; abruf: SaubererAbruf } | { ok: false; reason: OfficialTruthSameRequestExtractionSperrgrund } {
  const satz = datensatz(wert)
  if (!satz) return { ok: false, reason: 'http_failed' }
  if (satz.status === 'retrieved_material') return { ok: false, reason: 'representation_not_eligible' }
  if (satz.status === 'blocked') {
    const reason = grundOder(satz.reason, 'http_failed')
    if (ABRUF_GRUENDE.has(reason)) return { ok: false, reason }
    return { ok: false, reason: 'http_failed' }
  }
  if (satz.status !== 'server_owned_official_retrieval') return { ok: false, reason: 'http_failed' }
  if (typeof satz.sourceId !== 'string' || typeof satz.canonicalUrl !== 'string' || typeof satz.sourceContentHash !== 'string') {
    return { ok: false, reason: 'invalid_source_snapshot' }
  }
  if (typeof satz.sourceSnapshot !== 'string') return { ok: false, reason: 'invalid_source_snapshot' }
  if (typeof satz.retrievedAt !== 'string') return { ok: false, reason: 'invalid_retrieval_time' }
  if (satz.contentType !== null && typeof satz.contentType !== 'string') return { ok: false, reason: 'http_failed' }
  if (
    typeof satz.redirectCount !== 'number' ||
    !Number.isSafeInteger(satz.redirectCount) ||
    satz.redirectCount < 0 ||
    satz.redirectCount > 5
  ) {
    return { ok: false, reason: 'redirect_limit' }
  }
  const contentType = satz.contentType as string | null
  const redirectCount = satz.redirectCount
  return {
    ok: true,
    abruf: {
      status: 'server_owned_official_retrieval',
      sourceId: satz.sourceId,
      canonicalUrl: satz.canonicalUrl,
      retrievedAt: satz.retrievedAt,
      contentType,
      sourceSnapshot: satz.sourceSnapshot,
      sourceContentHash: satz.sourceContentHash,
      redirectCount,
    },
  }
}

function evidenceBindet(beweis: Beweis, support: OfficialTruthServerHeldSameRequestSupport): boolean {
  const treffer = beweis.evidenceVersions.filter((version) => version.versionId === support.versionId)
  if (treffer.length !== 1) return false
  const version = treffer[0]
  if (!version) return false
  const gelesen = akzeptierteEvidenceLesen(version, beweis.registry)
  if (!gelesen) return false
  if (gelesen.versionId !== support.versionId || gelesen.sourceId !== support.sourceId) return false
  if (gelesen.canonicalUrl !== support.canonicalUrl || gelesen.sourceContentHash !== support.sourceContentHash) return false
  if (gelesen.scope.sourceId !== support.sourceId) return false
  const zelle = regelScopeAusEvidenceScope(gelesen.scope)
  if (!zelle.ok || zelle.key !== beweis.ruleScopeKey) return false
  return zelle.scope.requirementType === beweis.kandidat.scope.requirementType
}

function herkunftPasst(beweis: Beweis, erfolg: Extract<OfficialTruthTrustedFactExtractorErgebnis, { status: 'trusted_fact_extracted' }>): boolean {
  if (erfolg.policyId !== null || erfolg.policyVersion !== null) return false
  if (!gleicheIds(erfolg.supportVersionIds, beweis.supportVersionIds)) return false
  const versionen = new Set(beweis.supports.map((support) => support.versionId))
  const quellen = new Set(beweis.supports.map((support) => support.sourceId))
  if (erfolg.provenance.length === 0) return false
  return erfolg.provenance.every(
    (eintrag) =>
      eintrag.policyId === null &&
      eintrag.policyVersion === null &&
      versionen.has(eintrag.versionId) &&
      quellen.has(eintrag.sourceId) &&
      eintrag.extractorId === erfolg.extractorId &&
      eintrag.extractorVersion === erfolg.extractorVersion,
  )
}

function material(
  beweis: Beweis,
  erfolg: Extract<OfficialTruthTrustedFactExtractorErgebnis, { status: 'trusted_fact_extracted' }>,
  gebunden: readonly Gebunden[],
): OfficialTruthSameRequestExtractionErgebnis | null {
  const retrievals: OfficialTruthSameRequestRetrievalProvenienz[] = []
  for (const support of beweis.supports) {
    const fund = gebunden.find((eintrag) => eintrag.versionId === support.versionId)
    if (!fund) return null
    retrievals.push({
      versionId: support.versionId,
      sourceId: support.sourceId,
      canonicalUrl: fund.abruf.canonicalUrl,
      retrievedAt: fund.abruf.retrievedAt,
      contentType: fund.abruf.contentType,
      sourceContentHash: fund.abruf.sourceContentHash,
    })
  }
  return tiefEinfrieren(
    structuredClone({
      status: 'same_request_trusted_fact_material' as const,
      registry: beweis.registry,
      evidenceVersions: beweis.evidenceVersions,
      kandidat: beweis.kandidat,
      reviewPacketKey: beweis.reviewPacketKey,
      ruleScopeKey: beweis.ruleScopeKey,
      factKind: beweis.factKind,
      evidenceQuality: 'explicit_primary_statement' as const,
      supportVersionIds: [...beweis.supportVersionIds],
      serverReferenceTime: beweis.serverReferenceTime,
      freshness: 'current' as const,
      grant: 'role' as const,
      capability: 'official-truth-freigeben' as const,
      trustedRuleFact: erfolg.fact,
      extractorId: erfolg.extractorId,
      extractorVersion: erfolg.extractorVersion,
      schemaFamily: erfolg.schemaFamily,
      policyId: null,
      policyVersion: null,
      provenance: erfolg.provenance,
      retrievals,
    }),
  )
}

/**
 * Eine Ausführung. Der Beweisloader ist die einzige Katalogautorität.
 * Die Lesung bekommt danach nur die Wiedergabe dieser Registry.
 */
export async function decideOfficialTruthSameRequestTrustedFactExtraction(
  eingabe: unknown,
  abhaengigkeiten: OfficialTruthSameRequestExtractionAbhaengigkeiten,
): Promise<OfficialTruthSameRequestExtractionErgebnis> {
  let beweis: OfficialTruthSameRequestProofErgebnis
  try {
    beweis = await abhaengigkeiten.loadProof(eingabe)
  } catch {
    return blockiert('catalog_failed')
  }
  if (!beweis || beweis.status !== 'same_request_proof') {
    return blockiert(grundOder(beweis && beweis.status === 'blocked' ? beweis.reason : null, 'authority_required'))
  }
  if (beweis.grant !== 'role' || beweis.capability !== 'official-truth-freigeben') return blockiert('authority_required')
  if (beweis.freshness !== 'current') return blockiert('freshness_not_current')
  if (beweis.evidenceQuality === 'composed_from_multiple_primary_sources') return blockiert('composition_policy_unavailable')
  if (beweis.evidenceQuality !== 'explicit_primary_statement') return blockiert('quality_not_acceptable')
  if (typeof beweis.kandidat?.scope?.requirementType !== 'string') return blockiert('support_binding_mismatch')
  if (typeof beweis.factKind !== 'string' || typeof beweis.ruleScopeKey !== 'string' || typeof beweis.reviewPacketKey !== 'string') {
    return blockiert('support_binding_mismatch')
  }
  if (typeof beweis.serverReferenceTime !== 'string' || !Array.isArray(beweis.supports) || beweis.supports.length === 0) {
    return blockiert('support_binding_mismatch')
  }
  if (!Array.isArray(beweis.evidenceVersions) || !Array.isArray(beweis.supportVersionIds)) {
    return blockiert('support_binding_mismatch')
  }

  const replay = wiedergabe(beweis.registry)
  if (!replay.ok) return blockiert(replay.reason)

  const gebunden: Gebunden[] = []
  for (const support of beweis.supports) {
    if (!stuetzeIstAbleitbar(support)) return blockiert('support_binding_mismatch')
    let roh: unknown
    try {
      roh = await abhaengigkeiten.retrieve({ sourceId: support.sourceId, url: support.canonicalUrl }, replay.transport)
    } catch {
      return blockiert('http_failed')
    }
    const gelesen = abrufLesen(roh)
    if (!gelesen.ok) return blockiert(gelesen.reason)
    if (gelesen.abruf.sourceId !== support.sourceId) return blockiert('support_binding_mismatch')
    if (gelesen.abruf.canonicalUrl !== support.canonicalUrl) return blockiert('source_url_changed_since_evidence')
    if (gelesen.abruf.sourceContentHash !== support.sourceContentHash) return blockiert('source_changed_since_evidence')
    if (!evidenceBindet(beweis, support)) return blockiert('support_binding_mismatch')
    gebunden.push({ versionId: support.versionId, sourceId: support.sourceId, abruf: gelesen.abruf })
  }

  let extrakt: OfficialTruthTrustedFactExtractorErgebnis
  try {
    extrakt = abhaengigkeiten.extract({
      factKind: beweis.factKind,
      requirementType: beweis.kandidat.scope.requirementType,
      scopeKey: beweis.ruleScopeKey,
      evidenceQuality: beweis.evidenceQuality,
      supports: gebunden.map((eintrag) => ({
        versionId: eintrag.versionId,
        sourceId: eintrag.sourceId,
        retrieval: eintrag.abruf,
      })),
      policy: null,
      registry: beweis.registry,
    })
  } catch {
    return blockiert('fact_incomplete')
  }
  if (!extrakt || extrakt.status !== 'trusted_fact_extracted') {
    return blockiert(grundOder(extrakt && extrakt.status === 'blocked' ? extrakt.reason : null, 'fact_incomplete'))
  }
  if (!herkunftPasst(beweis, extrakt)) return blockiert('support_binding_mismatch')

  try {
    const gebaut = material(beweis, extrakt, gebunden)
    if (!gebaut) return blockiert('support_binding_mismatch')
    return gebaut
  } catch {
    return blockiert('fact_incomplete')
  }
}

/**
 * Live-Einstieg. Eine Ausführung, der echte Beweis, die echte Lesung
 * mit der Wiedergabe seiner Registry, und nur das leere Produktionsregister.
 */
export async function loadOfficialTruthSameRequestTrustedFactExtraction(
  eingabe: unknown,
): Promise<OfficialTruthSameRequestExtractionErgebnis> {
  return decideOfficialTruthSameRequestTrustedFactExtraction(eingabe, {
    loadProof: loadOfficialTruthSameRequestProof,
    retrieve: loadOfficialTruthServerOwnedRetrievalWithCatalogTransport,
    extract: officialTruthTrustedFactExtrahieren,
  })
}
