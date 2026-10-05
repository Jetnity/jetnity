'use client'

import { useLayoutEffect, useRef } from 'react'

import { modusScrollerZiel } from '@/lib/trips/trip-workspace-premium-experience-3'
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
  const scrollerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    const button = scroller?.querySelector<HTMLButtonElement>('[aria-current="page"]')
    if (!scroller || !button) return
    const scrollerRand = scroller.getBoundingClientRect()
    const knopfRand = button.getBoundingClientRect()
    const ziel = modusScrollerZiel({
      scrollLeft: scroller.scrollLeft,
      clientWidth: scroller.clientWidth,
      scrollWidth: scroller.scrollWidth,
      buttonOffset: scroller.scrollLeft + (knopfRand.left - scrollerRand.left),
      buttonWidth: knopfRand.width,
    })
    if (ziel == null) return
    scroller.scrollTo({ left: ziel, behavior: 'auto' })
  }, [ansicht])

  return (
    <nav
      aria-label="Reiseansicht"
      data-workspace-mode-nav
      className={cn(
        'z-30 mt-3 min-w-0 max-w-full',
        !(kompakt && detailOffen) && 'sticky top-[calc(72px+env(safe-area-inset-top))]',
      )}
    >
      <div
        ref={scrollerRef}
        data-workspace-mode-scroller
        className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-3xl border border-line-200 bg-white p-2 shadow-[0_8px_24px_rgba(15,46,42,0.05)] [scrollbar-width:none] sm:rounded-full sm:p-1"
      >
        <div className="grid min-w-full grid-cols-2 gap-1 sm:flex sm:w-max sm:flex-nowrap">
          {WORKSPACE_ANSICHTEN.map((modus) => {
            const aktiv = ansicht === modus
            return (
              <button
                key={modus}
                type="button"
                aria-current={aktiv ? 'page' : undefined}
                onClick={(ereignis) => onWechsel(modus, ereignis.detail === 0)}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:shrink-0 sm:grow sm:basis-auto sm:px-3.5',
                  aktiv ? 'bg-brand-800 text-white' : 'text-brand-800 hover:bg-surface-50',
                )}
              >
                {WORKSPACE_ANSICHT_LABEL[modus]}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
