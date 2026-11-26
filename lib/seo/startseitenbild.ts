// Das eine Bild der Startseite: Hero, Open Graph, Twitter und JSON-LD zeigen dasselbe
// freigegebene Foto mit Nachweis in `public/images/organisieren/Bildnachweise.txt`.
// Ein anderes Bild gehört erst hierher, wenn sein Nachweis belegt ist.

export const STARTSEITENBILD = {
  pfad: '/images/organisieren/nusa-penida.webp',
  breite: 800,
  hoehe: 450,
  ort: 'Nusa Penida, Indonesien',
  alt: 'Felsbucht mit türkisfarbenem Wasser und grüner Küste auf Nusa Penida in Indonesien',
} as const

/** Ziel des Links «Bildnachweis» am Hero-Bild. */
export const BILDNACHWEISE_ID = 'bildnachweise'
