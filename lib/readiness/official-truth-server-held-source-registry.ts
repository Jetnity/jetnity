// lib/readiness/official-truth-server-held-source-registry.ts
//
// Servergrenze für den späteren Live- und autonomen Official-Truth-Pfad.
// Eine Aufrufer-Registry, eine Aufrufer-Klasse oder eine Aufrufer-Domain
// begründet hier keine amtliche Autorität. Die Registry kommt nur aus
// quellenKatalogLesen. Die bestehenden reinen Prüfungen bleiben der
// deterministische Kern und sind nicht dieser Einstieg.
//
// Kein zweites Registry-Modell, keine Registrierung, kein Provider,
// kein Modell und kein Netz ausser dem einen Katalogtransport.

import 'server-only'

import {
  officialTruthAkzeptierteEvidenceAusAbruf,
  type OfficialTruthAkzeptierteEvidenceErgebnis,
  type OfficialTruthAkzeptierteEvidenceSperrgrund,
} from '@/lib/readiness/official-truth-accepted-evidence'
import {
  quellenKatalogLesen,
  type OfficialTruthSourceCatalogAbhaengigkeiten,
} from '@/lib/readiness/official-truth-source-catalog-server'
import { officialTruthRegelKandidatAusEvidence } from '@/lib/readiness/official-truth-rule-candidate'
import {
  officialTruthAbgerufenMaterialPruefen,
  type OfficialTruthAbrufErgebnis,
  type OfficialTruthAbrufSperrgrund,
} from '@/lib/readiness/official-truth-retrieved-material'
import {
  officialTruthRegelReviewPacketFingerprint,
} from '@/lib/readiness/official-truth-rule-review-fingerprint'
import {
  officialTruthRegelReviewPacket,
  type OfficialTruthRegelReviewPacketErgebnis,
  type OfficialTruthRegelReviewPacketSperrgrund,
} from '@/lib/readiness/official-truth-rule-review-packet'
import {
  REGEL_SUPPORT_MAX,
  type RegelClaimFehler,
  type RegelEvidenceQualitaet,
  type RegelFaktArt,
  type RegelKandidatErgebnis,
} from '@/lib/readiness/rule-claims'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'

/**
 * Verbindlicher Einstieg für jeden späteren Live- oder autonomen
 * Official-Truth-Pfad. Die reinen Funktionen dürfen in Tests eine
 * Registry sehen. Ein Live- oder Autonomiepfad darf sie nicht als
 * Autorität aufrufen.
 */
export const OFFICIAL_TRUTH_LIVE_AUTONOMOUS_ENTRY = 'server_held_source_registry' as const

const AUTORITAET = ['registry', 'sourceClass', 'domains', 'blockedDomains'] as const
const ABRUF_FELDER = ['request', 'descriptors', 'sourceId', 'material'] as const
const REVIEW_FELDER = ['supports', 'metadata'] as const
const BUENDEL_FELDER = ['umschlag', 'uhr', 'extraktion'] as const

export type OfficialTruthServerHeldGrenze =
  | 'caller_authority_forbidden'
  | 'catalog_not_configured'
  | 'catalog_failed'

export type OfficialTruthServerHeldAbrufErgebnis =
  | Extract<OfficialTruthAbrufErgebnis, { status: 'retrieved_material' }>
  | { readonly status: 'blocked'; readonly reason: OfficialTruthAbrufSperrgrund | OfficialTruthServerHeldGrenze }

export type OfficialTruthServerHeldEvidenceErgebnis =
  | Extract<OfficialTruthAkzeptierteEvidenceErgebnis, { status: 'accepted_evidence' }>
  | {
      readonly status: 'blocked'
      readonly reason: OfficialTruthAkzeptierteEvidenceSperrgrund | OfficialTruthServerHeldGrenze
    }

export type OfficialTruthServerHeldReviewErgebnis =
  | Extract<OfficialTruthRegelReviewPacketErgebnis, { status: 'rule_review_packet' }>
  | {
      readonly status: 'blocked'
      readonly reason: OfficialTruthRegelReviewPacketSperrgrund | OfficialTruthServerHeldGrenze
    }

/**
 * Enge Provenienz für den Frischevergleich. Kein Schnappschuss, kein
 * Vorschlag, keine Registry und kein angenommener Claim.
 */
export type OfficialTruthServerHeldReviewReproofSupport = {
  readonly versionId: string
  readonly retrievedAt: string
  readonly sourceContentHash: string
  readonly validFrom: string | null
  readonly validUntil: string | null
}

