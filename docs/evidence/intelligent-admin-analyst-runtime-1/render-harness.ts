// Temporary synthetic render harness. Not a product route and not an auth bypass.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'

import { AdminLagehinweiseAnsicht } from '@/components/admin/home/AdminLagehinweise'
import { leiteSystemHealthInsights } from '@/lib/admin/analyst/system-health-insights'
import {
  bewerteApp,
  bewerteSupabaseAppZugriff,
  githubNichtKonfiguriert,
  infomaniakNichtKonfiguriert,
  vercelNichtKonfiguriert,
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

const faelle: Record<string, AnalystBericht> = {
  attention: ausBericht(
    { status: 'allowed', grant: 'role' },
    JETZT,
    bewerteSupabaseAppZugriff({ configured: true, ping: { ok: false, message: 'synthetic' }, nowMs: JETZT }),
  ),
  coverage: ausBericht(
    { status: 'allowed', grant: 'role' },
    JETZT,
    bewerteSupabaseAppZugriff({ configured: true, ping: { ok: true }, nowMs: JETZT }),
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

const css = `
html, body { margin: 0; background: #0f302a; color: #0f302a; font-family: ui-sans-serif, system-ui, sans-serif; }
.bg-card, .shell { background: #fff; }
.bg-background { background: #fbfcf9; }
.text-muted-foreground { color: #50605b; }
.text-foreground { color: #0f302a; }
.border-border { border-color: #d5e2db; }
.rounded-xl { border-radius: 0.75rem; }
.border { border-width: 1px; border-style: solid; }
.p-4 { padding: 1rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.grid { display: grid; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.items-start { align-items: flex-start; }
.justify-between { justify-content: space-between; }
.min-w-0 { min-width: 0; }
.w-full { width: 100%; }
.max-w-full { max-width: 100%; }
.text-lg { font-size: 1.125rem; }
.text-sm { font-size: 0.875rem; line-height: 1.35; }
.text-xs { font-size: 0.75rem; line-height: 1.35; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.underline { text-decoration: underline; }
.underline-offset-4 { text-underline-offset: 4px; }
.inline-block { display: inline-block; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.border-rose-400\\/30 { border-color: rgb(251 113 133 / 0.3); }
.bg-rose-400\\/10 { background: rgb(251 113 133 / 0.1); }
.text-rose-800 { color: #9f1239; }
.border-amber-400\\/30 { border-color: rgb(251 191 36 / 0.3); }
.bg-amber-400\\/10 { background: rgb(251 191 36 / 0.1); }
.text-amber-800 { color: #92400e; }
.bg-muted { background: #edf8f3; }
.shell { margin: 12px; border: 1px solid #d5e2db; border-radius: 1rem; padding: 1.25rem; }
.banner { margin: 12px 12px 0; color: #e8fa91; font: 12px/1.4 ui-sans-serif, system-ui; }
ul { list-style: none; padding: 0; margin: 0; }
h2, h3, p { margin: 0; }
a { color: #17604f; }
`

function seite(name: string, markup: string): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Synthetic ${name}</title><style>${css}</style></head><body><p class="banner">SYNTHETIC RENDER — not authenticated Preview/Production. Case: ${name}</p><div class="shell">${markup}</div></body></html>`
}

mkdirSync(join(ROOT, 'html'), { recursive: true })
mkdirSync(join(ROOT, 'screenshots'), { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

const manifest: Record<string, unknown> = {
  kind: 'synthetic-component-render',
  authenticatedPreview: 'BLOCKED_ACCESS',
  note: 'Dependency-injected fixtures rendered locally. Not a real /admin session.',
  cases: {},
}

async function main() {
  const cases = manifest.cases as Record<string, unknown>
  const browser = await chromium.launch({ channel: 'chrome' })
  for (const [name, daten] of Object.entries(faelle)) {
    const markup = renderToStaticMarkup(createElement(AdminLagehinweiseAnsicht, { bericht: daten }))
    const html = seite(name, markup)
    writeFileSync(join(ROOT, 'html', `${name}.html`), html)
    const shots: string[] = []
    cases[name] = {
      insights: daten.insights.map((insight) => ({
        id: insight.id,
        observed: insight.observed,
        freshness: insight.freshness.state,
        materiality: insight.materiality,
        attribution: insight.attribution,
        next: insight.next,
      })),
      observationScope: daten.observationScope,
      access: daten.access,
      coverage: daten.coverage,
      screenshots: shots,
    }
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
      await page.setContent(html, { waitUntil: 'load' })
      const dateiname = `${name}_${viewport.name}.png`
      await page.screenshot({ path: join(ROOT, 'screenshots', dateiname), fullPage: true })
      await page.screenshot({ path: join(ARTIFACTS, dateiname), fullPage: true })
      shots.push(dateiname)
      await page.close()
    }
  }
  await browser.close()

  writeFileSync(join(ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(JSON.stringify({ ok: true, cases: Object.keys(faelle), viewports: VIEWPORTS.map((v) => v.name) }, null, 2))
}

void main()
