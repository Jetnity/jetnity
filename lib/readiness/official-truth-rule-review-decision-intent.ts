// lib/readiness/official-truth-rule-review-decision-intent.ts
//
// Reine Entscheidungsabsicht zu genau einem neu belegten Regel-Prüfpaket.
// Der Aufrufer liefert die ursprüngliche Paket-Eingabe, den Schlüssel und
// eine der drei Absichten. Paket und Identität werden in diesem Aufruf neu
// erzeugt. Das Ergebnis gilt nur für diesen Aufruf. Es ist kein Beleg, dass
// ein Server die Absicht gespeichert oder genehmigt hat, und es ist keine
// spätere Berechtigung.

import {
  officialTruthRegelReviewPacket,
  type OfficialTruthRegelReviewPacketErgebnis,
  type OfficialTruthRegelReviewPacketSperrgrund,
} from '@/lib/readiness/official-truth-rule-review-packet'
import { officialTruthRegelReviewPacketFingerprint } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import type { RegelFaktArt } from '@/lib/readiness/rule-claims'

const TIEFE_MAX = 16
const EINGABE_FELDER = ['packetInput', 'reviewPacketKey', 'decision'] as const

const ENTSCHEIDUNGEN = ['needs_more_evidence', 'reject_candidate', 'proceed_to_trusted_fact_entry'] as const

const ANNEHMBARE_QUALITAET = ['explicit_primary_statement', 'composed_from_multiple_primary_sources'] as const

/**
 * Dieselbe Kennungsmenge wie im Prüfpaket. Jene Menge ist modulprivat.
 * Diese Datei ändert das Prüfpaket nicht.
 */
const PERSONEN_SCHLUESSEL = [
  'userId',
  'user_id',
  'accountId',
  'account_id',
  'tripId',
  'trip_id',
  'travellerId',
  'travellerClientRef',
  'traveller_client_ref',
  'passportNumber',
  'passport_number',
  'documentNumber',
  'document_number',
  'mrz',
  'biometric',
  'biometrics',
  'dateOfBirth',
  'dob',
  'birthDate',
  'birth_date',
  'healthRecord',
  'health',
  'diagnosis',
  'email',
  'fullName',
  'givenName',
  'familyName',
  'phone',
  'scan',
  'documentScan',
  'travellerNote',
  'traveller_note',
  'note',
  'comment',
  'freeText',
  'freeform',
] as const

const PERSONEN_MENGE = new Set<string>(PERSONEN_SCHLUESSEL)
const ENTSCHEIDUNG_MENGE = new Set<string>(ENTSCHEIDUNGEN)

export type OfficialTruthRegelReviewEntscheidung = (typeof ENTSCHEIDUNGEN)[number]

export type OfficialTruthRegelReviewEntscheidungsSperrgrund =
  | OfficialTruthRegelReviewPacketSperrgrund
  | 'invalid_decision'
  | 'packet_fingerprint_mismatch'
  | 'review_packet_key_mismatch'

type RegelReviewPacket = Extract<OfficialTruthRegelReviewPacketErgebnis, { status: 'rule_review_packet' }>
type AnnehmbareQualitaet = (typeof ANNEHMBARE_QUALITAET)[number]
type Gesichtet = 'clean' | 'personal' | 'too_deep'
type Form = 'exact' | 'missing_key' | 'bad_shape'

/**
 * `rule_review_decision_intent` ist nur die Absicht dieses Aufrufs.
 * `proceed_to_trusted_fact_entry` bittet um den späteren Fakteintritt.
 * Es trägt keinen Wahrheitsfakt und keine angenommene Regel.
 */
export type OfficialTruthRegelReviewEntscheidungsErgebnis =
  | {
      readonly status: 'rule_review_decision_intent'
      readonly reviewPacketKey: string
      readonly ruleScopeKey: string
      readonly factKind: RegelFaktArt
      readonly decision: OfficialTruthRegelReviewEntscheidung
    }
  | { readonly status: 'blocked'; readonly reason: OfficialTruthRegelReviewEntscheidungsSperrgrund }

function sperre(reason: OfficialTruthRegelReviewEntscheidungsSperrgrund): OfficialTruthRegelReviewEntscheidungsErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return null
  return wert as Record<string, unknown>
}

function gleicheIds(links: readonly string[], rechts: readonly string[]): boolean {
  return links.length === rechts.length && links.every((id, index) => id === rechts[index])
}

function personenkennung(wert: unknown, tiefe: number, gesehen: WeakSet<object>): Gesichtet {
  if (tiefe > TIEFE_MAX) return 'too_deep'
  if (!wert || typeof wert !== 'object') return 'clean'
  if (gesehen.has(wert)) return 'clean'
  gesehen.add(wert)
  const kinder = Array.isArray(wert) ? wert : Object.entries(wert)
  for (const eintrag of kinder) {
    if (Array.isArray(wert)) {
      const fund = personenkennung(eintrag, tiefe + 1, gesehen)
      if (fund !== 'clean') return fund
      continue
    }
    const [schluessel, kind] = eintrag as [string, unknown]
    if (PERSONEN_MENGE.has(schluessel)) return 'personal'
    const fund = personenkennung(kind, tiefe + 1, gesehen)
    if (fund !== 'clean') return fund
  }
  return 'clean'
}

