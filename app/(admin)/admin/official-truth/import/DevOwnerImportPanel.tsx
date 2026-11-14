'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  chDeOwnerImportMessage, createChDeOwnerImportContinuation, type ChDeOwnerImportOutcome,
} from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-owner-import-contract'

export default function DevOwnerImportPanel() {
  const [starter] = useState(createChDeOwnerImportContinuation)
  const [outcome, setOutcome] = useState<ChDeOwnerImportOutcome | null>(null)
  const [busy, setBusy] = useState(false)
  const attempted = useSyncExternalStore(starter.subscribe, starter.restore, () => false)
  const lock = useRef(false), mounted = useRef(false)
  const controller = useRef<AbortController | null>(null), status = useRef<HTMLDivElement>(null)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; controller.current?.abort() }
  }, [starter])

  async function start() {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    const abort = new AbortController()
    controller.current = abort
    try {
      const result = await starter.start(abort.signal)
      if (mounted.current && result) setOutcome(result)
    } finally {
      lock.current = false
      controller.current = null
      if (mounted.current) { setBusy(false); status.current?.focus() }
    }
  }

  return (
    <section className="space-y-4 rounded-lg border p-4" aria-labelledby="dev-import-title" aria-busy={busy}>
      <h2 id="dev-import-title" className="text-lg font-semibold">Amtliche Quellen jetzt prüfen</h2>
      <p>Der Lauf speichert zuerst eine neue Quellenanforderung und liest danach die ausgewählten amtlichen Quellen. Er kann eine geprüfte Visumauskunft in Dev veröffentlichen. Die Methode muss weiterhin freigegeben sein; dein aktueller Owner-Zugang und die Zwei-Faktor-Prüfung werden erneut geprüft.</p>
      <button type="button" disabled={busy || outcome?.status === 'published'} onClick={() => void start()}
        className="min-h-11 rounded-md border px-4 py-2 text-left font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? 'Quellenimport läuft …' : attempted ? 'Gespeicherten Vorgang prüfen und fortsetzen' : 'Quellenimport für Dev starten'}
      </button>
      <div ref={status} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className="rounded-lg border p-4 focus:outline focus:outline-2">
        {busy ? 'Der Quellenlauf wird ausgeführt. Warte auf das Ergebnis.' : outcome ? chDeOwnerImportMessage(outcome)
          : attempted ? 'Eine ursprüngliche Anfrage ist gespeichert. Mit deinem Klick wird genau dieser Vorgang geprüft und, soweit bereits sicher gespeichert, fortgesetzt.'
          : 'Der Quellenimport beginnt erst mit deinem Klick. Es gibt keinen automatischen Start oder erneuten Versuch.'}
      </div>
      {attempted && !busy && outcome?.status !== 'published' ? <p className="text-sm">Eine fehlende Antwort bedeutet nicht, dass nichts gespeichert wurde. Die Fortsetzung behält die ursprüngliche Anfrage; sie erzeugt keinen Ersatzversuch.</p> : null}
    </section>
  )
}
