import type { FlugSuchanfrage } from '@/lib/flights/domain'
import type {
  FlightProviderExternalRequestContext,
  FlightProviderSearchRequest,
} from '@/lib/providers/flights/domain'

/**
 * Projects a validated/canonical `FlugSuchanfrage` into the provider-neutral
 * request. Ranking-only `context` is dropped. `stopPreference` is copied
 * losslessly as canonical `FlugStoppPraeferenz`; provider-specific fields
 * such as Duffel `max_connections` are not invented here. Legs stay in
 * given order; continuity is not inferred. `market` / `locale` are supplied
 * separately as external-request context, not derived from trip dates.
 *
 * Validation remains on `flugSuchanfrageSchema`. This mapper does not invent
 * a second 1–6 / passenger / cabin / currency validator.
 */
export function flightProviderSearchRequestAus(
  anfrage: FlugSuchanfrage,
  anfrageKontext: FlightProviderExternalRequestContext,
): FlightProviderSearchRequest {
  return {
    legs: anfrage.legs.map((bein) => ({
      originIata: bein.origin,
      destinationIata: bein.destination,
      date: bein.date,
    })),
    adults: anfrage.passengers.adults,
    children: anfrage.passengers.children,
    infants: anfrage.passengers.infants,
    cabin: anfrage.cabin,
    stopPreference: anfrage.stopPreference,
    currency: anfrage.currency,
    market: anfrageKontext.market,
    locale: anfrageKontext.locale,
  }
}
