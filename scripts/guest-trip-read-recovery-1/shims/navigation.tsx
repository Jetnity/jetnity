export function useRouter() {
  return {
    replace: (href: string) => {
      window.fixtureRouten.push(href)
    },
    push: (href: string) => {
      window.fixtureRouten.push(href)
    },
    refresh: () => undefined,
  }
}

export function usePathname() {
  return '/reisen'
}

export function useSearchParams() {
  return new URLSearchParams()
}

declare global {
  interface Window {
    fixtureRouten: string[]
  }
}

window.fixtureRouten = window.fixtureRouten ?? []
