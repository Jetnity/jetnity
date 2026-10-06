#!/usr/bin/env node
// Local synthetic real-Workspace navigation + real-Plan callback/re-render audit.
// JETNITY_UI_AUDIT=1 npm start -- --hostname 127.0.0.1 --port 3497
// AUDIT_BASE=http://127.0.0.1:3497 node --import tsx scripts/trip-timeline-temporal-review-1-audit.mjs
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
const base = process.env.AUDIT_BASE || 'http://127.0.0.1:3497'
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'local only')
const evidence = process.env.AUDIT_EVIDENCE_DIR || join(process.cwd(), 'docs/evidence/trip-timeline-temporal-review-1')
mkdirSync(join(evidence, 'screens'), { recursive: true })
const temp = mkdtempSync(join(tmpdir(), 'jetnity-temporal-'))
const reise = beispielreise()
reise.days = reise.days.slice(0, 3)
const prototype = reise.days[0].items[0]
const item = (id, title, startsAt, endsAt, more = {}) => ({ ...prototype, id, dayId: 'day-1', kind: 'transfer', title,
  startsOn: '2026-10-06', endsOn: '2026-10-06', startsAt, endsAt, mobilityEvidence: 'user',
  originPlaceId: 'airport:ZRH', destinationPlaceId: 'airport:ZRH', originName: 'Flughafen Zürich', destinationName: 'Flughafen Zürich',
  note: null, routeItinerary: null, priceAmount: null, priceCurrency: null, ...more })
reise.title = 'Zeitprüfung · synthetischer Reiseplan'
reise.days[0].dayDate = '2026-10-06'
reise.days[0].items = [
  item('a:?[]&=', 'Erster Termin am Flughafen', '10:00', '11:00', { priceAmount: 42, priceCurrency: 'CHF' }),
  item('b', 'Zweiter Termin am Flughafen', '10:30', '11:30'),
  item('missing', 'Museumsbesuch', '14:00', null, { kind: 'activity', startsOn: null, endsOn: null }),
  item('hotel', 'Unterkunft für drei Nächte', null, null, { kind: 'stay', endsOn: '2026-10-09' }),
  item('flex', 'Spaziergang mit Zeit zum Entdecken', null, null, { kind: 'activity', startsOn: null, endsOn: null }),
]
reise.days[1].items = []; reise.days[1].dayDate = '2026-10-07'
reise.days[2].items = []; reise.days[2].dayDate = '2026-10-08'
reise.ohneTag = [item('unplanned', 'Noch ohne Tageszuordnung', null, null, { dayId: null, kind: 'note', startsOn: null, endsOn: null })]
const expected = ['a:?[]&=', 'b', 'missing', 'flex', 'hotel'] // Core position ties use stable IDs.
const viewports = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]
const results = [], errors = [], blocked = []

