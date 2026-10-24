// Isolated synthetic proof for the real guest list and workspace read states.
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
const DIR = join(REPO, 'scripts/guest-trip-read-recovery-1')
const EVIDENCE = join(REPO, 'docs/evidence/guest-trip-read-recovery-1')
const SCREENS = join(EVIDENCE, 'screens')
const OUT = join('/tmp', 'guest-trip-read-recovery-1')
const SHIMS = join(DIR, 'shims')

mkdirSync(OUT, { recursive: true })
mkdirSync(SCREENS, { recursive: true })

const quellen = [
  'components/trips/GastReisen.tsx',
  'components/trips/GastArbeitsbereich.tsx',
  'components/trips/gast-reise-lesezustand.ts',
  'components/trips/GastReiseLesefehler.tsx',
  'lib/trips/gastspeicher.ts',
  'lib/trips/create-entry.ts',
]

function sha(datei) {
  return createHash('sha256').update(readFileSync(join(REPO, datei))).digest('hex')
}
function blob(datei) {
  return execFileSync('git', ['hash-object', datei], { cwd: REPO, encoding: 'utf8' }).trim()
}

function compileCss() {
  const postcss = require('postcss')
  const nesting = require('tailwindcss/nesting')
  const tailwindcss = require('tailwindcss')
  const autoprefixer = require('autoprefixer')
  const from = join(REPO, 'styles/globals.css')
  const config = require(join(REPO, 'tailwind.config.js'))
  return postcss([nesting(), tailwindcss(config), autoprefixer()])
    .process(readFileSync(from, 'utf8'), { from })
    .then((result) => result.css)
}

const esbuild = require('esbuild')
const empty = join(SHIMS, 'empty.ts')
const genau = new Map([
  ['next/link', join(SHIMS, 'link.tsx')],
  ['next/navigation', join(SHIMS, 'navigation.tsx')],
  ['next/dynamic', join(SHIMS, 'dynamic.tsx')],
  ['next/image', join(SHIMS, 'image.tsx')],
  ['next/cache', join(SHIMS, 'cache.ts')],
  ['next/headers', join(SHIMS, 'headers.ts')],
  ['next/server', empty],
  ['server-only', empty],
  ['@opentelemetry/api', empty],
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
  banner: {
    js: 'globalThis.process = globalThis.process || { env: { NODE_ENV: "production" } }; globalThis.global = globalThis;',
  },
  logLevel: 'silent',
  plugins: [
    {
      name: 'guest-read-shims',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.path.startsWith('.') || args.path.startsWith('/') || args.path.startsWith('@/')) return null
          const ziel = genau.get(args.path)
          if (ziel) return { path: ziel }
          if (args.path.startsWith('next/') || args.path.startsWith('node:') || args.path === 'next') {
            return { path: empty }
          }
          return null
        })
      },
    },
  ],
})

