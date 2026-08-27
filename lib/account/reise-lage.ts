// lib/account/reise-lage.ts
//
// Ableitende Lebenslage einer Reise. Kein gespeicherter Lifecycle-Status.
//
// Dieselben date-only-Vergleiche wie die Account-Übersicht. `heute` ist ein
// Geräte-Kalendertag (`YYYY-MM-DD`), nie ein stilles UTC-Datum. Ohne `heute`
// wird nicht gruppiert – der Aufrufer muss warten.

import type { TripSummary } from '@/types/trips'

export type ReiseGruppe = 'aktiv' | 'kommend' | 'vergangen' | 'ohne-datum'

export type ReiseGruppen = {
  aktiv: TripSummary[]
  kommend: TripSummary[]
  vergangen: TripSummary[]
  ohneDatum: TripSummary[]
}

function nachStartDannUpdate(a: TripSummary, b: TripSummary): number {
  const start = (a.startDate ?? '').localeCompare(b.startDate ?? '')
  if (start !== 0) return start
  return b.updatedAt.localeCompare(a.updatedAt)
}

function nachEndeDannUpdate(a: TripSummary, b: TripSummary): number {
  const endeA = a.endDate ?? a.startDate ?? ''
  const endeB = b.endDate ?? b.startDate ?? ''
  const ende = endeB.localeCompare(endeA)
  if (ende !== 0) return ende
  return b.updatedAt.localeCompare(a.updatedAt)
}

function nachUpdate(a: TripSummary, b: TripSummary): number {
  return b.updatedAt.localeCompare(a.updatedAt)
}

function istOhneDatum(reise: Pick<TripSummary, 'startDate' | 'endDate'>): boolean {
  return !reise.startDate && !reise.endDate
}

export function istAktiv(reise: Pick<TripSummary, 'startDate' | 'endDate'>, heute: string): boolean {
  if (!reise.startDate) return false
  if (reise.endDate) return reise.startDate <= heute && heute <= reise.endDate
  return reise.startDate === heute
}

export function istKommend(reise: Pick<TripSummary, 'startDate' | 'endDate'>, heute: string): boolean {
  return Boolean(reise.startDate && reise.startDate > heute)
}

export function istVergangen(reise: Pick<TripSummary, 'startDate' | 'endDate'>, heute: string): boolean {
  if (istOhneDatum(reise)) return false
  if (istAktiv(reise, heute) || istKommend(reise, heute)) return false
  if (reise.endDate && reise.endDate < heute) return true
  return Boolean(reise.startDate && reise.startDate < heute)
}

export function reiseGruppe(reise: Pick<TripSummary, 'startDate' | 'endDate'>, heute: string): ReiseGruppe {
  if (istAktiv(reise, heute)) return 'aktiv'
  if (istKommend(reise, heute)) return 'kommend'
  if (istVergangen(reise, heute)) return 'vergangen'
  return 'ohne-datum'
}

export function reisePasstZurSuche(reise: Pick<TripSummary, 'title' | 'origin'>, suche: string): boolean {
  const nadel = suche.trim().toLocaleLowerCase('de-CH')
  if (!nadel) return true
  if (reise.title.toLocaleLowerCase('de-CH').includes(nadel)) return true
  return Boolean(reise.origin?.toLocaleLowerCase('de-CH').includes(nadel))
}

/**
 * Teilt vorhandene TripSummary in vier Gruppen. Kein zweites Modell, kein
 * Status-Write. Der Lifecycle-Filter liegt in `reise-archiv.ts`; diese
 * Funktion bleibt date-only.
 */
export function reisenGruppenAus(reisen: readonly TripSummary[], heute: string): ReiseGruppen {
  const gruppen: ReiseGruppen = { aktiv: [], kommend: [], vergangen: [], ohneDatum: [] }

  for (const reise of reisen) {
    const gruppe = reiseGruppe(reise, heute)
    if (gruppe === 'aktiv') gruppen.aktiv.push(reise)
    else if (gruppe === 'kommend') gruppen.kommend.push(reise)
    else if (gruppe === 'vergangen') gruppen.vergangen.push(reise)
    else gruppen.ohneDatum.push(reise)
  }

  gruppen.aktiv.sort(nachStartDannUpdate)
  gruppen.kommend.sort(nachStartDannUpdate)
  gruppen.vergangen.sort(nachEndeDannUpdate)
  gruppen.ohneDatum.sort(nachUpdate)
  return gruppen
}
