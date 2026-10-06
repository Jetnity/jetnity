// lib/readiness/official-truth-same-request-extraction-server.ts
//
// Eine Serverausführung: der bestehende Beweisgraph, genau seine
// eingefrorene Registry, danach die serverseitige HTTPS-Lesung, und erst
// dann der deterministische Extraktorrahmen.
// Der Aufrufer liefert denselben Forschungsumschlag wie der Beweis.
// Er liefert keinen Graphen, keine Registry, keine Evidence, keinen Abruf,
// keinen Fakt, keinen Extraktor und keine Politik.
// Eine zweite Katalog-RPC gibt es nicht. Die vollständige v2-Wiedergabe
// bewahrt auch gesperrte Domains und die exakten Inhaltsbindungen.
// Zusammengesetzte Qualität scheitert vor dem Netz, weil keine
// codeeigene Kompositionspolitik existiert. Diese Datei erfindet keine.
// Der dekodierte RegelScope kommt nur aus dem kanonischen Beweis,
// neu geprüft über regelScopeAusEvidenceScope, und erst dann in den
// Extraktor. Ein Aufrufer-Scope ist keine Autorität.
// Das Produktions-Extraktorregister bleibt leer. Ein Erfolg ist internes
// Material, keine Annahme und kein Seitenrohtext.

import 'server-only'

