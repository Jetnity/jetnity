// Welche Sicherheitslesung den sichtbaren Zustand schreiben darf.
// Die Oberfläche startet Lesungen parallel (erste Ansicht, 15-Sekunden-Takt,
// manuelles Aktualisieren, Lesen nach Block/Unblock). Nur die zuletzt
// gestartete Lesung bleibt maßgeblich.

export function naechsteRefreshIdentitaet(bisherige: number): number {
  if (!Number.isInteger(bisherige) || bisherige < 0) {
    throw new Error('bisherige muss eine nichtnegative ganze Zahl sein')
  }
  return bisherige + 1
}

export function refreshIstAutoritaer(gestartet: number, juengste: number): boolean {
  return (
    Number.isInteger(gestartet) &&
    Number.isInteger(juengste) &&
    gestartet > 0 &&
    gestartet === juengste
  )
}
