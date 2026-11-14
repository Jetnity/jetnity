'use client'

import { useEffect, useRef, useState } from 'react'
import { lade } from '@/lib/admin/ladezustand'
import { DEV_GUARD_PATH, DEV_GUARD_STORAGE, DEV_GUARD_RESPONSE_BYTES, readDevGuardRequest,
  readDevGuardResult, readDevGuardText, type DevGuardOperation, type DevGuardRequest,
  type DevGuardReview } from '@/lib/readiness/official-truth-product-v3/runtime/guard-contract'

const button = 'min-h-11 rounded-md border px-4 py-2 text-left font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const label = (action: DevGuardOperation['action']) => action === 'retire_unknown' ? 'Abgelaufenen Quellenversuch schließen' : 'Dev nach Schutzprüfung wiederaufnehmen'
const time = (value: string | null) => value === null ? 'Noch kein vollständiger Erfolg' : new Date(value).toLocaleString('de-CH')

export default function DevGuardPanel() {
  const [review, setReview] = useState<DevGuardReview | null>(null)
  const [operation, setOperation] = useState<DevGuardOperation | null>(null)
  const [busy, setBusy] = useState(false), [consent, setConsent] = useState(false), [storageReady, setStorageReady] = useState(false)
  const [message, setMessage] = useState('Lies zuerst den aktuellen gespeicherten Stand. Ein Start erfolgt nur durch deinen Klick.')
  const locked = useRef(false), mounted = useRef(false), pending = useRef<DevGuardOperation | null>(null)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => {
    mounted.current = true
    try {
      const stored = sessionStorage.getItem(DEV_GUARD_STORAGE)
      if (stored !== null) {
        const value = readDevGuardRequest(JSON.parse(stored))
        if (!value || value.intent !== 'mutate' || JSON.stringify(value) !== stored) throw Error('invalid journal')
        pending.current = value; setOperation(value)
        setMessage('Ein Vorgang ist vorgemerkt. Bestätige ihn mit seiner ursprünglichen Auswahl, bevor du etwas Neues startest.')
      }
      setStorageReady(true)
    } catch { setMessage('Der lokale Vorgangsbeleg ist nicht verfügbar. Bitte mit der technischen Leitung prüfen; ein neuer Schreibvorgang bleibt gesperrt.') }
    return () => { mounted.current = false; controller.current?.abort() }
  }, [])

  async function dispatch(request: DevGuardRequest) {
    if (locked.current) return
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
        setReview(value); setConsent(false); setMessage('Gespeicherten Stand gelesen. Prüfe den konkreten Vorgang vor deinem Klick.')
      } else if (value.status === 'confirmed') {
        const saved = pending.current
        if (!saved || saved.operationId !== value.operationId || sessionStorage.getItem(DEV_GUARD_STORAGE) !== JSON.stringify(saved)) throw Error('changed journal')
        sessionStorage.removeItem(DEV_GUARD_STORAGE); pending.current = null; setOperation(null); setReview(null); setConsent(false)
        setMessage(value.action === 'retire_unknown'
          ? 'Der alte Versuch wurde unabhängig als geschlossen bestätigt. Die Originale und bisherigen Belege bleiben erhalten. Ein neuer Quellenlauf wurde dadurch nicht gestartet.'
          : 'Die Wiederaufnahme wurde unabhängig bestätigt. Lies den aktuellen Stand erneut, bevor du einen Quellenlauf startest.')
      } else if (value.status === 'absent') {
        setMessage('Für diesen Vorgang wurde noch keine gespeicherte Quittung gefunden. Das beweist keine Rücknahme eines offenen Laufs. Bitte mit der technischen Leitung prüfen.')
      } else setMessage('Die Datenbank hat den Vorgang als gespeichert gemeldet. Bestätige jetzt denselben Vorgang durch einen getrennten Lesezugriff.')
    } catch {
      if (mounted.current) setMessage('Der Ausgang ist nicht bestätigt. Der vorgemerkte Vorgang bleibt erhalten; bitte denselben Vorgang bestätigen.')
    } finally {
      clearTimeout(timer); abort.abort(); controller.current = null; locked.current = false
      if (mounted.current) setBusy(false)
    }
  }
  function mutate(action: DevGuardOperation['action']) {
    if (locked.current || pending.current || !review || !consent || !storageReady) return
    const selection = action === 'retire_unknown'
      ? review.retirement.status === 'reviewable' ? review.retirement.selection : null
      : review.incident.canResume ? review.incident.selection : null
    if (!selection) return
    try {
      if (sessionStorage.getItem(DEV_GUARD_STORAGE) !== null) throw Error('existing operation')
      const value: DevGuardOperation = { schema: 1, intent: 'mutate', action,
        operationId: 'op3_' + crypto.randomUUID().replaceAll('-', ''), selection }
      sessionStorage.setItem(DEV_GUARD_STORAGE, JSON.stringify(value))
      if (sessionStorage.getItem(DEV_GUARD_STORAGE) !== JSON.stringify(value)) throw Error('journal not retained')
      pending.current = value; setOperation(value); setConsent(false)
      void dispatch(value)
    } catch { setStorageReady(false); setMessage('Der Vorgangsbeleg konnte nicht sicher vorgemerkt werden. Es wurde keine Anfrage gesendet.') }
  }
  return <section className="space-y-4" aria-busy={busy}>
    <button type="button" className={button} disabled={busy || operation !== null} onClick={() => void dispatch({ schema: 1, intent: 'review' })}>Gespeicherten Dev-Stand lesen</button>
    {review ? <>
      <section className="space-y-3 rounded-lg border p-4" aria-labelledby="retirement-title">
        <h2 id="retirement-title" className="text-lg font-semibold">Offener erster Quellenversuch</h2>
        {review.retirement.status === 'reviewable' ? <>
          <p>Versuch 1 ist abgelaufen. Gespeichert sind zwei Originale und eine Quellenprüfung, aber keine akzeptierte Regelversion. Ende der alten Arbeitsfrist: {time(review.retirement.leaseEndedAt)}.</p>
          <p>Schließen hält den unbekannten Ausgang fest und sperrt weitere Abschlüsse unter den alten Vorgangskennungen. Bisherige Belege bleiben erhalten. Ein späterer Quellenlauf benötigt einen eigenen Start.</p>
          <button type="button" className={button} disabled={busy || !!operation || !consent || !storageReady} onClick={() => mutate('retire_unknown')}>{label('retire_unknown')}</button>
        </> : <p>{review.retirement.status === 'closed' ? 'Der erste Versuch ist bereits durch eine eigene Quittung geschlossen.' : 'Der fest vorgesehene erste Versuch ist in diesem Zustand nicht abschließbar.'}</p>}
      </section>
      <section className="space-y-3 rounded-lg border p-4" aria-labelledby="incident-title">
        <h2 id="incident-title" className="text-lg font-semibold">Hintergrundprüfung und Sperre</h2>
        <p>{review.incident.status === 'blocked' ? `Sperre ${review.incident.generation} ist aktiv.` : 'Es ist keine dauerhafte Incident-Sperre offen.'} Die Frischeprüfung gilt zusätzlich bei jedem Zugriff.</p>
        <p>Letzte vollständige Prüfung: {time(review.incident.proofFinished)}. Gültig bis: {time(review.incident.validUntil)}.</p>
        {review.incident.methodEpoch !== null ? <p>Aktuell gelesene Methodenepoche: {review.incident.methodEpoch}.</p> : null}
        {review.incident.status === 'blocked' ? <>
          <p>{review.incident.canResume ? 'Ein voller Erfolg nach der Sperre liegt vor. Dein Klick gibt genau den gelesenen Zustand wieder frei.' : 'Die Voraussetzungen zur Wiederaufnahme sind noch nicht erfüllt.'}</p>
          <button type="button" className={button} disabled={busy || !!operation || !consent || !storageReady || !review.incident.canResume} onClick={() => mutate('resume')}>{label('resume')}</button>
        </> : null}
      </section>
      <label className="flex min-h-11 items-start gap-3"><input type="checkbox" className="mt-1" checked={consent} disabled={busy || !!operation}
        onChange={event => setConsent(event.target.checked)} /><span>Ich habe den gespeicherten Zustand und die Folgen des gewählten Dev-Vorgangs geprüft.</span></label>
    </> : null}
    {operation ? <section className="space-y-3 rounded-lg border p-4"><p>Vorgemerkt: {label(operation.action)}.</p>
      <button type="button" className={button} disabled={busy} onClick={() => void dispatch({ ...operation, intent: 'confirm' })}>Diesen Vorgang unabhängig bestätigen</button>
    </section> : null}
    <p role="status" aria-live="polite" aria-atomic="true" className="rounded-lg border p-4">{busy ? 'Der angeforderte Vorgang läuft …' : message}</p>
  </section>
}
