#!/usr/bin/env node
// Local synthetic audit only. Production build: JETNITY_UI_AUDIT=1 npm start -- --port 3488
// AUDIT_BASE=http://127.0.0.1:3488 node --import tsx scripts/trip-timeline-core-1-audit.mjs
// Real Workspace covers URL/navigation; real Plan in an ephemeral callback harness covers
// exact open/delete/create arguments because the existing Workspace audit callbacks are no-ops.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const { beispielreise } = require('../lib/reiseaenderung/fixtures/reise.ts')
const base = process.env.AUDIT_BASE || 'http://127.0.0.1:3488'
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'local only')
const evidence = process.env.AUDIT_EVIDENCE_DIR || join(process.cwd(), 'docs/evidence/trip-timeline-core-1')
mkdirSync(join(evidence, 'screens'), { recursive: true })
const temp = mkdtempSync(join(tmpdir(), 'jetnity-timeline-'))
const reise = beispielreise()
const prototype = reise.days[0].items[0]
const item = (id, startsAt, position, title = id) => ({ ...prototype, id, startsAt, position, title, note: null, priceAmount: null, priceCurrency: null })
reise.title = 'Florenz · ein Tag unterwegs'
reise.days[0].items = [
  item('early', '04:30', 9, 'Abfahrt zum Bahnhof'),
  item('late-morning', '08:30', 2, 'Frühstück am Arno'),
  item('train:?[]&=', '06:30', 3, 'Ankunft in Florenz'),
  item('evening', '20:00', 4, 'Abendessen in der Altstadt'),
  item('tie-b', '08:30', 3, 'Spaziergang zur Piazza'),
  item('tie-a', '08:30', 3, 'Espresso am Markt'),
  item('lunch', '12:00', 5, 'Mittagessen'),
  item('afternoon', '14:00', 6, 'Besuch im Museum'),
  item('flex-b', null, 2, 'Bücher und Mitbringsel'),
  item('flex-a', '25:90', 2, 'Notiz aus einem älteren Plan'),
]
reise.days[0].items[2].note = 'Treffpunkt am Haupteingang. Buchungsreferenz: ' + 'LangeReferenzOhneTrennzeichen'.repeat(8)
reise.days[0].items[0] = { ...reise.days[0].items[0], kind: 'flight', priceAmount: 240, priceCurrency: 'CHF' }
reise.days[0].items[2].kind = 'transfer'
reise.days[0].items[7].kind = 'rental_car'
reise.days[0].items[8].kind = 'stay'
reise.days[0].items[9].kind = 'note'
reise.days[0].items[7].title += ' · ' + 'Ausstellungsbesichtigung'.repeat(6)
reise.days[1].items = []
reise.days[2].items = [{ ...item('flex-only', null, 1, 'Ein Tag ohne feste Uhrzeit'), dayId: 'day-3' }]
reise.ohneTag = [{ ...item('unplanned', null, 1, 'Noch einem Tag zuordnen'), dayId: null }]
const expected = ['early', 'train:?[]&=', 'late-morning', 'tie-a', 'tie-b', 'lunch', 'afternoon', 'evening', 'flex-a', 'flex-b']
const expectedTimes = ['04:30', '06:30', '08:30', '08:30', '08:30', '12:00', '14:00', '20:00']
const viewports = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]
const results = []
const errors = []
const blocked = []

