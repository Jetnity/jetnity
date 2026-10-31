'use client'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import BackToTop from '@/components/layout/BackToTop'
import TripWorkspaceModeNavigation from '@/components/trips/TripWorkspaceModeNavigation'
import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import { referenzReise } from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'

function Flaeche() {
  const reise = React.useMemo(() => referenzReise(), [])
  const [tag, setTag] = React.useState('')
  const [breite, setBreite] = React.useState(() => window.innerWidth)
  const [schrift, setSchrift] = React.useState(16)
  React.useEffect(() => {
    const lesen = () => setBreite(window.innerWidth)
    window.addEventListener('resize', lesen)
    return () => window.removeEventListener('resize', lesen)
  }, [])
  const neben = breite >= 1100 && schrift < 32
  return (
    <div data-u1c-evidence="" data-u1c-schrift={schrift} style={{ minHeight: '1800px' }}>
      <p data-u1c-methode className="bg-surface-50 px-4 py-2 text-sm text-ink-800">
        {schrift === 32 ? 'Root-Schrift 32px. Das ist keine Browservergrösserung und kein Gerätetest.' : 'Root-Schrift 16px.'}
      </p>
      <TripWorkspaceModeNavigation ansicht="plan" kompakt={!neben} detailOffen={false} onWechsel={() => undefined} />
      <main className="bg-surface-75 p-3">
        <h1 className="text-xl font-semibold text-brand-800">{reise.title}</h1>
        <div style={neben ? { display: 'grid', gridTemplateColumns: 'minmax(20rem, 1fr) minmax(28rem, 1.4fr)', columnGap: '1.5rem', alignItems: 'start' } : undefined}>
        <TripWorkspacePlan
          reise={reise}
          ohneTag={[]}
          aktiverTag={tag || reise.days[0]?.id || ''}
          kompakt={!neben}
          steuerung="gemessen"
          anordnung={neben ? 'neben' : 'schmal'}
          routeBetont={!neben && tag === ''}
          kanonischerTagId={tag || null}
          onTagWechseln={setTag}
          onPunktAnlegen={async () => null}
          onPunktEntfernen={async () => null}
          onZurRoute={() => setTag('')}
          onKanteWaehlen={(_kanteId, tagId) => setTag(tagId)}
        />
        </div>
      </main>
      <button
        type="button"
        data-u1c-root32
        className="m-3 min-h-11 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white"
        onClick={() => {
          document.documentElement.style.fontSize = '32px'
          setSchrift(32)
        }}
      >
        Root-Schrift 32px
      </button>
      <BackToTop />
    </div>
  )
}

export function mountU1cEvidence() {
  const wurzel = document.getElementById('root')
  if (!wurzel) return
  createRoot(wurzel).render(<Flaeche />)
}

if (typeof document !== 'undefined' && document.getElementById('root')) {
  mountU1cEvidence()
}
