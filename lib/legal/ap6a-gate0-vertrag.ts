// lib/legal/ap6a-gate0-vertrag.ts
//
// AP-6a Gate 0: technischer Legal-Foundation-Vertrag. Kein Rechtstext.
// Keine behauptete Rechtskonformität. Keine Consent-Persistenz.

export const AP6A_LEGAL_ROUTEN = ['/privacy', '/terms'] as const

export type Ap6aLegalRoute = (typeof AP6A_LEGAL_ROUTEN)[number]

/**
 * Weiterhin ohne Page. `/impressum` ist seit PrivacyBee integration 1 eine
 * eigene Route und keine AP-6a-Pflichtroute. `/datenschutz` ist kein Alias.
 */
export const AP6A_VERWANDTE_FEHLENDE_ROUTEN = ['/datenschutz'] as const

export const LEGAL_INPUT_KLASSEN = [
  'belegt',
  'fehlend',
  'unknown',
  'PO-Legal-approval-required',
] as const

export type LegalInputKlasse = (typeof LEGAL_INPUT_KLASSEN)[number]

export const AP6A_RUNTIME_VERTRAG = {
  layout: 'app/(public)/layout.tsx',
  sprache: 'de',
  ueberschrift: 'eine sichtbare h1 je Seite',
  robotsBisPublicIndexing: 'noindex, nofollow',
  sitemapBisPublicIndexing: 'nicht in SITEMAP_OEFFENTLICHE_PFADE',
  canonicalOrigin: 'https://jetnity.com',
  footerMussVerlinken: true,
  registerLinksBleiben: true,
  keineErfundenenRechtstexte: true,
  keineConsentPersistenz: true,
  keineIndexierungVorPublicGate: true,
} as const

export const AP6A_NON_SCOPE = [
  'consent-persistenz',
  'export',
  'kontoloeschung',
  'migration',
  'rls',
  'identity',
  'auth-mfa-aal',
  'service-role',
  'ap-7',
  'provider-live',
  'payments',
  'public-indexing',
  'domain-cutover',
  'branch-protection',
] as const

export const AP6B_ERST_DANACH = [
  'consent-version-zeitstempel',
  'datenexport',
  'kontoloeschung',
  'migration-rls',
] as const

export function istAp6aLegalRoute(pfad: string): pfad is Ap6aLegalRoute {
  return (AP6A_LEGAL_ROUTEN as readonly string[]).includes(pfad)
}
