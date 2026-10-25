import { useEffect, useLayoutEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import AccountBuchungen from '@/components/account/AccountBuchungen'
import type { BuchungenAnsicht } from '@/lib/account/buchungen-abfrage'

type BuchungenZeuge = {
  folge: number
  wiederholenHref: string
  zustand: BuchungenAnsicht['zustand']
  ids: string[]
}

declare global {
  interface Window {
    __BUCHUNGEN_START__: BuchungenAnsicht
    __BUCHUNGEN_ZEUGE__: BuchungenZeuge
    buchungenSetzen: (ansicht: BuchungenAnsicht) => void
  }
}

function Flaeche() {
  const [ansicht, setzen] = useState(window.__BUCHUNGEN_START__)
  useLayoutEffect(() => {
    const folge = (window.__BUCHUNGEN_ZEUGE__?.folge ?? 0) + 1
    window.__BUCHUNGEN_ZEUGE__ = {
      folge,
      wiederholenHref: ansicht.wiederholenHref,
      zustand: ansicht.zustand,
      ids: ansicht.buchungen.map((buchung) => buchung.id),
    }
  }, [ansicht])
  useEffect(() => {
    window.buchungenSetzen = setzen
  }, [setzen])
  return <AccountBuchungen ansicht={ansicht} />
}

const wurzel = document.getElementById('root')
if (!wurzel) throw new Error('Montagepunkt fehlt')
createRoot(wurzel).render(<Flaeche />)