const tsxRequire = createRequire(require.resolve('tsx'))
const { build } = tsxRequire('esbuild')
await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
  import Plan from './components/trips/TripWorkspacePlan';
  const initial=${JSON.stringify(reise)}; window.auditEvents=[];
  function Harness(){ const [trip,setTrip]=React.useState(initial); const [day,setDay]=React.useState('day-1');
    const [selected,setSelected]=React.useState('');
    window.auditGraph=()=>trip;
    window.auditClock=()=>setTrip(t=>({...t,days:t.days.map(d=>({...d,items:d.items.map(p=>p.id==='b'?{...p,startsAt:'12:00',endsAt:'13:00'}:p)}))}));
    window.auditMove=()=>setTrip(t=>({...t,days:t.days.map(d=>({...d,items:d.items.filter(p=>p.id!=='b')})),ohneTag:[...t.ohneTag,{...t.days[0].items.find(p=>p.id==='b'),dayId:null}]}));
    return <Plan reise={trip} ohneTag={trip.ohneTag} aktiverTag={day} kompakt={false} onTagWechseln={setDay} gewaehlterPunktId={selected}
      onPunktOeffnen={id=>{window.auditEvents.push({action:'open',id});setSelected(id)}}
      onPunktEntfernen={async(dayId,id)=>{window.auditEvents.push({action:'delete',dayId,id});setTrip(t=>({...t,days:t.days.map(d=>({...d,items:d.items.filter(p=>p.id!==id)})),ohneTag:t.ohneTag.filter(p=>p.id!==id)}));return null}}
      onPunktAnlegen={async(dayId,input)=>{window.auditEvents.push({action:'create',dayId,input});return null}}/> }
  createRoot(document.getElementById('root')).render(<Harness/>);`, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, outfile: join(temp, 'harness.js'), platform: 'browser', define: { 'process.env.NODE_ENV': '"production"' } })
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
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const harnessBase = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true, ...(process.env.AUDIT_CHROME ? { executablePath: process.env.AUDIT_CHROME } : { channel: 'chrome' }) })
const review = page => page.locator('[data-zeitpruefung]')
async function context(viewport, origin) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  await ctx.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin !== origin || url.pathname.startsWith('/api/') || route.request().method() !== 'GET') {
      blocked.push(`${route.request().method()} ${url.origin}${url.pathname}`); return route.abort()
    }
    return route.continue()
  })
  const page = await ctx.newPage()
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error' && /hydrat|did not match/i.test(m.text())) errors.push(m.text()) })
  return { ctx, page }
}
async function inspect(page, name) {
  const state = await review(page).evaluate(el => {
    const targets = [...el.querySelectorAll('button,summary')].filter(n => n.getClientRects().length).map(n => {
      const r = n.getBoundingClientRect(); return { width: r.width, height: r.height, right: r.right, left: r.left }
    })
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, targets,
      fontSize: getComputedStyle(document.documentElement).fontSize, text: el.innerText,
      coverage: el.dataset.zeitpruefungStatus }
  })
  assert(state.scrollWidth <= state.width + 1, `${name}: horizontal page overflow`)
  assert(state.targets.every(t => t.width >= 44 && t.height >= 44 && t.left >= -1 && t.right <= state.width + 1), `${name}: target sizing/overflow`)
  assert(!/Alles passt|konfliktfrei|proven_conflict|not_evaluable/.test(state.text))
  assert.equal(state.coverage, 'partial')
  assert.match(state.text, /Mögliche Überschneidung im Plan/)
  assert.match(state.text, /Zeitzone/)
  assert.match(state.text, /1 von 3 Vergleichen auswertbar/)
  results.push({ name, ...state })
}
let passed = false
try {
  for (const viewport of viewports) {
    for (const quelle of ['guest', 'account']) {
      const { ctx, page } = await context(viewport, new URL(base).origin)
      const payload = { reise, quelle, mitSuche: false, mitBegleiter: false, mitAenderung: false }
      await ctx.addInitScript(data => sessionStorage.setItem('jetnity:ui-audit:workspace', JSON.stringify(data)), payload)
      await page.goto(`${base}/ui-audit/trip-workspace?ansicht=plan&tag=day-1`, { waitUntil: 'networkidle' })
      await review(page).waitFor()
      assert.equal(await review(page).locator('details').first().getAttribute('open'), null)
      if (quelle === 'guest') await review(page).screenshot({ path: join(evidence, 'screens', `${viewport.width}-collapsed.png`) })
      assert.deepEqual(await page.locator('[data-plan-tages-timeline] [data-plan-punkt]').evaluateAll(nodes => nodes.map(n => n.dataset.planPunkt)), expected)
      assert.match(await page.locator('[data-plan-punkt]').first().innerText(), /42.*CHF|CHF.*42/)
      await review(page).locator('summary').first().focus(); await page.keyboard.press('Enter')
      await inspect(page, `workspace-${quelle}-${viewport.width}`)
      if (quelle === 'guest') await review(page).screenshot({ path: join(evidence, 'screens', `${viewport.width}-details.png`) })
      const trigger = review(page).locator('[data-zeitpruefung-punkt]').first()
      await trigger.focus(); await page.keyboard.press('Enter')
      await page.locator('[data-workspace-detail]').waitFor()
      assert.equal(await page.locator('[data-workspace-detail]').getAttribute('data-detail-item'), 'a:?[]&=')
      assert.equal(new URL(page.url()).searchParams.get('punkt'), 'a:?[]&=')
      await page.keyboard.press('Escape')
      await page.locator('[data-workspace-detail]').waitFor({ state: 'detached' })
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true, 'focus returns to the exact review trigger')
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await inspect(page, `workspace-${quelle}-${viewport.width}-text200`)
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize), '32px')
      if (quelle === 'guest') {
        await review(page).scrollIntoViewIfNeeded()
        await page.screenshot({ path: join(evidence, 'screens', `${viewport.width}-text200.png`), fullPage: true })
      }
      await page.locator('[data-plan-tag-naechster]').click()
      assert.match(await review(page).innerText(), /Noch keine festen Termine für diesen Tag/)
      await page.getByRole('button', { name: 'Punkt hinzufügen', exact: true }).click()
      await page.getByLabel('Ort oder Aktivität', { exact: true }).fill('Synthetischer Zusatz')
      await page.getByRole('button', { name: 'Abbrechen', exact: true }).click()
      assert.equal(await page.evaluate(() => sessionStorage.getItem('jetnity:ui-audit:workspace')), JSON.stringify(payload))
      results.push({ name: `navigation-${quelle}-${viewport.width}`, exactOriginalId: true, focusReturned: true, storageUnchanged: true })
      await ctx.close()
    }
    const { ctx, page } = await context(viewport, harnessBase)
    await page.goto(harnessBase); await review(page).waitFor()
    await review(page).locator('summary').first().click()
    await inspect(page, `callbacks-${viewport.width}`)
    const initial = await page.evaluate(() => JSON.stringify(window.auditGraph()))
    await review(page).locator('[data-zeitpruefung-punkt]').first().click()
    assert.deepEqual(await page.evaluate(() => window.auditEvents.at(-1)), { action: 'open', id: 'a:?[]&=' })
    assert.equal(await page.evaluate(() => JSON.stringify(window.auditGraph())), initial)
    await page.evaluate(() => window.auditClock())
    await page.waitForFunction(() => document.querySelector('[data-zeitpruefung]').dataset.zeitpruefungStatus === 'unavailable')
    assert.equal(await page.evaluate(() => window.auditGraph().revision), reise.revision)
    assert.doesNotMatch(await review(page).innerText(), /Mögliche Überschneidung im Plan/)
    assert.match(await review(page).innerText(), /0 von 3 Vergleichen auswertbar/)
    await page.evaluate(() => window.auditMove())
    await page.waitForFunction(() => window.auditGraph().ohneTag.some(p => p.id === 'b'))
    assert.equal(await page.evaluate(() => window.auditGraph().ohneTag.some(p => p.id === 'b')), true)
    await page.getByRole('button', { name: 'Zweiter Termin am Flughafen entfernen', exact: true }).click()
    await page.waitForFunction(() => !window.auditGraph().ohneTag.some(p => p.id === 'b'))
    assert.deepEqual(await page.evaluate(() => window.auditEvents.at(-1)), { action: 'delete', dayId: '', id: 'b' })
    assert.equal(await review(page).locator('[data-zeitpruefung-punkt="b"]').count(), 0)
    assert.match(await review(page).innerText(), /0 von 1 Vergleichen auswertbar/)
    await page.getByRole('button', { name: 'Punkt hinzufügen', exact: true }).click()
    await page.getByLabel('Ort oder Aktivität', { exact: true }).fill('Neuer Punkt')
    await page.getByLabel('Uhrzeit', { exact: true }).fill('07:15')
    await page.getByRole('button', { name: 'Speichern', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.auditEvents.at(-1)), { action: 'create', dayId: 'day-1', input: { kind: 'activity', title: 'Neuer Punkt', note: null, startsAt: '07:15' } })
    results.push({ name: `updates-${viewport.width}`, unchangedRevisionRecomputed: true, deletedTargetRemoved: true, originalCallbackIds: true })
    await ctx.close()
  }
  assert.deepEqual(errors, []); assert.deepEqual(blocked, [])
  passed = true
} finally {
  const files = ['components/trips/TripWorkspacePlan.tsx', 'components/trips/TripTimelineZeitpruefung.tsx', 'lib/trips/trip-timeline-temporal-review-1.ts', 'scripts/trip-timeline-temporal-review-1-audit.mjs']
  writeFileSync(join(evidence, 'audit.json'), JSON.stringify({ passed,
    headAtRun: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    sourceSha256: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')])),
    browser: browser.version(), localSyntheticOnly: true, authenticatedE2E: false, physicalDevice: false,
    results, errors, blocked,
  }, null, 2) + '\n')
  await browser.close(); await new Promise(resolve => server.close(resolve)); rmSync(temp, { recursive: true, force: true })
}
console.log(JSON.stringify({ passed, cases: results.length, errors, blocked }))
