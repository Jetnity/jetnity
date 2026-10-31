'use client'

import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import MobilitaetBereich from '@/components/trips/MobilitaetBereich'
import TripWorkspace from '@/components/trips/TripWorkspace'
import type { Trip, TripStage } from '@/types/trips'

const JETZT = '2026-10-31T12:00:00.000Z'

function etappe(id: string, name: string, position: number, arrival: string, departure: string | null): TripStage {
  return {
    id,
    name,
    position,
    countryCode: 'TH',
    arrivalDate: arrival,
    departureDate: departure,
    latitude: null,
    longitude: null,
    placeId: null,
  }
}

function reiseVon(id: string, stages: TripStage[]): Trip {
  return {
    id,
    clientRef: null,
    title: 'Synthetic',
    origin: 'Zürich',
    originPlaceId: null,
    startDate: '2026-11-01',
    endDate: '2026-11-08',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'calm',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages,
    days: [{
      id: 'day-1',
      stageId: stages[0]?.id ?? null,
      dayIndex: 1,
      dayDate: '2026-11-01',
      title: null,
      items: [],
    }],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

const START = [
  etappe('a', 'Chiang Mai', 1, '2026-11-01', '2026-11-03'),
  etappe('b', 'Ayutthaya', 2, '2026-11-03', null),
]

function Probe() {
  const seam = new URLSearchParams(window.location.search).get('seam') === 'account' ? 'account' : 'guest'
  const [quelle, setQuelle] = useState<'guest' | 'account'>(seam)
  const [zeigen, setZeigen] = useState(true)
  const [reise, setReise] = useState(() => reiseVon(seam === 'account' ? 'trip-account' : 'trip-guest', START))
  return (
    <div className="workspace-shell" data-workspace-theme="light" data-collapsed="false">
      <div className="workspace-page">
        <div className="workspace-content">
          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" data-seam="guest" onClick={() => { setQuelle('guest'); setReise(reiseVon('trip-guest', START)) }}>Gast</button>
            <button type="button" data-seam="account" onClick={() => { setQuelle('account'); setReise(reiseVon('trip-account', START)) }}>Konto</button>
            <button type="button" data-workspace-aus onClick={() => setZeigen(false)}>Workspace aus</button>
            <button type="button" data-workspace-an onClick={() => setZeigen(true)}>Workspace an</button>
            <button
              type="button"
              data-etappe-tausch
              onClick={() => setReise((alt) => reiseVon(alt.id, [...alt.stages].reverse().map((stage, index) => ({ ...stage, position: index + 1 }))))}
            >
              Etappen tauschen
            </button>
          </div>
          {zeigen ? <TripWorkspace
            reise={reise}
            quelle={quelle}
            ohneTag={reise.ohneTag}
            anfangsBereich="mobilitaet"
            onPunktAnlegen={async () => null}
            onPunktEntfernen={async () => null}
            mobilitaetssuche={
              <MobilitaetBereich
                reise={reise}
                ohneTag={reise.ohneTag}
                onBuchungsstatus={async () => null}
                onManuellAnlegen={async () => null}
                onMietwagenAnlegen={async () => null}
              />
            }
          /> : null}
        </div>
      </div>
    </div>
  )
}

const root = document.getElementById('root')
if (root) createRoot(root).render(<Probe />)
