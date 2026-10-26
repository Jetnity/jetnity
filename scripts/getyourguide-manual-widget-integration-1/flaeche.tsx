import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import { GetYourGuidePruefFlaeche } from '@/components/trips/GetYourGuideAktivitaeten'
import { anwendungsRenderer } from '@/lib/activities/getyourguide/renderer'
import type { GetYourGuideNaht } from '@/lib/activities/getyourguide/widget'
import type { Ort } from '@/lib/places/domain'
import type { Trip, TripDay, TripStage } from '@/types/trips'

function ort(id: string, name: string, typ: Ort['typ'], countryCode: string, country: string, region: string | null = null): Ort {
  return {
    id,
    source: 'geonames',
    sourceId: id.split(':')[1] ?? id,
    name,
    typ,
    country,
    countryCode,
    region,
    lat: null,
    lon: null,
    iata: null,
    keywords: null,
  }
}

const lissabon = ort('geonames:2267057', 'Lissabon', 'city', 'PT', 'Portugal', '11')
const kreta = ort('geonames:2593313', 'Kreta', 'island', 'GR', 'Griechenland', 'A1')
const portugal = ort('geonames:2264397', 'Portugal', 'country', 'PT', 'Portugal')
const orte = [lissabon, kreta, portugal]

const naht: GetYourGuideNaht = {
  herkunft: 'pruefung',
  freigabe: { status: 'bereit' },
  orteLesen: (id) => orte.find((eintrag) => eintrag.id === id) ?? null,
  kanonBestaetigen: null,
  renderer: anwendungsRenderer,
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function tag(teil: Partial<TripDay> & Pick<TripDay, 'id' | 'dayIndex'>): TripDay {
  return { stageId: null, dayDate: null, title: null, items: [], ...teil }
}

function reise(teil: Partial<Trip> & Pick<Trip, 'id'>): Trip {
  return {
    clientRef: teil.id,
    title: 'Öffentliche Prüfung',
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

const wechselReise = reise({
  id: 'trip-kanarien-private-reise-7f3a',
  stages: [
    etappe({ id: 'stage-lissabon', name: 'Lissabon', countryCode: 'PT', placeId: lissabon.id }),
    etappe({ id: 'stage-kreta', name: 'Kreta', countryCode: 'GR', placeId: kreta.id }),
  ],
  days: [
    tag({ id: 'day-lissabon', dayIndex: 1, stageId: 'stage-lissabon', title: 'Tag Lissabon' }),
    tag({ id: 'day-kreta', dayIndex: 2, stageId: 'stage-kreta', title: 'Tag Kreta' }),
  ],
})

const landReise = reise({
  id: 'trip-land-portugal',
  stages: [etappe({ id: 'stage-pt', name: 'Portugal', countryCode: 'PT', placeId: portugal.id })],
})

const nativeReise = reise({
  id: 'trip-nativ',
  stages: [etappe({ id: 'stage-nativ', name: 'Lissabon', countryCode: 'PT', placeId: lissabon.id })],
  days: [tag({ id: 'day-nativ', dayIndex: 1, stageId: 'stage-nativ', title: 'Nativer Reisetag' })],
})

function Wechsel() {
  const [tagId, setTagId] = useState('day-lissabon')
  return (
    <div data-szenario="wechsel" className="relative overflow-hidden">
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setTagId('day-lissabon')}>
          Tag Lissabon
        </button>
        <button type="button" onClick={() => setTagId('day-kreta')}>
          Tag Kreta
        </button>
      </div>
      <GetYourGuidePruefFlaeche reise={wechselReise} angeforderteTagId={tagId} naht={naht} />
    </div>
  )
}

function Flaeche() {
  return (
    <main>
      <p data-kanarien="dom">kanarien-private-reise-7f3a</p>
      <section data-szenario="nativ" className="relative overflow-hidden">
        <AktivitaetenBereich
          reise={nativeReise}
          onUebernehmen={async () => null}
        />
      </section>
      <Wechsel />
      <section data-szenario="land" className="relative overflow-hidden">
        <GetYourGuidePruefFlaeche reise={landReise} angeforderteTagId={null} naht={naht} />
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
