// lib/readiness/dokument-formular.ts
//
// Formularzustand für Reisedokumente. clientRef bleibt eine stabile Identität.
// Ausstellerland wird niemals zur Staatsbürgerschaft.

import type { TravellerDocumentType, TripTravellerDocument } from '@/types/trips'

export type DokumentFormularZeile = {
  clientRef: string
  documentType: TravellerDocumentType | ''
  issuingCountryCode: string
  expiresOn: string
  citizenshipClientRef: string | null
}

export function neueDokumentClientRef(zufall = () => globalThis.crypto.randomUUID()): string {
  return `document:${zufall()}`.slice(0, 64)
}

export function citizenshipClientRefFuer(countryCode: string): string {
  return `citizenship:${countryCode.trim().toUpperCase()}`
}

export function dokumenteAusTraveller(
  documents: readonly TripTravellerDocument[] | null | undefined,
): DokumentFormularZeile[] {
  if (!documents?.length) {
    return [
      {
        clientRef: neueDokumentClientRef(),
        documentType: '',
        issuingCountryCode: '',
        expiresOn: '',
        citizenshipClientRef: null,
      },
    ]
  }
  return documents.map((eintrag) => ({
    clientRef: eintrag.clientRef,
    documentType: eintrag.documentType,
    issuingCountryCode: eintrag.issuingCountryCode ?? '',
    expiresOn: eintrag.expiresOn ?? '',
    citizenshipClientRef: eintrag.citizenshipClientRef,
  }))
}

export function dokumenteNachCitizenships(
  documents: readonly DokumentFormularZeile[],
  citizenshipCodes: readonly string[],
): DokumentFormularZeile[] {
  const erlaubt = new Set(
    citizenshipCodes
      .map((code) => code.trim().toUpperCase())
      .filter((code) => /^[A-Z]{2}$/.test(code))
      .map((code) => citizenshipClientRefFuer(code)),
  )
  return documents.map((document) => ({
    ...document,
    citizenshipClientRef:
      document.citizenshipClientRef && erlaubt.has(document.citizenshipClientRef)
        ? document.citizenshipClientRef
        : null,
  }))
}

export function dokumenteAlsPayload(
  documents: readonly DokumentFormularZeile[],
  citizenshipCodes: readonly string[],
): Array<{
  clientRef: string
  documentType: TravellerDocumentType
  issuingCountryCode: string | null
  expiresOn: string | null
  citizenshipClientRef: string | null
}> {
  const bereinigt = dokumenteNachCitizenships(documents, citizenshipCodes)
  return bereinigt
    .filter((document) => document.documentType)
    .map((document) => ({
      clientRef: document.clientRef,
      documentType: document.documentType as TravellerDocumentType,
      issuingCountryCode: document.issuingCountryCode || null,
      expiresOn: document.expiresOn || null,
      citizenshipClientRef: document.citizenshipClientRef,
    }))
}