import { contentIdentityBinding, contentIdentityMatches, contentRepresentationFromRegistry, type ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { akzeptierteEvidenceLesen, type EvidenceVersion } from '@/lib/readiness/evidence'
import {
  OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY,
  officialTruthCompositionPhaseA,
  officialTruthCompositionPhaseB,
  officialTruthCompositionRegistriesPruefen,
  officialTruthCompositionSealView,
  type OfficialTruthCompositionFreeze,
  type OfficialTruthCompositionHerkunft,
  type OfficialTruthCompositionPolicy,
  type OfficialTruthCompositionSperrgrund,
} from '@/lib/readiness/official-truth-composition-policy-registry'
import { quellenKatalogSnapshotAntwort, type OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
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
  OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY,
  consumeOfficialTruthTrustedFactExecutionContext,
  officialTruthTrustedFactExtrahieren,
  type OfficialTruthExtractorDefinition,
  type OfficialTruthExtractorHerkunft,
  type OfficialTruthTrustedFactExtractorErgebnis,
  type OfficialTruthTrustedFactExecutionContext,
  type OfficialTruthTrustedFactExtractorSperrgrund,
} from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import {
  regelScopeAusEvidenceScope,
  type RegelFakt,
  type RegelFaktArt,
  type RegelKandidat,
  type RegelScope,
} from '@/lib/readiness/rule-claims'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'

const GRUND = /^[a-z][a-z0-9_]{0,80}$/
const ABRUF_GRUENDE = new Set<string>([
  'content_not_eligible', 'identity_profile_unavailable', 'content_identity_mismatch',
  'representation_url_mismatch', 'content_type_mismatch',
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
  | OfficialTruthCompositionSperrgrund
  | 'composition_policy_unavailable'
  | 'blocked_domain_not_replayable'
  | 'source_changed_since_evidence'
  | 'source_url_changed_since_evidence'
  | 'support_binding_mismatch'
  | 'representation_not_eligible'

export type OfficialTruthSameRequestRetrievalProvenienz = ContentIdentityBinding & {
  readonly identitySchema: 2
  readonly versionId: string
  readonly sourceId: string
  /** Tatsächlich abgerufene Initial-URL; historische Provenienz, keine Netzautorität. */
  readonly requestUrl: string
  readonly canonicalUrl: string
  readonly retrievedAt: string
  readonly contentType: string
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
      readonly status: 'same_request_composition_bound'
      readonly seal: object
    }
  | {
      readonly status: 'blocked'
      readonly reason: OfficialTruthSameRequestExtractionSperrgrund
    }

type Beweis = Extract<OfficialTruthSameRequestProofErgebnis, { status: 'same_request_proof' }>

type PhaseAInput = Parameters<typeof officialTruthCompositionPhaseA>[0]
type ExtraktorSicht = Omit<OfficialTruthExtractorDefinition, 'match' | 'extract'>
type CompositionResult = Extract<OfficialTruthSameRequestExtractionErgebnis, { status: 'same_request_composition_bound' }>
type PrimaryResult = Extract<OfficialTruthSameRequestExtractionErgebnis, { status: 'same_request_trusted_fact_material' }>

/** Nur internes Ausführungsmaterial, auch bei Testeinspritzungen niemals
 * globale Zulassung, Original-Custody, Executable-Pin oder Producer-Autorität.
 * Keine ausführbaren Referenzen, Forschungsumschläge oder Vorschläge. */
export type OfficialTruthSameRequestCompositionContext = {
  readonly phaseA: {
    readonly factKind: PhaseAInput['factKind']
    readonly requirementType: PhaseAInput['requirementType']
    readonly supports: PhaseAInput['supports']
    readonly extractors: readonly ExtraktorSicht[]
    readonly policies: readonly OfficialTruthCompositionPolicy[]
    readonly selected: {
      readonly extractor: ExtraktorSicht
      readonly policy: OfficialTruthCompositionPolicy
    }
  }
  readonly binding: {
    readonly registry: QuellenRegistry
    readonly scope: RegelScope
    readonly ruleScopeKey: string
    readonly reviewPacketKey: string
    readonly supportVersionIds: readonly string[]
    readonly supports: readonly OfficialTruthServerHeldSameRequestSupport[]
    readonly serverReferenceTime: string
  }
  readonly retrievals: readonly OfficialTruthSameRequestRetrievalProvenienz[]
  readonly phaseB: {
    readonly seal: object
    readonly fact: RegelFakt
    readonly provenance: readonly OfficialTruthCompositionHerkunft[]
    readonly extractorId: string
    readonly extractorVersion: number
    readonly policyId: string
    readonly policyVersion: number
  }
}

/** Private Primärausführung vor der historischen Materialkopie. Keine neue
 * Quellenzulassung, Executable-Pins oder globale Producer-Autorität. */
export type OfficialTruthSameRequestPrimaryContext = {
  readonly binding: OfficialTruthSameRequestCompositionContext['binding'] & {
    readonly evidenceVersions: readonly EvidenceVersion[]
  }
  readonly retrievals: readonly OfficialTruthSameRequestRetrievalProvenienz[]
  readonly execution: OfficialTruthTrustedFactExecutionContext
}

/** Ausschließlich serverinterner Verbraucher. Die #898-Sicht bleibt unverändert
 * und enthält weiterhin keine Funktionen; daneben liegen die Originalreferenzen. */
export type OfficialTruthSameRequestCompositionExecutionContext = {
  readonly context: OfficialTruthSameRequestCompositionContext
  readonly execution: {
    readonly extractors: readonly OfficialTruthExtractorDefinition[]
    readonly policies: readonly OfficialTruthCompositionPolicy[]
    readonly selected: {
      readonly extractor: OfficialTruthExtractorDefinition
      readonly policy: OfficialTruthCompositionPolicy
    }
  }
}

const primaryContexts = new WeakMap<PrimaryResult, OfficialTruthSameRequestPrimaryContext>()

export function consumeOfficialTruthSameRequestPrimaryContext(
  result: unknown,
): OfficialTruthSameRequestPrimaryContext | null {
  if (!result || typeof result !== 'object') return null
  const context = primaryContexts.get(result as PrimaryResult)
  if (!context) return null
  primaryContexts.delete(result as PrimaryResult)
  return context
}

type CompositionStart = {
  // Exakte validierte Referenzen, vor HTTP festgehalten. Nicht projizieren.
  readonly input: PhaseAInput
  readonly freeze: OfficialTruthCompositionFreeze
  readonly binding: OfficialTruthSameRequestCompositionContext['binding']
}

const compositionContexts = new WeakMap<CompositionResult, {
  readonly start: CompositionStart
  readonly view: OfficialTruthSameRequestCompositionContext
}>()

/** Einmaliger interner Verbrauch nur für die registrierte Ergebnisidentität.
 * Ein gleiches DTO, fremdes Siegel oder erneut vorgelegtes Ergebnis genügt nicht.
 * Die Rückgabe ist keine Autorität und darf nicht als öffentliche Antwort dienen. */
export function consumeOfficialTruthSameRequestCompositionContext(
  result: unknown,
): OfficialTruthSameRequestCompositionContext | null {
  return compositionContextConsume(result)?.view ?? null
}

/** Derselbe Einmalverbrauch wie #898. Kein zweites Handle, kein Registry-Lookup
 * und keine erneute Auswahl der bereits vor HTTP eingefrorenen Definition. */
export function consumeOfficialTruthSameRequestCompositionExecutionContext(
  result: unknown,
): OfficialTruthSameRequestCompositionExecutionContext | null {
  const entry = compositionContextConsume(result)
  if (!entry) return null
  return Object.freeze({
    context: entry.view,
    execution: Object.freeze({
      extractors: entry.start.input.extractors,
      policies: entry.start.input.policies,
      selected: Object.freeze({ extractor: entry.start.freeze.extractor, policy: entry.start.freeze.policy }),
    }),
  })
}

function compositionContextConsume(result: unknown): {
  readonly start: CompositionStart
  readonly view: OfficialTruthSameRequestCompositionContext
} | null {
  if (!result || typeof result !== 'object') return null
  const entry = compositionContexts.get(result as CompositionResult)
  if (!entry) return null // Keine Property-/Getter-Lesung an fremden Objekten.
  compositionContexts.delete(result as CompositionResult)
  try {
    const bound = result as CompositionResult
    const { phaseB } = entry.view
    const sealView = officialTruthCompositionSealView(bound.seal)
    if (bound.status !== 'same_request_composition_bound' || bound.seal !== phaseB.seal ||
        !sealView || sealView.fact !== phaseB.fact ||
        sealView.policyId !== phaseB.policyId || sealView.policyVersion !== phaseB.policyVersion ||
        !gleicheIds(sealView.supportVersionIds, entry.view.binding.supportVersionIds)) return null
    return entry
  } catch {
    return null
  }
}

function extraktorSicht(definition: OfficialTruthExtractorDefinition): ExtraktorSicht {
  return Object.freeze({
    extractorId: definition.extractorId,
    extractorVersion: definition.extractorVersion,
    current: definition.current,
    factKind: definition.factKind,
    sourceFamilyId: definition.sourceFamilyId,
    contentItemRefs: definition.contentItemRefs,
    representations: definition.representations,
    urlAllowlist: definition.urlAllowlist,
    contentTypes: definition.contentTypes,
    schemaFamily: definition.schemaFamily,
    policyId: definition.policyId,
    policyVersion: definition.policyVersion,
    requiredFieldPaths: definition.requiredFieldPaths,
  })
}

function compositionCapture(
  start: CompositionStart,
  phaseB: Extract<ReturnType<typeof officialTruthCompositionPhaseB>, { ok: true }>,
  result: CompositionResult,
  retrievals: readonly OfficialTruthSameRequestRetrievalProvenienz[],
): void {
  // Fehlende Capture-Voraussetzungen ändern keine bestehenden Ergebnisse.
  // Kein Register-Lookup, keine neue Auswahl, kein neues Siegel/Fact-Objekt.
  try {
    const { input, freeze, binding } = start
    const sealView = officialTruthCompositionSealView(phaseB.seal)
    if (!sealView || result.seal !== phaseB.seal ||
        !input.extractors.includes(freeze.extractor) || !input.policies.includes(freeze.policy) ||
        phaseB.extractorId !== freeze.extractorId || phaseB.extractorVersion !== freeze.extractorVersion ||
        phaseB.policyId !== freeze.policyId || phaseB.policyVersion !== freeze.policyVersion ||
        sealView.policyId !== freeze.policyId || sealView.policyVersion !== freeze.policyVersion ||
        !gleicheIds(sealView.supportVersionIds, binding.supportVersionIds) ||
        !gleicheIds(retrievals.map((row) => row.versionId), binding.supportVersionIds)) return
    const view: OfficialTruthSameRequestCompositionContext = tiefEinfrieren({
      phaseA: {
        factKind: input.factKind,
        requirementType: input.requirementType,
        supports: input.supports,
        extractors: input.extractors.map(extraktorSicht),
        policies: input.policies,
        selected: { extractor: extraktorSicht(freeze.extractor), policy: freeze.policy },
      },
      binding,
      retrievals,
      phaseB: {
        seal: phaseB.seal,
        fact: sealView.fact,
        provenance: phaseB.provenance,
        extractorId: phaseB.extractorId,
        extractorVersion: phaseB.extractorVersion,
        policyId: phaseB.policyId,
        policyVersion: phaseB.policyVersion,
      },
    })
    compositionContexts.set(result, Object.freeze({ start, view }))
  } catch {
    // Kein teilweiser Capture wird veröffentlicht oder protokolliert.
  }
}

type SaubererAbruf = ContentIdentityBinding & {
  readonly identitySchema: 2
  readonly status: 'server_owned_official_retrieval'
  readonly sourceId: string
  readonly canonicalUrl: string
  readonly retrievedAt: string
  readonly contentType: string
  readonly sourceSnapshot: string
  readonly sourceContentHash: string
  readonly redirectCount: number
}

type Gebunden = {
  readonly versionId: string
  readonly sourceId: string
  readonly requestUrl: string
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
  readonly compositionPolicies?: readonly OfficialTruthCompositionPolicy[]
  readonly compositionExtractors?: readonly OfficialTruthExtractorDefinition[]
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
  const antwort = quellenKatalogSnapshotAntwort(registry)
  if (!antwort) return { ok: false, reason: 'support_binding_mismatch' }

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
): { ok: true; requestUrl: string; abruf: SaubererAbruf } | { ok: false; reason: OfficialTruthSameRequestExtractionSperrgrund } {
  const satz = datensatz(wert)
  if (!satz) return { ok: false, reason: 'http_failed' }
  if (satz.status === 'retrieved_material') return { ok: false, reason: 'representation_not_eligible' }
  if (satz.status === 'blocked') {
    const reason = grundOder(satz.reason, 'http_failed')
    if (ABRUF_GRUENDE.has(reason)) return { ok: false, reason }
    return { ok: false, reason: 'http_failed' }
  }
  if (satz.status !== 'server_owned_official_retrieval') return { ok: false, reason: 'http_failed' }
  if (typeof satz.requestUrl !== 'string') return { ok: false, reason: 'invalid_source_snapshot' }
  if (typeof satz.sourceId !== 'string' || typeof satz.canonicalUrl !== 'string' || typeof satz.sourceContentHash !== 'string') {
    return { ok: false, reason: 'invalid_source_snapshot' }
  }
  if (typeof satz.sourceSnapshot !== 'string') return { ok: false, reason: 'invalid_source_snapshot' }
  if (typeof satz.retrievedAt !== 'string') return { ok: false, reason: 'invalid_retrieval_time' }
  if (satz.identitySchema !== 2 || typeof satz.contentType !== 'string') return { ok: false, reason: 'http_failed' }
  if (
    typeof satz.redirectCount !== 'number' ||
    !Number.isSafeInteger(satz.redirectCount) ||
    satz.redirectCount < 0 ||
    satz.redirectCount > 5
  ) {
    return { ok: false, reason: 'redirect_limit' }
  }
  const contentType = satz.contentType as string
  const redirectCount = satz.redirectCount
  return {
    ok: true,
    requestUrl: satz.requestUrl,
    // Der strikte Extraktorvertrag bleibt unverändert. Request-Provenienz
    // bleibt daneben gebunden und wird nicht zur Extraktorautorität.
    abruf: {
      ...contentIdentityBinding(satz as unknown as ContentIdentityBinding),
      identitySchema: 2,
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

function zelleAus(
  scope: unknown,
): { ok: true; scope: RegelScope; key: string } | { ok: false; reason: OfficialTruthSameRequestExtractionSperrgrund } {
  const gelesen = regelScopeAusEvidenceScope(scope)
  if (!gelesen.ok) return { ok: false, reason: gelesen.reason }
  return { ok: true, scope: gelesen.scope, key: gelesen.key }
}

/**
 * Dieselbe quellenneutrale Zelle für Kandidat, akzeptierte Evidence und
 * jede Stütze, deren Version schon im Beweis liegt. Der Schlüssel wird
 * neu berechnet. Der Forschungsumschlag wird hier nicht erneut gelesen.
 */
function regulatorischenScopeBinden(
  beweis: Beweis,
): { ok: true; scope: RegelScope; key: string } | { ok: false; reason: OfficialTruthSameRequestExtractionSperrgrund } {
  if (!beweis.kandidat?.scope) return { ok: false, reason: 'support_binding_mismatch' }
  const gelesen = regelScopeAusEvidenceScope(beweis.kandidat.scope)
  if (!gelesen.ok) return { ok: false, reason: gelesen.reason }
  if (gelesen.key !== beweis.ruleScopeKey) return { ok: false, reason: 'scope_mismatch' }
  if (beweis.kandidat.scope.requirementType !== gelesen.scope.requirementType) {
    return { ok: false, reason: 'requirement_type_mismatch' }
  }
  for (const version of beweis.evidenceVersions) {
    const zelle = zelleAus(version?.scope)
    if (!zelle.ok) return zelle
    if (zelle.key !== gelesen.key) return { ok: false, reason: 'scope_mismatch' }
  }
  for (const support of beweis.supports) {
    if (!support || typeof support.versionId !== 'string') continue
    const treffer = beweis.evidenceVersions.filter((version) => version?.versionId === support.versionId)
    if (treffer.length !== 1) continue
    const zelle = zelleAus(treffer[0]?.scope)
    if (!zelle.ok || zelle.key !== gelesen.key) return { ok: false, reason: 'scope_mismatch' }
  }
  return { ok: true, scope: tiefEinfrieren(structuredClone(gelesen.scope)), key: gelesen.key }
}

function evidenceBindet(beweis: Beweis, support: OfficialTruthServerHeldSameRequestSupport): boolean {
  const treffer = beweis.evidenceVersions.filter((version) => version.versionId === support.versionId)
  if (treffer.length !== 1) return false
  const version = treffer[0]
  if (!version) return false
  const gelesen = akzeptierteEvidenceLesen(version, beweis.registry)
  if (!gelesen) return false
  if (!contentIdentityMatches(gelesen, support) || gelesen.contentType !== support.contentType) return false
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
  if (erfolg.provenance.length === 0) return false
  return erfolg.provenance.every(
    (eintrag) =>
      eintrag.policyId === null &&
      eintrag.policyVersion === null &&
      beweis.supports.some((support) => support.versionId === eintrag.versionId && contentIdentityMatches(support, eintrag)) &&
      eintrag.extractorId === erfolg.extractorId &&
      eintrag.extractorVersion === erfolg.extractorVersion,
  )
}

function material(
  beweis: Beweis,
  erfolg: Extract<OfficialTruthTrustedFactExtractorErgebnis, { status: 'trusted_fact_extracted' }>,
  gebunden: readonly Gebunden[],
  scope: RegelScope,
  execution: OfficialTruthTrustedFactExecutionContext | null,
): OfficialTruthSameRequestExtractionErgebnis | null {
  const retrievals: OfficialTruthSameRequestRetrievalProvenienz[] = []
  for (const support of beweis.supports) {
    const fund = gebunden.find((eintrag) => eintrag.versionId === support.versionId)
    if (!fund) return null
    retrievals.push({
      ...contentIdentityBinding(support),
      identitySchema: 2,
      versionId: support.versionId,
      sourceId: support.sourceId,
      requestUrl: fund.requestUrl,
      canonicalUrl: fund.abruf.canonicalUrl,
      retrievedAt: fund.abruf.retrievedAt,
      contentType: fund.abruf.contentType,
      sourceContentHash: fund.abruf.sourceContentHash,
    })
  }
  const result = tiefEinfrieren(
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
  if (execution && execution.fact === erfolg.fact && execution.provenance === erfolg.provenance &&
      execution.selected.policyId === null && execution.selected.policyVersion === null) {
    primaryContexts.set(result, tiefEinfrieren({
      binding: {
        registry: beweis.registry,
        scope,
        ruleScopeKey: beweis.ruleScopeKey,
        reviewPacketKey: beweis.reviewPacketKey,
        supportVersionIds: beweis.supportVersionIds,
        supports: beweis.supports,
        serverReferenceTime: beweis.serverReferenceTime,
        evidenceVersions: beweis.evidenceVersions,
      },
      retrievals,
      execution,
    }))
  }
  return result
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
  const zusammengesetzt = beweis.evidenceQuality === 'composed_from_multiple_primary_sources'
  if (!zusammengesetzt && beweis.evidenceQuality !== 'explicit_primary_statement') return blockiert('quality_not_acceptable')
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

  const zelle = regulatorischenScopeBinden(beweis)
  if (!zelle.ok) return blockiert(zelle.reason)

  let fest: Beweis
  try {
    fest = tiefEinfrieren(structuredClone(beweis))
  } catch {
    return blockiert('support_binding_mismatch')
  }

  const politiken = abhaengigkeiten.compositionPolicies ?? OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY
  const extraktoren = abhaengigkeiten.compositionExtractors ?? OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY
  let compositionStart: CompositionStart | null = null
  if (zusammengesetzt) {
    const register = officialTruthCompositionRegistriesPruefen(politiken, extraktoren)
    if (!register.ok) return blockiert(register.reason)
    const input: PhaseAInput = tiefEinfrieren({
      factKind: fest.factKind,
      requirementType: zelle.scope.requirementType,
      supports: fest.supports.map((support) => ({ ...contentIdentityBinding(support), canonicalUrl: support.canonicalUrl })),
      extractors: register.extractors,
      policies: register.policies,
    })
    const phaseA = officialTruthCompositionPhaseA(input)
    if (!phaseA.ok) return blockiert(phaseA.reason)
    compositionStart = tiefEinfrieren({
      input,
      freeze: phaseA.freeze,
      binding: {
        registry: fest.registry,
        scope: zelle.scope,
        ruleScopeKey: zelle.key,
        reviewPacketKey: fest.reviewPacketKey,
        supportVersionIds: fest.supportVersionIds,
        supports: fest.supports.map((support) => ({
          ...contentIdentityBinding(support),
          identitySchema: 2 as const,
          versionId: support.versionId,
          canonicalUrl: support.canonicalUrl,
          contentType: support.contentType,
          retrievedAt: support.retrievedAt,
          sourceContentHash: support.sourceContentHash,
          validFrom: support.validFrom,
          validUntil: support.validUntil,
        })),
        serverReferenceTime: fest.serverReferenceTime,
      },
    })
  }

  const replay = wiedergabe(fest.registry)
  if (!replay.ok) return blockiert(replay.reason)

  const gebunden: Gebunden[] = []
  for (const support of fest.supports) {
    if (!stuetzeIstAbleitbar(support)) return blockiert('support_binding_mismatch')
    if (!evidenceBindet(fest, support)) return blockiert('support_binding_mismatch')
    const representation = contentRepresentationFromRegistry(fest.registry, support.canonicalUrl)
    if (!representation.ok || !contentIdentityMatches(representation.value, support)) return blockiert('support_binding_mismatch')
    // A final-only URL is observation identity, not initial-request permission.
    // Choose within this exact representation's already validated request set.
    const requestUrl = representation.value.requestUrls.includes(support.canonicalUrl)
      ? support.canonicalUrl : representation.value.requestUrls[0]
    if (!requestUrl) return blockiert('support_binding_mismatch')
    let roh: unknown
    try {
      roh = await abhaengigkeiten.retrieve({ sourceId: support.sourceId, url: requestUrl }, replay.transport)
    } catch {
      return blockiert('http_failed')
    }
    const gelesen = abrufLesen(roh)
    if (!gelesen.ok) return blockiert(gelesen.reason)
    if (gelesen.requestUrl !== requestUrl) return blockiert('support_binding_mismatch')
    if (!contentIdentityMatches(gelesen.abruf, support) || gelesen.abruf.contentType !== support.contentType) return blockiert('support_binding_mismatch')
    if (gelesen.abruf.sourceId !== support.sourceId) return blockiert('support_binding_mismatch')
    if (gelesen.abruf.canonicalUrl !== support.canonicalUrl) return blockiert('source_url_changed_since_evidence')
    if (gelesen.abruf.sourceContentHash !== support.sourceContentHash) return blockiert('source_changed_since_evidence')
    if (!evidenceBindet(fest, support)) return blockiert('support_binding_mismatch')
    gebunden.push({ versionId: support.versionId, sourceId: support.sourceId, requestUrl: gelesen.requestUrl, abruf: gelesen.abruf })
  }

  if (compositionStart) {
    const phaseB = officialTruthCompositionPhaseB({
      freeze: compositionStart.freeze,
      supports: gebunden.map((eintrag) => ({
        versionId: eintrag.versionId,
        sourceId: eintrag.sourceId,
        retrieval: eintrag.abruf,
      })),
      proofSupports: fest.supports.map((support) => ({
        ...contentIdentityBinding(support),
        contentType: support.contentType,
        versionId: support.versionId,
        sourceId: support.sourceId,
        canonicalUrl: support.canonicalUrl,
        sourceContentHash: support.sourceContentHash,
      })),
      acceptedVersionIds: fest.supportVersionIds,
      requirementType: zelle.scope.requirementType,
      scopeKey: zelle.key,
      scope: zelle.scope,
      registry: fest.registry,
    })
    if (!phaseB.ok) return blockiert(phaseB.reason)
    const result = Object.freeze({ status: 'same_request_composition_bound' as const, seal: phaseB.seal })
    compositionCapture(compositionStart, phaseB, result, gebunden.map((entry) => ({
      ...contentIdentityBinding(entry.abruf),
      identitySchema: 2 as const,
      versionId: entry.versionId,
      requestUrl: entry.requestUrl,
      canonicalUrl: entry.abruf.canonicalUrl,
      retrievedAt: entry.abruf.retrievedAt,
      contentType: entry.abruf.contentType,
      sourceContentHash: entry.abruf.sourceContentHash,
    })))
    return result
  }

  const extractionInput = tiefEinfrieren({
    factKind: fest.factKind,
    requirementType: zelle.scope.requirementType,
    scopeKey: zelle.key,
    scope: zelle.scope,
    evidenceQuality: 'explicit_primary_statement',
    supports: gebunden.map((eintrag) => ({
      versionId: eintrag.versionId,
      sourceId: eintrag.sourceId,
      retrieval: eintrag.abruf,
    })),
    policy: null,
    registry: fest.registry,
  })
  let extrakt: OfficialTruthTrustedFactExtractorErgebnis
  try {
    extrakt = abhaengigkeiten.extract(extractionInput)
  } catch {
    return blockiert('fact_incomplete')
  }
  if (!extrakt || extrakt.status !== 'trusted_fact_extracted') {
    return blockiert(grundOder(extrakt && extrakt.status === 'blocked' ? extrakt.reason : null, 'fact_incomplete'))
  }
  if (!herkunftPasst(fest, extrakt)) return blockiert('support_binding_mismatch')

  try {
    const execution = consumeOfficialTruthTrustedFactExecutionContext(extrakt, extractionInput)
    const gebaut = material(fest, extrakt, gebunden, zelle.scope, execution)
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
