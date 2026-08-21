// lib/trips/mobilitaet-felder.ts
//
// Strukturierte Mobilitätsfakten eines Transfer-Planpunkts.
// Frei von React, Next und Providern.

import {
  MOBILITY_EVIDENCES,
  MOBILITY_MODES,
  type MobilityEvidence,
  type MobilityMode,
  type TripItem,
} from '@/types/trips'

export const LEERE_MOBILITAET = {
  mobilityMode: null,
  originPlaceId: null,
  destinationPlaceId: null,
  originName: null,
  destinationName: null,
  connectionRef: null,
  mobilityChanges: null,
  mobilityEvidence: null,
} as const satisfies Pick<
  TripItem,
  | 'mobilityMode'
  | 'originPlaceId'
  | 'destinationPlaceId'
  | 'originName'
  | 'destinationName'
  | 'connectionRef'
  | 'mobilityChanges'
  | 'mobilityEvidence'
>

export function leereMobilitaet(): typeof LEERE_MOBILITAET {
  return { ...LEERE_MOBILITAET }
}

export function mobilityModeLesen(wert: unknown): MobilityMode | null {
  return (MOBILITY_MODES as readonly string[]).includes(wert as string)
    ? (wert as MobilityMode)
    : null
}

export function mobilityEvidenceLesen(wert: unknown): MobilityEvidence | null {
  return (MOBILITY_EVIDENCES as readonly string[]).includes(wert as string)
    ? (wert as MobilityEvidence)
    : null
}

export function istMobilitaetspunkt(punkt: Pick<TripItem, 'kind'>): boolean {
  return punkt.kind === 'transfer'
}

/**
 * Nur `kind = transfer` darf strukturierte Mobilitätsfakten tragen.
 * Altbestand und andere Arten bleiben leer – unbekannt, nicht erfunden.
 */
export function mobilitaetNormalisieren(punkt: TripItem): TripItem {
  if (punkt.kind !== 'transfer') {
    return { ...punkt, ...leereMobilitaet() }
  }
  const mode = mobilityModeLesen(punkt.mobilityMode)
  const originPlaceId = punkt.originPlaceId?.trim() || null
  const destinationPlaceId = punkt.destinationPlaceId?.trim() || null
  const originName = punkt.originName?.trim() || null
  const destinationName = punkt.destinationName?.trim() || null
  const connectionRef = punkt.connectionRef?.trim() || null
  const hatFakt = Boolean(mode || originPlaceId || destinationPlaceId || originName || destinationName)
  return {
    ...punkt,
    mobilityMode: mode,
    originPlaceId,
    destinationPlaceId,
    originName,
    destinationName,
    connectionRef,
    mobilityChanges:
      typeof punkt.mobilityChanges === 'number' && Number.isInteger(punkt.mobilityChanges)
        ? punkt.mobilityChanges
        : null,
    mobilityEvidence: hatFakt ? 'user' : mobilityEvidenceLesen(punkt.mobilityEvidence),
  }
}
