// lib/provider-ops/usage-policy.ts
//
// S8: schmaler Cache-/Persistenz-/Attributionsvertrag.
// Keine Provider-Lizenzbehauptung, kein UniversalOffer, keine Commercial Provenance.
// Ungeprüfte Vertragslage bleibt hart fail-closed.

export const PROVIDER_OPS_CACHE_CLASSES = ['forbidden', 'short_search', 'reference'] as const
export type ProviderOpsCacheClass = (typeof PROVIDER_OPS_CACHE_CLASSES)[number]

export const PROVIDER_OPS_PERSIST_CLASSES = [
  'forbidden',
  'ephemeral_offer',
  'user_snapshot',
] as const
export type ProviderOpsPersistClass = (typeof PROVIDER_OPS_PERSIST_CLASSES)[number]

export const PROVIDER_OPS_USAGE_POLICY_FELDER = [
  'cacheClass',
  'persistClass',
  'attributionRequired',
  'displayNotice',
] as const

export const PROVIDER_OPS_DISPLAY_NOTICE_MAX_CHARS = 500

/**
 * `attributionRequired` ist absichtlich tri-state:
 * - true  = vertraglich geprüft erforderlich
 * - false = vertraglich geprüft nicht erforderlich
 * - null  = unbekannt / Vertrag nicht geprüft
 *
 * `unknown` darf niemals still zu `false` werden.
 */
export type ProviderOpsUsagePolicy = {
  cacheClass: ProviderOpsCacheClass
  persistClass: ProviderOpsPersistClass
  attributionRequired: boolean | null
  displayNotice: string | null
}

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert)
}

function istCacheClass(wert: unknown): wert is ProviderOpsCacheClass {
  return typeof wert === 'string' && (PROVIDER_OPS_CACHE_CLASSES as readonly string[]).includes(wert)
}

function istPersistClass(wert: unknown): wert is ProviderOpsPersistClass {
  return typeof wert === 'string' && (PROVIDER_OPS_PERSIST_CLASSES as readonly string[]).includes(wert)
}

function displayNoticeLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const bereinigt = wert
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PROVIDER_OPS_DISPLAY_NOTICE_MAX_CHARS)
  return bereinigt || null
}

/**
 * Kanonischer Zustand, solange kein echter Providervertrag von Jetnity geprüft
 * wurde. Kein Cache-Recht, kein Persistenz-Recht, keine Attributionsbehauptung.
 */
export function providerOpsUngepruefteUsagePolicy(): ProviderOpsUsagePolicy {
  return {
    cacheClass: 'forbidden',
    persistClass: 'forbidden',
    attributionRequired: null,
    displayNotice: null,
  }
}

/**
 * Nur für serverseitige Konfiguration verwenden, deren Vertrags-/Lizenzinhalt
 * ausserhalb dieses Moduls tatsächlich geprüft wurde. Die Funktion verifiziert
 * keinen Vertrag; sie normalisiert ausschliesslich auf die S8-Allowlist.
 *
 * Fehlende oder ungültige Werte fallen einzeln fail-closed zurück. Zusätzliche
 * Felder werden nie übernommen.
 */
export function providerOpsUsagePolicyAusGepruefterKonfiguration(
  eingabe: unknown,
): ProviderOpsUsagePolicy {
  if (!istObjekt(eingabe)) return providerOpsUngepruefteUsagePolicy()

  return {
    cacheClass: istCacheClass(eingabe.cacheClass) ? eingabe.cacheClass : 'forbidden',
    persistClass: istPersistClass(eingabe.persistClass) ? eingabe.persistClass : 'forbidden',
    attributionRequired:
      typeof eingabe.attributionRequired === 'boolean' ? eingabe.attributionRequired : null,
    displayNotice: displayNoticeLesen(eingabe.displayNotice),
  }
}
