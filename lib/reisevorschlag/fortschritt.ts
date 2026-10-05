// lib/reisevorschlag/fortschritt.ts
//
// Was die Oberfläche zeigt, während ein Vorschlag entsteht.
//
// Die Phasen folgen der tatsächlichen Arbeit dieses Weges – Verstehen, Route,
// Transfers, Tagesplan, Prüfung – und nicht einer erfundenen Prozentanzeige.
// Die Uhr auf dem Gerät kennt den Serverzustand nicht; sie wechselt die Sätze
// nach verstrichener Zeit, ohne zu behaupten, ein Flugpreis würde geprüft.
//
// Frei von Next, Supabase und `process.env`.

export type Planungsphase = {
  /** Ab dieser Laufzeit (einschliesslich) gilt der Satz. */
  abMs: number
  text: string
}

export const PLANUNGSPHASEN: readonly Planungsphase[] = [
  { abMs: 0, text: 'Deine Wünsche werden verstanden …' },
  { abMs: 8_000, text: 'Die sinnvollste Route wird zusammengestellt …' },
  { abMs: 20_000, text: 'Reise- und Transferlogik wird optimiert …' },
  { abMs: 40_000, text: 'Der Tagesplan wird erstellt …' },
  { abMs: 65_000, text: 'Deine Vorgaben werden abschliessend geprüft …' },
]

/** Welche Phase nach `laufzeitMs` gilt. Keine Prozente. */
export function phasenindex(laufzeitMs: number): number {
  const dauer = Math.max(0, laufzeitMs)
  let index = 0
  for (let stelle = 0; stelle < PLANUNGSPHASEN.length; stelle += 1) {
    if (dauer >= PLANUNGSPHASEN[stelle].abMs) index = stelle
  }
  return index
}

/** Der Satz, der nach `laufzeitMs` Wartezeit gilt. */
export function planungsphase(laufzeitMs: number): string {
  return PLANUNGSPHASEN[phasenindex(laufzeitMs)].text
}
