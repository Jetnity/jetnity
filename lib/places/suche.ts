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
import { EXAKTER_NAMENS_RANG, namensArt, namensRangMitWortanfang } from '@/lib/suche/relevanz'

import { ortLandName, ortLokalerName, passendeLandCodes } from '@/lib/places/namen'

export const ORT_SUCHTEXT_MAX = 120
export const ORT_TREFFER = 6
const ORT_TREFFER_MAX = 8
export const ORT_ABFRAGE = 40

/**
 * Sicherheitslimit für den selektiven Exact-Alias-Nachzug.
 * Muss ≥ der Anzahl Länder bleiben, die dasselbe Exact-Token teilen
 * können, und ≥ der aktuellen Länderzahl als harte Kappe.
 * Es ist kein Freibrief, das ganze Universum zu übertragen.
 */
export const ORT_LAND_UNIVERSUM = 500

const STARK_RANG = 2_800
const MIN_RANG_BEI_STARK = 1_500
const MIN_RANG = 200

export function sucheSicher(wert: string): string {
  return [...wert].filter((zeichen) => zeichen >= ' ' && zeichen !== '\u007f')
    .join('').replace(/[%_\\*"]/g, '').trim()
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
  if (suche.length > ORT_SUCHTEXT_MAX || sucheIstPlatzhalter(suche)) return null
  const teile = sucheFilter(suche)
  if (teile.length === 0) return null
  return teile
    .flatMap((teil) => {
      const felder = [postgrestIlike('name', `${teil}%`), postgrestIlike('name', `% ${teil}%`)]
      if (/^[A-Za-z]{3}$/.test(teil)) felder.push(`iata.eq.${teil.toUpperCase()}`)
      return felder
    })
    .join(',')
}

/** Exakte Namen/Aliase separat vor einer begrenzten Präfixmenge holen. */
export function ortExaktfilter(suche: string): string | null {
  if (suche.length > ORT_SUCHTEXT_MAX || sucheIstPlatzhalter(suche)) return null
  const teile = sucheFilter(suche)
  if (!teile.length) return null
  return [...teile.flatMap((teil) => [
    postgrestIlike('name', teil),
    `and(${postgrestIlike('keywords', `%${teil}%`)},${postgrestImatch('keywords', `(^|,)[[:space:]]*${regexSicher(teil)}[[:space:]]*(,|$)`)})`,
    ...(/^[A-Za-z]{3}$/.test(teil) ? [`iata.eq.${teil.toUpperCase()}`] : []),
  ]), ...passendeLandCodes(suche, true).map((code) => `and(typ.eq.country,country_code.eq.${code})`)].join(',')
}

export function ortSchluesselfilter(suche: string): string | null {
  if (suche.length > ORT_SUCHTEXT_MAX || sucheIstPlatzhalter(suche)) return null
  const teile = sucheFilter(suche)
  if (teile.length === 0) return null
  return teile.map((teil) => postgrestIlike('keywords', `%${teil}%`)).join(',')
}

function postgrestIlike(feld: string, muster: string): string {
  return /[,%() .]/.test(muster) ? `${feld}.ilike.${JSON.stringify(muster)}` : `${feld}.ilike.${muster}`
}

function regexSicher(teil: string): string {
  return teil.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function postgrestImatch(feld: string, muster: string): string {
  return `${feld}.imatch.${JSON.stringify(muster)}`
}

/**
 * Selektiver Länder-Nachzug: nur exakter Name oder exaktes Komma-Token.
 * Dieselbe Trim-Semantik wie `schluesselwoerter`: umgebendes Whitespace
 * am Token zählt nicht. Kein Substring-`ilike %token%`, kein Universum.
 */
export function ortLandAliasExaktfilter(suche: string): string | null {
  if (suche.length > ORT_SUCHTEXT_MAX || sucheIstPlatzhalter(suche)) return null
  const teile = sucheFilter(suche)
  if (teile.length === 0) return null
  const codes = passendeLandCodes(suche)
  const filter = teile
    .flatMap((teil) => {
      const sicher = regexSicher(teil)
      return [
        postgrestIlike('name', teil),
        postgrestIlike('name', `${teil} `),
        postgrestIlike('keywords', teil),
        postgrestIlike('keywords', `${teil} `),
        postgrestIlike('keywords', `${teil},%`),
        postgrestIlike('keywords', `${teil}, %`),
        postgrestIlike('keywords', `${teil} ,%`),
        postgrestIlike('keywords', `${teil} , %`),
        postgrestIlike('keywords', `%, ${teil}`),
        postgrestIlike('keywords', `%,${teil}`),
        postgrestIlike('keywords', `%, ${teil} `),
        postgrestIlike('keywords', `%,${teil} `),
        postgrestIlike('keywords', `%, ${teil},%`),
        postgrestIlike('keywords', `%,${teil},%`),
        postgrestIlike('keywords', `%, ${teil}, %`),
        postgrestIlike('keywords', `%,${teil}, %`),
        postgrestImatch('name', `^[[:space:]]*${sicher}[[:space:]]*$`),
        postgrestImatch('keywords', `(^|,)[[:space:]]*${sicher}[[:space:]]*(,|$)`),
      ]
    })
    .join(',')
  return [filter, ...codes.map((code) => `country_code.eq.${code}`)].filter(Boolean).join(',')
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
  return Boolean(ort.countryCode && passendeLandCodes(raw, true).includes(ort.countryCode)) || gleichGefaltet(ort.name, raw) || gleichGefaltet(ortLokalerName(ort), raw) || gleichGefaltet(ort.sourceName, raw) || schluesselwortGenau(ort.keywords, raw)
}

export function ortIstExaktesLandAlias(ort: Ort, suche: string): boolean {
  return istExaktesLandAlias(ort, suche)
}

function typBonus(ort: Ort, rolle: OrtRolle): number {
  if (rolle === 'abreise') {
    if (ort.typ === 'airport' && ort.iata) return 80
    if (ort.typ === 'city') return 100
    return 0
  }
  if (ort.typ === 'country') return 220
  if (ort.typ === 'region') return 50
  if (ort.typ === 'island') return 110
  if (ort.typ === 'city') return 100
  return 0
}

function ortRang(ort: Ort, suche: string, rolle: OrtRolle): number {
  const raw = suche.trim()
  if (!raw || sucheIstPlatzhalter(raw)) return 0
  const up = raw.toUpperCase()
  let treffer = 0

  if (ort.iata && ort.iata === up) treffer += 10_000

  const aliasGenau = schluesselwortGenau(ort.keywords, raw)
  const landAliasAlsName = rolle === 'ziel' && istExaktesLandAlias(ort, raw)
  let nameScore = Math.max(namensRangMitWortanfang(ort.name, raw), namensRangMitWortanfang(ort.sourceName, raw), ort.typ === 'country' ? namensRangMitWortanfang(ortLokalerName(ort), raw) : 0)
  if (ort.typ === 'country' && ort.countryCode && passendeLandCodes(raw).includes(ort.countryCode)) {
    nameScore = Math.max(nameScore, passendeLandCodes(raw, true).includes(ort.countryCode) ? EXAKTER_NAMENS_RANG : 3_500)
  }
  const aliasIstOrtsname = ort.typ === 'country' || (ort.typ !== 'airport' && !['admin', 'later'].includes(namensArt(ort.name, raw)))
  if (aliasGenau && aliasIstOrtsname) nameScore = Math.max(nameScore, EXAKTER_NAMENS_RANG)
  if (landAliasAlsName) {
    nameScore = Math.max(nameScore, EXAKTER_NAMENS_RANG)
  }
  treffer += nameScore

  if (gleichGefaltet(ort.region, raw)) treffer += 180
  if (keywordAlsWort(ort.keywords, raw) && (!aliasGenau || !aliasIstOrtsname)) {
    treffer = Math.max(treffer, aliasIstOrtsname ? 3_000 : (aliasGenau ? 700 : 220))
  }
  if (treffer === 0) return 0
  if (enthaeltGefaltet(ort.country, raw)) treffer += 40

  if (rolle === 'abreise' && ort.typ === 'airport') {
    if (gleichGefaltet(ort.region, raw) || keywordAlsWort(ort.keywords, raw)) treffer += 1_600
  }

  return treffer + typBonus(ort, rolle)
}

function lageText(ort: Ort): string {
  const region = ort.region && !/^[A-Z0-9]{1,3}$/.test(ort.region.trim()) ? ort.region : null
  return [region, ortLandName(ort)].filter(
    (wert, i, alle): wert is string => Boolean(wert) && alle.indexOf(wert) === i,
  ).join(', ')
}

function kontextTeilAnhaengen(teile: string[], wert: string | null | undefined) {
  if (!wert) return
  if (teile.some((teil) => gleichGefaltet(teil, wert))) return
  teile.push(wert)
}

export function landAliasMehrdeutig(orte: Ort[], suche: string): boolean {
  return orte.filter((ort) => istExaktesLandAlias(ort, suche)).length > 1
}

export function ortAnzeigeKontext(
  ort: Ort,
  suche = '',
  mehrdeutigesLandAlias = false,
): string {
  if (ort.typ === 'country') {
    if (mehrdeutigesLandAlias && suche && istExaktesLandAlias(ort, suche)) {
      const teile = ['Land']
      kontextTeilAnhaengen(teile, ort.name)
      kontextTeilAnhaengen(teile, ort.countryCode)
      return teile.join(' · ')
    }
    return 'Land'
  }
  if (ort.typ === 'region') return ['Region', lageText(ort)].filter(Boolean).join(' · ')
  if (ort.typ === 'island') return ['Insel', lageText(ort)].filter(Boolean).join(' · ')
  if (ort.typ === 'airport') {
    return ['Flughafen', ort.iata, lageText(ort)].filter(Boolean).join(' · ')
  }
  return ['Stadt', lageText(ort)].filter(Boolean).join(' · ')
}

export function ortAnzeigeLabel(ort: Ort, suche: string): string {
  if (!istExaktesLandAlias(ort, suche)) return ortLokalerName(ort)
  const raw = suche.trim()
  if (ort.countryCode && passendeLandCodes(raw, true).includes(ort.countryCode)) return ortLokalerName(ort)
  if (gleichGefaltet(ort.name, raw)) return ort.name
  return schluesselwoerter(ort.keywords).find((teil) => gleichGefaltet(teil, raw)) ?? raw
}

function ortAlsOption(ort: Ort, suche: string, mehrdeutigesLandAlias: boolean): OrtOption {
  const label = ortAnzeigeLabel(ort, suche)
  const description = ortAnzeigeKontext(ort, suche, mehrdeutigesLandAlias)
  return {
    id: ort.id,
    label,
    description,
    typ: ort.typ,
    iata: ort.iata ?? undefined,
    ariaLabel: `${label}, ${description}`,
    landAliasMatch: istExaktesLandAlias(ort, suche),
    ...(ort.countryCode ? { countryCode: ort.countryCode } : {}),
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
      const bevoelkerung = (b.ort.population ?? 0) - (a.ort.population ?? 0)
      if (bevoelkerung) return bevoelkerung
      return a.ort.name.localeCompare(b.ort.name, 'de') || (a.ort.countryCode ?? '').localeCompare(b.ort.countryCode ?? '') || (a.ort.region ?? '').localeCompare(b.ort.region ?? '', 'de') || a.ort.id.localeCompare(b.ort.id)
    })
}

export function schluesselErgaenzungNoetig(orte: Ort[], suche: string, rolle: OrtRolle): boolean {
  const starke = orteBewerten(orte, suche, rolle).filter((eintrag) => eintrag.rang >= STARK_RANG)
  return starke.length < 3
}

/**
 * Reiseziel: selektiven Exact-Alias-Nachzug anstossen.
 * Immer für `ziel`, damit geteilte Aliase vollständig bleiben, auch wenn
 * schon ein Land in der Namensmenge steht. Der Lauf selbst überträgt
 * nicht das ganze Universum.
 */
export function landAliasNachzugNoetig(_orte: Ort[], suche: string, rolle: OrtRolle): boolean {
  if (rolle !== 'ziel') return false
  if (sucheIstPlatzhalter(suche)) return false
  return sucheFilter(suche).length > 0
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
  const sichtbar = begrenzen(orteBewerten(orte, suche, rolle)).map(({ ort }) => ort)
  const mehrdeutig = landAliasMehrdeutig(sichtbar, suche)
  return sichtbar.map((ort) => ortAlsOption(ort, suche, mehrdeutig))
}
