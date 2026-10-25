type Warten = { resolve: (wert: unknown) => void; reject: (fehler: unknown) => void }

type VisitFenster = Window & {
  __visitRefreshes: number[]
  __visitRefreshSeq: number
  __visitRefreshWarten: Map<number, Warten>
  __visitRefreshMode: 'resolve' | 'reject' | 'defer'
}

function fenster(): VisitFenster {
  return window as VisitFenster
}

function basis(): VisitFenster {
  const ziel = fenster()
  ziel.__visitRefreshes = ziel.__visitRefreshes ?? []
  ziel.__visitRefreshSeq = ziel.__visitRefreshSeq ?? 0
  ziel.__visitRefreshWarten = ziel.__visitRefreshWarten ?? new Map()
  ziel.__visitRefreshMode = ziel.__visitRefreshMode ?? 'resolve'
  return ziel
}

export function useRouter() {
  return {
    push() {},
    replace() {},
    refresh() {
      const ziel = basis()
      const id = ++ziel.__visitRefreshSeq
      ziel.__visitRefreshes.push(id)
      if (ziel.__visitRefreshMode === 'reject') return Promise.reject(new Error('refresh'))
      if (ziel.__visitRefreshMode === 'defer') {
        return new Promise((resolve, reject) => {
          ziel.__visitRefreshWarten.set(id, { resolve, reject })
        })
      }
      return Promise.resolve()
    },
  }
}

export function usePathname() {
  return '/account/welt'
}

export function useSearchParams() {
  return new URLSearchParams()
}

basis()
