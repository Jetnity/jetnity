// Das eine Bild der Startseite: Hero, Open Graph, Twitter und JSON-LD zeigen dasselbe, freigegebene Bild
// mit Herkunftsnachweis in `lib/trips/organisieren/bildnachweise.ts` und `public/images/organisieren/Bildnachweise.txt`.
// Ein anderes Bild gehört erst hierher, wenn sein Nachweis belegt ist; ein Test liest die echten Abmessungen
// der gewählten Datei und hält sie mit `breite` und `hoehe` deckungsgleich.
//
// Das Bild ist eine KI-Illustration, kein Foto. Jede Angabe über das Bild (Hinweis am Bild, Alt-Text, Open Graph,
// Twitter, JSON-LD) nennt es so und behauptet keine echte Ortsaufnahme.

export const STARTSEITENBILD = {
  pfad: '/images/hero-bali.png',
  breite: 1536,
  hoehe: 1024,
  medium: 'ki-illustration',
  ort: 'Bali, Indonesien',
  alt: 'KI-Illustration: Palmen und Reisterrassen im warmen Licht des Sonnenuntergangs, Motiv Bali',
  teilenAlt: 'Jetnity: Deine ganze Reise. KI-Illustration von Palmen und Reisterrassen im Sonnenuntergang, Motiv Bali',
} as const

/** Ziel des Links «Bildnachweis» am Hero-Bild. */
export const BILDNACHWEISE_ID = 'bildnachweise'
