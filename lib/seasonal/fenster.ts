// lib/seasonal/fenster.ts
//
// Travel Window ≠ Reference Period.
// Jährlich wiederkehrende Fenster werden auf berührte Reisejahre projiziert.
// Grenzen sind inklusiv. Ungültige Month/Day-Werte fail-closed.

import {
  datumFormatieren,
  datumTeile,
  istKalenderdatum,
  istSchaltjahr,
  kalenderteileGueltig,
  zeitraeumeUeberschneiden,
} from '@/lib/seasonal/kalender'

export type SeasonalMonthDay = {
  month: number
  day: number
}

export type SeasonalTravelWindow =
  | {
      kind: 'annual_recurring'
      start: SeasonalMonthDay
      end: SeasonalMonthDay
    }
  | {
      kind: 'absolute'
      start: string
      end: string
    }
  | { kind: 'insufficient' }

export type SeasonalReferencePeriod = {
  startYear: number
  endYear: number
}

export function monatTagLesen(wert: unknown): SeasonalMonthDay | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  const treffer = /^(\d{2})-(\d{2})$/.exec(text)
  if (!treffer) return null
  const month = Number(treffer[1])
  const day = Number(treffer[2])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  if (month === 2 && day === 29) return { month, day }
  if (!kalenderteileGueltig(2024, month, day) && !(month === 2 && day === 29)) return null
  if (month !== 2 && !kalenderteileGueltig(2024, month, day)) return null
  return { month, day }
}

function monatTagSchluessel(wert: SeasonalMonthDay): string {
  return `${String(wert.month).padStart(2, '0')}-${String(wert.day).padStart(2, '0')}`
}

function monatTagZahl(wert: SeasonalMonthDay): number {
  return wert.month * 100 + wert.day
}

function datumFuerJahr(
  jahr: number,
  monatTag: SeasonalMonthDay,
  kante: 'start' | 'end',
): string | null {
  if (kalenderteileGueltig(jahr, monatTag.month, monatTag.day)) {
    return datumFormatieren(jahr, monatTag.month, monatTag.day)
  }
  if (monatTag.month === 2 && monatTag.day === 29 && !istSchaltjahr(jahr)) {
    return kante === 'start' ? datumFormatieren(jahr, 3, 1) : datumFormatieren(jahr, 2, 28)
  }
  return null
}

export function wiederkehrendProjizieren(
  fenster: Extract<SeasonalTravelWindow, { kind: 'annual_recurring' }>,
  jahr: number,
): { start: string; end: string } | null {
  const wrap = monatTagZahl(fenster.start) > monatTagZahl(fenster.end)
  const einzelnerSchaltTag =
    monatTagZahl(fenster.start) === 229 && monatTagZahl(fenster.end) === 229
  if (einzelnerSchaltTag && !istSchaltjahr(jahr)) return null
  if (wrap) {
    const start = datumFuerJahr(jahr, fenster.start, 'start')
    const end = datumFuerJahr(jahr + 1, fenster.end, 'end')
    if (!start || !end) return null
    return { start, end }
  }
  const start = datumFuerJahr(jahr, fenster.start, 'start')
  const end = datumFuerJahr(jahr, fenster.end, 'end')
  if (!start || !end) return null
  if (start > end) return null
  return { start, end }
}

export function travelWindowLesen(roh: unknown): SeasonalTravelWindow {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return { kind: 'insufficient' }
  const wert = roh as Record<string, unknown>
  if (wert.kind === 'annual_recurring') {
    const start = monatTagLesen(wert.start)
    const end = monatTagLesen(wert.end)
    if (!start || !end) return { kind: 'insufficient' }
    return { kind: 'annual_recurring', start, end }
  }
  if (wert.kind === 'absolute') {
    const start = typeof wert.start === 'string' ? wert.start.trim() : ''
    const end = typeof wert.end === 'string' ? wert.end.trim() : ''
    if (!start || !end) return { kind: 'insufficient' }
    if (istKalenderdatum(start) && istKalenderdatum(end)) {
      return start <= end ? { kind: 'absolute', start, end } : { kind: 'insufficient' }
    }
    if (/Z$/.test(start) && /Z$/.test(end)) {
      const startMs = Date.parse(start)
      const endMs = Date.parse(end)
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs > endMs) {
        return { kind: 'insufficient' }
      }
      return { kind: 'absolute', start, end }
    }
    return { kind: 'insufficient' }
  }
  return { kind: 'insufficient' }
}

