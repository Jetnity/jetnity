// components/trips/Reisekarte.tsx
//
// Eine Reise in der Liste „Meine Reisen".
//
// Server-Komponente ohne Zustand: Die Karte stellt dar. Gastreise und Reise im
// Konto benutzen dieselbe – der Unterschied ist ein Abzeichen, keine zweite
// Ansicht.

import type { Route } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, CloudOff, ListChecks, MapPin, Users } from 'lucide-react'

import { STATUS_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import { reiseOrte } from '@/lib/trips/reise-orte'
import type { TripSource, TripSummary } from '@/types/trips'

const datum = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function zeitraum(reise: TripSummary) {
  if (!reise.startDate || !reise.endDate) return 'Zeitraum noch offen'
  return `${datum.format(new Date(`${reise.startDate}T00:00:00Z`))} – ${datum.format(
    new Date(`${reise.endDate}T00:00:00Z`),
  )}`
}

export default function Reisekarte({
  reise,
  href,
  quelle,
}: {
  reise: TripSummary
  href: Route
  quelle: TripSource
}) {
  return (
    <Link
      href={href}
      className="group min-w-0 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,46,42,0.11)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-brand-600">
          <MapPin className="h-5 w-5" />
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 text-ink-600 transition group-hover:translate-x-1 group-hover:text-brand-600" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
          {STATUS_BEZEICHNUNG[reise.status]}
        </span>
        {quelle === 'guest' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            <CloudOff className="h-3 w-3" />
            Nur auf diesem Gerät
          </span>
        )}
      </div>

      <h2 className="mt-3 hyphens-auto break-words text-xl font-semibold tracking-[-0.03em] text-brand-800">
        {reise.title}
      </h2>
      <p className="mt-1 hyphens-auto break-words text-sm text-ink-700">{reiseOrte(reise)}</p>

      <div className="mt-5 grid gap-2 border-t border-line-100 pt-4 text-xs text-ink-800">
        <span className="flex min-w-0 items-start gap-2">
          <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
          {zeitraum(reise)}
        </span>
        <span className="flex min-w-0 items-start gap-2">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
          {reise.travellers} {reise.travellers === 1 ? 'Person' : 'Personen'}
        </span>
        <span className="flex min-w-0 items-start gap-2">
          <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
          {reise.dayCount} {reise.dayCount === 1 ? 'Tag' : 'Tage'} · {reise.itemCount}{' '}
          {reise.itemCount === 1 ? 'Punkt' : 'Punkte'}
        </span>
      </div>
    </Link>
  )
}
