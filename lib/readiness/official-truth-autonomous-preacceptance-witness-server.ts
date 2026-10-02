// lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts
//
// Gleicher-Request-Vorbedingung für einen späteren autonomen Official-Truth-Pfad.
// Der einzige Live-Einstieg ist loadOfficialTruthAutonomousPreacceptanceWitness().
// Er nimmt nur das registry-freie Prüfpaket-Material an. Autorität kommt nur aus
// loadOfficialTruthFactEntryAuthority(). Paket und v2-Fingerabdruck kommen nur
// aus officialTruthServerHeldReviewReproof(). Frische ist genau `current`
// nach der bestehenden officialFrische-Decke.
//
// Der Erfolg ist flüchtiger Beweis. Er ist keine Annahme, kein Wahrheitsfakt,
// keine Bearer-Fähigkeit und keine Official Truth. Ein späterer Request muss
// den Live-Einstieg neu ausführen. Diese Datei speichert nichts.
//
// decideOfficialTruthAutonomousPreacceptanceWitness ist nur die Testnaht.
// Eine Route, die sie statt des Laders aufruft, öffnet diese Vorbedingung wieder.

import 'server-only'

import { checkedAtLesen, officialFrische } from '@/lib/readiness/official'
import {
  loadOfficialTruthFactEntryAuthority,
  type OfficialTruthFactEntryAuthorityResult,
} from '@/lib/readiness/official-truth-fact-entry-authority-server'
import {
  officialTruthServerHeldReviewReproof,
  type OfficialTruthServerHeldReviewReproofErgebnis,
  type OfficialTruthServerHeldReviewReproofSupport,
} from '@/lib/readiness/official-truth-server-held-source-registry'
import type { OfficialTruthSourceCatalogAbhaengigkeiten } from '@/lib/readiness/official-truth-source-catalog-server'
import type { RegelFaktArt } from '@/lib/readiness/rule-claims'

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
 * Felder, die der Aufrufer nicht als Autorität, Uhr, Frische, Schlüssel
 * oder Vorschlag mitliefern darf. `sourceClass` und `domains` stehen hier
 * bewusst nicht: sie gehören zum bereits geprüften Deskriptor und werden
 * von der Server-Registry-Grenze positionsgenau abgelehnt.
 */
const ZEUGEN_VERBOTEN = new Set([
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
])

type ReviewSperre = Extract<OfficialTruthServerHeldReviewReproofErgebnis, { status: 'blocked' }>['reason']
type AutoritaetSperre = Exclude<OfficialTruthFactEntryAuthorityResult, { status: 'authorized' }>['status']

export type OfficialTruthAutonomousPreacceptanceWitnessSperrgrund =
  | ReviewSperre
  | AutoritaetSperre
  | 'authority_required'
  | 'invalid_reference_time'
  | 'freshness_not_current'
  | 'quality_not_acceptable'

/**
 * `authorized_preacceptance_witness` ist Beweis für diesen Request.
 * Der Schlüssel vergibt nichts. Die Freigabe ist nur das Echo der
 * bereits geprüften Rollenfähigkeit.
 */
export type OfficialTruthAutonomousPreacceptanceWitnessErgebnis =
  | {
      readonly status: 'authorized_preacceptance_witness'
      readonly reviewPacketKey: string
      readonly ruleScopeKey: string
      readonly factKind: RegelFaktArt
      readonly supportVersionIds: readonly string[]
      readonly serverReferenceTime: string
      readonly freshness: 'current'
      readonly grant: 'role'
      readonly capability: 'official-truth-freigeben'
    }
  | {
      readonly status: 'blocked'
      readonly reason: OfficialTruthAutonomousPreacceptanceWitnessSperrgrund
    }

/**
 * Deterministische Naht. `catalog` und `now` sind Testeinspritzungen.
 * Das ist nicht der Live-Einstieg.
 */
export type OfficialTruthAutonomousPreacceptanceWitnessAbhaengigkeiten = {
  readonly loadAuthority: () => Promise<OfficialTruthFactEntryAuthorityResult>
  readonly now: () => string
  readonly catalog?: OfficialTruthSourceCatalogAbhaengigkeiten
}

function blockiert(
  reason: OfficialTruthAutonomousPreacceptanceWitnessSperrgrund,
): OfficialTruthAutonomousPreacceptanceWitnessErgebnis {
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

function autoritaetSperre(wert: OfficialTruthFactEntryAuthorityResult): OfficialTruthAutonomousPreacceptanceWitnessErgebnis {
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
function aktuell(support: OfficialTruthServerHeldReviewReproofSupport, jetzt: string): boolean {
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

function serverUhr(): string {
  return new Date().toISOString()
}

/**
 * Testnaht mit austauschbarer Autorität, Uhr und Katalogtransport.
 * Eine künftige Route darf sie nicht als Autorität aufrufen.
 */
export async function decideOfficialTruthAutonomousPreacceptanceWitness(
  eingabe: unknown,
  abhaengigkeiten: OfficialTruthAutonomousPreacceptanceWitnessAbhaengigkeiten,
): Promise<OfficialTruthAutonomousPreacceptanceWitnessErgebnis> {
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

  let reproof: OfficialTruthServerHeldReviewReproofErgebnis
  try {
    reproof = await officialTruthServerHeldReviewReproof(eingabe, abhaengigkeiten.catalog)
  } catch {
    return blockiert('catalog_failed')
  }
  if (reproof.status !== 'server_held_review_reproof') return blockiert(reproof.reason)
  if (!annehbar(reproof.evidenceQuality)) return blockiert('quality_not_acceptable')
  if (reproof.supports.length === 0 || reproof.supports.some((support) => !aktuell(support, zeit))) {
    return blockiert('freshness_not_current')
  }

  return Object.freeze({
    status: 'authorized_preacceptance_witness',
    reviewPacketKey: reproof.reviewPacketKey,
    ruleScopeKey: reproof.ruleScopeKey,
    factKind: reproof.factKind,
    supportVersionIds: Object.freeze([...reproof.supportVersionIds]),
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
export async function loadOfficialTruthAutonomousPreacceptanceWitness(
  eingabe: unknown,
): Promise<OfficialTruthAutonomousPreacceptanceWitnessErgebnis> {
  return decideOfficialTruthAutonomousPreacceptanceWitness(eingabe, {
    loadAuthority: loadOfficialTruthFactEntryAuthority,
    now: serverUhr,
  })
}
