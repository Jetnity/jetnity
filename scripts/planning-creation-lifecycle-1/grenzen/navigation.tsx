export function useRouter() {
  return {
    push(url: string) {
      const ziel = window as unknown as { fixture?: { pushes: string[] } }
      ziel.fixture?.pushes.push(String(url))
    },
    replace() {},
    back() {},
    prefetch() {},
  }
}

export function usePathname() {
  return '/planen'
}

export function useSearchParams() {
  return new URLSearchParams()
}
