// lib/readiness/evidence.ts
//
// Versionierbarer, nicht-personenbezogener Evidence-Vertrag.
// Kandidaten sind keine akzeptierte Wahrheit. Ein Inhaltswechsel ist
// kein automatischer Regelwechsel. Kein Store, kein Netz, keine Engine.
// Die Requirements-/Official-Truth-Engine bleibt die einzige Auswertung.

import { sha256Hex } from '@/lib/readiness/digest'
import { contentEvidenceLookupV3, contentEvidenceVersionV2, contentIdentityBinding, contentIdentityMatches, contentRepresentationFromRegistry, type ContentEvidenceIdentity, type RepresentationRef } from '@/lib/readiness/official-truth-content-identity'
import { TRAVELLER_CONTEXT_GRENZEN, landescodeLesen } from '@/lib/readiness/domain'
import { checkedAtLesen, gültigkeitszeitLesen } from '@/lib/readiness/official'
import {
  quellenUrlAufloesen,
  type QuellenKlasse,
  type QuellenRegistry,
  type QuellenUrlFehler,
  type RegistrierteQuelle,
} from '@/lib/readiness/source-registry'
import { OFFICIAL_REQUIREMENT_TYPES, TRAVELLER_DOCUMENT_TYPES, type OfficialRequirementType, type TravellerDocumentType } from '@/types/trips'

export const EVIDENCE_LIFECYCLES = ['candidate', 'accepted', 'conflicted', 'superseded'] as const
export type EvidenceLifecycle = (typeof EVIDENCE_LIFECYCLES)[number]

export const EVIDENCE_VALIDATION_STATES = ['pending', 'valid', 'rejected'] as const
export type EvidenceValidationState = (typeof EVIDENCE_VALIDATION_STATES)[number]

const SUCHSCHLUESSEL_VERSION = 'evidence-key:v3:'
const VERSION_PREFIX = 'ev2_'
const INHALT_MAX = 65_536
const NOTIZ_MAX = 240

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
  'email',
  'fullName',
  'givenName',
  'familyName',
])

const ENTSCHEIDUNGS_FELDER = [
  'result',
  'required',
  'not_required',
  'conditional',
  'optionEligibility',
  'optionMandate',
  'visaMode',
] as const

const FINGERPRINT_OVERRIDE = ['sourceSnapshot', 'content', 'contentHash', 'sourceContentHash'] as const
const PROVENIENZ_OVERRIDE = ['canonicalUrl', 'retrievedAt', 'identitySchema', 'contentItemId', 'contentItemVersion', 'representationId', 'representationVersion', 'identityProfileId', 'identityProfileVersion', 'contentType'] as const

/**
 * Retrieval-Hülle. Sie wird nicht vom Modell gebaut.
 * URL, Abrufzeit und Quellentext kommen nur von hier.
 */
export type EvidenceQuellenmaterial = {
  contentType: string
  canonicalUrl: string
  retrievedAt: string
  sourceSnapshot: string
}

export type EvidenceRahmenFehler =
  | 'personal_identifier_forbidden'
  | 'model_decision_forbidden'
  | 'source_fingerprint_override_forbidden'
  | 'provenance_override_forbidden'
  | 'invalid_context'
  | 'missing_relevant_context'
  | 'scope_too_wide'
  | 'invalid_source_snapshot'

export type CitizenshipScope =
  | { mode: 'not_applicable' }
  | { mode: 'required'; countryCodes: readonly string[] }

/**
 * Eine Credential-Option. Die Staatsbürgerschaftsmenge bleibt am Scope.
 * `relatedCitizenshipCountryCode` ist nur gesetzt, wenn die Beziehung
 * explizit geliefert wurde. Das Ausstellerland ist keine Staatsbürgerschaft.
 */
export type CredentialOptionAtom =
  | { mode: 'not_applicable' }
  | {
      mode: 'option'
      documentType: TravellerDocumentType
      issuingCountryCode: string
      relatedCitizenshipCountryCode: string | null
    }

export type WohnsitzAtom =
  | { mode: 'not_applicable' }
  | { mode: 'required'; countryCode: string }

export type GueltigkeitsAtom =
  | { mode: 'not_applicable' }
  | { mode: 'travel_date'; travelDate: string }

/** Eine wiederverwendbare, nicht-personenbezogene Evidence-Zelle. Kein Kreuzprodukt. */
export type EvidenceAtom = {
  destinationCountryCode: string | null
  transitCountryCode: string | null
  citizenship: CitizenshipScope
  credentialOption: CredentialOptionAtom
  residence: WohnsitzAtom
  requirementType: OfficialRequirementType
  validity: GueltigkeitsAtom
}

