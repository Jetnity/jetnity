// lib/trips/datum-anzeige.ts
//
// Kalenderdaten für Reisende. UTC, damit dieselbe Nacht überall gleich heisst.

const kurzesDatum = new Intl.DateTimeFormat('de-CH', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

export function datumKurz(wert: string | null | undefined): string {
  if (!wert) return ''
  const zeit = Date.parse(`${wert}T00:00:00Z`)
  if (Number.isNaN(zeit)) return wert
  return kurzesDatum.format(new Date(zeit))
}

export function zeitraumKurz(start: string | null | undefined, ende: string | null | undefined): string {
  if (!start || !ende) return 'Zeitraum noch nicht bestimmbar'
  return `${datumKurz(start)} – ${datumKurz(ende)}`
}
