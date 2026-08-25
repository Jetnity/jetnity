'use client'

import type { RefObject } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function TripWorkspaceNavigation({
  sichtbar,
  onZurueck,
  zurueckRef,
}: {
  sichtbar: boolean
  onZurueck: () => void
  zurueckRef: RefObject<HTMLButtonElement | null>
}) {
  if (!sichtbar) return null

  return (
    <nav
      aria-label="Reise"
      className="sticky top-[calc(72px+env(safe-area-inset-top))] z-40 -mx-3 mt-4 border-y border-line-200 bg-surface-75/95 px-3 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6"
    >
      <button
        ref={zurueckRef}
        type="button"
        onClick={onZurueck}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-200 bg-white px-3.5 text-sm font-semibold text-brand-800 transition hover:border-line-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Zurück zur Reise
      </button>
    </nav>
  )
}
