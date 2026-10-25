import { useEffect, useState } from 'react'

type Aufrufe = {
  push: string[]
  refresh: number
  prefetch: number
  back: number
  forward: number
  replace: number
}

const hoerer = new Set<() => void>()
let parameter = new URLSearchParams()
let werfen = false
let verschachteln = false

export const aufrufe: Aufrufe = { push: [], refresh: 0, prefetch: 0, back: 0, forward: 0, replace: 0 }

export const flags = {
  get werfen() {
    return werfen
  },
  set werfen(wert: boolean) {
    werfen = wert
  },
  get verschachteln() {
    return verschachteln
  },
  set verschachteln(wert: boolean) {
    verschachteln = wert
  },
}

export function setzeAdresse(text: string) {
  parameter = new URLSearchParams(text)
  hoerer.forEach((fn) => fn())
}

export function useSearchParams() {
  const [, setze] = useState(0)
  useEffect(() => {
    const fn = () => setze((stand) => stand + 1)
    hoerer.add(fn)
    return () => {
      hoerer.delete(fn)
    }
  }, [])
  return parameter
}

export function usePathname() {
  return '/reisen'
}

export function useRouter() {
  return {
    push(href: string) {
      aufrufe.push.push(href)
      if (verschachteln) {
        verschachteln = false
        const sollWerfen = werfen
        werfen = false
        document.querySelector<HTMLButtonElement>('[data-sammlung-leeren]')?.click()
        if (sollWerfen) throw new Error('push')
        return
      }
      if (werfen) {
        werfen = false
        throw new Error('push')
      }
    },
    replace() {
      aufrufe.replace += 1
    },
    refresh() {
      aufrufe.refresh += 1
    },
    back() {
      aufrufe.back += 1
    },
    forward() {
      aufrufe.forward += 1
    },
    prefetch() {
      aufrufe.prefetch += 1
    },
  }
}
