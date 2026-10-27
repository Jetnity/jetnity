import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import { ACTIVITY_ABDECKUNGSHINWEIS } from '@/lib/activities/domain'
import { ACTIVITY_TAG_UNVERFUEGBAR } from '@/lib/activities/zustand'
import type { Trip, TripDay, TripStage } from '@/types/trips'

function etappe(id: string, name: string): TripStage {
  return {
    id,
    position: 1,
    name,
    countryCode: 'PT',
    arrivalDate: null,
    departureDate: null,
    latitude: 38.72,
    longitude: -9.14,
    placeId: 'geonames:2267057',
  }
}

function tag(id: string, stageId: string, title: string): TripDay {
  return { id, dayIndex: 1, stageId, dayDate: '2026-11-02', title, items: [] }
}

function reise(id: string, name: string): Trip {
  const stageId = `stage-${id}`
  return {
    id: `trip-${id}`,
    clientRef: `trip-${id}`,
    title: name,
    origin: null,
    originPlaceId: null,
    startDate: '2026-11-02',
    endDate: '2026-11-04',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: 'private-canary-ux-gyg-expand-1',
    revision: 1,
    lastMutationId: null,
    stages: [etappe(stageId, name)],
    days: [tag(`day-${id}`, stageId, name)],
    ohneTag: [],
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
  }
}

const faelle = ['unavailable', 'ok', 'partial', 'empty', 'error'] as const

function Flaeche() {
  return (
    <main>
      <p data-satz-unavailable={ACTIVITY_TAG_UNVERFUEGBAR} hidden>
        {ACTIVITY_TAG_UNVERFUEGBAR}
      </p>
      <p data-satz-abdeckung={ACTIVITY_ABDECKUNGSHINWEIS} hidden>
        {ACTIVITY_ABDECKUNGSHINWEIS}
      </p>
      {faelle.map((fall) => (
        <section key={fall} data-szenario={fall}>
          <AktivitaetenBereich reise={reise(fall, fall)} />
        </section>
      ))}
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('root fehlt')
createRoot(root).render(
  <StrictMode>
    <Flaeche />
  </StrictMode>,
)
