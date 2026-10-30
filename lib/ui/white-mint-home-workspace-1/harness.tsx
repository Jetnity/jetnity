import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import HomePage from '@/app/(public)/page'
import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import WorkspaceTripChrome from '@/components/workspace/WorkspaceTripChrome'
import PublicChrome from '@/components/workspace/PublicChrome'
import {
  gastPlanpunktAnlegen,
  gastPlanpunktBearbeiten,
  gastPlanpunktEntfernen,
  gastreiseAnlegen,
  gastreiseLadenNach,
} from '@/lib/trips/gastspeicher'
import type { PlanAenderung } from '@/lib/trips/trip-plan-integrated/manual'
import type { PlanpunktFormular } from '@/lib/trips/schema'
import type { Trip, TripItem } from '@/types/trips'

const REISE_ID = 'trip-white-mint'

function pfad() {
  if (typeof window === 'undefined') return '/'
  return window.__jetnityWhiteMintPath || '/'
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

function SynthetischeReise() {
  const [reise, setReise] = useState<Trip | null>(null)
  const [tag, setTag] = useState('')
  const [bereit] = useState(() => {
    const graph = beispielreise()
    return { graph, tagId: graph.days[0]?.id ?? '' }
  })
  const aktuell = reise ?? bereit.graph
  const aktiverTag = tag || bereit.tagId
  const kompakt = typeof window !== 'undefined' && window.innerWidth < 1024
  const speichern = (naechste: Trip) => {
    setReise(naechste)
    return null
  }
  const fehlertext = (ursache: unknown) => (ursache instanceof Error ? ursache.message : 'Speichern fehlgeschlagen')
  return (
    <div data-synthetic-guest>
      <WorkspaceTripChrome ansicht="plan" kompakt={kompakt} detailOffen={false} onWechsel={() => {}} />
      <TripWorkspacePlan
        reise={aktuell}
        ohneTag={[]}
        aktiverTag={aktiverTag}
        kompakt={kompakt}
        onTagWechseln={setTag}
        onPunktAnlegen={async (tagId: string, eingabe: PlanpunktFormular) => {
          try {
            const basis = gastreiseLadenNach(aktuell.id)
            if (!basis) return 'Die Reise ist nicht mehr im Speicher.'
            return speichern(gastPlanpunktAnlegen(basis, { ...eingabe, dayId: tagId }))
          } catch (ursache) {
            return fehlertext(ursache)
          }
        }}
        onPunktBearbeiten={async (original: TripItem, change: PlanAenderung) => {
          try {
            const basis = gastreiseLadenNach(aktuell.id)
            if (!basis) return 'Die Reise ist nicht mehr im Speicher.'
            return speichern(gastPlanpunktBearbeiten(basis, original, change))
          } catch (ursache) {
            return fehlertext(ursache)
          }
        }}
        onPunktEntfernen={async (_tagId: string, punktId: string) => {
          try {
            const basis = gastreiseLadenNach(aktuell.id)
            if (!basis) return 'Die Reise ist nicht mehr im Speicher.'
            return speichern(gastPlanpunktEntfernen(basis, punktId))
          } catch (ursache) {
            return fehlertext(ursache)
          }
        }}
      />
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
        <WorkspaceShell>
          <p>Einstellungen</p>
        </WorkspaceShell>
        <NegativeKontrollen />
      </>
    )
  }
  const workspace = route === '/planen' || route === '/reisen' || route.startsWith('/reisen/')
  return (
    <>
      <PublicChrome>{workspace ? <SynthetischeReise /> : route === '/' ? <HomePage /> : null}</PublicChrome>
      <NegativeKontrollen />
    </>
  )
}

export function whiteMintHarnessMounted() {
  return true
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('root')
  if (root) createRoot(root).render(<WhiteMintHarness />)
}
