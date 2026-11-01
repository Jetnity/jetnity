// Synthetische Netzprüfung des allgemeinen 12Go-Loaders.
// Frisches Playwright-Profil, kein Nutzerbrowser. Kein Bangkok, keine Buchung.
// Die Besucherfläche bleibt davon unberührt.

import { execFileSync } from 'node:child_process'
import { createServer, type Server } from 'node:https'
import { mkdtempSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Browser, type Page, type Response } from 'playwright'

import { twelveGoWidgetQuelleLesen } from '@/lib/providers/twelve-go/widget/quelle'

const ZIEL = '/opt/cursor/artifacts/twelve-go-widget-v2'
const ANBIETER = /(^|\.)12go\.(asia|com)$|(^|\.)trainbusferry\.com$/i

type Phase = 'vor-klick' | 'nach-klick' | 'nach-synthese' | 'sandbox-vor-klick' | 'sandbox-nach-klick'

type Eintrag = {
  phase: Phase
  method: string
  origin: string
  path: string
  queryNamen: string[]
  status: number | null
  resourceType: string
  referrerOrigin: string | null
  fehler: string | null
}

type CookieName = { name: string; domain: string; path: string; secure: boolean; httpOnly: boolean; sameSite: string }
type SetCookie = { name: string; flags: string[] }
type Kopf = { origin: string; path: string; status: number; contentType: string | null; csp: string | null; xFrameOptions: string | null }

function originVon(adresse: string | undefined): string | null {
  if (!adresse) return null
  try {
    return new URL(adresse).origin
  } catch {
    return 'unparseable'
  }
}

function nameOderLaenge(name: string): string {
  const gekuerzt = name.trim()
  if (gekuerzt.length > 80) return `redacted-length-${gekuerzt.length}`
  return gekuerzt
}

function zerlegen(adresse: string): { origin: string; path: string; queryNamen: string[] } {
  const url = new URL(adresse)
  return { origin: url.origin, path: url.pathname, queryNamen: [...new Set(url.searchParams.keys())] }
}

function setCookie(header: string): SetCookie {
  const teile = header.split(';').map((teil) => teil.trim()).filter(Boolean)
  const name = nameOderLaenge(teile[0]?.split('=')[0] ?? '')
  const flags = teile.slice(1).map((teil) => teil.split('=')[0]?.toLowerCase() ?? '').filter(Boolean)
  return { name, flags }
}

function seite(quelleJson: string): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><title>12Go audit harness</title></head><body>
<p id="status">Nichts von 12Go ist geladen.</p>
<button type="button" id="start">Allgemeines Formular jetzt prüfen</button>
<div id="slot"></div>
<script type="application/json" id="quelle">${quelleJson}</script>
<script>
document.getElementById('start').addEventListener('click', () => {
  const html = JSON.parse(document.getElementById('quelle').textContent)
  const slot = document.getElementById('slot')
  const vorlage = document.createElement('template')
  vorlage.innerHTML = html
  const fragment = vorlage.content
  for (const alt of [...fragment.querySelectorAll('script')]) {
    const neu = document.createElement('script')
    for (const attr of alt.attributes) neu.setAttribute(attr.name, attr.value)
    alt.replaceWith(neu)
  }
  slot.appendChild(fragment)
  document.getElementById('status').textContent = 'Prüfung gestartet.'
})
</script>
</body></html>`
}

function kind(fragment: string, erlaubt: boolean): string {
  const inhalt = erlaubt ? fragment : '<p>keine Prüfung</p>'
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"></head><body>${inhalt}</body></html>`
}

