// lib/airports/suche.ts
//
// Lokale Flughafensuche. Kein externer Provider, keine Credentials.
// Die Treffermenge kommt aus `public.airports`; hier stehen nur Abbildung
// und Rangfolge, damit die Route sie nicht noch einmal formuliert.

export type FlughafenZeile = {
  iata: string | null
  icao: string | null
  name: string
  city: string | null
  country: string | null
}

export type FlughafenOption = {
  label: string
  value: string
  description?: string
}

const FLUGHAFEN_TREFFER = 12
export const FLUGHAFEN_ABFRAGE = 40

export function flughafenAlsOption(zeile: FlughafenZeile): FlughafenOption {
  const code = zeile.iata || zeile.icao || ''
  const label = `${code ? `${code} — ` : ''}${zeile.name}${zeile.city ? `, ${zeile.city}` : ''}`
  return {
    label,
    value: code || zeile.name,
    description: zeile.country ?? undefined,
  }
}

function flughafenRang(zeile: FlughafenZeile, suche: string): number {
  const raw = suche.trim()
  const q = raw.toLowerCase()
  const up = raw.toUpperCase()
  let rang = 0
  if (zeile.iata && zeile.iata.toUpperCase() === up) rang += 1000
  if (zeile.icao && zeile.icao.toUpperCase() === up) rang += 900
  if (zeile.iata && zeile.iata.toUpperCase().startsWith(up)) rang += 500
  if (zeile.icao && zeile.icao.toUpperCase().startsWith(up)) rang += 400
  if (zeile.name?.toLowerCase().startsWith(q)) rang += 220
  if (zeile.city?.toLowerCase().startsWith(q)) rang += 200
  if (zeile.name?.toLowerCase().includes(q)) rang += 120
  if (zeile.city?.toLowerCase().includes(q)) rang += 100
  if (zeile.country?.toLowerCase().includes(q)) rang += 20
  return rang
}

export function flughaefenOrdnen(zeilen: FlughafenZeile[], suche: string): FlughafenOption[] {
  return [...zeilen]
    .map((zeile) => ({ zeile, rang: flughafenRang(zeile, suche) }))
    .sort((a, b) => b.rang - a.rang)
    .slice(0, FLUGHAFEN_TREFFER)
    .map(({ zeile }) => flughafenAlsOption(zeile))
}
