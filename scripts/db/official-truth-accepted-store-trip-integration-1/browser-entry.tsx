/** Disposable mounted proof only. All positive rows come from the native
 * product endpoint. Both hooks and the existing preparation renderer are real. */
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { z } from 'zod'
import Reisevorbereitung from '@/components/trips/Reisevorbereitung'
import { useOfficialTruthPilot } from '@/components/trips/useOfficialTruthPilot'
import { useAcceptedStoreTrip,useOfficialTruthReadOwnership } from '@/components/trips/useAcceptedStoreTrip'
import { useTripTravellerSnapshotLifecycle } from '@/components/trips/useTripTravellerSnapshotLifecycle'
import { travellerDraftBlocksOfficial } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/traveller-draft-guard'
import { acceptedStoreClientResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/client-result'
import { requirementsLokalFuerReise } from '@/lib/readiness/engine'
import type { Trip } from '@/types/trips'

export type BrowserFixtureDiagnostic={
  validation:{ok:true}|{ok:false;reason:string;issues:{code:string;path:(string|number)[]}[]};
  status:string;busy:boolean;canRead:boolean;draftBlocked:boolean;visibility:string;
  wallNow:number;monotonicNow:number;wallRemainingMs:number|null;deadlineFromRequestStartMs:number|null;
}
export type BrowserFixtureControl={
    replaceTrip:(trip:Trip)=>void;available:(value:boolean)=>void;redraw:()=>void;edit:()=>void;
    read:()=>Promise<boolean>;pilot:()=>void;inspect:(raw:unknown)=>BrowserFixtureDiagnostic;
}
declare global {
  interface Window { acceptedStoreFixture?:BrowserFixtureControl }
}
function MountedWorkspace({initial}:{initial:Trip}) {
  const [trip,setTrip]=React.useState(initial),[available,setAvailable]=React.useState(false),[renders,setRenders]=React.useState(0)
  const pilot=useOfficialTruthPilot(trip,requirementsLokalFuerReise(trip),setTrip)
  const accepted=useAcceptedStoreTrip(trip,available)
  const truth=useOfficialTruthReadOwnership(trip,pilot,accepted,true,available)
  const write=async(payload:unknown)=>{
    const response=await fetch('/fixture/traveller',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)})
    return response.ok?null:'Synthetic fixture save failed'
  }
  const traveller=useTripTravellerSnapshotLifecycle({tripId:trip.id,reise:trip,kanonisch:trip,seam:'account',onSetzen:write,
    onEntwurfAenderung:truth.invalidate,onAktualisieren:async()=>{
      const response=await fetch('/fixture');if(!response.ok)throw Error('fixture_refresh_unavailable')
      const fresh=await response.json() as Trip;setTrip(fresh);return {art:'success',reise:fresh}
    }})
  const draftBlocked=travellerDraftBlocksOfficial(trip,traveller)
  // Read-only diagnostics for the genuine endpoint reply and THIS mounted
  // Trip closure. No clock/state mutation, positive DTO or evaluator injection.
  const inspect=(raw:unknown):BrowserFixtureDiagnostic=>{
    let validation:BrowserFixtureDiagnostic['validation'],expiresAt:string|null=null,deadline:number|null=null
    try {
      const value=acceptedStoreClientResult(raw,trip)
      expiresAt=value.expiresAt;deadline=value.deadlineFromRequestStartMs;validation={ok:true}
    }catch(error){
      if(error instanceof z.ZodError)validation={ok:false,reason:'schema',issues:error.issues.slice(0,6).map(issue=>({
        code:issue.code,path:issue.path.slice(0,8).map(part=>typeof part==='string'?part.slice(0,64):typeof part==='number'?part:'unknown'),
      }))}
      else {
        const reasons=['response_context_changed','response_scope_changed','response_incomplete','response_binding_invalid','response_negative_invalid']
        validation={ok:false,reason:error instanceof Error&&reasons.includes(error.message)?error.message:'unexpected_validation_error',issues:[]}
      }
    }
    const wallNow=Date.now(),monotonicNow=performance.now()
    return {validation,status:accepted.status,busy:accepted.busy,canRead:accepted.canRead,draftBlocked,
      visibility:document.visibilityState,wallNow,monotonicNow,
      wallRemainingMs:expiresAt===null?null:Date.parse(expiresAt)-wallNow,deadlineFromRequestStartMs:deadline}
  }
  React.useLayoutEffect(()=>{
    window.acceptedStoreFixture={replaceTrip:value=>flushSync(()=>setTrip(value)),available:value=>flushSync(()=>setAvailable(value)),
      redraw:()=>flushSync(()=>setRenders(value=>value+1)),edit:()=>flushSync(()=>truth.invalidate()),read:accepted.read,pilot:truth.checkPilot,inspect}
  })
  return <main data-native-workspace data-store-status={accepted.status} data-store-busy={String(accepted.busy)} data-pilot-status={pilot.status} data-draft-blocked={String(draftBlocked)} data-renders={renders}>
    <h1>Closed synthetic native Workspace proof</h1>
    <output hidden data-proof-pilot-positive={pilot.evaluations.filter(value=>value.result!=='unknown').length}/>
    <button type="button" onClick={truth.invalidate}>Local edit</button>
    <Reisevorbereitung reise={trip} officialEvaluations={truth.evaluations}
      travellerSteuerung={traveller} onTravellerSetzen={write}
      officialPilot={<section data-native-read-controls><p role="status">{accepted.message}</p>
        <button type="button" disabled={!accepted.canRead} onClick={truth.readStore}>Gespeicherte Einreiseprüfung erneut prüfen</button>
        <button type="button" onClick={truth.checkPilot}>Existing pilot intent</button></section>}
      offeneBereiche={new Set(['reisende-dokumente','offizielle-anforderungen'])} onBereichOffen={()=>{}} onZiel={()=>{}} />
  </main>
}
async function start(){const response=await fetch('/fixture');if(!response.ok)throw Error('fixture_unavailable')
  const trip=await response.json() as Trip;const container=document.getElementById('root');if(!container)throw Error('mount_missing')
  createRoot(container).render(<MountedWorkspace initial={trip}/>)}
void start()
