import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { loadFixtureModule, fixtureTrip, fixtureDeclaration } from '../../../scripts/official-truth-ch-de-application-pilot-1/fixtures'
import type * as RequestModule from './request-server'
import { applicationPilotAvailable } from './availability-server'
import { withinDeadline } from './deadline-server'
import { reiseSchema } from '@/lib/trips/schema'
import { alsNutzlast } from '@/lib/trips/abbildung'
import { pilotContextCurrent } from './context'
function runtime(fault='none') {
 const trip=fixtureTrip();let checks=0,saves=0,auths=0
 const handler=loadFixtureModule<typeof RequestModule>('lib/readiness/official-truth-ch-de-application-pilot-1/request-server.ts',{
  './availability-server':{applicationPilotAvailable:fault==='deployment-closed'?applicationPilotAvailable:()=>true},
  '@/lib/supabase/server':{createServerComponentClient:async()=>({auth:{getUser:async()=>{auths++;return{error:null,data:{user:fault==='anonymous'?null:{id:'fixture'}}}}}})},
  '@/lib/trips/daten':{reiseLaden:async()=>({problem:fault==='database'?{}:null,zeilen:['foreign','missing'].includes(fault)?[]:[trip]})},
  '@/lib/readiness/rate-limit':{readinessAnfrageErlaubt:async()=>({ok:fault!=='rate'})},
  './database-server':{saveDeclaration:async(_trip:unknown,_declaration:unknown,_mutation:unknown,signal:AbortSignal)=>{assert(signal instanceof AbortSignal);assert(!signal.aborted);saves++;if(fault==='save-interrupted')throw Error('aborted submitted write');return fault==='save-failure'?null:trip}},
  '@/lib/readiness/trip-official-evaluations-server':{tripOfficialPilotPruefen:async()=>{checks++;return {status:'disabled'}}},
 })
 return{trip,handler,counters:()=>({checks,saves,auths})}
}
const request=(body:unknown,headers:Record<string,string>={})=>new Request('http://localhost:3000/api/readiness/ch-de-application',{method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json',...headers},body:JSON.stringify(body)})
test('browser POST validates CSRF, strict shape and finite body before Auth; no caller authority',async()=>{
 for(const [body,headers,status] of [[{}, {},400],[{}, {origin:'https://foreign.example'},403],[{}, {'content-length':'8193'},413],[{}, {'content-type':'text/plain'},415],[{operation:'check',tripId:fixtureTrip().id,revision:1,owner:true},{},400]] as const){const r=runtime();assert.equal((await r.handler.applicationPilotRequest(request(body,headers))).status,status);assert.deepEqual(r.counters(),{checks:0,saves:0,auths:0})}
})
test('fresh owned Auth/RLS trip only; missing and foreign are indistinguishable',async()=>{
 let absent:unknown
 for(const [fault,status] of [['anonymous',401],['foreign',404],['missing',404],['database',503],['rate',429]] as const){const r=runtime(fault);const got=await r.handler.applicationPilotRequest(request({operation:'check',tripId:r.trip.id,revision:1}));assert.equal(got.status,status);assert.equal(r.counters().checks,0);if(fault==='foreign')absent=got;if(fault==='missing')assert.deepEqual(got,absent)}
 const r=runtime();assert.equal((await r.handler.applicationPilotRequest(request({operation:'check',tripId:r.trip.id,revision:2}))).status,409);assert.equal(r.counters().checks,0)
 assert.equal((await r.handler.applicationPilotRequest(request({operation:'save',tripId:r.trip.id,revision:1,mutationId:randomUUID(),declaration:fixtureDeclaration}))).status,200);assert.equal(r.counters().saves,1)
})
test('deadline settles hung work and closes its continuation before later side effects',async()=>{
 let resume!:()=>void,sideEffects=0
 const work=withinDeadline(new AbortController().signal,10,async signal=>{await new Promise<void>(r=>{resume=r});signal.throwIfAborted();sideEffects++;return true})
 await assert.rejects(work);resume();await new Promise(r=>setTimeout(r,1));assert.equal(sideEffects,0)
})
test('same-trip serialization preserves declaration; copying/import cannot transfer graph-bound context',()=>{
 const trip=fixtureTrip(),roundTrip=reiseSchema.parse(JSON.parse(JSON.stringify(trip)))
 assert.deepEqual(roundTrip.regulatoryContext,trip.regulatoryContext)
 assert(!('regulatoryContext' in alsNutzlast(trip)));assert(!('metadata' in alsNutzlast(trip)))
 assert(!pilotContextCurrent({...trip,id:randomUUID()}));assert(!pilotContextCurrent({...trip,revision:2}))
 assert.equal(reiseSchema.parse({...trip,regulatoryContext:undefined}).regulatoryContext,undefined)
})
test('deployed gate and extractor remain empty; production files never import local synthetic ports',()=>{
 const contract=readFileSync('lib/readiness/official-truth-ch-de-application-pilot-1/contract-server.ts','utf8')
 assert.match(contract,/contracts[^=]*= Object.freeze\(\[\]\)/);assert.match(contract,/applicationPilotEnabled\(\): boolean \{ return false \}/)
 for(const file of ['evaluate-server.ts','request-server.ts','database-server.ts','contract-server.ts','availability-server.ts'])assert.doesNotMatch(readFileSync(`lib/readiness/official-truth-ch-de-application-pilot-1/${file}`,'utf8'),/from\s+['"][^'"]*(?:scripts|fixtures)|process\.env/)
})

test('unprepared deployment blocks direct save AND check before Auth/database regardless of caller selectors',async()=>{
 assert.equal(applicationPilotAvailable(),false)
 for(const operation of ['save','check']) {
  const r=runtime('deployment-closed')
  const body={operation,tripId:r.trip.id,revision:1,...(operation==='save'?{mutationId:randomUUID(),declaration:fixtureDeclaration}:{})}
  const got=await r.handler.applicationPilotRequest(request(body,{'x-pilot-enabled':'true'}))
  assert.equal(got.status,503);assert.match(JSON.stringify(got.body),/Angaben können noch nicht gespeichert/)
  assert.deepEqual(r.counters(),{checks:0,saves:0,auths:0})
 }
})

test('interrupted submitted save is explicitly unconfirmed, never reported rolled back',async()=>{
 const r=runtime('save-interrupted')
 const got=await r.handler.applicationPilotRequest(request({operation:'save',tripId:r.trip.id,revision:1,mutationId:randomUUID(),declaration:fixtureDeclaration}))
 assert.equal(got.status,503);assert.match(JSON.stringify(got.body),/Bereits gestartete Speichervorgänge können abgeschlossen sein/)
 assert.match(JSON.stringify(got.body),/neu laden/);assert.equal(r.counters().saves,1)
})