export type EvidenceScope = EvidenceAtom & {
  sourceId: string
}

export type EvidenceVersion = ContentEvidenceIdentity & {
  versionId: string
  previousVersionId: string | null
  lifecycle: EvidenceLifecycle
  validationState: EvidenceValidationState
  sourceId: string
  sourceClass: QuellenKlasse
  authorityName: string | null
  publisherName: string
  canonicalUrl: string
  retrievedAt: string
  /** Fingerabdruck des normalisierten Quellentexts. Nicht die Modellformulierung. */
  sourceContentHash: string
  validFrom: string | null
  validUntil: string | null
  scope: EvidenceScope
  lookupKey: string
  extractionNote: string | null
}

export type EvidenceSuchschluessel =
  | { ok: true; key: string; canonical: string; scope: EvidenceScope }
  | { ok: false; reason: EvidenceRahmenFehler; fields?: readonly string[] }

export type EvidenceSuchschluesselListe =
  | { ok: true; entries: readonly { key: string; canonical: string; scope: EvidenceScope }[] }
  | { ok: false; reason: EvidenceRahmenFehler; fields?: readonly string[] }

export type EvidenceAnnahmeFehler =
  | 'content_identity_mismatch'
  | 'not_candidate'
  | 'source_mismatch'
  | 'invalid_retrieval_time'
  | 'invalid_hash'
  | 'invalid_validity'
  | 'invalid_context'
  | 'lookup_key_mismatch'
  | 'provider_is_not_authority'
  | 'authority_required'

export type EvidenceKandidatErgebnis =
  | { ok: true; evidence: EvidenceVersion }
  | { ok: false; reason: EvidenceRahmenFehler | EvidenceAnnahmeFehler | QuellenUrlFehler; fields?: readonly string[] }

export type EvidenceAnnahmeErgebnis =
  | { ok: true; evidence: EvidenceVersion }
  | { ok: false; reason: EvidenceAnnahmeFehler | EvidenceRahmenFehler | QuellenUrlFehler; fields?: readonly string[] }

export type EvidenceVersionsVergleich =
  | {
      ok: true
      contentChanged: boolean
      ruleChange: 'not_asserted'
      laterAnalysisShortCircuit: boolean
    }
  | { ok: false; reason: 'invalid_hash' }

export type EvidenceKonflikt =
  | {
      ok: true
      overwritten: false
      kept: EvidenceVersion
      situation: 'conflict_preserved' | 'unchanged_content'
      ruleChange: 'not_asserted'
    }
  | { ok: false; reason: 'not_accepted_baseline' | 'different_lookup_key' | 'lookup_key_mismatch' }

/**
 * Späterer Persistenz-Port. Dieser Slice hat keine Implementierung,
 * keinen Speicher und keinen Supabase-Client.
 */
export type OfficialEvidenceStore = {
  lesen(lookupKey: string): Promise<readonly EvidenceVersion[]>
}

type RahmenFehler = { ok: false; reason: EvidenceRahmenFehler; fields?: readonly string[] }

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function personenkennung(wert: unknown, tiefe = 0): boolean {
  if (tiefe > 5 || !wert || typeof wert !== 'object') return false
  if (Array.isArray(wert)) return wert.some((eintrag) => personenkennung(eintrag, tiefe + 1))
  return Object.entries(wert as Record<string, unknown>).some(
    ([schluessel, kind]) => PERSONEN_SCHLUESSEL.has(schluessel) || personenkennung(kind, tiefe + 1),
  )
}

function schluesselSammeln(
  wert: unknown,
  namen: readonly string[],
  tiefe = 0,
  gesehen = new Set<string>(),
): string[] {
  if (tiefe > 6 || !wert || typeof wert !== 'object') return [...gesehen]
  if (Array.isArray(wert)) {
    for (const eintrag of wert) schluesselSammeln(eintrag, namen, tiefe + 1, gesehen)
    return [...gesehen]
  }
  for (const [schluessel, kind] of Object.entries(wert as Record<string, unknown>)) {
    if (namen.includes(schluessel)) gesehen.add(schluessel)
    schluesselSammeln(kind, namen, tiefe + 1, gesehen)
  }
  return [...gesehen]
}

function entscheidungsfelder(wert: unknown): string[] {
  return schluesselSammeln(wert, ENTSCHEIDUNGS_FELDER)
}

function fingerprintOverride(wert: unknown): string[] {
  return schluesselSammeln(wert, FINGERPRINT_OVERRIDE)
}

function provenienzOverride(wert: unknown): string[] {
  return schluesselSammeln(wert, PROVENIENZ_OVERRIDE)
}

