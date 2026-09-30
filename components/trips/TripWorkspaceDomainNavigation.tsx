'use client'

import type { ComponentType } from 'react'
import { ArrowRightLeft, BedDouble, Plane, Sparkles } from 'lucide-react'

import { ARBEITSBEREICH_BEZEICHNUNG } from '@/lib/trips/arbeitsbereich'
import type { DetailDomain } from '@/lib/trips/detail'
import type { UebersichtAbleitung } from '@/lib/trips/uebersicht'
import { cn } from '@/lib/utils'

const SYMBOL: Record<DetailDomain, ComponentType<{ className?: string }>> = {
  fluege: Plane,
  unterkunft: BedDouble,
  aktivitaeten: Sparkles,
  mobilitaet: ArrowRightLeft,
}

export default function TripWorkspaceDomainNavigation({
  abdeckungen,
  aktiv,
  onWaehlen,
}: {
  abdeckungen: UebersichtAbleitung['abdeckungen']
  aktiv: DetailDomain | null
  onWaehlen: (domain: DetailDomain, tastatur: boolean) => void
}) {
  return (
    <nav aria-label="Reisebereiche" data-workspace-domain-nav className="min-w-0">
      <ul className="grid gap-px overflow-hidden rounded-[24px] border border-line-200 bg-line-100">
        {abdeckungen.map((eintrag) => {
          const Symbol = SYMBOL[eintrag.bereich]
          const gewaehlt = aktiv === eintrag.bereich
          return (
            <li key={eintrag.bereich} className={gewaehlt ? 'bg-brand-800' : 'bg-white'}>
              <button
                type="button"
                data-bereich={eintrag.bereich}
                aria-current={gewaehlt ? 'page' : undefined}
                aria-label={ARBEITSBEREICH_BEZEICHNUNG[eintrag.bereich]}
                onClick={(ereignis) => onWaehlen(eintrag.bereich, ereignis.detail === 0)}
                className={cn(
                  'flex min-h-11 w-full items-center gap-3 px-3 py-3 text-left focus:outline-none focus:ring-4 focus:ring-brand-600/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                  gewaehlt ? 'bg-brand-800 text-white' : 'bg-white text-brand-800 hover:bg-surface-50',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    gewaehlt ? 'bg-white/10 text-citrus-400' : 'bg-surface-50 text-brand-800',
                  )}
                >
                  <Symbol className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className={cn('block text-sm font-semibold', gewaehlt ? 'text-white' : 'text-brand-800')}>
                    {ARBEITSBEREICH_BEZEICHNUNG[eintrag.bereich]}
                  </strong>
                  <span className={cn('mt-0.5 block text-xs leading-5', gewaehlt ? 'text-white/75' : 'text-ink-800')}>
                    {eintrag.text}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
