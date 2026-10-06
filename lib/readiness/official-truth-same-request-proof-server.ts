// lib/readiness/official-truth-same-request-proof-server.ts
//
// Interner gleicher-Request-Beweis für einen späteren F8-Aufbau.
// Eine erfolgreiche Ausführung ist eine Autoritätslesung, eine Serveruhr
// und eine Kataloglesung. Registry, angenommene EvidenceVersions, der neu
// gebaute Regel-Kandidat, #723/#726 und die Provenienz bleiben nur
// in diesem Objekt, als eingefrorene Kopien. Seitenrohtext bleibt draussen:
// er ist eingereichtes Material, keine servereigene HTTP-Antwort.
// Der öffentliche F7-Zeuge projiziert neun Felder daraus.
//
// Das Objekt ist keine Annahme, kein trustedRuleFact, keine Bearer-Fähigkeit
// und keine API-Antwort. Eine Route darf es nicht zurückgeben. Ein vom
// Aufrufer geliefertes Objekt überspringt diese Lesung nicht.
// Der einzige Live-Einstieg ist loadOfficialTruthSameRequestProof().
// decideOfficialTruthSameRequestProof ist nur die Testnaht.

import 'server-only'

import { akzeptierteEvidenceLesen, type EvidenceVersion } from '@/lib/readiness/evidence'
import { checkedAtLesen, officialFrische } from '@/lib/readiness/official'
import {
  loadOfficialTruthFactEntryAuthority,
  type OfficialTruthFactEntryAuthorityResult,
} from '@/lib/readiness/official-truth-fact-entry-authority-server'
import { officialTruthRegelKandidatAusEvidence } from '@/lib/readiness/official-truth-rule-candidate'
import {
  officialTruthServerHeldSameRequestMaterial,
  type OfficialTruthServerHeldReviewReproofErgebnis,
  type OfficialTruthServerHeldSameRequestMaterialErgebnis,
  type OfficialTruthServerHeldSameRequestSupport,
} from '@/lib/readiness/official-truth-server-held-source-registry'
import type { OfficialTruthSourceCatalogAbhaengigkeiten } from '@/lib/readiness/official-truth-source-catalog-server'
import {
  regelScopeAusEvidenceScope,
  type RegelEvidenceQualitaet,
  type RegelFaktArt,
  type RegelKandidat,
} from '@/lib/readiness/rule-claims'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { historicalValuesEqual, ownRecord, provenanceCanonical } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { readHistoricalArtifact } from '@/lib/readiness/official-truth-autonomous-provenance-record'

const TIEFE_MAX = 16
const ANNEHMBAR = new Set(['explicit_primary_statement', 'composed_from_multiple_primary_sources'])
const AUTORITAET_SPERRE = new Set([
  'access_forbidden',
  'access_lookup_failed',
  'role_grant_required',
  'database_capability_denied',
  'database_capability_unavailable',
  'database_capability_failed',
])

/**
 * Felder, die der Aufrufer nicht als Autorität, Uhr, Frische, Schlüssel,
 * Zeuge, Evidence, Kandidat oder Vorschlag mitliefern darf. `sourceClass`
 * und `domains` stehen hier bewusst nicht: sie gehören zum bereits
 * geprüften Deskriptor und werden von der Server-Registry-Grenze
 * positionsgenau abgelehnt.
 */
const ZEUGEN_VERBOTEN = new Set([
  'identitySchema', 'contentItemId', 'contentItemVersion', 'representationId', 'representationVersion',
  'identityProfileId', 'identityProfileVersion', 'contentIdentity', 'identityProfiles',
  'role',
  'grant',
  'capability',
  'reviewer',
  'reviewerId',
  'reviewer_id',
  'user',
  'userId',
  'user_id',
  'accountId',
  'account_id',
  'email',
  'aal',
  'aal2',
  'currentAal',
  'authenticatorAssuranceLevel',
  'clock',
  'now',
  'maxAgeMs',
  'max_age_ms',
  'freshness',
  'freshnessResult',
  'reviewPacketKey',
  'supportVersionIds',
  'trustedRuleFact',
  'acceptedClaim',
  'accepted_claim',
  'lifecycle',
  'validationState',
  'suggestion',
  'reviewSuggestion',
  'model',
  'modelAuthority',
  'decision',
  'witness',
  'evidence',
  'evidenceVersion',
  'evidenceVersions',
  'kandidat',
  'candidate',
  'policy',
  'policyId',
  'policyVersion',
  'assignments',
])

