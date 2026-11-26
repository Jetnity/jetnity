import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium, type Browser, type Page } from 'playwright'

import { GastReiseLeseWarte } from '@/components/trips/GastReiseLesefehler'
import { WORKSPACE_THEME_BOOT, WORKSPACE_THEME_KEY } from '@/lib/ui/workspace-theme-boot'

type TextProbe = { name: string; farbe: string | null; grund: string | null }
type Probe = {
  html: string | null
  shellAttr: string | null
  shell: string | null
  platzhalter: string[]
  texte: TextProbe[]
}

const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage']
const STILE = [
  'styles/globals.css',
  'styles/white-mint.css',
  'components/workspace/workspace.css',
  'components/workspace/workspace-surfaces.css',
  'components/workspace/workspace-niveau.css',
]

function luminance(color: string | null): number | null {
  const match = color?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  const channels = [match[1], match[2], match[3]].map((part) => {
    const value = Number(part) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

function kontrast(farbe: string | null, grund: string | null): number {
  const vordergrund = luminance(farbe)
  const hintergrund = luminance(grund)
  if (vordergrund == null || hintergrund == null) return 0
  const hell = Math.max(vordergrund, hintergrund)
  const dunkel = Math.min(vordergrund, hintergrund)
  return (hell + 0.05) / (dunkel + 0.05)
}

function dokument(theme: 'dark' | 'light' | 'green') {
  const markup = renderToStaticMarkup(createElement(GastReiseLeseWarte))
  const css = STILE.map((datei) => readFileSync(datei, 'utf8')).join('\n')
    .replace(/<\/(style|script)/gi, '<\\/$1')
  const start = `localStorage.setItem(${JSON.stringify(WORKSPACE_THEME_KEY)}, ${JSON.stringify(theme)});`
  return `<!doctype html><html lang="de"><head><script>${start}${WORKSPACE_THEME_BOOT}</script><style>${css}
.text-brand-800{color:rgb(21,58,51)}
.text-ink-700{color:rgb(111,130,125)}
.bg-white\\/70{background-color:rgb(255,255,255)}
</style></head><body>
<div class="workspace-shell" data-workspace-theme="light">
<header class="workspace-header"><span class="workspace-default-title">Deine Reise</span></header>
<div class="workspace-page"><div class="workspace-content">${markup}</div>
<footer class="workspace-credit"><span>Jetnity</span></footer></div></div>
<script>
const proben=[];
window.__platzhalterProben=proben;
const deckend=(farbe)=>{const treffer=farbe&&farbe.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);if(!treffer)return null;const alpha=treffer[4]==null?1:Number(treffer[4]);return alpha>=0.99?farbe:null};
const grundVon=(el)=>{let knoten=el;while(knoten){const farbe=deckend(getComputedStyle(knoten).backgroundColor);if(farbe)return farbe;knoten=knoten.parentElement}return getComputedStyle(document.body).backgroundColor};
const nehmen=()=>{
  const shell=document.querySelector('.workspace-shell');
  const karten=[...document.querySelectorAll('[data-gast-lese-platzhalter]')];
  const ziele=[['shell',shell],['haupt',document.querySelector('.text-brand-800')],['neben',document.querySelector('.text-ink-700')],['kopf',document.querySelector('.workspace-default-title')],['credit',document.querySelector('.workspace-credit')]];
  proben.push({
    html:document.documentElement.getAttribute('data-workspace-theme'),
    shellAttr:shell?shell.getAttribute('data-workspace-theme'):null,
    shell:shell?getComputedStyle(shell).backgroundColor:null,
    platzhalter:karten.map((karte)=>getComputedStyle(karte).backgroundColor),
    texte:ziele.map(([name,el])=>el?{name,farbe:getComputedStyle(el).color,grund:grundVon(el)}:{name,farbe:null,grund:null})
  });
};
nehmen();
let rest=11;
const timer=setInterval(()=>{nehmen();if(--rest<=0)clearInterval(timer)},16);
</script>
</body></html>`
}

async function browserStarten(): Promise<Browser> {
  try {
    return await chromium.launch({ headless: true, timeout: 20_000, args: BROWSER_ARGS })
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler)
    if (!meldung.includes("Executable doesn't exist")) throw fehler
    return chromium.launch({ headless: true, channel: 'chrome', timeout: 20_000, args: BROWSER_ARGS })
  }
}

async function messen(page: Page, theme: 'dark' | 'light' | 'green'): Promise<Probe[]> {
  const html = dokument(theme)
  await page.route('**/*', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: html,
  }))
  await page.goto('http://127.0.0.1/gast-lese-platzhalter', { waitUntil: 'domcontentloaded', timeout: 8_000 })
  await page.waitForFunction(
    () => (window as unknown as { __platzhalterProben?: Probe[] }).__platzhalterProben?.length === 12,
    undefined,
    { timeout: 8_000, polling: 50 },
  )
  return page.evaluate(() => (window as unknown as { __platzhalterProben: Probe[] }).__platzhalterProben)
}

