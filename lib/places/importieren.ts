// lib/places/importieren.ts
//
// GeoNames-Zeilen → Jetnity-Orte. Kein Netzwerk, kein Supabase.
// Der Filter entscheidet, was als Reiseziel oder Abreise taugt.

import { z } from 'zod'

import { ORT_TYPEN, ortId, type Ort, type OrtTyp } from '@/lib/places/domain'

const landescodeSchema = z
  .string()
  .trim()
  .transform((wert) => wert.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{2}$/))

export type GeoNamesZeile = {
  geonameId: string
  name: string
  asciiName: string
  altNames: string
  lat: number
  lon: number
  featureClass: string
  featureCode: string
  countryCode: string
  admin1: string
  population: number
}

export type LandName = { code: string; name: string }

const ZIEL_CODES = new Set([
  'PCLI',
  'PCLD',
  'PCLS',
  'TERR',
  'ADM1',
  'ADM2',
  'ISL',
  'ISLS',
  'ATOL',
])

const STADT_CODES = new Set(['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLG'])

function textOderNull(wert: string | undefined, maximum: number): string | null {
  const gelesen = wert?.trim() ?? ''
  if (!gelesen) return null
  return gelesen.slice(0, maximum)
}

function typAus(code: string): OrtTyp | null {
  if (code === 'PCLI' || code === 'PCLD' || code === 'PCLS' || code === 'TERR') return 'country'
  if (code === 'ADM1' || code === 'ADM2') return 'region'
  if (code === 'ISL' || code === 'ISLS' || code === 'ATOL') return 'island'
  if (code.startsWith('PPL')) return 'city'
  return null
}

export function geoNamesZeileRelevant(zeile: GeoNamesZeile): boolean {
  const code = zeile.featureCode
  if (code === 'ADM2') return zeile.population >= 50_000
  if (code === 'ISL' || code === 'ISLS' || code === 'ATOL') return zeile.population >= 5_000
  if (ZIEL_CODES.has(code) && code !== 'ADM2') return true
  if (zeile.featureClass !== 'P') return false
  return STADT_CODES.has(code) || zeile.population >= 5_000
}

export function orteAusGeoNames(eingabe: {
  zeilen: GeoNamesZeile[]
  laender: LandName[]
}): { orte: Ort[]; verworfen: number } {
  const laender = new Map<string, string>()
  for (const land of eingabe.laender) {
    const code = landescodeSchema.safeParse(land.code)
    const name = textOderNull(land.name, 80)
    if (code.success && name) laender.set(code.data, name)
  }

  const nachId = new Map<string, Ort>()
  let verworfen = 0

  for (const zeile of eingabe.zeilen) {
    if (!geoNamesZeileRelevant(zeile)) {
      verworfen += 1
      continue
    }
    const geonameId = zeile.geonameId.trim()
    if (!/^\d+$/.test(geonameId)) {
      verworfen += 1
      continue
    }
    const typ = typAus(zeile.featureCode)
    const name = textOderNull(zeile.name, 120)
    const countryCode = landescodeSchema.safeParse(zeile.countryCode)
    if (!typ || !name || !ORT_TYPEN.includes(typ)) {
      verworfen += 1
      continue
    }

    const keywords = [zeile.asciiName, zeile.altNames]
      .map((wert) => wert.trim())
      .filter(Boolean)
      .join(', ')
      .slice(0, 800)

    const id = ortId('geonames', geonameId)
    nachId.set(id, {
      id,
      source: 'geonames',
      sourceId: geonameId,
      name,
      typ,
      country: countryCode.success ? (laender.get(countryCode.data) ?? countryCode.data) : null,
      countryCode: countryCode.success ? countryCode.data : null,
      region: typ === 'region' || typ === 'country' ? null : textOderNull(zeile.admin1, 80),
      lat: Number.isFinite(zeile.lat) ? zeile.lat : null,
      lon: Number.isFinite(zeile.lon) ? zeile.lon : null,
      iata: null,
      keywords: keywords || null,
    })
  }

  const orte = [...nachId.values()].sort((a, b) => a.id.localeCompare(b.id))
  return { orte, verworfen }
}

export function ortAusFlughafen(zeile: {
  iata: string
  name: string
  city: string | null
  region: string | null
  country: string | null
  countryCode: string | null
  lat: number | null
  lon: number | null
  keywords: string | null
}): Ort | null {
  const iata = zeile.iata.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(iata) || !zeile.name.trim()) return null
  const keywords = [zeile.city, zeile.keywords, iata].filter(Boolean).join(', ').slice(0, 400)
  return {
    id: `airport:${iata}`,
    source: 'ourairports',
    sourceId: iata,
    name: zeile.name.trim().slice(0, 120),
    typ: 'airport',
    country: zeile.country,
    countryCode: zeile.countryCode,
    region: zeile.region ?? zeile.city,
    lat: zeile.lat,
    lon: zeile.lon,
    iata,
    keywords: keywords || null,
  }
}

export function geoNamesTsvZeile(zeile: string): GeoNamesZeile | null {
  const felder = zeile.split('\t')
  if (felder.length < 15) return null
  const lat = Number(felder[4])
  const lon = Number(felder[5])
  const population = Number(felder[14] || 0)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return {
    geonameId: felder[0] ?? '',
    name: felder[1] ?? '',
    asciiName: felder[2] ?? '',
    altNames: felder[3] ?? '',
    lat,
    lon,
    featureClass: felder[6] ?? '',
    featureCode: felder[7] ?? '',
    countryCode: felder[8] ?? '',
    admin1: felder[10] ?? '',
    population: Number.isFinite(population) ? population : 0,
  }
}

export function laenderAusCountryInfo(text: string): LandName[] {
  const laender: LandName[] = []
  for (const zeile of text.split(/\r?\n/)) {
    if (!zeile || zeile.startsWith('#')) continue
    const felder = zeile.split('\t')
    const code = felder[0]?.trim() ?? ''
    const name = felder[4]?.trim() || felder[1]?.trim() || ''
    if (code && name) laender.push({ code, name })
  }
  return laender
}
