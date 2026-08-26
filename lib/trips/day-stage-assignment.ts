// lib/trips/day-stage-assignment.ts
//
// Herkunft der Day→Stage-Zuordnung. Guest und Account teilen dieselbe
// fachliche Wahrheit. public.reise_anlegen() muss dieselbe Tabelle ableiten:
// ein angemeldeter Client kann die SECURITY-INVOKER-RPC direkt aufrufen.
//
// Frei von React, Next und Supabase.

import {
  DAY_STAGE_ASSIGNMENT_SOURCES,
  type DayStageAssignmentSource,
} from '@/types/trips'

export { DAY_STAGE_ASSIGNMENT_SOURCES, type DayStageAssignmentSource }

function istDayStageAssignmentSource(
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
 * Kanonische Ableitung. Identisch zu `public.reise_anlegen()`.
 *
 * | stages | claimed | positions | result |
 * | --- | --- | --- | --- |
 * | <= 1 | * | * | `single_destination` |
 * | > 1 | `user` | * | `unassigned` |
 * | > 1 | `unassigned` | * | `unassigned` |
 * | > 1 | `single_destination` | * | `unassigned` |
 * | > 1 | unbekannt | * | `unassigned` (SQL: 22023) |
 * | > 1 | `legacy_fallback` oder fehlend | ja | `legacy_fallback` |
 * | > 1 | `legacy_fallback` oder fehlend | nein | `unassigned` |
 *
 * `user` ist in diesem Slice nicht persistierbar. Ein falscher
 * `single_destination`-Claim bei mehreren Stages wird nicht zu
 * `legacy_fallback`. Die letzte Zeile mit Positionen bleibt das offene
 * Legacy-Provenance-Gate: ein direkter Client kann historische Provenance
 * noch minten, weil Guest→Account ohne Secret nicht von Tampering
 * unterscheidbar ist.
 */
export function dayStageAssignmentSourceAbleiten(
  eingabe: AssignmentSourceAbleitung,
): DayStageAssignmentSource {
  if (eingabe.stageCount <= 1) return 'single_destination'

  if (eingabe.claimed != null && eingabe.claimed !== '') {
    if (!istDayStageAssignmentSource(eingabe.claimed)) return 'unassigned'
    if (
      eingabe.claimed === 'user' ||
      eingabe.claimed === 'unassigned' ||
      eingabe.claimed === 'single_destination'
    ) {
      return 'unassigned'
    }
  }

  return eingabe.daysHaveStagePosition ? 'legacy_fallback' : 'unassigned'
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
