#!/usr/bin/env node
// Rendered UsersTable proof for Admin user created-timestamp honesty.
// Rows are synthetic. Next router, next/link and role/status actions are stubs.
// This is not a signed-in Admin session and not Production acceptance.

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import esbuild from 'esbuild'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const EVIDENCE = join(REPO, 'docs/evidence/admin-user-created-timestamp-honesty-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'admin-user-created-timestamp-honesty-1-harness')
const BASELINE = process.argv.includes('--baseline')
const PAGE = join(REPO, 'app/(admin)/admin/users/page.tsx')
const TABLE = join(REPO, 'components/admin/UsersTable.tsx')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

function sourceFacts() {
  const page = readFileSync(PAGE, 'utf8')
  const table = readFileSync(TABLE, 'utf8')
  return {
    pageInventsNow: /created_at:\s*r\?\.created_at\s*\?\?\s*new Date\(\)\.toISOString\(\)/.test(page),
    pagePreservesNull: /created_at:\s*profilErstellt\(r\?\.created_at\)/.test(page),
    tableTypeNullable: /created_at:\s*string\s*\|\s*null/.test(table),
    tableUnknownMarker: /u\.created_at\s*\?\s*dtf\.format\(new Date\(u\.created_at\)\)\s*:\s*'—'/.test(table),
    lastSeenUnchanged: /u\.last_seen_at\s*\?\s*dtf\.format\(new Date\(u\.last_seen_at\)\)\s*:\s*'—'/.test(table),
  }
}

async function compileCss() {
  try {
    const postcss = (await import('postcss')).default
    const tailwindcss = (await import('tailwindcss')).default
    const nesting = (await import('tailwindcss/nesting/index.js')).default
    const autoprefixer = (await import('autoprefixer')).default
    const from = join(REPO, 'styles/globals.css')
    const input = readFileSync(from, 'utf8')
    const config = {
      ...require(join(REPO, 'tailwind.config.js')),
      content: [
        join(REPO, 'components/admin/UsersTable.tsx'),
        join(REPO, 'components/ui/**/*.{js,ts,jsx,tsx}'),
        join(EVIDENCE, 'harness.tsx'),
      ],
    }
    const result = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(input, { from })
    return result.css
  } catch (error) {
    return `body{font-family:sans-serif;margin:0}[hidden]{display:none}/* css fallback: ${String(error)} */`
  }
}

async function bundleHarness() {
  const outfile = join(OUT, 'harness.js')
  await esbuild.build({
    absWorkingDir: REPO,
    entryPoints: [join(EVIDENCE, 'harness.tsx')],
    outfile,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    sourcemap: false,
    logLevel: 'silent',
    alias: {
      '@': REPO,
      'next/navigation': join(EVIDENCE, 'stubs/next-navigation.ts'),
      'next/link': join(EVIDENCE, 'stubs/next-link.tsx'),
      '@/app/(admin)/admin/users/actions': join(EVIDENCE, 'stubs/actions.ts'),
      'server-only': join(EVIDENCE, 'stubs/server-only.ts'),
    },
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  })
  return readFileSync(outfile, 'utf8')
}

function htmlSeite(css, script, mode) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin user created timestamp harness</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script>window.__createdHonestyMode = ${JSON.stringify(mode)}</script>
  <script>${script}</script>
</body>
</html>`
}

function serve(css, script, mode) {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(htmlSeite(css, script, mode))
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({ server, origin: `http://127.0.0.1:${port}` })
    })
  })
}

async function readHarness(page) {
  await page.waitForFunction(() => window.__createdHonesty?.ready === true)
  await page.waitForTimeout(700)
  return page.evaluate(() => {
    const api = window.__createdHonesty
    return {
      mode: api.mode,
      inventedIso: api.inventedIso,
      realCreatedAt: api.realCreatedAt,
      realLastSeenAt: api.realLastSeenAt,
      formattedInvented: api.formattedInvented,
      formattedRealCreated: api.formattedRealCreated,
      formattedRealLastSeen: api.formattedRealLastSeen,
      formattedEpoch: api.formattedEpoch,
      formattedNow: api.formattedNow,
      timeZone: api.timeZone,
      rows: api.rows(),
      replaces: api.replaces(),
      actionCalls: api.actionCalls(),
      searchValue: api.searchValue(),
      pageText: api.pageText(),
      capturedAt: new Date().toISOString(),
    }
  })
}

function assertCommon(view) {
  assert.equal(view.searchValue, '')
  assert.equal(view.pageText, '1 / 1')
  assert.deepEqual(view.replaces, [])
  assert.deepEqual(view.actionCalls, [])
  assert.equal(view.rows.length, 2)
}

