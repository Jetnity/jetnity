// lib/airports/normalisieren.ts
//
// Such- und Vergleichsform ohne Zone und ohne Locale-Ratespiele.
// „Zürich" und „Zurich" sollen dieselbe Stadt treffen.

const UMLAUT: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
  æ: 'ae',
  ø: 'oe',
  å: 'aa',
}

function falten(wert: string): string {
  return wert
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

function umlauteExpandieren(wert: string): string {
  return wert
    .toLowerCase()
    .replace(/[äöüßæøå]/g, (zeichen) => UMLAUT[zeichen] ?? zeichen)
}

export function sucheVarianten(wert: string): string[] {
  const roh = wert.trim()
  if (!roh) return []
  const klein = roh.toLowerCase()
  const eindeutig = new Set<string>([roh, klein, falten(klein), falten(umlauteExpandieren(klein))])
  return [...eindeutig].filter((eintrag) => eintrag.length > 0)
}

export function enthaeltGefaltet(heu: string | null | undefined, nadel: string): boolean {
  if (!heu) return false
  const ziel = falten(nadel)
  if (!ziel) return false
  return falten(heu).includes(ziel) || falten(umlauteExpandieren(heu)).includes(ziel)
}

export function beginntGefaltet(heu: string | null | undefined, nadel: string): boolean {
  if (!heu) return false
  const ziel = falten(nadel)
  if (!ziel) return false
  return falten(heu).startsWith(ziel) || falten(umlauteExpandieren(heu)).startsWith(ziel)
}

export function gleichGefaltet(links: string | null | undefined, rechts: string): boolean {
  if (!links) return false
  return falten(links) === falten(rechts) || falten(umlauteExpandieren(links)) === falten(rechts)
}

/** Rest nach einem gefalteten Präfix. Leer, wenn der Name nicht mit der Suche beginnt. */
export function restNachPrefixGefaltet(name: string | null | undefined, suche: string): string {
  const rest = prefixRest(name, suche)
  return rest ? rest.trim() : ''
}

export function prefixGrenze(
  name: string | null | undefined,
  suche: string,
): 'none' | 'exact' | 'same-word' | 'next-token' {
  const rest = prefixRest(name, suche)
  if (rest === null) return 'none'
  if (rest.length === 0) return 'exact'
  if (/^[\s,/_-]/.test(rest)) return 'next-token'
  return 'same-word'
}

function prefixRest(name: string | null | undefined, suche: string): string | null {
  if (!name) return null
  const nadel = falten(suche)
  if (!nadel) return null
  const direkt = falten(name)
  if (direkt.startsWith(nadel)) return direkt.slice(nadel.length)
  const erweitert = falten(umlauteExpandieren(name))
  if (erweitert.startsWith(nadel)) return erweitert.slice(nadel.length)
  return null
}
