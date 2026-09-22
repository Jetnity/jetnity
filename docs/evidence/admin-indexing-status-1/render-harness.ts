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

import IndexingStatus from '@/components/admin/system-health/IndexingStatus'
import { projiziereSeoStatus } from '@/lib/admin/seo-status'
import { KANONISCHE_PUBLIC_ORIGIN, type OriginUmgebung } from '@/lib/seo/oeffentlicher-origin'

const ROOT = dirname(fileURLToPath(import.meta.url))
const ARTIFACTS = '/opt/cursor/artifacts/admin-indexing-status-1'
const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '1440', width: 1440, height: 900 },
] as const

const longPreviewOrigin =
  'https://jetnity-app-git-feat-admin-indexing-status-1-jetnity-e1b93c82.vercel.app'

const faelle: Record<string, OriginUmgebung> = {
  'deny-preview': {
    NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
    VERCEL_ENV: 'preview',
    NEXT_PUBLIC_ALLOW_INDEXING: 'true',
  },
  'allow-canonical': {
    NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
    VERCEL_ENV: 'production',
    NEXT_PUBLIC_ALLOW_INDEXING: 'true',
  },
  'deny-long-origin': {
    NEXT_PUBLIC_SITE_URL: longPreviewOrigin,
    VERCEL_ENV: 'preview',
  },
  'deny-conflict': {
    NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
    NEXT_PUBLIC_APP_URL: 'https://alt.example',
    VERCEL_ENV: 'production',
    NEXT_PUBLIC_ALLOW_INDEXING: 'true',
  },
}

const verboteneRohwerte = [
  'indexer:supersecret',
  'token=abc123',
  'PASSWORD-xyz',
  '<script>alert(1)</script>',
  'DATABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]

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
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Synthetic ${name}</title><style>${productCss}</style></head><body class="bg-background text-foreground"><p class="p-4 text-xs text-muted-foreground" data-synthetic-banner>SYNTHETIC RENDER — not authenticated Preview/Production. Case: ${name}. CSS: styles/globals.css compiled via postcss+tailwind+autoprefixer.</p><div class="mx-auto max-w-7xl p-4" data-indexing-shell>${markup}</div></body></html>`
}

async function messe(page: Page) {
  return page.evaluate(`(() => {
    const shell = document.querySelector('[data-indexing-shell]')
    const section = document.querySelector('[data-indexing-status]')
    const origins = [...document.querySelectorAll('.break-all')]
    const focusable = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.closest('[data-synthetic-banner]'))
    const overflowing = (el) =>
      el ? { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflowing: el.scrollWidth > el.clientWidth + 1 } : null
    return {
      decision: section?.getAttribute('data-indexing-decision') ?? null,
      sitemapCount: section?.getAttribute('data-indexing-sitemap-count') ?? null,
      healthGreen: section?.getAttribute('data-indexing-health-green') ?? null,
      overflow: {
        document: overflowing(document.documentElement),
        shell: overflowing(shell),
        section: overflowing(section),
      },
      originOverflowing: origins.filter((el) => el.scrollWidth > el.clientWidth + 1).length,
      focusableCount: focusable.length,
      controls: focusable.map((el) => el.tagName.toLowerCase()),
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
    note: 'Dependency-injected fixtures rendered with compiled styles/globals.css. Not a real /admin session, not live crawler/Production evidence, not a device PASS.',
    cases: {},
  }
  const cases = manifest.cases as Record<string, unknown>
  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
  const fehler: string[] = []

  for (const [name, env] of Object.entries(faelle)) {
    const stand = projiziereSeoStatus(env)
    const markup = renderToStaticMarkup(createElement(IndexingStatus, { stand }))
    for (const roh of verboteneRohwerte) {
      if (markup.includes(roh) || JSON.stringify(stand).includes(roh)) {
        fehler.push(`${name}: Rohwert in Projektion/HTML: ${roh}`)
      }
    }
    if (/<a |<button|<form|<input/.test(markup)) {
      fehler.push(`${name}: Aktivierungs- oder Link-Kontrolle im Markup`)
    }
    if (/beabsichtigt|kein Ausfall|keine operative Störung/.test(markup)) {
      fehler.push(`${name}: Deny-Text unterstellt Absicht oder fehlende Störung`)
    }
    if (stand.entscheidung === 'deny' && !markup.includes('sperrt die Indexierung')) {
      fehler.push(`${name}: neutraler Deny-Hinweis fehlt`)
    }
    if (markup.includes('alt.example')) {
      fehler.push(`${name}: widersprüchliche App-Origin geleakt`)
    }
    const html = seite(name, markup, compiled.css)
    writeFileSync(join(ROOT, 'html', `${name}.html`), html)
    const shots: string[] = []
    const measurements: Record<string, unknown> = {}
    cases[name] = {
      entscheidung: stand.entscheidung,
      originQuelle: stand.originQuelle,
      technischeOrigin: stand.technischeOrigin,
      sitemapAnzahl: stand.sitemapAnzahl,
      screenshots: shots,
      measurements,
    }

    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      })
      await page.setContent(html, { waitUntil: 'load' })
      const dateiname = `${name}_${viewport.name}.png`
      await page.screenshot({ path: join(ROOT, 'screenshots', dateiname), fullPage: true })
      await page.screenshot({ path: join(ARTIFACTS, dateiname), fullPage: true })
      shots.push(dateiname)
      const messung = (await messe(page)) as {
        overflow?: { document?: { overflowing?: boolean }; section?: { overflowing?: boolean } }
        focusableCount?: number
        controls?: string[]
        healthGreen?: string
      }
      measurements[viewport.name] = messung
      if (messung.overflow?.document?.overflowing) {
        fehler.push(`${name}@${viewport.name}: Dokument-Overflow`)
      }
      if (messung.overflow?.section?.overflowing) {
        fehler.push(`${name}@${viewport.name}: Sektions-Overflow`)
      }
      if (messung.focusableCount !== 0) {
        fehler.push(`${name}@${viewport.name}: unerwartete Fokusziele ${JSON.stringify(messung.controls)}`)
      }
      if (messung.healthGreen !== 'false') {
        fehler.push(`${name}@${viewport.name}: health-green nicht false`)
      }
      await page.close()
    }
  }

  await browser.close()
  const bericht = {
    ok: fehler.length === 0,
    fehler,
    viewports: VIEWPORTS.map((v) => v.name),
    cases: Object.keys(faelle),
  }
  writeFileSync(join(ROOT, 'manifest.json'), `${JSON.stringify({ ...manifest, result: bericht }, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'manifest.json'), `${JSON.stringify({ ...manifest, result: bericht }, null, 2)}\n`)
  console.log(JSON.stringify(bericht, null, 2))
  if (fehler.length) process.exit(1)
}

void main()
