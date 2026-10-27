// Synthetische Fläche. Kein Anbieter, kein Geschwister-Widget im Aktivitätsbereich.
// Aufruf nur über synthese.ts.

import { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import { GetYourGuidePruefFlaeche } from '@/components/trips/GetYourGuideAktivitaeten'
import { anwendungsRenderer } from '@/lib/activities/getyourguide/renderer'
import type { GetYourGuideNaht } from '@/lib/activities/getyourguide/widget'
import type { Trip, TripDay, TripStage } from '@/types/trips'

import { bruecke } from './synthese-bruecke'

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
    title: 'Synthetische Prüfung',
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
  id: 'trip-synthese-wechsel',
  stages: [
    etappe({ id: 'stage-lissabon', name: 'Lissabon', countryCode: 'PT', placeId: 'geonames:2267057' }),
    etappe({ id: 'stage-kreta', name: 'Kreta', countryCode: 'GR', placeId: 'geonames:2593313' }),
  ],
  days: [
    tag({ id: 'day-lissabon', dayIndex: 1, stageId: 'stage-lissabon', title: 'Tag Lissabon' }),
    tag({ id: 'day-kreta', dayIndex: 2, stageId: 'stage-kreta', title: 'Tag Kreta' }),
  ],
})

const nativeReise = reise({
  id: 'trip-synthese-nativ',
  stages: [etappe({ id: 'stage-nativ', name: 'Lissabon', countryCode: 'PT', placeId: 'geonames:2267057' })],
  days: [tag({ id: 'day-nativ', dayIndex: 1, stageId: 'stage-nativ', title: 'Nativer Reisetag' })],
})

const kretaReise = reise({
  id: 'trip-synthese-gleichzeitig',
  stages: [etappe({ id: 'stage-gleich-kreta', name: 'Kreta', countryCode: 'GR', placeId: 'geonames:2593313' })],
  days: [tag({ id: 'day-gleich-kreta', dayIndex: 1, stageId: 'stage-gleich-kreta', title: 'Gleichzeitig Kreta' })],
})

const naht: GetYourGuideNaht = {
  herkunft: 'pruefung',
  freigabe: { status: 'bereit' },
  orteLesen: null,
  kanonBestaetigen: (id, signal) => bruecke().ortOeffnen(id, signal, 'signal'),
  renderer: anwendungsRenderer,
}

function Lebenszyklus() {
  const [tagId, setTagId] = useState('day-lissabon')
  const [sichtbar, setSichtbar] = useState(true)
  return (
    <section data-szenario="lebenszyklus">
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setTagId('day-lissabon')}>
          Lebenszyklus Lissabon
        </button>
        <button type="button" onClick={() => setTagId('day-kreta')}>
          Lebenszyklus Kreta
        </button>
        <button type="button" onClick={() => setSichtbar((wert) => !wert)}>
          Lebenszyklus ausblenden
        </button>
      </div>
      {sichtbar ? <GetYourGuidePruefFlaeche reise={wechselReise} angeforderteTagId={tagId} naht={naht} /> : null}
    </section>
  )
}

function Verschraenkt() {
  const [sichtbar, setSichtbar] = useState(true)
  return (
    <section data-szenario="verschraenkt">
      <button type="button" onClick={() => setSichtbar((wert) => !wert)}>
        Verschränkt ausblenden
      </button>
      {sichtbar ? <AktivitaetenBereich reise={wechselReise} /> : null}
    </section>
  )
}

function Gleichzeitig() {
  const [zeigen, setZeigen] = useState(false)
  return (
    <section data-szenario="gleichzeitig">
      <button type="button" onClick={() => setZeigen(true)}>
        Gleichzeitig zeigen
      </button>
      {zeigen ? <GetYourGuidePruefFlaeche reise={kretaReise} angeforderteTagId="day-gleich-kreta" naht={naht} /> : null}
    </section>
  )
}

function Nativ() {
  const [zeigen, setZeigen] = useState(false)
  const auflösen = useRef<((wert: null) => void) | null>(null)
  return (
    <section data-szenario="nativ">
      <button type="button" onClick={() => setZeigen(true)}>
        Native Fläche zeigen
      </button>
      <button
        type="button"
        onClick={() => {
          auflösen.current?.(null)
          auflösen.current = null
        }}
      >
        Übernahme abschliessen
      </button>
      {zeigen ? (
        <AktivitaetenBereich
          reise={nativeReise}
          onUebernehmen={() => {
            bruecke().uebernahme()
            return new Promise((resolve) => {
              auflösen.current = resolve
            })
          }}
        />
      ) : null}
    </section>
  )
}

function Flaeche() {
  return (
    <main>
      <Lebenszyklus />
      <Verschraenkt />
      <Gleichzeitig />
      <Nativ />
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('root fehlt')
createRoot(root).render(<Flaeche />)
