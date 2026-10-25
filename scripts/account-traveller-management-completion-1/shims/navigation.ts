type Warten = { resolve: (wert: unknown) => void; reject: (fehler: unknown) => void }

type RegistryFenster = Window & {
  __registryRefreshes: number[]
  __registryRefreshSeq: number
  __registryRefreshWarten: Map<number, Warten>
  __registryRefreshMode: 'resolve' | 'reject' | 'defer'
  __registryRefreshErledigen: (id: number) => void
  __registryRefreshAblehnen: (id: number) => void
}

function fenster(): RegistryFenster {
  return window as RegistryFenster
}

function basis(): RegistryFenster {
  const ziel = fenster()
  ziel.__registryRefreshes = ziel.__registryRefreshes ?? []
  ziel.__registryRefreshSeq = ziel.__registryRefreshSeq ?? 0
  ziel.__registryRefreshWarten = ziel.__registryRefreshWarten ?? new Map()
  ziel.__registryRefreshMode = ziel.__registryRefreshMode ?? 'resolve'
  ziel.__registryRefreshErledigen =
    ziel.__registryRefreshErledigen ??
    ((id) => {
      const job = ziel.__registryRefreshWarten.get(id)
      if (!job) throw new Error(`kein Refresh ${id}`)
      job.resolve(undefined)
    })
  ziel.__registryRefreshAblehnen =
    ziel.__registryRefreshAblehnen ??
    ((id) => {
      const job = ziel.__registryRefreshWarten.get(id)
      if (!job) throw new Error(`kein Refresh ${id}`)
      job.reject(new Error('refresh'))
    })
  return ziel
}

export function useRouter() {
  return {
    push() {},
    replace() {},
    refresh() {
      const ziel = basis()
      const id = ++ziel.__registryRefreshSeq
      ziel.__registryRefreshes.push(id)
      if (ziel.__registryRefreshMode === 'reject') return Promise.reject(new Error('refresh'))
      if (ziel.__registryRefreshMode === 'defer') {
        return new Promise((resolve, reject) => {
          ziel.__registryRefreshWarten.set(id, { resolve, reject })
        })
      }
      return Promise.resolve()
    },
  }
}

export function usePathname() {
  return '/account/travellers'
}

export function useSearchParams() {
  return new URLSearchParams()
}

basis()
