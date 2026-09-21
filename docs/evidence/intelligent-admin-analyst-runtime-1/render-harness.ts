// Temporary synthetic render harness. Not a product route and not an auth bypass.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium, type Page } from 'playwright'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import nesting from 'tailwindcss/nesting'
import autoprefixer from 'autoprefixer'

import { AdminLagehinweiseAnsicht } from '@/components/admin/home/AdminLagehinweise'
import { leiteSystemHealthInsights } from '@/lib/admin/analyst/system-health-insights'
import {
  bewerteApp,
  bewerteSupabaseAppZugriff,
  githubNichtKonfiguriert,
  infomaniakNichtKonfiguriert,
  vercelNichtKonfiguriert,
  wendeEvidenceAlterAn,
} from '@/lib/admin/system-health/bewertung'
import type { AnalystBericht } from '@/lib/admin/analyst/typen'
import type { SystemHealthItem } from '@/lib/admin/system-health/typen'

const ROOT = dirname(fileURLToPath(import.meta.url))
const ARTIFACTS = '/opt/cursor/artifacts/intelligent-admin-analyst-runtime-1'
const JETZT = Date.parse('2026-09-21T12:00:00.000Z')
const VIEWPORTS = [
  { name: '320', width: 320, height: 760 },
  { name: '390', width: 390, height: 844 },
  { name: '1280', width: 1280, height: 800 },
] as const

function basisItems(nowMs: number, supabase: SystemHealthItem) {
  return [
    bewerteApp({ vercelEnv: 'preview', commitSha: 'syn', deploymentId: 'dpl_syn', region: 'fra1' }, nowMs),
    vercelNichtKonfiguriert(nowMs),
    supabase,
    githubNichtKonfiguriert(nowMs),
    infomaniakNichtKonfiguriert(nowMs),
  ]
}

function ausBericht(
  access: AnalystBericht['access'],
  nowMs: number,
  supabase: SystemHealthItem,
  checkedAt = new Date(nowMs).toISOString(),
): AnalystBericht {
  return leiteSystemHealthInsights({
    access,
    nowMs,
    bericht: { checkedAt, writeActions: [], items: basisItems(nowMs, supabase) },
  })
}

const coverageItemMs = JETZT - 30_000
const faelle: Record<string, AnalystBericht> = {
  attention: ausBericht(
    { status: 'allowed', grant: 'role' },
    JETZT,
    bewerteSupabaseAppZugriff({ configured: true, ping: { ok: false, message: 'synthetic' }, nowMs: JETZT }),
  ),
  coverage: ausBericht(
    { status: 'allowed', grant: 'role' },
    JETZT,
    wendeEvidenceAlterAn(
      {
        ...bewerteSupabaseAppZugriff({ configured: true, ping: { ok: true }, nowMs: coverageItemMs }),
        checkedAt: new Date(coverageItemMs).toISOString(),
      },
      JETZT,
    ),
  ),
  denied: leiteSystemHealthInsights({
    access: { status: 'denied', denial: 'forbidden' },
    nowMs: JETZT,
  }),
  stale: ausBericht(
    { status: 'allowed', grant: 'role' },
    JETZT,
    bewerteSupabaseAppZugriff({ configured: true, ping: { ok: true }, nowMs: JETZT - 90_000 }),
    new Date(JETZT - 90_000).toISOString(),
  ),
  'break-glass': ausBericht(
    { status: 'allowed', grant: 'break-glass' },
    JETZT,
    bewerteSupabaseAppZugriff({ configured: true, ping: { ok: true }, nowMs: JETZT }),
  ),
}

async function compileProductCss() {
  const from = join(process.cwd(), 'styles/globals.css')
  const input = readFileSync(from, 'utf8')
  const result = await postcss([nesting(), tailwindcss(), autoprefixer()]).process(input, { from })
  return {
    css: result.css,
    provenance: {
      source: 'styles/globals.css',
      config: 'tailwind.config.js',
      plugins: ['tailwindcss/nesting', 'tailwindcss', 'autoprefixer'] as const,
      bytes: Buffer.byteLength(result.css),
    },
  }
}

