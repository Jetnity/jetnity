// lib/readiness/regulierungs-anwendbarkeit.ts
//
// Reine, schlafende Anwendbarkeit für regulatorische Fakten.
// Schema 1. Kein Netz, kein Speicher, keine Annahme, keine Extraktion.
// Personen- und Rechtskontext bleibt im Prozess. Der Entscheidungsverlauf
// nennt Art, Herkunft und Polarität, nie einen Personenwert.

import { landescodeLesen } from '@/lib/readiness/domain'
import { sha256Hex } from '@/lib/readiness/digest'
import {
  OFFICIAL_VISA_MODES,
  visaResultUndModusWidersprechen,
  type OfficialVisaMode,
} from '@/lib/readiness/official'
import { OFFICIAL_REQUIREMENT_TYPES, type OfficialRequirementType } from '@/types/trips'

export const REGULIERUNGS_SCHEMA = 1 as const
export const REGULIERUNGS_TIEFE_MAX = 4
export const REGULIERUNGS_KNOTEN_MAX = 16
export const REGULIERUNGS_OPERANDE_MAX = 8
export const REGULIERUNGS_ZWEIGE_MAX = 8
export const REGULIERUNGS_ALTER_MAX = 120
export const REGULIERUNGS_GRUPPE_SCHWELLE_MAX = 50
export const REGULIERUNGS_GRUPPE_KONTEXT_MAX = 500

const SUPPORT_MAX = 8
const VISA_OPTIONEN_MAX = 4
const SUPPORT_ID = /^ev1_[a-f0-9]{32}$/
const ZWEIG_ID = /^[a-z][a-z0-9_]{0,31}$/
const FINGERPRINT_PRAEFIX = 'rule-applicability:v1:'

export const ZIEL_ERLAUBNIS_KLASSEN = [
  'entry_clearance',
  'permission_to_enter_or_stay',
  'electronic_travel_authorization',
  'visa',
  'residence_permit',
] as const
export type ZielErlaubnisKlasse = (typeof ZIEL_ERLAUBNIS_KLASSEN)[number]

export const REISEZWECKE = [
  'visitor',
  'business',
  'study',
  'medical',
  'transit',
  'work',
  'creative_worker',
  'other',
] as const
export type Reisezweck = (typeof REISEZWECKE)[number]

export const DOKUMENT_KLASSEN = [
  'ordinary',
  'diplomatic',
  'official',
  'emergency',
  'refugee_travel_document',
  'laissez_passer',
] as const
export type DokumentKlasse = (typeof DOKUMENT_KLASSEN)[number]

export const NATIONALITAETS_STATUS_KLASSEN = [
  'british_overseas_territory_citizen',
  'british_national_overseas',
] as const
export type NationalitaetsStatusKlasse = (typeof NATIONALITAETS_STATUS_KLASSEN)[number]

export const INSTITUTIONS_STATUS = [
  'french_ministry_of_education_school',
  'confirmed_german_school',
] as const
export type InstitutionsStatus = (typeof INSTITUTIONS_STATUS)[number]

export const REGULIERUNGS_REGIONEN = ['common_travel_area'] as const
export type RegulierungsRegion = (typeof REGULIERUNGS_REGIONEN)[number]

export const REGULIERUNGS_FEHLENDE_FAKTEN = [
  'destination_permission_status',
  'lawful_residence_status',
  'journey_origin',
  'age_on_travel_date',
  'travel_purpose',
  'document_class',
  'nationality_status',
  'school_party_context',
  'credential_citizenship_link',
] as const

export type RegulierungsFehlenderFakt =
  | (typeof REGULIERUNGS_FEHLENDE_FAKTEN)[number]
  | 'nationality'
  | 'document_type'
  | 'document_issuing_country'

export type RegulierungsRegionPin = {
  regionCode: 'common_travel_area'
  version: number
  memberCountryCodes: readonly string[]
  sourceId: string
  sourceContentHash: string
}

export const REGULIERUNGS_REGION_PINS: readonly RegulierungsRegionPin[] = Object.freeze([])

export type RegulierungsPraedikat =
  | {
      kind: 'destination_permission'
      destinationCountryCode: string
      permissionClass: ZielErlaubnisKlasse
      validity: 'valid_on_travel_date'
    }
  | {
      kind: 'lawful_residence'
      countryCode: string
      entitlement: 'entitled_to_reside'
      departure: 'unrestricted' | 'unspecified'
    }
  | {
      kind: 'journey_origin'
      place:
        | { kind: 'country'; countryCode: string }
        | { kind: 'region'; regionCode: RegulierungsRegion }
    }
  | { kind: 'age_on_travel_date'; comparison: 'at_most' | 'at_least'; years: number }
  | { kind: 'travel_purpose'; purpose: Reisezweck }
  | { kind: 'document_class'; documentClass: DokumentKlasse }
  | { kind: 'issuing_country'; countryCode: string }
  | { kind: 'citizenship_includes'; countryCode: string }
  | { kind: 'credential_citizenship_link'; countryCode: string }
  | { kind: 'nationality_status'; status: NationalitaetsStatusKlasse }
  | { kind: 'institution_status'; status: InstitutionsStatus }
  | { kind: 'group_size_at_least'; count: number }
  | { kind: 'group_membership'; role: 'traveller_included' }
  | { kind: 'authority_confirmation'; subject: 'institution_status' }

export type RegulierungsAusdruck =
  | { op: 'atomic'; predicate: RegulierungsPraedikat; supportVersionIds?: readonly string[] }
  | { op: 'all'; operands: readonly RegulierungsAusdruck[] }
  | { op: 'any'; operands: readonly RegulierungsAusdruck[] }
  | { op: 'not'; operand: RegulierungsAusdruck }

export type RegulierungsWenn =
  | { kind: 'expression'; expression: RegulierungsAusdruck }
  | { kind: 'otherwise' }

export type RegulierungsZweig<TAusgang> = {
  id: string
  when: RegulierungsWenn
  outcome: TAusgang
  supportVersionIds: readonly string[]
}

export type WirkungsAusgang = {
  effect: 'required' | 'not_required'
  visaMode: OfficialVisaMode | null
}

export type VisaOptionsAusgang = {
  eligibility: 'allowed' | 'not_allowed'
  mandate: 'mandatory' | 'not_mandatory' | 'unknown'
}

export type RegulierungsAnwendbarkeit<TAusgang> =
  | { schema: 1; kind: 'unconditional' }
  | { schema: 1; kind: 'branches'; branches: readonly RegulierungsZweig<TAusgang>[] }

export type RegulierungsHerkunft = 'user_asserted' | 'account_profile' | 'trip_context'

export type RegulierungsFakt<T> = {
  value: T
  provenance: RegulierungsHerkunft
}

export type RegulierungsKontext = {
  schema: 1
  recordedContextProvenance: 'account_profile' | 'trip_context'
  citizenshipCountryCodes: readonly string[]
  credential: {
    documentType: 'passport' | 'national_id' | 'unknown' | null
    issuingCountryCode: string | null
    relatedCitizenshipCountryCode: string | null
  }
  residenceCountryCode: string | null
  journeyOriginCountryCode: RegulierungsFakt<string> | null
  ageOnTravelDate: RegulierungsFakt<number> | null
  travelPurpose: RegulierungsFakt<Reisezweck> | null
  documentClass: RegulierungsFakt<DokumentKlasse> | null
  destinationPermissions: readonly RegulierungsFakt<{
    destinationCountryCode: string
    permissionClass: ZielErlaubnisKlasse
    validity: 'valid_on_travel_date' | 'not_valid'
  }>[]
  lawfulResidence: readonly RegulierungsFakt<{
    countryCode: string
    entitlement: 'entitled_to_reside' | 'not_entitled'
    departure: 'unrestricted' | 'restricted' | 'unknown'
  }>[]
  nationalityStatuses: readonly RegulierungsFakt<{
    status: NationalitaetsStatusKlasse
    holding: 'held' | 'not_held'
  }>[]
  schoolParty: {
    institutionStatus: RegulierungsFakt<InstitutionsStatus> | null
    groupSize: RegulierungsFakt<number> | null
    travellerIncluded: RegulierungsFakt<boolean> | null
    authorityConfirmed: RegulierungsFakt<boolean> | null
  } | null
}

export type RegulierungsPraedikatArt = RegulierungsPraedikat['kind']

export type RegulierungsAbhaengigkeit = {
  predicateKind: RegulierungsPraedikatArt
  provenance: RegulierungsHerkunft
  polarity: 'true' | 'false'
}

export type RegulierungsEntscheidspur = {
  schema: 1
  dependencies: readonly RegulierungsAbhaengigkeit[]
}

export type RegulierungsAuswertung<TAusgang> =
  | {
      status: 'decided'
      outcome: TAusgang
      binding: 'context_recorded' | 'context_asserted' | null
      decisionTrace: RegulierungsEntscheidspur
      missingFacts: readonly []
      reason: 'unconditional' | 'branch_matched'
    }
  | {
      status: 'insufficient_context'
      outcome: null
      binding: null
      missingFacts: readonly RegulierungsFehlenderFakt[]
      reason:
        | 'predicate_unknown'
        | 'no_applicable_branch'
        | 'branch_conflict'
        | 'legacy_conditional_without_payload'
        | 'region_membership_unpinned'
    }

export type LegacyAnforderungswirkung = {
  kind: 'requirement_effect'
  effect: 'required' | 'not_required'
  visaMode: OfficialVisaMode | null
}

export type LegacyFlachesConditional = {
  kind: 'requirement_effect'
  effect: 'conditional'
  visaMode: OfficialVisaMode | null
}

export type Schema1UnbedingteAnforderungswirkung = {
  kind: 'requirement_effect'
  schema: 1
  applicability: { schema: 1; kind: 'unconditional' }
  effect: 'required' | 'not_required'
  visaMode: OfficialVisaMode | null
}

