// Isolated synthetic interaction for the real OrtSuche and FlughafenSuche.
// Local Playwright only. No hosted API, account, or personal browser profile.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const wurzel = process.cwd()
const nachweis = join(wurzel, 'docs/evidence/shared-search-keyboard-lifecycle-1')
const quellen = [
  'components/places/OrtSuche.tsx',
  'components/airports/FlughafenSuche.tsx',
  'lib/suche/tastatur.ts',
  'components/suche/Suchliste.tsx',
]
const hash = (datei) => createHash('sha256').update(readFileSync(join(wurzel, datei))).digest('hex')
const blob = (datei) => execFileSync('git', ['hash-object', datei], { cwd: wurzel, encoding: 'utf8' }).trim()

const require = createRequire(import.meta.url)
const tsxRequire = createRequire(require.resolve('tsx'))
const { build } = tsxRequire('esbuild')
const temp = join(tmpdir(), `jetnity-search-keys-${process.pid}`)
mkdirSync(temp, { recursive: true })
mkdirSync(nachweis, { recursive: true })

await build({
  entryPoints: [join(wurzel, 'scripts/shared-search-keyboard-lifecycle-1/harness.tsx')],
  outfile: join(temp, 'harness.js'),
  bundle: true,
  write: true,
  platform: 'browser',
  format: 'iife',
  jsx: 'automatic',
  alias: { '@': wurzel },
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'silent',
})

const harnessJs = readFileSync(join(temp, 'harness.js'))
const html = `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Shared search keyboard lifecycle</title><body style="margin:24px;font-family:sans-serif"><button id="davor" type="button">Davor</button><div id="root" style="margin:16px 0;max-width:28rem"></div><button id="danach" type="button">Danach</button><script src="/harness.js"></script></body></html>`

