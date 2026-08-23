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
// sortierte Citizenship-/Document-Mengen. Reihenfolge ist irrelevant.
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

function teil(name: string, wert: string | number | boolean | null | undefined): string {
  if (wert === null || wert === undefined || wert === '') return `${name}=`
  if (typeof wert === 'boolean') return `${name}=${wert ? '1' : '0'}`
  return `${name}=${String(wert)}`
}

function laender(codes: readonly string[]): string {
  return [...new Set(codes.filter((code) => /^[A-Z]{2}$/.test(code)))].sort().join(',')
}

function routeFelderAus(kontext: ReadinessFingerprintKontext): string[] {
  const origin = kontext.originCountryCode ?? null
  const transits = (kontext.transitCountryCodes ?? []).filter((code) => /^[A-Z]{2}$/.test(code))
  const route = kontext.routeFingerprint ?? null
  if (!origin && transits.length === 0 && !route) return []
  return [teil('orig', origin), teil('tr', transits.join(',')), teil('route', route)]
}

function travellerFelderAus(kontext: ReadinessFingerprintKontext): string[] {
  const traveller = kontext.travellerClientRef ?? null
  const citizenships = [...new Set((kontext.citizenshipCountryCodes ?? []).filter((code) => /^[A-Z]{2}$/.test(code)))]
    .sort()
    .join(',')
  const documents = [...(kontext.documentFingerprints ?? [])].sort().join(',')
  const residence = kontext.residenceCountryCode ?? null
  if (!traveller && !citizenships && !documents && !residence) return []
  return [teil('t', traveller), teil('cit', citizenships), teil('docs', documents), teil('res', residence)]
}

function titelNorm(wert: string | null): string {
  return (wert ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, READINESS_GRENZEN.titel)
}

export function readinessFingerprint(kontext: ReadinessFingerprintKontext): string {
  const dest = laender(kontext.destinationCountries)
  const teile = [READINESS_FINGERPRINT_VERSION, `kind=${kontext.kind}`]
  const routeFelder = routeFelderAus(kontext)

  switch (kontext.kind) {
    case 'entry_check':
    case 'visa_check':
    case 'travel_document_check':
      teile.push(
        teil('cc', kontext.countryCode),
        teil('start', kontext.startDate),
        teil('end', kontext.endDate),
        teil('trav', kontext.travellers),
        teil('dest', dest),
        ...routeFelder,
        ...travellerFelderAus(kontext),
      )
      break
    case 'insurance_check':
      teile.push(
        teil('start', kontext.startDate),
        teil('end', kontext.endDate),
        teil('trav', kontext.travellers),
        teil('dest', dest),
        teil('rental', kontext.rentalCarPresent),
        ...routeFelder,
      )
      break
    case 'ticket_confirmation_check':
    case 'booking_confirmation_check':
      teile.push(
        teil('item', kontext.tripItemId),
        teil('itemKind', kontext.itemKind),
        teil('booked', kontext.bookingStatus),
        teil('startsOn', kontext.startsOn),
        teil('endsOn', kontext.endsOn),
        teil('origin', kontext.originPlaceId),
        teil('destPlace', kontext.destinationPlaceId),
      )
      break
    case 'preparation':
      teile.push(
        teil('title', titelNorm(kontext.title)),
        teil('start', kontext.startDate),
        teil('end', kontext.endDate),
        teil('trav', kontext.travellers),
        teil('dest', dest),
        ...routeFelder,
      )
      break
  }

  const roh = teile.join('|')
  const digest = `${READINESS_FINGERPRINT_VERSION}|sha256:${sha256Hex(roh)}`
  return digest.slice(0, READINESS_GRENZEN.fingerprint)
}

export function fingerprintAktuell(gespeichert: string, aktuell: string): boolean {
  return gespeichert === aktuell && gespeichert.length > 0
}
