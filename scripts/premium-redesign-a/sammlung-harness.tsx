import { createRoot } from 'react-dom/client'
import { useSyncExternalStore } from 'react'

import AccountNavigation from '@/components/account/AccountNavigation'
import MyTripsCollection from '@/components/trips/MyTripsCollection'
import { Seitenkopf } from '@/components/ui/seitenkopf'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import { MEINE_REISEN_HAUPT, MEINE_REISEN_INNEN } from '@/lib/trips/my-trips-premium-hub-ux-1'
import {
  parameterAusSuche,
  sammlungAnfrageAus,
  sammlungHref,
  type SammlungErgebnis,
} from '@/lib/trips/reisen-sammlung-abfrage'
import type { TripSummary } from '@/types/trips'

/** Synthetische Konto-Reisen. Keine Kundendaten; drei offene und zwei archivierte Reisen. */
function reise(id: string, titel: string, status: TripSummary['status'], start: string | null, ende: string | null): TripSummary {
  return {
    id,
    title: titel,
    origin: 'Zürich',
    startDate: start,
    endDate: ende,
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status,
    updatedAt: '2026-11-20T12:00:00.000000Z',
    archivePreviousStatus: status === 'archived' ? 'planned' : null,
    stages: [],
    stageCount: 2,
    dayCount: 8,
    itemCount: 5,
  }
}

const REISEN: TripSummary[] = [
  reise('00000000-0000-4000-8000-000000000001', 'Zermatt im Winter', 'planned', '2026-12-18', '2026-12-23'),
  reise('00000000-0000-4000-8000-000000000002', 'Thailand Rundreise', 'planned', '2027-02-04', '2027-02-18'),
  reise('00000000-0000-4000-8000-000000000003', 'Lissabon Wochenende', 'draft', null, null),
  reise('00000000-0000-4000-8000-000000000004', 'Kyoto im Herbst', 'archived', '2025-10-12', '2025-10-20'),
  reise('00000000-0000-4000-8000-000000000005', 'Island Ringstrasse', 'archived', '2025-06-03', '2025-06-12'),
]

function ergebnisFuerAdresse(): SammlungErgebnis {
  const parameter = parameterAusSuche(new URLSearchParams(window.location.search))
  const anfrage = sammlungAnfrageAus(parameter)
  const archiv = anfrage.ok ? anfrage.archiv : 'alle'
  const q = anfrage.ok ? anfrage.q : ''
  const zeilen = REISEN.filter((eintrag) => (archiv === 'archiv' ? eintrag.status === 'archived' : archiv === 'offen' ? eintrag.status !== 'archived' : true)).filter(
    (eintrag) => !q || eintrag.title.toLowerCase().includes(q.toLowerCase()),
  )
  return { ungueltig: false, zeilen, problem: null, hatWeiter: false, naechsterCursor: null, q, archiv, cursor: null, adresse: sammlungHref({ q, archiv, cursor: null }) }
}

function abonnieren(auf: () => void) {
  window.addEventListener('popstate', auf)
  const push = history.pushState.bind(history)
  history.pushState = (...args) => {
    push(...args)
    auf()
  }
  return () => window.removeEventListener('popstate', auf)
}

let zwischenspeicher: { suche: string; wert: SammlungErgebnis } | null = null
function lesen(): SammlungErgebnis {
  if (!zwischenspeicher || zwischenspeicher.suche !== window.location.search) {
    zwischenspeicher = { suche: window.location.search, wert: ergebnisFuerAdresse() }
  }
  return zwischenspeicher.wert
}

function Sammlung() {
  const ergebnis = useSyncExternalStore(abonnieren, lesen, lesen)
  return (
    <MyTripsCollection
      ergebnis={ergebnis}
      fehlerTitel="Deine Reisen konnten nicht geladen werden."
      leerTitel="Noch keine Reise in deinem Konto."
      fehlerHinweis=""
    />
  )
}

const wurzel = typeof document !== 'undefined' ? document.getElementById('root') : null

if (wurzel) {
  createRoot(wurzel).render(
    <WorkspaceShell contentId="public-content">
      <AccountNavigation />
      <main className={MEINE_REISEN_HAUPT}>
        <div className={MEINE_REISEN_INNEN}>
          <Seitenkopf titel="Meine Reisen" className="mb-6">
            In deinem Konto gespeichert und auf allen deinen Geräten sichtbar.
          </Seitenkopf>
          <Sammlung />
        </div>
      </main>
    </WorkspaceShell>,
  )
}
