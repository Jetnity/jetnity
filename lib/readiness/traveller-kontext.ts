// lib/readiness/traveller-kontext.ts
//
// Kanonische Traveller-Wahrheit: 1 Traveller → n Staatsbürgerschaften → n Dokumente.
// Legacy-Singularfelder werden nur gelesen, niemals als neue Source of Truth geschrieben.
// Keine Passnummern, keine erfundenen Credential-Profile.

import { TRAVELLER_CONTEXT_GRENZEN, landescodeLesen } from '@/lib/readiness/domain'
import type {
  TravellerDocumentType,
  TripTraveller,
  TripTravellerCitizenship,
  TripTravellerDocument,
} from '@/types/trips'

export type LegacyTravellerFelder = {
  nationalityCountryCode?: string | null
  documentType?: TravellerDocumentType | null
  documentIssuingCountryCode?: string | null
  documentExpiresOn?: string | null
}

export type CredentialOption = {
  optionRef: string
  travellerClientRef: string
  residenceCountryCode: string | null
  citizenshipCountryCodes: string[]
  document: {
    clientRef: string
    documentType: TravellerDocumentType
    issuingCountryCode: string | null
    expiresOn: string | null
    citizenshipCountryCode: string | null
  } | null
}

function zeitOderJetzt(wert: unknown, fallback: string): string {
  return typeof wert === 'string' && wert.length > 0 ? wert : fallback
}

function clientRefLesen(wert: unknown, fallback: string): string {
  if (typeof wert === 'string') {
    const ref = wert.trim().slice(0, 64)
    if (ref.length > 0) return ref
  }
  return fallback.slice(0, 64)
}

function citizenshipsSortieren(
  citizenships: readonly TripTravellerCitizenship[],
): TripTravellerCitizenship[] {
  return [...citizenships].sort(
    (a, b) => a.countryCode.localeCompare(b.countryCode) || a.clientRef.localeCompare(b.clientRef),
  )
}

export function documentsSortieren(documents: readonly TripTravellerDocument[]): TripTravellerDocument[] {
  return [...documents].sort((a, b) => {
    return (
      a.documentType.localeCompare(b.documentType) ||
      (a.issuingCountryCode ?? '').localeCompare(b.issuingCountryCode ?? '') ||
      (a.expiresOn ?? '').localeCompare(b.expiresOn ?? '') ||
      (a.citizenshipClientRef ?? '').localeCompare(b.citizenshipClientRef ?? '') ||
      a.clientRef.localeCompare(b.clientRef)
    )
  })
}

export function citizenshipCodesAus(traveller: Pick<TripTraveller, 'citizenships'>): string[] {
  return [...new Set(citizenshipsSortieren(traveller.citizenships).map((eintrag) => eintrag.countryCode))]
}

export function documentFingerprintTeil(document: TripTravellerDocument): string {
  return [
    document.documentType,
    document.issuingCountryCode ?? '',
    document.expiresOn ?? '',
    document.citizenshipClientRef ?? '',
  ].join(':')
}

export function travellerCredentialFingerprint(traveller: TripTraveller): string {
  const citizenships = citizenshipCodesAus(traveller).join(',')
  const documents = documentsSortieren(traveller.documents).map(documentFingerprintTeil).join(',')
  return `t=${traveller.clientRef}|cit=${citizenships}|docs=${documents}|res=${traveller.residenceCountryCode ?? ''}`
}

export function partyCredentialFingerprint(party: readonly TripTraveller[]): string {
  return [...party]
    .map((eintrag) => travellerCredentialFingerprint(eintrag))
    .sort()
    .join(';')
}

function citizenshipAusLegacy(code: string | null | undefined, jetzt: string): TripTravellerCitizenship | null {
  const countryCode = landescodeLesen(code ?? null)
  if (!countryCode) return null
  return {
    id: `citizenship:${countryCode}`,
    clientRef: `citizenship:${countryCode}`,
    countryCode,
    createdAt: jetzt,
    updatedAt: jetzt,
  }
}

