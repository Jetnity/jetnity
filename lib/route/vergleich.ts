// lib/route/vergleich.ts
//
// Vorher/Nachher einer Route. Nur strukturierte Transit-/Pfadänderungen.
//
// Frei von Next und Providern.

import type { RouteFacts } from '@/lib/route/domain'
import { routeFactsAusGraph } from '@/lib/route/ableitung'
import { routeKompakt } from '@/lib/route/anzeige'
import type { Trip } from '@/types/trips'

export type RouteAenderung = {
  geaendert: boolean
  vorherKompakt: string | null
  nachherKompakt: string | null
  entfernteTransitlaender: string[]
  neueTransitlaender: string[]
  fingerprintGeaendert: boolean
}

export function routeAenderungZwischen(
  vorher: Pick<Trip, 'days' | 'ohneTag'> | RouteFacts,
  nachher: Pick<Trip, 'days' | 'ohneTag'> | RouteFacts,
): RouteAenderung {
  const links = istRouteFacts(vorher) ? vorher : routeFactsAusGraph(vorher)
  const rechts = istRouteFacts(nachher) ? nachher : routeFactsAusGraph(nachher)
  const entfernteTransitlaender = links.transitCountryCodes.filter(
    (code) => !rechts.transitCountryCodes.includes(code),
  )
  const neueTransitlaender = rechts.transitCountryCodes.filter(
    (code) => !links.transitCountryCodes.includes(code),
  )
  const fingerprintGeaendert = links.fingerprint !== rechts.fingerprint
  const geaendert =
    fingerprintGeaendert ||
    entfernteTransitlaender.length > 0 ||
    neueTransitlaender.length > 0

  return {
    geaendert,
    vorherKompakt: routeKompakt(links) || null,
    nachherKompakt: routeKompakt(rechts) || null,
    entfernteTransitlaender,
    neueTransitlaender,
    fingerprintGeaendert,
  }
}

function istRouteFacts(wert: Pick<Trip, 'days' | 'ohneTag'> | RouteFacts): wert is RouteFacts {
  return 'quelle' in wert && 'transitCountryCodes' in wert && 'fingerprint' in wert
}
