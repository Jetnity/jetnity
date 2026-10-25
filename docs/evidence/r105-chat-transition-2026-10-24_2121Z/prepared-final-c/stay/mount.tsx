import * as React from 'react'
import { createRoot } from 'react-dom/client'
import UnterkunftBestand from '@/components/trips/UnterkunftBestand'
import type { Trip, TripItem } from '@/types/trips'

function stay(id: string, title: string, start: string, end: string): TripItem {
  return {
    id, title, kind: 'stay', dayId: null, stageId: null, note: null, position: 1,
    startsOn: start, startsAt: null, endsOn: end, endsAt: null,
    priceAmount: null, priceCurrency: null, provider: null, externalRef: null,
    bookingUrl: null, bookingStatus: 'unconfirmed', bookingSource: null,
    bookingConfirmedAt: null, mobilityMode: null, originPlaceId: null,
    destinationPlaceId: null, originName: null, destinationName: null,
    connectionRef: null, mobilityChanges: null, mobilityEvidence: null,
    rentalSupplier: null, vehicleClass: null, transmission: null,
    rentalEvidence: null, routeItinerary: null,
  }
}
const trip = {
  id: 'synthetic-stay-trip', clientRef: 'synthetic-stay-trip', title: 'Synthetic stay review',
  origin: 'Zürich', originPlaceId: null, startDate: '2026-11-02', endDate: '2026-11-10',
  travellers: 1, currency: 'CHF', budgetAmount: null, status: 'draft', pace: 'balanced',
  interests: [], travelWish: null, revision: 1, lastMutationId: null, stages: [], days: [],
  ohneTag: [stay('stay-a', 'Stay A', '2026-11-02', '2026-11-06'), stay('stay-b', 'Stay B', '2026-11-06', '2026-11-10')],
} as Trip
const requests: { payload: unknown; resolve: (value: string | null) => void; reject: (error: Error) => void }[] = []
;(window as any).review = {
  requests,
  release: (outcome: string) => {
    if (requests.length !== 1) throw new Error('expected exactly one pending synthetic request')
    if (outcome === 'reject') requests[0].reject(new Error('synthetic rejected callback'))
    else requests[0].resolve(outcome === 'domain' ? 'Synthetischer Speicherfehler A.' : null)
  },
}
createRoot(document.getElementById('root')!).render(
  <UnterkunftBestand reise={trip} onUnterkunftZeitraum={(itemId, startsOn, endsOn) =>
    new Promise<string | null>((resolve, reject) => requests.push({payload: {itemId, startsOn, endsOn}, resolve, reject}))} />,
)
