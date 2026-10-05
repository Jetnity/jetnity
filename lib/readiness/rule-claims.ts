// lib/readiness/rule-claims.ts
//
// Quellenneutraler Regel-Claim zwischen akzeptierter EvidenceVersion
// und der bestehenden Requirements-/Official-Truth-Engine.
// Ein Forschungsvorschlag ist keine akzeptierte Regel.
// Keine Datenbank, kein Netz, keine zweite Engine, keine neue Anforderungstaxonomie.

import { readDistinctContentItemRefs } from '@/lib/readiness/official-truth-content-identity'
import { sha256Hex } from '@/lib/readiness/digest'
import {
  akzeptierteEvidenceLesen,
  evidenceScopeLesen,
  type EvidenceAtom,
  type EvidenceVersion,
} from '@/lib/readiness/evidence'
import {
  OFFICIAL_ACTION_PURPOSES,
  OFFICIAL_VISA_MODES,
  type OfficialActionPurpose,
  type OfficialVisaMode,
} from '@/lib/readiness/official'
import {
  regulierungsAnwendbarkeitV2Lesen,
  regulierungsWirkungsFaktV2Lesen,
  regulierungsVisaFaktV2Lesen,
  schema2DatenPruefen,
  schema2Kanonisch,
  stayQuantityV2Lesen,
  type RegulierungsAnwendbarkeitV2,
  type Schema2WirkungsFakt,
  type Schema2VisaOptionenFakt,
  type StayQuantityV2,
  type V2BlockReason,
  type V2LeseErgebnis,
  regulierungsAnwendbarkeitVisaOptionLesen,
  regulierungsAnwendbarkeitWirkungLesen,
  type AnforderungswirkungFakt,
  type RegulierungsAusdruck,
  type RegulierungsLesefehler,
  type VisaOptionenFakt,
} from '@/lib/readiness/regulierungs-anwendbarkeit'
import { quellenUrlAufloesen, type QuellenRegistry, type QuellenUrlFehler } from '@/lib/readiness/source-registry'
import { eventDeadlineV2Lesen, type EventDeadlineV2, temporalRuleLesen, type OfficialTemporalRule } from '@/lib/readiness/temporal'
import { landescodeLesen } from '@/lib/readiness/domain'
import type { OfficialRequirementType } from '@/types/trips'

export const REGEL_FAKT_ARTEN = [
  'requirement_effect',
  'visa_options',
  'stay_limit',
  'passport_validity',
  'blank_passport_pages',
  'transit_conditions',
  'official_actions',
  'temporal_rule',
] as const
export type RegelFaktArt = (typeof REGEL_FAKT_ARTEN)[number]

export const REGEL_EVIDENCE_QUALITAETEN = [
  'explicit_primary_statement',
  'composed_from_multiple_primary_sources',
  'stale_primary_evidence',
  'unresolved_conflict',
  'research_gap',
] as const
export type RegelEvidenceQualitaet = (typeof REGEL_EVIDENCE_QUALITAETEN)[number]

export const REGEL_SCOPE_PRAEFIX = 'rule-scope:v1:'
export const REGEL_SUPPORT_MAX = 8

/**
 * Technische Safety-Bounds für strukturierte Dauern.
 * Sie sind keine rechtliche Wahrheit und rechnen Einheiten nicht um.
 */
export const AUFENTHALT_WERT_MAX = {
  days: 3660,
  months: 120,
  years: 10,
} as const

/** Technische Obergrenze für eine Transitdauer, keine rechtliche Wahrheit. */
export const REGEL_TRANSIT_MINUTEN_MAX = 14 * 24 * 60

const TRANSIT_PFADE_MAX = 8
const AMTSHANDLUNGEN_MAX = 4
const LEERE_SEITEN_MIN = 1
const LEERE_SEITEN_MAX = 10
const VERSION_ID = /^ev2_[a-f0-9]{32}$/
const QUELLEN_ID = /^[a-z][a-z0-9_-]{1,63}$/
const IATA_FORM = /^[A-Z]{3}$/

const ANNEHMBARE_QUALITAET = ['explicit_primary_statement', 'composed_from_multiple_primary_sources'] as const
type AnnehmbareQualitaet = (typeof ANNEHMBARE_QUALITAET)[number]

const DAUER_EINHEITEN = ['days', 'months', 'years'] as const
const GRENZ_ERMESSEN = ['fixed', 'may_be_shorter', 'determined_at_border'] as const
const PASS_SEMANTIK = [
  'valid_on_entry',
  'valid_through_stay',
  'minimum_remaining_from_entry',
  'minimum_remaining_from_planned_departure',
  'minimum_remaining_at_application',
  'expired_document_exception',
] as const
const PASS_OHNE_DAUER = ['valid_on_entry', 'valid_through_stay'] as const
const TRANSIT_MODUS = ['air', 'land', 'sea'] as const
const TRANSIT_BOOL = [
  'crossesBorderControl',
  'leavesTransitArea',
  'thirdCountryRequired',
  'sameFlightRequired',
  'onwardTicketRequired',
] as const
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

const SCOPE_SCHLUESSEL = [
  'sourceId',
  'destinationCountryCode',
  'transitCountryCode',
  'citizenship',
  'credentialOption',
  'residence',
  'requirementType',
  'validity',
] as const

export type RegelScope = EvidenceAtom

export type RegelDauer = {
  value: number
  unit: (typeof DAUER_EINHEITEN)[number]
}

export type RegelAnforderungswirkung = AnforderungswirkungFakt

export type RegelVisaOption = {
  visaMode: Exclude<OfficialVisaMode, 'unknown'>
  eligibility: 'allowed' | 'not_allowed' | 'unknown'
  mandate: 'mandatory' | 'not_mandatory' | 'unknown'
}

export type RegelVisaOptionen = VisaOptionenFakt

export type RegelAufenthalt = {
  kind: 'stay_limit'
  perVisit: RegelDauer | null
  rollingWindow: { maximum: RegelDauer; within: RegelDauer } | null
  initialGrant: RegelDauer | null
  extension: { requiresApplication: boolean; maximumTotal: RegelDauer } | null
  borderDiscretion: (typeof GRENZ_ERMESSEN)[number]
}

export type RegelPassgueltigkeit = {
  kind: 'passport_validity'
  semantics: (typeof PASS_SEMANTIK)[number]
  duration: RegelDauer | null
}

export type RegelLeereSeiten = {
  kind: 'blank_passport_pages'
  minimumPages: number
}

