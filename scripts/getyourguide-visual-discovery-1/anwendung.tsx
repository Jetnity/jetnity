import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import type { Trip, TripDay, TripStage } from '@/types/trips'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: 'PA',
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: 'geonames:9003703430',
    ...teil,
  }
}

function tag(teil: Partial<TripDay> & Pick<TripDay, 'id' | 'dayIndex' | 'stageId'>): TripDay {
  return { dayDate: null, title: null, items: [], ...teil }
}

function reise(teil: Partial<Trip>): Trip {
  return {
    id: 'trip-gyg-anwendung',
    clientRef: 'trip-gyg-anwendung',
    title: 'Synthetische Reise',
    origin: null,
    originPlaceId: null,
    startDate: null,
    endDate: null,
    travellers: 2,
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
    ohneTag: [],
    createdAt: '2026-10-26T00:00:00.000Z',
    updatedAt: '2026-10-26T00:00:00.000Z',
    ...teil,
  }
}

const langerName =
  'Phuket mit einem langen bestätigten Ortsnamen für schmale Breite und vergrösserte Schrift ohne seitlichen Überlauf'

const ohneTage = reise({
  id: 'trip-gyg-ohne-tage',
  stages: [etappe({ id: 'stage-gyg-pa', name: 'Panama', countryCode: 'PA', placeId: 'geonames:9003703430' })],
})

const mitTagen = reise({
  id: 'trip-gyg-tage',
  stages: [etappe({ id: 'stage-gyg-phu', name: langerName, countryCode: 'TH', placeId: 'geonames:9001151254' })],
  days: [
    tag({ id: 'day-gyg-1', dayIndex: 1, stageId: 'stage-gyg-phu', title: 'Erster langer Reisetag mit ausführlicher Bezeichnung' }),
    tag({ id: 'day-gyg-2', dayIndex: 2, stageId: 'stage-gyg-phu', title: 'Zweiter Reisetag' }),
  ],
})

const ungueltig = reise({
  id: 'trip-gyg-ungueltig',
  stages: [etappe({ id: 'stage-gyg-phu', name: 'Phuket', countryCode: 'TH', placeId: 'geonames:9001151254' })],
  days: [
    tag({ id: 'day-gyg-1', dayIndex: 1, stageId: 'stage-gyg-phu', title: 'Phuket-Tag' }),
    tag({ id: 'day-gyg-2', dayIndex: 2, stageId: 'stage-gyg-phu', title: 'Zweiter Tag' }),
  ],
})

function Bereich({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <div data-szenario={titel} className="mx-auto min-w-0 max-w-3xl p-3">
      {children}
    </div>
  )
}

function Anwendung() {
  return (
    <main className="min-w-0 bg-surface-25">
      <Bereich titel="ohne-tage">
        <AktivitaetenBereich reise={ohneTage} />
      </Bereich>
      <Bereich titel="tage">
        <AktivitaetenBereich reise={mitTagen} />
      </Bereich>
      <Bereich titel="ungueltig">
        <AktivitaetenBereich reise={ungueltig} tagId="day-fehlt" />
      </Bereich>
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('root fehlt')
createRoot(root).render(<Anwendung />)
