// lib/trips/day-stage-assignment.ts
//
// Day→Stage Assignment Mode. Mode != Provenance.
// public.reise_anlegen() muss dieselbe Tabelle ableiten: ein angemeldeter
// Client kann die SECURITY-INVOKER-RPC direkt aufrufen.
//
// Frei von React, Next und Supabase.

import {
  DAY_STAGE_ASSIGNMENT_MODES,
  type DayStageAssignmentMode,
} from '@/types/trips'

export { DAY_STAGE_ASSIGNMENT_MODES, type DayStageAssignmentMode }

const BEKANNTE_CLAIMS = [...DAY_STAGE_ASSIGNMENT_MODES, 'user'] as const

function istDayStageAssignmentMode(
  wert: unknown,
): wert is DayStageAssignmentMode {
  return (
    typeof wert === 'string' &&
    (DAY_STAGE_ASSIGNMENT_MODES as readonly string[]).includes(wert)
  )
}

/** Bekannte alte oder neue Claims. Unbekanntes wird fail-closed abgelehnt. */
function istBekannterClaim(wert: unknown): boolean {
  return typeof wert === 'string' && (BEKANNTE_CLAIMS as readonly string[]).includes(wert)
}

/**
 * Liest einen bereits persistierten DB-Mode.
 *
 * Unbekanntes und Fehlendes wird `legacy_fallback`: Production ohne Spalte
 * und historischer Bestand behalten den alten Vertrag. Nicht für neue
 * Client-Requests und nicht für Browser-JSON verwenden.
 */
export function dayStageAssignmentModeLesenDb(wert: unknown): DayStageAssignmentMode {
  return istDayStageAssignmentMode(wert) ? wert : 'legacy_fallback'
}

export class DayStageAssignmentFehler extends Error {
  constructor(message = 'Die Tageszuordnung ist ungültig.') {
    super(message)
    this.name = 'DayStageAssignmentFehler'
  }
}

export type AssignmentModeAbleitung = {
  stageCount: number
  positions?: readonly unknown[]
  claimed?: unknown
}

/**
 * Prüft gelieferte `stage_position`-Werte.
 *
 * Fehlend/leer ist erlaubt. Jeder gesetzte Wert muss eine ganze Zahl sein
 * und zu einer vorhandenen Stage-Position (1..stageCount) gehören.
 */
export function dayStagePositionenPruefen(
  stageCount: number,
  positions: readonly unknown[] = [],
): number[] {
  const gültig: number[] = []
  for (const roh of positions) {
    if (roh == null || roh === '') continue
    const zahl = typeof roh === 'number' ? roh : Number.parseInt(String(roh).trim(), 10)
    if (!Number.isInteger(zahl) || zahl < 1 || zahl > stageCount) {
      throw new DayStageAssignmentFehler()
    }
    if (typeof roh === 'string' && !/^[0-9]+$/.test(roh.trim())) {
      throw new DayStageAssignmentFehler()
    }
    gültig.push(zahl)
  }
  return gültig
}

/**
 * Kanonische Ableitung für neue Create-/Transfer-Requests.
 * Identisch zu `public.reise_anlegen()`.
 *
 * | stages | gültige Positionen | result |
 * | --- | --- | --- |
 * | < 1 | * | `DayStageAssignmentFehler` |
 * | = 1 | * | `single_destination` |
 * | > 1 | mindestens eine | `explicit` |
 * | > 1 | keine | `unassigned` |
 *
 * Client-Claims `legacy_fallback` / `user` / `unassigned` / `explicit` werden
 * nicht als Wahrheit übernommen. Unbekannte Claims werfen.
 * `legacy_fallback` wird hier niemals erzeugt.
 */
export function dayStageAssignmentModeAbleiten(
  eingabe: AssignmentModeAbleitung,
): DayStageAssignmentMode {
  const claimed = eingabe.claimed
  if (claimed != null && claimed !== '' && !istBekannterClaim(claimed)) {
    throw new DayStageAssignmentFehler()
  }

  if (!Number.isInteger(eingabe.stageCount) || eingabe.stageCount < 1) {
    throw new DayStageAssignmentFehler()
  }

  const positionen = dayStagePositionenPruefen(eingabe.stageCount, eingabe.positions)
  if (eingabe.stageCount === 1) return 'single_destination'
  return positionen.length > 0 ? 'explicit' : 'unassigned'
}

/** Guest/Browser: Mode aus Fakten, niemals historische DB-Provenance. */
export function dayStageAssignmentModeFuerGast(eingabe: {
  stageCount: number
  positions?: readonly unknown[]
}): DayStageAssignmentMode {
  return dayStageAssignmentModeAbleiten({
    stageCount: eingabe.stageCount,
    positions: eingabe.positions,
  })
}

export function stagePositionenAusReise(reise: {
  stages: readonly { id: string; position: number }[]
  days: readonly { stageId: string | null }[]
}): number[] {
  const positionen: number[] = []
  for (const tag of reise.days) {
    if (!tag.stageId) continue
    const etappe = reise.stages.find((eintrag) => eintrag.id === tag.stageId)
    if (etappe && etappe.position >= 1) positionen.push(etappe.position)
  }
  return positionen
}

/** Ob der proportionale Fallback auf einer bereits persistierten DB-Reise laufen darf. */
export function darfProportionalZuordnen(mode: DayStageAssignmentMode): boolean {
  return mode === 'legacy_fallback'
}

/** Ob Tage einer einzigen Stage zugeordnet werden dürfen. */
export function darfEinzelzielZuordnen(mode: DayStageAssignmentMode): boolean {
  return mode === 'single_destination' || mode === 'legacy_fallback'
}

/** Ob konkrete Client-Positionen in eine neue Nutzlast dürfen. */
export function darfClientStagePositionUebernehmen(mode: DayStageAssignmentMode): boolean {
  return mode === 'explicit' || mode === 'single_destination'
}
