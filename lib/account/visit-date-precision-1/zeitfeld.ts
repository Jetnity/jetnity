// Übergang der optionalen Besuchsdatierung im Formular.
//
// Leert der Nutzer ein Elternfeld, verschwinden die abhängigen Felder mit.
// Ob das Datum existiert oder in der Zukunft liegt, entscheidet weiterhin
// nur `besuche-eingabe.ts`. Hier wird kein Tag erfunden und keiner auf den
// 1. Januar gesetzt.

export type BesuchZeitfelder = {
  jahr: string
  monat: string
  tag: string
}

export type BesuchZeitfeld = 'jahr' | 'monat' | 'tag'

function elternLeer(wert: string): boolean {
  return wert.trim() === ''
}

/**
 * Setzt Jahr, Monat oder Tag und verwirft abhängige Genauigkeit, sobald das
 * Elternfeld leer wird. Ein wieder gefülltes Elternfeld holt nichts zurück.
 */
export function besuchZeitfeldSetzen<T extends BesuchZeitfelder>(
  wert: T,
  feld: BesuchZeitfeld,
  naechster: string,
): T {
  if (feld === 'tag') return { ...wert, tag: naechster }

  if (feld === 'monat') {
    if (elternLeer(naechster)) return { ...wert, monat: naechster, tag: '' }
    return { ...wert, monat: naechster }
  }

  if (elternLeer(naechster)) return { ...wert, jahr: naechster, monat: '', tag: '' }
  return { ...wert, jahr: naechster }
}
