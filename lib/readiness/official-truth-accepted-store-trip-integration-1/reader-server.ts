import 'server-only'
import { z } from 'zod'
import { reiseLaden } from '@/lib/trips/daten'
import { readinessAnfrageErlaubt } from '../rate-limit'
import { requirementsFuerReise,requirementsLokalFuerReise } from '../engine'
import { historicalValuesEqual } from '../official-truth-autonomous-provenance-artifact'
import { ACCEPTED_STORE_TRIP_CLOSURE_PROFILE } from '../official-truth-integrated-pilot-bundle'
import { pilotContextFingerprint } from '../official-truth-ch-de-application-pilot-1/context'
import type { RequirementsProvider } from '../provider'
import type { Trip } from '@/types/trips'
import type { AcceptedStoreTripResult } from './result'
import { acceptedStoreBinding } from './binding-server'
import { AcceptedStoreLifetime } from './lifetime-server'
import { AcceptedStoreDatabase } from './database-server'
import { checkReservation,requireCurrent,requireWitness } from './protocol-server'
import { reservedTripValue,tripValueBinding,selectedTripBinding,legalDatesCoverTrip } from './trip-binding-server'
import { reproveRetainedSnapshot } from './reproof-server'
import { headSchema,receiptSchema } from './wire'

const snapshotSchema=z.object({snapshot:z.unknown(),digest:z.string().regex(/^[a-f0-9]{64}$/),now:z.string(),expiresAt:z.string()}).strict()
const finalSchema=z.object({kind:z.literal('read'),operationId:z.string().uuid(),receipt:receiptSchema,digest:z.string(),head:headSchema,
  readAt:z.string(),expiresAt:z.string(),now:z.string()}).strict()
type Response={status:number;body:AcceptedStoreTripResult|{message:string}}
const missing:Response={status:404,body:{message:'Die Reise ist mit dieser Anmeldung nicht verfügbar.'}}
const unavailable:Response={status:503,body:{message:'Die gespeicherte Einreiseprüfung ist derzeit nicht verfügbar.'}}
const negative=(trip:Trip,status:Exclude<AcceptedStoreTripResult['status'],'current'>):AcceptedStoreTripResult=>({status,
  tripId:trip.id,revision:trip.revision,contextFingerprint:pilotContextFingerprint(trip),receiptFingerprint:null,evidenceVersionId:null,
  sourceCheckedAt:null,acceptedAt:null,readAt:null,expiresAt:null,deadlineFromRequestStartMs:0,evaluations:requirementsLokalFuerReise(trip)})

/** New explicit read only. No producer/source-fetch/reconciliation call is
 * reachable from this path. Its fresh native transactions re-prove durable
 * accepted truth; the Requirements engine receives the actual RLS-loaded Trip. */
