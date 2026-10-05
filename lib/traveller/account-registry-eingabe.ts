// lib/traveller/account-registry-eingabe.ts
//
// Fail-closed Schreibnutzlasten für die Account-Registry.
// Keine Default-/Primary-Credential-Semantik. Keine sensitiven Felder.

import { TRAVELLER_CONTEXT_GRENZEN } from '@/lib/readiness/domain'
import {
  accountRegistryLabelLesen,
  accountRegistryLandLesen,
} from '@/lib/traveller/account-registry'
import { TRAVELLER_DOCUMENT_TYPES, type TravellerDocumentType } from '@/types/trips'

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/

const VERBOTENE_SCHLUESSEL = [
  'passportnumber',
  'passnumber',
  'documentnumber',
  'serialnumber',
  'ausweisnummer',
  'passnummer',
  'mrz',
  'scan',
  'scanurl',
  'image',
  'photo',
  'biometric',
  'biometrics',
  'dateofbirth',
  'birthdate',
  'dob',
  'geburtsdatum',
  'health',
  'vaccination',
  'medical',
  'primarycitizenship',
  'defaultcitizenship',
  'preferredcitizenship',
  'primarydocument',
  'defaultpassport',
  'chosencredential',
  'preferreddocument',
] as const

export const REGISTRY_EINGABE_UNGUELTIG = 'Diese Reisendenangabe ist ungültig.'
export const REGISTRY_BEZEICHNUNG_UNGUELTIG =
  'Diese Bezeichnung ist nicht zulässig. Verwende eine kurze, datensparsame Bezeichnung ohne Ausweisdaten.'
export const REGISTRY_LAND_UNGUELTIG = 'Bitte ein gültiges Land wählen.'
export const REGISTRY_DATUM_UNGUELTIG = 'Bitte ein gültiges Datum im Format JJJJ-MM-TT angeben.'
export const REGISTRY_TYP_UNGUELTIG = 'Bitte einen gültigen Dokumenttyp wählen.'
export const REGISTRY_ZUORDNUNG_UNGUELTIG =
  'Die Dokument-Zuordnung muss zu einer Staatsbürgerschaft desselben Registry-Reisenden gehören oder leer bleiben.'

export type RegistryTravellerAnlage = {
  readonly label: string | null
  readonly residenceCountryCode: string | null
}

export type RegistryTravellerAenderung = {
  readonly id: string
  readonly label: string | null
  readonly residenceCountryCode: string | null
}

export type RegistryTravellerLoeschung = {
  readonly id: string
}

export type RegistryCitizenshipAnlage = {
  readonly travellerId: string
  readonly countryCode: string
}

export type RegistryCitizenshipLoeschung = {
  readonly travellerId: string
  readonly citizenshipId: string
}

export type RegistryDocumentAnlage = {
  readonly travellerId: string
  readonly documentType: TravellerDocumentType
  readonly issuingCountryCode: string | null
  readonly citizenshipId: string | null
  readonly expiresOn: string | null
}

export type RegistryDocumentAenderung = {
  readonly travellerId: string
  readonly documentId: string
  readonly documentType: TravellerDocumentType
  readonly issuingCountryCode: string | null
  readonly citizenshipId: string | null
  readonly expiresOn: string | null
}

export type RegistryDocumentLoeschung = {
  readonly travellerId: string
  readonly documentId: string
}

export type RegistryEingabe<T> = { ok: true; wert: T } | { ok: false; meldung: string }

export function registryTravellerFormularAnfang(): { label: string; residenceCountryCode: string } {
  return { label: '', residenceCountryCode: '' }
}

export function registryDokumentFormularAnfang(): {
  documentType: '' | TravellerDocumentType
  issuingCountryCode: string
  citizenshipId: string
  expiresOn: string
} {
  return {
    documentType: '',
    issuingCountryCode: '',
    citizenshipId: '',
    expiresOn: '',
  }
}

export function registryKindLimitErreicht(
  art: 'citizenship' | 'document',
  anzahl: number,
): boolean {
  return art === 'citizenship'
    ? anzahl >= TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller
    : anzahl >= TRAVELLER_CONTEXT_GRENZEN.documentsJeTraveller
}

