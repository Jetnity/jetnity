import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const proxyPfad = join(wurzel, 'proxy.ts')
const middlewarePfad = join(wurzel, 'middleware.ts')

describe('Next-16-Proxy bewahrt den fail-closed Auth-Rand', () => {
  const proxy = readFileSync(proxyPfad, 'utf8')

  test('middleware.ts ist nicht mehr die aktive Konvention', () => {
    assert.equal(existsSync(middlewarePfad), false)
    assert.match(proxy, /export async function proxy\(/)
    assert.equal(proxy.includes('export async function middleware('), false)
  })

  test('kein matcher, keine Runtime- und keine AAL-Produktlogik', () => {
    assert.equal(proxy.includes('export const config'), false)
    assert.equal(/matcher\s*:/.test(proxy), false)
    assert.equal(/export const runtime/.test(proxy), false)
    assert.equal(proxy.includes('evaluateAdminAccess'), false)
    assert.equal(proxy.includes('requireAdminApi'), false)
    assert.equal(proxy.includes('requireAdminPage'), false)
    assert.equal(proxy.includes("!pathname.startsWith('/admin/mfa')"), false)
  })

  test('Scope-Reihenfolge und Antworten bleiben dieselben', () => {
    const apiIndex = proxy.indexOf("pathname.startsWith('/api/admin')")
    const adminIndex = proxy.indexOf(
      "pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')",
    )
    const accountIndex = proxy.indexOf("pathname.startsWith('/account')")
    assert.ok(apiIndex > 0)
    assert.ok(adminIndex > apiIndex)
    assert.ok(accountIndex > adminIndex)
    assert.match(proxy, /jsonDenied\(401, 'unauthenticated', 'Nicht angemeldet\.'\)/)
    assert.match(proxy, /redirectToLogin\(req, '\/admin\/login'\)/)
    assert.match(proxy, /redirectToLogin\(req, '\/login'\)/)
    assert.match(
      proxy,
      /target\.searchParams\.set\('next', req\.nextUrl\.pathname \+ req\.nextUrl\.search\)/,
    )
  })

  test('Identität bleibt getUser, fail-closed und Cookie-Weitergabe', () => {
    assert.match(proxy, /supabase\.auth\.getUser\(\)/)
    assert.equal(proxy.includes('getSession()'), false)
    assert.match(proxy, /jsonDenied\(503, 'unconfigured'/)
    assert.match(proxy, /jsonDenied\(503, 'lookup-failed'/)
    assert.match(proxy, /WWW-Authenticate', 'Bearer'/)
    assert.match(proxy, /req\.cookies\.getAll\(\)/)
    assert.match(proxy, /res\.cookies\.set\(\{ name, value, \.\.\.options \}\)/)
    assert.match(proxy, /x-middleware-cache/)
  })
})
