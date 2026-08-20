// lib/hotels/konto-uebernahme.ts
//
// Vertrauensgrenze der kommerziellen Hotelübernahme im Konto.
//
// Der Browser darf nur identifiers liefern. Preis, Provider, External-Ref und
// der Zeitraum kommen aus Nachweis plus Reisegraph – oder die Übernahme fällt
// fail closed.
//
// Frei von Next und Supabase.

import type { HotelNachweis } from '@/lib/hotels/nachweis'
import { hotelNachweisFehler, hotelNachweisKontextAusGraph } from '@/lib/hotels/nachweis'
import { hotelReisegraphPruefen, type HotelReisegraphFehlerArt } from '@/lib/hotels/reisegraph'
import { alsHotelMomentaufnahme, type HotelMomentaufnahme } from '@/lib/hotels/uebernahme'
import type { Trip } from '@/types/trips'

export type HotelKontoUebernahmeEingabe = {
  tripId: string
  stageId: string
  dayId: string | null
  optionId: string
}

export type HotelKontoUebernahmeFehlerArt =
  | HotelReisegraphFehlerArt
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type HotelKontoUebernahmeErgebnis =
  | {
      ok: true
      aufnahme: HotelMomentaufnahme
      stageId: string
      dayId: string | null
    }
  | { ok: false; art: HotelKontoUebernahmeFehlerArt; message: string }

export async function hotelKontoUebernahmePruefen(
  eingabe: HotelKontoUebernahmeEingabe,
  ports: { nachweis: HotelNachweis | null; reise: Trip },
): Promise<HotelKontoUebernahmeErgebnis> {
  const graph = hotelReisegraphPruefen(ports.reise, {
    tripId: eingabe.tripId,
    stageId: eingabe.stageId,
    dayId: eingabe.dayId,
  })
  if (!graph.ok) return graph

  if (!ports.nachweis) return hotelNachweisFehler('unavailable')

  const kontext = hotelNachweisKontextAusGraph(ports.reise, graph)
  const nachgewiesen = await ports.nachweis.nachweisen({ optionId: eingabe.optionId, kontext })
  if (!nachgewiesen.ok) return nachgewiesen

  const aufnahme = alsHotelMomentaufnahme(nachgewiesen.option, {
    checkIn: graph.checkIn,
    checkOut: graph.checkOut,
  })
  if (!aufnahme) return hotelNachweisFehler('invalid')

  return {
    ok: true,
    aufnahme,
    stageId: graph.etappe.id,
    dayId: graph.tag?.id ?? null,
  }
}
