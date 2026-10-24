import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import AccountBuchungen from '@/components/account/AccountBuchungen'
import type { BuchungenAnsicht } from '@/lib/account/buchungen-abfrage'

declare global {
  interface Window {
    __BUCHUNGEN_START__: BuchungenAnsicht
    buchungenSetzen: (ansicht: BuchungenAnsicht) => void
  }
}

function Flaeche() {
  const [ansicht, setzen] = useState(window.__BUCHUNGEN_START__)
  useEffect(() => {
    window.buchungenSetzen = setzen
  }, [setzen])
  return <AccountBuchungen ansicht={ansicht} />
}

const wurzel = document.getElementById('root')
if (!wurzel) throw new Error('Montagepunkt fehlt')
createRoot(wurzel).render(<Flaeche />)
