// lib/readiness/traveller-anfrage.ts
//
// Strikter Parser für die untrusted Requirements-API.
// Guest-/Storage-Lesepfade bleiben bei travellerLegacyLesen().
// Ein malformed Child oder eine falsch typisierte Canonical-Property
// darf hier nicht still verschwinden.

import { TRAVELLER_CONTEXT_GRENZEN, landescodeLesen } from '@/lib/readiness/domain'
import { documentCitizenshipCode, travellerLegacyLesen } from '@/lib/readiness/traveller-kontext'
import type { TravellerDocumentType, TripTraveller } from '@/types/trips'

const SENSIBLE_ZEICHEN = [
  /\bpass(nummer|nr|no|id)?\b/i,
  /\bpassport\b/i,
  /\bausweis/i,
  /\bvisa[\s-]?nr/i,
  /\bvisum[\s-]?nr/i,
  /\bgeburt/i,
  /\bdate of birth\b/i,
  /\bsozialvers/i,
  /\bkreditkarte/i,
  /\bcard\s*number\b/i,
  /\bführerschein/i,
  /\bdrivers?\s*licen[cs]e\b/i,
  /\bimpf/i,
  /\bvaccin/i,
  /\d{6,}/,
] as const

function enthaltSensitiveDaten(wert: string): boolean {
  return SENSIBLE_ZEICHEN.some((muster) => muster.test(wert))
}

const ERLAUBTE_TRAVELLER_SCHLUESSEL = new Set([
  'id',
  'clientRef',
  'label',
  'residenceCountryCode',
  'citizenships',
  'documents',
  'nationalityCountryCode',
  'documentType',
  'documentIssuingCountryCode',
  'documentExpiresOn',
  'createdAt',
  'updatedAt',
])

const ERLAUBTE_CITIZENSHIP_SCHLUESSEL = new Set(['id', 'clientRef', 'countryCode', 'createdAt', 'updatedAt'])

const ERLAUBTE_DOCUMENT_SCHLUESSEL = new Set([
  'id',
  'clientRef',
  'documentType',
  'issuingCountryCode',
  'expiresOn',
  'citizenshipClientRef',
  'createdAt',
  'updatedAt',
])

const SENSIBLE_SCHLUESSEL = [
  'passportnumber',
  'passnumber',
  'documentnumber',
  'serialnumber',
  'ausweisnummer',
  'passnummer',
  'mrz',
  'mrzline',
  'scan',
  'scanurl',
  'image',
  'photo',
  'biometric',
  'biometrics',
  'chip',
  'rfid',
]

function schluesselNormalisieren(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function hatSensibleSchluessel(objekt: Record<string, unknown>): boolean {
  return Object.keys(objekt).some((name) => SENSIBLE_SCHLUESSEL.includes(schluesselNormalisieren(name)))
}

function hatUnerlaubteSchluessel(objekt: Record<string, unknown>, erlaubt: Set<string>): boolean {
  return Object.keys(objekt).some((name) => !erlaubt.has(name))
}

function clientRefLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const ref = wert.trim()
  if (ref.length < 1 || ref.length > 64) return null
  return ref
}

function propertyVorhanden(objekt: Record<string, unknown>, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(objekt, name)
}

function citizenshipStrikt(kind: unknown): { clientRef: string; countryCode: string } | null {
  if (!kind || typeof kind !== 'object' || Array.isArray(kind)) return null
  const zeile = kind as Record<string, unknown>
  if (hatSensibleSchluessel(zeile) || hatUnerlaubteSchluessel(zeile, ERLAUBTE_CITIZENSHIP_SCHLUESSEL)) return null
  const countryCode = landescodeLesen(zeile.countryCode)
  if (!countryCode) return null
  const clientRef = zeile.clientRef == null || zeile.clientRef === ''
    ? `citizenship:${countryCode}`
    : clientRefLesen(zeile.clientRef)
  if (!clientRef) return null
  return { clientRef, countryCode }
}

