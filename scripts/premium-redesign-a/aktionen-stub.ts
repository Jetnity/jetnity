/** Ersatz für Server Actions im lokalen Prüfstand: kein Modell, kein Netz, kein Konto. */
export async function begleiterFragen(): Promise<{ ok: false; meldung: string }> {
  return { ok: false, meldung: 'Im Prüfstand gibt es keinen Reisebegleiter-Dienst.' }
}

/** Ersatz für die Archiv-Server-Action: Die Abnahme schreibt nie; ein Aufruf wäre ein Fehler im Prüfstand. */
export async function reiseArchivLebenszyklus(): Promise<never> {
  throw new Error('Im Prüfstand gibt es keinen Archiv-Schreibweg.')
}