export function registryCitizenshipDoppelt(
  countryCode: string,
  vorhandeneLaender: readonly string[],
): boolean {
  return vorhandeneLaender.includes(countryCode)
}

function schluesselNormalisieren(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function hatVerboteneSchluessel(wert: unknown): boolean {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return false
  return Object.keys(wert).some((name) =>
    VERBOTENE_SCHLUESSEL.includes(schluesselNormalisieren(name) as (typeof VERBOTENE_SCHLUESSEL)[number]),
  )
}

function uuidLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const id = wert.trim()
  return UUID.test(id) ? id : null
}

function objektLesen(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  if (hatVerboteneSchluessel(wert)) return null
  return wert as Record<string, unknown>
}

function labelFeld(wert: unknown): RegistryEingabe<string | null> {
  const label = accountRegistryLabelLesen(wert)
  if (label === undefined) return { ok: false, meldung: REGISTRY_BEZEICHNUNG_UNGUELTIG }
  return { ok: true, wert: label }
}

function landFeld(wert: unknown): RegistryEingabe<string | null> {
  const land = accountRegistryLandLesen(wert)
  if (land === undefined) return { ok: false, meldung: REGISTRY_LAND_UNGUELTIG }
  return { ok: true, wert: land }
}

function datumFeld(wert: unknown): RegistryEingabe<string | null> {
  if (wert == null || wert === '') return { ok: true, wert: null }
  if (typeof wert !== 'string' || !ISO_DATUM.test(wert)) {
    return { ok: false, meldung: REGISTRY_DATUM_UNGUELTIG }
  }
  return { ok: true, wert }
}

function dokumentTypFeld(wert: unknown): RegistryEingabe<TravellerDocumentType> {
  if (!(TRAVELLER_DOCUMENT_TYPES as readonly string[]).includes(wert as string)) {
    return { ok: false, meldung: REGISTRY_TYP_UNGUELTIG }
  }
  return { ok: true, wert: wert as TravellerDocumentType }
}

function optionaleZuordnung(wert: unknown): RegistryEingabe<string | null> {
  if (wert == null || wert === '') return { ok: true, wert: null }
  const id = uuidLesen(wert)
  if (!id) return { ok: false, meldung: REGISTRY_ZUORDNUNG_UNGUELTIG }
  return { ok: true, wert: id }
}

export function registryTravellerAnlageLesen(roh: unknown): RegistryEingabe<RegistryTravellerAnlage> {
  const zeile = objektLesen(roh)
  if (!zeile) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const label = labelFeld(zeile.label)
  if (!label.ok) return label
  const residence = landFeld(zeile.residenceCountryCode)
  if (!residence.ok) return residence
  return { ok: true, wert: { label: label.wert, residenceCountryCode: residence.wert } }
}

export function registryTravellerAenderungLesen(roh: unknown): RegistryEingabe<RegistryTravellerAenderung> {
  const zeile = objektLesen(roh)
  if (!zeile) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const id = uuidLesen(zeile.id)
  if (!id) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const label = labelFeld(zeile.label)
  if (!label.ok) return label
  const residence = landFeld(zeile.residenceCountryCode)
  if (!residence.ok) return residence
  return { ok: true, wert: { id, label: label.wert, residenceCountryCode: residence.wert } }
}

export function registryTravellerLoeschungLesen(roh: unknown): RegistryEingabe<RegistryTravellerLoeschung> {
  const zeile = objektLesen(roh)
  if (!zeile) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const id = uuidLesen(zeile.id)
  if (!id) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  return { ok: true, wert: { id } }
}

export function registryCitizenshipAnlageLesen(roh: unknown): RegistryEingabe<RegistryCitizenshipAnlage> {
  const zeile = objektLesen(roh)
  if (!zeile) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const travellerId = uuidLesen(zeile.travellerId)
  const country = landFeld(zeile.countryCode)
  if (!travellerId || !country.ok) {
    return { ok: false, meldung: country.ok ? REGISTRY_EINGABE_UNGUELTIG : country.meldung }
  }
  if (!country.wert) return { ok: false, meldung: REGISTRY_LAND_UNGUELTIG }
  return { ok: true, wert: { travellerId, countryCode: country.wert } }
}