export type Schema1VerzweigteAnforderungswirkung = {
  kind: 'requirement_effect'
  schema: 1
  applicability: {
    schema: 1
    kind: 'branches'
    branches: readonly RegulierungsZweig<WirkungsAusgang>[]
  }
}

export type AnforderungswirkungFakt =
  | LegacyAnforderungswirkung
  | Schema1UnbedingteAnforderungswirkung
  | Schema1VerzweigteAnforderungswirkung

export type LegacyVisaOption = {
  visaMode: Exclude<OfficialVisaMode, 'unknown'>
  eligibility: 'allowed' | 'not_allowed' | 'unknown'
  mandate: 'mandatory' | 'not_mandatory' | 'unknown'
}

export type LegacyVisaOptionen = {
  kind: 'visa_options'
  options: readonly LegacyVisaOption[]
}

export type Schema1UnbedingteVisaOption = {
  visaMode: Exclude<OfficialVisaMode, 'unknown'>
  eligibility: 'allowed' | 'not_allowed' | 'unknown'
  mandate: 'mandatory' | 'not_mandatory' | 'unknown'
  applicability: { schema: 1; kind: 'unconditional' }
}

export type Schema1VerzweigteVisaOption = {
  visaMode: Exclude<OfficialVisaMode, 'unknown'>
  applicability: {
    schema: 1
    kind: 'branches'
    branches: readonly RegulierungsZweig<VisaOptionsAusgang>[]
  }
}

export type Schema1VisaOptionen = {
  kind: 'visa_options'
  schema: 1
  options: readonly (Schema1UnbedingteVisaOption | Schema1VerzweigteVisaOption)[]
}

export type VisaOptionenFakt = LegacyVisaOptionen | Schema1VisaOptionen

export type VisaOption = LegacyVisaOption | Schema1UnbedingteVisaOption | Schema1VerzweigteVisaOption

export type RegulierungsLesefehler =
  | 'invalid_fact'
  | 'personal_identifier_forbidden'
  | 'provenance_not_authorized'
  | 'context_conflict'
  | 'mixed_outcome'
  | 'depth_exceeded'
  | 'node_bound_exceeded'
  | 'operand_bound_exceeded'
  | 'branch_bound_exceeded'
  | 'support_bound_exceeded'
  | 'invalid_support'
  | 'visa_contradiction'
  | 'visa_mode_forbidden'

export type RegulierungsLeseErgebnis<T> =
  | { ok: true; wert: T }
  | { ok: false; reason: RegulierungsLesefehler }

export type WirkungsLesergebnis =
  | { ok: true; fakt: AnforderungswirkungFakt }
  | {
      ok: false
      reason: 'legacy_conditional_without_payload'
      auswertung: RegulierungsAuswertung<WirkungsAusgang>
    }
  | { ok: false; reason: RegulierungsLesefehler }

export type RegulierungsAusdruckErgebnis = {
  wert: 'true' | 'false' | 'unknown'
  abhaengigkeiten: readonly RegulierungsAbhaengigkeit[]
  fehlendeFakten: readonly RegulierungsFehlenderFakt[]
  grund: 'region_membership_unpinned' | null
}

export type VisaOptionBewertung =
  | { status: 'auswertung'; auswertung: RegulierungsAuswertung<VisaOptionsAusgang> }
  | { status: 'official_unknown'; mandate: 'mandatory' | 'not_mandatory' | 'unknown' }

type Schritt<T> = { ok: true; wert: T } | { ok: false; reason: RegulierungsLesefehler }

type AusdruckIntern = {
  wert: 'true' | 'false' | 'unknown'
  abhaengigkeiten: RegulierungsAbhaengigkeit[]
  fehlende: RegulierungsFehlenderFakt[]
  regionUngepinnt: boolean
}

type ZielErlaubnisWert = {
  destinationCountryCode: string
  permissionClass: ZielErlaubnisKlasse
  validity: 'valid_on_travel_date' | 'not_valid'
}

type WohnsitzWert = {
  countryCode: string
  entitlement: 'entitled_to_reside' | 'not_entitled'
  departure: 'unrestricted' | 'restricted' | 'unknown'
}

type StatusWert = {
  status: NationalitaetsStatusKlasse
  holding: 'held' | 'not_held'
}

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
  'health_record',
  'health',
  'diagnosis',
  'medicalRecord',
  'medical_record',
  'email',
  'fullName',
  'givenName',
  'familyName',
  'phone',
  'scan',
  'documentScan',
  'schoolName',
  'school_name',
  'institutionName',
  'institution_name',
  'permitNumber',
  'permit_number',
  'visaNumber',
  'visa_number',
])

const VERBOTENE_HERKUNFT = new Set(['licensed_provider_confirmed', 'official_document_verified'])
const HERKUNFT_FELDER = new Set(['provenance', 'recordedContextProvenance'])
const NUTZER: readonly RegulierungsHerkunft[] = ['user_asserted']
const REISE_ODER_NUTZER: readonly RegulierungsHerkunft[] = ['user_asserted', 'trip_context']

const KONTEXT_SCHLUESSEL = [
  'schema',
  'recordedContextProvenance',
  'citizenshipCountryCodes',
  'credential',
  'residenceCountryCode',
  'journeyOriginCountryCode',
  'ageOnTravelDate',
  'travelPurpose',
  'documentClass',
  'destinationPermissions',
  'lawfulResidence',
  'nationalityStatuses',
  'schoolParty',
] as const

function nein<R extends RegulierungsLesefehler>(reason: R): { ok: false; reason: R } {
  return { ok: false, reason }
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (typeof wert !== 'object' || wert === null || Array.isArray(wert)) return null
  if (Object.getPrototypeOf(wert) !== Object.prototype) return null
  return wert as Record<string, unknown>
}

function genau(satz: Record<string, unknown>, erwartet: readonly string[]): boolean {
  if (Object.getOwnPropertySymbols(satz).length > 0) return false
  const schluessel = Object.keys(satz)
  if (schluessel.length !== erwartet.length) return false
  return erwartet.every((name) => Object.prototype.hasOwnProperty.call(satz, name))
}

function istText<T extends string>(wert: unknown, liste: readonly T[]): wert is T {
  return typeof wert === 'string' && (liste as readonly string[]).includes(wert)
}

function ganzeZahl(wert: unknown, min: number, max: number): number | null {
  if (typeof wert !== 'number' || !Number.isInteger(wert) || wert < min || wert > max) return null
  return wert
}

function json(wert: unknown): string {
  return JSON.stringify(wert)
}

function dedup<T>(werte: readonly T[]): T[] {
  const aus: T[] = []
  for (const wert of werte) {
    if (!aus.includes(wert)) aus.push(wert)
  }
  return aus
}

function kopie(deps: readonly RegulierungsAbhaengigkeit[]): RegulierungsAbhaengigkeit[] {
  return deps.map((eintrag) => ({
    predicateKind: eintrag.predicateKind,
    provenance: eintrag.provenance,
    polarity: eintrag.polarity,
  }))
}

function enthaeltPersonenSchluessel(wert: unknown, gesehen = new Set<object>()): boolean {
  if (typeof wert !== 'object' || wert === null) return false
  if (gesehen.has(wert)) return false
  gesehen.add(wert)
  if (Array.isArray(wert)) return wert.some((eintrag) => enthaeltPersonenSchluessel(eintrag, gesehen))
  for (const [schluessel, inhalt] of Object.entries(wert)) {
    if (PERSONEN_SCHLUESSEL.has(schluessel)) return true
    if (enthaeltPersonenSchluessel(inhalt, gesehen)) return true
  }
  return false
}

function enthaeltVerboteneHerkunft(wert: unknown, gesehen = new Set<object>()): boolean {
  if (typeof wert !== 'object' || wert === null) return false
  if (gesehen.has(wert)) return false
  gesehen.add(wert)
  if (Array.isArray(wert)) return wert.some((eintrag) => enthaeltVerboteneHerkunft(eintrag, gesehen))
  for (const [schluessel, inhalt] of Object.entries(wert)) {
    if (VERBOTENE_HERKUNFT.has(schluessel)) return true
    if (HERKUNFT_FELDER.has(schluessel) && typeof inhalt === 'string' && VERBOTENE_HERKUNFT.has(inhalt)) {
      return true
    }
    if (enthaeltVerboteneHerkunft(inhalt, gesehen)) return true
  }
  return false
}

function anfang(roh: unknown): RegulierungsLesefehler | null {
  if (enthaeltPersonenSchluessel(roh)) return 'personal_identifier_forbidden'
  if (enthaeltVerboteneHerkunft(roh)) return 'provenance_not_authorized'
  return null
}

function herkunftLesen(wert: unknown): Schritt<RegulierungsHerkunft> {
  if (wert === 'licensed_provider_confirmed' || wert === 'official_document_verified') {
    return nein('provenance_not_authorized')
  }
  if (wert === 'user_asserted' || wert === 'account_profile' || wert === 'trip_context') {
    return { ok: true, wert }
  }
  return nein('invalid_fact')
}

function supportLesen(wert: unknown): Schritt<readonly string[]> {
  if (!Array.isArray(wert)) return nein('invalid_support')
  if (wert.length > SUPPORT_MAX) return nein('support_bound_exceeded')
  const ids: string[] = []
  for (const eintrag of wert) {
    if (typeof eintrag !== 'string' || !SUPPORT_ID.test(eintrag)) return nein('invalid_support')
    if (!ids.includes(eintrag)) ids.push(eintrag)
  }
  ids.sort()
  return { ok: true, wert: ids }
}

function landOderNull(wert: unknown): Schritt<string | null> {
  if (wert === null) return { ok: true, wert: null }
  const code = landescodeLesen(wert)
  if (!code) return nein('invalid_fact')
  return { ok: true, wert: code }
}

