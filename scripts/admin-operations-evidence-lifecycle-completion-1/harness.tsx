import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import ProviderOpsBoard from '@/components/admin/provider-ops/ProviderOpsBoard'
import SystemHealthBoard from '@/components/admin/system-health/SystemHealthBoard'

type Fall = {
  board: 'health' | 'ops'
  anfang: Record<string, unknown>
  endpunkt: string
  erlaubt: boolean
  sichtbar: boolean
}

declare global {
  interface Window {
    __FALL__: Fall
    __setze: (teil: Partial<Fall>) => void
    __nochmal: () => void
  }
}

function App() {
  const [fall, setFall] = useState<Fall>(window.__FALL__)
  useEffect(() => {
    window.__setze = (teil) => setFall((alt) => ({ ...alt, ...teil }))
    window.__nochmal = () => setFall((alt) => ({ ...alt }))
  }, [])
  if (!fall.sichtbar) return <main data-demontiert="true" />
  if (fall.board === 'health') {
    return (
      <main>
        <SystemHealthBoard anfang={fall.anfang as never} endpunkt={fall.endpunkt} aktualisierenErlaubt={fall.erlaubt} />
      </main>
    )
  }
  return (
    <main>
      <ProviderOpsBoard anfang={fall.anfang as never} endpunkt={fall.endpunkt} aktualisierenErlaubt={fall.erlaubt} />
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('root fehlt')
createRoot(root).render(<App />)
