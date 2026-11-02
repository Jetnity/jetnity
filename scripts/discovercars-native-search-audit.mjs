// Synthetic guest trip; one optional live search. Never submits a booking.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
const base = process.env.AUDIT_BASE || 'http://localhost:3017'
const live = process.env.AUDIT_LIVE === '1'
const evidence = process.env.AUDIT_EVIDENCE_DIR || '/tmp/jetnity-discovercars-audit'
mkdirSync(evidence, { recursive: true })
const trip = { id: 'discovercars-verification', clientRef: 'discovercars-verification', title: 'Bangkok', origin: 'Zürich', originPlaceId: 'geonames:2657896', startDate: '2026-11-16', endDate: '2026-11-23', travellers: 2, currency: 'CHF', budgetAmount: 3000, status: 'draft', pace: 'balanced', interests: [], travelWish: null, revision: 1, lastMutationId: null, stages: [{ id: 'bkk', position: 1, name: 'Bangkok', countryCode: 'TH', latitude: 13.75, longitude: 100.5, placeId: null, arrivalDate: '2026-11-16', departureDate: '2026-11-23' }], days: [], ohneTag: [], createdAt: '2026-11-02T18:00:00Z', updatedAt: '2026-11-02T18:00:00Z' }
const station = { id: 8054, name: 'Flughafen Bangkok Suvarnabhumi (BKK)', country: 'Thailand', region: 'Bangkok', type: 'airport' }
const synthetic = { status: 'ok', kind: 'search', result: { searchedAt: Date.now(), expiresAt: Date.now() + 1800000, omitted: 0, offers: Array.from({ length: 3 }, (_, i) => ({ offer_id: `synthetic-${i}`, token: `synthetic-token-${i}`, car: { name: `Testfahrzeug ${i + 1}`, category: 'small', transmission: i ? 'manual' : 'automatic', seats: 5, bags: 2 }, price: { total: 120 + i * 10, currency: 'CHF' }, supplier: { name: 'Testvermieter', rating: 8, review_count: 10 }, pickup: { location: 'Bangkok Airport' }, dropoff: { location: 'Bangkok Airport' }, url: { web: `https://www.discovercars.com/offer/synthetic-${i}?a_aid=jetnity`, rental_conditions: null } })) } }
const browser = await chromium.launch({ headless: true })
const report = { live, base, checks: [], offers: 0, errors: [] }
let activePage
let captured = null
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, locale: 'de-CH', ...(process.env.AUDIT_BYPASS ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': process.env.AUDIT_BYPASS } } : {}) })
    const page = await context.newPage(); activePage = page
    page.on('pageerror', e => report.errors.push(e.message))
    if (process.env.AUDIT_ACCESS_URL) await page.goto(process.env.AUDIT_ACCESS_URL, { waitUntil: 'domcontentloaded' })
    await page.addInitScript(t => localStorage.setItem('jetnity:reise:v3', JSON.stringify(t)), trip)
    let calls = 0; let mode = 'normal'; let detailsCalls = 0
    const useLive = live && width === 1440
    await page.route('**/api/rental-cars/discovercars', async route => {
      calls++
      const body = route.request().postDataJSON()
      if (useLive && mode === 'normal') return route.continue()
      if (body.action === 'locations') return route.fulfill({ json: { status: 'ok', kind: 'locations', locations: [station] } })
      if (mode === 'error') return route.fulfill({ status: 503, json: { status: 'error', message: 'Die Suche konnte nicht ausgeführt werden.' } })
      if (body.action === 'detail') { detailsCalls++; const result = captured || synthetic; return route.fulfill({ json: { status: 'ok', kind: 'detail', offer: result.result.offers.find(o => o.token === body.token), expiresAt: result.result.expiresAt } }) }
      const result = structuredClone(captured || synthetic)
      result.result.searchedAt = Date.now(); result.result.expiresAt = Date.now() + (mode === 'expiry' ? 1500 : 1800000)
      if (mode === 'empty') result.result.offers = []
      if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 1500))
      return route.fulfill({ json: result }).catch(() => {})
    })
    page.on('response', async res => {
      if (useLive && mode === 'normal' && res.url().endsWith('/api/rental-cars/discovercars') && res.request().postDataJSON()?.action === 'search') { const data = await res.json(); if (data.status === 'ok') captured = data }
    })
    await page.goto(`${base}/reisen/${trip.id}?ansicht=organisieren&bereich=mobilitaet`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('tab', { name: 'Mietwagen', exact: true }).click()
    const ui = page.locator('[data-discovercars-native]')
    await ui.waitFor(); assert.equal(calls, 0, 'No provider request before an explicit input')
    await ui.getByRole('combobox', { name: 'Abholstation', exact: true }).fill('Bangkok')
    await page.getByRole('option').filter({ hasText: /Suvarnabhumi/ }).first().waitFor({ timeout: 25000 })
    // Escape dismisses only the station popup, not the surrounding trip panel.
    await ui.getByRole('combobox', { name: 'Abholstation', exact: true }).press('Escape')
    assert.equal(await ui.count(), 1)
    assert.equal(await page.locator('[role=option]').count(), 0)
    // Use keyboard to confirm an actual provider station.
    await ui.getByRole('combobox', { name: 'Abholstation', exact: true }).press('ArrowDown')
    await ui.getByRole('combobox', { name: 'Abholstation', exact: true }).press('Enter')
    await ui.getByLabel('Abholzeit', { exact: true }).fill('10:00')
    await ui.getByLabel('Rückgabezeit', { exact: true }).fill('10:00')
    await ui.getByLabel('Alter des Fahrers', { exact: true }).fill('35')
    await ui.locator('select').filter({ has: page.locator('option[value="CH"]') }).selectOption('CH')
    await ui.getByRole('button', { name: 'Mietwagen vergleichen', exact: true }).click()
    await ui.getByRole('heading', { name: /\d+ Mietwagenangebote/ }).waitFor({ timeout: 35000 })
    report.offers = captured?.result.offers.length || 3
    const beforeFilters = calls
    await ui.getByRole('combobox', { name: /^Getriebe/ }).selectOption('automatic')
    assert.ok(await ui.locator('article').count() > 0)
    await ui.getByRole('combobox', { name: /^Getriebe/ }).selectOption('')
    await ui.locator('article').nth(0).getByRole('checkbox').check()
    await ui.locator('article').nth(1).getByRole('checkbox').check()
    await ui.getByRole('table').waitFor(); assert.equal(calls, beforeFilters, 'Filter/compare are local')
    await ui.getByRole('heading', { name: /\d+ Mietwagenangebote/ }).scrollIntoViewIfNeeded()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `No page overflow at ${width}`)
    await page.screenshot({ path: `${evidence}/${width}-results.png` })
    await ui.locator('article').first().getByRole('button', { name: 'Angebot ansehen' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('link', { name: /Bei DiscoverCars buchen/ }).waitFor({ timeout: 25000 })
    const href = await dialog.getByRole('link', { name: /Bei DiscoverCars buchen/ }).getAttribute('href')
    assert.ok(href.startsWith('https://www.discovercars.com/offer/'))
    assert.ok(href.includes('jetnity'))
    await page.screenshot({ path: `${evidence}/${width}-detail.png` })
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' })
    assert.equal(await ui.locator('article').first().getByRole('button', { name: 'Angebot ansehen' }).evaluate(el => el === document.activeElement), true, 'Focus returns from modal')
    // Search inputs invalidate all previous offers immediately.
    await ui.getByLabel('Abholzeit', { exact: true }).fill('11:00')
    assert.equal(await ui.locator('article').count(), 0)
    mode = 'empty'; await ui.getByRole('button', { name: 'Mietwagen vergleichen', exact: true }).click()
    await ui.getByRole('heading', { name: 'Keine Mietwagen für diese Suche' }).waitFor()
    mode = 'error'; await ui.getByRole('button', { name: 'Mietwagen vergleichen', exact: true }).click()
    await ui.getByRole('alert').filter({ hasText: 'Die Suche konnte nicht ausgeführt werden.' }).waitFor()
    assert.equal(await ui.getByRole('heading', { name: 'Keine Mietwagen für diese Suche' }).count(), 0)
    mode = 'expiry'; await ui.getByRole('button', { name: 'Mietwagen vergleichen', exact: true }).click()
    await ui.getByText('Diese Suche ist abgelaufen.', { exact: false }).waitFor()
    assert.equal(await ui.locator('article').first().getByRole('button').isDisabled(), true)
    mode = 'slow'; await ui.getByRole('button', { name: 'Mietwagen vergleichen', exact: true }).click()
    await ui.getByRole('status').filter({ hasText: 'Verfügbare Fahrzeuge' }).waitFor()
    await ui.getByLabel('Abholzeit', { exact: true }).fill('12:00')
    await page.waitForTimeout(1800); assert.equal(await ui.locator('article').count(), 0, 'Late response must not restore stale offers')
    await page.getByRole('tab', { name: 'Verbindungen', exact: true }).click()
    assert.equal(await ui.count(), 0, 'Leaving rental panel destroys provider state')
    const after = JSON.parse(await page.evaluate(() => localStorage.getItem('jetnity:reise:v3')))
    assert.deepEqual(after, trip, 'Search never changes the trip or booking status')
    report.checks.push({ width, source: useLive ? 'real provider search and detail' : 'controlled fixture', requests: calls, detailsCalls, passed: true })
    await context.close()
  }
  assert.deepEqual(report.errors, [])
  writeFileSync(`${evidence}/report.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
} catch (error) { if (activePage && !activePage.isClosed()) { await activePage.screenshot({ path: `${evidence}/failure.png` }); writeFileSync(`${evidence}/failure.txt`, await activePage.locator('body').innerText()) } throw error } finally { await browser.close() }
