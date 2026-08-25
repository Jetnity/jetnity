'use client'

import type { ReactNode } from 'react'
import { CalendarDays, MapPin, ShieldCheck, Users, WalletCards } from 'lucide-react'

import { betragLesbar } from '@/lib/trips/bezeichnungen'
import type { UebersichtAbleitung } from '@/lib/trips/uebersicht'
import type { Trip, TripSource } from '@/types/trips'

function betrag(wert: number | null, waehrung: string) {
  if (wert === null) return 'Noch offen'
  return betragLesbar(wert, waehrung)
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

  if (kompakt) {
    return (
      <section className="mt-5 rounded-[24px] bg-brand-800 px-4 py-4 text-white shadow-[0_18px_50px_rgba(15,46,42,0.14)] sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-ink-300">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            {gast ? 'Nur auf diesem Gerät' : 'Im Konto gespeichert'}
          </span>
          <span className="text-[11px] text-white/55">{uebersicht.lageText}</span>
        </div>
        <h1 className="mt-3 hyphens-auto break-words text-2xl font-semibold tracking-[-0.04em]">
          {uebersicht.titel}
        </h1>
        <p className="mt-1.5 flex min-w-0 items-start gap-2 text-sm text-white/70">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 hyphens-auto break-words">{uebersicht.orte}</span>
        </p>
        <p className="mt-3 text-xs leading-5 text-white/70">
          <span>{uebersicht.zeitraum}</span>
          <span aria-hidden="true"> · </span>
          <span>{uebersicht.personen.text}</span>
        </p>
        {kopfzeile && <div className="mt-3 border-t border-white/10 pt-3">{kopfzeile}</div>}
      </section>
    )
  }

  return (
    <section className="mt-5 rounded-[30px] bg-brand-800 text-white shadow-[0_24px_70px_rgba(15,46,42,0.16)]">
      <div className="grid grid-cols-1 gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-ink-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {gast ? 'Nur auf diesem Gerät' : 'In deinem Konto gespeichert'}
            </span>
            <span className="text-xs text-white/55">{uebersicht.lageText}</span>
          </div>
          <h1 className="mt-5 hyphens-auto break-words text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {uebersicht.titel}
          </h1>
          <p className="mt-2 flex min-w-0 items-start gap-2 text-sm text-white/65">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 hyphens-auto break-words">{uebersicht.orte}</span>
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
            <CalendarDays className="h-4 w-4 text-ink-400" aria-hidden="true" />
            <strong className="mt-2 block text-sm">{uebersicht.zeitraum}</strong>
            <span className="text-xs text-white/55">{uebersicht.lageText}</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
            <Users className="h-4 w-4 text-ink-400" aria-hidden="true" />
            <strong className="mt-2 block text-sm">{uebersicht.personen.anzahl}</strong>
            <span className="text-xs text-white/55">{uebersicht.personen.text}</span>
          </div>
          <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 sm:col-span-1">
            <WalletCards className="h-4 w-4 text-ink-400" aria-hidden="true" />
            <strong className="mt-2 block text-sm">{betrag(reise.budgetAmount, reise.currency)}</strong>
            <span className="text-xs text-white/55">Budget</span>
          </div>
        </div>
      </div>
      {kopfzeile && <div className="border-t border-white/10 px-6 py-4 sm:px-8">{kopfzeile}</div>}
    </section>
  )
}
