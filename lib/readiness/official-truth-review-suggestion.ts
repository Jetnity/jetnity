// lib/readiness/official-truth-review-suggestion.ts
//
// Reine Prüfung eines Hinweisvorschlags zu genau einem Regel-Prüfpaket.
// Der Aufrufer liefert die ursprüngliche Paket-Eingabe und einen Vorschlag.
// Paket und Identität werden neu erzeugt. Ein mitgeliefertes Paket, eine
// mitgelieferte Identität oder eine mitgelieferte Stützliste ist kein Beleg.
// Der Vorschlag bleibt ein Hinweis. Er wird keine angenommene Regel.

import {
  officialTruthRegelReviewPacket,
  type OfficialTruthRegelReviewPacketSperrgrund,
} from '@/lib/readiness/official-truth-rule-review-packet'
import { officialTruthRegelReviewPacketFingerprint } from '@/lib/readiness/official-truth-rule-review-fingerprint'

const TIEFE_MAX = 16
const NOTIZ_MAX = 500
const EINGABE_FELDER = ['packetInput', 'suggestion'] as const
const VORSCHLAG_PFLICHT = ['assessment', 'citedSupportVersionIds', 'reasonCodes'] as const
const VORSCHLAG_OPTIONAL = ['reviewNote'] as const

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
const PERSONEN_IM_TEXT = new RegExp(`\\b(?:${PERSONEN_SCHLUESSEL.join('|')})\\b`, 'i')

const BEWERTUNGEN = [
  'supports_candidate',
  'contradicts_candidate',
  'insufficient_evidence',
  'needs_human_review',
] as const

const GRUENDE = [
  'support_text_matches_candidate',
  'support_text_conflicts_candidate',
  'support_scope_ambiguous',
  'support_stale_or_time_unclear',
  'support_sources_conflict',
  'support_insufficient_for_claim',
  'proposal_requires_human_judgment',
] as const

const BEWERTUNG_MENGE = new Set<string>(BEWERTUNGEN)
const GRUND_MENGE = new Set<string>(GRUENDE)

const GEHEIM_MUSTER = [
  /sk-[A-Za-z0-9]/,
  /-----BEGIN [A-Z0-9 ]+-----/,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  /(?:api[_-]?key|password|secret|token|credential)\s*[:=]/i,
  /\bbearer\s+[A-Za-z0-9._~+/-]{8,}/i,
] as const

export type OfficialTruthRegelReviewBewertung = (typeof BEWERTUNGEN)[number]
export type OfficialTruthRegelReviewGrund = (typeof GRUENDE)[number]

export type OfficialTruthRegelReviewVorschlagSperrgrund =
  | OfficialTruthRegelReviewPacketSperrgrund
  | 'invalid_assessment'
  | 'invalid_reason_code'
  | 'duplicate_reason_code'
  | 'duplicate_citation'
  | 'citation_not_in_packet'
  | 'invalid_review_note'
  | 'packet_fingerprint_mismatch'

/**
 * `review_suggestion` ist ein Hinweis zu einem neu belegten Prüfpaket.
 * `supports_candidate` sagt nicht, dass der Kandidat wahr ist.
 */
export type OfficialTruthRegelReviewVorschlagErgebnis =
  | {
      readonly status: 'review_suggestion'
      readonly reviewPacketKey: string
      readonly ruleScopeKey: string
      readonly assessment: OfficialTruthRegelReviewBewertung
      readonly citedSupportVersionIds: readonly string[]
      readonly reasonCodes: readonly OfficialTruthRegelReviewGrund[]
      readonly reviewNote: string | null
    }
  | { readonly status: 'blocked'; readonly reason: OfficialTruthRegelReviewVorschlagSperrgrund }

type Gesichtet = 'clean' | 'personal' | 'too_deep'

function sperre(reason: OfficialTruthRegelReviewVorschlagSperrgrund): OfficialTruthRegelReviewVorschlagErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return null
  return wert as Record<string, unknown>
}

function vergleich(links: string, rechts: string): number {
  return links < rechts ? -1 : links > rechts ? 1 : 0
}

