import { lese, type Leseantwort } from '@/lib/api/datenbank-lesen'
import { ausProblem, type Fehler } from '@/lib/admin/ladezustand'

export const ANALYTICS_RANGES = [7, 30, 90] as const
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]
export type TravelMetrics = { total: number; last30Days: number; accountsWithTrip30Days: number }
export type TravelDay = { date: string; trips: number }
export type AnalyticsSource<T> =
  | { kind: 'ready'; data: T }
  | { kind: 'unavailable' }
  | { kind: 'error'; error: Fehler }

export type TravelAnalyticsReport = {
  observedAt: string
  range: AnalyticsRange
  metrics: AnalyticsSource<TravelMetrics>
  series: AnalyticsSource<TravelDay[]>
}

export function analyticsRange(value: unknown): { range: AnalyticsRange; valid: boolean } {
  if (value === undefined) return { range: 30, valid: true }
  if (value === '7' || value === '30' || value === '90') return { range: Number(value) as AnalyticsRange, valid: true }
  return { range: 30, valid: false }
}

function count(value: unknown): number {
  const parsed = typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value) ? Number(value) : value
  if (typeof parsed !== 'number' || !Number.isSafeInteger(parsed) || parsed < 0) throw new Error('Ungültige Anzahl')
  return parsed
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ungültige Datenzeile')
  return value as Record<string, unknown>
}

export function parseTravelMetrics(rows: unknown): TravelMetrics | null {
  if (!Array.isArray(rows)) throw new Error('Fehlende Kennzahlenantwort')
  if (rows.length === 0) return null
  if (rows.length !== 1) throw new Error('Mehrdeutige Kennzahlenantwort')
  const row = record(rows[0])
  const result = { total: count(row.reisen_gesamt), last30Days: count(row.reisen_30d), accountsWithTrip30Days: count(row.konten_mit_reise_30d) }
  if (result.last30Days > result.total || result.accountsWithTrip30Days > result.last30Days) throw new Error('Widersprüchliche Kennzahlen')
  return result
}

function calendarDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Ungültiger Tag')
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error('Ungültiger Kalendertag')
  return value
}

export function parseTravelSeries(rows: unknown, range: AnalyticsRange): TravelDay[] | null {
  if (!Array.isArray(rows)) throw new Error('Fehlende Tagesreihe')
  if (rows.length === 0) return null
  if (rows.length !== range) throw new Error('Unvollständige Tagesreihe')
  let previous: string | null = null
  let total = 0
  return rows.map((raw) => {
    const row = record(raw)
    const date = calendarDate(row.tag)
    const trips = count(row.anzahl)
    // UTC is used only for arithmetic on date-only values. It does not assert
    // the database timezone that defines the source's calendar-day buckets.
    if (previous && Date.parse(`${date}T00:00:00Z`) - Date.parse(`${previous}T00:00:00Z`) !== 86_400_000) throw new Error('Lücke oder doppelte Tage')
    previous = date
    total += trips
    if (!Number.isSafeInteger(total)) throw new Error('Tagesreihe ausserhalb des Zahlenbereichs')
    return { date, trips }
  })
}

async function source<T>(read: () => PromiseLike<Leseantwort<unknown>>, parse: (rows: unknown) => T | null): Promise<AnalyticsSource<T>> {
  const result = await lese(read)
  if (result.problem) return { kind: 'error', error: ausProblem(result.problem) }
  try {
    const data = parse(result.zeilen)
    return data === null ? { kind: 'unavailable' } : { kind: 'ready', data }
  } catch {
    return { kind: 'error', error: { meldung: 'Die gelieferten Betriebszahlen sind unvollständig oder ungültig.', wiederholbar: false } }
  }
}

export async function readTravelAnalytics(
  reads: { metrics: () => PromiseLike<Leseantwort<unknown>>; series: (range: AnalyticsRange) => PromiseLike<Leseantwort<unknown>> },
  range: AnalyticsRange,
): Promise<TravelAnalyticsReport> {
  const [metrics, series] = await Promise.all([
    source(reads.metrics, parseTravelMetrics),
    source(() => reads.series(range), (rows) => parseTravelSeries(rows, range)),
  ])
  return { observedAt: new Date().toISOString(), range, metrics, series }
}