function sandboxSeite(): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"></head><body>
<button type="button" id="start">Abgeschottetes Formular jetzt prüfen</button>
<iframe id="frame" sandbox="allow-scripts" title="12Go sandbox probe"></iframe>
<script>
document.getElementById('start').addEventListener('click', () => {
  document.getElementById('frame').src = '/kind?entscheidung=ja'
})
</script>
</body></html>`
}

function anbieter(origin: string): boolean {
  try {
    return ANBIETER.test(new URL(origin).hostname)
  } catch {
    return false
  }
}

async function felder(page: Page) {
  const rahmen = []
  for (const frame of page.frames()) {
    let origin = 'unbekannt'
    try {
      origin = new URL(frame.url()).origin
    } catch {
      origin = 'unparseable'
    }
    try {
      const gelesen = await frame.evaluate(() => {
        const felder = []
        for (const el of document.querySelectorAll('input, textarea, select')) {
          const value = 'value' in el ? String((el as HTMLInputElement).value) : ''
          felder.push({
            tag: el.tagName,
            type: el.getAttribute('type'),
            name: el.getAttribute('name'),
            id: el.getAttribute('id'),
            leer: value.length === 0,
            laenge: value.length,
            bangkok: /bangkok|koh chang/i.test(value),
          })
        }
        return { powered: Boolean(document.getElementById('powered')), felder, lesbar: true }
      })
      rahmen.push({ origin, ...gelesen })
    } catch {
      rahmen.push({ origin, powered: false, felder: [], lesbar: false })
    }
  }
  return {
    powered: rahmen.some((eintrag) => eintrag.powered),
    felder: rahmen.flatMap((eintrag) => eintrag.felder),
    rahmen: rahmen.map((eintrag) => ({ origin: eintrag.origin, lesbar: eintrag.lesbar, powered: eintrag.powered, anzahl: eintrag.felder.length })),
  }
}

async function speicher(page: Page) {
  const aus: { origin: string; local: string[]; session: string[]; cookieNamen: string[]; lesbar: boolean }[] = []
  for (const frame of page.frames()) {
    let origin = 'unbekannt'
    try {
      origin = new URL(frame.url()).origin
    } catch {
      origin = 'unparseable'
    }
    try {
      const gelesen = await frame.evaluate(() => {
        const local = []
        const session = []
        const cookieNamen = []
        for (const name of Object.keys(localStorage)) local.push(name.length > 80 ? `redacted-length-${name.length}` : name)
        for (const name of Object.keys(sessionStorage)) session.push(name.length > 80 ? `redacted-length-${name.length}` : name)
        for (const teil of document.cookie.split(';')) {
          const name = (teil.trim().split('=')[0] ?? '').trim()
          if (!name) continue
          cookieNamen.push(name.length > 80 ? `redacted-length-${name.length}` : name)
        }
        return { local, session, cookieNamen }
      })
      aus.push({ origin, ...gelesen, lesbar: true })
    } catch {
      aus.push({ origin, local: [], session: [], cookieNamen: [], lesbar: false })
    }
  }
  return aus
}

function beobachter(
  page: Page,
  phase: { aktuell: Phase },
  eintraege: Eintrag[],
  cookies: SetCookie[],
  koepfe: Kopf[],
  offen: Promise<void>[],
) {
  const zuordnung = new WeakMap<Request, Eintrag>()
  page.on('request', (request) => {
    const adresse = request.url()
    if (adresse.startsWith('data:') || adresse.startsWith('about:')) return
    const teile = zerlegen(adresse)
    const eintrag: Eintrag = {
      phase: phase.aktuell,
      method: request.method(),
      ...teile,
      status: null,
      resourceType: request.resourceType(),
      referrerOrigin: originVon(request.headers()['referer']),
      fehler: null,
    }
    zuordnung.set(request, eintrag)
    eintraege.push(eintrag)
  })
  page.on('response', (response: Response) => {
    offen.push(
      (async () => {
        const eintrag = zuordnung.get(response.request())
        if (eintrag) eintrag.status = response.status()
        const teile = zerlegen(response.url())
        const roh = await response.headersArray()
        const kopf = Object.fromEntries(roh.map((eintragKopf) => [eintragKopf.name.toLowerCase(), eintragKopf.value]))
        if (anbieter(teile.origin)) {
          koepfe.push({
            origin: teile.origin,
            path: teile.path,
            status: response.status(),
            contentType: kopf['content-type'] ?? null,
            csp: kopf['content-security-policy'] ?? null,
            xFrameOptions: kopf['x-frame-options'] ?? null,
          })
        }
        for (const einzeln of roh) {
          if (einzeln.name.toLowerCase() !== 'set-cookie') continue
          cookies.push(setCookie(einzeln.value))
        }
      })().catch(() => undefined),
    )
  })
  page.on('requestfailed', (request) => {
    const eintrag = zuordnung.get(request)
    if (!eintrag) return
    eintrag.fehler = request.failure()?.errorText?.slice(0, 120) ?? 'failed'
  })
}

async function main() {
  mkdirSync(ZIEL, { recursive: true })
  const allgemein = twelveGoWidgetQuelleLesen('allgemein')
  const fragment = new TextDecoder('utf-8', { fatal: true }).decode(allgemein)
  const quelleJson = JSON.stringify(fragment).replace(/</g, '\\u003c')
  const zertifikat = mkdtempSync(join(tmpdir(), 'twelve-go-audit-'))
  execFileSync('openssl', [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-keyout',
    join(zertifikat, 'key.pem'),
    '-out',
    join(zertifikat, 'cert.pem'),
    '-days',
    '1',
    '-nodes',
    '-subj',
    '/CN=127.0.0.1',
  ])

  const server: Server = createServer(
    { key: readFileSync(join(zertifikat, 'key.pem')), cert: readFileSync(join(zertifikat, 'cert.pem')) },
    (anfrage, antwort) => {
      const url = new URL(anfrage.url ?? '/', 'https://127.0.0.1')
      const kopf = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'strict-origin-when-cross-origin' }
      if (url.pathname === '/kind') {
        antwort.writeHead(200, kopf)
        antwort.end(kind(fragment, url.searchParams.get('entscheidung') === 'ja'))
        return
      }
      if (url.pathname === '/sandbox') {
        antwort.writeHead(200, kopf)
        antwort.end(sandboxSeite())
        return
      }
      antwort.writeHead(200, kopf)
      antwort.end(seite(quelleJson))
    },
  )
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const adresse = server.address()
  if (!adresse || typeof adresse === 'string') throw new Error('Audit-Server ohne Port')
  const basis = `https://127.0.0.1:${adresse.port}`

  const eintraege: Eintrag[] = []
  const setCookies: SetCookie[] = []
  const koepfe: Kopf[] = []
  const offen: Promise<void>[] = []
  let browser: Browser | null = null
  const phase = { aktuell: 'vor-klick' as Phase }
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      locale: 'de-CH',
      viewport: { width: 390, height: 900 },
    })
    const page = await context.newPage()
    beobachter(page, phase, eintraege, setCookies, koepfe, offen)
    await page.goto(basis, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    const vorKlick = eintraege.filter((eintrag) => anbieter(eintrag.origin))
    if (vorKlick.length > 0) throw new Error('Anbieteranfrage vor der Entscheidung')

    phase.aktuell = 'nach-klick'
    await page.getByRole('button', { name: 'Allgemeines Formular jetzt prüfen' }).click()
    await page.waitForTimeout(12000)
    const nachLaden = await felder(page)
    let synthese: 'nicht-gefunden' | 'gesetzt' = 'nicht-gefunden'
    const leer = nachLaden.felder.find((feld) => feld.tag === 'INPUT' && feld.leer && feld.type !== 'hidden')
    if (leer) {
      phase.aktuell = 'nach-synthese'
      try {
        await page.locator('input:not([type="hidden"])').first().fill('Syntheseort')
        synthese = 'gesetzt'
        await page.waitForTimeout(4000)
      } catch {
        synthese = 'nicht-gefunden'
      }
    }
    await page.screenshot({ path: join(ZIEL, 'audit-390.png'), fullPage: true })
    await page.setViewportSize({ width: 320, height: 900 })
    await page.screenshot({ path: join(ZIEL, 'audit-320.png'), fullPage: true })
    const cookies = (await context.cookies()).map((cookie) => ({
      name: nameOderLaenge(cookie.name),
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
    })) satisfies CookieName[]
    const speicherNachLaden = await speicher(page)

    await context.close()
    const sandboxContext = await browser.newContext({
      ignoreHTTPSErrors: true,
      locale: 'de-CH',
      viewport: { width: 390, height: 900 },
    })
    const sandbox = await sandboxContext.newPage()
    phase.aktuell = 'sandbox-vor-klick'
    beobachter(sandbox, phase, eintraege, setCookies, koepfe, offen)
    await sandbox.goto(`${basis}/sandbox`, { waitUntil: 'networkidle' })
    await sandbox.waitForTimeout(500)
    const sandboxAttribut = await sandbox.locator('#frame').getAttribute('sandbox')
    phase.aktuell = 'sandbox-nach-klick'
    await sandbox.getByRole('button', { name: 'Abgeschottetes Formular jetzt prüfen' }).click()
    await sandbox.waitForTimeout(8000)
    const sandboxFelder = await sandbox.frames()
    let sandboxLesbar = false
    let sandboxPowered = false
    for (const frame of sandboxFelder) {
      if (frame === sandbox.mainFrame()) continue
      try {
        sandboxPowered = await frame.evaluate(() => Boolean(document.getElementById('powered')))
        sandboxLesbar = true
      } catch {
        sandboxLesbar = false
      }
    }
    await sandbox.screenshot({ path: join(ZIEL, 'audit-sandbox-390.png'), fullPage: true })
    await sandboxContext.close()
    await Promise.all(offen)

    const herkunft = [...new Set(eintraege.map((eintrag) => eintrag.origin))].sort()
    const protokolle = [
      ...new Set(
        eintraege
          .filter((eintrag) => anbieter(eintrag.origin) && eintrag.resourceType === 'script')
          .map((eintrag) => eintrag.origin.split(':')[0] ?? ''),
      ),
    ]
    const bericht = {
      klasse: 'synthetisch-ephemeral',
      nutzerprofil: false,
      https: true,
      vorKlickAnbieter: vorKlick.length,
      protokolleDerSkriptOrigins: protokolle,
      felder: nachLaden,
      synthese,
      herkunft,
      anbieterHerkunft: herkunft.filter((origin) => anbieter(origin)),
      eintraege: eintraege.slice(0, 200),
      abgeschnitten: eintraege.length > 200,
      setCookie: setCookies,
      koepfe,
      contextCookies: cookies,
      speicher: speicherNachLaden,
      sandbox: {
        attribut: sandboxAttribut,
        allowSameOrigin: sandboxAttribut?.split(/\s+/).includes('allow-same-origin') ?? false,
        poweredLesbar: sandboxLesbar,
        powered: sandboxPowered,
      },
      buchung: false,
      bangkokVorausgefuellt: nachLaden.felder.some((feld) => feld.bangkok),
    }
    writeFileSync(join(ZIEL, 'audit.json'), JSON.stringify(bericht, null, 2))
    console.log(JSON.stringify({
      vorKlickAnbieter: bericht.vorKlickAnbieter,
      anbieterHerkunft: bericht.anbieterHerkunft,
      protokolle: bericht.protokolleDerSkriptOrigins,
      felder: bericht.felder.felder.length,
      powered: bericht.felder.powered,
      bangkok: bericht.bangkokVorausgefuellt,
      synthese: bericht.synthese,
      sandbox: bericht.sandbox,
      cookies: bericht.contextCookies.map((cookie) => cookie.name),
      setCookie: bericht.setCookie.map((cookie) => cookie.name),
      speicher: bericht.speicher,
      anfragen: bericht.eintraege.length,
    }, null, 2))
  } finally {
    await browser?.close()
    await new Promise<void>((resolve, reject) => server.close((fehler) => (fehler ? reject(fehler) : resolve())))
  }
}

void main().catch((fehler: unknown) => {
  console.error(fehler instanceof Error ? fehler.message : fehler)
  process.exit(1)
})
