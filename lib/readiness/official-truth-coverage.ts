// lib/readiness/official-truth-coverage.ts
//
// Deterministische Abdeckung und Frische für späteres Official-Truth-Orchestrieren.
// Kein Netz, keine Datenbank, kein Provider, kein Modell, keine Laufzeitaktivierung.
// Eine Lücke bleibt eine Lücke. Dieses Modul erzeugt keine Anforderungswirkung.

import type { EvidenceLifecycle, EvidenceValidationState } from '@/lib/readiness/evidence'
import { checkedAtLesen, gültigkeitszeitLesen } from '@/lib/readiness/official'
import {
  REGEL_FAKT_ARTEN,
  REGEL_SCOPE_PRAEFIX,
  REGEL_SUPPORT_MAX,
  type RegelFaktArt,
} from '@/lib/readiness/rule-claims'

/**
 * Dieselbe Kennungsmenge wie `PERSONEN_SCHLUESSEL` in `rule-claims.ts`.
 * Die Menge ist dort modulprivat. Sie wird hier nicht zur Produkttaxonomie.
 */
const PERSONEN_SCHLUESSEL = new Set([
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
])

/** Dieselbe Form wie `VERSION_ID` in `rule-claims.ts`. */
const VERSION_ID = /^ev1_[a-f0-9]{32}$/

/** Dieselbe Form wie `sourceIdLesen` in `source-registry.ts`. Kein Katalogabruf. */
const QUELLEN_ID = /^[a-z][a-z0-9_-]{1,63}$/

const REGEL_SCHLUESSEL = new RegExp(`^${REGEL_SCOPE_PRAEFIX}[a-f0-9]{64}$`)

const ANFRAGE_PFLICHT = ['ruleScopeKey', 'factKind', 'claim', 'support', 'referenceTime'] as const
const ANFRAGE_ERLAUBT = [...ANFRAGE_PFLICHT, 'maxAgeMs'] as const
const CLAIM_SCHLUESSEL = ['lifecycle', 'validationState', 'ruleScopeKey', 'factKind', 'supportVersionIds'] as const
const STUETZE_SCHLUESSEL = [
  'versionId',
  'ruleScopeKey',
  'lifecycle',
  'validationState',
  'retrievedAt',
  'validFrom',
  'validUntil',
  'sourceId',
] as const

const STRUKTUR_RANG = {
  support_not_accepted: 0,
  scope_mismatch: 1,
  invalid_source_id: 2,
  invalid_timestamp: 3,
  retrieved_at_in_future: 4,
} as const

const FRISCHE_RANG = {
  valid_from_in_future: 0,
  valid_until_elapsed: 1,
  max_age_exceeded: 2,
} as const

export type OfficialTruthAbdeckungStuetze = {
  versionId: string
  ruleScopeKey: string
  lifecycle: EvidenceLifecycle
  validationState: EvidenceValidationState
  retrievedAt: string
  validFrom: string | null
  validUntil: string | null
  sourceId: string
}

export type OfficialTruthAbdeckungClaim = {
  lifecycle: 'accepted' | 'candidate'
  validationState: 'valid' | 'pending' | 'rejected'
  ruleScopeKey: string
  factKind: RegelFaktArt
  supportVersionIds: readonly string[]
}

export type OfficialTruthAbdeckungAnfrage = {
  ruleScopeKey: string
  factKind: RegelFaktArt
  claim: OfficialTruthAbdeckungClaim | null
  support: readonly OfficialTruthAbdeckungStuetze[]
  referenceTime: string
  maxAgeMs?: number
}

export type OfficialTruthAbdeckungFehler =
  | 'personal_identifier_forbidden'
  | 'invalid_request'
  | 'unexpected_fields'
  | 'invalid_rule_scope_key'
  | 'invalid_fact_kind'
  | 'invalid_reference_time'
  | 'invalid_max_age'
  | 'claim_not_accepted'
  | 'scope_mismatch'
  | 'fact_kind_mismatch'
  | 'invalid_support'
  | 'duplicate_support'
  | 'incomplete_support'
  | 'support_mismatch'
  | 'support_not_accepted'
  | 'invalid_source_id'
  | 'invalid_timestamp'
  | 'retrieved_at_in_future'

