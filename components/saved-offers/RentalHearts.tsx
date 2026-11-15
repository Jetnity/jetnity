'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { savedRentalOfferStates } from '@/lib/saved-offers/actions'
import type { OfferInput } from '@/lib/saved-offers/contract'

type HeartState = { ids: Record<string, string>; loading: boolean; error: string; set: (offerId: string, savedId: string | null) => void }
const Hearts = createContext<HeartState | null>(null)

export function useRentalHearts() {
  const state = useContext(Hearts)
  if (!state) throw new Error('RentalHeart requires RentalHearts')
  return state
}

export default function RentalHearts({ offers, timing, children }: {
  offers: string[]; timing: Pick<OfferInput, 'starts_on' | 'ends_on' | 'starts_at' | 'ends_at'>; children: ReactNode
}) {
  const requestKey = JSON.stringify({ offers, timing })
  const [state, setState] = useState({ key: '', ids: {} as Record<string, string>, loading: true, error: '' })
  const generation = useRef(0)
  const cancelRead = useCallback(() => { ++generation.current }, [])
  const refresh = useCallback(() => {
    const ticket = ++generation.current
    return savedRentalOfferStates(JSON.parse(requestKey)).then(result => {
      if (ticket !== generation.current) return
      setState({ key: requestKey, ids: result.ok ? result.value : {}, loading: false, error: result.ok ? '' : result.message })
    }, () => {
      if (ticket === generation.current) setState({ key: requestKey, ids: {}, loading: false, error: 'Der Merkstatus konnte nicht geladen werden.' })
    })
  }, [requestKey])
  useEffect(() => {
    void refresh()
    const visible = () => { if (document.visibilityState === 'visible') { setState(s => ({ ...s, loading: true, error: '' })); void refresh() } }
    window.addEventListener('focus', visible)
    document.addEventListener('visibilitychange', visible)
    return () => { cancelRead(); window.removeEventListener('focus', visible); document.removeEventListener('visibilitychange', visible) }
  }, [refresh, cancelRead])
  const current = state.key === requestKey
  return <Hearts.Provider value={{ ids: current ? state.ids : {}, loading: state.loading || !current, error: current ? state.error : '', set: (offerId, savedId) => {
    ++generation.current
    setState(s => { const ids = { ...s.ids }; if (savedId) ids[offerId] = savedId; else delete ids[offerId]; return { key: requestKey, ids, loading: false, error: '' } })
  } }}>
    {current && state.error && <p role="status" className="text-sm leading-6 text-ink-700">{state.error} <Link href="/account/merkliste" className="underline">Meine Merkliste</Link> <button type="button" className="min-h-11 px-3 underline" onClick={() => { setState(s => ({ ...s, loading: true, error: '' })); void refresh() }}>Erneut prüfen</button></p>}
    {children}
  </Hearts.Provider>
}
