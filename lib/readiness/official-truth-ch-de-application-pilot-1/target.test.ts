import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
import { fixtureTrip, fixtureDeclaration, fixtureUserId, fixtureContract, fixtureRegistry, fixtureRetrieve, fixtureExtract, consumeOfficialTruthTrustedFactExecutionContext, loadFixtureModule } from '../../../scripts/official-truth-ch-de-application-pilot-1/fixtures'
import type * as Target from './target-server'
import type * as Database from './database-server'
import type * as Evaluation from './evaluate-server'
import type * as RequestHandler from './request-server'
import type * as Server from '@/lib/supabase/server'
import * as engine from '../engine'
import * as shippedContract from './contract-server'
import * as shippedAvailability from './availability-server'

const development = 'https://yfvbxvijcorffwxbxahl.supabase.co'
const production = 'https://qscbgcdmivbbnzrcyegn.supabase.co'
const preview = { VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_TARGET_ENV: 'preview',
  VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM', NEXT_PUBLIC_SUPABASE_URL: development }
const directory = 'lib/readiness/official-truth-ch-de-application-pilot-1/'
const unavailable = { status: 503, body: { message: 'Die CH–DE-Prüfung ist derzeit nicht verfügbar. Angaben können noch nicht gespeichert oder geprüft werden.' } }
const unconfirmed = { status: 503, body: { message: 'Die Anfrage konnte nicht bestätigt werden. Bereits gestartete Speichervorgänge können abgeschlossen sein. Bitte neu laden und Angaben prüfen.' } }
const mutationId = '88888888-8888-4888-8888-888888888888'
type Hook = (step: string) => void | Promise<void>

function setEnvironment(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}
function environment(t: TestContext) {
  const values = { ...preview, NODE_ENV: 'production' }
  const previous = Object.fromEntries(Object.keys(values).map(name => [name, process.env[name]]))
  for (const [name, value] of Object.entries(values)) setEnvironment(name, value)
  t.after(() => { for (const [name, value] of Object.entries(previous)) setEnvironment(name, value) })
}
function target(captured: string | undefined, current: string | undefined) {
  let clients = 0, cookies = 0
  setEnvironment('NEXT_PUBLIC_SUPABASE_URL', captured)
  // The actual shared module captures its URL. Its SDK and cookie ports cannot
  // make a network request or access a user session in this isolated fixture.
  const server = loadFixtureModule<typeof Server>('lib/supabase/server.ts', {
    '@supabase/ssr': { createServerClient: () => { clients++; assert.fail('guard constructed a client') } },
    'next/headers': { cookies: () => { cookies++; assert.fail('guard read cookies') } },
  })
  setEnvironment('NEXT_PUBLIC_SUPABASE_URL', current)
  const module = loadFixtureModule<typeof Target>(directory+'target-server.ts', { '@/lib/supabase/server': server })
  return { module, server, calls: () => ({ clients, cookies }) }
}
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(r => { resolve = r })
  return { promise, resolve }
}
function pauseAt(wanted: string) {
  const started = deferred(), release = deferred()
  const hook: Hook = step => { if (step === wanted) { started.resolve(); return release.promise } }
  return { hook, started: started.promise, release: release.resolve }
}
function grant() {
  return { id: '77777777-7777-4777-8777-777777777777', contractId: fixtureContract.id,
    contractDigest: fixtureContract.digest, expiresAt: new Date(Date.now()+120_000).toISOString() }
}

