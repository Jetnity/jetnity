// lib/activities/konto-uebernahme.ts
//
// Vertrauensgrenze der kommerziellen Aktivitätsübernahme im Konto.
//
// Der Browser darf nur identifiers liefern. Preis, Provider, External-Ref und
// der Termin kommen aus Nachweis plus Reisegraph – oder die Übernahme fällt
// fail closed.
//
// Frei von Next und Supabase.

import type { ActivityNachweis } from '@/lib/activities/nachweis'
import { activityNachweisFehler, activityNachweisKontextAusGraph } from '@/lib/activities/nachweis'
import {
  activityReisegraphMitTimeslotPruefen,
  type ActivityReisegraphFehlerArt,
} from '@/lib/activities/reisegraph'
import { alsActivityMomentaufnahme, type ActivityMomentaufnahme } from '@/lib/activities/uebernahme'
import type { Trip } from '@/types/trips'

export type ActivityKontoUebernahmeEingabe = {
  tripId: string
  stageId: string
  dayId: string
  optionId: string
}

export type ActivityKontoUebernahmeFehlerArt =
  | ActivityReisegraphFehlerArt
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type ActivityKontoUebernahmeErgebnis =
  | {
      ok: true
      aufnahme: ActivityMomentaufnahme
      stageId: string
      dayId: string
    }
  | { ok: false; art: ActivityKontoUebernahmeFehlerArt; message: string }

export async function activityKontoUebernahmePruefen(
  eingabe: ActivityKontoUebernahmeEingabe,
  ports: { nachweis: ActivityNachweis | null; reise: Trip },
): Promise<ActivityKontoUebernahmeErgebnis> {
  if (!ports.nachweis) return activityNachweisFehler('unavailable')

  const vorab = activityReisegraphMitTimeslotPruefen(
    ports.reise,
    {
      tripId: eingabe.tripId,
      stageId: eingabe.stageId,
      dayId: eingabe.dayId,
    },
    null,
  )
  if (!vorab.ok) return vorab

  const nachgewiesen = await ports.nachweis.nachweisen({
    optionId: eingabe.optionId,
    kontext: {
      ...activityNachweisKontextAusGraph(ports.reise, vorab),
      timeslot: null,
    },
  })
  if (!nachgewiesen.ok) return nachgewiesen

  const graph = activityReisegraphMitTimeslotPruefen(
    ports.reise,
    {
      tripId: eingabe.tripId,
      stageId: eingabe.stageId,
      dayId: eingabe.dayId,
    },
    nachgewiesen.option.timeslot,
  )
  if (!graph.ok) return graph

  const aufnahme = alsActivityMomentaufnahme(nachgewiesen.option, graph.tag.dayDate)
  if (!aufnahme) return activityNachweisFehler('invalid')

  return {
    ok: true,
    aufnahme,
    stageId: graph.etappe.id,
    dayId: graph.tag.id,
  }
}
