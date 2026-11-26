// Bildfreigabe der öffentlichen Reiseideen (Startseite und Entdecken).
//
// `INSPIRATION_ZIELE.image` gehört zur CMS-Identität der Reiseideen (siehe
// `referenceMatches` im CMS) und bleibt unverändert, auch wenn eine Datei keinen
// belegten Lizenznachweis hat. Gezeigt wird deshalb nie der Rohwert, sondern das
// Ergebnis dieser Freigabe: ein Bild nur mit Nachweis in
// `public/images/organisieren/Bildnachweise.txt`, sonst das neutrale Kartenmotiv.
//
// Der Ersatz bindet eine Datei an eine Datei, nie eine Orts-ID an eine andere:
// `geonames:2657915` (Reiseidee «Zermatt») und `geonames:2657928` (Bildkatalog
// «Zermatt») werden hier ausdrücklich nicht gleichgesetzt.

import { bildMitNachweis, NEUTRALES_REISEBILD, type Bildnachweis } from '@/lib/trips/organisieren/bildnachweise'

/**
 * Ehemalige Bilddateien ohne Lizenznachweis und das freigegebene Bild desselben Ortes.
 * Bali fehlt mit Absicht: Es gibt kein freigegebenes Bali-Bild, die Karte bleibt neutral.
 */
export const FREIGEGEBENE_ERSATZBILDER: Readonly<Record<string, string>> = {
  '/images/lisbon.jpg': '/images/organisieren/lisbon-commons.jpg',
  '/images/zermatt.jpg': '/images/organisieren/zermatt-commons.jpg',
  '/images/amsterdam.jpg': '/images/organisieren/amsterdam-commons.jpg',
}

export type Inspirationsbild = {
  src: string
  nachweis: Bildnachweis
  /** Das Motiv zeigt den Ort nicht selbst (neutrales Kartenmotiv): kein Bildtext, der den Ort behauptet. */
  neutral: boolean
}

export function inspirationsbild(image: string): Inspirationsbild {
  const bild = bildMitNachweis(FREIGEGEBENE_ERSATZBILDER[image] ?? image, null)
  return { ...bild, neutral: bild.src === NEUTRALES_REISEBILD }
}
