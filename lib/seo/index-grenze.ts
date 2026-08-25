// lib/seo/index-grenze.ts
//
// D0-1: dieselbe Index-Grenze für HTML-robots, Sitemap und robots.txt.
//
// Private Reise-Surfaces und sensitive Hilfsflächen dürfen nicht indexierbar
// sein, unabhängig davon, ob robots.txt gerade deny-all oder Allow-Modus ist.
// `/planen` bleibt als Basisseite bewusst öffentlich; parametrisierte Varianten
// mit Nutzer-/Intent-Text sind es nicht.
//
// Kein Canonical, kein hreflang, kein JSON-LD, kein Tracking.

export const NICHT_INDEXIEREN = { index: false, follow: false } as const

/** Search-Params, die /planen zu einer intentbezogenen Variante machen. */
export const PLANEN_INDEX_PARAMS = ['idee', 'ziel', 'zielId'] as const

/** Öffentliche Sitemap-Pfade nach D0-1. Keine Reiseübersicht, keine Trip-URLs. */
export const SITEMAP_OEFFENTLICHE_PFADE = ['/', '/planen'] as const

function ersterSuchwert(wert?: string | string[] | null): string {
  const roh = Array.isArray(wert) ? wert[0] : wert
  return typeof roh === 'string' ? roh.trim() : ''
}

export function planenHatIndexRelevanteParams(
  searchParams?: Record<string, string | string[] | undefined> | null,
): boolean {
  if (!searchParams) return false
  return PLANEN_INDEX_PARAMS.some((name) => ersterSuchwert(searchParams[name]) !== '')
}

/**
 * `undefined` heisst: kein eigenes robots-Signal, die öffentliche Basis gilt.
 * Nur parametrisierte Varianten setzen noindex.
 */
export function planenRobots(
  searchParams?: Record<string, string | string[] | undefined> | null,
): typeof NICHT_INDEXIEREN | undefined {
  return planenHatIndexRelevanteParams(searchParams) ? NICHT_INDEXIEREN : undefined
}

export function sitemapEnthaeltReiseuebersicht(urls: readonly string[]): boolean {
  return urls.some((url) => {
    try {
      const pfad = new URL(url, 'https://jetnity.invalid').pathname
      return pfad === '/reisen' || pfad.startsWith('/reisen/')
    } catch {
      return false
    }
  })
}
