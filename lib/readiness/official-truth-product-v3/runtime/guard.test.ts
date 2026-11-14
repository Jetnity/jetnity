import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextRequest } from 'next/server'
import { DEV_GUARD_PATH, DEV_GUARD_REQUEST_BYTES, devGuardReceipt, readDevGuardRequest,
  readDevGuardReview, readDevGuardResult, readDevGuardText } from './guard-contract'

const DEV = 'https://yfvbxvijcorffwxbxahl.supabase.co', ORIGIN = 'https://offline-preview.vercel.app'
const ENV = { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM', VERCEL_GIT_REPO_OWNER: 'Jetnity',
  VERCEL_GIT_REPO_SLUG: 'jetnity', VERCEL_GIT_COMMIT_REF: 'feat/official-truth-human-method-ui-1-20261112' }
const operation = { schema: 1, intent: 'mutate', action: 'retire_unknown', operationId: 'op3_' + 'a'.repeat(32), selection: 'b'.repeat(64) } as const
const review = { schema: 1, status: 'reviewed', retirement: { status: 'unavailable' }, incident: { status: 'clear',
  selection: 'a'.repeat(64), generation: 0, methodEpoch: 1, proofFinished: null, validUntil: null, canResume: false } } as const
test('guard contract keeps exact reviewed selection, original operation and absent outcomes distinct', () => {
  assert.ok(readDevGuardRequest(operation)); assert.ok(readDevGuardReview(review))
  for (const extra of [{ sql: 'SELECT 1' }, { ownerId: 'private' }, { target: DEV }, { unknown: true }]) {
    assert.equal(readDevGuardRequest({ ...operation, ...extra }), null)
    assert.equal(readDevGuardReview({ ...review, ...extra }), null)
  }
  assert.equal(readDevGuardReview({ ...review, incident: { ...review.incident, canResume: true } }), null)
  const receipt = { schema: 1, status: 'recorded', action: operation.action, operationId: operation.operationId,
    selection: operation.selection, result: 'unknown_retired', recordedAt: '2026-11-14T01:00:00.000Z' }
  const result = devGuardReceipt(receipt, operation); assert.ok(result); assert.equal(result.status, 'recorded')
  assert.ok(readDevGuardResult(result, operation))
  assert.equal(devGuardReceipt({ ...receipt, selection: 'c'.repeat(64) }, operation), null)
  assert.equal(devGuardReceipt({ ...receipt, result: 'resumed' }, operation), null)
  assert.equal(devGuardReceipt({ schema: 1, status: 'absent' }, operation), null)
  const confirmation = { ...operation, intent: 'confirm' as const }
  assert.equal(devGuardReceipt(receipt, confirmation)?.status, 'confirmed')
  assert.equal(readDevGuardResult(result, confirmation), null)
  const absent = devGuardReceipt({ schema: 1, status: 'absent' }, confirmation)
  assert.ok(absent); assert.equal(absent.status, 'absent'); assert.ok(readDevGuardResult(absent, confirmation))
})
test('bounded UTF-8 request/reply reader joins cancellation and never converts partial bytes to a complete body', async () => {
  const signal = new AbortController().signal
  assert.equal(await readDevGuardText(new Response('x'.repeat(512)).body, signal, 512), 'x'.repeat(512))
  assert.equal(await readDevGuardText(new Response('x'.repeat(513)).body, signal, 512), null)
  assert.equal(await readDevGuardText(new Response(new Uint8Array([255])).body, signal, 512), null)
  let release!: () => void, settled = false, cancelling = false
  const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array(513)) },
    cancel() { cancelling = true; return new Promise<void>(resolve => { release = resolve }) } })
  const pending = readDevGuardText(stream, signal, 512).finally(() => { settled = true })
  while (!cancelling) await new Promise<void>(resolve => setImmediate(resolve))
  assert.equal(settled, false); release(); assert.equal(await pending, null)
})
test('real Proxy and guard POST check every fixed target and request boundary before Auth or mutation', async t => {
  Object.assign(process.env, ENV); process.env.ADMIN_ALLOWED_EMAILS = ''
  let target: string | undefined = DEV, role = 'owner', aal = 'aal2', user = true, rpcCalls = 0, authCalls = 0, proxyCalls = 0
  let held: Promise<void> | null = null, entered = false, serverThrows = false
  t.mock.method(console, 'warn', () => undefined); t.mock.method(console, 'error', () => undefined)
  t.mock.module('@supabase/ssr', { namedExports: { createServerClient() { proxyCalls++; return { auth: { async getUser() { return { data: { user: null }, error: null } } } } } } })
  t.mock.module(new URL('../../../supabase/server.ts', import.meta.url), { namedExports: {
    getServerSupabaseUrl: () => target,
    async createServerComponentClient() { authCalls++; return {
      auth: { async getUser() { return { data: { user: user ? { id: 'offline-owner' } : null }, error: null } },
        mfa: { async getAuthenticatorAssuranceLevel() { return { data: { currentLevel: aal, nextLevel: 'aal2' }, error: null } } } },
      from() { return { select() { return { eq() { return { async maybeSingle() { return { data: { role }, error: null } } } } } } } },
    } },
  } })
  t.mock.module(new URL('./guard-server.ts', import.meta.url), { namedExports: { async runDevGuardRequest() {
    rpcCalls++; entered = true; if (held) await held
    if (serverThrows) throw Error('PRIVATE_NEVER_RETURN')
    return { value: review, problem: null }
  } } })
  const route = await import('../../../../app/api/internal/readiness/ch-de-owner-guard/route')
  const { proxy } = await import('../../../../proxy')
  assert.equal(route.runtime, 'nodejs'); assert.equal(route.maxDuration, 30); assert.equal('GET' in route, false)
  const body = JSON.stringify({ schema: 1, intent: 'review' })
  function request(value: { body?: BodyInit; url?: string; headers?: HeadersInit; method?: string } = {}) {
    const headers = new Headers({ origin: ORIGIN, 'content-type': 'application/json' })
    for (const [k, v] of new Headers(value.headers)) headers.set(k, v)
    return new NextRequest(value.url ?? ORIGIN + DEV_GUARD_PATH, { method: value.method ?? 'POST', headers,
      body: value.method === 'GET' ? undefined : value.body ?? body })
  }
  async function invoke(req: NextRequest) {
    assert.equal((await proxy(req)).headers.get('x-middleware-next'), '1'); assert.equal(proxyCalls, 0)
    return route.POST(req)
  }
  async function refused(req: NextRequest, status: number) {
    const result = await invoke(req); assert.equal(result.status, status); assert.match(result.headers.get('cache-control')!, /no-store/)
    assert.equal(authCalls, 0); assert.equal(rpcCalls, 0)
  }
  for (const [k, v] of Object.entries(ENV)) {
    delete process.env[k]; await refused(request(), 503)
    process.env[k] = 'wrong'; await refused(request(), 503); process.env[k] = v
  }
  process.env.VERCEL_ENV = 'production'; await refused(request(), 503); process.env.VERCEL_ENV = 'preview'
  for (const wrong of [undefined, DEV + '/', 'https://qscbgcdmivbbnzrcyegn.supabase.co']) { target = wrong; await refused(request(), 503) }
  target = DEV
  for (const value of [request({ headers: { origin: 'https://other.invalid' } }), request({ headers: { 'content-type': 'text/plain' } }),
    request({ url: ORIGIN + DEV_GUARD_PATH + '?extra=1' }), request({ method: 'GET' }), request({ headers: { 'content-encoding': 'gzip' } }),
    request({ headers: { 'content-length': '9999' } }), request({ headers: { 'content-length': '01' } }),
    ...['', 'null', '[]', '{', body + ' ', '{"schema":1,"schema":1,"intent":"review"}', JSON.stringify({ ...operation, sql: 'SELECT 1' }),
      'x'.repeat(DEV_GUARD_REQUEST_BYTES + 1)].map(body => request({ body }))]) await refused(value, 400)
  user = false; assert.equal((await invoke(request())).status, 401); assert.equal(rpcCalls, 0); user = true
  for (const wrong of ['admin', 'moderator', 'user']) { role = wrong; assert.equal((await invoke(request())).status, 403); assert.equal(rpcCalls, 0) }
  role = 'owner'; aal = 'aal1'; assert.equal((await invoke(request())).status, 403); assert.equal(rpcCalls, 0); aal = 'aal2'
  let release!: () => void; held = new Promise<void>(resolve => { release = resolve }); let settled = false
  const pending = invoke(request()).finally(() => { settled = true })
  while (!entered) await new Promise<void>(resolve => setImmediate(resolve))
  assert.equal(settled, false); release(); assert.equal((await pending).status, 200); assert.equal(rpcCalls, 1)
  held = null; serverThrows = true; const failure = await invoke(request())
  assert.equal(failure.status, 503); assert.doesNotMatch(await failure.text(), /PRIVATE_NEVER_RETURN/)
})