type ReviewSperre = Extract<OfficialTruthServerHeldReviewReproofErgebnis, { status: 'blocked' }>['reason']
type AutoritaetSperre = Exclude<OfficialTruthFactEntryAuthorityResult, { status: 'authorized' }>['status']
type MaterialErfolg = Extract<
  OfficialTruthServerHeldSameRequestMaterialErgebnis,
  { status: 'server_held_same_request_material' }
>

export type OfficialTruthSameRequestProofSperrgrund =
  | ReviewSperre
  | AutoritaetSperre
  | 'authority_required'
  | 'invalid_reference_time'
  | 'freshness_not_current'
  | 'quality_not_acceptable'

/**
 * `same_request_proof` ist der interne Graph dieses Requests.
 * Er trägt die Registry und die angenommenen EvidenceVersions nur,
 * damit ein späterer Serveraufruf in derselben Ausführung sie lesen kann.
 * Der Vorschlag am Kandidaten bleibt untrusted Prüfstoff.
 * Die Stützen tragen Provenienz, nicht den eingereichten Seitenrohtext.
 */
export type OfficialTruthSameRequestProofErgebnis =
  | {
      readonly status: 'same_request_proof'
      readonly registry: QuellenRegistry
      readonly evidenceVersions: readonly EvidenceVersion[]
      readonly kandidat: RegelKandidat
      readonly reviewPacketKey: string
      readonly ruleScopeKey: string
      readonly factKind: RegelFaktArt
      readonly evidenceQuality: RegelEvidenceQualitaet
      readonly supportVersionIds: readonly string[]
      readonly supports: readonly OfficialTruthServerHeldSameRequestSupport[]
      readonly serverReferenceTime: string
      readonly freshness: 'current'
      readonly grant: 'role'
      readonly capability: 'official-truth-freigeben'
    }
  | {
      readonly status: 'blocked'
      readonly reason: OfficialTruthSameRequestProofSperrgrund
    }

/**
 * Deterministische Naht. `catalog` und `now` sind Testeinspritzungen.
 * Das ist nicht der Live-Einstieg. Ein Graph-Objekt ist kein Argument.
 */
export type OfficialTruthSameRequestProofAbhaengigkeiten = {
  readonly loadAuthority: () => Promise<OfficialTruthFactEntryAuthorityResult>
  readonly now: () => string
  readonly catalog?: OfficialTruthSourceCatalogAbhaengigkeiten
}

function blockiert(reason: OfficialTruthSameRequestProofSperrgrund): OfficialTruthSameRequestProofErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function zeugenKnoten(wert: unknown, tiefe: number, gesehen: WeakSet<object>): 'clean' | 'forbidden' | 'unexpected' {
  if (tiefe > TIEFE_MAX) return 'unexpected'
  if (wert === null || (typeof wert !== 'object' && typeof wert !== 'function')) return 'clean'
  if (gesehen.has(wert)) return 'clean'
  gesehen.add(wert)
  if (Array.isArray(wert)) {
    for (const eintrag of wert) {
      const art = zeugenKnoten(eintrag, tiefe + 1, gesehen)
      if (art !== 'clean') return art
    }
    return 'clean'
  }
  if (typeof wert === 'function') {
    for (const name of Object.keys(wert)) {
      if (ZEUGEN_VERBOTEN.has(name)) return 'forbidden'
      const art = zeugenKnoten((wert as unknown as Record<string, unknown>)[name], tiefe + 1, gesehen)
      if (art !== 'clean') return art
    }
    return 'clean'
  }
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return 'unexpected'
  for (const name of Object.keys(wert)) {
    if (ZEUGEN_VERBOTEN.has(name)) return 'forbidden'
    const art = zeugenKnoten((wert as Record<string, unknown>)[name], tiefe + 1, gesehen)
    if (art !== 'clean') return art
  }
  return 'clean'
}

