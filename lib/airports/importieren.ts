// lib/airports/importieren.ts
//
// OurAirports-CSV → Jetnity-Referenzzeilen.
// Kein Netzwerk, kein Supabase. Die Filter entscheiden, was in die Suche darf.

import { z } from 'zod'

import { csvAlsObjekte } from '@/lib/airports/csv'

const FLUGHAFEN_KLASSEN = ['large', 'medium', 'small'] as const
export type FlughafenKlasse = (typeof FLUGHAFEN_KLASSEN)[number]

export type FlughafenImportZeile = {
  iata: string
  icao: string | null
  name: string
  city: string | null
  region: string | null
  country: string | null
  countryCode: string | null
  lat: number | null
  lon: number | null
  keywords: string | null
  klasse: FlughafenKlasse
}

const KLASSE_AUS_TYP: Record<string, FlughafenKlasse> = {
  large_airport: 'large',
  medium_airport: 'medium',
  small_airport: 'small',
}

const iataSchema = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{3}$/))

const icaoSchema = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{4}$/))

const landescodeSchema = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{2}$/))

function textOderNull(wert: string | undefined, maximum: number): string | null {
  const gelesen = wert?.trim() ?? ''
  if (!gelesen) return null
  return gelesen.slice(0, maximum)
}

function zahlOderNull(wert: string | undefined, min: number, max: number): number | null {
  if (!wert?.trim()) return null
  const gelesen = Number(wert)
  if (!Number.isFinite(gelesen) || gelesen < min || gelesen > max) return null
  return gelesen
}

function icaoLesen(satz: Record<string, string>): string | null {
  const direkt = icaoSchema.safeParse(satz.icao_code)
  if (direkt.success) return direkt.data
  const ident = icaoSchema.safeParse(satz.ident)
  return ident.success ? ident.data : null
}

function istRelevant(satz: Record<string, string>): boolean {
  if (!iataSchema.safeParse(satz.iata_code).success) return false
  const typ = satz.type?.trim()
  if (typ === 'large_airport' || typ === 'medium_airport') return true
  return typ === 'small_airport' && satz.scheduled_service?.trim().toLowerCase() === 'yes'
}

function klasseAus(typ: string | undefined): FlughafenKlasse | null {
  return typ ? (KLASSE_AUS_TYP[typ] ?? null) : null
}

function klasseRang(klasse: FlughafenKlasse): number {
  if (klasse === 'large') return 3
  if (klasse === 'medium') return 2
  return 1
}

function besser(links: FlughafenImportZeile, rechts: FlughafenImportZeile): FlughafenImportZeile {
  const rang = klasseRang(links.klasse) - klasseRang(rechts.klasse)
  if (rang !== 0) return rang > 0 ? links : rechts
  if (Boolean(links.icao) !== Boolean(rechts.icao)) return links.icao ? links : rechts
  return links.name.length >= rechts.name.length ? links : rechts
}

function landNamen(countriesCsv: string): Map<string, string> {
  const namen = new Map<string, string>()
  for (const satz of csvAlsObjekte(countriesCsv)) {
    const code = landescodeSchema.safeParse(satz.code)
    const name = textOderNull(satz.name, 80)
    if (code.success && name) namen.set(code.data, name)
  }
  return namen
}

function regionNamen(regionsCsv: string): Map<string, string> {
  const namen = new Map<string, string>()
  for (const satz of csvAlsObjekte(regionsCsv)) {
    const code = satz.code?.trim().toUpperCase()
    const name = textOderNull(satz.name, 80)
    if (code && name) namen.set(code, name)
  }
  return namen
}

function zeileAus(
  satz: Record<string, string>,
  laender: Map<string, string>,
  regionen: Map<string, string>,
): FlughafenImportZeile | null {
  const iata = iataSchema.safeParse(satz.iata_code)
  const klasse = klasseAus(satz.type)
  const name = textOderNull(satz.name, 200)
  if (!iata.success || !klasse || !name) return null

  const countryCode = landescodeSchema.safeParse(satz.iso_country)
  const regionCode = satz.iso_region?.trim().toUpperCase() ?? ''

  return {
    iata: iata.data,
    icao: icaoLesen(satz),
    name,
    city: textOderNull(satz.municipality, 120),
    region: regionCode ? (regionen.get(regionCode) ?? textOderNull(regionCode, 40)) : null,
    country: countryCode.success ? (laender.get(countryCode.data) ?? countryCode.data) : null,
    countryCode: countryCode.success ? countryCode.data : null,
    lat: zahlOderNull(satz.latitude_deg, -90, 90),
    lon: zahlOderNull(satz.longitude_deg, -180, 180),
    keywords: textOderNull(satz.keywords, 400),
    klasse,
  }
}

export function flughaefenAusOurAirports(eingabe: {
  airportsCsv: string
  countriesCsv: string
  regionsCsv?: string
}): { zeilen: FlughafenImportZeile[]; verworfen: number } {
  const laender = landNamen(eingabe.countriesCsv)
  const regionen = regionNamen(eingabe.regionsCsv ?? '')
  const nachIata = new Map<string, FlughafenImportZeile>()
  let verworfen = 0

  for (const satz of csvAlsObjekte(eingabe.airportsCsv)) {
    if (!istRelevant(satz)) {
      if (satz.iata_code?.trim() || satz.type?.trim()) verworfen += 1
      continue
    }
    const zeile = zeileAus(satz, laender, regionen)
    if (!zeile) {
      verworfen += 1
      continue
    }
    const bisher = nachIata.get(zeile.iata)
    nachIata.set(zeile.iata, bisher ? besser(bisher, zeile) : zeile)
  }

  const zeilen = [...nachIata.values()]
  const icaoBesitzer = new Map<string, FlughafenImportZeile>()
  for (const zeile of zeilen) {
    if (!zeile.icao) continue
    const bisher = icaoBesitzer.get(zeile.icao)
    if (!bisher) {
      icaoBesitzer.set(zeile.icao, zeile)
      continue
    }
    const sieger = besser(bisher, zeile)
    const verlierer = sieger === bisher ? zeile : bisher
    verlierer.icao = null
    icaoBesitzer.set(zeile.icao, sieger)
  }

  zeilen.sort((a, b) => a.iata.localeCompare(b.iata))
  return { zeilen, verworfen }
}
