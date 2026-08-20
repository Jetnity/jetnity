// lib/activities/tageskontext.ts
//
// Baut den Tageskontext nur aus vorhandenen Reisedaten.
// Keine erfundenen Öffnungszeiten, Wegezeiten oder minutengenauen Lücken.
//
// Frei von Next und Providern.

import {
  LEERE_ACTIVITY_EVIDENZ,
  activityZielKennungAus,
  type ActivityEvidenz,
  type ActivitySuchanfrage,
} from '@/lib/activities/domain'
import type { Zeitfenster } from '@/lib/activities/konflikt'
import type { ActivitySucheEingabe } from '@/lib/activities/schema'
import { geoPunktGueltig } from '@/lib/hotels/geo'
import type { Trip, TripDay, TripItem, TripStage } from '@/types/trips'

export type ActivityTageskontext = {
  anfrage: ActivitySuchanfrage | null
  bestehendeFenster: Zeitfenster[]
  evidenz: ActivityEvidenz
}

function hatKoordinaten(etappe: { latitude: number | null; longitude: number | null }): boolean {
  if (etappe.latitude === null || etappe.longitude === null) return false
  return geoPunktGueltig({ lat: etappe.latitude, lon: etappe.longitude })
}

function fensterAusPunkt(punkt: {
  startsOn: string | null
  startsAt: string | null
  endsOn: string | null
  endsAt: string | null
}): Zeitfenster {
  return {
    startsOn: punkt.startsOn,
    startsAt: punkt.startsAt,
    endsOn: punkt.endsOn,
    endsAt: punkt.endsAt,
  }
}

export function activitySucheEingabeAusReise(
  reise: Trip,
  etappe: TripStage,
  tag: TripDay | null,
): ActivitySucheEingabe {
  const punkte: TripItem[] = tag
    ? tag.items
    : [...reise.days.flatMap((eintrag) => eintrag.items), ...reise.ohneTag]

  return {
    stage: {
      id: etappe.id,
      name: etappe.name,
      placeId: etappe.placeId,
      latitude: etappe.latitude,
      longitude: etappe.longitude,
    },
    day: tag
      ? {
          id: tag.id,
          dayDate: tag.dayDate,
          stageId: tag.stageId,
        }
      : null,
    trip: {
      startDate: reise.startDate,
      endDate: reise.endDate,
      travellers: reise.travellers,
      currency: reise.currency,
      budgetAmount: reise.budgetAmount,
      interests: reise.interests,
      pace: reise.pace,
    },
    items: punkte.map((punkt) => ({
      id: punkt.id,
      kind: punkt.kind,
      title: punkt.title,
      startsOn: punkt.startsOn,
      startsAt: punkt.startsAt,
      endsOn: punkt.endsOn,
      endsAt: punkt.endsAt,
    })),
  }
}

export function tageskontextAusReise(eingabe: ActivitySucheEingabe): ActivityTageskontext {
  const name = eingabe.stage.name.trim()
  const hatOrt = name.length > 0
  const koordinaten = hatKoordinaten(eingabe.stage)
  const hatTag = eingabe.day !== null
  const hatDatum = Boolean(eingabe.day?.dayDate)
  const bestehendeFenster = eingabe.items.map(fensterAusPunkt)
  const hatBestehendePunkte = bestehendeFenster.length > 0
  const hatBelastbareZeiten = bestehendeFenster.some(
    (fenster) => fenster.startsAt !== null && fenster.endsAt !== null,
  )
  const hatInteressen = eingabe.trip.interests.length > 0
  const hatBudget = eingabe.trip.budgetAmount !== null && eingabe.trip.budgetAmount > 0

  const evidenz: ActivityEvidenz = {
    hatOrt,
    hatKoordinaten: koordinaten,
    hatTag,
    hatDatum,
    hatBestehendePunkte,
    hatBelastbareZeiten,
    hatInteressen,
    hatBudget,
  }

  if (!hatOrt) {
    return { anfrage: null, bestehendeFenster: [], evidenz: { ...LEERE_ACTIVITY_EVIDENZ } }
  }

  return {
    anfrage: {
      destinationPlaceId: activityZielKennungAus(eingabe.stage),
      destinationName: name,
      dayDate: eingabe.day?.dayDate ?? null,
      participants: eingabe.trip.travellers,
      currency: eingabe.trip.currency,
      budgetAmount: eingabe.trip.budgetAmount,
      interests: eingabe.trip.interests,
      pace: eingabe.trip.pace,
    },
    bestehendeFenster,
    evidenz,
  }
}