function praedikatObjekt(praedikat: RegulierungsPraedikat): Record<string, unknown> {
  switch (praedikat.kind) {
    case 'destination_permission':
      return {
        kind: praedikat.kind,
        destinationCountryCode: praedikat.destinationCountryCode,
        permissionClass: praedikat.permissionClass,
        validity: praedikat.validity,
      }
    case 'lawful_residence':
      return {
        kind: praedikat.kind,
        countryCode: praedikat.countryCode,
        entitlement: praedikat.entitlement,
        departure: praedikat.departure,
      }
    case 'journey_origin':
      if (praedikat.place.kind === 'country') {
        return {
          kind: praedikat.kind,
          place: { kind: 'country', countryCode: praedikat.place.countryCode },
        }
      }
      return {
        kind: praedikat.kind,
        place: { kind: 'region', regionCode: praedikat.place.regionCode },
      }
    case 'age_on_travel_date':
      return { kind: praedikat.kind, comparison: praedikat.comparison, years: praedikat.years }
    case 'travel_purpose':
      return { kind: praedikat.kind, purpose: praedikat.purpose }
    case 'document_class':
      return { kind: praedikat.kind, documentClass: praedikat.documentClass }
    case 'issuing_country':
    case 'citizenship_includes':
    case 'credential_citizenship_link':
      return { kind: praedikat.kind, countryCode: praedikat.countryCode }
    case 'nationality_status':
    case 'institution_status':
      return { kind: praedikat.kind, status: praedikat.status }
    case 'group_size_at_least':
      return { kind: praedikat.kind, count: praedikat.count }
    case 'group_membership':
      return { kind: praedikat.kind, role: praedikat.role }
    case 'authority_confirmation':
      return { kind: praedikat.kind, subject: praedikat.subject }
    default: {
      const nie: never = praedikat
      return nie
    }
  }
}

function ausdruckObjekt(ausdruck: RegulierungsAusdruck): Record<string, unknown> {
  switch (ausdruck.op) {
    case 'atomic': {
      const objekt: Record<string, unknown> = {
        op: 'atomic',
        predicate: praedikatObjekt(ausdruck.predicate),
      }
      if (ausdruck.supportVersionIds && ausdruck.supportVersionIds.length > 0) {
        objekt.supportVersionIds = [...ausdruck.supportVersionIds]
      }
      return objekt
    }
    case 'all':
    case 'any':
      return { op: ausdruck.op, operands: ausdruck.operands.map((operand) => ausdruckObjekt(operand)) }
    case 'not':
      return { op: 'not', operand: ausdruckObjekt(ausdruck.operand) }
    default: {
      const nie: never = ausdruck
      return nie
    }
  }
}

function ausgangObjekt(ausgang: WirkungsAusgang | VisaOptionsAusgang): Record<string, unknown> {
  if ('effect' in ausgang) return { effect: ausgang.effect, visaMode: ausgang.visaMode }
  return { eligibility: ausgang.eligibility, mandate: ausgang.mandate }
}

function anwendbarkeitObjekt<T extends WirkungsAusgang | VisaOptionsAusgang>(
  anwendbarkeit: RegulierungsAnwendbarkeit<T>,
): Record<string, unknown> {
  if (anwendbarkeit.kind === 'unconditional') return { schema: 1, kind: 'unconditional' }
  const zweige = [...anwendbarkeit.branches].sort((links, rechts) =>
    links.id < rechts.id ? -1 : links.id > rechts.id ? 1 : 0,
  )
  return {
    schema: 1,
    kind: 'branches',
    branches: zweige.map((zweig) => ({
      id: zweig.id,
      when:
        zweig.when.kind === 'otherwise'
          ? { kind: 'otherwise' }
          : { kind: 'expression', expression: ausdruckObjekt(ausdruckFuerFingerprint(zweig.when.expression)) },
      outcome: ausgangObjekt(zweig.outcome),
      supportVersionIds: [...zweig.supportVersionIds].sort(),
    })),
  }
}

function praedikatLesen(wert: unknown): Schritt<RegulierungsPraedikat> {
  const satz = datensatz(wert)
  if (!satz || typeof satz.kind !== 'string') return nein('invalid_fact')
  switch (satz.kind) {
    case 'destination_permission': {
      if (!genau(satz, ['kind', 'destinationCountryCode', 'permissionClass', 'validity'])) return nein('invalid_fact')
      const land = landescodeLesen(satz.destinationCountryCode)
      if (!land || !istText(satz.permissionClass, ZIEL_ERLAUBNIS_KLASSEN)) return nein('invalid_fact')
      if (satz.validity !== 'valid_on_travel_date') return nein('invalid_fact')
      return {
        ok: true,
        wert: {
          kind: 'destination_permission',
          destinationCountryCode: land,
          permissionClass: satz.permissionClass,
          validity: 'valid_on_travel_date',
        },
      }
    }
    case 'lawful_residence': {
      if (!genau(satz, ['kind', 'countryCode', 'entitlement', 'departure'])) return nein('invalid_fact')
      const land = landescodeLesen(satz.countryCode)
      if (!land || satz.entitlement !== 'entitled_to_reside') return nein('invalid_fact')
      if (satz.departure !== 'unrestricted' && satz.departure !== 'unspecified') return nein('invalid_fact')
      return {
        ok: true,
        wert: {
          kind: 'lawful_residence',
          countryCode: land,
          entitlement: 'entitled_to_reside',
          departure: satz.departure,
        },
      }
    }
    case 'journey_origin': {
      if (!genau(satz, ['kind', 'place'])) return nein('invalid_fact')
      const ort = datensatz(satz.place)
      if (!ort) return nein('invalid_fact')
      if (ort.kind === 'country' && genau(ort, ['kind', 'countryCode'])) {
        const land = landescodeLesen(ort.countryCode)
        if (!land) return nein('invalid_fact')
        return { ok: true, wert: { kind: 'journey_origin', place: { kind: 'country', countryCode: land } } }
      }
      if (ort.kind === 'region' && genau(ort, ['kind', 'regionCode']) && istText(ort.regionCode, REGULIERUNGS_REGIONEN)) {
        return { ok: true, wert: { kind: 'journey_origin', place: { kind: 'region', regionCode: ort.regionCode } } }
      }
      return nein('invalid_fact')
    }
    case 'age_on_travel_date': {
      if (!genau(satz, ['kind', 'comparison', 'years'])) return nein('invalid_fact')
      const jahre = ganzeZahl(satz.years, 0, REGULIERUNGS_ALTER_MAX)
      if (jahre === null || (satz.comparison !== 'at_most' && satz.comparison !== 'at_least')) return nein('invalid_fact')
      return { ok: true, wert: { kind: 'age_on_travel_date', comparison: satz.comparison, years: jahre } }
    }
    case 'travel_purpose': {
      if (!genau(satz, ['kind', 'purpose']) || !istText(satz.purpose, REISEZWECKE)) return nein('invalid_fact')
      return { ok: true, wert: { kind: 'travel_purpose', purpose: satz.purpose } }
    }
    case 'document_class': {
      if (!genau(satz, ['kind', 'documentClass']) || !istText(satz.documentClass, DOKUMENT_KLASSEN)) {
        return nein('invalid_fact')
      }
      return { ok: true, wert: { kind: 'document_class', documentClass: satz.documentClass } }
    }
    case 'issuing_country':
    case 'citizenship_includes':
    case 'credential_citizenship_link': {
      if (!genau(satz, ['kind', 'countryCode'])) return nein('invalid_fact')
      const land = landescodeLesen(satz.countryCode)
      if (!land) return nein('invalid_fact')
      return { ok: true, wert: { kind: satz.kind, countryCode: land } }
    }
    case 'nationality_status': {
      if (!genau(satz, ['kind', 'status']) || !istText(satz.status, NATIONALITAETS_STATUS_KLASSEN)) {
        return nein('invalid_fact')
      }
      return { ok: true, wert: { kind: 'nationality_status', status: satz.status } }
    }
    case 'institution_status': {
      if (!genau(satz, ['kind', 'status']) || !istText(satz.status, INSTITUTIONS_STATUS)) return nein('invalid_fact')
      return { ok: true, wert: { kind: 'institution_status', status: satz.status } }
    }
    case 'group_size_at_least': {
      if (!genau(satz, ['kind', 'count'])) return nein('invalid_fact')
      const anzahl = ganzeZahl(satz.count, 2, REGULIERUNGS_GRUPPE_SCHWELLE_MAX)
      if (anzahl === null) return nein('invalid_fact')
      return { ok: true, wert: { kind: 'group_size_at_least', count: anzahl } }
    }
    case 'group_membership': {
      if (!genau(satz, ['kind', 'role']) || satz.role !== 'traveller_included') return nein('invalid_fact')
      return { ok: true, wert: { kind: 'group_membership', role: 'traveller_included' } }
    }
    case 'authority_confirmation': {
      if (!genau(satz, ['kind', 'subject']) || satz.subject !== 'institution_status') return nein('invalid_fact')
      return { ok: true, wert: { kind: 'authority_confirmation', subject: 'institution_status' } }
    }
    default:
      return nein('invalid_fact')
  }
}

