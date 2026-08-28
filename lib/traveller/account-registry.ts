// lib/traveller/account-registry.ts
//
// AP-7 Dual-Authority shared domain contract.
//
// Account Registry = reusable current traveller identity/facts.
// Trip Snapshot = only Current Truth for a concrete trip.
//
// Projection copies semantic Foundation-E fields into an independent
// TripTraveller. It does not keep live registry authority, invent a
// default citizenship/document, or treat issuer as citizenship.
//
// No persistence, no schema, no UI, no provider runtime.

import { READINESS_GRENZEN, TRAVELLER_CONTEXT_GRENZEN, landescodeLesen } from '@/lib/readiness/domain'
import { TRAVELLER_DOCUMENT_TYPES, type TravellerDocumentType, type TripTraveller } from '@/types/trips'

export const ACCOUNT_REGISTRY_AUTHORITY = 'account_registry' as const

export type AccountRegistryCitizenship = {
  id: string
  clientRef: string
  countryCode: string
  createdAt: string
  updatedAt: string
}

export type AccountRegistryDocument = {
  id: string
  clientRef: string
  documentType: TravellerDocumentType
  issuingCountryCode: string | null
  citizenshipClientRef: string | null
  expiresOn: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Account-owned reusable traveller identity/facts.
 * Not trip current truth. Not assignable as a live trip party member
 * through the projection boundary — use the snapshot helper.
 */
export type AccountRegistryTraveller = {
  authority: typeof ACCOUNT_REGISTRY_AUTHORITY
  id: string
  clientRef: string
  label: string | null
  residenceCountryCode: string | null
  citizenships: AccountRegistryCitizenship[]
  documents: AccountRegistryDocument[]
  createdAt: string
  updatedAt: string
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ISO_ZEIT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/
const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/
const POSITIONALE_PERSON = /^traveller:\d+$/i
const POSITIONALES_KIND =
  /^(citizenships?|documents?|evaluations?)[:._-]?\d+$/i
const POSITIONALES_INDEX = /^(citizenships?|documents?|evaluations?)\[\d+\]$/i

const ERLAUBTE_TRAVELLER_SCHLUESSEL = new Set([
  'authority',
  'id',
  'clientRef',
  'label',
  'residenceCountryCode',
  'citizenships',
  'documents',
  'createdAt',
  'updatedAt',
])

const ERLAUBTE_CITIZENSHIP_SCHLUESSEL = new Set([
  'id',
  'clientRef',
  'countryCode',
  'createdAt',
  'updatedAt',
])

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

const SENSIBLE_SCHLUESSEL = new Set([
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
  'dateofbirth',
  'birthdate',
  'dob',
  'geburtsdatum',
  'health',
  'healthdata',
  'healthdocument',
  'vaccination',
  'medical',
])

const VERBOTENE_WAHL_SCHLUESSEL = new Set([
  'chosencredentialoptionref',
  'chosencredential',
  'preferreddocument',
  'preferreddocumentclientref',
  'preferredcitizenship',
  'defaultcitizenship',
  'defaultpassport',
  'defaultcredential',
  'primarydocument',
  'primarycitizenship',
  'selectedcredential',
  'credentialoptions',
])

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

function schluesselNormalisieren(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function hatVerboteneSchluessel(objekt: Record<string, unknown>): boolean {
  return Object.keys(objekt).some((name) => {
    const normal = schluesselNormalisieren(name)
    return SENSIBLE_SCHLUESSEL.has(normal) || VERBOTENE_WAHL_SCHLUESSEL.has(normal)
  })
}

function hatUnerlaubteSchluessel(objekt: Record<string, unknown>, erlaubt: Set<string>): boolean {
  return Object.keys(objekt).some((name) => !erlaubt.has(name))
}

function enthaltSensitiveDaten(wert: string): boolean {
  return SENSIBLE_ZEICHEN.some((muster) => muster.test(wert))
}

function uuidLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const id = wert.trim()
  return UUID.test(id) ? id : null
}

function clientRefLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const ref = wert.trim()
  if (ref.length < 1 || ref.length > READINESS_GRENZEN.clientRef) return null
  return ref
}

function stabilePersonenRef(wert: unknown): string | null {
  const ref = clientRefLesen(wert)
  if (!ref || POSITIONALE_PERSON.test(ref)) return null
  return ref
}

function stabileKindRef(wert: unknown): string | null {
  const ref = clientRefLesen(wert)
  if (!ref || POSITIONALE_PERSON.test(ref) || POSITIONALES_KIND.test(ref) || POSITIONALES_INDEX.test(ref)) {
    return null
  }
  return ref
}

function zeitLesen(wert: unknown): string | null {
  if (typeof wert !== 'string' || !ISO_ZEIT.test(wert)) return null
  return wert
}

function labelLesen(wert: unknown): string | null | undefined {
  if (wert == null) return null
  if (typeof wert !== 'string') return undefined
  const label = wert.trim()
  if (label === '') return null
  if (label.length > 40) return undefined
  if (enthaltSensitiveDaten(label) || /https?:\/\//i.test(label) || /<\/?[a-z][\s\S]*>/i.test(label)) {
    return undefined
  }
  return label
}

function landOderNull(wert: unknown): string | null | undefined {
  if (wert == null || wert === '') return null
  const code = landescodeLesen(wert)
  return code ?? undefined
}

function citizenshipLesen(kind: unknown): AccountRegistryCitizenship | null {
  if (!kind || typeof kind !== 'object' || Array.isArray(kind)) return null
  const zeile = kind as Record<string, unknown>
  if (hatVerboteneSchluessel(zeile) || hatUnerlaubteSchluessel(zeile, ERLAUBTE_CITIZENSHIP_SCHLUESSEL)) {
    return null
  }
  const id = uuidLesen(zeile.id)
  const clientRef = stabileKindRef(zeile.clientRef)
  const countryCode = landescodeLesen(zeile.countryCode)
  const createdAt = zeitLesen(zeile.createdAt)
  const updatedAt = zeitLesen(zeile.updatedAt)
  if (!id || !clientRef || !countryCode || !createdAt || !updatedAt) return null
  return { id, clientRef, countryCode, createdAt, updatedAt }
}

function documentLesen(kind: unknown): AccountRegistryDocument | null {
  if (!kind || typeof kind !== 'object' || Array.isArray(kind)) return null
  const zeile = kind as Record<string, unknown>
  if (hatVerboteneSchluessel(zeile) || hatUnerlaubteSchluessel(zeile, ERLAUBTE_DOCUMENT_SCHLUESSEL)) {
    return null
  }
  const id = uuidLesen(zeile.id)
  const clientRef = stabileKindRef(zeile.clientRef)
  const documentType = zeile.documentType
  if (!id || !clientRef) return null
  if (!(TRAVELLER_DOCUMENT_TYPES as readonly string[]).includes(documentType as string)) return null
  const issuingCountryCode = landOderNull(zeile.issuingCountryCode)
  if (issuingCountryCode === undefined) return null
  if (zeile.expiresOn != null && zeile.expiresOn !== '' && (typeof zeile.expiresOn !== 'string' || !ISO_DATUM.test(zeile.expiresOn))) {
    return null
  }
  const expiresOn =
    typeof zeile.expiresOn === 'string' && ISO_DATUM.test(zeile.expiresOn) ? zeile.expiresOn : null
  if (zeile.citizenshipClientRef != null && zeile.citizenshipClientRef !== '') {
    const citizenshipClientRef = stabileKindRef(zeile.citizenshipClientRef)
    if (!citizenshipClientRef) return null
    const createdAt = zeitLesen(zeile.createdAt)
    const updatedAt = zeitLesen(zeile.updatedAt)
    if (!createdAt || !updatedAt) return null
    return {
      id,
      clientRef,
      documentType: documentType as TravellerDocumentType,
      issuingCountryCode,
      citizenshipClientRef,
      expiresOn,
      createdAt,
      updatedAt,
    }
  }
  const createdAt = zeitLesen(zeile.createdAt)
  const updatedAt = zeitLesen(zeile.updatedAt)
  if (!createdAt || !updatedAt) return null
  return {
    id,
    clientRef,
    documentType: documentType as TravellerDocumentType,
    issuingCountryCode,
    citizenshipClientRef: null,
    expiresOn,
    createdAt,
    updatedAt,
  }
}

function citizenshipsLesen(wert: unknown): AccountRegistryCitizenship[] | null {
  if (!Array.isArray(wert)) return null
  if (wert.length > TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller) return null
  const gelesen: AccountRegistryCitizenship[] = []
  const ids = new Set<string>()
  const refs = new Set<string>()
  const laender = new Set<string>()
  for (const kind of wert) {
    const citizenship = citizenshipLesen(kind)
    if (!citizenship) return null
    if (ids.has(citizenship.id) || refs.has(citizenship.clientRef) || laender.has(citizenship.countryCode)) {
      return null
    }
    ids.add(citizenship.id)
    refs.add(citizenship.clientRef)
    laender.add(citizenship.countryCode)
    gelesen.push(citizenship)
  }
  return gelesen
}

function documentsLesen(
  wert: unknown,
  citizenshipRefs: ReadonlySet<string>,
): AccountRegistryDocument[] | null {
  if (!Array.isArray(wert)) return null
  if (wert.length > TRAVELLER_CONTEXT_GRENZEN.documentsJeTraveller) return null
  const gelesen: AccountRegistryDocument[] = []
  const ids = new Set<string>()
  const refs = new Set<string>()
  for (const kind of wert) {
    const document = documentLesen(kind)
    if (!document) return null
    if (ids.has(document.id) || refs.has(document.clientRef)) return null
    if (document.citizenshipClientRef && !citizenshipRefs.has(document.citizenshipClientRef)) {
      return null
    }
    ids.add(document.id)
    refs.add(document.clientRef)
    gelesen.push(document)
  }
  return gelesen
}

/**
 * Fail-closed reader for untrusted account-registry input.
 * Does not mutate the source. Does not invent missing facts.
 */
export function accountRegistryTravellerLesen(roh: unknown): AccountRegistryTraveller | null {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null
  const eintrag = roh as Record<string, unknown>
  if (hatVerboteneSchluessel(eintrag) || hatUnerlaubteSchluessel(eintrag, ERLAUBTE_TRAVELLER_SCHLUESSEL)) {
    return null
  }
  if (eintrag.authority != null && eintrag.authority !== ACCOUNT_REGISTRY_AUTHORITY) return null

  const id = uuidLesen(eintrag.id)
  const clientRef = stabilePersonenRef(eintrag.clientRef)
  const label = labelLesen(eintrag.label)
  const residenceCountryCode = landOderNull(eintrag.residenceCountryCode)
  const createdAt = zeitLesen(eintrag.createdAt)
  const updatedAt = zeitLesen(eintrag.updatedAt)
  if (!id || !clientRef || label === undefined || residenceCountryCode === undefined || !createdAt || !updatedAt) {
    return null
  }

  const citizenships = citizenshipsLesen(eintrag.citizenships)
  if (!citizenships) return null
  const documents = documentsLesen(
    eintrag.documents,
    new Set(citizenships.map((eintrag) => eintrag.clientRef)),
  )
  if (!documents) return null

  return {
    authority: ACCOUNT_REGISTRY_AUTHORITY,
    id,
    clientRef,
    label,
    residenceCountryCode,
    citizenships,
    documents,
    createdAt,
    updatedAt,
  }
}

function registryKopieren(registry: AccountRegistryTraveller): AccountRegistryTraveller {
  return {
    authority: ACCOUNT_REGISTRY_AUTHORITY,
    id: registry.id,
    clientRef: registry.clientRef,
    label: registry.label,
    residenceCountryCode: registry.residenceCountryCode,
    citizenships: registry.citizenships.map((eintrag) => ({ ...eintrag })),
    documents: registry.documents.map((eintrag) => ({ ...eintrag })),
    createdAt: registry.createdAt,
    updatedAt: registry.updatedAt,
  }
}

function snapshotJetztLesen(jetzt: string | undefined): string | null {
  if (jetzt == null) return new Date().toISOString()
  return zeitLesen(jetzt)
}

/**
 * Produces trip-owned traveller data from a validated registry record.
 * The snapshot shares no object/array identity with the source and carries
 * no live registry authority, provenance link, or credential choice.
 */
export function accountRegistryTravellerAlsTripSnapshot(
  registry: AccountRegistryTraveller,
  jetzt?: string,
): TripTraveller | null {
  const gelesen = accountRegistryTravellerLesen(registry)
  if (!gelesen) return null
  const erstelltAm = snapshotJetztLesen(jetzt)
  if (!erstelltAm) return null
  const kopie = registryKopieren(gelesen)
  return {
    id: kopie.id,
    clientRef: kopie.clientRef,
    label: kopie.label,
    residenceCountryCode: kopie.residenceCountryCode,
    citizenships: kopie.citizenships.map((eintrag) => ({ ...eintrag })),
    documents: kopie.documents.map((eintrag) => ({ ...eintrag })),
    createdAt: erstelltAm,
    updatedAt: erstelltAm,
  }
}

/**
 * Contract boundary: untrusted registry input → independent trip snapshot.
 * Returns null instead of guessing when the source is malformed or ambiguous.
 */
export function accountRegistryTravellerProjektieren(roh: unknown, jetzt?: string): TripTraveller | null {
  const registry = accountRegistryTravellerLesen(roh)
  if (!registry) return null
  return accountRegistryTravellerAlsTripSnapshot(registry, jetzt)
}
