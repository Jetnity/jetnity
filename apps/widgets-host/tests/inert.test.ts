import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import * as catchAll from '../app/[...slug]/route'
import * as discovercars from '../app/embed/discovercars/route'
import * as twelvego from '../app/embed/twelvego/route'
import * as rootRoute from '../app/route'
import { failClosed, INERT_BODY, INERT_HEADERS, INERT_STATUS, type ForgedContext } from '../lib/fail-closed'
import { originContractAllowsProviderScripts, SEPARATE_ORIGIN_CONTRACT } from '../lib/origin-contract'
import { proxy } from '../proxy'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
const ROUTES = [rootRoute, discovercars, twelvego, catchAll]

const PROBES: ForgedContext[] = [
  {},
  {
    method: 'POST',
    path: '/embed/discovercars',
    search: '?consent=1&load=1',
    host: 'widgets.jetnity.com',
    origin: 'https://jetnity.com',
    referer: 'https://jetnity.com/reisen',
    cookie: 'consent=1; probe=SYNTHETIC_COOKIE',
    authorization: 'Bearer SYNTHETIC_TOKEN',
  },
  {
    method: 'GET',
    path: '/<script>alert(1)</script>',
    search: '?q=<script>',
    host: 'evil.example',
    origin: 'null',
    referer: 'https://evil.example/phish',
    cookie: 'sb-access-token=SYNTHETIC_SESSION',
    authorization: 'Basic c3ludGhldGlj',
  },
]

async function assertInert(response: Response, probe: string) {
  assert.equal(response.status, INERT_STATUS)
  assert.equal(response.status, 404)
  const text = await response.text()
  assert.equal(text, INERT_BODY)
  assert.equal(text.includes(probe), false)
  assert.equal(/<script/i.test(text), false)
  assert.equal(/<iframe/i.test(text), false)
  assert.equal(/<form/i.test(text), false)
  assert.equal(/<button/i.test(text), false)
  assert.equal(/https?:\/\//i.test(text), false)
  assert.equal(text.includes('No provider is loaded.'), true)

  const dumped: string[] = []
  for (const [name, value] of response.headers.entries()) {
    dumped.push(`${name}: ${value}`)
    assert.equal(value.includes(probe), false)
    assert.notEqual(name.toLowerCase(), 'set-cookie')
    assert.notEqual(name.toLowerCase(), 'location')
    assert.equal(/access-control-allow-/i.test(name), false)
  }
  assert.equal(response.headers.getSetCookie().length, 0)
  assert.equal(dumped.join('\n').includes(probe), false)

  for (const [name, value] of Object.entries(INERT_HEADERS)) {
    assert.equal(response.headers.get(name), value)
  }
  const csp = response.headers.get('content-security-policy') ?? ''
  assert.match(csp, /default-src 'none'/)
  assert.match(csp, /frame-ancestors 'none'/)
  assert.match(csp, /form-action 'none'/)
  assert.match(csp, /base-uri 'none'/)
  assert.match(csp, /object-src 'none'/)
  assert.equal(csp.includes('unsafe-inline'), false)
  assert.equal(csp.includes('https:'), false)
  assert.equal((response.headers.get('permissions-policy') ?? '').includes('*'), false)
  assert.equal(response.headers.get('x-powered-by'), null)
}

test('failClosed ignores forged method, URL, Host, Origin, cookie and authorization', async () => {
  for (const probe of PROBES) {
    await assertInert(failClosed(probe), 'SYNTHETIC_COOKIE')
    await assertInert(failClosed(probe), 'SYNTHETIC_TOKEN')
    await assertInert(failClosed(probe), 'SYNTHETIC_SESSION')
  }
})

test('route handlers and proxy return the same inert response', async () => {
  for (const route of ROUTES) {
    for (const method of METHODS) {
      const response = route[method]()
      await assertInert(response, 'SYNTHETIC_COOKIE')
    }
  }
  const viaProxy = proxy({} as never)
  await assertInert(viaProxy, 'SYNTHETIC_COOKIE')
})

test('separate-origin contract blocks credential isolation and provider scripts', () => {
  assert.equal(SEPARATE_ORIGIN_CONTRACT.differentOrigins, true)
  assert.equal(SEPARATE_ORIGIN_CONTRACT.sameRegistrableSite, true)
  assert.equal(SEPARATE_ORIGIN_CONTRACT.parentCookieDomain, '.jetnity.com')
  assert.equal(SEPARATE_ORIGIN_CONTRACT.subdomainIsolatesCredentials, false)
  assert.equal(SEPARATE_ORIGIN_CONTRACT.sameOriginSandboxScripts, 'prohibited')
  assert.equal(SEPARATE_ORIGIN_CONTRACT.providerScripts, 'separately-gated')
  assert.equal(SEPARATE_ORIGIN_CONTRACT.frameAncestorsToday, 'none')
  assert.equal(SEPARATE_ORIGIN_CONTRACT.dnsActivation, 'no-go-until-cookie-and-consent-contracts-pass')
  assert.equal(SEPARATE_ORIGIN_CONTRACT.deployment, 'inert-fail-closed')
  assert.equal(originContractAllowsProviderScripts(), false)
})

test('production source scan', () => {
  const script = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../scripts/widgets-origin-foundation-1/source-scan.mjs',
  )
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8' })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
