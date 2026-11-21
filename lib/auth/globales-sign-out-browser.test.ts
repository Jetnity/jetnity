import assert from 'node:assert/strict'
import { test } from 'node:test'
import { signOutBrowserFallback } from './globales-sign-out-browser'
import { globalesSignOutFehler, type GlobalesSignOutErgebnis } from './globales-sign-out'

const failed: GlobalesSignOutErgebnis = { ok: false, fehler: globalesSignOutFehler('network') }

test('Server-side global logout failure is recovered only by successful browser GLOBAL revocation and cleared local session', async () => {
  const scopes: unknown[][] = []; const navigation: string[] = []
  const got = await signOutBrowserFallback(failed, {
    signOut: async (...args: unknown[]) => { scopes.push(args); return { error: null } },
    getSession: async () => ({ data: { session: null }, error: null }),
  }, '/', x => navigation.push(x))
  assert.deepEqual(scopes, [[]], 'never downscope to local or others')
  assert.deepEqual(got, { ok: true, ziel: '/' })
  assert.deepEqual(navigation, ['/'])
})

test('The admin logout keeps the fixed admin destination after verified browser fallback', async () => {
  const nav: string[] = []
  const result = await signOutBrowserFallback(failed, {
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  }, '/admin/login', x => nav.push(x))
  assert.deepEqual(result, { ok: true, ziel: '/admin/login' })
  assert.deepEqual(nav, ['/admin/login'])
})

test('Failed revoke, stale session, and failed verification never claim logout or navigate', async () => {
  for (const auth of [
    { signOut: async () => ({ error: new Error('no network') }), getSession: async () => ({ data: { session: null }, error: null }) },
    { signOut: async () => ({ error: null }), getSession: async () => ({ data: { session: { access_token: 'not-a-real-token' } }, error: null }) },
    { signOut: async () => ({ error: null }), getSession: async () => ({ data: { session: null }, error: new Error('read failed') }) },
    { signOut: async () => { throw Error('network') }, getSession: async () => ({ data: { session: null }, error: null }) },
  ]) {
    let navigations = 0
    const got = await signOutBrowserFallback(failed, auth, '/', () => { navigations += 1 })
    assert.deepEqual(got, failed)
    assert.equal(navigations, 0)
  }
})

test('Already-confirmed server result never duplicates browser signout', async () => {
  const got = await signOutBrowserFallback({ ok: true, ziel: '/' }, {
    signOut: async () => { throw Error('must not invoke') },
    getSession: async () => { throw Error('must not invoke') },
  }, '/', () => { throw Error('must not navigate') })
  assert.deepEqual(got, { ok: true, ziel: '/' })
})
