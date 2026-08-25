// lib/seo/robots-regeln.ts
//
// D0-1: Allow-Index-Disallows und der ephemeral-Host-Kill-Switch.
//
// Die Entscheidung, ob überhaupt indexiert werden darf, bleibt ENV-gebunden
// (Production + nicht-ephemeral Host + Kill-Switch). Dieser Slice aktiviert
// kein Custom-Domain-Indexing und lockert den Switch nicht.

export type RobotsUmgebung = {
  NEXT_PUBLIC_APP_URL?: string
  VERCEL_ENV?: string
  NODE_ENV?: string
  NEXT_PUBLIC_ALLOW_INDEXING?: string
}

/**
 * Pfade, die im Allow-Modus ausdrücklich nicht gecrawlt werden sollen.
 * Bestehende Admin-/Account-/Auth-/API-Regeln bleiben; D0-1 ergänzt Reisen,
 * Auth-Callbacks und Unauthorized.
 */
export const ROBOTS_DISALLOW_ALLOW_MODUS = [
  '/api/',
  '/admin/',
  '/account/',
  '/login',
  '/register',
  '/private/',
  '/draft/',
  '/ui-audit',
  '/reisen',
  '/reisen/',
  '/auth/',
  '/unauthorized',
  '/*?*preview=*',
] as const

export function robotsHostAusUrl(raw?: string): { host: string; hostname: string } {
  const host = (raw ?? 'http://localhost:3000').replace(/\/+$/, '')
  try {
    return { host, hostname: new URL(host).hostname }
  } catch {
    return { host, hostname: 'localhost' }
  }
}

export function robotsIstEphemeralHost(hostname: string): boolean {
  return /localhost|\.vercel\.app$/i.test(hostname)
}

export function robotsDarfIndexieren(umgebung: RobotsUmgebung): boolean {
  const { hostname } = robotsHostAusUrl(umgebung.NEXT_PUBLIC_APP_URL)
  const produktion = (umgebung.VERCEL_ENV ?? umgebung.NODE_ENV) === 'production'
  const freigabe = umgebung.NEXT_PUBLIC_ALLOW_INDEXING !== 'false'
  return produktion && !robotsIstEphemeralHost(hostname) && freigabe
}

export function robotsDisallowListe(umgebung: RobotsUmgebung): readonly string[] {
  return robotsDarfIndexieren(umgebung) ? ROBOTS_DISALLOW_ALLOW_MODUS : ['/']
}
