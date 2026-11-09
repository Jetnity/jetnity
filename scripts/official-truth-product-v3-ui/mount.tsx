// Isolated local test entry. This is never imported by the Next application.
import { StrictMode, useCallback, useId, useState } from 'react'
import { createRoot } from 'react-dom/client'
import OfficialTruthVisitorV3 from '@/components/readiness/OfficialTruthVisitorV3'
import type { Ladung } from '@/lib/admin/ladezustand'
import type { V3VisitorLoad } from '@/lib/readiness/official-truth-product-v3/visitor/controller'
import type { V3VisitorView } from '@/lib/readiness/official-truth-product-v3/visitor/presentation'

function Harness() {
  const scenarioId = useId()
  const [scenario, setScenario] = useState('mixed')
  const query: V3VisitorLoad = useCallback(async (input, signal) => {
    const response = await fetch('/query', { method: 'POST', signal,
      headers: { 'content-type': 'application/json', 'x-jetnity-synthetic-test': 'U1' },
      body: JSON.stringify({ scenario, input }) })
    if (!response.ok) return { daten: null, fehler: { meldung: 'Synthetic transport failure', wiederholbar: true } }
    // The isolated same-process harness returns only the real server presenter's
    // DTO. Future production transport still needs a reviewed decoding seam.
    return await response.json() as Ladung<V3VisitorView>
  }, [scenario])
  return <main className="min-h-screen bg-background px-[min(1rem,4vw)] py-4 text-foreground sm:p-8">
    <aside className="mx-auto mb-8 grid w-full min-w-0 max-w-4xl grid-cols-1 gap-3 rounded-2xl border border-border bg-citrus-300 px-[min(1rem,4vw)] py-4 [overflow-wrap:anywhere] sm:px-4" aria-label="Isolierte Testumgebung">
      <p className="font-semibold">Jetnity · Lokaler Entwicklungstest</p>
      <p className="text-sm leading-6">Ausschließlich synthetische Daten. Die fiktive Testbehörde und die Regeln sind erfunden. Keine echte Einreiseauskunft.</p>
      <div className="grid min-w-0 grid-cols-1 gap-2 text-sm font-medium">
        <label htmlFor={scenarioId}>Testfall</label>
        <select id={scenarioId} value={scenario} onChange={(event) => setScenario(event.target.value)}
          className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-border bg-card px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="mixed">Cachetreffer und Recherche</option>
          <option value="conflict">Widerspruch</option>
          <option value="unbound">Anschlüsse nicht verfügbar</option>
          <option value="read_error">Cache-Lesefehler</option>
          <option value="transport_error">Transportfehler</option>
          <option value="slow">Verzögerte Antwort</option>
          <option value="conditions">Mehrere vollständige Bedingungen</option>
          <option value="complete">Recherche wird fertig</option>
        </select>
      </div>
    </aside>
    <OfficialTruthVisitorV3 key={scenario} query={query} />
  </main>
}

const root = document.getElementById('root')
if (!root) throw new Error('Synthetic harness mount missing')
createRoot(root).render(<StrictMode><Harness /></StrictMode>)
