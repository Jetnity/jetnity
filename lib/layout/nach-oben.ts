/**
 * Wann der schwebende «Nach oben»-Knopf zu sehen ist.
 *
 * Auf Telefonen gibt es rechts keinen freien Rand: ein dauerhaft sichtbarer Knopf
 * liegt dort immer über Text. Deshalb erscheint er auf öffentlichen Seiten nur,
 * solange jemand nach oben scrollt (also zurück will), und verschwindet wieder,
 * sobald die Seite ruht. Auf grossen Bildschirmen bleibt das bisherige Verhalten, ebenso
 * dort, wo der Knopf einen eigenen Platz hat (Arbeitsbereich, feste Navigation unten).
 */

export const NACH_OBEN_SCHWELLE_PX = 400
export const NACH_OBEN_RUHE_MS = 2200
const RICHTUNG_MIN_PX = 12

export type ScrollRichtung = 'hoch' | 'runter'

export type ScrollVerfolgung = { richtung: ScrollRichtung; anker: number }

export function ueberSchwelle(scrollY: number): boolean {
  return scrollY > NACH_OBEN_SCHWELLE_PX
}

/**
 * Der Anker folgt dem weitesten Punkt der aktuellen Richtung. Erst eine Gegenbewegung ab
 * `RICHTUNG_MIN_PX` dreht die Richtung; Zuckungen (Adressleiste, Trägheit) zählen nicht.
 */
export function scrollVerfolgen(zustand: ScrollVerfolgung, scrollY: number): ScrollVerfolgung {
  if (zustand.richtung === 'runter') {
    if (scrollY >= zustand.anker) return { richtung: 'runter', anker: scrollY }
    if (zustand.anker - scrollY >= RICHTUNG_MIN_PX) return { richtung: 'hoch', anker: scrollY }
    return zustand
  }
  if (scrollY <= zustand.anker) return { richtung: 'hoch', anker: scrollY }
  if (scrollY - zustand.anker >= RICHTUNG_MIN_PX) return { richtung: 'runter', anker: scrollY }
  return zustand
}

export function nachObenSichtbar(eingabe: {
  ueberSchwelle: boolean
  telefon: boolean
  eigenerPlatz: boolean
  richtung: ScrollRichtung
  ruhig: boolean
}): boolean {
  if (!eingabe.ueberSchwelle) return false
  if (!eingabe.telefon || eingabe.eigenerPlatz) return true
  return eingabe.richtung === 'hoch' && !eingabe.ruhig
}
