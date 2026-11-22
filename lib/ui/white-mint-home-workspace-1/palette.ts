/** Approved white/mint pairs for the homepage and the light workspace. */

export const WHITE_MINT = {
  canvas: '#F2F7F4',
  card: '#FDFEFD',
  navigation: '#E9F1EC',
  ink: '#1B2A26',
  selected: '#DCEBE2',
  edge: '#D3E0D8',
  muted: '#4A5F57',
  control: '#46665B',
  beige: '#F5F4EE',
} as const

export type Rgb = readonly [number, number, number]

export function hexNachRgb(hex: string): Rgb {
  const wert = hex.replace('#', '')
  const voll = wert.length === 3 ? [...wert].map((teil) => teil + teil).join('') : wert
  return [
    Number.parseInt(voll.slice(0, 2), 16),
    Number.parseInt(voll.slice(2, 4), 16),
    Number.parseInt(voll.slice(4, 6), 16),
  ]
}

function kanal(wert: number) {
  const anteil = wert / 255
  return anteil <= 0.04045 ? anteil / 12.92 : ((anteil + 0.055) / 1.055) ** 2.4
}

export function kontrast(vordergrund: Rgb, hintergrund: Rgb) {
  const helligkeit = (farbe: Rgb) => 0.2126 * kanal(farbe[0]) + 0.7152 * kanal(farbe[1]) + 0.0722 * kanal(farbe[2])
  const erste = helligkeit(vordergrund)
  const zweite = helligkeit(hintergrund)
  const [hell, dunkel] = erste > zweite ? [erste, zweite] : [zweite, erste]
  return (hell + 0.05) / (dunkel + 0.05)
}

export function aehnlich(gemessen: Rgb | null, hex: string, spielraum = 2) {
  if (!gemessen) return false
  const ziel = hexNachRgb(hex)
  return gemessen.every((kanalwert, index) => Math.abs(kanalwert - ziel[index]) <= spielraum)
}