function documentAusLegacy(felder: LegacyTravellerFelder, jetzt: string): TripTravellerDocument | null {
  const documentType = felder.documentType ?? null
  const issuing = landescodeLesen(felder.documentIssuingCountryCode ?? null)
  const expiresOn = felder.documentExpiresOn ?? null
  if (!documentType && !issuing && !expiresOn) return null
  const typ: TravellerDocumentType = documentType ?? 'unknown'
  const clientRef = `document:${typ}:${issuing ?? 'xx'}`
  return {
    id: clientRef,
    clientRef,
    documentType: typ,
    issuingCountryCode: issuing,
    citizenshipClientRef: null,
    expiresOn,
    createdAt: jetzt,
    updatedAt: jetzt,
  }
}

export function travellerLegacyLesen(roh: unknown): TripTraveller | null {
  if (!roh || typeof roh !== 'object') return null
  const eintrag = roh as Record<string, unknown> & LegacyTravellerFelder
  const clientRef = clientRefLesen(eintrag.clientRef, '')
  if (!clientRef) return null
  const jetzt = zeitOderJetzt(eintrag.updatedAt, new Date().toISOString())
  const createdAt = zeitOderJetzt(eintrag.createdAt, jetzt)
  const citizenshipsGeladen = Array.isArray(eintrag.citizenships)
  const documentsGeladen = Array.isArray(eintrag.documents)
  const citizenshipsRoh = Array.isArray(eintrag.citizenships) ? eintrag.citizenships : []
  const documentsRoh = Array.isArray(eintrag.documents) ? eintrag.documents : []

  const citizenships = citizenshipsRoh
    .map((kind): TripTravellerCitizenship | null => {
      if (!kind || typeof kind !== 'object') return null
      const zeile = kind as Record<string, unknown>
      const countryCode = landescodeLesen(zeile.countryCode)
      if (!countryCode) return null
      const ref = clientRefLesen(zeile.clientRef, `citizenship:${countryCode}`)
      return {
        id: clientRefLesen(zeile.id, ref),
        clientRef: ref,
        countryCode,
        createdAt: zeitOderJetzt(zeile.createdAt, createdAt),
        updatedAt: zeitOderJetzt(zeile.updatedAt, jetzt),
      }
    })
    .filter((kind): kind is TripTravellerCitizenship => kind !== null)

  const gesehenLand = new Set<string>()
  const eindeutigeCitizenships: TripTravellerCitizenship[] = []
  for (const citizenship of citizenshipsSortieren(citizenships)) {
    if (gesehenLand.has(citizenship.countryCode)) continue
    gesehenLand.add(citizenship.countryCode)
    eindeutigeCitizenships.push(citizenship)
    if (eindeutigeCitizenships.length >= TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller) break
  }

  if (eindeutigeCitizenships.length === 0 && !citizenshipsGeladen) {
    const legacy = citizenshipAusLegacy(eintrag.nationalityCountryCode, jetzt)
    if (legacy) eindeutigeCitizenships.push(legacy)
  }

  const documents = documentsRoh
    .map((kind): TripTravellerDocument | null => {
      if (!kind || typeof kind !== 'object') return null
      const zeile = kind as Record<string, unknown>
      const documentType = zeile.documentType
      if (documentType !== 'passport' && documentType !== 'national_id' && documentType !== 'unknown') {
        return null
      }
      const issuing = landescodeLesen(zeile.issuingCountryCode)
      const citizenshipClientRef =
        typeof zeile.citizenshipClientRef === 'string' && zeile.citizenshipClientRef.trim()
          ? zeile.citizenshipClientRef.trim().slice(0, 64)
          : null
      const ref = clientRefLesen(zeile.clientRef, `document:${documentType}:${issuing ?? 'xx'}`)
      return {
        id: clientRefLesen(zeile.id, ref),
        clientRef: ref,
        documentType,
        issuingCountryCode: issuing,
        citizenshipClientRef,
        expiresOn: typeof zeile.expiresOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(zeile.expiresOn) ? zeile.expiresOn : null,
        createdAt: zeitOderJetzt(zeile.createdAt, createdAt),
        updatedAt: zeitOderJetzt(zeile.updatedAt, jetzt),
      }
    })
    .filter((kind): kind is TripTravellerDocument => kind !== null)

  const gesehenDoc = new Set<string>()
  const eindeutigeDocuments: TripTravellerDocument[] = []
  for (const document of documentsSortieren(documents)) {
    if (gesehenDoc.has(document.clientRef)) continue
    gesehenDoc.add(document.clientRef)
    eindeutigeDocuments.push(document)
    if (eindeutigeDocuments.length >= TRAVELLER_CONTEXT_GRENZEN.documentsJeTraveller) break
  }

  if (eindeutigeDocuments.length === 0 && !documentsGeladen) {
    const legacy = documentAusLegacy(eintrag, jetzt)
    if (legacy) eindeutigeDocuments.push(legacy)
  }

  const bekannteCitizenships = new Set(eindeutigeCitizenships.map((eintrag) => eintrag.clientRef))
  return {
    id: clientRefLesen(eintrag.id, clientRef),
    clientRef,
    label: typeof eintrag.label === 'string' && eintrag.label.trim() ? eintrag.label.trim().slice(0, 40) : null,
    residenceCountryCode: landescodeLesen(eintrag.residenceCountryCode),
    citizenships: eindeutigeCitizenships,
    documents: eindeutigeDocuments.map((document) => ({
      ...document,
      citizenshipClientRef:
        document.citizenshipClientRef && bekannteCitizenships.has(document.citizenshipClientRef)
          ? document.citizenshipClientRef
          : null,
    })),
    createdAt,
    updatedAt: jetzt,
  }
}

