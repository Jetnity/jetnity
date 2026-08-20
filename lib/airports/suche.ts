// lib/airports/suche.ts
//
// Lokale Flughafensuche. Kein externer Provider, keine Credentials.
// Die Treffermenge kommt aus `public.airports`; hier stehen nur Abbildung,
// Suchvarianten und Rangfolge.

import {
  beginntGefaltet,
  enthaeltGefaltet,
  gleichGefaltet,
  sucheVarianten,
} from '@/lib/airports/normalisieren'
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

const FLUGHAFEN_TREFFER = 12
export const FLUGHAFEN_ABFRAGE = 80

function klasseBonus(klasse: string | null | undefined): number {
  if (klasse === 'large') return 80
  if (klasse === 'medium') return 40
  if (klasse === 'small') return 10
  return 0
}

export function flughafenAlsOption(zeile: FlughafenZeile): FlughafenOption {
  const code = zeile.iata || zeile.icao || ''
  const label = `${code ? `${code} — ` : ''}${zeile.name}${zeile.city ? `, ${zeile.city}` : ''}`
  const ort =
    zeile.region && zeile.country && zeile.region !== zeile.country
      ? `${zeile.region}, ${zeile.country}`
      : (zeile.country ?? zeile.region ?? undefined)
  return {
    label,
    value: code || zeile.name,
    description: ort,
  }
}

function flughafenRang(zeile: FlughafenZeile, suche: string): number {
  const raw = suche.trim()
  if (!raw) return 0
  const up = raw.toUpperCase()
  let rang = klasseBonus(zeile.klasse)

  if (zeile.iata && zeile.iata.toUpperCase() === up) rang += 10_000
  else if (zeile.icao && zeile.icao.toUpperCase() === up) rang += 8_000
  else if (zeile.iata && zeile.iata.toUpperCase().startsWith(up)) rang += 3_000
  else if (zeile.icao && zeile.icao.toUpperCase().startsWith(up)) rang += 2_500

  if (gleichGefaltet(zeile.city, raw)) rang += 2_000
  else if (beginntGefaltet(zeile.city, raw)) rang += 1_500
  else if (enthaeltGefaltet(zeile.city, raw)) rang += 800

  if (beginntGefaltet(zeile.name, raw)) rang += 1_200
  else if (enthaeltGefaltet(zeile.name, raw)) rang += 700

  if (enthaeltGefaltet(zeile.keywords, raw)) rang += 500
  if (enthaeltGefaltet(zeile.region, raw)) rang += 120
  if (enthaeltGefaltet(zeile.country, raw)) rang += 40
  return rang
}

export function flughaefenOrdnen(zeilen: FlughafenZeile[], suche: string): FlughafenOption[] {
  return [...zeilen]
    .map((zeile) => ({ zeile, rang: flughafenRang(zeile, suche) }))
    .sort((a, b) => {
      if (b.rang !== a.rang) return b.rang - a.rang
      return (a.zeile.iata ?? a.zeile.name).localeCompare(b.zeile.iata ?? b.zeile.name)
    })
    .slice(0, FLUGHAFEN_TREFFER)
    .map(({ zeile }) => flughafenAlsOption(zeile))
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