export function registryCitizenshipLoeschungLesen(
  roh: unknown,
): RegistryEingabe<RegistryCitizenshipLoeschung> {
  const zeile = objektLesen(roh)
  if (!zeile) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const travellerId = uuidLesen(zeile.travellerId)
  const citizenshipId = uuidLesen(zeile.citizenshipId)
  if (!travellerId || !citizenshipId) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  return { ok: true, wert: { travellerId, citizenshipId } }
}

function dokumentFelder(zeile: Record<string, unknown>): RegistryEingabe<{
  documentType: TravellerDocumentType
  issuingCountryCode: string | null
  citizenshipId: string | null
  expiresOn: string | null
}> {
  const documentType = dokumentTypFeld(zeile.documentType)
  if (!documentType.ok) return documentType
  const issuing = landFeld(zeile.issuingCountryCode)
  if (!issuing.ok) return issuing
  const citizenshipId = optionaleZuordnung(zeile.citizenshipId)
  if (!citizenshipId.ok) return citizenshipId
  const expiresOn = datumFeld(zeile.expiresOn)
  if (!expiresOn.ok) return expiresOn
  return {
    ok: true,
    wert: {
      documentType: documentType.wert,
      issuingCountryCode: issuing.wert,
      citizenshipId: citizenshipId.wert,
      expiresOn: expiresOn.wert,
    },
  }
}

export function registryDocumentAnlageLesen(roh: unknown): RegistryEingabe<RegistryDocumentAnlage> {
  const zeile = objektLesen(roh)
  if (!zeile) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const travellerId = uuidLesen(zeile.travellerId)
  if (!travellerId) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const felder = dokumentFelder(zeile)
  if (!felder.ok) return felder
  return { ok: true, wert: { travellerId, ...felder.wert } }
}

export function registryDocumentAenderungLesen(roh: unknown): RegistryEingabe<RegistryDocumentAenderung> {
  const zeile = objektLesen(roh)
  if (!zeile) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const travellerId = uuidLesen(zeile.travellerId)
  const documentId = uuidLesen(zeile.documentId)
  if (!travellerId || !documentId) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const felder = dokumentFelder(zeile)
  if (!felder.ok) return felder
  return { ok: true, wert: { travellerId, documentId, ...felder.wert } }
}

export function registryDocumentLoeschungLesen(roh: unknown): RegistryEingabe<RegistryDocumentLoeschung> {
  const zeile = objektLesen(roh)
  if (!zeile) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  const travellerId = uuidLesen(zeile.travellerId)
  const documentId = uuidLesen(zeile.documentId)
  if (!travellerId || !documentId) return { ok: false, meldung: REGISTRY_EINGABE_UNGUELTIG }
  return { ok: true, wert: { travellerId, documentId } }
}

export function registryCitizenshipGegenBestandPruefen(
  countryCode: string,
  vorhandeneLaender: readonly string[],
): RegistryEingabe<string> {
  if (registryCitizenshipDoppelt(countryCode, vorhandeneLaender)) {
    return { ok: false, meldung: 'Diese Staatsbürgerschaft ist bereits hinterlegt.' }
  }
  if (registryKindLimitErreicht('citizenship', vorhandeneLaender.length)) {
    return { ok: false, meldung: 'Ein Registry-Reisender trägt höchstens 8 Staatsbürgerschaften.' }
  }
  return { ok: true, wert: countryCode }
}

export function registryDocumentGegenBestandPruefen(
  citizenshipId: string | null,
  vorhandeneCitizenshipIds: readonly string[],
  vorhandeneAnzahl: number,
  art: 'anlegen' | 'aendern' = 'anlegen',
): RegistryEingabe<string | null> {
  if (art === 'anlegen' && registryKindLimitErreicht('document', vorhandeneAnzahl)) {
    return { ok: false, meldung: 'Ein Registry-Reisender trägt höchstens 12 Reisedokumente.' }
  }
  if (citizenshipId && !vorhandeneCitizenshipIds.includes(citizenshipId)) {
    return { ok: false, meldung: REGISTRY_ZUORDNUNG_UNGUELTIG }
  }
  return { ok: true, wert: citizenshipId }
}
