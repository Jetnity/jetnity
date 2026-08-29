// lib/traveller/account-registry-abbildung.ts
//
// DB-Zeile → Domain-Contract. Fail-closed. citizenship_id wird auf die
// clientRef derselben Person abgebildet, nie aus issuing_country_code.

import {
  accountRegistryTravellerLesen,
  type AccountRegistryTraveller,
} from '@/lib/traveller/account-registry'

export type RegistryCitizenshipZeile = {
  id: string
  client_ref: string
  country_code: string
  created_at: string
  updated_at: string
}

export type RegistryDocumentZeile = {
  id: string
  client_ref: string
  document_type: string
  issuing_country_code: string | null
  citizenship_id: string | null
  expires_on: string | null
  created_at: string
  updated_at: string
}

export type RegistryTravellerZeile = {
  id: string
  client_ref: string
  label: string | null
  residence_country_code: string | null
  created_at: string
  updated_at: string
  account_traveller_citizenships: RegistryCitizenshipZeile[] | null
  account_traveller_documents: RegistryDocumentZeile[] | null
}

export function registryZeitKanonisieren(wert: unknown): string | null {
  if (typeof wert !== 'string' || wert.trim() === '') return null
  const zeit = new Date(wert)
  if (Number.isNaN(zeit.getTime())) return null
  return zeit.toISOString()
}

function zeileObjekt(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function textOderNull(wert: unknown): string | null | undefined {
  if (wert == null) return null
  if (typeof wert !== 'string') return undefined
  return wert
}

function citizenshipAusZeile(wert: unknown): {
  id: string
  clientRef: string
  countryCode: string
  createdAt: string
  updatedAt: string
} | null {
  const zeile = zeileObjekt(wert)
  if (!zeile) return null
  const id = typeof zeile.id === 'string' ? zeile.id : null
  const clientRef = typeof zeile.client_ref === 'string' ? zeile.client_ref : null
  const countryCode = typeof zeile.country_code === 'string' ? zeile.country_code : null
  const createdAt = registryZeitKanonisieren(zeile.created_at)
  const updatedAt = registryZeitKanonisieren(zeile.updated_at)
  if (!id || !clientRef || !countryCode || !createdAt || !updatedAt) return null
  return { id, clientRef, countryCode, createdAt, updatedAt }
}

function documentAusZeile(
  wert: unknown,
  citizenships: ReadonlyArray<{ id: string; clientRef: string }>,
): {
  id: string
  clientRef: string
  documentType: string
  issuingCountryCode: string | null
  citizenshipClientRef: string | null
  expiresOn: string | null
  createdAt: string
  updatedAt: string
} | null {
  const zeile = zeileObjekt(wert)
  if (!zeile) return null
  const id = typeof zeile.id === 'string' ? zeile.id : null
  const clientRef = typeof zeile.client_ref === 'string' ? zeile.client_ref : null
  const documentType = typeof zeile.document_type === 'string' ? zeile.document_type : null
  const issuingCountryCode = textOderNull(zeile.issuing_country_code)
  if (issuingCountryCode === undefined) return null
  const expiresOn = textOderNull(zeile.expires_on)
  if (expiresOn === undefined) return null
  const createdAt = registryZeitKanonisieren(zeile.created_at)
  const updatedAt = registryZeitKanonisieren(zeile.updated_at)
  if (!id || !clientRef || !documentType || !createdAt || !updatedAt) return null

  if (zeile.citizenship_id == null || zeile.citizenship_id === '') {
    return {
      id,
      clientRef,
      documentType,
      issuingCountryCode,
      citizenshipClientRef: null,
      expiresOn,
      createdAt,
      updatedAt,
    }
  }
  if (typeof zeile.citizenship_id !== 'string') return null
  const zugehoerig = citizenships.find((eintrag) => eintrag.id === zeile.citizenship_id)
  if (!zugehoerig) return null
  return {
    id,
    clientRef,
    documentType,
    issuingCountryCode,
    citizenshipClientRef: zugehoerig.clientRef,
    expiresOn,
    createdAt,
    updatedAt,
  }
}

function nachAnlageSortieren<T extends { createdAt: string; id: string }>(eintraege: T[]): T[] {
  return [...eintraege].sort((links, rechts) => {
    if (links.createdAt === rechts.createdAt) return links.id.localeCompare(rechts.id)
    return links.createdAt.localeCompare(rechts.createdAt)
  })
}

export function registryTravellerAusZeile(wert: unknown): AccountRegistryTraveller | null {
  const zeile = zeileObjekt(wert)
  if (!zeile) return null
  const id = typeof zeile.id === 'string' ? zeile.id : null
  const clientRef = typeof zeile.client_ref === 'string' ? zeile.client_ref : null
  const createdAt = registryZeitKanonisieren(zeile.created_at)
  const updatedAt = registryZeitKanonisieren(zeile.updated_at)
  const label = textOderNull(zeile.label)
  const residenceCountryCode = textOderNull(zeile.residence_country_code)
  if (!id || !clientRef || !createdAt || !updatedAt || label === undefined || residenceCountryCode === undefined) {
    return null
  }

  const citizenshipRoh = zeile.account_traveller_citizenships
  if (citizenshipRoh != null && !Array.isArray(citizenshipRoh)) return null
  const citizenshipsRoh = Array.isArray(citizenshipRoh) ? citizenshipRoh : []
  const citizenships = citizenshipsRoh.map((kind) => citizenshipAusZeile(kind))
  if (citizenships.some((eintrag) => eintrag == null)) return null
  const geleseneCitizenships = nachAnlageSortieren(
    citizenships.filter((eintrag): eintrag is NonNullable<typeof eintrag> => eintrag != null),
  )

  const documentRoh = zeile.account_traveller_documents
  if (documentRoh != null && !Array.isArray(documentRoh)) return null
  const documentsRoh = Array.isArray(documentRoh) ? documentRoh : []
  const documents = documentsRoh.map((kind) => documentAusZeile(kind, geleseneCitizenships))
  if (documents.some((eintrag) => eintrag == null)) return null
  const geleseneDocuments = nachAnlageSortieren(
    documents.filter((eintrag): eintrag is NonNullable<typeof eintrag> => eintrag != null),
  )

  return accountRegistryTravellerLesen({
    authority: 'account_registry',
    id,
    clientRef,
    createdAt,
    updatedAt,
    facts: {
      label,
      residenceCountryCode,
      citizenships: geleseneCitizenships,
      documents: geleseneDocuments,
    },
  })
}

export function registryTravellersAusZeilen(wert: unknown): AccountRegistryTraveller[] | null {
  if (!Array.isArray(wert)) return null
  const gelesen: AccountRegistryTraveller[] = []
  for (const zeile of wert) {
    const traveller = registryTravellerAusZeile(zeile)
    if (!traveller) return null
    gelesen.push(traveller)
  }
  return nachAnlageSortieren(gelesen)
}