function reisedatumLesen(wert: unknown): string | null {
  if (typeof wert !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return null
  const jahr = Number(wert.slice(0, 4))
  const monat = Number(wert.slice(5, 7))
  const tag = Number(wert.slice(8, 10))
  const datum = new Date(Date.UTC(jahr, monat - 1, tag))
  if (datum.getUTCFullYear() !== jahr || datum.getUTCMonth() !== monat - 1 || datum.getUTCDate() !== tag) {
    return null
  }
  return wert
}

function hashLesen(wert: unknown): string | null {
  if (typeof wert !== 'string' || !/^[a-f0-9]{64}$/.test(wert)) return null
  return wert
}

function landOderNull(wert: unknown): { ok: true; code: string | null } | RahmenFehler {
  if (wert == null) return { ok: true, code: null }
  const code = landescodeLesen(wert)
  if (!code) return { ok: false, reason: 'invalid_context' }
  return { ok: true, code }
}

function citizenshipScope(wert: unknown): { ok: true; scope: CitizenshipScope } | RahmenFehler {
  const satz = datensatz(wert)
  if (!satz || (satz.mode !== 'not_applicable' && satz.mode !== 'required')) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  if (satz.mode === 'not_applicable') return { ok: true, scope: { mode: 'not_applicable' } }
  const codes = laenderListe(satz.countryCodes)
  if (!codes.ok) return codes
  if (codes.codes.length > TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller) {
    return { ok: false, reason: 'scope_too_wide' }
  }
  return { ok: true, scope: { mode: 'required', countryCodes: codes.codes } }
}

function bezogeneStaatsbuergerschaft(
  wert: Record<string, unknown>,
  citizenship: CitizenshipScope,
): { ok: true; related: string | null } | RahmenFehler {
  if (!('relatedCitizenshipCountryCode' in wert)) return { ok: false, reason: 'missing_relevant_context' }
  if (wert.relatedCitizenshipCountryCode == null) return { ok: true, related: null }
  const related = landescodeLesen(wert.relatedCitizenshipCountryCode)
  if (!related) return { ok: false, reason: 'invalid_context' }
  if (citizenship.mode !== 'required' || !citizenship.countryCodes.includes(related)) {
    return { ok: false, reason: 'invalid_context' }
  }
  return { ok: true, related }
}

function credentialOptionAtom(
  wert: unknown,
  citizenship: CitizenshipScope,
): { ok: true; option: CredentialOptionAtom } | RahmenFehler {
  const satz = datensatz(wert)
  if (!satz || (satz.mode !== 'not_applicable' && satz.mode !== 'option')) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  if (satz.mode === 'not_applicable') return { ok: true, option: { mode: 'not_applicable' } }
  if (typeof satz.documentType !== 'string' || !(TRAVELLER_DOCUMENT_TYPES as readonly string[]).includes(satz.documentType)) {
    return { ok: false, reason: 'invalid_context' }
  }
  const issuing = landescodeLesen(satz.issuingCountryCode)
  if (!issuing) return { ok: false, reason: 'missing_relevant_context' }
  const related = bezogeneStaatsbuergerschaft(satz, citizenship)
  if (!related.ok) return related
  return {
    ok: true,
    option: {
      mode: 'option',
      documentType: satz.documentType as TravellerDocumentType,
      issuingCountryCode: issuing,
      relatedCitizenshipCountryCode: related.related,
    },
  }
}

function wohnsitzAtom(wert: unknown): { ok: true; atom: WohnsitzAtom } | RahmenFehler {
  const satz = datensatz(wert)
  if (!satz || (satz.mode !== 'not_applicable' && satz.mode !== 'required')) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  if (satz.mode === 'not_applicable') return { ok: true, atom: { mode: 'not_applicable' } }
  const code = landescodeLesen(satz.countryCode)
  if (!code) return { ok: false, reason: 'invalid_context' }
  return { ok: true, atom: { mode: 'required', countryCode: code } }
}

function gueltigkeitAtom(wert: unknown): { ok: true; atom: GueltigkeitsAtom } | RahmenFehler {
  const satz = datensatz(wert)
  if (!satz || (satz.mode !== 'not_applicable' && satz.mode !== 'travel_date')) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  if (satz.mode === 'not_applicable') return { ok: true, atom: { mode: 'not_applicable' } }
  const travelDate = reisedatumLesen(satz.travelDate)
  if (!travelDate) return { ok: false, reason: 'invalid_context' }
  return { ok: true, atom: { mode: 'travel_date', travelDate } }
}

function anforderungLesen(wert: unknown): { ok: true; requirementType: OfficialRequirementType } | RahmenFehler {
  if (typeof wert !== 'string' || !(OFFICIAL_REQUIREMENT_TYPES as readonly string[]).includes(wert)) {
    return { ok: false, reason: 'invalid_context' }
  }
  return { ok: true, requirementType: wert as OfficialRequirementType }
}

function atomeAus(satz: Record<string, unknown>): { ok: true; atom: EvidenceAtom } | RahmenFehler {
  const rahmen = rahmenFelder(satz)
  if (!rahmen.ok) return rahmen
  if (!('credentialOption' in satz)) return { ok: false, reason: 'missing_relevant_context' }
  const option = credentialOptionAtom(satz.credentialOption, rahmen.citizenship)
  if (!option.ok) return option
  return {
    ok: true,
    atom: {
      destinationCountryCode: rahmen.destination,
      transitCountryCode: rahmen.transit,
      citizenship: rahmen.citizenship,
      credentialOption: option.option,
      residence: rahmen.residence,
      requirementType: rahmen.requirementType,
      validity: rahmen.validity,
    },
  }
}

function kanonisch(scope: EvidenceScope): string {
  const citizenshipCountryCodes = scope.citizenship.mode === 'required' ? scope.citizenship.countryCodes : []
  const option = scope.credentialOption
  const relation =
    option.mode === 'not_applicable' ? 'not_applicable' : option.relatedCitizenshipCountryCode ? 'explicit' : 'unlinked'
  const residenceCountryCode = scope.residence.mode === 'required' ? scope.residence.countryCode : null
  const travelDate = scope.validity.mode === 'travel_date' ? scope.validity.travelDate : null
  return JSON.stringify({
    sourceId: scope.sourceId,
    destinationCountryCode: scope.destinationCountryCode,
    transitCountryCode: scope.transitCountryCode,
    citizenshipMode: scope.citizenship.mode,
    citizenshipCountryCodes,
    credentialOptionMode: option.mode,
    documentType: option.mode === 'option' ? option.documentType : null,
    issuingCountryCode: option.mode === 'option' ? option.issuingCountryCode : null,
    relatedCitizenshipCountryCode: option.mode === 'option' ? option.relatedCitizenshipCountryCode : null,
    relation,
    residenceMode: scope.residence.mode,
    residenceCountryCode,
    requirementType: scope.requirementType,
    validityMode: scope.validity.mode,
    travelDate,
  })
}


function sourceIdLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const id = wert.trim()
  return /^[a-z][a-z0-9_-]{1,63}$/.test(id) ? id : null
}

