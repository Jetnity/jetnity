// components/account/AccountUebersicht.tsx
//
// Persönliches Zuhause: Begrüssung, nächste/aktive Reise, Fortsetzen.
// Keine Flug-/Hotel-/Readiness-/Safety-/Seasonal-Karten.

import type { Route } from 'next'
import Link from 'next/link'
import { AlertCircle, ArrowRight, MapPin, Plus } from 'lucide-react'

import { BUCHUNGEN_COPY } from '@/lib/account/buchungen'
import type { NaechsteReise } from '@/lib/account/naechste-reise'
import { STATUS_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import type { Problem } from '@/lib/api/datenbank-lesen'

const datum = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function zeitraum(startDate: string | null, endDate: string | null): string {
  if (!startDate || !endDate) return 'Zeitraum noch offen'
  return `${datum.format(new Date(`${startDate}T00:00:00Z`))} – ${datum.format(
    new Date(`${endDate}T00:00:00Z`),
  )}`
}

const LAGE_TEXT = {
  aktiv: 'Deine Reise läuft gerade.',
  kommend: 'Deine nächste Reise.',
  fortsetzen: 'Hier kannst du weiterplanen.',
} as const

export default function AccountUebersicht({
  name,
  problem,
  naechste,
  hatReisen,
}: {
  name: string | null
  problem: Problem | null
  naechste: NaechsteReise | null
  hatReisen: boolean
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Dein Konto</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
        {name ? `Willkommen zurück, ${name}` : 'Willkommen zurück'}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">
        Hier liegt dein persönliches Jetnity-Zuhause. Die Planung einer einzelnen Reise bleibt im
        Trip Workspace.
      </p>
      <p className="mt-4">
        <Link
          href="/account/bookings"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline-offset-4 hover:underline"
        >
          {BUCHUNGEN_COPY.einstieg}
        </Link>
      </p>
      <p className="mt-1 max-w-xl text-sm leading-6 text-ink-700">{BUCHUNGEN_COPY.einstiegHinweis}</p>

      {problem ? (
        <section
          role="alert"
          className="mt-10 rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center sm:px-10"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
            <AlertCircle className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-red-800">Deine Reisen konnten nicht geladen werden.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">
            {problem.status === 503
              ? 'Wir konnten deinen aktuellen Speicherstand gerade nicht prüfen; bitte lade später neu.'
              : 'Das ist ein Fehler auf unserer Seite, nicht in deinen Daten. Bitte lade die Seite neu.'}
          </p>
        </section>
      ) : naechste ? (
        <section
          aria-label="Nächste Reise"
          className="mt-10 rounded-[30px] border border-black/5 bg-white p-6 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
            {LAGE_TEXT[naechste.lage]}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
              {STATUS_BEZEICHNUNG[naechste.reise.status]}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-3xl">
            {naechste.reise.title}
          </h2>
          {naechste.reise.origin ? (
            <p className="mt-1 text-sm text-ink-700">ab {naechste.reise.origin}</p>
          ) : null}
          <p className="mt-3 text-sm text-ink-800">{zeitraum(naechste.reise.startDate, naechste.reise.endDate)}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/reisen/${naechste.reise.id}` as Route}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
            >
              Reise fortsetzen
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/reisen"
              className="inline-flex h-11 items-center justify-center rounded-full border border-line-200 bg-white px-5 text-sm font-semibold text-brand-800 transition hover:bg-surface-50"
            >
              Alle Reisen
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-10 rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-14 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <MapPin className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">
            {hatReisen ? 'Keine offene Reise zum Fortsetzen.' : 'Noch keine Reise in deinem Konto.'}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">
            {hatReisen
              ? 'Deine vorhandenen Reisen liegen unter Meine Reisen. Eine neue Reise kannst du jederzeit anlegen.'
              : 'Lege deine erste Reise an. Sie wird dauerhaft gespeichert und lässt sich von jedem Gerät aus weiterplanen.'}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {hatReisen ? (
              <Link
                href="/reisen"
                className="inline-flex h-11 items-center justify-center rounded-full border border-line-200 bg-white px-5 text-sm font-semibold text-brand-800"
              >
                Meine Reisen
              </Link>
            ) : null}
            <Link
              href="/planen"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
            >
              <Plus className="h-4 w-4" />
              Reise erstellen
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
