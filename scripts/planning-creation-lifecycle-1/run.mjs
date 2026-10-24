// Synthetic mounted proof for TripPlanner and Reiseidee.
// Local Playwright only. Action, router and link boundaries are stubs.
// Validation, route order, guest storage and proposal mapping stay real.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { chromium } from 'playwright'

const wurzel = process.cwd()
const nachweis = join(wurzel, 'docs/evidence/planning-creation-lifecycle-1')
const artefakte = '/opt/cursor/artifacts'
const require = createRequire(import.meta.url)
const tsxRequire = createRequire(require.resolve('tsx'))
const { build } = tsxRequire('esbuild')

const kopf = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wurzel, encoding: 'utf8' }).trim()
const faelle = []

function ortOption(id, label) {
  return { id, label, description: 'Stadt', typ: 'city', ariaLabel: `${label}, Stadt` }
}

function legacyEntwurf() {
  return {
    id: 'trip-alt-1',
    title: 'Barcelona',
    destination: 'Barcelona',
    origin: 'Zürich',
    startDate: '2026-09-12',
    endDate: '2026-09-14',
    travelers: 2,
    pace: 'ruhig',
    interests: ['Kultur', 'Kulinarik'],
    budget: 1800,
    travelWish: 'Zwei ruhige Tage.',
    days: [
      {
        id: 'day-2026-09-12',
        date: '2026-09-12',
        items: [{ id: 'item-1', title: 'Sagrada Família', time: '10:00', createdAt: '2026-08-01' }],
      },
      { id: 'day-2026-09-13', date: '2026-09-13', items: [] },
      { id: 'day-2026-09-14', date: '2026-09-14', items: [] },
    ],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  }
}

async function css() {
  const postcss = (await import('postcss')).default
  const tailwindcss = (await import('tailwindcss')).default
  const nesting = (await import('tailwindcss/nesting/index.js')).default
  const autoprefixer = (await import('autoprefixer')).default
  const from = join(wurzel, 'styles/globals.css')
  const ergebnis = await postcss([
    nesting(),
    tailwindcss(require(join(wurzel, 'tailwind.config.js'))),
    autoprefixer(),
  ]).process(readFileSync(from, 'utf8'), { from })
  return ergebnis.css
}

const temp = join(tmpdir(), `jetnity-planning-lifecycle-${process.pid}`)
mkdirSync(temp, { recursive: true })
mkdirSync(nachweis, { recursive: true })
mkdirSync(artefakte, { recursive: true })

await build({
  entryPoints: [join(wurzel, 'scripts/planning-creation-lifecycle-1/harness.tsx')],
  outfile: join(temp, 'harness.js'),
  bundle: true,
  write: true,
  platform: 'browser',
  format: 'iife',
  jsx: 'automatic',
  plugins: [
    {
      name: 'jetnity-grenzen',
      setup(api) {
        const datei = {
          '@/lib/places/aktionen': 'grenzen/orte.ts',
          '@/lib/trips/aktionen': 'grenzen/konto.ts',
          '@/lib/reisevorschlag/aktionen': 'grenzen/vorschlag.ts',
          'next/navigation': 'grenzen/navigation.tsx',
          'next/link': 'grenzen/link.tsx',
        }
        const aufloesen = (spec) => {
          const basis = join(wurzel, spec.slice(2))
          const endungen = ['.tsx', '.ts', '.js', '.mjs']
          for (const endung of endungen) {
            if (existsSync(basis + endung)) return basis + endung
            if (existsSync(join(basis, `index${endung}`))) return join(basis, `index${endung}`)
          }
          return basis
        }
        api.onResolve({ filter: /.*/ }, (args) => {
          if (args.path.startsWith('\0')) return null
          const ersatz = datei[args.path]
          if (ersatz) return { path: join(wurzel, 'scripts/planning-creation-lifecycle-1', ersatz) }
          if (args.path.startsWith('@/')) return { path: aufloesen(args.path) }
          return null
        })
      },
    },
  ],
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'silent',
})

const harnessJs = readFileSync(join(temp, 'harness.js'))
const stil = await css()
const html = `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Planning creation lifecycle</title><link rel="stylesheet" href="/styles.css"><body style="margin:0"><div id="root"></div><script src="/harness.js"></script></body></html>`

