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
    { id: 'day-bkk', stageId: 'stage-bkk', dayIndex: 1, dayDate: '2026-11-02', title: 'Bangkok erster Besuch', items: [] },
    { id: 'day-phu', stageId: 'stage-phu', dayIndex: 2, dayDate: '2026-11-04', title: 'Phuket-Tag', items: [] },
  ],
  ohneTag: [],
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
}

function reiseMitTagen(anzahl: number): Trip {
  if (anzahl <= 2) return reise
  const days = Array.from({ length: anzahl }, (_, index) => {
    const tag = index + 1
    const monat = 10 + Math.floor((tag + 1) / 28)
    const monatstag = ((tag + 1) % 28) + 1
    return {
      id: `day-${tag}`,
      stageId: index < 11 ? 'stage-bkk' : 'stage-phu',
      dayIndex: tag,
      dayDate: `2026-${String(monat).padStart(2, '0')}-${String(monatstag).padStart(2, '0')}`,
      title: `Tag ${tag}`,
      items: [],
    }
  })
  return { ...reise, days }
}

export function mountViatorHarness() {
  const root = document.getElementById('root')
  if (!root) return
  document.body.classList.add('min-h-screen', 'text-foreground', 'antialiased')
  const anzahl = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('tage')
  const gewaehlt = reiseMitTagen(anzahl === '22' ? 22 : 2)
  createRoot(root).render(
    <div className="workspace-shell" data-workspace-theme="light" data-collapsed="false" data-menu-open="false">
      <div className="workspace-page">
        <div id="workspace-content" className="workspace-content">
          <main className="mx-auto max-w-3xl p-4">
            <AktivitaetenBereich reise={gewaehlt} />
          </main>
        </div>
      </div>
    </div>,
  )
}

if (typeof document !== 'undefined') mountViatorHarness()
