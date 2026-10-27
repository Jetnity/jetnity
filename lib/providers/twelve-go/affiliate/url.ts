// lib/providers/twelve-go/affiliate/url.ts
//
// Baut nur HTTPS-Links auf 12go.asia. Host, Pfad und Abfrage kommen nicht
// aus Nutzereingaben. Kein Datum, keine Währung, keine Personenzahl.

import { TWELVE_GO_HOST, TWELVE_GO_PARTNER_ID, TWELVE_GO_SUB_ID } from '@/lib/providers/twelve-go/affiliate/konstanten'

const SLUG = '[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*'
const ROUTEN_PFAD = new RegExp(`^/de/travel/${SLUG}/${SLUG}/$`)

function mitPartner(pathname: '/' | string): string {
  return `https://${TWELVE_GO_HOST}${pathname}?z=${TWELVE_GO_PARTNER_ID}&sub_id=${TWELVE_GO_SUB_ID}`
}

/** Allgemeine tracked Suche. Immer derselbe öffentliche Link. */
export function twelveGoGenerischeSuche(): string {
  return mitPartner('/')
}

/**
 * Nimmt nur `/` oder einen bereits geprüften `/de/travel/Slug/Slug/`-Pfad.
 * Alles andere, einschliesslich absoluter URLs und `javascript:`, fällt aus.
 */
export function twelveGoAffiliateUrl(pfad: string): string | null {
  if (pfad.includes('\\') || pfad.includes('?') || pfad.includes('#') || pfad.includes('%') || pfad.includes('..')) {
    return null
  }
  if (pfad !== '/' && !ROUTEN_PFAD.test(pfad)) return null

  let url: URL
  try {
    url = new URL(pfad === '/' ? `https://${TWELVE_GO_HOST}/` : `https://${TWELVE_GO_HOST}${pfad}`)
  } catch {
    return null
  }

  if (url.protocol !== 'https:') return null
  if (url.hostname !== TWELVE_GO_HOST) return null
  if (url.port || url.username || url.password || url.hash || url.search) return null
  if (pfad === '/' && url.pathname !== '/') return null
  if (pfad !== '/' && url.pathname !== pfad) return null
  return mitPartner(url.pathname)
}
