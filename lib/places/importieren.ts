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
  admin2?: string
  population: number
}

export type LandName = { code: string; name: string; geonameId?: string }
export type VerwaltungsName = { code: string; name: string }

export function verwaltungAusGeoNames(text: string): VerwaltungsName[] {
  return text.split(/\r?\n/).flatMap((zeile) => {
    const [code, name] = zeile.split('\t')
    return code && name?.trim() ? [{ code: code.trim(), name: name.trim() }] : []
  })
}

/** Ganze, eindeutige Alias-Tokens; nie ein durch Abschneiden erfundener Alias. */
function aliasText(ascii: string, alts: string): { text: string | null; ausgelassen: number } {
  const teile = [...new Set([ascii, ...alts.split(',')].map((v) => v.trim()).filter(Boolean))]
  const passend: string[] = []
  let laenge = 0
  let ausgelassen = 0
  for (const teil of teile) {
    const extra = teil.length + (passend.length ? 2 : 0)
    if (laenge + extra > 800) { ausgelassen += 1; continue }
    passend.push(teil)
    laenge += extra
  }
  return { text: passend.join(', ') || null, ausgelassen }
}

const ZIEL_CODES = new Set([
  'PCL',
  'PCLI',
  'PCLIX',
  'PCLD',
  'PCLF',
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

const KURZNAME_PRAEFIX = /^(provinsi|kingdom of|the kingdom of)\s+/i

function anzeigename(offiziell: string, ascii: string, alts: string): string {
  const treffer = KURZNAME_PRAEFIX.exec(offiziell)
  if (!treffer) return offiziell.slice(0, 120)
  const rest = offiziell.slice(treffer[0].length).trim()
  if (rest.length < 3) return offiziell.slice(0, 120)
  const bekannt = [ascii, ...alts.split(',')]
    .map((wert) => wert.trim().toLowerCase())
    .includes(rest.toLowerCase())
  return (bekannt ? rest : offiziell).slice(0, 120)
}

function typAus(code: string): OrtTyp | null {
  if (code === 'PCL' || code === 'PCLIX' || code === 'PCLI' || code === 'PCLD' || code === 'PCLF' || code === 'PCLS' || code === 'TERR') return 'country'
  if (code === 'ADM1' || code === 'ADM2') return 'region'
  if (code === 'ISL' || code === 'ISLS' || code === 'ATOL') return 'island'
  if (code.startsWith('PPL')) return 'city'
  return null
}

export function geoNamesZeileRelevant(zeile: GeoNamesZeile): boolean {
  const code = zeile.featureCode
  if (code === 'ADM2') return zeile.population >= 50_000
  if (code === 'ISL' || code === 'ISLS' || code === 'ATOL') return true
  if (ZIEL_CODES.has(code) && code !== 'ADM2') return true
  if (zeile.featureClass !== 'P') return false
  return STADT_CODES.has(code) || (['PPL', 'PPLA4', 'PPLL', 'PPLS'].includes(code) && zeile.population >= 5_000)
}

export function orteAusGeoNames(eingabe: {
  zeilen: GeoNamesZeile[]
  laender: LandName[]
  admin1?: VerwaltungsName[]
  admin2?: VerwaltungsName[]
}): { orte: Ort[]; verworfen: number; aliasAusgelassen: number; doppelteIds: number; historischeLandIds: string[] } {
  const laender = new Map<string, string>()
  for (const land of eingabe.laender) {
    const code = landescodeSchema.safeParse(land.code)
    const name = textOderNull(land.name, 80)
    if (code.success && name) laender.set(code.data, name)
  }

  const admin1 = new Map((eingabe.admin1 ?? []).map((v) => [v.code, v.name]))
  const admin2 = new Map((eingabe.admin2 ?? []).map((v) => [v.code, v.name]))
  const landIds = new Set(eingabe.laender.flatMap((land) => land.geonameId ? [land.geonameId] : []))
  const nachId = new Map<string, Ort>()
  let verworfen = 0
  let aliasAusgelassen = 0
  let doppelteIds = 0
  const historischeLandIds: string[] = []

  for (const zeile of eingabe.zeilen) {
    if (landIds.has(zeile.geonameId) && zeile.featureCode === 'PCLH') {
      historischeLandIds.push(zeile.geonameId)
      verworfen += 1
      continue
    }
    if (!landIds.has(zeile.geonameId) && !geoNamesZeileRelevant(zeile)) {
      verworfen += 1
      continue
    }
    const geonameId = zeile.geonameId.trim()
    if (!/^\d+$/.test(geonameId)) {
      verworfen += 1
      continue
    }
    const quellTyp = typAus(zeile.featureCode)
    // country_code kann bloße Zugehörigkeit bedeuten (z. B. ein Außengebiet).
    // Nur countryInfo-Identitäten repräsentieren dann das vollständige Land.
    const typ = landIds.has(geonameId) ? 'country' : landIds.size && quellTyp === 'country' ? 'region' : quellTyp
    const name = textOderNull(zeile.name, 120)
    const countryCode = landescodeSchema.safeParse(zeile.countryCode)
    if (!typ || !name || !ORT_TYPEN.includes(typ) || !Number.isFinite(zeile.lat) || !Number.isFinite(zeile.lon) || Math.abs(zeile.lat) > 90 || Math.abs(zeile.lon) > 180) {
      verworfen += 1
      continue
    }

    const keywords = aliasText(zeile.asciiName, zeile.altNames)
    aliasAusgelassen += keywords.ausgelassen
    const code = countryCode.success ? countryCode.data : ''
    const admin1Name = admin1.get(`${code}.${zeile.admin1}`)
    const admin2Name = zeile.admin2 ? admin2.get(`${code}.${zeile.admin1}.${zeile.admin2}`) : undefined
    const region = typ === 'country' || zeile.featureCode === 'ADM1' ? null
      : [...new Set([admin2Name, admin1Name].filter((v): v is string => Boolean(v) && v !== name))].join(', ') || null

    const id = ortId('geonames', geonameId)
    if (nachId.has(id)) doppelteIds += 1
    nachId.set(id, {
      id,
      source: 'geonames',
      sourceId: geonameId,
      name: anzeigename(name, zeile.asciiName, zeile.altNames),
      typ,
      country: countryCode.success ? (laender.get(countryCode.data) ?? countryCode.data) : null,
      countryCode: countryCode.success ? countryCode.data : null,
      region: textOderNull(region ?? undefined, 80),
      lat: Number.isFinite(zeile.lat) ? zeile.lat : null,
      lon: Number.isFinite(zeile.lon) ? zeile.lon : null,
      iata: null,
      keywords: keywords.text,
      population: Number.isSafeInteger(zeile.population) && zeile.population > 0 ? zeile.population : null,
      featureCode: zeile.featureCode,
    })
  }

  const orte = [...nachId.values()].sort((a, b) => a.id.localeCompare(b.id))
  return { orte, verworfen, aliasAusgelassen, doppelteIds, historischeLandIds }
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
    population: null,
    featureCode: null,
  }
}

export function geoNamesTsvZeile(zeile: string): GeoNamesZeile | null {
  const felder = zeile.split('\t')
  if (felder.length < 15) return null
  const lat = Number(felder[4])
  const lon = Number(felder[5])
  const population = Number(felder[14] || 0)
  if (!felder[4]?.trim() || !felder[5]?.trim() || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
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
    admin2: felder[11] ?? '',
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
    const geonameId = felder[16]?.trim()
    if (code && name) laender.push({ code, name, ...(geonameId && /^\d+$/.test(geonameId) ? { geonameId } : {}) })
  }
  return laender
}
