#!/usr/bin/env node
// scripts/admin-system-health-ui-audit.mjs
//
// WebKit-/Chromium-Audit der read-only System-Health-Fläche.
// Fixtures nur auf /ui-audit/admin-system-health, nie im Produktspeicher.

import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { chromium, webkit } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3471'
const BASIS = `http://127.0.0.1:${PORT}`
const PFAD = '/ui-audit/admin-system-health'
const BERICHT = process.env.AUDIT_REPORT || '/opt/cursor/artifacts/admin_system_health_ui_audit.json'

const BREITEN = [
  { name: '320', width: 320, height: 760 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
]

const NAMEN = ['App / Deployment', 'Vercel', 'Supabase', 'GitHub / CI', 'Infomaniak']
const STATUS_TEXTE = ['Gesund', 'Nicht konfiguriert', 'Nicht erreichbar', 'Unbekannt', 'veraltet']

function layoutPruefen() {
  const fehler = []
  const seite = document.documentElement
  if (seite.scrollWidth > seite.clientWidth + 1) {
    fehler.push(`Seiten-Overflow ${seite.scrollWidth}>${seite.clientWidth}`)
  }
  return { ok: fehler.length === 0, fehler }
}

async function serverStarten() {
  const kind = spawn('npm', ['run', 'dev', '--', '-p', PORT, '-H', '127.0.0.1'], {
    env: {
      ...process.env,
      JETNITY_UI_AUDIT: '1',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit',
      NEXT_PUBLIC_APP_URL: BASIS,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let bereit = false
  const ausgabe = []
  kind.stdout.on('data', (chunk) => {
    const text = String(chunk)
    ausgabe.push(text)
    if (text.includes('Ready') || text.includes('started')) bereit = true
  })
  kind.stderr.on('data', (chunk) => ausgabe.push(String(chunk)))
  const start = Date.now()
  while (!bereit && Date.now() - start < 90_000) {
    await new Promise((r) => setTimeout(r, 250))
  }
  if (!bereit) {
    kind.kill()
    throw new Error(`Next.js startete nicht:\n${ausgabe.join('')}`)
  }
  return kind
}

async function kombinierenPruefen(browser, engine, viewport) {
  const kontext = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.width <= 430,
  })
  const page = await kontext.newPage()
  const fehler = []
  try {
    await page.goto(`${BASIS}${PFAD}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'System Health Audit' }).waitFor({ timeout: 15_000 })

    for (const name of NAMEN) {
      if (!(await page.getByRole('heading', { name, exact: true }).count())) {
        fehler.push(`Name fehlt: ${name}`)
      }
    }
    const text = await page.locator('main').innerText()
    for (const status of STATUS_TEXTE) {
      if (!text.includes(status)) fehler.push(`Status-Text fehlt: ${status}`)
    }

    const infomaniak = page.locator('[data-health-id="infomaniak"]')
    if ((await infomaniak.getAttribute('data-health-green')) !== 'false') {
      fehler.push('Infomaniak-stale darf nicht grün sein')
    }
    if ((await infomaniak.getAttribute('data-health-freshness')) !== 'stale') {
      fehler.push('Infomaniak-Freshness ist nicht stale')
    }

    const supabase = page.locator('[data-health-id="supabase"]')
    if ((await supabase.getAttribute('data-health-status')) !== 'unavailable') {
      fehler.push('Supabase-Fixture ist nicht unavailable')
    }
    if ((await supabase.getAttribute('data-health-green')) !== 'false') {
      fehler.push('unavailable darf nicht grün sein')
    }

    await page.getByRole('button', { name: 'Details' }).first().click()
    await page.getByText('Beweist:', { exact: false }).first().waitFor({ timeout: 5_000 })

    const layout = await page.evaluate(layoutPruefen)
    fehler.push(...layout.fehler)
  } catch (error) {
    fehler.push(error instanceof Error ? error.message : String(error))
  } finally {
    await kontext.close()
  }
  return {
    ok: fehler.length === 0,
    engine,
    viewport: viewport.name,
    fehler,
  }
}

async function main() {
  const server = await serverStarten()
  const ergebnisse = []
  const engines = [
    ['webkit', webkit],
    ['chromium', chromium],
  ]
  try {
    for (const [name, typ] of engines) {
      const browser = await typ.launch({ headless: true })
      try {
        for (const viewport of BREITEN) {
          ergebnisse.push(await kombinierenPruefen(browser, name, viewport))
        }
      } finally {
        await browser.close()
      }
    }
  } finally {
    try {
      server.kill('SIGTERM')
    } catch {
      // Next kann sich vom Spawn lösen.
    }
  }

  const fehlgeschlagen = ergebnisse.filter((e) => !e.ok)
  const bericht = {
    kombinationen: ergebnisse.length,
    engines: ['webkit', 'chromium'],
    viewports: BREITEN.map((b) => b.name),
    fehlerzahl: fehlgeschlagen.length,
    fehlgeschlagen,
  }
  try {
    writeFileSync(BERICHT, JSON.stringify(bericht, null, 2))
  } catch {
    writeFileSync('admin_system_health_ui_audit.json', JSON.stringify(bericht, null, 2))
  }
  console.log(JSON.stringify(bericht, null, 2))
  try {
    server.kill('SIGTERM')
  } catch {
    // Der Bericht ist trotzdem fertig.
  }
  process.exit(fehlgeschlagen.length ? 1 : 0)
}

await main()
