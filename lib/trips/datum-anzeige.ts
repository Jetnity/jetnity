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
  if (!wert) return null
  const teile = ISO_TAG.exec(wert)
  if (!teile) return null
  const jahr = Number(teile[1])
  const monat = Number(teile[2])
  const tag = Number(teile[3])
  const zeit = new Date(Date.UTC(jahr, monat - 1, tag))
  // Date.UTC normalizes impossible days (2026-02-29 → 1 March). Reject those.
  if (
    zeit.getUTCFullYear() !== jahr ||
    zeit.getUTCMonth() !== monat - 1 ||
    zeit.getUTCDate() !== tag
  ) {
    return null
  }
  return { iso: wert, jahr, zeit }
}

/**
 * Fortlaufende Tageszahl eines gültigen Kalendertags (UTC-Mitternacht / 86 400 000).
 * Nur zum Zählen von Tagen zwischen zwei Datumswerten, nie als Uhrzeit. `null`,
 * wenn der Wert kein gültiger Kalendertag ist.
 */
export function kalendertagNummer(wert: string | null | undefined): number | null {
  const tag = tagLesen(wert)
  return tag ? Math.round(tag.zeit.getTime() / 86_400_000) : null
}

export function datumKurz(wert: string | null | undefined): string {
  if (!wert) return ''
  const zeit = Date.parse(`${wert}T00:00:00Z`)
  if (Number.isNaN(zeit)) return wert
  return kurzesDatum.format(new Date(zeit))
}

/** Tag mit Jahr („12. Sept. 2026“); null, wenn der Wert kein gültiger Kalendertag ist. */
export function datumMitJahr(wert: string | null | undefined): string | null {
  const tag = tagLesen(wert)
  return tag ? etappenDatumMitJahr.format(tag.zeit) : null
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

/**
 * Wann ein Planpunkt stattfindet, so kurz wie möglich: Zeitraum für
 * Unterkunft und Mietwagen, sonst Tag und gespeicherte Uhrzeit.
 */
export function planpunktWann(
  punkt: { kind: string; startsAt: string | null; endsOn: string | null },
  datum: string | null,
): string | null {
  if (punkt.kind === 'stay' || punkt.kind === 'rental_car') {
    const zeitraum = etappenZeitraumAnzeigen(datum, punkt.endsOn)
    if (zeitraum) return zeitraum
  }
  if (!datum) return null
  const tag = datumKurz(datum)
  return punkt.startsAt ? `${tag} · ${punkt.startsAt}` : tag
}


/** Swiss visitor dates with an actual weekday: "Di, 1. Dez. 2026".
 * Civil UTC prevents accidental day changes between browsers/time zones. */
const BESUCHER_WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const
const BESUCHER_DATUM = new Intl.DateTimeFormat('de-CH', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
})
export function datumMitWochentag(wert: string | null | undefined): string | null {
  const tag = tagLesen(wert)
  return tag ? `${BESUCHER_WOCHENTAGE[tag.zeit.getUTCDay()]}, ${BESUCHER_DATUM.format(tag.zeit)}` : null
}

/** Presentation only; does not rewrite dates in the saved trip or operation. */
export function aenderungstextLesbar(wert: string): string {
  // Ausschliesslich der sichtbare Text wird umgeschrieben. IDs, Graph und
  // gespeicherte Originalaussagen der Änderungsprüfung bleiben unverändert.
  return wert
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, datum => datumMitWochentag(datum) ?? 'Datum noch offen')
    .replaceAll('Geschützte Planpunkte mit betroffenem Reisezeitraum oder Tageskontext',
      'Geschützte Einträge, die von der Änderung betroffen sein könnten')
    .replaceAll('Weitere betroffene Planpunkte', 'Weitere betroffene Einträge')
    .replaceAll('Etappenzuordnung', 'Zuordnung zu einem Reiseziel')
    .replaceAll('Übernachtungsintervalle', 'Nächte')
    .replaceAll('Übernachtungsintervall', 'Nacht')
    .replaceAll('Tageskontext', 'Reisetag')
    .replaceAll('Position ', 'Reihenfolge ')
    .replaceAll('Geschützt:', 'Deine Buchungsangaben bleiben erhalten:')
    .replaceAll('Planpunkten', 'Einträgen')
    .replaceAll('Planpunkte', 'Einträge')
    .replaceAll('Planpunkt', 'Eintrag')
    .replaceAll('Eintrage', 'Einträge')
}
