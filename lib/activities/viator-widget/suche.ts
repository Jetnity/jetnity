// lib/activities/viator-widget/suche.ts
//
// Öffentlicher Suchname für das dynamische Viator-Widget.
// Kein Reisekennzeichen, kein Datum und keine Teilnehmerzahl.

const NAME = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,'’-]{0,79}$/u

function privat(wert: string, gesperrt: readonly string[]): boolean {
  const vergleich = wert.toLowerCase()
  return gesperrt.some((eintrag) => {
    if (!eintrag) return false
    const token = eintrag.toLowerCase()
    if (token === vergleich) return true
    return token.length >= 8 && vergleich.includes(token)
  })
}

/** Kanonischer öffentlicher Orts- oder Ländername. Kein Viator-Beispielort. */
export function viatorSuchname(name: string, gesperrt: readonly string[] = []): string | null {
  const text = name.trim()
  if (!NAME.test(text)) return null
  if (/geonames:|airport:|https?:|javascript:|data:|[<>\\/]/i.test(text)) return null
  if (/\s{2,}/.test(text)) return null
  if (privat(text, gesperrt)) return null
  return text
}