/**
 * Eine Kataloglesung, dann #723 und #726 v2 auf derselben rekonstruierten
 * Eingabe. Der Rückgabewert enthält keine Registry.
 */
export type OfficialTruthServerHeldReviewReproofErgebnis =
  | {
      readonly status: 'server_held_review_reproof'
      readonly reviewPacketKey: string
      readonly ruleScopeKey: string
      readonly factKind: RegelFaktArt
      readonly evidenceQuality: RegelEvidenceQualitaet
      readonly supportVersionIds: readonly string[]
      readonly supports: readonly OfficialTruthServerHeldReviewReproofSupport[]
    }
  | Extract<OfficialTruthServerHeldReviewErgebnis, { status: 'blocked' }>

export type OfficialTruthServerHeldRegelErgebnis =
  | Extract<RegelKandidatErgebnis, { ok: true }>
  | { ok: false; reason: RegelClaimFehler | OfficialTruthServerHeldGrenze }

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return null
  return wert as Record<string, unknown>
}

function genaueSchluessel(satz: object, erlaubt: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === erlaubt.length && erlaubt.every((name) => Object.hasOwn(satz, name))
}

function hatAutoritaet(satz: Record<string, unknown> | null): boolean {
  if (!satz) return false
  return AUTORITAET.some((name) => Object.hasOwn(satz, name))
}

function deskriptorAutoritaet(wert: unknown): boolean {
  if (Array.isArray(wert)) return wert.some((eintrag) => hatAutoritaet(datensatz(eintrag)))
  return hatAutoritaet(datensatz(wert))
}

function abrufAutoritaet(satz: Record<string, unknown>): boolean {
  return (
    hatAutoritaet(satz) ||
    hatAutoritaet(datensatz(satz.request)) ||
    hatAutoritaet(datensatz(satz.material)) ||
    deskriptorAutoritaet(satz.descriptors)
  )
}

function blockiert<R extends string>(reason: R): { readonly status: 'blocked'; readonly reason: R } {
  return Object.freeze({ status: 'blocked', reason })
}

async function registryLaden(
  abhaengigkeiten: OfficialTruthSourceCatalogAbhaengigkeiten | undefined,
): Promise<
  | { ok: true; registry: QuellenRegistry }
  | { ok: false; reason: 'caller_authority_forbidden' | 'catalog_not_configured' | 'catalog_failed' }
> {
  if (hatAutoritaet(datensatz(abhaengigkeiten))) return { ok: false, reason: 'caller_authority_forbidden' }
  const gelesen = await quellenKatalogLesen(abhaengigkeiten)
  if (!gelesen.ok) {
    return {
      ok: false,
      reason: gelesen.reason === 'catalog_not_configured' ? 'catalog_not_configured' : 'catalog_failed',
    }
  }
  return { ok: true, registry: gelesen.registry }
}

function umschlagMitRegistry(satz: Record<string, unknown>, registry: QuellenRegistry): Record<string, unknown> {
  return {
    request: satz.request,
    descriptors: satz.descriptors,
    sourceId: satz.sourceId,
    material: satz.material,
    registry,
  }
}

function abrufLesen(
  umschlag: unknown,
): { ok: true; satz: Record<string, unknown> } | { ok: false; reason: 'caller_authority_forbidden' | 'invalid_envelope' } {
  const satz = datensatz(umschlag)
  if (!satz) return { ok: false, reason: 'invalid_envelope' }
  if (abrufAutoritaet(satz)) return { ok: false, reason: 'caller_authority_forbidden' }
  if (!genaueSchluessel(satz, ABRUF_FELDER)) return { ok: false, reason: 'invalid_envelope' }
  return { ok: true, satz }
}

/**
 * Belegt abgerufenes Material nur gegen die servergehaltene Registry.
 * Der Aufrufer liefert Anfrage, Deskriptoren, Quelle und Material.
 * `registry`, `sourceClass`, `domains` und `blockedDomains` sind keine
 * autoritativen Felder dieses Einstiegs.
 */
export async function officialTruthServerHeldMaterialPruefen(
  umschlag: unknown,
  uhr: unknown,
  abhaengigkeiten?: OfficialTruthSourceCatalogAbhaengigkeiten,
): Promise<OfficialTruthServerHeldAbrufErgebnis> {
  const gelesen = abrufLesen(umschlag)
  if (!gelesen.ok) return blockiert(gelesen.reason)
  const katalog = await registryLaden(abhaengigkeiten)
  if (!katalog.ok) return blockiert(katalog.reason)
  return officialTruthAbgerufenMaterialPruefen(umschlagMitRegistry(gelesen.satz, katalog.registry), uhr)
}

