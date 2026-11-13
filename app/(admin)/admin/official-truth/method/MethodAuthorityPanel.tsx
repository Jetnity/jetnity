'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  HUMAN_METHOD_BODY_BYTES, HUMAN_METHOD_STORAGE_KEY, appendHumanOperation, createHumanOperationId,
  latestHumanOperation, nextHumanAction, persistHumanJournal, readHumanJournal, readHumanOutcome, readHumanRelease,
  type HumanAction, type HumanIntent, type HumanJournal, type HumanOperation, type HumanRelease,
} from '@/lib/readiness/official-truth-product-v3/method/human-contract'

const LABELS = { stage: 'Entwurf hinterlegen', approve: 'Methode freigeben', revoke: 'Freigabe widerrufen' } as const
const PENDING = 'Der Ausgang ist offen. Behalte den gespeicherten Vorgang und bestätige ihn separat; ein neuer Schreibversuch wird nicht gestartet.'
const BUTTON = 'min-h-11 rounded-md border px-4 py-2 text-left font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

async function outcomeBody(response: Response): Promise<unknown> {
  if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') ?? '') || !response.body) return null
  const reader = response.body.getReader(), chunks: Uint8Array[] = []
  let bytes = 0, complete = false
  try {
    for (;;) {
      const part = await reader.read()
      if (part.done) { complete = true; break }
      bytes += part.value.byteLength
      if (bytes > HUMAN_METHOD_BODY_BYTES) return null
      chunks.push(part.value)
    }
    const body = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body))
  } finally {
    if (!complete) await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export default function MethodAuthorityPanel({ release }: { release: HumanRelease | null }) {
  const selected = readHumanRelease(release), selectedId = selected?.selectionId ?? null
  const [journal, setJournal] = useState<HumanJournal | null>(null)
  const [confirmed, setConfirmed] = useState<HumanOperation | null>(null)
  const [storageBlocked, setStorageBlocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [consent, setConsent] = useState(false)
  const [message, setMessage] = useState('Gespeicherter Vorgang wird geprüft …')
  const [recordedAt, setRecordedAt] = useState<string | null>(null)
  const saved = useRef<{ journal: HumanJournal; raw: string | null } | null>(null)
  const lock = useRef(false), mounted = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const status = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mounted.current = true
    if (selectedId) {
      try {
        const raw = sessionStorage.getItem(HUMAN_METHOD_STORAGE_KEY)
        const retained = readHumanJournal(raw, selectedId)
        if (!retained) {
          setStorageBlocked(true)
          setMessage('Der gespeicherte Vorgang ist beschädigt oder gehört zu einer anderen Auswahl. Bitte mit der technischen Leitung klären; nichts wird überschrieben.')
        } else {
          saved.current = { journal: retained, raw }
          setJournal(retained)
          setMessage(latestHumanOperation(retained) ? 'Ein gespeicherter Vorgang ist offen. Bestätige dieselbe Operation erneut.' : 'Prüfe zuerst Umfang, Zeitraum und Methodenpaket. Danach kannst du den Entwurf hinterlegen.')
        }
      } catch {
        setStorageBlocked(true)
        setMessage('Der sichere Sitzungsmerker ist nicht verfügbar. Ein Schreibvorgang kann deshalb nicht beginnen.')
      }
    }
    return () => { mounted.current = false; controller.current?.abort() }
  }, [selectedId])

  async function send(operation: HumanOperation, intent: HumanIntent) {
    const abort = new AbortController()
    controller.current = abort
    // This bounds this browser request. An abort never proves a database rollback.
    const timer = setTimeout(() => abort.abort(), 20_000)
    try {
      const response = await fetch('/api/admin/official-truth/method', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: abort.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...operation, intent }),
      })
      const parsed = readHumanOutcome(await outcomeBody(response), operation, intent)
      if (!mounted.current) return
      if (response.status === 401 || response.status === 403) {
        setMessage('Dein aktueller Zugang wurde nicht bestätigt. Melde dich als Inhaber an und schließe die Zwei-Faktor-Prüfung ab; bestätige danach denselben gespeicherten Vorgang.')
      } else if (!parsed || (!response.ok && parsed.status !== 'unresolved')) setMessage(PENDING)
      else if (parsed.status === 'confirmed' && intent === 'confirm') {
        setConfirmed(operation)
        setRecordedAt(parsed.recordedAt)
        setMessage('Dieser Vorgang wurde in einer neuen Anfrage unter deinem aktuell geprüften Zugang bestätigt. Das bestätigt den Verlauf; die aktuelle Gültigkeit wird bei jeder Nutzung gesondert geprüft.')
      } else if (parsed.status === 'recorded') {
        setRecordedAt(parsed.recordedAt)
        setMessage('Der Vorgang wurde protokolliert und ist noch nicht separat bestätigt. Nutze jetzt „Gespeicherten Vorgang bestätigen“.')
      } else if (parsed.status === 'absent') {
        setMessage('Für dieselbe Operation wurde noch kein Eintrag bestätigt. Der Ausgang bleibt offen; ein verspäteter Schreibvorgang ist damit nicht ausgeschlossen. Bitte später erneut bestätigen oder die technische Leitung einbeziehen.')
      } else if (parsed.code === 'unselected' || parsed.code === 'selection_mismatch' || parsed.code === 'target_refused') {
        setMessage('Die ausgewählte Methode oder Entwicklungsumgebung ist nicht mehr verfügbar. Der gespeicherte Vorgang bleibt erhalten. Bitte mit der technischen Leitung klären.')
      } else if (parsed.code === 'approval_elapsed') {
        setMessage('Der ausgewählte Freigabezeitraum ist abgelaufen. Es wurde keine neue Freigabe angefordert; der gespeicherte Vorgang bleibt zur Klärung erhalten.')
      } else setMessage(PENDING)
    } catch { if (mounted.current) setMessage(PENDING) }
    finally {
      clearTimeout(timer)
      if (controller.current === abort) controller.current = null
    }
  }

  async function act(intent: HumanIntent, requestedAction?: HumanAction) {
    // Synchronous lock closes the interval before React paints disabled buttons.
    if (lock.current || !selected || !saved.current) return
    lock.current = true
    setBusy(true)
    setRecordedAt(null)
    try {
      let current = saved.current.journal
      let operation = latestHumanOperation(current)
      if (intent === 'mutate') {
        if (storageBlocked || !consent || !requestedAction || nextHumanAction(current, confirmed) !== requestedAction) return
        // Never overwrite a changed or unreadable pending identity.
        if (sessionStorage.getItem(HUMAN_METHOD_STORAGE_KEY) !== saved.current.raw) {
          setStorageBlocked(true)
          setConfirmed(null)
          setMessage('Der Sitzungsmerker hat sich geändert. Lade die Seite neu und prüfe den gespeicherten Vorgang; nichts wurde geschrieben.')
          return
        }
        const next = appendHumanOperation(current, confirmed, requestedAction, createHumanOperationId())
        if (!next) return
        current = next
        operation = latestHumanOperation(current)
        // Retain the attempted identity even when storage readback fails. No
        // mutation is dispatched until safe persistence has completed.
        saved.current = { journal: current, raw: JSON.stringify(current) }
        setJournal(current)
        setConfirmed(null)
        setConsent(false)
        if (!persistHumanJournal(sessionStorage, current)) {
          setStorageBlocked(true)
          setMessage('Der Sitzungsmerker konnte nicht sicher gespeichert werden. Es wurde kein Schreibvorgang gestartet. Bitte den angezeigten Vorgang mit der technischen Leitung klären.')
          return
        }
      } else setConfirmed(null)
      if (!operation) return
      setMessage(intent === 'confirm' ? 'Gespeicherter Vorgang wird unter deinem aktuellen Zugang bestätigt …' : 'Vorgang wird übermittelt. Der Sitzungsmerker bleibt erhalten …')
      await send(operation, intent)
    } catch {
      setStorageBlocked(true)
      setMessage('Der Sitzungsmerker oder die sichere Vorgangskennung ist nicht verfügbar. Es wird kein neuer Schreibversuch gestartet.')
    } finally {
      lock.current = false
      if (mounted.current) { setBusy(false); status.current?.focus() }
    }
  }

  if (!selected) return (
    <div className="space-y-3 rounded-lg border p-4" role="status">
      <h2 className="text-lg font-semibold">Dev-Aktivierung noch nicht bereit</h2>
      <p>Die Methode mit ihrem Paket und Betriebszeitraum ist vorbereitet. Der konkrete Dev-Stand und die Aktivierungsauswahl sind noch nicht bestätigt. Hier ist deshalb derzeit keine Aktion möglich.</p>
      <p>Nach der technischen Auswahl kannst du den Umfang prüfen, den Entwurf hinterlegen und die Freigabe gesondert bestätigen.</p>
    </div>
  )

  const current = journal ? latestHumanOperation(journal) : null
  const next = journal ? nextHumanAction(journal, confirmed) : null
  return (
    <div className="space-y-5" aria-busy={busy}>
      <section className="space-y-3 rounded-lg border p-4" aria-labelledby="method-scope">
        <h2 id="method-scope" className="text-lg font-semibold">Schweizer Pass → Deutschland · Visum</h2>
        <p>Entwicklungsumgebung · Schweizer Reisepass · direkte Einreise</p>
        <p>{selected.scope.reviewedScope}</p>
        <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
          <dt className="font-medium">Betriebszeitraum</dt><dd>{selected.scope.activeFrom} bis {selected.scope.activeUntilExclusive} (Ende ausgeschlossen, UTC)</dd>
          <dt className="font-medium">Methodenpaket</dt><dd className="break-words"><a className="underline" href={selected.packageHref} target="_blank" rel="noopener noreferrer">{selected.packageVersion} öffnen (neuer Tab)</a></dd>
          <dt className="font-medium">Freigabe gilt</dt><dd>{selected.approval.mode === 'until' ? `Bis ${selected.approval.until} (UTC)` : 'Bis zu einem ausdrücklichen Widerruf'}</dd>
        </dl>
        <p className="text-sm">Der Betriebszeitraum begrenzt den technischen Einsatz dieser Methode. Er ist keine amtliche Gültigkeitsfrist und keine erlaubte Aufenthaltsdauer.</p>
        <p>Du gibst die Methode einmal frei. Danach darf sie innerhalb dieses Betriebszeitraums automatisch prüfen und aktualisieren; die Freigabe gilt bis zu einem ausdrücklichen Widerruf.</p>
        <details className="break-all text-sm">
          <summary className="cursor-pointer py-2">Methodenkennung und Prüfwerte</summary>
          <p>{selected.methodId} · Revision {selected.revision}</p>
          <p>Methode: {selected.methodDigest}</p><p>Paket: {selected.packageDigest}</p>
        </details>
        <p className="text-sm">Die Freigabe betrifft diese Methode. Sie allein veröffentlicht keine Einreiseauskunft und ersetzt keine aktuelle Prüfung einer konkreten Reise.</p>
      </section>

      <div ref={status} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className="space-y-2 rounded-lg border p-4 focus:outline focus:outline-2">
        <p>{message}</p>
        {current ? <p className="break-all text-sm">Gespeicherter Vorgang: {LABELS[current.action]} · {current.operationId}</p> : null}
        {recordedAt ? <p className="break-all text-sm">Protokollzeit: {recordedAt} (UTC)</p> : null}
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:items-start">
        {current ? <button type="button" disabled={busy} className={BUTTON} onClick={() => void act('confirm')}>Gespeicherten Vorgang bestätigen</button> : null}
        {next && !storageBlocked ? <>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
            <input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
            <span>{next === 'revoke' ? 'Ich will die oben bezeichnete Freigabe ausdrücklich widerrufen.' : 'Ich habe Umfang, Zeitraum und Methodenpaket geprüft und will den folgenden Schritt ausführen.'}</span>
          </label>
          <button type="button" disabled={busy || !consent} className={BUTTON} onClick={() => void act('mutate', next)}>{LABELS[next]}</button>
        </> : null}
      </div>
      <p className="text-sm">Jeder Schreibschritt braucht danach eine neue Bestätigungsanfrage. Bei Abbruch oder verlorener Antwort bleibt derselbe Vorgang erhalten; es gibt keinen automatischen erneuten Schreibversuch.</p>
      <p className="text-sm"><Link className="underline" href="/admin/login">Zur Anmeldung und Zwei-Faktor-Prüfung</Link>. Kehre anschließend zu <Link className="underline" href="/admin/official-truth/method">dieser Freigabeseite</Link> zurück.</p>
    </div>
  )
}
