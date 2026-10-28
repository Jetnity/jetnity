'use client'

import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import AktivitaetKarte from '@/components/trips/AktivitaetKarte'
import ViatorPruefung from '@/components/trips/ViatorPruefung'
import type { ActivityOptionSichtbar, ActivitySucheAntwort } from '@/lib/activities/client-sicht'

function Ablauf() {
  const [option, setOption] = useState<ActivityOptionSichtbar | null>(null)
  const [offen, setOffen] = useState(false)
  const [meldung, setMeldung] = useState('Für diese Angaben liegt noch keine Suche vor.')

  const suchen = () => {
    setOffen(false)
    setOption(null)
    void fetch('/api/activities/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ stage: { name: 'Bangkok' } }),
    })
      .then((response) => response.json() as Promise<ActivitySucheAntwort>)
      .then((json) => {
        setMeldung(json.message)
        setOption(json.options[0] ?? null)
      })
      .catch(() => setMeldung('Die Suche ist fehlgeschlagen.'))
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <button type="button" onClick={suchen} className="min-h-11 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white">
        Für diesen Tag suchen
      </button>
      <p className="mt-3 text-sm">{meldung}</p>
      {option ? (
        <AktivitaetKarte option={option} laeuft={false} onPruefen={() => setOffen(true)} />
      ) : null}
      {offen && option ? (
        <ViatorPruefung productCode={option.externalRef} dayDate="2026-11-02" gewuenschteWaehrung="CHF" />
      ) : null}
    </main>
  )
}

export function mountViatorHarness() {
  const root = document.getElementById('root')
  if (!root) return
  createRoot(root).render(<Ablauf />)
}

if (typeof document !== 'undefined') mountViatorHarness()