function laenderListe(wert: unknown): { ok: true; codes: string[] } | RahmenFehler {
  if (!Array.isArray(wert) || wert.length === 0) return { ok: false, reason: 'missing_relevant_context' }
  const codes: string[] = []
  for (const eintrag of wert) {
    const code = landescodeLesen(eintrag)
    if (!code) return { ok: false, reason: 'invalid_context' }
    if (!codes.includes(code)) codes.push(code)
  }
  codes.sort()
  return { ok: true, codes }
}

function credentialOptionen(
  wert: unknown,
  citizenship: CitizenshipScope,
): { ok: true; options: CredentialOptionAtom[] } | RahmenFehler {
  const satz = datensatz(wert)
  if (!satz || (satz.mode !== 'not_applicable' && satz.mode !== 'required')) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  if (satz.mode === 'not_applicable') return { ok: true, options: [{ mode: 'not_applicable' }] }
  if (!Array.isArray(satz.options) || satz.options.length === 0) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  if (satz.options.length > TRAVELLER_CONTEXT_GRENZEN.documentsJeTraveller) {
    return { ok: false, reason: 'scope_too_wide' }
  }
  const options: Extract<CredentialOptionAtom, { mode: 'option' }>[] = []
  for (const eintrag of satz.options) {
    const basis = datensatz(eintrag)
    if (!basis) return { ok: false, reason: 'invalid_context' }
    const atom = credentialOptionAtom({ ...basis, mode: 'option' }, citizenship)
    if (!atom.ok) return atom
    if (atom.option.mode !== 'option') return { ok: false, reason: 'invalid_context' }
    const option = atom.option
    const schon = options.some(
      (vorhanden) =>
        vorhanden.documentType === option.documentType &&
        vorhanden.issuingCountryCode === option.issuingCountryCode &&
        vorhanden.relatedCitizenshipCountryCode === option.relatedCitizenshipCountryCode,
    )
    if (!schon) options.push(option)
  }
  options.sort((links, rechts) => {
    const a = `${links.documentType}:${links.issuingCountryCode}:${links.relatedCitizenshipCountryCode ?? ''}`
    const b = `${rechts.documentType}:${rechts.issuingCountryCode}:${rechts.relatedCitizenshipCountryCode ?? ''}`
    return a < b ? -1 : a > b ? 1 : 0
  })
  return { ok: true, options }
}

