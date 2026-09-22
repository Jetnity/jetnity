// lib/admin/seo-status.ts
//
// Admin J-lite: bounded read-only projection of the existing D0-2 SEO
// contracts. One supplied environment snapshot is passed to every helper so
// this section cannot mix configurations. No second allow/deny policy.
//
// Never dump process.env or raw setting values. Invalid, credential-bearing,
// query, hash or HTML origins stay behind the public-origin normalizer.

import { htmlRobots } from '@/lib/seo/oeffentliche-metadata'
import {
  KANONISCHE_PUBLIC_ORIGIN,
  oeffentlicherOrigin,
  sitemapOeffentlicheUrls,
  type OriginQuelle,
  type OriginUmgebung,
} from '@/lib/seo/oeffentlicher-origin'
import { robotsDokument } from '@/lib/seo/robots-regeln'

export const SEO_STATUS_TEXTE = {
  titel: 'Indexierungs-Konfiguration',
  standHinweis:
    'Technische Konfiguration dieses Deployments, berechnet beim Laden dieser Seite. Der Knopf „Erneut prüfen“ der System-Health-Karten aktualisiert diesen Abschnitt nicht. Kein Live-HTTP-, Crawler- oder Production-Probe.',
  quelleSite: 'Site-Origin',
  quelleApp: 'App-Origin (Legacy)',
  quelleFallback: 'technischer Fallback',
  entscheidungAllow: 'erlaubt',
  entscheidungDeny: 'verweigert',
  allowHinweis:
    'Die aktuelle Konfiguration erlaubt Indexing. Das ist keine Product-Owner-Launch-Freigabe, kein Nachweis tatsächlicher Indexierung und kein SEO-, Traffic- oder Production-Ready-Beleg.',
  denyHinweis:
    'Die aktuelle Konfiguration sperrt die Indexierung. Diese Anzeige allein bewertet keine Betriebsstörung.',
  sitemapLeer: 'Keine öffentlichen Sitemap-URLs. Im Deny-Modus wird keine Sitemap beworben.',
  sitemapBeworben: 'ja',
  sitemapNichtBeworben: 'nein',
  grenze:
    'Nur technische Konfiguration. Kein Beleg für tatsächliche Indexierung, öffentliche Launch-Freigabe, SEO-Qualität, Traffic oder Production-Readiness.',
  technischeOrigin: 'Technische Origin',
  originQuelle: 'Quelle',
  kanonischeOrigin: 'Kanonische Produkt-Origin',
  entscheidung: 'Indexing-Entscheidung',
  htmlRobots: 'HTML-robots',
  robots: 'robots-Regeln (Disallow)',
  sitemap: 'Sitemap beworben',
  sitemapUrls: 'Öffentliche Sitemap-URLs',
} as const

const QUELLE_LABEL: Record<OriginQuelle, string> = {
  site: SEO_STATUS_TEXTE.quelleSite,
  app: SEO_STATUS_TEXTE.quelleApp,
  fallback: SEO_STATUS_TEXTE.quelleFallback,
}

export type SeoStatusStand = {
  technischeOrigin: string
  hostname: string
  originQuelle: OriginQuelle
  originQuelleLabel: string
  kanonischeProduktOrigin: string
  entscheidung: 'allow' | 'deny'
  entscheidungLabel: string
  entscheidungHinweis: string
  htmlRobots: string
  robotsDisallow: readonly string[]
  sitemapBeworben: boolean
  sitemapUrl: string | null
  sitemapUrls: readonly string[]
  sitemapAnzahl: number
  sitemapHinweis: string
  grenze: string
  standHinweis: string
}

/** Picks only the public-origin contract keys. Extra env keys are dropped. */
export function waehleSeoStatusUmgebung(
  env: Readonly<Record<string, string | undefined>>,
): OriginUmgebung {
  return {
    NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    VERCEL_ENV: env.VERCEL_ENV,
    NODE_ENV: env.NODE_ENV,
    NEXT_PUBLIC_ALLOW_INDEXING: env.NEXT_PUBLIC_ALLOW_INDEXING,
  }
}

export function projiziereSeoStatus(env: OriginUmgebung): SeoStatusStand {
  const snapshot = waehleSeoStatusUmgebung(env)
  const origin = oeffentlicherOrigin(snapshot)
  const robots = robotsDokument(snapshot)
  const urls = sitemapOeffentlicheUrls(snapshot)
  const html = htmlRobots(snapshot)
  const allow = origin.darfIndexieren

  return {
    technischeOrigin: origin.origin,
    hostname: origin.hostname,
    originQuelle: origin.quelle,
    originQuelleLabel: QUELLE_LABEL[origin.quelle],
    kanonischeProduktOrigin: KANONISCHE_PUBLIC_ORIGIN,
    entscheidung: allow ? 'allow' : 'deny',
    entscheidungLabel: allow ? SEO_STATUS_TEXTE.entscheidungAllow : SEO_STATUS_TEXTE.entscheidungDeny,
    entscheidungHinweis: allow ? SEO_STATUS_TEXTE.allowHinweis : SEO_STATUS_TEXTE.denyHinweis,
    htmlRobots: `${html.index ? 'index' : 'noindex'}, ${html.follow ? 'follow' : 'nofollow'}`,
    robotsDisallow: robots.disallow,
    sitemapBeworben: robots.sitemap !== null,
    sitemapUrl: robots.sitemap,
    sitemapUrls: urls,
    sitemapAnzahl: urls.length,
    sitemapHinweis: allow
      ? `${urls.length} öffentliche URL${urls.length === 1 ? '' : 's'}`
      : SEO_STATUS_TEXTE.sitemapLeer,
    grenze: SEO_STATUS_TEXTE.grenze,
    standHinweis: SEO_STATUS_TEXTE.standHinweis,
  }
}
