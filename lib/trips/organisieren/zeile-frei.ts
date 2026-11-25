// Wie weit die erste gespeicherte Zeile über der fixierten Handy-Leiste liegen muss.
// Dieselbe Bedingung wie in WorkspaceTripChrome: unter 360 px, unter 500 px Höhe,
// grosse Schrift oder offene Tastatur steht die Leiste im Fluss und deckt nichts.

export const ORGANISIEREN_ZEILE_LUFT_PX = 8

export type OrganisierenZeileKasten = { readonly top: number; readonly bottom: number }

export function organisierenDockFest(messung: {
  breite: number
  hoehe: number
  schriftPx: number
  tastatur: boolean
}): boolean {
  const fluss = messung.schriftPx >= 24 || messung.breite < 360 || messung.hoehe < 500 || messung.tastatur
  return !fluss && messung.breite < 1024
}

/** Scroll nach unten, damit die Zeile über der Leiste endet. 0, wenn sie schon frei liegt. */
export function organisierenZeileScroll(
  zeile: OrganisierenZeileKasten,
  dockOben: number | null,
  viewportHoehe: number,
): number {
  if (dockOben == null || viewportHoehe <= 0) return 0
  if (zeile.bottom <= 0) return 0
  const ziel = dockOben - ORGANISIEREN_ZEILE_LUFT_PX
  if (zeile.bottom <= ziel && zeile.top < viewportHoehe) return 0
  const hoehe = zeile.bottom - zeile.top
  if (hoehe <= 0) return 0
  if (hoehe > ziel) return Math.max(0, zeile.top - ORGANISIEREN_ZEILE_LUFT_PX)
  return Math.max(0, zeile.bottom - ziel)
}
