// lib/readiness/source-registry.ts
//
// First-party Source Registry für Official Evidence.
// Rein, deterministisch, ohne Netz, ohne Katalog echter Behörden-Domains.
// Die Requirements-/Official-Truth-Engine bleibt die einzige Auswertung.
// Ein lizenzierter Anbieter ist kein Staat und trägt keinen Authority-Namen.

import { quelleUrlLesen } from '@/lib/readiness/official'

export const QUELLEN_KLASSEN = ['official_authority', 'licensed_evidence_provider'] as const
export type QuellenKlasse = (typeof QUELLEN_KLASSEN)[number]

export type RegistrierteQuelle = {
  sourceId: string
  sourceClass: QuellenKlasse
  publisherName: string
  /** Nur bei `official_authority`. Bei einem lizenzierten Anbieter immer null. */
  authorityName: string | null
  /** Normalisierte Hostnamen, klein, ohne Schema, Port, Pfad oder Userinfo. */
  domains: readonly string[]
}

export type QuellenRegistry = {
  readonly sources: readonly RegistrierteQuelle[]
  readonly blockedDomains: readonly string[]
}

export type QuellenEingabe = {
  sourceId: string
  sourceClass: QuellenKlasse
  publisherName: string
  authorityName?: string | null
  domains: readonly string[]
}

export type QuellenRegistryFehler =
  | 'invalid_source_id'
  | 'invalid_source_class'
  | 'invalid_publisher_name'
  | 'authority_required'
  | 'provider_is_not_authority'
  | 'invalid_domain'
  | 'empty_domains'
  | 'duplicate_source_id'
  | 'overlapping_domains'
  | 'invalid_blocked_domain'

export type QuellenRegistryErgebnis =
  | { ok: true; registry: QuellenRegistry }
  | { ok: false; reason: QuellenRegistryFehler }

export type QuellenUrlFehler =
  | 'invalid_url'
  | 'insecure_scheme'
  | 'credentials'
  | 'unregistered_domain'
  | 'blocked_domain'

export type QuellenUrlErgebnis =
  | { ok: true; source: RegistrierteQuelle; canonicalUrl: string; domain: string }
  | { ok: false; reason: QuellenUrlFehler }

export function leereQuellenRegistry(): QuellenRegistry {
  return Object.freeze({ sources: Object.freeze([]), blockedDomains: Object.freeze([]) })
}

/**
 * Hostnamen normalisieren. Schemas, Userinfo, Ports, Pfade und Einzel-Labels
 * sind keine registrierbaren Domains. Kein Netz, keine DNS-Auflösung.
 */
export function domaeneNormalisieren(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  let text = wert.trim().toLowerCase()
  if (!text || text.length > 253) return null
  if (text.includes('://') || text.includes('/') || text.includes('?') || text.includes('#') || text.includes('@')) {
    return null
  }
  if (text.includes(':') || /\s/.test(text)) return null
  if (text.endsWith('.')) text = text.slice(0, -1)
  if (!text || text.startsWith('.') || text.includes('..') || text.includes('*')) return null
  if (text === 'localhost' || text.endsWith('.localhost') || text.endsWith('.local')) return null
  const labels = text.split('.')
  if (labels.length < 2) return null
  if (labels.every((label) => /^\d+$/.test(label))) return null
  for (const label of labels) {
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) return null
  }
  return text
}

function sourceIdLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const id = wert.trim()
  return /^[a-z][a-z0-9_-]{1,63}$/.test(id) ? id : null
}

function anzeigeNameLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  if (text.length < 2 || text.length > 80) return null
  if (/[\u0000-\u001f]/.test(text) || text.includes('://')) return null
  return text
}

