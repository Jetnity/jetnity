/**
 * Wann der schwebende «Nach oben»-Knopf zu sehen ist.
 *
 * Wo es rechts keinen freien Rand gibt (Telefon, und im Arbeitsbereich alles unter dem
 * Desktop-Raster), liegt ein dauerhaft sichtbarer Knopf immer über Preisen, Pfeilen oder
 * Text. Dort erscheint er nur, solange jemand nach oben scrollt (also zurück will), und
 * verschwindet wieder, sobald die Seite ruht. Auf grossen Bildschirmen steht er am freien
 * Rand und bleibt sichtbar. Gezeigt wird er erst nach mindestens einer Bildschirmhöhe.
 */

export const NACH_OBEN_SCHWELLE_PX = 400
export const NACH_OBEN_RUHE_MS = 2200
const RICHTUNG_MIN_PX = 12

export type ScrollRichtung = 'hoch' | 'runter'

export type ScrollVerfolgung = { richtung: ScrollRichtung; anker: number }

/** Mindestens eine Bildschirmhöhe, nie weniger als `NACH_OBEN_SCHWELLE_PX`. */
export function nachObenSchwelle(viewportHoehe: number): number {
  return Math.max(NACH_OBEN_SCHWELLE_PX, Math.round(viewportHoehe))
}

export function ueberSchwelle(scrollY: number, schwelle: number = NACH_OBEN_SCHWELLE_PX): boolean {
  return scrollY > schwelle
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
  /** Kein freier Rand rechts: Telefon, oder Arbeitsbereich unter dem Desktop-Raster. */
  engerRand: boolean
  richtung: ScrollRichtung
  ruhig: boolean
}): boolean {
  if (!eingabe.ueberSchwelle) return false
  if (!eingabe.engerRand) return true
  return eingabe.richtung === 'hoch' && !eingabe.ruhig
}
