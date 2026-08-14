import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import GuestTrips from '@/components/trips/GuestTrips'

export const metadata: Metadata = {
  title: 'Meine Reisen',
  description: 'Öffne und bearbeite deine privaten Jetnity-Reiseentwürfe.',
}

export default function TripsPage() {
  return (
    <main className="min-h-screen bg-[#f5f4ee] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1d715e]">Dein Jetnity</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#153a33] sm:text-5xl">
              Meine Reisen
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#657872]">
              Alle Gastentwürfe werden privat in diesem Browser gespeichert. Die sichere Kontosynchronisierung folgt in der nächsten Ausbaustufe.
            </p>
          </div>
          <Link
            href="/planen"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#153a33] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#0f302a]"
          >
            <Plus className="h-4 w-4" />
            Neue Reise
          </Link>
        </div>
        <GuestTrips />
      </div>
    </main>
  )
}
