'use client'

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin, Plus, Users } from 'lucide-react'

import { loadGuestTrips } from '@/lib/trips/guest-store'
import type { GuestTrip } from '@/types/trips'

const dateFormatter = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`))
}

export default function GuestTrips() {
  const [trips, setTrips] = React.useState<GuestTrip[]>([])
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setTrips(loadGuestTrips())
    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div aria-busy="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-52 animate-pulse rounded-[26px] bg-white/70" />
        <div className="h-52 animate-pulse rounded-[26px] bg-white/70" />
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <section className="rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-14 text-center sm:px-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
          <MapPin className="h-5 w-5" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">
          Deine erste Reise beginnt hier.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">
          Erstelle kostenlos einen privaten Entwurf. Er bleibt zunächst auf diesem Gerät gespeichert.
        </p>
        <Link
          href="/planen"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
        >
          <Plus className="h-4 w-4" />
          Reise erstellen
        </Link>
      </section>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {trips.map((trip) => (
        <Link
          key={trip.id}
          href={`/reisen/${trip.id}` as Route}
          className="group min-w-0 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,46,42,0.11)]"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-brand-600">
              <MapPin className="h-5 w-5" />
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-ink-600 transition group-hover:translate-x-1 group-hover:text-brand-600" />
          </div>
          <h2 className="mt-6 hyphens-auto break-words text-xl font-semibold tracking-[-0.03em] text-brand-800">
            {trip.title}
          </h2>
          <p className="mt-1 hyphens-auto break-words text-sm text-ink-700">ab {trip.origin}</p>
          <div className="mt-5 grid gap-2 border-t border-line-100 pt-4 text-xs text-ink-800">
            <span className="flex min-w-0 items-start gap-2">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </span>
            <span className="flex min-w-0 items-start gap-2">
              <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              {trip.travelers} {trip.travelers === 1 ? 'Person' : 'Personen'}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
