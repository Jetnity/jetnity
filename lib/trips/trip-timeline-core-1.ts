import type { TripItem } from '@/types/trips'

export type TagesTimelineGruppe = {
  id: 'morgen' | 'mittag' | 'nachmittag' | 'abend' | 'flexibel'
  titel: string
  punkte: { punkt: TripItem; zeit: string | null }[]
}

/** Lokale Ortszeit, keine Zeitzone. Legacy-Werte weder trimmen noch normalisieren. */
export function lokalePlanzeit(wert: unknown): string | null {
  return typeof wert === 'string' && wert.length === 5 && /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(wert)
    ? wert
    : null
}

/**
 * Nur Darstellung: neue Gruppen/Arrays, ursprüngliche Item-Referenzen und IDs.
 * Minuten sind lokale Uhrminuten, keine Dauer oder vergleichbare UTC-Instanten.
 * position und ID brechen Gleichstände, unabhängig von Eingabereihenfolge/Locale.
 */
export function tagesTimelineAbleiten(items: readonly TripItem[]): TagesTimelineGruppe[] {
  const gruppen: TagesTimelineGruppe[] = [
    { id: 'morgen', titel: 'Morgen', punkte: [] },
    { id: 'mittag', titel: 'Mittag', punkte: [] },
    { id: 'nachmittag', titel: 'Nachmittag', punkte: [] },
    { id: 'abend', titel: 'Abend', punkte: [] },
    { id: 'flexibel', titel: 'Flexibel · ohne Uhrzeit', punkte: [] },
  ]
  const sortiert = items.map((punkt) => {
    const zeit = lokalePlanzeit(punkt.startsAt)
    const minuten = zeit === null ? null : Number(zeit.slice(0, 2)) * 60 + Number(zeit.slice(3))
    return { punkt, zeit, minuten }
  }).sort((links, rechts) => {
    const zeit = (links.minuten ?? 1440) - (rechts.minuten ?? 1440)
    if (zeit !== 0) return zeit
    const position = links.punkt.position - rechts.punkt.position
    if (position !== 0) return position
    return links.punkt.id < rechts.punkt.id ? -1 : links.punkt.id > rechts.punkt.id ? 1 : 0
  })

  for (const { punkt, zeit, minuten } of sortiert) {
    const gruppe = minuten === null ? 4 : minuten < 720 ? 0 : minuten < 840 ? 1 : minuten < 1080 ? 2 : 3
    gruppen[gruppe].punkte.push({ punkt, zeit })
  }
  return gruppen.filter((gruppe) => gruppe.punkte.length > 0)
}