export type RegelTransitPfad = {
  crossesBorderControl: boolean | null
  leavesTransitArea: boolean | null
  transitAirportCodes: readonly string[] | null
  maxTransitDurationMinutes: number | null
  arrivalMode: (typeof TRANSIT_MODUS)[number] | null
  departureMode: (typeof TRANSIT_MODUS)[number] | null
  thirdCountryRequired: boolean | null
  sameFlightRequired: boolean | null
  onwardTicketRequired: boolean | null
}

export type RegelTransitBedingungen = {
  kind: 'transit_conditions'
  paths: readonly RegelTransitPfad[]
}

export type RegelAmtsaktion = {
  actionSourceId: string
  purpose: OfficialActionPurpose
  href: string
  visaMode: Exclude<OfficialVisaMode, 'unknown'> | null
}

export type RegelAmtshandlungen = {
  kind: 'official_actions'
  actions: readonly RegelAmtsaktion[]
}

export type RegelZeitregel = {
  kind: 'temporal_rule'
  rule: OfficialTemporalRule
}

export type RegelFakt =
  | RegelAnforderungswirkung
  | RegelVisaOptionen
  | RegelAufenthalt
  | RegelPassgueltigkeit
  | RegelLeereSeiten
  | RegelTransitBedingungen
  | RegelAmtshandlungen
  | RegelZeitregel

export type RegelKandidat = {
  lifecycle: 'candidate'
  validationState: 'pending'
  scope: RegelScope
  key: string
  factKind: RegelFaktArt
  evidenceQuality: RegelEvidenceQualitaet
  supportVersionIds: readonly string[]
  proposal: RegelFakt | null
}

export type AkzeptierteRegelClaim = {
  lifecycle: 'accepted'
  validationState: 'valid'
  scope: RegelScope
  key: string
  factKind: RegelFaktArt
  evidenceQuality: AnnehmbareQualitaet
  supportVersionIds: readonly string[]
  fact: RegelFakt
}

export type RegelClaimFehler =
  | 'personal_identifier_forbidden'
  | 'unexpected_fields'
  | 'invalid_scope'
  | 'invalid_fact_kind'
  | 'invalid_evidence_quality'
  | 'invalid_support'
  | 'support_bound_exceeded'
  | 'scope_mismatch'
  | 'quality_not_acceptable'
  | 'research_gap_proposal_forbidden'
  | 'insufficient_support'
  | 'same_content_item_composition'
  | 'primary_source_required'
  | 'evidence_not_accepted'
  | 'support_mismatch'
  | 'condition_provenance_ambiguous'
  | 'invalid_fact'
  | 'visa_mode_forbidden'
  | 'visa_contradiction'
  | 'legacy_conditional_without_payload'
  | 'mixed_outcome'
  | 'provenance_not_authorized'
  | 'depth_exceeded'
  | 'node_bound_exceeded'
  | 'operand_bound_exceeded'
  | 'branch_bound_exceeded'
  | 'requirement_type_mismatch'
  | 'action_source_mismatch'
  | 'provider_action_forbidden'
  | QuellenUrlFehler

export type RegelScopeErgebnis =
  | { ok: true; scope: RegelScope; key: string }
  | { ok: false; reason: RegelClaimFehler }

export type RegelKandidatErgebnis =
  | { ok: true; kandidat: RegelKandidat }
  | { ok: false; reason: RegelClaimFehler }

export type RegelAnnahmeErgebnis =
  | { ok: true; claim: AkzeptierteRegelClaim }
  | { ok: false; reason: RegelClaimFehler }

type FaktErgebnis = { ok: true; fact: RegelFakt } | { ok: false; reason: RegelClaimFehler }

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

function nurBekannteSchluessel(wert: unknown, erlaubt: readonly string[]): boolean {
  const satz = datensatz(wert)
  if (!satz) return true
  return Object.keys(satz).every((schluessel) => erlaubt.includes(schluessel))
}

function hatGenau(satz: Record<string, unknown>, schluessel: readonly string[]): boolean {
  const vorhanden = Object.keys(satz)
  return vorhanden.length === schluessel.length && schluessel.every((schluessel) => schluessel in satz)
}

function istText<T extends string>(wert: unknown, liste: readonly T[]): wert is T {
  return typeof wert === 'string' && (liste as readonly string[]).includes(wert)
}

function istBoolOderNull(wert: unknown): wert is boolean | null {
  return wert === null || typeof wert === 'boolean'
}

function registryLesen(wert: unknown): QuellenRegistry | null {
  const satz = datensatz(wert)
  if (!satz || !Array.isArray(satz.sources) || !Array.isArray(satz.blockedDomains)) return null
  return wert as QuellenRegistry
}

function einfrieren<T>(wert: T): T {
  if (Array.isArray(wert)) {
    for (const eintrag of wert) einfrieren(eintrag)
    return Object.freeze(wert) as T
  }
  if (wert && typeof wert === 'object') {
    for (const eintrag of Object.values(wert)) einfrieren(eintrag)
    return Object.freeze(wert) as T
  }
  return wert
}

function scopeVerschachtelung(satz: Record<string, unknown>): boolean {
  if (!nurBekannteSchluessel(satz.citizenship, ['mode', 'countryCodes'])) return false
  if (!nurBekannteSchluessel(satz.credentialOption, ['mode', 'documentType', 'issuingCountryCode', 'relatedCitizenshipCountryCode'])) {
    return false
  }
  if (!nurBekannteSchluessel(satz.residence, ['mode', 'countryCode'])) return false
  if (!nurBekannteSchluessel(satz.validity, ['mode', 'travelDate'])) return false
  return true
}

function kanonisch(atom: EvidenceAtom): string {
  const citizenshipCountryCodes = atom.citizenship.mode === 'required' ? [...atom.citizenship.countryCodes].sort() : []
  const option = atom.credentialOption
  const relation =
    option.mode === 'not_applicable' ? 'not_applicable' : option.relatedCitizenshipCountryCode ? 'explicit' : 'unlinked'
  const residenceCountryCode = atom.residence.mode === 'required' ? atom.residence.countryCode : null
  const travelDate = atom.validity.mode === 'travel_date' ? atom.validity.travelDate : null
  return JSON.stringify({
    v: 1,
    destinationCountryCode: atom.destinationCountryCode,
    transitCountryCode: atom.transitCountryCode,
    citizenshipMode: atom.citizenship.mode,
    citizenshipCountryCodes,
    credentialOptionMode: option.mode,
    documentType: option.mode === 'option' ? option.documentType : null,
    issuingCountryCode: option.mode === 'option' ? option.issuingCountryCode : null,
    relatedCitizenshipCountryCode: option.mode === 'option' ? option.relatedCitizenshipCountryCode : null,
    relation,
    residenceMode: atom.residence.mode,
    residenceCountryCode,
    requirementType: atom.requirementType,
    validityMode: atom.validity.mode,
    travelDate,
  })
}

