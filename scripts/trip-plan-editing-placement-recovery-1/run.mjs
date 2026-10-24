// Isolated mounted proof for the real plan editor and guest delete.
// Local Playwright only. No hosted account, personal profile, or provider call.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = join(REPO, 'scripts/trip-plan-editing-placement-recovery-1')
const EVIDENCE = join(REPO, 'docs/evidence/trip-plan-editing-placement-recovery-1')
const OUT = join('/tmp', 'trip-plan-editing-placement-recovery-1')
mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })

const KONFLIKT = 'Der Planpunkt hat sich inzwischen geändert. Bitte lade die Reise neu; deine Eingabe bleibt erhalten.'
const faelle = []

function merke(name, ok, detail = '') {
  faelle.push({ name, ok, detail })
  if (!ok) throw new Error(`${name}${detail ? `: ${detail}` : ''}`)
}

function compileCss() {
  const postcss = require('postcss')
  const nesting = require('tailwindcss/nesting')
  const tailwindcss = require('tailwindcss')
  const autoprefixer = require('autoprefixer')
  const from = join(REPO, 'styles/globals.css')
  return postcss([nesting(), tailwindcss(require(join(REPO, 'tailwind.config.js'))), autoprefixer()])
    .process(readFileSync(from, 'utf8'), { from })
    .then((result) => result.css)
}

const esbuild = require('esbuild')
const empty = join(DIR, 'shims/empty.ts')
const genau = new Map([
  ['server-only', empty],
  ['next/link', empty],
  ['next/navigation', empty],
  ['next/dynamic', empty],
  ['next/image', empty],
  ['next/cache', empty],
  ['next/headers', empty],
  ['next/server', empty],
])

await esbuild.build({
  absWorkingDir: REPO,
  entryPoints: [join(DIR, 'mount.tsx')],
  outfile: join(OUT, 'harness.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  alias: { '@': REPO },
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: 'globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
  plugins: [{
    name: 'plan-shims',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.path.startsWith('.') || args.path.startsWith('/') || args.path.startsWith('@/')) return null
        const ziel = genau.get(args.path)
        if (ziel) return { path: ziel }
        if (args.path.startsWith('next/') || args.path.startsWith('node:') || args.path === 'next') return { path: empty }
        return null
      })
    },
  }],
})

const harnessJs = readFileSync(join(OUT, 'harness.js'))
const css = await compileCss()
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Plan</title><style>html,body{margin:0}</style><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/harness.js"></script></body></html>`
const server = createServer((req, res) => {
  const pfad = new URL(req.url || '/', 'http://127.0.0.1').pathname
  if (pfad === '/harness.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(harnessJs); return }
  if (pfad === '/style.css') { res.writeHead(200, { 'content-type': 'text/css' }); res.end(css); return }
  if (pfad === '/') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(html); return }
  res.writeHead(404); res.end('no')
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const url = `http://127.0.0.1:${port}/`

let browser
try {
  browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] })
} catch {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
}

async function seite(viewport, schrift = 16) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForFunction(() => window.__plan)
  if (schrift !== 16) await page.evaluate((px) => { document.documentElement.style.fontSize = `${px}px` }, schrift)
  return { context, page }
}

async function ueberlauf(page) {
  return page.evaluate(() => {
    const breit = document.documentElement.scrollWidth - document.documentElement.clientWidth
    const knopf = document.querySelector('button')
    const kasten = knopf?.getBoundingClientRect()
    return { breit, erreichbar: Boolean(kasten && kasten.width > 0 && kasten.height >= 40) }
  })
}

async function formular(page, name) {
  const form = page.getByRole('form', { name: `Punkt bearbeiten: ${name}` })
  await form.waitFor()
  return form
}

async function einKnopf(page, label) {
  await page.waitForFunction((label) =>
    [...document.querySelectorAll('button')].filter((button) => button.getAttribute('aria-label') === label).length === 1,
  label)
}

async function bearbeiten(page, name) {
  const label = `${name} bearbeiten`
  await einKnopf(page, label)
  await page.getByRole('button', { name: label }).click()
  return formular(page, name)
}

