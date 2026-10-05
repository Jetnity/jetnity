// lib/flights/duffel/adapter.ts
//
// Erster FlightProvider: Duffel Flights API (Offer Requests).
// Kein offener Proxy. Keine Passagiernamen, keine Geburtsdaten, keine Buchung.

import {
  DUFFEL_API_BASIS,
  DUFFEL_LIEFERANT_TIMEOUT_MS,
  DUFFEL_PFADE,
  DUFFEL_VERSION,
} from '@/lib/flights/duffel/konfiguration'
import { airportEventInstantsAufloesen } from '@/lib/flights/airport-event-instant'
import { duffelAntwortMappen } from '@/lib/flights/duffel/mapping'
import { fetchAlsHttp, type SucheHttp } from '@/lib/flights/duffel/http'
import { FLUG_PROVIDER_DUFFEL, FLUG_SUCHE_GRENZEN, type FlugSuchanfrage } from '@/lib/flights/domain'
import { FlugProviderFehler, type FlugProvider, type FlugProviderTreffer } from '@/lib/flights/provider'

const DUFFEL_KABINE = {
  economy: 'economy',
  premium_economy: 'premium_economy',
  business: 'business',
  first: 'first',
} as const

function anfrageKoerper(anfrage: FlugSuchanfrage): Record<string, unknown> {
  const slices = anfrage.legs.map((bein) => ({
    origin: bein.origin,
    destination: bein.destination,
    departure_date: bein.date,
  }))

  const passengers: Array<Record<string, string>> = []
  for (let i = 0; i < anfrage.passengers.adults; i++) {
    passengers.push({ type: 'adult' })
  }
  for (let i = 0; i < anfrage.passengers.children; i++) {
    passengers.push({ type: 'child' })
  }
  for (let i = 0; i < anfrage.passengers.infants; i++) {
    passengers.push({ type: 'infant_without_seat' })
  }

  const data: Record<string, unknown> = {
    slices,
    passengers,
    cabin_class: DUFFEL_KABINE[anfrage.cabin],
  }
  if (anfrage.stopPreference === 'nonstop') data.max_connections = 0
  if (anfrage.stopPreference === 'at_most_one') data.max_connections = 1

  return { data }
}

const RETRIEVED_AT_MUSTER = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

/**
 * Kleiner Clock-Port nur für deterministische Adapter-Tests.
 * Production nutzt echte Serverzeit über den Default `() => new Date()`.
 */
export type DuffelAdapterUhr = () => Date

function retrievedAtAusUhr(uhr: DuffelAdapterUhr): string {
  const datum = uhr()
  if (!(datum instanceof Date)) {
    throw new FlugProviderFehler('error', 'Die Flugsuche ist fehlgeschlagen.')
  }
  const ms = datum.getTime()
  if (!Number.isFinite(ms)) {
    throw new FlugProviderFehler('error', 'Die Flugsuche ist fehlgeschlagen.')
  }
  const iso = datum.toISOString()
  if (!RETRIEVED_AT_MUSTER.test(iso)) {
    throw new FlugProviderFehler('error', 'Die Flugsuche ist fehlgeschlagen.')
  }
  return iso
}

export function duffelAdapter(
  token: string,
  http: SucheHttp = fetchAlsHttp,
  uhr: DuffelAdapterUhr = () => new Date(),
): FlugProvider {
  return {
    id: FLUG_PROVIDER_DUFFEL,
    async suchen(anfrage: FlugSuchanfrage): Promise<FlugProviderTreffer> {
      const steuer = new AbortController()
      const timer = setTimeout(() => steuer.abort(), FLUG_SUCHE_GRENZEN.timeoutMs)
      const url =
        `${DUFFEL_API_BASIS}${DUFFEL_PFADE.suche}` +
        `?return_offers=true&supplier_timeout=${DUFFEL_LIEFERANT_TIMEOUT_MS}`

      let antwort: { ok: boolean; status: number; json: () => Promise<unknown> }
      try {
        antwort = await http.post(url, {
          headers: {
            authorization: `Bearer ${token}`,
            'duffel-version': DUFFEL_VERSION,
            accept: 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify(anfrageKoerper(anfrage)),
          signal: steuer.signal,
        })
      } catch (fehler) {
        if (fehler instanceof Error && fehler.name === 'AbortError') {
          throw new FlugProviderFehler('timeout', 'Die Flugsuche hat zu lange gedauert.')
        }
        throw new FlugProviderFehler('error', 'Die Flugsuche ist fehlgeschlagen.')
      } finally {
        clearTimeout(timer)
      }

      if (antwort.status === 401 || antwort.status === 403) {
        throw new FlugProviderFehler('unavailable', 'Der Fluganbieter hat die Suche abgelehnt.')
      }
      if (!antwort.ok) {
        throw new FlugProviderFehler('error', 'Der Fluganbieter hat die Suche nicht beantwortet.')
      }

      let roh: unknown
      try {
        roh = await antwort.json()
      } catch {
        throw new FlugProviderFehler('invalid', 'Der Fluganbieter hat keine lesbare Antwort geliefert.')
      }

      // Observation-Zeit des erfolgreich gelesenen Snapshots. Nicht aus dem Payload.
      const retrievedAt = retrievedAtAusUhr(uhr)

      const gemappt = duffelAntwortMappen(roh)
      if (gemappt.invalid) {
        throw new FlugProviderFehler('invalid', 'Die Flugdaten waren unbrauchbar.')
      }
      const options = gemappt.options.slice(0, FLUG_SUCHE_GRENZEN.angebote)
      const behalteneIds = new Set(options.map((option) => option.id))
      const airportTimezoneEvidence = gemappt.airportTimezoneEvidence.filter((eintrag) =>
        behalteneIds.has(eintrag.optionId),
      )
      const aufgeloest = airportEventInstantsAufloesen({ options, airportTimezoneEvidence })
      return {
        options,
        partial: gemappt.partial,
        retrievedAt,
        airportTimezoneEvidence,
        airportEventInstantEvidence: aufgeloest.airportEventInstantEvidence,
        airportEventInstantIssues: aufgeloest.airportEventInstantIssues,
      }
    },
  }
}
