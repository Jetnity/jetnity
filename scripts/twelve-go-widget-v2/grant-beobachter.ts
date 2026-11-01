// Passive counter for the offline bundle. Every call delegates to the real facade
// with the same arguments and returns that same result.

import type { ProductionCapability } from '../../lib/privacy/privacybee-cmp/produktion.ts'
import {
  checkProductionExecution as pruefe,
  consumeProductionGrant as verbrauche,
  releaseProductionExecution as gibFrei,
  requestProductionExecution as frage,
} from '../../lib/privacy/privacybee-cmp/produktion.ts'
import type { WidgetConsentProviderId } from '../../lib/privacy/widget-consent/vertrag.ts'

type Eintrag = { name: 'request' | 'consume' | 'release'; leer: boolean }

function notiz(name: Eintrag['name'], ergebnis: unknown) {
  const fenster = globalThis as { __fassade?: Eintrag[] }
  const liste = fenster.__fassade ?? []
  fenster.__fassade = liste
  liste.push({ name, leer: ergebnis == null })
}

export function requestProductionExecution(providerId: WidgetConsentProviderId, scopeKey: string) {
  const ergebnis = frage(providerId, scopeKey)
  notiz('request', ergebnis)
  return ergebnis
}

export function consumeProductionGrant(capability: ProductionCapability) {
  const ergebnis = verbrauche(capability)
  notiz('consume', ergebnis)
  return ergebnis
}

export function checkProductionExecution(capability: ProductionCapability) {
  return pruefe(capability)
}

export function releaseProductionExecution(capability: ProductionCapability) {
  gibFrei(capability)
  notiz('release', undefined)
}
