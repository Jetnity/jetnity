// components/trips/TwelveGoWidgetEinbau.tsx
//
// Hinweis in der bestehenden 12Go-Fläche. Kein Ladeknopf, kein Skript,
// kein Frame. Die Freigabe bleibt zu, bis Einwilligung und Einbettung
// ausdrücklich freigegeben sind.

import { twelveGoWidgetBesucherAnsicht } from '@/lib/providers/twelve-go/widget/ansicht'
import { TWELVE_GO_WIDGET_FREIGABE } from '@/lib/providers/twelve-go/widget/freigabe'

export default function TwelveGoWidgetEinbau() {
  const ansicht = twelveGoWidgetBesucherAnsicht()
  const geoeffnet = TWELVE_GO_WIDGET_FREIGABE.ausfuehrbar === true

  return (
    <p
      className="mt-5 text-sm leading-6 text-ink-800"
      data-twelve-go-widget={geoeffnet ? 'consent-blocked' : ansicht.marker}
      data-twelve-go-widget-ausfuehrbar="false"
    >
      {ansicht.text}
    </p>
  )
}
