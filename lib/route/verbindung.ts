// lib/route/verbindung.ts
//
// Connection Duration und Flughafenwechsel nur aus strukturierten Zeiten/IATA.
// Fehlende oder unbrauchbare Zeiten erzeugen keine erfundene Dauer.
//
// Frei von Next und Providern.

import { umstiegMinuten } from '@/lib/flights/zeit'
import type { RouteSegment, RouteVerbindung } from '@/lib/route/domain'
import { iataLesen } from '@/lib/route/referenz'

export function verbindungenAusSegmenten(segmente: readonly RouteSegment[]): RouteVerbindung[] {
  const verbindungen: RouteVerbindung[] = []
  for (let i = 1; i < segmente.length; i++) {
    const vorher = segmente[i - 1]
    const nachher = segmente[i]
    if (!vorher || !nachher) continue

    const ankunftCode = iataLesen(vorher.destination.airportCode)
    const abflugCode = iataLesen(nachher.origin.airportCode)
    const airportChange =
      ankunftCode && abflugCode ? ankunftCode !== abflugCode : ankunftCode || abflugCode ? true : null

    const durationMinutes = dauerAusZeiten(
      vorher.arrivalDate,
      vorher.arrivalTime,
      nachher.departureDate,
      nachher.departureTime,
    )

    verbindungen.push({
      airportCode: ankunftCode,
      countryCode: vorher.destination.countryCode,
      city: vorher.destination.city,
      country: vorher.destination.country,
      durationMinutes,
      airportChange,
      fromSegmentIndex: i - 1,
      toSegmentIndex: i,
    })
  }
  return verbindungen
}

function dauerAusZeiten(
  ankunftDatum: string | null,
  ankunftZeit: string | null,
  abflugDatum: string | null,
  abflugZeit: string | null,
): number | null {
  if (!ankunftDatum || !ankunftZeit || !abflugDatum || !abflugZeit) return null
  const minuten = umstiegMinuten(
    { date: ankunftDatum, time: ankunftZeit },
    { date: abflugDatum, time: abflugZeit },
  )
  if (minuten === null || minuten < 0) return null
  return minuten
}
