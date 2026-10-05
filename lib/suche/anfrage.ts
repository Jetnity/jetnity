// lib/suche/anfrage.ts
//
// Current-Request-Grenze für Orts- und Flughafensuche.
// Ein abgebrochener oder überholter Lauf darf Loading, Treffer und Fehler
// der neueren Anfrage nicht überschreiben.

export type SucheAnfrageStand = {
  aktuell: number
}

export function sucheAnfrageStarten(stand: SucheAnfrageStand): number {
  stand.aktuell += 1
  return stand.aktuell
}

export function sucheAnfrageDarfSchreiben(
  stand: SucheAnfrageStand,
  id: number,
  signal?: { aborted?: boolean },
): boolean {
  if (signal?.aborted) return false
  return stand.aktuell === id
}
