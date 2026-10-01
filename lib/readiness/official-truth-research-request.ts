// lib/readiness/official-truth-research-request.ts
//
// Deterministische Forschungsanfrage für eine bestehende Official-Truth-Zelle.
// Die Abdeckung bleibt die Abdeckung. Dieses Modul bewertet sie nicht neu,
// speichert nichts und ruft keine Quelle auf.
// Eine Lücke bleibt eine Lücke. Ein ungültiger Zustand wird nicht repariert.

import { sha256Hex } from '@/lib/readiness/digest'
import type {
  OfficialTruthAbdeckung,
  OfficialTruthAbdeckungFehler,
  OfficialTruthAbdeckungNeuPruefen,
} from '@/lib/readiness/official-truth-coverage'
import {
  REGEL_FAKT_ARTEN,
  REGEL_SCOPE_PRAEFIX,
  REGEL_SUPPORT_MAX,
  regelScopeAusEvidenceScope,
  type RegelFaktArt,
  type RegelScope,
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

/** Freitext, der in der kanonischen Zelle keine Bedeutung hat. */
const NOTIZ_SCHLUESSEL = new Set([
  'extractionNote',
  'travellerNote',
  'traveller_note',
  'note',
  'comment',
  'freeText',
  'freeform',
])

const ANFRAGE_PRAEFIX = 'research-request:v1:'
const REGEL_SCHLUESSEL = new RegExp(`^${REGEL_SCOPE_PRAEFIX}[a-f0-9]{64}$`)
const VERSION_ID = /^ev1_[a-f0-9]{32}$/
const EVIDENZ_KLASSE = 'official_authority' as const

const ABDECKUNG_FEHLER = {
  personal_identifier_forbidden: true,
  invalid_request: true,
  unexpected_fields: true,
  invalid_rule_scope_key: true,
  invalid_fact_kind: true,
  invalid_reference_time: true,
  invalid_max_age: true,
  claim_not_accepted: true,
  scope_mismatch: true,
  fact_kind_mismatch: true,
  invalid_support: true,
  duplicate_support: true,
  incomplete_support: true,
  support_mismatch: true,
  support_not_accepted: true,
  invalid_source_id: true,
  invalid_timestamp: true,
  retrieved_at_in_future: true,
} as const satisfies Record<OfficialTruthAbdeckungFehler, true>

const NEU_PRUEFEN = {
  valid_from_in_future: true,
  valid_until_elapsed: true,
  max_age_exceeded: true,
} as const satisfies Record<OfficialTruthAbdeckungNeuPruefen, true>

const AKTUELL_SCHLUESSEL = ['status', 'ruleScopeKey', 'factKind', 'supportVersionIds'] as const
const LUECKE_SCHLUESSEL = ['status', 'ruleScopeKey', 'factKind'] as const
const NEU_SCHLUESSEL = ['status', 'ruleScopeKey', 'factKind', 'reason'] as const
const UNGUELTIG_SCHLUESSEL = ['status', 'ruleScopeKey', 'factKind', 'reason'] as const

export type OfficialTruthRechercheGrund =
  | { status: 'missing' }
  | { status: 'recheck_needed'; reason: OfficialTruthAbdeckungNeuPruefen }

export type OfficialTruthRechercheSperrgrund =
  | OfficialTruthAbdeckungFehler
  | 'invalid_scope'
  | 'coverage_unreadable'
  | 'research_scope_mismatch'

/**
 * Eine Zelle, für die primäre amtliche Evidenz gebraucht wird.
 * Die Zelle ist der bestehende Regel-Scope. Die Evidenzklasse ist fest.
 */
export type OfficialTruthRechercheAnfrage = {
  key: string
  ruleScopeKey: string
  factKind: RegelFaktArt
  scope: RegelScope
  researchReason: OfficialTruthRechercheGrund
  evidenceClass: typeof EVIDENZ_KLASSE
}

export type OfficialTruthRechercheEntscheidung =
  | { action: 'none'; reason: 'current' }
  | { action: 'research'; request: OfficialTruthRechercheAnfrage }
  | {
      action: 'blocked_invalid'
      reason: OfficialTruthRechercheSperrgrund
      ruleScopeKey: string
      factKind: RegelFaktArt | null
    }

type Gelesen =
  | { art: 'current'; ruleScopeKey: string; factKind: RegelFaktArt }
  | { art: 'missing'; ruleScopeKey: string; factKind: RegelFaktArt }
  | {
      art: 'recheck_needed'
      ruleScopeKey: string
      factKind: RegelFaktArt
      reason: OfficialTruthAbdeckungNeuPruefen
    }
  | {
      art: 'invalid'
      reason: OfficialTruthAbdeckungFehler
      ruleScopeKey: string
      factKind: RegelFaktArt | null
    }
  | { art: 'unreadable'; reason: 'unexpected_fields' | 'coverage_unreadable' }

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function istFaktArt(wert: unknown): wert is RegelFaktArt {
  return typeof wert === 'string' && (REGEL_FAKT_ARTEN as readonly string[]).includes(wert)
}

function istAbdeckungsfehler(wert: unknown): wert is OfficialTruthAbdeckungFehler {
  return typeof wert === 'string' && Object.hasOwn(ABDECKUNG_FEHLER, wert)
}

function istNeuPruefen(wert: unknown): wert is OfficialTruthAbdeckungNeuPruefen {
  return typeof wert === 'string' && Object.hasOwn(NEU_PRUEFEN, wert)
}

function genaueSchluessel(satz: Record<string, unknown>, erlaubt: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === erlaubt.length && erlaubt.every((name) => Object.hasOwn(satz, name))
}

function texteSammeln(wert: unknown, texte: string[], tiefe: number): void {
  if (tiefe > 8) return
  if (typeof wert === 'string') {
    if (wert) texte.push(wert)
    return
  }
  if (!wert || typeof wert !== 'object') return
  const kinder = Array.isArray(wert) ? wert : Object.values(wert)
  for (const kind of kinder) texteSammeln(kind, texte, tiefe + 1)
}

function verboteneTexte(wert: unknown, texte: string[], tiefe = 0): boolean {
  if (tiefe > 8 || !wert || typeof wert !== 'object') return false
  if (Array.isArray(wert)) return wert.some((eintrag) => verboteneTexte(eintrag, texte, tiefe + 1))
  let gefunden = false
  for (const [schluessel, kind] of Object.entries(wert)) {
    if (PERSONEN_SCHLUESSEL.has(schluessel) || NOTIZ_SCHLUESSEL.has(schluessel)) {
      gefunden = true
      texteSammeln(kind, texte, tiefe + 1)
    }
    if (verboteneTexte(kind, texte, tiefe + 1)) gefunden = true
  }
  return gefunden
}

function echoSchluessel(wert: unknown, geheim: readonly string[]): string {
  if (typeof wert !== 'string' || wert.length > 96 || /[\u0000-\u001f]/.test(wert)) return ''
  if (geheim.some((eintrag) => wert.includes(eintrag))) return ''
  return wert
}

function schluesselFuerZelle(wert: unknown): string | null {
  return typeof wert === 'string' && REGEL_SCHLUESSEL.test(wert) ? wert : null
}

function stuetzenLesen(wert: unknown): boolean {
  if (!Array.isArray(wert) || wert.length === 0 || wert.length > REGEL_SUPPORT_MAX) return false
  const gesehen = new Set<string>()
  for (const eintrag of wert) {
    if (typeof eintrag !== 'string' || !VERSION_ID.test(eintrag) || gesehen.has(eintrag)) return false
    gesehen.add(eintrag)
  }
  return true
}

function abdeckungLesen(wert: unknown, geheim: readonly string[]): Gelesen {
  const satz = datensatz(wert)
  if (!satz || typeof satz.status !== 'string') return { art: 'unreadable', reason: 'coverage_unreadable' }

  if (satz.status === 'invalid') {
    if (!genaueSchluessel(satz, UNGUELTIG_SCHLUESSEL)) return { art: 'unreadable', reason: 'unexpected_fields' }
    if (!istAbdeckungsfehler(satz.reason)) return { art: 'unreadable', reason: 'coverage_unreadable' }
    const factKind = satz.factKind === null ? null : istFaktArt(satz.factKind) ? satz.factKind : undefined
    if (factKind === undefined) return { art: 'unreadable', reason: 'coverage_unreadable' }
    return {
      art: 'invalid',
      reason: satz.reason,
      ruleScopeKey: echoSchluessel(satz.ruleScopeKey, geheim),
      factKind,
    }
  }

  if (satz.status === 'current') {
    if (!genaueSchluessel(satz, AKTUELL_SCHLUESSEL)) return { art: 'unreadable', reason: 'unexpected_fields' }
    if (!stuetzenLesen(satz.supportVersionIds)) return { art: 'unreadable', reason: 'coverage_unreadable' }
  } else if (satz.status === 'missing') {
    if (!genaueSchluessel(satz, LUECKE_SCHLUESSEL)) return { art: 'unreadable', reason: 'unexpected_fields' }
  } else if (satz.status === 'recheck_needed') {
    if (!genaueSchluessel(satz, NEU_SCHLUESSEL)) return { art: 'unreadable', reason: 'unexpected_fields' }
    if (!istNeuPruefen(satz.reason)) return { art: 'unreadable', reason: 'coverage_unreadable' }
  } else {
    return { art: 'unreadable', reason: 'coverage_unreadable' }
  }

  const ruleScopeKey = schluesselFuerZelle(satz.ruleScopeKey)
  if (!ruleScopeKey || !istFaktArt(satz.factKind)) return { art: 'unreadable', reason: 'coverage_unreadable' }
  if (satz.status === 'current') return { art: 'current', ruleScopeKey, factKind: satz.factKind }
  if (satz.status === 'missing') return { art: 'missing', ruleScopeKey, factKind: satz.factKind }
  if (satz.status === 'recheck_needed' && istNeuPruefen(satz.reason)) {
    return { art: 'recheck_needed', ruleScopeKey, factKind: satz.factKind, reason: satz.reason }
  }
  return { art: 'unreadable', reason: 'coverage_unreadable' }
}

function sperre(
  reason: OfficialTruthRechercheSperrgrund,
  ruleScopeKey: string,
  factKind: RegelFaktArt | null,
): OfficialTruthRechercheEntscheidung {
  return Object.freeze({ action: 'blocked_invalid', reason, ruleScopeKey, factKind })
}

function scopeKopieren(atom: RegelScope): RegelScope {
  const citizenship: RegelScope['citizenship'] =
    atom.citizenship.mode === 'required'
      ? Object.freeze({ mode: 'required', countryCodes: Object.freeze([...atom.citizenship.countryCodes]) })
      : Object.freeze({ mode: 'not_applicable' })
  const credentialOption: RegelScope['credentialOption'] =
    atom.credentialOption.mode === 'option'
      ? Object.freeze({
          mode: 'option',
          documentType: atom.credentialOption.documentType,
          issuingCountryCode: atom.credentialOption.issuingCountryCode,
          relatedCitizenshipCountryCode: atom.credentialOption.relatedCitizenshipCountryCode,
        })
      : Object.freeze({ mode: 'not_applicable' })
  const residence: RegelScope['residence'] =
    atom.residence.mode === 'required'
      ? Object.freeze({ mode: 'required', countryCode: atom.residence.countryCode })
      : Object.freeze({ mode: 'not_applicable' })
  const validity: RegelScope['validity'] =
    atom.validity.mode === 'travel_date'
      ? Object.freeze({ mode: 'travel_date', travelDate: atom.validity.travelDate })
      : Object.freeze({ mode: 'not_applicable' })
  return Object.freeze({
    destinationCountryCode: atom.destinationCountryCode,
    transitCountryCode: atom.transitCountryCode,
    citizenship,
    credentialOption,
    residence,
    requirementType: atom.requirementType,
    validity,
  })
}

function grundFuer(gelesen: Extract<Gelesen, { art: 'missing' | 'recheck_needed' }>): OfficialTruthRechercheGrund {
  if (gelesen.art === 'recheck_needed') return { status: 'recheck_needed', reason: gelesen.reason }
  return { status: 'missing' }
}

function anfrageSchluessel(ruleScopeKey: string, factKind: RegelFaktArt, grund: OfficialTruthRechercheGrund): string {
  const kanonisch = JSON.stringify({
    v: 1,
    ruleScopeKey,
    factKind,
    status: grund.status,
    recheckReason: grund.status === 'recheck_needed' ? grund.reason : null,
  })
  return `${ANFRAGE_PRAEFIX}${sha256Hex(kanonisch)}`
}

function anfrageBauen(
  ruleScopeKey: string,
  factKind: RegelFaktArt,
  scope: RegelScope,
  grund: OfficialTruthRechercheGrund,
): OfficialTruthRechercheAnfrage {
  return Object.freeze({
    key: anfrageSchluessel(ruleScopeKey, factKind, grund),
    ruleScopeKey,
    factKind,
    scope: scopeKopieren(scope),
    researchReason: Object.freeze(grund),
    evidenceClass: EVIDENZ_KLASSE,
  })
}

/**
 * Entscheidet, ob eine bereits bewertete Zelle Forschung braucht.
 * `current` ergibt keine Anfrage. `missing` und `recheck_needed` ergeben
 * dieselbe Aktionsform und unterschiedliche Schlüssel. `invalid` bleibt
 * blockiert. Staatsbürgerschaft, Dokument, Ziel und Transit kommen nur aus
 * dem bestehenden Scope; eine fehlende Angabe wird nicht ergänzt.
 * Mehrere Credential-Optionen sind mehrere Aufrufe. Dieser Aufruf wählt keine.
 */
export function officialTruthRechercheEntscheiden(
  coverage: OfficialTruthAbdeckung,
  scope: RegelScope,
): OfficialTruthRechercheEntscheidung {
  const geheim: string[] = []
  if (verboteneTexte({ coverage, scope }, geheim)) {
    const satz = datensatz(coverage)
    const factKind = satz && istFaktArt(satz.factKind) ? satz.factKind : null
    return sperre('personal_identifier_forbidden', echoSchluessel(satz?.ruleScopeKey, geheim), factKind)
  }

  const gelesen = abdeckungLesen(coverage, geheim)
  if (gelesen.art === 'invalid') return sperre(gelesen.reason, gelesen.ruleScopeKey, gelesen.factKind)
  if (gelesen.art === 'unreadable') return sperre(gelesen.reason, '', null)

  const zelle = regelScopeAusEvidenceScope(scope)
  if (!zelle.ok) {
    const reason = zelle.reason === 'personal_identifier_forbidden' || zelle.reason === 'unexpected_fields' ? zelle.reason : 'invalid_scope'
    return sperre(reason, gelesen.ruleScopeKey, gelesen.factKind)
  }
  if (zelle.key !== gelesen.ruleScopeKey) return sperre('research_scope_mismatch', gelesen.ruleScopeKey, gelesen.factKind)
  if (gelesen.art === 'current') return Object.freeze({ action: 'none', reason: 'current' })

  const request = anfrageBauen(gelesen.ruleScopeKey, gelesen.factKind, zelle.scope, grundFuer(gelesen))
  if (verboteneTexte(request, [])) return sperre('personal_identifier_forbidden', gelesen.ruleScopeKey, gelesen.factKind)
  return Object.freeze({ action: 'research', request })
}
