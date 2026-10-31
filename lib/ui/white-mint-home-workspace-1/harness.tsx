import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import HomePage from '@/app/(public)/page'
import GastArbeitsbereich from '@/components/trips/GastArbeitsbereich'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import PublicChrome from '@/components/workspace/PublicChrome'
import { paareSammeln } from '@/lib/ui/white-mint-home-workspace-1/kontrast-audit'
import { gastreiseAnlegen, gastreiseLadenNach } from '@/lib/trips/gastspeicher'
import type { Trip } from '@/types/trips'

declare global {
  interface Window {
    __whiteMintPaareSammeln?: (selector: string) => ReturnType<typeof paareSammeln>
  }
}

const REISE_ID = 'trip-white-mint'

function pfad() {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname || '/'
}

function beispielreise(): Trip {
  const vorhanden = gastreiseLadenNach(REISE_ID)
  if (vorhanden) return vorhanden
  return gastreiseAnlegen({
    clientRef: REISE_ID,
    title: 'Lissabon Beispiel',
    destination: 'Lissabon',
    destinationPlaceId: 'geonames:2267057',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-11-02',
    endDate: '2026-11-04',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    pace: 'balanced',
    interests: ['culture'],
    travelWish: null,
  })
}

/** Real guest workspace. The trip is synthetic and stays in this browser's local storage. */
function GastMontage({ tripId }: { tripId: string }) {
  useState(() => {
    beispielreise()
    return tripId
  })
  return (
    <div data-synthetic-guest data-white-mint-guest="echt">
      <GastArbeitsbereich tripId={tripId} />
    </div>
  )
}

function NegativeKontrollen() {
  return (
    <>
      <div className="dark" data-negative="admin">
        <p className="bg-background p-4 text-foreground">Admin-Dunkelsteuerung</p>
      </div>
      <iframe title="Anbieterrahmen" data-negative="provider" src="/white-mint-provider-frame.html" />
    </>
  )
}

export function WhiteMintHarness() {
  const route = pfad()
  if (route.startsWith('/account')) {
    return (
      <>
        {/* Probe only: the shell navigation is real. This paragraph is not the settings form. */}
        <WorkspaceShell>
          <p data-white-mint-probe="account-placeholder">Kontoeintrag, keine Einstellungsseite</p>
        </WorkspaceShell>
        <NegativeKontrollen />
      </>
    )
  }
  const gast = route.match(/^\/reisen\/(trip-[^/]+)$/)
  return (
    <>
      <PublicChrome>{gast ? <GastMontage tripId={gast[1]!} /> : route === '/' ? <HomePage /> : null}</PublicChrome>
      <NegativeKontrollen />
    </>
  )
}

export function whiteMintHarnessMounted() {
  return true
}

if (typeof window !== 'undefined') {
  window.__whiteMintPaareSammeln = (selector: string) => paareSammeln(document.querySelector(selector))
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('root')
  if (root) createRoot(root).render(<WhiteMintHarness />)
}
