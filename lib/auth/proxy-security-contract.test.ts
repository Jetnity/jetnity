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
    assert.equal(/^export const config\b/m.test(proxy), false)
    assert.equal(/matcher\s*:\s*\[/.test(proxy), false)
    assert.equal(/^export const runtime\b/m.test(proxy), false)
    assert.equal(/from ['"][^'"]*admin-(?:guard|access|aal)['"]/.test(proxy), false)
    assert.equal(/\bevaluateAdminAccess\s*\(/.test(proxy), false)
    assert.equal(/\brequireAdminPage\s*\(/.test(proxy), false)
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
    assert.equal(/auth\.getSession\s*\(/.test(proxy), false)
    assert.match(proxy, /jsonDenied\(503, grund, 'Anmeldung derzeit nicht prüfbar\.'\)/)
    assert.match(proxy, /denyUnavailable\(req, pathname, 'unconfigured'\)/)
    assert.match(proxy, /denyUnavailable\(req, pathname, 'lookup-failed'\)/)
    assert.match(proxy, /authLookupFehlerIstSitzungFehlend\(error\)/)
    assert.match(proxy, /WWW-Authenticate', 'Bearer'/)
    assert.match(proxy, /req\.cookies\.getAll\(\)/)
    assert.match(proxy, /res\.cookies\.set\(\{ name, value, \.\.\.options \}\)/)
    assert.match(proxy, /x-middleware-cache/)
  })

  test('HTML-Ausfall ist unavailable/retry, nicht dieselbe Login-Weiterleitung', () => {
    assert.match(proxy, /function htmlDenied\(/)
    assert.match(proxy, /status: 503/)
    assert.match(proxy, /text\/html; charset=utf-8/)
    assert.match(proxy, /bedeutet nicht, dass du abgemeldet bist/)
    assert.match(proxy, /data-auth-lookup-action="retry"/)
    assert.equal(proxy.includes("? jsonDenied(503, 'unconfigured'"), false)
    assert.equal(proxy.includes(': scope.deny(req)'), false)
    assert.match(proxy, /if \(authLookupFehlerIstSitzungFehlend\(error\)\) return scope\.deny\(req\)/)
    assert.match(proxy, /if \(!user\) return scope\.deny\(req\)/)
  })
})
