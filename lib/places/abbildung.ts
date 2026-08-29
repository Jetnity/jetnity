import { ORT_QUELLEN, ORT_TYPEN, type Ort, type OrtQuelle, type OrtTyp } from '@/lib/places/domain'

/** PostgREST-`text` ist ein String; Arrays werden defensiv normalisiert, nicht angenommen. */
export type OrtZeileKeywords = string | readonly string[] | null

export type OrtZeile = {
  id: string
  source: string
  source_id: string
  name: string
  typ: string
  country: string | null
  country_code: string | null
  region: string | null
  lat: number | null
  lon: number | null
  iata: string | null
  keywords: OrtZeileKeywords
}

function keywordsAusZeile(wert: unknown): string | null {
  if (typeof wert === 'string') {
    const trim = wert.trim()
    return trim.length > 0 ? trim : null
  }
  if (Array.isArray(wert)) {
    const teile = wert
      .filter((eintrag): eintrag is string => typeof eintrag === 'string')
      .map((eintrag) => eintrag.trim())
      .filter((eintrag) => eintrag.length > 0)
    return teile.length > 0 ? teile.join(', ') : null
  }
  return null
}

export function ortAusZeile(zeile: OrtZeile): Ort | null {
  if (!(ORT_TYPEN as readonly string[]).includes(zeile.typ)) return null
  if (!(ORT_QUELLEN as readonly string[]).includes(zeile.source)) return null
  return {
    id: zeile.id,
    source: zeile.source as OrtQuelle,
    sourceId: zeile.source_id,
    name: zeile.name,
    typ: zeile.typ as OrtTyp,
    country: zeile.country,
    countryCode: zeile.country_code,
    region: zeile.region,
    lat: zeile.lat,
    lon: zeile.lon,
    iata: zeile.iata,
    keywords: keywordsAusZeile(zeile.keywords),
  }
}

export const ORT_SPALTEN =
  'id, source, source_id, name, typ, country, country_code, region, lat, lon, iata, keywords'
