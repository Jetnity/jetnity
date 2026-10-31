// Offline parent flow. The bundle aliases the CMP policy module.
// jetnity.com and the widget host are fulfilled locally. No vendor network.

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

import { anwendungsStil } from '@/scripts/twelve-go-widget-v2/oberflaeche'
import { nachweisOrdner } from '@/scripts/twelve-go-widget-v2/rahmen-nachweis'
import { TWELVE_GO_HOST_SANDBOX, TWELVE_GO_HOST_SRC } from '@/lib/providers/twelve-go/widget/protokoll'
import { TWELVE_GO_READY_TIMEOUT_MS } from '@/components/trips/TwelveGoWidgetHost'

const V1 = 'https://12go.asia/?z=17323861&sub_id=jetnity-mobility-route'
const PAGE = 'https://jetnity.com/fixture'
const SCRIPT = 'https://jetnity.com/eltern.js'

const POSITIVE = `window.__jetnityUseFixturePolicy=true;window.__analytics=true;window.__jetnityCmp={releaseAllowed:true,killDenied:false};
window.PrivacyBee={getAllConsents(){return{SECURITY_STORAGE:true,FUNCTIONALITY_STORAGE:true,ANALYTICS_STORAGE:window.__analytics===true,AD_STORAGE:false,AD_USER_DATA:false,AD_PERSONALIZATION:false,PERSONALIZATION_STORAGE:false}},getConsent(name){return this.getAllConsents()[name]},hasExplicitConsent(){return true}};`

function kindHtml(mode: 'ready' | 'still'): string {
  const script = mode === 'still' ? '' : `<script>
const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
const challenge=[...bytes].map((b)=>b.toString(16).padStart(2,'0')).join('');
const frameGeneration=1;
document.documentElement.dataset.challenge=challenge;
let timer=setInterval(()=>{parent.postMessage({type:'jetnity-widget-host',revision:1,kind:'canary',n:Date.now()},'https://jetnity.com')},150);
addEventListener('pagehide',()=>clearInterval(timer));
let grants=0;
addEventListener('message',(event)=>{
  if(event.origin!=='https://jetnity.com'||event.source!==parent)return;
  if(!event.data||event.data.kind!=='grant')return;
  grants+=1;
  document.documentElement.dataset.grants=String(grants);
  document.documentElement.dataset.policy=String(event.data.policyId||'');
});
parent.postMessage({type:'jetnity-widget-host',revision:1,kind:'ready',provider:'twelvego',challenge,frameGeneration},'https://jetnity.com');
</script>`
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>
<form><label>Start <input name="von"></label><label>Ziel <input name="nach"></label><label>Datum <input name="datum"></label>
<p id="powered">Powered by 12Go</p></form>${script}</body></html>`
}

function seite(css: string): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><style>${css}</style></head><body><div id="root"></div><script src="${SCRIPT}"></script></body></html>`
}

function bundle(): string {
  const ausgabe = join(nachweisOrdner(), 'eltern.js')
  mkdirSync(nachweisOrdner(), { recursive: true })
  execFileSync(join(process.cwd(), 'node_modules/esbuild/bin/esbuild'), [
    join(process.cwd(), 'scripts/twelve-go-widget-v2/eltern.tsx'),
    '--bundle',
    '--platform=browser',
    '--format=iife',
    '--jsx=automatic',
    `--alias:@=${process.cwd()}`,
    `--alias:@/lib/privacy/privacybee-cmp/produktionspolitik=${join(process.cwd(), 'scripts/twelve-go-widget-v2/politik-fixture.ts')}`,
    `--alias:next/navigation=${join(process.cwd(), 'scripts/twelve-go-widget-v2/navigation-shim.ts')}`,
    `--alias:next/link=${join(process.cwd(), 'scripts/twelve-go-widget-v2/link-shim.tsx')}`,
    `--alias:server-only=${join(process.cwd(), 'scripts/twelve-go-widget-v2/leer.ts')}`,
    `--outfile=${ausgabe}`,
    '--define:process.env.NODE_ENV="production"',
    `--banner:js=globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;`,
  ], { stdio: 'inherit', env: { ...process.env }, cwd: process.cwd() })
  return ausgabe
}

type Art = 'page' | 'script' | 'child'

function artVon(adresse: string): Art | null {
  if (adresse.startsWith(PAGE)) return 'page'
  if (adresse === SCRIPT) return 'script'
  if (adresse === TWELVE_GO_HOST_SRC) return 'child'
  return null
}

