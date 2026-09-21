// lib/trips/datum-anzeige.ts
//
// Kalenderdaten für Reisende. UTC, damit dieselbe Nacht überall gleich heisst.
// Anzeige only: no stored trip, stage or commercial date is rewritten here.

const ISO_TAG = /^(\d{4})-(\d{2})-(\d{2})$/

const kurzesDatum = new Intl.DateTimeFormat('de-CH', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const etappenDatumOhneJahr = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

const etappenDatumMitJahr = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function tagLesen(wert: string | null | undefined): { iso: string; jahr: number; zeit: Date } | null {
  if (!wert || !ISO_TAG.test(wert)) return null
  const zeit = Date.parse(`${wert}T00:00:00Z`)
  if (Number.isNaN(zeit)) return null
  return { iso: wert, jahr: Number(wert.slice(0, 4)), zeit: new Date(zeit) }
}

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

/**
 * Localized stage arrival/departure label. Returns null when neither endpoint
 * is a valid date-only day, so the caller keeps its existing empty copy.
 * Invalid or non-ISO values never become the ordinary visible label.
 */
export function etappenZeitraumAnzeigen(
  ankunft: string | null | undefined,
  abreise: string | null | undefined,
): string | null {
  const start = tagLesen(ankunft)
  const ende = tagLesen(abreise)
  if (!start && !ende) return null
  if (start && !ende) return `Ankunft ${etappenDatumMitJahr.format(start.zeit)}`
  if (!start && ende) return `Abreise ${etappenDatumMitJahr.format(ende.zeit)}`
  if (start!.iso === ende!.iso) return etappenDatumMitJahr.format(start!.zeit)
  const mitJahr = start!.jahr !== ende!.jahr
  const format = mitJahr ? etappenDatumMitJahr : etappenDatumOhneJahr
  return `${format.format(start!.zeit)} – ${format.format(ende!.zeit)}`
}