/**
 * Nimmt Evidence nur aus dem neu belegten Abruf an.
 * Die Registry dafür ist dieselbe servergehaltene Registry, nicht ein
 * Feld des Aufrufers.
 */
export async function officialTruthServerHeldEvidenceAnnehmen(
  umschlag: unknown,
  uhr: unknown,
  extraktion: unknown,
  abhaengigkeiten?: OfficialTruthSourceCatalogAbhaengigkeiten,
): Promise<OfficialTruthServerHeldEvidenceErgebnis> {
  const gelesen = abrufLesen(umschlag)
  if (!gelesen.ok) return blockiert(gelesen.reason)
  if (hatAutoritaet(datensatz(extraktion))) return blockiert('caller_authority_forbidden')
  const katalog = await registryLaden(abhaengigkeiten)
  if (!katalog.ok) return blockiert(katalog.reason)
  return officialTruthAkzeptierteEvidenceAusAbruf(
    umschlagMitRegistry(gelesen.satz, katalog.registry),
    uhr,
    extraktion,
  )
}

type ReviewBereit =
  | { ok: true; metadata: unknown; supports: Record<string, unknown>[] }
  | {
      ok: false
      reason:
        | OfficialTruthServerHeldGrenze
        | 'unexpected_fields'
        | 'invalid_envelope'
        | 'invalid_support'
        | 'support_bound_exceeded'
    }

function reviewLesen(eingabe: unknown): ReviewBereit {
  const satz = datensatz(eingabe)
  if (!satz) return { ok: false, reason: 'unexpected_fields' }
  if (hatAutoritaet(satz) || hatAutoritaet(datensatz(satz.metadata))) {
    return { ok: false, reason: 'caller_authority_forbidden' }
  }
  if (!genaueSchluessel(satz, REVIEW_FELDER)) return { ok: false, reason: 'unexpected_fields' }
  if (!Array.isArray(satz.supports) || satz.supports.length === 0) return { ok: false, reason: 'invalid_support' }
  if (satz.supports.length > REGEL_SUPPORT_MAX) return { ok: false, reason: 'support_bound_exceeded' }

  const supports: Record<string, unknown>[] = []
  for (const eintrag of satz.supports) {
    const bund = datensatz(eintrag)
    if (!bund) return { ok: false, reason: 'unexpected_fields' }
    if (hatAutoritaet(bund) || hatAutoritaet(datensatz(bund.extraktion))) {
      return { ok: false, reason: 'caller_authority_forbidden' }
    }
    if (!genaueSchluessel(bund, BUENDEL_FELDER)) return { ok: false, reason: 'unexpected_fields' }
    const umschlag = datensatz(bund.umschlag)
    if (!umschlag) return { ok: false, reason: 'invalid_envelope' }
    if (abrufAutoritaet(umschlag)) return { ok: false, reason: 'caller_authority_forbidden' }
    if (!genaueSchluessel(umschlag, ABRUF_FELDER)) return { ok: false, reason: 'invalid_envelope' }
    supports.push(bund)
  }
  return { ok: true, metadata: satz.metadata, supports }
}

/**
 * Baut das Prüfpaket für den späteren Live-Pfad.
 * Eine Kataloglesung gilt für alle Stützen. Jede Stütze erhält intern
 * dieselbe servergehaltene Registry. Der Aufrufer hat kein Registry-Feld.
 */
export async function officialTruthServerHeldReviewPacket(
  eingabe: unknown,
  abhaengigkeiten?: OfficialTruthSourceCatalogAbhaengigkeiten,
): Promise<OfficialTruthServerHeldReviewErgebnis> {
  const gelesen = reviewLesen(eingabe)
  if (!gelesen.ok) return blockiert(gelesen.reason)
  const katalog = await registryLaden(abhaengigkeiten)
  if (!katalog.ok) return blockiert(katalog.reason)
  const supports = gelesen.supports.map((bund) => ({
    umschlag: umschlagMitRegistry(datensatz(bund.umschlag) as Record<string, unknown>, katalog.registry),
    uhr: bund.uhr,
    extraktion: bund.extraktion,
  }))
  return officialTruthRegelReviewPacket({ supports, metadata: gelesen.metadata })
}

function idVergleich(links: string, rechts: string): number {
  return links < rechts ? -1 : links > rechts ? 1 : 0
}

