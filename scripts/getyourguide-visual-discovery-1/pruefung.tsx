import { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import { GetYourGuidePruefFlaeche } from '@/components/trips/GetYourGuideAktivitaeten'
import type { GetYourGuideNaht, GygRenderer } from '@/lib/activities/getyourguide/widget'
import type { Ort } from '@/lib/places/domain'
import type { Trip, TripDay, TripStage } from '@/types/trips'

type Bericht = {
  laden: number
  entsorgen: number
  abgebrochen: number
  bezuege: unknown[]
}

declare global {
  interface Window {
    __gyg?: Bericht
  }
}

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
const phuket = ort('geonames:9001151254', 'Phuket', 'city', 'TH', 'Thailand')
const panama = ort('geonames:9003703430', 'Panama', 'country', 'PA', 'Panama')
const panamaStadt = ort('geonames:9003703443', 'Panama City', 'city', 'PA', 'Panama')
const langesLand = ort(
  'geonames:9003703431',
  'Panama mit einem sehr langen bestätigten Ländernamen für schmale und vergrösserte Schrift',
  'country',
  'PA',
  'Panama',
)

const ABBILDUNG: GetYourGuideNaht['abbildung'] = [
  { art: 'ort', ortId: bangkok.id, typ: 'city', kennung: 'synthetic-public:bangkok-city' },
  { art: 'ort', ortId: phuket.id, typ: 'city', kennung: 'synthetic-public:phuket-city' },
  { art: 'ort', ortId: panamaStadt.id, typ: 'city', kennung: 'synthetic-public:panama-city' },
  { art: 'land', countryCode: 'TH', kennung: 'synthetic-public:thailand' },
  { art: 'land', countryCode: 'PA', kennung: 'synthetic-public:panama' },
]

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

function tag(id: string, dayIndex: number, stageId: string, title: string): TripDay {
  return { id, dayIndex, stageId, dayDate: null, title, items: [] }
}

function reise(teil: Partial<Trip> & Pick<Trip, 'id' | 'stages' | 'days'>): Trip {
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
    ohneTag: [],
    createdAt: '2026-10-26T00:00:00.000Z',
    updatedAt: '2026-10-26T00:00:00.000Z',
    ...teil,
  }
}

const bangkokReise = reise({
  id: 'trip-gyg-pruef',
  stages: [
    etappe('stage-gyg-bkk', 'Bangkok', bangkok.id, 'TH'),
    etappe('stage-gyg-phu', 'Phuket', phuket.id, 'TH'),
    etappe('stage-gyg-bkk-2', 'Bangkok', bangkok.id, 'TH'),
  ],
  days: [
    tag('day-gyg-bkk', 1, 'stage-gyg-bkk', 'Bangkok Hinfahrt'),
    tag('day-gyg-phu', 2, 'stage-gyg-phu', 'Phuket'),
    tag('day-gyg-bkk-2', 3, 'stage-gyg-bkk-2', 'Bangkok Rückfahrt'),
  ],
})

const nativeReise = reise({
  id: 'trip-gyg-nativ',
  stages: [etappe('stage-gyg-bkk', 'Bangkok', bangkok.id, 'TH')],
  days: [tag('day-gyg-nativ', 1, 'stage-gyg-bkk', 'Bangkok-Tag')],
})

function panamaReise(nameOrt: Ort): Trip {
  return reise({
    id: 'trip-gyg-panama',
    stages: [etappe('stage-gyg-pa', 'Panama', nameOrt.id, 'PA')],
    days: [],
  })
}

function veroeffentlichen(stand: Bericht) {
  window.__gyg = {
    laden: stand.laden,
    entsorgen: stand.entsorgen,
    abgebrochen: stand.abgebrochen,
    bezuege: stand.bezuege.map((eintrag) => eintrag),
  }
}

