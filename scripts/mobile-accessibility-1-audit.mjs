#!/usr/bin/env node
// scripts/mobile-accessibility-1-audit.mjs
//
// Browser-Viewport/Emulation-Evidence für Mobile Accessibility 1.
// Kein physisches Real-Device-Testing.

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { chromium } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3471'
const BASIS = `http://127.0.0.1:${PORT}`
const BERICHT =
  process.env.AUDIT_REPORT || '/workspace/docs/evidence/MOBILE_ACCESSIBILITY_1_AUDIT_2026-09-02.json'

const BREITEN = [
  { name: '320', width: 320, height: 760 },
  { name: '360', width: 360, height: 780 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 900 },
]

const PFAD = ['/', '/planen', '/reisen']

const AUDIT_REISE = {
  reise: {
    id: 'trip-a11y-1',
    title: 'Bali mit sehr langem Reisetitel für Reflow',
    destination: 'Bali',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    days: [
      {
        id: 'day-1',
        dayDate: '2026-09-12',
        position: 1,
        stageId: 'stage-1',
        items: [],
      },
    ],
    stages: [
      {
        id: 'stage-1',
        position: 1,
        name: 'Bali',
        countryCode: 'ID',
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-16',
        placeId: 'geonames:1650535',
      },
    ],
    ohneTag: [],
  },
  quelle: 'guest',
  mitSuche: false,
  mitAenderung: true,
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

async function overflowPruefen(page) {
  return page.evaluate(() => {
    const html = document.documentElement
    const body = document.body
    return {
      htmlOverflow: html.scrollWidth - html.clientWidth,
      bodyOverflow: body.scrollWidth - body.clientWidth,
    }
  })
}

async function seiteOffen(page, pfad) {
  const antwort = await page.goto(`${BASIS}${pfad}`, { waitUntil: 'networkidle', timeout: 60_000 })
  return antwort?.ok() ?? false
}

async function reflowPruefen(browser, viewport, pfad) {
  const kontext = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.width < 1024,
  })
  const page = await kontext.newPage()
  const fehler = []
  const okSeite = await seiteOffen(page, pfad)
  if (!okSeite) fehler.push(`${pfad} antwortete nicht`)
  await page.waitForTimeout(300)
  const overflow = await overflowPruefen(page)
  if (overflow.htmlOverflow > 1) fehler.push(`html overflow ${overflow.htmlOverflow}px`)
  if (overflow.bodyOverflow > 1) fehler.push(`body overflow ${overflow.bodyOverflow}px`)

  if (viewport.width < 768 && pfad === '/') {
    const menue = page.getByRole('button', { name: 'Menü öffnen' })
    if ((await menue.count()) === 0) {
      fehler.push('Mobile-Menüknopf fehlt')
    } else {
      const box = await menue.boundingBox()
      if (!box || box.height < 44 || box.width < 44) {
        fehler.push(`Menüknopf kleiner als 44px: ${JSON.stringify(box)}`)
      }
    }
  }

  await kontext.close()
  return {
    ok: fehler.length === 0,
    art: 'reflow',
    viewport: viewport.name,
    pfad,
    overflow,
    fehler,
  }
}

async function tastaturPruefen(browser) {
  const kontext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  })
  const page = await kontext.newPage()
  const fehler = []
  await seiteOffen(page, '/')
  await page.waitForTimeout(400)

  await page.keyboard.press('Tab')
  const skip = await page.evaluate(() => {
    const el = document.activeElement
    return {
      text: el?.textContent?.trim() ?? '',
      href: el instanceof HTMLAnchorElement ? el.getAttribute('href') : null,
    }
  })
  if (skip.href !== '#public-content' && skip.text !== 'Zum Inhalt') {
    fehler.push(`Skip-Link nicht erstes Ziel: ${JSON.stringify(skip)}`)
  } else {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
    const fokus = await page.evaluate(() => document.activeElement?.id ?? '')
    if (fokus !== 'public-content') {
      fehler.push(`Skip-Link fokussierte nicht public-content, sondern ${fokus || '(leer)'}`)
    }
  }

  const menue = page.getByRole('button', { name: 'Menü öffnen' })
  await menue.click()
  const expanded = await menue.getAttribute('aria-expanded')
  const controls = await menue.getAttribute('aria-controls')
  if (expanded !== 'true') fehler.push('aria-expanded nach Öffnen nicht true')
  if (controls !== 'oeffentliche-mobile-navigation') {
    fehler.push(`aria-controls fehlt oder falsch: ${controls}`)
  }
  const nav = page.locator('#oeffentliche-mobile-navigation')
  if (!(await nav.isVisible())) fehler.push('Mobile Navigation nach Öffnen nicht sichtbar')

  const planen = page.getByRole('link', { name: 'Reise planen' }).last()
  const planenBox = await planen.boundingBox()
  if (!planenBox || planenBox.height < 44) {
    fehler.push(`Mobile CTA kleiner als 44px: ${JSON.stringify(planenBox)}`)
  }

  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  const nachEscape = await page.evaluate(() => {
    const knopf = document.activeElement
    const navEl = document.getElementById('oeffentliche-mobile-navigation')
    return {
      label: knopf?.getAttribute('aria-label') ?? '',
      expanded: knopf?.getAttribute('aria-expanded') ?? '',
      navHidden: navEl?.hasAttribute('hidden') ?? false,
    }
  })
  if (nachEscape.label !== 'Menü öffnen') {
    fehler.push(`Escape gab Fokus nicht an den Menüknopf: ${JSON.stringify(nachEscape)}`)
  }
  if (nachEscape.expanded !== 'false' || !nachEscape.navHidden) {
    fehler.push(`Escape schloss das Menü nicht: ${JSON.stringify(nachEscape)}`)
  }

  const combo = page.getByRole('combobox', { name: 'Wohin möchtest du reisen?' })
  if ((await combo.count()) === 0) fehler.push('Hero-Ortssuche ohne combobox')

  await page.evaluate(() => window.scrollTo(0, 800))
  await page.waitForTimeout(200)
  const nachOben = page.getByRole('button', { name: 'Nach oben' })
  if ((await nachOben.count()) === 0) {
    fehler.push('Nach-oben-Knopf nach Scroll nicht da')
  } else {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await nachOben.click()
    await page.waitForTimeout(50)
    const y = await page.evaluate(() => window.scrollY)
    if (y > 2) fehler.push(`Reduced Motion scrollte nicht sofort nach oben: ${y}`)
  }

  await kontext.close()
  return { ok: fehler.length === 0, art: 'tastatur', viewport: '390', pfad: '/', fehler }
}

