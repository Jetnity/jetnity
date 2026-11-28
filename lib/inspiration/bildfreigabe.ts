// Gate für die Bilder der öffentlichen Reiseideen (Startseite, Entdecken).
//
// `INSPIRATION_ZIELE.image` gehört zur CMS-Identität der Reiseideen (siehe
// `lib/places/inspiration.ts`) und bleibt unverändert, auch wenn es noch den alten Pfad mit der
// falschen Endung `.jpg` führt (die Dateien sind PNG und heissen jetzt `.png`). Hier wird der alte Pfad
// über `LEGACY_BILDPFADE` (genau diese vier Einträge, kein Muster) auf die korrigierte Datei abgebildet
// und entschieden, was davon wirklich gezeigt wird:
//   - eine einzeln belegte, freigegebene KI-Illustration (`FREIGEGEBENE_ILLUSTRATIONEN`) wird als
//     solche gezeigt und gekennzeichnet,
//   - ein Foto mit Nachweis in `public/images/organisieren/Bildnachweise.txt` wird als Foto gezeigt,
//   - alles andere, auch eine dokumentierte, aber zurückgehaltene Illustration (Zermatt), eine
//     unbekannte Datei und jede fremde Adresse, ergibt das neutrale Kartenmotiv.
//
// Eine Freigabe gilt der Datei, nie einer Ortskennung. Aus einem Bild folgt keine Orts-ID und aus einer
// Orts-ID kein Bild.

import {
  ILLUSTRATIONSHINWEIS,
  NEUTRALES_REISEBILD,
  aktuellerBildpfad,
  bildMitNachweis,
  illustrationsnachweisFuerDatei,
  type Bildmedium,
  type Bildnachweis,
} from '@/lib/trips/organisieren/bildnachweise'

export { ILLUSTRATIONSHINWEIS }

export type Inspirationsbild = {
  src: string
  nachweis: Bildnachweis
  neutral: boolean
  medium: Bildmedium
  /** Bildbeschreibung einer KI-Illustration (beginnt mit «KI-Illustration:»); bei Fotos `null`, dort beschreibt die Karte den Ort. */
  beschreibung: string | null
}

export function inspirationsbild(image: string): Inspirationsbild {
  const pfad = aktuellerBildpfad(image)
  const illustration = illustrationsnachweisFuerDatei(pfad)
  if (illustration) {
    return { src: pfad, nachweis: illustration, neutral: false, medium: 'ki-illustration', beschreibung: illustration.bildbeschreibung }
  }
  const foto = bildMitNachweis(pfad, null)
  return { ...foto, neutral: foto.src === NEUTRALES_REISEBILD, medium: 'foto', beschreibung: null }
}
