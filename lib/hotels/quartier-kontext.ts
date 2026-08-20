// lib/hotels/quartier-kontext.ts
//
// Baut den Quartierkontext nur aus vorhandenen Reisedaten.
// Keine erfundenen POIs, Wegezeiten oder ÖV-Zeiten.
//
// Frei von Next und Providern.

import {
  FRUEHER_ABFLUG_MINUTE,
  LEERE_QUARTIER_EVIDENZ,
  type HotelSuchanfrage,
  type QuartierEvidenz,
  type QuartierKandidat,
  type QuartierPraeferenzen,
  type QuartierSuchkontext,
  type ReiseAnker,
} from '@/lib/hotels/domain'
import { geoPunktGueltig } from '@/lib/hotels/geo'
import type { HotelSucheEingabe } from '@/lib/hotels/schema'
import type { Trip, TripInterest, TripPace, TripStage } from '@/types/trips'

export type QuartierKontextErgebnis = {
  kontext: QuartierSuchkontext | null
  kandidaten: QuartierKandidat[]
  evidenz: QuartierEvidenz
}

function tageUtc(wert: string): number {
  return Date.parse(`${wert}T00:00:00Z`)
}

export function naechteZwischen(anreise: string | null, abreise: string | null): number | null {
  if (!anreise || !abreise) return null
  const differenz = Math.round((tageUtc(abreise) - tageUtc(anreise)) / 86_400_000)
  return differenz > 0 ? differenz : null
}

export function checkInAus(eingabe: HotelSucheEingabe): string | null {
  return eingabe.stage.arrivalDate ?? eingabe.trip.startDate
}

export function checkOutAus(eingabe: HotelSucheEingabe): string | null {
  return eingabe.stage.departureDate ?? eingabe.trip.endDate
}

function uhrzeitMinuten(wert: string | null): number | null {
  if (!wert) return null
  const [stunde, minute] = wert.split(':').map(Number)
  if (!Number.isFinite(stunde) || !Number.isFinite(minute)) return null
  return stunde * 60 + minute
}

function frueherAbflug(eingabe: HotelSucheEingabe, abreise: string | null): boolean {
  if (!abreise) return false
  return eingabe.flights.some((flug) => {
    if (flug.startsOn !== abreise) return false
    const minuten = uhrzeitMinuten(flug.startsAt)
    return minuten !== null && minuten < FRUEHER_ABFLUG_MINUTE
  })
}

function praeferenzenAus(
  interests: TripInterest[],
  pace: TripPace | null,
): QuartierPraeferenzen {
  const praeferenzen: QuartierPraeferenzen = {
    ruhe: null,
    nachtleben: null,
    essen: null,
    strand: null,
    familie: null,
  }

  if (interests.includes('food')) praeferenzen.essen = 0.8
  if (interests.includes('beach')) praeferenzen.strand = 0.8
  if (interests.includes('wellness') || pace === 'calm') praeferenzen.ruhe = 0.7

  return praeferenzen
}

function budgetProNacht(budget: number | null, naechte: number | null): number | null {
  if (budget === null || naechte === null || naechte <= 0 || budget <= 0) return null
  return Math.round((budget / naechte) * 100) / 100
}

function ankerAus(eingabe: HotelSucheEingabe): ReiseAnker[] {
  const { latitude, longitude } = eingabe.stage
  if (latitude === null || longitude === null) return []
  const punkt = { lat: latitude, lon: longitude }
  if (!geoPunktGueltig(punkt)) return []
  return [
    {
      id: eingabe.stage.placeId ?? `stage:${eingabe.stage.id}`,
      name: eingabe.stage.name,
      punkt,
      gewicht: 1,
    },
  ]
}

function etappenKandidat(eingabe: HotelSucheEingabe, anker: ReiseAnker[]): QuartierKandidat | null {
  const name = eingabe.stage.name.trim()
  if (!name) return null
  const zentrum = anker[0]?.punkt
  if (!zentrum) return null

  return {
    id: eingabe.stage.placeId ?? `stage:${eingabe.stage.id}`,
    name,
    herkunft: 'etappenort',
    zentrum,
    taeglicheWegeMinuten: null,
    anreiseTransferMinuten: null,
    abreiseTransferMinuten: null,
    gehScore: null,
    oevScore: null,
    ruheScore: null,
    nachtlebenScore: null,
    essenScore: null,
    strandScore: null,
    familieScore: null,
    typischeNachtPreis: null,
  }
}