function ausdruckLesenIntern(roh: unknown, tiefe: number, knoten: { n: number }): Schritt<RegulierungsAusdruck> {
  if (typeof roh === 'function' || roh instanceof RegExp || typeof roh === 'string') return nein('invalid_fact')
  if (tiefe > REGULIERUNGS_TIEFE_MAX) return nein('depth_exceeded')
  const satz = datensatz(roh)
  if (!satz || (satz.op !== 'atomic' && satz.op !== 'all' && satz.op !== 'any' && satz.op !== 'not')) {
    return nein('invalid_fact')
  }
  knoten.n += 1
  if (knoten.n > REGULIERUNGS_KNOTEN_MAX) return nein('node_bound_exceeded')
  if (satz.op === 'atomic') {
    const mitSupport = Object.prototype.hasOwnProperty.call(satz, 'supportVersionIds')
    if (!genau(satz, mitSupport ? ['op', 'predicate', 'supportVersionIds'] : ['op', 'predicate'])) {
      return nein('invalid_fact')
    }
    const praedikat = praedikatLesen(satz.predicate)
    if (!praedikat.ok) return praedikat
    if (!mitSupport) return { ok: true, wert: { op: 'atomic', predicate: praedikat.wert } }
    const support = supportLesen(satz.supportVersionIds)
    if (!support.ok) return support
    if (support.wert.length === 0) return { ok: true, wert: { op: 'atomic', predicate: praedikat.wert } }
    return { ok: true, wert: { op: 'atomic', predicate: praedikat.wert, supportVersionIds: support.wert } }
  }
  if (satz.op === 'not') {
    if (!genau(satz, ['op', 'operand'])) return nein('invalid_fact')
    const operand = ausdruckLesenIntern(satz.operand, tiefe + 1, knoten)
    if (!operand.ok) return operand
    return { ok: true, wert: { op: 'not', operand: operand.wert } }
  }
  if (!genau(satz, ['op', 'operands']) || !Array.isArray(satz.operands)) return nein('invalid_fact')
  if (satz.operands.length === 0) return nein('invalid_fact')
  if (satz.operands.length > REGULIERUNGS_OPERANDE_MAX) return nein('operand_bound_exceeded')
  const operanden: RegulierungsAusdruck[] = []
  for (const eintrag of satz.operands) {
    const operand = ausdruckLesenIntern(eintrag, tiefe + 1, knoten)
    if (!operand.ok) return operand
    operanden.push(operand.wert)
  }
  return satz.op === 'all'
    ? { ok: true, wert: { op: 'all', operands: operanden } }
    : { ok: true, wert: { op: 'any', operands: operanden } }
}

function grenzenPruefen(ausdruck: RegulierungsAusdruck): RegulierungsLesefehler | null {
  const knoten = { n: 0 }
  return tiefePruefen(ausdruck, 1, knoten)
}

function tiefePruefen(ausdruck: RegulierungsAusdruck, tiefe: number, knoten: { n: number }): RegulierungsLesefehler | null {
  if (tiefe > REGULIERUNGS_TIEFE_MAX) return 'depth_exceeded'
  knoten.n += 1
  if (knoten.n > REGULIERUNGS_KNOTEN_MAX) return 'node_bound_exceeded'
  if (ausdruck.op === 'atomic') return null
  if (ausdruck.op === 'not') return tiefePruefen(ausdruck.operand, tiefe + 1, knoten)
  if (ausdruck.operands.length === 0) return 'invalid_fact'
  if (ausdruck.operands.length > REGULIERUNGS_OPERANDE_MAX) return 'operand_bound_exceeded'
  for (const operand of ausdruck.operands) {
    const fehler = tiefePruefen(operand, tiefe + 1, knoten)
    if (fehler) return fehler
  }
  return null
}

function normalisierenRoh(ausdruck: RegulierungsAusdruck): Schritt<RegulierungsAusdruck> {
  if (ausdruck.op === 'atomic') {
    if (!ausdruck.supportVersionIds || ausdruck.supportVersionIds.length === 0) {
      return { ok: true, wert: { op: 'atomic', predicate: ausdruck.predicate } }
    }
    const ids = dedup([...ausdruck.supportVersionIds]).sort()
    return { ok: true, wert: { op: 'atomic', predicate: ausdruck.predicate, supportVersionIds: ids } }
  }
  if (ausdruck.op === 'not') {
    const innen = normalisierenRoh(ausdruck.operand)
    if (!innen.ok) return innen
    if (innen.wert.op === 'not') return { ok: true, wert: innen.wert.operand }
    return { ok: true, wert: { op: 'not', operand: innen.wert } }
  }
  const flach: RegulierungsAusdruck[] = []
  for (const operand of ausdruck.operands) {
    const innen = normalisierenRoh(operand)
    if (!innen.ok) return innen
    if (innen.wert.op === ausdruck.op) flach.push(...innen.wert.operands)
    else flach.push(innen.wert)
  }
  flach.sort((links, rechts) => {
    const kanonLinks = json(ausdruckObjekt(links))
    const kanonRechts = json(ausdruckObjekt(rechts))
    return kanonLinks < kanonRechts ? -1 : kanonLinks > kanonRechts ? 1 : 0
  })
  const einzig: RegulierungsAusdruck[] = []
  const gesehen = new Set<string>()
  for (const operand of flach) {
    const kanon = json(ausdruckObjekt(operand))
    if (gesehen.has(kanon)) continue
    gesehen.add(kanon)
    einzig.push(operand)
  }
  if (einzig.length === 0) return nein('invalid_fact')
  if (einzig.length > REGULIERUNGS_OPERANDE_MAX) return nein('operand_bound_exceeded')
  const erster = einzig[0]
  if (einzig.length === 1 && erster) return { ok: true, wert: erster }
  return ausdruck.op === 'all'
    ? { ok: true, wert: { op: 'all', operands: einzig } }
    : { ok: true, wert: { op: 'any', operands: einzig } }
}

function normalisieren(ausdruck: RegulierungsAusdruck): Schritt<RegulierungsAusdruck> {
  const roh = normalisierenRoh(ausdruck)
  if (!roh.ok) return roh
  const grenze = grenzenPruefen(roh.wert)
  if (grenze) return nein(grenze)
  return roh
}

function ausdruckFuerFingerprint(ausdruck: RegulierungsAusdruck): RegulierungsAusdruck {
  const normal = normalisieren(ausdruck)
  return normal.ok ? normal.wert : ausdruck
}

export function regulierungsAusdruckLesen(roh: unknown): RegulierungsLeseErgebnis<RegulierungsAusdruck> {
  const start = anfang(roh)
  if (start) return nein(start)
  const gelesen = ausdruckLesenIntern(roh, 1, { n: 0 })
  if (!gelesen.ok) return gelesen
  return normalisieren(gelesen.wert)
}

function atom(
  art: RegulierungsPraedikatArt,
  herkunft: RegulierungsHerkunft,
  polaritaet: 'true' | 'false',
): AusdruckIntern {
  return {
    wert: polaritaet,
    abhaengigkeiten: [{ predicateKind: art, provenance: herkunft, polarity: polaritaet }],
    fehlende: [],
    regionUngepinnt: false,
  }
}

function unbekannt(code: RegulierungsFehlenderFakt): AusdruckIntern {
  return { wert: 'unknown', abhaengigkeiten: [], fehlende: [code], regionUngepinnt: false }
}

function regionUngepinnt(): AusdruckIntern {
  return { wert: 'unknown', abhaengigkeiten: [], fehlende: [], regionUngepinnt: true }
}

function ausdruckAuswertenIntern(ausdruck: RegulierungsAusdruck, kontext: RegulierungsKontext): AusdruckIntern {
  if (ausdruck.op === 'atomic') return atomAuswerten(ausdruck.predicate, kontext)
  if (ausdruck.op === 'not') {
    const innen = ausdruckAuswertenIntern(ausdruck.operand, kontext)
    if (innen.wert === 'unknown') return innen
    return { ...innen, wert: innen.wert === 'true' ? 'false' : 'true', abhaengigkeiten: kopie(innen.abhaengigkeiten) }
  }
  return verknuepfungAuswerten(ausdruck.op, ausdruck.operands, kontext)
}

function verknuepfungAuswerten(
  op: 'all' | 'any',
  operanden: readonly RegulierungsAusdruck[],
  kontext: RegulierungsKontext,
): AusdruckIntern {
  const wahr: RegulierungsAbhaengigkeit[] = []
  const falsch: RegulierungsAbhaengigkeit[] = []
  const offenDeps: RegulierungsAbhaengigkeit[] = []
  const offenFakten: RegulierungsFehlenderFakt[] = []
  let hatOffen = false
  let region = false
  for (const operand of operanden) {
    const ergebnis = ausdruckAuswertenIntern(operand, kontext)
    if (op === 'all' && ergebnis.wert === 'false') {
      return { wert: 'false', abhaengigkeiten: kopie(ergebnis.abhaengigkeiten), fehlende: [], regionUngepinnt: false }
    }
    if (op === 'any' && ergebnis.wert === 'true') {
      return { wert: 'true', abhaengigkeiten: kopie(ergebnis.abhaengigkeiten), fehlende: [], regionUngepinnt: false }
    }
    if (ergebnis.wert === 'unknown') {
      hatOffen = true
      offenDeps.push(...kopie(ergebnis.abhaengigkeiten))
      offenFakten.push(...ergebnis.fehlende)
      region = region || ergebnis.regionUngepinnt
    } else if (ergebnis.wert === 'true') {
      wahr.push(...kopie(ergebnis.abhaengigkeiten))
    } else {
      falsch.push(...kopie(ergebnis.abhaengigkeiten))
    }
  }
  if (hatOffen) {
    return { wert: 'unknown', abhaengigkeiten: offenDeps, fehlende: dedup(offenFakten), regionUngepinnt: region }
  }
  if (op === 'all') return { wert: 'true', abhaengigkeiten: wahr, fehlende: [], regionUngepinnt: false }
  return { wert: 'false', abhaengigkeiten: falsch, fehlende: [], regionUngepinnt: false }
}

