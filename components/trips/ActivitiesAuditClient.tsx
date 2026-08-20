'use client'

// components/trips/ActivitiesAuditClient.tsx
//
// Dünne Hülle für den UI-Audit. Die Reise kommt aus sessionStorage, gesetzt
// vom Harness – nicht aus einem produktiven Fake-Katalog.

import * as React from 'react'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import TripWorkspace from '@/components/trips/TripWorkspace'
import type { Trip } from '@/types/trips'

const SPEICHER = 'jetnity:ui-audit:reise'

export default function ActivitiesAuditClient() {
  const [reise, setReise] = React.useState<Trip | null>(null)
  const [fehlend, setFehlend] = React.useState(false)

  React.useEffect(() => {
    try {
      const roh = sessionStorage.getItem(SPEICHER)
      if (!roh) {
        setFehlend(true)
        return
      }
      setReise(JSON.parse(roh) as Trip)
    } catch {
      setFehlend(true)
    }
  }, [])

  if (fehlend) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-semibold text-brand-800">Aktivitäten-Audit</h1>
        <p className="mt-3 text-sm text-ink-800">Audit-Reise fehlt.</p>
      </main>
    )
  }

  if (!reise) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16" aria-busy="true">
        <p className="text-sm text-ink-800">Aktivitäten-Audit wird vorbereitet.</p>
      </main>
    )
  }

  return (
    <main className="min-w-0">
      <p className="sr-only">Aktivitäten-Audit</p>
      <TripWorkspace
        reise={reise}
        quelle="guest"
        ohneTag={reise.ohneTag}
        onPunktAnlegen={async () => null}
        onPunktEntfernen={async () => null}
        aktivitaetensuche={<AktivitaetenBereich reise={reise} />}
      />
    </main>
  )
}