export type OfficialTruthAbdeckungNeuPruefen = keyof typeof FRISCHE_RANG

export type OfficialTruthAbdeckung =
  | {
      status: 'current'
      ruleScopeKey: string
      factKind: RegelFaktArt
      supportVersionIds: readonly string[]
    }
  | {
      status: 'missing'
      ruleScopeKey: string
      factKind: RegelFaktArt
    }
  | {
      status: 'recheck_needed'
      ruleScopeKey: string
      factKind: RegelFaktArt
      reason: OfficialTruthAbdeckungNeuPruefen
    }
  | {
      status: 'invalid'
      ruleScopeKey: string
      factKind: RegelFaktArt | null
      reason: OfficialTruthAbdeckungFehler
    }

type StrukturFehler = keyof typeof STRUKTUR_RANG

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function personenkennung(wert: unknown, tiefe = 0): boolean {
  if (tiefe > 8 || !wert || typeof wert !== 'object') return false
  if (Array.isArray(wert)) return wert.some((eintrag) => personenkennung(eintrag, tiefe + 1))
  return Object.entries(wert as Record<string, unknown>).some(
    ([schluessel, kind]) => PERSONEN_SCHLUESSEL.has(schluessel) || personenkennung(kind, tiefe + 1),
  )
}

function schluesselErlaubt(satz: Record<string, unknown>, erlaubt: readonly string[], pflicht: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.every((name) => erlaubt.includes(name)) && pflicht.every((name) => name in satz)
}

function faktArt(wert: unknown): RegelFaktArt | null {
  return typeof wert === 'string' && (REGEL_FAKT_ARTEN as readonly string[]).includes(wert) ? (wert as RegelFaktArt) : null
}

function regelSchluessel(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  return REGEL_SCHLUESSEL.test(wert) ? wert : null
}

function schluesselEcho(wert: unknown): string {
  return typeof wert === 'string' && wert.length <= 96 && !/[\u0000-\u001f]/.test(wert) ? wert : ''
}

/**
 * Datumsangaben ohne Uhrzeit bleiben Mitternacht UTC.
 * Das ist die Lesart von `gültigkeitszeitLesen`, nicht eine neue Kalenderregel.
 */
function zeitpunktMs(wert: string): number {
  return Date.parse(wert.length === 10 ? `${wert}T00:00:00.000Z` : wert)
}

function ungueltig(
  ruleScopeKey: string,
  factKind: RegelFaktArt | null,
  reason: OfficialTruthAbdeckungFehler,
): OfficialTruthAbdeckung {
  return Object.freeze({ status: 'invalid', ruleScopeKey, factKind, reason })
}

function fehlend(ruleScopeKey: string, factKind: RegelFaktArt): OfficialTruthAbdeckung {
  return Object.freeze({ status: 'missing', ruleScopeKey, factKind })
}

function neuPruefen(
  ruleScopeKey: string,
  factKind: RegelFaktArt,
  reason: OfficialTruthAbdeckungNeuPruefen,
): OfficialTruthAbdeckung {
  return Object.freeze({ status: 'recheck_needed', ruleScopeKey, factKind, reason })
}

function aktuell(ruleScopeKey: string, factKind: RegelFaktArt, supportVersionIds: readonly string[]): OfficialTruthAbdeckung {
  return Object.freeze({
    status: 'current',
    ruleScopeKey,
    factKind,
    supportVersionIds: Object.freeze([...supportVersionIds]),
  })
}

function hoechsterRang<T extends string>(gruende: readonly T[], rang: Record<T, number>): T | null {
  let beste: T | null = null
  for (const grund of gruende) {
    if (beste === null || rang[grund] < rang[beste]) beste = grund
  }
  return beste
}

function stuetzeLesen(wert: unknown): { ok: true; stuetze: OfficialTruthAbdeckungStuetze } | { ok: false; reason: OfficialTruthAbdeckungFehler } {
  const satz = datensatz(wert)
  if (!satz) return { ok: false, reason: 'invalid_support' }
  if (!schluesselErlaubt(satz, STUETZE_SCHLUESSEL, STUETZE_SCHLUESSEL)) return { ok: false, reason: 'unexpected_fields' }
  if (typeof satz.versionId !== 'string' || !VERSION_ID.test(satz.versionId)) return { ok: false, reason: 'invalid_support' }
  return { ok: true, stuetze: satz as OfficialTruthAbdeckungStuetze }
}

