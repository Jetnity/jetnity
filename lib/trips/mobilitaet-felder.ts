// lib/trips/mobilitaet-felder.ts
//
// Strukturierte Mobilitätsfakten eines Transfer-Planpunkts.
// Frei von React, Next und Providern.

import { leereMietwagen } from '@/lib/trips/mietwagen-felder'
import {
  MOBILITY_EVIDENCES,
  MOBILITY_MODES,
  type MobilityEvidence,
  type MobilityMode,
  type TripItem,
} from '@/types/trips'

const LEERE_MOBILITAET_MODUS = {
  mobilityMode: null,
  connectionRef: null,
  mobilityChanges: null,
  mobilityEvidence: null,
} as const satisfies Pick<TripItem, 'mobilityMode' | 'connectionRef' | 'mobilityChanges' | 'mobilityEvidence'>

const LEERE_ORTE = {
  originPlaceId: null,
  destinationPlaceId: null,
  originName: null,
  destinationName: null,
} as const satisfies Pick<TripItem, 'originPlaceId' | 'destinationPlaceId' | 'originName' | 'destinationName'>

const LEERE_MOBILITAET = {
  ...LEERE_MOBILITAET_MODUS,
  ...LEERE_ORTE,
} as const

export function leereMobilitaetModus(): typeof LEERE_MOBILITAET_MODUS {
  return { ...LEERE_MOBILITAET_MODUS }
}

export function leereMobilitaet(): typeof LEERE_MOBILITAET & ReturnType<typeof leereMietwagen> {
  return { ...LEERE_MOBILITAET, ...leereMietwagen() }
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
 * Nur `kind = transfer` darf Mobilitätsmodus, Verbindung und Umstiege tragen.
 * `rental_car` darf Origin/Destination als Abholung/Rückgabe behalten.
 * Altbestand und andere Arten bleiben leer – unbekannt, nicht erfunden.
 */
export function mobilitaetNormalisieren(punkt: TripItem): TripItem {
  if (punkt.kind === 'rental_car') {
    return {
      ...punkt,
      ...leereMobilitaetModus(),
      originPlaceId: punkt.originPlaceId?.trim() || null,
      destinationPlaceId: punkt.destinationPlaceId?.trim() || null,
      originName: punkt.originName?.trim() || null,
      destinationName: punkt.destinationName?.trim() || null,
    }
  }
  if (punkt.kind !== 'transfer') {
    return { ...punkt, ...LEERE_MOBILITAET }
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
