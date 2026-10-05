'use client'

import { ChevronDown, ChevronUp, Pencil, X } from 'lucide-react'

import {
  routeKannVerschieben,
  type RouteVorkommen,
} from '@/lib/places/route-einstieg'
import { cn } from '@/lib/utils'

type RouteZielListeProps = {
  vorkommen: RouteVorkommen[]
  ersetzenKey?: string | null
  onEntfernen: (key: string) => void
  onErsetzen: (key: string) => void
  onVerschieben: (key: string, richtung: 'hoch' | 'runter') => void
  className?: string
}

export default function RouteZielListe({
  vorkommen,
  ersetzenKey = null,
  onEntfernen,
  onErsetzen,
  onVerschieben,
  className,
}: RouteZielListeProps) {
  if (vorkommen.length === 0) return null

  return (
    <ol className={cn('grid gap-2', className)} aria-label="Gewählte Reiseziele">
      {vorkommen.map((eintrag, index) => {
        const name = eintrag.ort?.name || eintrag.text.trim() || `Ziel ${index + 1}`
        const stelle = index + 1
        const wirdErsetzt = ersetzenKey === eintrag.key
        return (
          <li
            key={eintrag.key}
            className={cn(
              'flex min-w-0 flex-wrap items-center gap-2 rounded-2xl border px-3 py-2',
              wirdErsetzt
                ? 'border-brand-600 bg-surface-50'
                : 'border-line-200 bg-surface-0',
            )}
          >
            <span className="min-w-0 flex-1 break-words text-sm font-semibold text-brand-800">
              <span className="sr-only">Ziel {stelle}: </span>
              {name}
              {wirdErsetzt ? (
                <span className="ml-2 font-normal text-ink-700">wird ersetzt</span>
              ) : null}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => onVerschieben(eintrag.key, 'hoch')}
                disabled={!routeKannVerschieben(vorkommen, eintrag.key, 'hoch')}
                aria-label={`${name}, Ziel ${stelle}, nach oben`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line-200 bg-white text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onVerschieben(eintrag.key, 'runter')}
                disabled={!routeKannVerschieben(vorkommen, eintrag.key, 'runter')}
                aria-label={`${name}, Ziel ${stelle}, nach unten`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line-200 bg-white text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onErsetzen(eintrag.key)}
                aria-label={`${name}, Ziel ${stelle}, ersetzen`}
                className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Ersetzen
              </button>
              <button
                type="button"
                onClick={() => onEntfernen(eintrag.key)}
                aria-label={`${name}, Ziel ${stelle}, entfernen`}
                className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Entfernen
              </button>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