function strukturVon(
  stuetze: OfficialTruthAbdeckungStuetze,
  ruleScopeKey: string,
  referenzMs: number,
): StrukturFehler | null {
  if (stuetze.lifecycle !== 'accepted' || stuetze.validationState !== 'valid') return 'support_not_accepted'
  if (stuetze.ruleScopeKey !== ruleScopeKey) return 'scope_mismatch'
  if (typeof stuetze.sourceId !== 'string' || !QUELLEN_ID.test(stuetze.sourceId.trim())) return 'invalid_source_id'
  const abgerufen = checkedAtLesen(stuetze.retrievedAt)
  if (!abgerufen) return 'invalid_timestamp'
  const von = stuetze.validFrom == null ? null : gültigkeitszeitLesen(stuetze.validFrom)
  const bis = stuetze.validUntil == null ? null : gültigkeitszeitLesen(stuetze.validUntil)
  if (stuetze.validFrom != null && !von) return 'invalid_timestamp'
  if (stuetze.validUntil != null && !bis) return 'invalid_timestamp'
  if (von && bis && zeitpunktMs(von) > zeitpunktMs(bis)) return 'invalid_timestamp'
  // Ein späterer Abruf als die Referenzzeit ist ungültig. Keine Uhren-Toleranz.
  if (Date.parse(abgerufen) > referenzMs) return 'retrieved_at_in_future'
  return null
}

function frischeVon(
  stuetze: OfficialTruthAbdeckungStuetze,
  referenzMs: number,
  maxAgeMs: number | null,
): OfficialTruthAbdeckungNeuPruefen | null {
  const abgerufen = checkedAtLesen(stuetze.retrievedAt)
  const von = stuetze.validFrom == null ? null : gültigkeitszeitLesen(stuetze.validFrom)
  const bis = stuetze.validUntil == null ? null : gültigkeitszeitLesen(stuetze.validUntil)
  if (!abgerufen || (stuetze.validFrom != null && !von) || (stuetze.validUntil != null && !bis)) return null
  if (von && referenzMs < zeitpunktMs(von)) return 'valid_from_in_future'
  if (bis && referenzMs > zeitpunktMs(bis)) return 'valid_until_elapsed'
  // Gleichstand bleibt innerhalb der mitgegebenen Grenze. Ohne Grenze gibt es kein Alter.
  if (maxAgeMs !== null && referenzMs - Date.parse(abgerufen) > maxAgeMs) return 'max_age_exceeded'
  return null
}

/**
 * Bewertet, ob für einen kanonischen Regelraum und eine Faktart genau eine
 * akzeptierte Aussage mit vollständiger, akzeptierter Stützung noch frisch ist.
 * Ohne Aussage ist das Ergebnis `missing`. Das ist keine Reiseerlaubnis.
 * Ohne `maxAgeMs` wird kein Höchstalter erfunden.
 */
