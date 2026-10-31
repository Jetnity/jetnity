// components/trips/TwelveGoWidgetRahmen.tsx
//
// Prüfhnaht für Größe und Sandbox. Kein src, also kein Netz.
// Die Besucherfläche importiert diese Datei nicht.

import { twelveGoWidgetDarfAusfuehren } from '@/lib/providers/twelve-go/widget/ausfuehrung'
import {
  TWELVE_GO_WIDGET_RAHMEN_BREITE,
  TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX,
  TWELVE_GO_WIDGET_SANDBOX,
} from '@/lib/providers/twelve-go/widget/rahmen'

export default function TwelveGoWidgetRahmen({ zweck }: { zweck: string }) {
  if (zweck !== 'synthetische-pruefung') return null
  if (twelveGoWidgetDarfAusfuehren({ enabled: true }) !== false) return null

  return (
    <iframe
      title="12Go-Suchformular, nicht geladen"
      sandbox={TWELVE_GO_WIDGET_SANDBOX}
      data-twelve-go-rahmen="leer"
      style={{ width: TWELVE_GO_WIDGET_RAHMEN_BREITE, height: TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX, border: 0 }}
    />
  )
}