function documentStrikt(kind: unknown): {
  clientRef: string
  documentType: TravellerDocumentType
  issuingCountryCode: string | null
  expiresOn: string | null
  citizenshipClientRef: string | null
} | null {
  if (!kind || typeof kind !== 'object' || Array.isArray(kind)) return null
  const zeile = kind as Record<string, unknown>
  if (hatSensibleSchluessel(zeile) || hatUnerlaubteSchluessel(zeile, ERLAUBTE_DOCUMENT_SCHLUESSEL)) return null
  const documentType = zeile.documentType
  if (
    documentType !== 'passport' &&
    documentType !== 'national_id' &&
    documentType !== 'unknown'
  ) {
    return null
  }
  const issuing = zeile.issuingCountryCode == null || zeile.issuingCountryCode === ''
    ? null
    : landescodeLesen(zeile.issuingCountryCode)
  if (zeile.issuingCountryCode != null && zeile.issuingCountryCode !== '' && !issuing) return null
  if (zeile.expiresOn != null && zeile.expiresOn !== '' && (typeof zeile.expiresOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(zeile.expiresOn))) {
    return null
  }
  const expiresOn =
    typeof zeile.expiresOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(zeile.expiresOn) ? zeile.expiresOn : null
  const citizenshipClientRef =
    zeile.citizenshipClientRef == null || zeile.citizenshipClientRef === ''
      ? null
      : clientRefLesen(zeile.citizenshipClientRef)
  if (zeile.citizenshipClientRef != null && zeile.citizenshipClientRef !== '' && !citizenshipClientRef) return null
  const clientRef = zeile.clientRef == null || zeile.clientRef === ''
    ? `document:${documentType}:${issuing ?? 'xx'}`
    : clientRefLesen(zeile.clientRef)
  if (!clientRef) return null
  return {
    clientRef,
    documentType,
    issuingCountryCode: issuing,
    expiresOn,
    citizenshipClientRef,
  }
}

export function travellerAnfrageStriktLesen(roh: unknown): TripTraveller | null {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null
  const eintrag = roh as Record<string, unknown>
  if (hatSensibleSchluessel(eintrag) || hatUnerlaubteSchluessel(eintrag, ERLAUBTE_TRAVELLER_SCHLUESSEL)) return null
  if (typeof eintrag.label === 'string' && enthaltSensitiveDaten(eintrag.label)) return null
  if (!clientRefLesen(eintrag.clientRef)) return null

  if (propertyVorhanden(eintrag, 'citizenships') && !Array.isArray(eintrag.citizenships)) return null
  if (propertyVorhanden(eintrag, 'documents') && !Array.isArray(eintrag.documents)) return null

  if (Array.isArray(eintrag.citizenships)) {
    if (eintrag.citizenships.length > TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller) return null
    const citizenships = eintrag.citizenships.map(citizenshipStrikt)
    if (citizenships.some((kind) => kind == null)) return null
    const laender = new Set<string>()
    const refs = new Set<string>()
    for (const citizenship of citizenships) {
      if (!citizenship) return null
      if (laender.has(citizenship.countryCode) || refs.has(citizenship.clientRef)) return null
      laender.add(citizenship.countryCode)
      refs.add(citizenship.clientRef)
    }
  }

  if (Array.isArray(eintrag.documents)) {
    if (eintrag.documents.length > TRAVELLER_CONTEXT_GRENZEN.documentsJeTraveller) return null
    const documents = eintrag.documents.map(documentStrikt)
    if (documents.some((kind) => kind == null)) return null
    const refs = new Set<string>()
    const citizenshipRefs = new Set(
      Array.isArray(eintrag.citizenships)
        ? eintrag.citizenships.map(citizenshipStrikt).map((kind) => kind?.clientRef).filter((ref): ref is string => Boolean(ref))
        : [],
    )
    for (const document of documents) {
      if (!document) return null
      if (refs.has(document.clientRef)) return null
      refs.add(document.clientRef)
      if (document.citizenshipClientRef && !citizenshipRefs.has(document.citizenshipClientRef)) return null
    }
  }

  const gelesen = travellerLegacyLesen(eintrag)
  if (!gelesen) return null
  if (Array.isArray(eintrag.citizenships) && gelesen.citizenships.length !== eintrag.citizenships.length) return null
  if (Array.isArray(eintrag.documents) && gelesen.documents.length !== eintrag.documents.length) return null
  if (
    Array.isArray(eintrag.documents) &&
    gelesen.documents.some(
      (document, index) =>
        document.citizenshipClientRef !== documentStrikt(eintrag.documents?.[index] as unknown)?.citizenshipClientRef,
    )
  ) {
    return null
  }
  if (gelesen.documents.some((document) => document.citizenshipClientRef && !documentCitizenshipCode(gelesen, document))) {
    return null
  }
  return gelesen
}