function Pruefung() {
  const [sichtbar, setSichtbar] = useState(true)
  const [zielReise, setZielReise] = useState(bangkokReise)
  const [tagId, setTagId] = useState('day-gyg-bkk')
  const [offen, setOffen] = useState(true)
  const modus = useRef<'ok' | 'fehler'>('ok')
  const bericht = useRef<Bericht>({ laden: 0, entsorgen: 0, abgebrochen: 0, bezuege: [] })
  const orte = useMemo(() => [bangkok, phuket, panama, panamaStadt, langesLand], [])
  const renderer = useMemo<GygRenderer>(() => {
    return {
      laden(bezug, ziel, signal) {
        const stand = bericht.current
        stand.laden += 1
        stand.bezuege.push(JSON.parse(JSON.stringify(bezug)) as unknown)
        const nummer = stand.laden
        veroeffentlichen(stand)
        return new Promise((resolve) => {
          const timer = window.setTimeout(() => {
            if (signal.aborted) return
            if (modus.current === 'fehler') {
              resolve({ art: 'abgelehnt', meldung: 'Die synthetische Prüfung ist fehlgeschlagen.' })
              return
            }
            ziel.replaceChildren()
            const block = document.createElement('div')
            block.dataset.synthetic = 'offer'
            const bild = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            bild.setAttribute('width', '160')
            bild.setAttribute('height', '84')
            bild.setAttribute('role', 'img')
            bild.setAttribute('aria-label', 'Synthetisches Prüfbild')
            const flaeche = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            flaeche.setAttribute('width', '160')
            flaeche.setAttribute('height', '84')
            flaeche.setAttribute('rx', '12')
            flaeche.setAttribute('fill', '#d7ebe3')
            const zeile = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            zeile.setAttribute('x', '12')
            zeile.setAttribute('y', '36')
            zeile.setAttribute('fill', '#153a33')
            zeile.setAttribute('font-size', '14')
            zeile.textContent = 'SYNTHETISCH'
            bild.append(flaeche, zeile)
            const text = document.createElement('p')
            text.className = 'mt-2 break-words text-sm text-ink-800'
            text.textContent = `Synthetisches Prüfbild ${bezug.oeffentlicheKennung} #${nummer}`
            block.append(bild, text)
            ziel.append(block)
            resolve({ art: 'ressource' })
          }, 500)
          signal.addEventListener(
            'abort',
            () => {
              window.clearTimeout(timer)
              stand.abgebrochen += 1
              ziel.replaceChildren()
              veroeffentlichen(stand)
            },
            { once: true },
          )
        })
      },
      entsorgen(ziel) {
        bericht.current.entsorgen += 1
        ziel.replaceChildren()
        veroeffentlichen(bericht.current)
      },
    }
  }, [])

  const naht: GetYourGuideNaht = {
    herkunft: 'pruefung',
    freigabe: offen ? { status: 'bereit' } : { status: 'geschlossen', gruende: ['berechtigung'] },
    orteLesen: (id) => orte.find((eintrag) => eintrag.id === id) ?? null,
    abbildung: ABBILDUNG,
    renderer,
  }

  return (
    <main className="min-w-0 bg-surface-25 p-3">
      <div data-szenario="nativ" className="mx-auto min-w-0 max-w-3xl">
        <AktivitaetenBereich reise={nativeReise} />
      </div>
      <div data-szenario="pruef" className="mx-auto mt-4 min-w-0 max-w-3xl rounded-[24px] border border-line-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => { modus.current = 'ok'; setOffen(true); setZielReise(bangkokReise); setTagId('day-gyg-bkk') }}>
            Bangkok Hinfahrt
          </button>
          <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => { modus.current = 'ok'; setOffen(true); setZielReise(bangkokReise); setTagId('day-gyg-phu') }}>
            Nach Phuket
          </button>
          <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => { modus.current = 'ok'; setOffen(true); setZielReise(bangkokReise); setTagId('day-gyg-bkk-2') }}>
            Bangkok Rückfahrt
          </button>
          <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => { modus.current = 'ok'; setOffen(true); setZielReise(panamaReise(panama)); setTagId('day-fehlt') }}>
            Panama ohne Tage
          </button>
          <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => { modus.current = 'ok'; setOffen(true); setZielReise(panamaReise(langesLand)); setTagId('day-fehlt') }}>
            Langer Ländername
          </button>
          <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => { modus.current = 'fehler'; setOffen(true) }}>
            Nächster Abschluss scheitert
          </button>
          <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => { modus.current = 'ok' }}>
            Nächster Abschluss gelingt
          </button>
          <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => setOffen(false)}>
            Berechtigung zurückziehen
          </button>
          <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => setSichtbar(false)}>
            Fläche entfernen
          </button>
          <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => { modus.current = 'ok'; setOffen(true); setSichtbar(true) }}>
            Fläche wieder zeigen
          </button>
        </div>
        {sichtbar ? (
          <GetYourGuidePruefFlaeche reise={zielReise} angeforderteTagId={zielReise.days.length === 0 ? null : tagId} naht={naht} />
        ) : (
          <p data-entfernt="ja">Die Fläche ist entfernt.</p>
        )}
      </div>
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('root fehlt')
createRoot(root).render(<Pruefung />)
