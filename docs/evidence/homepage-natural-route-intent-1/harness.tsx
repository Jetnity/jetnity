import * as React from 'react'
import { createRoot } from 'react-dom/client'

import StartzielForm from '@/components/places/StartzielForm'

type OrtOption = {
  id: string
  label: string
  description: string
  typ: 'city' | 'country'
  ariaLabel: string
  landAliasMatch?: boolean
}

const ORTE: OrtOption[] = [
  {
    id: 'geonames:2988507',
    label: 'Paris',
    description: 'Stadt · Frankreich',
    typ: 'city',
    ariaLabel: 'Paris, Stadt',
  },
  {
    id: 'geonames:3169070',
    label: 'Rom',
    description: 'Stadt · Italien',
    typ: 'city',
    ariaLabel: 'Rom, Stadt',
  },
  {
    id: 'geonames:3941584',
    label: 'Cusco',
    description: 'Stadt · Cusco, Peru',
    typ: 'city',
    ariaLabel: 'Cusco, Stadt',
  },
  {
    id: 'geonames:3936456',
    label: 'Lima',
    description: 'Stadt · Lima, Peru',
    typ: 'city',
    ariaLabel: 'Lima, Stadt',
  },
  {
    id: 'geonames:3932480',
    label: 'Peru',
    description: 'Land',
    typ: 'country',
    ariaLabel: 'Peru, Land',
    landAliasMatch: true,
  },
  {
    id: 'geonames:3277605',
    label: 'Bosnien und Herzegowina',
    description: 'Land',
    typ: 'country',
    ariaLabel: 'Bosnien und Herzegowina, Land',
    landAliasMatch: true,
  },
  {
    id: 'geonames:3573591',
    label: 'Trinidad und Tobago',
    description: 'Land',
    typ: 'country',
    ariaLabel: 'Trinidad und Tobago, Land',
    landAliasMatch: true,
  },
  {
    id: 'geonames:1605651',
    label: 'Thailand',
    description: 'Land',
    typ: 'country',
    ariaLabel: 'Thailand, Land',
    landAliasMatch: true,
  },
  {
    id: 'geonames:1831722',
    label: 'Kambodscha',
    description: 'Land',
    typ: 'country',
    ariaLabel: 'Kambodscha, Land',
    landAliasMatch: true,
  },
  {
    id: 'geonames:1562822',
    label: 'Vietnam',
    description: 'Land',
    typ: 'country',
    ariaLabel: 'Vietnam, Land',
    landAliasMatch: true,
  },
  {
    id: 'geonames:4250542',
    label: 'Springfield',
    description: 'Stadt · Illinois, Vereinigte Staaten',
    typ: 'city',
    ariaLabel: 'Springfield, Stadt · Illinois',
  },
  {
    id: 'geonames:4409896',
    label: 'Springfield',
    description: 'Stadt · Missouri, Vereinigte Staaten',
    typ: 'city',
    ariaLabel: 'Springfield, Stadt · Missouri',
  },
]

function falten(wert: string): string {
  return wert.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

function ganzeTreffer(frage: string): OrtOption[] | null {
  const q = falten(frage)
  if (q === falten('Bosnien und Herzegowina')) {
    return ORTE.filter((ort) => ort.id === 'geonames:3277605')
  }
  if (q === falten('Trinidad und Tobago')) {
    return ORTE.filter((ort) => ort.id === 'geonames:3573591')
  }
  if (q === falten('Lima, Peru')) {
    return ORTE.filter((ort) => ort.id === 'geonames:3936456')
  }
  if (q === falten('Peru')) {
    return ORTE.filter((ort) => ort.id === 'geonames:3932480')
  }
  if (q === falten('Lima und Cusco') || q === falten('Thailand, Kambodscha und Vietnam')) {
    return []
  }
  if (q === falten('Paris, Rom, Paris')) return []
  return null
}

const originalFetch = window.fetch.bind(window)
window.fetch = async (input, init) => {
  const url = String(input)
  if (url.includes('/api/search/places')) {
    const fail = (window as Window & { __placesFailStatus?: number }).__placesFailStatus
    if (fail) {
      return new Response(JSON.stringify({ error: 'unavailable' }), {
        status: fail,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const frage = new URL(url, 'http://harness.local').searchParams.get('q') ?? ''
    const ganz = ganzeTreffer(frage)
    const treffer =
      ganz ??
      ORTE.filter((ort) => falten(ort.label) === falten(frage) || falten(ort.label).includes(falten(frage)))
    return new Response(JSON.stringify(treffer), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return originalFetch(input, init)
}

;(window as Window & { __routerPushes?: string[] }).__routerPushes = []

function App() {
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
