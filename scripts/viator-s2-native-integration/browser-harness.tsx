'use client'

import { createRoot } from 'react-dom/client'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import type { Trip } from '@/types/trips'

const reise: Trip = {
  id: 'trip-viator-s2',
  clientRef: 'trip-viator-s2',
  title: 'Thailand',
  origin: null,
  originPlaceId: null,
  startDate: '2026-11-02',
  endDate: '2026-11-05',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: null,
  status: 'draft',
  pace: 'balanced',
  interests: [],
  travelWish: null,
  revision: 1,
  lastMutationId: null,
  stages: [
    {
      id: 'stage-bkk',
      position: 1,
      name: 'Bangkok',
      countryCode: 'TH',
      arrivalDate: '2026-11-02',
      departureDate: '2026-11-03',
      latitude: 13.75,
      longitude: 100.5,
      placeId: 'geonames:1609350',
    },
    {
      id: 'stage-phu',
      position: 2,
      name: 'Phuket',
      countryCode: 'TH',
      arrivalDate: '2026-11-04',
      departureDate: '2026-11-05',
      latitude: 7.88,
      longitude: 98.39,
      placeId: null,
    },
  ],
  days: [
    { id: 'day-bkk', stageId: 'stage-bkk', dayIndex: 1, dayDate: '2026-11-02', title: 'Bangkok-Tag', items: [] },
    { id: 'day-phu', stageId: 'stage-phu', dayIndex: 2, dayDate: '2026-11-04', title: 'Phuket-Tag', items: [] },
  ],
  ohneTag: [],
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
}

export function mountViatorHarness() {
  const root = document.getElementById('root')
  if (!root) return
  createRoot(root).render(<AktivitaetenBereich reise={reise} />)
}

if (typeof document !== 'undefined') mountViatorHarness()
