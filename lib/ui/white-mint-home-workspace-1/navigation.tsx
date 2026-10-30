import { useSyncExternalStore } from 'react'

type Horer = () => void

const horer = new Set<Horer>()

function benachrichtigen() {
  horer.forEach((eintrag) => eintrag())
}

function historieVerfolgen() {
  if (typeof window === 'undefined') return
  const fenster = window as Window & { __whiteMintHistory?: boolean }
  if (fenster.__whiteMintHistory) return
  fenster.__whiteMintHistory = true
  const push = history.pushState.bind(history)
  const replace = history.replaceState.bind(history)
  history.pushState = (...args) => {
    push(...args)
    benachrichtigen()
  }
  history.replaceState = (...args) => {
    replace(...args)
    benachrichtigen()
  }
  window.addEventListener('popstate', benachrichtigen)
}

historieVerfolgen()

function abonnieren(callback: Horer) {
  horer.add(callback)
  return () => horer.delete(callback)
}

/** Browser stand-in for `next/navigation`. The path follows the real location and history. */
export function usePathname() {
  return useSyncExternalStore(abonnieren, () => window.location.pathname, () => '/')
}

export function useRouter() {
  return {
    push(ziel: string) {
      window.history.pushState(window.history.state, '', ziel)
    },
    replace(ziel: string) {
      window.history.replaceState(window.history.state, '', ziel)
    },
    back() {
      window.history.back()
    },
    prefetch() {},
    refresh() {},
  }
}

export function useSearchParams() {
  const suche = useSyncExternalStore(abonnieren, () => window.location.search, () => '')
  return new URLSearchParams(suche)
}

export function redirect(ziel: string): never {
  throw new Error(`redirect:${ziel}`)
}

export function notFound(): never {
  throw new Error('not-found')
}
