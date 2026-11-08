'use client'
import * as React from 'react'
import type { Trip } from '@/types/trips'
import { requirementsLokalFuerReise } from '@/lib/readiness/engine'
import { pilotContextCurrent,pilotContextFingerprint } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/context'
import { acceptedStoreClientResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/client-result'
import { acceptedStoreMessages,type AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'
import { AcceptedStoreDisplayClock } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/display-clock'
import type { useOfficialTruthPilot } from './useOfficialTruthPilot'

type Phase=AcceptedStoreTripResult['status']|'idle'|'checking'|'expired'
type Lease={result:AcceptedStoreTripResult;deadline:number;sequence:number}
const ownMessage:Record<'idle'|'checking'|'expired',string>={idle:'Der gespeicherte Stand wurde für diese Reise noch nicht erneut geprüft.',
  checking:'Der gespeicherte Stand wird für diese Reise geprüft.',expired:'Die Prüfungsanzeige ist abgelaufen. Bitte prüfe den gespeicherten Stand erneut.'}
async function boundedJson(response:Response,signal:AbortSignal):Promise<unknown> {
  if(!response.body)throw Error('response_body_missing')
  const reader=response.body.getReader(),parts:Uint8Array[]=[];let size=0,complete=false
  try {
    for(;;){signal.throwIfAborted();const next=await reader.read();signal.throwIfAborted();if(next.done){complete=true;break}
      size+=next.value.byteLength;if(size>2_097_152)throw Error('response_bound');parts.push(next.value)}
    const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength}
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))
  } finally {if(!complete)await reader.cancel().catch(()=>undefined);reader.releaseLock()}
}

/** Independent accepted-store display ownership. No automatic request, retry,
 * cached positive, source fetch, timer reset on rerender or pilot.invalid latch. */
