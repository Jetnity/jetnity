'use client'

import {
  ARBEITSBEREICH_BEZEICHNUNG,
  ARBEITSBEREICHE,
  type Arbeitsbereich,
} from '@/lib/trips/arbeitsbereich'
import { ScrollRow } from '@/components/ui/scroll-row'
import { cn } from '@/lib/utils'

export default function TripWorkspaceNavigation({
  aktiv,
  onWechsel,
}: {
  aktiv: Arbeitsbereich
  onWechsel: (bereich: Arbeitsbereich) => void
}) {
  return (
    <nav
      aria-label="Reisebereiche"
      className="sticky top-[calc(72px+env(safe-area-inset-top))] z-40 -mx-3 mt-4 border-y border-line-200 bg-surface-75/95 px-3 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6"
    >
      <ScrollRow
        label="Reisebereiche"
        fadeFromClassName="from-surface-75"
        viewportClassName="gap-2"
      >
        {ARBEITSBEREICHE.map((bereich) => {
          const gewaehlt = aktiv === bereich
          return (
            <button
              key={bereich}
              type="button"
              aria-current={gewaehlt ? 'page' : undefined}
              onClick={() => onWechsel(bereich)}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                gewaehlt
                  ? 'border-brand-800 bg-brand-800 text-white'
                  : 'border-line-200 bg-white text-ink-900 hover:border-line-500',
              )}
            >
              {ARBEITSBEREICH_BEZEICHNUNG[bereich]}
            </button>
          )
        })}
      </ScrollRow>
    </nav>
  )
}
