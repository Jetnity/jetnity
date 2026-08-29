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
import { EXAKTER_NAMENS_RANG, namensRangMitWortanfang } from '@/lib/suche/relevanz'

export const ORT_TREFFER = 6
const ORT_TREFFER_MAX = 8
export const ORT_ABFRAGE = 40
export const ORT_LAND_ALIAS_ABFRAGE = 12

const STARK_RANG = 2_800
const MIN_RANG_BEI_STARK = 1_500
const MIN_RANG = 200

export function sucheSicher(wert: string): string {
  return wert.replace(/[%_,.()\\*]/g, '').trim()
}

export function sucheFilter(suche: string): string[] {
  return sucheVarianten(suche)
    .map(sucheSicher)
    .filter((eintrag) => eintrag.length > 0)
}

/** Bewusste Dummy-Eingabe, kein Reiseziel. */
function sucheIstPlatzhalter(suche: string): boolean {
  return gleichGefaltet(suche.trim(), 'test')
}

export function ortNamensfilter(suche: string): string | null {
  if (sucheIstPlatzhalter(suche)) return null
  const teile = sucheFilter(suche)
  if (teile.length === 0) return null
  return teile
    .flatMap((teil) => {
      const felder = [`name.ilike.${teil}%`, `name.ilike.% ${teil}%`]
      if (/^[A-Za-z]{3}$/.test(teil)) felder.push(`iata.eq.${teil.toUpperCase()}`)
      return felder
    })
    .join(',')
}

export function ortSchluesselfilter(suche: string): string | null {
  if (sucheIstPlatzhalter(suche)) return null
  const teile = sucheFilter(suche)
  if (teile.length === 0) return null
  return teile.map((teil) => `keywords.ilike.%${teil}%`).join(',')
}

/** Name- plus Keyword-Filter für den gezielten Länder-Alias-Nachzug. */
export function ortLandAliasfilter(suche: string): string | null {
  const name = ortNamensfilter(suche)
  const schluessel = ortSchluesselfilter(suche)
  if (!name) return schluessel
  if (!schluessel) return name
  return `${name},${schluessel}`
}

function schluesselwoerter(keywords: string | readonly string[] | null | undefined): string[] {
  if (typeof keywords === 'string') {
    return keywords
      .split(',')
      .map((teil) => teil.trim())
      .filter((teil) => teil.length > 0)
  }
  if (Array.isArray(keywords)) {
    return keywords.flatMap((teil) => schluesselwoerter(teil))
  }
  return []
}

function schluesselwortGenau(keywords: string | readonly string[] | null | undefined, suche: string): boolean {
  return schluesselwoerter(keywords).some((teil) => gleichGefaltet(teil, suche))
}

function keywordAlsWort(keywords: string | readonly string[] | null | undefined, suche: string): boolean {
  return schluesselwoerter(keywords).some(
    (wort) => gleichGefaltet(wort, suche) || beginntGefaltet(wort, suche),
  )
}

function istExaktesLandAlias(ort: Ort, suche: string): boolean {
  if (ort.typ !== 'country') return false
  const raw = suche.trim()
  return gleichGefaltet(ort.name, raw) || schluesselwortGenau(ort.keywords, raw)
}

function typBonus(ort: Ort, rolle: OrtRolle): number {
  if (rolle === 'abreise') {
    if (ort.typ === 'airport' && ort.iata) return 80
    if (ort.typ === 'city') return 100
    return 0
  }
  if (ort.typ === 'country') return 220
  if (ort.typ === 'region') return 90
  if (ort.typ === 'island') return 80
  if (ort.typ === 'city') return 50
  return 0
}

