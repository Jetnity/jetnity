// lib/account/naechste-reise.ts
//
// Welche Reise die Account-Übersicht als nächste bzw. aktive zeigt.
//
// Nur TripSummary aus `reisenLaden()` – keine Workspace-Fakten, keine
// Readiness/Safety/Seasonal, keine erfundene Zeitzone. Daten sind date-only
// und werden wie die Reisekarte als UTC-Kalendertag verglichen.

import type { TripSummary } from '@/types/trips'

export type NaechsteReiseLage = 'aktiv' | 'kommend' | 'fortsetzen'

export type NaechsteReise = {
  reise: TripSummary
  lage: NaechsteReiseLage
}

export function heutigesDatum(jetzt = new Date()): string {
  return jetzt.toISOString().slice(0, 10)
}

function istArchiviert(reise: TripSummary): boolean {
  return reise.status === 'archived'
}

function istAktiv(reise: TripSummary, heute: string): boolean {
  if (!reise.startDate) return false
  if (reise.endDate) return reise.startDate <= heute && heute <= reise.endDate
  return reise.startDate === heute
}

function istKommend(reise: TripSummary, heute: string): boolean {
  return Boolean(reise.startDate && reise.startDate > heute)
}

function nachStartDannUpdate(a: TripSummary, b: TripSummary): number {
  const start = (a.startDate ?? '').localeCompare(b.startDate ?? '')
  if (start !== 0) return start
  return b.updatedAt.localeCompare(a.updatedAt)
}

function nachUpdate(a: TripSummary, b: TripSummary): number {
  return b.updatedAt.localeCompare(a.updatedAt)
}

/**
 * Wählt genau eine Reise für die Übersicht.
 *
 * Reihenfolge: aktive Reise, sonst nächste kommende, sonst zuletzt geänderte
 * offene Reise (Entwurf ohne Datum). Archivierte Reisen sind kein Fortsetzen.
 * `null` heisst: es gibt keine offene Reise – nicht „Fehler“.
 */
export function naechsteReiseAus(
  reisen: readonly TripSummary[],
  heute: string,
): NaechsteReise | null {
  const offen = reisen.filter((reise) => !istArchiviert(reise))
  const aktiv = offen.filter((reise) => istAktiv(reise, heute)).sort(nachStartDannUpdate)
  if (aktiv[0]) return { reise: aktiv[0], lage: 'aktiv' }

  const kommend = offen.filter((reise) => istKommend(reise, heute)).sort(nachStartDannUpdate)
  if (kommend[0]) return { reise: kommend[0], lage: 'kommend' }

  const zuletzt = [...offen].sort(nachUpdate)
  if (zuletzt[0]) return { reise: zuletzt[0], lage: 'fortsetzen' }

  return null
}
