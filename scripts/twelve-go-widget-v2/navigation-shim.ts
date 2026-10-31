export function usePathname(): string {
  return '/reisen/synthetic'
}

export function useRouter() {
  return {
    push() {},
    replace() {},
    refresh() {},
    back() {},
    prefetch() {},
  }
}

export function useSearchParams(): URLSearchParams {
  if (typeof location === 'undefined') return new URLSearchParams()
  return new URLSearchParams(location.search)
}

export function useParams(): Record<string, string> {
  return {}
}

export function redirect(): void {}

export function notFound(): void {}
