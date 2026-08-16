import type {
  CreateGuestTripInput,
  GuestTrip,
  TripDay,
  TripInterest,
  TripPace,
  TripPlanItem,
} from '@/types/trips'

const STORAGE_KEY = 'jetnity:guest-trips:v2'
const MAX_GUEST_TRIPS = 20

function makeId(prefix: string) {
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${prefix}-${randomPart}`
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isTripPace(value: unknown): value is TripPace {
  return value === 'ruhig' || value === 'ausgewogen' || value === 'intensiv'
}

function isTripInterest(value: unknown): value is TripInterest {
  return (
    value === 'Kultur' ||
    value === 'Natur' ||
    value === 'Kulinarik' ||
    value === 'Strand' ||
    value === 'Abenteuer' ||
    value === 'Wellness'
  )
}

function isTripPlanItem(value: unknown): value is TripPlanItem {
  if (!value || typeof value !== 'object') return false

  const item = value as Partial<TripPlanItem>
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    item.title.length > 0 &&
    item.title.length <= 120 &&
    (item.note === undefined || (typeof item.note === 'string' && item.note.length <= 500)) &&
    (item.time === undefined || (typeof item.time === 'string' && /^\d{2}:\d{2}$/.test(item.time))) &&
    typeof item.createdAt === 'string'
  )
}

function isTripDay(value: unknown): value is TripDay {
  if (!value || typeof value !== 'object') return false

  const day = value as Partial<TripDay>
  return (
    typeof day.id === 'string' &&
    isIsoDate(day.date) &&
    Array.isArray(day.items) &&
    day.items.length <= 200 &&
    day.items.every(isTripPlanItem)
  )
}

function isGuestTrip(value: unknown): value is GuestTrip {
  if (!value || typeof value !== 'object') return false

  const trip = value as Partial<GuestTrip>
  return (
    typeof trip.id === 'string' &&
    typeof trip.title === 'string' &&
    trip.title.length > 0 &&
    trip.title.length <= 120 &&
    typeof trip.destination === 'string' &&
    trip.destination.length > 0 &&
    trip.destination.length <= 120 &&
    typeof trip.origin === 'string' &&
    trip.origin.length > 0 &&
    trip.origin.length <= 120 &&
    isIsoDate(trip.startDate) &&
    isIsoDate(trip.endDate) &&
    trip.endDate >= trip.startDate &&
    typeof trip.travelers === 'number' &&
    Number.isInteger(trip.travelers) &&
    trip.travelers >= 1 &&
    trip.travelers <= 20 &&
    isTripPace(trip.pace) &&
    Array.isArray(trip.interests) &&
    trip.interests.every(isTripInterest) &&
    (trip.budget === undefined || (Number.isFinite(trip.budget) && trip.budget >= 0)) &&
    (trip.travelWish === undefined || (typeof trip.travelWish === 'string' && trip.travelWish.length <= 1000)) &&
    Array.isArray(trip.days) &&
    trip.days.length <= 366 &&
    trip.days.every(isTripDay) &&
    typeof trip.createdAt === 'string' &&
    typeof trip.updatedAt === 'string'
  )
}

function toUtcDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function buildTripDays(startDate: string, endDate: string): TripDay[] {
  const start = toUtcDate(startDate)
  const end = toUtcDate(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return []
  }

  const days: TripDay[] = []
  const cursor = new Date(start)

  // Guest trips are intentionally bounded to protect the browser from malformed data.
  while (cursor <= end && days.length < 366) {
    const date = toIsoDate(cursor)
    days.push({ id: `day-${date}`, date, items: [] })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}

export function loadGuestTrips(): GuestTrip[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isGuestTrip).slice(0, MAX_GUEST_TRIPS)
  } catch {
    return []
  }
}

function writeGuestTrips(trips: GuestTrip[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips.slice(0, MAX_GUEST_TRIPS)))
}

export function createGuestTrip(input: CreateGuestTripInput): GuestTrip {
  const now = new Date().toISOString()
  const trip: GuestTrip = {
    ...input,
    id: makeId('trip'),
    days: buildTripDays(input.startDate, input.endDate),
    createdAt: now,
    updatedAt: now,
  }

  writeGuestTrips([trip, ...loadGuestTrips()])
  return trip
}

export function getGuestTrip(id: string) {
  return loadGuestTrips().find((trip) => trip.id === id) ?? null
}

export function saveGuestTrip(trip: GuestTrip) {
  const updatedTrip = { ...trip, updatedAt: new Date().toISOString() }
  const trips = loadGuestTrips()
  const index = trips.findIndex((item) => item.id === updatedTrip.id)

  if (index === -1) {
    writeGuestTrips([updatedTrip, ...trips])
  } else {
    trips[index] = updatedTrip
    writeGuestTrips(trips)
  }

  return updatedTrip
}

export function createTripPlanItem(title: string, note?: string, time?: string) {
  return {
    id: makeId('item'),
    title: title.trim(),
    note: note?.trim() || undefined,
    time: time || undefined,
    createdAt: new Date().toISOString(),
  }
}