// Use the bundler shipped with the already pinned tsx dependency; no added package or runtime route.
const tsxRequire = createRequire(require.resolve('tsx'))
const { build } = tsxRequire('esbuild')
await build({
  stdin: {
    contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import Plan from './components/trips/TripWorkspacePlan';
      const initial = ${JSON.stringify(reise)};
      window.auditEvents=[]; window.auditInitial=JSON.stringify(initial);
      function Harness(){
        const [trip,setTrip]=React.useState(initial); const [day,setDay]=React.useState('day-1');
        const [selected,setSelected]=React.useState('train:?[]&=');
        return <Plan reise={trip} ohneTag={trip.ohneTag} aktiverTag={day} kompakt={false}
          gewaehlterPunktId={selected} onTagWechseln={setDay}
          onPunktOeffnen={id=>{window.auditEvents.push({action:'open',id});setSelected(id)}}
          onPunktEntfernen={async(dayId,id)=>{window.auditEvents.push({action:'delete',dayId,id});
            setTrip(t=>({...t,days:t.days.map(d=>({...d,items:d.items.filter(p=>p.id!==id)})),
              ohneTag:t.ohneTag.filter(p=>p.id!==id)}));return null}}
          onPunktAnlegen={async(dayId,input)=>{window.auditEvents.push({action:'create',dayId,input});return null}}/>}
      createRoot(document.getElementById('root')).render(<Harness/>);
      window.auditGraph=()=>JSON.stringify(initial);`,
    resolveDir: process.cwd(), loader: 'tsx', sourcefile: 'timeline-audit-harness.tsx',
  }, bundle: true, write: true, outfile: join(temp, 'harness.js'), platform: 'browser',
  define: { 'process.env.NODE_ENV': '"production"' },
})
execFileSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'), '-i', 'styles/globals.css', '-o', join(temp, 'style.css'), '--minify'], { stdio: 'pipe' })
const server = createServer((req, res) => {
  if (req.url === '/harness.js' || req.url === '/style.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css')
    res.end(readFileSync(join(temp, req.url.slice(1))))
  } else {
    res.setHeader('Content-Type', 'text/html')
    res.end('<!doctype html><html lang="de"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body><main style="max-width:64rem;margin:auto;padding:16px"><div id="root"></div></main><script src="/harness.js"></script></body></html>')
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const harnessBase = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true, ...(process.env.AUDIT_CHROME ? { executablePath: process.env.AUDIT_CHROME } : { channel: 'chrome' }) })

async function context(viewport, origin) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', hasTouch: viewport.width < 1024 })
  await ctx.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.origin !== origin || url.pathname.startsWith('/api/') || route.request().method() !== 'GET') {
      blocked.push(`${route.request().method()} ${url.origin}${url.pathname}`)
      return route.abort()
    }
    return route.continue()
  })
  const page = await ctx.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (msg) => { if (msg.type() === 'error' && /hydrat|did not match/i.test(msg.text())) errors.push(msg.text()) })
  return { ctx, page }
}
const rows = (page) => page.locator('[data-plan-tages-timeline] [data-plan-punkt]')
const row = (page, id) => page.locator('[data-plan-punkt]').filter({ has: page.locator('button') }).filter({ visible: true }).filter({ hasText: reise.days[0].items.find(p => p.id === id)?.title || id })
async function order(page, wanted = expected) {
  assert.deepEqual(await rows(page).evaluateAll((nodes) => nodes.map((n) => n.dataset.planPunkt)), wanted)
}
async function measure(page, name) {
  const value = await page.evaluate(() => {
    const plan = document.querySelector('[data-tagesplan-modul]')
    const visible = (el) => el.getClientRects().length > 0
    const targets = [...plan.querySelectorAll('[data-plan-punkt] button')].filter(visible).map(el => {
      const r = el.getBoundingClientRect(); return { width: r.width, height: r.height }
    })
    const planOverflow = [...plan.querySelectorAll('[data-plan-gruppe], [data-plan-punkt]')].filter(visible).some(el => {
      const r = el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1
    })
    return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, fontSize: getComputedStyle(document.documentElement).fontSize,
      planOverflow, hiddenFocus: !!document.activeElement?.closest('[hidden],[inert]'), targets,
      times: [...plan.querySelectorAll('[data-plan-tages-timeline] time')].map(n => n.textContent),
      groups: [...plan.querySelectorAll('[data-plan-gruppe]')].map(n => n.dataset.planGruppe) }
  })
  assert(value.scrollWidth <= value.viewport + 1, `${name}: page overflow ${JSON.stringify(value)}`)
  assert.equal(value.planOverflow, false, `${name}: timeline outside viewport`)
  assert.equal(value.hiddenFocus, false)
  assert(value.targets.every(t => t.width >= 44 && t.height >= 44), `${name}: target size`)
  results.push({ name, ...value })
  return value
}
async function screenshot(page, name) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: join(evidence, 'screens', `${name}.png`), fullPage: true })
}
try {
  for (const viewport of viewports) {
    for (const quelle of ['guest', 'account']) {
      const { ctx, page } = await context(viewport, new URL(base).origin)
      const payload = { reise, quelle, mitSuche: false, mitBegleiter: false, mitAenderung: false }
      await ctx.addInitScript(data => sessionStorage.setItem('jetnity:ui-audit:workspace', JSON.stringify(data)), payload)
      const goto = async (query = '?ansicht=plan&tag=day-1') => {
        await page.goto(`${base}/ui-audit/trip-workspace${query}`, { waitUntil: 'networkidle' })
        await page.locator('[data-plan-tages-timeline]').waitFor()
      }
      await goto()
      await order(page)
      let state = await measure(page, `workspace-${quelle}-${viewport.width}`)
      assert.deepEqual(state.times, expectedTimes)
      assert.deepEqual(state.groups, ['morgen', 'mittag', 'nachmittag', 'abend', 'flexibel'])
      assert.equal(await page.locator('[data-plan-gruppe="flexibel"] time').count(), 0)
      assert.equal(await page.locator('[data-plan-tages-timeline]').innerText().then(t => t.includes('25:90')), false)
      if (quelle === 'guest') await screenshot(page, `workspace-${viewport.width}`)
      const trigger = row(page, 'train:?[]&=').locator('button').first()
      await trigger.focus()
      await page.keyboard.press('Enter')
      await page.locator('[data-workspace-detail]').waitFor()
      assert.equal(await page.locator('[data-workspace-detail]').getAttribute('data-detail-item'), 'train:?[]&=')
      assert.equal(new URL(page.url()).searchParams.get('punkt'), 'train:?[]&=')
      await page.keyboard.press('Escape')
      await page.locator('[data-workspace-detail]').waitFor({ state: 'detached' })
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true)
      await goto('?ansicht=plan&tag=day-2&punkt=' + encodeURIComponent('train:?[]&='))
      assert.equal(new URL(page.url()).searchParams.get('tag'), 'day-1')
      assert.equal(await page.locator('[data-workspace-detail]').getAttribute('data-detail-item'), 'train:?[]&=')
      assert.equal(await row(page, 'train:?[]&=').getAttribute('data-plan-gewaehlt'), 'ja')
      await page.getByRole('button', { name: 'Zum Tagesplan', exact: true }).click()
      await page.locator('[data-plan-tag-naechster]').click()
      await page.locator('[data-plan-leer]').waitFor()
      assert.equal(await page.locator('[data-plan-gruppe]').count(), 0)
      await page.getByRole('button', { name: 'Punkt hinzufügen', exact: true }).click()
      await page.getByLabel('Ort oder Aktivität', { exact: true }).fill('Neuer Planpunkt')
      await page.getByRole('button', { name: 'Abbrechen', exact: true }).click()
      await page.locator('[data-plan-tag-naechster]').click()
      await order(page, ['flex-only'])
      assert.deepEqual((await measure(page, `flex-only-${quelle}-${viewport.width}`)).groups, ['flexibel'])
      await goto()
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await order(page)
      state = await measure(page, `workspace-${quelle}-${viewport.width}-text200`)
      assert.equal(state.fontSize, '32px')
      if (quelle === 'guest') await screenshot(page, `workspace-${viewport.width}-text200`)
      await page.getByRole('button', { name: 'Punkt hinzufügen', exact: true }).click()
      await page.getByLabel('Ort oder Aktivität', { exact: true }).fill('Textvergrößerung im Formular')
      await measure(page, `form-${quelle}-${viewport.width}-text200`)
      await page.getByRole('button', { name: 'Abbrechen', exact: true }).click()
      // Stored synthetic graph is byte-for-byte unchanged after navigation/open/render.
      assert.equal(await page.evaluate(() => sessionStorage.getItem('jetnity:ui-audit:workspace')), JSON.stringify(payload))
      await ctx.close()
    }
  }

  for (const viewport of viewports) {
    const { ctx, page } = await context(viewport, harnessBase)
    await page.goto(harnessBase)
    await rows(page).first().waitFor()
    await order(page)
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    await measure(page, `callbacks-${viewport.width}-text200`)
    assert.equal(await page.evaluate(() => window.auditGraph() === window.auditInitial), true)
    const target = row(page, 'train:?[]&=')
    await target.locator('button').first().focus()
    await page.keyboard.press('Enter')
    assert.deepEqual(await page.evaluate(() => window.auditEvents.at(-1)), { action: 'open', id: 'train:?[]&=' })
    await page.keyboard.press('Tab')
    assert.equal(await target.locator('button').last().evaluate(el => el === document.activeElement), true)
    await page.keyboard.press('Enter')
    await target.waitFor({ state: 'detached' })
    assert.deepEqual(await page.evaluate(() => window.auditEvents.at(-1)), { action: 'delete', dayId: 'day-1', id: 'train:?[]&=' })
    await order(page, expected.filter(id => id !== 'train:?[]&='))
    await page.getByRole('button', { name: 'Bücher und Mitbringsel entfernen', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.auditEvents.at(-1)), { action: 'delete', dayId: 'day-1', id: 'flex-b' })
    await page.getByRole('button', { name: 'Noch einem Tag zuordnen entfernen', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.auditEvents.at(-1)), { action: 'delete', dayId: '', id: 'unplanned' })
    await page.getByRole('button', { name: 'Punkt hinzufügen', exact: true }).click()
    await page.getByLabel('Ort oder Aktivität', { exact: true }).fill('Neuer Punkt')
    await page.getByLabel('Uhrzeit', { exact: true }).fill('07:15')
    await page.getByRole('button', { name: 'Speichern', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.auditEvents.at(-1)), {
      action: 'create', dayId: 'day-1', input: { kind: 'activity', title: 'Neuer Punkt', note: null, startsAt: '07:15' },
    })
    assert.equal(await page.evaluate(() => window.auditGraph() === window.auditInitial), true)
    results.push({ name: `callbacks-${viewport.width}`, exactOpenDeleteCreateIds: true, sourceGraphUnchanged: true })
    await ctx.close()
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(blocked, [])
} finally {
  const sourceFiles = ['components/trips/TripWorkspacePlan.tsx', 'lib/trips/timeline.ts', 'lib/trips/trip-timeline-core-1.ts', 'scripts/trip-timeline-core-1-audit.mjs']
  writeFileSync(join(evidence, 'audit.json'), JSON.stringify({
    headAtRun: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    sourceSha256: Object.fromEntries(sourceFiles.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')])),
    browser: browser.version(), localSyntheticOnly: true, authenticatedE2E: false, physicalDevice: false,
    results, errors, blocked,
  }, null, 2) + '\n')
  await browser.close()
  await new Promise(resolve => server.close(resolve))
  rmSync(temp, { recursive: true, force: true })
}
console.log(JSON.stringify({ pass: true, cases: results.length, errors, blocked }))