function zeugenEingabe(
  eingabe: unknown,
): { ok: true } | { ok: false; reason: 'caller_authority_forbidden' | 'unexpected_fields' } {
  const art = zeugenKnoten(eingabe, 0, new WeakSet())
  if (art === 'forbidden') return { ok: false, reason: 'caller_authority_forbidden' }
  if (art === 'unexpected') return { ok: false, reason: 'unexpected_fields' }
  return { ok: true }
}

function istFreigegeben(wert: OfficialTruthFactEntryAuthorityResult): boolean {
  if (!wert || typeof wert !== 'object') return false
  const schluessel = Object.keys(wert)
  return (
    schluessel.length === 3 &&
    wert.status === 'authorized' &&
    wert.grant === 'role' &&
    wert.capability === 'official-truth-freigeben'
  )
}

function autoritaetSperre(wert: OfficialTruthFactEntryAuthorityResult): OfficialTruthSameRequestProofErgebnis {
  const status = wert && typeof wert === 'object' && typeof wert.status === 'string' ? wert.status : ''
  if (AUTORITAET_SPERRE.has(status)) return blockiert(status as AutoritaetSperre)
  return blockiert('authority_required')
}

function referenzLesen(wert: unknown): string | null {
  if (typeof wert !== 'string' || checkedAtLesen(wert) !== wert) return null
  return wert
}

function annehbar(qualitaet: string): boolean {
  return ANNEHMBAR.has(qualitaet)
}

/**
 * Bestehende Decke. Kein Aufrufer-`maxAgeMs`. Eine bereits neu belegte
 * amtliche Quelle gilt nur hier als vorhanden, damit die Zeitprüfung
 * läuft. Das wählt keinen Provider.
 */
function aktuell(support: OfficialTruthServerHeldSameRequestSupport, jetzt: string): boolean {
  if (!support.sourceContentHash || !support.retrievedAt) return false
  return (
    officialFrische({
      storedFingerprint: support.sourceContentHash,
      currentFingerprint: support.sourceContentHash,
      checkedAt: support.retrievedAt,
      validFrom: support.validFrom,
      validUntil: support.validUntil,
      now: jetzt,
      hasProvider: true,
      sourceAvailable: true,
    }) === 'current'
  )
}

function metaAus(eingabe: unknown): unknown {
  if (!eingabe || typeof eingabe !== 'object' || Array.isArray(eingabe)) return null
  return (eingabe as Record<string, unknown>).metadata
}

function gleicheIds(links: readonly string[], rechts: readonly string[]): boolean {
  return links.length === rechts.length && links.every((id, index) => id === rechts[index])
}

function evidencePasst(material: MaterialErfolg): OfficialTruthSameRequestProofSperrgrund | null {
  for (const version of material.evidenceVersions) {
    const gelesen = akzeptierteEvidenceLesen(version, material.registry)
    if (!gelesen) return 'evidence_not_accepted'
    const zelle = regelScopeAusEvidenceScope(gelesen.scope)
    if (!zelle.ok) return zelle.reason
    if (zelle.key !== material.ruleScopeKey) return 'scope_mismatch'
  }
  return null
}

