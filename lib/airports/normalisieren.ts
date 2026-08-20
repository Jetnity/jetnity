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

export function falten(wert: string): string {
  return wert
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

export function umlauteExpandieren(wert: string): string {
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
