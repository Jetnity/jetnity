import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium, type Browser, type Page } from 'playwright'

import { GastReiseLeseWarte } from '@/components/trips/GastReiseLesefehler'
import { WORKSPACE_THEME_BOOT, WORKSPACE_THEME_KEY } from '@/lib/ui/workspace-theme-boot'

type Probe = { html: string | null; shell: string | null; platzhalter: string[] }

const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage']

function luminance(color: string | null): number | null {
  const match = color?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  const channels = [match[1], match[2], match[3]].map((part) => {
    const value = Number(part) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

function dokument(theme: 'dark' | 'light' | 'green') {
  const markup = renderToStaticMarkup(createElement(GastReiseLeseWarte))
  const css = readFileSync('components/workspace/workspace-surfaces.css', 'utf8')
  const start = `localStorage.setItem(${JSON.stringify(WORKSPACE_THEME_KEY)}, ${JSON.stringify(theme)});`
  return `<!doctype html><html lang="de"><head><script>${start}${WORKSPACE_THEME_BOOT}</script><style>${css}
.bg-white\\/70{background-color:rgb(255,255,255)}
</style></head><body>
<div class="workspace-shell"><div class="workspace-content">${markup}</div></div>
<script>
const proben=[];
window.__platzhalterProben=proben;
const nehmen=()=>{
  const shell=document.querySelector('.workspace-shell');
  const karten=[...document.querySelectorAll('[data-gast-lese-platzhalter]')];
  proben.push({
    html:document.documentElement.getAttribute('data-workspace-theme'),
    shell:shell?getComputedStyle(shell).backgroundColor:null,
    platzhalter:karten.map((karte)=>getComputedStyle(karte).backgroundColor)
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

test('dunkle Ladeplatzhalter sind vor der Hydration dunkel, helle bleiben hell', { timeout: 45_000 }, async () => {
  const markup = renderToStaticMarkup(createElement(GastReiseLeseWarte))
  assert.equal(markup.match(/data-gast-lese-platzhalter/g)?.length, 2)
  assert.equal(markup.includes('bg-white/70'), false)

  const browser = await browserStarten()
  try {
    const dunkelSeite = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const dunkel = await messen(dunkelSeite, 'dark')
    await dunkelSeite.close()
    assert.equal(dunkel.length, 12)
    for (const probe of dunkel) {
      assert.equal(probe.html, 'dark')
      assert.equal(probe.platzhalter.length, 2, JSON.stringify(probe))
      assert.ok((luminance(probe.shell) ?? 1) < 0.2, probe.shell ?? '')
      for (const farbe of probe.platzhalter) assert.ok((luminance(farbe) ?? 1) < 0.2, farbe)
    }

    const gruenSeite = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const gruen = await messen(gruenSeite, 'green')
    await gruenSeite.close()
    assert.equal(gruen.length, 12)
    for (const probe of gruen) {
      assert.equal(probe.html, 'dark')
      assert.equal(probe.platzhalter.length, 2, JSON.stringify(probe))
      for (const farbe of probe.platzhalter) assert.ok((luminance(farbe) ?? 1) < 0.2, farbe)
    }

    const hellSeite = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const hell = await messen(hellSeite, 'light')
    await hellSeite.close()
    assert.equal(hell.length, 12)
    for (const probe of hell) {
      assert.equal(probe.html, null)
      assert.equal(probe.platzhalter.length, 2, JSON.stringify(probe))
      for (const farbe of probe.platzhalter) assert.ok((luminance(farbe) ?? 0) > 0.7, farbe)
    }
  } finally {
    await Promise.race([
      browser.close(),
      new Promise((resolve) => setTimeout(resolve, 3_000)),
    ])
  }
})
