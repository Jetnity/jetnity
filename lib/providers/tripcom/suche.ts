import { hotelZeitraumAusEtappe } from '@/lib/hotels/quartier-kontext'
import type { Trip } from '@/types/trips'

// Unveränderte Ausgaben des offiziellen Linkgenerators, 01.11.2026.
// Kein Reisekontext und keine Nutzerkennung dürfen an diese URLs angehängt werden.
export const TRIPCOM_SUCHLINKS = {
  hotels: 'https://de.trip.com/hotels/?locale=de-DE&curr=CHF&Allianceid=11162929&SID=334618271&trip_sub1=jetnity-hotels&trip_sub3=D20822433',
  flights: 'https://de.trip.com/flights/?locale=de-DE&curr=CHF&Allianceid=11162929&SID=334618271&trip_sub1=jetnity-flights&trip_sub3=D20822461',
} as const

/** Nur lokale Eingabehilfe. Ein Aufenthalt ist keine Anbieter-Verfügbarkeit. */
export function tripComAufenthalte(reise: Pick<Trip, 'stages' | 'startDate' | 'endDate'>) {
  return [...reise.stages].sort((a, b) => a.position - b.position).map((etappe) => ({
    id: etappe.id,
    ort: etappe.name,
    zeitraum: hotelZeitraumAusEtappe(reise, etappe),
  }))
}