function atomAuswerten(praedikat: RegulierungsPraedikat, kontext: RegulierungsKontext): AusdruckIntern {
  switch (praedikat.kind) {
    case 'destination_permission':
      return zielErlaubnisAuswerten(praedikat, kontext)
    case 'lawful_residence':
      return wohnsitzAuswerten(praedikat, kontext)
    case 'journey_origin':
      return herkunftAuswerten(praedikat, kontext)
    case 'age_on_travel_date': {
      const fakt = kontext.ageOnTravelDate
      if (!fakt) return unbekannt('age_on_travel_date')
      const passt = praedikat.comparison === 'at_most' ? fakt.value <= praedikat.years : fakt.value >= praedikat.years
      return atom('age_on_travel_date', fakt.provenance, passt ? 'true' : 'false')
    }
    case 'travel_purpose': {
      const fakt = kontext.travelPurpose
      if (!fakt) return unbekannt('travel_purpose')
      return atom('travel_purpose', fakt.provenance, fakt.value === praedikat.purpose ? 'true' : 'false')
    }
    case 'document_class':
      return dokumentKlasseAuswerten(praedikat, kontext)
    case 'issuing_country':
      return ausstellerAuswerten(praedikat.countryCode, kontext)
    case 'citizenship_includes': {
      if (kontext.citizenshipCountryCodes.length === 0) return unbekannt('nationality')
      const passt = kontext.citizenshipCountryCodes.includes(praedikat.countryCode)
      return atom('citizenship_includes', kontext.recordedContextProvenance, passt ? 'true' : 'false')
    }
    case 'credential_citizenship_link': {
      const verknuepft = kontext.credential.relatedCitizenshipCountryCode
      if (verknuepft === null) return unbekannt('credential_citizenship_link')
      return atom(
        'credential_citizenship_link',
        kontext.recordedContextProvenance,
        verknuepft === praedikat.countryCode ? 'true' : 'false',
      )
    }
    case 'nationality_status': {
      const treffer = kontext.nationalityStatuses.filter((fakt) => fakt.value.status === praedikat.status)
      const fakt = treffer[0]
      if (treffer.length !== 1 || !fakt) return unbekannt('nationality_status')
      return atom('nationality_status', fakt.provenance, fakt.value.holding === 'held' ? 'true' : 'false')
    }
    case 'institution_status': {
      const fakt = kontext.schoolParty?.institutionStatus ?? null
      if (!fakt) return unbekannt('school_party_context')
      return atom('institution_status', fakt.provenance, fakt.value === praedikat.status ? 'true' : 'false')
    }
    case 'group_size_at_least': {
      const fakt = kontext.schoolParty?.groupSize ?? null
      if (!fakt) return unbekannt('school_party_context')
      return atom('group_size_at_least', fakt.provenance, fakt.value >= praedikat.count ? 'true' : 'false')
    }
    case 'group_membership': {
      const fakt = kontext.schoolParty?.travellerIncluded ?? null
      if (!fakt) return unbekannt('school_party_context')
      return atom('group_membership', fakt.provenance, fakt.value ? 'true' : 'false')
    }
    case 'authority_confirmation': {
      const fakt = kontext.schoolParty?.authorityConfirmed ?? null
      if (!fakt) return unbekannt('school_party_context')
      return atom('authority_confirmation', fakt.provenance, fakt.value ? 'true' : 'false')
    }
    default: {
      const nie: never = praedikat
      return nie
    }
  }
}

function zielErlaubnisAuswerten(
  praedikat: Extract<RegulierungsPraedikat, { kind: 'destination_permission' }>,
  kontext: RegulierungsKontext,
): AusdruckIntern {
  const treffer = kontext.destinationPermissions.filter(
    (fakt) =>
      fakt.value.destinationCountryCode === praedikat.destinationCountryCode &&
      fakt.value.permissionClass === praedikat.permissionClass,
  )
  const fakt = treffer[0]
  if (treffer.length !== 1 || !fakt) return unbekannt('destination_permission_status')
  return atom(
    'destination_permission',
    fakt.provenance,
    fakt.value.validity === 'valid_on_travel_date' ? 'true' : 'false',
  )
}

function wohnsitzAuswerten(
  praedikat: Extract<RegulierungsPraedikat, { kind: 'lawful_residence' }>,
  kontext: RegulierungsKontext,
): AusdruckIntern {
  const treffer = kontext.lawfulResidence.filter((fakt) => fakt.value.countryCode === praedikat.countryCode)
  const fakt = treffer[0]
  if (treffer.length !== 1 || !fakt) return unbekannt('lawful_residence_status')
  if (fakt.value.entitlement === 'not_entitled') return atom('lawful_residence', fakt.provenance, 'false')
  if (praedikat.departure === 'unspecified') return atom('lawful_residence', fakt.provenance, 'true')
  if (fakt.value.departure === 'unrestricted') return atom('lawful_residence', fakt.provenance, 'true')
  if (fakt.value.departure === 'restricted') return atom('lawful_residence', fakt.provenance, 'false')
  return unbekannt('lawful_residence_status')
}

function herkunftAuswerten(
  praedikat: Extract<RegulierungsPraedikat, { kind: 'journey_origin' }>,
  kontext: RegulierungsKontext,
): AusdruckIntern {
  const fakt = kontext.journeyOriginCountryCode
  if (!fakt) return unbekannt('journey_origin')
  const ort = praedikat.place
  if (ort.kind === 'country') {
    return atom('journey_origin', fakt.provenance, fakt.value === ort.countryCode ? 'true' : 'false')
  }
  const pin = REGULIERUNGS_REGION_PINS.find((eintrag) => eintrag.regionCode === ort.regionCode)
  if (!pin) return regionUngepinnt()
  const mitglied = pin.memberCountryCodes.includes(fakt.value)
  return atom('journey_origin', fakt.provenance, mitglied ? 'true' : 'false')
}

function dokumentKlasseAuswerten(
  praedikat: Extract<RegulierungsPraedikat, { kind: 'document_class' }>,
  kontext: RegulierungsKontext,
): AusdruckIntern {
  const typ = kontext.credential.documentType
  if (typ === null || typ === 'unknown') return unbekannt('document_type')
  const fakt = kontext.documentClass
  if (!fakt) return unbekannt('document_class')
  return atom('document_class', fakt.provenance, fakt.value === praedikat.documentClass ? 'true' : 'false')
}

function ausstellerAuswerten(land: string, kontext: RegulierungsKontext): AusdruckIntern {
  const typ = kontext.credential.documentType
  if (typ === null || typ === 'unknown') return unbekannt('document_type')
  if (kontext.credential.issuingCountryCode === null) return unbekannt('document_issuing_country')
  return atom(
    'issuing_country',
    kontext.recordedContextProvenance,
    kontext.credential.issuingCountryCode === land ? 'true' : 'false',
  )
}

export function regulierungsAusdruckAuswerten(
  ausdruck: RegulierungsAusdruck,
  kontext: RegulierungsKontext,
): RegulierungsAusdruckErgebnis {
  const normal = normalisieren(ausdruck)
  const ergebnis = ausdruckAuswertenIntern(normal.ok ? normal.wert : ausdruck, kontext)
  const grund =
    ergebnis.wert === 'unknown' && ergebnis.fehlende.length === 0 && ergebnis.regionUngepinnt
      ? 'region_membership_unpinned'
      : null
  return {
    wert: ergebnis.wert,
    abhaengigkeiten: ergebnis.abhaengigkeiten,
    fehlendeFakten: ergebnis.fehlende,
    grund,
  }
}

function unzureichend<T>(
  reason: Extract<RegulierungsAuswertung<T>, { status: 'insufficient_context' }>['reason'],
  fehlende: readonly RegulierungsFehlenderFakt[],
): RegulierungsAuswertung<T> {
  return {
    status: 'insufficient_context',
    outcome: null,
    binding: null,
    missingFacts: dedup(fehlende),
    reason,
  }
}

function entschieden<T>(
  outcome: T,
  binding: 'context_recorded' | 'context_asserted' | null,
  deps: readonly RegulierungsAbhaengigkeit[],
  reason: 'unconditional' | 'branch_matched',
): RegulierungsAuswertung<T> {
  return {
    status: 'decided',
    outcome,
    binding,
    decisionTrace: { schema: 1, dependencies: kopie(deps) },
    missingFacts: [],
    reason,
  }
}

function unbedingt<T>(outcome: T): RegulierungsAuswertung<T> {
  return entschieden(outcome, null, [], 'unconditional')
}

function bindungAus(deps: readonly RegulierungsAbhaengigkeit[]): 'context_asserted' | 'context_recorded' | null {
  if (deps.length === 0) return null
  if (deps.some((eintrag) => eintrag.provenance === 'user_asserted')) return 'context_asserted'
  return 'context_recorded'
}

function vereinigen(listen: readonly (readonly RegulierungsAbhaengigkeit[])[]): RegulierungsAbhaengigkeit[] {
  const aus: RegulierungsAbhaengigkeit[] = []
  for (const liste of listen) {
    for (const eintrag of liste) {
      const schon = aus.some(
        (vorhanden) =>
          vorhanden.predicateKind === eintrag.predicateKind &&
          vorhanden.provenance === eintrag.provenance &&
          vorhanden.polarity === eintrag.polarity,
      )
      if (!schon) aus.push({ predicateKind: eintrag.predicateKind, provenance: eintrag.provenance, polarity: eintrag.polarity })
    }
  }
  return aus
}

function istAusdruckZweig<T>(
  zweig: RegulierungsZweig<T>,
): zweig is RegulierungsZweig<T> & { when: { kind: 'expression'; expression: RegulierungsAusdruck } } {
  return zweig.when.kind === 'expression'
}

function unzureichendAusOffen<T>(ergebnisse: readonly AusdruckIntern[]): RegulierungsAuswertung<T> {
  const fehlende = dedup(ergebnisse.flatMap((ergebnis) => ergebnis.fehlende))
  const region = ergebnisse.some((ergebnis) => ergebnis.regionUngepinnt)
  if (fehlende.length === 0 && region) return unzureichend('region_membership_unpinned', [])
  return unzureichend('predicate_unknown', fehlende)
}

