import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'

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


// Independent TL reproduction fixture. The product components are imported unchanged.
const host = document.getElementById('root')!
const root = createRoot(host)
const requests: { payload: any; resolve: (v: string | null) => void; reject: (e: Error) => void }[] = []
const api: any = { requests, suspends: 0, commits: [] }
;(window as any).review = api
function hold(payload: any) {
  return new Promise<string | null>((resolve, reject) => requests.push({ payload, resolve, reject }))
}
api.release = (index: number, result = 'success') => {
  const request = requests[index]
  if (result === 'reject') request.reject(new Error('synthetic rejection'))
  else request.resolve(result === 'domain' ? 'Synthetischer Fehler.' : null)
}
if (location.pathname.startsWith('/flight')) {
  let tripId = 'trip-flight'
  let item = flightItem('a')
  const pair = location.pathname === '/flight-pair'
  const tripGraph = () => {
    const graph = flightTrip(item, tripId)
    if (pair) graph.ohneTag.push({...flightItem('b'), startsOn:'2026-09-13', endsOn:'2026-09-13', routeItinerary:itinerary([segment('BKK','ZRH','2026-09-13')])})
    return graph
  }
  const render = () => root.render(<FlugBestand reise={tripGraph()}
    onFlugRouteManuell={(itemId, segments) => hold({ itemId, segments })} />)
  api.readback = (index: number) => {
    const payload = requests[index].payload
    item = {
      ...item,
      routeItinerary: itinerary(payload.segments.map((s: FlugSegmentManuell) => ({
        origin: flughafenPunkt(s.origin, TEST_FLUGHAFEN_REFS),
        destination: flughafenPunkt(s.destination, TEST_FLUGHAFEN_REFS),
        departureDate: s.departureDate, departureTime: s.departureTime,
        arrivalDate: s.arrivalDate, arrivalTime: s.arrivalTime,
      }))),
    }
    render()
  }
  api.trip = (next: string) => { tripId = next; render() }
  api.target = (kind: FlightKind) => { item = flightItem(kind); render() }
  render()
} else if (location.pathname === '/stay') {
  let item = stayItem('stay-a')
  const render = () => root.render(<UnterkunftBestand reise={stayTrip(item,'trip-stay')} onUnterkunftZeitraum={(itemId,startsOn,endsOn)=>hold({itemId,startsOn,endsOn})} />)
  api.target=(id:string)=>{item=stayItem(id);render()}
  api.readback=(index:number)=>{item={...item,...requests[index].payload};render()}
  render()
} else {
  const never = new Promise<void>(() => {})
  function Gate({ blocked }: { blocked: boolean }) {
    if (blocked) { api.suspends += 1; throw never }
    return <p data-committed-gate>Current committed view</p>
  }
  const trip = connectionTrip('trip-link')
  const preset = (which: string) => ({mode: 'rail' as const,
    originName: which === 'A' ? 'Zürich HB' : 'Basel SBB',
    destinationName: 'Bern', dayId: 'day-1', startsOn: '2026-11-02'})
  function App() {
    const [state, setState] = React.useState({which: 'A', blocked: false})
    api.target = (which: string) => flushSync(() => setState({which, blocked:false}))
    api.begin = () => React.startTransition(() => setState({which: 'B', blocked: true}))
    api.cancel = () => flushSync(() => setState({which: 'A', blocked: false}))
    React.useLayoutEffect(() => { api.commits.push(state.which) }, [state])
    return <React.Suspense fallback={<p data-fallback>Loading future context</p>}>
      <ManuelleVerbindung reise={trip} vorgabe={preset(state.which)} onAnlegen={hold} />
      <Gate blocked={state.blocked} />
    </React.Suspense>
  }
  root.render(<App />)
}
