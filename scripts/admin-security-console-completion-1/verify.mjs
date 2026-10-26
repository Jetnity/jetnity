#!/usr/bin/env node
// Mounted SecurityWidget proof for Admin Security Console Completion 1.
// Synthetic fixtures only. External requests are aborted. This is not a
// signed-in admin session, not a physical device, and not production acceptance.

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import esbuild from 'esbuild'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const EVIDENCE = join(REPO, 'docs/evidence/admin-security-console-completion-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'admin-security-console-completion-1')
const FROZEN = new Date('2026-10-26T12:00:00.000Z')
const NOW = FROZEN.toISOString()
const PERIOD = 'Keine aufgezeichneten Events in diesem Zeitraum.'
const FILTER = 'Keine aufgezeichneten Events passen zu diesem Filter.'
const SECRET = 'raw-server-stack-should-not-render'

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

const report = []

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function eventRow(id, ip, detail, type = 'note', created_at = NOW) {
  return { id, created_at, ip, type, user_id: null, detail }
}

function blockRow(ip, reason = 'synthetic') {
  return { ip, reason, created_at: NOW }
}

function payload(events, blocklist = []) {
  return { events, blocklist }
}

async function compileCss() {
  const postcss = (await import('postcss')).default
  const tailwindcss = (await import('tailwindcss')).default
  const nesting = (await import('tailwindcss/nesting/index.js')).default
  const autoprefixer = (await import('autoprefixer')).default
  const from = join(REPO, 'styles/globals.css')
  const config = {
    ...require(join(REPO, 'tailwind.config.js')),
    content: [
      join(REPO, 'components/admin/security/**/*.{js,ts,jsx,tsx}'),
      join(REPO, 'components/admin/Ladezustand.tsx'),
      join(REPO, 'components/admin/home/AdminEvidenceDetails.tsx'),
      join(REPO, 'components/ui/**/*.{js,ts,jsx,tsx}'),
      join(REPO, 'scripts/admin-security-console-completion-1/harness.tsx'),
    ],
  }
  const result = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(readFileSync(from, 'utf8'), {
    from,
  })
  return result.css
}

async function bundleHarness() {
  const outfile = join(OUT, 'harness.js')
  await esbuild.build({
    absWorkingDir: REPO,
    entryPoints: [join(REPO, 'scripts/admin-security-console-completion-1/harness.tsx')],
    outfile,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    logLevel: 'silent',
    alias: {
      '@': REPO,
      'server-only': join(REPO, 'scripts/admin-security-console-completion-1/server-only-stub.ts'),
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    plugins: [
      {
        name: 'security-css-module',
        setup(build) {
          build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
            const css = readFileSync(args.path, 'utf8')
            const names = [...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1])
            const fields = [...new Set(names)].map((name) => `${JSON.stringify(name)}:${JSON.stringify(name)}`).join(',')
            return {
              contents: `const css=${JSON.stringify(css)};if(!document.getElementById('security-widget-local-css')){const style=document.createElement('style');style.id='security-widget-local-css';style.textContent=css;document.head.appendChild(style);}export default {${fields}};`,
              loader: 'js',
            }
          })
        },
      },
    ],
  })
  return readFileSync(outfile, 'utf8')
}

function htmlSeite(css, script) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin security console completion harness</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.__intervalMarks = []
    const nativeSetInterval = window.setInterval.bind(window)
    window.setInterval = (fn, ms, ...args) => {
      window.__intervalMarks.push({ ms })
      return nativeSetInterval(fn, ms, ...args)
    }
  </script>
  <script>${script}</script>
</body>
</html>`
}

function serve(css, script) {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(htmlSeite(css, script))
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({ server, origin: `http://127.0.0.1:${port}` })
    })
  })
}

async function oeffnen(browser, origin, aborted, viewport = { width: 1280, height: 900 }) {
  const page = await browser.newPage({ viewport })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  await page.clock.install({ time: FROZEN })
  await page.route('**/*', (route) => {
    const url = route.request().url()
    if (url.startsWith(origin)) {
      route.continue()
      return
    }
    aborted.push(url)
    route.abort('blockedbyclient')
  })
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__securityAudit?.ready === true)
  await page.waitForFunction(() => window.__securityAudit.pending().some((call) => call.method === 'GET'))
  return { page, consoleErrors, pageErrors }
}