function ortRang(ort: Ort, suche: string, rolle: OrtRolle): number {
  const raw = suche.trim()
  if (!raw || sucheIstPlatzhalter(raw)) return 0
  const up = raw.toUpperCase()
  let treffer = 0

  if (ort.iata && ort.iata === up) treffer += 10_000

  const aliasGenau = schluesselwortGenau(ort.keywords, raw)
  const landAliasAlsName = rolle === 'ziel' && ort.typ === 'country' && aliasGenau
  let nameScore = namensRangMitWortanfang(ort.name, raw)
  if (landAliasAlsName) {
    nameScore = Math.max(nameScore, EXAKTER_NAMENS_RANG)
  }
  treffer += nameScore

  if (gleichGefaltet(ort.region, raw)) treffer += 180
  if (!landAliasAlsName && keywordAlsWort(ort.keywords, raw)) {
    treffer += aliasGenau ? 700 : 220
  }
  if (treffer === 0) return 0
  if (enthaeltGefaltet(ort.country, raw)) treffer += 40

  if (rolle === 'abreise' && ort.typ === 'airport') {
    if (gleichGefaltet(ort.region, raw) || keywordAlsWort(ort.keywords, raw)) treffer += 1_600
  }

  return treffer + typBonus(ort, rolle)
}

function ortBeschreibung(ort: Ort): string | undefined {
  const teile = [ort.typ === 'country' ? null : ort.region, ort.country].filter(
    (wert, i, alle): wert is string => Boolean(wert) && alle.indexOf(wert) === i,
  )
  return teile.length > 0 ? teile.join(', ') : undefined
}

function ortAlsOption(ort: Ort): OrtOption {
  return {
    id: ort.id,
    label: ort.name,
    description: ortBeschreibung(ort),
    typ: ort.typ,
    iata: ort.iata ?? undefined,
  }
}

function orteBewerten(
  orte: Ort[],
  suche: string,
  rolle: OrtRolle,
): Array<{ ort: Ort; rang: number }> {
  return orte
    .filter((ort) => ortPasstZurRolle(ort, rolle))
    .map((ort) => ({ ort, rang: ortRang(ort, suche, rolle) }))
    .filter((eintrag) => eintrag.rang > 0)
    .sort((a, b) => {
      // Import legt asciiName in keywords. Gleichnam-Städte würden sonst
      // Name+Keyword stapeln und ein exaktes Länder-Alias im Score verlieren.
      if (rolle === 'ziel') {
        const aLand = istExaktesLandAlias(a.ort, suche)
        const bLand = istExaktesLandAlias(b.ort, suche)
        if (aLand !== bLand) return aLand ? -1 : 1
      }
      if (b.rang !== a.rang) return b.rang - a.rang
      return a.ort.name.localeCompare(b.ort.name)
    })
}

export function schluesselErgaenzungNoetig(orte: Ort[], suche: string, rolle: OrtRolle): boolean {
  const starke = orteBewerten(orte, suche, rolle).filter((eintrag) => eintrag.rang >= STARK_RANG)
  return starke.length < 3
}

/** Reiseziel: exaktes Länder-Alias nachziehen, auch wenn Stadt-Präfixe die Namensmenge schon füllen. */
export function landAliasNachzugNoetig(orte: Ort[], suche: string, rolle: OrtRolle): boolean {
  if (rolle !== 'ziel') return false
  return !orte.some((ort) => istExaktesLandAlias(ort, suche))
}

function begrenzen(bewertet: Array<{ ort: Ort; rang: number }>): Array<{ ort: Ort; rang: number }> {
  const hatStark = bewertet.some((eintrag) => eintrag.rang >= STARK_RANG)
  const sichtbar = bewertet.filter((eintrag) =>
    hatStark ? eintrag.rang >= MIN_RANG_BEI_STARK : eintrag.rang >= MIN_RANG,
  )
  const nurStark = sichtbar.filter((eintrag) => eintrag.rang >= STARK_RANG)
  const limit = nurStark.length > ORT_TREFFER && nurStark.length <= ORT_TREFFER_MAX ? ORT_TREFFER_MAX : ORT_TREFFER
  return sichtbar.slice(0, limit)
}

export function orteOrdnen(orte: Ort[], suche: string, rolle: OrtRolle): OrtOption[] {
  return begrenzen(orteBewerten(orte, suche, rolle)).map(({ ort }) => ortAlsOption(ort))
}
