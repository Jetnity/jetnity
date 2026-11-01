// Darstellung und Länderkontext aus dem bestehenden ISO-/Locale-Vertrag.
// Keine erfundenen Place-IDs und keine zweite Länder-Namenstabelle.
import { gleichGefaltet, beginntGefaltet } from '@/lib/airports/normalisieren'
import { COUNTRY_LOCALES, COUNTRY_UI_LOCALE, landName } from '@/lib/country/darstellung'
import { ISO_3166_1_ALPHA2, istKatalogLand } from '@/lib/country/katalog'
import type { Ort } from '@/lib/places/domain'

export function ortLandName(ort: Pick<Ort, 'countryCode' | 'country'>): string | null {
  const code = ort.countryCode
  return code && istKatalogLand(code) ? landName(code, COUNTRY_UI_LOCALE) : ort.country
}

export function ortLokalerName(ort: Pick<Ort, 'typ' | 'name' | 'countryCode' | 'country'>): string {
  return ort.typ === 'country' ? ortLandName(ort) ?? ort.name : ort.name
}

const kurzeNamen = COUNTRY_LOCALES.map((locale) => new Intl.DisplayNames([locale], { type: 'region', style: 'short' }))
const landSuchnamen = ISO_3166_1_ALPHA2.map((code) => ({
  code, namen: [...new Set([...COUNTRY_LOCALES.map((locale) => landName(code, locale)), ...kurzeNamen.map((anzeige) => anzeige.of(code) ?? code)])],
}))

export function passendeLandCodes(suche: string, exakt = false): string[] {
  const roh = suche.trim()
  if (roh.length < 2) return []
  return landSuchnamen.filter(({ code, namen }) =>
    code.toLowerCase() === roh.toLowerCase() || namen.some((name) =>
      exakt ? gleichGefaltet(name, roh) : beginntGefaltet(name, roh),
    ),
  ).map(({ code }) => code)
}

export function ortSuchKontext(raw: string): { suche: string; landCodes?: string[] } {
  const roh = raw.trim().replace(/\s+/g, ' ')
  // Ein zusammengesetzter Ländername bleibt als Ganzes erhalten.
  if (passendeLandCodes(roh, true).length) return { suche: roh }
  const teile = roh.split(/\s*[,;；]\s*/u)
  if (teile.length !== 2 || !teile[0] || !teile[1]) return { suche: roh }
  const landCodes = passendeLandCodes(teile[1], true)
  return landCodes.length ? { suche: teile[0], landCodes } : { suche: roh }
}
