import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DEV_GUARD_PATH } from './guard-contract'

const PRODUCTION = 'https://qscbgcdmivbbnzrcyegn.supabase.co'
const DEV = 'https://yfvbxvijcorffwxbxahl.supabase.co'
const ORIGIN = 'https://jetnity.com'
const ENV = { VERCEL_ENV: 'production', VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
  VERCEL_GIT_REPO_OWNER: 'Jetnity', VERCEL_GIT_REPO_SLUG: 'jetnity', VERCEL_GIT_COMMIT_REF: 'main' }
const operation = { schema: 1, intent: 'mutate', action: 'resume', operationId: 'op3_' + 'a'.repeat(32), selection: 'b'.repeat(64) } as const
const review = { schema: 1, status: 'reviewed', retirement: { status: 'unavailable' }, incident: { status: 'blocked',
  selection: operation.selection, generation: 1, methodEpoch: 1,
  proofFinished: '2026-11-15T22:10:01.000Z', validUntil: '2026-11-15T22:15:30.000Z', canResume: true } } as const
const receipt = { schema: 1, status: 'recorded', action: operation.action, operationId: operation.operationId,
  selection: operation.selection, result: 'resumed', generation: 1, recordedAt: '2026-11-15T22:11:01.000Z' } as const

test('Production recovery keeps the exact release, real Owner/AAL2 gate and original guarded RPC protocol', async t => {
  const previous = Object.fromEntries([...Object.keys(ENV), 'ADMIN_ALLOWED_EMAILS'].map(key => [key, process.env[key]]))
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value } })
  Object.assign(process.env, ENV); process.env.ADMIN_ALLOWED_EMAILS = ''
  let target: string | undefined = PRODUCTION, role = 'owner', aal = 'aal2', user = true, clientCalls = 0
  let failure: 'none' | 'lost' | 'wrong-receipt' | 'absent' | 'denied' = 'none'
  const calls: { name: string; args: Record<string, unknown> }[] = []
  t.mock.method(console, 'warn', () => undefined); t.mock.method(console, 'error', () => undefined)
  t.mock.module(new URL('../../../supabase/server.ts', import.meta.url), { namedExports: {
    getServerSupabaseUrl: () => target,
    async createServerComponentClient() {
      clientCalls++
      return {
        auth: { async getUser() { return { data: { user: user ? { id: 'offline-owner', email: 'owner@example.org' } : null }, error: null } },
          mfa: { async getAuthenticatorAssuranceLevel() { return { data: { currentLevel: aal, nextLevel: 'aal2' }, error: null } } } },
        from() { return { select() { return { eq() { return { async maybeSingle() { return { data: { role }, error: null } } } } } } } },
        rpc(name: string, args: Record<string, unknown>) {
          calls.push({ name, args })
          return { async abortSignal(signal: AbortSignal) {
            assert.equal(signal.aborted, false)
            if (failure === 'lost') throw Error('PRIVATE_DATABASE_RESPONSE_LOST')
            if (failure === 'denied') return { data: null, error: { code: '42501', message: 'PRIVATE_DATABASE_DENIAL' }, status: 403 }
            return { data: name === 'official_v3_guard_review_v1' ? review
              : failure === 'wrong-receipt' ? { ...receipt, selection: 'c'.repeat(64) }
              : failure === 'absent' ? { schema: 1, status: 'absent' } : receipt, error: null, status: 200 }
          } }
        },
      }
    },
  } })
  const route = await import('../../../../app/api/internal/readiness/ch-de-owner-guard/route')
  const { runDevGuardRequest } = await import('./guard-server')
  const { default: Page } = await import('../../../../app/(public)/einreise/betrieb/page')
  const request = (body: unknown = { schema: 1, intent: 'review' }) => new Request(ORIGIN + DEV_GUARD_PATH,
    { method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const reset = () => { clientCalls = 0; calls.length = 0 }

  for (const [key, expected] of Object.entries(ENV)) {
    for (const wrong of [undefined, 'wrong']) {
      if (wrong === undefined) delete process.env[key]; else process.env[key] = wrong
      assert.equal((await route.POST(request())).status, 503, key)
      assert.equal((await runDevGuardRequest(operation, new AbortController().signal)).problem?.status, 503, key)
      assert.equal(clientCalls, 0, 'wrong release fails before authentication or RPC')
    }
    process.env[key] = expected
  }
  for (const wrong of [undefined, DEV, PRODUCTION + '/', 'https://other.supabase.co']) {
    target = wrong
    assert.equal((await route.POST(request())).status, 503)
    assert.equal((await runDevGuardRequest(operation, new AbortController().signal)).problem?.status, 503)
    assert.equal(clientCalls, 0)
  }
  target = PRODUCTION
  for (const intent of ['mutate', 'confirm'] as const) {
    const retire = { ...operation, intent, action: 'retire_unknown' as const }
    assert.equal((await route.POST(request(retire))).status, 403)
    assert.equal((await runDevGuardRequest(retire, new AbortController().signal)).problem?.status, 503)
    assert.equal(clientCalls, 0, 'Production has no source-retirement adapter')
  }
  for (const extra of [{ target: DEV }, { ownerId: 'pretend-owner' }, { aal: 'aal2' }, { force: true }]) {
    assert.equal((await route.POST(request({ ...operation, ...extra }))).status, 400)
    assert.equal(clientCalls, 0)
  }

  user = false
  assert.equal((await route.POST(request())).status, 401)
  await assert.rejects(Page, /NEXT_REDIRECT/)
  assert.equal(calls.length, 0); user = true
  for (const wrong of ['admin', 'moderator', 'user']) {
    role = wrong
    assert.equal((await route.POST(request(operation))).status, 403)
    await assert.rejects(Page, /NEXT_REDIRECT/)
    assert.equal(calls.length, 0)
  }
  process.env.ADMIN_ALLOWED_EMAILS = 'owner@example.org'
  assert.equal((await route.POST(request(operation))).status, 403, 'break-glass never replaces the Owner role')
  await assert.rejects(Page, /NEXT_REDIRECT/)
  process.env.ADMIN_ALLOWED_EMAILS = ''; role = 'owner'; aal = 'aal1'
  assert.equal((await route.POST(request(operation))).status, 403)
  await assert.rejects(Page, /NEXT_REDIRECT/)
  assert.equal(calls.length, 0); aal = 'aal2'; reset()

  const reviewed = await route.POST(request())
  assert.equal(reviewed.status, 200); assert.deepEqual(await reviewed.json(), review)
  assert.match(reviewed.headers.get('cache-control')!, /no-store/)
  assert.deepEqual(calls, [{ name: 'official_v3_guard_review_v1', args: {} }]); reset()
  const recorded = await route.POST(request(operation))
  assert.equal(recorded.status, 200); assert.equal((await recorded.json()).status, 'recorded')
  const confirmed = await route.POST(request({ ...operation, intent: 'confirm' }))
  assert.equal(confirmed.status, 200); assert.equal((await confirmed.json()).status, 'confirmed')
  assert.deepEqual(calls, [
    { name: 'official_v3_guard_resume_v1', args: { p_operation_id: operation.operationId, p_selection: operation.selection } },
    { name: 'official_v3_guard_confirm_v1', args: { p_operation_id: operation.operationId, p_selection: operation.selection, p_action: 'resume' } },
  ]); reset()

  for (const problem of ['lost', 'wrong-receipt', 'denied'] as const) {
    failure = problem
    const unresolved = await route.POST(request(operation))
    assert.notEqual(unresolved.status, 200); assert.doesNotMatch(await unresolved.text(), /PRIVATE_/)
    assert.equal(calls.length, 1, 'uncertain outcome never retries the mutation')
    failure = 'none'
    const sameOriginal = await route.POST(request({ ...operation, intent: 'confirm' }))
    assert.equal((await sameOriginal.json()).status, 'confirmed')
    assert.deepEqual(calls[1], { name: 'official_v3_guard_confirm_v1', args: {
      p_operation_id: operation.operationId, p_selection: operation.selection, p_action: 'resume',
    } }); reset()
  }
  failure = 'absent'
  const absent = await route.POST(request({ ...operation, intent: 'confirm' }))
  assert.equal((await absent.json()).status, 'absent', 'an absent receipt is not a confirmed rollback or recovery')
  failure = 'none'; reset()
  const aborted = new AbortController(); aborted.abort()
  assert.equal((await runDevGuardRequest(operation, aborted.signal)).problem?.status, 503)
  assert.equal(calls.length, 0)

  const html = renderToStaticMarkup(await Page())
  assert.match(html, /Gespeicherten Production-Stand lesen/)
  assert.match(html, /Zur Besucheransicht/)
  assert.equal(calls.length, 0, 'opening the protected page performs no guard RPC')
  target = DEV
  const unavailable = renderToStaticMarkup(await Page())
  assert.match(unavailable, /Production-Wiederaufnahme ist hier nicht verfügbar/)
  assert.doesNotMatch(unavailable, /Gespeicherten Production-Stand lesen/)
  assert.equal(calls.length, 0)
})

test('Production recovery panel starts with an explicit read and never starts work while rendering', async t => {
  let requests = 0
  t.mock.method(globalThis, 'fetch', async () => { requests++; throw Error('unexpected network') })
  const { default: Panel } = await import('../../../../components/readiness/ProductionGuardRecoveryPanel')
  const html = renderToStaticMarkup(createElement(Panel))
  assert.match(html, /Gespeicherten Production-Stand lesen/)
  assert.match(html, /Eine Wiederaufnahme erfolgt nur durch deinen Klick/)
  assert.match(html, /aria-live="polite"/)
  assert.doesNotMatch(html, /Abgelaufenen Quellenversuch schliessen|op3_[a-f0-9]{32}/)
  assert.equal(requests, 0)
})
