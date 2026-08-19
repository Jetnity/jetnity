'use client'

// components/trips/VorschlagVorschau.tsx
//
// Der Vorschlag, bevor er eine Reise ist.
//
// Diese Ansicht hat eine Aufgabe, die über das Anzeigen hinausgeht: Sie muss
// sichtbar machen, dass hier noch nichts entschieden ist. Ein Entwurf, der wie
// eine gebuchte Reise aussieht, ist eine falsche Auskunft, auch wenn jedes Feld
// stimmt. Deshalb steht „Vorschlag“ oben, „noch nicht gespeichert“ dabei, und
// die drei Wege – übernehmen, ändern, verwerfen – stehen gleichrangig
// nebeneinander.
//
// ---------------------------------------------------------------------------
// Was sie nicht zeigt
// ---------------------------------------------------------------------------
//
// Keine Preise und keine Verfügbarkeiten. Nicht, weil sie ausgeblendet würden,
// sondern weil der Vorschlag keine hat (`lib/reisevorschlag/schema.ts`). Das
// Budget erscheint als „Budgetziel“ – als Wunsch des Reisenden, nicht als
// Rechnung über die Reise.
//
// Annahmen stehen in einem eigenen Block. Eine Annahme, die zwischen erkannten
// Angaben steht, ist keine mehr.
//
// Reine Darstellung: Diese Datei speichert nichts und ruft nichts auf. Was
// „Übernehmen“ tut, entscheidet `components/trips/Reiseidee.tsx`.

import * as React from 'react'
import { CalendarDays, Info, MapPin, Users, WalletCards } from 'lucide-react'

import {
  ART_BEZEICHNUNG,
  INTERESSE_BEZEICHNUNG,
  TEMPO_BEZEICHNUNG,
  betragLesbar,
} from '@/lib/trips/bezeichnungen'
import { reiseende } from '@/lib/reisevorschlag/abbildung'
import type { Reisevorschlag } from '@/lib/reisevorschlag/schema'
import { cn } from '@/lib/utils'

type VorschlagVorschauProps = {
  vorschlag: Reisevorschlag
  /** Harte Vorgaben, die nach einer Korrektur noch offen sind. Kein „perfekt“. */
  warnungen?: string[]
  laeuft: boolean
  angemeldet: boolean
  onUebernehmen: () => void
  onAendern: () => void
  onVerwerfen: () => void
}

const DATUM = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: 'short', year: 'numeric' })

function datumLesbar(iso: string): string {
  const zeit = Date.parse(`${iso}T00:00:00Z`)
  return Number.isNaN(zeit) ? iso : DATUM.format(new Date(zeit))
}

/** Der Zeitraum – oder ehrlich die Dauer, wenn es keinen gibt. */
function zeitraum(vorschlag: Reisevorschlag): string {
  const tage = `${vorschlag.tage.length} ${vorschlag.tage.length === 1 ? 'Tag' : 'Tage'}`
  const ende = reiseende(vorschlag)

  if (!vorschlag.startdatum || !ende) return `${tage}, noch ohne festes Datum`
  return `${datumLesbar(vorschlag.startdatum)} – ${datumLesbar(ende)} · ${tage}`
}

function Angabe({
  icon: Icon,
  beschriftung,
  wert,
}: {
  icon: typeof MapPin
  beschriftung: string
  wert: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-xs font-medium uppercase tracking-[0.12em] text-ink-700">
          {beschriftung}
        </span>
        <span className="mt-0.5 block text-sm font-medium text-brand-900">{wert}</span>
      </span>
    </div>
  )
}