function hostGehoertZu(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

function domaenenKollidieren(links: string, rechts: string): boolean {
  return hostGehoertZu(links, rechts) || hostGehoertZu(rechts, links)
}

function quelleEinfrieren(quelle: RegistrierteQuelle): RegistrierteQuelle {
  return Object.freeze({
    ...quelle,
    domains: Object.freeze([...quelle.domains]),
  })
}

export function quellenRegistryErstellen(
  eingaben: readonly QuellenEingabe[],
  optionen?: { blockedDomains?: readonly string[] },
): QuellenRegistryErgebnis {
  const blocked: string[] = []
  for (const eintrag of optionen?.blockedDomains ?? []) {
    const domain = domaeneNormalisieren(eintrag)
    if (!domain) return { ok: false, reason: 'invalid_blocked_domain' }
    if (!blocked.includes(domain)) blocked.push(domain)
  }
  blocked.sort()

  const quellen: RegistrierteQuelle[] = []
  const geseheneIds = new Set<string>()

  for (const eingabe of eingaben) {
    const sourceId = sourceIdLesen(eingabe.sourceId)
    if (!sourceId) return { ok: false, reason: 'invalid_source_id' }
    if (geseheneIds.has(sourceId)) return { ok: false, reason: 'duplicate_source_id' }
    if (!(QUELLEN_KLASSEN as readonly string[]).includes(eingabe.sourceClass)) {
      return { ok: false, reason: 'invalid_source_class' }
    }
    const publisherName = anzeigeNameLesen(eingabe.publisherName)
    if (!publisherName) return { ok: false, reason: 'invalid_publisher_name' }

    let authorityName: string | null
    if (eingabe.sourceClass === 'licensed_evidence_provider') {
      if (eingabe.authorityName != null && anzeigeNameLesen(eingabe.authorityName)) {
        return { ok: false, reason: 'provider_is_not_authority' }
      }
      if (typeof eingabe.authorityName === 'string' && eingabe.authorityName.trim() !== '') {
        return { ok: false, reason: 'provider_is_not_authority' }
      }
      authorityName = null
    } else {
      const authority = anzeigeNameLesen(eingabe.authorityName)
      if (!authority) return { ok: false, reason: 'authority_required' }
      authorityName = authority
    }

    if (!Array.isArray(eingabe.domains) || eingabe.domains.length === 0) {
      return { ok: false, reason: 'empty_domains' }
    }
    const domains: string[] = []
    for (const roh of eingabe.domains) {
      const domain = domaeneNormalisieren(roh)
      if (!domain) return { ok: false, reason: 'invalid_domain' }
      if (!domains.includes(domain)) domains.push(domain)
    }
    domains.sort()

    for (const andere of quellen) {
      for (const links of domains) {
        for (const rechts of andere.domains) {
          if (domaenenKollidieren(links, rechts)) return { ok: false, reason: 'overlapping_domains' }
        }
      }
    }

    geseheneIds.add(sourceId)
    quellen.push({
      sourceId,
      sourceClass: eingabe.sourceClass,
      publisherName,
      authorityName,
      domains,
    })
  }

  quellen.sort((links, rechts) => (links.sourceId < rechts.sourceId ? -1 : links.sourceId > rechts.sourceId ? 1 : 0))

  return {
    ok: true,
    registry: Object.freeze({
      sources: Object.freeze(quellen.map(quelleEinfrieren)),
      blockedDomains: Object.freeze(blocked),
    }),
  }
}

/**
 * HTTPS-URL gegen die Registry auflösen.
 * Dieselbe Vertrauensgrenze wie `quelleUrlLesen`: kein HTTP, keine Userinfo,
 * kein localhost. Nicht registrierte oder gesperrte Hosts scheitern geschlossen.
 */
export function quellenUrlAufloesen(registry: QuellenRegistry, wert: unknown): QuellenUrlErgebnis {
  if (typeof wert !== 'string') return { ok: false, reason: 'invalid_url' }
  const text = wert.trim()
  if (!text) return { ok: false, reason: 'invalid_url' }
  if (/^http:\/\//i.test(text)) return { ok: false, reason: 'insecure_scheme' }

  let gelesen: URL
  try {
    gelesen = new URL(text)
  } catch {
    return { ok: false, reason: 'invalid_url' }
  }
  if (gelesen.username || gelesen.password) return { ok: false, reason: 'credentials' }
  if (gelesen.protocol !== 'https:') return { ok: false, reason: 'invalid_url' }

  const canonicalUrl = quelleUrlLesen(text)
  if (!canonicalUrl) return { ok: false, reason: 'invalid_url' }
  const host = new URL(canonicalUrl).hostname.toLowerCase()
  if (registry.blockedDomains.some((domain) => hostGehoertZu(host, domain))) {
    return { ok: false, reason: 'blocked_domain' }
  }
  const source = registry.sources.find((eintrag) => eintrag.domains.some((domain) => hostGehoertZu(host, domain)))
  if (!source) return { ok: false, reason: 'unregistered_domain' }
  const domain = source.domains.find((eintrag) => hostGehoertZu(host, eintrag)) ?? host
  return { ok: true, source, canonicalUrl, domain }
}
