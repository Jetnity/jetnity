export function useRouter() {
  return {
    replace: () => undefined,
    push: () => undefined,
    refresh: () => {
      const fenster = globalThis as { __ROUTER_REFRESH__?: number }
      fenster.__ROUTER_REFRESH__ = (fenster.__ROUTER_REFRESH__ ?? 0) + 1
    },
    back: () => undefined,
  }
}

export function usePathname() {
  return '/'
}

export function useSearchParams() {
  return new URLSearchParams(window.location.search)
}
