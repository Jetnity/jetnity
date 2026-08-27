// lib/trips/reise-orte.ts
//
// Gemeinsame Presentation-Derivation der Zielidentität (TW7-A / ADR-0176).
// Dieselbe Regel wie die Workspace-Übersicht: Etappennamen in position-
// Reihenfolge, getrennt mit ` · `, Herkunft als `ab {origin}`.
//
// Keine persistierte Wahrheit, keine Transit-/Flight-Ziele, keine Place-IDs,
// keine stille Reorder jenseits von `position`.

import type { Trip, TripSummary, TripSummaryStage } from '@/types/trips'

export type ReiseOrtQuelle = {
  origin: string | null
  stages: readonly Pick<TripSummaryStage, 'name' | 'position'>[]
}

export function reiseOrte(reise: ReiseOrtQuelle): string {
  const namen = [...reise.stages]
    .sort((links, rechts) => links.position - rechts.position)
    .map((etappe) => etappe.name.trim())
    .filter((name) => name.length > 0)
  const orte = namen.length > 0 ? namen.join(' · ') : 'Ziel noch offen'
  return reise.origin ? `${orte} · ab ${reise.origin}` : orte
}

export function tripItemCount(reise: Pick<Trip, 'days' | 'ohneTag'>): number {
  return reise.days.reduce((summe, tag) => summe + tag.items.length, 0) + reise.ohneTag.length
}

export function tripAlsUebersicht(reise: Trip): TripSummary {
  const stages = reise.stages.map((etappe) => ({
    name: etappe.name,
    position: etappe.position,
  }))
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
    itemCount: tripItemCount(reise),
  }
}
