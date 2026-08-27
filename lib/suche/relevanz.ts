// lib/suche/relevanz.ts
//
// Gemeinsame Namensrelevanz für Orts- und Flughafensuche.
// Kein Provider, keine IDs, keine Peru-/Zürich-Sonderfälle.

import {
  beginntGefaltet,
  gleichGefaltet,
  prefixGrenze,
  restNachPrefixGefaltet,
} from '@/lib/airports/normalisieren'

const NAMENS_RANG = {
  exact: 5_000,
  firstPrefix: 3_500,
  qualified: 2_800,
  laterWord: 450,
  laterPrefix: 150,
  admin: 500,
} as const

const VERWALTUNG = new Set([
  'arrondissement',
  'bezirk',
  'borough',
  'commune',
  'comune',
  'district',
  'gemeinde',
  'kreis',
  'municipio',
  'neighborhood',
  'neighbourhood',
  'parish',
  'precinct',
  'quartier',
  'quarter',
  'sector',
  'suburb',
  'township',
  'ward',
  'zone',
])

const VERKEHR = new Set([
  'aeroport',
  'aeroporto',
  'airport',
  'flughafen',
  'intl',
  'international',
])

export type NamensArt = 'exact' | 'prefix' | 'qualified' | 'later' | 'admin' | 'none'

function woerter(wert: string): string[] {
  return wert
    .split(/[\s,/_-]+/)
    .map((teil) => teil.trim())
    .filter((teil) => teil.length > 0)
}

function hatVerwaltungswort(wert: string): boolean {
  return woerter(wert).some((wort) => VERWALTUNG.has(wort.toLowerCase()))
}

function hatVerkehrswort(wert: string): boolean {
  return woerter(wert).some((wort) => VERKEHR.has(wort.toLowerCase()))
}

export function namensArt(name: string | null | undefined, suche: string): NamensArt {
  const roh = suche.trim()
  if (!name || !roh) return 'none'
  if (gleichGefaltet(name, roh)) return 'exact'

  const grenze = prefixGrenze(name, roh)
  if (grenze === 'exact') return 'exact'
  if (grenze === 'same-word') return 'prefix'
  if (grenze === 'next-token') {
    const extra = restNachPrefixGefaltet(name, roh)
    if (hatVerwaltungswort(extra) && !hatVerkehrswort(extra)) return 'admin'
    return 'qualified'
  }

  const namensWoerter = woerter(name)
  for (const wort of namensWoerter.slice(1)) {
    if (gleichGefaltet(wort, roh)) return 'later'
    if (roh.length >= 3 && beginntGefaltet(wort, roh)) return 'later'
  }
  return 'none'
}

function namensRang(name: string | null | undefined, suche: string): number {
  const art = namensArt(name, suche)
  if (art === 'exact') return NAMENS_RANG.exact
  if (art === 'prefix') return NAMENS_RANG.firstPrefix
  if (art === 'qualified') return NAMENS_RANG.qualified
  if (art === 'admin') return NAMENS_RANG.admin
  if (art === 'later') {
    const roh = suche.trim()
    const spaeter = woerter(name ?? '').slice(1)
    if (spaeter.some((wort) => gleichGefaltet(wort, roh))) return NAMENS_RANG.laterWord
    return NAMENS_RANG.laterPrefix
  }
  return 0
}

function erstesWortPrefix(name: string | null | undefined, suche: string): boolean {
  const erstes = woerter(name ?? '')[0]
  if (!erstes) return false
  return beginntGefaltet(erstes, suche.trim()) && !gleichGefaltet(erstes, suche.trim())
}

export function namensRangMitWortanfang(name: string | null | undefined, suche: string): number {
  const direkt = namensRang(name, suche)
  if (direkt > 0) return direkt
  if (erstesWortPrefix(name, suche) && suche.trim().length >= 2) return NAMENS_RANG.firstPrefix
  return 0
}
