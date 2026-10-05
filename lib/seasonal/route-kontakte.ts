// lib/seasonal/route-kontakte.ts
//
// Seasonal liest Airport-Zeitkontakte nur aus der Foundation-D-Projektion.
// Keine zweite Pairing-Logik über abgeflachte Segmente.

import type { RouteFacts } from '@/lib/route/domain'
import { routeKontaktZeit } from '@/lib/route/kontakte'

export type SeasonalZeitkontakt = {
  start: string | null
  end: string | null
}

export { routeKontaktZeit }

export function airportKontakte(route: RouteFacts, code: string): SeasonalZeitkontakt[] {
  return route.airportContacts
    .filter((kontakt) => kontakt.airportCode === code)
    .map((kontakt) => ({ start: kontakt.start, end: kontakt.end }))
}

export function providerRouteKontakte(route: RouteFacts): Array<{
  airportCode: string
  countryCode: string | null
  start: string | null
  end: string | null
}> {
  return [...route.airportContacts]
}