export async function readAcceptedStoreTrip(tripId:string,revision:number,signal:AbortSignal):Promise<Response> {
  const binding=acceptedStoreBinding();if(!binding)return unavailable
  const life=new AcceptedStoreLifetime(signal,45_000)
  let db:AcceptedStoreDatabase|null=null,trip:Trip|null=null,result:Response=unavailable,deadline=0
  try {
    db=new AcceptedStoreDatabase(life,binding)
    const userId=await db.userIdentity();requireCurrent(binding,life)
    const rate=await life.run(()=>readinessAnfrageErlaubt(`accepted-store-trip:${userId}`));requireCurrent(binding,life)
    if(!rate.ok){result={status:429,body:{message:'Zu viele Anfragen. Bitte später erneut versuchen.'}};return result}
    const initial=await life.run(()=>reiseLaden(tripId,life.signal));requireCurrent(binding,life)
    if(initial.problem)throw Error('trip_read_unavailable')
    trip=initial.zeilen[0]??null
    if(!trip){result=missing;return result}
    if(trip.revision!==revision){result={status:409,body:{message:'Die Reise hat sich geändert. Bitte neu laden.'}};return result}
    const selected=selectedTripBinding(trip,binding.contract)
    if(!selected){result={status:200,body:negative(trip,'unsupported_context')};return result}
    const actualValues=tripValueBinding(trip)
    const reserveStarted=performance.now()
    const reserved=checkReservation(await db.reserve({cell:binding.contract.id,contractDigest:binding.contract.digest,
      profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,purpose:'read',tripId,revision}),binding,life,reserveStarted,userId)
    if(!reserved.graphDigest||reservedTripValue(reserved.graph)!==actualValues)throw Error('trip_binding_changed')
    await requireWitness(binding,life,reserved.head)
    const snapshotStarted=performance.now(),snapshot=snapshotSchema.parse(await db.snapshot({token:reserved.token}))
    life.pinWindow(snapshotStarted,snapshot.now,snapshot.expiresAt);requireCurrent(binding,life)
    const proof=await reproveRetainedSnapshot(snapshot.snapshot,binding,life);proof.assertCurrent()
    if(!historicalValuesEqual(proof.snapshot.head,reserved.head)||proof.receipt!==reserved.priorVersion
      ||proof.claim.key!==selected.ruleScopeKey||!legalDatesCoverTrip(trip,proof.validity.validFrom,proof.validity.validUntil))throw Error('trip_scope_invalid')
    const fact=proof.claim.fact
    if(fact.kind!=='requirement_effect'||!('effect'in fact)||!['required','not_required'].includes(fact.effect))throw Error('unsupported_fact')
    const provider:RequirementsProvider={name:'Jetnity Official Truth',evaluate:async()=>[{
      travellerClientRef:selected.travellerClientRef,credentialOptionRef:selected.credentialOptionRef,destinationCountryCode:'DE',
      requirementType:'visa',result:fact.effect,visaMode:fact.visaMode,officialClass:'requirement',authority:proof.source.authorityName,
      sourceUrl:proof.evidence.canonicalUrl,checkedAt:proof.evidence.retrievedAt,validFrom:proof.validity.validFrom,
      validUntil:proof.validity.validUntil,ruleReference:proof.receipt,
    }]}
    const evaluations=await life.run(()=>requirementsFuerReise(trip!,provider,{signal:life.signal}));proof.assertCurrent()
    const positives=evaluations.filter(e=>e.result!=='unknown')
    if(positives.length!==1||positives[0]!.requirementType!=='visa'||positives[0]!.travellerClientRef!==selected.travellerClientRef
      ||positives[0]!.credentialOptionRef!==selected.credentialOptionRef||positives[0]!.status!=='current')throw Error('projection_invalid')
    const current=await life.run(()=>reiseLaden(tripId,life.signal));proof.assertCurrent()
    if(current.problem||!current.zeilen[0]||tripValueBinding(current.zeilen[0])!==actualValues
      ||!historicalValuesEqual(selectedTripBinding(current.zeilen[0],binding.contract),selected))throw Error('trip_binding_changed')
    await requireWitness(binding,life,reserved.head);proof.assertCurrent()
    const finalStarted=performance.now()
    const final=finalSchema.parse(await db.finalize({token:reserved.token,digest:snapshot.digest}));proof.assertCurrent()
    life.pinWindow(finalStarted,final.now,final.expiresAt)
    if(final.operationId!==reserved.operationId||final.receipt!==proof.receipt||final.digest!==snapshot.digest
      ||!historicalValuesEqual(final.head,reserved.head))throw Error('reader_validation_unconfirmed')
    const confirmed=finalSchema.parse(await db.confirm({cell:binding.contract.id,operationId:reserved.operationId,ack:null}));proof.assertCurrent()
    if(!historicalValuesEqual({...confirmed,now:final.now},final))throw Error('reader_commit_unconfirmed')
    await requireWitness(binding,life,final.head);proof.assertCurrent()
    deadline=performance.now()+life.remaining()
    result={status:200,body:{status:'current',tripId:trip.id,revision:trip.revision,contextFingerprint:selected.contextFingerprint,
      receiptFingerprint:proof.receipt,evidenceVersionId:proof.evidence.versionId,sourceCheckedAt:proof.evidence.retrievedAt,
      acceptedAt:new Date(proof.snapshot.acceptedAt).toISOString(),readAt:new Date(final.readAt).toISOString(),expiresAt:new Date(final.expiresAt).toISOString(),
      deadlineFromRequestStartMs:Math.max(0,Math.min(45_000,Math.floor(deadline-life.started))),evaluations}}
  } catch {result=trip?{status:200,body:negative(trip,'unavailable')}:unavailable}
  finally {
    if(db)await db.dispose()
    try{await life.settle()}catch{result=trip?{status:200,body:negative(trip,'unavailable')}:unavailable}
  }
  if(result.status===200&&'status'in result.body&&result.body.status==='current') {
    if(signal.aborted||acceptedStoreBinding()!==binding||performance.now()>=deadline)return {status:200,body:negative(trip!,'unavailable')}
    result.body.deadlineFromRequestStartMs=Math.max(0,Math.min(result.body.deadlineFromRequestStartMs,Math.floor(deadline-life.started)))
  }
  return result
}