/**
 * Fingerabdruck eines von Jetnity normalisierten Quellentexts.
 * Die Funktion kennt keine Modellformulierung. Zeilenenden werden
 * vereinheitlicht; der Text selbst wird nicht gekürzt.
 */
export function evidenceQuellenFingerprint(snapshot: string): string | null {
  if (typeof snapshot !== 'string' || snapshot.length === 0 || snapshot.length > INHALT_MAX) return null
  const normalisiert = snapshot.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!normalisiert) return null
  return sha256Hex(normalisiert)
}

function rahmenFelder(satz: Record<string, unknown>):
  | {
      ok: true
      destination: string | null
      transit: string | null
      citizenship: CitizenshipScope
      residence: WohnsitzAtom
      requirementType: OfficialRequirementType
      validity: GueltigkeitsAtom
    }
  | RahmenFehler {
  if (!('destinationCountryCode' in satz) || !('transitCountryCode' in satz)) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  const destination = landOderNull(satz.destinationCountryCode)
  if (!destination.ok) return destination
  const transit = landOderNull(satz.transitCountryCode)
  if (!transit.ok) return transit
  if (!destination.code && !transit.code) return { ok: false, reason: 'missing_relevant_context' }
  if (!('citizenship' in satz) || !('residence' in satz) || !('validity' in satz)) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  const citizenship = citizenshipScope(satz.citizenship)
  if (!citizenship.ok) return citizenship
  const residence = wohnsitzAtom(satz.residence)
  if (!residence.ok) return residence
  const requirement = anforderungLesen(satz.requirementType)
  if (!requirement.ok) return requirement
  const validity = gueltigkeitAtom(satz.validity)
  if (!validity.ok) return validity
  return {
    ok: true,
    destination: destination.code,
    transit: transit.code,
    citizenship: citizenship.scope,
    residence: residence.atom,
    requirementType: requirement.requirementType,
    validity: validity.atom,
  }
}

