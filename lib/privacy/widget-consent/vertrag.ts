// Geschlossene Anbieter und der Repo-Nachweis, dass Skripte aus bleiben.
// Aufrufer können diese Konstanten nicht überschreiben.

export const WIDGET_CONSENT_PROVIDER_IDS = ['discovercars', 'twelvego'] as const

export type WidgetConsentProviderId = (typeof WIDGET_CONSENT_PROVIDER_IDS)[number]

export const WIDGET_CONSENT_PURPOSES = [
  'functional_load',
  'nonessential_analytics',
  'advertising_marketing',
] as const

export type WidgetConsentPurpose = (typeof WIDGET_CONSENT_PURPOSES)[number]

export type InformativeChoice = 'not_decided' | 'refused' | 'granted'

/** Nachweis im Quelltext. Kein Client-Feld. */
export const VENDOR_PURPOSE_SEPARATION_VERIFIED = false as const

/** Harter Aus-Schalter. Kein Client-Feld. */
export const VENDOR_SCRIPT_EXECUTION_AUTHORIZED = false as const

export type WidgetConsentProviderFact = {
  readonly id: WidgetConsentProviderId
  readonly label: string
  readonly privacyHref: string
  readonly privacyLinkLabel: string
  readonly observedHosts: readonly string[]
  readonly purposeSeparationVerified: false
  readonly vendorScriptExecutionAuthorized: false
  readonly liveInJetnity: false
}

function faktum(wert: WidgetConsentProviderFact): WidgetConsentProviderFact {
  return Object.freeze({
    ...wert,
    observedHosts: Object.freeze([...wert.observedHosts]),
  })
}

/**
 * Öffentliche Datenschutz-URLs, keine Widget-Skripte.
 * DiscoverCars: öffentliche Seite /privacy, in dieser Runde nur als Link beobachtet.
 * 12Go: im Vertrags-Audit 2026-08-29 mit HTTP 200 notiert. Kein erneuter Abruf hier.
 */
export const WIDGET_CONSENT_PROVIDERS: {
  readonly discovercars: WidgetConsentProviderFact
  readonly twelvego: WidgetConsentProviderFact
} = Object.freeze({
  discovercars: faktum({
    id: 'discovercars',
    label: 'DiscoverCars',
    privacyHref: 'https://www.discovercars.com/privacy',
    privacyLinkLabel: 'Datenschutzhinweise von DiscoverCars',
    observedHosts: [
      'www.discovercars.com',
      'widget.discovercars.com',
      'www.googletagmanager.com',
      'fonts.gstatic.com',
    ],
    purposeSeparationVerified: false,
    vendorScriptExecutionAuthorized: false,
    liveInJetnity: false,
  }),
  twelvego: faktum({
    id: 'twelvego',
    label: '12Go',
    privacyHref: 'https://12go.asia/en/privacy-policy',
    privacyLinkLabel: 'Datenschutzhinweise von 12Go',
    observedHosts: [
      '12go.asia',
      'cdn0.trainbusferry.com',
      'ajax.googleapis.com',
      'agent.12go.asia',
    ],
    purposeSeparationVerified: false,
    vendorScriptExecutionAuthorized: false,
    liveInJetnity: false,
  }),
})

export function parseWidgetConsentProviderId(value: unknown): WidgetConsentProviderId | null {
  if (value === 'discovercars' || value === 'twelvego') return value
  return null
}

export function purposeControlsEnforceable(providerId: WidgetConsentProviderId): false {
  return WIDGET_CONSENT_PROVIDERS[providerId].purposeSeparationVerified
}