const server = createServer((req, res) => {
  const pfad = new URL(req.url || '/', 'http://127.0.0.1').pathname
  if (pfad === '/harness.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
    res.end(harnessJs)
    return
  }
  if (pfad === '/styles.css') {
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-store' })
    res.end(stil)
    return
  }
  if (pfad === '/api/search/places') {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const rolle = url.searchParams.get('rolle') || ''
    const q = (url.searchParams.get('q') || '').toLowerCase()
    const body = rolle === 'abreise'
      ? [ortOption('geonames:2657896', 'Zürich')]
      : q.includes('rom')
        ? [ortOption('geonames:3169070', 'Rom')]
        : [ortOption('geonames:1861060', 'Japan')]
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify(body))
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
const origin = `http://127.0.0.1:${server.address().port}`

function schreiben(extra = {}) {
  const ergebnis = {
    head: kopf,
    failed: faelle.filter((fall) => !fall.ok).length,
    cases: faelle,
    stubs: {
      hosted: false,
      personalBrowser: false,
      modelCall: false,
      accountWrite: false,
      boundaries: [
        'next/navigation',
        'next/link',
        '@/lib/places/aktionen#reiseorteBestaetigen',
        '@/lib/trips/aktionen#reiseAnlegen',
        '@/lib/reisevorschlag/aktionen#vorschlagErzeugen',
        '@/lib/reisevorschlag/aktionen#vorschlagUebernehmen',
        '@/lib/reisevorschlag/aktionen#vorschlagOrteAufloesen',
      ],
      real: [
        'TripPlanner validation and route controls',
        'Reiseidee mounted proposal preview',
        'guest localStorage via gastreiseAnlegen and gastreiseAblegen',
        'vorschlagAlsReise',
        'compiled styles/globals.css',
      ],
      placeSearch: 'same-origin synthetic /api/search/places',
    },
    notVerified: [
      'physical device',
      'screen reader',
      'hosted account',
      'production database',
      'provider or model activation',
      'full App/Auth CI',
      'Vercel Preview',
    ],
    ...extra,
  }
  writeFileSync(join(nachweis, 'result.json'), `${JSON.stringify(ergebnis, null, 2)}\n`)
  return ergebnis
}

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

async function seite(viewport) {
  const context = await browser.newContext({ viewport })
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.origin === origin) return route.continue()
    return route.abort()
  })
  const page = await context.newPage()
  const fehler = []
  page.on('pageerror', (error) => fehler.push(error.message))
  await page.goto(origin)
  await page.waitForFunction(() => window.fixture?.steuerung)
  return { context, page, fehler }
}

async function neu(page, next = {}) {
  await page.evaluate((extra) => {
    window.fixture.calls.length = 0
    window.fixture.pushes.length = 0
    window.fixture.uuids.length = 0
    localStorage.clear()
    for (const name of ['orte', 'anlegen', 'erzeugen', 'uebernehmen', 'aufloesen']) {
      window.fixture.arm(name, 'ok')
    }
    window.fixture.steuerung.wieder(extra)
  }, next)
  await page.waitForSelector('[data-ready="1"]')
}

async function zeitraum(page) {
  return page.evaluate(() => {
    const iso = (tage) => {
      const jetzt = new Date()
      jetzt.setDate(jetzt.getDate() + tage)
      const lokal = new Date(jetzt.getTime() - jetzt.getTimezoneOffset() * 60_000)
      return lokal.toISOString().slice(0, 10)
    }
    return { start: iso(14), ende: iso(18) }
  })
}

async function ausfuellen(page, sucheZiel) {
  const { start, ende } = await zeitraum(page)
  if (sucheZiel) {
    await page.locator('#feld-ziel').fill('Ja')
    await page.getByRole('option', { name: 'Japan, Stadt' }).click()
  }
  await page.locator('#feld-abreiseort').fill('Zu')
  await page.getByRole('option', { name: 'Zürich, Stadt' }).click()
  await page.locator('#feld-start').fill(start)
  await page.locator('#feld-ende').fill(ende)
  await page.locator('#feld-reisende').fill('3')
  await page.locator('#feld-budget').fill('2500')
  await page.locator('textarea').fill('Ruhige Tage am Meer')
}

async function stand(page) {
  return page.evaluate(() => ({
    calls: window.fixture.calls.map((eintrag) => ({ name: eintrag.name, eingabe: eintrag.eingabe })),
    pushes: [...window.fixture.pushes],
    uuids: [...window.fixture.uuids],
    texte: window.fixture.texte,
    aktiv: localStorage.getItem('jetnity:reise:v3'),
    legacy: localStorage.getItem('jetnity:guest-trips:v2'),
    busy: document.querySelector('form')?.getAttribute('aria-busy'),
  }))
}

function anlegenRef(daten) {
  const aufruf = daten.calls.filter((eintrag) => eintrag.name === 'anlegen').at(-1)
  return aufruf?.eingabe?.clientRef
}

function uebernahmeRef(daten) {
  const aufruf = daten.calls.filter((eintrag) => eintrag.name === 'uebernehmen').at(-1)
  return aufruf?.eingabe?.clientRef
}

