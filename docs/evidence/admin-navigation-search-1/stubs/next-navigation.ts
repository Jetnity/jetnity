import * as React from 'react'

type Listener = () => void

let pathname = '/admin'
const listeners = new Set<Listener>()

function lesenPushes(): string[] {
  const win = globalThis as { __routerPushes?: string[] }
  win.__routerPushes ??= []
  return win.__routerPushes
}

export function setHarnessPathname(next: string) {
  pathname = next
  for (const listener of listeners) listener()
}

export function usePathname() {
  const [aktuell, setAktuell] = React.useState(pathname)
  React.useEffect(() => {
    const listener = () => setAktuell(pathname)
    listeners.add(listener)
    listener()
    return () => {
      listeners.delete(listener)
    }
  }, [])
  return aktuell
}

export function useRouter() {
  return {
    push(href: string) {
      lesenPushes().push(href)
      setHarnessPathname(href)
    },
    replace(href: string) {
      setHarnessPathname(href)
    },
    prefetch() {},
    back() {},
  }
}

export function useSearchParams() {
  return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
}

;(globalThis as { __setHarnessPathname?: typeof setHarnessPathname }).__setHarnessPathname = setHarnessPathname
