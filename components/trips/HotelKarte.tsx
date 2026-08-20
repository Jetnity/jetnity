'use client'

// components/trips/HotelKarte.tsx
//
// Eine Hoteloption mit Jetnity-Labels. Nur rendern, wenn eine echte Option da ist.

import { BedDouble, Clock3 } from 'lucide-react'

import type { HotelOptionSichtbar } from '@/lib/hotels/client-sicht'
import { HOTEL_MARKE_TEXT, type HotelMarke } from '@/lib/hotels/domain'
import { betragLesbar } from '@/lib/trips/bezeichnungen'
import { cn } from '@/lib/utils'

export default function HotelKarte({
  option,
  laeuft,
  onUebernehmen,
}: {
  option: HotelOptionSichtbar
  laeuft: boolean
  onUebernehmen?: () => void
}) {
  return (
    <article className="rounded-2xl border border-line-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {option.labels.map((marke: HotelMarke) => (
          <span
            key={marke}
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
              marke === 'jetnity' ? 'bg-citrus-400 text-brand-900' : 'bg-surface-100 text-brand-800',
            )}
          >
            {HOTEL_MARKE_TEXT[marke]}
          </span>
        ))}
      </div>

      <div className="mt-3 min-w-0">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-brand-800">{option.name}</h3>
        <p className="mt-1 text-sm leading-6 text-ink-800">
          {[option.quartierName, option.adresse].filter(Boolean).join(' · ') || 'Lage noch ohne genaue Adresse'}
        </p>
        <p className="mt-1 text-xs text-ink-700">
          {[
            option.sterne !== null ? `${option.sterne} Sterne` : null,
            option.bewertung !== null ? `Bewertung ${option.bewertung.toFixed(1)}` : null,
            option.fruehstueckEnthalten === true ? 'Frühstück enthalten' : null,
            option.stornierbar === true ? 'Stornierbar' : option.stornierbar === false ? 'Nicht stornierbar' : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Weitere Hotelfakten liegen noch nicht vor.'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line-100 pt-4">
        <div>
          <p className="text-xs text-ink-700">Preis zum Auswahlzeitpunkt</p>
          <p className="text-lg font-semibold text-brand-800">
            {betragLesbar(option.preisGesamt, option.preisWaehrung)}
          </p>
          <p className="text-xs text-ink-700">
            {betragLesbar(option.preisProNacht, option.preisWaehrung)} / Nacht
          </p>
        </div>
        {onUebernehmen && (
          <button
            type="button"
            onClick={onUebernehmen}
            disabled={laeuft}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60"
          >
            <BedDouble className="h-4 w-4" />
            In die Reise
          </button>
        )}
      </div>

      {option.reasons.length > 0 && (
        <ul className="mt-4 grid gap-1.5 rounded-2xl bg-surface-25 px-3 py-3">
          {option.reasons.map((grund) => (
            <li key={grund} className="flex items-start gap-2 text-xs leading-5 text-ink-800">
              <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
              {grund}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
