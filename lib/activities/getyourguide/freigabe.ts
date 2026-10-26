// lib/activities/getyourguide/freigabe.ts
//
// Anwendungsfreigabe für das dokumentierte manuelle Widget.
// Kein Env, kein Speicher und kein URL-Parameter öffnet einen anderen Weg.

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

const OFFEN: GetYourGuideFreigabe = Object.freeze({ status: 'bereit' })

/** Das dokumentierte manuelle Widget ist der freigegebene Anwendungsweg. */
export function anwendungsFreigabe(): GetYourGuideFreigabe {
  return OFFEN
}

/** Geschlossene Gegenprobe. Die Anwendung ruft das nicht auf. */
export function geschlosseneFreigabe(): GetYourGuideFreigabe {
  return GESCHLOSSEN
}

export function freigabeIstOffen(freigabe: GetYourGuideFreigabe): boolean {
  return freigabe.status === 'bereit'
}