export function useAcceptedStoreTrip(trip:Trip,available:boolean) {
  const fingerprint=pilotContextFingerprint(trip)
  const [lease,setLease]=React.useState<Lease|null>(null)
  const [phase,setPhase]=React.useState<Phase>('idle')
  const [dirty,setDirty]=React.useState<string|null>(null)
  const [engaged,setEngaged]=React.useState(false)
  const [busy,setBusy]=React.useState(false)
  const [clock]=React.useState(()=>new AcceptedStoreDisplayClock())
  const clockSnapshot=React.useCallback(()=>clock.snapshot(fingerprint,available),[clock,fingerprint,available])
  const clockState=React.useSyncExternalStore(clock.subscribe,clockSnapshot,clock.serverSnapshot)
  const generation=React.useRef(0),inFlight=React.useRef<AbortController|null>(null)
  const clear=React.useCallback((next:Phase)=>{
    generation.current++;inFlight.current?.abort();inFlight.current=null
    clock.cancel()
    setLease(null);setBusy(false);setPhase(next)
  },[clock])
  React.useEffect(()=>{if(clockState==='expired'&&inFlight.current)clear('expired')},[clockState,clear])
  const invalidate=React.useCallback(()=>{setDirty(fingerprint);clear('context_changed')},[clear,fingerprint])
  React.useEffect(()=>{clear(available?'idle':'unavailable')},[available,fingerprint,clear])
  React.useEffect(()=>{
    const expire=()=>clear('expired'),visibility=()=>{if(document.visibilityState!=='visible')expire()}
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',expire);window.addEventListener('pageshow',expire);window.addEventListener('offline',expire)
    return ()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',expire);window.removeEventListener('pageshow',expire);window.removeEventListener('offline',expire)
      generation.current++;inFlight.current?.abort();inFlight.current=null}
  },[clear])
  React.useEffect(()=>{
    if(!lease||lease.result.status!=='current'||!lease.result.expiresAt)return
    const timer=setTimeout(()=>{if(generation.current===lease.sequence)clear('expired')},
      Math.max(0,Math.min(lease.deadline-performance.now(),Date.parse(lease.result.expiresAt)-Date.now())))
    return ()=>clearTimeout(timer)
  },[lease,clear])
  const contextOk=pilotContextCurrent(trip)&&dirty!==fingerprint
  async function read():Promise<boolean> {
    // Client availability is a display hint; the server independently checks
    // its code-owned binding before Auth/client/DB activity.
    if(!available||!contextOk||inFlight.current||document.visibilityState!=='visible')return false
    const sequence=++generation.current,controller=new AbortController(),started=performance.now()
    clock.start(sequence,fingerprint)
    inFlight.current=controller;setEngaged(true);setLease(null);setBusy(true);setPhase('checking')
    const timer=setTimeout(()=>controller.abort(),45_000)
    try {
      const response=await fetch('/api/readiness/accepted-store',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',
        headers:{'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({tripId:trip.id,revision:trip.revision})})
      const raw=await boundedJson(response,controller.signal);controller.signal.throwIfAborted()
      if(sequence!==generation.current)return false
      if(!clock.current(sequence)){setPhase('expired');return false}
      if(!response.ok)throw Error('request_unavailable')
      const result=acceptedStoreClientResult(raw,trip),deadline=started+result.deadlineFromRequestStartMs
      if(result.status==='current'&&(!result.expiresAt||document.visibilityState!=='visible'
        ||!clock.publish(sequence,deadline,Date.parse(result.expiresAt))))throw Error('display_expired')
      if(result.status!=='current')clock.end(sequence)
      setLease({result,deadline,sequence});setDirty(null);setPhase(result.status);return true
    } catch {
      if(sequence===generation.current){clock.cancel();setLease(null);setPhase(controller.signal.aborted?'expired':'unavailable')}
      return false
    } finally {clearTimeout(timer);controller.abort();if(sequence===generation.current){inFlight.current=null;setBusy(false)}}
  }
  // This check executes DURING render, before Effects can run for new props.
  const visible=available&&contextOk&&clockState==='current'&&lease?.result.status==='current'&&lease.result.contextFingerprint===fingerprint
    &&lease.result.tripId===trip.id&&lease.result.revision===trip.revision&&lease.deadline>performance.now()
    &&!!lease.result.expiresAt&&Date.parse(lease.result.expiresAt)>Date.now()&&(typeof document==='undefined'||document.visibilityState==='visible')
  const status:Phase=!available?'unavailable':!contextOk?'context_changed':lease?.result.contextFingerprint!==undefined&&lease.result.contextFingerprint!==fingerprint?'context_changed'
    :lease?.result.status==='current'&&!visible?'expired':phase
  return {status,busy,engaged,invalidate,read,cancel:()=>clear('idle'),canRead:available&&contextOk&&!busy,
    message:status==='idle'||status==='checking'||status==='expired'?ownMessage[status]:acceptedStoreMessages[status],
    evaluations:visible?lease.result.evaluations:requirementsLokalFuerReise(trip)}
}

/** Latest explicit intent owns the display across the two independent readers.
 * Mere lane switching cancels requests/results without inventing a local edit. */
export function useOfficialTruthReadOwnership(trip:Trip,pilot:ReturnType<typeof useOfficialTruthPilot>,accepted:ReturnType<typeof useAcceptedStoreTrip>,
  pilotAvailable:boolean,storeAvailable:boolean) {
  const [lane,setLane]=React.useState<'pilot'|'store'|null>(null)
  return {
    invalidate:()=>{pilot.invalidate();accepted.invalidate()},
    checkPilot:()=>{if(!pilotAvailable)return;setLane('pilot');accepted.cancel();pilot.check()},
    readStore:()=>{if(!accepted.canRead)return;setLane('store');pilot.cancel();void accepted.read()},
    evaluations:lane==='store'||lane===null&&storeAvailable?accepted.evaluations
      :lane==='pilot'&&!pilotAvailable?requirementsLokalFuerReise(trip):pilot.evaluations,
  }
}
