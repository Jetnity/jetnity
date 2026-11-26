import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import type { AddressInfo } from 'node:net'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'

import { GastReiseLeseWarte } from '@/components/trips/GastReiseLesefehler'
import { WORKSPACE_THEME_BOOT, WORKSPACE_THEME_KEY } from '@/lib/ui/workspace-theme-boot'

type Probe = { html: string | null; shell: string | null; platzhalter: string[] }

function luminance(color: string | null): number | null {
  const match = color?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  const channels = [match[1], match[2], match[3]].map((part) => {
    const value = Number(part) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

function dokument(theme: 'dark' | 'light' | 'green' | 'missing') {
  const markup = renderToStaticMarkup(createElement(GastReiseLeseWarte))
  const css = readFileSync('components/workspace/workspace-surfaces.css', 'utf8')
  const start = theme === 'missing' ? '' : `localStorage.setItem(${JSON.stringify(WORKSPACE_THEME_KEY)}, ${JSON.stringify(theme)});`
  return `<!doctype html><html lang="de"><head><script>${start}${WORKSPACE_THEME_BOOT}</script><style>${css}
.bg-white\\/70{background-color:rgb(255,255,255)}
</style></head><body>
<div class="workspace-shell"><div class="workspace-content">${markup}</div></div>
<script>const proben=[];window.__platzhalterProben=proben;const nehmen=()=>{const shell=document.querySelector('.workspace-shell');const karten=[...document.querySelectorAll('[data-gast-lese-platzhalter]')];proben.push({html:document.documentElement.getAttribute('data-workspace-theme'),shell:shell?getComputedStyle(shell).backgroundColor:null,platzhalter:karten.map(karte=>getComputedStyle(karte).backgroundColor)});if(proben.length<12)requestAnimationFrame(nehmen)};requestAnimationFrame(nehmen);</script>
</body></html>`
}

async function messen(theme: 'dark' | 'light' | 'green' | 'missing') {
  const server: Server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(dokument(theme))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(origin, { waitUntil: 'load' })
    await page.waitForFunction(() => (window as unknown as { __platzhalterProben?: Probe[] }).__platzhalterProben?.length === 12)
    return await page.evaluate(() => (window as unknown as { __platzhalterProben: Probe[] }).__platzhalterProben)
  } finally {
    await browser.close()
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

test('dunkle Ladeplatzhalter sind vor der Hydration dunkel, helle bleiben hell', async () => {
  const markup = renderToStaticMarkup(createElement(GastReiseLeseWarte))
  assert.equal(markup.match(/data-gast-lese-platzhalter/g)?.length, 2)
  assert.equal(markup.includes('bg-white/70'), false)

  const dunkel = await messen('dark')
  assert.equal(dunkel.length, 12)
  for (const probe of dunkel) {
    assert.equal(probe.html, 'dark')
    assert.equal(probe.platzhalter.length, 2, JSON.stringify(probe))
    assert.ok((luminance(probe.shell) ?? 1) < 0.2, probe.shell ?? '')
    for (const farbe of probe.platzhalter) assert.ok((luminance(farbe) ?? 1) < 0.2, farbe)
  }

  const gruen = await messen('green')
  assert.equal(gruen[0]?.html, 'dark')
  assert.equal(gruen[0]?.platzhalter.length, 2)
  for (const farbe of gruen[0]?.platzhalter ?? []) assert.ok((luminance(farbe) ?? 1) < 0.2, farbe)

  const hell = await messen('light')
  assert.equal(hell[0]?.html, null)
  assert.equal(hell[0]?.platzhalter.length, 2)
  for (const farbe of hell[0]?.platzhalter ?? []) assert.ok((luminance(farbe) ?? 0) > 0.7, farbe)
})
