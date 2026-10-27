// scripts/getyourguide-manual-widget-integration-1/hoehe.ts
//
// Deterministische Höhenregression ohne Anbieteranfrage.
// Aufruf: node --import tsx scripts/getyourguide-manual-widget-integration-1/hoehe.ts

import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

import { GYG_HOEHE_SKRIPT, GYG_SANDBOX } from '@/lib/activities/getyourguide/dokument'

const require = createRequire(import.meta.url)
const esbuild = require('esbuild') as {
  build: (options: Record<string, unknown>) => Promise<void>
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = '/tmp/gyg-hoehe'
const ARTIFACTS = '/opt/cursor/artifacts/gyg-manual-widget'

function dateiAufloesen(basis: string): string | null {
  const kandidaten = [basis, `${basis}.ts`, `${basis}.tsx`, `${basis}.js`, `${basis}.mjs`]
  const { existsSync } = require('node:fs') as typeof import('node:fs')
  return kandidaten.find((kandidat) => existsSync(kandidat)) ?? null
}

function synthDokument(): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Synthetische Höhe</title>
<style>body{margin:8px}</style>
</head>
<body>
<div id="huelle">
<iframe id="anbieter" title="Anbieter" style="display:block;width:100%;height:100%;border:0" srcdoc="<!doctype html><html><head><style>body{margin:0}</style></head><body><div id=&quot;inhalt&quot; style=&quot;height:1100px;background:#d9e2d6&quot;></div></body></html>"></iframe>
</div>
<script>
window.__gygSetzen = function (px) {
  var huelle = document.getElementById('huelle');
  huelle.style.height = px + 'px';
  var rahmen = document.getElementById('anbieter');
  var doc = rahmen.contentDocument;
  var inhalt = doc && doc.getElementById('inhalt');
  if (inhalt) inhalt.style.height = px + 'px';
};
window.__gygSetzen(1100);
</script>
<script>${GYG_HOEHE_SKRIPT}</script>
</body>
</html>`
}

function elternHtml(): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Höheneltern</title>
<style>html,body{margin:0} #vorfahre{overflow:hidden}</style>
</head>
<body>
<div id="vorfahre">
<iframe id="aussen" title="GetYourGuide" sandbox="${GYG_SANDBOX}" credentialless referrerpolicy="no-referrer" style="display:block;width:100%;height:640px;border:0;background:#fff" src="/synth"></iframe>
</div>
<script src="/eltern.js"></script>
</body>
</html>`
}

async function elternBundeln() {
  mkdirSync(OUT, { recursive: true })
  await esbuild.build({
    absWorkingDir: ROOT,
    stdin: {
      contents: `import { gygHoeheAnnehmen } from '@/lib/activities/getyourguide/renderer'
const rahmen = document.querySelector('iframe')
if (!rahmen) throw new Error('rahmen fehlt')
addEventListener('message', (event) => { gygHoeheAnnehmen(rahmen, event) })
`,
      resolveDir: ROOT,
      sourcefile: 'hoehe-eltern.ts',
      loader: 'ts',
    },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    outfile: join(OUT, 'eltern.js'),
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'jetnity-alias',
        setup(build: {
          onResolve: (
            args: { filter: RegExp },
            fn: (args: { path: string }) => { path: string } | null,
          ) => void
        }) {
          build.onResolve({ filter: /^server-only$/ }, () => ({
            path: join(ROOT, 'scripts/server-only-empty.js'),
          }))
          build.onResolve({ filter: /^@\// }, (args) => {
            const ziel = dateiAufloesen(join(ROOT, args.path.slice(2)))
            if (!ziel) return null
            return { path: ziel }
          })
        },
      },
    ],
  })
}

type Stand = {
  aussen: number
  breite: number
  vorfahre: number
  ragtUnten: boolean
  ragtSeitlich: boolean
  stil: string
  scroll: number
  schrift: string
}

async function standLesen(page: import('playwright').Page): Promise<Stand> {
  const aussen = await page.evaluate(() => {
    const rahmen = document.getElementById('aussen')
    const vorfahre = document.getElementById('vorfahre')
    if (!(rahmen instanceof HTMLElement) || !(vorfahre instanceof HTMLElement)) {
      return { aussen: 0, breite: 0, vorfahre: 0, ragtUnten: true, ragtSeitlich: true }
    }
    const a = rahmen.getBoundingClientRect()
    const b = vorfahre.getBoundingClientRect()
    return {
      aussen: Math.round(a.height),
      breite: Math.round(a.width),
      vorfahre: Math.round(b.height),
      ragtUnten: a.bottom > b.bottom + 1,
      ragtSeitlich: a.left < b.left - 1 || a.right > b.right + 1,
    }
  })
  const frame = page.frames().find((eintrag) => eintrag.url().includes('/synth'))
  if (!frame) throw new Error('Synthetischer Rahmen fehlt')
  const innen = await frame.evaluate(() => {
    const rahmen = document.querySelector('iframe')
    const vater = rahmen?.parentElement
    const schrift = document.querySelectorAll('script')[1]?.textContent ?? ''
    return {
      stil: vater ? vater.style.height : '',
      scroll: document.documentElement.scrollHeight,
      schrift,
    }
  })
  return { ...aussen, ...innen }
}

