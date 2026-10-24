import { createRoot, type Root } from 'react-dom/client'

import FlugBestand from '@/components/trips/FlugBestand'
import { ManuelleVerbindung } from '@/components/trips/MobilitaetBereich'
import UnterkunftBestand from '@/components/trips/UnterkunftBestand'
import type { FlugRouteItinerary, RouteSegment } from '@/lib/route/domain'
import { TEST_FLUGHAFEN_REFS } from '@/lib/route/fixtures'
import { flughafenPunkt } from '@/lib/route/referenz'
import { flugAbdeckung } from '@/lib/trips/flug-abdeckung'
import type { MobilityManuellEingabe } from '@/lib/mobility/schema'
import type { FlugSegmentManuell } from '@/lib/trips/schema'
import type { Trip, TripItem } from '@/types/trips'

type Outcome = 'success' | 'domain' | 'reject'
type Channel = 'flight' | 'stay' | 'connection'
type FlightKind = 'a' | 'b' | 'multi' | 'over'
type Vorgabe = Partial<MobilityManuellEingabe>

declare global {
  interface Window {
    fixture: {
      calls: Record<Channel, unknown[]>
      held: Record<Channel, boolean>
      domain: Record<Channel, string>
      arm: (channel: Channel, next: Outcome) => void
      release: (channel: Channel) => void
      setFlight: (kind: FlightKind) => void
      setFlightTrip: (tripId: string) => void
      setStay: (id: string) => void
      setStayTrip: (tripId: string) => void
      showStay: (next: boolean) => void
      setConnection: (next: { tripId?: string; origin?: string; vorgabe?: Vorgabe | null }) => void
      unmount: () => void
      remount: () => void
    }
  }
}

const DOMAIN = {
  flight: 'Route abgelehnt.',
  stay: 'Zeitraum abgelehnt.',
  connection: 'Synthetischer Speicherfehler. Die Eingabe bleibt erhalten.',
} as const

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

function segment(von: string, nach: string, datum = '2026-08-30'): RouteSegment {
  return {
    origin: flughafenPunkt(von, TEST_FLUGHAFEN_REFS),
    destination: flughafenPunkt(nach, TEST_FLUGHAFEN_REFS),
    departureDate: datum,
    departureTime: '10:00',
    arrivalDate: datum,
    arrivalTime: '18:00',
  }
}

function itinerary(segments: RouteSegment[]): FlugRouteItinerary {
  return { v: 1, type: 'flight_route_itinerary', legs: [{ segments }] }
}

function flightItem(kind: FlightKind): TripItem {
  if (kind === 'multi') {
    return punkt({
      id: 'flight-multi',
      kind: 'flight',
      title: 'Mehrere Strecken',
      startsOn: '2026-08-30',
      routeItinerary: {
        v: 1,
        type: 'flight_route_itinerary',
        legs: [
          { segments: [segment('ZRH', 'BKK')] },
          { segments: [segment('BKK', 'ZRH', '2026-09-13')] },
        ],
      },
    })
  }
  if (kind === 'over') {
    return punkt({
      id: 'flight-over',
      kind: 'flight',
      title: 'Fünf Segmente',
      startsOn: '2026-08-30',
      routeItinerary: itinerary([
        segment('ZRH', 'FRA'),
        segment('FRA', 'DOH', '2026-08-31'),
        segment('DOH', 'BKK', '2026-09-01'),
        segment('BKK', 'SIN', '2026-09-02'),
        segment('SIN', 'NRT', '2026-09-03'),
      ]),
    })
  }
  const id = kind === 'a' ? 'flight-a' : 'flight-b'
  return punkt({
    id,
    kind: 'flight',
    title: id,
    startsOn: '2026-08-30',
    startsAt: '10:00',
    endsOn: '2026-08-30',
    endsAt: '18:00',
    routeItinerary: itinerary([segment('ZRH', 'BKK')]),
  })
}

function flightTrip(item: TripItem, tripId: string): Trip {
  return {
    id: tripId,
    clientRef: tripId,
    title: 'Synthetische Flugreise',
    origin: 'Zürich',
    originPlaceId: 'airport:ZRH',
    startDate: '2026-08-30',
    endDate: '2026-09-13',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [{
      id: 'stage-1',
      position: 1,
      name: 'Bangkok',
      countryCode: 'TH',
      arrivalDate: '2026-08-30',
      departureDate: '2026-09-13',
      latitude: null,
      longitude: null,
      placeId: 'geonames:1609350',
    }],
    days: [],
    ohneTag: [item],
  } as Trip
}

function stayItem(id: string): TripItem {
  return punkt({
    id,
    kind: 'stay',
    title: id,
    startsOn: '2026-11-02',
    endsOn: '2026-11-06',
  })
}

function stayTrip(item: TripItem, tripId: string): Trip {
  return {
    id: tripId,
    clientRef: tripId,
    title: 'Synthetische Unterkunft',
    origin: 'Zürich',
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
    days: [],
    ohneTag: [item],
  } as Trip
}

