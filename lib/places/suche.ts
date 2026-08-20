// lib/places/suche.ts
//
// Lokale Ortssuche. Kein externer Provider, keine Live-Geocoding-Abfrage.

import {
  beginntGefaltet,
  enthaeltGefaltet,
  gleichGefaltet,
  sucheVarianten,
} from '@/lib/airports/normalisieren'
import { ortPasstZurRolle, type Ort, type OrtOption, type OrtRolle } from '@/lib/places/domain'

const ORT_TREFFER = 12
export const ORT_ABFRAGE = 80

export function sucheSicher(wert: string): string {
  return wert.replace(/[%_,.()\\*]/g, '').trim()
}

export function sucheFilter(suche: string): string[] {
  return sucheVarianten(suche)
    .map(sucheSicher)
    .filter((eintrag) => eintrag.length > 0)
}

function typBonus(ort: Ort, rolle: OrtRolle): number {
  if (rolle === 'abreise') {
    if (ort.typ === 'airport' && ort.iata) return 60
    if (ort.typ === 'city') return 80
    return 0
  }
  if (ort.typ === 'country') return 70
  if (ort.typ === 'region') return 60
  if (ort.typ === 'island') return 55
  if (ort.typ === 'city') return 40
  return 0
}

function ortRang(ort: Ort, suche: string, rolle: OrtRolle): number {
  const raw = suche.trim()
  if (!raw) return 0
  const up = raw.toUpperCase()
  let treffer = 0

  if (ort.iata && ort.iata === up) treffer += 10_000
  if (gleichGefaltet(ort.name, raw)) treffer += 2_000
  else if (beginntGefaltet(ort.name, raw)) treffer += 1_400
  else if (enthaeltGefaltet(ort.name, raw)) treffer += 700

  if (gleichGefaltet(ort.region, raw)) treffer += 500
  if (enthaeltGefaltet(ort.keywords, raw)) treffer += 400
  if (enthaeltGefaltet(ort.country, raw)) treffer += 80
  if (treffer === 0) return 0
  return treffer + typBonus(ort, rolle)
}

function ortAlsOption(ort: Ort): OrtOption {
  const zusatz = [ort.region, ort.country].filter((wert, i, alle) => wert && alle.indexOf(wert) === i)
  const iata = ort.iata ? `${ort.iata} — ` : ''
  return {
    id: ort.id,
    label: `${iata}${ort.name}`,
    description: zusatz.join(', ') || undefined,
    typ: ort.typ,
  }
}

export function orteOrdnen(orte: Ort[], suche: string, rolle: OrtRolle): OrtOption[] {
  return orte
    .filter((ort) => ortPasstZurRolle(ort, rolle))
    .map((ort) => ({ ort, rang: ortRang(ort, suche, rolle) }))
    .filter((eintrag) => eintrag.rang > 0)
    .sort((a, b) => {
      if (b.rang !== a.rang) return b.rang - a.rang
      return a.ort.name.localeCompare(b.ort.name)
    })
    .slice(0, ORT_TREFFER)
    .map(({ ort }) => ortAlsOption(ort))
}
