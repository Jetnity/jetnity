import * as React from 'react'

type Listener = () => void

export type UsersNavReplace = {
  href: string
  at: number
}

type Store = {
  history: string[]
  index: number
  listeners: Set<Listener>
  replaces: UsersNavReplace[]
  actionCalls: string[]
  delayCommit: boolean
  pendingCommits: string[]
}

function store(): Store {
  const win = globalThis as { __usersNavStore?: Store }
  if (!win.__usersNavStore) {
    const initial = typeof window === 'undefined' ? '' : window.location.search.replace(/^\?/, '')
    win.__usersNavStore = {
      history: [initial],
      index: 0,
      listeners: new Set(),
      replaces: [],
      actionCalls: [],
      delayCommit: false,
      pendingCommits: [],
    }
  }
  return win.__usersNavStore
}

function notify() {
  for (const listener of store().listeners) listener()
}

export function currentUsersSearch(): string {
  const state = store()
  return state.history[state.index] ?? ''
}

export function usersNavReplaces(): UsersNavReplace[] {
  return store().replaces.map((entry) => ({ ...entry }))
}

export function clearUsersNavReplaces() {
  store().replaces.length = 0
}

export function usersNavActionCalls(): string[] {
  return [...store().actionCalls]
}

export function recordUsersNavAction(name: string) {
  store().actionCalls.push(name)
}

export function setUsersNavDelayCommit(delay: boolean) {
  store().delayCommit = delay
}

export function pendingUsersNavCommits(): string[] {
  return [...store().pendingCommits]
}

/** Applies the oldest held router.replace. Returns null when none is waiting. */
export function commitNextUsersNav(): string | null {
  const state = store()
  const href = state.pendingCommits.shift()
  if (!href) return null
  state.history[state.index] = searchFromHref(href)
  notify()
  return href
}

function dropPendingCommits() {
  store().pendingCommits.length = 0
}

/** Authoritative history change, as in Back/Forward or an external URL update. */
export function externalUsersSearch(search: string, mode: 'push' | 'replace' = 'push') {
  const state = store()
  dropPendingCommits()
  const next = search.replace(/^\?/, '')
  if (mode === 'replace') {
    state.history[state.index] = next
  } else {
    state.history = state.history.slice(0, state.index + 1)
    state.history.push(next)
    state.index = state.history.length - 1
  }
  notify()
}

export function backUsersSearch() {
  const state = store()
  dropPendingCommits()
  if (state.index > 0) state.index -= 1
  notify()
}

export function forwardUsersSearch() {
  const state = store()
  dropPendingCommits()
  if (state.index < state.history.length - 1) state.index += 1
  notify()
}

/**
 * Same-document history.pushState. Real browsers do not emit popstate for this.
 * The current store entry follows the new query so the mounted table sees it.
 * Held replaces stay held.
 */
export function pushUsersHistory(search: string) {
  const next = search.replace(/^\?/, '')
  const state = store()
  const target = next.length > 0 ? `?${next}` : window.location.pathname
  window.history.pushState({ usersNav: 'push' }, '', target)
  state.history[state.index] = next
  notify()
}

function installNativeTraversalSync() {
  if (typeof window === 'undefined') return
  const win = window as Window & { __usersNavPopstate?: boolean }
  if (win.__usersNavPopstate) return
  win.__usersNavPopstate = true
  window.addEventListener('popstate', () => {
    const state = store()
    state.history[state.index] = window.location.search.replace(/^\?/, '')
    notify()
  })
}

installNativeTraversalSync()

function searchFromHref(href: string): string {
  const query = href.split('?')[1] ?? ''
  return query.replace(/^\?/, '')
}

export function usePathname() {
  return '/admin/users'
}

export function useRouter() {
  return {
    push(href: string) {
      externalUsersSearch(searchFromHref(href), 'push')
    },
    replace(href: string) {
      const state = store()
      state.replaces.push({ href, at: Date.now() })
      if (state.delayCommit) {
        state.pendingCommits.push(href)
        return
      }
      state.history[state.index] = searchFromHref(href)
      notify()
    },
    back() {
      backUsersSearch()
    },
    forward() {
      forwardUsersSearch()
    },
    prefetch() {},
  }
}

export function useSearchParams() {
  const [rev, setRev] = React.useState(0)
  React.useEffect(() => {
    const listener = () => setRev((value) => value + 1)
    store().listeners.add(listener)
    return () => {
      store().listeners.delete(listener)
    }
  }, [])
  void rev
  return new URLSearchParams(currentUsersSearch())
}
