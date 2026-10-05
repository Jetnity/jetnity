import { filterAdminNav, type AdminNavFilterInput, type AdminNavItem } from '@/lib/admin/navigation'

/**
 * Lokale Bereichssuche. Nur statische Aliase auf vorhandene Nav-Ziele.
 * Kein Remote-Index, kein Verlauf, kein aus der Query gebautes Ziel.
 */
export const ADMIN_NAV_SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  '/admin': ['home', 'dashboard', 'zentrale', 'steuerzentrale'],
  '/admin/users': ['nutzer', 'user', 'users', 'konten', 'accounts'],
  '/admin/payments': ['zahlung', 'zahlungen', 'payment', 'refund', 'erstattung'],
  '/admin/security': ['security', 'sicherheit'],
  '/admin/system-health': ['health', 'system', 'lage', 'gesundheit'],
  '/admin/provider-ops': ['kosten', 'provider', 'ops', 'modellnutzung'],
}

export const ADMIN_NAV_SEARCH_QUERY_MAX = 200

export function normalizeAdminNavSearchQuery(query: string): string {
  return query.replace(/\s+/g, ' ').trim().toLocaleLowerCase('de-DE')
}

export function readyAdminNavItems(
  items: readonly AdminNavItem[],
  session: AdminNavFilterInput,
): AdminNavItem[] {
  return filterAdminNav(items, session).filter((item) => item.kind === 'ready')
}

export function adminNavSearchHaystack(item: AdminNavItem): string {
  const aliases = ADMIN_NAV_SEARCH_ALIASES[item.href] ?? []
  const pfad = item.href.split('/').filter(Boolean).join(' ')
  return [item.label, pfad, item.href, ...aliases].join('\n').toLocaleLowerCase('de-DE')
}

export function matchAdminNavSearch(item: AdminNavItem, normalizedQuery: string): boolean {
  if (item.kind !== 'ready') return false
  if (!normalizedQuery) return true
  return adminNavSearchHaystack(item).includes(normalizedQuery)
}

export function filterAdminNavSearch(
  items: readonly AdminNavItem[],
  session: AdminNavFilterInput,
  query: string,
): AdminNavItem[] {
  const bereit = readyAdminNavItems(items, session)
  const normalisiert = normalizeAdminNavSearchQuery(query).slice(0, ADMIN_NAV_SEARCH_QUERY_MAX)
  return bereit.filter((item) => matchAdminNavSearch(item, normalisiert))
}

/** Nur ein bereits erlaubtes ready-Ziel. Niemals Query, Befehl oder Fremd-URL. */
export function resolveAdminNavSearchHref(
  href: string,
  allowlist: readonly AdminNavItem[],
): string | null {
  if (typeof href !== 'string' || href.length === 0) return null
  if (!href.startsWith('/admin')) return null
  if (href.includes('://') || href.includes('\\') || href.includes('?') || href.includes('#')) {
    return null
  }
  const treffer = allowlist.find((item) => item.href === href && item.kind === 'ready')
  return treffer ? treffer.href : null
}

export function isAdminNavSearchShortcut(event: {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  isComposing?: boolean
}): boolean {
  if (event.isComposing) return false
  if (event.altKey || event.shiftKey) return false
  if (!(event.metaKey || event.ctrlKey)) return false
  return event.key === 'k' || event.key === 'K'
}

export function clampAdminNavSearchIndex(index: number, length: number): number {
  if (length <= 0) return -1
  if (index < 0) return 0
  if (index >= length) return length - 1
  return index
}

export function retainAdminNavSearchHref(
  currentHref: string | null,
  results: readonly AdminNavItem[],
): string | null {
  if (results.length === 0) return null
  if (currentHref && results.some((item) => item.href === currentHref)) return currentHref
  return results[0]?.href ?? null
}

export function stepAdminNavSearchHref(
  currentHref: string | null,
  results: readonly AdminNavItem[],
  direction: 1 | -1,
): string | null {
  if (results.length === 0) return null
  const idx = results.findIndex((item) => item.href === currentHref)
  const start = idx < 0 ? (direction === 1 ? -1 : 0) : idx
  const next = clampAdminNavSearchIndex(start + direction, results.length)
  return results[next]?.href ?? null
}

export function adminNavSearchOptionId(href: string): string {
  return `admin-nav-search-option-${href.replace(/[^a-z0-9-]/gi, '-')}`
}

/** Pixel delta to keep an item fully inside a scroll container. Positive = scroll down. */
export function scrollDeltaToReveal(
  listTop: number,
  listBottom: number,
  itemTop: number,
  itemBottom: number,
): number {
  if (itemBottom > listBottom) return itemBottom - listBottom
  if (itemTop < listTop) return itemTop - listTop
  return 0
}

export function optionIstImListenfenster(
  listTop: number,
  listBottom: number,
  itemTop: number,
  itemBottom: number,
): boolean {
  return itemTop >= listTop && itemBottom <= listBottom
}

export type VerfuegbaresSichtfeld = {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

/** Layout-viewport plus visualViewport, the actually visible window while overflow is locked. */
export function leseVerfuegbaresSichtfeld(win: {
  innerWidth: number
  innerHeight: number
  visualViewport?: {
    width: number
    height: number
    offsetTop: number
    offsetLeft: number
  } | null
}): VerfuegbaresSichtfeld {
  const vv = win.visualViewport
  const width = vv?.width ?? win.innerWidth
  const height = vv?.height ?? win.innerHeight
  const top = vv?.offsetTop ?? 0
  const left = vv?.offsetLeft ?? 0
  return {
    top,
    left,
    right: left + width,
    bottom: top + height,
    width,
    height,
  }
}

export function optionIstImSichtfeld(
  viewTop: number,
  viewBottom: number,
  itemTop: number,
  itemBottom: number,
): boolean {
  return itemTop >= viewTop && itemBottom <= viewBottom
}

/** Selected row must sit fully in the list window and in the available viewport. */
export function optionIstErreichbar(
  listTop: number,
  listBottom: number,
  viewTop: number,
  viewBottom: number,
  itemTop: number,
  itemBottom: number,
): boolean {
  return (
    optionIstImListenfenster(listTop, listBottom, itemTop, itemBottom) &&
    optionIstImSichtfeld(viewTop, viewBottom, itemTop, itemBottom)
  )
}
