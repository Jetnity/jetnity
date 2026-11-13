'use client'

import { useEffect, useRef, useState } from 'react'
import {
  chDeOwnerImportMessage, createChDeOwnerImportStarter, type ChDeOwnerImportOutcome,
} from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-owner-import-contract'

export default function DevOwnerImportPanel() {
  const [starter] = useState(createChDeOwnerImportStarter)
  const [outcome, setOutcome] = useState<ChDeOwnerImportOutcome | null>(null)
  const [busy, setBusy] = useState(false), [attempted, setAttempted] = useState(false)
  const lock = useRef(false), mounted = useRef(false)
  const controller = useRef<AbortController | null>(null), status = useRef<HTMLDivElement>(null)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; controller.current?.abort() }
  }, [])

  async function start() {
    if (lock.current) return
    lock.current = true
    setAttempted(true); setBusy(true)
    const abort = new AbortController()
    controller.current = abort
    try {
      const result = await starter.start(abort.signal)
      if (mounted.current && result) setOutcome(result)
    } finally {
      controller.current = null
      if (mounted.current) { setBusy(false); status.current?.focus() }
    }
  }

  return (
    <section className="space-y-4 rounded-lg border p-4" aria-labelledby="dev-import-title" aria-busy={busy}>
      <h2 id="dev-import-title" className="text-lg font-semibold">Amtliche Quellen jetzt prüfen</h2>
      <p>Der Lauf liest die ausgewählten amtlichen Quellen und kann eine geprüfte Visumauskunft in Dev veröffentlichen. Die Methode muss weiterhin freigegeben sein; dein aktueller Owner-Zugang und die Zwei-Faktor-Prüfung werden erneut geprüft.</p>
      <button type="button" disabled={busy || attempted} onClick={() => void start()}
        className="min-h-11 rounded-md border px-4 py-2 text-left font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? 'Quellenimport läuft …' : 'Quellenimport für Dev starten'}
      </button>
      <div ref={status} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className="rounded-lg border p-4 focus:outline focus:outline-2">
        {busy ? 'Der Quellenlauf wird ausgeführt. Warte auf das Ergebnis.' : outcome ? chDeOwnerImportMessage(outcome)
          : 'Der Quellenimport beginnt erst mit deinem Klick. Es gibt keinen automatischen Start oder erneuten Versuch.'}
      </div>
      {attempted && !busy ? <p className="text-sm">Prüfe das Ergebnis vor einem weiteren Lauf. Eine fehlende Antwort bedeutet nicht, dass nichts gespeichert wurde.</p> : null}
    </section>
  )
}