export function referencePeriodLesen(roh: unknown): SeasonalReferencePeriod | null {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null
  const wert = roh as Record<string, unknown>
  const startYear = typeof wert.startYear === 'number' ? wert.startYear : Number(wert.startYear)
  const endYear = typeof wert.endYear === 'number' ? wert.endYear : Number(wert.endYear)
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) return null
  if (startYear < 1800 || endYear > 2200 || startYear > endYear) return null
  return { startYear, endYear }
}

export function travelWindowIdentitaet(fenster: SeasonalTravelWindow): string {
  if (fenster.kind === 'annual_recurring') {
    return `recurring:${monatTagSchluessel(fenster.start)}:${monatTagSchluessel(fenster.end)}`
  }
  if (fenster.kind === 'absolute') return `absolute:${fenster.start}:${fenster.end}`
  return 'insufficient'
}

function jahreFuerKontakt(start: string | null, ende: string | null): number[] {
  const von = datumTeile(start ?? ende ?? '')
  const bis = datumTeile(ende ?? start ?? '')
  if (!von || !bis) return []
  const min = Math.min(von.jahr, bis.jahr)
  const max = Math.max(von.jahr, bis.jahr)
  const jahre: number[] = []
  for (let jahr = min - 1; jahr <= max + 1; jahr += 1) jahre.push(jahr)
  return jahre
}

export function kontaktImTravelWindow(
  kontaktStart: string | null,
  kontaktEnde: string | null,
  fenster: SeasonalTravelWindow,
): 'overlaps' | 'before' | 'after' | 'insufficient' {
  if (fenster.kind === 'insufficient') return 'insufficient'
  if (!kontaktStart && !kontaktEnde) return 'insufficient'
  if (fenster.kind === 'absolute') {
    return zeitraeumeUeberschneiden(kontaktStart, kontaktEnde, fenster.start, fenster.end)
  }

  const jahre = jahreFuerKontakt(kontaktStart, kontaktEnde)
  if (jahre.length === 0) return 'insufficient'
  let before = false
  let after = false
  for (const jahr of jahre) {
    const projektion = wiederkehrendProjizieren(fenster, jahr)
    if (!projektion) continue
    const lage = zeitraeumeUeberschneiden(kontaktStart, kontaktEnde, projektion.start, projektion.end)
    if (lage === 'overlaps') return 'overlaps'
    if (lage === 'insufficient') return 'insufficient'
    if (lage === 'before') before = true
    if (lage === 'after') after = true
  }
  if (before && !after) return 'before'
  if (after && !before) return 'after'
  return 'before'
}

export function kalendertagImRecurring(datum: string, fenster: Extract<SeasonalTravelWindow, { kind: 'annual_recurring' }>): boolean {
  const teile = datumTeile(datum)
  if (!teile) return false
  if (teile.monat === 2 && teile.tag === 29 && monatTagZahl(fenster.start) !== 229 && monatTagZahl(fenster.end) !== 229) {
    const md = monatTagZahl({ month: teile.monat, day: teile.tag })
    const start = monatTagZahl(fenster.start)
    const end = monatTagZahl(fenster.end)
    if (start <= end) return md >= start && md <= end
    return md >= start || md <= end
  }
  const md = monatTagZahl({ month: teile.monat, day: teile.tag })
  const start = monatTagZahl(fenster.start)
  const end = monatTagZahl(fenster.end)
  if (start <= end) return md >= start && md <= end
  return md >= start || md <= end
}
