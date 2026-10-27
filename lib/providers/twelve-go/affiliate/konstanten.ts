// lib/providers/twelve-go/affiliate/konstanten.ts
//
// Öffentliche 12Go-Affiliate-Konstanten. Kein Secret, kein API-Zugang.
// Die Partner-ID ist eine öffentliche Attributionskennung.

export const TWELVE_GO_HOST = '12go.asia'
export const TWELVE_GO_PARTNER_ID = '17323861'
export const TWELVE_GO_SUB_ID = 'jetnity-mobility-route'

export const TWELVE_GO_ORT_ARTEN = ['city', 'island'] as const
export type TwelveGoOrtArt = (typeof TWELVE_GO_ORT_ARTEN)[number]

/**
 * Geprüfte Strecke: kanonische Jetnity-Ortskennung plus die exakte
 * partnergenerierte Pfadform. Namen werden hier nicht in Slugs verwandelt.
 */
export type TwelveGoGepruefteRoute = {
  readonly originPlaceId: string
  readonly destinationPlaceId: string
  readonly originKind: TwelveGoOrtArt
  readonly destinationKind: TwelveGoOrtArt
  readonly path: string
}

/**
 * Bewusst leer.
 *
 * Die Beispiel-URL `/de/travel/Bangkok/Koh-Chang/` ist partnergeneriert,
 * aber an keine kanonische Jetnity-Ortskennung gebunden. `TripStage` trägt
 * keine quellengeprüfte Ortsart. Ohne beides bleibt jede Kante die
 * allgemeine Suche.
 */
export const TWELVE_GO_GEPRUEFTE_ROUTEN: readonly TwelveGoGepruefteRoute[] = Object.freeze([])
