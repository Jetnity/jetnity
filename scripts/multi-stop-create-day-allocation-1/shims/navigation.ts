type PlanenFenster = Window & { __planenPfade: string[] }

function fenster(): PlanenFenster {
  const ziel = window as PlanenFenster
  ziel.__planenPfade = ziel.__planenPfade ?? []
  return ziel
}

export function useRouter() {
  return {
    push(pfad: string) {
      fenster().__planenPfade.push(String(pfad))
    },
    replace(pfad: string) {
      fenster().__planenPfade.push(String(pfad))
    },
    refresh() {
      return Promise.resolve()
    },
  }
}

export function usePathname() {
  return '/planen'
}

export function useSearchParams() {
  return new URLSearchParams()
}

fenster()
