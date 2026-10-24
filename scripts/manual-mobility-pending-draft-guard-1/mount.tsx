import { createRoot, type Root } from 'react-dom/client'

import { ManuelleVerbindung } from '@/components/trips/MobilitaetBereich'
import type { MobilityManuellEingabe } from '@/lib/mobility/schema'
import type { Trip } from '@/types/trips'

const reise = {
  id: 'trip-synthetic-mobility',
  clientRef: 'trip-synthetic-mobility',
  title: 'Synthetische Verbindung',
  origin: 'Zürich',
  originPlaceId: 'place:zurich',
  startDate: '2026-11-02',
  endDate: '2026-11-04',
  travellers: 1,
  currency: 'CHF',
  budgetAmount: null,
  status: 'draft',
  pace: 'balanced',
  interests: [],
  travelWish: null,
  revision: 1,
  lastMutationId: null,
  stages: [
    { id: 'stage-1', name: 'Bern' },
    { id: 'stage-2', name: 'Bern' },
  ],
  days: [
    { id: 'day-1', dayIndex: 1, title: 'Anreise', dayDate: '2026-11-02', stageId: 'stage-1', items: [] },
    { id: 'day-2', dayIndex: 2, title: 'Stadt', dayDate: '2026-11-03', stageId: 'stage-2', items: [] },
  ],
} as Trip

type Vorgabe = Partial<MobilityManuellEingabe>
type Outcome = 'success' | 'error-string' | 'reject'

const mainVorgabe: Vorgabe = {
  mode: 'rail',
  originName: 'Zürich HB',
  originPlaceId: 'station:8503000',
  destinationName: 'Bern',
  destinationPlaceId: 'station:8507000',
  startsOn: '2026-11-02',
  dayId: 'day-1',
}

let outcome: Outcome = 'success'
let release: () => void = () => {}
let epoch = 1
let mounted = true
const calls: { epoch: number; eingabe: MobilityManuellEingabe }[] = []
const host = document.getElementById('root')
if (!host) throw new Error('missing root')
let root: Root = createRoot(host)

function onAnlegen(eingabe: MobilityManuellEingabe) {
  const current = epoch
  calls.push({ epoch: current, eingabe })
  window.fixture.held = true
  return new Promise<string | null>((resolve, reject) => {
    release = () => {
      window.fixture.held = false
      if (outcome === 'reject') reject(new Error('synthetic rejection'))
      else if (outcome === 'error-string') resolve('Synthetischer Speicherfehler. Die Eingabe bleibt erhalten.')
      else resolve(null)
    }
  })
}

function paint(vorgabe: Vorgabe = mainVorgabe) {
  root.render(<ManuelleVerbindung reise={reise} onAnlegen={onAnlegen} vorgabe={vorgabe} />)
}

window.fixture = {
  calls,
  held: false,
  mainVorgabe,
  arm(next: Outcome) {
    outcome = next
    window.fixture.held = false
  },
  release() {
    release()
  },
  reset() {
    calls.splice(0, calls.length)
    window.fixture.held = false
  },
  unmount() {
    if (!mounted) return
    root.unmount()
    mounted = false
  },
  remount(vorgabe?: Vorgabe) {
    if (mounted) root.unmount()
    epoch += 1
    root = createRoot(host)
    mounted = true
    paint(vorgabe ?? mainVorgabe)
  },
}

paint()

declare global {
  interface Window {
    fixture: {
      calls: { epoch: number; eingabe: MobilityManuellEingabe }[]
      held: boolean
      mainVorgabe: Vorgabe
      arm: (next: Outcome) => void
      release: () => void
      reset: () => void
      unmount: () => void
      remount: (vorgabe?: Vorgabe) => void
    }
  }
}
