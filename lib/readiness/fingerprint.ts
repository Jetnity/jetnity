// lib/readiness/fingerprint.ts
//
// Deterministischer Context-Fingerprint.
//
// Ein gespeicherter Nutzer-Check gilt nur dann als aktuell, wenn dieser
// Fingerprint noch zu den vertrauenswürdigen Reisetats passt.
// Account-seitig berechnet der Server ihn; der Browser darf ihn nicht setzen.
//
// Felder je Art – verbindlich dokumentiert in docs/TRAVEL_READINESS.md:
//
//   entry_check / visa_check / travel_document_check
//     kind, countryCode, startDate, endDate, travellers, destinationCountries
//
//   insurance_check
//     kind, startDate, endDate, travellers, destinationCountries, rentalCarPresent
//
//   ticket_confirmation_check / booking_confirmation_check
//     kind, tripItemId, itemKind, bookingStatus, startsOn, endsOn,
//     originPlaceId, destinationPlaceId
//
//   preparation
//     kind, title (normalisiert), startDate, endDate, travellers,
//     destinationCountries
//
// Traveller-spezifische Einreise-/Visum-/Dokumentkarten enthalten
// sortierte Citizenship-Mengen und die aufgelöste Dokument-Citizenship.
// Die SHA-256-Identität ist eine kanonische JSON-Struktur, keine
// delimiterbasierte Konkatenation. Reihenfolge ist irrelevant.
// Nicht enthalten: Passnummern, Preise, URLs, Notizen.

import { sha256Hex } from '@/lib/readiness/digest'
import { READINESS_FINGERPRINT_VERSION, READINESS_GRENZEN } from '@/lib/readiness/domain'
import type { ReadinessKind } from '@/types/trips'

export type ReadinessFingerprintKontext = {
  kind: ReadinessKind
  countryCode: string | null
  startDate: string | null
  endDate: string | null
  travellers: number
  destinationCountries: readonly string[]
  rentalCarPresent: boolean
  tripItemId: string | null
  itemKind: string | null
  bookingStatus: string | null
  startsOn: string | null
  endsOn: string | null
  originPlaceId: string | null
  destinationPlaceId: string | null
  title: string | null
  originCountryCode?: string | null
  transitCountryCodes?: readonly string[]
  routeFingerprint?: string | null
  travellerClientRef?: string | null
  citizenshipCountryCodes?: readonly string[]
  documentFingerprints?: readonly string[]
  residenceCountryCode?: string | null
}

function laender(codes: readonly string[]): string[] {
  return [...new Set(codes.filter((code) => /^[A-Z]{2}$/.test(code)))].sort()
}

function titelNorm(wert: string | null): string {
  return (wert ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, READINESS_GRENZEN.titel)
}

function dokumentBedeutung(teil: string): unknown {
  try {
    return JSON.parse(teil) as unknown
  } catch {
    return teil
  }
}

function routeStruktur(kontext: ReadinessFingerprintKontext): Record<string, unknown> {
  const originCountryCode = kontext.originCountryCode ?? null
  const transitCountryCodes = laender(kontext.transitCountryCodes ?? [])
  const routeFingerprint = kontext.routeFingerprint ?? null
  if (!originCountryCode && transitCountryCodes.length === 0 && !routeFingerprint) return {}
  return { originCountryCode, transitCountryCodes, routeFingerprint }
}

function travellerStruktur(kontext: ReadinessFingerprintKontext): Record<string, unknown> {
  const travellerClientRef = kontext.travellerClientRef ?? null
  const citizenshipCountryCodes = laender(kontext.citizenshipCountryCodes ?? [])
  const documents = [...(kontext.documentFingerprints ?? [])]
    .map(dokumentBedeutung)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  const residenceCountryCode = kontext.residenceCountryCode ?? null
  if (!travellerClientRef && citizenshipCountryCodes.length === 0 && documents.length === 0 && !residenceCountryCode) {
    return {}
  }
  return { travellerClientRef, citizenshipCountryCodes, documents, residenceCountryCode }
}

function kanonischeFingerprintStruktur(kontext: ReadinessFingerprintKontext): Record<string, unknown> {
  const destinationCountries = laender(kontext.destinationCountries)
  switch (kontext.kind) {
    case 'entry_check':
    case 'visa_check':
    case 'travel_document_check':
      return {
        v: READINESS_FINGERPRINT_VERSION,
        kind: kontext.kind,
        countryCode: kontext.countryCode,
        startDate: kontext.startDate,
        endDate: kontext.endDate,
        travellers: kontext.travellers,
        destinationCountries,
        ...routeStruktur(kontext),
        ...travellerStruktur(kontext),
      }
    case 'insurance_check':
      return {
        v: READINESS_FINGERPRINT_VERSION,
        kind: kontext.kind,
        startDate: kontext.startDate,
        endDate: kontext.endDate,
        travellers: kontext.travellers,
        destinationCountries,
        rentalCarPresent: kontext.rentalCarPresent,
        ...routeStruktur(kontext),
      }
    case 'ticket_confirmation_check':
    case 'booking_confirmation_check':
      return {
        v: READINESS_FINGERPRINT_VERSION,
        kind: kontext.kind,
        tripItemId: kontext.tripItemId,
        itemKind: kontext.itemKind,
        bookingStatus: kontext.bookingStatus,
        startsOn: kontext.startsOn,
        endsOn: kontext.endsOn,
        originPlaceId: kontext.originPlaceId,
        destinationPlaceId: kontext.destinationPlaceId,
      }
    case 'preparation':
      return {
        v: READINESS_FINGERPRINT_VERSION,
        kind: kontext.kind,
        title: titelNorm(kontext.title),
        startDate: kontext.startDate,
        endDate: kontext.endDate,
        travellers: kontext.travellers,
        destinationCountries,
        ...routeStruktur(kontext),
      }
  }
}

export function readinessFingerprint(kontext: ReadinessFingerprintKontext): string {
  const roh = JSON.stringify(kanonischeFingerprintStruktur(kontext))
  const digest = `${READINESS_FINGERPRINT_VERSION}|sha256:${sha256Hex(roh)}`
  return digest.slice(0, READINESS_GRENZEN.fingerprint)
}

export function fingerprintAktuell(gespeichert: string, aktuell: string): boolean {
  return gespeichert === aktuell && gespeichert.length > 0
}