async function planenTastatur(browser) {
  const kontext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  })
  const page = await kontext.newPage()
  const fehler = []
  await seiteOffen(page, '/planen')
  await page.waitForTimeout(400)
  const erstellen = page.getByRole('button', { name: 'Reise erstellen' })
  if ((await erstellen.count()) === 0) {
    fehler.push('Reise erstellen fehlt')
  } else {
    const box = await erstellen.boundingBox()
    if (!box || box.height < 44) fehler.push(`Reise erstellen kleiner als 44px: ${JSON.stringify(box)}`)
    await erstellen.focus()
    const sichtbar = await page.evaluate(() => {
      const el = document.activeElement
      return Boolean(el && (el.matches(':focus-visible') || el.matches(':focus')))
    })
    if (!sichtbar) fehler.push('Reise erstellen ohne sichtbaren Fokus')
  }
  const overflow = await overflowPruefen(page)
  if (overflow.htmlOverflow > 1 || overflow.bodyOverflow > 1) {
    fehler.push(`Planen overflow ${JSON.stringify(overflow)}`)
  }
  await kontext.close()
  return { ok: fehler.length === 0, art: 'planen', viewport: '390', pfad: '/planen', fehler }
}

async function workspaceReflow(browser) {
  const kontext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  })
  const page = await kontext.newPage()
  const fehler = []
  await page.addInitScript(
    ({ speicher, nutzlast }) => {
      sessionStorage.setItem(speicher, JSON.stringify(nutzlast))
    },
    { speicher: 'jetnity:ui-audit:workspace', nutzlast: AUDIT_REISE },
  )
  const okSeite = await seiteOffen(page, '/ui-audit/trip-workspace')
  if (!okSeite) fehler.push('Workspace-Auditseite antwortete nicht')
  await page.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).waitFor({ timeout: 15_000 })
  const overflow = await overflowPruefen(page)
  if (overflow.htmlOverflow > 1 || overflow.bodyOverflow > 1) {
    fehler.push(`Workspace overflow ${JSON.stringify(overflow)}`)
  }
  const fluege = page.getByRole('button', { name: 'Flüge', exact: true })
  if ((await fluege.count()) === 0) {
    fehler.push('Coverage-Aktion Flüge fehlt')
  } else {
    const box = await fluege.boundingBox()
    if (!box || box.height < 44) fehler.push(`Flüge kleiner als 44px: ${JSON.stringify(box)}`)
  }
  await kontext.close()
  return {
    ok: fehler.length === 0,
    art: 'workspace',
    viewport: '390',
    pfad: '/ui-audit/trip-workspace',
    fehler,
  }
}

async function main() {
  const server = await serverStarten()
  const ergebnisse = []
  const browser = await chromium.launch({ headless: true })
  try {
    for (const viewport of BREITEN) {
      for (const pfad of PFAD) {
        ergebnisse.push(await reflowPruefen(browser, viewport, pfad))
      }
    }
    ergebnisse.push(await tastaturPruefen(browser))
    ergebnisse.push(await planenTastatur(browser))
    ergebnisse.push(await workspaceReflow(browser))
  } finally {
    await browser.close()
    try {
      server.kill('SIGTERM')
    } catch {
      // Next kann sich vom Spawn lösen.
    }
  }

  const fehlgeschlagen = ergebnisse.filter((e) => !e.ok)
  const bericht = {
    methode: 'browser viewport/emulation',
    realDevice: false,
    engine: 'chromium',
    kombinationen: ergebnisse.length,
    viewports: BREITEN.map((b) => b.name),
    pfade: PFAD,
    fehlerzahl: fehlgeschlagen.length,
    fehlgeschlagen,
    ergebnisse,
  }
  mkdirSync(dirname(BERICHT), { recursive: true })
  writeFileSync(BERICHT, JSON.stringify(bericht, null, 2))
  console.log(JSON.stringify(bericht, null, 2))
  process.exit(fehlgeschlagen.length ? 1 : 0)
}

await main()
