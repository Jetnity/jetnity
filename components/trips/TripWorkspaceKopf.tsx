'use client'

import type { ComponentType, ReactNode } from 'react'
import { CalendarDays, MapPin, ShieldCheck, Users, WalletCards } from 'lucide-react'

import { useKopfDichte } from '@/lib/trips/ux-u1a3-header-density-1-client'
import { betragLesbar } from '@/lib/trips/bezeichnungen'
import type { UebersichtAbleitung } from '@/lib/trips/uebersicht'
import { cn } from '@/lib/utils'
import type { Trip, TripSource } from '@/types/trips'

function betrag(wert: number | null, waehrung: string) {
  if (wert === null) return 'Noch offen'
  return betragLesbar(wert, waehrung)
}

function Fakt({
  symbol: Symbol,
  label,
  wert,
}: {
  symbol: ComponentType<{ className?: string }>
  label: string
  wert: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 py-1.5">
      <Symbol className="h-4 w-4 shrink-0 text-citrus-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">{label}</dt>
        <dd className="break-words text-sm font-semibold leading-5 text-white [overflow-wrap:anywhere]">{wert}</dd>
      </div>
    </div>
  )
}

export default function TripWorkspaceKopf({
  reise,
  quelle,
  kompakt,
  uebersicht,
  kopfzeile,
}: {
  reise: Trip
  quelle: TripSource
  kompakt: boolean
  uebersicht: UebersichtAbleitung
  kopfzeile?: ReactNode
}) {
  const gast = quelle === 'guest'
  const dichte = useKopfDichte()

  return (
    <section
      data-workspace-identity
      data-save-truth={gast ? 'device' : 'account'}
      data-workspace-kompakt={kompakt ? '1' : '0'}
      data-u1a3-bereit={dichte.bereit ? '1' : '0'}
      data-u1a3-dichte={dichte.zeile ? 'zeile' : 'gestapelt'}
      className="mt-2 overflow-hidden rounded-[24px] bg-brand-800 text-white shadow-[0_16px_40px_rgba(15,46,42,0.12)] sm:rounded-[28px]"
    >
      <div className="px-4 py-2 sm:px-5 sm:py-2.5 xl:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-white/70">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-citrus-400" aria-hidden="true" />
            {gast ? 'Nur auf diesem Gerät' : 'Im Konto gespeichert'}
          </span>
          <span className="min-w-0 break-words text-[11px] text-white/50">{uebersicht.lageText}</span>
        </div>
        <h1 className="mt-0.5 hyphens-auto break-words text-xl font-semibold leading-tight tracking-[-0.04em] [overflow-wrap:anywhere] sm:text-2xl">
          {uebersicht.titel}
        </h1>
        <div className={cn('mt-1 lg:flex lg:items-start lg:gap-x-5', dichte.gross && 'lg:block')}>
          <p
            className={cn(
              'flex min-w-0 items-start gap-2 text-sm leading-5 text-white/80',
              !dichte.gross && 'lg:flex-1',
            )}
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-citrus-400" aria-hidden="true" />
            <span className="min-w-0 hyphens-auto break-words [overflow-wrap:anywhere]">{uebersicht.orte}</span>
          </p>
          <p
            className={cn(
              'flex min-w-0 items-start gap-2 text-sm leading-5 text-white',
              dichte.gross ? 'mt-1' : 'mt-1 lg:mt-0 lg:flex-1',
            )}
          >
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-citrus-400" aria-hidden="true" />
            <span className="min-w-0 break-words">
              <span className="font-medium text-white/60">Zeitraum </span>
              {uebersicht.zeitraum}
            </span>
          </p>
        </div>
        <details className="mt-1 border-t border-white/10">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-citrus-400/40 [&::-webkit-details-marker]:hidden">
            Reisende und Budget
          </summary>
          <dl className="grid gap-1 pb-1 sm:grid-cols-2">
            <Fakt symbol={Users} label="Reisende" wert={uebersicht.personen.text} />
            <Fakt symbol={WalletCards} label="Budget" wert={betrag(reise.budgetAmount, reise.currency)} />
          </dl>
        </details>
      </div>
      {kopfzeile ? (
        <div className="border-t border-white/10 px-4 py-1 sm:px-5 xl:px-6">{kopfzeile}</div>
      ) : null}
    </section>
  )
}
