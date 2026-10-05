// lib/account/naechste-reise.ts
//
// Welche Reise die Account-Übersicht als nächste bzw. aktive zeigt.
//
// Nur TripSummary aus `reisenLaden()` – keine Workspace-Fakten, keine
// Readiness/Safety/Seasonal, keine erfundene IANA-Zone. Trip-Daten sind
// date-only. aktiv/kommend braucht einen belegten Geräte-Kalendertag.

import { istArchiviert } from '@/lib/account/reise-archiv'
import { istAktiv, istKommend } from '@/lib/account/reise-lage'
import type { TripSummary } from '@/types/trips'

export type NaechsteReiseLage = 'aktiv' | 'kommend' | 'fortsetzen'

export type NaechsteReise = {
  reise: TripSummary
  lage: NaechsteReiseLage
}

/**
 * Kalendertag des Instant in einer bekannten Offset-Lage.
 *
 * `zeitzoneVersatzMinuten` folgt `Date#getTimezoneOffset`: Minuten westlich
 * von UTC. Keine IANA-Zone, kein stilles UTC-Kalenderdatum.
 */
export function kalendertagAusInstant(jetzt: Date, zeitzoneVersatzMinuten: number): string {
  const lokal = new Date(jetzt.getTime() - zeitzoneVersatzMinuten * 60_000)
  const jahr = lokal.getUTCFullYear()
  const monat = String(lokal.getUTCMonth() + 1).padStart(2, '0')
  const tag = String(lokal.getUTCDate()).padStart(2, '0')
  return `${jahr}-${monat}-${tag}`
}

/** Geräte-Kalendertag des übergebenen Instant. */
export function heutigesDatum(jetzt = new Date()): string {
  return kalendertagAusInstant(jetzt, jetzt.getTimezoneOffset())
}

function nachStartDannUpdate(a: TripSummary, b: TripSummary): number {
  const start = (a.startDate ?? '').localeCompare(b.startDate ?? '')
  if (start !== 0) return start
  return b.updatedAt.localeCompare(a.updatedAt)
}

function nachUpdate(a: TripSummary, b: TripSummary): number {
  return b.updatedAt.localeCompare(a.updatedAt)
}

function zuletztOffen(offen: readonly TripSummary[]): NaechsteReise | null {
  const zuletzt = [...offen].sort(nachUpdate)
  if (zuletzt[0]) return { reise: zuletzt[0], lage: 'fortsetzen' }
  return null
}

/**
 * Wählt genau eine Reise für die Übersicht.
 *
 * Mit bekanntem Geräte-Kalendertag: aktive Reise, sonst nächste kommende,
 * sonst zuletzt geänderte offene Reise. Ohne Kalendertag keine
 * aktiv/kommend-Behauptung – nur Fortsetzen. Archivierte Reisen sind kein
 * Fortsetzen. `null` heisst: es gibt keine offene Reise – nicht „Fehler“.
 */
export function naechsteReiseAus(
  reisen: readonly TripSummary[],
  heute: string | null,
): NaechsteReise | null {
  const offen = reisen.filter((reise) => !istArchiviert(reise))
  if (!heute) return zuletztOffen(offen)

  const aktiv = offen.filter((reise) => istAktiv(reise, heute)).sort(nachStartDannUpdate)
  if (aktiv[0]) return { reise: aktiv[0], lage: 'aktiv' }

  const kommend = offen.filter((reise) => istKommend(reise, heute)).sort(nachStartDannUpdate)
  if (kommend[0]) return { reise: kommend[0], lage: 'kommend' }

  return zuletztOffen(offen)
}
