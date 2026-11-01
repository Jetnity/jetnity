// Offline parent flow. The bundle watches the real production facade.
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

const POSITIVE = `window.__analytics=true;window.__jetnityCmp={releaseAllowed:true,killDenied:false};
window.PrivacyBee={getAllConsents(){return{SECURITY_STORAGE:true,FUNCTIONALITY_STORAGE:true,ANALYTICS_STORAGE:window.__analytics===true,AD_STORAGE:false,AD_USER_DATA:false,AD_PERSONALIZATION:false,PERSONALIZATION_STORAGE:false}},getConsent(name){return this.getAllConsents()[name]},hasExplicitConsent(){return true}};`

function kindHtml(mode: 'ready' | 'still' | 'verzoegert'): string {
  const script = mode === 'still' ? '' : `<script>
const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
const challenge=[...bytes].map((b)=>b.toString(16).padStart(2,'0')).join('');
const frameGeneration=1;
document.documentElement.dataset.challenge=challenge;
let timer=setInterval(function(){parent.postMessage({type:'jetnity-widget-host',revision:1,kind:'canary',n:Date.now()},'https://jetnity.com')},80);
addEventListener('pagehide',function(){clearInterval(timer)});
let grants=0;
addEventListener('message',function(event){
  if(event.origin!=='https://jetnity.com'||event.source!==parent)return;
  if(!event.data||event.data.kind!=='grant')return;
  grants+=1;
  document.documentElement.dataset.grants=String(grants);
  document.documentElement.dataset.policy=String(event.data.policyId||'');
  parent.postMessage({type:'jetnity-widget-host',revision:1,kind:'grant-gesehen',n:grants},'https://jetnity.com');
});
function bereit(){parent.postMessage({type:'jetnity-widget-host',revision:1,kind:'ready',provider:'twelvego',challenge:challenge,frameGeneration:frameGeneration},'https://jetnity.com')}
if(${mode === 'verzoegert' ? 'true' : 'false'}) setTimeout(bereit,1200);
else bereit();
</script>`
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>
<form><label>Start <input name="von"></label><label>Ziel <input name="nach"></label><label>Datum <input name="datum"></label>
<p id="powered">Powered by 12Go</p></form>${script}</body></html>`
}

function seite(css: string): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><style>${css}</style></head><body><div id="root"></div><script>
window.__einstellungen=0;window.__canaries=0;window.__grantsGesehen=0;window.__readyEmpfangen=0;window.__zaehleCanary=false;window.__fassade=[];
document.addEventListener('click',function(event){
  var ziel=event.target&&event.target.closest?event.target.closest('.privacybee-display-preferences'):null;
  if(!ziel)return;
  window.__einstellungen+=1;
  var feld=document.getElementById('einstellungen-fixture');
  if(!feld){feld=document.createElement('div');feld.id='einstellungen-fixture';document.body.appendChild(feld)}
  feld.setAttribute('data-einstellungen-offen',String(window.__einstellungen));
  feld.textContent='Einstellungen geöffnet';
});
window.addEventListener('message',function(event){
  var data=event.data;
  if(!data||data.type!=='jetnity-widget-host')return;
  if(data.kind==='canary'&&window.__zaehleCanary)window.__canaries+=1;
  if(data.kind==='grant-gesehen')window.__grantsGesehen+=1;
  if(data.kind==='ready'&&event.origin==='https://jetnity-widgets.vercel.app'){
    window.__readyEmpfangen+=1;
    window.__readyOrigin=event.origin;
    if(window.__retiredQuelle&&event.source===window.__retiredQuelle&&data.challenge===window.__retiredChallenge)window.__retiredTreffer=(window.__retiredTreffer||0)+1;
  }
});
</script><script src="${SCRIPT}"></script></body></html>`
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
    `--alias:@/lib/privacy/privacybee-cmp/produktion=${join(process.cwd(), 'scripts/twelve-go-widget-v2/grant-beobachter.ts')}`,
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
  options: { fixture: boolean; width: number; height: number; root: string; seam?: 'guest' | 'account'; bootstrap?: boolean },
  kind: { current: 'ready' | 'still' | 'verzoegert' },
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
  const bootstrap = options.bootstrap ? '&bootstrap=produktion' : ''
  await page.goto(`${PAGE}?seam=${seam}${bootstrap}`, { waitUntil: 'networkidle' })
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

type FokusBeweis = { status: string; outline: string; shadow: string }

function fokusLeer(status: string): FokusBeweis {
  return { status, outline: '', shadow: '' }
}

async function tabBeweis(page: Page, selektor: string): Promise<FokusBeweis> {
  await page.evaluate(() => {
    const aktiv = document.activeElement
    if (aktiv instanceof HTMLElement) aktiv.blur()
  })
  let erreicht = false
  for (let schritt = 0; schritt < 400 && !erreicht; schritt += 1) {
    await page.keyboard.press('Tab')
    erreicht = await page.evaluate((sel) => document.activeElement?.matches(sel) ?? false, selektor)
  }
  if (!erreicht) return fokusLeer('tab')
  await page.keyboard.press('Shift+Tab')
  const nochDort = await page.evaluate((sel) => document.activeElement?.matches(sel) ?? false, selektor)
  if (nochDort) return fokusLeer('shift')
  await page.keyboard.press('Tab')
  const ziel = page.locator(selektor).first()
  await ziel.scrollIntoViewIfNeeded()
  return page.evaluate((sel) => {
    const el = document.activeElement
    const leer = { status: 'ruecktab', outline: '', shadow: '' }
    if (!(el instanceof HTMLElement) || !el.matches(sel)) return leer
    const stil = getComputedStyle(el)
    const schatten = stil.boxShadow
    const basis = { outline: `${stil.outlineWidth} ${stil.outlineStyle} ${stil.outlineColor}`, shadow: schatten }
    if (!el.matches(':focus-visible')) return { status: 'focus-visible', outline: basis.outline, shadow: basis.shadow }
    const schichten = schatten === 'none' ? [] : schatten.split(/,(?![^(]*\))/)
    let schattenGeometrie = false
    for (let i = 0; i < schichten.length; i += 1) {
      const schicht = schichten[i]
      const farbtreffer = schicht.match(/rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8}/)
      const farbe = farbtreffer ? farbtreffer[0] : ''
      const ohneFarbe = farbtreffer ? schicht.replace(farbtreffer[0], ' ') : schicht
      const px = ohneFarbe.match(/-?\d+(?:\.\d+)?px/g) || []
      let geometrie = false
      for (let p = 0; p < px.length; p += 1) if (Number.parseFloat(px[p]) !== 0) geometrie = true
      let weg = !farbe || farbe === 'transparent'
      const klasisch = farbe.match(/rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*([\d.]+)\s*)?\)/)
      if (klasisch && klasisch[1] !== undefined && Number(klasisch[1]) === 0) weg = true
      const modern = farbe.match(/\/\s*([\d.]+%?)\s*\)/)
      if (modern) {
        const roh = modern[1]
        const wert = roh.endsWith('%') ? Number(roh.slice(0, -1)) / 100 : Number(roh)
        if (wert === 0) weg = true
      }
      if (geometrie && !weg) schattenGeometrie = true
    }
    let umrissWeg = !stil.outlineColor || stil.outlineColor === 'transparent'
    const umrissKlasisch = stil.outlineColor.match(/rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*([\d.]+)\s*)?\)/)
    if (umrissKlasisch && umrissKlasisch[1] !== undefined && Number(umrissKlasisch[1]) === 0) umrissWeg = true
    const umrissModern = stil.outlineColor.match(/\/\s*([\d.]+%?)\s*\)/)
    if (umrissModern) {
      const roh = umrissModern[1]
      const wert = roh.endsWith('%') ? Number(roh.slice(0, -1)) / 100 : Number(roh)
      if (wert === 0) umrissWeg = true
    }
    const umriss = stil.outlineStyle !== 'none' && Number.parseFloat(stil.outlineWidth) > 0 && !umrissWeg
    const kasten = el.getBoundingClientRect()
    const imFenster = kasten.width >= 8 && kasten.height >= 44 && kasten.top >= -1 && kasten.left >= -1 && kasten.bottom <= window.innerHeight + 1 && kasten.right <= window.innerWidth + 1
    const flaeche = document.querySelector('[data-twelve-go-affiliate]')
    const ueber = Boolean(flaeche && flaeche.scrollWidth > flaeche.clientWidth + 1) || document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    if (!schattenGeometrie && !umriss) return { status: 'ring', outline: basis.outline, shadow: basis.shadow }
    if (!imFenster) return { status: `ausschnitt ${Math.round(kasten.left)},${Math.round(kasten.top)} ${Math.round(kasten.width)}x${Math.round(kasten.height)} fenster ${window.innerWidth}x${window.innerHeight}`, outline: basis.outline, shadow: basis.shadow }
    if (ueber) return { status: 'ueberlauf', outline: basis.outline, shadow: basis.shadow }
    return { status: '', outline: basis.outline, shadow: basis.shadow }
  }, selektor)
}

