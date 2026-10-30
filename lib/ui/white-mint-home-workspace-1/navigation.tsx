import { useSyncExternalStore } from 'react'

declare global {
  interface Window {
    __jetnityWhiteMintPath?: string
  }
}

function pfadLesen() {
  if (typeof window === 'undefined') return '/'
  return window.__jetnityWhiteMintPath || '/'
}

/** Browser stand-in for `next/navigation`. The path is fixed before the page script runs. */
export function usePathname() {
  return useSyncExternalStore(
    () => () => {},
    pfadLesen,
    () => '/',
  )
}

export function useRouter() {
  return {
    push() {},
    replace() {},
    back() {},
    prefetch() {},
    refresh() {},
  }
}

export function useSearchParams() {
  return new URLSearchParams()
}

export function redirect(ziel: string): never {
  throw new Error(`redirect:${ziel}`)
}

export function notFound(): never {
  throw new Error('not-found')
}
