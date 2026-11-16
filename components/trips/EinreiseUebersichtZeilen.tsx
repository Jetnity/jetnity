'use client'

import { AlertCircle, Check, ChevronRight, Circle } from 'lucide-react'

import { EINREISE_AMPEL_TEXT, type EinreiseAmpel, type EinreiseUebersichtZeile } from '@/lib/readiness/einreise-kundenanzeige'
import { cn } from '@/lib/utils'

function Symbol({ art }: { art: EinreiseAmpel }) {
  const Icon = art === 'gruen' ? Check : art === 'orange' ? AlertCircle : Circle
  return <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
}

export default function EinreiseUebersichtZeilen({
  zeilen,
  onOeffnen,
}: {
  zeilen: readonly EinreiseUebersichtZeile[]
  onOeffnen?: () => void
}) {
  if (zeilen.length === 0) return null
  return (
    <section aria-label="Einreise und Visum" className="min-w-0 overflow-hidden rounded-[24px] border border-line-200 bg-white">
      <h3 className="border-b border-line-100 px-4 py-3 text-base font-semibold text-brand-800">Einreise & Visum</h3>
      <ul className="divide-y divide-line-100">
        {zeilen.map((zeile) => {
          const inhalt = (
            <>
              <span className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                zeile.ampel === 'gruen' && 'bg-surface-100 text-brand-800',
                zeile.ampel === 'orange' && 'bg-amber-100 text-amber-950',
                zeile.ampel === 'neutral' && 'bg-surface-50 text-ink-800',
              )}>
                <Symbol art={zeile.ampel} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block break-words text-sm text-brand-800">{zeile.land}</strong>
                <span className="mt-0.5 block break-words text-xs leading-5 text-ink-800">{EINREISE_AMPEL_TEXT[zeile.ampel]}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-600" aria-hidden="true" />
            </>
          )
          const klasse = 'flex min-h-11 w-full items-center gap-3 px-3 py-3 text-left hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15'
          return (
            <li key={zeile.countryCode}>
              {onOeffnen ? (
                <button type="button" className={klasse} onClick={onOeffnen} aria-label={`${zeile.land}: ${zeile.ampelText}. Einreise und Visum in der Vorbereitung öffnen`}>
                  {inhalt}
                </button>
              ) : (
                <a href="?ansicht=vorbereitung&vorbereitung=offizielle-anforderungen" className={klasse}>
                  {inhalt}
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