function textKontrast(probe: Probe, name: string): number {
  const text = probe.texte.find((eintrag) => eintrag.name === name)
  assert.ok(text, name)
  return kontrast(text.farbe, text.grund)
}

test('dunkle Ladeplatzhalter sind vor der Hydration dunkel, helle bleiben hell', { timeout: 45_000 }, async () => {
  const markup = renderToStaticMarkup(createElement(GastReiseLeseWarte))
  assert.equal(markup.match(/data-gast-lese-platzhalter/g)?.length, 2)
  assert.equal(markup.includes('bg-white/70'), false)
  const mint = readFileSync('styles/white-mint.css', 'utf8')
  assert.match(mint, /\.workspace-shell\[data-workspace-theme="light"\] \.workspace-content :where\(\.text-brand-600/)
  assert.match(mint, /\.workspace-shell\[data-workspace-theme="light"\] \.workspace-content :where\(\.text-ink-500/)

  const browser = await browserStarten()
  try {
    const dunkelSeite = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const dunkel = await messen(dunkelSeite, 'dark')
    await dunkelSeite.close()
    assert.equal(dunkel.length, 12)
    for (const probe of dunkel) {
      assert.equal(probe.html, 'dark')
      assert.equal(probe.shellAttr, 'light')
      assert.equal(probe.platzhalter.length, 2, JSON.stringify(probe))
      assert.ok((luminance(probe.shell) ?? 1) < 0.2, probe.shell ?? '')
      for (const farbe of probe.platzhalter) assert.ok((luminance(farbe) ?? 1) < 0.2, farbe)
      for (const name of ['shell', 'haupt', 'neben', 'kopf', 'credit']) {
        const wert = textKontrast(probe, name)
        assert.ok(wert >= 4.5, `${name} ${wert.toFixed(2)}:1 ${JSON.stringify(probe.texte)}`)
      }
    }

    const gruenSeite = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const gruen = await messen(gruenSeite, 'green')
    await gruenSeite.close()
    assert.equal(gruen.length, 12)
    for (const probe of gruen) {
      assert.equal(probe.html, 'dark')
      assert.equal(probe.shellAttr, 'light')
      assert.equal(probe.platzhalter.length, 2, JSON.stringify(probe))
      for (const farbe of probe.platzhalter) assert.ok((luminance(farbe) ?? 1) < 0.2, farbe)
      for (const name of ['shell', 'haupt', 'neben']) {
        const wert = textKontrast(probe, name)
        assert.ok(wert >= 4.5, `${name} ${wert.toFixed(2)}:1`)
      }
    }

    const hellSeite = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const hell = await messen(hellSeite, 'light')
    await hellSeite.close()
    assert.equal(hell.length, 12)
    const hellErste = hell[0]
    assert.ok(hellErste)
    assert.equal(hellErste.html, null)
    assert.equal(hellErste.shellAttr, 'light')
    const hellHaupt = hellErste.texte.find((eintrag) => eintrag.name === 'haupt')
    const hellNeben = hellErste.texte.find((eintrag) => eintrag.name === 'neben')
    assert.equal(hellHaupt?.farbe, 'rgb(27, 42, 38)')
    assert.equal(hellNeben?.farbe, 'rgb(74, 95, 87)')
    for (const probe of hell) {
      assert.equal(probe.platzhalter.length, 2, JSON.stringify(probe))
      for (const farbe of probe.platzhalter) assert.ok((luminance(farbe) ?? 0) > 0.7, farbe)
      for (const name of ['shell', 'haupt', 'neben', 'kopf', 'credit']) {
        const wert = textKontrast(probe, name)
        assert.ok(wert >= 4.5, `${name} ${wert.toFixed(2)}:1 ${JSON.stringify(probe.texte)}`)
      }
    }
  } finally {
    await Promise.race([
      browser.close(),
      new Promise((resolve) => setTimeout(resolve, 3_000)),
    ])
  }
})
