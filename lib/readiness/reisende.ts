// lib/readiness/reisende.ts
//
// Persistenz und Form des Reisendenkontexts. Dieselbe fachliche Form
// für Gast und Konto. Child-Tabellen sind Source of Truth.

import { partyLesen, travellerEingabeSchema } from '@/lib/readiness/schema'
import { READINESS_GRENZEN } from '@/lib/readiness/domain'
import { travellerLegacyLesen } from '@/lib/readiness/traveller-kontext'
import type { Trip, TripTraveller, TripTravellerCitizenship, TripTravellerDocument } from '@/types/trips'

export type CitizenshipZeile = {
  id: string
  client_ref: string
  country_code: string
  created_at: string
  updated_at: string
}

export type DocumentZeile = {
  id: string
  client_ref: string
  document_type: string
  issuing_country_code?: string | null
  citizenship_id?: string | null
  expires_on?: string | null
  created_at: string
  updated_at: string
}

export type TravellerZeile = {
  id: string
  client_ref: string
  label?: string | null
  residence_country_code?: string | null
  nationality_country_code?: string | null
  document_type?: string | null
  document_issuing_country_code?: string | null
  document_expires_on?: string | null
  created_at: string
  updated_at: string
  trip_traveller_citizenships?: CitizenshipZeile[] | null
  trip_traveller_documents?: DocumentZeile[] | null
}

function citizenshipAusZeile(zeile: CitizenshipZeile): TripTravellerCitizenship {
  return {
    id: zeile.id,
    clientRef: zeile.client_ref,
    countryCode: zeile.country_code,
    createdAt: zeile.created_at,
    updatedAt: zeile.updated_at,
  }
}

function documentAusZeile(
  zeile: DocumentZeile,
  citizenships: readonly CitizenshipZeile[],
): TripTravellerDocument {
  const zugehoerig = zeile.citizenship_id
    ? citizenships.find((eintrag) => eintrag.id === zeile.citizenship_id)
    : null
  return {
    id: zeile.id,
    clientRef: zeile.client_ref,
    documentType:
      zeile.document_type === 'passport' || zeile.document_type === 'national_id' || zeile.document_type === 'unknown'
        ? zeile.document_type
        : 'unknown',
    issuingCountryCode: zeile.issuing_country_code ?? null,
    citizenshipClientRef: zugehoerig?.client_ref ?? null,
    expiresOn: zeile.expires_on ?? null,
    createdAt: zeile.created_at,
    updatedAt: zeile.updated_at,
  }
}

function relationGeladen<T>(wert: T[] | null | undefined): wert is T[] {
  return Array.isArray(wert)
}

function travellerAusZeile(zeile: TravellerZeile): TripTraveller | null {
  const citizenshipZeilen = zeile.trip_traveller_citizenships
  const documentZeilen = zeile.trip_traveller_documents
  const citizenshipsGeladen = relationGeladen(citizenshipZeilen)
  const documentsGeladen = relationGeladen(documentZeilen)
  const citizenships = citizenshipsGeladen ? citizenshipZeilen.map(citizenshipAusZeile) : undefined
  const documents = documentsGeladen
    ? documentZeilen.map((eintrag) => documentAusZeile(eintrag, citizenshipsGeladen ? citizenshipZeilen : []))
    : undefined
  return (
    partyLesen([
      {
        id: zeile.id,
        clientRef: zeile.client_ref,
        label: zeile.label ?? null,
        residenceCountryCode: zeile.residence_country_code ?? null,
        nationalityCountryCode: citizenshipsGeladen ? null : zeile.nationality_country_code ?? null,
        documentType: documentsGeladen ? null : zeile.document_type ?? null,
        documentIssuingCountryCode: documentsGeladen ? null : zeile.document_issuing_country_code ?? null,
        documentExpiresOn: documentsGeladen ? null : zeile.document_expires_on ?? null,
        ...(citizenships ? { citizenships } : {}),
        ...(documents ? { documents } : {}),
        createdAt: zeile.created_at,
        updatedAt: zeile.updated_at,
      },
    ])[0] ?? null
  )
}

export function partyAusZeilen(zeilen: TravellerZeile[] | null | undefined): TripTraveller[] {
  if (!zeilen?.length) return []
  return zeilen
    .map(travellerAusZeile)
    .filter((item): item is TripTraveller => item !== null)
}

export function travellerBauen(
  reise: Trip,
  roh: unknown,
  bestehend?: TripTraveller | null,
): { ok: true; item: TripTraveller } | { ok: false; meldung: string } {
  const geprueft = travellerEingabeSchema.safeParse(roh)
  if (!geprueft.success) {
    return { ok: false, meldung: geprueft.error.issues[0]?.message ?? 'Diese Reisendenangabe ist ungültig.' }
  }
  const jetzt = new Date().toISOString()
  const gelesen = travellerLegacyLesen({
    ...geprueft.data,
    id: bestehend?.id ?? geprueft.data.clientRef,
    createdAt: bestehend?.createdAt ?? jetzt,
    updatedAt: jetzt,
  })
  if (!gelesen) {
    return { ok: false, meldung: 'Diese Reisendenangabe ist ungültig.' }
  }
  const item: TripTraveller = {
    ...gelesen,
    id: bestehend?.id ?? gelesen.id,
    clientRef: geprueft.data.clientRef.slice(0, READINESS_GRENZEN.clientRef),
    label: geprueft.data.label,
    createdAt: bestehend?.createdAt ?? jetzt,
    updatedAt: jetzt,
  }
  void reise
  return { ok: true, item }
}

export function travellerAlsPayload(item: TripTraveller) {
  return {
    clientRef: item.clientRef,
    label: item.label,
    residenceCountryCode: item.residenceCountryCode,
    citizenships: item.citizenships.map((eintrag) => ({
      clientRef: eintrag.clientRef,
      countryCode: eintrag.countryCode,
    })),
    documents: item.documents.map((eintrag) => ({
      clientRef: eintrag.clientRef,
      documentType: eintrag.documentType,
      issuingCountryCode: eintrag.issuingCountryCode,
      expiresOn: eintrag.expiresOn,
      citizenshipClientRef: eintrag.citizenshipClientRef,
    })),
  }
}
