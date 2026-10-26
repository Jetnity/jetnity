'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { ReiseFenster } from '@/lib/account/account-home-export-1/fenster'

export type ReiseFensterRahmenWert = {
  fenster: ReiseFenster
  neuLadenHref: '/account' | '/account/welt'
}

const ReiseFensterKontext = createContext<ReiseFensterRahmenWert | null>(null)

export function ReiseFensterRahmen({
  wert,
  children,
}: {
  wert: ReiseFensterRahmenWert
  children: ReactNode
}) {
  return <ReiseFensterKontext.Provider value={wert}>{children}</ReiseFensterKontext.Provider>
}

export function useReiseFenster(): ReiseFensterRahmenWert | null {
  return useContext(ReiseFensterKontext)
}
