import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { GetYourGuidePruefFlaeche } from '@/components/trips/GetYourGuideAktivitaeten'
import { embedPfad } from '@/lib/activities/getyourguide/dokument'
import type { GygAnzahl, GygSuchkonfiguration } from '@/lib/activities/getyourguide/suche'
import type { GygLadeErgebnis, GygRenderer } from '@/lib/activities/getyourguide/widget'
import type { Ort } from '@/lib/places/domain'
import type { Trip, TripDay, TripStage } from '@/types/trips'

type Zeile = { id: number; anzahl: number | null; pfad: string; aborted: boolean; settled: boolean }

const zeilen: Zeile[] = []

function ort(id: string, name: string, typ: Ort['typ'], countryCode: string): Ort {
  return {
    id,
    source: 'geonames',
    sourceId: id.split(':')[1] ?? id,
    name,
    typ,
    country: countryCode === 'TH' ? 'Thailand' : 'Griechenland',
    countryCode,
    region: null,
    lat: null,
    lon: null,
    iata: null,
    keywords: null,
  }
}

const orte = [ort('geonames:1609350', 'Bangkok', 'city', 'TH'), ort('geonames:2593313', 'Kreta', 'island', 'GR')]

function etappe(id: string, name: string, placeId: string, countryCode: string): TripStage {
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

function reise(id: string, stage: TripStage, day: TripDay): Trip {
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
    travelWish: 'private-canary-ux-gyg-expand-1',
    revision: 1,
    lastMutationId: null,
    stages: [stage],
    days: [day],
    ohneTag: [],
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
  }
}

const bangkok = reise(
  'trip-bangkok',
  etappe('stage-bkk', 'Bangkok', 'geonames:1609350', 'TH'),
  tag('day-bkk', 'stage-bkk', 'Tag Bangkok'),
)
const kreta = reise(
  'trip-kreta',
  etappe('stage-kreta', 'Kreta', 'geonames:2593313', 'GR'),
  tag('day-kreta', 'stage-kreta', 'Tag Kreta'),
)

const renderer: GygRenderer = {
  laden(suche: GygSuchkonfiguration, ziel: HTMLElement, signal: AbortSignal, anzahl?: GygAnzahl) {
    const id = zeilen.length + 1
    const pfad = embedPfad(suche, anzahl)
    const zeile: Zeile = { id, anzahl: anzahl ?? null, pfad, aborted: false, settled: false }
    zeilen.push(zeile)
    const marke = document.createElement('div')
    marke.dataset.uxRahmen = String(id)
    marke.textContent = pfad
    ziel.replaceChildren(marke)
    return new Promise<GygLadeErgebnis>((resolve) => {
      const ende = (ergebnis: GygLadeErgebnis) => {
        if (zeile.settled) return
        zeile.settled = true
        resolve(ergebnis)
      }
      signal.addEventListener('abort', () => {
        zeile.aborted = true
        marke.remove()
        ende({ art: 'abgelehnt', meldung: '' })
      })
      const fenster = window as unknown as { __ux?: { wartend: Map<number, (ok: boolean) => void> } }
      fenster.__ux?.wartend.set(id, (ok) => ende(ok ? { art: 'ressource' } : { art: 'abgelehnt', meldung: '' }))
    })
  },
  entsorgen(ziel) {
    ziel.replaceChildren()
  },
}

const wartend = new Map<number, (ok: boolean) => void>()
;(window as unknown as { __ux: unknown }).__ux = {
  wartend,
  zeilen: () => zeilen.map((zeile) => ({ ...zeile })),
  freigeben: (id: number, ok: boolean) => wartend.get(id)?.(ok) ?? false,
  imDokument: (id: number) => Boolean(document.querySelector(`[data-ux-rahmen="${id}"]`)),
}

function Flaeche() {
  const [zweite, setZweite] = useState(false)
  return (
    <main>
      <section data-szenario="bangkok">
        <GetYourGuidePruefFlaeche
          reise={bangkok}
          angeforderteTagId="day-bkk"
          naht={{
            herkunft: 'pruefung',
            freigabe: { status: 'bereit' },
            orteLesen: null,
            kanonBestaetigen: async (id) => orte.find((eintrag) => eintrag.id === id) ?? null,
            renderer,
          }}
        />
      </section>
      <button type="button" onClick={() => setZweite(true)}>
        Zweite Instanz zeigen
      </button>
      {zweite ? (
        <section data-szenario="kreta">
          <GetYourGuidePruefFlaeche
            reise={kreta}
            angeforderteTagId="day-kreta"
            naht={{
              herkunft: 'pruefung',
              freigabe: { status: 'bereit' },
              orteLesen: null,
              kanonBestaetigen: async (id) => orte.find((eintrag) => eintrag.id === id) ?? null,
              renderer,
            }}
          />
        </section>
      ) : null}
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
