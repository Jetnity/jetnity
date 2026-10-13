'use client'
import * as React from 'react'
import type { Trip } from '@/types/trips'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { requirementsLokalFuerReise } from '@/lib/readiness/engine'
import { pilotContextCurrent, pilotContextFingerprint, type PilotDeclaration } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/context'
import { type PilotResult, type PilotStatus } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/result'

export function useOfficialTruthPilot(trip: Trip, serverEvaluations: OfficialEvaluation[], saved: (trip: Trip) => void) {
  const [result,setResult]=React.useState<PilotResult|null>(null)
  const [status,setStatus]=React.useState<PilotStatus|'checking'|'expired'>('context_missing')
  const [error,setError]=React.useState('')
  const [busy,setBusy]=React.useState(false)
  const [invalid,setInvalid]=React.useState(false)
  const generation=React.useRef(0)
  const inFlight=React.useRef<AbortController|null>(null)
  const fingerprint=pilotContextFingerprint(trip)
  const currentFingerprint=React.useRef(fingerprint)
  React.useEffect(() => { currentFingerprint.current=fingerprint },[fingerprint])
  const invalidate=React.useCallback(() => {
    generation.current++;inFlight.current?.abort();inFlight.current=null
    setResult(null);setInvalid(true);setBusy(false);setError('');setStatus('context_changed')
  },[])
  React.useEffect(() => {
    if (!result?.expiresAt) return
    const expire=() => { generation.current++;setResult(null);setInvalid(true);setStatus('expired') }
    const timer=setTimeout(expire,Math.max(0,Date.parse(result.expiresAt)-Date.now()))
    // A background/offline screen gets no stale-positive resumption guarantee.
    const hide=() => { if (document.visibilityState!=='visible') expire() }
    document.addEventListener('visibilitychange',hide)
    window.addEventListener('pagehide',expire)
    return () => { clearTimeout(timer);document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',expire) }
  },[result])
  React.useEffect(() => () => { inFlight.current?.abort() },[])
  async function request(operation: 'save'|'check', declaration?: PilotDeclaration): Promise<boolean> {
    if (inFlight.current) return false
    const sequence=++generation.current, requestFingerprint=fingerprint
    const controller=new AbortController();inFlight.current=controller
    setBusy(true);setResult(null);setInvalid(true);setError('')
    if (operation==='check') setStatus('checking')
    const timer=setTimeout(() => controller.abort(),18_000)
    try {
      const response=await fetch('/api/readiness/ch-de-application',{ method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{ 'content-type':'application/json' },signal:controller.signal,
        body:JSON.stringify({ operation,tripId:trip.id,revision:trip.revision,
          ...(operation==='save' ? { mutationId:crypto.randomUUID(),declaration } : {}) }) })
      const body=await response.json()
      if (sequence!==generation.current || currentFingerprint.current!==requestFingerprint) return false
      if (!response.ok) throw new Error(typeof body.message==='string' ? body.message : 'Die Anfrage konnte nicht abgeschlossen werden.')
      if (operation==='save') {
        saved(body.trip);setInvalid(false);setStatus('disabled');return true
      }
      const next=body as PilotResult
      if (next.tripId!==trip.id || next.revision!==trip.revision || next.contextFingerprint!==requestFingerprint
        || !Array.isArray(next.evaluations)) throw new Error('Die Antwort passt nicht mehr zur Reise. Bitte neu laden.')
      if (next.status==='verified' && (!next.expiresAt || !Number.isFinite(Date.parse(next.expiresAt)) || Date.parse(next.expiresAt)<=Date.now()
        || Date.parse(next.expiresAt)>Date.now()+60_000)) throw new Error('Die Prüfungsanzeige ist abgelaufen.')
      setResult(next);setStatus(next.status);setInvalid(false);return true
    } catch (e) {
      if (sequence===generation.current) { setResult(null);setStatus('unavailable');setError(e instanceof Error && e.name!=='AbortError' ? e.message : 'Die Anfrage wurde abgebrochen. Es wird kein früheres Ergebnis angezeigt.') }
      return false
    } finally {
      clearTimeout(timer)
      if (sequence===generation.current) { inFlight.current=null;setBusy(false) }
    }
  }
  const visible=result && result.contextFingerprint===fingerprint
  const displayedStatus=!trip.regulatoryContext ? 'context_missing' : !pilotContextCurrent(trip) ? 'context_changed'
    : result && !visible ? 'context_changed' : status==='context_missing' ? 'disabled' : status
  return { status:displayedStatus as PilotStatus|'checking'|'expired',busy,error,invalidate,
    evaluations:visible ? result.evaluations : invalid || result ? requirementsLokalFuerReise(trip) : serverEvaluations,
    save:(declaration:PilotDeclaration) => request('save',declaration),check:() => { void request('check') } }
}
