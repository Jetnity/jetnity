import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { fixtureTrip, fixtureDeclaration, fixtureContract, loadFixtureModule } from '../../../scripts/official-truth-ch-de-application-pilot-1/fixtures'
import type * as Database from './database-server'
import type * as TripData from '@/lib/trips/daten'
import { withinDeadline } from './deadline-server'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}
function database() {
  const client = deferred<unknown>(), reply = deferred<{ data: unknown; error: null }>()
  const trip = fixtureTrip(), mutationId = randomUUID()
  let clients = 0, calls = 0, reads = 0, sdkSignal: AbortSignal | undefined, context: unknown
  const db = { rpc(_name: string, args: { payload: { context?: unknown } }) {
    calls++; context = args.payload.context
    return { abortSignal(signal: AbortSignal) { sdkSignal = signal; return reply.promise } }
  } }
  const subject = loadFixtureModule<typeof Database>('lib/readiness/official-truth-ch-de-application-pilot-1/database-server.ts', {
    '@/lib/supabase/server': { createServerComponentClient: () => { clients++; return client.promise } },
    '@/lib/trips/daten': { reiseLaden: async (_id: string, signal: AbortSignal) => {
      assert.equal(signal, sdkSignal); assert(!signal.aborted); reads++
      return { problem: null, zeilen: [{ ...trip, revision: trip.revision+1, lastMutationId: mutationId, regulatoryContext: context }] }
    } },
  })
  return { module: subject, trip, mutationId, client, reply, db,
    counters: () => ({ clients, calls, reads }), signal: () => sdkSignal }
}
const turn = () => new Promise<void>(resolve => setImmediate(resolve))
const invoke = (r: ReturnType<typeof database>, operation: string, signal: AbortSignal) => operation==='save'
  ? r.module.saveDeclaration(r.trip, fixtureDeclaration, r.mutationId, signal)
  : r.module.pilotGrant(r.trip, operation==='reserve' ? null : randomUUID(), signal)

for (const operation of ['save','reserve','recheck']) for (const stop of ['deadline','cancel']) {
  test(`${operation}: deferred client released after ${stop} starts zero RPCs`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const r = database(), parent = new AbortController()
    let continuation!: Promise<unknown>
    const outer = withinDeadline(parent.signal, 17_000, signal => {
      continuation = invoke(r, operation, signal)
      return continuation
    })
    const rejected = assert.rejects(outer, /pilot_request_interrupted/)
    assert.equal(r.counters().clients,1)
    if(stop==='cancel') parent.abort(); else t.mock.timers.tick(17_000)
    await rejected
    r.client.resolve(r.db)
    await assert.rejects(continuation)
    assert.deepEqual(r.counters(),{ clients: 1, calls: 0, reads: 0 })
  })
}
for (const operation of ['save','reserve','recheck']) {
  test(`${operation}: timely control passes signal to SDK and completes`, async () => {
    const r = database(), signal = new AbortController().signal
    r.client.resolve(r.db)
    const work = invoke(r, operation, signal)
    await turn(); assert.equal(r.counters().calls,1); assert.equal(r.signal(),signal)
    r.reply.resolve({ data: { id: randomUUID(), contractId: fixtureContract.id, contractDigest: fixtureContract.digest, expiresAt: new Date(Date.now()+60_000).toISOString() }, error: null })
    assert(await work)
    assert.equal(r.counters().reads,operation==='save' ? 1 : 0)
  })
  test(`${operation}: already aborted starts no client; submitted RPC may settle but no later read/result`, async () => {
    const r = database(), controller = new AbortController()
    r.client.resolve(r.db)
    const work = invoke(r,operation,controller.signal), rejected = assert.rejects(work)
    await turn(); assert.equal(r.counters().calls,1)
    controller.abort(); assert(r.signal()!.aborted)
    // Simulate a write which committed despite transport cancellation. It must
    // not trigger readback in this dead request or be labelled rolled back.
    r.reply.resolve({ data: {}, error: null }); await rejected
    assert.equal(r.counters().reads,0)
    await assert.rejects(invoke(r,operation,controller.signal))
    assert.equal(r.counters().clients,1)
  })
}

test('trip readback waits for client, then respects cancellation before its query',async()=>{
  const client=deferred<unknown>(), controller=new AbortController(); let queries=0
  const subject=loadFixtureModule<typeof TripData>('lib/trips/daten.ts',{
    '@/lib/supabase/server':{createServerComponentClient:()=>client.promise},
  })
  const read=subject.reiseLaden(fixtureTrip().id,controller.signal),rejected=assert.rejects(read)
  controller.abort();client.resolve({from:()=>{queries++;assert.fail('late query')}})
  await rejected;assert.equal(queries,0)
})
test('cancelled canonical trip read cannot initiate a legacy fallback query',async()=>{
  const reply=deferred<unknown>(),controller=new AbortController();let queries=0
  const query={select:()=>query,eq:()=>query,limit:()=>query,abortSignal:(signal:AbortSignal)=>{assert.equal(signal,controller.signal);return reply.promise}}
  const subject=loadFixtureModule<typeof TripData>('lib/trips/daten.ts',{
    '@/lib/supabase/server':{createServerComponentClient:async()=>({from:()=>{queries++;return query}})},
  })
  const read=subject.reiseLaden(fixtureTrip().id,controller.signal),rejected=assert.rejects(read)
  await turn();assert.equal(queries,1);controller.abort()
  reply.resolve({data:null,error:{code:'PGRST200',message:"Could not find a relationship between 'trip_travellers' and 'trip_traveller_citizenships' in the schema cache"}})
  await rejected;assert.equal(queries,1)
})
