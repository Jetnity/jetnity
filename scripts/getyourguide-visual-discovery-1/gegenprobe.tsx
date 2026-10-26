import { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import { GetYourGuidePruefFlaeche } from '@/components/trips/GetYourGuideAktivitaeten'
import type { GetYourGuideNaht, GygKanonBestaetigen, GygRenderer } from '@/lib/activities/getyourguide/widget'
import type { Ort } from '@/lib/places/domain'
import type { Trip, TripDay, TripStage } from '@/types/trips'

type Schreibung = { kennung: string; generation: string; verbunden: boolean; abgebrochen: boolean }

type Bericht = {
  laden: number
  entsorgen: number
  bestaetigt: number
  schreibungen: Schreibung[]
  entsorgtVerbunden: boolean[]
}

declare global {
  interface Window {
    __gygGegenprobe?: Bericht
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
const gleicheId = 'geonames:9001609348'
const gleicheStadt = ort(gleicheId, 'Bangkok', 'city', 'TH', 'Thailand')
const gleicheRegion = ort(gleicheId, 'Bangkok', 'region', 'TH', 'Thailand')

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
    title: 'Synthetische Gegenprobe',
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

const tageReise = reise({
  id: 'trip-gyg-gegen',
  stages: [
    etappe('stage-gyg-a', 'Bangkok', bangkok.id, 'TH'),
    etappe('stage-gyg-b', 'Phuket', phuket.id, 'TH'),
    etappe('stage-gyg-a2', 'Bangkok', bangkok.id, 'TH'),
  ],
  days: [
    tag('day-gyg-a', 1, 'stage-gyg-a', 'Tag A'),
    tag('day-gyg-b', 2, 'stage-gyg-b', 'Tag B'),
    tag('day-gyg-a2', 3, 'stage-gyg-a2', 'Tag A wieder'),
  ],
})

const typReise = reise({
  id: 'trip-gyg-gegen',
  stages: [etappe('stage-gyg-same', 'Bangkok', gleicheId, 'TH')],
  days: [tag('day-gyg-same', 1, 'stage-gyg-same', 'Gleiches Ziel')],
})

const laenderReise = reise({
  id: 'trip-gyg-gegen',
  stages: [
    etappe('stage-gyg-pa', 'Panama', panama.id, 'PA'),
    etappe('stage-gyg-th', 'Bangkok', bangkok.id, 'TH'),
  ],
  days: [],
})

const nativeReise = reise({
  id: 'trip-gyg-nativ',
  stages: [etappe('stage-gyg-bkk', 'Bangkok', bangkok.id, 'TH')],
  days: [tag('day-gyg-nativ', 1, 'stage-gyg-bkk', 'Bangkok-Tag')],
})

function veroeffentlichen(stand: Bericht) {
  window.__gygGegenprobe = {
    laden: stand.laden,
    entsorgen: stand.entsorgen,
    bestaetigt: stand.bestaetigt,
    schreibungen: stand.schreibungen.map((eintrag) => ({ ...eintrag })),
    entsorgtVerbunden: [...stand.entsorgtVerbunden],
  }
}

function Gegenprobe() {
  const [sichtbar, setSichtbar] = useState(true)
  const [offen, setOffen] = useState(true)
  const [flaeche, setFlaeche] = useState<'tage' | 'typ' | 'laender'>('tage')
  const [tagId, setTagId] = useState('day-gyg-a')
  const [typ, setTyp] = useState<'city' | 'region'>('city')
  const [kennung, setKennung] = useState<'a' | 'b'>('a')
  const [klon, setKlon] = useState(0)
  const [panamaAbbildung, setPanamaAbbildung] = useState(true)
  const [bestaetigenStand, setBestaetigenStand] = useState(0)
  const katalog = useRef<Ort[]>([bangkok, phuket, panama, gleicheStadt])
  const verzögerung = useRef(80)
  const resolverModus = useRef<'ok' | 'abgelehnt'>('ok')
  const modus = useRef<'spaet' | 'wurf' | 'entsorgen'>('spaet')
  const bericht = useRef<Bericht>({ laden: 0, entsorgen: 0, bestaetigt: 0, schreibungen: [], entsorgtVerbunden: [] })

  const bestaetigen = useMemo<GygKanonBestaetigen>(() => {
    return (id) => {
      bericht.current.bestaetigt += 1
      veroeffentlichen(bericht.current)
      const warten = verzögerung.current
      const auskunft = bestaetigenStand
      return new Promise((resolve, reject) => {
        window.setTimeout(() => {
          if (resolverModus.current === 'abgelehnt' || auskunft < 0) {
            reject(new Error('https://private.example/places-token'))
            return
          }
          const treffer = katalog.current.find((eintrag) => eintrag.id === id && (id !== gleicheId || eintrag.typ === typ)) ?? null
          resolve(treffer)
        }, warten)
      })
    }
  }, [bestaetigenStand, typ])

  const renderer = useMemo<GygRenderer>(() => {
    return {
      laden(bezug, ziel, signal) {
        const stand = bericht.current
        stand.laden += 1
        veroeffentlichen(stand)
        if (modus.current === 'wurf') throw new Error('https://private.example/widget-token')
        const kennungText = bezug.oeffentlicheKennung
        const generation = ziel.dataset.gygBetrieb ?? ''
        return new Promise((resolve) => {
          window.setTimeout(() => {
            const zeile = document.createElement('p')
            zeile.dataset.syntheticResult = '1'
            zeile.textContent = `result-synthetic:${kennungText}:${generation}`
            ziel.append(zeile)
            stand.schreibungen.push({
              kennung: kennungText,
              generation,
              verbunden: ziel.isConnected,
              abgebrochen: signal.aborted,
            })
            veroeffentlichen(stand)
            resolve({ art: 'ressource' })
          }, 320)
        })
      },
      entsorgen(ziel) {
        bericht.current.entsorgen += 1
        bericht.current.entsorgtVerbunden.push(ziel.isConnected)
        veroeffentlichen(bericht.current)
        if (modus.current !== 'entsorgen') return
        const zeile = document.createElement('p')
        zeile.dataset.syntheticResult = '1'
        zeile.textContent = 'result-synthetic:stale-https://private.example/dispose'
        ziel.append(zeile)
        document.querySelector('[data-szenario="gegenprobe"] [data-gyg-montage]')?.append(ziel)
        throw new Error('https://private.example/dispose')
      },
    }
  }, [])

  const abbildung = useMemo<GetYourGuideNaht['abbildung']>(() => {
    const liste: GetYourGuideNaht['abbildung'] = [
      {
        art: 'ort',
        ortId: bangkok.id,
        typ: 'city',
        kennung: kennung === 'a' ? 'synthetic-public:map-a' : 'synthetic-public:map-b',
      },
      { art: 'ort', ortId: phuket.id, typ: 'city', kennung: 'synthetic-public:phuket-city' },
      { art: 'ort', ortId: gleicheId, typ: 'city', kennung: 'synthetic-public:same-city' },
      { art: 'ort', ortId: gleicheId, typ: 'region', kennung: 'synthetic-public:same-region' },
      { art: 'land', countryCode: 'TH', kennung: 'synthetic-public:thailand' },
    ]
    if (panamaAbbildung) liste.push({ art: 'land', countryCode: 'PA', kennung: 'synthetic-public:panama' })
    const ausgabe = liste.map((eintrag) => ({ ...eintrag }))
    return klon >= 0 ? ausgabe : ausgabe
  }, [kennung, klon, panamaAbbildung])

  const naht = useMemo<GetYourGuideNaht>(
    () => ({
      herkunft: 'pruefung',
      freigabe: offen ? { status: 'bereit' } : { status: 'geschlossen', gruende: ['berechtigung'] },
      orteLesen: null,
      kanonBestaetigen: bestaetigen,
      abbildung,
      renderer,
    }),
    [abbildung, bestaetigen, offen, renderer],
  )

  const zielReise = flaeche === 'laender' ? laenderReise : flaeche === 'typ' ? typReise : tageReise
  const angeforderteTagId = zielReise.days.length === 0 ? null : zielReise.days.length === 1 ? zielReise.days[0]?.id ?? null : tagId
  const knopf = 'min-h-11 rounded-full border px-3 text-sm'

  return (
    <main className="min-w-0 bg-surface-25 p-3">
      <div data-szenario="nativ" className="mx-auto min-w-0 max-w-3xl">
        <AktivitaetenBereich reise={nativeReise} />
      </div>
      <div data-szenario="gegenprobe" className="mx-auto mt-4 min-w-0 max-w-3xl rounded-[24px] border border-line-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" className={knopf} onClick={() => { modus.current = 'spaet'; setOffen(true); setFlaeche('tage'); setTagId('day-gyg-a') }}>Tag A</button>
          <button type="button" className={knopf} onClick={() => { modus.current = 'spaet'; setOffen(true); setFlaeche('tage'); setTagId('day-gyg-b') }}>Tag B</button>
          <button type="button" className={knopf} onClick={() => { modus.current = 'spaet'; setOffen(true); setFlaeche('tage'); setTagId('day-gyg-a2') }}>Tag A wieder</button>
          <button type="button" className={knopf} onClick={() => { katalog.current = [bangkok, phuket, panama, gleicheStadt]; modus.current = 'spaet'; setOffen(true); setFlaeche('typ'); setTyp('city') }}>Als Stadt</button>
          <button type="button" className={knopf} onClick={() => { katalog.current = [bangkok, phuket, panama, gleicheRegion]; modus.current = 'spaet'; setOffen(true); setFlaeche('typ'); setTyp('region') }}>Als Region</button>
          <button type="button" className={knopf} onClick={() => setKennung((wert) => (wert === 'a' ? 'b' : 'a'))}>Kennung wechseln</button>
          <button type="button" className={knopf} onClick={() => setKlon((wert) => wert + 1)}>Abbildung neu</button>
          <button type="button" className={knopf} onClick={() => { modus.current = 'spaet'; setOffen(true); setPanamaAbbildung(true); setFlaeche('laender') }}>Zwei Länder</button>
          <button type="button" className={knopf} onClick={() => setPanamaAbbildung(false)}>Panama-Abbildung aus</button>
          <button type="button" className={knopf} onClick={() => setPanamaAbbildung(true)}>Panama-Abbildung an</button>
          <button type="button" className={knopf} onClick={() => { modus.current = 'wurf' }}>Abschluss wirft</button>
          <button type="button" className={knopf} onClick={() => { modus.current = 'spaet' }}>Abschluss hängt spät</button>
          <button type="button" className={knopf} onClick={() => { modus.current = 'entsorgen' }}>Entsorgung wirft</button>
          <button type="button" className={knopf} onClick={() => { resolverModus.current = 'abgelehnt'; verzögerung.current = 40; setBestaetigenStand((wert) => wert + 1) }}>Bestätigung ablehnen</button>
          <button type="button" className={knopf} onClick={() => { resolverModus.current = 'ok'; verzögerung.current = 80; setBestaetigenStand((wert) => wert + 1) }}>Bestätigung gelingt</button>
          <button type="button" className={knopf} onClick={() => { resolverModus.current = 'ok'; verzögerung.current = 800; setBestaetigenStand((wert) => wert + 1) }}>Bestätigung verzögern</button>
          <button type="button" className={knopf} onClick={() => setOffen(false)}>Berechtigung zurückziehen</button>
          <button type="button" className={knopf} onClick={() => setOffen(true)}>Berechtigung wieder geben</button>
          <button type="button" className={knopf} onClick={() => setSichtbar(false)}>Fläche entfernen</button>
          <button type="button" className={knopf} onClick={() => { modus.current = 'spaet'; setOffen(true); setSichtbar(true) }}>Fläche wieder zeigen</button>
        </div>
        {sichtbar ? (
          <GetYourGuidePruefFlaeche reise={zielReise} angeforderteTagId={angeforderteTagId} naht={naht} />
        ) : (
          <p data-entfernt="ja">Die Fläche ist entfernt.</p>
        )}
      </div>
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('root fehlt')
createRoot(root).render(<Gegenprobe />)
