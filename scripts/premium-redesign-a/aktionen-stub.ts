/** Ersatz für Server Actions im lokalen Prüfstand: kein Modell, kein Netz, kein Konto. */
export async function begleiterFragen(): Promise<{ ok: false; meldung: string }> {
  return { ok: false, meldung: 'Im Prüfstand gibt es keinen Reisebegleiter-Dienst.' }
}
