'use client'

import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import type { Ort } from '@/lib/places/domain'
import type { Trip, TripDay, TripStage } from '@/types/trips'

function ort(id: string, name: string, typ: Ort['typ'], countryCode: string): Ort {
  return {
    id,
    source: 'geonames',
    sourceId: id.split(':')[1] ?? id,
    name,
    typ,
    country: countryCode,
    countryCode,
    region: null,
    lat: null,
    lon: null,
    iata: null,
    keywords: null,
  }
}

const bangkok = ort('geonames:1609350', 'Bangkok', 'city', 'TH')
const koChang = ort('geonames:1609604', 'Ko Chang', 'island', 'TH')
const phuket = ort('geonames:1151254', 'Phuket', 'city', 'TH')
const chiangMai = ort('geonames:1153671', 'Chiang Mai', 'city', 'TH')
const thailand = ort('geonames:1605651', 'Thailand', 'country', 'TH')

function etappe(id: string, name: string, place: Ort, position: number, countryCode: string | null = place.countryCode): TripStage {
  return {
    id,
    position,
    name,
    countryCode,
    placeId: place.id,
    arrivalDate: null,
    departureDate: null,
    latitude: place.lat,
    longitude: place.lon,
  }
}

function tag(id: string, dayIndex: number, stageId: string | null, dayDate: string | null, title: string | null): TripDay {
  return { id, dayIndex, stageId, dayDate, title, items: [] }
}

function reise(teil: Pick<Trip, 'id' | 'stages' | 'days'>): Trip {
  return {
    id: teil.id,
    clientRef: teil.id,
    title: 'Synthetische Reise',
    origin: null,
    originPlaceId: null,
    startDate: '2026-11-02',
    endDate: '2026-11-14',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: teil.stages,
    days: teil.days,
    ohneTag: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  }
}

const faelle: Record<string, { reise: Trip; orte: Map<string, Ort | null> }> = {
  thailand: {
    reise: reise({
      id: 'trip-synth-th',
      stages: [
        etappe('stage-bkk', 'Bangkok frei', bangkok, 1),
        etappe('stage-kc', 'Ko Chang frei', koChang, 2),
        etappe('stage-phu', 'Phuket frei', phuket, 3),
      ],
      days: [
        tag('day-ab', 1, null, '2026-11-02', 'Anreise'),
        tag('day-bkk', 2, 'stage-bkk', '2026-11-03', 'Bangkok-Tag'),
        tag('day-kc', 3, 'stage-kc', '2026-11-06', 'Ko-Chang-Tag'),
        tag('day-phu', 4, 'stage-phu', '2026-11-10', 'Phuket-Tag'),
        tag('day-rueck', 5, null, '2026-11-14', 'Abreise'),
      ],
    }),
    orte: new Map([
      [bangkok.id, bangkok],
      [koChang.id, koChang],
      [phuket.id, phuket],
    ]),
  },
  wiederholung: {
    reise: reise({
      id: 'trip-synth-wieder',
      stages: [
        etappe('stage-hin', 'Bangkok hin', bangkok, 1),
        etappe('stage-cm', 'Chiang Mai frei', chiangMai, 2),
        etappe('stage-rueck', 'Bangkok zurück', bangkok, 3),
      ],
      days: [
        tag('day-hin', 1, 'stage-hin', '2026-11-02', 'Hin'),
        tag('day-cm', 2, 'stage-cm', '2026-11-05', 'Chiang-Mai-Tag'),
        tag('day-rueck', 3, 'stage-rueck', '2026-11-08', 'Rück'),
      ],
    }),
    orte: new Map([
      [bangkok.id, bangkok],
      [chiangMai.id, chiangMai],
    ]),
  },
  land: {
    reise: reise({
      id: 'trip-synth-land',
      stages: [etappe('stage-th', 'Thailand frei', thailand, 1)],
      days: [],
    }),
    orte: new Map([[thailand.id, thailand]]),
  },
  widerspruch: {
    reise: reise({
      id: 'trip-synth-konflikt',
      stages: [etappe('stage-konflikt', 'Bangkok frei', bangkok, 1, 'PT'), etappe('stage-phu', 'Phuket frei', phuket, 2)],
      days: [tag('day-ab', 1, null, '2026-11-02', 'Anreise')],
    }),
    orte: new Map<string, Ort | null>([
      [bangkok.id, bangkok],
      [phuket.id, phuket],
    ]),
  },
}

type Schreib = { etappeId: string; tagId: string }

declare global {
  interface Window {
    __aktivitaetSchriebe?: Schreib[]
  }
}

function Flaeche() {
  const parameter = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const fall = faelle[parameter.get('fall') ?? 'thailand'] ? (parameter.get('fall') ?? 'thailand') : 'thailand'
  const thema = parameter.get('thema') === 'green' ? 'green' : 'light'
  const [sichtbar, setSichtbar] = useState(parameter.get('sichtbar') !== 'nein')
  const daten = faelle[fall] ?? faelle.thailand
  return (
    <div className="workspace-shell" data-workspace-theme={thema} data-collapsed="false" data-menu-open="false">
      <div className="workspace-page">
        <div className="workspace-content">
          <div className="flex gap-2 p-3">
            <button type="button" onClick={() => setSichtbar(false)}>
              Fläche verdecken
            </button>
            <button type="button" onClick={() => setSichtbar(true)}>
              Fläche zeigen
            </button>
          </div>
          <main className="w-full max-w-none px-3 pb-8">
            <AktivitaetenBereich
              reise={daten.reise}
              bestaetigteOrte={daten.orte}
              sichtbar={sichtbar}
              onUebernehmen={async (etappe, tag) => {
                const eintrag = { etappeId: etappe.id, tagId: tag.id }
                window.__aktivitaetSchriebe = [...(window.__aktivitaetSchriebe ?? []), eintrag]
                return 'synth-punkt'
              }}
            />
          </main>
        </div>
      </div>
    </div>
  )
}

export function mountActivitiesDestinationHarness() {
  const root = document.getElementById('root')
  if (!root) return
  document.body.classList.add('min-h-screen', 'bg-surface-75', 'text-foreground', 'antialiased')
  createRoot(root).render(<Flaeche />)
}

if (typeof document !== 'undefined') mountActivitiesDestinationHarness()