function verbrauchteGrants(liste: Array<{ name: string; leer: boolean }> | undefined) {
  return (liste ?? []).filter((eintrag) => eintrag.name === 'consume' && eintrag.leer === false).length
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
  const steuerung: Array<Record<string, string | number | boolean | null>> = []
  const ledger: { adresse: string }[] = []
  const arbeit: Record<string, unknown> = {}
  const kind = { current: 'ready' as 'ready' | 'still' | 'verzoegert' }

  try {
    const ohne = await oeffnen(browser, css, js, { fixture: false, bootstrap: true, width: 1440, height: 1200, root: '16px', seam: 'guest' }, kind, ledger)
    await ohne.page.getByRole('button', { name: 'Suchformular anfragen' }).waitFor()
    assertGleich(fehler, await ohne.page.locator('[data-twelve-go-disclosure="twelvego-general-disclosure-v1"]').count() === 1, 'Hinweis fehlt')
    assertGleich(fehler, await ohne.page.locator('[data-twelve-go-datenschutz]').getAttribute('href') === 'https://12go.asia/en/privacy-policy', 'Datenschutzlink')
    assertGleich(fehler, await ohne.page.locator('[data-cmp-preferences="surface"]').count() === 0, 'produktiver Bootstrap zeigt Einstellungen')
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
      const lauf = await oeffnen(browser, css, js, { fixture: false, bootstrap: true, ...fall, seam: 'guest' }, kind, ledger)
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
          poweredParent: document.body.innerText.includes('Bangkok-Referenz'),
          link: document.querySelector('[data-twelve-go-datenschutz]')?.getBoundingClientRect().height ?? 0,
        }
      })
      assertGleich(fehler, masse.flaeche, `${fall.name}: 12Go-Fläche zu breit`)
      assertGleich(fehler, masse.tabs, `${fall.name}: Bereiche zu breit`)
      assertGleich(fehler, masse.farbe === masse.erwartet && masse.farbe !== '', `${fall.name}: Mint`)
      if (fall.width >= 1024) assertGleich(fehler, masse.abstand >= 200, `${fall.name}: Abstand ${masse.abstand}`)
      assertGleich(fehler, masse.poweredParent, `${fall.name}: Hinweis`)
      assertGleich(fehler, masse.link >= 44, `${fall.name}: Datenschutzlink ${masse.link}`)
      await lauf.page.screenshot({ path: join(ziel, `r6-${fall.name}.png`), fullPage: false })
      await lauf.context.close()
    }

    for (const fall of breiten) {
      const einstellung = await oeffnen(browser, css, js, { fixture: true, ...fall, seam: 'guest' }, kind, ledger)
      await einstellung.page.getByRole('button', { name: 'Datenschutz-Einstellungen' }).waitFor()
      const masse = await einstellung.page.evaluate(() => {
        const knopf = document.querySelector('[data-cmp-preferences="surface"]')
        const anfrage = document.querySelector('[data-twelve-go-aktion="anfragen"]')
        const flaeche = document.querySelector('[data-twelve-go-affiliate]')
        const kasten = knopf ? knopf.getBoundingClientRect() : { height: 0, width: 0 }
        const anfrageKasten = anfrage ? anfrage.getBoundingClientRect() : { height: 0, width: 0 }
        return {
          hoehe: kasten.height,
          breite: kasten.width,
          anfrage: anfrageKasten.height,
          rahmen: document.querySelectorAll('iframe').length,
          ueber: flaeche ? flaeche.scrollWidth > flaeche.clientWidth + 1 : true,
        }
      })
      assertGleich(fehler, masse.hoehe >= 44 && masse.breite >= 44, `${fall.name}: Einstellungen ${masse.hoehe}x${masse.breite}`)
      assertGleich(fehler, masse.anfrage >= 44, `${fall.name}: Anfrage ${masse.anfrage}`)
      assertGleich(fehler, masse.rahmen === 0 && !masse.ueber, `${fall.name}: Einstellungen starten oder überlaufen`)
      const einstellungenFokus = await tabBeweis(einstellung.page, '[data-cmp-preferences="surface"]')
      const anfrageFokus = await tabBeweis(einstellung.page, '[data-twelve-go-aktion="anfragen"]')
      if (einstellungenFokus.status) fehler.push(`${fall.name}: Einstellungen ${einstellungenFokus.status}`)
      if (anfrageFokus.status) fehler.push(`${fall.name}: Anfrage ${anfrageFokus.status}`)
      await anfragen(einstellung.page)
      await wartenAufRahmen(einstellung.page)
      const entfernenFokus = await tabBeweis(einstellung.page, '[data-twelve-go-aktion="entfernen"]')
      if (entfernenFokus.status) fehler.push(`${fall.name}: Entfernen ${entfernenFokus.status}`)
      steuerung.push({
        name: fall.name,
        einstellungen: einstellungenFokus.status || 'ok',
        einstellungenOutline: einstellungenFokus.outline,
        einstellungenShadow: einstellungenFokus.shadow,
        anfrage: anfrageFokus.status || 'ok',
        anfrageOutline: anfrageFokus.outline,
        anfrageShadow: anfrageFokus.shadow,
        entfernen: entfernenFokus.status || 'ok',
        entfernenOutline: entfernenFokus.outline,
        entfernenShadow: entfernenFokus.shadow,
        ueber: masse.ueber,
      })
      await einstellung.page.screenshot({ path: join(ziel, `r7-${fall.name}.png`), fullPage: false })
      await einstellung.context.close()
    }

    kind.current = 'ready'
    const lauf = await oeffnen(browser, css, js, { fixture: true, width: 1440, height: 1200, root: '16px' }, kind, ledger)
    const page = lauf.page
    await page.getByRole('button', { name: 'Suchformular anfragen' }).waitFor()
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Fixture startet mit Frame')
    const reihenfolge = await page.evaluate(() => {
      const hinweis = document.querySelector('[data-twelve-go-disclosure]')
      const knopf = document.querySelector('[data-twelve-go-aktion="anfragen"]')
      if (!hinweis || !knopf) return false
      return (hinweis.compareDocumentPosition(knopf) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    })
    assertGleich(fehler, reihenfolge, 'Hinweis steht nicht vor der Anfrage')
    const einstellungenVorher = await page.evaluate(() => window.__einstellungen ?? 0)
    await page.getByRole('button', { name: 'Datenschutz-Einstellungen' }).click()
    await page.getByRole('button', { name: 'Datenschutz-Einstellungen' }).focus()
    await page.keyboard.press('Enter')
    const einstellungenNachher = await page.evaluate(() => window.__einstellungen ?? 0)
    arbeit.einstellungenVorAnfrage = einstellungenVorher
    arbeit.einstellungenNachKlickUndEnter = einstellungenNachher
    assertGleich(fehler, einstellungenNachher >= einstellungenVorher + 2, `Einstellungen ${einstellungenNachher}`)
    assertGleich(fehler, await page.locator('[data-einstellungen-offen]').count() === 1, 'Fixture öffnet nicht')
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Einstellungen starten einen Frame')
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

    kind.current = 'ready'
    await page.evaluate(() => { window.__zaehleCanary = true; window.__canaries = 0; window.__fassade = [] })
    await anfragen(page)
    await wartenAufRahmen(page)
    const aktiverGrant = await rahmen(page)
    assertGleich(fehler, aktiverGrant?.grants === '1', `aktiver Grant ${aktiverGrant?.grants}`)
    const consumeVorWiderruf = verbrauchteGrants(await page.evaluate(() => window.__fassade ?? []))
    assertGleich(fehler, consumeVorWiderruf >= 1, `aktiver Consume ${consumeVorWiderruf}`)
    const challenge = aktiverGrant?.challenge ?? ''
    const altesFenster = await page.evaluateHandle(() => {
      const frame = document.querySelector('[data-twelve-go-host="frame"]')
      return frame instanceof HTMLIFrameElement ? frame.contentWindow : null
    })
    const readyVorRetired = await page.evaluate(() => window.__readyEmpfangen ?? 0)
    await page.evaluate(() => {
      window.__analytics = false
      document.dispatchEvent(new Event('privacybee:consent-changed'))
    })
    await page.waitForFunction(() => document.querySelectorAll('[data-twelve-go-host="frame"]').length === 0)
    await page.evaluate(() => { window.__canaries = 0 })
    await page.waitForTimeout(400)
    const canaryAktiv = await page.evaluate(() => window.__canaries ?? 0)
    assertGleich(fehler, canaryAktiv === 0, `Canary nach aktivem Widerruf ${canaryAktiv}`)
    await page.evaluate(() => {
      window.__analytics = true
      document.dispatchEvent(new Event('privacybee:consent-changed'))
    })
    await page.waitForTimeout(200)
    const frameNachZustimmung = await page.locator('[data-twelve-go-host="frame"]').count()
    assertGleich(fehler, frameNachZustimmung === 0, 'aktive Zustimmung startet neu')
    const lieferung = await page.evaluate(({ fenster, wert }) => {
      if (!fenster) return 'fenster-weg'
      window.__retiredQuelle = fenster
      window.__retiredChallenge = wert
      window.__retiredTreffer = 0
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'jetnity-widget-host',
          revision: 1,
          kind: 'ready',
          provider: 'twelvego',
          challenge: wert,
          frameGeneration: 1,
        },
        origin: 'https://jetnity-widgets.vercel.app',
        source: fenster,
      }))
      return window.__retiredTreffer === 1 ? 'retired-ready' : 'ohne-treffer'
    }, { fenster: altesFenster, wert: challenge })
    const consumeNachRetired = verbrauchteGrants(await page.evaluate(() => window.__fassade ?? []))
    const readyNachRetired = await page.evaluate(() => window.__readyEmpfangen ?? 0)
    const treffer = await page.evaluate(() => window.__retiredTreffer ?? 0)
    const frameNachRetired = await page.locator('[data-twelve-go-host="frame"]').count()
    arbeit.aktiv = { grants: aktiverGrant?.grants ?? null, consume: consumeVorWiderruf, canaryNachWiderruf: canaryAktiv, frameNachZustimmung }
    arbeit.retiredReady = {
      lieferung,
      challenge,
      consumeVorWiderruf,
      consumeNachLieferung: consumeNachRetired,
      readyVorher: readyVorRetired,
      readyNachher: readyNachRetired,
      treffer,
      frame: frameNachRetired,
    }
    assertGleich(fehler, lieferung === 'retired-ready', `retired-ready ${lieferung}`)
    assertGleich(fehler, treffer === 1, `retired Treffer ${treffer}`)
    assertGleich(fehler, readyNachRetired === readyVorRetired + 1, `retired Empfang ${readyVorRetired}->${readyNachRetired}`)
    assertGleich(fehler, consumeNachRetired === consumeVorWiderruf, `retired consume ${consumeVorWiderruf}->${consumeNachRetired}`)
    assertGleich(fehler, frameNachRetired === 0, 'retired-ready erzeugt einen Frame')

    kind.current = 'verzoegert'
    const consumeVorVerzoegert = verbrauchteGrants(await page.evaluate(() => window.__fassade ?? []))
    await page.evaluate(() => { window.__zaehleCanary = true; window.__canaries = 0; window.__grantsGesehen = 0 })
    await anfragen(page)
    await page.waitForSelector('[data-twelve-go-host="frame"]')
    await page.waitForFunction(() => (window.__canaries ?? 0) >= 1)
    const canaryVorVerzoegert = await page.evaluate(() => window.__canaries ?? 0)
    const grantsVorVerzoegert = await page.evaluate(() => window.__grantsGesehen ?? 0)
    assertGleich(fehler, grantsVorVerzoegert === 0, 'verzoegertes Ready war schon ein Grant')
    const einstellungenBeiAblehnung = await page.evaluate(() => window.__einstellungen ?? 0)
    await page.evaluate(() => {
      window.__analytics = false
      document.dispatchEvent(new Event('privacybee:consent-changed'))
    })
    await page.waitForFunction(() => document.querySelectorAll('[data-twelve-go-host="frame"]').length === 0)
    await page.evaluate(() => { window.__canaries = 0 })
    await page.waitForTimeout(1500)
    const nachWiderruf = await page.evaluate(() => ({ canaries: window.__canaries ?? 0, grants: window.__grantsGesehen ?? 0 }))
    const consumeNachVerzoegert = verbrauchteGrants(await page.evaluate(() => window.__fassade ?? []))
    arbeit.verzoegert = {
      canaryVorWiderruf: canaryVorVerzoegert,
      grantsVorWiderruf: grantsVorVerzoegert,
      canaryNachher: nachWiderruf.canaries,
      grantsNachher: nachWiderruf.grants,
      consumeVorher: consumeVorVerzoegert,
      consumeNachher: consumeNachVerzoegert,
    }
    assertGleich(fehler, nachWiderruf.canaries === 0, `Canary nach Widerruf ${nachWiderruf.canaries}`)
    assertGleich(fehler, nachWiderruf.grants === 0, `verspaeteter Grant ${nachWiderruf.grants}`)
    assertGleich(fehler, consumeNachVerzoegert === consumeVorVerzoegert, `verzoegerter Consume ${consumeVorVerzoegert}->${consumeNachVerzoegert}`)
    assertGleich(fehler, await page.locator('[data-cmp-preferences="surface"]').count() === 1, 'Einstellungen fehlen nach Statistik-Ablehnung')
    await page.getByRole('button', { name: 'Datenschutz-Einstellungen' }).click()
    await page.getByRole('button', { name: 'Datenschutz-Einstellungen' }).focus()
    await page.keyboard.press('Enter')
    const einstellungenNachAblehnung = await page.evaluate(() => window.__einstellungen ?? 0)
    arbeit.einstellungenBeiAblehnung = einstellungenBeiAblehnung
    arbeit.einstellungenNachAblehnung = einstellungenNachAblehnung
    assertGleich(fehler, einstellungenNachAblehnung >= einstellungenBeiAblehnung + 2, `Einstellungen nach Ablehnung ${einstellungenNachAblehnung}`)
    assertGleich(fehler, await page.locator('iframe').count() === 0, 'Einstellungen nach Ablehnung starten einen Frame')
    kind.current = 'ready'
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

  writeFileSync(join(ziel, 'r7-eltern.json'), JSON.stringify({ ledger, fehler, steuerung, arbeit }, null, 2))
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
    __zaehleCanary?: boolean
    __canaries?: number
    __einstellungen?: number
    __grantsGesehen?: number
    __readyEmpfangen?: number
    __readyOrigin?: string
    __retiredQuelle?: Window | null
    __retiredChallenge?: string
    __retiredTreffer?: number
    __fassade?: Array<{ name: string; leer: boolean }>
  }
}

if (process.argv[1]?.endsWith('eltern-nachweis.ts') === true) {
  void main().catch((grund: unknown) => {
    console.error(grund instanceof Error ? grund.stack ?? grund.message : grund)
    process.exit(1)
  })
}
