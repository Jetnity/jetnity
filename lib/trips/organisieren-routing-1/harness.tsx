'use client'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import FlugSuche from '@/components/trips/FlugSuche'
import HotelBereich from '@/components/trips/HotelBereich'
import TripWorkspace from '@/components/trips/TripWorkspace'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import { n12Punkt, n12Reise } from '@/lib/trips/n12-chronology-1/fixture'
import type { Trip, TripDay, TripItem, TripStage } from '@/types/trips'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name' | 'position'>): TripStage {
  return {
    countryCode: 'TH',
    arrivalDate: '2026-12-02',
    departureDate: '2026-12-05',
    latitude: 7.8804,
    longitude: 98.3923,
    placeId: 'geonames:1151254',
    ...teil,
  }
}

function tag(teil: Partial<TripDay> & Pick<TripDay, 'id' | 'dayIndex' | 'dayDate'>): TripDay {
  return { stageId: 'stage-hkt', title: null, items: [], ...teil }
}

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title' | 'dayId'>): TripItem {
  return n12Punkt({ stageId: 'stage-hkt', ...teil })
}

/** Synthetische Phuket-Reise: drei Flüge und je ein Eintrag der übrigen Kategorien. */
function phuketReise(): Trip {
  const basis = n12Reise()
  const days = [
    tag({
      id: 'day-1',
      dayIndex: 1,
      dayDate: '2026-12-01',
      items: [
        punkt({
          id: 'flug-zrh-bkk',
          kind: 'flight',
          title: 'ZRH–BKK',
          dayId: 'day-1',
          position: 1,
          startsOn: '2026-12-01',
          startsAt: '22:10',
          endsOn: '2026-12-02',
          endsAt: '15:05',
          priceAmount: 640,
          priceCurrency: 'CHF',
        }),
      ],
    }),
    tag({
      id: 'day-2',
      dayIndex: 2,
      dayDate: '2026-12-02',
      items: [
        punkt({
          id: 'flug-bkk-hkt',
          kind: 'flight',
          title: 'BKK–HKT',
          dayId: 'day-2',
          position: 1,
          startsOn: '2026-12-02',
          startsAt: '09:40',
          priceAmount: 90,
          priceCurrency: 'CHF',
        }),
        punkt({
          id: 'stay-kata',
          kind: 'stay',
          title: 'Kata Beach',
          dayId: 'day-2',
          position: 2,
          startsOn: '2026-12-02',
          endsOn: '2026-12-05',
          priceAmount: 420,
          priceCurrency: 'CHF',
        }),
      ],
    }),
    tag({
      id: 'day-3',
      dayIndex: 3,
      dayDate: '2026-12-03',
      items: [
        punkt({
          id: 'act-altstadt',
          kind: 'activity',
          title: 'Phukets Altstadt',
          dayId: 'day-3',
          position: 1,
          startsOn: '2026-12-03',
          startsAt: '10:00',
        }),
        punkt({
          id: 'transfer-pier',
          kind: 'transfer',
          title: 'Zum Pier',
          dayId: 'day-3',
          position: 2,
          startsOn: '2026-12-03',
          startsAt: '08:30',
          endsOn: '2026-12-03',
          endsAt: '09:10',
          mobilityMode: 'transfer',
          mobilityEvidence: 'user',
          originName: 'Kata Beach',
          destinationName: 'Phuket Pier',
        }),
      ],
    }),
    tag({
      id: 'day-4',
      dayIndex: 4,
      dayDate: '2026-12-04',
      items: [
        punkt({
          id: 'mietwagen-hkt',
          kind: 'rental_car',
          title: 'Mietwagen Phuket',
          dayId: 'day-4',
          position: 1,
          startsOn: '2026-12-04',
          endsOn: '2026-12-05',
          rentalSupplier: 'Synthetisch',
          vehicleClass: 'compact',
          transmission: 'automatic',
          rentalEvidence: 'user',
          priceAmount: 48,
          priceCurrency: 'CHF',
        }),
      ],
    }),
    tag({
      id: 'day-5',
      dayIndex: 5,
      dayDate: '2026-12-05',
      items: [
        punkt({
          id: 'flug-hkt-zrh',
          kind: 'flight',
          title: 'HKT–ZRH',
          dayId: 'day-5',
          position: 1,
          startsOn: '2026-12-05',
          startsAt: '21:00',
          priceAmount: 710,
          priceCurrency: 'CHF',
          bookingStatus: 'booked',
          bookingSource: 'user',
          bookingConfirmedAt: '2026-11-01T00:00:00.000Z',
        }),
      ],
    }),
  ]
  return {
    ...basis,
    id: 'trip-phuket-routing',
    clientRef: 'trip-phuket-routing',
    title: 'Phuket',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-12-01',
    endDate: '2026-12-05',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 2500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    dayStageAssignmentMode: 'explicit',
    revision: 1,
    stages: [etappe({ id: 'stage-hkt', name: 'Phuket', position: 1 })],
    days,
    ohneTag: [],
  }
}

function Flaeche() {
  const [reise] = React.useState(phuketReise)
  return (
    <WorkspaceShell contentId="public-content">
      <div data-organisieren-routing="" data-reise-id={reise.id} data-reise-revision={reise.revision}>
        <TripWorkspace
          reise={reise}
          quelle="guest"
          ohneTag={reise.ohneTag}
          onPunktAnlegen={async () => null}
          onPunktEntfernen={async () => null}
          onBuchungsstatus={async () => null}
          flugsuche={
            <FlugSuche
              reise={reise}
              tagId={reise.days[0]?.id ?? null}
              onUebernehmen={async () => null}
            />
          }
          hotelsuche={<HotelBereich reise={reise} onUebernehmen={async () => null} />}
        />
      </div>
    </WorkspaceShell>
  )
}

function mountOrganisierenRoutingHarness() {
  const wurzel = document.getElementById('root')
  if (!wurzel) return
  createRoot(wurzel).render(<Flaeche />)
}

if (typeof document !== 'undefined' && document.getElementById('root')) {
  mountOrganisierenRoutingHarness()
}
