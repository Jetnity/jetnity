'use client'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import GastCreateLink from '@/components/trips/GastCreateLink'
import TripWorkspaceModeNavigation from '@/components/trips/TripWorkspaceModeNavigation'
import { gastreiseAnlegen, gastreiseEntfernen } from '@/lib/trips/gastspeicher'
import type { WorkspaceAnsicht } from '@/lib/trips/workspace-mode'
import type { CreateTripInput } from '@/types/trips'

function eingabe(clientRef: string, title: string): CreateTripInput {
  return {
    clientRef,
    title,
    destination: 'Lissabon',
    destinationPlaceId: 'geonames:2267057',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    pace: 'balanced',
    interests: [],
    travelWish: null,
  }
}

function Flaeche() {
  const [ansicht, setAnsicht] = React.useState<WorkspaceAnsicht>('uebersicht')
  const [hinweis, setHinweis] = React.useState('bereit')

  const wechsel = (naechste: WorkspaceAnsicht, tastatur: boolean) => {
    setAnsicht(naechste)
    ;(window as Window & { __gastNavWechsel?: { ansicht: string; tastatur: boolean } }).__gastNavWechsel = {
      ansicht: naechste,
      tastatur,
    }
  }

  const anlegen = (id: string, title: string) => {
    try {
      gastreiseAnlegen(eingabe(id, title))
      setHinweis('angelegt')
    } catch {
      setHinweis('abgelehnt')
    }
  }

  return (
    <div data-gast-nav-harness className="min-h-screen bg-white text-brand-800">
      <header
        data-harness-header
        className="sticky top-0 z-40 flex h-[72px] items-center border-b border-line-200 bg-white px-3"
      >
        <div data-cta="kopf" className="min-w-0">
          <GastCreateLink
            createHref="/planen"
            createLabel="Reise planen"
            className="inline-flex min-h-11 max-w-full items-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white"
          />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-5">
        <p className="h-64">Synthetische Fläche</p>
        <TripWorkspaceModeNavigation
          ansicht={ansicht}
          kompakt={false}
          detailOffen={false}
          onWechsel={wechsel}
        />
        <div className="mt-6 flex max-w-full flex-col gap-2">
          <button type="button" data-aktion="anlegen-a" className="min-h-11 text-left" onClick={() => anlegen('trip-a-synthetic', 'Reise A')}>
            Gastreise A anlegen
          </button>
          <button
            type="button"
            data-aktion="verwerfen"
            className="min-h-11 text-left"
            onClick={() => {
              try {
                gastreiseEntfernen()
                setHinweis('leer')
              } catch {
                setHinweis('abgelehnt')
              }
            }}
          >
            Gastreise verwerfen
          </button>
          <button type="button" data-aktion="anlegen-b" className="min-h-11 text-left" onClick={() => anlegen('trip-b-synthetic', 'Reise B')}>
            Gastreise B anlegen
          </button>
        </div>
        <p data-hinweis={hinweis} className="h-[1600px]">
          {hinweis}
        </p>
      </main>
      <footer data-cta="fuss" className="px-3 pb-8">
        <GastCreateLink
          createHref="/planen"
          createLabel="Reise planen"
          className="inline-flex min-h-11 max-w-full items-center text-sm font-semibold text-brand-800"
        />
      </footer>
    </div>
  )
}

export function mountGastNavTextHarness() {
  const wurzel = document.getElementById('root')
  if (!wurzel) return
  createRoot(wurzel).render(<Flaeche />)
}

if (typeof document !== 'undefined' && document.getElementById('root')) {
  mountGastNavTextHarness()
}