function zweigeEntscheiden<T>(
  zweige: readonly RegulierungsZweig<T>[],
  kontext: RegulierungsKontext,
  gleich: (links: T, rechts: T) => boolean,
): RegulierungsAuswertung<T> {
  const geordnet = [...zweige].sort((links, rechts) => (links.id < rechts.id ? -1 : links.id > rechts.id ? 1 : 0))
  const ausdruecke = geordnet.filter(istAusdruckZweig)
  const sonst = geordnet.filter((zweig) => zweig.when.kind === 'otherwise')
  if (ausdruecke.length === 0 || sonst.length > 1) return unzureichend('predicate_unknown', [])
  const bewertet = ausdruecke.map((zweig) => ({
    zweig,
    ergebnis: ausdruckAuswertenIntern(ausdruckFuerFingerprint(zweig.when.expression), kontext),
  }))
  const wahr = bewertet.filter((eintrag) => eintrag.ergebnis.wert === 'true')
  const falsch = bewertet.filter((eintrag) => eintrag.ergebnis.wert === 'false')
  const offen = bewertet.filter((eintrag) => eintrag.ergebnis.wert === 'unknown')
  const ersterWahr = wahr[0]
  if (ersterWahr) {
    const ziel = ersterWahr.zweig.outcome
    if (wahr.some((eintrag) => !gleich(eintrag.zweig.outcome, ziel))) return unzureichend('branch_conflict', [])
    const stoerend = offen.filter((eintrag) => !gleich(eintrag.zweig.outcome, ziel))
    if (stoerend.length > 0) return unzureichendAusOffen(stoerend.map((eintrag) => eintrag.ergebnis))
    const binding = bindungAus(ersterWahr.ergebnis.abhaengigkeiten)
    if (!binding) return unzureichend('predicate_unknown', [])
    return entschieden(ziel, binding, ersterWahr.ergebnis.abhaengigkeiten, 'branch_matched')
  }
  if (offen.length > 0) return unzureichendAusOffen(offen.map((eintrag) => eintrag.ergebnis))
  const basis = sonst[0]
  if (falsch.length === ausdruecke.length && basis) {
    const deps = vereinigen(falsch.map((eintrag) => eintrag.ergebnis.abhaengigkeiten))
    const binding = bindungAus(deps)
    if (!binding) return unzureichend('predicate_unknown', [])
    return entschieden(basis.outcome, binding, deps, 'branch_matched')
  }
  return unzureichend('no_applicable_branch', [])
}

function wirkungGleich(links: WirkungsAusgang, rechts: WirkungsAusgang): boolean {
  return links.effect === rechts.effect && links.visaMode === rechts.visaMode
}

function visaGleich(links: VisaOptionsAusgang, rechts: VisaOptionsAusgang): boolean {
  return links.eligibility === rechts.eligibility && links.mandate === rechts.mandate
}

function faktLesen<T>(
  wert: unknown,
  wertLesen: (roh: unknown) => Schritt<T>,
  erlaubt: readonly RegulierungsHerkunft[],
): Schritt<RegulierungsFakt<T> | null> {
  if (wert === null) return { ok: true, wert: null }
  const satz = datensatz(wert)
  if (!satz || !genau(satz, ['value', 'provenance'])) return nein('invalid_fact')
  const herkunft = herkunftLesen(satz.provenance)
  if (!herkunft.ok) return herkunft
  if (!erlaubt.includes(herkunft.wert)) return nein('invalid_fact')
  const value = wertLesen(satz.value)
  if (!value.ok) return value
  return { ok: true, wert: { value: value.wert, provenance: herkunft.wert } }
}

function faktPflicht<T>(
  wert: unknown,
  wertLesen: (roh: unknown) => Schritt<T>,
  erlaubt: readonly RegulierungsHerkunft[],
): Schritt<RegulierungsFakt<T>> {
  const gelesen = faktLesen(wert, wertLesen, erlaubt)
  if (!gelesen.ok) return gelesen
  if (!gelesen.wert) return nein('invalid_fact')
  return { ok: true, wert: gelesen.wert }
}

function konfliktreihen<T>(reihen: readonly RegulierungsFakt<T>[], schluessel: (wert: T) => string): Schritt<RegulierungsFakt<T>[]> {
  const gesehen = new Map<string, string>()
  const aus: RegulierungsFakt<T>[] = []
  for (const reihe of reihen) {
    const key = schluessel(reihe.value)
    const kanon = json({ value: reihe.value, provenance: reihe.provenance })
    const bisher = gesehen.get(key)
    if (bisher === undefined) {
      gesehen.set(key, kanon)
      aus.push(reihe)
      continue
    }
    if (bisher !== kanon) return nein('context_conflict')
  }
  return { ok: true, wert: aus }
}

function erlaubnisWert(wert: unknown): Schritt<ZielErlaubnisWert> {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, ['destinationCountryCode', 'permissionClass', 'validity'])) return nein('invalid_fact')
  const land = landescodeLesen(satz.destinationCountryCode)
  if (!land || !istText(satz.permissionClass, ZIEL_ERLAUBNIS_KLASSEN)) return nein('invalid_fact')
  if (satz.validity !== 'valid_on_travel_date' && satz.validity !== 'not_valid') return nein('invalid_fact')
  return {
    ok: true,
    wert: { destinationCountryCode: land, permissionClass: satz.permissionClass, validity: satz.validity },
  }
}

function wohnsitzWert(wert: unknown): Schritt<WohnsitzWert> {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, ['countryCode', 'entitlement', 'departure'])) return nein('invalid_fact')
  const land = landescodeLesen(satz.countryCode)
  if (!land) return nein('invalid_fact')
  if (satz.entitlement !== 'entitled_to_reside' && satz.entitlement !== 'not_entitled') return nein('invalid_fact')
  if (satz.departure !== 'unrestricted' && satz.departure !== 'restricted' && satz.departure !== 'unknown') {
    return nein('invalid_fact')
  }
  return { ok: true, wert: { countryCode: land, entitlement: satz.entitlement, departure: satz.departure } }
}

function statusWert(wert: unknown): Schritt<StatusWert> {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, ['status', 'holding'])) return nein('invalid_fact')
  if (!istText(satz.status, NATIONALITAETS_STATUS_KLASSEN)) return nein('invalid_fact')
  if (satz.holding !== 'held' && satz.holding !== 'not_held') return nein('invalid_fact')
  return { ok: true, wert: { status: satz.status, holding: satz.holding } }
}

function laenderListe(wert: unknown): Schritt<readonly string[]> {
  if (!Array.isArray(wert)) return nein('invalid_fact')
  const codes: string[] = []
  for (const eintrag of wert) {
    const code = landescodeLesen(eintrag)
    if (!code) return nein('invalid_fact')
    if (!codes.includes(code)) codes.push(code)
  }
  codes.sort()
  return { ok: true, wert: codes }
}

function erlaubnisListe(wert: unknown): Schritt<readonly RegulierungsFakt<ZielErlaubnisWert>[]> {
  if (!Array.isArray(wert)) return nein('invalid_fact')
  const reihen: RegulierungsFakt<ZielErlaubnisWert>[] = []
  for (const eintrag of wert) {
    const fakt = faktPflicht(eintrag, erlaubnisWert, NUTZER)
    if (!fakt.ok) return fakt
    reihen.push(fakt.wert)
  }
  const ohneKonflikt = konfliktreihen(
    reihen,
    (eintrag) => `${eintrag.destinationCountryCode}:${eintrag.permissionClass}`,
  )
  if (!ohneKonflikt.ok) return ohneKonflikt
  const sortiert = [...ohneKonflikt.wert].sort((links, rechts) => {
    const ka = `${links.value.destinationCountryCode}:${links.value.permissionClass}`
    const kb = `${rechts.value.destinationCountryCode}:${rechts.value.permissionClass}`
    return ka < kb ? -1 : ka > kb ? 1 : 0
  })
  return { ok: true, wert: sortiert }
}

function wohnsitzListe(wert: unknown): Schritt<readonly RegulierungsFakt<WohnsitzWert>[]> {
  if (!Array.isArray(wert)) return nein('invalid_fact')
  const reihen: RegulierungsFakt<WohnsitzWert>[] = []
  for (const eintrag of wert) {
    const fakt = faktPflicht(eintrag, wohnsitzWert, NUTZER)
    if (!fakt.ok) return fakt
    reihen.push(fakt.wert)
  }
  const ohneKonflikt = konfliktreihen(reihen, (eintrag) => eintrag.countryCode)
  if (!ohneKonflikt.ok) return ohneKonflikt
  const sortiert = [...ohneKonflikt.wert].sort((links, rechts) =>
    links.value.countryCode < rechts.value.countryCode ? -1 : links.value.countryCode > rechts.value.countryCode ? 1 : 0,
  )
  return { ok: true, wert: sortiert }
}

function statusListe(wert: unknown): Schritt<readonly RegulierungsFakt<StatusWert>[]> {
  if (!Array.isArray(wert)) return nein('invalid_fact')
  const reihen: RegulierungsFakt<StatusWert>[] = []
  for (const eintrag of wert) {
    const fakt = faktPflicht(eintrag, statusWert, NUTZER)
    if (!fakt.ok) return fakt
    reihen.push(fakt.wert)
  }
  const ohneKonflikt = konfliktreihen(reihen, (eintrag) => eintrag.status)
  if (!ohneKonflikt.ok) return ohneKonflikt
  const sortiert = [...ohneKonflikt.wert].sort(
    (links, rechts) =>
      NATIONALITAETS_STATUS_KLASSEN.indexOf(links.value.status) - NATIONALITAETS_STATUS_KLASSEN.indexOf(rechts.value.status),
  )
  return { ok: true, wert: sortiert }
}

function dokumentTypLesen(wert: unknown): Schritt<'passport' | 'national_id' | 'unknown' | null> {
  if (wert === null) return { ok: true, wert: null }
  if (wert === 'passport' || wert === 'national_id' || wert === 'unknown') return { ok: true, wert }
  return nein('invalid_fact')
}

