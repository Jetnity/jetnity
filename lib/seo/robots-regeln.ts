// lib/seo/robots-regeln.ts
//
// D0-1-Disallows plus D0-2-Konsistenz: Indexing-Entscheidung kommt aus
// dem öffentlichen Origin-Vertrag. Deny-all bewirbt keine Sitemap.

import {
  oeffentlicherOrigin,
  originIstEphemeral,
  type OriginUmgebung,
} from '@/lib/seo/oeffentlicher-origin'

export type RobotsUmgebung = OriginUmgebung

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

export const robotsIstEphemeralHost = originIstEphemeral

export function robotsDarfIndexieren(umgebung: RobotsUmgebung): boolean {
  return oeffentlicherOrigin(umgebung).darfIndexieren
}

export function robotsDisallowListe(umgebung: RobotsUmgebung): readonly string[] {
  return robotsDarfIndexieren(umgebung) ? ROBOTS_DISALLOW_ALLOW_MODUS : ['/']
}

export type RobotsDokument = {
  disallow: readonly string[]
  sitemap: string | null
  host: string | null
}

export function robotsDokument(umgebung?: RobotsUmgebung): RobotsDokument {
  const { origin, darfIndexieren } = oeffentlicherOrigin(umgebung)
  if (!darfIndexieren) {
    return { disallow: ['/'], sitemap: null, host: null }
  }
  return {
    disallow: ROBOTS_DISALLOW_ALLOW_MODUS,
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
