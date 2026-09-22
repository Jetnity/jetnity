#!/usr/bin/env node
// Synthetic SSR + Playwright viewport evidence for Admin indexing status 1.
// Not an authenticated /admin session and not a Production/device PASS.

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

import IndexingStatus from '../components/admin/system-health/IndexingStatus.tsx'
import { projiziereSeoStatus } from '../lib/admin/seo-status.ts'
import { KANONISCHE_PUBLIC_ORIGIN } from '../lib/seo/oeffentlicher-origin.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const EVIDENCE = join(ROOT, 'docs/evidence/admin-indexing-status-1')
const ARTIFACTS = '/opt/cursor/artifacts/admin-indexing-status-1'
const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '1440', width: 1440, height: 900 },
]

const longPreviewOrigin =
  'https://jetnity-app-git-feat-admin-indexing-status-1-jetnity-e1b93c82.vercel.app'

const faelle = {
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
  const from = join(ROOT, 'styles/globals.css')
  const input = readFileSync(from, 'utf8')
  const result = await postcss([nesting(), tailwindcss(), autoprefixer()]).process(input, { from })
  return {
    css: result.css,
    provenance: {
      source: 'styles/globals.css',
      config: 'tailwind.config.js',
      plugins: ['tailwindcss/nesting', 'tailwindcss', 'autoprefixer'],
      bytes: Buffer.byteLength(result.css),
    },
  }
}

function seite(name, markup, productCss) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Synthetic ${name}</title><style>${productCss}</style></head><body class="bg-background text-foreground"><p class="p-4 text-xs text-muted-foreground" data-synthetic-banner>SYNTHETIC RENDER — not authenticated Preview/Production. Case: ${name}. CSS: styles/globals.css compiled via postcss+tailwind+autoprefixer.</p><div class="mx-auto max-w-7xl p-4" data-indexing-shell>${markup}</div></body></html>`
}

async function messe(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('[data-indexing-shell]')
    const section = document.querySelector('[data-indexing-status]')
    const origins = [...document.querySelectorAll('.break-all')]
    const focusable = [
      ...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ].filter((el) => !el.closest('[data-synthetic-banner]'))
    const box = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { width: r.width, height: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom }
    }
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
      originBoxes: origins.map((el) => ({
        text: el.textContent,
        overflowing: el.scrollWidth > el.clientWidth + 1,
        box: box(el),
      })),
      focusableCount: focusable.length,
      controls: focusable.map((el) => el.tagName.toLowerCase()),
    }
  })
}

mkdirSync(join(EVIDENCE, 'html'), { recursive: true })
mkdirSync(join(EVIDENCE, 'screenshots'), { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

async function main() {
  const compiled = await compileProductCss()
  const manifest = {
    kind: 'synthetic-component-render',
    authenticatedPreview: 'BLOCKED_ACCESS',
    css: compiled.provenance,
    note: 'Dependency-injected fixtures rendered with compiled styles/globals.css. Not a real /admin session, not live crawler/Production evidence, not a device PASS.',
    cases: {},
  }
  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
  const fehler = []

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
    const html = seite(name, markup, compiled.css)
    writeFileSync(join(EVIDENCE, 'html', `${name}.html`), html)
    const shots = []
    const measurements = {}
    manifest.cases[name] = {
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
      await page.screenshot({ path: join(EVIDENCE, 'screenshots', dateiname), fullPage: true })
      await page.screenshot({ path: join(ARTIFACTS, dateiname), fullPage: true })
      shots.push(dateiname)
      const messung = await messe(page)
      measurements[viewport.name] = messung
      if (messung.overflow.document?.overflowing) {
        fehler.push(`${name}@${viewport.name}: Dokument-Overflow`)
      }
      if (messung.overflow.section?.overflowing) {
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
  const bericht = { ok: fehler.length === 0, fehler, viewports: VIEWPORTS.map((v) => v.name), cases: Object.keys(faelle) }
  writeFileSync(join(EVIDENCE, 'manifest.json'), `${JSON.stringify({ ...manifest, result: bericht }, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'manifest.json'), `${JSON.stringify({ ...manifest, result: bericht }, null, 2)}\n`)
  console.log(JSON.stringify(bericht, null, 2))
  if (fehler.length) process.exit(1)
}

void main()
