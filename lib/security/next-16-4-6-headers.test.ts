import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const config = require('../../next.config.js') as {
  poweredByHeader?: boolean
  headers: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as {
  packages: Record<string, { version?: string; resolved?: string; integrity?: string;
    dependencies?: Record<string, string>; optionalDependencies?: Record<string, string> }>
}
const widgetPkg = JSON.parse(readFileSync('apps/widgets-host/package.json', 'utf8')) as {
  dependencies: Record<string, string>
}
const widgetLock = JSON.parse(readFileSync('apps/widgets-host/package-lock.json', 'utf8')) as typeof lock

test('Next.js patch 16.4.6 has compatible app and widget-host locks and verified npm tarball identities', () => {
  assert.equal(pkg.dependencies.next, '16.4.6')
  assert.equal(pkg.devDependencies['eslint-config-next'], '16.4.6')
  assert.equal(widgetPkg.dependencies.next, '16.4.6')
  const checks = [
    { key: 'node_modules/next', sri: 'sha512-QZJiYhaZLJMo2KpkQGQIwvmd79WVsAWeYIU554a8d7zArS3si/IRy3lBNV/rtYhE70oLwdLYhPAXLPx8HwcwtA==' },
    { key: 'node_modules/eslint-config-next', sri: 'sha512-IBGGrVf9E6pL0NGL0hmeicVGeSyv1VEzIWq6IecDqkw+YFByhEtDJS9u1r6s6a1VxK6rssh69KyNFQUgfaacqw==' },
  ]
  for (const { key, sri } of checks) {
    assert.equal(lock.packages[key]?.version, '16.4.6')
    assert.equal(lock.packages[key]?.integrity, sri)
  }
  for (const tree of [lock, widgetLock]) {
    for (const [key, value] of Object.entries(tree.packages)) {
      if (!/^node_modules\/(?:next$|eslint-config-next$|@next\/(?:env$|eslint-plugin-next$|swc-))/.test(key)) continue
      assert.equal(value.version, '16.4.6', key)
      assert.match(value.integrity ?? '', /^sha512-[A-Za-z0-9+/]+={0,2}$/, key)
      assert.match(value.resolved ?? '', /^https:\/\/registry\.npmjs\.org\//, key)
    }
    assert.equal(tree.packages['node_modules/next']?.dependencies?.['@next/env'], '16.4.6')
    assert.equal(tree.packages['node_modules/next']?.optionalDependencies?.['@next/swc-linux-x64-gnu'], '16.4.6')
  }
  assert.equal(lock.packages['node_modules/eslint-config-next']?.dependencies?.['@next/eslint-plugin-next'], '16.4.6')
})

test('page headers enforce bounded CSP while nonce-bearing provider/map API HTML keeps its own policy', async () => {
  assert.equal(config.poweredByHeader, false)
  const entries = await config.headers()
  const shared = entries.find(row => row.source === '/:path*')
  const page = entries.find(row => row.source === '/((?!api/|embed/).*)')
  assert.ok(shared && page)
  const values = Object.fromEntries(shared.headers.map(row => [row.key.toLowerCase(), row.value]))
  assert.equal(values['x-frame-options'], 'SAMEORIGIN')
  assert.equal(values['x-content-type-options'], 'nosniff')
  assert.equal(values['referrer-policy'], 'strict-origin-when-cross-origin')
  assert.match(values['permissions-policy'], /camera=\(\).*microphone=\(\).*geolocation=\(\)/)
  assert.equal(values['strict-transport-security'], 'max-age=31536000; includeSubDomains')
  assert.equal(values['x-powered-by'], undefined)
  const csp = page.headers.find(row => row.key === 'Content-Security-Policy')?.value
  assert.ok(csp)
  for (const token of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'self'",
    "form-action 'self'", "base-uri 'self'", "upgrade-insecure-requests"]) assert.ok(csp.includes(token), token)
  assert.doesNotMatch(csp, /'unsafe-eval'|script-src[^;]*\s\*\s/)
  assert.match(csp, /script-src[^;]*https:\/\/maps\.googleapis\.com/)
  assert.match(csp, /img-src[^;]*https:/)
  assert.match(csp, /frame-src[^;]*https:\/\/maps\.google\.com/)
  assert.match(csp, /frame-src[^;]*https:\/\/widget\.discovercars\.com/)
  // Incident 20.11.: page-level frame-src blocked both existing approved
  // cross-origin supplier frames, producing the browser's grey error pane.
  // Stay22 and the dedicated Flight Widget must be listed as exact hosts,
  // not a wildcard, while their own provider CSP/sandbox still applies.
  assert.match(csp, /frame-src[^;]*https:\/\/www\.stay22\.com(?:\s|;|$)/)
  assert.match(csp, /frame-src[^;]*https:\/\/jetnity-flight-widget\.vercel\.app(?:\s|;|$)/)
  const frameSrc = csp.split('; ').find(part => part.startsWith('frame-src ')) ?? ''
  assert.doesNotMatch(frameSrc, /https:\/\/\*|https:\/\/\*\./)
  assert.doesNotMatch(frameSrc, /https:\/\/tpwgts\.com|https:\/\/api\.openweathermap\.org/)
  assert.match(csp, /connect-src[^;]*https:\/\/[^;]*supabase\.co/)
  assert.match(csp, /worker-src 'self' blob:/)
  // These routes set stricter nonce/hash CSP themselves; global page policy
  // must not intersect with them and block Google Maps/Viator/GYG frames.
  assert.equal(page.source.includes('(?!api/|embed/)'), true)
  // Real map/GYG/Viator routes are /embed, not /api. Their CSP has a
  // request nonce/hash, and must not intersect the page hydration CSP.
  for (const path of ['lib/maps/frame.ts', 'lib/activities/getyourguide/dokument.ts',
    'lib/activities/viator-widget/dokument.ts']) {
    const source = readFileSync(path, 'utf8')
    assert.match(source, /['"](?:Content-Security-Policy|content-security-policy)['"]\s*:/)
  }
  assert.equal(shared.headers.some(row => row.key === 'Content-Security-Policy'), false)
})

test('the main Git push cannot trigger automatic Production deployment', () => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
    version: number; git?: { deploymentEnabled?: Record<string, boolean> }
    functions: Record<string, unknown>
  }
  assert.equal(vercel.git?.deploymentEnabled?.main, false)
  assert.equal(vercel.version, 2)
  assert.ok(vercel.functions['app/api/internal/readiness/ch-de-owner-guard/route.ts'])
  assert.ok(vercel.functions['app/api/internal/readiness/ch-de-prod-refresh/route.ts'])
})