function schluesselFuer(atom: EvidenceAtom): string {
  return `${REGEL_SCOPE_PRAEFIX}${sha256Hex(kanonisch(atom))}`
}

/**
 * Quellenneutraler Scope: dieselbe regulatorische Zelle wie die Evidence,
 * ohne Quellen- oder Publikationsidentität.
 * Die Eingabereihenfolge der Staatsbürgerschaften ändert den Schlüssel nicht.
 */
export function regelScopeAusEvidenceScope(scope: unknown): RegelScopeErgebnis {
  if (personenkennung(scope)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const satz = datensatz(scope)
  if (!satz) return { ok: false, reason: 'invalid_scope' }
  if (!nurBekannteSchluessel(satz, SCOPE_SCHLUESSEL) || !scopeVerschachtelung(satz)) {
    return { ok: false, reason: 'unexpected_fields' }
  }
  // Die quellenneutrale Form hat kein sourceId. Der Evidence-Parser verlangt
  // eines nur zur Strukturprüfung. Die Probe steht nicht im Regel-Schlüssel.
  const mitQuelle = 'sourceId' in satz ? satz : { ...satz, sourceId: 'rule-scope-probe' }
  const gelesen = evidenceScopeLesen(mitQuelle)
  if (!gelesen.ok) {
    if (gelesen.reason === 'personal_identifier_forbidden') return { ok: false, reason: 'personal_identifier_forbidden' }
    return { ok: false, reason: 'invalid_scope' }
  }
  const atom = gelesen.scope
  const ohneQuelle: EvidenceAtom = {
    destinationCountryCode: atom.destinationCountryCode,
    transitCountryCode: atom.transitCountryCode,
    citizenship: atom.citizenship,
    credentialOption: atom.credentialOption,
    residence: atom.residence,
    requirementType: atom.requirementType,
    validity: atom.validity,
  }
  return { ok: true, scope: ohneQuelle, key: schluesselFuer(ohneQuelle) }
}

function supportLesen(
  wert: unknown,
): { ok: true; ids: string[] } | { ok: false; reason: 'invalid_support' | 'support_bound_exceeded' } {
  if (!Array.isArray(wert)) return { ok: false, reason: 'invalid_support' }
  if (wert.length > REGEL_SUPPORT_MAX) return { ok: false, reason: 'support_bound_exceeded' }
  const ids: string[] = []
  for (const eintrag of wert) {
    if (typeof eintrag !== 'string' || !VERSION_ID.test(eintrag)) return { ok: false, reason: 'invalid_support' }
    if (!ids.includes(eintrag)) ids.push(eintrag)
  }
  ids.sort()
  return { ok: true, ids }
}

function dauerLesen(wert: unknown): RegelDauer | null {
  const satz = datensatz(wert)
  if (!satz || !hatGenau(satz, ['value', 'unit'])) return null
  if (typeof satz.value !== 'number' || !Number.isInteger(satz.value) || satz.value < 1) return null
  if (!istText(satz.unit, DAUER_EINHEITEN)) return null
  if (satz.value > AUFENTHALT_WERT_MAX[satz.unit]) return null
  return { value: satz.value, unit: satz.unit }
}

function visaModusKonkret(wert: unknown): Exclude<OfficialVisaMode, 'unknown'> | null {
  if (!istText(wert, OFFICIAL_VISA_MODES) || wert === 'unknown') return null
  return wert
}

function faktGrund(reason: RegulierungsLesefehler | 'legacy_conditional_without_payload'): RegelClaimFehler {
  switch (reason) {
    case 'invalid_fact':
    case 'personal_identifier_forbidden':
    case 'provenance_not_authorized':
    case 'mixed_outcome':
    case 'depth_exceeded':
    case 'node_bound_exceeded':
    case 'operand_bound_exceeded':
    case 'branch_bound_exceeded':
    case 'support_bound_exceeded':
    case 'invalid_support':
    case 'visa_contradiction':
    case 'visa_mode_forbidden':
    case 'legacy_conditional_without_payload':
      return reason
    case 'context_conflict':
      return 'invalid_fact'
    default: {
      const unerreichbar: never = reason
      return unerreichbar
    }
  }
}

function wirkungLesen(requirementType: OfficialRequirementType, wert: unknown): FaktErgebnis {
  const gelesen = regulierungsAnwendbarkeitWirkungLesen(wert, requirementType)
  if (!gelesen.ok) return { ok: false, reason: faktGrund(gelesen.reason) }
  return { ok: true, fact: gelesen.fakt }
}

function visaOptionenLesen(requirementType: OfficialRequirementType, wert: unknown): FaktErgebnis {
  if (requirementType !== 'visa') return { ok: false, reason: 'requirement_type_mismatch' }
  const gelesen = regulierungsAnwendbarkeitVisaOptionLesen(wert)
  if (!gelesen.ok) return { ok: false, reason: faktGrund(gelesen.reason) }
  return { ok: true, fact: gelesen.wert }
}

function aufenthaltLesen(wert: unknown): FaktErgebnis {
  const satz = datensatz(wert)
  if (!satz || !hatGenau(satz, ['kind', 'perVisit', 'rollingWindow', 'initialGrant', 'extension', 'borderDiscretion'])) {
    return { ok: false, reason: 'invalid_fact' }
  }
  if (satz.kind !== 'stay_limit') return { ok: false, reason: 'invalid_fact_kind' }
  if (!istText(satz.borderDiscretion, GRENZ_ERMESSEN)) return { ok: false, reason: 'invalid_fact' }
  const perVisit = satz.perVisit === null ? null : dauerLesen(satz.perVisit)
  if (satz.perVisit !== null && !perVisit) return { ok: false, reason: 'invalid_fact' }
  const initialGrant = satz.initialGrant === null ? null : dauerLesen(satz.initialGrant)
  if (satz.initialGrant !== null && !initialGrant) return { ok: false, reason: 'invalid_fact' }

  let rollingWindow: RegelAufenthalt['rollingWindow'] = null
  if (satz.rollingWindow !== null) {
    const fenster = datensatz(satz.rollingWindow)
    if (!fenster || !hatGenau(fenster, ['maximum', 'within'])) return { ok: false, reason: 'invalid_fact' }
    const maximum = dauerLesen(fenster.maximum)
    const within = dauerLesen(fenster.within)
    if (!maximum || !within) return { ok: false, reason: 'invalid_fact' }
    if (maximum.unit === within.unit && within.value <= maximum.value) return { ok: false, reason: 'invalid_fact' }
    rollingWindow = { maximum, within }
  }

  let extension: RegelAufenthalt['extension'] = null
  if (satz.extension !== null) {
    const ausweitung = datensatz(satz.extension)
    if (!ausweitung || !hatGenau(ausweitung, ['requiresApplication', 'maximumTotal'])) {
      return { ok: false, reason: 'invalid_fact' }
    }
    if (typeof ausweitung.requiresApplication !== 'boolean') return { ok: false, reason: 'invalid_fact' }
    const maximumTotal = dauerLesen(ausweitung.maximumTotal)
    if (!maximumTotal) return { ok: false, reason: 'invalid_fact' }
    extension = { requiresApplication: ausweitung.requiresApplication, maximumTotal }
  }

  if (!perVisit && !rollingWindow && !initialGrant && !extension) return { ok: false, reason: 'invalid_fact' }
  return {
    ok: true,
    fact: {
      kind: 'stay_limit',
      perVisit,
      rollingWindow,
      initialGrant,
      extension,
      borderDiscretion: satz.borderDiscretion,
    },
  }
}

function passLesen(requirementType: OfficialRequirementType, wert: unknown): FaktErgebnis {
  if (requirementType !== 'passport_validity') return { ok: false, reason: 'requirement_type_mismatch' }
  const satz = datensatz(wert)
  if (!satz || !nurBekannteSchluessel(satz, ['kind', 'semantics', 'duration'])) return { ok: false, reason: 'unexpected_fields' }
  if (!('kind' in satz) || !('semantics' in satz)) return { ok: false, reason: 'invalid_fact' }
  if (satz.kind !== 'passport_validity') return { ok: false, reason: 'invalid_fact_kind' }
  if (!istText(satz.semantics, PASS_SEMANTIK)) return { ok: false, reason: 'invalid_fact' }
  const ohneDauer = istText(satz.semantics, PASS_OHNE_DAUER)
  if (ohneDauer) {
    if ('duration' in satz && satz.duration !== null) return { ok: false, reason: 'invalid_fact' }
    return { ok: true, fact: { kind: 'passport_validity', semantics: satz.semantics, duration: null } }
  }
  const duration = dauerLesen(satz.duration)
  if (!duration) return { ok: false, reason: 'invalid_fact' }
  return { ok: true, fact: { kind: 'passport_validity', semantics: satz.semantics, duration } }
}

function leereSeitenLesen(requirementType: OfficialRequirementType, wert: unknown): FaktErgebnis {
  if (requirementType !== 'blank_passport_pages') return { ok: false, reason: 'requirement_type_mismatch' }
  const satz = datensatz(wert)
  if (!satz || !hatGenau(satz, ['kind', 'minimumPages'])) return { ok: false, reason: 'invalid_fact' }
  if (satz.kind !== 'blank_passport_pages') return { ok: false, reason: 'invalid_fact_kind' }
  if (typeof satz.minimumPages !== 'number' || !Number.isInteger(satz.minimumPages)) {
    return { ok: false, reason: 'invalid_fact' }
  }
  if (satz.minimumPages < LEERE_SEITEN_MIN || satz.minimumPages > LEERE_SEITEN_MAX) {
    return { ok: false, reason: 'invalid_fact' }
  }
  return { ok: true, fact: { kind: 'blank_passport_pages', minimumPages: satz.minimumPages } }
}

function flughaefenLesen(wert: unknown): readonly string[] | null | undefined {
  if (wert === null) return null
  if (!Array.isArray(wert) || wert.length === 0) return undefined
  const codes: string[] = []
  for (const eintrag of wert) {
    if (typeof eintrag !== 'string' || !IATA_FORM.test(eintrag)) return undefined
    if (!codes.includes(eintrag)) codes.push(eintrag)
  }
  codes.sort()
  return codes
}

function transitPfadLesen(wert: unknown): RegelTransitPfad | null {
  const satz = datensatz(wert)
  const schluessel = [
    'crossesBorderControl',
    'leavesTransitArea',
    'transitAirportCodes',
    'maxTransitDurationMinutes',
    'arrivalMode',
    'departureMode',
    'thirdCountryRequired',
    'sameFlightRequired',
    'onwardTicketRequired',
  ]
  if (!satz || !hatGenau(satz, schluessel)) return null
  for (const feld of TRANSIT_BOOL) {
    if (!istBoolOderNull(satz[feld])) return null
  }
  const codes = flughaefenLesen(satz.transitAirportCodes)
  if (codes === undefined) return null
  let minuten: number | null = null
  if (satz.maxTransitDurationMinutes !== null) {
    if (
      typeof satz.maxTransitDurationMinutes !== 'number' ||
      !Number.isInteger(satz.maxTransitDurationMinutes) ||
      satz.maxTransitDurationMinutes < 1 ||
      satz.maxTransitDurationMinutes > REGEL_TRANSIT_MINUTEN_MAX
    ) {
      return null
    }
    minuten = satz.maxTransitDurationMinutes
  }
  if (satz.arrivalMode !== null && !istText(satz.arrivalMode, TRANSIT_MODUS)) return null
  if (satz.departureMode !== null && !istText(satz.departureMode, TRANSIT_MODUS)) return null
  const pfad: RegelTransitPfad = {
    crossesBorderControl: satz.crossesBorderControl as boolean | null,
    leavesTransitArea: satz.leavesTransitArea as boolean | null,
    transitAirportCodes: codes,
    maxTransitDurationMinutes: minuten,
    arrivalMode: satz.arrivalMode as RegelTransitPfad['arrivalMode'],
    departureMode: satz.departureMode as RegelTransitPfad['departureMode'],
    thirdCountryRequired: satz.thirdCountryRequired as boolean | null,
    sameFlightRequired: satz.sameFlightRequired as boolean | null,
    onwardTicketRequired: satz.onwardTicketRequired as boolean | null,
  }
  const hatBedingung =
    TRANSIT_BOOL.some((feld) => pfad[feld] !== null) ||
    (pfad.transitAirportCodes?.length ?? 0) > 0 ||
    pfad.maxTransitDurationMinutes !== null ||
    pfad.arrivalMode !== null ||
    pfad.departureMode !== null
  return hatBedingung ? pfad : null
}

function transitLesen(requirementType: OfficialRequirementType, wert: unknown): FaktErgebnis {
  if (requirementType !== 'transit') return { ok: false, reason: 'requirement_type_mismatch' }
  const satz = datensatz(wert)
  if (!satz || !hatGenau(satz, ['kind', 'paths'])) return { ok: false, reason: 'invalid_fact' }
  if (satz.kind !== 'transit_conditions') return { ok: false, reason: 'invalid_fact_kind' }
  if (!Array.isArray(satz.paths) || satz.paths.length === 0 || satz.paths.length > TRANSIT_PFADE_MAX) {
    return { ok: false, reason: 'invalid_fact' }
  }
  const paths: RegelTransitPfad[] = []
  const gesehen = new Set<string>()
  for (const eintrag of satz.paths) {
    const pfad = transitPfadLesen(eintrag)
    if (!pfad) return { ok: false, reason: 'invalid_fact' }
    const text = JSON.stringify(pfad)
    if (gesehen.has(text)) continue
    gesehen.add(text)
    paths.push(pfad)
  }
  paths.sort((links, rechts) => {
    const a = JSON.stringify(links)
    const b = JSON.stringify(rechts)
    return a < b ? -1 : a > b ? 1 : 0
  })
  return { ok: true, fact: { kind: 'transit_conditions', paths } }
}

function amtsaktionLesen(
  requirementType: OfficialRequirementType,
  wert: unknown,
  registry: QuellenRegistry,
): { ok: true; action: RegelAmtsaktion } | { ok: false; reason: RegelClaimFehler } {
  const satz = datensatz(wert)
  if (!satz || !hatGenau(satz, ['actionSourceId', 'purpose', 'href', 'visaMode'])) {
    return { ok: false, reason: 'invalid_fact' }
  }
  if (typeof satz.actionSourceId !== 'string' || !QUELLEN_ID.test(satz.actionSourceId)) {
    return { ok: false, reason: 'invalid_fact' }
  }
  if (!istText(satz.purpose, OFFICIAL_ACTION_PURPOSES)) return { ok: false, reason: 'invalid_fact' }
  if (requirementType !== 'visa') {
    if (satz.visaMode !== null) return { ok: false, reason: 'visa_mode_forbidden' }
  } else if (satz.visaMode !== null && !visaModusKonkret(satz.visaMode)) {
    return { ok: false, reason: 'invalid_fact' }
  }
  const url = quellenUrlAufloesen(registry, satz.href)
  if (!url.ok) return url
  if (url.source.sourceClass !== 'official_authority') return { ok: false, reason: 'provider_action_forbidden' }
  if (url.source.sourceId !== satz.actionSourceId) return { ok: false, reason: 'action_source_mismatch' }
  return {
    ok: true,
    action: {
      actionSourceId: url.source.sourceId,
      purpose: satz.purpose,
      href: url.canonicalUrl,
      visaMode: requirementType === 'visa' ? visaModusKonkret(satz.visaMode) : null,
    },
  }
}

function amtshandlungenLesen(
  requirementType: OfficialRequirementType,
  wert: unknown,
  registry: QuellenRegistry,
): FaktErgebnis {
  const satz = datensatz(wert)
  if (!satz || !hatGenau(satz, ['kind', 'actions'])) return { ok: false, reason: 'invalid_fact' }
  if (satz.kind !== 'official_actions') return { ok: false, reason: 'invalid_fact_kind' }
  if (!Array.isArray(satz.actions) || satz.actions.length === 0 || satz.actions.length > AMTSHANDLUNGEN_MAX) {
    return { ok: false, reason: 'invalid_fact' }
  }
  const actions: RegelAmtsaktion[] = []
  const gesehen = new Set<string>()
  for (const eintrag of satz.actions) {
    const aktion = amtsaktionLesen(requirementType, eintrag, registry)
    if (!aktion.ok) return aktion
    const text = JSON.stringify(aktion.action)
    if (gesehen.has(text)) continue
    gesehen.add(text)
    actions.push(aktion.action)
  }
  actions.sort((links, rechts) => {
    const a = `${links.actionSourceId}|${links.purpose}|${links.href}|${links.visaMode ?? ''}`
    const b = `${rechts.actionSourceId}|${rechts.purpose}|${rechts.href}|${rechts.visaMode ?? ''}`
    return a < b ? -1 : a > b ? 1 : 0
  })
  return { ok: true, fact: { kind: 'official_actions', actions } }
}

function zeitregelSchluesselOk(wert: unknown): boolean {
  const satz = datensatz(wert)
  if (!satz || !nurBekannteSchluessel(satz, ['kind', 'availableFrom', 'dueBy'])) return false
  if (satz.availableFrom != null && !nurBekannteSchluessel(satz.availableFrom, ['anchor', 'relation', 'offsetMinutes'])) {
    return false
  }
  if (satz.dueBy != null && !nurBekannteSchluessel(satz.dueBy, ['anchor', 'relation', 'offsetMinutes', 'semantics'])) {
    return false
  }
  return true
}

function zeitregelLesen(wert: unknown): FaktErgebnis {
  const satz = datensatz(wert)
  if (!satz || !hatGenau(satz, ['kind', 'rule'])) return { ok: false, reason: 'invalid_fact' }
  if (satz.kind !== 'temporal_rule') return { ok: false, reason: 'invalid_fact_kind' }
  if (!zeitregelSchluesselOk(satz.rule)) return { ok: false, reason: 'unexpected_fields' }
  const rule = temporalRuleLesen(satz.rule)
  if (!rule) return { ok: false, reason: 'invalid_fact' }
  return { ok: true, fact: { kind: 'temporal_rule', rule } }
}

function regelFaktLesen(
  art: RegelFaktArt,
  requirementType: OfficialRequirementType,
  wert: unknown,
  registry: QuellenRegistry,
): FaktErgebnis {
  if (personenkennung(wert)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const satz = datensatz(wert)
  if (!satz || satz.kind !== art) return { ok: false, reason: 'invalid_fact_kind' }
  if (art === 'requirement_effect') return wirkungLesen(requirementType, wert)
  if (art === 'visa_options') return visaOptionenLesen(requirementType, wert)
  if (art === 'stay_limit') return aufenthaltLesen(wert)
  if (art === 'passport_validity') return passLesen(requirementType, wert)
  if (art === 'blank_passport_pages') return leereSeitenLesen(requirementType, wert)
  if (art === 'transit_conditions') return transitLesen(requirementType, wert)
  if (art === 'official_actions') return amtshandlungenLesen(requirementType, wert, registry)
  return zeitregelLesen(wert)
}

/**
 * Kanonische Faktprüfung ohne Annahme.
 * Dieselbe private Lesart wie `regelFaktLesen`. Kein zweiter Parser.
 * Der Extraktor-Rahmen darf nur diese Funktion benutzen.
 */
export function regelFaktKanonischLesen(
  art: RegelFaktArt, requirementType: OfficialRequirementType, wert: unknown, registry: QuellenRegistry,
): FaktErgebnis
export function regelFaktKanonischLesen(
  art: RegelFaktArt, requirementType: OfficialRequirementType, wert: unknown, registry: QuellenRegistry,
  vertrag: RegelLeseVertragV2,
): FaktErgebnisV2
export function regelFaktKanonischLesen(
  art: RegelFaktArt, requirementType: OfficialRequirementType, wert: unknown, registry: QuellenRegistry,
  vertrag?: RegelLeseVertragV2,
): FaktErgebnis | FaktErgebnisV2 {
  // Bestehende Registry-/Acceptance-Aufrufer wählen weiterhin ausschließlich
  // legacy/v1. V2 wird nur ausdrücklich am reinen kanonischen Leser angefordert.
  // Dieser Parameter ist keine Code-owned Extractor-Pin oder Annahmeautorität.
  if (vertrag !== undefined) return regelFaktV2Lesen(art, requirementType, wert, vertrag)
  return regelFaktLesen(art, requirementType, wert, registry)
}

function qualitaetLesen(wert: unknown): RegelEvidenceQualitaet | null {
  return istText(wert, REGEL_EVIDENCE_QUALITAETEN) ? wert : null
}

function artLesen(wert: unknown): RegelFaktArt | null {
  return istText(wert, REGEL_FAKT_ARTEN) ? wert : null
}

/**
 * Forschungskanal. Der Vorschlag wird nur als Form geprüft.
 * `research_gap` trägt keinen Vorschlag und wird nie zu Official Truth.
 */
export function regelKandidatErstellen(eingabe: unknown, registry: QuellenRegistry): RegelKandidatErgebnis {
  if (personenkennung(eingabe)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const satz = datensatz(eingabe)
  if (!satz) return { ok: false, reason: 'invalid_fact' }
  const erlaubt = ['scope', 'factKind', 'evidenceQuality', 'supportVersionIds', 'proposal', 'lifecycle', 'validationState', 'key']
  const erforderlich = ['scope', 'factKind', 'evidenceQuality', 'supportVersionIds', 'proposal']
  if (!nurBekannteSchluessel(satz, erlaubt) || erforderlich.some((schluessel) => !(schluessel in satz))) {
    return { ok: false, reason: 'unexpected_fields' }
  }
  if ('lifecycle' in satz && satz.lifecycle !== 'candidate') return { ok: false, reason: 'invalid_fact' }
  if ('validationState' in satz && satz.validationState !== 'pending') return { ok: false, reason: 'invalid_fact' }
  const scope = regelScopeAusEvidenceScope(satz.scope)
  if (!scope.ok) return scope
  if ('key' in satz && satz.key !== scope.key) return { ok: false, reason: 'scope_mismatch' }
  const factKind = artLesen(satz.factKind)
  if (!factKind) return { ok: false, reason: 'invalid_fact_kind' }
  const evidenceQuality = qualitaetLesen(satz.evidenceQuality)
  if (!evidenceQuality) return { ok: false, reason: 'invalid_evidence_quality' }
  const support = supportLesen(satz.supportVersionIds)
  if (!support.ok) return support
  if (evidenceQuality === 'explicit_primary_statement' && support.ids.length < 1) {
    return { ok: false, reason: 'insufficient_support' }
  }
  if (evidenceQuality === 'composed_from_multiple_primary_sources' && support.ids.length < 2) {
    return { ok: false, reason: 'insufficient_support' }
  }
  if (evidenceQuality === 'research_gap' && satz.proposal !== null) {
    return { ok: false, reason: 'research_gap_proposal_forbidden' }
  }
  let proposal: RegelFakt | null = null
  if (satz.proposal !== null) {
    const fakt = regelFaktLesen(factKind, scope.scope.requirementType, satz.proposal, registry)
    if (!fakt.ok) return fakt
    proposal = fakt.fact
  }
  const kandidat: RegelKandidat = {
    lifecycle: 'candidate',
    validationState: 'pending',
    scope: scope.scope,
    key: scope.key,
    factKind,
    evidenceQuality,
    supportVersionIds: support.ids,
    proposal,
  }
  return { ok: true, kandidat: einfrieren(kandidat) }
}

type ZweigZitat = {
  supportVersionIds: readonly string[]
  when: { kind: 'otherwise' } | { kind: 'expression'; expression: RegulierungsAusdruck }
}

/**
 * Schema-1-Zweige dürfen nur die schon neu bewiesenen Claim-Stützen zitieren.
 * Die Prüfung erfindet keine Evidence-Id und ersetzt keine ausgelassene Atom-Stütze.
 */
function atomePruefen(ausdruck: RegulierungsAusdruck, zweigIds: ReadonlySet<string>): 'support_mismatch' | null {
  switch (ausdruck.op) {
    case 'atomic': {
      const ids = ausdruck.supportVersionIds
      if (!ids) return null
      if (ids.length === 0) return 'support_mismatch'
      for (const id of ids) {
        if (!zweigIds.has(id)) return 'support_mismatch'
      }
      return null
    }
    case 'not':
      return atomePruefen(ausdruck.operand, zweigIds)
    case 'all':
    case 'any': {
      for (const operand of ausdruck.operands) {
        const fehler = atomePruefen(operand, zweigIds)
        if (fehler) return fehler
      }
      return null
    }
    default: {
      const unerreichbar: never = ausdruck
      return unerreichbar
    }
  }
}

function verzweigteZitate(fact: RegelFakt): readonly ZweigZitat[] | null {
  if (fact.kind === 'requirement_effect' && 'applicability' in fact && fact.applicability.kind === 'branches') {
    return fact.applicability.branches
  }
  if (fact.kind === 'visa_options' && 'schema' in fact) {
    const gesammelt: ZweigZitat[] = []
    for (const option of fact.options) {
      if (!('applicability' in option) || option.applicability.kind !== 'branches') continue
      gesammelt.push(...option.applicability.branches)
    }
    return gesammelt.length > 0 ? gesammelt : null
  }
  return null
}

function bedingungsHerkunftPruefen(
  fact: RegelFakt,
  evidenceQuality: AnnehmbareQualitaet,
  claimIds: readonly string[],
): 'support_mismatch' | 'condition_provenance_ambiguous' | null {
  const zweige = verzweigteZitate(fact)
  if (!zweige) return null
  if (evidenceQuality === 'composed_from_multiple_primary_sources') return 'condition_provenance_ambiguous'

  const erlaubt = new Set(claimIds)
  const vereinigung = new Set<string>()
  for (const zweig of zweige) {
    const ids = zweig.supportVersionIds
    if (ids.length === 0) return 'support_mismatch'
    for (const id of ids) {
      if (!erlaubt.has(id)) return 'support_mismatch'
      vereinigung.add(id)
    }
    if (zweig.when.kind === 'expression') {
      const atom = atomePruefen(zweig.when.expression, new Set(ids))
      if (atom) return atom
    }
  }
  if (vereinigung.size !== claimIds.length || claimIds.some((id) => !vereinigung.has(id))) {
    return 'support_mismatch'
  }
  if (claimIds.length !== 1) return 'support_mismatch'
  const einzige = claimIds[0]!
  for (const zweig of zweige) {
    if (zweig.supportVersionIds.length !== 1 || zweig.supportVersionIds[0] !== einzige) return 'support_mismatch'
  }
  return null
}

function versionVertrauen(wert: unknown, registry: QuellenRegistry): EvidenceVersion | null {
  if (!datensatz(wert)) return null
  return akzeptierteEvidenceLesen(wert as EvidenceVersion, registry)
}

/**
 * Annahme. `trustedRuleFact` ist die einzige Wahrheitsquelle für den Fakt.
 * Der Kandidatenvorschlag wird nicht gelesen und nicht kopiert.
 */
export function regelKandidatAkzeptieren(eingabe: unknown): RegelAnnahmeErgebnis {
  if (personenkennung(eingabe)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const satz = datensatz(eingabe)
  if (!satz || !hatGenau(satz, ['kandidat', 'trustedRuleFact', 'evidenceVersions', 'registry'])) {
    return { ok: false, reason: 'unexpected_fields' }
  }
  const registry = registryLesen(satz.registry)
  if (!registry) return { ok: false, reason: 'invalid_fact' }
  const erzeugt = regelKandidatErstellen(satz.kandidat, registry)
  if (!erzeugt.ok) return erzeugt
  const entwurf = erzeugt.kandidat
  if (!istText(entwurf.evidenceQuality, ANNEHMBARE_QUALITAET)) {
    return { ok: false, reason: 'quality_not_acceptable' }
  }
  if (!Array.isArray(satz.evidenceVersions)) return { ok: false, reason: 'invalid_support' }

  const vertraut: EvidenceVersion[] = []
  const geseheneIds = new Set<string>()
  for (const eintrag of satz.evidenceVersions) {
    const version = versionVertrauen(eintrag, registry)
    if (!version) return { ok: false, reason: 'evidence_not_accepted' }
    if (geseheneIds.has(version.versionId)) return { ok: false, reason: 'support_mismatch' }
    geseheneIds.add(version.versionId)
    vertraut.push(version)
  }
  const ids = vertraut.map((version) => version.versionId).sort()
  if (ids.length !== entwurf.supportVersionIds.length || ids.some((id, index) => id !== entwurf.supportVersionIds[index])) {
    return { ok: false, reason: 'support_mismatch' }
  }

  for (const version of vertraut) {
    const scope = regelScopeAusEvidenceScope(version.scope)
    if (!scope.ok || scope.key !== entwurf.key) return { ok: false, reason: 'scope_mismatch' }
  }
  if (vertraut.some((version) => version.sourceClass !== 'official_authority')) {
    return { ok: false, reason: 'primary_source_required' }
  }
  const items = readDistinctContentItemRefs(vertraut.map(({ sourceId, contentItemId }) => ({ sourceId, contentItemId })))
  if (!items.ok) return { ok: false, reason: vertraut.length === 2 ? 'same_content_item_composition' : 'support_mismatch' }
  if (entwurf.evidenceQuality === 'explicit_primary_statement' && vertraut.length !== 1) {
    return { ok: false, reason: 'insufficient_support' }
  }
  if (entwurf.evidenceQuality === 'composed_from_multiple_primary_sources') {
    if (vertraut.length < 2) return { ok: false, reason: 'insufficient_support' }
  }

  const fakt = regelFaktLesen(entwurf.factKind, entwurf.scope.requirementType, satz.trustedRuleFact, registry)
  if (!fakt.ok) return fakt
  const herkunft = bedingungsHerkunftPruefen(fakt.fact, entwurf.evidenceQuality, entwurf.supportVersionIds)
  if (herkunft) return { ok: false, reason: herkunft }
  const claim: AkzeptierteRegelClaim = {
    lifecycle: 'accepted',
    validationState: 'valid',
    scope: entwurf.scope,
    key: entwurf.key,
    factKind: entwurf.factKind,
    evidenceQuality: entwurf.evidenceQuality,
    supportVersionIds: entwurf.supportVersionIds,
    fact: fakt.fact,
  }
  return { ok: true, claim: einfrieren(claim) }
}

export type StayOutcomeV2 = {
  perVisit: StayQuantityV2 | null
  initialGrant: { quantity: StayQuantityV2; event: 'permission_to_enter_granted' } | null
  extension: {
    requiresApplication: boolean
    maximumTotal: StayQuantityV2
    applicationDeadline: EventDeadlineV2 | null
    authority: { countryCode: string; role: 'immigration_authority' } | null
  } | null
  borderDiscretion: (typeof GRENZ_ERMESSEN)[number]
}
export type QualifiedFactV2<K extends 'stay_limit' | 'temporal_rule', T> =
  | { kind: K; schema: 2; applicability: { schema: 2; kind: 'unconditional' }; outcome: T }
  | { kind: K; schema: 2; applicability: Extract<RegulierungsAnwendbarkeitV2<T>, { kind: 'branches' }> }
export type RegelFaktV2 = Schema2WirkungsFakt | Schema2VisaOptionenFakt
  | QualifiedFactV2<'stay_limit', StayOutcomeV2> | QualifiedFactV2<'temporal_rule', EventDeadlineV2>
export type RegelLeseVertragV2 = { schema: 2; jurisdictionCountryCode: string }
type FaktErgebnisV2 = { ok: true; fact: RegelFaktV2 } | { ok: false; reason: V2BlockReason | 'requirement_type_mismatch' }

function deadlineImLandV2(roh: unknown, land: string): V2LeseErgebnis<EventDeadlineV2> {
  const gelesen = eventDeadlineV2Lesen(roh)
  if (!gelesen.ok) return gelesen
  return gelesen.wert.reference.countryCode === land ? gelesen : { ok: false, reason: 'scope_mismatch' }
}

function stayOutcomeV2Lesen(roh: unknown, land: string): V2LeseErgebnis<StayOutcomeV2> {
  const s = datensatz(roh)
  if (!s || !hatGenau(s, ['perVisit', 'initialGrant', 'extension', 'borderDiscretion']) || !istText(s.borderDiscretion, GRENZ_ERMESSEN)) return { ok: false, reason: 'invalid_fact' }
  let perVisit: StayQuantityV2 | null = null
  if (s.perVisit !== null) {
    const q = stayQuantityV2Lesen(s.perVisit)
    if (!q.ok) return q
    perVisit = q.wert
  }
  let initialGrant: StayOutcomeV2['initialGrant'] = null
  if (s.initialGrant !== null) {
    const i = datensatz(s.initialGrant)
    if (!i || !hatGenau(i, ['quantity', 'event']) || i.event !== 'permission_to_enter_granted') return { ok: false, reason: 'invalid_fact' }
    const q = stayQuantityV2Lesen(i.quantity)
    if (!q.ok) return q
    initialGrant = { quantity: q.wert, event: 'permission_to_enter_granted' }
  }
  let extension: StayOutcomeV2['extension'] = null
  if (s.extension !== null) {
    const e = datensatz(s.extension)
    if (!e || !hatGenau(e, ['requiresApplication', 'maximumTotal', 'applicationDeadline', 'authority']) || typeof e.requiresApplication !== 'boolean') return { ok: false, reason: 'invalid_fact' }
    const q = stayQuantityV2Lesen(e.maximumTotal)
    if (!q.ok) return q
    let deadline: EventDeadlineV2 | null = null
    if (e.applicationDeadline !== null) {
      if (!e.requiresApplication) return { ok: false, reason: 'invalid_fact' }
      const d = deadlineImLandV2(e.applicationDeadline, land)
      if (!d.ok) return d
      deadline = d.wert
    }
    let authority: NonNullable<StayOutcomeV2['extension']>['authority'] = null
    if (e.authority !== null) {
      const a = datensatz(e.authority), country = landescodeLesen(a?.countryCode)
      if (!a || !hatGenau(a, ['countryCode', 'role']) || a.role !== 'immigration_authority' || !country) return { ok: false, reason: 'invalid_fact' }
      if (country !== land) return { ok: false, reason: 'scope_mismatch' }
      authority = { countryCode: country, role: 'immigration_authority' }
    }
    for (const base of [perVisit, initialGrant?.quantity]) {
      if (base && base.unit === q.wert.unit && base.value > q.wert.value) return { ok: false, reason: 'invalid_fact' }
    }
    extension = { requiresApplication: e.requiresApplication, maximumTotal: q.wert, applicationDeadline: deadline, authority }
  }
  if (!perVisit && !initialGrant && !extension) return { ok: false, reason: 'invalid_fact' }
  return { ok: true, wert: { perVisit, initialGrant, extension, borderDiscretion: s.borderDiscretion } }
}

function qualifiedFactV2Lesen<K extends 'stay_limit' | 'temporal_rule', T>(
  s: Record<string, unknown>, kind: K, outLesen: (roh: unknown) => V2LeseErgebnis<T>,
): V2LeseErgebnis<QualifiedFactV2<K, T>> {
  const a = regulierungsAnwendbarkeitV2Lesen(s.applicability, outLesen)
  if (!a.ok) return a
  if (a.wert.kind === 'branches') {
    if ('outcome' in s) return { ok: false, reason: 'mixed_outcome' }
    if (!hatGenau(s, ['schema', 'kind', 'applicability'])) return { ok: false, reason: 'invalid_fact' }
    return { ok: true, wert: { kind, schema: 2, applicability: a.wert } }
  }
  if (!hatGenau(s, ['schema', 'kind', 'applicability', 'outcome'])) return { ok: false, reason: 'invalid_fact' }
  const o = outLesen(s.outcome)
  return o.ok ? { ok: true, wert: { kind, schema: 2, applicability: a.wert, outcome: o.wert } } : o
}

function regelFaktV2Lesen(art: RegelFaktArt, typ: OfficialRequirementType, roh: unknown, vertrag: RegelLeseVertragV2): FaktErgebnisV2 {
  const start = schema2DatenPruefen(roh, vertrag)
  if (start) return { ok: false, reason: start }
  const s = datensatz(roh), v = datensatz(vertrag)
  if (!s || !v || !hatGenau(v, ['schema', 'jurisdictionCountryCode'])) return { ok: false, reason: 'invalid_fact' }
  if (s.schema !== 2 || v.schema !== 2) return { ok: false, reason: 'unsupported_version' }
  const land = landescodeLesen(v.jurisdictionCountryCode)
  if (!land || s.kind !== art) return { ok: false, reason: 'invalid_fact' }
  let r: V2LeseErgebnis<RegelFaktV2>
  if (art === 'requirement_effect') r = regulierungsWirkungsFaktV2Lesen(s, typ)
  else if (art === 'visa_options') {
    if (typ !== 'visa') return { ok: false, reason: 'requirement_type_mismatch' }
    r = regulierungsVisaFaktV2Lesen(s)
  } else if (art === 'stay_limit') r = qualifiedFactV2Lesen(s, 'stay_limit', (x) => stayOutcomeV2Lesen(x, land))
  else if (art === 'temporal_rule') r = qualifiedFactV2Lesen(s, 'temporal_rule', (x) => deadlineImLandV2(x, land))
  else return { ok: false, reason: 'invalid_fact' }
  if (!r.ok) return r
  // Die Gesamtmenge eines späteren Claims passt weiter in REGEL_SUPPORT_MAX.
  const ids = new Set<string>()
  function sammeln(x: unknown): void {
    if (!x || typeof x !== 'object') return
    if (Array.isArray(x)) { x.forEach(sammeln); return }
    for (const [key, value] of Object.entries(x)) {
      if (key === 'supportVersionIds' && Array.isArray(value)) value.forEach((id: string) => ids.add(id))
      else sammeln(value)
    }
  }
  sammeln(r.wert)
  if (ids.size > REGEL_SUPPORT_MAX) return { ok: false, reason: 'support_bound_exceeded' }
  return { ok: true, fact: r.wert }
}

/** Vollständiger bereits kanonisch gelesener Fakt, einschließlich unbedingtem
 * Ausgang. Kein Claim-Key, kein Acceptance-Nachweis, kein persönlicher Kontext. */
export function regelFaktV2Fingerprint(fact: RegelFaktV2, requirementType: OfficialRequirementType, vertrag: RegelLeseVertragV2): string {
  const gelesen = regelFaktV2Lesen(fact.kind, requirementType, fact, vertrag)
  if (!gelesen.ok) throw new Error(gelesen.reason)
  return `official-rule-fact:v2:${sha256Hex(schema2Kanonisch(gelesen.fact))}`
}
