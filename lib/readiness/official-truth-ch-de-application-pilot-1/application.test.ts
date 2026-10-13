import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fixtureTrip, fixtureRetrieve, fixtureContract, fixtureRegistry, fixtureExtract, consumeOfficialTruthTrustedFactExecutionContext, loadFixtureModule } from '../../../scripts/official-truth-ch-de-application-pilot-1/fixtures'
import type * as Evaluation from './evaluate-server'
import { pilotScope } from './scope-server'
import { pilotContextCurrent, pilotGraphFingerprint } from './context'
import { requirementsLokalFuerReise } from '../engine'

function runtime(fault='none') {
  const trip=fixtureTrip();let retrievals=0,rechecks=0
  const grant={id:'77777777-7777-4777-8777-777777777777',contractId:fixtureContract.id,contractDigest:fixtureContract.digest,expiresAt:new Date(Date.now()+120000).toISOString()}
  const evaluator=loadFixtureModule<typeof Evaluation>('lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts',{
    './contract-server':{applicationPilotEnabled:()=>fault!=='disabled',applicationContract:()=>fault==='missing-contract'?null:fixtureContract},
    './database-server':{pilotGrant:async(_trip:unknown,_grant:unknown,signal:AbortSignal)=>{assert(signal instanceof AbortSignal);assert(!signal.aborted);rechecks++;return fault==='not-admitted'||fault==='withdrawn'&&rechecks>1?null:grant}},
    '@/lib/readiness/official-truth-fact-entry-authority-server':{loadOfficialTruthFactEntryAuthority:async()=>fault==='authority'?{status:'access_forbidden'}:{status:'authorized',grant:'role',capability:'official-truth-freigeben'}},
    '@/lib/readiness/official-truth-source-catalog-server':{quellenKatalogLesen:async()=>({ok:true,registry:fixtureRegistry})},
    '@/lib/readiness/official-truth-server-owned-retrieval':{loadOfficialTruthServerOwnedRetrieval:async()=>{retrievals++;return fixtureRetrieve(fault)}},
    '@/lib/readiness/official-truth-trusted-fact-extractor-registry':{officialTruthTrustedFactExtrahieren:fixtureExtract,consumeOfficialTruthTrustedFactExecutionContext},
    '@/lib/trips/daten':{reiseLaden:async()=>({problem:null,zeilen:fault==='wrong-account'?[]:[fault==='revision-changed'?{...trip,revision:2}:trip]})},
  })
  return {trip,evaluator,retrievals:()=>retrievals}
}
test('current-only complete synthetic source -> canonical Evidence/review/Rule -> Requirements visa; other cells unknown',async()=>{
  const r=runtime();assert(pilotScope(r.trip).ok);const result=await r.evaluator.evaluateApplicationPilot(r.trip,new AbortController().signal)
  assert.equal(result.status,'verified');assert.equal(r.retrievals(),1)
  const visa=result.evaluations.find(e=>e.requirementType==='visa')!
  assert.equal(visa.result,'not_required');assert.match(visa.evidence.authority!,/SYNTHETISCHE/)
  assert(visa.evidence.checkedAt);assert.equal(visa.evidence.validUntil,null)
  assert(result.evaluations.filter(e=>e.requirementType!=='visa').every(e=>e.result==='unknown'))
  assert(!JSON.stringify(result).includes('END OF COMPLETE'));assert(result.expiresAt)
})
for(const fault of ['disabled','not-admitted','missing-contract','authority','altered','partial','oversize','timeout','withdrawn','wrong-account','revision-changed'])test(`fail closed: ${fault}`,async()=>{
  const r=runtime(fault),result=await r.evaluator.evaluateApplicationPilot(r.trip,new AbortController().signal)
  assert.notEqual(result.status,'verified');assert(result.evaluations.every(e=>e.result==='unknown'))
  if(['disabled','not-admitted','missing-contract','authority'].includes(fault))assert.equal(r.retrievals(),0)
})
test('declared complete direct route and ordinary passport cannot be inferred; changes invalidate',async()=>{
  for(const mutate of [(t:ReturnType<typeof fixtureTrip>)=>{t.regulatoryContext!.declaration.route=null},(t:ReturnType<typeof fixtureTrip>)=>{t.regulatoryContext!.declaration.passportClass=null},(t:ReturnType<typeof fixtureTrip>)=>{t.party![0]!.documents[0]!.expiresOn='2029-01-01'},(t:ReturnType<typeof fixtureTrip>)=>{t.revision++}]){
    const r=runtime();mutate(r.trip);assert(!pilotScope(r.trip).ok)
    const result=await r.evaluator.evaluateApplicationPilot(r.trip,new AbortController().signal)
    assert.notEqual(result.status,'verified');assert.equal(r.retrievals(),0)
  }
})
test('canonical fingerprints include declarations and expire even when graph revision is unchanged',()=>{
  const trip=fixtureTrip();assert(pilotContextCurrent(trip))
  const before=requirementsLokalFuerReise(trip)
  trip.regulatoryContext!.declaration.purpose='other'
  assert.notEqual(before[0]!.evidence.contextFingerprint,requirementsLokalFuerReise(trip)[0]!.evidence.contextFingerprint)
  trip.party![0]!.documents=[]
  assert(!pilotContextCurrent(trip));assert.notEqual(pilotGraphFingerprint(trip),trip.regulatoryContext!.graphFingerprint)
})
test('only the explicitly selected option is projected; duplicated and missing references never invoke retrieval',async()=>{
 const r=runtime(),other=structuredClone(r.trip.party![0]!)
 other.id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';other.clientRef='other-traveller';r.trip.party!.push(other);r.trip.travellers=2
 r.trip.regulatoryContext!.graphFingerprint=pilotGraphFingerprint(r.trip)
 const result=await r.evaluator.evaluateApplicationPilot(r.trip,new AbortController().signal)
 assert.equal(result.status,'verified');assert.equal(result.evaluations.filter(e=>e.result!=='unknown').length,1)
 assert(result.evaluations.filter(e=>e.travellerClientRef==='other-traveller').every(e=>e.result==='unknown'))
 for(const duplicate of [true,false]){
  const invalid=runtime()
  if(duplicate)invalid.trip.party![0]!.documents.push(structuredClone(invalid.trip.party![0]!.documents[0]!))
  else invalid.trip.regulatoryContext!.declaration.credentialOptionRef=null
  invalid.trip.regulatoryContext!.graphFingerprint=pilotGraphFingerprint(invalid.trip)
  const denied=await invalid.evaluator.evaluateApplicationPilot(invalid.trip,new AbortController().signal)
  assert.notEqual(denied.status,'verified');assert.equal(invalid.retrievals(),0)
 }
})