async function oeffnen(
  browser: Browser,
  css: string,
  js: string,
  options: { fixture: boolean; width: number; height: number; root: string; seam?: 'guest' | 'account' },
  kind: { current: 'ready' | 'still' },
  ledger: { adresse: string }[],
): Promise<{ context: BrowserContext; page: Page; referer: string[] }> {
  const context = await browser.newContext({ viewport: { width: options.width, height: options.height }, locale: 'de-CH' })
  if (options.fixture) await context.addInitScript(POSITIVE)
  const referer: string[] = []
  const html = seite(css)
  await context.route('**/*', (route) => {
    const adresse = route.request().url()
    const art = artVon(adresse)
    if (!art) {
      ledger.push({ adresse })
      return route.abort()
    }
    if (art === 'child') {
      referer.push(route.request().headers().referer ?? '')
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: kindHtml(kind.current) })
    }
    if (art === 'script') return route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: js })
    return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html })
  })
  const page = await context.newPage()
  const seam = options.seam ?? 'guest'
  await page.goto(`${PAGE}?seam=${seam}`, { waitUntil: 'networkidle' })
  await page.evaluate((root) => { document.documentElement.style.fontSize = root }, options.root)
  return { context, page, referer }
}

async function rahmen(page: Page) {
  const handle = await page.locator('[data-twelve-go-host="frame"]').elementHandle()
  const frame = await handle?.contentFrame()
  if (!frame) return null
  return frame.evaluate(() => {
    const felder = []
    const inputs = document.querySelectorAll('input')
    for (let i = 0; i < inputs.length; i += 1) {
      const feld = inputs[i]
      if (!(feld instanceof HTMLInputElement)) continue
      const kasten = feld.getBoundingClientRect()
      felder.push({ name: feld.getAttribute('name'), wert: feld.value, hoehe: kasten.height, breite: kasten.width })
    }
    const powered = document.querySelector('#powered')
    return {
      grants: document.documentElement.dataset.grants ?? '0',
      policy: document.documentElement.dataset.policy ?? '',
      challenge: document.documentElement.dataset.challenge ?? '',
      powered: (powered?.getBoundingClientRect().height ?? 0) > 0,
      felder,
    }
  })
}

async function anfragen(page: Page) {
  await page.locator('[data-twelve-go-aktion="anfragen"], [data-twelve-go-aktion="erneut"]').first().click()
}

async function wartenAufRahmen(page: Page) {
  await page.waitForSelector('[data-twelve-go-host="frame"]')
  await page.waitForFunction(() => [...document.querySelectorAll('iframe')].some((frame) => frame.getAttribute('data-twelve-go-host') === 'frame'))
  await page.waitForTimeout(200)
}

function assertGleich(fehler: string[], bedingung: boolean, text: string) {
  if (!bedingung) fehler.push(text)
}

