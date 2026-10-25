import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import EigeneReisevorbereitung from '@/components/trips/EigeneReisevorbereitung'
import { usePersonalPreparationLifecycle } from '@/components/trips/usePersonalPreparationLifecycle'
import type { ReadinessAktualisierung } from '@/lib/readiness/personal-preparation-workflow'
import { readinessAnsicht } from '@/lib/readiness/status'
import type { Trip } from '@/types/trips'

type Modus = 'vorbereitung' | 'plan'

type Start = {
  seam: 'account' | 'guest'
  reise: Trip
  kanonisch?: Trip
}

type Bruecke = {
  setzen: unknown[]
  entfernen: string[]
  lesen: number
  schreibenFreigeben: (wert: string | null) => void
  schreibenScheitern: () => void
  lesenFreigeben: (wert: ReadinessAktualisierung) => void
  reiseSetzen: (reise: Trip) => void
  kanonischSetzen: (reise: Trip | undefined) => void
  modusSetzen: (modus: Modus) => void
}

declare global {
  interface Window {
    __START__: Start
    __PERSONAL__: Bruecke
  }
}

function Host() {
  const start = window.__START__
  const [reise, setReise] = useState(start.reise)
  const [kanonisch, setKanonisch] = useState<Trip | undefined>(start.kanonisch)
  const [modus, setModus] = useState<Modus>('vorbereitung')
  const setzen = useRef<unknown[]>([])
  const entfernen = useRef<string[]>([])
  const lesen = useRef(0)
  const schreibenOffen = useRef<Array<{ resolve: (wert: string | null) => void; reject: () => void }>>([])
  const lesenOffen = useRef<Array<(wert: ReadinessAktualisierung) => void>>([])
  const steuerung = usePersonalPreparationLifecycle({
    tripId: reise.id,
    reise,
    kanonisch,
    seam: start.seam,
    onSetzen: async (payload) => {
      setzen.current.push(payload)
      return new Promise((resolve, reject) => {
        schreibenOffen.current.push({ resolve, reject })
      })
    },
    onEntfernen: async (clientRef) => {
      entfernen.current.push(clientRef)
      return new Promise((resolve, reject) => {
        schreibenOffen.current.push({ resolve, reject })
      })
    },
    onAktualisieren: async () => {
      lesen.current += 1
      return new Promise((resolve) => {
        lesenOffen.current.push(resolve)
      })
    },
  })

  useEffect(() => {
    window.__PERSONAL__ = {
      get setzen() {
        return setzen.current
      },
      get entfernen() {
        return entfernen.current
      },
      get lesen() {
        return lesen.current
      },
      schreibenFreigeben: (wert) => {
        schreibenOffen.current.shift()?.resolve(wert)
      },
      schreibenScheitern: () => {
        schreibenOffen.current.shift()?.reject()
      },
      lesenFreigeben: (wert) => {
        lesenOffen.current.shift()?.(wert)
      },
      reiseSetzen: setReise,
      kanonischSetzen: setKanonisch,
      modusSetzen: setModus,
    }
  }, [])

  const items = readinessAnsicht(reise).items
  return (
    <main className="min-w-0 bg-canvas p-3">
      <button type="button" onClick={() => setModus((wert) => (wert === 'vorbereitung' ? 'plan' : 'vorbereitung'))}>
        Ansicht wechseln
      </button>
      <p data-personal-modus={modus}>{modus === 'plan' ? 'Reiseplan' : 'Vorbereitung'}</p>
      {modus === 'vorbereitung' ? (
        <EigeneReisevorbereitung reise={reise} items={items} onSetzen={async () => null} steuerung={steuerung} erstellenLabel="Punkt hinzufügen" />
      ) : null}
      <p data-personal-hook-lieferung={steuerung.lieferung} data-personal-hook-barrier={steuerung.barrier ? 'true' : 'false'} />
    </main>
  )
}

const wurzel = document.getElementById('root')
if (!wurzel) throw new Error('Montagepunkt fehlt')
createRoot(wurzel).render(<Host />)