function zweckWert(wert: unknown): Schritt<Reisezweck> {
  if (!istText(wert, REISEZWECKE)) return nein('invalid_fact')
  return { ok: true, wert }
}

function klasseWert(wert: unknown): Schritt<DokumentKlasse> {
  if (!istText(wert, DOKUMENT_KLASSEN)) return nein('invalid_fact')
  return { ok: true, wert }
}

function alterWert(wert: unknown): Schritt<number> {
  const alter = ganzeZahl(wert, 0, REGULIERUNGS_ALTER_MAX)
  if (alter === null) return nein('invalid_fact')
  return { ok: true, wert: alter }
}

function institutionsWert(wert: unknown): Schritt<InstitutionsStatus> {
  if (!istText(wert, INSTITUTIONS_STATUS)) return nein('invalid_fact')
  return { ok: true, wert }
}

function gruppenGroesseWert(wert: unknown): Schritt<number> {
  const groesse = ganzeZahl(wert, 1, REGULIERUNGS_GRUPPE_KONTEXT_MAX)
  if (groesse === null) return nein('invalid_fact')
  return { ok: true, wert: groesse }
}

function boolWert(wert: unknown): Schritt<boolean> {
  if (typeof wert !== 'boolean') return nein('invalid_fact')
  return { ok: true, wert }
}

function herkunftslandWert(wert: unknown): Schritt<string> {
  const code = landescodeLesen(wert)
  if (!code) return nein('invalid_fact')
  return { ok: true, wert: code }
}

export function regulierungsKontextLesen(roh: unknown): RegulierungsLeseErgebnis<RegulierungsKontext> {
  const start = anfang(roh)
  if (start) return nein(start)
  const satz = datensatz(roh)
  if (!satz || !genau(satz, KONTEXT_SCHLUESSEL) || satz.schema !== REGULIERUNGS_SCHEMA) return nein('invalid_fact')
  const herkunft = herkunftLesen(satz.recordedContextProvenance)
  if (!herkunft.ok) return herkunft
  if (herkunft.wert === 'user_asserted') return nein('invalid_fact')
  const citizenship = laenderListe(satz.citizenshipCountryCodes)
  if (!citizenship.ok) return citizenship
  const credential = datensatz(satz.credential)
  if (!credential || !genau(credential, ['documentType', 'issuingCountryCode', 'relatedCitizenshipCountryCode'])) {
    return nein('invalid_fact')
  }
  const documentType = dokumentTypLesen(credential.documentType)
  if (!documentType.ok) return documentType
  const issuing = landOderNull(credential.issuingCountryCode)
  if (!issuing.ok) return issuing
  const related = landOderNull(credential.relatedCitizenshipCountryCode)
  if (!related.ok) return related
  const residence = landOderNull(satz.residenceCountryCode)
  if (!residence.ok) return residence
  const origin = faktLesen(satz.journeyOriginCountryCode, herkunftslandWert, REISE_ODER_NUTZER)
  if (!origin.ok) return origin
  const alter = faktLesen(satz.ageOnTravelDate, alterWert, NUTZER)
  if (!alter.ok) return alter
  const zweck = faktLesen(satz.travelPurpose, zweckWert, NUTZER)
  if (!zweck.ok) return zweck
  const klasse = faktLesen(satz.documentClass, klasseWert, NUTZER)
  if (!klasse.ok) return klasse
  const permissions = erlaubnisListe(satz.destinationPermissions)
  if (!permissions.ok) return permissions
  const wohnsitz = wohnsitzListe(satz.lawfulResidence)
  if (!wohnsitz.ok) return wohnsitz
  const status = statusListe(satz.nationalityStatuses)
  if (!status.ok) return status
  let schoolParty: RegulierungsKontext['schoolParty'] = null
  if (satz.schoolParty !== null) {
    const partei = datensatz(satz.schoolParty)
    if (!partei || !genau(partei, ['institutionStatus', 'groupSize', 'travellerIncluded', 'authorityConfirmed'])) {
      return nein('invalid_fact')
    }
    const institution = faktLesen(partei.institutionStatus, institutionsWert, NUTZER)
    if (!institution.ok) return institution
    const groesse = faktLesen(partei.groupSize, gruppenGroesseWert, NUTZER)
    if (!groesse.ok) return groesse
    const mitglied = faktLesen(partei.travellerIncluded, boolWert, NUTZER)
    if (!mitglied.ok) return mitglied
    const bestaetigt = faktLesen(partei.authorityConfirmed, boolWert, NUTZER)
    if (!bestaetigt.ok) return bestaetigt
    schoolParty = {
      institutionStatus: institution.wert,
      groupSize: groesse.wert,
      travellerIncluded: mitglied.wert,
      authorityConfirmed: bestaetigt.wert,
    }
  }
  return {
    ok: true,
    wert: {
      schema: 1,
      recordedContextProvenance: herkunft.wert,
      citizenshipCountryCodes: citizenship.wert,
      credential: {
        documentType: documentType.wert,
        issuingCountryCode: issuing.wert,
        relatedCitizenshipCountryCode: related.wert,
      },
      residenceCountryCode: residence.wert,
      journeyOriginCountryCode: origin.wert,
      ageOnTravelDate: alter.wert,
      travelPurpose: zweck.wert,
      documentClass: klasse.wert,
      destinationPermissions: permissions.wert,
      lawfulResidence: wohnsitz.wert,
      nationalityStatuses: status.wert,
      schoolParty,
    },
  }
}

function visaModusLesen(requirementType: OfficialRequirementType, wert: unknown): Schritt<OfficialVisaMode | null> {
  if (requirementType !== 'visa') {
    if (wert !== null) return nein('visa_mode_forbidden')
    return { ok: true, wert: null }
  }
  if (wert === null) return { ok: true, wert: null }
  if (typeof wert === 'string' && (OFFICIAL_VISA_MODES as readonly string[]).includes(wert)) {
    return { ok: true, wert: wert as OfficialVisaMode }
  }
  return nein('invalid_fact')
}

function wirkungAusgangLesen(requirementType: OfficialRequirementType, wert: unknown): Schritt<WirkungsAusgang> {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, ['effect', 'visaMode'])) return nein('invalid_fact')
  if (satz.effect !== 'required' && satz.effect !== 'not_required') return nein('invalid_fact')
  const modus = visaModusLesen(requirementType, satz.visaMode)
  if (!modus.ok) return modus
  if (visaResultUndModusWidersprechen(requirementType, satz.effect, modus.wert)) return nein('visa_contradiction')
  return { ok: true, wert: { effect: satz.effect, visaMode: modus.wert } }
}

function visaAusgangLesen(wert: unknown): Schritt<VisaOptionsAusgang> {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, ['eligibility', 'mandate'])) return nein('invalid_fact')
  if (satz.eligibility !== 'allowed' && satz.eligibility !== 'not_allowed') return nein('invalid_fact')
  if (satz.mandate !== 'mandatory' && satz.mandate !== 'not_mandatory' && satz.mandate !== 'unknown') {
    return nein('invalid_fact')
  }
  return { ok: true, wert: { eligibility: satz.eligibility, mandate: satz.mandate } }
}

function zweigLesen<T>(
  wert: unknown,
  ausgangLesen: (roh: unknown) => Schritt<T>,
): Schritt<RegulierungsZweig<T>> {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, ['id', 'when', 'outcome', 'supportVersionIds'])) return nein('invalid_fact')
  if (typeof satz.id !== 'string' || !ZWEIG_ID.test(satz.id)) return nein('invalid_fact')
  const when = datensatz(satz.when)
  if (!when) return nein('invalid_fact')
  let bedingung: RegulierungsWenn
  if (when.kind === 'otherwise' && genau(when, ['kind'])) bedingung = { kind: 'otherwise' }
  else if (when.kind === 'expression' && genau(when, ['kind', 'expression'])) {
    const ausdruck = ausdruckLesenIntern(when.expression, 1, { n: 0 })
    if (!ausdruck.ok) return ausdruck
    const normal = normalisieren(ausdruck.wert)
    if (!normal.ok) return normal
    bedingung = { kind: 'expression', expression: normal.wert }
  } else return nein('invalid_fact')
  const outcome = ausgangLesen(satz.outcome)
  if (!outcome.ok) return outcome
  const support = supportLesen(satz.supportVersionIds)
  if (!support.ok) return support
  return { ok: true, wert: { id: satz.id, when: bedingung, outcome: outcome.wert, supportVersionIds: support.wert } }
}

function zweigeLesen<T>(wert: unknown, ausgangLesen: (roh: unknown) => Schritt<T>): Schritt<readonly RegulierungsZweig<T>[]> {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, ['schema', 'kind', 'branches']) || satz.schema !== 1 || satz.kind !== 'branches') {
    return nein('invalid_fact')
  }
  if (!Array.isArray(satz.branches)) return nein('invalid_fact')
  if (satz.branches.length === 0) return nein('invalid_fact')
  if (satz.branches.length > REGULIERUNGS_ZWEIGE_MAX) return nein('branch_bound_exceeded')
  const zweige: RegulierungsZweig<T>[] = []
  for (const eintrag of satz.branches) {
    const zweig = zweigLesen(eintrag, ausgangLesen)
    if (!zweig.ok) return zweig
    zweige.push(zweig.wert)
  }
  const ids = new Set<string>()
  let sonst = 0
  let ausdruecke = 0
  for (const zweig of zweige) {
    if (ids.has(zweig.id)) return nein('invalid_fact')
    ids.add(zweig.id)
    if (zweig.when.kind === 'otherwise') sonst += 1
    else ausdruecke += 1
  }
  if (sonst > 1 || ausdruecke === 0) return nein('invalid_fact')
  zweige.sort((links, rechts) => (links.id < rechts.id ? -1 : links.id > rechts.id ? 1 : 0))
  return { ok: true, wert: zweige }
}

