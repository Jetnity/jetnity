export function useRouter() {
  return {
    replace: () => undefined,
    push: () => undefined,
    refresh: () => undefined,
    back: () => undefined,
  }
}

export function usePathname() {
  return '/'
}

export function useSearchParams() {
  return new URLSearchParams(window.location.search)
}
