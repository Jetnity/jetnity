'use client'

import type { ComponentType, ReactNode } from 'react'
import { CalendarDays, MapPin, ShieldCheck, Users, WalletCards } from 'lucide-react'

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
  kompakt,
}: {
  symbol: ComponentType<{ className?: string }>
  label: string
  wert: string
  kompakt: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2.5 py-2.5',
        kompakt ? 'sm:flex-1 sm:px-4 sm:py-3 sm:first:pl-0' : 'flex-1 px-4 py-3 first:pl-0',
      )}
    >
      <Symbol className="h-4 w-4 shrink-0 text-citrus-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">{label}</dt>
        <dd className="break-words text-sm font-semibold leading-5 text-white">{wert}</dd>
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

  return (
    <section
      data-workspace-identity
      className={cn(
        'overflow-hidden bg-brand-800 text-white shadow-[0_16px_40px_rgba(15,46,42,0.12)]',
        kompakt ? 'mt-3 rounded-[28px]' : 'mt-4 rounded-[32px] xl:mt-5',
      )}
    >
      <div className={cn(kompakt ? 'px-4 py-4' : 'px-6 py-6 xl:px-8 xl:py-7')}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/70">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-citrus-400" aria-hidden="true" />
            {gast ? 'Nur auf diesem Gerät' : 'Im Konto gespeichert'}
          </span>
          <span className="text-[11px] text-white/50">{uebersicht.lageText}</span>
        </div>
        <h1
          className={cn(
            'mt-2 hyphens-auto break-words font-semibold tracking-[-0.045em] text-balance',
            kompakt ? 'text-[1.75rem] leading-[1.12]' : 'mt-3 text-4xl leading-[1.05] xl:text-5xl',
          )}
        >
          {uebersicht.titel}
        </h1>
        <p className="mt-2 flex min-w-0 items-start gap-2 text-sm leading-6 text-white/75">
          <MapPin className="mt-1 h-4 w-4 shrink-0 text-citrus-400" aria-hidden="true" />
          <span className="min-w-0 hyphens-auto break-words">{uebersicht.orte}</span>
        </p>
        <dl
          className={cn(
            'mt-3 border-t border-white/10',
            kompakt ? 'sm:flex sm:divide-x sm:divide-white/10' : 'flex divide-x divide-white/10',
          )}
        >
          <Fakt symbol={CalendarDays} label="Zeitraum" wert={uebersicht.zeitraum} kompakt={kompakt} />
          <Fakt symbol={Users} label="Reisende" wert={uebersicht.personen.text} kompakt={kompakt} />
          <Fakt
            symbol={WalletCards}
            label="Budget"
            wert={betrag(reise.budgetAmount, reise.currency)}
            kompakt={kompakt}
          />
        </dl>
      </div>
      {kopfzeile ? (
        <div
          className={cn(
            'border-t border-white/10',
            kompakt ? 'px-4 py-2' : 'px-6 py-3 xl:px-8',
          )}
        >
          {kopfzeile}
        </div>
      ) : null}
    </section>
  )
}
