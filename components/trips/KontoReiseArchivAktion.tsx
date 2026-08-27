'use client'

// components/trips/KontoReiseArchivAktion.tsx
//
// AP-4-Aktionen ausserhalb der Reisekarte. Die Karte bleibt ein Link; hier
// liegen keine verschachtelten interaktiven Elemente.

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { previousStatusAusReise } from '@/lib/account/reise-archiv'
import { reiseArchivLebenszyklus } from '@/lib/trips/archiv-aktionen'
import type { TripSummary } from '@/types/trips'

export default function KontoReiseArchivAktion({ reise }: { reise: TripSummary }) {
  const router = useRouter()
  const [meldung, setMeldung] = useState('')
  const [laeuft, setLaeuft] = useState(false)

  const archiviert = reise.status === 'archived'
  const previous = previousStatusAusReise(reise)

  useEffect(() => {
    setLaeuft(false)
    setMeldung('')
  }, [reise.status, reise.archivePreviousStatus])

  const ausfuehren = async (aktion: 'archivieren' | 'wiederherstellen') => {
    if (laeuft) return
    setMeldung('')
    setLaeuft(true)
    const ergebnis = await reiseArchivLebenszyklus({ tripId: reise.id, aktion })
    if (!ergebnis.ok) {
      setLaeuft(false)
      setMeldung(ergebnis.meldung)
      return
    }
    setLaeuft(false)
    router.refresh()
  }

  if (archiviert && !previous) {
    return (
      <p className="px-1 text-sm leading-6 text-ink-700">
        Diese Reise lässt sich nicht automatisch wiederherstellen, weil der frühere Status nicht
        belegt ist.
      </p>
    )
  }

  return (
    <div className="px-1">
      <button
        type="button"
        disabled={laeuft}
        onClick={() => void ausfuehren(archiviert ? 'wiederherstellen' : 'archivieren')}
        className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:border-brand-600 hover:text-brand-900 disabled:cursor-wait disabled:opacity-60"
      >
        {archiviert ? 'Wiederherstellen' : 'Archivieren'}
      </button>
      {meldung ? (
        <p role="alert" className="mt-2 text-sm leading-6 text-red-700">
          {meldung}
        </p>
      ) : null}
    </div>
  )
}
