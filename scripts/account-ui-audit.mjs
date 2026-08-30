#!/usr/bin/env node
// scripts/account-ui-audit.mjs
//
// WebKit-/Chromium-Audit der Account-Shell. Fixtures nur im Harness.

import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { chromium, webkit } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3461'
const BASIS = `http://127.0.0.1:${PORT}`
const PFAD = '/ui-audit/account'
const BERICHT = process.env.AUDIT_REPORT || '/opt/cursor/artifacts/account_ui_audit.json'

const BREITEN = [
  { name: '280', width: 280, height: 760 },
  { name: '320', width: 320, height: 760 },
  { name: '360', width: 360, height: 780 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 860 },
  { name: '768', width: 768, height: 1024 },
  { name: '844x390', width: 844, height: 390 },
  { name: '1280', width: 1280, height: 800 },
]

const ZUSTAENDE = {
  reise: {
    nachweis: 'Reise fortsetzen',
    verboten: ['Verbindungen für diese Reise', 'Einreise', 'Safety', 'Saison'],
  },
  leer: {
    nachweis: 'Noch keine Reise in deinem Konto.',
    verboten: ['Reise fortsetzen'],
  },
  fehler: {
    nachweis: 'Deine Reisen konnten nicht geladen werden.',
    verboten: ['Noch keine Reise in deinem Konto.'],
  },
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
    detached: true,
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
    serverStoppen(kind)
    throw new Error(`Next.js startete nicht:\n${ausgabe.join('')}`)
  }
  return kind
}

function serverStoppen(kind) {
  if (!kind.pid) return
  try {
    process.kill(-kind.pid, 'SIGTERM')
  } catch {
    kind.kill('SIGTERM')
  }
}

async function messen(page) {
  return page.evaluate(() => {
    const fehler = []
    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      fehler.push(`horizontaler Overflow ${document.documentElement.scrollWidth}>${window.innerWidth}`)
    }
    const nav = document.querySelector('nav[aria-label="Konto"]')
    if (!nav) fehler.push('Account-Navigation fehlt')
    else {
      const links = [...nav.querySelectorAll('a')]
      const labels = links.map((link) => link.textContent.trim())
      if (JSON.stringify(labels) !== JSON.stringify(['Übersicht', 'Reisen', 'Reisende', 'Einstellungen'])) {
        fehler.push(`Nav-Reihenfolge ${labels.join(' → ')}`)
      }
      const tops = new Set(links.map((link) => Math.round(link.getBoundingClientRect().top)))
      if (tops.size > 1) {
        fehler.push(`Nav nicht einzeilig (tops ${[...tops].join(',')})`)
      }
      for (const link of links) {
        const box = link.getBoundingClientRect()
        if (box.height < 44 && window.innerWidth < 768) {
          fehler.push(`Nav-Trefferfläche zu klein (${Math.round(box.height)}px, ${link.textContent.trim()})`)
        }
      }
    }
    const text = document.body.innerText
    for (const verboten of ['Verbindungen für diese Reise', 'Die Hotelsuche', 'Readiness', 'Safety-Hinweis']) {
      if (text.includes(verboten)) fehler.push(`Workspace-Widget sichtbar: ${verboten}`)
    }
    return { ok: fehler.length === 0, fehler }
  })
}

async function pruefen(browserTyp, name) {
  const browser = await browserTyp.launch()
  const ergebnisse = []
  try {
    for (const viewport of BREITEN) {
      for (const [zustand, defin] of Object.entries(ZUSTAENDE)) {
        const page = await browser.newPage({ viewport })
        const antwort = await page.goto(`${BASIS}${PFAD}?zustand=${zustand}`, {
          waitUntil: 'networkidle',
          timeout: 60_000,
        })
        if (!antwort || antwort.status() >= 400) {
          ergebnisse.push({
            browser: name,
            viewport: viewport.name,
            zustand,
            ok: false,
            fehler: [`HTTP ${antwort?.status() ?? 'keine Antwort'}`],
          })
          await page.close()
          continue
        }
        await page.getByRole('navigation', { name: 'Konto' }).waitFor({ timeout: 15_000 })
        const nachweis = page.getByText(defin.nachweis)
        if ((await nachweis.count()) === 0) {
          ergebnisse.push({
            browser: name,
            viewport: viewport.name,
            zustand,
            ok: false,
            fehler: [`Nachweis fehlt: ${defin.nachweis}`],
          })
          await page.close()
          continue
        }
        const unerlaubt = []
        for (const verboten of defin.verboten) {
          if ((await page.getByText(verboten).count()) > 0) unerlaubt.push(verboten)
        }
        if (unerlaubt.length) {
          ergebnisse.push({
            browser: name,
            viewport: viewport.name,
            zustand,
            ok: false,
            fehler: unerlaubt.map((text) => `Unerlaubter Text: ${text}`),
          })
          await page.close()
          continue
        }
        const messung = await messen(page)
        ergebnisse.push({
          browser: name,
          viewport: viewport.name,
          zustand,
          ok: messung.ok,
          fehler: messung.fehler,
        })
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }
  return ergebnisse
}

const server = await serverStarten()
try {
  const ergebnisse = [
    ...(await pruefen(webkit, 'webkit')),
    ...(await pruefen(chromium, 'chromium')),
  ]
  const fehlgeschlagen = ergebnisse.filter((eintrag) => !eintrag.ok)
  writeFileSync(BERICHT, JSON.stringify({ ok: fehlgeschlagen.length === 0, ergebnisse }, null, 2))
  if (fehlgeschlagen.length) {
    console.error(JSON.stringify(fehlgeschlagen, null, 2))
    process.exit(1)
  }
  console.log(`Account-UI-Audit ${ergebnisse.length}/${ergebnisse.length} grün`)
} finally {
  serverStoppen(server)
}
