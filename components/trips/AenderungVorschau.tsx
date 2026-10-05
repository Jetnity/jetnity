'use client'

// components/trips/AenderungVorschau.tsx
//
// Vorher/Nachher, bevor etwas gespeichert wird.
//
// Die Vorschau darf nicht wie eine gebuchte Reise aussehen. Sie zeigt die
// Änderung in Sätzen, plus Annahmen und Warnungen. Preise und Anbieter stehen
// hier nicht – das Modell darf sie weder erfinden noch überschreiben.

import { ArrowRight, Info } from 'lucide-react'

import type { Aenderungsvorschau } from '@/lib/reiseaenderung/erzeugen'
import { cn } from '@/lib/utils'

type AenderungVorschauProps = {
  vorschau: Aenderungsvorschau
  laeuft: boolean
  onUebernehmen: () => void
  onVerwerfen: () => void
}

export default function AenderungVorschau({
  vorschau,
  laeuft,
  onUebernehmen,
  onVerwerfen,
}: AenderungVorschauProps) {
  return (
    <section
      aria-label="Änderungsvorschlag"
      className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-brand-800">
          Vorschlag
        </span>
        <span className="text-xs text-ink-700">Noch nicht gespeichert.</span>
      </div>

      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-brand-900 sm:text-3xl">
        {vorschau.aenderung.zusammenfassung}
      </h2>

      <ol className="mt-6 grid gap-3 border-y border-line-200 py-6">
        {vorschau.diff.map((eintrag) => (
          <li key={`${eintrag.art}-${eintrag.text}`} className="flex min-w-0 items-start gap-3">
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span className="min-w-0 text-sm leading-6 text-brand-900">{eintrag.text}</span>
          </li>
        ))}
      </ol>

      {vorschau.aenderung.annahmen.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line-200 bg-surface-25 px-4 py-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Annahmen
          </p>
          <ul className="mt-3 grid gap-2">
            {vorschau.aenderung.annahmen.map((annahme) => (
              <li key={annahme} className="text-sm leading-6 text-ink-800">
                {annahme}
              </li>
            ))}
          </ul>
        </div>
      )}

      {vorschau.aenderung.warnungen.length > 0 && (
        <div
          role="status"
          className="mt-4 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em]">Offene Punkte</p>
          <ul className="mt-3 grid gap-2">
            {vorschau.aenderung.warnungen.map((warnung) => (
              <li key={warnung}>{warnung}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3 border-t border-line-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-ink-700">
          Gespeichert wird erst, wenn du die Änderung übernimmst. Bei einem Fehler bleibt dieser
          Vorschlag stehen.
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
            onClick={onUebernehmen}
            disabled={laeuft}
            className={cn(
              'inline-flex h-12 items-center justify-center rounded-full bg-brand-800 px-6 text-sm font-semibold text-white',
              'shadow-[0_12px_30px_rgba(21,58,51,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-900',
              'disabled:pointer-events-none disabled:opacity-60',
            )}
          >
            {laeuft ? 'Wird übernommen …' : 'Änderung übernehmen'}
          </button>
        </div>
      </div>
    </section>
  )
}