function seite(name: string, markup: string, productCss: string): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Synthetic ${name}</title><style>${productCss}</style></head><body><p class="p-4 text-xs text-muted-foreground" data-synthetic-banner>SYNTHETIC RENDER — not authenticated Preview/Production. Case: ${name}. CSS: styles/globals.css compiled via postcss+tailwind+autoprefixer.</p><div class="bg-card rounded-2xl border border-border p-5" data-analyst-shell>${markup}</div></body></html>`
}

async function messe(page: Page) {
  return page.evaluate(`(() => {
    const shell = document.querySelector('[data-analyst-shell]')
    const section = document.querySelector('section')
    const cards = [...document.querySelectorAll('[data-analyst-id]')]
    const focusable = [...document.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')]
    const box = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { width: r.width, height: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom }
    }
    const shellBox = box(shell)
    const cardBoxes = cards.map((el) => box(el))
    return {
      overflow: {
        document: {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          overflowing: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        },
        shell: shell
          ? {
              scrollWidth: shell.scrollWidth,
              clientWidth: shell.clientWidth,
              overflowing: shell.scrollWidth > shell.clientWidth + 1,
            }
          : null,
        section: section
          ? {
              scrollWidth: section.scrollWidth,
              clientWidth: section.clientWidth,
              overflowing: section.scrollWidth > section.clientWidth + 1,
            }
          : null,
        cardsBeyondShell: shellBox
          ? cardBoxes.filter((card) => card != null && card.right > shellBox.right + 1).length
          : null,
      },
      focus: {
        focusableCount: focusable.length,
        first: focusable[0]
          ? focusable[0].tagName.toLowerCase() + ':' + (focusable[0].getAttribute('href') || '')
          : null,
      },
    }
  })()`)
}

mkdirSync(join(ROOT, 'html'), { recursive: true })
mkdirSync(join(ROOT, 'screenshots'), { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

async function main() {
  const compiled = await compileProductCss()
  const manifest: Record<string, unknown> = {
    kind: 'synthetic-component-render',
    authenticatedPreview: 'BLOCKED_ACCESS',
    css: compiled.provenance,
    note: 'Dependency-injected fixtures rendered with compiled styles/globals.css. Not a real /admin session.',
    cases: {},
  }
  const cases = manifest.cases as Record<string, unknown>
  const browser = await chromium.launch({ channel: 'chrome' })
  for (const [name, daten] of Object.entries(faelle)) {
    const markup = renderToStaticMarkup(createElement(AdminLagehinweiseAnsicht, { bericht: daten }))
    const html = seite(name, markup, compiled.css)
    writeFileSync(join(ROOT, 'html', `${name}.html`), html)
    const shots: string[] = []
    const measurements: Record<string, unknown> = {}
    cases[name] = {
      insights: daten.insights.map((insight) => ({
        id: insight.id,
        observed: insight.observed,
        freshness: insight.freshness.state,
        materiality: insight.materiality,
        attribution: insight.attribution,
        checkedAt: insight.checkedAt,
        ageMs: insight.freshness.ageMs,
        next: insight.next,
      })),
      sourceCheckedAt: daten.sourceCheckedAt,
      observationScope: daten.observationScope,
      access: daten.access,
      coverage: daten.coverage,
      screenshots: shots,
      measurements,
    }
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
      await page.setContent(html, { waitUntil: 'load' })
      const dateiname = `${name}_${viewport.name}.png`
      await page.screenshot({ path: join(ROOT, 'screenshots', dateiname), fullPage: true })
      await page.screenshot({ path: join(ARTIFACTS, dateiname), fullPage: true })
      shots.push(dateiname)
      measurements[viewport.name] = await messe(page)
      await page.close()
    }
  }
  await browser.close()

  writeFileSync(join(ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(
    JSON.stringify(
      {
        ok: true,
        cases: Object.keys(faelle),
        viewports: VIEWPORTS.map((v) => v.name),
        css: compiled.provenance,
      },
      null,
      2,
    ),
  )
}

void main()
