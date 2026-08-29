// lib/traveller/account-registry-trip.ts
//
// AP-7-S4: explizite Registry → Trip-Snapshot-Materialisierung.
// Wiederverwendet den S1-Vertrag. Erzeugt frische trip-eigene Identitäten.
// Keine Registry-ID-Wiederverwendung, kein Default-/First-Item-Credential.

import { PARTY_GRENZEN } from '@/lib/readiness/party'
import {
  accountRegistryTravellerLesen,
  accountRegistryTravellerProjektieren,
  type AccountRegistryTraveller,
  type TripSnapshotIdentitaet,
  type TripSnapshotMaterialisierung,
} from '@/lib/traveller/account-registry'
import { REGISTRY_TRIP_COPY } from '@/lib/traveller/account-registry-trip-copy'
import type { TravellerDocumentType, TripTraveller } from '@/types/trips'

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type RegistryTripAnzeigeDokument = {
  readonly documentType: TravellerDocumentType
  readonly issuingCountryCode: string | null
}

export type RegistryTripAnzeige = {
  readonly id: string
  readonly label: string | null
  readonly residenceCountryCode: string | null
  readonly citizenshipCountryCodes: readonly string[]
  readonly documents: readonly RegistryTripAnzeigeDokument[]
}

export type RegistryTripUebernahmeEingabe = {
  readonly tripId: string
  readonly registryTravellerId: string
}

export type RegistryTripSnapshotKontext = {
  readonly jetzt: string
  readonly zufall?: () => string
}

function uuidLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const id = wert.trim()
  return UUID.test(id) ? id : null
}

function registryIdentitaetsUniversum(registry: AccountRegistryTraveller): Set<string> {
  const werte = new Set<string>([registry.id, registry.clientRef])
  for (const citizenship of registry.facts.citizenships) {
    werte.add(citizenship.id)
    werte.add(citizenship.clientRef)
  }
  for (const document of registry.facts.documents) {
    werte.add(document.id)
    werte.add(document.clientRef)
  }
  return werte
}

function frischeIdentitaet(
  gesperrt: Set<string>,
  zufall: () => string,
): TripSnapshotIdentitaet | null {
  for (let versuch = 0; versuch < 16; versuch += 1) {
    const id = zufall()
    const clientRef = zufall()
    if (!uuidLesen(id) || !uuidLesen(clientRef)) continue
    if (id === clientRef) continue
    if (gesperrt.has(id) || gesperrt.has(clientRef)) continue
    gesperrt.add(id)
    gesperrt.add(clientRef)
    return { id, clientRef }
  }
  return null
}

export function registryTripUebernahmeEingabeLesen(wert: unknown): RegistryTripUebernahmeEingabe | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const zeile = wert as Record<string, unknown>
  const erlaubte = new Set(['tripId', 'registryTravellerId'])
  if (Object.keys(zeile).some((name) => !erlaubte.has(name))) return null
  const tripId = uuidLesen(zeile.tripId)
  const registryTravellerId = uuidLesen(zeile.registryTravellerId)
  if (!tripId || !registryTravellerId) return null
  return { tripId, registryTravellerId }
}

export function registryTripAnzeigeAus(traveller: AccountRegistryTraveller): RegistryTripAnzeige {
  const citizenshipCountryCodes = [
    ...new Set(traveller.facts.citizenships.map((eintrag) => eintrag.countryCode)),
  ].sort((links, rechts) => links.localeCompare(rechts))

  const documents = traveller.facts.documents
    .map((eintrag) => ({
      documentType: eintrag.documentType,
      issuingCountryCode: eintrag.issuingCountryCode,
    }))
    .sort((links, rechts) => {
      const typ = links.documentType.localeCompare(rechts.documentType)
      if (typ !== 0) return typ
      return (links.issuingCountryCode ?? '').localeCompare(rechts.issuingCountryCode ?? '')
    })

  return {
    id: traveller.id,
    label: traveller.facts.label,
    residenceCountryCode: traveller.facts.residenceCountryCode,
    citizenshipCountryCodes,
    documents,
  }
}

export function registryTripAnzeigenAus(
  travellers: readonly AccountRegistryTraveller[],
): RegistryTripAnzeige[] {
  return travellers.map((eintrag) => registryTripAnzeigeAus(eintrag))
}

export function registryTripLimitErreicht(anzahl: number, limit = PARTY_GRENZEN.slots): boolean {
  return anzahl >= limit
}

export function tripSnapshotMaterialisierungErzeugen(
  registry: AccountRegistryTraveller,
  kontext: RegistryTripSnapshotKontext,
): TripSnapshotMaterialisierung | null {
  const gelesen = accountRegistryTravellerLesen(registry)
  if (!gelesen) return null

  const zufall = kontext.zufall ?? (() => crypto.randomUUID())
  const gesperrt = registryIdentitaetsUniversum(gelesen)
  const traveller = frischeIdentitaet(gesperrt, zufall)
  if (!traveller) return null

  const citizenships: Record<string, TripSnapshotIdentitaet> = {}
  for (const citizenship of gelesen.facts.citizenships) {
    const identitaet = frischeIdentitaet(gesperrt, zufall)
    if (!identitaet) return null
    citizenships[citizenship.clientRef] = identitaet
  }

  const documents: Record<string, TripSnapshotIdentitaet> = {}
  for (const document of gelesen.facts.documents) {
    const identitaet = frischeIdentitaet(gesperrt, zufall)
    if (!identitaet) return null
    documents[document.clientRef] = identitaet
  }

  return {
    jetzt: kontext.jetzt,
    traveller,
    citizenships,
    documents,
  }
}

/**
 * Kanonischer Runtime-Pfad: S1-Projektion mit frischen trip-eigenen Identitäten.
 * Bei ungültiger Quelle, Kollision oder unvollständiger Materialisierung: null.
 */
export function registryTravellerAlsFrischenTripSnapshot(
  roh: unknown,
  kontext: RegistryTripSnapshotKontext,
): TripTraveller | null {
  const registry = accountRegistryTravellerLesen(roh)
  if (!registry) return null
  const materialisierung = tripSnapshotMaterialisierungErzeugen(registry, kontext)
  if (!materialisierung) return null
  return accountRegistryTravellerProjektieren(registry, materialisierung)
}

export function registryTripEintragSuchen(
  travellers: readonly AccountRegistryTraveller[],
  registryTravellerId: string,
): AccountRegistryTraveller | null {
  let gefunden: AccountRegistryTraveller | null = null
  for (const eintrag of travellers) {
    if (eintrag.id !== registryTravellerId) continue
    if (gefunden) return null
    gefunden = eintrag
  }
  return gefunden
}

export function registryTripAnzeigeName(label: string | null): string {
  return label ?? REGISTRY_TRIP_COPY.ohneBezeichnung
}