function anwendbarkeitUnbedingt(wert: unknown): Schritt<{ schema: 1; kind: 'unconditional' }> {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, ['schema', 'kind']) || satz.schema !== 1 || satz.kind !== 'unconditional') {
    return nein('invalid_fact')
  }
  return { ok: true, wert: { schema: 1, kind: 'unconditional' } }
}

export function regulierungsAnwendbarkeitWirkungLesen(
  roh: unknown,
  requirementType: OfficialRequirementType,
): WirkungsLesergebnis {
  const start = anfang(roh)
  if (start) return nein(start)
  if (!(OFFICIAL_REQUIREMENT_TYPES as readonly string[]).includes(requirementType)) return nein('invalid_fact')
  const satz = datensatz(roh)
  if (!satz || satz.kind !== 'requirement_effect') return nein('invalid_fact')
  const hatSchema = Object.prototype.hasOwnProperty.call(satz, 'schema')
  const hatAnwendbarkeit = Object.prototype.hasOwnProperty.call(satz, 'applicability')
  const hatWirkung = Object.prototype.hasOwnProperty.call(satz, 'effect')
  const hatModus = Object.prototype.hasOwnProperty.call(satz, 'visaMode')
  if (hatSchema !== hatAnwendbarkeit) return nein('invalid_fact')
  if (hatAnwendbarkeit) {
    const anwendbarkeit = datensatz(satz.applicability)
    if (anwendbarkeit?.kind === 'branches' && (hatWirkung || hatModus)) return nein('mixed_outcome')
  }
  if (!hatSchema) {
    if (!genau(satz, ['kind', 'effect', 'visaMode'])) return nein('invalid_fact')
    if (satz.effect === 'conditional') {
      const modus = visaModusLesen(requirementType, satz.visaMode)
      if (!modus.ok) return modus
      return {
        ok: false,
        reason: 'legacy_conditional_without_payload',
        auswertung: {
          status: 'insufficient_context',
          outcome: null,
          binding: null,
          missingFacts: [],
          reason: 'legacy_conditional_without_payload',
        },
      }
    }
    const ausgang = wirkungAusgangLesen(requirementType, { effect: satz.effect, visaMode: satz.visaMode })
    if (!ausgang.ok) return ausgang
    return { ok: true, fakt: { kind: 'requirement_effect', effect: ausgang.wert.effect, visaMode: ausgang.wert.visaMode } }
  }
  if (satz.schema !== 1) return nein('invalid_fact')
  if (genau(satz, ['kind', 'schema', 'applicability', 'effect', 'visaMode'])) {
    const anwendbarkeit = anwendbarkeitUnbedingt(satz.applicability)
    if (!anwendbarkeit.ok) return anwendbarkeit
    const ausgang = wirkungAusgangLesen(requirementType, { effect: satz.effect, visaMode: satz.visaMode })
    if (!ausgang.ok) return ausgang
    return {
      ok: true,
      fakt: {
        kind: 'requirement_effect',
        schema: 1,
        applicability: anwendbarkeit.wert,
        effect: ausgang.wert.effect,
        visaMode: ausgang.wert.visaMode,
      },
    }
  }
  if (genau(satz, ['kind', 'schema', 'applicability'])) {
    const zweige = zweigeLesen(satz.applicability, (ausgang) => wirkungAusgangLesen(requirementType, ausgang))
    if (!zweige.ok) return zweige
    return {
      ok: true,
      fakt: {
        kind: 'requirement_effect',
        schema: 1,
        applicability: { schema: 1, kind: 'branches', branches: zweige.wert },
      },
    }
  }
  return nein('invalid_fact')
}

function visaModusKonkret(wert: unknown): Schritt<Exclude<OfficialVisaMode, 'unknown'>> {
  if (typeof wert !== 'string' || wert === 'unknown' || !(OFFICIAL_VISA_MODES as readonly string[]).includes(wert)) {
    return nein('invalid_fact')
  }
  return { ok: true, wert: wert as Exclude<OfficialVisaMode, 'unknown'> }
}

function optionZulassung(wert: unknown): Schritt<LegacyVisaOption['eligibility']> {
  if (wert === 'allowed' || wert === 'not_allowed' || wert === 'unknown') return { ok: true, wert }
  return nein('invalid_fact')
}

function optionMandat(wert: unknown): Schritt<LegacyVisaOption['mandate']> {
  if (wert === 'mandatory' || wert === 'not_mandatory' || wert === 'unknown') return { ok: true, wert }
  return nein('invalid_fact')
}

function visaOptionLesen(wert: unknown, schema1: boolean): Schritt<VisaOption> | { ok: false; reason: 'mixed_outcome' } {
  const satz = datensatz(wert)
  if (!satz) return nein('invalid_fact')
  const hatZulassung = Object.prototype.hasOwnProperty.call(satz, 'eligibility')
  const hatMandat = Object.prototype.hasOwnProperty.call(satz, 'mandate')
  const anwendbarkeit = datensatz(satz.applicability)
  if (anwendbarkeit?.kind === 'branches' && (hatZulassung || hatMandat)) return nein('mixed_outcome')
  if (!schema1) {
    if (!genau(satz, ['visaMode', 'eligibility', 'mandate'])) return nein('invalid_fact')
    const modus = visaModusKonkret(satz.visaMode)
    if (!modus.ok) return modus
    const eligibility = optionZulassung(satz.eligibility)
    if (!eligibility.ok) return eligibility
    const mandate = optionMandat(satz.mandate)
    if (!mandate.ok) return mandate
    return { ok: true, wert: { visaMode: modus.wert, eligibility: eligibility.wert, mandate: mandate.wert } }
  }
  if (genau(satz, ['visaMode', 'eligibility', 'mandate', 'applicability'])) {
    const unbedingt = anwendbarkeitUnbedingt(satz.applicability)
    if (!unbedingt.ok) return unbedingt
    const modus = visaModusKonkret(satz.visaMode)
    if (!modus.ok) return modus
    const eligibility = optionZulassung(satz.eligibility)
    if (!eligibility.ok) return eligibility
    const mandate = optionMandat(satz.mandate)
    if (!mandate.ok) return mandate
    return {
      ok: true,
      wert: {
        visaMode: modus.wert,
        eligibility: eligibility.wert,
        mandate: mandate.wert,
        applicability: unbedingt.wert,
      },
    }
  }
  if (genau(satz, ['visaMode', 'applicability'])) {
    const modus = visaModusKonkret(satz.visaMode)
    if (!modus.ok) return modus
    const zweige = zweigeLesen(satz.applicability, visaAusgangLesen)
    if (!zweige.ok) return zweige
    return {
      ok: true,
      wert: {
        visaMode: modus.wert,
        applicability: { schema: 1, kind: 'branches', branches: zweige.wert },
      },
    }
  }
  return nein('invalid_fact')
}

export function regulierungsAnwendbarkeitVisaOptionLesen(roh: unknown): RegulierungsLeseErgebnis<VisaOptionenFakt> {
  const start = anfang(roh)
  if (start) return nein(start)
  const satz = datensatz(roh)
  if (!satz || satz.kind !== 'visa_options') return nein('invalid_fact')
  const schema1 = Object.prototype.hasOwnProperty.call(satz, 'schema')
  if (schema1) {
    if (!genau(satz, ['kind', 'schema', 'options']) || satz.schema !== 1) return nein('invalid_fact')
  } else if (!genau(satz, ['kind', 'options'])) return nein('invalid_fact')
  if (!Array.isArray(satz.options) || satz.options.length === 0 || satz.options.length > VISA_OPTIONEN_MAX) {
    return nein('invalid_fact')
  }
  const options: VisaOption[] = []
  for (const eintrag of satz.options) {
    const option = visaOptionLesen(eintrag, schema1)
    if (!option.ok) return option
    if (options.some((vorhanden) => vorhanden.visaMode === option.wert.visaMode)) return nein('invalid_fact')
    options.push(option.wert)
  }
  options.sort(
    (links, rechts) => OFFICIAL_VISA_MODES.indexOf(links.visaMode) - OFFICIAL_VISA_MODES.indexOf(rechts.visaMode),
  )
  if (!schema1) {
    return { ok: true, wert: { kind: 'visa_options', options: options as LegacyVisaOption[] } }
  }
  return {
    ok: true,
    wert: {
      kind: 'visa_options',
      schema: 1,
      options: options as (Schema1UnbedingteVisaOption | Schema1VerzweigteVisaOption)[],
    },
  }
}

export function regulierungsWirkungAuswerten(
  fakt: AnforderungswirkungFakt,
  kontext: RegulierungsKontext,
): RegulierungsAuswertung<WirkungsAusgang> {
  if ('effect' in fakt) return unbedingt({ effect: fakt.effect, visaMode: fakt.visaMode })
  return zweigeEntscheiden(fakt.applicability.branches, kontext, wirkungGleich)
}

export function regulierungsVisaOptionAuswerten(
  option: VisaOption,
  kontext: RegulierungsKontext,
): VisaOptionBewertung {
  if ('eligibility' in option) {
    if (option.eligibility === 'unknown') return { status: 'official_unknown', mandate: option.mandate }
    return {
      status: 'auswertung',
      auswertung: unbedingt({ eligibility: option.eligibility, mandate: option.mandate }),
    }
  }
  return { status: 'auswertung', auswertung: zweigeEntscheiden(option.applicability.branches, kontext, visaGleich) }
}

export function regelAnwendbarkeitFingerprint(
  anwendbarkeit: RegulierungsAnwendbarkeit<WirkungsAusgang | VisaOptionsAusgang>,
): string {
  return `${FINGERPRINT_PRAEFIX}${sha256Hex(json(anwendbarkeitObjekt(anwendbarkeit)))}`
}