export function officialTruthAbdeckungBewerten(anfrage: OfficialTruthAbdeckungAnfrage): OfficialTruthAbdeckung {
  if (personenkennung(anfrage)) {
    const satz = datensatz(anfrage)
    return ungueltig(schluesselEcho(satz?.ruleScopeKey), faktArt(satz?.factKind), 'personal_identifier_forbidden')
  }
  const satz = datensatz(anfrage)
  if (!satz || !schluesselErlaubt(satz, ANFRAGE_ERLAUBT, ANFRAGE_PFLICHT) || !Array.isArray(satz.support)) {
    return ungueltig(schluesselEcho(satz?.ruleScopeKey), faktArt(satz?.factKind), 'invalid_request')
  }

  const ruleScopeKey = regelSchluessel(satz.ruleScopeKey)
  const factKind = faktArt(satz.factKind)
  const echo = schluesselEcho(satz.ruleScopeKey)
  if (!ruleScopeKey) return ungueltig(echo, factKind, 'invalid_rule_scope_key')
  if (!factKind) return ungueltig(ruleScopeKey, null, 'invalid_fact_kind')

  const referenz = checkedAtLesen(satz.referenceTime)
  if (!referenz) return ungueltig(ruleScopeKey, factKind, 'invalid_reference_time')
  const referenzMs = Date.parse(referenz)

  let maxAgeMs: number | null = null
  if ('maxAgeMs' in satz && satz.maxAgeMs !== undefined) {
    if (typeof satz.maxAgeMs !== 'number' || !Number.isFinite(satz.maxAgeMs) || satz.maxAgeMs <= 0) {
      return ungueltig(ruleScopeKey, factKind, 'invalid_max_age')
    }
    maxAgeMs = satz.maxAgeMs
  }

  if (satz.claim == null) return fehlend(ruleScopeKey, factKind)
  const claimSatz = datensatz(satz.claim)
  if (!claimSatz || !schluesselErlaubt(claimSatz, CLAIM_SCHLUESSEL, CLAIM_SCHLUESSEL)) {
    return ungueltig(ruleScopeKey, factKind, 'unexpected_fields')
  }
  if (claimSatz.lifecycle !== 'accepted' || claimSatz.validationState !== 'valid') {
    return ungueltig(ruleScopeKey, factKind, 'claim_not_accepted')
  }
  if (claimSatz.ruleScopeKey !== ruleScopeKey) return ungueltig(ruleScopeKey, factKind, 'scope_mismatch')
  if (faktArt(claimSatz.factKind) !== factKind) return ungueltig(ruleScopeKey, factKind, 'fact_kind_mismatch')
  if (!Array.isArray(claimSatz.supportVersionIds)) return ungueltig(ruleScopeKey, factKind, 'invalid_support')

  const ids: string[] = []
  let unlesbareId = false
  let doppelteId = false
  for (const id of claimSatz.supportVersionIds) {
    if (typeof id !== 'string' || !VERSION_ID.test(id)) {
      unlesbareId = true
      continue
    }
    if (ids.includes(id)) {
      doppelteId = true
      continue
    }
    ids.push(id)
  }
  if (unlesbareId) return ungueltig(ruleScopeKey, factKind, 'invalid_support')
  if (doppelteId) return ungueltig(ruleScopeKey, factKind, 'duplicate_support')
  if (ids.length === 0 || ids.length > REGEL_SUPPORT_MAX) return ungueltig(ruleScopeKey, factKind, 'invalid_support')

  const gelesen: OfficialTruthAbdeckungStuetze[] = []
  const lesefehler: OfficialTruthAbdeckungFehler[] = []
  for (const eintrag of satz.support) {
    const stuetze = stuetzeLesen(eintrag)
    if (!stuetze.ok) lesefehler.push(stuetze.reason)
    else gelesen.push(stuetze.stuetze)
  }
  if (lesefehler.includes('unexpected_fields')) return ungueltig(ruleScopeKey, factKind, 'unexpected_fields')
  if (lesefehler.length > 0) return ungueltig(ruleScopeKey, factKind, 'invalid_support')

  const nachId = new Map<string, OfficialTruthAbdeckungStuetze>()
  for (const stuetze of gelesen) {
    if (nachId.has(stuetze.versionId)) return ungueltig(ruleScopeKey, factKind, 'duplicate_support')
    nachId.set(stuetze.versionId, stuetze)
  }
  if (ids.some((id) => !nachId.has(id))) return ungueltig(ruleScopeKey, factKind, 'incomplete_support')
  if (nachId.size !== ids.length) return ungueltig(ruleScopeKey, factKind, 'support_mismatch')

  const gewaehlt = ids.map((id) => nachId.get(id) as OfficialTruthAbdeckungStuetze)
  const struktur = hoechsterRang(
    gewaehlt.flatMap((stuetze) => {
      const grund = strukturVon(stuetze, ruleScopeKey, referenzMs)
      return grund ? [grund] : []
    }),
    STRUKTUR_RANG,
  )
  if (struktur) return ungueltig(ruleScopeKey, factKind, struktur)

  const frische = hoechsterRang(
    gewaehlt.flatMap((stuetze) => {
      const grund = frischeVon(stuetze, referenzMs, maxAgeMs)
      return grund ? [grund] : []
    }),
    FRISCHE_RANG,
  )
  if (frische) return neuPruefen(ruleScopeKey, factKind, frische)

  ids.sort()
  return aktuell(ruleScopeKey, factKind, ids)
}
