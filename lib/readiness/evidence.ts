// lib/readiness/evidence.ts
//
// Versionierbarer, nicht-personenbezogener Evidence-Vertrag.
// Kandidaten sind keine akzeptierte Wahrheit. Ein Inhaltswechsel ist
// kein automatischer Regelwechsel. Kein Store, kein Netz, keine Engine.
// Die Requirements-/Official-Truth-Engine bleibt die einzige Auswertung.

import { sha256Hex } from '@/lib/readiness/digest'
import { landescodeLesen } from '@/lib/readiness/domain'
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

const SUCHSCHLUESSEL_VERSION = 'evidence-key:v1:'
const VERSION_PREFIX = 'ev1_'
const INHALT_MAX = 65_536
const NOTIZ_MAX = 240
const KOMBINATION_MAX = 96

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

export type EvidenceRahmenFehler =
  | 'personal_identifier_forbidden'
  | 'model_decision_forbidden'
  | 'invalid_context'
  | 'missing_relevant_context'
  | 'scope_too_wide'

export type StaatsbuergerschaftsAtom =
  | { mode: 'not_applicable' }
  | { mode: 'required'; countryCode: string }

export type DokumentAtom =
  | { mode: 'not_applicable' }
  | { mode: 'required'; documentType: TravellerDocumentType; issuingCountryCode: string }

export type WohnsitzAtom =
  | { mode: 'not_applicable' }
  | { mode: 'required'; countryCode: string }

export type GueltigkeitsAtom =
  | { mode: 'not_applicable' }
  | { mode: 'travel_date'; travelDate: string }

/** Eine wiederverwendbare, nicht-personenbezogene Evidence-Zelle. */
export type EvidenceAtom = {
  destinationCountryCode: string | null
  transitCountryCode: string | null
  citizenship: StaatsbuergerschaftsAtom
  document: DokumentAtom
  residence: WohnsitzAtom
  requirementType: OfficialRequirementType
  validity: GueltigkeitsAtom
}

export type EvidenceScope = EvidenceAtom & {
  sourceId: string
}