test('real no-argument target guard admits exact Preview/Development with production NODE_ENV and zero SDK/cookie calls', t => {
  environment(t)
  const r = target(development, development)
  assert.deepEqual(Object.keys(r.module), ['applicationPilotTargetAllowed'])
  assert.equal(r.module.applicationPilotTargetAllowed.length, 0)
  assert.equal(r.module.applicationPilotTargetAllowed(), true)
  assert.equal(r.server.getServerSupabaseUrl(), development)
  assert.deepEqual(r.calls(), { clients: 0, cookies: 0 })
})
const rejectedUrls: [string, string | undefined][] = [
  ['missing', undefined], ['empty', ''], ['malformed', 'not a URL'], ['HTTP', development.replace('https:', 'http:')],
  ['Production', production], ['foreign', 'https://foreign-project.supabase.co'],
  ['IPv4 loopback', 'http://127.0.0.1:54321'], ['IPv6 loopback', 'https://[::1]'], ['localhost', 'https://localhost'],
  ['suffix lookalike', development+'.evil.example'], ['prefix lookalike', development.replace('https://', 'https://evil.')],
  ['userinfo', development.replace('https://', 'https://user:password@')], ['userinfo with foreign host', development+'@evil.example'],
  ['explicit HTTPS port', development+':443'], ['foreign port', development+':5432'],
  ['slash path', development+'/'], ['path', development+'/rest/v1'], ['query', development+'?target=dev'],
  ['fragment', development+'#dev'], ['leading whitespace', ' '+development], ['trailing whitespace', development+' '],
  ['newline', development+'\n'], ['uppercase scheme', development.replace('https:', 'HTTPS:')],
  ['uppercase host', development.toUpperCase().replace('HTTPS:', 'https:')], ['encoded host', development.replace('yfv', '%79fv')],
]
for (const [name, url] of rejectedUrls) test(`target rejects ${name} in either captured or current URL`, t => {
  environment(t)
  for (const [captured, current] of [[url, development], [development, url], [url, url]]) {
    const r = target(captured, current)
    assert.equal(r.module.applicationPilotTargetAllowed(), false)
    assert.equal(Reflect.apply(r.module.applicationPilotTargetAllowed, null, [preview, development, true]), false)
    assert.deepEqual(r.calls(), { clients: 0, cookies: 0 })
  }
})
const rejectedContexts: [string, string | undefined][] = [
  ['VERCEL', undefined], ['VERCEL', ''], ['VERCEL', '0'], ['VERCEL', 'true'], ['VERCEL', ' 1'],
  ['VERCEL_ENV', undefined], ['VERCEL_ENV', 'production'], ['VERCEL_ENV', 'development'], ['VERCEL_ENV', 'staging'], ['VERCEL_ENV', 'Preview'],
  ['VERCEL_TARGET_ENV', undefined], ['VERCEL_TARGET_ENV', 'production'], ['VERCEL_TARGET_ENV', 'development'], ['VERCEL_TARGET_ENV', 'staging'],
  ['VERCEL_PROJECT_ID', undefined], ['VERCEL_PROJECT_ID', 'prj_other'], ['VERCEL_PROJECT_ID', preview.VERCEL_PROJECT_ID+' '],
]
for (const [name, value] of rejectedContexts) test(`target rejects ${name}=${String(value)}`, t => {
  environment(t)
  const r = target(development, development)
  setEnvironment(name, value)
  assert.equal(r.module.applicationPilotTargetAllowed(), false)
  assert.deepEqual(r.calls(), { clients: 0, cookies: 0 })
})
test('current process lookup is fresh while the actual SSR capture stays fixed', t => {
  environment(t)
  const r = target(development, development)
  assert.equal(r.module.applicationPilotTargetAllowed(), true)
  process.env.NEXT_PUBLIC_SUPABASE_URL = production
  assert.equal(r.server.getServerSupabaseUrl(), development)
  assert.equal(r.module.applicationPilotTargetAllowed(), false)
  process.env.NEXT_PUBLIC_SUPABASE_URL = development
  assert.equal(r.module.applicationPilotTargetAllowed(), true)
  process.env.VERCEL_TARGET_ENV = 'custom-pilot'
  assert.equal(r.module.applicationPilotTargetAllowed(), false)
})

