// lib/trips/zuordnung.ts
//
// Ordnet Reisetage einer Etappe zu, wenn die Zuordnung fehlt.
//
// Neue Reisen setzen `stageId` beim Anlegen. Ältere Gastreisen und Zeilen vor
// Phase 2.2 können sie noch nicht haben. Dieselbe Rechnung wie die Migration
// `20260820010000`: eine Etappe, Datumsüberlappung, sonst Anteil nach Index.
//
// Frei von React, Next und Supabase.

import type { Trip, TripDay, TripStage } from '@/types/trips'

function etappeZumDatum(etappen: TripStage[], datum: string): TripStage | null {
  const treffer = etappen
    .filter(
      (etappe) =>
        etappe.arrivalDate &&
        etappe.departureDate &&
        datum >= etappe.arrivalDate &&
        datum <= etappe.departureDate,
    )
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))

  return treffer[0] ?? null
}

/** Die Etappe, die ein Tag ohne gesetzte `stageId` erhalten soll. */
export function etappeFuerTag(
  tag: Pick<TripDay, 'dayIndex' | 'dayDate' | 'stageId'>,
  etappen: TripStage[],
  tageAnzahl: number,
): TripStage | null {
  if (etappen.length === 0) return null
  if (etappen.length === 1) return etappen[0] ?? null

  if (tag.dayDate) {
    const nachDatum = etappeZumDatum(etappen, tag.dayDate)
    if (nachDatum) return nachDatum
  }

  const geordnet = [...etappen].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  const anteil = Math.min(
    geordnet.length,
    Math.max(1, Math.ceil((tag.dayIndex * geordnet.length) / Math.max(tageAnzahl, 1))),
  )
  return geordnet[anteil - 1] ?? geordnet[0] ?? null
}

/**
 * Setzt fehlende `stageId` an Tagen und Planpunkten.
 *
 * Vorhandene Zuordnungen bleiben. Die Rückgabe ist eine neue Reise, das
 * Original bleibt unangetastet.
 */
export function tageEtappenZuordnen<T extends Trip>(reise: T): T {
  if (reise.stages.length === 0) return reise

  const tage = reise.days.map((tag) => {
    const etappe = tag.stageId
      ? reise.stages.find((eintrag) => eintrag.id === tag.stageId)
      : etappeFuerTag(tag, reise.stages, reise.days.length)
    const stageId = etappe?.id ?? tag.stageId

    return {
      ...tag,
      stageId,
      items: tag.items.map((punkt) => ({
        ...punkt,
        stageId: punkt.stageId ?? stageId,
      })),
    }
  })

  return { ...reise, days: tage }
}