export type EvidenceVersion = {
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
  contentHash: string
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

function entscheidungsfelder(wert: unknown, tiefe = 0, gesehen = new Set<string>()): string[] {
  if (tiefe > 6 || !wert || typeof wert !== 'object') return [...gesehen]
  if (Array.isArray(wert)) {
    for (const eintrag of wert) entscheidungsfelder(eintrag, tiefe + 1, gesehen)
    return [...gesehen]
  }
  for (const [schluessel, kind] of Object.entries(wert as Record<string, unknown>)) {
    if ((ENTSCHEIDUNGS_FELDER as readonly string[]).includes(schluessel)) gesehen.add(schluessel)
    entscheidungsfelder(kind, tiefe + 1, gesehen)
  }
  return [...gesehen]
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

function staatsbuergerschaftAtom(wert: unknown): { ok: true; atom: StaatsbuergerschaftsAtom } | RahmenFehler {
  const satz = datensatz(wert)
  if (!satz || (satz.mode !== 'not_applicable' && satz.mode !== 'required')) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  if (satz.mode === 'not_applicable') return { ok: true, atom: { mode: 'not_applicable' } }
  const code = landescodeLesen(satz.countryCode)
  if (!code) return { ok: false, reason: 'invalid_context' }
  return { ok: true, atom: { mode: 'required', countryCode: code } }
}

function dokumentAtom(wert: unknown): { ok: true; atom: DokumentAtom } | RahmenFehler {
  const satz = datensatz(wert)
  if (!satz || (satz.mode !== 'not_applicable' && satz.mode !== 'required')) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  if (satz.mode === 'not_applicable') return { ok: true, atom: { mode: 'not_applicable' } }
  if (typeof satz.documentType !== 'string' || !(TRAVELLER_DOCUMENT_TYPES as readonly string[]).includes(satz.documentType)) {
    return { ok: false, reason: 'invalid_context' }
  }
  const issuing = landescodeLesen(satz.issuingCountryCode)
  if (!issuing) return { ok: false, reason: 'missing_relevant_context' }
  return {
    ok: true,
    atom: {
      mode: 'required',
      documentType: satz.documentType as TravellerDocumentType,
      issuingCountryCode: issuing,
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
  if (!('destinationCountryCode' in satz) || !('transitCountryCode' in satz)) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  const destination = landOderNull(satz.destinationCountryCode)
  if (!destination.ok) return destination
  const transit = landOderNull(satz.transitCountryCode)
  if (!transit.ok) return transit
  if (!destination.code && !transit.code) return { ok: false, reason: 'missing_relevant_context' }
  if (!('citizenship' in satz) || !('document' in satz) || !('residence' in satz) || !('validity' in satz)) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  const citizenship = staatsbuergerschaftAtom(satz.citizenship)
  if (!citizenship.ok) return citizenship
  const document = dokumentAtom(satz.document)
  if (!document.ok) return document
  const residence = wohnsitzAtom(satz.residence)
  if (!residence.ok) return residence
  const requirement = anforderungLesen(satz.requirementType)
  if (!requirement.ok) return requirement
  const validity = gueltigkeitAtom(satz.validity)
  if (!validity.ok) return validity
  return {
    ok: true,
    atom: {
      destinationCountryCode: destination.code,
      transitCountryCode: transit.code,
      citizenship: citizenship.atom,
      document: document.atom,
      residence: residence.atom,
      requirementType: requirement.requirementType,
      validity: validity.atom,
    },
  }
}

function kanonisch(scope: EvidenceScope): string {
  const citizenshipCountryCode = scope.citizenship.mode === 'required' ? scope.citizenship.countryCode : null
  const documentType = scope.document.mode === 'required' ? scope.document.documentType : null
  const issuingCountryCode = scope.document.mode === 'required' ? scope.document.issuingCountryCode : null
  const residenceCountryCode = scope.residence.mode === 'required' ? scope.residence.countryCode : null
  const travelDate = scope.validity.mode === 'travel_date' ? scope.validity.travelDate : null
  return JSON.stringify({
    v: 1,
    sourceId: scope.sourceId,
    destinationCountryCode: scope.destinationCountryCode,
    transitCountryCode: scope.transitCountryCode,
    citizenshipMode: scope.citizenship.mode,
    citizenshipCountryCode,
    documentMode: scope.document.mode,
    documentType,
    issuingCountryCode,
    residenceMode: scope.residence.mode,
    residenceCountryCode,
    requirementType: scope.requirementType,
    validityMode: scope.validity.mode,
    travelDate,
  })
}

function schluesselAusScope(scope: EvidenceScope): { key: string; canonical: string } {
  const canonical = kanonisch(scope)
  return { canonical, key: `${SUCHSCHLUESSEL_VERSION}${sha256Hex(canonical)}` }
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

function dokumentOptionen(wert: unknown): { ok: true; options: { documentType: TravellerDocumentType; issuingCountryCode: string }[] } | RahmenFehler {
  if (!Array.isArray(wert) || wert.length === 0) return { ok: false, reason: 'missing_relevant_context' }
  const options: { documentType: TravellerDocumentType; issuingCountryCode: string }[] = []
  for (const eintrag of wert) {
    const basis = datensatz(eintrag)
    if (!basis) return { ok: false, reason: 'invalid_context' }
    const atom = dokumentAtom({ ...basis, mode: 'required' })
    if (!atom.ok) return atom
    if (atom.atom.mode !== 'required') return { ok: false, reason: 'invalid_context' }
    const documentType = atom.atom.documentType
    const issuingCountryCode = atom.atom.issuingCountryCode
    const schon = options.some((option) => option.documentType === documentType && option.issuingCountryCode === issuingCountryCode)
    if (!schon) options.push({ documentType, issuingCountryCode })
  }
  options.sort((links, rechts) => {
    const a = `${links.documentType}:${links.issuingCountryCode}`
    const b = `${rechts.documentType}:${rechts.issuingCountryCode}`
    return a < b ? -1 : a > b ? 1 : 0
  })
  return { ok: true, options }
}

export function evidenceInhaltHash(inhalt: string): string {
  return sha256Hex(inhalt)
}

export function evidenceSuchschluessel(eingabe: unknown): EvidenceSuchschluessel {
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
  return { ok: true, scope, ...schluesselAusScope(scope) }
}

/**
 * Eine Schlüsselmenge je Staatsbürgerschaft und Dokumentoption.
 * Die Eingabereihenfolge ist bedeutungslos. Keine Option wird auf die erste reduziert.
 */
export function evidenceSuchschluesselListe(eingabe: unknown): EvidenceSuchschluesselListe {
  if (personenkennung(eingabe)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const felder = entscheidungsfelder(eingabe)
  if (felder.length > 0) return { ok: false, reason: 'model_decision_forbidden', fields: felder }
  const satz = datensatz(eingabe)
  if (!satz) return { ok: false, reason: 'invalid_context' }
  const sourceId = sourceIdLesen(satz.sourceId)
  if (!sourceId) return { ok: false, reason: 'invalid_context' }
  const kombinationen = evidenceKombinationen(satz)
  if (!kombinationen.ok) return kombinationen
  const entries = kombinationen.atoms.map((atom) => {
    const scope: EvidenceScope = { ...atom, sourceId }
    return { scope, ...schluesselAusScope(scope) }
  })
  entries.sort((links, rechts) => (links.canonical < rechts.canonical ? -1 : links.canonical > rechts.canonical ? 1 : 0))
  return { ok: true, entries }
}

export function evidenceKombinationen(
  eingabe: unknown,
): { ok: true; atoms: EvidenceAtom[] } | RahmenFehler {
  if (personenkennung(eingabe)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const satz = datensatz(eingabe)
  if (!satz) return { ok: false, reason: 'invalid_context' }
  if (!('destinationCountryCode' in satz) || !('transitCountryCode' in satz)) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  const destination = landOderNull(satz.destinationCountryCode)
  if (!destination.ok) return destination
  const transit = landOderNull(satz.transitCountryCode)
  if (!transit.ok) return transit
  if (!destination.code && !transit.code) return { ok: false, reason: 'missing_relevant_context' }
  if (!('citizenship' in satz) || !('documents' in satz) || !('residence' in satz) || !('validity' in satz)) {
    return { ok: false, reason: 'missing_relevant_context' }
  }

  const citizenshipSatz = datensatz(satz.citizenship)
  if (!citizenshipSatz || (citizenshipSatz.mode !== 'not_applicable' && citizenshipSatz.mode !== 'required')) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  const citizenships: StaatsbuergerschaftsAtom[] =
    citizenshipSatz.mode === 'not_applicable'
      ? [{ mode: 'not_applicable' }]
      : []
  if (citizenshipSatz.mode === 'required') {
    const codes = laenderListe(citizenshipSatz.countryCodes)
    if (!codes.ok) return codes
    for (const countryCode of codes.codes) citizenships.push({ mode: 'required', countryCode })
  }

  const dokumentSatz = datensatz(satz.documents)
  if (!dokumentSatz || (dokumentSatz.mode !== 'not_applicable' && dokumentSatz.mode !== 'required')) {
    return { ok: false, reason: 'missing_relevant_context' }
  }
  const documents: DokumentAtom[] = dokumentSatz.mode === 'not_applicable' ? [{ mode: 'not_applicable' }] : []
  if (dokumentSatz.mode === 'required') {
    const options = dokumentOptionen(dokumentSatz.options)
    if (!options.ok) return options
    for (const option of options.options) documents.push({ mode: 'required', ...option })
  }

  const residence = wohnsitzAtom(satz.residence)
  if (!residence.ok) return residence
  const requirement = anforderungLesen(satz.requirementType)
  if (!requirement.ok) return requirement
  const validity = gueltigkeitAtom(satz.validity)
  if (!validity.ok) return validity

  if (citizenships.length * documents.length > KOMBINATION_MAX) {
    return { ok: false, reason: 'scope_too_wide' }
  }

  const atoms: EvidenceAtom[] = []
  for (const citizenship of citizenships) {
    for (const document of documents) {
      atoms.push({
        destinationCountryCode: destination.code,
        transitCountryCode: transit.code,
        citizenship,
        document,
        residence: residence.atom,
        requirementType: requirement.requirementType,
        validity: validity.atom,
      })
    }
  }
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

function versionIdFuer(sourceId: string, canonicalUrl: string, contentHash: string, retrievedAt: string): string {
  return `${VERSION_PREFIX}${sha256Hex([sourceId, canonicalUrl, contentHash, retrievedAt].join('|')).slice(0, 32)}`
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
 * Entscheidungsfelder werden nicht übernommen und nicht in Official Truth übersetzt.
 */
export function evidenceKandidatAusModell(eingabe: unknown, registry: QuellenRegistry): EvidenceKandidatErgebnis {
  if (personenkennung(eingabe)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const felder = entscheidungsfelder(eingabe)
  if (felder.length > 0) return { ok: false, reason: 'model_decision_forbidden', fields: felder }
  const satz = datensatz(eingabe)
  if (!satz) return { ok: false, reason: 'invalid_context' }
  const schluessel = evidenceSuchschluessel(satz.scope ?? satz)
  if (!schluessel.ok) return schluessel
  const url = quellenUrlAufloesen(registry, satz.canonicalUrl)
  if (!url.ok) return url
  if (url.source.sourceId !== schluessel.scope.sourceId) return { ok: false, reason: 'source_mismatch' }
  const retrievedAt = checkedAtLesen(satz.retrievedAt)
  if (!retrievedAt) return { ok: false, reason: 'invalid_retrieval_time' }
  if (typeof satz.content !== 'string' || satz.content.length === 0 || satz.content.length > INHALT_MAX) {
    return { ok: false, reason: 'invalid_context' }
  }
  const contentHash = evidenceInhaltHash(satz.content)
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
  const evidence: EvidenceVersion = {
    versionId: versionIdFuer(url.source.sourceId, url.canonicalUrl, contentHash, retrievedAt),
    previousVersionId: null,
    lifecycle: 'candidate',
    validationState: 'pending',
    sourceId: url.source.sourceId,
    sourceClass: url.source.sourceClass,
    authorityName: url.source.authorityName,
    publisherName: url.source.publisherName,
    canonicalUrl: url.canonicalUrl,
    retrievedAt,
    contentHash,
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
  if (!hashLesen(kandidat.contentHash)) return { ok: false, reason: 'invalid_hash' }
  const fenster = gueltigkeitsfenster({ validFrom: kandidat.validFrom, validUntil: kandidat.validUntil })
  if (!fenster.ok) return fenster
  const erneut = evidenceSuchschluessel(kandidat.scope)
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
  if (!checkedAtLesen(version.retrievedAt) || !hashLesen(version.contentHash)) return null
  const erneut = evidenceSuchschluessel(version.scope)
  if (!erneut.ok || erneut.key !== version.lookupKey) return null
  if (version.sourceClass === 'licensed_evidence_provider' && version.authorityName !== null) return null
  if (version.sourceClass === 'official_authority' && !version.authorityName) return null
  return version
}

export function evidenceVersionenVergleichen(
  vorher: { contentHash: unknown },
  nachher: { contentHash: unknown },
): EvidenceVersionsVergleich {
  const links = hashLesen(vorher.contentHash)
  const rechts = hashLesen(nachher.contentHash)
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
  const basis = evidenceSuchschluessel(bestehend.scope)
  const neu = evidenceSuchschluessel(eingehend.scope)
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
    situation: bestehend.contentHash === eingehend.contentHash ? 'unchanged_content' : 'conflict_preserved',
    ruleChange: 'not_asserted',
  }
}