function requestRuntime(targetModule: typeof Target, hook?: Hook, hardOff = false) {
  const trip = fixtureTrip(), calls: string[] = []
  const step = async (name: string) => { calls.push(name); await hook?.(name) }
  const module = loadFixtureModule<typeof RequestHandler>(directory+'request-server.ts', {
    './target-server': targetModule,
    './availability-server': hardOff ? shippedAvailability : { applicationPilotAvailable: () => true },
    '@/lib/supabase/server': { createServerComponentClient: async () => {
      await step('client')
      return { auth: { getUser: async () => { await step('auth'); return { data: { user: { id: fixtureUserId } }, error: null } } } }
    } },
    '@/lib/readiness/rate-limit': { readinessAnfrageErlaubt: async () => { await step('rate'); return { ok: true } } },
    '@/lib/trips/daten': { reiseLaden: async () => { await step('trip'); return { problem: null, zeilen: [trip] } } },
    './database-server': { saveDeclaration: async () => { await step('save'); return trip } },
    '@/lib/readiness/trip-official-evaluations-server': { tripOfficialPilotPruefen: async () => { await step('check'); return { status: 'unavailable' } } },
  })
  const invoke = (operation: 'save' | 'check', spoofHeaders = false) => module.applicationPilotRequest(new Request('https://pilot.example/api/readiness/ch-de-application?target=development', {
    method: 'POST', headers: { origin: 'https://pilot.example', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin',
      ...(spoofHeaders ? { 'x-supabase-url': development, 'x-vercel-env': 'preview', 'x-vercel-project-id': preview.VERCEL_PROJECT_ID } : {}) },
    body: JSON.stringify({ operation, tripId: trip.id, revision: trip.revision,
      ...(operation === 'save' ? { mutationId, declaration: fixtureDeclaration } : {}) }),
  }))
  return { invoke, calls }
}
function databaseRuntime(targetModule: typeof Target, hook?: Hook) {
  const trip = fixtureTrip(), calls: string[] = [], admitted = grant()
  let context: unknown
  const step = async (name: string) => { calls.push(name); await hook?.(name) }
  const module = loadFixtureModule<typeof Database>(directory+'database-server.ts', {
    './target-server': targetModule,
    '@/lib/supabase/server': { createServerComponentClient: async () => {
      await step('client')
      return { rpc: (_name: string, args: { payload: { context?: unknown } }) => {
        calls.push('rpc'); context = args.payload.context
        return { abortSignal: async (signal: AbortSignal) => { assert(!signal.aborted); await hook?.('rpc'); return { data: admitted, error: null } } }
      } }
    } },
    '@/lib/trips/daten': { reiseLaden: async () => {
      await step('read')
      return { problem: null, zeilen: [{ ...trip, revision: trip.revision+1, lastMutationId: mutationId, regulatoryContext: context }] }
    } },
  })
  const invoke = (operation: 'save' | 'reserve' | 'recheck') => operation === 'save'
    ? module.saveDeclaration(trip, fixtureDeclaration, mutationId, new AbortController().signal)
    : module.pilotGrant(trip, operation === 'reserve' ? null : admitted.id, new AbortController().signal)
  return { invoke, calls }
}
function evaluatorRuntime(targetModule: typeof Target, hook?: Hook, hardOff = false) {
  const trip = fixtureTrip(), calls: string[] = [], admitted = grant()
  let authorities = 0, catalogs = 0
  const step = (name: string) => { calls.push(name); return hook?.(name) }
  const module = loadFixtureModule<typeof Evaluation>(directory+'evaluate-server.ts', {
    './target-server': targetModule,
    './contract-server': hardOff ? shippedContract : { applicationPilotEnabled: () => true, applicationContract: () => fixtureContract },
    './database-server': { pilotGrant: async (_trip: unknown, id: string | null) => { await step(id === null ? 'reserve' : 'grant-recheck'); return admitted } },
    '@/lib/readiness/official-truth-fact-entry-authority-server': { loadOfficialTruthFactEntryAuthority: async () => {
      await step(++authorities === 1 ? 'authority' : 'authority-recheck')
      return { status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }
    } },
    '@/lib/readiness/official-truth-source-catalog-server': { quellenKatalogLesen: async () => {
      await step(++catalogs === 1 ? 'catalog' : 'catalog-recheck'); return { ok: true, registry: fixtureRegistry }
    } },
    '@/lib/readiness/official-truth-server-owned-retrieval': { loadOfficialTruthServerOwnedRetrieval: async () => {
      await step('retrieval'); return fixtureRetrieve()
    } },
    '@/lib/readiness/official-truth-trusted-fact-extractor-registry': {
      officialTruthTrustedFactExtrahieren: (input: unknown) => { calls.push('extract'); return fixtureExtract(input) },
      consumeOfficialTruthTrustedFactExecutionContext,
    },
    '@/lib/readiness/engine': { ...engine, requirementsFuerReise: async (...args: Parameters<typeof engine.requirementsFuerReise>) => {
      const result = await engine.requirementsFuerReise(...args); await step('requirements'); return result
    } },
    '@/lib/trips/daten': { reiseLaden: async () => { await step('trip-recheck'); return { problem: null, zeilen: [trip] } } },
  })
  return { invoke: () => module.evaluateApplicationPilot(trip, new AbortController().signal), calls }
}
function assertUnknown(result: Awaited<ReturnType<typeof Evaluation.evaluateApplicationPilot>>) {
  assert.equal(result.status, 'unavailable')
  assert.equal(result.expiresAt, null)
  assert(result.evaluations.every(row => row.result === 'unknown'))
}

