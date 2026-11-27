// Das eine Motiv der Startseite in zwei Dateien:
//   - `STARTSEITENBILD` ist das sichtbare Hero-Bild (das unveränderte Original, 1536 x 1024 PNG),
//   - `TEILENBILD` ist das daraus abgeleitete Vorschaubild für Open Graph, Twitter und JSON-LD (1200 x 630 JPEG, unter 300 KB).
// Beide haben einen Herkunftsnachweis in `lib/trips/organisieren/bildnachweise.ts` und `public/images/organisieren/Bildnachweise.txt`.
// Das Vorschaubild ersetzt das Hero-Bild nie in der Oberfläche und ist kein neues Original. Ein Test liest die echten
// Abmessungen, das Format und die Bytes beider Dateien und hält sie mit diesen Angaben deckungsgleich.
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
} as const

export const TEILENBILD = {
  pfad: '/images/hero-bali-og.jpg',
  breite: 1200,
  hoehe: 630,
  mime: 'image/jpeg',
  /** Original, aus dem das Vorschaubild abgeleitet ist. */
  quelle: STARTSEITENBILD.pfad,
  medium: 'ki-illustration',
  alt: 'Jetnity: Deine ganze Reise. KI-Illustration von Palmen und Reisterrassen im Sonnenuntergang, Motiv Bali',
} as const

/** Ziel des Links «Bildnachweis» am Hero-Bild. */
export const BILDNACHWEISE_ID = 'bildnachweise'