function schluesselPassen(satz: object, pflicht: readonly string[], optional: readonly string[]): boolean {
  const namen = Object.keys(satz)
  const erlaubt = new Set<string>(pflicht)
  for (const name of optional) {
    if (Object.hasOwn(satz, name)) erlaubt.add(name)
  }
  return namen.length === erlaubt.size && namen.every((name) => erlaubt.has(name)) && pflicht.every((name) => Object.hasOwn(satz, name))
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

function bewertung(wert: unknown): OfficialTruthRegelReviewBewertung | null {
  return typeof wert === 'string' && BEWERTUNG_MENGE.has(wert) ? (wert as OfficialTruthRegelReviewBewertung) : null
}

function grund(wert: unknown): OfficialTruthRegelReviewGrund | null {
  return typeof wert === 'string' && GRUND_MENGE.has(wert) ? (wert as OfficialTruthRegelReviewGrund) : null
}

function eindeutigeTexte(
  liste: unknown,
  lesen: (wert: unknown) => string | null,
  ungueltig: OfficialTruthRegelReviewVorschlagSperrgrund,
  duplikat: OfficialTruthRegelReviewVorschlagSperrgrund,
): { ok: true; werte: string[] } | { ok: false; reason: OfficialTruthRegelReviewVorschlagSperrgrund } {
  if (!Array.isArray(liste)) return { ok: false, reason: ungueltig }
  const gesehen = new Set<string>()
  const werte: string[] = []
  for (const eintrag of liste) {
    const text = lesen(eintrag)
    if (text === null) return { ok: false, reason: ungueltig }
    if (gesehen.has(text)) return { ok: false, reason: duplikat }
    gesehen.add(text)
    werte.push(text)
  }
  return { ok: true, werte }
}

function notiz(wert: unknown): { ok: true; text: string | null } | { ok: false } {
  if (wert === null) return { ok: true, text: null }
  if (typeof wert !== 'string' || wert.length > NOTIZ_MAX) return { ok: false }
  const text = wert.trim()
  if (text.length === 0 || text.length > NOTIZ_MAX) return { ok: false }
  if (PERSONEN_IM_TEXT.test(text)) return { ok: false }
  if (GEHEIM_MUSTER.some((muster) => muster.test(text))) return { ok: false }
  return { ok: true, text }
}

function gleicheIds(links: readonly string[], rechts: readonly string[]): boolean {
  return links.length === rechts.length && links.every((id, index) => id === rechts[index])
}

/**
 * Prüft einen Hinweisvorschlag gegen ein neu belegtes Prüfpaket.
 * `packetInput` ist die ursprüngliche Eingabe von #723. `suggestion` trägt
 * nur Bewertung, zitierte Stütz-IDs, Grundcodes und optional eine Notiz.
 * Die Notiz wird gekürzt und begrenzt. Sie wird kein Fakt.
 */
export function officialTruthRegelReviewVorschlag(eingabe: unknown): OfficialTruthRegelReviewVorschlagErgebnis {
  const satz = datensatz(eingabe)
  if (!satz) return sperre('unexpected_fields')
  const gesehen = new WeakSet<object>()
  const personen = personenkennung(satz, 0, gesehen)
  if (personen === 'personal') return sperre('personal_identifier_forbidden')
  if (personen === 'too_deep') return sperre('unexpected_fields')
  if (!schluesselPassen(satz, EINGABE_FELDER, [])) return sperre('unexpected_fields')

  const paket = officialTruthRegelReviewPacket(satz.packetInput)
  const finger = officialTruthRegelReviewPacketFingerprint(satz.packetInput)
  if (paket.status !== 'rule_review_packet' || finger.status !== 'rule_review_packet_fingerprint') {
    if (paket.status === 'blocked') return sperre(paket.reason)
    return sperre(finger.status === 'blocked' ? finger.reason : 'packet_fingerprint_mismatch')
  }

  const paketIds = paket.supports.map((eintrag) => eintrag.versionId)
  if (
    paket.kandidat.key !== finger.ruleScopeKey ||
    !gleicheIds(paket.kandidat.supportVersionIds, finger.supportVersionIds) ||
    !gleicheIds(paketIds, finger.supportVersionIds)
  ) {
    return sperre('packet_fingerprint_mismatch')
  }

  const vorschlag = datensatz(satz.suggestion)
  if (!vorschlag) return sperre('unexpected_fields')
  if (!schluesselPassen(vorschlag, VORSCHLAG_PFLICHT, VORSCHLAG_OPTIONAL)) return sperre('unexpected_fields')

  const assessment = bewertung(vorschlag.assessment)
  if (!assessment) return sperre('invalid_assessment')

  const gruende = eindeutigeTexte(vorschlag.reasonCodes, grund, 'invalid_reason_code', 'duplicate_reason_code')
  if (!gruende.ok) return sperre(gruende.reason)

  const zitate = eindeutigeTexte(
    vorschlag.citedSupportVersionIds,
    (wert) => (typeof wert === 'string' && wert.length > 0 ? wert : null),
    'invalid_support',
    'duplicate_citation',
  )
  if (!zitate.ok) return sperre(zitate.reason)

  const erlaubt = new Set(finger.supportVersionIds)
  if (zitate.werte.some((id) => !erlaubt.has(id))) return sperre('citation_not_in_packet')

  const review = Object.hasOwn(vorschlag, 'reviewNote') ? notiz(vorschlag.reviewNote) : { ok: true as const, text: null }
  if (!review.ok) return sperre('invalid_review_note')

  return Object.freeze({
    status: 'review_suggestion',
    reviewPacketKey: finger.reviewPacketKey,
    ruleScopeKey: finger.ruleScopeKey,
    assessment,
    citedSupportVersionIds: Object.freeze([...zitate.werte].sort(vergleich)),
    reasonCodes: Object.freeze([...gruende.werte].sort(vergleich)) as readonly OfficialTruthRegelReviewGrund[],
    reviewNote: review.text,
  })
}
