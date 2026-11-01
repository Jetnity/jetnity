// scripts/activities-destination-first-1/echt.ts
//
// Höchstens vier echte Widget-Ladeversuche und zwei Angebotsklicks.
// Kein natives Viator-API, kein Schlüssel, kein Bypass bei 403.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { chromium } from 'playwright'

import { viatorEmbedAntwort } from '@/lib/activities/viator-widget/dokument'

const ARTIFACTS = '/opt/cursor/artifacts/activities-destination-first-1'
const ZIELE = ['Bangkok'] as const

type Spur = { host: string; status: number; pfad: string }

function html(name: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Viator ${name}</title></head><body>
<iframe title="Viator" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" credentialless referrerpolicy="no-referrer" style="width:100%;height:900px;border:0" src="/embed/viator?name=${encodeURIComponent(name)}"></iframe>
</body></html>`
}

async function antwortSchreiben(req: IncomingMessage, res: ServerResponse) {
  const host = req.headers.host ?? '127.0.0.1'
  const url = new URL(req.url ?? '/', `http://${host}`)
  if (url.pathname === '/embed/viator') {
    const kopf = new Headers()
    for (const [name, wert] of Object.entries(req.headers)) {
      if (typeof wert === 'string') kopf.set(name, wert)
    }
    const ergebnis = viatorEmbedAntwort(new Request(`https://jetnity.test${url.pathname}${url.search}`, { headers: kopf }))
    res.statusCode = ergebnis.status
    ergebnis.headers.forEach((wert, name) => res.setHeader(name, wert))
    res.end(Buffer.from(await ergebnis.arrayBuffer()))
    return
  }
  const name = ZIELE.find((ziel) => url.pathname === `/${ziel.toLowerCase()}`) ?? 'Bangkok'
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.end(html(name))
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true })
  const server = createServer((req, res) => {
    void antwortSchreiben(req, res)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const adresse = server.address()
  if (!adresse || typeof adresse === 'string') throw new Error('kein Port')
  const basis = `http://127.0.0.1:${adresse.port}`
  let browser
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler)
    if (!meldung.includes("Executable doesn't exist")) throw fehler
    browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  }
  const spuren: Spur[] = []
  const fehler: string[] = []
  let versuche = 0
  let klicks = 0
  let gesperrt = false
  for (const ziel of ZIELE) {
    if (gesperrt || versuche >= 4) break
    versuche += 1
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.on('response', (response) => {
      let host = ''
      try {
        host = new URL(response.url()).host
      } catch {
        return
      }
      if (host === '127.0.0.1' || host.endsWith('.viator.com') || host.endsWith('.tripadvisor.com') || host === 'viator.com') {
        const pfad = new URL(response.url()).pathname.slice(0, 80)
        spuren.push({ host, status: response.status(), pfad })
        if (response.status() === 403 && host !== '127.0.0.1') gesperrt = true
      }
    })
    page.on('console', (msg) => {
      if (msg.type() === 'error') fehler.push(msg.text().slice(0, 240))
    })
    await page.goto(`${basis}/${ziel.toLowerCase()}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8000)
    const rahmen = await Promise.all(page.frames().map(async (frame) => ({
      url: frame.url().slice(0, 160),
      text: (await frame.locator('body').innerText().catch(() => '')).slice(0, 240),
    })))
    console.log(ziel, JSON.stringify(rahmen))
    await page.screenshot({ path: join(ARTIFACTS, `viator-echt-${ziel.toLowerCase()}.png`), fullPage: true })
    if (!gesperrt && klicks < 1) {
      const widget = page.frames().find((frame) => frame.url().includes('/widget/partner/'))
      const link = widget?.locator('a').filter({ hasNotText: /Jetzt buchen|Book now/i }).first()
      if (link && await link.count()) {
        klicks += 1
        await link.click({ timeout: 5000 }).catch(() => undefined)
        await page.waitForTimeout(2500)
        await page.screenshot({ path: join(ARTIFACTS, `viator-echt-${ziel.toLowerCase()}-klick.png`), fullPage: true })
      }
    }
    await page.close()
    if (gesperrt) break
  }
  await browser.close()
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  const bericht = {
    versuche,
    klicks,
    gesperrt,
    spuren: spuren.filter((spur, index) => spuren.findIndex((andere) => andere.host === spur.host && andere.status === spur.status && andere.pfad === spur.pfad) === index).slice(0, 40),
    fehler: [...new Set(fehler)].slice(0, 12),
  }
  writeFileSync(join(ARTIFACTS, 'viator-echt.json'), JSON.stringify(bericht, null, 2))
  console.log(JSON.stringify(bericht, null, 2))
}

void main()
