// components/trips/Reisekarte.tsx
//
// Eine Reise in der Liste „Meine Reisen".
//
// Server-Komponente ohne Zustand: Die Karte stellt dar. Gastreise und Reise im
// Konto benutzen dieselbe – der Unterschied ist ein Abzeichen, keine zweite
// Ansicht. Im Konto sitzt der Link in einer Schale; die Archivaktion bleibt
// daneben und nicht darin.

import type { Route } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, CloudOff, ListChecks, Users } from 'lucide-react'

import { STATUS_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import { reiseOrte } from '@/lib/trips/reise-orte'
import { cn } from '@/lib/utils'
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
  schale = false,
  ueberschrift = 'h2',
}: {
  reise: TripSummary
  href: Route
  quelle: TripSource
  schale?: boolean
  ueberschrift?: 'h2' | 'h3'
}) {
  const Titel = ueberschrift

  return (
    <Link
      href={href}
      className={cn(
        'group min-w-0 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-600/30',
        schale
          ? 'flex h-full flex-col bg-white p-4 transition-colors hover:bg-surface-50'
          : 'block rounded-[26px] border border-black/5 bg-white p-4 shadow-[0_12px_40px_rgba(15,46,42,0.06)] transition-colors hover:border-brand-600/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
              {STATUS_BEZEICHNUNG[reise.status]}
            </span>
            {quelle === 'guest' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                <CloudOff className="h-3 w-3" />
                Nur auf diesem Gerät
              </span>
            ) : null}
          </div>
          <Titel className="mt-2 hyphens-auto break-words text-lg font-semibold tracking-[-0.03em] text-brand-800 sm:text-xl">
            {reise.title}
          </Titel>
          <p className="mt-1 hyphens-auto break-words text-sm leading-5 text-ink-700">{reiseOrte(reise)}</p>
        </div>
        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-ink-600 transition-colors group-hover:text-brand-600" />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line-100 pt-3 text-xs leading-5 text-ink-800">
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
