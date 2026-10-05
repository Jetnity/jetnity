// Tab-sequence keyboard evidence only. Does not recapture historical viewport shots.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import nesting from 'tailwindcss/nesting'
import autoprefixer from 'autoprefixer'

import { AdminModellnutzungHinweisAnsicht } from '@/components/admin/home/AdminModellnutzungHinweis'
import { leiteModelUsageInsights } from '@/lib/admin/analyst/model-usage-insights'
import type { ProviderOpsBoardItem } from '@/lib/admin/provider-ops-board/typen'

const ROOT = dirname(fileURLToPath(import.meta.url))
const ARTIFACTS = '/opt/cursor/artifacts/intelligent-admin-model-usage-attention-1'
const JETZT = Date.parse('2026-09-22T12:00:00.000Z')

const item: ProviderOpsBoardItem = {
  id: 'model-usage',
  name: 'Modellnutzung',
  status: 'unavailable',
  source: 'public.model_usage',
  checkedAt: new Date(JETZT).toISOString(),
  freshness: { state: 'fresh', ageMs: 0, ttlMs: 120_000 },
  summary: 'SYNTHETIC',
  proves: 'test',
  doesNotProve: 'test',
}

async function main() {
  const from = join(process.cwd(), 'styles/globals.css')
  const compiled = await postcss([nesting(), tailwindcss(), autoprefixer()]).process(readFileSync(from, 'utf8'), {
    from,
  })
  const bericht = leiteModelUsageInsights({
    access: { status: 'allowed', grant: 'role' },
    nowMs: JETZT,
    board: { checkedAt: new Date(JETZT).toISOString(), writeActions: [], items: [item] },
  })
  const markup = renderToStaticMarkup(createElement(AdminModellnutzungHinweisAnsicht, { bericht }))
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tab keyboard</title><style>${compiled.css}</style></head><body><p class="p-4 text-xs text-muted-foreground">SYNTHETIC RENDER — Tab sequence, not authenticated Preview. CSS: styles/globals.css compiled.</p><div class="bg-card rounded-2xl border border-border p-5" data-model-usage-shell>${markup}</div></body></html>`
  mkdirSync(join(ROOT, 'screenshots'), { recursive: true })
  mkdirSync(ARTIFACTS, { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.setContent(html, { waitUntil: 'load' })
  let tabs = 0
  let focusedHref: string | null = null
  let outline: string | null = null
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab')
    tabs += 1
    const state = await page.evaluate(`(() => {
      const el = document.activeElement
      if (!el) return { href: null, outline: null, tag: null }
      const style = getComputedStyle(el)
      return {
        href: el.getAttribute && el.getAttribute('href'),
        tag: el.tagName,
        outline: [style.outlineStyle, style.outlineWidth, style.outlineColor].join(' '),
      }
    })()`)
    if (state.href === '/admin/provider-ops') {
      focusedHref = state.href
      outline = state.outline
      break
    }
  }
  if (focusedHref !== '/admin/provider-ops') {
    throw new Error('Tab sequence did not reach /admin/provider-ops')
  }
  const dateiname = 'unavailable_1280_tab_focus.png'
  await page.screenshot({ path: join(ROOT, 'screenshots', dateiname), fullPage: true })
  await page.screenshot({ path: join(ARTIFACTS, dateiname), fullPage: true })
  await browser.close()
  const receipt = {
    kind: 'synthetic-tab-sequence',
    authenticatedPreview: 'BLOCKED_ACCESS',
    note: 'Real Tab key presses until the investigate link is document.activeElement. Distinct from historical programmatic link.focus() shot unavailable_1280_focus.png.',
    tabs,
    focusedHref,
    outline,
    screenshot: dateiname,
    cssBytes: Buffer.byteLength(compiled.css),
  }
  writeFileSync(join(ROOT, 'keyboard-tab.json'), `${JSON.stringify(receipt, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'keyboard-tab.json'), `${JSON.stringify(receipt, null, 2)}\n`)
  console.log(JSON.stringify(receipt, null, 2))
}

void main()
