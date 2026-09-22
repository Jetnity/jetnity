import * as React from 'react'
import { createRoot } from 'react-dom/client'

import OrtSuche from '@/components/places/OrtSuche'
import StartzielForm from '@/components/places/StartzielForm'
import TripPlanner from '@/components/trips/TripPlanner'
import type { OrtAuswahl } from '@/lib/places/auswahl'

const ORTE = [
  {
    id: 'geonames:2988507',
    label: 'Paris',
    description: 'Frankreich',
    typ: 'city' as const,
    ariaLabel: 'Paris, Stadt',
  },
  {
    id: 'geonames:3169070',
    label: 'Rom',
    description: 'Italien',
    typ: 'city' as const,
    ariaLabel: 'Rom, Stadt',
  },
  {
    id: 'geonames:3941584',
    label: 'Cusco',
    description: 'Peru',
    typ: 'city' as const,
    ariaLabel: 'Cusco, Stadt',
  },
  {
    id: 'geonames:2657896',
    label: 'Zürich',
    description: 'Schweiz',
    typ: 'city' as const,
    ariaLabel: 'Zürich, Stadt',
  },
]

const originalFetch = window.fetch.bind(window)
window.fetch = async (input, init) => {
  const url = String(input)
  if (url.includes('/api/search/places')) {
    const frage = new URL(url, 'http://harness.local').searchParams.get('q') ?? ''
    const treffer = ORTE.filter((ort) => ort.label.toLowerCase().includes(frage.trim().toLowerCase()))
    return new Response(JSON.stringify(treffer), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return originalFetch(input, init)
}

;(window as Window & { __routerPushes?: string[] }).__routerPushes = []
;(window as Window & { __bestaetigenCalls?: unknown[] }).__bestaetigenCalls = []
;(window as Window & { __reiseAnlegenCalls?: unknown[] }).__reiseAnlegenCalls = []

const params = new URLSearchParams(window.location.search)
const flaeche = params.get('surface') ?? 'startziel'

function weitereAusParams() {
  const roh = params.get('weitere') ?? ''
  if (!roh) return []
  return roh.split('|').map((eintrag) => {
    const [id, name] = eintrag.split(',')
    return { id: id ?? '', name: name ?? id ?? '' }
  })
}

function MinimaleOrtSuche() {
  const [ort, setOrt] = React.useState<OrtAuswahl | null>(null)
  const [roh, setRoh] = React.useState('')
  return (
    <div className="min-h-screen bg-white p-4">
      <OrtSuche
        rolle="abreise"
        variante="field"
        value={ort}
        inputId="feld-minimal"
        onChange={(wert, text) => {
          setOrt(wert)
          setRoh(wert?.name ?? text)
        }}
        inputClassName="h-12 w-full rounded-2xl border border-line-200 px-4"
      />
      <p data-model-name={ort?.name ?? ''}>{ort ? 'confirmed' : 'pending'}</p>
      <p data-roh={roh}>{roh}</p>
    </div>
  )
}

function GesteuerteOrtSuche() {
  const [ort, setOrt] = React.useState<OrtAuswahl | null>(null)
  const [samen, setSamen] = React.useState('Paris')
  return (
    <div className="min-h-screen bg-white p-4">
      <OrtSuche
        rolle="ziel"
        variante="field"
        value={ort}
        initialText={samen}
        inputId="feld-samen"
        onChange={(wert, text) => {
          setOrt(wert)
          setSamen(wert?.name ?? text)
        }}
        inputClassName="h-12 w-full rounded-2xl border border-line-200 px-4"
      />
      <button type="button" onClick={() => { setOrt(null); setSamen('Cusco') }}>
        seed-cusco
      </button>
      <button type="button" onClick={() => { setOrt(null); setSamen('') }}>
        reset-empty
      </button>
    </div>
  )
}

function App() {
  if (flaeche === 'ortsuche') {
    return <MinimaleOrtSuche />
  }
  if (flaeche === 'ortsuche-samen') {
    return <GesteuerteOrtSuche />
  }
  if (flaeche === 'planner') {
    return (
      <div className="min-h-screen bg-[var(--background,#f6f3ea)] p-4">
        <TripPlanner
          angemeldet={params.get('konto') === '1'}
          initialDestination={params.get('ziel') ?? 'Paris'}
          initialDestinationId={params.get('zielId') ?? 'geonames:2988507'}
          initialWeitereZiele={weitereAusParams()}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#12352f] p-4">
      <StartzielForm />
    </div>
  )
}

const wurzel = document.getElementById('root')
if (wurzel) {
  createRoot(wurzel).render(<App />)
  ;(window as Window & { __hydrateReady?: boolean }).__hydrateReady = true
}