for (const mismatch of ['captured-production', 'current-production', 'custom-preview', 'missing-context']) {
  test(`actual request, direct helpers and evaluator reject ${mismatch} before every downstream call`, async t => {
    environment(t)
    const r = target(mismatch === 'captured-production' ? production : development,
      mismatch === 'current-production' ? production : development)
    if (mismatch === 'custom-preview') process.env.VERCEL_TARGET_ENV = 'staging'
    if (mismatch === 'missing-context') delete process.env.VERCEL
    const request = requestRuntime(r.module), db = databaseRuntime(r.module), evaluator = evaluatorRuntime(r.module)
    for (const operation of ['save', 'check'] as const) assert.deepEqual(await request.invoke(operation, true), unavailable)
    for (const operation of ['save', 'reserve', 'recheck'] as const) assert.equal(await db.invoke(operation), null)
    assertUnknown(await evaluator.invoke())
    assert.deepEqual(request.calls, []); assert.deepEqual(db.calls, []); assert.deepEqual(evaluator.calls, [])
    assert.deepEqual(r.calls(), { clients: 0, cookies: 0 })
  })
}
test('exact target leaves actual shipped availability, enablement and contract selection closed', async t => {
  environment(t)
  const r = target(development, development)
  assert.equal(r.module.applicationPilotTargetAllowed(), true)
  assert.equal(shippedAvailability.applicationPilotAvailable(), false)
  assert.equal(shippedContract.applicationPilotEnabled(), false)
  assert.equal(shippedContract.applicationContract(fixtureContract.id, fixtureContract.digest), null)
  const request = requestRuntime(r.module, undefined, true), evaluator = evaluatorRuntime(r.module, undefined, true)
  assert.deepEqual(await request.invoke('save'), unavailable)
  assert.deepEqual(await request.invoke('check'), unavailable)
  const result = await evaluator.invoke()
  assert.equal(result.status, 'disabled'); assert(result.evaluations.every(row => row.result === 'unknown'))
  assert.deepEqual(request.calls, []); assert.deepEqual(evaluator.calls, [])
})
for (const operation of ['save', 'check'] as const) {
  const steps = ['client', 'auth', 'rate', 'trip', operation]
  test(`${operation} request timely control reaches its existing response`, async t => {
    environment(t)
    const r = requestRuntime(target(development, development).module)
    assert.equal((await r.invoke(operation)).status, 200)
    assert.deepEqual(r.calls, steps)
  })
  for (const stop of steps) test(`${operation} request target drift during ${stop} stops the next operation and success response`, async t => {
    environment(t)
    const pause = pauseAt(stop), r = requestRuntime(target(development, development).module, pause.hook)
    const work = r.invoke(operation)
    await pause.started; process.env.NEXT_PUBLIC_SUPABASE_URL = production; pause.release()
    assert.deepEqual(await work, stop === 'save' ? unconfirmed : unavailable)
    assert.deepEqual(r.calls, steps.slice(0, steps.indexOf(stop)+1))
  })
}
for (const operation of ['save', 'reserve', 'recheck'] as const) {
  const steps = operation === 'save' ? ['client', 'rpc', 'read'] : ['client', 'rpc']
  test(`direct ${operation} timely control completes on the exact target`, async t => {
    environment(t)
    const r = databaseRuntime(target(development, development).module)
    assert(await r.invoke(operation)); assert.deepEqual(r.calls, steps)
  })
  for (const stop of steps) test(`direct ${operation} target drift during ${stop} prevents further work and returns null`, async t => {
    environment(t)
    const pause = pauseAt(stop), r = databaseRuntime(target(development, development).module, pause.hook)
    const work = r.invoke(operation)
    await pause.started; process.env.NEXT_PUBLIC_SUPABASE_URL = production; pause.release()
    assert.equal(await work, null)
    assert.deepEqual(r.calls, steps.slice(0, steps.indexOf(stop)+1))
  })
}
const evaluationSteps = ['authority', 'reserve', 'catalog', 'retrieval', 'extract', 'requirements',
  'grant-recheck', 'authority-recheck', 'trip-recheck', 'catalog-recheck']
