import { Suspense, startTransition, useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'
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
type FlightKind = 'a' | 'b' | 'multi' | 'over' | 'pair'
type Vorgabe = Partial<MobilityManuellEingabe>

declare global {
  interface Window {
    fixture: {
      calls: Record<Channel, unknown[]>
      held: Record<Channel, boolean>
      domain: Record<Channel, string>
      arm: (channel: Channel, next: Outcome) => void
      release: (channel: Channel) => void
      pending: (channel: Channel) => Array<{ id: number; outcome: Outcome }>
      latest: (channel: Channel) => number
      deliver: (channel: Channel, id: number) => void
      suspendConnection: (next: Vorgabe) => void
      suspendFlightTrip: (tripId: string) => void
      abandonTransition: () => void
      suspendRenders: () => number
      committed: () => { suspend: boolean; flightTripId: string; vorgabeOrigin: string | null; linkTripId: string }
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

function routeFromSegments(segments: FlugSegmentManuell[]): FlugRouteItinerary {
  return itinerary(segments.map((eintrag) => ({
    origin: flughafenPunkt(eintrag.origin, TEST_FLUGHAFEN_REFS),
    destination: flughafenPunkt(eintrag.destination, TEST_FLUGHAFEN_REFS),
    departureDate: eintrag.departureDate,
    departureTime: eintrag.departureTime,
    arrivalDate: eintrag.arrivalDate,
    arrivalTime: eintrag.arrivalTime,
  })))
}

function returnItem(override: FlugSegmentManuell[] | null): TripItem {
  return punkt({
    id: 'flight-b',
    kind: 'flight',
    title: 'flight-b',
    startsOn: '2026-09-13',
    startsAt: '10:00',
    endsOn: '2026-09-13',
    endsAt: '18:00',
    routeItinerary: override ? routeFromSegments(override) : itinerary([{
      origin: flughafenPunkt('BKK', TEST_FLUGHAFEN_REFS),
      destination: flughafenPunkt('ZRH', TEST_FLUGHAFEN_REFS),
      departureDate: '2026-09-13',
      departureTime: '10:00',
      arrivalDate: '2026-09-13',
      arrivalTime: '18:00',
    }]),
  })
}

function flightItem(kind: Exclude<FlightKind, 'pair'>, override: FlugSegmentManuell[] | null = null): TripItem {
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
    routeItinerary: override ? routeFromSegments(override) : itinerary([segment('ZRH', 'BKK')]),
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

function stayItem(id: string, dates: { startsOn: string; endsOn: string } | null = null): TripItem {
  return punkt({
    id,
    kind: 'stay',
    title: id,
    startsOn: dates?.startsOn ?? '2026-11-02',
    endsOn: dates?.endsOn ?? '2026-11-06',
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

type Model = {
  flightKind: FlightKind
  flightTripId: string
  flightSegments: FlugSegmentManuell[] | null
  returnSegments: FlugSegmentManuell[] | null
  stayId: string
  stayTripId: string
  stayDates: { startsOn: string; endsOn: string } | null
  stayVisible: boolean
  linkTripId: string
  linkOrigin: string
  vorgabe: Vorgabe | undefined
  suspend: boolean
}

function initialModel(): Model {
  return {
    flightKind: 'a',
    flightTripId: 'trip-flight',
    flightSegments: null,
    returnSegments: null,
    stayId: 'stay-a',
    stayTripId: 'trip-stay',
    stayDates: null,
    stayVisible: true,
    linkTripId: 'trip-link',
    linkOrigin: 'Zürich',
    vorgabe: undefined,
    suspend: false,
  }
}

type RequestContext = {
  flightTripId: string
  flightKind: FlightKind
  stayId: string
  stayTripId: string
}

type RequestRecord = {
  id: number
  channel: Channel
  payload: unknown
  outcome: Outcome
  context: RequestContext
  done: boolean
  resolve: (value: string | null) => void
  reject: (error: Error) => void
}

const host = document.getElementById('root')
if (!host) throw new Error('missing root')
let root: Root = createRoot(host)
let mounted = true
let snapshot = initialModel()
let setModelRef: ((update: (prev: Model) => Model) => void) | null = null

const calls: Record<Channel, unknown[]> = { flight: [], stay: [], connection: [] }
const held: Record<Channel, boolean> = { flight: false, stay: false, connection: false }
const outcome: Record<Channel, Outcome> = { flight: 'success', stay: 'success', connection: 'success' }
const requests: RequestRecord[] = []
let nextRequest = 1
let suspendRenders = 0

function syncHeld() {
  for (const channel of ['flight', 'stay', 'connection'] as const) {
    held[channel] = requests.some((entry) => entry.channel === channel && !entry.done)
  }
  window.fixture.held = { ...held }
}

function hold(channel: Channel, payload: unknown): Promise<string | null> {
  const captured = outcome[channel]
  const id = nextRequest++
  const context: RequestContext = {
    flightTripId: snapshot.flightTripId,
    flightKind: snapshot.flightKind,
    stayId: snapshot.stayId,
    stayTripId: snapshot.stayTripId,
  }
  calls[channel].push(payload)
  return new Promise((resolve, reject) => {
    requests.push({ id, channel, payload, outcome: captured, context, done: false, resolve, reject })
    syncHeld()
  })
}

function settle(entry: RequestRecord) {
  if (entry.done) return
  entry.done = true
  syncHeld()
  if (entry.outcome === 'reject') entry.reject(new Error('secret boom'))
  else if (entry.outcome === 'domain') entry.resolve(DOMAIN[entry.channel])
  else entry.resolve(null)
}

function assignedOutbound(item: TripItem, tripId: string) {
  const coverage = flugAbdeckung(flightTrip(item, tripId))
  const outbound = coverage.abschnitte.find((abschnitt) => abschnitt.id === 'outbound:stage-1')
  return Boolean(outbound?.item && outbound.item.id === item.id && coverage.unzugeordnet.length === 0)
}

function commit(update: (prev: Model) => Model) {
  const setModel = setModelRef
  if (!setModel) throw new Error('fixture is not mounted')
  flushSync(() => setModel(update))
}

function Never() {
  suspendRenders += 1
  throw new Promise(() => {})
}

function HarnessApp() {
  const [model, setModel] = useState(snapshot)
  useLayoutEffect(() => {
    snapshot = model
    setModelRef = setModel
  }, [model, setModel])
  const flight = model.flightKind === 'pair' ? null : flightItem(model.flightKind, model.flightSegments)
  if (flight && (model.flightKind === 'a' || model.flightKind === 'b') && !assignedOutbound(flight, model.flightTripId)) {
    throw new Error(`flight ${flight.id} is not the outbound section`)
  }
  const flugReise = flight
    ? flightTrip(flight, model.flightTripId)
    : {
      ...flightTrip(flightItem('a', model.flightSegments), model.flightTripId),
      ohneTag: [flightItem('a', model.flightSegments), returnItem(model.returnSegments)],
    }
  return (
    <Suspense fallback={<p data-transition-fallback="">Übergang</p>}>
      <div className="grid min-w-0 gap-4 p-0">
        <FlugBestand
          reise={flugReise}
          onFlugRouteManuell={(itemId, segments: FlugSegmentManuell[]) => hold('flight', { itemId, segments })}
        />
        {model.stayVisible ? (
          <UnterkunftBestand
            reise={stayTrip(stayItem(model.stayId, model.stayDates), model.stayTripId)}
            onUnterkunftZeitraum={(itemId, startsOn, endsOn) => hold('stay', { itemId, startsOn, endsOn })}
          />
        ) : null}
        <ManuelleVerbindung
          reise={connectionTrip(model.linkTripId, model.linkOrigin)}
          vorgabe={model.vorgabe}
          onAnlegen={(eingabe) => hold('connection', eingabe)}
        />
        {model.suspend ? <Never /> : null}
      </div>
    </Suspense>
  )
}

function openRequests(channel: Channel) {
  return requests.filter((entry) => entry.channel === channel && !entry.done)
}

window.fixture = {
  calls,
  held: { ...held },
  domain: DOMAIN,
  arm(channel: Channel, next: Outcome) {
    outcome[channel] = next
  },
  release(channel: Channel) {
    const entry = openRequests(channel)[0]
    if (entry) settle(entry)
  },
  pending(channel: Channel) {
    return openRequests(channel).map((entry) => ({ id: entry.id, outcome: entry.outcome }))
  },
  latest(channel: Channel) {
    const entry = [...requests].reverse().find((item) => item.channel === channel)
    if (!entry) throw new Error(`no ${channel} request`)
    return entry.id
  },
  suspendRenders() {
    return suspendRenders
  },
  committed() {
    return {
      suspend: snapshot.suspend,
      flightTripId: snapshot.flightTripId,
      vorgabeOrigin: snapshot.vorgabe?.originName ?? null,
      linkTripId: snapshot.linkTripId,
    }
  },
  deliver(channel: Channel, id: number) {
    const entry = requests.find((item) => item.id === id && item.channel === channel)
    if (!entry) throw new Error(`missing ${channel} request ${id}`)
    commit((prev) => {
      if (channel === 'flight') {
        if (prev.flightTripId !== entry.context.flightTripId || prev.flightKind !== entry.context.flightKind) return prev
        const payload = entry.payload as { itemId: string; segments: FlugSegmentManuell[] }
        if (prev.flightKind === 'pair' && payload.itemId === 'flight-b') return { ...prev, returnSegments: payload.segments }
        return { ...prev, flightSegments: payload.segments }
      }
      if (channel === 'stay') {
        if (prev.stayId !== entry.context.stayId || prev.stayTripId !== entry.context.stayTripId) return prev
        const payload = entry.payload as { startsOn: string; endsOn: string }
        return { ...prev, stayDates: { startsOn: payload.startsOn, endsOn: payload.endsOn } }
      }
      return prev
    })
  },
  suspendConnection(next: Vorgabe) {
    const setModel = setModelRef
    if (!setModel) throw new Error('fixture is not mounted')
    startTransition(() => {
      setModel((prev) => ({ ...prev, vorgabe: next, suspend: true }))
    })
  },
  suspendFlightTrip(tripId: string) {
    const setModel = setModelRef
    if (!setModel) throw new Error('fixture is not mounted')
    startTransition(() => {
      setModel((prev) => ({ ...prev, flightTripId: tripId, suspend: true }))
    })
  },
  abandonTransition() {
    const restore = snapshot
    commit((prev) => ({
      ...prev,
      suspend: false,
      vorgabe: restore.vorgabe,
      flightTripId: restore.flightTripId,
      flightKind: restore.flightKind,
      stayId: restore.stayId,
      linkTripId: restore.linkTripId,
      linkOrigin: restore.linkOrigin,
    }))
  },
  setFlight(kind: FlightKind) {
    commit((prev) => ({ ...prev, flightKind: kind, flightSegments: null, returnSegments: null, suspend: false }))
  },
  setFlightTrip(tripId: string) {
    commit((prev) => ({
      ...prev,
      flightTripId: tripId,
      flightSegments: prev.flightTripId === tripId ? prev.flightSegments : null,
      suspend: false,
    }))
  },
  setStay(id: string) {
    commit((prev) => ({ ...prev, stayId: id, stayDates: null, suspend: false }))
  },
  setStayTrip(tripId: string) {
    commit((prev) => ({
      ...prev,
      stayTripId: tripId,
      stayDates: prev.stayTripId === tripId ? prev.stayDates : null,
      suspend: false,
    }))
  },
  showStay(next: boolean) {
    commit((prev) => ({ ...prev, stayVisible: next }))
  },
  setConnection(next: { tripId?: string; origin?: string; vorgabe?: Vorgabe | null }) {
    commit((prev) => ({
      ...prev,
      linkTripId: next.tripId ?? prev.linkTripId,
      linkOrigin: next.origin ?? prev.linkOrigin,
      vorgabe: next.vorgabe === null ? undefined : next.vorgabe ?? prev.vorgabe,
      suspend: false,
    }))
  },
  unmount() {
    root.unmount()
    mounted = false
    setModelRef = null
  },
  remount() {
    if (mounted) root.unmount()
    root = createRoot(host)
    mounted = true
    snapshot = { ...snapshot, stayVisible: true, suspend: false }
    root.render(<HarnessApp />)
  },
}

root.render(<HarnessApp />)

export {}
