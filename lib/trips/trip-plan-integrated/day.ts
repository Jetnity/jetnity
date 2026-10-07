import type { Trip, TripItem } from '@/types/trips'
import type { ReadinessViewItem } from '@/lib/readiness/domain'
import type { PreparationZiel } from '@/lib/readiness/preparation-premium-experience-5'
import { kannBuchungMarkieren } from '@/lib/trips/buchung'
import { allePlanpunkte } from './manual'

const cmp = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
/** Same canonical ID is counted once; contradictory duplicates are never arbitrarily resolved. */
export function inventar(reise: Trip) {
  const items = new Map<string, TripItem>(); const ambiguous = new Set<string>()
  for (const item of allePlanpunkte(reise)) {
    const old = items.get(item.id)
    if (old && JSON.stringify(old) !== JSON.stringify(item)) ambiguous.add(item.id)
    else items.set(item.id, item)
  }
  for (const id of ambiguous) items.delete(id)
  return { items: [...items.values()].sort((a,b) => cmp(a.id,b.id)), ambiguous: [...ambiguous].sort(cmp) }
}
export function gespeicherteKosten(reise: Trip, dayId: string | null) {
  const inventory = inventar(reise)
  const days = new Set(reise.days.map(day => day.id))
  const items = inventory.items.filter(item => dayId === null ? !item.dayId || !days.has(item.dayId) : item.dayId === dayId)
  const sums = new Map<string, { currency: string; amount: number; itemIds: string[] }>()
  let missing = 0; let invalid = 0
  for (const item of items) {
    if (item.priceAmount === null && item.priceCurrency === null) { missing++; continue }
    if (typeof item.priceAmount !== 'number' || !Number.isFinite(item.priceAmount) || item.priceAmount < 0 ||
      typeof item.priceCurrency !== 'string' || !/^[A-Z]{3}$/.test(item.priceCurrency)) { invalid++; continue }
    const sum = sums.get(item.priceCurrency) ?? { currency: item.priceCurrency, amount: 0, itemIds: [] }
    // Stored numeric(12,2); avoid binary floating-point accumulation artifacts.
    const cents = Math.round(item.priceAmount * 100)
    if (!Number.isSafeInteger(cents) || Math.abs(cents / 100 - item.priceAmount) > 1e-8 || !Number.isSafeInteger(Math.round(sum.amount * 100) + cents)) { invalid++; continue }
    sum.amount = (Math.round(sum.amount * 100) + cents) / 100; sum.itemIds.push(item.id); sums.set(item.priceCurrency, sum)
  }
  return { totals: [...sums.values()].sort((a,b) => cmp(a.currency,b.currency)), items, missing, invalid,
    ambiguous: inventory.ambiguous, complete: missing === 0 && invalid === 0 && inventory.ambiguous.length === 0 }
}
export function buchungstext(item: TripItem): string {
  if (!kannBuchungMarkieren(item)) return 'Geplant'
  if (item.bookingStatus === 'booked') return item.bookingSource === 'user' ? 'Gebucht · von dir bestätigt' : 'Buchungsstand prüfen'
  return item.bookingStatus === 'unconfirmed' ? 'Ausgewählt · Buchung nicht bestätigt' : 'Buchungsstand prüfen'
}
export function vorbereitungenFuerPunkt(itemId: string, tasks: readonly ReadinessViewItem[]) {
  const unique = new Map<string, { id: string; title: string; ziel: PreparationZiel; userStatus: string; currentness: string }>()
  for (const task of tasks) {
    if (task.tripItemId !== itemId || task.currentness === 'not_applicable' ||
      !['ticket_confirmation_check','booking_confirmation_check','preparation'].includes(task.kind)) continue
    const key = JSON.stringify([task.clientRef, task.tripItemId, task.travellerClientRef ?? null])
    const stale = task.currentness === 'stale'
    if (!stale && task.userStatus !== 'open') continue
    unique.set(key, { id: key, title: task.kind === 'preparation'
      ? (stale ? 'Vorbereitung erneut prüfen' : task.title ?? 'Vorbereitung offen')
      : stale ? 'Bestätigung erneut prüfen' : 'Bestätigung noch prüfen',
    ziel: { bereich: task.kind === 'preparation' ? 'eigene-vorbereitung' : 'tickets-buchungen',
      ...(task.travellerClientRef ? { travellerClientRef: task.travellerClientRef } : {}) },
    userStatus: task.userStatus, currentness: task.currentness })
  }
  return [...unique.values()].sort((a,b) => Number(b.currentness === 'stale') - Number(a.currentness === 'stale') || cmp(a.id,b.id))
}
export function koordinaten(lat: unknown, lon: unknown): { latitude: number; longitude: number } | null {
  return typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)
    && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { latitude: lat, longitude: lon } : null
}
export function tagesOrte(reise: Trip, dayId: string, ordered: readonly TripItem[]) {
  const day = reise.days.find(d => d.id === dayId)
  const stages = reise.stages.filter(stage => stage.id === day?.stageId)
  const stage = stages.length === 1 ? stages[0]! : null
  return { stage: stage ? { id: stage.id, label: stage.name, precision: 'Etappenort' as const, point: koordinaten(stage.latitude, stage.longitude) } : null,
    // No item venue coordinates exist in TripItem. In particular stageId is not venue proof.
    stops: ordered.map(item => ({ id: item.id, title: item.title, point: null, description:
      item.originName || item.destinationName ? [item.originName ?? 'Ausgangspunkt unbekannt', item.destinationName ?? 'Ziel unbekannt'].join(' → ') : 'Genauer Ort nicht hinterlegt' })) }
}
export type PlanSnapshot = ReturnType<typeof planSnapshot>
export function planSnapshot(reise: Trip) {
  const inv = inventar(reise)
  return { tripId: reise.id, ambiguous: inv.ambiguous,
    items: inv.items.map(item => { const value = { ...item }; delete value.rowVersion; return value }),
    days: reise.days.map(({ items, ...day }) => { void items; return day }), stages: reise.stages,
    tasks: (reise.readinessItems ?? []).map(task => ({ id: task.clientRef, itemId: task.tripItemId })) }
}
export function aenderungsAuswirkung(before: PlanSnapshot | null, after: PlanSnapshot) {
  if (!before || before.tripId !== after.tripId) return null
  const old = new Map(before.items.map(item => [item.id,item])); const now = new Map(after.items.map(item => [item.id,item]))
  const changed = [...new Set([...old.keys(),...now.keys()])].filter(id => JSON.stringify(old.get(id)) !== JSON.stringify(now.get(id))).sort(cmp)
  const targets = new Map<string, { id: string; kind: 'preparation'; reasons: string[] }>()
  for (const task of after.tasks) {
    if (!task.itemId || !changed.includes(task.itemId)) continue
    const target = targets.get(task.id) ?? { id: task.id, kind: 'preparation' as const, reasons: [] }
    if (!target.reasons.includes(task.itemId)) target.reasons.push(task.itemId)
    targets.set(task.id,target)
  }
  const summaryChanged = JSON.stringify(before.days) !== JSON.stringify(after.days) || JSON.stringify(before.stages) !== JSON.stringify(after.stages)
  return { changed, targets: [...targets.values()], count: targets.size, summaryChanged,
    relationsIncomplete: changed.length > 0 || before.ambiguous.length > 0 || after.ambiguous.length > 0 }
}
