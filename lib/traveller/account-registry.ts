// lib/traveller/account-registry.ts
//
// AP-7 Dual-Authority shared domain contract.
//
// Account Registry = reusable current traveller identity/facts.
// Trip Snapshot = only Current Truth for a concrete trip.
//
// The registry type is intentionally not TripTraveller-shaped.
// Projection materializes trip-owned identities and timestamps from
// explicit context. It does not copy registry identity, invent a
// default citizenship/document, or treat issuer as citizenship.
//
// No persistence, no schema, no UI, no provider runtime.

import { TRAVELLER_CONTEXT_GRENZEN, landescodeLesen } from '@/lib/readiness/domain'
import { TRAVELLER_DOCUMENT_TYPES, type TravellerDocumentType, type TripTraveller } from '@/types/trips'

export const ACCOUNT_REGISTRY_AUTHORITY = 'account_registry' as const

export type AccountRegistryCitizenship = {
  readonly id: string
  readonly clientRef: string
  readonly countryCode: string
  readonly createdAt: string
  readonly updatedAt: string
}

export type AccountRegistryDocument = {
  readonly id: string
  readonly clientRef: string
  readonly documentType: TravellerDocumentType
  readonly issuingCountryCode: string | null
  readonly citizenshipClientRef: string | null
  readonly expiresOn: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export type AccountRegistryFacts = {
  readonly label: string | null
  readonly residenceCountryCode: string | null
  readonly citizenships: readonly AccountRegistryCitizenship[]
  readonly documents: readonly AccountRegistryDocument[]
}

/**
 * Account-owned reusable traveller identity/facts.
 * Facts live under `facts` so this type is not a TripTraveller.
 */
export type AccountRegistryTraveller = {
  readonly authority: typeof ACCOUNT_REGISTRY_AUTHORITY
  readonly id: string
  readonly clientRef: string
  readonly facts: AccountRegistryFacts
  readonly createdAt: string
  readonly updatedAt: string
}

export type TripSnapshotIdentitaet = {
  readonly id: string
  readonly clientRef: string
}

export type TripSnapshotMaterialisierung = {
  readonly jetzt: string
  readonly traveller: TripSnapshotIdentitaet
  readonly citizenships: Readonly<Record<string, TripSnapshotIdentitaet>>
  readonly documents: Readonly<Record<string, TripSnapshotIdentitaet>>
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ISO_ZEIT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/
const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/

const ERLAUBTE_TRAVELLER_SCHLUESSEL = new Set([
  'authority',
  'id',
  'clientRef',
  'facts',
  'createdAt',
  'updatedAt',
])

const ERLAUBTE_FACTS_SCHLUESSEL = new Set([
  'label',
  'residenceCountryCode',
  'citizenships',
  'documents',
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

const ERLAUBTE_MATERIALISIERUNG_SCHLUESSEL = new Set([
  'jetzt',
  'traveller',
  'citizenships',
  'documents',
])

const ERLAUBTE_IDENTITAET_SCHLUESSEL = new Set(['id', 'clientRef'])

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
  const clientRef = uuidLesen(zeile.clientRef)
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
  const clientRef = uuidLesen(zeile.clientRef)
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
  const createdAt = zeitLesen(zeile.createdAt)
  const updatedAt = zeitLesen(zeile.updatedAt)
  if (!createdAt || !updatedAt) return null
  if (zeile.citizenshipClientRef == null || zeile.citizenshipClientRef === '') {
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
  const citizenshipClientRef = uuidLesen(zeile.citizenshipClientRef)
  if (!citizenshipClientRef) return null
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

function factsLesen(wert: unknown): AccountRegistryFacts | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const facts = wert as Record<string, unknown>
  if (hatVerboteneSchluessel(facts) || hatUnerlaubteSchluessel(facts, ERLAUBTE_FACTS_SCHLUESSEL)) {
    return null
  }
  const label = labelLesen(facts.label)
  const residenceCountryCode = landOderNull(facts.residenceCountryCode)
  if (label === undefined || residenceCountryCode === undefined) return null
  const citizenships = citizenshipsLesen(facts.citizenships)
  if (!citizenships) return null
  const documents = documentsLesen(
    facts.documents,
    new Set(citizenships.map((eintrag) => eintrag.clientRef)),
  )
  if (!documents) return null
  return { label, residenceCountryCode, citizenships, documents }
}

/**
 * Fail-closed reader for untrusted account-registry input.
 * Requires explicit `authority: 'account_registry'` and nested facts.
 * Does not mutate the source. Does not invent missing facts.
 */
export function accountRegistryTravellerLesen(roh: unknown): AccountRegistryTraveller | null {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null
  const eintrag = roh as Record<string, unknown>
  if (hatVerboteneSchluessel(eintrag) || hatUnerlaubteSchluessel(eintrag, ERLAUBTE_TRAVELLER_SCHLUESSEL)) {
    return null
  }
  if (eintrag.authority !== ACCOUNT_REGISTRY_AUTHORITY) return null

  const id = uuidLesen(eintrag.id)
  const clientRef = uuidLesen(eintrag.clientRef)
  const createdAt = zeitLesen(eintrag.createdAt)
  const updatedAt = zeitLesen(eintrag.updatedAt)
  const facts = factsLesen(eintrag.facts)
  if (!id || !clientRef || !createdAt || !updatedAt || !facts) return null

  return {
    authority: ACCOUNT_REGISTRY_AUTHORITY,
    id,
    clientRef,
    facts,
    createdAt,
    updatedAt,
  }
}

function identitaetLesen(wert: unknown): TripSnapshotIdentitaet | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const zeile = wert as Record<string, unknown>
  if (hatUnerlaubteSchluessel(zeile, ERLAUBTE_IDENTITAET_SCHLUESSEL)) return null
  const id = uuidLesen(zeile.id)
  const clientRef = uuidLesen(zeile.clientRef)
  if (!id || !clientRef) return null
  return { id, clientRef }
}

function identitaetUnabhaengig(
  snapshot: TripSnapshotIdentitaet,
  quelle: { readonly id: string; readonly clientRef: string },
): boolean {
  return snapshot.id !== quelle.id && snapshot.clientRef !== quelle.clientRef
}

function identitaetenKarteLesen(
  wert: unknown,
  quelle: ReadonlyArray<{ readonly id: string; readonly clientRef: string }>,
  belegtIds: Set<string>,
  belegtRefs: Set<string>,
): ReadonlyMap<string, TripSnapshotIdentitaet> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const karte = wert as Record<string, unknown>
  const erwartet = new Set(quelle.map((eintrag) => eintrag.clientRef))
  const keys = Object.keys(karte)
  if (keys.length !== erwartet.size || keys.some((key) => !erwartet.has(key))) return null

  const result = new Map<string, TripSnapshotIdentitaet>()
  for (const eintrag of quelle) {
    const identitaet = identitaetLesen(karte[eintrag.clientRef])
    if (!identitaet || !identitaetUnabhaengig(identitaet, eintrag)) return null
    if (belegtIds.has(identitaet.id) || belegtRefs.has(identitaet.clientRef)) return null
    belegtIds.add(identitaet.id)
    belegtRefs.add(identitaet.clientRef)
    result.set(eintrag.clientRef, identitaet)
  }
  return result
}

function materialisierungLesen(
  wert: unknown,
  registry: AccountRegistryTraveller,
): {
  jetzt: string
  traveller: TripSnapshotIdentitaet
  citizenships: ReadonlyMap<string, TripSnapshotIdentitaet>
  documents: ReadonlyMap<string, TripSnapshotIdentitaet>
} | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const eintrag = wert as Record<string, unknown>
  if (hatUnerlaubteSchluessel(eintrag, ERLAUBTE_MATERIALISIERUNG_SCHLUESSEL)) return null
  const jetzt = zeitLesen(eintrag.jetzt)
  const traveller = identitaetLesen(eintrag.traveller)
  if (!jetzt || !traveller || !identitaetUnabhaengig(traveller, registry)) return null

  const belegtIds = new Set<string>([traveller.id])
  const belegtRefs = new Set<string>([traveller.clientRef])
  const citizenships = identitaetenKarteLesen(
    eintrag.citizenships,
    registry.facts.citizenships,
    belegtIds,
    belegtRefs,
  )
  if (!citizenships) return null
  const documents = identitaetenKarteLesen(
    eintrag.documents,
    registry.facts.documents,
    belegtIds,
    belegtRefs,
  )
  if (!documents) return null
  return { jetzt, traveller, citizenships, documents }
}

/**
 * Produces trip-owned traveller data from a validated registry record.
 * Trip identities and the snapshot timestamp must be supplied explicitly.
 */
export function accountRegistryTravellerAlsTripSnapshot(
  registry: AccountRegistryTraveller,
  materialisierung: unknown,
): TripTraveller | null {
  const gelesen = accountRegistryTravellerLesen(registry)
  if (!gelesen) return null
  const aufgeloest = materialisierungLesen(materialisierung, gelesen)
  if (!aufgeloest) return null

  const citizenships = gelesen.facts.citizenships.map((eintrag) => {
    const identitaet = aufgeloest.citizenships.get(eintrag.clientRef)
    if (!identitaet) return null
    return {
      id: identitaet.id,
      clientRef: identitaet.clientRef,
      countryCode: eintrag.countryCode,
      createdAt: aufgeloest.jetzt,
      updatedAt: aufgeloest.jetzt,
    }
  })
  if (citizenships.some((eintrag) => eintrag == null)) return null

  const documents = gelesen.facts.documents.map((eintrag) => {
    const identitaet = aufgeloest.documents.get(eintrag.clientRef)
    if (!identitaet) return null
    const citizenshipClientRef = eintrag.citizenshipClientRef
      ? aufgeloest.citizenships.get(eintrag.citizenshipClientRef)?.clientRef ?? null
      : null
    if (eintrag.citizenshipClientRef && !citizenshipClientRef) return null
    return {
      id: identitaet.id,
      clientRef: identitaet.clientRef,
      documentType: eintrag.documentType,
      issuingCountryCode: eintrag.issuingCountryCode,
      citizenshipClientRef,
      expiresOn: eintrag.expiresOn,
      createdAt: aufgeloest.jetzt,
      updatedAt: aufgeloest.jetzt,
    }
  })
  if (documents.some((eintrag) => eintrag == null)) return null

  return {
    id: aufgeloest.traveller.id,
    clientRef: aufgeloest.traveller.clientRef,
    label: gelesen.facts.label,
    residenceCountryCode: gelesen.facts.residenceCountryCode,
    citizenships: citizenships.filter((eintrag): eintrag is NonNullable<typeof eintrag> => eintrag != null),
    documents: documents.filter((eintrag): eintrag is NonNullable<typeof eintrag> => eintrag != null),
    createdAt: aufgeloest.jetzt,
    updatedAt: aufgeloest.jetzt,
  }
}

/**
 * Contract boundary: untrusted registry input → independent trip snapshot.
 * Returns null instead of guessing when the source or materialization is malformed.
 */
export function accountRegistryTravellerProjektieren(
  roh: unknown,
  materialisierung: unknown,
): TripTraveller | null {
  const registry = accountRegistryTravellerLesen(roh)
  if (!registry) return null
  return accountRegistryTravellerAlsTripSnapshot(registry, materialisierung)
}
