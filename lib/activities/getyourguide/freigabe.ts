// lib/activities/getyourguide/freigabe.ts
//
// Geschlossene Anwendungsfreigabe für GetYourGuide.
// Kein Env, kein Speicher, kein URL-Parameter, kein Renderer.

export const GYG_GRUENDE = [
  'konfiguration',
  'berechtigung',
  'analyzer',
  'manueller_widget',
] as const

export type GygGrund = (typeof GYG_GRUENDE)[number]

export type GetYourGuideFreigabe =
  | { readonly status: 'geschlossen'; readonly gruende: readonly GygGrund[] }
  | { readonly status: 'bereit' }

const GESCHLOSSEN: GetYourGuideFreigabe = Object.freeze({
  status: 'geschlossen',
  gruende: Object.freeze([...GYG_GRUENDE]),
})

/** Die Anwendung bleibt geschlossen. Diese Funktion hat keinen offenen Zweig. */
export function anwendungsFreigabe(): GetYourGuideFreigabe {
  return GESCHLOSSEN
}

export function freigabeIstOffen(freigabe: GetYourGuideFreigabe): boolean {
  return freigabe.status === 'bereit'
}