async function speichern(page) {
  await page.getByRole('button', { name: 'Speichern', exact: true }).click()
  await page.getByText('Planpunkt wird gespeichert …').waitFor()
}

async function titel(page) {
  return page.getByLabel('Ort oder Aktivität')
}

async function zuordnung(page) {
  return page.getByLabel('Zuordnung im Tagesplan')
}

const ergebnis = {
  status: 'FAIL',
  browser: browser.version(),
  url,
  viewports: [],
  limits: [
    'CSS viewport and root-font simulation only',
    'not a physical device, screen reader, native zoom, hosted account, or Preview pass',
  ],
}

try {
  const { page, context } = await seite({ width: 1280, height: 900 })
  await page.evaluate(() => window.__plan.ohneTage())
  await bearbeiten(page, 'Marktbesuch')
  merke('zero-day activity opens', await page.getByLabel('Ort oder Aktivität').isVisible())
  merke('null date stays empty', (await page.getByLabel('Anfangsdatum, optional').inputValue()) === '')
  merke('null time stays empty', (await page.getByLabel('Anfangszeit, optional').inputValue()) === '')
  await (await titel(page)).fill('Markt am Morgen')
  await speichern(page)
  const graph = await page.evaluate(() => window.__plan.erwartetesGraph())
  await page.evaluate((naechste) => window.__plan.setReise(naechste), graph)
  await page.evaluate(() => window.__plan.loesen(null))
  await page.getByText('Planpunkt gespeichert.').waitFor()
  merke('zero-day save closes', await page.getByRole('form', { name: /Punkt bearbeiten/ }).count() === 0)

  await bearbeiten(page, 'Hinweis mit einem sehr langen Namen für den Tagesplan')
  await (await titel(page)).fill('Hinweis bleibt')
  await speichern(page)
  await page.evaluate(() => window.__plan.loesen('Der Titel ist schon vergeben.'))
  merke('domain error keeps draft', (await (await titel(page)).inputValue()) === 'Hinweis bleibt')
  merke('domain error visible', (await page.getByRole('alert').innerText()).includes('Der Titel ist schon vergeben.'))

  await (await titel(page)).fill('Hinweis nach Fehler')
  await speichern(page)
  await page.evaluate(() => window.__plan.werfen('netz'))
  await page.getByText('Der Punkt konnte nicht gespeichert werden. Deine Eingabe bleibt erhalten.').waitFor()
  merke('throw keeps draft', (await (await titel(page)).inputValue()) === 'Hinweis nach Fehler')
  await page.getByRole('button', { name: 'Abbrechen', exact: true }).click()
  await page.waitForFunction(() => {
    if (document.querySelectorAll('form').length !== 0) return false
    const el = document.activeElement
    const kasten = el?.getBoundingClientRect()
    return Boolean(el && el !== document.body && kasten && kasten.width > 0 && kasten.height > 0)
  })
  merke('cancel focus is visible', true)

  await bearbeiten(page, 'Flug nach Osaka')
  merke('protected flight hides content fields', await page.getByLabel('Ort oder Aktivität').count() === 0)
  merke('protected flight explains placement', (await page.getByText('Die Tageszuordnung ändert diese Angaben nicht.').count()) === 1)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.querySelectorAll('form').length === 0)
  merke('escape closes', true)

  await page.screenshot({ path: join(EVIDENCE, 'zero-day-closed.png') })
  await page.evaluate(() => window.__plan.tagesreise())
  const tage = await page.evaluate(() => window.__plan.reise().days.map((tag) => tag.id))
  await bearbeiten(page, 'Marktbesuch')
  await (await zuordnung(page)).selectOption(tage[1])
  await speichern(page)
  const platz = await page.evaluate(() => window.__plan.aufrufe().at(-1))
  merke('day A to day B sends captured original', platz.change.dayId === tage[1] && platz.original.title === 'Marktbesuch')
  await page.evaluate(() => window.__plan.loesen('Dieser Tag gehört nicht zur Reise.'))
  merke('unknown day stays on draft', await page.getByRole('form', { name: 'Punkt bearbeiten: Marktbesuch' }).isVisible())
  await (await zuordnung(page)).selectOption('')
  await speichern(page)
  const aus = await page.evaluate(() => window.__plan.aufrufe().at(-1).change.dayId)
  merke('day to unassigned sends null', aus === null)
  const ungeplant = await page.evaluate(() => window.__plan.erwartetesGraph())
  await page.evaluate((naechste) => window.__plan.setReise(naechste), ungeplant)
  await page.evaluate(() => window.__plan.loesen(null))
  await page.getByText('Planpunkt gespeichert.').waitFor()
  await bearbeiten(page, 'Marktbesuch')
  const tagZurueck = await page.evaluate(() => window.__plan.reise().days[0].id)
  await (await zuordnung(page)).selectOption(tagZurueck)
  await speichern(page)
  merke('unassigned to day sends that day', (await page.evaluate(() => window.__plan.aufrufe().at(-1).change.dayId)) === tagZurueck)
  await page.evaluate((text) => window.__plan.loesen(text), KONFLIKT)
  merke('version conflict keeps draft', await page.getByRole('alert').innerText().then((text) => text.includes(KONFLIKT)))

  await page.evaluate(() => window.__plan.tagesreise())
  await bearbeiten(page, 'Marktbesuch')
  await page.evaluate(() => {
    const form = document.querySelector('form')
    form.requestSubmit()
    form.requestSubmit()
  })
  await page.waitForFunction(() => window.__plan.aufrufe().length === 1)
  merke('double submit calls once', true)
  await page.evaluate(() => window.__plan.loesen('halt'))

  await (await titel(page)).fill('Alter Entwurf')
  await speichern(page)
  await page.getByRole('button', { name: 'Marktbesuch bearbeiten' }).click()
  await (await titel(page)).fill('Neuer Entwurf')
  await page.evaluate(() => window.__plan.loesen(null))
  merke('old completion keeps the newer draft', (await (await titel(page)).inputValue()) === 'Neuer Entwurf')
  await page.evaluate(() => window.__plan.unmount())
  await page.evaluate(() => window.__plan.loesen(null))
  merke('unmount drops the old completion', await page.getByText('Planpunkt gespeichert.').count() === 0)

  async function neu(name = 'Marktbesuch') {
    await page.evaluate(() => window.__plan.tagesreise())
    await bearbeiten(page, name)
    if (name !== 'Flug nach Osaka') await (await titel(page)).fill(`${name} neu`)
    await speichern(page)
  }

  await neu()
  const konto = await page.evaluate(() => window.__plan.erwartetesGraph('2026-10-24T16:04:00.000Z'))
  await page.evaluate((naechste) => window.__plan.setReise(naechste), konto)
  await page.evaluate(() => window.__plan.loesen(null))
  await page.getByText('Planpunkt gespeichert.').waitFor()
  merke('account graph then null closes', await page.getByRole('form').count() === 0)

  await neu()
  await page.evaluate(() => window.__plan.loesen(null))
  await page.getByRole('button', { name: 'Speichern', exact: true }).waitFor()
  const danach = await page.evaluate(() => window.__plan.erwartetesGraph('2026-10-24T16:05:00.000Z'))
  await page.evaluate((naechste) => window.__plan.setReise(naechste), danach)
  await page.getByText('Planpunkt gespeichert.').waitFor()
  merke('account null then graph closes', true)

  await page.evaluate(() => window.__plan.ohneTage())
  await bearbeiten(page, 'Marktbesuch')
  await speichern(page)
  await page.evaluate(() => window.__plan.loesen(null))
  await page.getByText('Planpunkt gespeichert.').waitFor()
  merke('guest no-op with unchanged version closes', await page.getByRole('form').count() === 0)

  await bearbeiten(page, 'Marktbesuch')
  await speichern(page)
  const noopVersion = await page.evaluate(() => window.__plan.erwartetesGraph('2026-10-24T16:06:00.000Z'))
  await page.evaluate((naechste) => window.__plan.setReise(naechste), noopVersion)
  await page.evaluate(() => window.__plan.loesen(null))
  await page.getByText('Planpunkt gespeichert.').waitFor()
  merke('domain no-op with new rowVersion closes', true)

  await bearbeiten(page, 'Marktbesuch')
  await (await titel(page)).fill('Wartet ohne Graph')
  await speichern(page)
  await page.evaluate(() => window.__plan.loesen(null))
  await page.getByRole('button', { name: 'Speichern', exact: true }).waitFor()
  merke('no further graph re-enables', await page.getByText('Planpunkt gespeichert.').count() === 0)
  merke('no further graph keeps draft', (await (await titel(page)).inputValue()) === 'Wartet ohne Graph')

  await (await titel(page)).fill('Nach der Wiederherstellung')
  const spaet = await page.evaluate(() => window.__plan.erwartetesGraph())
  await page.evaluate((naechste) => window.__plan.setReise(naechste), spaet)
  await page.waitForTimeout(50)
  merke('later graph does not clear the edited draft', (await (await titel(page)).inputValue()) === 'Nach der Wiederherstellung')

  await page.evaluate(() => window.__plan.tagesreise())
  await bearbeiten(page, 'Marktbesuch')
  await (await titel(page)).fill('Eigen')
  await speichern(page)
  const fremd = await page.evaluate(() => {
    const reise = window.__plan.reise()
    return { ...reise, travelWish: 'andere Vorbereitung', readinessItems: [{ ...reise.readinessItems[0] }], party: reise.party }
  })
  await page.evaluate((naechste) => window.__plan.setReise(naechste), fremd)
  await page.evaluate(() => window.__plan.loesen(null))
  await page.getByRole('button', { name: 'Speichern', exact: true }).waitFor()
  merke('unrelated graph keeps the draft', (await (await titel(page)).inputValue()) === 'Eigen')
  await speichern(page)
  await page.evaluate(() => window.__plan.loesen('Bitte erneut versuchen.'))
  merke('late error on unchanged target shows the error', (await page.getByRole('alert').innerText()).includes('Bitte erneut versuchen.'))

  async function konflikt(art) {
    await page.evaluate(() => window.__plan.tagesreise())
    await bearbeiten(page, 'Marktbesuch')
    await (await titel(page)).fill('Ersetzt')
    await speichern(page)
    const naechste = await page.evaluate((welche) => window.__plan[welche](), art)
    await page.evaluate((wert) => window.__plan.setReise(wert), naechste)
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    await page.evaluate(() => window.__plan.loesen(null))
    await page.getByText(KONFLIKT).waitFor()
    merke(`${art} null shows conflict`, (await (await titel(page)).inputValue()) === 'Ersetzt')
    await page.getByRole('button', { name: 'Abbrechen', exact: true }).click()
    await page.evaluate(() => window.__plan.tagesreise())
    await bearbeiten(page, 'Marktbesuch')
    await (await titel(page)).fill('Ersetzt')
    await speichern(page)
    const nochmal = await page.evaluate((welche) => window.__plan[welche](), art)
    await page.evaluate((wert) => window.__plan.setReise(wert), nochmal)
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    await page.evaluate(() => window.__plan.loesen('Schreiben unsicher'))
    const text = await page.getByRole('alert').innerText()
    const erwartet = art === 'versionNur' ? 'Schreiben unsicher' : KONFLIKT
    merke(`${art} error is classified`, text.includes(erwartet))
  }
  await konflikt('versionNur')
  await konflikt('ohneZiel')
  await konflikt('duplikat')

  await page.evaluate(() => window.__plan.ohneTage())
  await page.evaluate(() => window.__plan.gastLoeschen(true))
  await einKnopf(page, 'Marktbesuch entfernen')
  await page.getByRole('button', { name: 'Marktbesuch entfernen' }).click()
  await page.waitForFunction(() => !document.body.textContent.includes('Marktbesuch entfernen'))
  merke('real guest delete removes the item', true)
  await page.evaluate(() => {
    const roh = JSON.parse(window.__plan.speicher())
    roh.title = 'Eine andere Fassung'
    window.localStorage.setItem('jetnity:reise:v3', JSON.stringify(roh))
  })
  await page.getByRole('button', { name: 'Hinweis mit einem sehr langen Namen für den Tagesplan entfernen' }).click()
  const meldung = page.locator('[data-plan-meldung]')
  await meldung.waitFor()
  await page.waitForFunction(() => document.activeElement?.hasAttribute('data-plan-meldung') === true)
  merke('zero-day delete error is visible', (await meldung.innerText()).includes('inzwischen geändert'))
  merke('delete error receives focus', true)
  await page.screenshot({ path: join(EVIDENCE, 'zero-day-delete-error.png') })
  await page.evaluate(() => window.__plan.tagesreise('Andere Reise'))
  await page.waitForFunction(() => document.querySelectorAll('[data-plan-meldung]').length === 0)
  merke('shown delete error clears on a new trip', true)

  await page.evaluate(() => window.__plan.gastLoeschen(false))
  await page.evaluate(() => window.__plan.ohneTage())
  await einKnopf(page, 'Marktbesuch entfernen')
  await page.getByRole('button', { name: 'Marktbesuch entfernen' }).click()
  await page.waitForFunction(() => window.__plan.aufrufe().some((aufruf) => aufruf.art === 'delete'))
  await page.evaluate(() => window.__plan.andereReise())
  await page.evaluate(() => window.__plan.loesen('zu spät'))
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  merke('pending delete error does not alert the newer trip', await page.locator('[data-plan-meldung]').count() === 0)
  await einKnopf(page, 'Marktbesuch entfernen')
  await page.getByRole('button', { name: 'Marktbesuch entfernen' }).click()
  await page.waitForFunction(() => window.__plan.aufrufe().filter((aufruf) => aufruf.art === 'delete').length === 2)
  await page.evaluate(() => window.__plan.loesen(null))
  merke('newer delete is not left locked', true)

  await page.evaluate(() => window.__plan.gastLoeschen(false))
  await bearbeiten(page, 'Marktbesuch')
  await speichern(page)
  await page.evaluate(() => window.__plan.loesen('Die Änderung wurde geschrieben, der aktuelle Stand konnte aber nicht bestätigt werden.'))
  merke('account callback error stays an error', (await page.getByRole('alert').innerText()).includes('nicht bestätigt'))
  merke('account callback error is not success', await page.getByText('Planpunkt gespeichert.').count() === 0)

  const groessen = [
    { name: '280', viewport: { width: 280, height: 700 } },
    { name: '320', viewport: { width: 320, height: 700 } },
    { name: '320-root-32', viewport: { width: 320, height: 700 }, schrift: 32 },
    { name: '360', viewport: { width: 360, height: 740 } },
    { name: '390', viewport: { width: 390, height: 844 } },
    { name: '430', viewport: { width: 430, height: 900 } },
    { name: '768', viewport: { width: 768, height: 900 } },
    { name: '1280', viewport: { width: 1280, height: 900 } },
    { name: 'landscape', viewport: { width: 844, height: 390 } },
  ]
  for (const groesse of groessen) {
    const lauf = await seite(groesse.viewport, groesse.schrift ?? 16)
    await lauf.page.evaluate(() => window.__plan.tagesreise())
    await bearbeiten(lauf.page, 'Hinweis mit einem sehr langen Namen für den Tagesplan')
    const masse = await ueberlauf(lauf.page)
    ergebnis.viewports.push({ name: groesse.name, ...masse, simulation: 'css-viewport-root-font' })
    merke(`${groesse.name} has no horizontal overflow`, masse.breit <= 1)
    merke(`${groesse.name} reaches a control`, masse.erreichbar)
    if (groesse.name === '390') await lauf.page.screenshot({ path: join(EVIDENCE, 'editor-390.png') })
    await lauf.context.close()
  }

  await context.close()
  ergebnis.status = 'PASS'
  ergebnis.cases = faelle.length
} catch (fehler) {
  ergebnis.status = 'FAIL'
  ergebnis.error = fehler instanceof Error ? fehler.stack ?? fehler.message : String(fehler)
  ergebnis.cases = faelle
} finally {
  ergebnis.head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()
  ergebnis.bundleSha256 = createHash('sha256').update(harnessJs).digest('hex')
  writeFileSync(join(EVIDENCE, 'results.json'), `${JSON.stringify(ergebnis, null, 2)}\n`)
  await browser.close()
  server.close()
}

console.log(JSON.stringify({ status: ergebnis.status, cases: ergebnis.cases, error: ergebnis.error ?? null }, null, 2))
if (ergebnis.status !== 'PASS') process.exit(1)
