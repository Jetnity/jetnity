// lib/places/suche-lauf.ts
//
// Retrieval + Abbildung + Ranking für `/api/search/places`.
// Kein Geocoder, keine zweite Ortswahrheit.

import { ortSuchKontext } from '@/lib/places/namen'
import type { Lesung, Problem } from '@/lib/api/datenbank-lesen'
import { ortAusZeile, type OrtZeile } from '@/lib/places/abbildung'
import type { Ort, OrtOption, OrtRolle } from '@/lib/places/domain'
import {
  ORT_ABFRAGE,
  ORT_SUCHTEXT_MAX,
  ortExaktfilter,
  ORT_LAND_UNIVERSUM,
  landAliasNachzugNoetig,
  orteOrdnen,
  ortLandAliasExaktfilter,
  ortNamensfilter,
  ortSchluesselfilter,
  schluesselErgaenzungNoetig,
} from '@/lib/places/suche'

export type PlacesSuchart = 'exakt' | 'name' | 'land' | 'schluessel' | 'abreise-flughafen'

export type PlacesZeilenLesen = (
  art: PlacesSuchart,
  filter: string,
  limit: number,
  landCodes?: readonly string[],
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
  if (raw.length > ORT_SUCHTEXT_MAX) return { optionen: [], problem: null }
  const { suche, landCodes } = ortSuchKontext(raw)
  const namensfilter = ortNamensfilter(suche)
  if (!namensfilter) return { optionen: [], problem: null }

  const exaktfilter = ortExaktfilter(suche)
  const [namen, exakt] = await Promise.all([
    lesen('name', namensfilter, ORT_ABFRAGE, landCodes),
    exaktfilter ? lesen('exakt', exaktfilter, ORT_ABFRAGE, landCodes) : Promise.resolve({ zeilen: [], problem: null }),
  ])
  if (namen.problem) return { optionen: null, problem: namen.problem }
  if (exakt.problem) return { optionen: null, problem: exakt.problem }

  let zeilen = zeilenMergen(exakt.zeilen, namen.zeilen)

  if (rolle === 'abreise') {
    const fluege = await lesen('abreise-flughafen', namensfilter, 12, landCodes)
    if (fluege.problem) return { optionen: null, problem: fluege.problem }
    zeilen = zeilenMergen(zeilen, fluege.zeilen)
  }

  let orte = orteAus(zeilen)

  if (landAliasNachzugNoetig(orte, suche, rolle)) {
    const landFilter = ortLandAliasExaktfilter(suche)
    if (landFilter) {
      const laender = await lesen('land', landFilter, ORT_LAND_UNIVERSUM, landCodes)
      if (laender.problem) return { optionen: null, problem: laender.problem }
      zeilen = zeilenMergen(zeilen, laender.zeilen)
      orte = orteAus(zeilen)
    }
  }

  if (suche.length >= 3 || schluesselErgaenzungNoetig(orte, suche, rolle)) {
    const schluessel = ortSchluesselfilter(suche)
    if (schluessel) {
      const extra = await lesen('schluessel', schluessel, ORT_ABFRAGE, landCodes)
      if (extra.problem) return { optionen: null, problem: extra.problem }
      zeilen = zeilenMergen(zeilen, extra.zeilen)
      orte = orteAus(zeilen)
    }
  }

  return { optionen: orteOrdnen(landCodes ? orte.filter((ort) => ort.countryCode && landCodes.includes(ort.countryCode)) : orte, suche, rolle), problem: null }
}
