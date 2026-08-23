// lib/route/verbindung.ts
//
// Connection Duration und Flughafenwechsel nur aus strukturierten Zeiten/IATA.
// Indizes sind nach Flattening global eindeutig; legIndex bleibt erhalten.
// Fehlende oder unbrauchbare Zeiten erzeugen keine erfundene Dauer.
//
// Frei von Next und Providern.

import { umstiegMinuten } from '@/lib/flights/zeit'
import type { RouteSegment, RouteVerbindung } from '@/lib/route/domain'
import { iataLesen } from '@/lib/route/referenz'

function verbindungenAusSegmenten(
  segmente: readonly RouteSegment[],
  optionen: { legIndex?: number; segmentOffset?: number } = {},
): RouteVerbindung[] {
  const legIndex = optionen.legIndex ?? 0
  const offset = optionen.segmentOffset ?? 0
  const verbindungen: RouteVerbindung[] = []
  for (let i = 1; i < segmente.length; i++) {
    const vorher = segmente[i - 1]
    const nachher = segmente[i]
    if (!vorher || !nachher) continue

    const ankunftCode = iataLesen(vorher.destination.airportCode)
    const abflugCode = iataLesen(nachher.origin.airportCode)
    const airportChange = airportWechsel(ankunftCode, abflugCode)
    const durationMinutes =
      airportChange === false
        ? dauerAusZeiten(
            vorher.arrivalDate,
            vorher.arrivalTime,
            nachher.departureDate,
            nachher.departureTime,
          )
        : null

    verbindungen.push({
      airportCode: ankunftCode,
      countryCode: vorher.destination.countryCode,
      city: vorher.destination.city,
      country: vorher.destination.country,
      durationMinutes,
      airportChange,
      legIndex,
      fromSegmentIndex: offset + i - 1,
      toSegmentIndex: offset + i,
    })
  }
  return verbindungen
}

export function verbindungenAusLegs(legs: readonly { segments: RouteSegment[] }[]): RouteVerbindung[] {
  const verbindungen: RouteVerbindung[] = []
  let offset = 0
  for (const [legIndex, bein] of legs.entries()) {
    verbindungen.push(...verbindungenAusSegmenten(bein.segments, { legIndex, segmentOffset: offset }))
    offset += bein.segments.length
  }
  return verbindungen
}

export function verbindungNachSegment(
  verbindungen: readonly RouteVerbindung[],
  fromSegmentIndex: number,
): RouteVerbindung | null {
  return verbindungen.find((eintrag) => eintrag.fromSegmentIndex === fromSegmentIndex) ?? null
}

function airportWechsel(ankunftCode: string | null, abflugCode: string | null): boolean | null {
  if (!ankunftCode || !abflugCode) return null
  return ankunftCode !== abflugCode
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