export function evidenceScopeLesen(eingabe: unknown):
  | { ok: true; scope: EvidenceScope; canonical: string }
  | RahmenFehler {
  if (personenkennung(eingabe)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const felder = entscheidungsfelder(eingabe)
  if (felder.length > 0) return { ok: false, reason: 'model_decision_forbidden', fields: felder }
  const satz = datensatz(eingabe)
  if (!satz) return { ok: false, reason: 'invalid_context' }
  const sourceId = sourceIdLesen(satz.sourceId)
  if (!sourceId) return { ok: false, reason: 'invalid_context' }
  const atom = atomeAus(satz)
  if (!atom.ok) return atom
  const scope: EvidenceScope = { ...atom.atom, sourceId }
  return { ok: true, scope, canonical: kanonisch(scope) }
}

/** A live lookup always names one exact representation; a source-only key is invalid. */
export function evidenceSuchschluessel(eingabe: unknown, representation?: RepresentationRef): EvidenceSuchschluessel {
  const scope = evidenceScopeLesen(eingabe)
  if (!scope.ok) return scope
  const lookup = contentEvidenceLookupV3(scope.scope, representation)
  if (!lookup.ok || !lookup.value.key.startsWith(SUCHSCHLUESSEL_VERSION)) return { ok: false, reason: 'invalid_context' }
  return { ok: true, scope: scope.scope, key: lookup.value.key, canonical: lookup.value.canonical }
}

/**
 * Eine Zelle je expliziter Credential-Option.
 * Jede Zelle trägt die volle Staatsbürgerschaftsmenge.
 * Die Eingabereihenfolge ist bedeutungslos. Es gibt kein Kreuzprodukt.
 */
export function evidenceSuchschluesselListe(eingabe: unknown, representation?: RepresentationRef): EvidenceSuchschluesselListe {
  if (personenkennung(eingabe)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const felder = entscheidungsfelder(eingabe)
  if (felder.length > 0) return { ok: false, reason: 'model_decision_forbidden', fields: felder }
  const satz = datensatz(eingabe)
  if (!satz) return { ok: false, reason: 'invalid_context' }
  const sourceId = sourceIdLesen(satz.sourceId)
  if (!sourceId) return { ok: false, reason: 'invalid_context' }
  const kombinationen = evidenceKombinationen(satz)
  if (!kombinationen.ok) return kombinationen
  const entries: { key: string; canonical: string; scope: EvidenceScope }[] = []
  for (const atom of kombinationen.atoms) {
    const scope: EvidenceScope = { ...atom, sourceId }
    const lookup = evidenceSuchschluessel(scope, representation)
    if (!lookup.ok) return lookup
    entries.push({ scope, key: lookup.key, canonical: lookup.canonical })
  }
  entries.sort((links, rechts) => (links.canonical < rechts.canonical ? -1 : links.canonical > rechts.canonical ? 1 : 0))
  return { ok: true, entries }
}

export function evidenceKombinationen(
  eingabe: unknown,
): { ok: true; atoms: EvidenceAtom[] } | RahmenFehler {
  if (personenkennung(eingabe)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const satz = datensatz(eingabe)
  if (!satz) return { ok: false, reason: 'invalid_context' }
  if (!('credentialOptions' in satz)) return { ok: false, reason: 'missing_relevant_context' }
  const rahmen = rahmenFelder(satz)
  if (!rahmen.ok) return rahmen
  const options = credentialOptionen(satz.credentialOptions, rahmen.citizenship)
  if (!options.ok) return options

  const atoms: EvidenceAtom[] = options.options.map((credentialOption) => ({
    destinationCountryCode: rahmen.destination,
    transitCountryCode: rahmen.transit,
    citizenship: rahmen.citizenship,
    credentialOption,
    residence: rahmen.residence,
    requirementType: rahmen.requirementType,
    validity: rahmen.validity,
  }))
  return { ok: true, atoms }
}

function notizLesen(wert: unknown): { ok: true; note: string | null } | { ok: false; reason: 'invalid_context' } {
  if (wert == null) return { ok: true, note: null }
  if (typeof wert !== 'string') return { ok: false, reason: 'invalid_context' }
  const text = wert.trim()
  if (!text) return { ok: true, note: null }
  if (text.length > NOTIZ_MAX || /[\u0000-\u001f]/.test(text)) return { ok: false, reason: 'invalid_context' }
  return { ok: true, note: text }
}

function gueltigkeitsfenster(satz: Record<string, unknown>): { ok: true; validFrom: string | null; validUntil: string | null } | { ok: false; reason: 'invalid_validity' } {
  const validFrom = satz.validFrom == null ? null : gültigkeitszeitLesen(satz.validFrom)
  const validUntil = satz.validUntil == null ? null : gültigkeitszeitLesen(satz.validUntil)
  if (satz.validFrom != null && !validFrom) return { ok: false, reason: 'invalid_validity' }
  if (satz.validUntil != null && !validUntil) return { ok: false, reason: 'invalid_validity' }
  if (validFrom && validUntil && Date.parse(validFrom.length === 10 ? `${validFrom}T00:00:00.000Z` : validFrom) > Date.parse(validUntil.length === 10 ? `${validUntil}T00:00:00.000Z` : validUntil)) {
    return { ok: false, reason: 'invalid_validity' }
  }
  return { ok: true, validFrom, validUntil }
}

/** Rebuild ev2 without trusting any supplied version id or extra fields. */
function versionIdFuer(value: ContentEvidenceIdentity): string | null {
  const built = contentEvidenceVersionV2({ ...contentIdentityBinding(value), identitySchema: value.identitySchema,
    lookupKey: value.lookupKey, canonicalUrl: value.canonicalUrl, contentType: value.contentType,
    sourceContentHash: value.sourceContentHash, retrievedAt: value.retrievedAt,
    validFrom: value.validFrom, validUntil: value.validUntil })
  return built.ok && built.value.versionId.startsWith(VERSION_PREFIX) ? built.value.versionId : null
}

function identitaetPasst(value: EvidenceVersion, registry: QuellenRegistry): boolean {
  const rep = contentRepresentationFromRegistry(registry, value.canonicalUrl)
  return rep.ok && value.identitySchema === 2 && contentIdentityMatches(value, rep.value)
    && value.canonicalUrl === rep.value.expectedFinalUrl && value.contentType === rep.value.expectedMediaType
    && versionIdFuer(value) === value.versionId
}

function quellePasst(quelle: RegistrierteQuelle, evidence: Pick<EvidenceVersion, 'sourceId' | 'sourceClass' | 'authorityName' | 'publisherName'>): boolean {
  return (
    quelle.sourceId === evidence.sourceId &&
    quelle.sourceClass === evidence.sourceClass &&
    quelle.authorityName === evidence.authorityName &&
    quelle.publisherName === evidence.publisherName
  )
}

/**
 * Modellausgabe wird höchstens ein Kandidat.
 * URL, Abrufzeit und Quellentext kommen nur aus `material`.
 * Das Modellobjekt darf diese Retrieval-Fakten weder liefern noch überschreiben.
 * Entscheidungsfelder werden nicht übernommen und nicht in Official Truth übersetzt.
 */
export function evidenceKandidatAusModell(
  modell: unknown,
  material: EvidenceQuellenmaterial,
  registry: QuellenRegistry,
): EvidenceKandidatErgebnis {
  if (personenkennung(modell)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const felder = entscheidungsfelder(modell)
  if (felder.length > 0) return { ok: false, reason: 'model_decision_forbidden', fields: felder }
  const provenienz = provenienzOverride(modell)
  if (provenienz.length > 0) return { ok: false, reason: 'provenance_override_forbidden', fields: provenienz }
  const override = fingerprintOverride(modell)
  if (override.length > 0) return { ok: false, reason: 'source_fingerprint_override_forbidden', fields: override }
  const hülle = material && typeof material === 'object' && !Array.isArray(material) ? material : null
  const snapshot = hülle ? hülle.sourceSnapshot : null
  const sourceContentHash = typeof snapshot === 'string' ? evidenceQuellenFingerprint(snapshot) : null
  if (!sourceContentHash || !hülle) return { ok: false, reason: 'invalid_source_snapshot' }
  const satz = datensatz(modell)
  if (!satz) return { ok: false, reason: 'invalid_context' }
  const url = quellenUrlAufloesen(registry, hülle.canonicalUrl)
  if (!url.ok) return url
  const representation = contentRepresentationFromRegistry(registry, hülle.canonicalUrl)
  if (!representation.ok || hülle.canonicalUrl !== representation.value.expectedFinalUrl
    || hülle.contentType !== representation.value.expectedMediaType) return { ok: false, reason: 'content_identity_mismatch' }
  const identity = contentIdentityBinding(representation.value)
  const schluessel = evidenceSuchschluessel(satz.scope ?? satz, { sourceId: identity.sourceId,
    contentItemId: identity.contentItemId, representationId: identity.representationId })
  if (!schluessel.ok) return schluessel
  if (url.source.sourceId !== schluessel.scope.sourceId) return { ok: false, reason: 'source_mismatch' }
  const retrievedAt = checkedAtLesen(hülle.retrievedAt)
  if (!retrievedAt) return { ok: false, reason: 'invalid_retrieval_time' }
  const fenster = gueltigkeitsfenster(satz)
  if (!fenster.ok) return fenster
  const note = notizLesen(satz.extractionNote)
  if (!note.ok) return note
  if (url.source.sourceClass === 'licensed_evidence_provider' && url.source.authorityName !== null) {
    return { ok: false, reason: 'provider_is_not_authority' }
  }
  if (url.source.sourceClass === 'official_authority' && !url.source.authorityName) {
    return { ok: false, reason: 'authority_required' }
  }
  const observation: ContentEvidenceIdentity = { ...identity, identitySchema: 2, lookupKey: schluessel.key,
    canonicalUrl: url.canonicalUrl, contentType: hülle.contentType, sourceContentHash, retrievedAt,
    validFrom: fenster.validFrom, validUntil: fenster.validUntil }
  const versionId = versionIdFuer(observation)
  if (!versionId) return { ok: false, reason: 'content_identity_mismatch' }
  const evidence: EvidenceVersion = {
    ...observation,
    versionId,
    previousVersionId: null,
    lifecycle: 'candidate',
    validationState: 'pending',
    sourceId: url.source.sourceId,
    sourceClass: url.source.sourceClass,
    authorityName: url.source.authorityName,
    publisherName: url.source.publisherName,
    canonicalUrl: url.canonicalUrl,
    retrievedAt,
    sourceContentHash,
    validFrom: fenster.validFrom,
    validUntil: fenster.validUntil,
    scope: schluessel.scope,
    lookupKey: schluessel.key,
    extractionNote: note.note,
  }
  return { ok: true, evidence }
}

export function evidenceKandidatAkzeptieren(
  kandidat: EvidenceVersion,
  registry: QuellenRegistry,
): EvidenceAnnahmeErgebnis {
  if (kandidat.lifecycle !== 'candidate' || kandidat.validationState !== 'pending') {
    return { ok: false, reason: 'not_candidate' }
  }
  const felder = entscheidungsfelder(kandidat)
  if (felder.length > 0) return { ok: false, reason: 'model_decision_forbidden', fields: felder }
  const url = quellenUrlAufloesen(registry, kandidat.canonicalUrl)
  if (!url.ok) return url
  if (kandidat.sourceClass === 'licensed_evidence_provider' && kandidat.authorityName !== null) {
    return { ok: false, reason: 'provider_is_not_authority' }
  }
  if (kandidat.sourceClass === 'official_authority' && !kandidat.authorityName) {
    return { ok: false, reason: 'authority_required' }
  }
  if (!quellePasst(url.source, kandidat)) return { ok: false, reason: 'source_mismatch' }
  if (!checkedAtLesen(kandidat.retrievedAt)) return { ok: false, reason: 'invalid_retrieval_time' }
  if (!hashLesen(kandidat.sourceContentHash)) return { ok: false, reason: 'invalid_hash' }
  const fenster = gueltigkeitsfenster({ validFrom: kandidat.validFrom, validUntil: kandidat.validUntil })
  if (!fenster.ok) return fenster
  if (!identitaetPasst(kandidat, registry)) return { ok: false, reason: 'content_identity_mismatch' }
  const erneut = evidenceSuchschluessel(kandidat.scope, { sourceId: kandidat.sourceId, contentItemId: kandidat.contentItemId, representationId: kandidat.representationId })
  if (!erneut.ok) return erneut
  if (erneut.key !== kandidat.lookupKey) return { ok: false, reason: 'lookup_key_mismatch' }
  return {
    ok: true,
    evidence: {
      ...kandidat,
      lifecycle: 'accepted',
      validationState: 'valid',
      authorityName: url.source.authorityName,
      publisherName: url.source.publisherName,
      canonicalUrl: url.canonicalUrl,
      lookupKey: erneut.key,
      scope: erneut.scope,
    },
  }
}

/** Nur strukturell akzeptierte Evidence. Ein Kandidat bleibt null. */
export function akzeptierteEvidenceLesen(version: EvidenceVersion, registry: QuellenRegistry): EvidenceVersion | null {
  if (version.lifecycle !== 'accepted' || version.validationState !== 'valid') return null
  if (entscheidungsfelder(version).length > 0) return null
  const url = quellenUrlAufloesen(registry, version.canonicalUrl)
  if (!url.ok || !quellePasst(url.source, version)) return null
  if (!checkedAtLesen(version.retrievedAt) || !hashLesen(version.sourceContentHash)) return null
  if (!identitaetPasst(version, registry)) return null
  const erneut = evidenceSuchschluessel(version.scope, { sourceId: version.sourceId, contentItemId: version.contentItemId, representationId: version.representationId })
  if (!erneut.ok || erneut.key !== version.lookupKey) return null
  if (version.sourceClass === 'licensed_evidence_provider' && version.authorityName !== null) return null
  if (version.sourceClass === 'official_authority' && !version.authorityName) return null
  return version
}

export function evidenceVersionenVergleichen(
  vorher: { sourceContentHash: unknown },
  nachher: { sourceContentHash: unknown },
): EvidenceVersionsVergleich {
  const links = hashLesen(vorher.sourceContentHash)
  const rechts = hashLesen(nachher.sourceContentHash)
  if (!links || !rechts) return { ok: false, reason: 'invalid_hash' }
  const contentChanged = links !== rechts
  return {
    ok: true,
    contentChanged,
    ruleChange: 'not_asserted',
    laterAnalysisShortCircuit: !contentChanged,
  }
}

/**
 * Akzeptierte Evidence wird bei Konflikt nicht ersetzt.
 * Ein anderer Hash erzeugt Konfliktsemantik, aber keinen Regelwechsel
 * und kein stilles Überschreiben.
 */
export function evidenceKonfliktHalten(bestehend: EvidenceVersion, eingehend: EvidenceVersion): EvidenceKonflikt {
  const basis = evidenceSuchschluessel(bestehend.scope, { sourceId: bestehend.sourceId, contentItemId: bestehend.contentItemId, representationId: bestehend.representationId })
  const neu = evidenceSuchschluessel(eingehend.scope, { sourceId: eingehend.sourceId, contentItemId: eingehend.contentItemId, representationId: eingehend.representationId })
  if (!basis.ok || !neu.ok || basis.key !== bestehend.lookupKey || neu.key !== eingehend.lookupKey) {
    return { ok: false, reason: 'lookup_key_mismatch' }
  }
  if (basis.key !== neu.key) return { ok: false, reason: 'different_lookup_key' }
  if (bestehend.lifecycle !== 'accepted' || bestehend.validationState !== 'valid') {
    return { ok: false, reason: 'not_accepted_baseline' }
  }
  return {
    ok: true,
    overwritten: false,
    kept: structuredClone(bestehend),
    situation: bestehend.sourceContentHash === eingehend.sourceContentHash ? 'unchanged_content' : 'conflict_preserved',
    ruleChange: 'not_asserted',
  }
}
