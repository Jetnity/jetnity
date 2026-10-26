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
      denial: root?.getAttribute('data-security-denial') ?? null,
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

async function identitaet(page, ip) {
  return page.evaluate((adresse) => {
    function zeilen(el) {
      if (!el) return null
      const range = document.createRange()
      range.selectNodeContents(el)
      const tops = []
      for (const rect of range.getClientRects()) {
        if (rect.width < 1 || rect.height < 1) continue
        const top = Math.round(rect.top)
        if (!tops.some((bisher) => Math.abs(bisher - top) <= 2)) tops.push(top)
      }
      return {
        lines: tops.length,
        text: el.textContent?.trim() ?? '',
        whiteSpace: getComputedStyle(el).whiteSpace,
        height: Math.round(el.getBoundingClientRect().height),
      }
    }
    const region = document.querySelector('[aria-label="Aufgezeichnete Ereignisse"]')
    const ipEl = region?.querySelector(`[data-security-ip="${CSS.escape(adresse)}"]`)
    const row = ipEl?.closest('tr')
    const typeEl = row?.querySelector('[data-security-type]')
    const userEl = row?.querySelector('[data-security-user]')
    const detail = row?.querySelector('.detail')
    const button = row?.querySelector('[data-security-block]')
    const buttonRect = button?.getBoundingClientRect()
    const regionRect = region?.getBoundingClientRect()
    return {
      ip: zeilen(ipEl),
      type: zeilen(typeEl),
      user: zeilen(userEl),
      detail: detail
        ? {
            overflowWrap: getComputedStyle(detail).overflowWrap,
            maxHeight: getComputedStyle(detail).maxHeight,
          }
        : null,
      region: region
        ? {
            overflowX: getComputedStyle(region).overflowX,
            client: region.clientWidth,
            scroll: region.scrollWidth,
          }
        : null,
      actionInRegion:
        buttonRect && regionRect
          ? buttonRect.right > regionRect.left &&
            buttonRect.left < regionRect.right &&
            buttonRect.bottom > regionRect.top &&
            buttonRect.top < regionRect.bottom
          : false,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }
  }, ip)
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
      await page.getByLabel('Aufgezeichnete Ereignisse durchsuchen').fill('zzz-filter')
      await page.locator('#blocklist-grund').focus()
      await page.keyboard.type(' beta')
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
      await page.locator('#blocklist-grund').focus()
      await release(page, post.id, 403, { error: SECRET })
      await page.waitForFunction(() => document.querySelector('[data-security-read-state]')?.getAttribute('data-security-read-state') === 'verweigert')
      const gesperrt = await stand(page)
      assert.equal(gesperrt.writes, 'disabled')
      assert.equal(gesperrt.denial, 'schreiben')
      assert.equal(gesperrt.text.includes('row-a'), false)
      assert.equal(gesperrt.text.includes(SECRET), false)
      assert.equal(gesperrt.text.includes('Schreibschutz'), false)
      assert.equal(gesperrt.operations.length, 0)
      assert.equal(gesperrt.kpis.every((kpi) => kpi.value === ''), true)
      assert.equal(gesperrt.reason, 'captured-intent')
      assert.equal(gesperrt.ip, '203.0.113.41')
      assert.equal(gesperrt.focus, 'blocklist-grund')
      assert.match(gesperrt.text, /erteilt kein Recht/)
      assert.equal(await page.locator('[data-security-write-unlock="true"]').count(), 0)
      const vorher = posts(gesperrt.calls).length
      await page.getByRole('button', { name: 'Erneut lesen' }).click()
      await page.waitForFunction((expected) => window.__securityAudit.calls().filter((call) => call.method === 'GET').length >= expected, lists(gesperrt.calls).length + 1)
      const nachLesen = await stand(page)
      assert.equal(posts(nachLesen.calls).length, vorher)
      assert.equal(nachLesen.writes, 'disabled')
      assert.equal(nachLesen.reason, 'captured-intent')
      const wieder = nachLesen.pending.find((call) => call.method === 'GET')
      await release(page, wieder.id, 200, payload([eventRow('evt-a', '203.0.113.41', 'row-a')]))
      await warteZustand(page, 'angenommen')
      const offen = await stand(page)
      assert.equal(offen.writes, 'enabled')
      assert.equal(posts(offen.calls).length, vorher)
      assert.match(offen.text, /row-a/)
      return { posts: posts(offen.calls).length }
    })

    await fall(browser, origin, aborted, 'event-operation-then-get-403', async (page) => {
      await ersteAntwort(page, payload([eventRow('evt-visible', '203.0.113.70', 'visible-event', 'note')]))
      await warteZustand(page, 'angenommen')
      await page.locator('[data-security-block="203.0.113.70"]').click()
      await page.waitForFunction(() => window.__securityAudit.pending().some((call) => call.method === 'POST'))
      const vorDenial = await stand(page)
      assert.match(vorDenial.text, /aus Ereignis note/)
      assert.equal(vorDenial.operations[0]?.state, 'ausstehend')
      const post = vorDenial.pending.find((call) => call.method === 'POST')
      const lesen = await explizit(page)
      await release(page, lesen.id, 403, { error: SECRET })
      await warteZustand(page, 'verweigert')
      const verborgen = await stand(page)
      assert.equal(verborgen.denial, 'lesen')
      assert.equal(verborgen.writes, 'disabled')
      assert.equal(verborgen.operations.length, 0)
      assert.equal(verborgen.text.includes('visible-event'), false)
      assert.equal(verborgen.text.includes('aus Ereignis note'), false)
      assert.equal(verborgen.text.includes('203.0.113.70'), false)
      assert.equal(verborgen.kpis.every((kpi) => kpi.value === ''), true)
      assert.equal(posts(verborgen.calls).length, 1)
      await release(page, post.id, 200, { ok: true, message: SECRET })
      await pause(300)
      const nachAlt = await stand(page)
      assert.equal(nachAlt.state, 'verweigert')
      assert.equal(nachAlt.operations.length, 0)
      assert.equal(nachAlt.text.includes('visible-event'), false)
      assert.equal(posts(nachAlt.calls).length, 1)
      assert.equal(lists(nachAlt.calls).length, lists(verborgen.calls).length)
      await shot(page, 'admin-security-console-denial-cleared.png')
      return { posts: posts(nachAlt.calls).length }
    })

    await fall(browser, origin, aborted, 'post-401-stale-get-200', async (page) => {
      await ersteAntwort(page, payload([eventRow('evt-a', '203.0.113.71', 'row-before-write')]))
      await warteZustand(page, 'angenommen')
      const lesen = await explizit(page)
      await page.locator('#blocklist-ip').fill('203.0.113.71')
      await page.locator('#blocklist-grund').fill('write-denied-intent')
      await page.getByRole('button', { name: 'Eintrag hinzufügen' }).click()
      const post = (await stand(page)).pending.find((call) => call.method === 'POST')
      await release(page, post.id, 401, { error: SECRET })
      await warteZustand(page, 'verweigert')
      const verborgen = await stand(page)
      assert.equal(verborgen.denial, 'schreiben')
      assert.equal(verborgen.text.includes('row-before-write'), false)
      assert.equal(verborgen.operations.length, 0)
      await release(page, lesen.id, 200, payload([eventRow('evt-stale', '203.0.113.71', 'stale-get-must-not-return')]))
      await pause(300)
      const nachAlt = await stand(page)
      assert.equal(nachAlt.state, 'verweigert')
      assert.equal(nachAlt.writes, 'disabled')
      assert.equal(nachAlt.text.includes('stale-get-must-not-return'), false)
      assert.equal(nachAlt.text.includes('row-before-write'), false)
      assert.equal(nachAlt.operations.length, 0)
      assert.equal(posts(nachAlt.calls).length, 1)
      return { state: nachAlt.state }
    })

    await fall(browser, origin, aborted, 'denial-recovery-old-settlement', async (page) => {
      await ersteAntwort(page, payload([eventRow('evt-same', '203.0.113.80', 'same-ip-event', 'note')]))
      await warteZustand(page, 'angenommen')
      await page.locator('[data-security-block="203.0.113.80"]').click()
      await page.waitForFunction(() => window.__securityAudit.pending().some((call) => call.method === 'POST'))
      const altPost = (await stand(page)).pending.find((call) => call.method === 'POST')
      const denial = await explizit(page)
      await release(page, denial.id, 403, { error: SECRET })
      await warteZustand(page, 'verweigert')
      await page.getByRole('button', { name: 'Erneut lesen' }).click()
      await page.waitForFunction((expected) => window.__securityAudit.calls().filter((call) => call.method === 'GET').length >= expected, 3)
      const recovery = (await stand(page)).pending.filter((call) => call.method === 'GET').at(-1)
      await release(page, recovery.id, 200, payload([eventRow('evt-same', '203.0.113.80', 'same-ip-event', 'note')]))
      await warteZustand(page, 'angenommen')
      assert.equal(posts((await stand(page)).calls).length, 1)
      await page.locator('[data-security-block="203.0.113.80"]').click()
      await page.waitForFunction(() => window.__securityAudit.calls().filter((call) => call.method === 'POST').length >= 2)
      const neu = await stand(page)
      assert.equal(neu.operations.length, 1)
      assert.equal(neu.operations[0]?.state, 'ausstehend')
      assert.equal(neu.operations[0]?.ip, '203.0.113.80')
      const getsVorher = lists(neu.calls).length
      await release(page, altPost.id, 200, { ok: true, message: SECRET })
      await pause(300)
      const nachAlt = await stand(page)
      assert.equal(nachAlt.operations[0]?.state, 'ausstehend')
      assert.equal(nachAlt.text.includes(SECRET), false)
      assert.equal(posts(nachAlt.calls).length, 2)
      assert.equal(lists(nachAlt.calls).length, getsVorher)
      assert.match(nachAlt.text, /Eintrag für 203\.0\.113\.80 wird gesendet/)
      return { posts: posts(nachAlt.calls).length, state: nachAlt.operations[0]?.state }
    })

    await fall(browser, origin, aborted, 'manual-add-long-reason-roundtrip', async (page) => {
      await ersteAntwort(page, payload([], []))
      await warteZustand(page, 'angenommen')
      const grund = 'm'.repeat(2000)
      const max = await page.locator('#blocklist-grund').getAttribute('maxlength')
      assert.equal(max, '2000')
      await page.locator('#blocklist-ip').fill('203.0.113.90')
      await page.locator('#blocklist-grund').fill(`${grund}Z`)
      assert.equal(await page.locator('#blocklist-grund').inputValue(), grund)
      await page.getByRole('button', { name: 'Eintrag hinzufügen' }).click()
      const post = (await stand(page)).pending.find((call) => call.method === 'POST')
      assert.deepEqual(JSON.parse(post.body), { ip: '203.0.113.90', reason: grund })
      await release(page, post.id, 200, { ok: true })
      await page.waitForFunction((expected) => window.__securityAudit.calls().filter((call) => call.method === 'GET').length >= expected, 2)
      const folge = (await stand(page)).pending.find((call) => call.method === 'GET')
      await release(page, folge.id, 200, payload([], [blockRow('203.0.113.90', grund)]))
      await warteZustand(page, 'angenommen')
      const nachher = await stand(page)
      assert.equal(nachher.note, null)
      assert.equal(nachher.text.includes('nicht lesbar'), false)
      assert.match(nachher.text, /203\.0\.113\.90/)
      assert.equal(await page.locator('[data-security-truncated="true"]').count(), 0)
      assert.equal(await page.locator('[data-security-unblock="203.0.113.90"]').isDisabled(), false)
      return { reasonLength: grund.length }
    })

    await fall(browser, origin, aborted, 'existing-long-record', async (page) => {
      const prefix = 'LONGPREFIX-'
      const tail = '-TAILMARKER'
      const detail = `${prefix}${'d'.repeat(4000)}${tail}`
      const reason = `${prefix}${'r'.repeat(4000)}${tail}`
      await ersteAntwort(
        page,
        payload([eventRow('evt-long-existing', '203.0.113.91', detail, 'note')], [blockRow('203.0.113.91', reason)]),
      )
      await warteZustand(page, 'angenommen')
      const nachher = await stand(page)
      assert.equal(nachher.state, 'angenommen')
      assert.equal(nachher.note, null)
      assert.match(nachher.text, /LONGPREFIX-/)
      assert.equal(nachher.text.includes('TAILMARKER'), false)
      assert.match(nachher.text, /Gekürzt: die ersten 2000 von/)
      assert.match(nachher.text, /nicht sichtbar/)
      const hinweise = await page.locator('[data-security-truncated="true"]').count()
      assert.equal(hinweise, 2)
      assert.equal(await page.locator('[data-security-unblock="203.0.113.91"]').isDisabled(), false)
      assert.equal(await page.locator('[data-security-block="203.0.113.91"]').isDisabled(), false)
      await shot(page, 'admin-security-console-long-record.png')
      return { truncated: hinweise }
    })

    await fall(browser, origin, aborted, 'narrow-identity-readable', async (page) => {
      const ipv4 = '203.0.113.51'
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      const typ = 'anomaly_rate_limit'
      const user = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      const detail = `${'freier detailtext '.repeat(24)}LANGDETAIL`
      await ersteAntwort(
        page,
        payload(
          [
            { ...eventRow('evt-v4', ipv4, detail, typ), user_id: user },
            eventRow('evt-v6', ipv6, 'ipv6-row', 'login_failed'),
          ],
          [blockRow(ipv6, `${'langer blockgrund '.repeat(40)}ENDE`)],
        ),
      )
      await warteZustand(page, 'angenommen')
      assert.equal(posts((await stand(page)).calls).length, 0)
      const masse = []
      for (const viewport of [
        { width: 320, height: 700, font: '16px', name: 'identity-320' },
        { width: 390, height: 800, font: '16px', name: 'identity-390' },
        { width: 320, height: 700, font: '32px', name: 'identity-320-200' },
        { width: 390, height: 800, font: '32px', name: 'identity-390-200' },
      ]) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.evaluate((font) => {
          document.documentElement.style.fontSize = font
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        }, viewport.font)
        await pause(50)
        for (const adresse of [ipv4, ipv6]) {
          const gemessen = await identitaet(page, adresse)
          assert.equal(gemessen.ip?.lines, 1, `${viewport.name} ${adresse} ${JSON.stringify(gemessen.ip)}`)
          assert.equal(gemessen.ip?.text, adresse)
          assert.equal(gemessen.ip?.whiteSpace, 'nowrap')
          assert.equal(gemessen.type?.lines, 1, `${viewport.name} type ${JSON.stringify(gemessen.type)}`)
          assert.ok(gemessen.type?.text === typ || gemessen.type?.text === 'login_failed')
          assert.equal(gemessen.region?.overflowX, 'auto')
          assert.ok(gemessen.region.scroll > gemessen.region.client, JSON.stringify(gemessen.region))
          assert.ok(gemessen.scrollWidth <= gemessen.clientWidth + 1, JSON.stringify(gemessen))
          if (adresse === ipv4) {
            assert.equal(gemessen.user?.lines, 1, JSON.stringify(gemessen.user))
            assert.equal(gemessen.user?.text, user)
            assert.equal(gemessen.detail?.overflowWrap, 'anywhere')
          }
        }
        await shot(page, `admin-security-console-${viewport.name}.png`)
        masse.push(viewport.name)
      }
      await page.setViewportSize({ width: 320, height: 700 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '16px'
      })
      let erreicht = false
      for (let index = 0; index < 30; index += 1) {
        await page.keyboard.press('Tab')
        const ziel = await page.evaluate(() => document.activeElement?.getAttribute('data-security-block'))
        if (ziel === ipv4) {
          erreicht = true
          break
        }
      }
      assert.equal(erreicht, true)
      assert.equal(posts((await stand(page)).calls).length, 0)
      const sichtbar = await identitaet(page, ipv4)
      assert.equal(sichtbar.actionInRegion, true)
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => window.__securityAudit.calls().some((call) => call.method === 'POST'))
      await pause(50)
      const gesendet = posts((await stand(page)).calls)
      assert.equal(gesendet.length, 1)
      assert.match(gesendet[0].url, /\/api\/admin\/security\/block$/)
      assert.deepEqual(JSON.parse(gesendet[0].body), { ip: ipv4, reason: `aus Ereignis ${typ}` })
      return { masse, posts: gesendet.length }
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
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        })
        await pause(50)
        const gemessen = await page.evaluate(() => {
          const region = document.querySelector('[aria-label="Aufgezeichnete Ereignisse"]')
          const regionStyle = region ? getComputedStyle(region) : null
          const limit = document.documentElement.clientWidth + 1
          const offenders = [...document.querySelectorAll('body *')]
            .map((node) => {
              const rect = node.getBoundingClientRect()
              const parent = node.parentElement
              return {
                tag: node.tagName,
                className: String(node.className).slice(0, 100),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                parent: parent ? String(parent.className).slice(0, 120) : '',
              }
            })
            .filter((node) => node.right > limit)
            .slice(0, 8)
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            text: document.body.innerText.includes('ENDE'),
            add: document.querySelector('#blocklist-eintrag-titel')?.getBoundingClientRect().height ?? 0,
            region: region
              ? { overflowX: regionStyle?.overflowX, client: region.clientWidth, scroll: region.scrollWidth }
              : null,
            offenders,
          }
        })
        assert.equal(gemessen.text, true)
        const zeichen = await identitaet(page, '203.0.113.51')
        assert.equal(zeichen.ip?.lines, 1, `${viewport.name} ${JSON.stringify(zeichen.ip)}`)
        assert.equal(zeichen.ip?.text, '203.0.113.51')
        assert.equal(zeichen.type?.lines, 1, `${viewport.name} ${JSON.stringify(zeichen.type)}`)
        assert.equal(zeichen.type?.text, 'anomaly_rate_limit')
        assert.ok(
          gemessen.scrollWidth <= gemessen.clientWidth + 1,
          `${viewport.name} ${JSON.stringify({ scroll: gemessen.scrollWidth, client: gemessen.clientWidth, region: gemessen.region, offenders: gemessen.offenders })}`,
        )
        assert.ok(gemessen.add > 0)
        await shot(page, `admin-security-console-${viewport.name}.png`)
        masse.push({ ...viewport, ...gemessen, text: undefined })
      }
      await page.setViewportSize({ width: 390, height: 800 })
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        document.documentElement.style.fontSize = '32px'
      })
      await pause(50)
      const gross = await page.evaluate(() => {
        const limit = document.documentElement.clientWidth + 1
          const offenders = [...document.querySelectorAll('body *')]
          .filter((node) => !node.closest('[role="region"]'))
          .map((node) => {
            const rect = node.getBoundingClientRect()
            return {
              tag: node.tagName,
              className: String(node.className).slice(0, 120),
              right: Math.round(rect.right),
              whiteSpace: getComputedStyle(node).whiteSpace,
            }
          })
          .filter((node) => node.right > limit)
          .slice(0, 8)
        const widths = [...document.querySelectorAll('section, [role="region"], input, h2, .wurzel')]
          .map((node) => ({
            tag: node.tagName,
            id: node.id || node.getAttribute('aria-label') || node.className?.toString?.().slice(0, 60),
            client: node.clientWidth,
            scroll: node.scrollWidth,
          }))
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          button: [...document.querySelectorAll('button')].find((node) => node.textContent?.includes('Eintrag hinzufügen'))?.getBoundingClientRect().height ?? 0,
          offenders,
          widths,
        }
      })
      assert.ok(gross.button >= 44)
      assert.ok(gross.scrollWidth <= gross.clientWidth + 1, JSON.stringify(gross))
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