async function stand(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-security-read-state]')
    const alert = document.querySelector('[role="alert"]')
    const kpis = [...document.querySelectorAll('[data-security-kpi]')].map((node) => ({
      label: node.getAttribute('data-security-kpi'),
      value: node.getAttribute('data-security-kpi-value'),
    }))
    const operations = [...document.querySelectorAll('[data-security-operation-ip]')].map((node) => ({
      ip: node.getAttribute('data-security-operation-ip'),
      state: node.getAttribute('data-security-operation-state'),
      action: node.getAttribute('data-security-operation-action'),
      text: node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    }))
    return {
      state: root?.getAttribute('data-security-read-state') ?? null,
      writes: root?.getAttribute('data-security-writes') ?? null,
      note: document.querySelector('[data-security-read-note]')?.getAttribute('data-security-read-note') ?? null,
      alert: alert?.innerText?.replace(/\s+/g, ' ').trim() ?? null,
      eventsBound: document.querySelector('[data-security-read-bound="events"]')?.textContent?.trim() ?? null,
      blockBound: document.querySelector('[data-security-read-bound="blocklist"]')?.textContent?.trim() ?? null,
      eventLeer: document.querySelector('[data-security-events-leer]')?.getAttribute('data-security-events-leer') ?? null,
      kpis,
      operations,
      filter: document.querySelector('[aria-label="Aufgezeichnete Ereignisse durchsuchen"]')?.value ?? null,
      ip: document.querySelector('#blocklist-ip')?.value ?? null,
      reason: document.querySelector('#blocklist-grund')?.value ?? null,
      focus: document.activeElement?.id || document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim() || null,
      text: document.body.innerText,
      calls: window.__securityAudit.calls(),
      pending: window.__securityAudit.pending(),
      intervals: window.__securityAudit.intervals(),
    }
  })
}

function lists(calls) {
  return calls.filter((call) => call.method === 'GET' && call.url.includes('/api/admin/security/list'))
}

function posts(calls) {
  return calls.filter((call) => call.method === 'POST')
}

async function release(page, id, status, body) {
  await page.evaluate(({ id, status, body }) => window.__securityAudit.release(id, status, body), { id, status, body })
}

async function fail(page, id) {
  await page.evaluate((id) => window.__securityAudit.fail(id), id)
}

async function warteZustand(page, state) {
  await page.waitForFunction((value) => document.querySelector('[data-security-read-state]')?.getAttribute('data-security-read-state') === value, state)
}

async function ersteAntwort(page, body, status = 200) {
  const vorher = await stand(page)
  const lesung = vorher.pending.find((call) => call.method === 'GET')
  assert.ok(lesung)
  await release(page, lesung.id, status, body)
  return lesung
}

async function explizit(page) {
  const vorher = lists((await stand(page)).calls).length
  await page.getByRole('button', { name: 'Aktualisieren' }).click()
  await page.waitForFunction(
    (expected) => window.__securityAudit.calls().filter((call) => call.method === 'GET').length >= expected,
    vorher + 1,
  )
  const jetzt = await stand(page)
  const offen = jetzt.pending.filter((call) => call.method === 'GET')
  assert.ok(offen.length >= 1)
  return offen[offen.length - 1]
}

async function shot(page, name) {
  for (const target of [join(ARTIFACTS, name), join(EVIDENCE, name)]) {
    await page.screenshot({ path: target, fullPage: true })
  }
}

function merke(name, wert) {
  report.push({ name, ...wert })
  console.log(JSON.stringify({ name, ok: true }))
}

async function fall(browser, origin, aborted, name, fn, viewport) {
  const geoeffnet = await oeffnen(browser, origin, aborted, viewport)
  try {
    const wert = await fn(geoeffnet.page)
    assert.deepEqual(geoeffnet.pageErrors, [], `${name} pageerror`)
    merke(name, { ok: true, ...wert, consoleErrors: geoeffnet.consoleErrors })
  } finally {
    await geoeffnet.page.close()
  }
}

