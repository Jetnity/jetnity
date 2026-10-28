'use client'

// components/trips/AktivitaetKarte.tsx
//
// Eine Aktivitätsoption mit Jetnity-Labels. Nur rendern, wenn eine echte Option da ist.

import { Clock3, Sparkles } from 'lucide-react'

import type { ActivityOptionSichtbar } from '@/lib/activities/client-sicht'
import { ACTIVITY_MARKE_TEXT, type ActivityMarke } from '@/lib/activities/domain'
import { validateViatorImageUrl } from '@/lib/providers/viator/activities/url'
import { betragLesbar } from '@/lib/trips/bezeichnungen'
import { cn } from '@/lib/utils'

function dauerText(minuten: number | null): string | null {
  if (minuten === null) return null
  if (minuten < 60) return `${minuten} Min.`
  const stunden = Math.floor(minuten / 60)
  const rest = minuten % 60
  return rest === 0 ? `${stunden} Std.` : `${stunden} Std. ${rest} Min.`
}

export default function AktivitaetKarte({
  option,
  laeuft,
  onUebernehmen,
  onPruefen,
}: {
  option: ActivityOptionSichtbar
  laeuft: boolean
  onUebernehmen?: () => void
  onPruefen?: () => void
}) {
  const bild = option.bildUrl && validateViatorImageUrl(option.bildUrl).ok ? option.bildUrl : null
  const basis =
    option.preisRolle === 'rrp_from'
      ? 'ab, keine aktuelle Verfügbarkeit'
      : option.preisRolle === 'rrp_schedule'
        ? 'Kalenderhinweis, keine aktuelle Verfügbarkeit'
        : option.preisRolle === 'rrp_check'
          ? 'aktuelle Prüfung'
          : 'Preisgrundlage unbekannt'
  return (
    <article className="min-w-0 rounded-2xl border border-line-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {option.labels.map((marke: ActivityMarke) => (
          <span
            key={marke}
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
              marke === 'jetnity' ? 'bg-citrus-400 text-brand-900' : 'bg-surface-100 text-brand-800',
            )}
          >
            {ACTIVITY_MARKE_TEXT[marke]}
          </span>
        ))}
        {option.konflikt === 'ueberschneidung' && (
          <span className="inline-flex items-center rounded-full bg-surface-50 px-2.5 py-1 text-xs font-semibold text-danger-600">
            Zeitkonflikt
          </span>
        )}
      </div>

      <div className="mt-3 min-w-0">
        {bild ? (
          // Provider bytes stay on the original host. Next image optimization would fetch and cache them.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bild} alt="" className="mb-3 h-36 w-full rounded-xl object-cover" />
        ) : option.provider === 'viator' ? (
          <p className="mb-3 text-xs text-ink-700">Kein geprüftes Bild von Viator.</p>
        ) : null}
        {option.provider === 'viator' ? <p className="text-xs font-semibold text-brand-700">Viator</p> : null}
        <h3 className="break-words text-lg font-semibold tracking-[-0.03em] text-brand-800">
          {option.title}
        </h3>
        <p className="mt-1 break-words text-sm leading-6 text-ink-800">
          {option.locationName || 'Ort noch ohne genaue Angabe'}
        </p>
        <p className="mt-1 text-xs text-ink-700">
          {[
            option.timeslot
              ? `${option.timeslot.startsAt}${option.timeslot.endsAt ? `–${option.timeslot.endsAt}` : ''}`
              : null,
            dauerText(option.dauerMinuten),
            option.bewertung !== null ? `Bewertung ${option.bewertung.toFixed(1)}` : null,
            option.stornierbar === true
              ? 'Stornierbar'
              : option.stornierbar === false
                ? 'Nicht stornierbar'
                : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Weitere Fakten liegen noch nicht vor.'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line-100 pt-4">
        <div className="min-w-0">
          <p className="text-xs text-ink-700">{basis}</p>
          <p className="text-lg font-semibold text-brand-800">
            {option.preis !== null && option.preisWaehrung
              ? betragLesbar(option.preis, option.preisWaehrung)
              : 'Preis unbekannt'}
          </p>
          {option.preisWaehrung && option.preisWaehrung !== 'CHF' ? (
            <p className="text-xs text-ink-700">Keine Umrechnung nach CHF.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {onPruefen && (
            <button
              type="button"
              onClick={onPruefen}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line-200 bg-white px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            >
              Angebot prüfen
            </button>
          )}
        {onUebernehmen && (
          <button
            type="button"
            onClick={onUebernehmen}
            disabled={laeuft}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            In die Reise
          </button>
        )}
        </div>
      </div>

      {option.reasons.length > 0 && (
        <ul className="mt-4 grid gap-1.5 rounded-2xl bg-surface-25 px-3 py-3">
          {option.reasons.map((grund) => (
            <li key={grund} className="flex items-start gap-2 text-xs leading-5 text-ink-800">
              <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
              <span className="min-w-0 break-words">{grund}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
