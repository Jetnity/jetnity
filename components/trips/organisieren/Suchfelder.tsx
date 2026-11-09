'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Loader2, Search } from 'lucide-react'

export function Feld({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="org-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Personen({ wert, setzen }: { wert: number; setzen: (n: number) => void }) {
  return (
    <Feld label="Reisende">
      <select value={wert} onChange={(e) => setzen(Number(e.target.value))}>
        {Array.from({ length: 9 }, (_, i) => (
          <option key={i} value={i + 1}>
            {i + 1} {i === 0 ? 'Erwachsener' : 'Erwachsene'}
          </option>
        ))}
      </select>
    </Feld>
  )
}

export function SucheKnopf({ busy = false }: { busy?: boolean }) {
  return (
    <button className="org-go" type="submit" disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <Search />} {busy ? 'Sucht …' : 'Suchen'}
    </button>
  )
}

/** Cancels in-flight requests on input or trip changes, including late successful replies. */
export function useSuchanfrage<T>() {
  const ref = useRef<AbortController | null>(null)
  const [daten, setDaten] = useState<T | null>(null)
  const [busy, setBusy] = useState(false)
  const [fehler, setFehler] = useState('')
  useEffect(() => () => ref.current?.abort(), [])
  function reset() {
    ref.current?.abort()
    ref.current = null
    setDaten(null)
    setBusy(false)
    setFehler('')
  }
  async function suchen(laden: (signal: AbortSignal) => Promise<T>) {
    reset()
    const controller = new AbortController()
    ref.current = controller
    setBusy(true)
    try {
      const wert = await laden(controller.signal)
      if (!controller.signal.aborted) setDaten(wert)
    } catch (error) {
      if (!controller.signal.aborted)
        setFehler(error instanceof Error ? error.message : 'Die Suche ist gerade nicht erreichbar.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  return { daten, busy, fehler, setFehler, reset, suchen }
}
