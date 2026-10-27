import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { GetYourGuidePruefFlaeche } from '@/components/trips/GetYourGuideAktivitaeten'
import { anwendungsRenderer } from '@/lib/activities/getyourguide/renderer'
import type { GetYourGuideNaht } from '@/lib/activities/getyourguide/widget'
import type { Ort } from '@/lib/places/domain'
import type { Trip, TripDay, TripStage } from '@/types/trips'

const KANARIEN = 'private-canary-ux-gyg-expand-1'

function ort(id: string, name: string, typ: Ort['typ'], countryCode: string, country: string): Ort {
  return {
    id,
    source: 'geonames',
    sourceId: id.split(':')[1] ?? id,
    name,
    typ,
    country,
    countryCode,
    region: null,
    lat: null,
    lon: null,
    iata: null,
    keywords: null,
  }
}

const bangkok = ort('geonames:1609350', 'Bangkok', 'city', 'TH', 'Thailand')
const portugal = ort('geonames:2264397', 'Portugal', 'country', 'PT', 'Portugal')
const kreta = ort('geonames:2593313', 'Kreta', 'island', 'GR', 'Griechenland')
const orte = [bangkok, portugal, kreta]

const naht: GetYourGuideNaht = {
  herkunft: 'pruefung',
  freigabe: { status: 'bereit' },
  orteLesen: (id) => orte.find((eintrag) => eintrag.id === id) ?? null,
  kanonBestaetigen: null,
  renderer: anwendungsRenderer,
}

function etappe(id: string, name: string, countryCode: string, placeId: string): TripStage {
  return {
    id,
    position: 1,
    name,
    countryCode,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId,
  }
}

function tag(id: string, stageId: string, title: string): TripDay {
  return { id, dayIndex: 1, stageId, dayDate: null, title, items: [] }
}

function reise(id: string, stage: TripStage, days: TripDay[]): Trip {
  return {
    id,
    clientRef: id,
    title: stage.name,
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
    travelWish: KANARIEN,
    revision: 1,
    lastMutationId: null,
    stages: [stage],
    days,
    ohneTag: [],
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
  }
}

const reisen = {
  bangkok: reise('trip-bangkok', etappe('stage-bkk', 'Bangkok', 'TH', bangkok.id), [tag('day-bkk', 'stage-bkk', 'Tag Bangkok')]),
  portugal: reise('trip-portugal', etappe('stage-pt', 'Portugal', 'PT', portugal.id), []),
  kreta: reise('trip-kreta', etappe('stage-kreta', 'Kreta', 'GR', kreta.id), [tag('day-kreta', 'stage-kreta', 'Tag Kreta')]),
}

function Flaeche() {
  return (
    <main>
      <p data-kanarien="dom">{KANARIEN}</p>
      <section data-szenario="bangkok">
        <GetYourGuidePruefFlaeche reise={reisen.bangkok} angeforderteTagId="day-bkk" naht={naht} />
      </section>
      <section data-szenario="portugal">
        <GetYourGuidePruefFlaeche reise={reisen.portugal} angeforderteTagId={null} naht={naht} />
      </section>
      <section data-szenario="kreta">
        <GetYourGuidePruefFlaeche reise={reisen.kreta} angeforderteTagId="day-kreta" naht={naht} />
      </section>
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
