import { flughafenAusReiseort, type FlughafenAuswahl } from '@/lib/airports/auswahl'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { tageDifferenz } from '@/lib/activities/zeit'
import { hotelZeitraumAusEtappe } from '@/lib/hotels/reisegraph'
import type { Trip, TripStage } from '@/types/trips'

const foto = (name: string) => '/images/organisieren/' + name + '.webp'

export type Hotelprofil = {
  slug: string
  name: string
  viertel: string
  lage: string
  bild: string
  umgebung?: boolean
  lat: number
  lng: number
}

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
  hotels: Hotelprofil[]
  aktivitaeten: Ausflug[]
}

const bangkok: Ziel = {
  bild: foto('bangkok'),
  kopf: foto('hero'),
  flughafen: 'BKK',
  hotels: [
    {
      slug: 'shangri-la-bangkok',
      name: 'Shangri-La Bangkok',
      viertel: 'Bang Rak',
      lage: 'Am Chao Phraya',
      bild: foto('shangri'),
      lat: 13.721266,
      lng: 100.514565,
    },
    {
      slug: 'the-peninsula-bangkok',
      name: 'The Peninsula Bangkok',
      viertel: 'Khlong San',
      lage: 'Westliches Flussufer',
      bild: foto('peninsula'),
      lat: 13.723085,
      lng: 100.510923,
    },
    {
      slug: 'mandarin-oriental-bangkok',
      name: 'Mandarin Oriental, Bangkok',
      viertel: 'Bang Rak',
      lage: 'Historisches Flussviertel',
      bild: foto('mandarin'),
      lat: 13.724174,
      lng: 100.514479,
    },
  ],
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
  hotels: [
    {
      slug: 'koh-chang-paradise-resort-and-spa-ko-chang',
      name: 'Koh Chang Paradise Resort & Spa',
      viertel: 'Klong Prao',
      lage: 'Am Klong Prao Beach',
      bild: foto('paradise'),
      lat: 12.067186,
      lng: 102.282659,
    },
    {
      slug: 'kc-grande-resort-spa',
      name: 'KC Grande Resort Koh Chang',
      viertel: 'White Sand Beach',
      lage: 'Im Norden der Westküste',
      bild: foto('chang'),
      umgebung: true,
      lat: 12.110245,
      lng: 102.269736,
    },
  ],
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
  hotels: [
    {
      slug: 'katathani-phuket-beach-resort',
      name: 'Katathani Phuket Beach Resort',
      viertel: 'Kata Noi',
      lage: 'Südwestküste von Phuket',
      bild: foto('katathani'),
      lat: 7.807103,
      lng: 98.299747,
    },
    {
      slug: 'angsana-laguna-phuket',
      name: 'Angsana Laguna Phuket',
      viertel: 'Bang Tao',
      lage: 'Im Laguna-Viertel',
      bild: foto('angsana'),
      lat: 8.005161,
      lng: 98.297853,
    },
  ],
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

export function etappenZiel(etappe: TripStage | undefined): Ziel | null {
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

export function reiseFoto(etappe?: TripStage, titel = false): string {
  const ziel = etappenZiel(etappe)
  if (ziel) return (titel && ziel.kopf) || ziel.bild
  const weitere: Record<string, string> = {
    'geonames:2759794': 'amsterdam',
    'geonames:2267057': 'lisbon',
    'geonames:2657928': 'zermatt',
  }
  const datei = weitere[etappe?.placeId ?? '']
  return datei ? '/images/' + datei + '.jpg' : foto('reise')
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

export function bookingHotelLink(
  hotel: Hotelprofil,
  daten: { anreise: string; abreise: string; gaeste: number; zimmer: number; waehrung: string },
): string {
  const ziel = new URL('https://www.booking.com/hotel/th/' + encodeURIComponent(hotel.slug) + '.de.html')
  if (daten.anreise >= heutigesDatum() && (tageDifferenz(daten.anreise, daten.abreise) ?? 0) > 0) {
    ziel.searchParams.set('checkin', daten.anreise)
    ziel.searchParams.set('checkout', daten.abreise)
  }
  ziel.searchParams.set('group_adults', String(daten.gaeste))
  ziel.searchParams.set('no_rooms', String(daten.zimmer))
  ziel.searchParams.set('group_children', '0')
  if (/^[A-Z]{3}$/.test(daten.waehrung)) ziel.searchParams.set('selected_currency', daten.waehrung)
  const cj = new URL('https://www.anrdoezrs.net/click-101919996-14082404')
  cj.searchParams.set('sid', 'jetnity-hotel')
  cj.searchParams.set('url', ziel.href)
  return cj.href
}