function connectionTrip(tripId: string, origin = 'Zürich'): Trip {
  return {
    id: tripId,
    clientRef: tripId,
    title: 'Synthetische Verbindung',
    origin,
    originPlaceId: null,
    startDate: '2026-11-02',
    endDate: '2026-11-04',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [{
      id: 'stage-1',
      position: 1,
      name: 'Bern',
      countryCode: 'CH',
      arrivalDate: '2026-11-02',
      departureDate: '2026-11-04',
      latitude: null,
      longitude: null,
      placeId: 'place:bern',
    }],
    days: [
      { id: 'day-1', stageId: 'stage-1', dayIndex: 1, dayDate: '2026-11-02', title: 'Anreise', items: [] },
      { id: 'day-2', stageId: 'stage-1', dayIndex: 2, dayDate: '2026-11-03', title: 'Stadt', items: [] },
    ],
    ohneTag: [],
  } as Trip
}

const host = document.getElementById('root')
if (!host) throw new Error('missing root')
let root: Root = createRoot(host)
let mounted = true
let stayVisible = true

let flightKind: FlightKind = 'a'
let flightTripId = 'trip-flight'
let stayId = 'stay-a'
let stayTripId = 'trip-stay'
let linkTripId = 'trip-link'
let linkOrigin = 'Zürich'
let vorgabe: Vorgabe | undefined

const calls: Record<Channel, unknown[]> = { flight: [], stay: [], connection: [] }
const held: Record<Channel, boolean> = { flight: false, stay: false, connection: false }
const outcome: Record<Channel, Outcome> = { flight: 'success', stay: 'success', connection: 'success' }
const release: Record<Channel, () => void> = { flight() {}, stay() {}, connection() {} }

function hold(channel: Channel, payload: unknown): Promise<string | null> {
  calls[channel].push(payload)
  held[channel] = true
  window.fixture.held = { ...held }
  return new Promise((resolve, reject) => {
    release[channel] = () => {
      held[channel] = false
      window.fixture.held = { ...held }
      const next = outcome[channel]
      if (next === 'reject') reject(new Error('secret boom'))
      else if (next === 'domain') resolve(DOMAIN[channel])
      else resolve(null)
    }
  })
}

function assignedOutbound(item: TripItem, tripId: string) {
  const coverage = flugAbdeckung(flightTrip(item, tripId))
  const outbound = coverage.abschnitte.find((abschnitt) => abschnitt.id === 'outbound:stage-1')
  return Boolean(outbound?.item && outbound.item.id === item.id && coverage.unzugeordnet.length === 0)
}

function paint() {
  if (!mounted) return
  const flight = flightItem(flightKind)
  if ((flightKind === 'a' || flightKind === 'b') && !assignedOutbound(flight, flightTripId)) {
    throw new Error(`flight ${flight.id} is not the outbound section`)
  }
  root.render(
    <div className="grid min-w-0 gap-4 p-0">
      <FlugBestand
        reise={flightTrip(flight, flightTripId)}
        onFlugRouteManuell={(itemId, segments: FlugSegmentManuell[]) => hold('flight', { itemId, segments })}
      />
      {stayVisible ? (
        <UnterkunftBestand
          reise={stayTrip(stayItem(stayId), stayTripId)}
          onUnterkunftZeitraum={(itemId, startsOn, endsOn) => hold('stay', { itemId, startsOn, endsOn })}
        />
      ) : null}
      <ManuelleVerbindung
        reise={connectionTrip(linkTripId, linkOrigin)}
        vorgabe={vorgabe}
        onAnlegen={(eingabe) => hold('connection', eingabe)}
      />
    </div>,
  )
}

window.fixture = {
  calls,
  held: { ...held },
  domain: DOMAIN,
  arm(channel: Channel, next: Outcome) {
    outcome[channel] = next
  },
  release(channel: Channel) {
    release[channel]()
  },
  setFlight(kind: FlightKind) {
    flightKind = kind
    paint()
  },
  setFlightTrip(tripId: string) {
    flightTripId = tripId
    paint()
  },
  setStay(id: string) {
    stayId = id
    paint()
  },
  setStayTrip(tripId: string) {
    stayTripId = tripId
    paint()
  },
  showStay(next: boolean) {
    stayVisible = next
    paint()
  },
  setConnection(next: { tripId?: string; origin?: string; vorgabe?: Vorgabe | null }) {
    if (next.tripId) linkTripId = next.tripId
    if (next.origin) linkOrigin = next.origin
    if (next.vorgabe === null) vorgabe = undefined
    else if (next.vorgabe) vorgabe = next.vorgabe
    paint()
  },
  unmount() {
    root.unmount()
    mounted = false
  },
  remount() {
    if (mounted) root.unmount()
    root = createRoot(host)
    mounted = true
    stayVisible = true
    paint()
  },
}

paint()

export {}
