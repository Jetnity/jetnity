// components/trips/TwelveGoWidgetPruefung.tsx
//
// Synthetische Prüfhnaht. Wird von der Besucherfläche nicht eingehängt.
// Sie zeigt die Einwilligung und setzt kein Anbieter-Skript.

import { TWELVE_GO_WIDGET_AKTIONSTEXT, twelveGoWidgetPruefAnsicht } from '@/lib/providers/twelve-go/widget/ansicht'
import type { TwelveGoWidgetZustand } from '@/lib/providers/twelve-go/widget/entscheidung'

const AKTION_KLASSE =
  'mt-3 inline-flex min-h-11 w-full max-w-full items-center whitespace-normal break-words rounded-full border border-line-300 bg-white px-4 py-2 text-left text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:mr-3 sm:w-auto'

export default function TwelveGoWidgetPruefung({
  zustand,
  ausfuehrbar,
  zweck,
}: {
  zustand: TwelveGoWidgetZustand
  ausfuehrbar: boolean
  zweck: string
}) {
  if (zweck !== 'synthetische-pruefung') return null
  const ansicht = twelveGoWidgetPruefAnsicht(zustand, ausfuehrbar)

  return (
    <div data-twelve-go-widget={ansicht.marker} data-twelve-go-widget-skript={ansicht.skript}>
      <p className="text-sm leading-6 text-ink-800">{ansicht.text}</p>
      {ansicht.aktionen.map((aktion) => (
        <button key={aktion} type="button" className={AKTION_KLASSE} data-twelve-go-aktion={aktion}>
          {TWELVE_GO_WIDGET_AKTIONSTEXT[aktion]}
        </button>
      ))}
    </div>
  )
}
