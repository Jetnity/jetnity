/** Approved white/mint pairs for the homepage and the light workspace. */

export const WHITE_MINT = {
  canvas: '#F7FCF9',
  card: '#FFFFFF',
  navigation: '#EFF7F2',
  ink: '#143E33',
  selected: '#E1F1E8',
  edge: '#DCE9E1',
  muted: '#3A564C',
  control: '#2F5A4E',
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