async function main() {
  const ziel = nachweisOrdner()
  mkdirSync(ziel, { recursive: true })
  const jsPfad = bundle()
  const { readFileSync } = await import('node:fs')
  const js = readFileSync(jsPfad, 'utf8')
  const css = await anwendungsStil()
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const fehler: string[] = []
  const ledger: { adresse: string }[] = []
  const kind = { current: 'ready' as 'ready' | 'still' }

  try {
    const ohne = await oeffnen(browser, css, js, { fixture: false, width: 1440, height: 1200, root: '16px', seam: 'guest' }, kind, ledger)
    await ohne.page.getByRole('button', { name: 'Suchformular anfragen' }).waitFor()
    assertGleich(fehler, await ohne.page.locator('iframe').count() === 0, 'Gast startet mit Frame')
    const href = await ohne.page.locator('a[data-twelve-go-art]').first().getAttribute('href')
    assertGleich(fehler, href === V1, `V1 ${href}`)
    await anfragen(ohne.page)
    await ohne.page.waitForTimeout(200)
    assertGleich(fehler, (await ohne.page.locator('[data-twelve-go-widget]').getAttribute('data-twelve-go-widget')) === 'verweigert', 'produktive Sperre nicht ehrlich')
    assertGleich(fehler, await ohne.page.locator('iframe').count() === 0, 'Sperre montiert einen Frame')
    assertGleich(fehler, ledger.length === 0, `Netz vor der Freigabe ${ledger.length}`)
    await ohne.page.screenshot({ path: join(ziel, 'r6-sperre.png'), fullPage: false })
    await ohne.context.close()

    const konto = await oeffnen(browser, css, js, { fixture: false, width: 1440, height: 1200, root: '16px', seam: 'account' }, kind, ledger)
    await konto.page.getByRole('button', { name: 'Suchformular anfragen' }).waitFor()
    assertGleich(fehler, await konto.page.locator('[data-twelve-go-affiliate]').count() === 1, 'Konto ohne 12Go')
    await konto.context.close()

    const breiten = [
      { name: '320', width: 320, height: 1400, root: '16px' },
      { name: '390', width: 390, height: 1400, root: '16px' },
      { name: '768', width: 768, height: 1200, root: '16px' },
      { name: '1440', width: 1440, height: 1100, root: '16px' },
      { name: '390-root-32', width: 390, height: 1600, root: '32px' },
    ]
    for (const fall of breiten) {
      const lauf = await oeffnen(browser, css, js, { fixture: false, ...fall, seam: 'guest' }, kind, ledger)
      await lauf.page.getByRole('button', { name: 'Suchformular anfragen' }).waitFor()
      const masse = await lauf.page.evaluate(() => {
        const flaeche = document.querySelector('[data-twelve-go-affiliate]')
        const tabs = document.querySelector('[aria-label="Mobilitätsbereiche"]')
        const seite = document.querySelector('.workspace-page')
        const text = flaeche?.querySelector('.text-ink-800')
        const probe = document.createElement('span')
        probe.style.color = 'var(--white-mint-muted)'
        document.body.appendChild(probe)
        const farbe = text ? getComputedStyle(text).color.replace(/\s/g, '') : ''
        const erwartet = getComputedStyle(probe).color.replace(/\s/g, '')
        probe.remove()
        return {
          flaeche: flaeche ? flaeche.scrollWidth <= flaeche.clientWidth + 1 : false,
          tabs: tabs ? tabs.scrollWidth <= tabs.clientWidth + 1 : false,
          farbe,
          erwartet,
          abstand: seite ? Number.parseFloat(getComputedStyle(seite).marginLeft) : 0,
          poweredParent: document.body.innerText.includes('Eine Beispielstrecke wird nicht vorausgefüllt'),
        }
      })
      assertGleich(fehler, masse.flaeche, `${fall.name}: 12Go-Fläche zu breit`)
      assertGleich(fehler, masse.tabs, `${fall.name}: Bereiche zu breit`)
      assertGleich(fehler, masse.farbe === masse.erwartet && masse.farbe !== '', `${fall.name}: Mint`)
      if (fall.width >= 1024) assertGleich(fehler, masse.abstand >= 200, `${fall.name}: Abstand ${masse.abstand}`)
      assertGleich(fehler, masse.poweredParent, `${fall.name}: Hinweis`)
      await lauf.page.screenshot({ path: join(ziel, `r6-${fall.name}.png`), fullPage: false })
      await lauf.context.close()
    }

    kind.current = 'ready'
    const lauf = await oeffnen(browser, css, js, { fixture: true, width: 1440, height: 1200, root: '16px' }, kind, ledger)
    const page = lauf.page
    await page.getByRole('button', { name: 'Suchformular anfragen' }).waitFor()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Fixture startet mit Frame')
    const von = page.locator('[aria-label="Manuelle Verbindung"]').getByLabel('Von')
    await von.fill('Bahnhof')
    await page.evaluate(() => {
      const knopf = document.querySelector<HTMLButtonElement>('[data-twelve-go-aktion="anfragen"]')
      knopf?.click()
      knopf?.click()
    })
    await wartenAufRahmen(page)
    const erster = await rahmen(page)
    const host = await page.locator('[data-twelve-go-host="frame"]').evaluate((knoten) => ({
      src: knoten.getAttribute('src'),
      sandbox: knoten.getAttribute('sandbox'),
      referrer: knoten.getAttribute('referrerpolicy'),
      anzahl: document.querySelectorAll('iframe').length,
    }))
    assertGleich(fehler, host.anzahl === 1 && host.src === TWELVE_GO_HOST_SRC, `src ${host.src}`)
    assertGleich(fehler, host.sandbox === TWELVE_GO_HOST_SANDBOX, `sandbox ${host.sandbox}`)
    assertGleich(fehler, host.referrer === 'no-referrer', 'Referrer')
    assertGleich(fehler, erster?.grants === '1' && erster.policy === 'twelvego-general-chf-20261031-r1', `Grant ${erster?.grants}`)
    assertGleich(fehler, erster?.powered === true, 'Powered-by')
    assertGleich(fehler, (erster?.felder.length ?? 0) >= 3 && erster?.felder.every((feld) => feld.wert === '' && feld.hoehe > 0 && feld.breite > 0) === true, 'Felder')
    assertGleich(fehler, lauf.referer.length >= 1 && lauf.referer.every((wert) => wert === ''), `Referer ${lauf.referer.join(',')}`)
    await page.locator('[data-ort-wechsel]').click()
    await page.waitForTimeout(150)
    assertGleich(fehler, await page.locator('[data-twelve-go-host="frame"]').count() === 0, 'gleicher Etappen-ID behält den Frame')
    await page.locator('[data-ort-wechsel]').click()
    await page.waitForTimeout(150)
    assertGleich(fehler, await page.locator('[data-twelve-go-host="frame"]').count() === 0, 'wiederhergestellter Ort startet ohne Klick')
    await anfragen(page)
    await wartenAufRahmen(page)
    await page.evaluate(() => {
      const fremd = document.createElement('iframe')
      fremd.src = 'https://jetnity-widgets.vercel.app/embed/twelvego'
      fremd.setAttribute('data-fremd', '1')
      document.body.appendChild(fremd)
    })
    await page.waitForTimeout(300)
    assertGleich(fehler, await page.locator('[data-twelve-go-host="frame"]').count() === 1, 'fremdes Ready ersetzt den Frame')
    assertGleich(fehler, (await rahmen(page))?.grants === '1', 'fremdes Ready bekommt einen Grant')
    await page.locator('iframe[data-fremd]').evaluate((knoten) => knoten.remove())
    await page.screenshot({ path: join(ziel, 'r6-frame.png'), fullPage: false })

    await (await (await page.locator('[data-twelve-go-host="frame"]').elementHandle())?.contentFrame())?.evaluate(() => {
      const challenge = document.documentElement.dataset.challenge
      parent.postMessage({ type: 'jetnity-widget-host', revision: 1, kind: 'ready', provider: 'twelvego', challenge, frameGeneration: 1 }, 'https://jetnity.com')
    })
    await page.waitForTimeout(100)
    assertGleich(fehler, (await rahmen(page))?.grants === '1', 'Replay grant')

    await (await (await page.locator('[data-twelve-go-host="frame"]').elementHandle())?.contentFrame())?.evaluate(() => {
      const bytes = new Uint8Array(32)
      crypto.getRandomValues(bytes)
      const challenge = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
      parent.postMessage({ type: 'jetnity-widget-host', revision: 1, kind: 'ready', provider: 'twelvego', challenge, frameGeneration: 2 }, 'https://jetnity.com')
    })
    await page.waitForTimeout(100)
    assertGleich(fehler, await page.locator('[data-twelve-go-host="frame"]').count() === 0, 'neues Ready bleibt stehen')

    await anfragen(page)
    await wartenAufRahmen(page)
    assertGleich(fehler, (await rahmen(page))?.grants === '1', 'Retry ohne neuen Grant')

    await page.getByRole('tab', { name: 'Mietwagen' }).click()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Mietwagen behält den Frame')
    await page.getByRole('tab', { name: 'Verbindungen' }).click()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Rückkehr startet neu')
    assertGleich(fehler, await von.inputValue() === 'Bahnhof', 'manuelle Eingabe verloren')

    kind.current = 'still'
    await anfragen(page)
    await page.waitForSelector('[data-twelve-go-host="frame"]')
    await page.getByRole('tab', { name: 'Mietwagen' }).click()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'pending Frame bleibt')
    await page.getByRole('tab', { name: 'Verbindungen' }).click()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'pending kehrt zurück')

    kind.current = 'ready'
    await anfragen(page)
    await wartenAufRahmen(page)
    await page.locator('[data-bereich="fluege"]').click()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Domain behält den Frame')
    await page.locator('[data-bereich="mobilitaet"]').click()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Domain-Rückkehr startet')

    await anfragen(page)
    await wartenAufRahmen(page)
    await page.locator('[data-workspace-mode-nav]').getByRole('button', { name: 'Übersicht' }).first().click()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Übersicht behält den Frame')
    await page.locator('[data-workspace-mode-nav]').getByRole('button', { name: 'Organisieren' }).first().click()
    await page.locator('[data-bereich="mobilitaet"]').click()
    await page.getByRole('button', { name: 'Suchformular anfragen' }).waitFor()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Modus-Rückkehr startet')

    await anfragen(page)
    await wartenAufRahmen(page)
    await page.locator('[data-etappe-tausch]').click()
    await page.waitForTimeout(100)
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Etappenwechsel behält den Frame')

    await anfragen(page)
    await wartenAufRahmen(page)
    await page.evaluate(() => {
      window.__analytics = false
      document.dispatchEvent(new Event('privacybee:consent-changed'))
    })
    await page.waitForTimeout(200)
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Kategorie behält den Frame')
    await page.evaluate(() => {
      window.__analytics = true
      document.dispatchEvent(new Event('privacybee:consent-changed'))
    })
    await page.waitForTimeout(100)
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'neue Zustimmung belebt den Frame')
    await anfragen(page)
    await wartenAufRahmen(page)
    assertGleich(fehler, (await rahmen(page))?.grants === '1', 'neuer Handle nach Widerruf')

    await page.locator('[data-twelve-go-aktion="entfernen"]').focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(100)
    const fokus = await page.evaluate(() => document.activeElement?.getAttribute('data-twelve-go-aktion'))
    assertGleich(fehler, fokus === 'erneut', `Fokus ${fokus}`)
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Enter entfernt den Frame nicht')

    await anfragen(page)
    await wartenAufRahmen(page)
    await page.evaluate(() => {
      window.__zaehle = false
      window.__canaries = 0
      window.addEventListener('message', (event) => {
        const data = event.data as { kind?: string } | null
        if (window.__zaehle && data?.kind === 'canary') window.__canaries += 1
      })
    })
    await page.locator('[data-workspace-aus]').click()
    await page.waitForTimeout(250)
    await page.evaluate(() => { window.__canaries = 0; window.__zaehle = true })
    await page.waitForTimeout(500)
    const canaries = await page.evaluate(() => window.__canaries)
    assertGleich(fehler, canaries === 0, `Canary nach Abbau ${canaries}`)
    await page.locator('[data-workspace-an]').click()
    await page.getByRole('button', { name: 'Suchformular anfragen' }).waitFor()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Unmount startet neu')
    await lauf.context.close()

    kind.current = 'still'
    const timeout = await oeffnen(browser, css, js, { fixture: true, width: 390, height: 1200, root: '16px' }, kind, ledger)
    await timeout.page.clock.install()
    await timeout.page.getByRole('button', { name: 'Suchformular anfragen' }).waitFor()
    await anfragen(timeout.page)
    await timeout.page.waitForSelector('[data-twelve-go-host="frame"]')
    await timeout.page.clock.fastForward(TWELVE_GO_READY_TIMEOUT_MS)
    await timeout.page.waitForTimeout(100)
    assertGleich(fehler, await timeout.page.locator('[data-twelve-go-host="frame"]').count() === 0, 'Timeout behält den Frame')
    await timeout.page.screenshot({ path: join(ziel, 'r6-390-timeout.png'), fullPage: false })
    await timeout.context.close()

    kind.current = 'ready'
    const schmal = await oeffnen(browser, css, js, { fixture: true, width: 390, height: 1400, root: '32px' }, kind, ledger)
    await schmal.page.getByRole('button', { name: 'Suchformular anfragen' }).waitFor()
    await anfragen(schmal.page)
    await wartenAufRahmen(schmal.page)
    const schmalFelder = await rahmen(schmal.page)
    assertGleich(fehler, schmalFelder?.powered === true && schmalFelder.felder.every((feld) => feld.breite > 0 && feld.hoehe > 0), 'schmale Felder')
    const rahmenBreite = await schmal.page.locator('[data-twelve-go-host="frame"]').evaluate((knoten) => knoten.getBoundingClientRect().width)
    assertGleich(fehler, rahmenBreite <= 390, `Rahmenbreite ${rahmenBreite}`)
    await schmal.page.screenshot({ path: join(ziel, 'r6-390-32.png'), fullPage: false })
    await schmal.context.close()
  } finally {
    await browser.close()
  }

  writeFileSync(join(ziel, 'r6-eltern.json'), JSON.stringify({ ledger, fehler }, null, 2))
  console.log(`nachweis: ${ziel}`)
  if (ledger.length || fehler.length) {
    console.error([...fehler, ...ledger.map((eintrag) => eintrag.adresse)].join('\n'))
    process.exit(1)
  }
  console.log('eltern ok')
}

declare global {
  interface Window {
    __analytics?: boolean
    __zaehle?: boolean
    __canaries?: number
  }
}

if (process.argv[1]?.endsWith('eltern-nachweis.ts') === true) {
  void main().catch((grund: unknown) => {
    console.error(grund instanceof Error ? grund.stack ?? grund.message : grund)
    process.exit(1)
  })
}
