'use client'

import { WORKSPACE_ANSICHTEN, WORKSPACE_ANSICHT_LABEL, type WorkspaceAnsicht } from '@/lib/trips/workspace-mode'
import { cn } from '@/lib/utils'

export default function TripWorkspaceModeNavigation({
  ansicht,
  kompakt,
  detailOffen,
  onWechsel,
}: {
  ansicht: WorkspaceAnsicht
  kompakt: boolean
  detailOffen: boolean
  onWechsel: (ansicht: WorkspaceAnsicht, tastatur: boolean) => void
}) {
  return (
    <nav
      aria-label="Reiseansicht"
      data-workspace-mode-nav
      className={cn(
        'z-30 mt-4 max-w-full',
        !(kompakt && detailOffen) && 'sticky top-[calc(72px+env(safe-area-inset-top))]',
      )}
    >
      <div className="flex max-w-full flex-wrap gap-2">
        {WORKSPACE_ANSICHTEN.map((modus) => {
          const aktiv = ansicht === modus
          return (
            <button
              key={modus}
              type="button"
              aria-current={aktiv ? 'page' : undefined}
              onClick={(ereignis) => onWechsel(modus, ereignis.detail === 0)}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                aktiv
                  ? 'bg-brand-800 text-white'
                  : 'border border-line-200 bg-white text-brand-800 hover:border-line-400',
              )}
            >
              {WORKSPACE_ANSICHT_LABEL[modus]}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
