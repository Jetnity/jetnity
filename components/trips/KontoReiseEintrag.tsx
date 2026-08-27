// components/trips/KontoReiseEintrag.tsx
//
// Konto-Listenkarte plus AP-4-Aktion. Die Aktion liegt ausserhalb des
// Karten-Links, damit keine interaktiven Elemente verschachtelt werden.

import type { Route } from 'next'

import KontoReiseArchivAktion from '@/components/trips/KontoReiseArchivAktion'
import Reisekarte from '@/components/trips/Reisekarte'
import type { TripSummary } from '@/types/trips'

export default function KontoReiseEintrag({ reise }: { reise: TripSummary }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Reisekarte reise={reise} href={`/reisen/${reise.id}` as Route} quelle="account" />
      <KontoReiseArchivAktion reise={reise} />
    </div>
  )
}