export function documentCitizenshipCode(
  traveller: Pick<TripTraveller, 'citizenships'>,
  document: Pick<TripTravellerDocument, 'citizenshipClientRef'>,
): string | null {
  if (!document.citizenshipClientRef) return null
  return (
    traveller.citizenships.find((eintrag) => eintrag.clientRef === document.citizenshipClientRef)?.countryCode ?? null
  )
}

export function credentialOptionsAus(traveller: TripTraveller): CredentialOption[] {
  const citizenshipCountryCodes = citizenshipCodesAus(traveller)
  const documents = documentsSortieren(traveller.documents)
  if (documents.length === 0) {
    return [
      {
        optionRef: `${traveller.clientRef}:none`,
        travellerClientRef: traveller.clientRef,
        residenceCountryCode: traveller.residenceCountryCode,
        citizenshipCountryCodes,
        document: null,
      },
    ]
  }

  return documents.map((document) => {
    return {
      optionRef: `${traveller.clientRef}:${document.clientRef}`,
      travellerClientRef: traveller.clientRef,
      residenceCountryCode: traveller.residenceCountryCode,
      citizenshipCountryCodes,
      document: {
        clientRef: document.clientRef,
        documentType: document.documentType,
        issuingCountryCode: document.issuingCountryCode,
        expiresOn: document.expiresOn,
        citizenshipCountryCode: documentCitizenshipCode(traveller, document),
      },
    }
  })
}

export function travellerFehlendeKernfakten(traveller: TripTraveller | null): Array<
  'nationality' | 'document_type' | 'document_issuing_country' | 'document_expiry' | 'residence'
> {
  if (!traveller) return ['nationality']
  const fakten: Array<'nationality' | 'document_type' | 'document_issuing_country' | 'document_expiry' | 'residence'> =
    []
  if (citizenshipCodesAus(traveller).length === 0) fakten.push('nationality')
  const documents = documentsSortieren(traveller.documents)
  if (documents.length === 0 || documents.every((document) => document.documentType === 'unknown')) {
    fakten.push('document_type')
  }
  if (documents.some((document) => document.documentType !== 'unknown' && !document.issuingCountryCode)) {
    fakten.push('document_issuing_country')
  }
  if (documents.some((document) => document.documentType !== 'unknown' && !document.expiresOn)) {
    fakten.push('document_expiry')
  }
  return fakten
}