function kandidatPasst(
  material: MaterialErfolg,
  metadata: unknown,
): { ok: true; kandidat: RegelKandidat } | { ok: false; reason: OfficialTruthSameRequestProofSperrgrund } {
  const erneut = officialTruthRegelKandidatAusEvidence(material.evidenceVersions, material.registry, metadata)
  if (!erneut.ok) return erneut
  const kandidat = erneut.kandidat
  if (kandidat.lifecycle !== 'candidate' || kandidat.validationState !== 'pending') {
    return { ok: false, reason: 'invalid_fact' }
  }
  if (kandidat.key !== material.kandidat.key || kandidat.key !== material.ruleScopeKey) {
    return { ok: false, reason: 'scope_mismatch' }
  }
  if (
    kandidat.factKind !== material.factKind ||
    kandidat.evidenceQuality !== material.evidenceQuality ||
    kandidat.factKind !== material.kandidat.factKind ||
    kandidat.evidenceQuality !== material.kandidat.evidenceQuality
  ) {
    return { ok: false, reason: 'invalid_evidence_quality' }
  }
  if (
    !gleicheIds(kandidat.supportVersionIds, material.supportVersionIds) ||
    !gleicheIds(material.kandidat.supportVersionIds, material.supportVersionIds)
  ) {
    return { ok: false, reason: 'support_mismatch' }
  }
  return { ok: true, kandidat }
}

function serverUhr(): string {
  return new Date().toISOString()
}

