// Kurzes, begrenztes Warten, bis ein Storage-Objekt nach dem Löschen weg ist.
// Supabase kann die GET-Antwort noch einen Augenblick als vorhanden melden,
// obwohl das Entfernen schon gelungen ist. Der Nachweis pollt nur die eigene
// Fixture. Fremde Objekte und die Aufräum-Löschung benutzen das nicht.

export const OBJEKT_ABWESENHEIT_INTERVALL_MS = 50
export const OBJEKT_ABWESENHEIT_FRIST_MS = 1000

export async function objektAbwesenheitWarten(
  objektDa: () => Promise<boolean>,
  uhr: {
    jetzt?: () => number
    warten?: (ms: number) => Promise<void>
    intervallMs?: number
    fristMs?: number
  } = {},
): Promise<boolean> {
  const jetzt = uhr.jetzt ?? Date.now
  const warten = uhr.warten ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))
  const intervallMs = uhr.intervallMs ?? OBJEKT_ABWESENHEIT_INTERVALL_MS
  const fristMs = uhr.fristMs ?? OBJEKT_ABWESENHEIT_FRIST_MS
  const start = jetzt()

  for (;;) {
    if (!(await objektDa())) return true
    const vergangen = jetzt() - start
    if (vergangen >= fristMs) return false
    const rest = fristMs - vergangen
    const schritt = Math.min(intervallMs, rest)
    const davor = jetzt()
    await warten(schritt)
    if (jetzt() <= davor) return false
  }
}
