// lib/seo/oeffentlicher-origin.ts
//
// D0-2: technische URL-/Origin-Wahrheit für Indexing, Sitemap und robots.
// Öffentliche Canonicals, OG- und JSON-LD-URLs liegen zusätzlich in
// oeffentliche-metadata.ts und dürfen niemals den technischen Host
// (localhost, *.vercel.app) als Jetnity-Produktdomain behaupten.
//
// NEXT_PUBLIC_SITE_URL ist die bevorzugte kanonische Public-Site-Origin.
// NEXT_PUBLIC_APP_URL ist nur Legacy-Fallback, wenn kein eigener Site-Wert
// gesetzt ist. Public Indexing ist explizites Opt-in: nur der exakte Wert
// `true` darf den Allow-Check passieren. Unset, leer, false und jeder
// andere Wert bleiben deny. Der Allow-Pfad ist zusätzlich an genau
// https://jetnity.com gebunden. jetnity.ch, www, http, fremde Hosts,
// localhost, *.vercel.app, ungültige/mehrdeutige Origins, Path-Drift,
// ephemeral App-Hosts und widersprüchliche SITE/APP-Origins bleiben deny.
//
// Kein Custom-Domain-Cutover, kein Redirect, kein produktives Indexing,
// kein hreflang, kein JSON-LD-Ausbau über die vorhandene URL-Eigenschaft hinaus.

import { SITEMAP_OEFFENTLICHE_PFADE } from '@/lib/seo/index-grenze'

export const LOKALER_ORIGIN_FALLBACK = 'http://localhost:3000'

/** Einzige kanonische und indexierbare Public-Origin. Kein .ch-Split. */
export const KANONISCHE_PUBLIC_ORIGIN = 'https://jetnity.com'

export type OriginUmgebung = {
  NEXT_PUBLIC_SITE_URL?: string
  NEXT_PUBLIC_APP_URL?: string
  VERCEL_ENV?: string
  NODE_ENV?: string
  NEXT_PUBLIC_ALLOW_INDEXING?: string
}

export type OriginQuelle = 'site' | 'app' | 'fallback'

export type OeffentlicherOrigin = {
  origin: string
  hostname: string
  quelle: OriginQuelle
  darfIndexieren: boolean
}

type GeparsterOrigin = {
  origin: string
  hostname: string
  hatDrift: boolean
  ungueltig: boolean
}

export function originIstEphemeral(hostname: string): boolean {
  return /localhost|\.vercel\.app$/i.test(hostname)
}

function rohVorhanden(raw?: string): boolean {
  return typeof raw === 'string' && raw.trim() !== ''
}

/** Nur der exakte Wert `true` ist eine bewusste Public-Indexing-Freigabe. */
export function indexingIstExplizitFreigegeben(raw?: string): boolean {
  return raw === 'true'
}

export function originIstKanonischPublic(origin: string): boolean {
  return origin === KANONISCHE_PUBLIC_ORIGIN
}

function parseOrigin(raw?: string): GeparsterOrigin | null {
  if (!rohVorhanden(raw)) return null
  try {
    const url = new URL(raw!.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { origin: LOKALER_ORIGIN_FALLBACK, hostname: 'localhost', hatDrift: false, ungueltig: true }
    }
    if (url.username || url.password) {
      return { origin: LOKALER_ORIGIN_FALLBACK, hostname: 'localhost', hatDrift: false, ungueltig: true }
    }
    const hatDrift =
      (url.pathname !== '/' && url.pathname !== '') || url.search !== '' || url.hash !== ''
    return {
      origin: `${url.protocol}//${url.host}`,
      hostname: url.hostname,
      hatDrift,
      ungueltig: false,
    }
  } catch {
    return { origin: LOKALER_ORIGIN_FALLBACK, hostname: 'localhost', hatDrift: false, ungueltig: true }
  }
}

function umgebungAusProcess(env?: OriginUmgebung): OriginUmgebung {
  if (env) return env
  return {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_ALLOW_INDEXING: process.env.NEXT_PUBLIC_ALLOW_INDEXING,
  }
}

export function oeffentlicherOrigin(env?: OriginUmgebung): OeffentlicherOrigin {
  const umgebung = umgebungAusProcess(env)
  const site = parseOrigin(umgebung.NEXT_PUBLIC_SITE_URL)
  const app = parseOrigin(umgebung.NEXT_PUBLIC_APP_URL)

  let gewaehlt: GeparsterOrigin
  let quelle: OriginQuelle

  if (site && !site.ungueltig) {
    gewaehlt = site
    quelle = 'site'
  } else if (app && !app.ungueltig) {
    gewaehlt = app
    quelle = 'app'
  } else {
    gewaehlt = {
      origin: LOKALER_ORIGIN_FALLBACK,
      hostname: 'localhost',
      hatDrift: false,
      ungueltig: false,
    }
    quelle = 'fallback'
  }

  const produktion = (umgebung.VERCEL_ENV ?? umgebung.NODE_ENV) === 'production'
  const freigabe = indexingIstExplizitFreigegeben(umgebung.NEXT_PUBLIC_ALLOW_INDEXING)
  const siteMehrdeutig =
    rohVorhanden(umgebung.NEXT_PUBLIC_SITE_URL) && Boolean(site && (site.ungueltig || site.hatDrift))
  const appEphemeral = Boolean(app && !app.ungueltig && originIstEphemeral(app.hostname))
  const originsWidersprechen = Boolean(
    site &&
      !site.ungueltig &&
      app &&
      (app.ungueltig || app.hatDrift || app.origin !== site.origin),
  )

  const darfIndexieren =
    produktion &&
    freigabe &&
    originIstKanonischPublic(gewaehlt.origin) &&
    !gewaehlt.ungueltig &&
    !gewaehlt.hatDrift &&
    !originIstEphemeral(gewaehlt.hostname) &&
    !siteMehrdeutig &&
    !appEphemeral &&
    !originsWidersprechen

  return {
    origin: gewaehlt.origin,
    hostname: gewaehlt.hostname,
    quelle,
    darfIndexieren,
  }
}

/**
 * Öffentliche Canonicals gehören der Produktdomain, nicht dem technischen Host.
 * `env` bleibt akzeptiert, damit Aufrufer denselben Vertrag weiterreichen
 * können; die URL selbst darf niemals auf *.vercel.app oder localhost fallen.
 */
export function kanonischeUrl(
  pfad: '/' | '/planen',
  _env?: OriginUmgebung,
): string {
  return pfad === '/' ? `${KANONISCHE_PUBLIC_ORIGIN}/` : `${KANONISCHE_PUBLIC_ORIGIN}${pfad}`
}

export function sitemapOeffentlicheUrls(env?: OriginUmgebung): string[] {
  const { origin, darfIndexieren } = oeffentlicherOrigin(env)
  if (!darfIndexieren) return []
  return SITEMAP_OEFFENTLICHE_PFADE.map((pfad) => (pfad === '/' ? `${origin}/` : `${origin}${pfad}`))
}
