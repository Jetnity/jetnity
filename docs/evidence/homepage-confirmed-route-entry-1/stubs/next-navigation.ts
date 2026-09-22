export function useRouter() {
  return {
    push(href: string) {
      const liste = ((globalThis as { __routerPushes?: string[] }).__routerPushes ??= [])
      liste.push(href)
    },
    replace() {},
    prefetch() {},
    back() {},
  }
}

export function usePathname() {
  return '/'
}

export function useSearchParams() {
  return new URLSearchParams()
}
