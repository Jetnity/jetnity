'use client'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import { n12Reise } from '@/lib/trips/n12-chronology-1/fixture'

function Flaeche() {
  const reise = React.useMemo(() => n12Reise(), [])
  const [tag, setTag] = React.useState(reise.days[0]?.id ?? '')
  const quelle = new URLSearchParams(window.location.search).get('quelle') === 'konto' ? 'konto' : 'gast'
  return (
    <div data-plan-quelle={quelle}>
      <TripWorkspacePlan
        reise={reise}
        ohneTag={reise.ohneTag}
        aktiverTag={tag}
        kompakt={false}
        onTagWechseln={setTag}
        onPunktAnlegen={async () => null}
        onPunktEntfernen={async () => null}
      />
    </div>
  )
}

export function mountN12ChronologieHarness() {
  const wurzel = document.getElementById('root')
  if (!wurzel) return
  createRoot(wurzel).render(<Flaeche />)
}

if (typeof document !== 'undefined' && document.getElementById('root')) {
  mountN12ChronologieHarness()
}
