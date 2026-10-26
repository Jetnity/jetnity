import * as React from 'react'

type Listener = () => void

type Store = {
  history: string[]
  index: number
  listeners: Set<Listener>
  replaces: string[]
  refreshCalls: number
}

function store(): Store {
  const win = globalThis as { __mutationNavStore?: Store }
  if (!win.__mutationNavStore) {
    const initial = typeof window === 'undefined' ? '' : window.location.search.replace(/^\?/, '')
    win.__mutationNavStore = {
      history: [initial],
      index: 0,
      listeners: new Set(),
      replaces: [],
      refreshCalls: 0,
    }
  }
  return win.__mutationNavStore
}

function notify() {
  for (const listener of store().listeners) listener()
}

export function currentMutationSearch(): string {
  return store().history[store().index] ?? ''
}

export function mutationReplaces(): string[] {
  return [...store().replaces]
}

export function mutationRefreshCount(): number {
  return store().refreshCalls
}

function searchFromHref(href: string): string {
  return (href.split('?')[1] ?? '').replace(/^\?/, '')
}

export function usePathname() {
  return '/admin/users'
}

export function useRouter() {
  return {
    push(href: string) {
      const state = store()
      state.history = state.history.slice(0, state.index + 1)
      state.history.push(searchFromHref(href))
      state.index = state.history.length - 1
      notify()
    },
    replace(href: string) {
      const state = store()
      state.replaces.push(href)
      state.history[state.index] = searchFromHref(href)
      notify()
    },
    refresh() {
      store().refreshCalls += 1
    },
    back() {},
    forward() {},
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
  return new URLSearchParams(currentMutationSearch())
}
