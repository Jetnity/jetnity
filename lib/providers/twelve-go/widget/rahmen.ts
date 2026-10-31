// lib/providers/twelve-go/widget/rahmen.ts
//
// Vertrag für einen späteren undurchsichtigen Rahmen.
// Die Besucherfläche setzt ihn nicht ein. Kein Anbieter-Skript.

import { WIDGET_CONSENT_PROVIDERS } from '@/lib/privacy/widget-consent/vertrag'
import {
  TWELVE_GO_CHILD_ORIGIN,
  TWELVE_GO_HOST_SANDBOX,
  TWELVE_GO_HOST_SRC,
  TWELVE_GO_PROVIDER,
} from '@/lib/providers/twelve-go/widget/protokoll'

/** R2: Inhaltshöhe 369px, Fenster 800px hat alle Felder gezeigt. */
export const TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX = 800
export const TWELVE_GO_WIDGET_RAHMEN_BREITE = '100%'
/** Synthetic empty frame only. The separate HTTPS host uses the four-token sandbox. */
export const TWELVE_GO_WIDGET_SANDBOX = 'allow-scripts'

const VERBOTEN = [
  'allow-same-origin',
  'allow-forms',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-top-navigation',
  'allow-top-navigation-by-user-activation',
] as const

export function twelveGoWidgetSandboxIstOpaque(wert: string): boolean {
  const teile = wert.split(/\s+/).filter(Boolean)
  return teile.length === 1 && teile[0] === TWELVE_GO_WIDGET_SANDBOX && !VERBOTEN.some((token) => teile.includes(token))
}

/** Dieselbe Hostliste wie der gelesene Consent-Vertrag. Keine zweite Quelle. */
export function twelveGoWidgetBeobachteteHosts(): readonly string[] {
  return WIDGET_CONSENT_PROVIDERS.twelvego.observedHosts
}

export function twelveGoHostPasst(capability: {
  providerId: string
  src: string
  childOrigin: string
  sandbox: string
  protocolRevision: number
}): boolean {
  if (capability.providerId !== TWELVE_GO_PROVIDER || capability.protocolRevision !== 1) return false
  if (capability.src !== TWELVE_GO_HOST_SRC || capability.childOrigin !== TWELVE_GO_CHILD_ORIGIN) return false
  if (capability.src.includes('?') || capability.src.includes('#') || capability.src.startsWith('//')) return false
  return capability.sandbox === TWELVE_GO_HOST_SANDBOX
    && !capability.sandbox.includes('allow-top-navigation')
    && !capability.sandbox.includes('allow-popups-to-escape-sandbox')
}
