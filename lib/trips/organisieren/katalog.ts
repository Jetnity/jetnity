import { landName } from '@/lib/country/darstellung'
import { flughafenAusReiseort, type FlughafenAuswahl } from '@/lib/airports/auswahl'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { tageDifferenz } from '@/lib/activities/zeit'
import { hotelZeitraumAusEtappe } from '@/lib/hotels/reisegraph'
import type { Trip, TripStage, TripSummaryStage } from '@/types/trips'
import { reisebildAusEtappe } from './reisebilder'

const foto = (name: string) => '/images/organisieren/' + name + '.webp'

export type Ausflug = {
  name: string
  thema: 'Kultur' | 'Natur' | 'Wasser'
  text: string
  bild: string
  tour?: string
}
type Ziel = {
  bild: string
  kopf?: string
  flughafen: string | null
  aktivitaeten: Ausflug[]
}

const bangkok: Ziel = {
  bild: foto('bangkok'),
  kopf: foto('hero'),
  flughafen: 'BKK',
  aktivitaeten: [
    {
      name: 'Wat Pho entdecken',
      thema: 'Kultur',
      text: 'Die Tempelanlage und der liegende Buddha in der Altstadt.',
      bild: foto('watpho'),
    },
    {
      name: 'Bangkok vom Wasser aus',
      thema: 'Wasser',
      text: 'Die Kanäle von Thonburi und die Ufer des Chao Phraya.',
      bild: foto('canal'),
      tour: 'https://www.getyourguide.com/bangkok-l169/bangkok-before-after-sunset-tour-with-street-food-tasting-t612353/',
    },
    {
      name: 'Abend am Wat Arun',
      thema: 'Kultur',
      text: 'Blick vom östlichen Flussufer auf die Türme des Wat Arun.',
      bild: foto('hero'),
    },
  ],
}
const koChang: Ziel = {
  bild: foto('chang'),
  flughafen: null,
  aktivitaeten: [
    {
      name: 'Klong-Plu-Wasserfall',
      thema: 'Natur',
      text: 'Ein Ausflug in die bewaldete Inselmitte.',
      bild: foto('waterfall'),
    },
    {
      name: 'White Sand Beach',
      thema: 'Wasser',
      text: 'Der lange Sandstrand im Nordwesten von Ko Chang.',
      bild: foto('chang'),
    },
  ],
}
const phuket: Ziel = {
  bild: foto('phuket'),
  flughafen: 'HKT',
  aktivitaeten: [
    {
      name: 'Phukets Altstadt',
      thema: 'Kultur',
      text: 'Historische Häuserzeilen rund um die Thalang Road.',
      bild: foto('oldtown'),
      tour: 'https://www.getyourguide.com/phuket-city-l187/phuket-full-day-city-tour-with-night-market-t411423/',
    },
    {
      name: 'Die Phang-Nga-Bucht',
      thema: 'Natur',
      text: 'Ein Ausflug ab Phuket zu den Kalksteininseln der Bucht.',
      bild: foto('phuket'),
    },
  ],
}

const ziele = new Map<string, Ziel>([
  ['geonames:1609350', bangkok],
  ['geonames:1609348', bangkok],
  ['airport:BKK', bangkok],
  ['airport:DMK', bangkok],
  ['geonames:1611309', koChang],
  ['geonames:1151254', phuket],
  ['airport:HKT', phuket],
])

export function etappenZiel(etappe: Pick<TripSummaryStage, 'name' | 'countryCode' | 'placeId'> | undefined): Ziel | null {
  if (!etappe || (etappe.countryCode && etappe.countryCode !== 'TH')) return null
  const bekannt = ziele.get(etappe.placeId ?? '')
  if (bekannt) return bekannt
  // Legacy trips can have a country and a public destination name without an ID.
  if (etappe.placeId || etappe.countryCode !== 'TH') return null
  switch (etappe.name.trim().toLowerCase()) {
    case 'bangkok':
      return bangkok
    case 'ko chang':
    case 'koh chang':
      return koChang
    case 'phuket':
      return phuket
    default:
      return null
  }
}

export function reiseFoto(etappe?: Pick<TripSummaryStage, 'name' | 'countryCode' | 'placeId'>, _titel = false): string {
  // Keep the existing call signature; title and card now share the destination image.
  void _titel
  return reisebildAusEtappe(etappe)
}

export function vorgeschlagenerFlughafen(
  placeId: string | null,
  name: string | null,
  etappe?: TripStage,
): FlughafenAuswahl | null {
  const direkt = flughafenAusReiseort({ placeId, name })
  const iata = direkt?.iata ?? (placeId === 'geonames:2657896' ? 'ZRH' : etappenZiel(etappe)?.flughafen)
  return iata ? { iata, name: name && name !== iata ? name + ' (' + iata + ')' : iata } : null
}

export function hotelDaten(reise: Trip, etappe?: TripStage) {
  const termine = etappe && hotelZeitraumAusEtappe(reise, etappe)
  return {
    anreise: termine?.checkIn ?? etappe?.arrivalDate ?? '',
    abreise: termine?.checkOut ?? etappe?.departureDate ?? '',
  }
}

// CJ-Deep-Link für die freigeschaltete Jetnity-Werbefläche im Booking.com-DACH-Programm.
export const BOOKING_HOTEL_PARTNERLINK = 'https://www.anrdoezrs.net/click-101919996-14082404'

export function bookingHotelSuche(
  stage: Pick<TripStage, 'name' | 'countryCode'> | undefined,
  daten: { anreise: string; abreise: string; gaeste: number; zimmer: number; waehrung: string },
  heute = heutigesDatum(),
): { ziel: string } | { fehler: string } {
  const ort = stage?.name.trim()
  if (!ort) return { fehler: 'Bitte wähle zuerst ein Reiseziel.' }
  const ziel = new URL('https://www.booking.com/searchresults.de.html')
  const land = stage?.countryCode ? landName(stage.countryCode, 'de') : ''
  ziel.searchParams.set('ss', land ? ort + ', ' + land : ort)
  if (daten.anreise || daten.abreise) {
    if (daten.anreise < heute || (tageDifferenz(daten.anreise, daten.abreise) ?? 0) < 1) {
      return { fehler: 'Bitte wähle eine gültige An- und Abreise oder lass beide Termine offen.' }
    }
    ziel.searchParams.set('checkin', daten.anreise)
    ziel.searchParams.set('checkout', daten.abreise)
  }
  ziel.searchParams.set('group_adults', String(daten.gaeste))
  ziel.searchParams.set('no_rooms', String(daten.zimmer))
  ziel.searchParams.set('group_children', '0')
  if (/^[A-Z]{3}$/.test(daten.waehrung)) ziel.searchParams.set('selected_currency', daten.waehrung)
  return { ziel: ziel.href }
}
