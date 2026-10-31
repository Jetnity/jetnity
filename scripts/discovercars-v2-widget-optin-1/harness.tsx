import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import DiscoverCarsWidgetOptin from '@/components/trips/DiscoverCarsWidgetOptin'
import MietwagenBereich from '@/components/trips/MietwagenBereich'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { WIDGET_PRUEFNAHT } from '@/lib/providers/discovercars/widget/vertrag'
import type { TripStage } from '@/types/trips'

type Modus = 'inert' | 'naht' | 'mietwagen'
type Laden = (lauf: number) => Promise<'fixture' | 'fehler'>

declare global {
  interface Window {
    __modus: Modus
    __reise: string
    __laden?: Laden
    __setzen: (modus: Modus, reise: string) => void
  }
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'position' | 'name'>): TripStage {
  return {
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

/** Bangkok city is a negative fixture. It must not become a widget pickup. */
function reise(id: string) {
  return beispielreise({
    id,
    clientRef: `ref-${id}`,
    title: 'Bangkok nur als Titel',
    origin: 'Bangkok',
    currency: 'THB',
    travellers: 4,
    startDate: '1988-04-02',
    endDate: '1988-04-09',
    stages: [
      etappe({
        id: 'stage-bangkok-stadt',
        position: 1,
        name: 'Bangkok',
        countryCode: 'TH',
        placeId: 'place-bangkok-city',
        latitude: 13.7563,
        longitude: 100.5018,
      }),
      etappe({
        id: 'stage-phuket',
        position: 2,
        name: 'Phuket',
        countryCode: 'TH',
      }),
    ],
  })
}

/** Local copy of the light workspace ancestors. No account, router, or network. */
function Schale({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace-shell" data-workspace-theme="light" data-collapsed="false" data-menu-open="false">
      <div className="workspace-page">
        <div id="workspace-content" tabIndex={-1} className="workspace-content">
          {children}
        </div>
      </div>
    </div>
  )
}

function Flaeche() {
  const [modus, setModus] = useState<Modus>(window.__modus)
  const [reiseId, setReiseId] = useState(window.__reise)
  useEffect(() => {
    window.__setzen = (naechsterModus, naechsteReise) => {
      setModus(naechsterModus)
      setReiseId(naechsteReise)
    }
  }, [])
  if (modus === 'mietwagen') {
    return (
      <Schale>
        <main className="min-w-0 bg-canvas p-3">
          <MietwagenBereich reise={reise(reiseId)} onManuellAnlegen={async () => null} />
        </main>
      </Schale>
    )
  }
  return (
    <Schale>
      <main className="min-w-0 bg-canvas p-3">
        <input aria-label="Davor" className="mb-3 block min-h-11 w-full max-w-full rounded-xl border border-line-200 px-3" />
        <DiscoverCarsWidgetOptin
          reiseId={reiseId}
          pruefnaht={modus === 'naht' ? WIDGET_PRUEFNAHT : undefined}
          laden={(lauf) => (window.__laden ? window.__laden(lauf) : Promise.resolve('fixture'))}
        />
        <input aria-label="Danach" className="mt-3 block min-h-11 w-full max-w-full rounded-xl border border-line-200 px-3" />
      </main>
    </Schale>
  )
}

createRoot(document.getElementById('root')!).render(<Flaeche />)