const server = createServer((req, res) => {
  const pfad = new URL(req.url || '/', 'http://127.0.0.1').pathname
  if (pfad === '/harness.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
    res.end(harnessJs)
    return
  }
  if (pfad === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(html)
    return
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  res.end('not found')
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const adresse = server.address()
const origin = `http://127.0.0.1:${adresse.port}`

function ort(id, label) {
  return { id, label, description: 'Stadt', typ: 'city', ariaLabel: `${label}, Stadt` }
}
function flughafen(iata, label) {
  return { label, value: iata, description: label }
}

let kuerzen = false
let halten = null
const abgebrochen = []

function antwort(art, url) {
  const q = (url.searchParams.get('q') || '').toLowerCase()
  const rolle = url.searchParams.get('rolle') || ''
  if (q === 'err') return { status: 500, body: { fehler: true } }
  if (q === 'off') return { status: 503, body: { fehler: true } }
  if (q === 'zzz') return { status: 200, body: [] }
  if (q === 'slow') {
    const body = art === 'places'
      ? [ort('geonames:8', 'Langsam')]
      : [flughafen('SLW', 'Langsam · SLW')]
    return { status: 200, body, hold: true }
  }
  if (art === 'places') {
    const drei = [ort('geonames:1', 'Alpha'), ort('geonames:2', 'Beta'), ort('geonames:3', 'Gamma')]
    if (q === 'aaaa' || (q === 'aaa' && rolle === 'abreise') || (q === 'aaa' && kuerzen)) {
      return { status: 200, body: [ort('geonames:1', 'Alpha')] }
    }
    if (q === 'aaa') return { status: 200, body: drei }
    return { status: 200, body: [ort('geonames:4', q)] }
  }
  const drei = [
    flughafen('AAA', 'Alpha Airport · AAA'),
    flughafen('BBB', 'Beta Airport · BBB'),
    flughafen('CCC', 'Gamma Airport · CCC'),
    { label: 'Ungültig', value: 'NO', description: 'kein Code' },
  ]
  if (q === 'aaaa' || (q === 'aaa' && kuerzen)) return { status: 200, body: [flughafen('AAA', 'Alpha Airport · AAA')] }
  if (q === 'aaa') return { status: 200, body: drei }
  return { status: 200, body: [flughafen('ZZZ', `${q} · ZZZ`)] }
}

async function browserStart() {
  try {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' })
    return { browser, kanal: 'chrome' }
  } catch {
    const browser = await chromium.launch({ headless: true })
    return { browser, kanal: 'chromium' }
  }
}

const ergebnis = {
  author: 'Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1',
  session: 'bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e',
  model: 'grok-4.7-high-fast',
  origin,
  sources: Object.fromEntries(quellen.map((datei) => [datei, { sha256: hash(datei), blob: blob(datei) }])),
  scenarios: [],
  aborted: abgebrochen,
  pageErrors: [],
}

let browser
try {
  const gestartet = await browserStart()
  browser = gestartet.browser
  ergebnis.browser = { channel: gestartet.kanal, version: browser.version() }
} catch (error) {
  ergebnis.status = 'NOT RUN'
  ergebnis.blocked = String(error && error.message ? error.message : error)
  writeFileSync(join(nachweis, 'results.json'), `${JSON.stringify(ergebnis, null, 2)}\n`)
  server.close()
  console.error('NOT RUN / BLOCKED')
  console.error(ergebnis.blocked)
  process.exit(2)
}

async function szenario(page, name, fn) {
  const eintrag = { name, viewport: page.viewportSize(), pass: false }
  try {
    await fn()
    eintrag.pass = true
  } catch (error) {
    eintrag.pass = false
    eintrag.error = String(error && error.stack ? error.stack : error)
  }
  ergebnis.scenarios.push(eintrag)
  if (!eintrag.pass) console.error(`FAIL ${name}\n${eintrag.error}`)
  else console.log(`PASS ${name}`)
}

async function warten(fn, label, timeout = 4000) {
  const start = Date.now()
  let last = null
  while (Date.now() - start < timeout) {
    last = await fn()
    if (last === true) return
    await new Promise((resolve) => setTimeout(resolve, 40))
  }
  throw new Error(`${label}: ${JSON.stringify(last)}`)
}

async function ereignisse(page) {
  return page.evaluate(() => window.__steuerung.ereignisse())
}
function kanonisch(liste) {
  return liste.filter((eintrag) => eintrag.wert && (eintrag.wert.id || eintrag.wert.iata))
}
async function nachkomme(page) {
  return page.evaluate(() => {
    const feld = document.querySelector('[role="combobox"]')
    const id = feld?.getAttribute('aria-activedescendant')
    if (!id) return { id: null, vorhanden: false }
    const el = document.getElementById(id)
    return {
      id,
      vorhanden: Boolean(el),
      rolle: el?.getAttribute('role') || null,
      text: el?.innerText || null,
    }
  })
}
async function zustand(page) {
  const feld = page.getByRole('combobox')
  return {
    text: await feld.inputValue(),
    expanded: await feld.getAttribute('aria-expanded'),
    liste: await page.getByRole('listbox').count(),
    optionen: await page.getByRole('option').count(),
    nachkomme: await nachkomme(page),
    kanonisch: kanonisch(await ereignisse(page)),
    fokus: await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute('role') || null),
  }
}

async function bereit(page, feld) {
  kuerzen = false
  halten = null
  await page.evaluate((name) => window.__steuerung.neu(name), feld)
  await page.getByRole('combobox').waitFor()
}

async function tippen(page, text) {
  const feld = page.getByRole('combobox')
  await feld.click()
  await feld.fill(text)
}

async function optionen(page, anzahl) {
  await warten(async () => (await page.getByRole('option').count()) === anzahl, `${anzahl} Optionen`)
}

async function geschlossen(page, text) {
  await warten(async () => {
    const jetzt = await zustand(page)
    return jetzt.expanded === 'false' && jetzt.liste === 0 && jetzt.nachkomme.id === null && jetzt.text === text && jetzt.kanonisch.length === 0
  }, `geschlossen bei ${text}`)
}

async function tastatur(page, feld) {
  await bereit(page, feld)
  await tippen(page, 'aaa')
  await optionen(page, 3)
  await page.getByRole('combobox').press('ArrowDown')
  await warten(async () => {
    const ziel = await nachkomme(page)
    return Boolean(ziel.id && ziel.vorhanden && ziel.rolle === 'option')
  }, 'aktiver Nachkomme')
  const davor = await zustand(page)
  await page.getByRole('combobox').press('Escape')
  await geschlossen(page, davor.text)

  await bereit(page, feld)
  await tippen(page, 'aaa')
  await optionen(page, 3)
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').press('Tab')
  await warten(async () => (await zustand(page)).fokus === 'danach', 'Tab-Ziel')
  await geschlossen(page, 'aaa')

  await bereit(page, feld)
  await tippen(page, 'aaa')
  await optionen(page, 3)
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').press('Shift+Tab')
  await warten(async () => (await zustand(page)).fokus === 'davor', 'Shift+Tab-Ziel')
  await geschlossen(page, 'aaa')

  await bereit(page, feld)
  await tippen(page, 'aaa')
  await optionen(page, 3)
  await page.getByRole('combobox').press('ArrowDown')
  await page.locator('#danach').click()
  await warten(async () => (await zustand(page)).fokus === 'danach', 'Aussenfokus')
  await geschlossen(page, 'aaa')

  await bereit(page, feld)
  await tippen(page, 'aaa')
  await optionen(page, 3)
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').press('Escape')
  await geschlossen(page, 'aaa')
  await page.getByRole('combobox').press('Enter')
  assert.equal(kanonisch(await ereignisse(page)).length, 0)
  await page.locator('#davor').focus()
  await page.getByRole('combobox').focus()
  await optionen(page, 3)
  const wieder = await nachkomme(page)
  assert.equal(wieder.id, null)
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').press('Enter')
  await warten(async () => kanonisch(await ereignisse(page)).length === 1, 'Enter-Auswahl')
  const gewaehlt = kanonisch(await ereignisse(page))[0]
  if (feld === 'ort') assert.equal(gewaehlt.wert.id, 'geonames:1')
  else assert.equal(gewaehlt.wert.iata, 'AAA')
  assert.equal((await page.getByRole('listbox').count()), 0)
}

async function zeiger(page, feld, art) {
  await bereit(page, feld)
  await tippen(page, 'aaa')
  await optionen(page, 3)
  const option = page.getByRole('option').nth(1)
  if (art === 'touch') await option.tap()
  else await option.click()
  await warten(async () => kanonisch(await ereignisse(page)).length === 1, `${art}-Auswahl`)
  const gewaehlt = kanonisch(await ereignisse(page))
  assert.equal(gewaehlt.length, 1)
  if (feld === 'ort') {
    assert.equal(gewaehlt[0].wert.id, 'geonames:2')
    assert.equal(gewaehlt[0].wert.name, 'Beta')
  } else {
    assert.equal(gewaehlt[0].wert.iata, 'BBB')
    assert.equal(gewaehlt[0].wert.name, 'Beta Airport · BBB')
  }
  await warten(async () => (await page.getByRole('listbox').count()) === 0 && kanonisch(await ereignisse(page)).length === 1, `${art} schliesst genau einmal`)
}

async function antworten(page, feld) {
  await bereit(page, feld)
  await tippen(page, 'aaa')
  await optionen(page, 3)
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').fill('aaaa')
  await optionen(page, 1)
  const nach = await nachkomme(page)
  assert.equal(nach.id, null)
  await page.getByRole('combobox').press('Enter')
  assert.equal(kanonisch(await ereignisse(page)).length, 0)
  assert.equal(await page.getByRole('combobox').inputValue(), 'aaaa')

  await bereit(page, feld)
  await tippen(page, 'zzz')
  await warten(async () => {
    const jetzt = await zustand(page)
    return jetzt.expanded === 'true' && jetzt.optionen === 0 && jetzt.liste === 1 && jetzt.nachkomme.id === null
  }, 'leer')
  await page.getByRole('combobox').press('Enter')
  assert.equal(kanonisch(await ereignisse(page)).length, 0)

  await bereit(page, feld)
  await tippen(page, 'err')
  await warten(async () => (await page.getByRole('alert').count()) === 1 && (await nachkomme(page)).id === null, 'Fehler')
  assert.equal(await page.getByRole('option').count(), 0)
  await page.getByRole('combobox').press('Enter')
  assert.equal(kanonisch(await ereignisse(page)).length, 0)

  await bereit(page, feld)
  await tippen(page, 'off')
  await warten(async () => {
    const text = await page.getByRole('alert').innerText().catch(() => '')
    return text.includes('nicht erreichbar') && (await nachkomme(page)).id === null
  }, 'nicht erreichbar')
  assert.equal(await page.getByRole('option').count(), 0)

  await bereit(page, feld)
  halten = new Promise((resolve) => {
    haltenResolve = resolve
  })
  await tippen(page, 'slow')
  await warten(async () => {
    const text = await page.getByRole('listbox').innerText().catch(() => '')
    const jetzt = await nachkomme(page)
    return text.includes('Suche') && jetzt.id === null && (await page.getByRole('option').count()) === 0
  }, 'lädt')
  haltenResolve()
  halten = null
  await optionen(page, 1)
}

let haltenResolve = () => {}

async function eltern(page, feld) {
  await bereit(page, feld)
  await tippen(page, 'aaa')
  await optionen(page, 3)
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').press('ArrowDown')
  if (feld === 'ort') {
    await page.evaluate(() => window.__steuerung.ortSetzen({ id: 'geonames:9', name: 'Lissabon' }, 'Lissabon'))
    await warten(async () => (await page.getByRole('combobox').inputValue()) === 'Lissabon', 'Elterntext Ort')
  } else {
    await page.evaluate(() => window.__steuerung.flugSetzen({ iata: 'GVA', name: 'Genf · GVA' }))
    await warten(async () => (await page.getByRole('combobox').inputValue()) === 'Genf · GVA', 'Elterntext Flughafen')
  }
  await warten(async () => {
    const jetzt = await zustand(page)
    return jetzt.expanded === 'false' && jetzt.nachkomme.id === null && jetzt.kanonisch.length === 0
  }, 'Elternwechsel ohne Listenauswahl')
}

async function rolleKuerzt(page) {
  await bereit(page, 'ort')
  await tippen(page, 'aaa')
  await optionen(page, 3)
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').press('ArrowDown')
  await page.getByRole('combobox').press('ArrowDown')
  await warten(async () => (await nachkomme(page)).id?.endsWith('-2') === true, 'Index 2')
  await page.evaluate(() => window.__steuerung.rolle('abreise'))
  await optionen(page, 1)
  const nach = await nachkomme(page)
  assert.equal(nach.vorhanden, nach.id !== null)
  if (nach.id) {
    const el = await page.evaluate((id) => document.getElementById(id)?.getAttribute('role'), nach.id)
    assert.equal(el, 'option')
  }
  await page.getByRole('combobox').press('Enter')
  assert.equal(kanonisch(await ereignisse(page)).length, 0)
}

async function lauf(viewport, touch, felder, namen) {
  const context = await browser.newContext({ viewport, hasTouch: touch })
  const page = await context.newPage()
  page.on('pageerror', (error) => ergebnis.pageErrors.push(String(error)))
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin === origin) {
      if (url.pathname.startsWith('/api/search/')) {
        const art = url.pathname.includes('airports') ? 'airports' : 'places'
        const spec = antwort(art, url)
        if (spec.hold) await halten
        await route.fulfill({
          status: spec.status,
          contentType: 'application/json',
          body: JSON.stringify(spec.body),
        })
        return
      }
      await route.continue()
      return
    }
    abgebrochen.push(url.toString())
    await route.abort()
  })
  await page.goto(origin, { waitUntil: 'networkidle' })
  for (const feld of felder) {
    for (const name of namen) {
      const titel = `${feld}/${name}/${viewport.width}${touch ? '/touch' : ''}`
      await szenario(page, titel, async () => {
        if (name === 'keyboard') await tastatur(page, feld)
        else if (name === 'pointer') await zeiger(page, feld, 'mouse')
        else if (name === 'touch') await zeiger(page, feld, 'touch')
        else if (name === 'responses') await antworten(page, feld)
        else if (name === 'parent') await eltern(page, feld)
        else if (name === 'rolle') await rolleKuerzt(page)
        else throw new Error(name)
      })
    }
  }
  await context.close()
}

await lauf({ width: 1280, height: 800 }, false, ['ort', 'flughafen'], ['keyboard', 'pointer', 'responses', 'parent'])
await lauf({ width: 1280, height: 800 }, false, ['ort'], ['rolle'])
await lauf({ width: 390, height: 844 }, true, ['ort', 'flughafen'], ['touch', 'keyboard'])

ergebnis.aborted = abgebrochen
ergebnis.pass = ergebnis.scenarios.every((eintrag) => eintrag.pass) && abgebrochen.length === 0 && ergebnis.pageErrors.length === 0
if (abgebrochen.length) ergebnis.scenarios.push({ name: 'unexpected-requests', pass: false, error: abgebrochen.join('\n') })
writeFileSync(join(nachweis, 'results.json'), `${JSON.stringify(ergebnis, null, 2)}\n`)
await browser.close()
server.close()
console.log(ergebnis.pass ? 'HARNESS PASS' : 'HARNESS FAIL')
process.exit(ergebnis.pass ? 0 : 1)