export function hotelSucheEingabeAusReise(reise: Trip, etappe: TripStage): HotelSucheEingabe {
  return {
    stage: {
      id: etappe.id,
      name: etappe.name,
      placeId: etappe.placeId,
      latitude: etappe.latitude,
      longitude: etappe.longitude,
      arrivalDate: etappe.arrivalDate,
      departureDate: etappe.departureDate,
    },
    trip: {
      startDate: reise.startDate,
      endDate: reise.endDate,
      travellers: reise.travellers,
      currency: reise.currency,
      budgetAmount: reise.budgetAmount,
      interests: reise.interests,
      pace: reise.pace,
    },
    rooms: 1,
    children: 0,
    flights: [...reise.days.flatMap((tag) => tag.items), ...reise.ohneTag]
      .filter((punkt) => punkt.kind === 'flight')
      .map((punkt) => ({
        startsOn: punkt.startsOn,
        startsAt: punkt.startsAt,
      })),
  }
}

export function quartierKontextAusReise(eingabe: HotelSucheEingabe): QuartierKontextErgebnis {
  const checkIn = checkInAus(eingabe)
  const checkOut = checkOutAus(eingabe)
  const naechte = naechteZwischen(checkIn, checkOut)
  const anker = ankerAus(eingabe)
  const praeferenzen = praeferenzenAus(eingabe.trip.interests, eingabe.trip.pace)
  const kandidat = etappenKandidat(eingabe, anker)
  const kandidaten = kandidat ? [kandidat] : []

  const evidenz: QuartierEvidenz = {
    hatOrt: eingabe.stage.name.trim().length > 0,
    hatKoordinaten: anker.length > 0,
    hatZeitraum: naechte !== null,
    hatReiseanker: anker.length > 0,
    hatWegezeiten: false,
    hatTransferzeiten: false,
    hatPraeferenzprofil: false,
  }

  if (!evidenz.hatOrt) {
    return { kontext: null, kandidaten: [], evidenz: { ...LEERE_QUARTIER_EVIDENZ } }
  }

  return {
    kontext: {
      destinationPlaceId: eingabe.stage.placeId ?? `stage:${eingabe.stage.id}`,
      destinationName: eingabe.stage.name,
      naechte: naechte ?? 0,
      reiseAnker: anker,
      budgetProNachtMax: budgetProNacht(eingabe.trip.budgetAmount, naechte),
      praeferenzen,
      transferPrioritaet: {
        anreise: 0.5,
        abreise: frueherAbflug(eingabe, checkOut) ? 1 : 0.5,
      },
    },
    kandidaten,
    evidenz,
  }
}

export function suchanfrageAusKontext(
  eingabe: HotelSucheEingabe,
  quartier: { id: string; name: string; zentrum: { lat: number; lon: number } } | null,
): HotelSuchanfrage | null {
  const checkIn = checkInAus(eingabe)
  const checkOut = checkOutAus(eingabe)
  const naechte = naechteZwischen(checkIn, checkOut)
  if (!checkIn || !checkOut || !naechte) return null
  if (!eingabe.stage.placeId && !eingabe.stage.name.trim()) return null

  return {
    destinationPlaceId: eingabe.stage.placeId ?? `stage:${eingabe.stage.id}`,
    checkIn,
    checkOut,
    rooms: eingabe.rooms,
    adults: Math.min(16, Math.max(1, eingabe.trip.travellers)),
    children: eingabe.children,
    currency: eingabe.trip.currency,
    quartier,
    preferences: {
      budgetProNachtMax: budgetProNacht(eingabe.trip.budgetAmount, naechte),
      mindestSterne: null,
      fruehstueckBevorzugt: null,
      stornierbarBevorzugt: null,
    },
  }
}
