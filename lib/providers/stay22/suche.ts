import { heutigesDatum } from '@/lib/account/naechste-reise'
import { tageDifferenz } from '@/lib/activities/zeit'
import { landName } from '@/lib/country/darstellung'
import type { TripStage } from '@/types/trips'

export const STAY22_WAEHRUNGEN = ['CHF', 'EUR', 'USD', 'GBP', 'CAD', 'AUD'] as const
export const STAY22_SANDBOX = 'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox'

export type Stay22Filter = { sterne: number; bewertung: number; preis: 'total' | 'nightly' }
export type Stay22Ansicht = 'all' | 'listview' | 'map'
export type Stay22Kartenort = { name: string; latitude: number; longitude: number }
export const STAY22_FILTER: Stay22Filter = { sterne: 0, bewertung: 0, preis: 'total' }

export type Stay22Ort = {
  name: string
  adresse: string
  latitude?: number | null
  longitude?: number | null
}
export type Stay22Eingabe = {
  ort: Stay22Ort | null
  anreise: string
  abreise: string
  erwachsene: number
  kinder: number
  zimmer: number
  waehrung: string
  filter?: Stay22Filter
  kartenorte?: Stay22Kartenort[]
  umgebung?: boolean
}

export type Stay22Suche = {
  url: string
  ort: string
  anreise: string
  abreise: string
  naechte: number
  erwachsene: number
  kinder: number
  zimmer: number
  waehrung: string
  filter: Stay22Filter
  kartenorte: number
}

export type Stay22Fehlerfeld = 'ort' | 'anreise' | 'abreise' | 'gaeste' | 'waehrung' | 'filter'

export function stay22OrtAusEtappe(etappe?: TripStage): Stay22Ort | null {
  if (!etappe) return null
  const land = etappe.countryCode ? landName(etappe.countryCode, 'de') : ''
  return {
    name: etappe.name,
    adresse: [etappe.name, land].filter(Boolean).join(', '),
    latitude: etappe.latitude,
    longitude: etappe.longitude,
  }
}

/** Only documented public search fields leave Jetnity. Never pass a Trip object. */
export function stay22Suche(eingabe: Stay22Eingabe, heute = heutigesDatum()): { suche: Stay22Suche } | { fehler: string; feld: Stay22Fehlerfeld } {
  const { ort, anreise, abreise, erwachsene, kinder, zimmer, waehrung } = eingabe
  if (!ort?.name.trim() || !ort.adresse.trim() || ort.adresse.length > 300) return { fehler: 'Bitte wähle ein Reiseziel aus.', feld: 'ort' }
  const naechte = tageDifferenz(anreise, abreise)
  const vorlauf = tageDifferenz(heute, anreise)
  if (naechte === null || naechte < 1 || vorlauf === null || vorlauf < 0) {
    return { fehler: 'Bitte wähle eine gültige An- und Abreise. Die Abreise muss nach der Anreise liegen.', feld: vorlauf === null || vorlauf < 0 ? 'anreise' : 'abreise' }
  }
  if (naechte > 90 || (tageDifferenz(heute, abreise) ?? Infinity) > 730) {
    return { fehler: 'Bitte suche einen Aufenthalt bis 90 Nächte innerhalb der nächsten zwei Jahre.', feld: 'abreise' }
  }
  if (!Number.isInteger(erwachsene) || erwachsene < 1 || erwachsene > 9 ||
      !Number.isInteger(kinder) || kinder < 0 || kinder > 8 ||
      !Number.isInteger(zimmer) || zimmer < 1 || zimmer > Math.min(8, erwachsene)) {
    return { fehler: 'Bitte prüfe Erwachsene, Kinder und Zimmer. Die Suche unterstützt bis zu neun Erwachsene. Pro Zimmer wird mindestens ein Erwachsener benötigt.', feld: 'gaeste' }
  }
  if (!(STAY22_WAEHRUNGEN as readonly string[]).includes(waehrung)) return { fehler: 'Bitte wähle eine der angebotenen Währungen.', feld: 'waehrung' }
  const filter = eingabe.filter ?? STAY22_FILTER
  if (![0, 1, 2, 3, 4, 5].includes(filter.sterne) || ![0, 6, 7, 8, 9].includes(filter.bewertung) || !['total', 'nightly'].includes(filter.preis)) {
    return { fehler: 'Bitte überprüfe die Suchfilter.', feld: 'filter' }
  }
  const url = new URL('https://www.stay22.com/embed/gm')
  const parameter = {
    aid: 'jetnity', campaign: 'jetnity-unterkunft', address: ort.adresse.trim(),
    checkin: anreise, checkout: abreise, adults: String(erwachsene), children: String(kinder), rooms: String(zimmer),
    currency: waehrung, ljs: 'de', unitsystem: 'metric', priceper: filter.preis,
    maincolor: '153a33', fontcolor: 'ffffff', hotelscolor: '153a33', hotelsfontcolor: 'ffffff',
    mapstyle: 'streets', viewmode: 'all', listviewexpand: 'true', limit: '60', zoom: eingabe.umgebung ? '14' : '12',
    hidesearchbar: 'true', hidecheckinout: 'true', hideguestpicker: 'true', hidecurrency: 'true',
    hidemodeswitcher: 'true', hidebrandlogo: 'true', hideenlargemap: 'true',
  }
  for (const [name, wert] of Object.entries(parameter)) url.searchParams.set(name, wert)
  if (filter.sterne) url.searchParams.set('minstarrating', String(filter.sterne))
  if (filter.bewertung) url.searchParams.set('minguestrating', String(filter.bewertung))
  const pois = (eingabe.kartenorte ?? []).filter(p => p.name.trim() && Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 &&
    Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180).slice(0, 8).map(p => ({
    lat: p.latitude, lng: p.longitude, name: p.name.replace(/[<>\p{Cc}]/gu, '').slice(0, 80), size: 2,
  }))
  if (pois.length) {
    url.searchParams.set('poi', JSON.stringify(pois))
    url.searchParams.set('poibgcolor', 'ddf27a')
  }
  if (typeof ort.latitude === 'number' && Number.isFinite(ort.latitude) && Math.abs(ort.latitude) <= 90 &&
      typeof ort.longitude === 'number' && Number.isFinite(ort.longitude) && Math.abs(ort.longitude) <= 180) {
    url.searchParams.set('lat', String(ort.latitude))
    url.searchParams.set('lng', String(ort.longitude))
  }
  return { suche: { url: url.href, ort: ort.name.trim(), anreise, abreise, naechte, erwachsene, kinder, zimmer, waehrung, filter: { ...filter }, kartenorte: pois.length } }
}

export function stay22Ansicht(url: string, ansicht: Stay22Ansicht): string {
  const ziel = new URL(url)
  ziel.searchParams.set('viewmode', ansicht)
  ziel.searchParams.set('listviewexpand', String(ansicht === 'all'))
  return ziel.href
}