function form(satz: object): Form {
  const namen = Object.keys(satz)
  if (namen.length === EINGABE_FELDER.length && EINGABE_FELDER.every((name) => Object.hasOwn(satz, name))) return 'exact'
  if (
    namen.length === 2 &&
    Object.hasOwn(satz, 'packetInput') &&
    Object.hasOwn(satz, 'decision') &&
    !Object.hasOwn(satz, 'reviewPacketKey')
  ) {
    return 'missing_key'
  }
  return 'bad_shape'
}

function entscheidung(wert: unknown): OfficialTruthRegelReviewEntscheidung | null {
  return typeof wert === 'string' && ENTSCHEIDUNG_MENGE.has(wert) ? (wert as OfficialTruthRegelReviewEntscheidung) : null
}

function annehmbar(wert: string): wert is AnnehmbareQualitaet {
  return (ANNEHMBARE_QUALITAET as readonly string[]).includes(wert)
}

/**
 * `proceed_to_trusted_fact_entry` bleibt eine Absicht.
 * Nicht annehmbare Qualität und eine Zusammensetzung aus einer Quelle
 * öffnen diesen Schritt nicht. Die spätere Annahme prüft denselben
 * Stoff noch einmal und wird hier nicht aufgerufen.
 */
function faktenEintrittSperre(paket: RegelReviewPacket): OfficialTruthRegelReviewPacketSperrgrund | null {
  const qualitaet = paket.kandidat.evidenceQuality
  if (!annehmbar(qualitaet)) return 'quality_not_acceptable'
  if (qualitaet === 'explicit_primary_statement') {
    return paket.supports.length < 1 ? 'insufficient_support' : null
  }
  if (paket.supports.length < 2) return 'insufficient_support'
  const quellen = new Set<string>()
  for (const eintrag of paket.supports) {
    if (eintrag.sourceId.length === 0) return 'same_source_composition'
    quellen.add(eintrag.sourceId)
  }
  return quellen.size < 2 ? 'same_source_composition' : null
}

/**
 * Prüft eine Entscheidungsabsicht gegen ein neu belegtes Prüfpaket.
 * `packetInput` ist die ursprüngliche Eingabe von #723. `reviewPacketKey`
 * muss der in diesem Aufruf neu berechnete #726-Schlüssel sein.
 * `decision` ist genau einer der drei Zustände, ohne Alias und ohne Zuschnitt.
 */
export function officialTruthRegelReviewEntscheidungsabsicht(
  eingabe: unknown,
): OfficialTruthRegelReviewEntscheidungsErgebnis {
  const satz = datensatz(eingabe)
  if (!satz) return sperre('unexpected_fields')
  const gesehen = new WeakSet<object>()
  const personen = personenkennung(satz, 0, gesehen)
  if (personen === 'personal') return sperre('personal_identifier_forbidden')
  if (personen === 'too_deep') return sperre('unexpected_fields')

  const huelle = form(satz)
  if (huelle === 'bad_shape') return sperre('unexpected_fields')

  const paket = officialTruthRegelReviewPacket(satz.packetInput)
  const finger = officialTruthRegelReviewPacketFingerprint(satz.packetInput)
  if (paket.status !== 'rule_review_packet') return sperre(paket.reason)
  if (finger.status !== 'rule_review_packet_fingerprint') return sperre(finger.reason)

  const supportIds = paket.supports.map((eintrag) => eintrag.versionId)
  if (
    paket.kandidat.key !== finger.ruleScopeKey ||
    !gleicheIds(paket.kandidat.supportVersionIds, finger.supportVersionIds) ||
    !gleicheIds(supportIds, finger.supportVersionIds)
  ) {
    return sperre('packet_fingerprint_mismatch')
  }

  if (huelle === 'missing_key' || satz.reviewPacketKey !== finger.reviewPacketKey) {
    return sperre('review_packet_key_mismatch')
  }

  const decision = entscheidung(satz.decision)
  if (!decision) return sperre('invalid_decision')

  if (decision === 'proceed_to_trusted_fact_entry') {
    const sperrgrund = faktenEintrittSperre(paket)
    if (sperrgrund) return sperre(sperrgrund)
  }

  const factKind = paket.kandidat.factKind
  return Object.freeze({
    status: 'rule_review_decision_intent',
    reviewPacketKey: finger.reviewPacketKey,
    ruleScopeKey: finger.ruleScopeKey,
    factKind,
    decision,
  })
}