async function wartenAuf(page: import('playwright').Page, px: number) {
  const start = Date.now()
  let letzte = await standLesen(page)
  while (Date.now() - start < 4000) {
    if (letzte.aussen === px && letzte.stil === `${px}px`) return letzte
    await page.waitForTimeout(50)
    letzte = await standLesen(page)
  }
  throw new Error(`Höhe ${px} nicht erreicht: ${JSON.stringify(letzte)}`)
}

async function proben(page: import('playwright').Page, ms: number, px: number): Promise<Stand[]> {
  const liste: Stand[] = []
  const start = Date.now()
  while (Date.now() - start < ms) {
    liste.push(await standLesen(page))
    await page.waitForTimeout(250)
  }
  const fremd = liste.filter((eintrag) => eintrag.aussen !== px || eintrag.stil !== `${px}px` || eintrag.ragtUnten || eintrag.ragtSeitlich)
  if (fremd.length > 0) {
    throw new Error(`Instabile Höhe bei ${px}: ${JSON.stringify(fremd.slice(0, 4))}`)
  }
  return liste
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true })
  await elternBundeln()
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (url.pathname === '/synth') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(synthDokument())
      return
    }
    if (url.pathname === '/eltern.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
      res.end(require('node:fs').readFileSync(join(OUT, 'eltern.js')))
      return
    }
    if (url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(elternHtml())
      return
    }
    res.writeHead(404)
    res.end('fehlt')
  })
  await new Promise<void>((resolveReady) => server.listen(0, '127.0.0.1', () => resolveReady()))
  const adresse = server.address()
  if (!adresse || typeof adresse === 'string') throw new Error('Port fehlt')
  const basis = `http://127.0.0.1:${adresse.port}`
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const fremd: string[] = []
  page.on('request', (request) => {
    try {
      const host = new URL(request.url()).host
      if (!host.startsWith('127.0.0.1')) fremd.push(request.url())
    } catch {
      fremd.push(request.url())
    }
  })
  await page.goto(basis, { waitUntil: 'load' })
  const ruhend = await wartenAuf(page, 1100)
  if (ruhend.scroll <= 1100) throw new Error(`Der Randfall fehlt, scrollHeight ist ${ruhend.scroll}`)
  if (!ruhend.schrift.includes('parent.postMessage')) throw new Error('Das echte Höhenskript fehlt im Dokument')
  const stabil1100 = await proben(page, 6000, 1100)
  const frame = page.frames().find((eintrag) => eintrag.url().includes('/synth'))
  if (!frame) throw new Error('Rahmen nach der Ruhephase fehlt')
  await frame.evaluate(() => {
    ;(window as Window & { __gygSetzen?: (px: number) => void }).__gygSetzen?.(400)
  })
  await wartenAuf(page, 400)
  const stabil400 = await proben(page, 2000, 400)
  await frame.evaluate(() => {
    ;(window as Window & { __gygSetzen?: (px: number) => void }).__gygSetzen?.(1100)
  })
  await wartenAuf(page, 1100)
  const wieder1100 = await proben(page, 2000, 1100)
  await frame.evaluate(() => {
    parent.postMessage({ quelle: 'jetnity-gyg-rahmen', art: 'hoehe', px: 2401 }, '*')
    parent.postMessage({ quelle: 'jetnity-gyg-rahmen', art: 'hoehe', px: 900, tour: 1 }, '*')
  })
  await page.waitForTimeout(300)
  const nachAblehnung = await standLesen(page)
  if (nachAblehnung.aussen !== 1100) throw new Error(`Abgelehnte Nachricht veränderte die Höhe: ${nachAblehnung.aussen}`)

  const breiten: { breite: number; stand: Stand }[] = []
  for (const breite of [1280, 375, 1280]) {
    await page.setViewportSize({ width: breite, height: breite === 375 ? 812 : 900 })
    await page.waitForTimeout(400)
    const aktuell = await standLesen(page)
    await page.waitForTimeout(700)
    const danach = await standLesen(page)
    if (aktuell.aussen !== 1100 || danach.aussen !== 1100 || danach.stil !== '1100px' || danach.ragtUnten || danach.ragtSeitlich) {
      throw new Error(`Geometrie bei ${breite}px: ${JSON.stringify({ aktuell, danach })}`)
    }
    breiten.push({ breite, stand: danach })
    await page.screenshot({ path: join(ARTIFACTS, `hoehe-${breite}.png`) })
  }
  if (fremd.length > 0) throw new Error(`Fremde Anfragen: ${fremd.join(', ')}`)
  const bericht = {
    ruhend,
    proben: { stabil1100: stabil1100.length, stabil400: stabil400.length, wieder1100: wieder1100.length },
    breiten,
    fremd: fremd.length,
  }
  writeFileSync(join(ARTIFACTS, 'hoehe-bericht.json'), JSON.stringify(bericht, null, 2))
  await browser.close()
  server.close()
  console.log(JSON.stringify(bericht))
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
