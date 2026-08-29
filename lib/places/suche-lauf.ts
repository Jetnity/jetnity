// lib/places/suche-lauf.ts
//
// Retrieval + Abbildung + Ranking für `/api/search/places`.
// Kein Geocoder, keine zweite Ortswahrheit.

import type { Lesung, Problem } from '@/lib/api/datenbank-lesen'
import { ortAusZeile, type OrtZeile } from '@/lib/places/abbildung'
import type { Ort, OrtOption, OrtRolle } from '@/lib/places/domain'
import {
  ORT_ABFRAGE,
  ORT_LAND_UNIVERSUM,
  landAliasNachzugNoetig,
  orteOrdnen,
  ortLandAliasExaktfilter,
  ortNamensfilter,
  ortSchluesselfilter,
  schluesselErgaenzungNoetig,
} from '@/lib/places/suche'

export type PlacesSuchart = 'name' | 'land' | 'schluessel' | 'abreise-flughafen'

export type PlacesZeilenLesen = (
  art: PlacesSuchart,
  filter: string,
  limit: number,
) => Promise<Lesung<OrtZeile>>

export type PlacesSucheErgebnis =
  | { optionen: OrtOption[]; problem: null }
  | { optionen: null; problem: Problem }

function orteAus(zeilen: OrtZeile[]): Ort[] {
  return zeilen
    .map((zeile) => ortAusZeile(zeile))
    .filter((ort): ort is Ort => Boolean(ort))
}

function zeilenMergen(ziel: OrtZeile[], extra: OrtZeile[]): OrtZeile[] {
  const ids = new Set(ziel.map((zeile) => zeile.id).filter((id): id is string => typeof id === 'string'))
  const merge = [...ziel]
  for (const zeile of extra) {
    if (typeof zeile.id === 'string' && !ids.has(zeile.id)) {
      ids.add(zeile.id)
      merge.push(zeile)
    }
  }
  return merge
}

export async function placesSuchen(
  raw: string,
  rolle: OrtRolle,
  lesen: PlacesZeilenLesen,
): Promise<PlacesSucheErgebnis> {
  const namensfilter = ortNamensfilter(raw)
  if (!namensfilter) return { optionen: [], problem: null }

  const namen = await lesen('name', namensfilter, ORT_ABFRAGE)
  if (namen.problem) return { optionen: null, problem: namen.problem }

  let zeilen = [...namen.zeilen]

  if (rolle === 'abreise') {
    const fluege = await lesen('abreise-flughafen', namensfilter, 12)
    if (fluege.problem) return { optionen: null, problem: fluege.problem }
    zeilen = zeilenMergen(zeilen, fluege.zeilen)
  }

  let orte = orteAus(zeilen)

  if (landAliasNachzugNoetig(orte, raw, rolle)) {
    const landFilter = ortLandAliasExaktfilter(raw)
    if (landFilter) {
      const laender = await lesen('land', landFilter, ORT_LAND_UNIVERSUM)
      if (laender.problem) return { optionen: null, problem: laender.problem }
      zeilen = zeilenMergen(zeilen, laender.zeilen)
      orte = orteAus(zeilen)
    }
  }

  if (schluesselErgaenzungNoetig(orte, raw, rolle)) {
    const schluessel = ortSchluesselfilter(raw)
    if (schluessel) {
      const extra = await lesen('schluessel', schluessel, ORT_ABFRAGE)
      if (extra.problem) return { optionen: null, problem: extra.problem }
      zeilen = zeilenMergen(zeilen, extra.zeilen)
      orte = orteAus(zeilen)
    }
  }

  return { optionen: orteOrdnen(orte, raw, rolle), problem: null }
}