export default function VorschlagVorschau({
  vorschlag,
  warnungen = [],
  laeuft,
  angemeldet,
  onUebernehmen,
  onAendern,
  onVerwerfen,
}: VorschlagVorschauProps) {
  const ziele = vorschlag.etappen.map((etappe) => etappe.name).join(' · ')

  return (
    <section
      aria-label="Reisevorschlag"
      className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-brand-800">
          Vorschlag
        </span>
        <span className="text-xs text-ink-700">Noch nicht gespeichert.</span>
      </div>

      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-brand-900 sm:text-3xl">
        {vorschlag.titel}
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-5 border-y border-line-200 py-6 sm:grid-cols-2">
        <Angabe icon={MapPin} beschriftung="Route" wert={ziele} />
        <Angabe icon={CalendarDays} beschriftung="Zeitraum" wert={zeitraum(vorschlag)} />
        <Angabe
          icon={Users}
          beschriftung="Reisende"
          wert={`${vorschlag.reisende} ${vorschlag.reisende === 1 ? 'Person' : 'Personen'}${
            vorschlag.abreiseort ? ` · ab ${vorschlag.abreiseort}` : ''
          }`}
        />
        <Angabe
          icon={WalletCards}
          beschriftung="Budgetziel"
          wert={
            vorschlag.budgetziel === null
              ? 'Nicht angegeben'
              : betragLesbar(vorschlag.budgetziel, vorschlag.waehrung)
          }
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-8 items-center rounded-full border border-brand-800 bg-brand-800 px-3 text-xs font-semibold text-white">
          {TEMPO_BEZEICHNUNG[vorschlag.tempo].titel}
        </span>
        {vorschlag.interessen.map((interesse) => (
          <span
            key={interesse}
            className="inline-flex min-h-8 items-center rounded-full border border-line-200 px-3 text-xs font-medium text-ink-950"
          >
            {INTERESSE_BEZEICHNUNG[interesse]}
          </span>
        ))}
      </div>

      {warnungen.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line-300 bg-surface-75 p-4" role="status">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
            Noch nicht vollständig erfüllt
          </p>
          <ul className="mt-3 space-y-1.5">
            {warnungen.map((warnung) => (
              <li key={warnung} className="text-sm leading-6 text-ink-950">
                {warnung}
              </li>
            ))}
          </ul>
        </div>
      )}

      {vorschlag.annahmen.length > 0 && (
        <div className="mt-6 rounded-2xl bg-surface-25 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-800">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Angenommen, nicht aus deiner Beschreibung
          </p>
          <ul className="mt-3 space-y-1.5">
            {vorschlag.annahmen.map((annahme) => (
              <li key={annahme} className="text-sm leading-6 text-ink-950">
                {annahme}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-800">Etappen</h3>
        <ul className="mt-3 grid gap-2">
          {vorschlag.etappen.map((etappe) => (
            <li
              key={`${etappe.name}-${etappe.vonTag}`}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-2xl border border-line-200 px-4 py-3"
            >
              <span className="text-sm font-semibold text-brand-900">{etappe.name}</span>
              <span className="text-xs text-ink-700">
                {etappe.vonTag === etappe.bisTag
                  ? `Tag ${etappe.vonTag}`
                  : `Tag ${etappe.vonTag}–${etappe.bisTag}`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-800">
          Tagesstruktur
        </h3>
        <ol className="mt-3 grid gap-3">
          {vorschlag.tage.map((tag) => (
            <li key={tag.nummer} className="rounded-2xl border border-line-200 p-4">
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
                  Tag {tag.nummer}
                </span>
                {tag.titel && (
                  <span className="text-sm font-semibold text-brand-900">{tag.titel}</span>
                )}
              </p>
              <ul className="mt-3 grid gap-2">
                {tag.punkte.map((punkt, stelle) => (
                  <li key={`${tag.nummer}-${stelle}`} className="grid grid-cols-[52px_1fr] gap-3">
                    <span className="text-xs font-medium tabular-nums text-ink-700">
                      {punkt.beginn ?? '—'}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink-950">
                        <span className="mr-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-700">
                          {ART_BEZEICHNUNG[punkt.art]}
                        </span>
                        {punkt.titel}
                      </span>
                      {punkt.notiz && (
                        <span className="mt-0.5 block text-xs leading-5 text-ink-800">
                          {punkt.notiz}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-6 text-xs leading-5 text-ink-700">
        Dieser Entwurf enthält bewusst keine Preise, Verfügbarkeiten oder Buchungen. Flüge,
        Unterkünfte und Aktivitäten kommen in einem späteren Schritt von echten Anbietern dazu.
      </p>

      <div className="mt-7 flex flex-col gap-3 border-t border-line-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-ink-700">
          {angemeldet
            ? 'Beim Übernehmen wird die Reise in deinem Konto gespeichert.'
            : 'Beim Übernehmen bleibt die Reise zunächst nur in diesem Browser.'}
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onVerwerfen}
            disabled={laeuft}
            className="inline-flex h-12 items-center justify-center rounded-full px-4 text-sm font-medium text-ink-900 underline underline-offset-4 transition hover:text-brand-800 disabled:pointer-events-none disabled:opacity-60"
          >
            Verwerfen
          </button>
          <button
            type="button"
            onClick={onAendern}
            disabled={laeuft}
            className="inline-flex h-12 items-center justify-center rounded-full border border-line-300 px-5 text-sm font-semibold text-brand-800 transition hover:border-brand-600 disabled:pointer-events-none disabled:opacity-60"
          >
            Beschreibung ändern
          </button>
          <button
            type="button"
            onClick={onUebernehmen}
            disabled={laeuft}
            className={cn(
              'inline-flex h-12 items-center justify-center rounded-full bg-brand-800 px-6 text-sm font-semibold text-white',
              'shadow-[0_12px_30px_rgba(21,58,51,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-900',
              'disabled:pointer-events-none disabled:opacity-60',
            )}
          >
            {laeuft ? 'Wird übernommen …' : 'Reise übernehmen'}
          </button>
        </div>
      </div>
    </section>
  )
}
