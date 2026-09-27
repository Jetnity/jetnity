// Existenz der Nachweis-Fixture über Storage Object Info, nicht über den
// Objektinhalt. Der Inhalts-GET kann nach dem Löschen noch kurz 200 liefern.
// Info-Status 200 heißt vorhanden, 400 und 404 heißen weg. Nur die eigene
// Fixture nach dem Löschen wartet begrenzt. Das fremde Objekt nutzt dieselbe
// Statusregel, aber einen einzigen Blick. Die Aufräum-Löschung pollt nicht.

export const OBJEKT_ABWESENHEIT_INTERVALL_MS = 50
export const OBJEKT_ABWESENHEIT_FRIST_MS = 1000

export function objektInfoAdresse(url: string, bucket: string, id: string): string {
  return `${url}/storage/v1/object/info/${bucket}/${id}/proof.bin`
}

export function objektAusInfoStatus(status: number): boolean {
  if (status === 200) return true
  if (status === 400 || status === 404) return false
  throw new Error('speicher')
}

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
