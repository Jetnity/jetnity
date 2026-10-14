import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { zielHref } from '@/lib/places/auswahl'

export const THEMEN = [
  { id: 'alle', label: 'Alle Themen' },
  { id: 'stadt-kultur', label: 'Stadt & Kultur' },
  { id: 'natur', label: 'Natur' },
  { id: 'strand', label: 'Strand' },
  { id: 'erholung', label: 'Erholung' },
] as const

export type Thema = (typeof THEMEN)[number]['id']
type Ziel = (typeof INSPIRATION_ZIELE)[number]
type Redaktion = { beschreibung: string; themen: readonly Exclude<Thema, 'alle'>[] }

// Redaktionelle Vorschläge, keine Anbieter- oder Ortsbestätigung.
const REDAKTION: Record<Ziel['placeId'], Redaktion> = {
  'geonames:1650535': {
    beschreibung: 'Zeit für Ubud, Natur und ruhige Strandtage: Verbinde in deiner Reiseidee Entdecken mit Pausen und lokaler Küche.',
    themen: ['natur', 'strand', 'erholung'],
  },
  'geonames:2267057': {
    beschreibung: 'Aussichtspunkte und gutes Essen als Ausgangspunkt: Sammle Ideen für deine Stadttage und einen Ausflug ans Meer.',
    themen: ['stadt-kultur', 'strand'],
  },
  'geonames:2657915': {
    beschreibung: 'Wandern, Wellness und Matterhornblick: Nimm dir eine Auszeit in den Bergen und plane Bewegung und Ruhe in deinem eigenen Tempo.',
    themen: ['natur', 'erholung'],
  },
  'geonames:2759794': {
    beschreibung: 'Grachten, Museen und eine Fahrradtour: Stelle dir abwechslungsreiche Stadttage mit Zeit für besondere Restaurants zusammen.',
    themen: ['stadt-kultur'],
  },
}

export const ENTDECKEN_ZIELE = INSPIRATION_ZIELE.map((ziel) => ({
  ...ziel,
  ...REDAKTION[ziel.placeId],
  href: zielHref({ id: ziel.placeId, name: ziel.name }, ziel.idea),
}))

export type EntdeckenZiel = (typeof ENTDECKEN_ZIELE)[number]
export type EntdeckenZustand = { q: string; thema: Thema }
export const SUCHLAENGE = 120

export function suchtext(wert: string): string {
  return wert.slice(0, SUCHLAENGE)
    .replace(/[\uD800-\uDFFF]/gu, '\uFFFD') // Auch an der Längengrenze wohlgeformt für URLSearchParams.
    .replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
}

/** Wiederholte Werte: erster Wert gewinnt. Unbekanntes Thema: alle. */
export function entdeckerParams(params: Record<string, string | string[] | undefined>): EntdeckenZustand {
  const erster = (wert: string | string[] | undefined) => Array.isArray(wert) ? wert[0] : wert
  const thema = erster(params.thema)
  return {
    q: suchtext(erster(params.q) ?? ''),
    thema: THEMEN.find((eintrag) => eintrag.id === thema)?.id ?? 'alle',
  }
}

export function entdeckerHref(zustand: EntdeckenZustand): string {
  const params = new URLSearchParams()
  const q = suchtext(zustand.q)
  if (q) params.set('q', q)
  if (zustand.thema !== 'alle') params.set('thema', zustand.thema)
  return `/entdecken${params.size ? `?${params.toString()}` : ''}`
}

function vergleich(wert: string): string {
  return wert.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('de').replace(/ß/g, 'ss')
}

export function entdeckerTreffer(zustand: EntdeckenZustand): EntdeckenZiel[] {
  const woerter = vergleich(suchtext(zustand.q)).split(/\s+/).filter(Boolean)
  return ENTDECKEN_ZIELE.filter((ziel) => {
    if (zustand.thema !== 'alle' && !ziel.themen.includes(zustand.thema)) return false
    const text = vergleich([
      ziel.name, ziel.country, ziel.beschreibung, ziel.idea,
      ...ziel.themen.map((id) => THEMEN.find((thema) => thema.id === id)?.label ?? ''),
    ].join(' '))
    return woerter.every((wort) => text.includes(wort))
  })
}