/** Dieselbe Menge, unabhängig von der Aufruferreihenfolge. Duplikate bleiben sichtbar. */
function gleicheIdMenge(links: readonly string[], rechts: readonly string[]): boolean {
  const a = [...links].sort(idVergleich)
  const b = [...rechts].sort(idVergleich)
  return a.length === b.length && a.every((id, index) => id === b[index])
}

function reproofStuetze(
  support: Extract<OfficialTruthRegelReviewPacketErgebnis, { status: 'rule_review_packet' }>['supports'][number],
): OfficialTruthServerHeldReviewReproofSupport {
  return Object.freeze({
    versionId: support.versionId,
    retrievedAt: support.retrievedAt,
    sourceContentHash: support.sourceContentHash,
    validFrom: support.validFrom,
    validUntil: support.validUntil,
  })
}

/**
 * Belegt Paket und v2-Fingerabdruck aus einer Kataloglesung.
 * Die servergehaltene Registry wird in jede Stütze eingesetzt. Beide
 * Prüfungen sehen danach dasselbe rekonstruierte Objekt. Zelle und
 * Stütz-IDs müssen übereinstimmen. Die Identität ist reihenfolgeunabhängig,
 * wie der v2-Fingerabdruck. Die Registry verlässt diese Funktion
 * nicht. Das ist kein Zeuge und keine Annahme.
 */
export async function officialTruthServerHeldReviewReproof(
  eingabe: unknown,
  abhaengigkeiten?: OfficialTruthSourceCatalogAbhaengigkeiten,
): Promise<OfficialTruthServerHeldReviewReproofErgebnis> {
  const gelesen = reviewLesen(eingabe)
  if (!gelesen.ok) return blockiert(gelesen.reason)
  const katalog = await registryLaden(abhaengigkeiten)
  if (!katalog.ok) return blockiert(katalog.reason)
  const rekonstruiert = {
    supports: gelesen.supports.map((bund) => ({
      umschlag: umschlagMitRegistry(datensatz(bund.umschlag) as Record<string, unknown>, katalog.registry),
      uhr: bund.uhr,
      extraktion: bund.extraktion,
    })),
    metadata: gelesen.metadata,
  }
  const paket = officialTruthRegelReviewPacket(rekonstruiert)
  if (paket.status !== 'rule_review_packet') return paket
  const finger = officialTruthRegelReviewPacketFingerprint(rekonstruiert)
  if (finger.status !== 'rule_review_packet_fingerprint') return blockiert(finger.reason)
  if (!finger.reviewPacketKey.startsWith('review-packet:v2:')) return blockiert('invalid_fact')
  if (finger.ruleScopeKey !== paket.kandidat.key) return blockiert('scope_mismatch')
  const stuetzIds = paket.supports.map((support) => support.versionId)
  if (
    !gleicheIdMenge(finger.supportVersionIds, paket.kandidat.supportVersionIds) ||
    !gleicheIdMenge(finger.supportVersionIds, stuetzIds)
  ) {
    return blockiert('support_mismatch')
  }
  const supports = [...paket.supports].sort((links, rechts) => idVergleich(links.versionId, rechts.versionId))
  return Object.freeze({
    status: 'server_held_review_reproof',
    reviewPacketKey: finger.reviewPacketKey,
    ruleScopeKey: finger.ruleScopeKey,
    factKind: paket.kandidat.factKind,
    evidenceQuality: paket.kandidat.evidenceQuality,
    supportVersionIds: Object.freeze([...finger.supportVersionIds].sort(idVergleich)),
    supports: Object.freeze(supports.map(reproofStuetze)),
  })
}

/**
 * Regel-Kandidat nur gegen die servergehaltene Registry.
 * Es gibt keinen Registry-Parameter. Ein mitgeliefertes Autoritätsfeld
 * in den Metadaten oder statt der Evidence-Liste wird abgelehnt.
 */
export async function officialTruthServerHeldRegelKandidat(
  evidenceVersions: unknown,
  metadata: unknown,
  abhaengigkeiten?: OfficialTruthSourceCatalogAbhaengigkeiten,
): Promise<OfficialTruthServerHeldRegelErgebnis> {
  if (!Array.isArray(evidenceVersions) && hatAutoritaet(datensatz(evidenceVersions))) {
    return { ok: false, reason: 'caller_authority_forbidden' }
  }
  if (hatAutoritaet(datensatz(metadata))) return { ok: false, reason: 'caller_authority_forbidden' }
  const katalog = await registryLaden(abhaengigkeiten)
  if (!katalog.ok) return { ok: false, reason: katalog.reason }
  return officialTruthRegelKandidatAusEvidence(evidenceVersions, katalog.registry, metadata)
}
