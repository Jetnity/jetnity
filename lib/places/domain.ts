// lib/places/domain.ts
//
// Interne Ortsdomäne. Keine GeoNames-, Google- oder Provider-Typen
// ausserhalb dieses Moduls. UI und Reisegraph sprechen nur `Ort`.

export const ORT_TYPEN = ['country', 'region', 'city', 'island', 'airport'] as const
export type OrtTyp = (typeof ORT_TYPEN)[number]

export const ORT_ROLLEN = ['ziel', 'abreise'] as const
export type OrtRolle = (typeof ORT_ROLLEN)[number]

export const ORT_QUELLEN = ['geonames', 'ourairports'] as const
export type OrtQuelle = (typeof ORT_QUELLEN)[number]

/** Kanonischer Ort. Der geografische Kern einer Reise, nicht der Anzeigetext. */
export type Ort = {
  id: string
  source: OrtQuelle
  sourceId: string
  name: string
  typ: OrtTyp
  country: string | null
  countryCode: string | null
  region: string | null
  lat: number | null
  lon: number | null
  iata: string | null
  keywords: string | null
}

export type OrtOption = {
  id: string
  label: string
  description?: string
  typ: OrtTyp
  /** Nur Anzeige. Persistiert wird weiterhin die Place-ID. */
  iata?: string
}

export function ortId(quelle: OrtQuelle, schluessel: string): string {
  return `${quelle}:${schluessel}`
}

export function istOrtId(wert: string): boolean {
  return /^(geonames:\d+|airport:[A-Z]{3})$/.test(wert)
}

export function ortPasstZurRolle(ort: Ort, rolle: OrtRolle): boolean {
  if (rolle === 'ziel') return ort.typ !== 'airport'
  return ort.typ === 'city' || ort.typ === 'airport'
}
