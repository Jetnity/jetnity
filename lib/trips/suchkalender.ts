import { tageDifferenz, tageUtc } from '@/lib/activities/zeit'

export type KalenderGrenzen = {
  min: string
  max: string
  minTage: number
  maxTage?: number
  einzeln?: boolean
}

export function datumVerschieben(datum: string, tage: number): string {
  const utc = tageUtc(datum)
  return utc === null ? '' : new Date(utc + tage * 86400000).toISOString().slice(0, 10)
}

export function monatVerschieben(datum: string, monate: number): string {
  const [jahr, monat] = datum.split('-').map(Number)
  return new Date(Date.UTC(jahr, monat - 1 + monate, 1)).toISOString().slice(0, 10)
}

/** Monday-first, fixed six-week grid. Adjacent months are deliberately blank. */
export function monatsTage(monat: string): (string | null)[] {
  const start = monatVerschieben(monat, 0)
  const offset = (new Date(start + 'T12:00:00Z').getUTCDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => {
    const datum = datumVerschieben(start, index - offset)
    return datum.slice(0, 7) === start.slice(0, 7) ? datum : null
  })
}

export function kalenderGrenzen(teil: 'start' | 'ende', start: string, g: KalenderGrenzen) {
  if (teil === 'start' || g.einzeln || tageUtc(start) === null) {
    return { min: g.min, max: datumVerschieben(g.max, g.einzeln ? 0 : -g.minTage) }
  }
  const min = datumVerschieben(start, g.minTage)
  const limit = g.maxTage === undefined ? g.max : datumVerschieben(start, g.maxTage)
  return { min: min > g.min ? min : g.min, max: limit < g.max ? limit : g.max }
}

export function zeitraumGueltig(start: string, ende: string, g: KalenderGrenzen): boolean {
  if (tageUtc(start) === null || start < g.min || start > g.max) return false
  if (g.einzeln) return true
  const dauer = tageDifferenz(start, ende)
  return dauer !== null && dauer >= g.minTage && ende <= g.max &&
    (g.maxTage === undefined || dauer <= g.maxTage)
}
