'use client'

import { createRoot } from 'react-dom/client'

import TripWorkspace from '@/components/trips/TripWorkspace'
import { n12Punkt, n12Reise } from '@/lib/trips/n12-chronology-1/fixture'

/** 22 gespeicherte Tage plus eine lange Tagesnotiz, damit der Plan über Scroll 900 hinausreicht. */
function u1a2Reise() {
  const reise = n12Reise()
  const tag = reise.days[0]
  if (!tag) return reise
  const zeilen = Array.from({ length: 100 }, (_, index) => {
    return `Synthetische Planzeile ${index + 1} fuer die Navigationsgeometrie ohne privaten Reiseinhalt.`
  })
  tag.items = [
    ...tag.items,
    n12Punkt({
      id: 'note-u1a2-geometry',
      kind: 'note',
      title: 'Tagesnotiz',
      dayId: tag.id,
      position: 2,
      note: zeilen.join(' '),
    }),
  ]
  return reise
}

export function mountUxU1a2Harness() {
  const wurzel = document.getElementById('root')
  if (!wurzel) return
  const reise = u1a2Reise()
  createRoot(wurzel).render(
    <div data-u1a2-harness="">
      <header
        data-site-header
        className="sticky top-0 z-50 flex h-[72px] items-center border-b border-line-200 bg-white px-3 text-sm font-semibold text-brand-800"
      >
        Jetnity
      </header>
      <TripWorkspace
        reise={reise}
        quelle="guest"
        ohneTag={reise.ohneTag}
        hinweis={
          <p data-guest-notice className="mt-5 rounded-2xl border border-line-200 bg-white px-4 py-3 text-sm leading-6 text-ink-800">
            Dieser Entwurf liegt nur in diesem Browser.
          </p>
        }
        onPunktAnlegen={async () => null}
        onPunktEntfernen={async () => null}
      />
    </div>,
  )
}

if (typeof document !== 'undefined' && document.getElementById('root')) {
  mountUxU1a2Harness()
}
