'use client'

import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { CalendarDays, MapPin, ShieldCheck, Users, WalletCards } from 'lucide-react'

import { useStadtbild } from '@/components/trips/organisieren/Stadtbild'
import { useKopfDichte } from '@/lib/trips/ux-u1a3-header-density-1-client'
import { betragLesbar } from '@/lib/trips/bezeichnungen'
import type { UebersichtAbleitung } from '@/lib/trips/uebersicht'
import { WORKSPACE_ANSICHT_LABEL, type WorkspaceAnsicht } from '@/lib/trips/workspace-mode'
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
  reiseoptionen,
  workspace = false,
  uebersichtAktiv = false,
  ansicht = 'uebersicht',
}: {
  reise: Trip
  quelle: TripSource
  kompakt: boolean
  uebersicht: UebersichtAbleitung
  kopfzeile?: ReactNode
  reiseoptionen?: ReactNode
  workspace?: boolean
  uebersichtAktiv?: boolean
  ansicht?: WorkspaceAnsicht
}) {
  const gast = quelle === 'guest'
  const dichte = useKopfDichte()
  // Reiseplan und Organisieren tragen das Ortsbild der ersten Etappe (DESIGN_SYSTEM.md 6.2).
  const bildKopf = workspace && (ansicht === 'plan' || ansicht === 'organisieren')
  const kopfbild = useStadtbild(bildKopf ? reise.stages[0] : undefined)

  if (workspace) {
    // Ein Kopf fuer alle fuenf Ansichten (DESIGN_SYSTEM.md 6.2). Stand,
    // Speicherort und Reiseoptionen gehoeren zur Uebersicht; die anderen
    // Ansichten zeigen nur Einordnung, damit ihr Inhalt auf dem Handy oben steht.
    // Ein Speicherfehler (`kopfzeile`) bleibt in jeder Ansicht sichtbar.
    const uebersichtKopf = ansicht === 'uebersicht'
    return (
      <section
        data-workspace-identity
        data-workspace-kopf={ansicht}
        data-workspace-kopfbild={bildKopf ? '' : undefined}
        data-save-truth={gast ? 'device' : 'account'}
        className="workspace-trip-heading"
        style={bildKopf ? ({ '--workspace-kopfbild': `url(${JSON.stringify(kopfbild.src)})` } as CSSProperties) : undefined}
      >
        <p className="workspace-eyebrow text-kicker uppercase">
          {ansicht === 'einreise' ? 'Deine Reise' : WORKSPACE_ANSICHT_LABEL[ansicht]}
        </p>
        <h1
          tabIndex={-1}
          data-workspace-modus-heading={uebersichtAktiv ? '' : undefined}
          className="text-display outline-none"
        >
          {uebersicht.titel}
        </h1>
        <dl className="workspace-trip-meta text-meta">
          <div><CalendarDays aria-hidden="true" /><dt className="sr-only">Zeitraum</dt><dd>{uebersicht.zeitraum}</dd></div>
          <div><MapPin aria-hidden="true" /><dt className="sr-only">Route</dt><dd>{uebersicht.orte}</dd></div>
          <div><Users aria-hidden="true" /><dt className="sr-only">Reisende</dt><dd>{uebersicht.personen.text}</dd></div>
          <div><WalletCards aria-hidden="true" /><dt className="sr-only">Budget</dt><dd>{reise.budgetAmount === null ? 'Budget noch offen' : `Budget ${betrag(reise.budgetAmount, reise.currency)}`}</dd></div>
        </dl>
        {uebersichtKopf ? (
          <div className="workspace-trip-storage text-meta">
            <span className="workspace-status">{uebersicht.lageText}</span>
            {/* Fuer Gaeste sagt der Gast-Hinweis darunter dasselbe, mit dem Weg ins Konto. */}
            <span className={gast ? 'sr-only' : undefined}><ShieldCheck aria-hidden="true" />{gast ? 'Nur auf diesem Gerät' : 'Im Konto gespeichert'}</span>
            {reiseoptionen ? (
              <details data-reiseoptionen className="workspace-reiseoptionen">
                <summary>Reiseoptionen</summary>
                <div className="workspace-storage-options">{reiseoptionen}</div>
              </details>
            ) : null}
          </div>
        ) : null}
        {kopfzeile ? <div className="workspace-storage-options mt-3">{kopfzeile}</div> : null}
      </section>
    )
  }

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
      {reiseoptionen ? (
        <details data-reiseoptionen className="border-t border-white/10 px-4 sm:px-5 xl:px-6">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-citrus-400/40 [&::-webkit-details-marker]:hidden">
            Reiseoptionen
          </summary>
          <div className="pb-2">{reiseoptionen}</div>
        </details>
      ) : null}
    </section>
  )
}
