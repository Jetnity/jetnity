#!/usr/bin/env node
// scripts/admin-provider-ops-ui-audit.mjs
//
// WebKit-/Chromium-Audit der read-only Provider- & Kostenfläche.
// Fixtures nur auf /ui-audit/admin-provider-ops, nie im Produktspeicher.

import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { chromium, webkit } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3472'
const BASIS = `http://127.0.0.1:${PORT}`
const PFAD = '/ui-audit/admin-provider-ops'
const BERICHT = process.env.AUDIT_REPORT || '/opt/cursor/artifacts/admin_provider_ops_ui_audit.json'

const BREITEN = [
  { name: '320', width: 320, height: 760 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
]

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
    await page.goto(`${BASIS}${PFAD}`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Provider & Kosten Audit' }).waitFor({ timeout: 15_000 })

    for (const name of ['Provider-Ops', 'Kill-Switch-Vertrag', 'Cost Guard', 'Modellnutzung']) {
      if (!(await page.getByRole('heading', { name, exact: true }).count())) {
        fehler.push(`Name fehlt: ${name}`)
      }
    }

    const parent = page.locator('[data-ops-id="provider-ops"]')
    if ((await parent.getAttribute('data-ops-status')) !== 'foundation_only') {
      fehler.push('Provider-Ops-Parent ist nicht foundation_only')
    }
    if ((await parent.getAttribute('data-ops-green')) !== 'false') {
      fehler.push('Provider-Ops-Parent darf nicht grün sein')
    }
    if ((await parent.getAttribute('data-ops-claim'))?.includes('Verfügbar')) {
      fehler.push('Provider-Ops-Parent darf nicht Verfügbar claimen')
    }

    const kill = page.locator('[data-ops-id="kill-switch"]')
    if ((await kill.getAttribute('data-ops-status')) !== 'foundation_only') {
      fehler.push('Kill-Switch ist nicht foundation_only')
    }
    if ((await kill.getAttribute('data-ops-green')) !== 'false') {
      fehler.push('Kill-Switch darf nicht grün sein')
    }

    const guard = page.locator('[data-ops-id="cost-guard"]')
    if ((await guard.getAttribute('data-ops-status')) !== 'foundation_only') {
      fehler.push('Cost Guard ist nicht foundation_only')
    }
    if ((await guard.getAttribute('data-ops-green')) !== 'false') {
      fehler.push('Cost Guard darf nicht grün sein')
    }

    const usage = page.locator('[data-ops-id="model-usage"]')
    if ((await usage.getAttribute('data-ops-status')) !== 'empty') {
      fehler.push('Modellnutzung-Fixture ist nicht empty')
    }
    if ((await usage.getAttribute('data-ops-green')) !== 'false') {
      fehler.push('Leere Modellnutzung darf nicht grün sein')
    }

    const text = await page.locator('main').innerText()
    if (text.includes('0 CHF') || text.includes('Budget geschützt') || text.includes('Production bereit')) {
      fehler.push('Verbotener Fake-Cost/Ready-Text')
    }

    const details = page.locator('[data-ops-id="provider-ops"]').getByRole('button', { name: 'Details' })
    await details.scrollIntoViewIfNeeded()
    await details.click()
    await page.locator('[data-ops-id="provider-ops"] [data-ops-detail]').waitFor({ timeout: 8_000 })
    const detailText = await page.locator('[data-ops-id="provider-ops"] [data-ops-detail]').innerText()
    if (!detailText.includes('Beweist:')) fehler.push('Detailtext ohne Beweist')
    if (!detailText.includes('Beweist nicht:')) fehler.push('Detailtext ohne Beweist nicht')

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
  try {
    for (const [name, typ] of [
      ['webkit', webkit],
      ['chromium', chromium],
    ]) {
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
    writeFileSync('admin_provider_ops_ui_audit.json', JSON.stringify(bericht, null, 2))
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
