// lib/seo/oeffentlicher-origin.ts
//
// D0-2: eine technische URL-/Origin-Wahrheit für Metadata, Canonicals,
// Sitemap, robots Host/Sitemap und die bestehende Homepage-JSON-LD-URL.
//
// NEXT_PUBLIC_SITE_URL ist die bevorzugte kanonische Public-Site-Origin.
// NEXT_PUBLIC_APP_URL ist nur Legacy-Fallback, wenn kein eigener Site-Wert
// gesetzt ist. Public Indexing ist explizites Opt-in: nur der exakte Wert
// `true` darf den Allow-Check passieren. Unset, leer, false und jeder
// andere Wert bleiben deny. Zusätzlich fail-closed: localhost, *.vercel.app,
// ungültige/mehrdeutige Origins, Path-Drift und ein weiterhin ephemeral
// gesetzter App-Host.
//
// Kein Custom-Domain-Cutover, kein produktives Indexing, kein hreflang,
// kein JSON-LD-Ausbau über die vorhandene URL-Eigenschaft hinaus.

import { SITEMAP_OEFFENTLICHE_PFADE } from '@/lib/seo/index-grenze'

export const LOKALER_ORIGIN_FALLBACK = 'http://localhost:3000'

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

  const darfIndexieren =
    produktion &&
    freigabe &&
    !gewaehlt.ungueltig &&
    !gewaehlt.hatDrift &&
    !originIstEphemeral(gewaehlt.hostname) &&
    !siteMehrdeutig &&
    !appEphemeral

  return {
    origin: gewaehlt.origin,
    hostname: gewaehlt.hostname,
    quelle,
    darfIndexieren,
  }
}

export function kanonischeUrl(
  pfad: '/' | '/planen',
  env?: OriginUmgebung,
): string {
  const { origin } = oeffentlicherOrigin(env)
  return pfad === '/' ? `${origin}/` : `${origin}${pfad}`
}

export function sitemapOeffentlicheUrls(env?: OriginUmgebung): string[] {
  const { origin, darfIndexieren } = oeffentlicherOrigin(env)
  if (!darfIndexieren) return []
  return SITEMAP_OEFFENTLICHE_PFADE.map((pfad) => (pfad === '/' ? `${origin}/` : `${origin}${pfad}`))
}
