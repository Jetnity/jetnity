'use client'
import { useEffect, useState } from 'react'
import type { Abschnitt, Wahl } from '@/lib/providers/omio/katalog'
type Werte = { date: string; options: Wahl[] }
type Antwort = { key: string; data: Werte | null; fehler: boolean }
export function useStreckenwerte(wahl: Abschnitt | null, stand: string) {
  const von = wahl?.von.id ?? '',
    nach = wahl?.nach.id ?? '',
    lokal = !/^\d+$/.test(von) || !/^\d+$/.test(nach) || von === nach
  const key = von + '/' + nach
  const [antwort, setAntwort] = useState<Antwort | null>(null),
    [versuch, wiederholen] = useState(0)
  useEffect(() => {
    if (lokal) return
    const request = new AbortController()
    fetch('/api/mobility/omio?' + new URLSearchParams({ von, nach }), { signal: request.signal })
      .then(async (res) => {
        if (!res.ok) throw Error()
        const data: Werte = await res.json()
        if (!request.signal.aborted) setAntwort({ key, data, fehler: false })
      })
      .catch(() => {
        if (!request.signal.aborted) setAntwort({ key, data: null, fehler: true })
      })
    return () => request.abort()
  }, [von, nach, key, lokal, versuch])
  const aktuell = !lokal && antwort?.key === key ? antwort : null
  return {
    options: aktuell?.data?.options ?? [],
    stand: aktuell?.data?.date ?? stand,
    laedt: !lokal && !aktuell,
    fehler: !!aktuell?.fehler,
    wiederholen: () => {
      setAntwort(null)
      wiederholen((v) => v + 1)
    },
  }
}
