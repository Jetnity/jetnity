// Reine URL-Hilfe für die Admin-Benutzerliste.
// Die Tabelle entscheidet, wann ein Entwurf bestätigt wird. Diese Funktionen
// bauen nur die Adresse und vergleichen sie mit der aktuellen Abfrage.

export const USERS_SEARCH_DEBOUNCE_MS = 400

export function normalizeUserSearch(value: string): string {
  return value.trim()
}

export function userSearchEditChangesFilter(committed: string, draft: string): boolean {
  return normalizeUserSearch(draft) !== normalizeUserSearch(committed)
}

function searchParamsFrom(current: URLSearchParams | string | null | undefined): URLSearchParams {
  if (typeof current === 'string') return new URLSearchParams(current)
  return new URLSearchParams(current?.toString() ?? '')
}

/**
 * Dieselbe Obergrenze wie `USERS_DIRECTORY_MAX_PAGE`.
 * Die Navigation darf das Abfragemodul nicht importieren, sonst entsteht ein Zyklus.
 */
const USERS_LIST_MAX_PAGE = 5000

function clampUsersListPage(page: number): number {
  if (!Number.isFinite(page)) return 1
  const truncated = Math.trunc(page)
  if (truncated < 1) return 1
  if (truncated > USERS_LIST_MAX_PAGE) return USERS_LIST_MAX_PAGE
  return truncated
}

/** Seite und bestätigter Filter, fremde Parameter bleiben, Sonderzeichen über URLSearchParams. */
export function buildUsersListHref(
  current: URLSearchParams | string | null | undefined,
  change: { q: string; page: number; role?: string | null; status?: string | null },
): string {
  const params = searchParamsFrom(current)
  const q = normalizeUserSearch(change.q)
  if (q) params.set('q', q)
  else params.delete('q')
  params.set('page', String(clampUsersListPage(change.page)))
  if (change.role !== undefined) {
    if (change.role) params.set('role', change.role)
    else params.delete('role')
  }
  if (change.status !== undefined) {
    if (change.status) params.set('status', change.status)
    else params.delete('status')
  }
  const qs = params.toString()
  return qs.length > 0 ? `/admin/users?${qs}` : '/admin/users'
}

export function usersListHrefFromParams(current: URLSearchParams | string | null | undefined): string {
  const qs = typeof current === 'string' ? current.replace(/^\?/, '') : (current?.toString() ?? '')
  return qs.length > 0 ? `/admin/users?${qs}` : '/admin/users'
}

function searchParamsOfHref(href: string): URLSearchParams {
  const query = href.includes('?') ? href.slice(href.indexOf('?') + 1) : ''
  return new URLSearchParams(query)
}

/** Vergleicht zwei Benutzerlisten-Adressen unabhängig von der Parameterreihenfolge. */
export function usersListHrefMatches(left: string, right: string): boolean {
  const a = searchParamsOfHref(left)
  const b = searchParamsOfHref(right)
  const keys = new Set([...a.keys(), ...b.keys()])
  for (const key of keys) {
    if (a.get(key) !== b.get(key)) return false
  }
  return true
}

/** True, wenn diese Adresse genau den normalisierten Entwurf als bestätigte Suche trägt. */
export function userSearchHrefCarriesDraft(href: string, draft: string): boolean {
  return normalizeUserSearch(searchParamsOfHref(href).get('q') ?? '') === normalizeUserSearch(draft)
}