async function main() {
  const css = await compileCss()
  const script = await bundleHarness()
  const { server, origin } = await serve(css, script)
  const aborted = []
  const browser = await chromium.launch({ headless: true })
  try {
    await fall(browser, origin, aborted, 'valid-401-503-recovery', async (page) => {
      await ersteAntwort(page, payload([eventRow('evt-valid', '203.0.113.10', 'synthetic-valid-row', 'login_failed')]))
      await warteZustand(page, 'angenommen')
      assert.match((await stand(page)).text, /synthetic-valid-row/)
      const denial = await explizit(page)
      await release(page, denial.id, 401, { error: SECRET })
      await warteZustand(page, 'verweigert')
      let nachDenial = await stand(page)
      assert.equal(nachDenial.text.includes('synthetic-valid-row'), false)
      assert.equal(nachDenial.text.includes(SECRET), false)
      assert.equal(nachDenial.writes, 'disabled')
      assert.match(nachDenial.alert ?? '', /Nicht angemeldet/)
      assert.equal(nachDenial.kpis.every((kpi) => kpi.value === ''), true)
      const stoerung = await explizit(page)
      await release(page, stoerung.id, 503, { message: SECRET })
      await warteZustand(page, 'stoerung')
      let nachStoerung = await stand(page)
      assert.equal(nachStoerung.text.includes('synthetic-valid-row'), false)
      assert.equal(nachStoerung.text.includes(SECRET), false)
      assert.equal(nachStoerung.writes, 'disabled')
      assert.equal(nachStoerung.note, 'stoerung')
      assert.equal(nachStoerung.text.includes(PERIOD), false)
      const recovery = await explizit(page)
      await release(page, recovery.id, 200, payload([eventRow('evt-new', '203.0.113.11', 'synthetic-recovered-row', 'totally_new_signal')]))
      await warteZustand(page, 'angenommen')
      const nachher = await stand(page)
      assert.match(nachher.text, /synthetic-recovered-row/)
      assert.match(nachher.text, /totally_new_signal/)
      assert.equal(nachher.writes, 'enabled')
      assert.equal(nachher.kpis.find((kpi) => kpi.label?.includes('Login-Fehler'))?.value, '0')
      assert.equal(nachher.kpis.find((kpi) => kpi.label?.includes('Events'))?.value, '1')
      await shot(page, 'admin-security-console-recovery.png')
      return { state: nachher.state, gets: lists(nachher.calls).length }
    })

    await fall(browser, origin, aborted, 'valid-403-malformed', async (page) => {
      await ersteAntwort(page, payload([eventRow('evt-valid', '203.0.113.12', 'synthetic-before-denial')]))
      await warteZustand(page, 'angenommen')
      const denial = await explizit(page)
      await release(page, denial.id, 403, { error: SECRET })
      await warteZustand(page, 'verweigert')
      const malformed = await explizit(page)
      await release(page, malformed.id, 200, { events: [null, { id: 'evt-bad', created_at: 'gestern', detail: SECRET }], blocklist: [] })
      await warteZustand(page, 'unlesbar')
      const nachher = await stand(page)
      assert.equal(nachher.text.includes('synthetic-before-denial'), false)
      assert.equal(nachher.text.includes(SECRET), false)
      assert.equal(nachher.text.includes('Invalid Date'), false)
      assert.equal(nachher.text.includes(PERIOD), false)
      assert.equal(nachher.writes, 'disabled')
      assert.match(nachher.text, /Nicht ermittelbar/)
      await shot(page, 'admin-security-console-denial-malformed.png')
      return { state: nachher.state }
    })

    await fall(browser, origin, aborted, 'malformed-keeps-accepted-snapshot', async (page) => {
      await ersteAntwort(page, payload([eventRow('evt-keep', '203.0.113.13', 'synthetic-kept-row')]))
      await warteZustand(page, 'angenommen')
      const malformed = await explizit(page)
      await release(page, malformed.id, 200, {
        events: [eventRow('evt-keep', '203.0.113.13', SECRET), eventRow('evt-keep', '203.0.113.14', 'duplicate')],
        blocklist: [{ ip: '203.0.113.13' }, { ip: '203.0.113.13' }],
      })
      await warteZustand(page, 'unlesbar')
      const nachher = await stand(page)
      assert.match(nachher.text, /synthetic-kept-row/)
      assert.equal(nachher.text.includes(SECRET), false)
      assert.equal(nachher.text.includes(PERIOD), false)
      assert.equal(nachher.writes, 'disabled')
      assert.equal(nachher.note, 'unlesbar')
      return { state: nachher.state }
    })

    await fall(browser, origin, aborted, 'oversized-and-empty', async (page) => {
      const zuGross = Array.from({ length: 201 }, (_, index) => eventRow(`evt-${index}`, `203.0.113.${index % 200}`, `oversized-${index}`))
      await ersteAntwort(page, payload(zuGross))
      await warteZustand(page, 'unlesbar')
      let nachGross = await stand(page)
      assert.equal(nachGross.text.includes('oversized-0'), false)
      assert.equal(nachGross.text.includes(PERIOD), false)
      const leer = await explizit(page)
      await release(page, leer.id, 200, payload([], []))
      await warteZustand(page, 'angenommen')
      const nachLeer = await stand(page)
      assert.equal(nachLeer.eventLeer, 'zeitraum')
      assert.match(nachLeer.text, new RegExp(PERIOD))
      assert.match(nachLeer.text, /Keine Einträge/)
      assert.equal(nachLeer.kpis.every((kpi) => kpi.value === '0'), true)
      await page.getByLabel('Aufgezeichnete Ereignisse durchsuchen').fill('nichts-davon')
      const gefiltert = await stand(page)
      assert.equal(gefiltert.eventLeer, 'zeitraum')
      const voll = await explizit(page)
      const events = Array.from({ length: 200 }, (_, index) =>
        eventRow(`evt-${index}`, `198.51.100.${index % 250}`, index === 0 ? `${'lang '.repeat(80)}ende` : `row-${index}`, 'note'),
      )
      await release(page, voll.id, 200, payload(events, Array.from({ length: 200 }, (_, index) => blockRow(`198.51.100.${index}`))))
      await warteZustand(page, 'angenommen')
      const nachVoll = await stand(page)
      assert.equal(nachVoll.filter, 'nichts-davon')
      assert.equal(nachVoll.eventLeer, 'filter')
      assert.match(nachVoll.text, new RegExp(FILTER))
      assert.ok(nachVoll.eventsBound)
      assert.ok(nachVoll.blockBound)
      assert.equal(nachVoll.kpis.find((kpi) => kpi.label?.includes('Events'))?.value, '200')
      return { bound: true }
    })

    await fall(browser, origin, aborted, 'old-success-after-denial', async (page) => {
      const anfang = await stand(page)
      const alt = anfang.pending.find((call) => call.method === 'GET')
      const neu = await explizit(page)
      await release(page, neu.id, 401, { error: SECRET })
      await warteZustand(page, 'verweigert')
      await release(page, alt.id, 200, payload([eventRow('evt-old', '203.0.113.15', 'synthetic-older-success')]))
      await pause(250)
      const nachher = await stand(page)
      assert.equal(nachher.state, 'verweigert')
      assert.equal(nachher.text.includes('synthetic-older-success'), false)
      assert.equal(nachher.writes, 'disabled')
      return { pending: nachher.pending.length }
    })

    await fall(browser, origin, aborted, 'old-denial-after-newer-success', async (page) => {
      const anfang = await stand(page)
      const alt = anfang.pending.find((call) => call.method === 'GET')
      const neu = await explizit(page)
      await release(page, neu.id, 200, payload([eventRow('evt-new', '203.0.113.16', 'synthetic-newer-success', 'login_failed')]))
      await warteZustand(page, 'angenommen')
      await release(page, alt.id, 403, { error: SECRET })
      await pause(250)
      const nachher = await stand(page)
      assert.equal(nachher.state, 'angenommen')
      assert.match(nachher.text, /synthetic-newer-success/)
      assert.equal(nachher.text.includes(SECRET), false)
      assert.equal(nachher.writes, 'enabled')
      assert.equal(nachher.kpis.find((kpi) => kpi.label?.includes('Login-Fehler'))?.value, '1')
      return { state: nachher.state }
    })

    await fall(browser, origin, aborted, 'slow-poll-does-not-stack', async (page) => {
      const anfang = await stand(page)
      assert.deepEqual(anfang.intervals, [15000])
      assert.equal(lists(anfang.calls).length, 1)
      await page.clock.fastForward(45000)
      await pause(100)
      const waehrend = await stand(page)
      assert.equal(lists(waehrend.calls).length, 1)
      assert.equal(waehrend.pending.filter((call) => call.method === 'GET').length, 1)
      await release(page, anfang.pending[0].id, 200, payload([eventRow('evt-slow', '203.0.113.17', 'synthetic-slow-row')]))
      await warteZustand(page, 'angenommen')
      await page.clock.fastForward(15000)
      await page.waitForFunction(() => window.__securityAudit.calls().filter((call) => call.method === 'GET').length >= 2)
      const nachher = await stand(page)
      assert.equal(lists(nachher.calls).length, 2)
      assert.equal(nachher.pending.filter((call) => call.method === 'GET').length, 1)
      return { gets: lists(nachher.calls).length }
    })

    await fall(browser, origin, aborted, 'duplicate-and-conflict', async (page) => {
      await ersteAntwort(
        page,
        payload(
          [eventRow('evt-a', '203.0.113.21', 'row-a', 'login_failed'), eventRow('evt-b', '203.0.113.22', 'row-b', 'bot')],
          [blockRow('203.0.113.21')],
        ),
      )
      await warteZustand(page, 'angenommen')
      await page.evaluate(() => {
        const button = document.querySelector('[data-security-block="203.0.113.22"]')
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      await page.waitForFunction(() => window.__securityAudit.calls().some((call) => call.method === 'POST'))
      await pause(100)
      let jetzt = await stand(page)
      const doppelt = posts(jetzt.calls)
      assert.equal(doppelt.length, 1)
      assert.match(doppelt[0].url, /\/api\/admin\/security\/block$/)
      assert.deepEqual(JSON.parse(doppelt[0].body), { ip: '203.0.113.22', reason: 'aus Ereignis bot' })
      await page.evaluate(() => {
        document.querySelector('[data-security-block="203.0.113.21"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        document.querySelector('[data-security-unblock="203.0.113.21"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      await pause(100)
      jetzt = await stand(page)
      const konflikte = posts(jetzt.calls)
      assert.equal(konflikte.length, 2)
      assert.match(konflikte[1].url, /\/block$/)
      assert.equal(konflikte.some((call) => call.url.includes('/unblock')), false)
      assert.equal(jetzt.operations.filter((operation) => operation.ip === '203.0.113.21' && operation.state === 'ausstehend').length, 1)
      return { posts: konflikte.length }
    })

    await fall(browser, origin, aborted, 'independent-subjects-and-focus', async (page) => {
      await ersteAntwort(
        page,
        payload([
          eventRow('evt-a', '203.0.113.31', 'row-a'),
          eventRow('evt-b', '203.0.113.32', 'row-b'),
        ]),
      )
      await warteZustand(page, 'angenommen')
      await page.locator('#blocklist-ip').fill('203.0.113.77')
      await page.locator('#blocklist-grund').fill('alpha')
      await page.getByRole('button', { name: 'Eintrag hinzufügen' }).click()
      await page.locator('[data-security-block="203.0.113.32"]').click()
      await page.waitForFunction(() => window.__securityAudit.pending().filter((call) => call.method === 'POST').length === 2)
      await page.locator('#blocklist-grund').focus()
      await page.keyboard.type(' beta')
      await page.getByLabel('Aufgezeichnete Ereignisse durchsuchen').fill('zzz-filter')
      const pending = (await stand(page)).pending.filter((call) => call.method === 'POST')
      const formPost = pending.find((call) => call.body?.includes('203.0.113.77'))
      const rowPost = pending.find((call) => call.body?.includes('203.0.113.32'))
      assert.ok(formPost && rowPost)
      assert.deepEqual(JSON.parse(formPost.body), { ip: '203.0.113.77', reason: 'alpha' })
      await release(page, formPost.id, 200, { ok: true, message: SECRET })
      await page.waitForFunction(
        () => document.querySelector('[data-security-operation-ip="203.0.113.77"]')?.getAttribute('data-security-operation-state') === 'rueckgemeldet',
      )
      const nachForm = await stand(page)
      assert.equal(nachForm.reason, 'alpha beta')
      assert.equal(nachForm.filter, 'zzz-filter')
      assert.equal(nachForm.focus, 'blocklist-grund')
      assert.equal(nachForm.text.includes(SECRET), false)
      assert.match(nachForm.text, /Rückmeldung für 203\.0\.113\.77/)
      assert.equal(nachForm.operations.find((operation) => operation.ip === '203.0.113.32')?.state, 'ausstehend')
      const folgeLesen = nachForm.pending.find((call) => call.method === 'GET')
      assert.ok(folgeLesen)
      await release(page, folgeLesen.id, 200, payload([eventRow('evt-other', '203.0.113.99', 'other-row')]))
      await pause(200)
      const ohneIp = await stand(page)
      assert.match(ohneIp.text, /belegt nicht, dass die begrenzte Liste ihn enthält/)
      assert.equal(ohneIp.text.includes('nirgends'), false)
      await fail(page, rowPost.id)
      await page.waitForFunction(
        () => document.querySelector('[data-security-operation-ip="203.0.113.32"]')?.getAttribute('data-security-operation-state') === 'unbestaetigt',
      )
      const nachFehler = await stand(page)
      assert.equal(nachFehler.operations.find((operation) => operation.ip === '203.0.113.77')?.state, 'rueckgemeldet')
      assert.match(nachFehler.text, /belegt nicht, dass nichts geschrieben wurde/)
      const postsVorher = posts(nachFehler.calls).length
      await pause(300)
      assert.equal(posts((await stand(page)).calls).length, postsVorher)
      await page.locator('[data-security-retry="203.0.113.32"]').click()
      await page.waitForFunction((expected) => window.__securityAudit.calls().filter((call) => call.method === 'POST').length >= expected, postsVorher + 1)
      const erneut = posts((await stand(page)).calls).at(-1)
      assert.deepEqual(JSON.parse(erneut.body), { ip: '203.0.113.32', reason: 'aus Ereignis note' })
      assert.equal((await stand(page)).filter, 'zzz-filter')
      await shot(page, 'admin-security-console-operations.png')
      return { posts: posts((await stand(page)).calls).length }
    })

    await fall(browser, origin, aborted, 'write-denial-and-explicit-retry', async (page) => {
      await ersteAntwort(page, payload([eventRow('evt-a', '203.0.113.41', 'row-a')]))
      await warteZustand(page, 'angenommen')
      await page.locator('#blocklist-ip').fill('203.0.113.41')
      await page.locator('#blocklist-grund').fill('captured-intent')
      await page.getByRole('button', { name: 'Eintrag hinzufügen' }).click()
      const post = (await stand(page)).pending.find((call) => call.method === 'POST')
      await release(page, post.id, 403, { error: SECRET })
      await page.waitForFunction(() => document.querySelector('[data-security-writes]')?.getAttribute('data-security-writes') === 'disabled')
      const gesperrt = await stand(page)
      assert.match(gesperrt.text, /row-a/)
      assert.equal(gesperrt.text.includes(SECRET), false)
      assert.equal(gesperrt.operations[0]?.state, 'abgelehnt')
      assert.equal(await page.locator('[data-security-block="203.0.113.41"]').isDisabled(), true)
      await page.getByRole('button', { name: 'Schreibschutz aufheben' }).click()
      await pause(50)
      assert.equal(posts((await stand(page)).calls).length, 1)
      assert.equal(await page.locator('[data-security-block="203.0.113.41"]').isDisabled(), false)
      await page.locator('[data-security-retry="203.0.113.41"]').click()
      await page.waitForFunction(() => window.__securityAudit.calls().filter((call) => call.method === 'POST').length >= 2)
      const zweiter = posts((await stand(page)).calls)[1]
      assert.deepEqual(JSON.parse(zweiter.body), { ip: '203.0.113.41', reason: 'captured-intent' })
      return { posts: 2 }
    })

    await fall(browser, origin, aborted, 'keyboard-and-viewports', async (page) => {
      const lang = `${'sehr-langer-detailtext '.repeat(40)}ENDE`
      await ersteAntwort(page, payload([eventRow('evt-long', '203.0.113.51', lang, 'anomaly_rate_limit')], [blockRow('203.0.113.51', 'langer grund')]))
      await warteZustand(page, 'angenommen')
      const fokus = []
      let detailsOffen = false
      for (let index = 0; index < 16; index += 1) {
        await page.keyboard.press('Tab')
        const info = await page.evaluate(() => ({
          tag: document.activeElement?.tagName ?? '',
          id: document.activeElement?.id || '',
          label: document.activeElement?.getAttribute('aria-label') || '',
          text: document.activeElement?.textContent?.replace(/\s+/g, ' ').trim() || '',
        }))
        fokus.push(info)
        if (!detailsOffen && info.tag === 'SUMMARY') {
          await page.keyboard.press('Enter')
          detailsOffen = (await page.locator('details').getAttribute('open')) !== null
        }
      }
      assert.equal(detailsOffen, true)
      assert.ok(fokus.some((wert) => wert.text.includes('Aktualisieren')))
      assert.ok(fokus.some((wert) => wert.label.includes('Aufgezeichnete Ereignisse durchsuchen')))
      assert.ok(fokus.some((wert) => wert.id === 'blocklist-ip'))
      assert.ok(fokus.some((wert) => wert.id === 'blocklist-grund'))
      assert.ok(fokus.some((wert) => wert.text.includes('Eintrag hinzufügen')))
      const masse = []
      for (const viewport of [
        { width: 320, height: 700, name: 'narrow-320' },
        { width: 390, height: 800, name: 'phone-390' },
        { width: 768, height: 900, name: 'tablet-768' },
        { width: 1280, height: 900, name: 'desktop-1280' },
      ]) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await pause(50)
        const gemessen = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          text: document.body.innerText.includes('ENDE'),
          add: document.querySelector('#blocklist-eintrag-titel')?.getBoundingClientRect().height ?? 0,
        }))
        assert.equal(gemessen.text, true)
        assert.ok(gemessen.scrollWidth <= gemessen.clientWidth + 1, viewport.name)
        assert.ok(gemessen.add > 0)
        await shot(page, `admin-security-console-${viewport.name}.png`)
        masse.push({ ...viewport, ...gemessen, text: undefined })
      }
      await page.setViewportSize({ width: 390, height: 800 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '32px'
      })
      await pause(50)
      const gross = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        button: [...document.querySelectorAll('button')].find((node) => node.textContent?.includes('Eintrag hinzufügen'))?.getBoundingClientRect().height ?? 0,
      }))
      assert.ok(gross.button >= 44)
      assert.ok(gross.scrollWidth <= gross.clientWidth + 1)
      await shot(page, 'admin-security-console-200-percent.png')
      return { fokus, masse, gross }
    })

    await fall(browser, origin, aborted, 'unmount-ignores-settlement', async (page) => {
      const anfang = await stand(page)
      await page.evaluate(() => window.__securityAudit.unmount())
      await release(page, anfang.pending[0].id, 200, payload([eventRow('evt-late', '203.0.113.61', 'after-unmount')]))
      await pause(200)
      const text = await page.locator('body').innerText()
      assert.equal(text.includes('after-unmount'), false)
      return { empty: text.trim().length === 0 }
    })

    const probe = await (async () => {
      const geoeffnet = await oeffnen(browser, origin, aborted)
      try {
        const ergebnis = await geoeffnet.page.evaluate(async () => {
          try {
            await fetch('https://example.com/admin-security-probe')
            return 'allowed'
          } catch {
            return 'blocked'
          }
        })
        assert.equal(ergebnis, 'blocked')
        assert.equal(geoeffnet.pageErrors.length, 0)
        return ergebnis
      } finally {
        await geoeffnet.page.close()
      }
    })()

    const datei = {
      kind: 'mounted-security-widget',
      synthetic: true,
      signedInAdmin: false,
      physicalDevice: false,
      productionMutation: false,
      externalNetworking: 'aborted',
      externalProbe: probe,
      abortedExternal: [...new Set(aborted.map((url) => { try { return new URL(url).host } catch { return url } }))],
      cases: report,
    }
    writeFileSync(join(EVIDENCE, 'report.json'), `${JSON.stringify(datei, null, 2)}\n`)
    writeFileSync(join(ARTIFACTS, 'admin-security-console-completion-1-report.json'), `${JSON.stringify(datei, null, 2)}\n`)
    console.log(JSON.stringify({ cases: report.length, externalProbe: probe }, null, 2))
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
