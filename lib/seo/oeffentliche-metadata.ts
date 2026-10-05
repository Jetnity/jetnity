// lib/seo/oeffentliche-metadata.ts
//
// P1-D0-LIVE-01: HTML-robots, GoogleBot, Canonical, OpenGraph-Public-URL
// und Homepage-JSON-LD-url müssen dieselbe D0-2-Wahrheit verwenden wie
// robots.txt und Sitemap.
//
// Indexing bleibt fail-closed, solange `darfIndexieren` falsch ist.
// Öffentliche Metadata-URLs sind immer https://jetnity.com.
// *.vercel.app darf niemals als Jetnity-Canonical oder öffentliche OG-URL
// erscheinen. Kein Domain-Cutover, kein DNS, keine Indexing-Aktivierung.

import {
  KANONISCHE_PUBLIC_ORIGIN,
  oeffentlicherOrigin,
  originIstEphemeral,
  type OriginUmgebung,
} from '@/lib/seo/oeffentlicher-origin'
import { robotsDokument } from '@/lib/seo/robots-regeln'

export type HtmlRobots = {
  index: boolean
  follow: boolean
  googleBot: {
    index: boolean
    follow: boolean
    'max-image-preview'?: 'none' | 'standard' | 'large'
    'max-snippet'?: number
    'max-video-preview'?: number
  }
}

/** Einzige öffentliche Produktdomain für Canonical, OG und JSON-LD. */
export function oeffentlicheMetadataOrigin(): string {
  return KANONISCHE_PUBLIC_ORIGIN
}

export function htmlRobots(env?: OriginUmgebung): HtmlRobots {
  const { darfIndexieren } = oeffentlicherOrigin(env)
  if (!darfIndexieren) {
    return {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    }
  }
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  }
}

export function htmlRobotsUndRobotsTxtSindKonsistent(env?: OriginUmgebung): boolean {
  const html = htmlRobots(env)
  const robots = robotsDokument(env)
  const { darfIndexieren } = oeffentlicherOrigin(env)
  const htmlErlaubt =
    html.index === true &&
    html.follow === true &&
    html.googleBot.index === true &&
    html.googleBot.follow === true
  const htmlVerweigert =
    html.index === false &&
    html.follow === false &&
    html.googleBot.index === false &&
    html.googleBot.follow === false
  const robotsDenyAll =
    robots.disallow.length === 1 &&
    robots.disallow[0] === '/' &&
    robots.sitemap === null &&
    robots.host === null
  const robotsAllow =
    robots.sitemap === `${KANONISCHE_PUBLIC_ORIGIN}/sitemap.xml` &&
    robots.host === KANONISCHE_PUBLIC_ORIGIN &&
    robots.disallow[0] !== '/'

  if (darfIndexieren) return htmlErlaubt && robotsAllow
  return htmlVerweigert && robotsDenyAll && !htmlErlaubt
}

export function istVerboteneVercelPublicUrl(url: string): boolean {
  try {
    return originIstEphemeral(new URL(url).hostname)
  } catch {
    return /\.vercel\.app/i.test(url)
  }
}
