// Abstand bis zum nächsten Geräte-Kalendertag.
//
// `zeitzoneVersatzMinuten` folgt `Date#getTimezoneOffset`: Minuten westlich
// von UTC. Kein IANA-Name, keine Reisezone, kein gespeichertes Datum.

const TAG_MS = 86_400_000

/** Wie oft ein offener Tab den Geräte-Offset erneut liest, ohne ein Netz zu fragen. */
export const KALENDER_VERSATCH_PRUEFUNG_MS = 60_000

export function millisekundenBisNaechstenLokalTag(jetzt: Date, zeitzoneVersatzMinuten: number): number {
  const lokal = new Date(jetzt.getTime() - zeitzoneVersatzMinuten * 60_000)
  const verbraucht =
    lokal.getUTCHours() * 3_600_000 +
    lokal.getUTCMinutes() * 60_000 +
    lokal.getUTCSeconds() * 1000 +
    lokal.getUTCMilliseconds()
  const rest = TAG_MS - verbraucht
  return rest === 0 ? TAG_MS : rest
}

export function naechsteKalenderPruefung(jetzt: Date, zeitzoneVersatzMinuten: number): number {
  return Math.min(
    millisekundenBisNaechstenLokalTag(jetzt, zeitzoneVersatzMinuten),
    KALENDER_VERSATCH_PRUEFUNG_MS,
  )
}