test('exact target positive control executes the canonical Evidence/Review/Rule chain and one visa result', async t => {
  environment(t)
  const r = evaluatorRuntime(target(development, development).module), result = await r.invoke()
  assert.equal(result.status, 'verified'); assert(result.expiresAt)
  assert.deepEqual(r.calls, evaluationSteps)
  assert.equal(result.evaluations.filter(row => row.result !== 'unknown').length, 1)
  const visa = result.evaluations.find(row => row.requirementType === 'visa')!
  assert.equal(visa.result, 'not_required'); assert.match(visa.evidence.authority!, /SYNTHETISCHE/)
  assert(visa.evidence.checkedAt)
  assert(result.evaluations.filter(row => row.requirementType !== 'visa').every(row => row.result === 'unknown'))
})
for (const stop of ['authority', 'reserve', 'catalog', 'retrieval', 'requirements']) {
  test(`evaluator target drift during ${stop} stops subsequent operations and verified output`, async t => {
    environment(t)
    const pause = pauseAt(stop), r = evaluatorRuntime(target(development, development).module, pause.hook)
    const work = r.invoke()
    await pause.started; process.env.NEXT_PUBLIC_SUPABASE_URL = production; pause.release()
    assertUnknown(await work)
    assert.deepEqual(r.calls, evaluationSteps.slice(0, evaluationSteps.indexOf(stop)+1))
  })
}
for (const stop of evaluationSteps.slice(6)) {
  test(`synchronous drift in final ${stop} prevents each later recheck from starting`, async t => {
    environment(t)
    const r = evaluatorRuntime(target(development, development).module, step => {
      if (step === stop) process.env.VERCEL_TARGET_ENV = 'staging'
    })
    assertUnknown(await r.invoke())
    assert.deepEqual(r.calls, evaluationSteps.slice(0, evaluationSteps.indexOf(stop)+1))
  })
  test(`deferred final ${stop} detects drift before publication; already started work is not labelled undone`, async t => {
    environment(t)
    const pause = pauseAt(stop), r = evaluatorRuntime(target(development, development).module, pause.hook)
    const work = r.invoke()
    await pause.started; process.env.NEXT_PUBLIC_SUPABASE_URL = production; pause.release()
    assertUnknown(await work)
    assert.deepEqual(r.calls, evaluationSteps)
  })
}