async function fall(name, fn) {
  try {
    await fn()
    faelle.push({ name, ok: true })
    console.log(`ok ${name}`)
  } catch (fehler) {
    faelle.push({ name, ok: false, error: fehler instanceof Error ? fehler.message : String(fehler) })
    schreiben()
    throw fehler
  }
}

try {
  const { context, page, fehler } = await seite({ width: 390, height: 900 })
  try {
    await fall('manual validation keeps focus path and does not call actions', async () => {
      await neu(page, { ansicht: 'manual', konto: false, destination: '', destinationId: '', weitere: [] })
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.getByRole('alert').first().waitFor()
      const daten = await stand(page)
      assert.equal(daten.calls.length, 0)
      assert.equal(daten.uuids.length, 1)
      assert.equal(daten.pushes.length, 0)
      await page.waitForFunction(() => document.activeElement?.id === 'feld-ziel')
    })

    await fall('manual guest success uses confirmed route, stable ref and real storage', async () => {
      await ausfuellen(page, true)
      const vorher = (await stand(page)).uuids[0]
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.waitForFunction(() => window.fixture.pushes.length === 1)
      const daten = await stand(page)
      const reise = JSON.parse(daten.aktiv)
      assert.equal(daten.calls[0].name, 'orte')
      assert.equal(daten.calls[0].eingabe.zielId, 'geonames:1861060')
      assert.equal(daten.calls[0].eingabe.abreiseId, 'geonames:2657896')
      assert.equal(reise.id, `trip-${vorher}`)
      assert.equal(reise.clientRef, reise.id)
      assert.equal(reise.originPlaceId, 'geonames:2657896')
      assert.equal(reise.travellers, 3)
      assert.equal(reise.budgetAmount, 2500)
      assert.equal(reise.travelWish, 'Ruhige Tage am Meer')
      assert.equal(daten.pushes[0], `/reisen/${reise.id}`)
      assert.equal(daten.uuids[0], vorher)
      assert.equal(daten.calls.some((eintrag) => eintrag.name === 'anlegen'), false)
    })

    await fall('existing guest draft blocks a second create without overwrite', async () => {
      const bytes = (await stand(page)).aktiv
      await page.evaluate(() => {
        window.fixture.calls.length = 0
        window.fixture.pushes.length = 0
        window.fixture.uuids.length = 0
        window.fixture.steuerung.wieder({ ansicht: 'manual', konto: false })
      })
      await page.waitForSelector('[data-ready="1"]')
      await ausfuellen(page, false)
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.getByRole('status').waitFor()
      const daten = await stand(page)
      assert.equal(daten.calls.length, 0)
      assert.equal(daten.aktiv, bytes)
      assert.equal(daten.pushes.length, 0)
      assert.match(await page.getByRole('status').innerText(), /bestehenden Entwurf/)
    })

    await fall('invalid active bytes stay untouched', async () => {
      await neu(page, { ansicht: 'manual', konto: false })
      await ausfuellen(page, false)
      await page.evaluate(() => localStorage.setItem('jetnity:reise:v3', '{'))
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.getByRole('status').waitFor()
      const daten = await stand(page)
      assert.equal(daten.calls.length, 0)
      assert.equal(daten.aktiv, '{')
    })

    await fall('valid legacy slot blocks create and is not overwritten', async () => {
      await neu(page, { ansicht: 'manual', konto: false })
      await ausfuellen(page, false)
      const roh = JSON.stringify([legacyEntwurf()])
      await page.evaluate((wert) => {
        localStorage.removeItem('jetnity:reise:v3')
        localStorage.setItem('jetnity:guest-trips:v2', wert)
      }, roh)
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.getByRole('status').waitFor()
      const daten = await stand(page)
      assert.equal(daten.calls.length, 0)
      assert.equal(daten.legacy, roh)
      assert.equal(daten.aktiv, null)
    })

    await fall('account create ignores guest storage and keeps clientRef', async () => {
      await neu(page, { ansicht: 'manual', konto: false })
      await ausfuellen(page, false)
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.waitForFunction(() => window.fixture.pushes.length === 1)
      const bytes = (await stand(page)).aktiv
      await page.evaluate(() => {
        window.fixture.calls.length = 0
        window.fixture.pushes.length = 0
        window.fixture.uuids.length = 0
        window.fixture.arm('anlegen', 'domain')
        window.fixture.steuerung.wieder({ ansicht: 'manual', konto: true })
      })
      await page.waitForSelector('[data-ready="1"]')
      await ausfuellen(page, false)
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.getByText((await stand(page)).texte.konto).waitFor()
      const erste = anlegenRef(await stand(page))
      assert.equal(erste, `trip-${(await stand(page)).uuids[0]}`)
      assert.equal((await stand(page)).aktiv, bytes)
      await page.evaluate(() => window.fixture.arm('anlegen', 'ok'))
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.waitForFunction(() => window.fixture.pushes.at(-1) === '/reisen/reise-konto-synthetisch')
      const danach = await stand(page)
      assert.equal(anlegenRef(danach), erste)
      assert.equal(danach.aktiv, bytes)
      assert.equal(danach.calls.filter((eintrag) => eintrag.name === 'orte').length, 2)
    })

    await fall('place domain error stays on the field and retry keeps the draft', async () => {
      await neu(page, { ansicht: 'manual', konto: true })
      await ausfuellen(page, false)
      await page.evaluate(() => window.fixture.arm('orte', 'domain'))
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      const texte = (await stand(page)).texte
      await page.getByRole('alert').filter({ hasText: texte.zielUnbekannt }).waitFor()
      assert.equal(await page.locator('#feld-ziel').inputValue(), 'Japan')
      assert.equal(await page.locator('textarea').inputValue(), 'Ruhige Tage am Meer')
      await page.evaluate(() => window.fixture.arm('orte', 'domain-plain'))
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.getByText(texte.ortFrei).waitFor()
      const daten = await stand(page)
      assert.equal(daten.uuids.length, 1)
      assert.equal(daten.pushes.length, 0)
    })

    await fall('place rejection and throw recover without a new identity', async () => {
      await neu(page, { ansicht: 'manual', konto: true })
      await ausfuellen(page, false)
      for (const modus of ['reject', 'throw']) {
        await page.evaluate((art) => {
          window.fixture.calls.length = 0
          window.fixture.arm('orte', art)
        }, modus)
        await page.getByRole('button', { name: 'Reise erstellen' }).click()
        const texte = (await stand(page)).texte
        await page.getByText(texte.transportManuell).waitFor()
        assert.equal(await page.getByRole('button', { name: 'Reise erstellen' }).isEnabled(), true)
      }
      const ref = (await stand(page)).uuids[0]
      await page.evaluate(() => window.fixture.arm('orte', 'ok'))
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.waitForFunction(() => window.fixture.pushes.length === 1)
      assert.equal(anlegenRef(await stand(page)), `trip-${ref}`)
    })

    await fall('account rejection recovers and retries the same clientRef', async () => {
      await neu(page, { ansicht: 'manual', konto: true })
      await ausfuellen(page, false)
      await page.evaluate(() => window.fixture.arm('anlegen', 'reject'))
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      const texte = (await stand(page)).texte
      await page.getByText(texte.transportManuell).waitFor()
      const ref = anlegenRef(await stand(page))
      await page.evaluate(() => window.fixture.arm('anlegen', 'throw'))
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.getByText(texte.transportManuell).waitFor()
      assert.equal(anlegenRef(await stand(page)), ref)
      await page.evaluate(() => window.fixture.arm('anlegen', 'ok'))
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.waitForFunction(() => window.fixture.pushes.at(-1) === '/reisen/reise-konto-synthetisch')
      assert.equal(anlegenRef(await stand(page)), ref)
    })

    await fall('rapid double submit invokes place confirmation once', async () => {
      await neu(page, { ansicht: 'manual', konto: true })
      await ausfuellen(page, false)
      await page.evaluate(() => {
        window.fixture.arm('orte', 'hold', 'ok')
        const form = document.querySelector('form')
        form.requestSubmit()
        form.requestSubmit()
      })
      await page.waitForFunction(() => window.fixture.calls.filter((eintrag) => eintrag.name === 'orte').length >= 1)
      const daten = await stand(page)
      assert.equal(daten.calls.filter((eintrag) => eintrag.name === 'orte').length, 1)
      await page.evaluate(() => window.fixture.los('orte'))
      await page.waitForFunction(() => window.fixture.pushes.length === 1)
      assert.equal((await stand(page)).calls.filter((eintrag) => eintrag.name === 'anlegen').length, 1)
    })

    await fall('pending manual controls keep the submitted draft', async () => {
      await neu(page, { ansicht: 'manual', konto: true })
      await ausfuellen(page, false)
      await page.evaluate(() => {
        window.fixture.arm('orte', 'hold', 'domain')
        const form = document.querySelector('form')
        form.requestSubmit()
        const wish = document.querySelector('textarea')
        const setzen = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
        setzen.call(wish, 'GEAENDERT')
        wish.dispatchEvent(new Event('input', { bubbles: true }))
        document.getElementById('ziel-reihenfolge-2-hoch').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      await page.waitForFunction(() => document.getElementById('feld-ziel').disabled)
      assert.equal(await page.locator('textarea').inputValue(), 'Ruhige Tage am Meer')
      assert.equal(await page.locator('#feld-ziel').inputValue(), 'Japan')
      const gesperrt = await page.evaluate(() => {
        const ids = ['feld-ziel', 'feld-abreiseort', 'feld-start', 'feld-ende', 'feld-reisende', 'feld-budget']
        const extra = [...document.querySelectorAll('[id^="feld-ziel-"]')].every((el) => el.disabled)
        const knopf = [...document.querySelectorAll('button')].every((el) => el.disabled)
        return ids.every((id) => document.getElementById(id).disabled) && extra && knopf && document.querySelector('form').getAttribute('aria-busy') === 'true'
      })
      assert.equal(gesperrt, true)
      let geaendert = false
      try {
        await page.locator('#feld-start').fill('2030-01-01', { timeout: 500 })
        geaendert = true
      } catch {
        geaendert = false
      }
      assert.equal(geaendert, false)
      await page.evaluate(() => window.fixture.los('orte'))
      await page.getByRole('alert').first().waitFor()
      const daten = await stand(page)
      assert.equal(daten.calls[0].eingabe.zielId, 'geonames:1861060')
      assert.deepEqual(daten.calls[0].eingabe.weitereZielIds, ['geonames:3169070'])
      assert.equal(await page.locator('textarea').inputValue(), 'Ruhige Tage am Meer')
    })

    await fall('reorder before submit changes the confirmed route order', async () => {
      await neu(page, { ansicht: 'manual', konto: true })
      await ausfuellen(page, false)
      await page.getByRole('button', { name: /nach oben/i }).click()
      assert.equal(await page.locator('#feld-ziel').inputValue(), 'Rom')
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.waitForFunction(() => window.fixture.pushes.length === 1)
      const orte = (await stand(page)).calls.find((eintrag) => eintrag.name === 'orte')
      assert.equal(orte.eingabe.zielId, 'geonames:3169070')
      assert.deepEqual(orte.eingabe.weitereZielIds, ['geonames:1861060'])
    })

    await fall('guest storage fault stays recoverable and does not navigate', async () => {
      await neu(page, { ansicht: 'manual', konto: false })
      await ausfuellen(page, false)
      await page.evaluate(() => {
        window.fixture.arm('orte', 'hold', 'ok')
        document.querySelector('form').requestSubmit()
      })
      await page.waitForFunction(() => document.getElementById('feld-ziel').disabled)
      await page.evaluate(() => {
        const original = localStorage.setItem.bind(localStorage)
        window.__setItem = original
        localStorage.setItem = () => {
          throw new Error('quota')
        }
        window.fixture.los('orte')
      })
      await page.getByText(/Browserspeicher ist voll/).waitFor()
      const daten = await stand(page)
      assert.equal(daten.pushes.length, 0)
      assert.equal(daten.aktiv, null)
      assert.equal(await page.getByRole('button', { name: 'Reise erstellen' }).isEnabled(), true)
      await page.evaluate(() => {
        localStorage.setItem = window.__setItem
      })
    })

    await fall('unmount before guest write does not store or navigate', async () => {
      await neu(page, { ansicht: 'manual', konto: false })
      await ausfuellen(page, false)
      await page.evaluate(() => {
        window.fixture.arm('orte', 'hold', 'ok')
        document.querySelector('form').requestSubmit()
      })
      await page.waitForFunction(() => window.fixture.calls.length === 1)
      await page.evaluate(() => window.fixture.steuerung.weg())
      await page.waitForSelector('[data-unmounted="1"]')
      await page.evaluate(() => window.fixture.los('orte'))
      await page.waitForTimeout(100)
      const daten = await stand(page)
      assert.equal(daten.pushes.length, 0)
      assert.equal(daten.aktiv, null)
    })

    await fall('unmount after account send does not navigate and does not cancel the call', async () => {
      await neu(page, { ansicht: 'manual', konto: true })
      await ausfuellen(page, false)
      await page.evaluate(() => {
        window.fixture.arm('orte', 'hold', 'ok')
        window.fixture.arm('anlegen', 'hold', 'ok')
        document.querySelector('form').requestSubmit()
      })
      await page.waitForFunction(() => window.fixture.calls.some((eintrag) => eintrag.name === 'orte'))
      await page.evaluate(() => window.fixture.los('orte'))
      await page.waitForFunction(() => window.fixture.calls.some((eintrag) => eintrag.name === 'anlegen'))
      await page.evaluate(() => window.fixture.steuerung.weg())
      await page.waitForSelector('[data-unmounted="1"]')
      await page.evaluate(() => window.fixture.los('anlegen'))
      await page.waitForTimeout(100)
      const daten = await stand(page)
      assert.equal(daten.calls.filter((eintrag) => eintrag.name === 'anlegen').length, 1)
      assert.equal(daten.pushes.length, 0)
    })

    await fall('keyboard submits and retries the manual form', async () => {
      await neu(page, { ansicht: 'manual', konto: true })
      await ausfuellen(page, false)
      await page.evaluate(() => window.fixture.arm('anlegen', 'domain'))
      await page.locator('#feld-reisende').focus()
      await page.keyboard.press('Enter')
      await page.getByText((await stand(page)).texte.konto).waitFor()
      const ref = anlegenRef(await stand(page))
      await page.evaluate(() => window.fixture.arm('anlegen', 'ok'))
      await page.getByRole('button', { name: 'Reise erstellen' }).focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => window.fixture.pushes.length === 1)
      assert.equal(anlegenRef(await stand(page)), ref)
    })

    await fall('proposal generation handles domain, rejection and a locked draft', async () => {
      await neu(page, { ansicht: 'idea', konto: false, idee: 'Sieben Tage Japan ab Zürich.' })
      await page.evaluate(() => window.fixture.arm('erzeugen', 'domain'))
      await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
      const texte = (await stand(page)).texte
      await page.getByText(texte.entwurf).waitFor()
      assert.equal(await page.locator('textarea').inputValue(), 'Sieben Tage Japan ab Zürich.')
      await page.evaluate(() => {
        window.fixture.calls.length = 0
        window.fixture.arm('erzeugen', 'hold', 'ok')
        const form = document.querySelector('form')
        form.requestSubmit()
        form.requestSubmit()
        const feld = document.querySelector('textarea')
        const setzen = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
        setzen.call(feld, 'GEAENDERT')
        feld.dispatchEvent(new Event('input', { bubbles: true }))
        document.querySelectorAll('button[type="button"]')[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      await page.waitForFunction(() => document.querySelector('textarea').disabled)
      assert.equal((await stand(page)).calls.filter((eintrag) => eintrag.name === 'erzeugen').length, 1)
      assert.equal((await stand(page)).calls[0].eingabe, 'Sieben Tage Japan ab Zürich.')
      assert.equal(await page.locator('textarea').inputValue(), 'Sieben Tage Japan ab Zürich.')
      const beispiele = page.getByRole('button', { name: 'Thailand' })
      assert.equal(await beispiele.isDisabled(), true)
      await page.evaluate(() => window.fixture.los('erzeugen'))
      await page.getByRole('region', { name: 'Reisevorschlag' }).waitFor()
      await page.getByText(texte.warnung).waitFor()
      assert.equal((await stand(page)).uuids.length, 1)
    })

    await fall('proposal rejection keeps the text for an explicit retry', async () => {
      await neu(page, { ansicht: 'idea', konto: false, idee: 'Zehn Tage Portugal.' })
      await page.evaluate(() => window.fixture.arm('erzeugen', 'reject'))
      await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
      await page.getByText((await stand(page)).texte.transportEntwurf).waitFor()
      await page.evaluate(() => window.fixture.arm('erzeugen', 'throw'))
      await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
      await page.getByText((await stand(page)).texte.transportEntwurf).waitFor()
      assert.equal(await page.locator('textarea').inputValue(), 'Zehn Tage Portugal.')
      await page.evaluate(() => window.fixture.arm('erzeugen', 'ok'))
      await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
      await page.getByRole('region', { name: 'Reisevorschlag' }).waitFor()
    })

    await fall('guest adoption keeps warnings and storage errors, then retries', async () => {
      await neu(page, { ansicht: 'idea', konto: false, idee: 'Eine Woche Rom.' })
      await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
      await page.getByRole('region', { name: 'Reisevorschlag' }).waitFor()
      const ref = `trip-${(await stand(page)).uuids[0]}`
      await page.evaluate(() => window.fixture.arm('aufloesen', 'reject'))
      await page.getByRole('button', { name: 'Reise übernehmen' }).click()
      await page.getByText((await stand(page)).texte.transportUebernahme).waitFor()
      assert.equal(await page.getByText((await stand(page)).texte.warnung).count(), 1)
      await page.evaluate(() => {
        window.fixture.arm('aufloesen', 'hold', 'ok')
        const original = localStorage.setItem.bind(localStorage)
        window.__setItem = original
        localStorage.setItem = () => {
          throw new Error('quota')
        }
      })
      await page.getByRole('button', { name: 'Reise übernehmen' }).click()
      await page.waitForFunction(() => window.fixture.calls.some((eintrag) => eintrag.name === 'aufloesen'))
      await page.evaluate(() => window.fixture.los('aufloesen'))
      await page.getByText(/Browserspeicher ist voll/).waitFor()
      assert.equal(await page.getByRole('heading', { name: 'Drei Tage Rom' }).count(), 1)
      assert.equal((await stand(page)).pushes.length, 0)
      await page.evaluate(() => {
        localStorage.setItem = window.__setItem
        window.fixture.arm('aufloesen', 'ok')
      })
      await page.getByRole('button', { name: 'Reise übernehmen' }).click()
      await page.waitForFunction(() => window.fixture.pushes.length === 1)
      const reise = JSON.parse((await stand(page)).aktiv)
      assert.equal(reise.clientRef, ref)
      assert.equal((await stand(page)).pushes[0], `/reisen/${reise.id}`)
    })

    await fall('account adoption failure keeps proposal, warning and clientRef', async () => {
      await neu(page, { ansicht: 'idea', konto: true, idee: 'Eine Woche Rom.' })
      await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
      await page.getByRole('region', { name: 'Reisevorschlag' }).waitFor()
      await page.evaluate(() => window.fixture.arm('uebernehmen', 'domain'))
      await page.getByRole('button', { name: 'Reise übernehmen' }).click()
      await page.getByText((await stand(page)).texte.uebernahme).waitFor()
      const ref = uebernahmeRef(await stand(page))
      assert.equal(await page.getByText((await stand(page)).texte.warnung).count(), 1)
      await page.evaluate(() => window.fixture.arm('uebernehmen', 'reject'))
      await page.getByRole('button', { name: 'Reise übernehmen' }).click()
      await page.getByText((await stand(page)).texte.transportUebernahme).waitFor()
      await page.evaluate(() => window.fixture.arm('uebernehmen', 'throw'))
      await page.getByRole('button', { name: 'Reise übernehmen' }).click()
      await page.getByText((await stand(page)).texte.transportUebernahme).waitFor()
      assert.equal(uebernahmeRef(await stand(page)), ref)
      assert.equal((await stand(page)).aktiv, null)
      await page.evaluate(() => window.fixture.arm('uebernehmen', 'ok'))
      await page.getByRole('button', { name: 'Reise übernehmen' }).click()
      await page.waitForFunction(() => window.fixture.pushes.at(-1) === '/reisen/reise-vorschlag-konto')
      assert.equal(uebernahmeRef(await stand(page)), ref)
    })

    await fall('pending adoption ignores change and discard until failure', async () => {
      await neu(page, { ansicht: 'idea', konto: true, idee: 'Eine Woche Rom.' })
      await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
      await page.getByRole('region', { name: 'Reisevorschlag' }).waitFor()
      await page.evaluate(() => {
        window.fixture.arm('uebernehmen', 'hold', 'domain')
        document.querySelectorAll('button').forEach((knopf) => {
          if (knopf.textContent?.includes('Reise übernehmen')) knopf.click()
        })
        document.querySelectorAll('button').forEach((knopf) => {
          if (knopf.textContent?.includes('Verwerfen') || knopf.textContent?.includes('Beschreibung ändern')) {
            knopf.dispatchEvent(new MouseEvent('click', { bubbles: true }))
          }
        })
      })
      await page.waitForFunction(() => [...document.querySelectorAll('button')].some((knopf) => knopf.textContent?.includes('Wird übernommen')))
      assert.equal(await page.getByRole('heading', { name: 'Drei Tage Rom' }).count(), 1)
      await page.evaluate(() => window.fixture.los('uebernehmen'))
      await page.getByText((await stand(page)).texte.uebernahme).waitFor()
      await page.getByRole('button', { name: 'Beschreibung ändern' }).click()
      assert.equal(await page.getByRole('heading', { name: 'Drei Tage Rom' }).count(), 0)
      assert.equal(await page.locator('textarea').inputValue(), 'Eine Woche Rom.')
    })

    await fall('unmount during guest adoption does not start the guest write', async () => {
      await neu(page, { ansicht: 'idea', konto: false, idee: 'Eine Woche Rom.' })
      await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
      await page.getByRole('region', { name: 'Reisevorschlag' }).waitFor()
      await page.evaluate(() => {
        window.fixture.arm('aufloesen', 'hold', 'ok')
        document.querySelectorAll('button').forEach((knopf) => {
          if (knopf.textContent?.includes('Reise übernehmen')) knopf.click()
        })
      })
      await page.waitForFunction(() => window.fixture.calls.some((eintrag) => eintrag.name === 'aufloesen'))
      await page.evaluate(() => window.fixture.steuerung.weg())
      await page.waitForSelector('[data-unmounted="1"]')
      await page.evaluate(() => window.fixture.los('aufloesen'))
      await page.waitForTimeout(100)
      const daten = await stand(page)
      assert.equal(daten.aktiv, null)
      assert.equal(daten.pushes.length, 0)
    })

    await fall('unmount after account adoption does not navigate', async () => {
      await neu(page, { ansicht: 'idea', konto: true, idee: 'Eine Woche Rom.' })
      await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
      await page.getByRole('region', { name: 'Reisevorschlag' }).waitFor()
      await page.evaluate(() => {
        window.fixture.arm('uebernehmen', 'hold', 'ok')
        document.querySelectorAll('button').forEach((knopf) => {
          if (knopf.textContent?.includes('Reise übernehmen')) knopf.click()
        })
      })
      await page.waitForFunction(() => window.fixture.calls.some((eintrag) => eintrag.name === 'uebernehmen'))
      await page.evaluate(() => window.fixture.steuerung.weg())
      await page.waitForSelector('[data-unmounted="1"]')
      await page.evaluate(() => window.fixture.los('uebernehmen'))
      await page.waitForTimeout(100)
      const daten = await stand(page)
      assert.equal(daten.calls.filter((eintrag) => eintrag.name === 'uebernehmen').length, 1)
      assert.equal(daten.pushes.length, 0)
    })

    assert.deepEqual(fehler, [])

    const layout = {}
    await fall('layout 320 390 1280 and 200 percent reflow', async () => {
      for (const breite of [320, 390, 1280]) {
        await page.setViewportSize({ width: breite, height: 900 })
        await neu(page, { ansicht: 'manual', konto: false })
        await ausfuellen(page, false)
        const mass = await page.evaluate(() => {
          const grenze = document.documentElement.clientWidth + 1
          const treffer = []
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect()
            if (r.width < 1 || r.height < 1) continue
            if (r.right > grenze + 1) {
              treffer.push({ id: el.id, tag: el.tagName, text: (el.innerText || '').trim().slice(0, 48), right: Math.round(r.right) })
            }
          }
          return {
            delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            treffer: treffer.slice(0, 6),
          }
        })
        const datei = join(nachweis, `manual-${breite}.png`)
        await page.screenshot({ path: datei })
        copyFileSync(datei, join(artefakte, `manual-${breite}.png`))
        layout[`manual-${breite}`] = mass
        assert.equal(mass.delta <= 1, true, JSON.stringify(mass))
      }
      await page.setViewportSize({ width: 320, height: 900 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '32px'
      })
      const reflow = await page.evaluate(() => {
        const grenze = document.documentElement.clientWidth + 1
        const treffer = []
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect()
          if (r.width < 1 || r.height < 1) continue
          if (r.right > grenze + 1) {
            treffer.push({ id: el.id, tag: el.tagName, text: (el.innerText || '').trim().slice(0, 48), right: Math.round(r.right) })
          }
        }
        return { delta: document.documentElement.scrollWidth - document.documentElement.clientWidth, treffer: treffer.slice(0, 8) }
      })
      const reflowDatei = join(nachweis, 'manual-320-200.png')
      await page.screenshot({ path: reflowDatei })
      copyFileSync(reflowDatei, join(artefakte, 'manual-320-200.png'))
      layout['manual-320-200'] = reflow
      assert.equal(reflow.delta <= 1, true, JSON.stringify(reflow))
      await page.evaluate(() => {
        document.documentElement.style.fontSize = ''
      })
      await page.setViewportSize({ width: 320, height: 900 })
      await neu(page, { ansicht: 'idea', konto: false, idee: 'Eine Woche Rom.' })
      await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
      await page.getByRole('region', { name: 'Reisevorschlag' }).waitFor()
      const vorschlag = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      const vorschlagDatei = join(nachweis, 'proposal-320.png')
      await page.screenshot({ path: vorschlagDatei, fullPage: true })
      copyFileSync(vorschlagDatei, join(artefakte, 'proposal-320.png'))
      layout['proposal-320'] = vorschlag
      assert.equal(vorschlag <= 1, true)
      await page.setViewportSize({ width: 1280, height: 900 })
      const weit = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      const weitDatei = join(nachweis, 'proposal-1280.png')
      await page.screenshot({ path: weitDatei })
      copyFileSync(weitDatei, join(artefakte, 'proposal-1280.png'))
      layout['proposal-1280'] = weit
      assert.equal(weit <= 1, true)
      const taste = await page.evaluate(() => {
        const knopf = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Beschreibung ändern'))
        knopf.focus()
        return document.activeElement === knopf && knopf.getAttribute('disabled') === null
      })
      assert.equal(taste, true)
    })

    schreiben({ layout, pageErrors: fehler })
  } finally {
    await context.close()
  }
} catch (fehler) {
  schreiben({ error: fehler instanceof Error ? fehler.message : String(fehler) })
  throw fehler
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}

const hash = createHash('sha256').update(readFileSync(join(nachweis, 'result.json'))).digest('hex')
console.log(`planning-creation-lifecycle-1 ${faelle.length} cases sha256 ${hash}`)
