// components/trips/KontoReiseEintrag.tsx
//
// Eine visuelle Schale: der Reise-Link und die AP-4-Aktion sind Geschwister.
// Die Aktion liegt nicht im Link.

import type { Route } from 'next'

import KontoReiseArchivAktion from '@/components/trips/KontoReiseArchivAktion'
import Reisekarte from '@/components/trips/Reisekarte'
import { kartenKanteKlasse, type KartenLage } from '@/lib/trips/my-trips-premium-hub-ux-1'
import { cn } from '@/lib/utils'
import type { TripSummary } from '@/types/trips'

export default function KontoReiseEintrag({
  reise,
  lage = 'ohneDatum',
}: {
  reise: TripSummary
  lage?: KartenLage
}) {
  return (
    <article
      data-reisen-karte={lage}
      className={cn(
        'flex h-full min-w-0 flex-col overflow-hidden rounded-[26px] border-x border-b border-black/5 border-t-2 bg-white shadow-[0_12px_40px_rgba(15,46,42,0.06)]',
        kartenKanteKlasse(lage),
      )}
    >
      <Reisekarte
        reise={reise}
        href={`/reisen/${reise.id}` as Route}
        quelle="account"
        schale
        ueberschrift="h3"
      />
      <div className="mt-auto border-t border-line-100 bg-surface-75 px-3 py-3">
        <KontoReiseArchivAktion reise={reise} />
      </div>
    </article>
  )
}
