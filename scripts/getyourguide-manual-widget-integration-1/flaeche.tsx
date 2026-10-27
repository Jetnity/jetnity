import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import { GetYourGuidePruefFlaeche } from '@/components/trips/GetYourGuideAktivitaeten'
import { anwendungsRenderer } from '@/lib/activities/getyourguide/renderer'
import type { GetYourGuideNaht, GygLadeErgebnis, GygRenderer } from '@/lib/activities/getyourguide/widget'
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

type Ausstehend = { id: string; resolve: (ort: Ort | null) => void; reject: (grund: Error) => void }
type PruefFenster = Window & {
  __gygPruef?: {
    wartend: string[]
    aufloesen: (id: string, ort: Ort | null) => boolean
    ablehnen: (id: string) => boolean
    laden: { warten: boolean; fehler: boolean }
    offen: HTMLElement[]
  }
}

const ausstehend: Ausstehend[] = []

function pruefFenster(): NonNullable<PruefFenster['__gygPruef']> {
  const fenster = window as PruefFenster
  if (!fenster.__gygPruef) {
    fenster.__gygPruef = {
      wartend: [],
      aufloesen: () => false,
      ablehnen: () => false,
      laden: { warten: false, fehler: false },
      offen: [],
    }
  }
  return fenster.__gygPruef
}

function wartendSchreiben() {
  pruefFenster().wartend = ausstehend.map((eintrag) => eintrag.id)
}

function bestaetigenVerzoegert(id: string, signal: AbortSignal): Promise<Ort | null> {
  return new Promise((resolve, reject) => {
    const eintrag: Ausstehend = { id, resolve, reject }
    ausstehend.push(eintrag)
    wartendSchreiben()
    const abbruch = () => {
      const index = ausstehend.indexOf(eintrag)
      if (index >= 0) ausstehend.splice(index, 1)
      wartendSchreiben()
      resolve(null)
    }
    if (signal.aborted) {
      abbruch()
      return
    }
    signal.addEventListener('abort', abbruch, { once: true })
  })
}

pruefFenster().aufloesen = (id, ort) => {
  const index = ausstehend.findIndex((eintrag) => eintrag.id === id)
  if (index < 0) return false
  const [eintrag] = ausstehend.splice(index, 1)
  wartendSchreiben()
  eintrag?.resolve(ort)
  return true
}
pruefFenster().ablehnen = (id) => {
  const index = ausstehend.findIndex((eintrag) => eintrag.id === id)
  if (index < 0) return false
  const [eintrag] = ausstehend.splice(index, 1)
  wartendSchreiben()
  eintrag?.reject(new Error('synthetisch'))
  return true
}

const synthetischerRenderer: GygRenderer = {
  laden(suche, ziel, signal) {
    const fenster = pruefFenster()
    const knoten = document.createElement('div')
    knoten.dataset.gygSynthese = suche.umfang
    knoten.textContent = suche.umfang === 'land' ? suche.countryCode : `${suche.name} ${suche.countryCode}`
    ziel.append(knoten)
    if (fenster.laden.fehler) {
      knoten.remove()
      return Promise.resolve({ art: 'abgelehnt', meldung: '' })
    }
    if (!fenster.laden.warten) return Promise.resolve({ art: 'ressource' })
    return new Promise<GygLadeErgebnis>((resolve) => {
      let fertig = false
      const ende = (ergebnis: GygLadeErgebnis) => {
        if (fertig) return
        fertig = true
        knoten.removeAttribute('data-gyg-wartet')
        resolve(ergebnis)
      }
      knoten.dataset.gygWartet = '1'
      fenster.offen.push(knoten)
      signal.addEventListener('abort', () => ende({ art: 'abgelehnt', meldung: '' }), { once: true })
      knoten.addEventListener('jetnity-gyg-freigabe', (event) => {
        const ok = (event as CustomEvent<boolean>).detail === true
        ende(ok ? { art: 'ressource' } : { art: 'abgelehnt', meldung: '' })
      })
    })
  },
  entsorgen(ziel) {
    ziel.replaceChildren()
  },
}

const naht: GetYourGuideNaht = {
  herkunft: 'pruefung',
  freigabe: { status: 'bereit' },
  orteLesen: (id) => orte.find((eintrag) => eintrag.id === id) ?? null,
  kanonBestaetigen: null,
  renderer: anwendungsRenderer,
}

const synthetischeNaht: GetYourGuideNaht = {
  ...naht,
  kanonBestaetigen: null,
  renderer: synthetischerRenderer,
}

const verzoegerteNaht: GetYourGuideNaht = {
  ...naht,
  orteLesen: null,
  kanonBestaetigen: bestaetigenVerzoegert,
  renderer: synthetischerRenderer,
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

function Lebenszyklus() {
  const [tagId, setTagId] = useState('day-lissabon')
  const [sichtbar, setSichtbar] = useState(true)
  return (
    <section data-szenario="lebenszyklus" className="relative overflow-hidden">
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
      {sichtbar ? <GetYourGuidePruefFlaeche reise={wechselReise} angeforderteTagId={tagId} naht={verzoegerteNaht} /> : null}
    </section>
  )
}

function Gleichzeitig() {
  const [zeigen, setZeigen] = useState(false)
  return (
    <section data-szenario="gleichzeitig" className="relative overflow-hidden">
      <button type="button" onClick={() => setZeigen(true)}>
        Gleichzeitig zeigen
      </button>
      {zeigen ? (
        <GetYourGuidePruefFlaeche
          reise={reise({
            id: 'trip-gleichzeitig-kreta',
            stages: [etappe({ id: 'stage-gleich-kreta', name: 'Kreta', countryCode: 'GR', placeId: kreta.id })],
            days: [tag({ id: 'day-gleich-kreta', dayIndex: 1, stageId: 'stage-gleich-kreta', title: 'Gleichzeitig Kreta' })],
          })}
          angeforderteTagId="day-gleich-kreta"
          naht={verzoegerteNaht}
        />
      ) : null}
    </section>
  )
}

function Gemeinsam() {
  const offen = useRef<((wert: null) => void) | null>(null)
  return (
    <section data-szenario="nativ" className="relative overflow-hidden">
      <button
        type="button"
        onClick={() => {
          offen.current?.(null)
          offen.current = null
        }}
      >
        Übernahme abschliessen
      </button>
      <AktivitaetenBereich
        reise={nativeReise}
        onUebernehmen={() =>
          new Promise((resolve) => {
            offen.current = resolve
          })
        }
      />
      <GetYourGuidePruefFlaeche reise={nativeReise} angeforderteTagId="day-nativ" naht={synthetischeNaht} />
    </section>
  )
}

function Flaeche() {
  return (
    <main>
      <p data-kanarien="dom">kanarien-private-reise-7f3a</p>
      <Lebenszyklus />
      <Gleichzeitig />
      <Gemeinsam />
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
