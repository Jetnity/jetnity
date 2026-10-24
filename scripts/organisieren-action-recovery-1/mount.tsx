import { createRoot, type Root } from 'react-dom/client'

import FlugBestand from '@/components/trips/FlugBestand'
import MietwagenBereich from '@/components/trips/MietwagenBereich'
import MobilitaetBereich from '@/components/trips/MobilitaetBereich'
import UnterkunftBestand from '@/components/trips/UnterkunftBestand'
import type { MobilityManuellEingabe } from '@/lib/mobility/schema'
import type { RentalCarManuellEingabe } from '@/lib/rental-cars/schema'
import type { FlugSegmentManuell } from '@/lib/trips/schema'
import type { Trip, TripItem } from '@/types/trips'

type Outcome = 'success' | 'error' | 'reject' | 'throw'
type Channel = 'booking' | 'rental' | 'connection' | 'route' | 'stay'

const JETZT = '2026-10-24T00:00:00.000Z'

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title'>): TripItem {
  return {
    dayId: null,
    stageId: null,
    note: null,
    position: 1,
    startsOn: null,
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    routeItinerary: null,
    ...teil,
  }
}

function basisReise(): Trip {
  return {
    id: 'trip-recovery',
    clientRef: 'trip-recovery',
    title: 'Synthetische Reise',
    origin: '',
    originPlaceId: null,
    startDate: '2026-11-02',
    endDate: '2026-11-06',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [],
    days: [
      { id: 'day-1', stageId: null, dayIndex: 1, dayDate: '2026-11-02', title: 'Anreise', items: [] },
      { id: 'day-2', stageId: null, dayIndex: 2, dayDate: '2026-11-03', title: 'Stadt', items: [] },
    ],
    ohneTag: [
      punkt({ id: 'flight-open', kind: 'flight', title: 'Flug offen' }),
      punkt({ id: 'flight-booked', kind: 'flight', title: 'Flug gebucht', bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: JETZT }),
      punkt({ id: 'stay-open', kind: 'stay', title: 'Unterkunft offen' }),
      punkt({ id: 'stay-booked', kind: 'stay', title: 'Unterkunft gebucht', bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: JETZT }),
      punkt({ id: 'transfer-open', kind: 'transfer', title: 'Verbindung offen', mobilityMode: 'rail' }),
      punkt({ id: 'transfer-booked', kind: 'transfer', title: 'Verbindung gebucht', mobilityMode: 'bus', bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: JETZT }),
      punkt({ id: 'rental-open', kind: 'rental_car', title: 'Mietwagen offen' }),
      punkt({ id: 'rental-booked', kind: 'rental_car', title: 'Mietwagen gebucht', bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: JETZT }),
    ],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

type BookingCall = { itemId: string; gebucht: boolean }
type Held = Record<Channel, boolean>

const calls: {
  booking: BookingCall[]
  rental: RentalCarManuellEingabe[]
  connection: MobilityManuellEingabe[]
  route: Array<{ itemId: string; segments: FlugSegmentManuell[] }>
  stay: Array<{ itemId: string; startsOn: string; endsOn: string }>
} = { booking: [], rental: [], connection: [], route: [], stay: [] }

const outcome: Record<Channel, Outcome> = {
  booking: 'success',
  rental: 'success',
  connection: 'success',
  route: 'success',
  stay: 'success',
}

const waiters: Record<Channel, Array<{ resolve: (value: string | null) => void; reject: (error: Error) => void }>> = {
  booking: [],
  rental: [],
  connection: [],
  route: [],
  stay: [],
}

const ERROR_TEXT: Record<Channel, string> = {
  booking: 'Speichern abgelehnt.',
  rental: 'Mietwagen abgelehnt.',
  connection: 'Synthetischer Speicherfehler. Die Eingabe bleibt erhalten.',
  route: 'Route abgelehnt.',
  stay: 'Zeitraum abgelehnt.',
}

function gate<T>(channel: Channel, payload: T): Promise<string | null> {
  const bucket = calls[channel] as T[]
  bucket.push(payload)
  if (outcome[channel] === 'throw') throw new Error('secret boom')
  window.fixture.held[channel] = true
  return new Promise<string | null>((resolve, reject) => {
    waiters[channel].push({ resolve, reject })
  })
}

function settle(channel: Channel) {
  const pending = waiters[channel].splice(0)
  window.fixture.held[channel] = false
  for (const waiter of pending) {
    if (outcome[channel] === 'reject') waiter.reject(new Error('secret boom'))
    else if (outcome[channel] === 'error') waiter.resolve(ERROR_TEXT[channel])
    else waiter.resolve(null)
  }
}

let trip = basisReise()
let epoch = 1
const host = document.getElementById('root')
if (!host) throw new Error('missing root')
let root: Root = createRoot(host)
let mounted = true

function paint() {
  const reise = trip
  root.render(
    <div className="grid min-w-0 gap-6 bg-white p-3">
      <FlugBestand
        reise={reise}
        onBuchungsstatus={(itemId, gebucht) => gate('booking', { itemId, gebucht })}
        onFlugRouteManuell={(itemId, segments) => gate('route', { itemId, segments })}
      />
      <UnterkunftBestand
        reise={reise}
        onBuchungsstatus={(itemId, gebucht) => gate('booking', { itemId, gebucht })}
        onUnterkunftZeitraum={(itemId, startsOn, endsOn) => gate('stay', { itemId, startsOn, endsOn })}
      />
      <MobilitaetBereich
        reise={reise}
        onBuchungsstatus={(itemId, gebucht) => gate('booking', { itemId, gebucht })}
        onManuellAnlegen={(eingabe) => gate('connection', eingabe)}
      />
      <MietwagenBereich
        reise={reise}
        onBuchungsstatus={(itemId, gebucht) => gate('booking', { itemId, gebucht })}
        onManuellAnlegen={(eingabe) => gate('rental', eingabe)}
      />
    </div>,
  )
}

function clearCalls() {
  calls.booking.splice(0, calls.booking.length)
  calls.rental.splice(0, calls.rental.length)
  calls.connection.splice(0, calls.connection.length)
  calls.route.splice(0, calls.route.length)
  calls.stay.splice(0, calls.stay.length)
}

window.fixture = {
  calls,
  held: { booking: false, rental: false, connection: false, route: false, stay: false },
  epoch,
  arm(channel: Channel, next: Outcome) {
    outcome[channel] = next
    window.fixture.held[channel] = false
  },
  release(channel: Channel) {
    settle(channel)
  },
  reset() {
    clearCalls()
    ;(Object.keys(outcome) as Channel[]).forEach((channel) => {
      outcome[channel] = 'success'
      window.fixture.held[channel] = false
    })
  },
  setTrip(id: string) {
    trip = { ...trip, id }
    paint()
  },
  removeItem(id: string) {
    trip = { ...trip, ohneTag: trip.ohneTag.filter((item) => item.id !== id) }
    paint()
  },
  commitBooking(id: string, gebucht: boolean) {
    trip = {
      ...trip,
      ohneTag: trip.ohneTag.map((item) => item.id !== id ? item : {
        ...item,
        bookingStatus: gebucht ? 'booked' : 'unconfirmed',
        bookingSource: gebucht ? 'user' : null,
        bookingConfirmedAt: gebucht ? JETZT : null,
      }),
    }
    paint()
    return trip.ohneTag.map((item) => [item.id, item.bookingStatus])
  },
  unmount() {
    if (!mounted) return
    root.unmount()
    mounted = false
  },
  remount() {
    if (mounted) root.unmount()
    epoch += 1
    window.fixture.epoch = epoch
    root = createRoot(host!)
    mounted = true
    paint()
  },
}

paint()

declare global {
  interface Window {
    fixture: {
      calls: typeof calls
      held: Held
      epoch: number
      arm: (channel: Channel, next: Outcome) => void
      release: (channel: Channel) => void
      reset: () => void
      setTrip: (id: string) => void
      removeItem: (id: string) => void
      commitBooking: (id: string, gebucht: boolean) => void
      unmount: () => void
      remount: () => void
    }
  }
}
