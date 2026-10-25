// Anzeige der Admin-Benutzerliste. Keine Abfrage und keine Mutation.

import {
  USERS_DIRECTORY_MAX_PAGE,
  USERS_DIRECTORY_PAGE_SIZE,
  type UsersDirectoryInvalidReason,
} from '@/lib/admin/users-directory-query'

export const USERS_DIRECTORY_REFRESH_LEASE_MS = 8000

const UNAVAILABLE = 'Nicht verfügbar'

const formatter = new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' })

export function formatUsersDirectoryTimestamp(value: string | null | undefined): string {
  if (value == null || value === '') return UNAVAILABLE
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return UNAVAILABLE
  return formatter.format(parsed)
}

export function realDirectorySpan(count: number): number {
  if (count <= 0) return 0
  return Math.ceil(count / USERS_DIRECTORY_PAGE_SIZE)
}

export function lastDirectoryPage(count: number): number {
  const real = realDirectorySpan(count)
  if (real <= 0) return 1
  return Math.min(real, USERS_DIRECTORY_MAX_PAGE)
}

export function previousDirectoryPage(page: number): number | null {
  if (page <= 1) return null
  return page - 1
}

export function nextDirectoryPage(args: { page: number; count: number | null; rowCount: number }): number | null {
  if (args.page >= USERS_DIRECTORY_MAX_PAGE) return null
  if (args.count !== null) {
    const real = realDirectorySpan(args.count)
    if (args.page >= real) return null
  } else if (args.rowCount < USERS_DIRECTORY_PAGE_SIZE) {
    return null
  }
  return args.page + 1
}

export type DirectoryView =
  | { kind: 'unknown-count' }
  | { kind: 'out-of-range'; realLast: number; reachableLast: number }
  | { kind: 'empty-directory' }
  | { kind: 'no-match' }
  | { kind: 'page'; realLast: number }

export function directoryView(args: {
  count: number | null
  page: number
  filtered: boolean
}): DirectoryView {
  if (args.count === null) return { kind: 'unknown-count' }
  if (args.page > 1 && (args.page - 1) * USERS_DIRECTORY_PAGE_SIZE >= args.count) {
    const realLast = realDirectorySpan(args.count)
    return { kind: 'out-of-range', realLast, reachableLast: lastDirectoryPage(args.count) }
  }
  if (args.count === 0 && args.page === 1) {
    return args.filtered ? { kind: 'no-match' } : { kind: 'empty-directory' }
  }
  return { kind: 'page', realLast: realDirectorySpan(args.count) }
}

export function directoryCountLabel(count: number | null, filtered: boolean): string {
  if (count === null) return 'Anzahl nicht verfügbar'
  return filtered ? `${count} Treffer` : `${count} Nutzer`
}

export function directoryPageLabel(args: { page: number; count: number | null; view: DirectoryView }): string {
  if (args.view.kind === 'out-of-range') return `Seite ${args.page} ist in dieser Abfrage nicht vorhanden.`
  if (args.view.kind === 'unknown-count') return `Seite ${args.page}`
  if (args.view.kind === 'page' && args.view.realLast > USERS_DIRECTORY_MAX_PAGE) return `Seite ${args.page}`
  if (args.view.kind === 'page') return `Seite ${args.page} / ${Math.max(args.view.realLast, 1)}`
  return `Seite ${args.page}`
}

export function directoryCeilingCopy(count: number): string | null {
  const real = realDirectorySpan(count)
  if (real <= USERS_DIRECTORY_MAX_PAGE) return null
  return `Die vollständige Liste umfasst ${real} Seiten. Erreichbar sind die Seiten 1 bis ${USERS_DIRECTORY_MAX_PAGE}.`
}

export function directoryBodyCopy(view: DirectoryView): string | null {
  if (view.kind === 'empty-directory') return 'Keine Konten vorhanden.'
  if (view.kind === 'no-match') return 'Keine Treffer für diese Suche oder Filter.'
  if (view.kind === 'out-of-range') return `Seite ist in dieser Abfrage nicht vorhanden.`
  if (view.kind === 'unknown-count') return null
  return null
}

export function directoryInvalidReason(reason: UsersDirectoryInvalidReason): string {
  switch (reason) {
    case 'repeated':
      return 'Ein Parameter ist mehrfach angegeben.'
    case 'non-scalar':
      return 'Ein Parameter hat keine lesbare Form.'
    case 'oversized-q':
      return 'Der Suchbegriff ist zu lang.'
    case 'malformed-page':
      return 'Die Seite ist keine gültige Zahl.'
    case 'page-above-max':
      return 'Die Seite liegt außerhalb der erreichbaren Seiten 1 bis 5000.'
    case 'invalid-role':
      return 'Die Rolle ist kein bekannter Wert.'
    case 'invalid-status':
      return 'Der Status ist kein bekannter Wert.'
  }
}

export const DIRECTORY_CURRENT = 'Aktuelle Ergebnisse'
export const DIRECTORY_PREVIOUS = 'Die angezeigten Konten gehören noch zur vorherigen Abfrage.'
export const DIRECTORY_CHECKING = 'Die Abfrage wird erneut gelesen.'
export const DIRECTORY_CHECK_UNCONFIRMED = 'Die erneute Abfrage wurde nicht bestätigt.'
export const DIRECTORY_ADDRESS_UNREADABLE = 'Diese Adresse kann nicht gelesen werden.'
