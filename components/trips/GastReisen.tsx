'use client'

// components/trips/GastReisen.tsx
//
// „Meine Reisen" ohne Konto.
//
// Ein Gast hat genau eine aktive Reise. Diese Liste zeigt sie – und, falls das
// Gerät noch Entwürfe aus der Fassung vor Phase 1.5 trägt, deren Anzahl. Die
// Entwürfe sind nicht bearbeitbar, aber sie sind auch nicht verloren: Der
// nächste Login übernimmt sie vollständig ins Konto
// (`lib/trips/gastspeicher.ts`).
//
// Sie stillschweigend zu verwerfen wäre der bequeme Weg gewesen. Wer den
// Browser über Monate benutzt hat, hätte dabei Arbeit verloren, ohne es zu
// erfahren.

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import { Archive, MapPin, Plus } from 'lucide-react'

import { gastReisenPrimaerCta } from '@/lib/trips/gast-reisen-cta'
import { gastspeicherLaden, type Gastspeicher } from '@/lib/trips/gastspeicher'
import { tripAlsUebersicht } from '@/lib/trips/reise-orte'
import Reisekarte from '@/components/trips/Reisekarte'

export default function GastReisen() {
  const [speicher, setSpeicher] = React.useState<Gastspeicher | null>(null)

  React.useEffect(() => {
    setSpeicher(gastspeicherLaden())
  }, [])

  if (!speicher) {
    return (
      <div aria-busy="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-52 animate-pulse rounded-[26px] bg-white/70" />
        <div className="h-52 animate-pulse rounded-[26px] bg-white/70" />
      </div>
    )
  }

  const primaer = gastReisenPrimaerCta(speicher.aktiv)

  if (!speicher.aktiv && speicher.warteschlange.length === 0) {
    return (
      <section className="rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-14 text-center sm:px-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
          <MapPin className="h-5 w-5" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">
          Deine erste Reise beginnt hier.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">
          Erstelle kostenlos einen privaten Entwurf. Er bleibt zunächst auf diesem Gerät gespeichert und
          wandert bei einer Anmeldung in dein Konto.
        </p>
        <Link
          href={primaer.href as Route}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
        >
          <Plus className="h-4 w-4" />
          {primaer.label}
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      {!speicher.aktiv ? (
        <Link
          href={primaer.href as Route}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
        >
          <Plus className="h-4 w-4" />
          {primaer.label}
        </Link>
      ) : null}
      {speicher.aktiv && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaer.href as Route}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
            >
              {primaer.label}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Reisekarte
              reise={tripAlsUebersicht(speicher.aktiv)}
              href={`/reisen/${speicher.aktiv.id}` as Route}
              quelle="guest"
            />
          </div>
        </div>
      )}

      {speicher.warteschlange.length > 0 && (
        <section className="rounded-[26px] border border-line-200 bg-white p-5">
          <p className="flex items-start gap-3 text-sm leading-6 text-ink-800">
            <Archive className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span>
              Auf diesem Gerät liegen{' '}
              <strong className="font-semibold text-brand-800">
                {speicher.warteschlange.length} weitere{' '}
                {speicher.warteschlange.length === 1 ? 'Entwurf' : 'Entwürfe'}
              </strong>{' '}
              aus einer früheren Fassung. Ohne Konto lässt sich eine Reise bearbeiten – bei deiner
              Anmeldung werden alle Entwürfe vollständig in dein Konto übernommen.
            </span>
          </p>
          <ul className="mt-4 space-y-2 border-t border-line-100 pt-4">
            {speicher.warteschlange.map((reise) => (
              <li key={reise.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-brand-800">{reise.title}</span>
                <span className="shrink-0 text-xs text-ink-700">
                  {reise.days.length} {reise.days.length === 1 ? 'Tag' : 'Tage'}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:bg-brand-900"
            >
              Konto erstellen
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-5 text-sm font-semibold text-brand-800"
            >
              Anmelden
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
