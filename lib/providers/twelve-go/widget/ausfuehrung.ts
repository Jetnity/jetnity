// lib/providers/twelve-go/widget/ausfuehrung.ts
//
// Beide Aus-Schalter. Ein informativer Grant und ein fremdes `enabled`
// ändern das Ergebnis nicht.

import {
  applyWidgetConsentCommand,
  createWidgetConsentState,
  vendorScriptMayExecute,
} from '@/lib/privacy/widget-consent/entscheidung'
import { TWELVE_GO_WIDGET_FREIGABE } from '@/lib/providers/twelve-go/widget/freigabe'

export function twelveGoWidgetDarfAusfuehren(untrusted?: { readonly enabled?: boolean }): false {
  const anfang = createWidgetConsentState('twelvego', 'twelve-go-widget')
  const informativ = applyWidgetConsentCommand(anfang, {
    type: 'grant_informative',
    generation: anfang.generation,
  }).state
  void vendorScriptMayExecute(informativ, untrusted)
  void TWELVE_GO_WIDGET_FREIGABE.ausfuehrbar
  return false
}
