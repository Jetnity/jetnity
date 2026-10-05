// lib/activities/reisegraph.ts
//
// Prüft Etappe, Tag und Datum gegen einen vertrauenswürdigen Reisegraphen.
// Client-Daten dürfen hier nicht die Source of Truth sein.
//
// Frei von Next und Providern.

import type { ActivityTimeslot } from '@/lib/activities/domain'
import type { Trip, TripDay, TripStage } from '@/types/trips'

export type ActivityReisegraphFehlerArt =
  | 'reise-fremd'
  | 'etappe-fremd'
  | 'tag-fremd'
  | 'tag-etappe'
  | 'tag-datum'
  | 'timeslot-tag'

export type ActivityReisegraphEingabe = {
  tripId: string
  stageId: string
  dayId: string
}

export type ActivityReisegraphErgebnis =
  | {
      ok: true
      etappe: TripStage
      tag: TripDay
    }
  | { ok: false; art: ActivityReisegraphFehlerArt; message: string }

const MELDUNG: Record<ActivityReisegraphFehlerArt, string> = {
  'reise-fremd': 'Diese Reise wurde nicht gefunden.',
  'etappe-fremd': 'Diese Etappe gehört nicht zur Reise.',
  'tag-fremd': 'Dieser Tag gehört nicht zur Reise.',
  'tag-etappe': 'Dieser Tag gehört nicht zu dieser Etappe.',
  'tag-datum': 'Dieser Tag hat kein belastbares Datum für eine zeitgebundene Aktivität.',
  'timeslot-tag': 'Der Termin dieser Aktivität passt nicht zum gewählten Reisetag.',
}

function fehler(art: ActivityReisegraphFehlerArt): ActivityReisegraphErgebnis {
  return { ok: false, art, message: MELDUNG[art] }
}

export function activityTimeslotPasstZumTag(
  timeslot: ActivityTimeslot | null,
  tag: Pick<TripDay, 'dayDate'>,
): boolean {
  if (!timeslot) return true
  if (tag.dayDate === null) return false
  if (timeslot.startsOn !== tag.dayDate) return false
  if (timeslot.endsOn !== null && timeslot.endsOn !== tag.dayDate) return false
  return true
}

export function activityReisegraphPruefen(
  reise: Trip,
  eingabe: ActivityReisegraphEingabe,
): ActivityReisegraphErgebnis {
  if (reise.id !== eingabe.tripId) return fehler('reise-fremd')

  const etappe = reise.stages.find((eintrag) => eintrag.id === eingabe.stageId)
  if (!etappe) return fehler('etappe-fremd')

  const tag = reise.days.find((eintrag) => eintrag.id === eingabe.dayId)
  if (!tag) return fehler('tag-fremd')
  if (tag.stageId !== etappe.id) return fehler('tag-etappe')

  return { ok: true, etappe, tag }
}

export function activityReisegraphMitTimeslotPruefen(
  reise: Trip,
  eingabe: ActivityReisegraphEingabe,
  timeslot: ActivityTimeslot | null,
): ActivityReisegraphErgebnis {
  const graph = activityReisegraphPruefen(reise, eingabe)
  if (!graph.ok) return graph
  if (timeslot && graph.tag.dayDate === null) return fehler('tag-datum')
  if (!activityTimeslotPasstZumTag(timeslot, graph.tag)) return fehler('timeslot-tag')
  return graph
}