async function main() {
  const facts = sourceFacts()
  const css = await compileCss()
  const script = await bundleHarness()
  const mode = BASELINE ? 'baseline' : 'fixed'
  const { server, origin } = await serve(css, script, mode)
  const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] }
  const browser = await chromium.launch({
    ...launchOptions,
    executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
  }).catch(() => chromium.launch(launchOptions))
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const errors = []
    page.on('pageerror', (error) => errors.push(String(error)))
    await page.goto(origin, { waitUntil: 'networkidle' })
    const view = await readHarness(page)
    assert.deepEqual(errors, [])
    assertCommon(view)

    const shotName = BASELINE ? 'before-desktop.png' : 'after-desktop.png'
    const shotPath = join(EVIDENCE, shotName)
    const artifactPath = join(ARTIFACTS, shotName)
    await page.locator('table').screenshot({ path: shotPath })
    await page.locator('table').screenshot({ path: artifactPath })

    if (BASELINE) {
      assert.equal(facts.pageInventsNow, true)
      assert.equal(view.mode, 'baseline')
      const inventedAt = Date.parse(view.inventedIso)
      const capturedAt = Date.parse(view.capturedAt)
      assert.equal(Number.isNaN(inventedAt), false)
      assert.ok(Math.abs(capturedAt - inventedAt) < 5000)
      assert.equal(view.rows[0].created, view.formattedInvented)
      assert.equal(view.rows[0].lastSeen, '—')
      assert.equal(view.rows[1].created, view.formattedRealCreated)
      assert.equal(view.rows[1].lastSeen, view.formattedRealLastSeen)
      assert.notEqual(view.rows[0].created, view.rows[1].created)
      const record = {
        mode: 'baseline',
        limitation: 'Synthetic rows only. The baseline row receives the historical mapper output null ?? new Date().toISOString() directly, because the server page is not executed. Not a signed-in Admin session.',
        source: facts,
        view,
        nodeBaseline: {
          expression: 'null ?? new Date().toISOString()',
          value: null ?? new Date().toISOString(),
          at: new Date().toISOString(),
        },
      }
      writeFileSync(join(EVIDENCE, 'before.json'), `${JSON.stringify(record, null, 2)}\n`)
      console.log(JSON.stringify({ ok: true, mode, created: view.rows.map((row) => row.created), shot: shotPath }, null, 2))
      return
    }

    const { profilErstellt } = await import(pathToFileURL(join(REPO, 'lib/admin/profil-erstellt.ts')).href)
    assert.equal(profilErstellt(null), null)
    assert.equal(profilErstellt(undefined), null)
    assert.equal(profilErstellt(view.realCreatedAt), view.realCreatedAt)
    assert.equal(facts.pageInventsNow, false)
    assert.equal(facts.pagePreservesNull, true)
    assert.equal(facts.tableTypeNullable, true)
    assert.equal(facts.tableUnknownMarker, true)
    assert.equal(facts.lastSeenUnchanged, true)
    assert.equal(view.mode, 'fixed')
    assert.equal(view.rows[0].name, 'Unknown creation')
    assert.equal(view.rows[0].created, '—')
    assert.notEqual(view.rows[0].created, view.formattedEpoch)
    assert.notEqual(view.rows[0].created, view.formattedNow)
    assert.notEqual(view.rows[0].created, view.formattedInvented)
    assert.equal(view.rows[0].lastSeen, view.formattedRealLastSeen)
    assert.equal(view.rows[1].created, view.formattedRealCreated)
    assert.notEqual(view.rows[1].created, view.formattedNow)
    assert.equal(view.rows[1].lastSeen, '—')
    const record = {
      mode: 'fixed',
      limitation: 'Synthetic rows rendered through the real UsersTable. The server page mapper is checked as source plus profilErstellt(). Not a signed-in Admin session and not Production data.',
      mapper: {
        null: profilErstellt(null),
        undefined: profilErstellt(undefined),
        real: profilErstellt(view.realCreatedAt),
        emptyString: profilErstellt(''),
      },
      source: facts,
      view,
    }
    writeFileSync(join(EVIDENCE, 'after.json'), `${JSON.stringify(record, null, 2)}\n`)
    console.log(JSON.stringify({
      ok: true,
      mode,
      created: view.rows.map((row) => row.created),
      lastSeen: view.rows.map((row) => row.lastSeen),
      shot: shotPath,
    }, null, 2))
  } finally {
    await browser.close()
    server.close()
  }
}

await main()
