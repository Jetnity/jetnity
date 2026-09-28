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

/** Seite und bestätigter Filter, fremde Parameter bleiben, Sonderzeichen über URLSearchParams. */
export function buildUsersListHref(
  current: URLSearchParams | string | null | undefined,
  change: { q: string; page: number },
): string {
  const params = searchParamsFrom(current)
  const q = normalizeUserSearch(change.q)
  if (q) params.set('q', q)
  else params.delete('q')
  const page = Number.isFinite(change.page) ? Math.max(1, Math.trunc(change.page)) : 1
  params.set('page', String(page))
  const qs = params.toString()
  return qs.length > 0 ? `/admin/users?${qs}` : '/admin/users'
}

export function usersListHrefFromParams(current: URLSearchParams | string | null | undefined): string {
  const qs = typeof current === 'string' ? current.replace(/^\?/, '') : (current?.toString() ?? '')
  return qs.length > 0 ? `/admin/users?${qs}` : '/admin/users'
}
