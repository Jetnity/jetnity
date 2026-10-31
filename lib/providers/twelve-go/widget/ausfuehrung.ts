// lib/providers/twelve-go/widget/ausfuehrung.ts
//
// Conditional delegation. A copied field bag, an informative grant, or `enabled`
// is not authority. Only a live production handle can return true.

import { checkProductionExecution, type ProductionCapability } from '@/lib/privacy/privacybee-cmp/produktion'
import {
  applyWidgetConsentCommand,
  createWidgetConsentState,
  vendorScriptMayExecute,
} from '@/lib/privacy/widget-consent/entscheidung'
import { TWELVE_GO_WIDGET_FREIGABE } from '@/lib/providers/twelve-go/widget/freigabe'

export function twelveGoWidgetDarfAusfuehren(
  untrusted?: { readonly enabled?: boolean },
  capability?: ProductionCapability | null,
): boolean {
  const anfang = createWidgetConsentState('twelvego', 'twelve-go-widget')
  const informativ = applyWidgetConsentCommand(anfang, {
    type: 'grant_informative',
    generation: anfang.generation,
  }).state
  void vendorScriptMayExecute(informativ, untrusted)
  void TWELVE_GO_WIDGET_FREIGABE.ausfuehrbar
  if (!capability || capability.providerId !== 'twelvego') return false
  return checkProductionExecution(capability)
}
