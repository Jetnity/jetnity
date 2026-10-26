import { createRoot, type Root } from 'react-dom/client'

import AccountUebersichtLive from '@/components/account/AccountUebersichtLive'
import AccountWeltKarte from '@/components/account/AccountWeltKarte'
import { ReiseFensterRahmen } from '@/components/account/account-home-export-1/ReiseFensterRahmen'
import KontoDatenexportAktion from '@/components/account/account-home-export-1/KontoDatenexportAktion'
import { reiseFensterAus } from '@/lib/account/account-home-export-1/fenster'
import { weltBesuchtAbleiten } from '@/lib/account/welt-ansicht'
import { worldMapAbleiten } from '@/lib/account/world-map'
import type { Problem } from '@/lib/api/datenbank-lesen'
import type { TripSummary } from '@/types/trips'

export type HomeFixture = {
  modus: 'home' | 'export' | 'welt'
  reisen: TripSummary[]
  problem: Problem | null
  besuchProblem: Problem | null
  name: string | null
}

declare global {
  interface Window {
    __fixture: HomeFixture
    __root?: Root
    __unmount?: () => void
  }
}

const laender = { flaechen: [], ohneFlaeche: [] }

function Ansicht() {
  const fixture = window.__fixture
  if (fixture.modus === 'export') return <KontoDatenexportAktion />
  const besucht = weltBesuchtAbleiten({ besuche: [], problem: fixture.besuchProblem })
  if (fixture.modus === 'welt') {
    const welt = worldMapAbleiten({ problem: fixture.problem, reisen: fixture.reisen })
    const fenster = reiseFensterAus({
      problem: fixture.problem !== null,
      anzahl: fixture.reisen.length,
    })
    return (
      <ReiseFensterRahmen wert={{ fenster, neuLadenHref: '/account/welt' }}>
        <AccountWeltKarte welt={welt} besucht={besucht} laender={laender} />
      </ReiseFensterRahmen>
    )
  }
  return (
    <AccountUebersichtLive
      name={fixture.name}
      problem={fixture.problem}
      reisen={fixture.reisen}
      besucht={besucht}
      laender={laender}
    />
  )
}

const root = createRoot(document.getElementById('root')!)
window.__root = root
window.__unmount = () => {
  root.unmount()
}
root.render(<Ansicht />)
