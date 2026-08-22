'use client'

// components/trips/FlugSuche.tsx
//
// Flugsuche im Reise-Arbeitsbereich. Kein isoliertes Demo-Tool.

import * as React from 'react'
import { AlertCircle, Loader2, Plane, Search } from 'lucide-react'

import type { FlugOptionSichtbar, FlugSucheAntwort } from '@/lib/flights/client-sicht'
import type { FlughafenReferenzKarte } from '@/lib/route/domain'
import { FLUG_ABDECKUNGSHINWEIS } from '@/lib/flights/domain'
import type { FlugKabine, FlugStoppPraeferenz } from '@/lib/flights/domain'
import FlugKarte from '@/components/trips/FlugKarte'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types/trips'

type Filter = 'all' | 'jetnity' | 'cheapest' | 'fastest'

const KABINE_TEXT: Record<FlugKabine, string> = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First',
}

function iataAus(wert: string | null | undefined): string {
  const roh = wert?.trim().toUpperCase() ?? ''
  if (/^[A-Z]{3}$/.test(roh)) return roh
  const inText = roh.match(/\b([A-Z]{3})\b/)
  return inText?.[1] ?? ''
}

export default function FlugSuche({
  reise,
  tagId,
  onUebernehmen,
}: {
  reise: Trip
  tagId: string | null
  onUebernehmen: (
    tagId: string | null,
    option: FlugOptionSichtbar,
    refs?: FlughafenReferenzKarte,
  ) => Promise<string | null>
}) {
  const tag = reise.days.find((eintrag) => eintrag.id === tagId) ?? reise.days[0]
  const [herkunft, setHerkunft] = React.useState(iataAus(reise.origin) || 'ZRH')
  const [ziel, setZiel] = React.useState(iataAus(reise.stages[0]?.name) || '')
  const [hin, setHin] = React.useState(tag?.dayDate ?? reise.startDate ?? '')
  const [rueck, setRueck] = React.useState(reise.endDate ?? '')
  const [mitRueck, setMitRueck] = React.useState(Boolean(reise.endDate))
  const [kabine, setKabine] = React.useState<FlugKabine>('economy')
  const [stopps, setStopps] = React.useState<FlugStoppPraeferenz>('any')
  const [laeuft, setLaeuft] = React.useState(false)
  const [uebernimmt, setUebernimmt] = React.useState(false)
  const [antwort, setAntwort] = React.useState<FlugSucheAntwort | null>(null)
  const [filter, setFilter] = React.useState<Filter>('all')
  const [meldung, setMeldung] = React.useState('')

  const suchen = async (ereignis: React.FormEvent) => {
    ereignis.preventDefault()
    if (laeuft) return
    setMeldung('')
    setLaeuft(true)
    setAntwort(null)

    const legs = [
      { origin: herkunft, destination: ziel, date: hin },
      ...(mitRueck && rueck ? [{ origin: ziel, destination: herkunft, date: rueck }] : []),
    ]

    try {
      const res = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          legs,
          passengers: { adults: Math.min(9, Math.max(1, reise.travellers)), children: 0, infants: 0 },
          cabin: kabine,
          stopPreference: stopps,
          currency: reise.currency,
          context: {
            tripStartDate: reise.startDate,
            tripEndDate: reise.endDate,
            selectedDate: tag?.dayDate ?? hin,
          },
        }),
      })
      const json = (await res.json()) as FlugSucheAntwort
      setAntwort(json)
      if (!res.ok && !json.message) setMeldung('Die Flugsuche ist fehlgeschlagen.')
    } catch {
      setAntwort({
        status: 'error',
        message: 'Die Flugsuche ist gerade nicht erreichbar.',
        coverageNote: FLUG_ABDECKUNGSHINWEIS,
        options: [],
      })
    } finally {
      setLaeuft(false)
    }
  }

  const uebernehmen = async (option: FlugOptionSichtbar) => {
    if (uebernimmt) return
    setUebernimmt(true)
    setMeldung('')
    const fehler = await onUebernehmen(tag?.id ?? null, option, antwort?.airportRefs)
    setUebernimmt(false)
    if (fehler) setMeldung(fehler)
  }

  const sichtbar = (antwort?.options ?? []).filter((option) => {
    if (filter === 'all') return true
    return option.labels.includes(filter)
  })

  return (
    <section
      aria-label="Flugoptionen"
      className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Flüge</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
            Verbindungen für diese Reise
          </h2>
        </div>
        <Plane className="h-5 w-5 text-brand-600" aria-hidden="true" />
      </div>

      <form onSubmit={suchen} className="mt-5 grid gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
            Von
            <input
              value={herkunft}
              onChange={(e) => setHerkunft(e.target.value.toUpperCase())}
              required
              maxLength={3}
              minLength={3}
              placeholder="ZRH"
              autoCapitalize="characters"
              className="h-11 w-full rounded-xl border border-line-200 bg-white px-3 text-base uppercase outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
            />
          </label>
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
            Nach
            <input
              value={ziel}
              onChange={(e) => setZiel(e.target.value.toUpperCase())}
              required
              maxLength={3}
              minLength={3}
              placeholder="BKK"
              autoCapitalize="characters"
              className="h-11 w-full rounded-xl border border-line-200 bg-white px-3 text-base uppercase outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
            Hinflug
            <input
              type="date"
              value={hin}
              onChange={(e) => setHin(e.target.value)}
              required
              className="h-11 w-full rounded-xl border border-line-200 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
            />
          </label>
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
            Rückflug, optional
            <input
              type="date"
              value={rueck}
              onChange={(e) => {
                setRueck(e.target.value)
                setMitRueck(Boolean(e.target.value))
              }}
              className="h-11 w-full rounded-xl border border-line-200 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
            Kabine
            <select
              value={kabine}
              onChange={(e) => setKabine(e.target.value as FlugKabine)}
              className="h-11 w-full rounded-xl border border-line-200 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
            >
              {(Object.keys(KABINE_TEXT) as FlugKabine[]).map((wert) => (
                <option key={wert} value={wert}>
                  {KABINE_TEXT[wert]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
            Zwischenlandungen
            <select
              value={stopps}
              onChange={(e) => setStopps(e.target.value as FlugStoppPraeferenz)}
              className="h-11 w-full rounded-xl border border-line-200 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
            >
              <option value="any">Alle Verbindungen</option>
              <option value="nonstop">Nur Direktflüge</option>
              <option value="at_most_one">Höchstens ein Stopp</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-ink-700">
            {reise.travellers} {reise.travellers === 1 ? 'Person' : 'Personen'} · {reise.currency}
          </p>
          <button
            type="submit"
            disabled={laeuft}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60"
          >
            {laeuft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {laeuft ? 'Suche läuft …' : 'Flüge suchen'}
          </button>
        </div>
      </form>

      {laeuft && (
        <p aria-busy="true" className="mt-5 rounded-2xl bg-surface-25 px-4 py-3 text-sm text-ink-800">
          Wir suchen passende Verbindungen. Das kann einen Moment dauern.
        </p>
      )}

      {antwort && (
        <div className="mt-6">
          {antwort.status === 'partial' && (
            <p className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
              {antwort.message}
            </p>
          )}

          {(antwort.status === 'unavailable' ||
            antwort.status === 'timeout' ||
            antwort.status === 'error' ||
            antwort.status === 'invalid' ||
            antwort.status === 'rate_limited') && (
            <p
              role="status"
              className="flex items-start gap-3 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {antwort.message}
            </p>
          )}

          {antwort.status === 'empty' && (
            <p className="rounded-2xl bg-surface-25 px-4 py-6 text-center text-sm leading-6 text-ink-800">
              {antwort.message} Passe Datum, Flughafen oder Stopps an und suche erneut.
            </p>
          )}

          {sichtbar.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['all', 'Alle'],
                    ['jetnity', 'Jetnity empfiehlt'],
                    ['cheapest', 'Günstigste'],
                    ['fastest', 'Schnellste'],
                  ] as const
                ).map(([wert, label]) => (
                  <button
                    key={wert}
                    type="button"
                    onClick={() => setFilter(wert)}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-medium',
                      filter === wert
                        ? 'border-brand-800 bg-brand-800 text-white'
                        : 'border-line-200 bg-white text-ink-900',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <ol className="mt-4 grid gap-3">
                {sichtbar.map((option) => (
                  <li key={option.id}>
                    <FlugKarte
                      option={option}
                      refs={antwort.airportRefs}
                      laeuft={uebernimmt}
                      onUebernehmen={() => uebernehmen(option)}
                    />
                  </li>
                ))}
              </ol>
            </>
          )}

          <p className="mt-4 text-xs leading-5 text-ink-700">{antwort.coverageNote || FLUG_ABDECKUNGSHINWEIS}</p>
        </div>
      )}

      {meldung && (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {meldung}
        </p>
      )}
    </section>
  )
}
