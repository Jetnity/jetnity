'use client'

import { useEffect, useRef, useState } from 'react'
import { lade } from '@/lib/admin/ladezustand'
import { DEV_GUARD_PATH, DEV_GUARD_RESPONSE_BYTES, readDevGuardRequest, readDevGuardResult,
  readDevGuardText, type DevGuardOperation, type DevGuardRequest,
  type DevGuardReview } from '@/lib/readiness/official-truth-product-v3/runtime/guard-contract'

const STORAGE = 'jetnity.production.guard.operation.v1'
const button = 'min-h-11 rounded-md border px-4 py-2 text-left font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const time = (value: string | null) => value === null ? 'Noch kein vollständiger Erfolg' : new Date(value).toLocaleString('de-CH')

// The existing operation/selection/independent-confirmation protocol is kept.
// This Production page exposes only incident recovery, never source retirement.
export default function ProductionGuardRecoveryPanel() {
  const [review, setReview] = useState<DevGuardReview | null>(null)
  const [operation, setOperation] = useState<DevGuardOperation | null>(null)
  const [busy, setBusy] = useState(false), [consent, setConsent] = useState(false), [storageReady, setStorageReady] = useState(false)
  const [message, setMessage] = useState('Lies zuerst den aktuellen gespeicherten Stand. Eine Wiederaufnahme erfolgt nur durch deinen Klick.')
  const locked = useRef(false), mounted = useRef(false), pending = useRef<DevGuardOperation | null>(null)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => {
    mounted.current = true
    try {
      const stored = sessionStorage.getItem(STORAGE)
      if (stored !== null) {
        const value = readDevGuardRequest(JSON.parse(stored))
        if (!value || value.intent !== 'mutate' || value.action !== 'resume' || JSON.stringify(value) !== stored) throw Error('invalid journal')
        pending.current = value; setOperation(value)
        setMessage('Eine Wiederaufnahme ist vorgemerkt. Bestätige denselben Vorgang mit seiner ursprünglichen Auswahl.')
      }
      setStorageReady(true)
    } catch { setMessage('Der lokale Vorgangsbeleg ist nicht verfügbar. Bitte mit der technischen Leitung prüfen; eine neue Wiederaufnahme bleibt gesperrt.') }
    return () => { mounted.current = false; controller.current?.abort() }
  }, [])

  async function dispatch(request: DevGuardRequest) {
    if (locked.current || (request.intent !== 'review' && request.action !== 'resume')) return
    locked.current = true; setBusy(true)
    const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 15000)
    controller.current = abort
    try {
      const result = await lade(async () => {
        const response = await fetch(DEV_GUARD_PATH, { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
          signal: abort.signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(request) })
        return { ok: response.ok, status: response.status, async json(): Promise<unknown> {
          const length = response.headers.get('content-length')
          if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(response.headers.get('content-type') ?? '')
            || (length !== null && (!/^\d{1,5}$/.test(length) || Number(length) > DEV_GUARD_RESPONSE_BYTES))) {
            await response.body?.cancel().catch(() => undefined); throw Error('bounded response')
          }
          const body = await readDevGuardText(response.body, abort.signal, DEV_GUARD_RESPONSE_BYTES)
          if (body === null) throw Error('unreadable response')
          return JSON.parse(body)
        } }
      }, raw => { const value = readDevGuardResult(raw, request); if (!value) throw Error('invalid reply'); return value })
      if (!mounted.current) return
      if (abort.signal.aborted || result.fehler) {
        setMessage(request.intent === 'review' ? 'Der aktuelle Stand konnte nicht gelesen werden. Daraus folgt keine Entwarnung.'
          : 'Der Ausgang ist offen. Ein Abbruch beweist keine Rücknahme. Bestätige denselben vorgemerkten Vorgang; starte keinen neuen.')
        return
      }
      const value = result.daten
      if (value.status === 'reviewed') {
        setReview(value); setConsent(false); setMessage('Gespeicherten Stand gelesen. Prüfe die Sperre und die letzte vollständige Hintergrundprüfung.')
      } else if (value.status === 'confirmed') {
        const saved = pending.current
        if (!saved || saved.operationId !== value.operationId || sessionStorage.getItem(STORAGE) !== JSON.stringify(saved)) throw Error('changed journal')
        sessionStorage.removeItem(STORAGE); pending.current = null; setOperation(null); setReview(null); setConsent(false)
        setMessage('Die Wiederaufnahme wurde unabhängig bestätigt. Lies den aktuellen Stand erneut, bevor du einen Quellenlauf startest.')
      } else if (value.status === 'absent') {
        setMessage('Für diesen Vorgang wurde noch keine gespeicherte Quittung gefunden. Das beweist keine Rücknahme eines offenen Vorgangs. Bitte mit der technischen Leitung prüfen.')
      } else setMessage('Die Datenbank hat die Wiederaufnahme als gespeichert gemeldet. Bestätige jetzt denselben Vorgang durch einen getrennten Lesezugriff.')
    } catch {
      if (mounted.current) setMessage('Der Ausgang ist nicht bestätigt. Der vorgemerkte Vorgang bleibt erhalten; bitte denselben Vorgang bestätigen.')
    } finally {
      clearTimeout(timer); abort.abort(); controller.current = null; locked.current = false
      if (mounted.current) setBusy(false)
    }
  }

  function resume() {
    if (locked.current || pending.current || !review?.incident.canResume || !consent || !storageReady) return
    try {
      if (sessionStorage.getItem(STORAGE) !== null) throw Error('existing operation')
      const value: DevGuardOperation = { schema: 1, intent: 'mutate', action: 'resume',
        operationId: 'op3_' + crypto.randomUUID().replaceAll('-', ''), selection: review.incident.selection }
      sessionStorage.setItem(STORAGE, JSON.stringify(value))
      if (sessionStorage.getItem(STORAGE) !== JSON.stringify(value)) throw Error('journal not retained')
      pending.current = value; setOperation(value); setConsent(false)
      void dispatch(value)
    } catch { setStorageReady(false); setMessage('Der Vorgangsbeleg konnte nicht sicher vorgemerkt werden. Es wurde keine Anfrage gesendet.') }
  }

  return <section className="space-y-4" aria-busy={busy}>
    <button type="button" className={button} disabled={busy || operation !== null} onClick={() => void dispatch({ schema: 1, intent: 'review' })}>Gespeicherten Production-Stand lesen</button>
    {review ? <>
      <section className="space-y-3 rounded-lg border p-4" aria-labelledby="production-incident-title">
        <h2 id="production-incident-title" className="text-lg font-semibold">Hintergrundprüfung und Sperre</h2>
        <p>{review.incident.status === 'blocked' ? `Sperre ${review.incident.generation} ist aktiv.` : 'Es ist keine dauerhafte Incident-Sperre offen.'} Die Frischeprüfung gilt zusätzlich bei jedem Zugriff.</p>
        <p>Letzte vollständige Prüfung: {time(review.incident.proofFinished)}. Gültig bis: {time(review.incident.validUntil)}.</p>
        {review.incident.methodEpoch !== null ? <p>Aktuell gelesene Methodenepoche: {review.incident.methodEpoch}.</p> : null}
        {review.incident.status === 'blocked' ? <>
          <p>{review.incident.canResume ? 'Ein voller Erfolg nach der Sperre liegt vor. Dein Klick gibt genau den gelesenen Zustand wieder frei.' : 'Die Voraussetzungen zur Wiederaufnahme sind noch nicht erfüllt. Benötigt werden eine freigegebene Methode und eine aktuelle vollständige Hintergrundprüfung nach der Sperre.'}</p>
          <label className="flex min-h-11 items-start gap-3"><input type="checkbox" className="mt-1" checked={consent} disabled={busy || !!operation || !review.incident.canResume}
            onChange={event => setConsent(event.target.checked)} /><span>Ich habe den gespeicherten Zustand geprüft und gebe genau diese Production-Sperre zur Wiederaufnahme frei.</span></label>
          <button type="button" className={button} disabled={busy || !!operation || !consent || !storageReady || !review.incident.canResume} onClick={resume}>Production nach Schutzprüfung wiederaufnehmen</button>
        </> : null}
      </section>
    </> : null}
    {operation ? <section className="space-y-3 rounded-lg border p-4"><p>Vorgemerkt: Production nach Schutzprüfung wiederaufnehmen.</p>
      <button type="button" className={button} disabled={busy} onClick={() => void dispatch({ ...operation, intent: 'confirm' })}>Diesen Vorgang unabhängig bestätigen</button>
    </section> : null}
    <p role="status" aria-live="polite" aria-atomic="true" className="rounded-lg border p-4">{busy ? 'Der angeforderte Vorgang läuft …' : message}</p>
  </section>
}
