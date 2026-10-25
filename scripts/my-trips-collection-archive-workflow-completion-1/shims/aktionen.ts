let naechste: () => Promise<unknown> = async () => ({ ok: true, wert: null })
let anzahl = 0

export function reiseArchivLebenszyklus() {
  anzahl += 1
  return naechste()
}

export function setzeAktion(fn: () => Promise<unknown>) {
  naechste = fn
}

export function aktionAnzahl() {
  return anzahl
}

export function aktionZurueck() {
  anzahl = 0
  naechste = async () => ({ ok: true, wert: null })
}
