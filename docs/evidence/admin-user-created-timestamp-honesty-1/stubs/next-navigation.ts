const replaces: string[] = []

export function createdHonestyReplaces() {
  return replaces.slice()
}

export function useSearchParams() {
  return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
}

export function useRouter() {
  return {
    replace(href: string) {
      replaces.push(href)
    },
    push(href: string) {
      replaces.push(href)
    },
  }
}

export function usePathname() {
  return '/admin/users'
}
