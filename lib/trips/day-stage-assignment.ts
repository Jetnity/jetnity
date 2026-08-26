// lib/trips/day-stage-assignment.ts
//
// Herkunft der Day→Stage-Zuordnung. Guest und Account teilen dieselbe
// fachliche Wahrheit. Der Client darf `user` oder `legacy_fallback` nicht
// frei behaupten, um eine proportionale Zuordnung oder eine Nutzerwahl
// zu erzwingen.
//
// Frei von React, Next und Supabase.

import {
  DAY_STAGE_ASSIGNMENT_SOURCES,
  type DayStageAssignmentSource,
} from '@/types/trips'

export { DAY_STAGE_ASSIGNMENT_SOURCES, type DayStageAssignmentSource }

export function istDayStageAssignmentSource(
  wert: unknown,
): wert is DayStageAssignmentSource {
  return (
    typeof wert === 'string' &&
    (DAY_STAGE_ASSIGNMENT_SOURCES as readonly string[]).includes(wert)
  )
}

/**
 * Liest einen gespeicherten oder fehlenden Source-Wert.
 *
 * Unbekanntes und Fehlendes wird `legacy_fallback`: Altbestand ohne das
 * Feld behält den bisherigen proportionalen Vertrag.
 */
export function dayStageAssignmentSourceLesen(wert: unknown): DayStageAssignmentSource {
  return istDayStageAssignmentSource(wert) ? wert : 'legacy_fallback'
}

export type AssignmentSourceAbleitung = {
  stageCount: number
  daysHaveStagePosition?: boolean
  claimed?: unknown
}

/**
 * Server-seitige Ableitung. Client-Behauptungen werden nicht übernommen.
 *
 * - genau eine Stage → `single_destination`
 * - mehrere Stages, keine gesetzte Tagesposition → `unassigned`
 * - mehrere Stages und bereits gesetzte Positionen (Legacy-Transfer nach
 *   Load-Fallback) → `legacy_fallback`
 * - `user` vom Client wird nie persistiert
 */
export function dayStageAssignmentSourceAbleiten(
  eingabe: AssignmentSourceAbleitung,
): DayStageAssignmentSource {
  if (eingabe.stageCount <= 1) return 'single_destination'

  const claimed = istDayStageAssignmentSource(eingabe.claimed) ? eingabe.claimed : null
  if (dayStageAssignmentSourceIstReserviert(claimed)) return 'unassigned'

  if (eingabe.daysHaveStagePosition && claimed !== 'unassigned') {
    return 'legacy_fallback'
  }

  return 'unassigned'
}

/** `user` ist reserviert und darf in diesem Slice nicht vom Client kommen. */
export function dayStageAssignmentSourceIstReserviert(wert: unknown): boolean {
  return wert === 'user'
}

/** Unassigned-Reisen dürfen keine Client-`stage_position` als Wahrheit übernehmen. */
export function darfClientStagePositionUebernehmen(source: DayStageAssignmentSource): boolean {
  return source !== 'unassigned'
}

/** Ob der proportionale Fallback auf dieser Reise noch laufen darf. */
export function darfProportionalZuordnen(source: DayStageAssignmentSource): boolean {
  return source === 'legacy_fallback'
}

/** Ob Tage einer einzigen Stage zugeordnet werden dürfen. */
export function darfEinzelzielZuordnen(source: DayStageAssignmentSource): boolean {
  return source === 'single_destination' || source === 'legacy_fallback'
}
