// lib/airports/suche.ts
//
// Lokale Flughafensuche. Kein externer Provider, keine Credentials.
// Die Treffermenge kommt aus `public.airports`; hier stehen nur Abbildung,
// Suchvarianten und Rangfolge.

import { enthaeltGefaltet, gleichGefaltet, sucheVarianten } from '@/lib/airports/normalisieren'
import { iataLesen } from '@/lib/route/referenz'
import { namensRangMitWortanfang } from '@/lib/suche/relevanz'

export type FlughafenZeile = {
  iata: string | null
  icao: string | null
  name: string
  city: string | null
  region?: string | null
  country: string | null
  keywords?: string | null
  klasse?: string | null
}

export type FlughafenOption = {
  label: string
  value: string
  description?: string
}

const FLUGHAFEN_TREFFER = 6
export const FLUGHAFEN_ABFRAGE = 80

const STARK_RANG = 2_800
const MIN_RANG_BEI_STARK = 1_500
const MIN_RANG = 200

function klasseBonus(klasse: string | null | undefined): number {
  if (klasse === 'large') return 80
  if (klasse === 'medium') return 40
  if (klasse === 'small') return 10
  return 0
}

export function flughafenAlsOption(zeile: FlughafenZeile): FlughafenOption | null {
  const iata = iataLesen(zeile.iata)
  if (!iata) return null
  const zusatz = [zeile.city, zeile.region, zeile.country].filter(
    (wert, i, alle): wert is string => Boolean(wert) && alle.indexOf(wert) === i,
  )
  return {
    label: `${zeile.name} · ${iata}`,
    value: iata,
    description: zusatz.join(', ') || undefined,
  }
}

function flughafenRang(zeile: FlughafenZeile, suche: string): number {
  const raw = suche.trim()
  if (!raw) return 0
  const up = raw.toUpperCase()
  let rang = 0

  if (zeile.iata && zeile.iata.toUpperCase() === up) rang += 10_000
  else if (zeile.icao && zeile.icao.toUpperCase() === up) rang += 8_000
  else if (zeile.iata && zeile.iata.toUpperCase().startsWith(up) && up.length >= 2) rang += 3_000
  else if (zeile.icao && zeile.icao.toUpperCase().startsWith(up) && up.length >= 2) rang += 2_500

  rang += namensRangMitWortanfang(zeile.city, raw)
  const nameRang = namensRangMitWortanfang(zeile.name, raw)
  if (nameRang > 0) rang += Math.min(nameRang, 2_800)

  if (enthaeltGefaltet(zeile.keywords, raw)) {
    const genau = (zeile.keywords ?? '')
      .split(',')
      .some((teil) => gleichGefaltet(teil.trim(), raw))
    rang += genau ? 2_000 : 180
  }
  if (rang === 0) return 0
  if (enthaeltGefaltet(zeile.region, raw) && !gleichGefaltet(zeile.city, raw)) rang += 80
  if (enthaeltGefaltet(zeile.country, raw) && !gleichGefaltet(zeile.city, raw)) rang += 20
  return rang + klasseBonus(zeile.klasse)
}

function stadtKurzoption(zeilen: FlughafenZeile[], suche: string): FlughafenOption | null {
  const stadtTreffer = zeilen.filter((zeile) => iataLesen(zeile.iata) && gleichGefaltet(zeile.city, suche.trim()))
  const grosse = stadtTreffer.filter((zeile) => zeile.klasse === 'large')
  const kandidat =
    grosse.length === 1 ? grosse[0] : grosse.length === 0 && stadtTreffer.length === 1 ? stadtTreffer[0] : null
  if (!kandidat) return null
  const iata = iataLesen(kandidat.iata)
  if (!iata || !kandidat.city) return null
  return {
    label: kandidat.country ? `${kandidat.city}, ${kandidat.country}` : kandidat.city,
    value: iata,
    description: 'Stadt',
  }
}

export function flughaefenOrdnen(zeilen: FlughafenZeile[], suche: string): FlughafenOption[] {
  const bewertet = [...zeilen]
    .map((zeile) => ({ zeile, rang: flughafenRang(zeile, suche) }))
    .filter((eintrag) => eintrag.rang > 0)
    .sort((a, b) => {
      if (b.rang !== a.rang) return b.rang - a.rang
      return (a.zeile.iata ?? a.zeile.name).localeCompare(b.zeile.iata ?? b.zeile.name)
    })

  const hatStark = bewertet.some((eintrag) => eintrag.rang >= STARK_RANG)
  const sichtbar = bewertet
    .filter((eintrag) => (hatStark ? eintrag.rang >= MIN_RANG_BEI_STARK : eintrag.rang >= MIN_RANG))
    .slice(0, FLUGHAFEN_TREFFER)
    .map(({ zeile }) => flughafenAlsOption(zeile))
    .filter((option): option is FlughafenOption => Boolean(option))

  const stadt = stadtKurzoption(sichtbar.length > 0 ? bewertet.map((eintrag) => eintrag.zeile) : [], suche)
  if (stadt && !sichtbar.some((option) => option.label === stadt.label)) {
    const anker = sichtbar.findIndex((option) => option.value === stadt.value)
    if (anker >= 0) sichtbar.splice(anker + 1, 0, stadt)
    else sichtbar.push(stadt)
    return sichtbar.slice(0, FLUGHAFEN_TREFFER + 1)
  }
  return sichtbar
}

/** Zeichen, die PostgREST-`.or()` oder LIKE zerlegen würden. */
export function sucheSicher(wert: string): string {
  return wert.replace(/[%_,.()\\*]/g, '').trim()
}

export function sucheFilter(suche: string): string[] {
  return sucheVarianten(suche)
    .map(sucheSicher)
    .filter((eintrag) => eintrag.length > 0)
}
