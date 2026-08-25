// lib/seo/index-grenze.ts
//
// D0-1: dieselbe Index-Grenze für HTML-robots, Sitemap und robots.txt.
//
// Private Reise-Surfaces und sensitive Hilfsflächen dürfen nicht indexierbar
// sein, unabhängig davon, ob robots.txt gerade deny-all oder Allow-Modus ist.
// `/planen` bleibt als Basisseite bewusst öffentlich; parametrisierte Varianten
// mit vorhandenem idee/ziel/zielId-Key sind es nicht, unabhängig vom Wert.
//
// Kein Canonical, kein hreflang, kein JSON-LD, kein Tracking.

export const NICHT_INDEXIEREN = { index: false, follow: false } as const

/** Search-Params, die /planen zu einer intentbezogenen Variante machen. */
export const PLANEN_INDEX_PARAMS = ['idee', 'ziel', 'zielId'] as const

/** Öffentliche Sitemap-Pfade nach D0-1. Keine Reiseübersicht, keine Trip-URLs. */
export const SITEMAP_OEFFENTLICHE_PFADE = ['/', '/planen'] as const

/**
 * Relevanz nach Key-Präsenz, nicht nach nicht-leerem Wert.
 * `/planen?idee=`, `?idee`, whitespace-only und Arrays zählen, sobald der
 * akzeptierte Key vorhanden ist. Unbekannte Keys allein bleiben Basis.
 */
export function planenHatIndexRelevanteParams(
  searchParams?: Record<string, string | string[] | undefined> | null,
): boolean {
  if (!searchParams) return false
  return PLANEN_INDEX_PARAMS.some((name) => Object.hasOwn(searchParams, name))
}

/**
 * `undefined` heisst: kein eigenes robots-Signal, die öffentliche Basis gilt.
 * Sobald ein akzeptierter Key vorhanden ist, unabhängig vom Wert: noindex.
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
