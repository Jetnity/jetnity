// lib/readiness/reisende.ts
//
// Persistenz und Form des Reisendenkontexts. Dieselbe fachliche Form
// für Gast und Konto. Keine Dokumentnummern.

import { partyLesen, travellerEingabeSchema } from '@/lib/readiness/schema'
import { READINESS_GRENZEN } from '@/lib/readiness/domain'
import type { Trip, TripTraveller } from '@/types/trips'

export type TravellerZeile = {
  id: string
  client_ref: string
  label?: string | null
  nationality_country_code?: string | null
  residence_country_code?: string | null
  document_type?: string | null
  document_issuing_country_code?: string | null
  document_expires_on?: string | null
  created_at: string
  updated_at: string
}

function travellerAusZeile(zeile: TravellerZeile): TripTraveller | null {
  return (
    partyLesen([
      {
        id: zeile.id,
        clientRef: zeile.client_ref,
        label: zeile.label ?? null,
        nationalityCountryCode: zeile.nationality_country_code ?? null,
        residenceCountryCode: zeile.residence_country_code ?? null,
        documentType: zeile.document_type ?? null,
        documentIssuingCountryCode: zeile.document_issuing_country_code ?? null,
        documentExpiresOn: zeile.document_expires_on ?? null,
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
  const item: TripTraveller = {
    id: bestehend?.id ?? geprueft.data.clientRef,
    clientRef: geprueft.data.clientRef.slice(0, READINESS_GRENZEN.clientRef),
    label: geprueft.data.label,
    nationalityCountryCode: geprueft.data.nationalityCountryCode,
    residenceCountryCode: geprueft.data.residenceCountryCode,
    documentType: geprueft.data.documentType,
    documentIssuingCountryCode: geprueft.data.documentIssuingCountryCode,
    documentExpiresOn: geprueft.data.documentExpiresOn,
    createdAt: bestehend?.createdAt ?? jetzt,
    updatedAt: jetzt,
  }
  return { ok: true, item }
}

export function travellerAlsZeile(item: TripTraveller, tripId: string) {
  return {
    trip_id: tripId,
    client_ref: item.clientRef,
    label: item.label,
    nationality_country_code: item.nationalityCountryCode,
    residence_country_code: item.residenceCountryCode,
    document_type: item.documentType,
    document_issuing_country_code: item.documentIssuingCountryCode,
    document_expires_on: item.documentExpiresOn,
  }
}
