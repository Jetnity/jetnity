// Gemeinsame Presentation-Derivation für Hub-Karte und Workspace-Übersicht.
// Keine persistierte Wahrheit, keine Transit-/Flight-Ziele, keine stille Reorder
// ausser der vorhandenen `position` (TW7-A / ADR-0176).

import type { Trip, TripSummary, TripSummaryStage } from '@/types/trips'

export const REISEN_LISTE_SELECT =
  'id, title, origin, start_date, end_date, travellers, currency, budget_amount, status, updated_at, ' +
  'trip_stages(name, position), trip_days(count), trip_items(count)'

export type ReiseOrtEtappe = Pick<TripSummaryStage, 'name' | 'position'>

export type ReiseOrtEingabe = {
  origin: string | null
  stages: readonly ReiseOrtEtappe[]
}

export function etappenOrdnen(etappen: readonly ReiseOrtEtappe[]): TripSummaryStage[] {
  return [...etappen]
    .map((etappe) => ({ name: etappe.name, position: etappe.position }))
    .sort((a, b) => a.position - b.position)
}

export function reiseOrte(reise: ReiseOrtEingabe): string {
  const namen = etappenOrdnen(reise.stages)
    .map((etappe) => etappe.name.trim())
    .filter((name) => name.length > 0)
  const orte = namen.length > 0 ? namen.join(' · ') : 'Ziel noch offen'
  return reise.origin ? `${orte} · ab ${reise.origin}` : orte
}

export function itemCountAusGraph(reise: {
  days: readonly { items: readonly unknown[] }[]
  ohneTag: readonly unknown[]
}): number {
  return reise.days.reduce((summe, tag) => summe + tag.items.length, 0) + reise.ohneTag.length
}

export function tripZusammenfassungAus(reise: Trip): TripSummary {
  const stages = etappenOrdnen(reise.stages)
  return {
    id: reise.id,
    title: reise.title,
    origin: reise.origin,
    startDate: reise.startDate,
    endDate: reise.endDate,
    travellers: reise.travellers,
    currency: reise.currency,
    budgetAmount: reise.budgetAmount,
    status: reise.status,
    updatedAt: reise.updatedAt,
    stages,
    stageCount: stages.length,
    dayCount: reise.days.length,
    itemCount: itemCountAusGraph(reise),
  }
}
