// lib/reiseaenderung/nutzlast.ts
//
// Der geprüfte Reisegraph als Nutzlast von public.reise_aendern().
//
// Kommerzielle Felder fehlen bewusst: Die Funktion liest sie nicht und
// übernimmt bestehende Werte aus der Tabelle.

import type { Reisegraph, TripItem } from '@/types/trips'
import type { Json } from '@/types/supabase'

function punktNutzlast(punkt: TripItem, dayId: string | null) {
  return {
    id: punkt.id,
    day_id: dayId,
    stage_id: punkt.stageId,
    kind: punkt.kind,
    title: punkt.title,
    note: punkt.note,
    position: punkt.position,
    starts_on: punkt.startsOn,
    starts_at: punkt.startsAt,
    ends_on: punkt.endsOn,
    ends_at: punkt.endsAt,
  }
}

export function aenderungAlsNutzlast(
  graph: Reisegraph,
  mutationId: string,
  basisRevision: number,
): Json {
  return {
    trip_id: graph.id,
    mutation_id: mutationId,
    basis_revision: basisRevision,
    title: graph.title,
    origin: graph.origin,
    origin_place_id: graph.originPlaceId,
    start_date: graph.startDate,
    end_date: graph.endDate,
    travellers: graph.travellers,
    currency: graph.currency,
    budget_amount: graph.budgetAmount,
    pace: graph.pace,
    interests: graph.interests,
    travel_wish: graph.travelWish,
    stages: graph.stages.map((etappe) => ({
      id: etappe.id,
      position: etappe.position,
      name: etappe.name,
      country_code: etappe.countryCode,
      arrival_date: etappe.arrivalDate,
      departure_date: etappe.departureDate,
      latitude: etappe.latitude,
      longitude: etappe.longitude,
      place_id: etappe.placeId,
    })),
    days: graph.days.map((tag) => ({
      id: tag.id,
      stage_id: tag.stageId,
      day_index: tag.dayIndex,
      day_date: tag.dayDate,
      title: tag.title,
      items: tag.items.map((punkt) => punktNutzlast(punkt, tag.id)),
    })),
    ungeplante: graph.ohneTag.map((punkt) => punktNutzlast(punkt, null)),
  }
}