const harnessJs = readFileSync(join(OUT, 'harness.js'))
const css = await compileCss()
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Gast Reise Lesen</title><link rel="stylesheet" href="/style.css"></head><body class="bg-canvas text-ink-800"><button id="davor" type="button">Davor</button><div id="root" class="min-w-0 max-w-full"></div><script src="/harness.js"></script></body></html>`

const server = createServer((req, res) => {
  const pfad = new URL(req.url || '/', 'http://127.0.0.1').pathname
  if (pfad === '/harness.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
    res.end(harnessJs)
    return
  }
  if (pfad === '/style.css') {
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-store' })
    res.end(css)
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

const ergebnis = {
  author: 'Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1',
  session: 'bc-2806475d-7ee4-40d0-980e-1d26bcb5b270',
  model: 'grok-4.7-high-fast',
  origin,
  boundary:
    'Synthetic isolated local Playwright. Real GastReisen and GastArbeitsbereich with real gastspeicher and create-entry. next/link, next/navigation, next/dynamic, next/cache, next/headers and server-only are harness shims so the components mount outside Next. No hosted account, personal browser, provider, or model call.',
  sources: Object.fromEntries(quellen.map((datei) => [datei, { sha256: sha(datei), blob: blob(datei) }])),
  scenarios: [],
  pageErrors: [],
  externalRequests: [],
}

let browser
try {
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' })
    ergebnis.browser = { channel: 'chrome', version: browser.version() }
  } catch {
    browser = await chromium.launch({ headless: true })
    ergebnis.browser = { channel: 'chromium', version: browser.version() }
  }
} catch (error) {
  ergebnis.status = 'NOT RUN'
  ergebnis.blocked = String(error && error.message ? error.message : error)
  writeFileSync(join(EVIDENCE, 'results.json'), `${JSON.stringify(ergebnis, null, 2)}\n`)
  server.close()
  console.error('NOT RUN / BLOCKED')
  console.error(ergebnis.blocked)
  process.exit(2)
}

function kurz(text) {
  return String(text || '').replace(/\s+/g, ' ').slice(0, 500)
}

async function szenario(name, fn) {
  const eintrag = { name, pass: false }
  try {
    const detail = await fn()
    eintrag.pass = true
    if (detail) eintrag.detail = detail
  } catch (error) {
    eintrag.pass = false
    eintrag.error = kurz(error && error.stack ? error.stack : error)
  }
  ergebnis.scenarios.push(eintrag)
  if (!eintrag.pass) console.error(`FAIL ${name}\n${eintrag.error}`)
  else console.log(`PASS ${name}`)
  return eintrag.pass
}

async function seite(viewport, fontPx = 16) {
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('pageerror', (error) => {
    errors.push(kurz(error && error.message ? error.message : error))
    ergebnis.pageErrors.push({ viewport, fontPx, message: errors.at(-1) })
  })
  await page.route('**/*', (route) => {
    const url = route.request().url()
    let erlaubt = false
    try {
      erlaubt = new URL(url).origin === new URL(origin).origin
    } catch {
      erlaubt = false
    }
    if (!erlaubt) {
      ergebnis.externalRequests.push({ url, method: route.request().method() })
      return route.abort('blockedbyclient')
    }
    return route.continue()
  })
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.evaluate((px) => {
    document.documentElement.style.fontSize = `${px}px`
  }, fontPx)
  return { page, errors }
}

async function warten(page, probe, label) {
  const start = Date.now()
  let last = null
  while (Date.now() - start < 5000) {
    last = await page.evaluate(probe)
    if (last && last.ok) return last
    await new Promise((resolve) => setTimeout(resolve, 40))
  }
  throw new Error(`${label}: ${JSON.stringify(last)}`)
}

async function beobachter(page) {
  await page.evaluate(() => {
    window.__gesehen = []
    const merken = () => {
      const text = document.body.innerText
      if (window.__gesehen.at(-1) !== text) window.__gesehen.push(text)
    }
    merken()
    const obs = new MutationObserver(merken)
    obs.observe(document.body, { childList: true, subtree: true, characterData: true })
    window.__leseObs = obs
  })
}

async function gesehen(page) {
  return page.evaluate(() => window.__gesehen.map((text) => text.replace(/\s+/g, ' ').slice(0, 400)))
}

async function ueberlauf(page) {
  return page.evaluate(() => {
    const wurzel = document.documentElement
    const knopf = [...document.querySelectorAll('button, a')].find((el) =>
      (el.textContent || '').includes('Erneut prüfen') || (el.textContent || '').includes('Reise erstellen') || (el.textContent || '').includes('Reise fortsetzen'),
    )
    const box = knopf ? knopf.getBoundingClientRect() : null
    return {
      scroll: wurzel.scrollWidth,
      client: wurzel.clientWidth,
      knopf: box
        ? { width: Math.round(box.width), height: Math.round(box.height), left: Math.round(box.left), right: Math.round(box.right) }
        : null,
    }
  })
}

function keineErstellung(text) {
  return !text.includes('Reise erstellen') && !text.includes('Deine erste Reise beginnt hier')
}

async function liste(page, vorbereiten) {
  await page.evaluate(() => window.gastNachweis.leeren())
  if (vorbereiten) await page.evaluate(vorbereiten)
  await page.evaluate(() => window.gastNachweis.zaehlerLeeren())
  const davor = await page.evaluate(() => window.gastNachweis.roh())
  await beobachter(page)
  await page.evaluate(() => window.gastNachweis.renderListe())
  return { davor }
}

try {
  await szenario('liste-abwesend-nach-laden', async () => {
    const { page, errors } = await seite({ width: 390, height: 844 })
    await liste(page)
    const stand = await warten(
      page,
      () => {
        const text = document.body.innerText
        return { ok: text.includes('Deine erste Reise beginnt hier'), text: text.slice(0, 300), art: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') }
      },
      'absent list',
    )
    const frames = await gesehen(page)
    assert.equal(stand.art, 'fehlend')
    assert.ok(frames.some((text) => text.includes('Der Browserspeicher wird geprüft') && !text.includes('Deine erste Reise')))
    assert.equal(errors.length, 0)
    await page.locator('#root').screenshot({ path: join(SCREENS, 'liste-abwesend-390.png') })
    await page.close()
    return { art: stand.art, loadingFrames: frames.filter((text) => text.includes('Der Browserspeicher wird geprüft')).length }
  })

  await szenario('liste-ungueltig-ohne-erste-reise', async () => {
    const { page, errors } = await seite({ width: 320, height: 720 })
    await liste(page, () => {
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON')
    })
    const stand = await warten(
      page,
      () => {
        const art = document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart')
        return { ok: art === 'ungueltig', art, text: document.body.innerText.slice(0, 400) }
      },
      'invalid list',
    )
    assert.equal(keineErstellung(stand.text), true)
    assert.match(stand.text, /Erneut prüfen/)
    const nachher = await page.evaluate(() => ({
      roh: window.gastNachweis.roh(),
      writes: window.gastNachweis.vorgaenge.length,
    }))
    assert.equal(nachher.roh.aktiv, '{kein JSON')
    assert.equal(nachher.writes, 0)
    assert.equal(errors.length, 0)
    const mass = await ueberlauf(page)
    assert.ok(mass.scroll <= mass.client + 1)
    assert.ok(mass.knopf && mass.knopf.height >= 44 && mass.knopf.right <= 321)
    await page.locator('#root').screenshot({ path: join(SCREENS, 'liste-ungueltig-320.png') })
    await page.close()
    return { writes: nachher.writes, overflow: mass }
  })

  await szenario('liste-unlesbar-und-erneut', async () => {
    const { page, errors } = await seite({ width: 390, height: 844 })
    await liste(page, () => {
      window.gastNachweis.anlegen('trip-wieder', 'Wieder sichtbar')
      window.gastNachweis.werfen(true)
    })
    await warten(
      page,
      () => ({ ok: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') === 'speicher_unlesbar' }),
      'unreadable list',
    )
    const text = await page.evaluate(() => document.body.innerText)
    assert.equal(keineErstellung(text), true)
    await page.evaluate(() => {
      window.gastNachweis.werfen(false)
      window.gastNachweis.zaehlerLeeren()
    })
    await page.getByRole('button', { name: 'Erneut prüfen' }).click()
    const stand = await warten(
      page,
      () => ({
        ok: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') === 'gueltig',
        text: document.body.innerText.slice(0, 300),
      }),
      'restored list',
    )
    assert.match(stand.text, /Wieder sichtbar/)
    assert.match(stand.text, /Reise fortsetzen/)
    const writes = await page.evaluate(() => window.gastNachweis.vorgaenge.length)
    assert.equal(writes, 0)
    assert.equal(errors.length, 0)
    await page.locator('#root').screenshot({ path: join(SCREENS, 'liste-wieder-390.png') })
    await page.close()
    return { writes }
  })

  await szenario('liste-ungueltig-zu-gueltig-und-abwesend', async () => {
    const { page, errors } = await seite({ width: 1280, height: 900 })
    await liste(page, () => {
      const id = window.gastNachweis.anlegen('trip-wechsel', 'Wechselnde Reise')
      window.gastNachweis.__id = id
      const roh = window.gastNachweis.roh().aktiv
      window.gastNachweis.__gueltig = roh
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON')
    })
    await warten(page, () => ({ ok: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') === 'ungueltig' }), 'invalid before')
    await page.evaluate(() => {
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, window.gastNachweis.__gueltig)
      window.gastNachweis.zaehlerLeeren()
    })
    await page.getByRole('button', { name: 'Erneut prüfen' }).click()
    await warten(
      page,
      () => ({ ok: document.body.innerText.includes('Wechselnde Reise') && document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') === 'gueltig' }),
      'became valid',
    )
    const writesValid = await page.evaluate(() => window.gastNachweis.vorgaenge.length)
    assert.equal(writesValid, 0)
    await page.evaluate(() => {
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON')
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON')
      window.gastNachweis.zaehlerLeeren()
      window.gastNachweis.renderListe()
    })
    await warten(page, () => ({ ok: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') === 'ungueltig' }), 'invalid again')
    await page.evaluate(() => {
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, null)
      window.gastNachweis.zaehlerLeeren()
    })
    await page.getByRole('button', { name: 'Erneut prüfen' }).click()
    const absent = await warten(
      page,
      () => ({ ok: document.body.innerText.includes('Deine erste Reise beginnt hier'), art: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') }),
      'became absent',
    )
    assert.equal(absent.art, 'fehlend')
    const writesAbsent = await page.evaluate(() => window.gastNachweis.vorgaenge.length)
    assert.equal(writesAbsent, 0)
    assert.equal(errors.length, 0)
    await page.locator('#root').screenshot({ path: join(SCREENS, 'liste-abwesend-1280.png') })
    await page.close()
    return { writesValid, writesAbsent }
  })

  await szenario('liste-warteschlange-und-legacy', async () => {
    const { page, errors } = await seite({ width: 390, height: 844 })
    await liste(page, () => {
      const id = window.gastNachweis.anlegen('trip-queue', 'Wartende Reise')
      const roh = window.gastNachweis.roh().aktiv
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, null)
      window.gastNachweis.setzen(window.gastNachweis.schluessel.warteschlange, JSON.stringify([JSON.parse(roh)]))
      window.gastNachweis.__queue = id
    })
    const queue = await warten(
      page,
      () => ({
        ok: document.body.innerText.includes('Wartende Reise') && document.body.innerText.includes('Reise erstellen'),
        art: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart'),
      }),
      'queue list',
    )
    assert.equal(queue.art, 'nur_warteschlange')
    const queueWrites = await page.evaluate(() => window.gastNachweis.vorgaenge.length)
    assert.equal(queueWrites, 0)
    await page.evaluate(() => {
      window.gastNachweis.leeren()
      window.gastNachweis.legacy('trip-alt-1', 'Barcelona')
      window.gastNachweis.zaehlerLeeren()
      window.gastNachweis.renderListe()
    })
    await warten(
      page,
      () => ({ ok: document.body.innerText.includes('Barcelona') && document.body.innerText.includes('Reise fortsetzen') }),
      'legacy list',
    )
    const legacy = await page.evaluate(() => ({
      writes: window.gastNachweis.vorgaenge.map((eintrag) => eintrag.art + ':' + eintrag.schluessel),
      roh: window.gastNachweis.roh(),
      art: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart'),
    }))
    assert.equal(legacy.art, 'gueltig')
    assert.equal(legacy.roh.legacy, null)
    assert.match(legacy.roh.aktiv, /trip-alt-1/)
    assert.ok(legacy.writes.length > 0)
    assert.equal(errors.length, 0)
    await page.close()
    return { queueWrites, legacyWrites: legacy.writes.length }
  })

  async function fokusStand(page) {
    return page.evaluate(() => {
      const aktiv = document.activeElement
      return {
        tag: aktiv ? aktiv.tagName : '',
        id: aktiv && 'id' in aktiv ? aktiv.id : '',
        text: (aktiv && aktiv.textContent ? aktiv.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 80),
        fokus: aktiv instanceof Element ? aktiv.getAttribute('data-gast-fokus') : '',
      }
    })
  }

  async function tasteAufPruefen(page, taste) {
    await page.locator('#davor').focus()
    await page.keyboard.press('Tab')
    const vorher = await fokusStand(page)
    assert.match(vorher.text, /Erneut prüfen/)
    await beobachter(page)
    await page.keyboard.press(taste)
    return { vorher }
  }

  await szenario('tastatur-fokus-nach-pruefung', async () => {
    const { page, errors } = await seite({ width: 390, height: 800 })
    const faelle = []
    const matrix = [
      ['liste', 'ungueltig', 'Enter'],
      ['liste', 'ungueltig', 'Space'],
      ['liste', 'unlesbar', 'Enter'],
      ['liste', 'unlesbar', 'Space'],
      ['bereich', 'ungueltig', 'Enter'],
      ['bereich', 'ungueltig', 'Space'],
      ['bereich', 'unlesbar', 'Enter'],
      ['bereich', 'unlesbar', 'Space'],
    ]
    for (const [flaeche, art, taste] of matrix) {
      await page.evaluate(() => {
        window.gastNachweis.leeren()
        window.gastNachweis.werfen(false)
        window.gastNachweis.werfenFuer(null)
      })
      if (art === 'ungueltig') {
        await page.evaluate(() => window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON'))
      } else {
        await page.evaluate(() => window.gastNachweis.werfen(true))
      }
      if (flaeche === 'liste') await page.evaluate(() => window.gastNachweis.renderListe())
      else await page.evaluate(() => window.gastNachweis.renderBereich('trip-fest'))
      await warten(
        page,
        () => ({ ok: document.querySelector('[data-gast-fokus="erneut"]') instanceof HTMLElement }),
        `${flaeche} ${art} button`,
      )
      await tasteAufPruefen(page, taste)
      await warten(
        page,
        () => ({
          ok:
            document.querySelector('[data-gast-fokus="erneut"]') instanceof HTMLElement &&
            !document.body.innerText.includes('Der Browserspeicher wird geprüft'),
        }),
        `${flaeche} ${art} ${taste} settled`,
      )
      const rahmen = await gesehen(page)
      const nachher = await fokusStand(page)
      assert.ok(rahmen.some((text) => text.includes('Der Browserspeicher wird geprüft')), JSON.stringify(rahmen))
      assert.equal(nachher.fokus, 'erneut', JSON.stringify(nachher))
      assert.notEqual(nachher.tag, 'BODY')
      faelle.push({ flaeche, art, taste, fokus: nachher.fokus })
    }

    await page.evaluate(() => {
      window.gastNachweis.leeren()
      window.gastNachweis.werfen(false)
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON')
      window.gastNachweis.renderListe()
    })
    await warten(page, () => ({ ok: document.querySelector('[data-gast-fokus="erneut"]') instanceof HTMLElement }), 'list recovery button')
    await page.locator('#davor').focus()
    await page.keyboard.press('Tab')
    await beobachter(page)
    await page.evaluate(() => window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, null))
    await page.keyboard.press('Enter')
    await warten(page, () => ({ ok: document.body.innerText.includes('Deine erste Reise beginnt hier') }), 'list recovered')
    const listeFokus = await fokusStand(page)
    assert.equal(listeFokus.fokus, 'weiter', JSON.stringify(listeFokus))
    assert.match(listeFokus.text, /Reise erstellen/)

    const fokusId = await page.evaluate(() => window.gastNachweis.anlegen('trip-fokus', 'Fokus Reise'))
    await page.evaluate((id) => {
      const roh = window.gastNachweis.roh().aktiv
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON')
      window.gastNachweis.renderBereich(id)
      window.__fokusRoh = roh
    }, fokusId)
    await warten(page, () => ({ ok: document.querySelector('[data-gast-fokus="erneut"]') instanceof HTMLElement }), 'workspace recovery button')
    await page.locator('#davor').focus()
    await page.keyboard.press('Tab')
    await beobachter(page)
    await page.evaluate(() => window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, window.__fokusRoh))
    await page.keyboard.press('Enter')
    await warten(page, () => ({ ok: document.body.innerText.includes('Fokus Reise') }), 'workspace recovered')
    const bereichFokus = await fokusStand(page)
    assert.equal(bereichFokus.fokus, 'weiter', JSON.stringify(bereichFokus))
    assert.notEqual(bereichFokus.tag, 'BODY')

    await page.evaluate(() => {
      window.gastNachweis.leeren()
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON')
      window.gastNachweis.renderListe()
    })
    await warten(page, () => ({ ok: document.querySelector('[data-gast-fokus="erneut"]') instanceof HTMLElement }), 'movement button')
    await page.locator('#davor').focus()
    await page.keyboard.press('Tab')
    await page.evaluate(() => {
      const obs = new MutationObserver(() => {
        if (document.body.innerText.includes('Der Browserspeicher wird geprüft')) {
          document.getElementById('davor')?.focus()
          obs.disconnect()
        }
      })
      obs.observe(document.body, { childList: true, subtree: true, characterData: true })
    })
    await page.keyboard.press('Enter')
    await warten(
      page,
      () => ({
        ok:
          document.querySelector('[data-gast-leseart="ungueltig"]') instanceof HTMLElement &&
          !document.body.innerText.includes('Der Browserspeicher wird geprüft'),
      }),
      'movement settled',
    )
    const bewegt = await fokusStand(page)
    assert.equal(bewegt.id, 'davor', JSON.stringify(bewegt))

    assert.equal(errors.length, 0)
    await page.close()
    return { unchanged: faelle.length, listRecovery: listeFokus.fokus, workspaceRecovery: bereichFokus.fokus, moved: bewegt.id }
  })

  await szenario('tastatur-erneut-pruefen', async () => {
    const { page, errors } = await seite({ width: 1280, height: 900 })
    await liste(page, () => {
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON')
    })
    await warten(page, () => ({ ok: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') === 'ungueltig' }), 'keyboard ready')
    await page.locator('#davor').focus()
    await page.keyboard.press('Tab')
    const fokus = await page.evaluate(() => ({
      text: (document.activeElement && document.activeElement.textContent || '').trim(),
      tag: document.activeElement && document.activeElement.tagName,
    }))
    assert.equal(fokus.tag, 'BUTTON')
    assert.match(fokus.text, /Erneut prüfen/)
    await page.evaluate(() => window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, null))
    await page.keyboard.press('Enter')
    await warten(page, () => ({ ok: document.body.innerText.includes('Deine erste Reise beginnt hier') }), 'keyboard recheck')
    assert.equal(errors.length, 0)
    await page.close()
    return fokus
  })

  await szenario('arbeitsbereich-andere-und-passend', async () => {
    const { page, errors } = await seite({ width: 390, height: 844 })
    await page.evaluate(() => {
      window.gastNachweis.leeren()
      window.gastNachweis.anlegen('trip-alpha', 'Alpha Entwurf')
      window.gastNachweis.zaehlerLeeren()
      window.gastNachweis.renderBereich('trip-beta')
    })
    const andere = await warten(
      page,
      () => ({
        ok: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') === 'andere_reise',
        text: document.body.innerText.slice(0, 500),
      }),
      'other trip',
    )
    assert.match(andere.text, /eine andere Reise/)
    assert.doesNotMatch(andere.text, /Entwurf verwerfen/)
    assert.doesNotMatch(andere.text, /Reise erstellen/)
    const href = await page.evaluate(() => document.querySelector('a[href="/reisen/trip-alpha"]')?.getAttribute('href'))
    assert.equal(href, '/reisen/trip-alpha')
    const writes = await page.evaluate(() => window.gastNachweis.vorgaenge.length)
    assert.equal(writes, 0)
    await page.locator('#root').screenshot({ path: join(SCREENS, 'arbeitsbereich-andere-390.png') })
    await page.evaluate(() => {
      window.gastNachweis.zaehlerLeeren()
      window.gastNachweis.renderBereich('trip-alpha')
    })
    const passend = await warten(
      page,
      () => ({
        ok: document.body.innerText.includes('Alpha Entwurf') && document.body.innerText.includes('Entwurf verwerfen'),
        text: document.body.innerText.slice(0, 400),
      }),
      'matching trip',
    )
    assert.doesNotMatch(passend.text, /eine andere Reise/)
    assert.equal(errors.length, 0)
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.locator('#root').screenshot({ path: join(SCREENS, 'arbeitsbereich-passend-1280.png') })
    await page.close()
    return { writes }
  })

  await szenario('arbeitsbereich-tripwechsel-ohne-alten-titel', async () => {
    const { page, errors } = await seite({ width: 1280, height: 900 })
    await page.evaluate(() => {
      window.gastNachweis.leeren()
      window.gastNachweis.anlegen('trip-alpha', 'Alpha Entwurf')
      const roh = window.gastNachweis.roh().aktiv
      const beta = JSON.parse(roh)
      beta.id = 'trip-beta'
      beta.clientRef = 'trip-beta'
      beta.title = 'Beta Entwurf'
      window.gastNachweis.__beta = JSON.stringify(beta)
    })
    await beobachter(page)
    await page.evaluate(() => window.gastNachweis.renderBereich('trip-alpha'))
    await warten(page, () => ({ ok: document.body.innerText.includes('Entwurf verwerfen') && document.body.innerText.includes('Alpha Entwurf') }), 'alpha mounted')
    await page.evaluate(() => {
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, window.gastNachweis.__beta)
      window.gastNachweis.renderBereich('trip-beta')
    })
    await warten(page, () => ({ ok: document.body.innerText.includes('Beta Entwurf') && document.body.innerText.includes('Entwurf verwerfen') }), 'beta mounted')
    const frames = await gesehen(page)
    const gemischt = frames.filter((text) => text.includes('Alpha Entwurf') && text.includes('Beta Entwurf'))
    const ladenOhneAlpha = frames.filter((text) => text.includes('Der Browserspeicher wird geprüft') && !text.includes('Alpha Entwurf'))
    assert.equal(gemischt.length, 0)
    assert.ok(ladenOhneAlpha.length > 0)
    assert.equal(errors.length, 0)
    await page.close()
    return { frames: frames.length, loadingWithoutPrevious: ladenOhneAlpha.length }
  })

  await szenario('arbeitsbereich-ungueltig-und-abwesend', async () => {
    const { page, errors } = await seite({ width: 320, height: 720 })
    await page.evaluate(() => {
      window.gastNachweis.leeren()
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON')
      window.gastNachweis.zaehlerLeeren()
      window.gastNachweis.renderBereich('trip-fest')
    })
    const invalid = await warten(
      page,
      () => ({
        ok: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') === 'ungueltig',
        text: document.body.innerText.slice(0, 400),
      }),
      'workspace invalid',
    )
    assert.equal(keineErstellung(invalid.text), true)
    const roh = await page.evaluate(() => ({ roh: window.gastNachweis.roh(), writes: window.gastNachweis.vorgaenge.length }))
    assert.equal(roh.roh.aktiv, '{kein JSON')
    assert.equal(roh.writes, 0)
    await page.evaluate(() => {
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, null)
      window.gastNachweis.zaehlerLeeren()
    })
    await page.getByRole('button', { name: 'Erneut prüfen' }).click()
    const absent = await warten(
      page,
      () => ({
        ok: document.body.innerText.includes('nicht verfügbar') && document.body.innerText.includes('Reise erstellen'),
        art: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart'),
      }),
      'workspace absent',
    )
    assert.equal(absent.art, 'fehlend')
    assert.equal(errors.length, 0)
    await page.close()
    return { writes: roh.writes }
  })

  await szenario('reflow-200', async () => {
    const { page, errors } = await seite({ width: 320, height: 900 }, 32)
    await liste(page, () => {
      window.gastNachweis.setzen(window.gastNachweis.schluessel.aktiv, '{kein JSON')
    })
    await warten(page, () => ({ ok: document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') === 'ungueltig' }), 'reflow ready')
    const mass = await ueberlauf(page)
    assert.ok(mass.scroll <= mass.client + 1, JSON.stringify(mass))
    assert.ok(mass.knopf && mass.knopf.height >= 44 && mass.knopf.left >= 0 && mass.knopf.right <= 321)
    await page.locator('#root').screenshot({ path: join(SCREENS, 'reflow-200-320.png') })
    await page.setViewportSize({ width: 1280, height: 900 })
    const weit = await ueberlauf(page)
    assert.ok(weit.scroll <= weit.client + 1, JSON.stringify(weit))
    await page.locator('#root').screenshot({ path: join(SCREENS, 'reflow-200-1280.png') })
    assert.equal(errors.length, 0)
    await page.close()
    return { narrow: mass, wide: weit }
  })
} finally {
  await browser.close()
  server.close()
}

const failed = ergebnis.scenarios.filter((eintrag) => !eintrag.pass)
ergebnis.status =
  failed.length === 0 && ergebnis.pageErrors.length === 0 && ergebnis.externalRequests.length === 0
    ? 'PASS'
    : 'FAIL'
ergebnis.passed = ergebnis.scenarios.filter((eintrag) => eintrag.pass).length
ergebnis.failed = failed.length
writeFileSync(join(EVIDENCE, 'results.json'), `${JSON.stringify(ergebnis, null, 2)}\n`)
console.log(`${ergebnis.status} ${ergebnis.passed}/${ergebnis.scenarios.length}`)
if (ergebnis.status !== 'PASS') process.exit(1)
