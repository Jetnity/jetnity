// lib/activities/getyourguide/suche.ts
//
// Öffentliche Suchkonfiguration für das manuelle GetYourGuide-Widget.
// Das ist kein Standort-Katalog und keine öffentliche Kennung.

import { COUNTRY_UI_LOCALE, countryCodeNormalisieren, landName } from '@/lib/country/darstellung'
import { istKatalogLand } from '@/lib/country/katalog'

export const GYG_DATENSCHUTZ_HREF = 'https://www.getyourguide.com/c/privacy-policy'

export type GygSuchumfang = 'stadt' | 'region' | 'insel' | 'land'

export type GygSuchkonfiguration = {
  readonly art: 'suche'
  readonly anbieter: 'getyourguide'
  readonly umfang: GygSuchumfang
  readonly name: string
  readonly land: string
  readonly countryCode: string
}

const SUCH_SCHLUESSEL = ['art', 'anbieter', 'umfang', 'name', 'land', 'countryCode'] as const
const NAME = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,'’-]{0,79}$/u

function nameZulaessig(name: string): boolean {
  if (!NAME.test(name)) return false
  if (/geonames:|airport:|https?:|javascript:|data:|[<>\\/]/i.test(name)) return false
  if (/\s{2,}/.test(name)) return false
  return true
}

function privat(wert: string, gesperrt: readonly string[]): boolean {
  const vergleich = wert.toLowerCase()
  return gesperrt.some((eintrag) => {
    if (!eintrag) return false
    const token = eintrag.toLowerCase()
    if (token === vergleich) return true
    return token.length >= 8 && vergleich.includes(token)
  })
}

/**
 * Baut die Suchkonfiguration aus dem kanonischen Ortsnamen und dem
 * bestätigten Ländercode. Der Ländername kommt aus der bestehenden
 * Katalogdarstellung. Eine Admin-Region wird nicht angehängt.
 */
export function suchkonfigurationBauen(eingabe: {
  umfang: GygSuchumfang
  name: string
  countryCode: string
  gesperrt?: readonly string[]
}): GygSuchkonfiguration | null {
  const code = countryCodeNormalisieren(eingabe.countryCode)
  if (!code || !istKatalogLand(code)) return null
  const land = landName(code, COUNTRY_UI_LOCALE).trim()
  if (!nameZulaessig(land)) return null
  const name = eingabe.umfang === 'land' ? land : eingabe.name.trim()
  if (!nameZulaessig(name)) return null
  const gesperrt = eingabe.gesperrt ?? []
  if (privat(name, gesperrt) || privat(land, gesperrt)) return null
  return Object.freeze({
    art: 'suche',
    anbieter: 'getyourguide',
    umfang: eingabe.umfang,
    name,
    land,
    countryCode: code,
  })
}

export function suchanfrageText(suche: GygSuchkonfiguration): string {
  return suche.umfang === 'land' ? suche.land : `${suche.name} ${suche.land}`
}

export function suchkonfigurationIstGueltig(wert: unknown): wert is GygSuchkonfiguration {
  if (!wert || typeof wert !== 'object') return false
  const schluessel = Object.keys(wert)
  if (schluessel.length !== SUCH_SCHLUESSEL.length) return false
  if (SUCH_SCHLUESSEL.some((name) => !schluessel.includes(name))) return false
  const suche = wert as GygSuchkonfiguration
  if (suche.art !== 'suche' || suche.anbieter !== 'getyourguide') return false
  if (suche.umfang !== 'stadt' && suche.umfang !== 'region' && suche.umfang !== 'insel' && suche.umfang !== 'land') {
    return false
  }
  const neu = suchkonfigurationBauen({
    umfang: suche.umfang,
    name: suche.name,
    countryCode: suche.countryCode,
  })
  if (!neu) return false
  return neu.name === suche.name && neu.land === suche.land && neu.countryCode === suche.countryCode
}
