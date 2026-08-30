// lib/country/darstellung.ts
//
// Persistenz bleibt der Country-Code. Darstellung ist Flag + lokalisierter Name.
// Keine zweite persistierte Namenswahrheit. Kein Defaultland.

import { ISO_3166_1_ALPHA2, istKatalogLand } from '@/lib/country/katalog'
import { COUNTRY_COPY, landUnbekanntLabel } from '@/lib/country/copy'

export const COUNTRY_LOCALES = ['de', 'en', 'fr', 'it', 'es', 'pt', 'pl'] as const
export type CountryLocale = (typeof COUNTRY_LOCALES)[number]
export const COUNTRY_UI_LOCALE: CountryLocale = 'de'

export type RegionAnzeige = {
  of(code: string): string | undefined
}

export type CountryArt = 'leer' | 'katalog' | 'unbekannt'

export type CountryDarstellung = {
  readonly art: CountryArt
  readonly code: string | null
  readonly name: string | null
  readonly flagge: string | null
  readonly label: string
}

const anzeigeCache = new Map<string, RegionAnzeige | null>()

function anzeigeFuer(locale: string): RegionAnzeige | null {
  if (anzeigeCache.has(locale)) return anzeigeCache.get(locale) ?? null
  try {
    const anzeige = new Intl.DisplayNames([locale], { type: 'region' })
    anzeigeCache.set(locale, anzeige)
    return anzeige
  } catch {
    anzeigeCache.set(locale, null)
    return null
  }
}

export function countryCodeNormalisieren(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const code = wert.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

export function landFlagge(code: string): string | null {
  const normal = countryCodeNormalisieren(code)
  if (!normal || !istKatalogLand(normal)) return null
  return String.fromCodePoint(
    0x1f1e6 + (normal.charCodeAt(0) - 65),
    0x1f1e6 + (normal.charCodeAt(1) - 65),
  )
}

export function landName(code: string, locale: string, anzeige?: RegionAnzeige | null): string {
  const normal = countryCodeNormalisieren(code)
  if (!normal) return ''
  try {
    const quelle = anzeige === undefined ? anzeigeFuer(locale) : anzeige
    const name = quelle?.of(normal)
    if (typeof name === 'string' && name.trim() && name.trim().toUpperCase() !== normal) {
      return name
    }
  } catch {
    // Deterministischer Fallback: Code statt Absturz.
  }
  return normal
}

export function landOptionLabel(code: string, locale: string, anzeige?: RegionAnzeige | null): string {
  const normal = countryCodeNormalisieren(code)
  if (!normal) return ''
  const name = landName(normal, locale, anzeige)
  const flagge = landFlagge(normal)
  return flagge ? `${flagge} ${name}` : name
}

function sucheNormalisieren(wert: string): string {
  return wert
    .trim()
    .toLocaleLowerCase('und')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function landSucheTrifft(
  code: string,
  anfrage: string,
  locale: string,
  anzeige?: RegionAnzeige | null,
): boolean {
  const suchtext = sucheNormalisieren(anfrage)
  if (!suchtext) return true
  const normal = countryCodeNormalisieren(code)
  if (!normal) return false
  const name = sucheNormalisieren(landName(normal, locale, anzeige))
  const label = sucheNormalisieren(landOptionLabel(normal, locale, anzeige))
  return (
    sucheNormalisieren(normal).includes(suchtext) ||
    name.includes(suchtext) ||
    label.includes(suchtext)
  )
}

export function katalogLaenderSortiert(locale: string, anzeige?: RegionAnzeige | null): readonly string[] {
  return [...ISO_3166_1_ALPHA2].sort((links, rechts) => {
    const vergleich = landName(links, locale, anzeige).localeCompare(
      landName(rechts, locale, anzeige),
      locale,
      { sensitivity: 'base' },
    )
    return vergleich !== 0 ? vergleich : links.localeCompare(rechts)
  })
}

export function landDarstellung(
  wert: unknown,
  locale: string = COUNTRY_UI_LOCALE,
  anzeige?: RegionAnzeige | null,
): CountryDarstellung {
  if (wert == null || wert === '') {
    return { art: 'leer', code: null, name: null, flagge: null, label: '' }
  }
  const code = countryCodeNormalisieren(wert)
  if (!code) {
    const roh = typeof wert === 'string' ? wert.trim() : ''
    return {
      art: 'unbekannt',
      code: roh || null,
      name: null,
      flagge: null,
      label: roh ? landUnbekanntLabel(roh) : COUNTRY_COPY.bestehendPraefix,
    }
  }
  if (!istKatalogLand(code)) {
    return {
      art: 'unbekannt',
      code,
      name: null,
      flagge: null,
      label: landUnbekanntLabel(code),
    }
  }
  return {
    art: 'katalog',
    code,
    name: landName(code, locale, anzeige),
    flagge: landFlagge(code),
    label: landOptionLabel(code, locale, anzeige),
  }
}

export function landAnzeigeText(
  wert: unknown,
  locale: string = COUNTRY_UI_LOCALE,
  anzeige?: RegionAnzeige | null,
): string {
  return landDarstellung(wert, locale, anzeige).label
}

export function landPraefixText(
  praefix: string,
  wert: unknown,
  locale: string = COUNTRY_UI_LOCALE,
  anzeige?: RegionAnzeige | null,
): string {
  const darstellung = landDarstellung(wert, locale, anzeige)
  if (darstellung.art === 'leer') return praefix
  return `${praefix} ${darstellung.label}`
}

export function landAuswahlUebernehmen(wert: unknown, bisher: unknown): string {
  if (wert == null || wert === '') return ''
  const code = countryCodeNormalisieren(wert)
  if (!code) return countryCodeNormalisieren(bisher) ?? (typeof bisher === 'string' ? bisher.trim().toUpperCase() : '')
  if (istKatalogLand(code)) return code
  const alt = countryCodeNormalisieren(bisher)
  return alt === code ? code : alt ?? ''
}