/** Eigene Kopie. Danach ist auch jede verschachtelte Struktur eingefroren. */
function beweisKopie<T>(wert: T): T {
  return tiefEinfrieren(structuredClone(wert))
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

/**
 * Testnaht mit austauschbarer Autorität, Uhr und Katalogtransport.
 * Eine künftige Route darf sie nicht als Autorität aufrufen.
 * Der Aufrufer liefert keinen Graphen, keine Registry und keine Evidence.
 */
export async function decideOfficialTruthSameRequestProof(
  eingabe: unknown,
  abhaengigkeiten: OfficialTruthSameRequestProofAbhaengigkeiten,
): Promise<OfficialTruthSameRequestProofErgebnis> {
  const form = zeugenEingabe(eingabe)
  if (!form.ok) return blockiert(form.reason)

  let autoritaet: OfficialTruthFactEntryAuthorityResult
  try {
    autoritaet = await abhaengigkeiten.loadAuthority()
  } catch {
    return blockiert('access_lookup_failed')
  }
  if (!istFreigegeben(autoritaet)) return autoritaetSperre(autoritaet)

  let rohZeit: unknown
  try {
    rohZeit = abhaengigkeiten.now()
  } catch {
    return blockiert('invalid_reference_time')
  }
  const zeit = referenzLesen(rohZeit)
  if (!zeit) return blockiert('invalid_reference_time')

  let material: OfficialTruthServerHeldSameRequestMaterialErgebnis
  try {
    material = await officialTruthServerHeldSameRequestMaterial(eingabe, abhaengigkeiten.catalog, () => new Date(zeit))
  } catch {
    return blockiert('catalog_failed')
  }
  if (material.status !== 'server_held_same_request_material') return blockiert(material.reason)
  if (!annehbar(material.evidenceQuality)) return blockiert('quality_not_acceptable')
  if (material.supports.length === 0 || material.supports.some((support) => !aktuell(support, zeit))) {
    return blockiert('freshness_not_current')
  }

  const evidenceGrund = evidencePasst(material)
  if (evidenceGrund) return blockiert(evidenceGrund)
  const kandidat = kandidatPasst(material, metaAus(eingabe))
  if (!kandidat.ok) return blockiert(kandidat.reason)

  return beweisKopie({
    status: 'same_request_proof',
    registry: material.registry,
    evidenceVersions: material.evidenceVersions,
    kandidat: kandidat.kandidat,
    reviewPacketKey: material.reviewPacketKey,
    ruleScopeKey: material.ruleScopeKey,
    factKind: material.factKind,
    evidenceQuality: material.evidenceQuality,
    supportVersionIds: [...material.supportVersionIds],
    supports: material.supports,
    serverReferenceTime: zeit,
    freshness: 'current',
    grant: 'role',
    capability: 'official-truth-freigeben',
  })
}

/**
 * Live-Einstieg. Keine Aufrufer-Uhr, kein Katalog-Override und keine
 * mitgelieferte Autorität. Die Fähigkeit wird zuerst gelesen. Erst danach
 * darf der Katalogtransport laufen.
 */
export async function loadOfficialTruthSameRequestProof(
  eingabe: unknown,
): Promise<OfficialTruthSameRequestProofErgebnis> {
  return decideOfficialTruthSameRequestProof(eingabe, {
    loadAuthority: loadOfficialTruthFactEntryAuthority,
    now: serverUhr,
  })
}

/** Pure internal proof invariants over independently selected, custodied material.
 * This returns comparison material, never origin membership or authorization.
 * The dormant production root cannot be entered through this value seam.
 * No old research envelope, raw response, model proposal or acceptance replay.
 */
export function proveOfficialTruthCustodiedMaterial(input: {
  authority: OfficialTruthFactEntryAuthorityResult
  registry: QuellenRegistry
  evidenceVersions: readonly EvidenceVersion[]
  review: unknown
  scope: unknown
  serverReferenceTime: string
}): OfficialTruthSameRequestProofErgebnis {
  if (!ownRecord(input, ['authority', 'registry', 'evidenceVersions', 'review', 'scope', 'serverReferenceTime'])
    || provenanceCanonical(input) === null || !Array.isArray(input.evidenceVersions)) return blockiert('unexpected_fields')
  if (!istFreigegeben(input.authority)) return blockiert('authority_required')
  const zeit = referenzLesen(input.serverReferenceTime)
  if (!zeit) return blockiert('invalid_reference_time')
  const review = readHistoricalArtifact('AutonomousReviewConstructionV1', input.review)
  const cell = regelScopeAusEvidenceScope(input.scope)
  if (!review.ok || !cell.ok) return blockiert('invalid_context')
  const safe = review.value.value.safePreimage
  if (!historicalValuesEqual(cell.scope, safe.candidate.scope) || cell.key !== safe.candidate.key) return blockiert('scope_mismatch')
  const candidate = officialTruthRegelKandidatAusEvidence(input.evidenceVersions, input.registry,
    { factKind: safe.candidate.factKind, evidenceQuality: safe.candidate.evidenceQuality, proposal: null })
  if (!candidate.ok) return blockiert(candidate.reason)
  if (!historicalValuesEqual(candidate.kandidat.scope, cell.scope)
    || !historicalValuesEqual(candidate.kandidat.supportVersionIds, safe.candidate.supportVersionIds)) return blockiert('support_mismatch')
  for (const version of input.evidenceVersions) {
    const scope = regelScopeAusEvidenceScope(version.scope)
    if (!akzeptierteEvidenceLesen(version, input.registry) || !scope.ok
      || !historicalValuesEqual(scope.scope, cell.scope) || scope.key !== cell.key) return blockiert('evidence_not_accepted')
    const compact = safe.supports.find(s => s.versionId === version.versionId)
    if (!compact || Object.entries(compact).some(([key, value]) => !historicalValuesEqual(value, version[key as keyof EvidenceVersion]))) return blockiert('support_mismatch')
  }
  if (input.evidenceVersions.length !== safe.supports.length || safe.supports.some(s => !aktuell(s, zeit)
    || Date.parse(s.retrievedAt) > Date.parse(zeit))) return blockiert('freshness_not_current')
  return beweisKopie({ status: 'same_request_proof', registry: input.registry,
    evidenceVersions: input.evidenceVersions, kandidat: candidate.kandidat,
    reviewPacketKey: review.value.value.reviewPacketKey, ruleScopeKey: cell.key,
    factKind: safe.candidate.factKind, evidenceQuality: safe.candidate.evidenceQuality,
    supportVersionIds: safe.candidate.supportVersionIds, supports: safe.supports,
    serverReferenceTime: zeit, freshness: 'current', grant: 'role', capability: 'official-truth-freigeben' })
}
