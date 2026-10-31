// lib/providers/twelve-go/widget/entscheidung.ts
//
// Einwilligung für höchstens ein allgemeines Formular.
// Kein Netz, kein DOM, keine Beispielstrecke, keine Reisedaten.

export const TWELVE_GO_WIDGET_PHASEN = [
  'wahl',
  'abgelehnt',
  'wartet',
  'sichtbar',
  'zurueckgezogen',
  'fehler',
  'blockiert',
] as const

export type TwelveGoWidgetPhase = (typeof TWELVE_GO_WIDGET_PHASEN)[number]
export type TwelveGoWidgetSkript = 'keins' | 'allgemein'

export type TwelveGoWidgetZustand = {
  phase: TwelveGoWidgetPhase
  generation: number
  reiseId: string | null
  reihenfolge: string | null
  skript: TwelveGoWidgetSkript
  instanz: 0 | 1
}

export type TwelveGoWidgetEreignis =
  | { typ: 'ablehnen' }
  | { typ: 'einwilligen' }
  | { typ: 'geladen'; generation: number }
  | { typ: 'fehlgeschlagen'; generation: number }
  | { typ: 'schliessen' }
  | { typ: 'erneut' }
  | { typ: 'reise'; reiseId: string }
  | { typ: 'reihenfolge'; schluessel: string }

export function twelveGoWidgetAnfang(reiseId: string | null, reihenfolge: string | null): TwelveGoWidgetZustand {
  return {
    phase: 'wahl',
    generation: 1,
    reiseId,
    reihenfolge,
    skript: 'keins',
    instanz: 0,
  }
}

function ohneSkript(
  zustand: TwelveGoWidgetZustand,
  phase: TwelveGoWidgetPhase,
  generation = zustand.generation,
): TwelveGoWidgetZustand {
  return { ...zustand, phase, generation, skript: 'keins', instanz: 0 }
}

/**
 * `ausfuehrbar` kommt nur aus der synthetischen Prüfhnaht.
 * In der Besucherfläche bleibt der Schalter falsch, und selbst eine
 * Einwilligung setzt dann kein Skript.
 */
export function twelveGoWidgetReduzieren(
  zustand: TwelveGoWidgetZustand,
  ereignis: TwelveGoWidgetEreignis,
  ausfuehrbar: boolean,
): TwelveGoWidgetZustand {
  if (ereignis.typ === 'reise') {
    if (ereignis.reiseId === zustand.reiseId) return zustand
    return { ...ohneSkript(zustand, 'wahl', zustand.generation + 1), reiseId: ereignis.reiseId }
  }

  if (ereignis.typ === 'reihenfolge') {
    if (ereignis.schluessel === zustand.reihenfolge) return zustand
    return { ...ohneSkript(zustand, 'wahl', zustand.generation + 1), reihenfolge: ereignis.schluessel }
  }

  if (ereignis.typ === 'geladen' || ereignis.typ === 'fehlgeschlagen') {
    if (!ausfuehrbar) return zustand
    if (ereignis.generation !== zustand.generation) return zustand
    if (zustand.phase !== 'wartet') return zustand
    if (ereignis.typ === 'fehlgeschlagen') return ohneSkript(zustand, 'fehler')
    return { ...zustand, phase: 'sichtbar', skript: 'allgemein', instanz: 1 }
  }

  if (ereignis.typ === 'ablehnen') {
    if (zustand.phase === 'sichtbar' || zustand.phase === 'wartet') return zustand
    return ohneSkript(zustand, 'abgelehnt')
  }

  if (ereignis.typ === 'einwilligen') {
    if (!ausfuehrbar) return ohneSkript(zustand, 'blockiert')
    if (zustand.phase === 'sichtbar' || zustand.phase === 'wartet') return zustand
    return ohneSkript(zustand, 'wartet', zustand.generation + 1)
  }

  if (ereignis.typ === 'schliessen') return ohneSkript(zustand, 'zurueckgezogen')

  if (zustand.phase === 'sichtbar' || zustand.phase === 'wartet') return zustand
  return ohneSkript(zustand, 'wahl')
}
