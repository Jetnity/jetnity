import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { after, before, describe, test } from 'node:test'

import { chromium, type Browser, type Page } from 'playwright'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { preparationEpoch } from '@/lib/readiness/personal-preparation-workflow'
import type { ReadinessUserStatus, Trip, TripReadinessItem } from '@/types/trips'

declare global {
  interface Window {
    __PERSONAL__: {
      setzen: Array<{ clientRef: string; title: string; userStatus: string }>
      entfernen: string[]
      lesen: number
      schreibenFreigeben: (wert: string | null) => void
      schreibenScheitern: () => void
      lesenFreigeben: (wert: unknown) => void
      reiseSetzen: (reise: Trip) => void
      kanonischSetzen: (reise: Trip | undefined) => void
    }
  }
}

function punkt(reise: Trip, clientRef: string, title: string, userStatus: ReadinessUserStatus = 'open', fingerprint?: string): TripReadinessItem {
  const roh: TripReadinessItem = {
    id: clientRef,
    clientRef,
    kind: 'preparation',
    userStatus,
    evidence: 'user',
    countryCode: null,
    tripItemId: null,
    title,
    travellerClientRef: null,
    contextFingerprint: 'platzhalter',
    createdAt: '2026-10-04T20:00:00.000Z',
    updatedAt: '2026-10-04T20:00:00.000Z',
  }
  return { ...roh, contextFingerprint: fingerprint ?? preparationEpoch(reise, roh) }
}

function bundeln(): string {
  const datei = join(mkdtempSync(join(tmpdir(), 'personal-prep-')), 'flaeche.js')
  const gebaut = spawnSync('node_modules/esbuild/bin/esbuild', [
    'scripts/trip-personal-preparation-workflow-completion-1/flaeche.tsx',
    '--bundle',
    '--format=iife',
    `--outfile=${datei}`,
    '--jsx=automatic',
    '--alias:@=.',
    '--define:process.env.NODE_ENV="production"',
    '--banner:js=globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};',
  ], { encoding: 'utf8' })
  assert.equal(gebaut.status, 0, gebaut.stderr || gebaut.stdout)
  return datei
}

function dokument(bundle: string, start: unknown): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body><div id="root"></div><script>window.__START__ = ${JSON.stringify(start)}</script><script>${readFileSync(bundle, 'utf8')}</script></body></html>`
}

async function oeffnen(browser: Browser, bundle: string, start: { seam: 'account' | 'guest'; reise: Trip; kanonisch?: Trip }): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.setContent(dokument(bundle, start), { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__PERSONAL__)
  return page
}

async function zahl(page: Page, feld: 'setzen' | 'entfernen' | 'lesen'): Promise<number> {
  return page.evaluate((name) => {
    const wert = window.__PERSONAL__[name]
    return Array.isArray(wert) ? wert.length : wert
  }, feld)
}

async function phase(page: Page): Promise<string | null> {
  return page.locator('[data-personal-phase]').last().getAttribute('data-personal-phase')
}

describe('mounted personal preparation', () => {
  const bundle = bundeln()
  let browser: Browser

  before(async () => {
    browser = await chromium.launch()
  })

  after(async () => {
    await browser?.close()
  })

  test('account confirms only after acceptance and one later canonical delivery', async () => {
    const reise = beispielreise({ id: 'konto-reise', readinessItems: [] })
    const page = await oeffnen(browser, bundle, { seam: 'account', reise, kanonisch: reise })
    await page.getByLabel('Eigene Vorbereitung').fill('Reiseadapter einpacken')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    assert.equal(await phase(page), 'pending')
    assert.equal(await zahl(page, 'lesen'), 0)
    const payload = await page.evaluate(() => window.__PERSONAL__.setzen[0]) as { clientRef: string; title: string }
    assert.equal(payload.title, 'Reiseadapter einpacken')
    await page.evaluate((wert) => window.__PERSONAL__.kanonischSetzen(wert), reise)
    assert.equal(await phase(page), 'pending')
    await page.evaluate((wert) => window.__PERSONAL__.reiseSetzen(wert), { ...reise, title: 'Lokale Quittung' })
    assert.equal(await phase(page), 'pending')
    await page.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await page.waitForFunction(() => window.__PERSONAL__.lesen === 1)
    assert.equal(await phase(page), 'awaiting')
    await page.evaluate(() => window.__PERSONAL__.lesenFreigeben({ art: 'props' }))
    await page.waitForTimeout(50)
    assert.equal(await zahl(page, 'lesen'), 1)
    assert.equal(await phase(page), 'awaiting')
    const bestaetigt = beispielreise({
      id: reise.id,
      readinessItems: [punkt(reise, payload.clientRef, 'Reiseadapter einpacken')],
    })
    await page.evaluate((wert) => window.__PERSONAL__.kanonischSetzen(wert), bestaetigt)
    await page.waitForFunction(() => document.querySelector('[data-personal-phase]')?.getAttribute('data-personal-phase') === 'confirmed')
    assert.equal(await zahl(page, 'lesen'), 1)
    assert.match(await page.locator('[data-personal-phase="confirmed"]').innerText(), /Gespeichert und im aktuellen Stand sichtbar/)
    await page.close()
  })

  test('a delivery before acceptance does not confirm, and the post-acceptance read stays single', async () => {
    const reise = beispielreise({ id: 'konto-vorher', readinessItems: [] })
    const page = await oeffnen(browser, bundle, { seam: 'account', reise, kanonisch: reise })
    await page.getByLabel('Eigene Vorbereitung').fill('Vorher')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const payload = await page.evaluate(() => window.__PERSONAL__.setzen[0]) as { clientRef: string }
    const lieferung = await page.locator('[data-personal-hook-lieferung]').getAttribute('data-personal-hook-lieferung')
    const frueh = beispielreise({ id: reise.id, readinessItems: [punkt(reise, payload.clientRef, 'Vorher')] })
    await page.evaluate((wert) => window.__PERSONAL__.kanonischSetzen(wert), frueh)
    await page.waitForFunction((alt) => document.querySelector('[data-personal-hook-lieferung]')?.getAttribute('data-personal-hook-lieferung') !== alt, lieferung)
    assert.equal(await phase(page), 'pending')
    await page.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await page.waitForFunction(() => window.__PERSONAL__.lesen === 1)
    assert.equal(await phase(page), 'awaiting')
    await page.evaluate(() => window.__PERSONAL__.lesenFreigeben({ art: 'props' }))
    await page.waitForTimeout(30)
    assert.equal(await zahl(page, 'lesen'), 1)
    const spaeter = beispielreise({ id: reise.id, readinessItems: [punkt(reise, payload.clientRef, 'Vorher')] })
    await page.evaluate((wert) => window.__PERSONAL__.kanonischSetzen(wert), spaeter)
    await page.waitForFunction(() => document.querySelector('[data-personal-phase]')?.getAttribute('data-personal-phase') === 'confirmed')
    await page.close()
  })

  test('guest wrong trip blocks later submits across mode changes and keeps the draft', async () => {
    const reise = beispielreise({ id: 'gast-reise', readinessItems: [] })
    const page = await oeffnen(browser, bundle, { seam: 'guest', reise })
    await page.getByLabel('Eigene Vorbereitung').fill('Entwurf bleibt')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    await page.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await page.waitForFunction(() => window.__PERSONAL__.lesen === 1)
    await page.evaluate(() => window.__PERSONAL__.lesenFreigeben({ art: 'wrong_trip' }))
    await page.waitForFunction(() => document.querySelector('[data-personal-hook-barrier]')?.getAttribute('data-personal-hook-barrier') === 'true')
    await page.getByRole('button', { name: 'Versuch lokal verwerfen' }).click()
    assert.equal(await page.getByLabel('Eigene Vorbereitung').inputValue(), 'Entwurf bleibt')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click({ force: true })
    await page.getByRole('button', { name: 'Ansicht wechseln' }).click()
    await page.getByRole('button', { name: 'Ansicht wechseln' }).click()
    await page.locator('[data-personal-preparation-create]').evaluate((form) => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    assert.equal(await zahl(page, 'setzen'), 1)
    assert.equal(await page.getByLabel('Eigene Vorbereitung').inputValue(), 'Entwurf bleibt')
    await page.getByRole('button', { name: 'Stand neu lesen' }).click()
    await page.evaluate((wert) => window.__PERSONAL__.lesenFreigeben({ art: 'success', reise: wert }), reise)
    await page.waitForFunction(() => document.querySelector('[data-personal-hook-barrier]')?.getAttribute('data-personal-hook-barrier') === 'false')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 2)
    await page.close()
  })

  test('mode change keeps a pending intent and a late result does not replace the newer draft', async () => {
    const reise = beispielreise({ id: 'gast-spaet', readinessItems: [] })
    const page = await oeffnen(browser, bundle, { seam: 'guest', reise })
    await page.getByLabel('Eigene Vorbereitung').fill('Alpha')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    await page.getByRole('button', { name: 'Ansicht wechseln' }).click()
    assert.equal(await page.locator('[data-personal-modus]').innerText(), 'Reiseplan')
    await page.getByRole('button', { name: 'Ansicht wechseln' }).click()
    assert.equal(await phase(page), 'pending')
    await page.getByLabel('Eigene Vorbereitung').fill('Beta')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 2)
    const refs = await page.evaluate(() => window.__PERSONAL__.setzen.map((eintrag) => (eintrag as { clientRef: string }).clientRef))
    assert.notEqual(refs[0], refs[1])
    await page.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await page.waitForFunction(() => window.__PERSONAL__.lesen === 1 && document.querySelectorAll('[data-personal-phase="pending"]').length === 1)
    assert.equal(await page.getByLabel('Eigene Vorbereitung').inputValue(), 'Beta')
    await page.close()
  })

  test('an open editor returns to Offen when the preparation context changes again', async () => {
    const basis = beispielreise({ id: 'stale-reise' })
    const item = punkt(basis, 'preparation-stale', 'Adapter', 'done', 'v4|sha256:alt')
    const reise = beispielreise({ id: basis.id, readinessItems: [item] })
    const page = await oeffnen(browser, bundle, { seam: 'guest', reise })
    const zeile = page.locator('[data-personal-client-ref="preparation-stale"]')
    await zeile.getByRole('button', { name: 'Titel bearbeiten' }).click()
    assert.equal(await zeile.getByRole('button', { name: 'Offen', exact: true }).getAttribute('aria-pressed'), 'true')
    assert.match(await zeile.innerText(), /Offen ist vorausgewählt/)
    await zeile.getByRole('button', { name: 'Erledigt', exact: true }).click()
    assert.equal(await zeile.getByRole('button', { name: 'Erledigt', exact: true }).getAttribute('aria-pressed'), 'true')
    const verschoben = beispielreise({ id: reise.id, startDate: '2026-12-01', endDate: '2026-12-05', readinessItems: reise.readinessItems })
    await page.evaluate((wert) => window.__PERSONAL__.reiseSetzen(wert), verschoben)
    await zeile.getByRole('button', { name: 'Offen', exact: true }).waitFor()
    await page.waitForFunction(() => document.querySelector('[data-personal-client-ref="preparation-stale"] [aria-pressed="true"]')?.textContent === 'Offen')
    await zeile.getByRole('button', { name: 'Speichern' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const payload = await page.evaluate(() => window.__PERSONAL__.setzen[0]) as { userStatus: string }
    assert.equal(payload.userStatus, 'open')
    await page.close()
  })

  test('a missing point and an unclear result do not send another write', async () => {
    const basis = beispielreise({ id: 'weg-reise' })
    const item = punkt(basis, 'preparation-weg', 'Adapter')
    const reise = beispielreise({ id: basis.id, readinessItems: [item] })
    const page = await oeffnen(browser, bundle, { seam: 'guest', reise })
    await page.getByRole('button', { name: 'Titel bearbeiten' }).click()
    await page.evaluate((wert) => window.__PERSONAL__.reiseSetzen(wert), beispielreise({ id: reise.id, readinessItems: [] }))
    await page.getByRole('button', { name: 'Speichern' }).click()
    await page.waitForTimeout(30)
    assert.equal(await zahl(page, 'setzen'), 0)
    assert.match(await page.locator('body').innerText(), /nicht neu angelegt/)
    await page.evaluate((wert) => window.__PERSONAL__.reiseSetzen(wert), reise)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    await page.evaluate(() => window.__PERSONAL__.schreibenScheitern())
    await page.waitForFunction(() => document.body.innerText.includes('unautomatisch') || document.body.innerText.includes('unklar'))
    assert.equal(await zahl(page, 'setzen'), 1)
    await page.close()
  })

  test('filters, empty copy, named delete and a double submit stay distinct', async () => {
    const leer = beispielreise({ id: 'leer-reise', readinessItems: [] })
    const page = await oeffnen(browser, bundle, { seam: 'guest', reise: leer })
    await page.getByRole('button', { name: 'Erledigt', exact: true }).click()
    assert.match(await page.locator('body').innerText(), /Noch keine eigene Vorbereitung/)
    const basis = beispielreise({ id: 'liste-reise' })
    const a = punkt(basis, 'preparation-a', 'Alpha')
    const b = punkt(basis, 'preparation-b', 'Alpha')
    await page.evaluate((wert) => window.__PERSONAL__.reiseSetzen(wert), beispielreise({ id: basis.id, readinessItems: [a, b] }))
    await page.waitForFunction(() => document.body.innerText.includes('Keine eigenen Punkte passen'))
    await page.getByRole('button', { name: 'Alle', exact: true }).click()
    assert.equal(await page.locator('[data-personal-client-ref]').count(), 2)
    await page.getByLabel('Suche in eigenen Punkten').fill('nichts')
    assert.match(await page.locator('body').innerText(), /Keine eigenen Punkte passen/)
    await page.getByLabel('Suche in eigenen Punkten').fill('')
    const entfernen = page.locator('[data-personal-client-ref="preparation-a"]')
    await entfernen.getByRole('button', { name: 'Entfernen' }).click()
    assert.match(await entfernen.innerText(), /Diesen Punkt entfernen: Alpha\?/)
    assert.match(await entfernen.innerText(), /Offen|Von dir erledigt/)
    await entfernen.getByRole('button', { name: 'Endgültig entfernen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.entfernen.length === 1)
    assert.equal(await page.getByLabel('Eigene Vorbereitung').getAttribute('maxLength'), '80')
    await page.getByLabel('Eigene Vorbereitung').fill('Gleich')
    await page.locator('[data-personal-preparation-create]').evaluate((form) => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    await page.waitForTimeout(30)
    assert.equal(await zahl(page, 'setzen'), 1)
    await page.close()
  })

  test('an unreadable guest read blocks a later submit and keeps the draft', async () => {
    const reise = beispielreise({ id: 'gast-unlesbar', readinessItems: [] })
    const page = await oeffnen(browser, bundle, { seam: 'guest', reise })
    await page.getByLabel('Eigene Vorbereitung').fill('Bleibt stehen')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    await page.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await page.waitForFunction(() => window.__PERSONAL__.lesen === 1)
    await page.evaluate(() => window.__PERSONAL__.lesenFreigeben({ art: 'unreadable' }))
    await page.waitForFunction(() => document.querySelector('[data-personal-hook-barrier]')?.getAttribute('data-personal-hook-barrier') === 'true')
    await page.getByRole('button', { name: 'Versuch lokal verwerfen' }).click()
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click({ force: true })
    assert.equal(await zahl(page, 'setzen'), 1)
    assert.equal(await page.getByLabel('Eigene Vorbereitung').inputValue(), 'Bleibt stehen')
    await page.close()
  })

  test('confirmation focuses the visible row and a mode change removes that target', async () => {
    const reise = beispielreise({ id: 'fokus-reise', readinessItems: [] })
    const page = await oeffnen(browser, bundle, { seam: 'guest', reise })
    await page.getByLabel('Eigene Vorbereitung').fill('Fokus')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const payload = await page.evaluate(() => window.__PERSONAL__.setzen[0]) as { clientRef: string }
    await page.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await page.waitForFunction(() => window.__PERSONAL__.lesen === 1)
    const gelesen = beispielreise({ id: reise.id, readinessItems: [punkt(reise, payload.clientRef, 'Fokus')] })
    await page.evaluate((wert) => window.__PERSONAL__.lesenFreigeben({ art: 'success', reise: wert }), gelesen)
    await page.waitForFunction(() => document.querySelector('[data-personal-phase="confirmed"]'))
    const ziel = await page.evaluate(() => document.activeElement?.getAttribute('data-personal-client-ref') ?? '')
    assert.equal(ziel, payload.clientRef)
    await page.getByRole('button', { name: 'Ansicht wechseln' }).click()
    const weg = await page.evaluate(() => document.querySelector('[data-personal-focus]')?.isConnected ?? false)
    assert.equal(weg, false)
    await page.close()
  })

  test('Enter submits one create and a trip change drops the pending intent', async () => {
    const reise = beispielreise({ id: 'enter-reise', readinessItems: [] })
    const page = await oeffnen(browser, bundle, { seam: 'guest', reise })
    const feld = page.getByLabel('Eigene Vorbereitung')
    await feld.fill('Tastatur')
    await feld.press('Enter')
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    assert.equal(await phase(page), 'pending')
    await page.evaluate((wert) => window.__PERSONAL__.reiseSetzen(wert), beispielreise({ id: 'andere-reise', readinessItems: [] }))
    await page.waitForFunction(() => document.querySelectorAll('[data-personal-phase="pending"]').length === 0)
    await page.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await page.waitForTimeout(40)
    assert.equal(await zahl(page, 'setzen'), 1)
    assert.equal(await zahl(page, 'lesen'), 0)
    await page.close()
  })

  test('an unclear result cannot retry or edit until a later read, and a match stays reconciled', async () => {
    const reise = beispielreise({ id: 'unklar-reise', readinessItems: [] })
    const page = await oeffnen(browser, bundle, { seam: 'guest', reise })
    await page.getByLabel('Eigene Vorbereitung').fill('Unklar')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const erste = await page.evaluate(() => window.__PERSONAL__.setzen[0]) as { clientRef: string }
    await page.evaluate(() => window.__PERSONAL__.schreibenScheitern())
    await page.getByRole('button', { name: 'Erneut versuchen' }).click()
    await page.waitForTimeout(40)
    assert.equal(await zahl(page, 'setzen'), 1)
    assert.equal(await zahl(page, 'lesen'), 0)
    assert.match(await page.locator('body').innerText(), /Lies zuerst/)
    await page.getByRole('button', { name: 'Stand neu lesen' }).last().click()
    await page.evaluate(() => window.__PERSONAL__.lesenFreigeben({ art: 'wrong_trip' }))
    await page.waitForFunction(() => document.querySelector('[data-personal-hook-barrier]')?.getAttribute('data-personal-hook-barrier') === 'true')
    await page.getByRole('button', { name: 'Erneut versuchen' }).click()
    await page.waitForTimeout(40)
    assert.equal(await zahl(page, 'setzen'), 1)
    const konflikt = beispielreise({ id: reise.id, readinessItems: [punkt(reise, erste.clientRef, 'Anders')] })
    await page.getByRole('button', { name: 'Stand neu lesen' }).last().click()
    await page.evaluate((wert) => window.__PERSONAL__.lesenFreigeben({ art: 'success', reise: wert }), konflikt)
    await page.waitForFunction(() => document.querySelector('[data-personal-phase="conflict"]'))
    await page.getByRole('button', { name: 'Erneut versuchen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 2)
    const zweite = await page.evaluate(() => window.__PERSONAL__.setzen[1]) as { clientRef: string }
    assert.equal(zweite.clientRef, erste.clientRef)
    assert.match(await page.locator('body').innerText(), /kein Beweis/)
    await page.close()

    const neu = await oeffnen(browser, bundle, { seam: 'guest', reise: beispielreise({ id: 'unklar-passend', readinessItems: [] }) })
    await neu.getByLabel('Eigene Vorbereitung').fill('Passend')
    await neu.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await neu.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const ref = await neu.evaluate(() => (window.__PERSONAL__.setzen[0] as { clientRef: string }).clientRef)
    await neu.evaluate(() => window.__PERSONAL__.schreibenScheitern())
    const passend = beispielreise({ id: 'unklar-passend', readinessItems: [punkt(beispielreise({ id: 'unklar-passend' }), ref, 'Passend')] })
    await neu.getByRole('button', { name: 'Stand neu lesen' }).last().click()
    await neu.evaluate((wert) => window.__PERSONAL__.lesenFreigeben({ art: 'success', reise: wert }), passend)
    await neu.waitForFunction(() => document.querySelector('[data-personal-phase="reconciled"]'))
    assert.equal(await neu.locator('[data-personal-phase="confirmed"]').count(), 0)
    assert.match(await neu.locator('body').innerText(), /belegt nicht/)
    assert.equal(await zahl(neu, 'setzen'), 1)
    await neu.getByLabel('Eigene Vorbereitung').fill('Beta')
    await neu.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await neu.waitForFunction(() => window.__PERSONAL__.setzen.length === 2)
    await neu.getByRole('button', { name: 'Stand neu lesen' }).last().click()
    await neu.evaluate((wert) => window.__PERSONAL__.lesenFreigeben({ art: 'success', reise: wert }), passend)
    await neu.waitForTimeout(40)
    assert.equal(await neu.locator('[data-personal-phase="pending"]').count(), 1)
    assert.equal(await neu.getByLabel('Eigene Vorbereitung').inputValue(), 'Beta')
    await neu.close()
  })

  test('a later account delivery recovers absence and does not confirm an unknown match', async () => {
    const reise = beispielreise({ id: 'konto-spaeter', readinessItems: [] })
    const page = await oeffnen(browser, bundle, { seam: 'account', reise, kanonisch: reise })
    await page.getByLabel('Eigene Vorbereitung').fill('Spaeter')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const ref = await page.evaluate(() => (window.__PERSONAL__.setzen[0] as { clientRef: string }).clientRef)
    await page.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await page.waitForFunction(() => window.__PERSONAL__.lesen === 1)
    await page.evaluate(() => window.__PERSONAL__.lesenFreigeben({ art: 'props' }))
    const ohne = beispielreise({ id: reise.id, readinessItems: [] })
    await page.evaluate((wert) => window.__PERSONAL__.kanonischSetzen(wert), ohne)
    await page.waitForFunction(() => document.querySelector('[data-personal-phase="absent_uncertain"]'))
    const mit = beispielreise({ id: reise.id, readinessItems: [punkt(reise, ref, 'Spaeter')] })
    await page.evaluate((wert) => window.__PERSONAL__.kanonischSetzen(wert), mit)
    await page.waitForFunction(() => document.querySelector('[data-personal-phase="confirmed"]'))
    assert.equal(await zahl(page, 'lesen'), 1)
    assert.equal(await page.locator('[data-personal-hook-lieferung]').getAttribute('data-personal-hook-lieferung'), '3')
    await page.close()

    const unklarSeite = await oeffnen(browser, bundle, { seam: 'account', reise, kanonisch: reise })
    await unklarSeite.getByLabel('Eigene Vorbereitung').fill('Unbekannt')
    await unklarSeite.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await unklarSeite.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const unklarRef = await unklarSeite.evaluate(() => (window.__PERSONAL__.setzen[0] as { clientRef: string }).clientRef)
    await unklarSeite.evaluate(() => window.__PERSONAL__.schreibenScheitern())
    await unklarSeite.getByRole('button', { name: 'Stand neu lesen' }).last().click()
    await unklarSeite.evaluate(() => window.__PERSONAL__.lesenFreigeben({ art: 'props' }))
    await unklarSeite.waitForTimeout(30)
    assert.equal(await phase(unklarSeite), 'unclear')
    const gesehen = beispielreise({ id: reise.id, readinessItems: [punkt(reise, unklarRef, 'Unbekannt')] })
    await unklarSeite.evaluate((wert) => window.__PERSONAL__.kanonischSetzen(wert), gesehen)
    await unklarSeite.waitForFunction(() => document.querySelector('[data-personal-phase="reconciled"]'))
    assert.equal(await unklarSeite.locator('[data-personal-phase="confirmed"]').count(), 0)
    assert.equal(await zahl(unklarSeite, 'setzen'), 1)
    await unklarSeite.close()
  })

  test('late confirmation leaves search, another editor, a filter and a hidden section alone', async () => {
    const sucheReise = beispielreise({ id: 'fokus-suche', readinessItems: [] })
    const suche = await oeffnen(browser, bundle, { seam: 'guest', reise: sucheReise })
    await suche.getByLabel('Eigene Vorbereitung').fill('Suche')
    await suche.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await suche.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const sucheRef = await suche.evaluate(() => (window.__PERSONAL__.setzen[0] as { clientRef: string }).clientRef)
    await suche.getByLabel('Suche in eigenen Punkten').focus()
    await suche.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await suche.waitForFunction(() => window.__PERSONAL__.lesen === 1)
    await suche.evaluate((wert) => window.__PERSONAL__.lesenFreigeben({ art: 'success', reise: wert }), beispielreise({
      id: sucheReise.id,
      readinessItems: [punkt(sucheReise, sucheRef, 'Suche')],
    }))
    await suche.waitForFunction(() => document.querySelector('[data-personal-phase="confirmed"]'))
    assert.equal(await suche.evaluate(() => document.activeElement?.getAttribute('data-personal-preparation-search')), '')
    await suche.close()

    const basis = beispielreise({ id: 'fokus-editor' })
    const editorReise = beispielreise({
      id: basis.id,
      readinessItems: [punkt(basis, 'preparation-a', 'Alpha'), punkt(basis, 'preparation-b', 'Beta')],
    })
    const editor = await oeffnen(browser, bundle, { seam: 'guest', reise: editorReise })
    const zeileB = editor.locator('[data-personal-client-ref="preparation-b"]')
    await zeileB.getByRole('button', { name: 'Titel bearbeiten' }).click()
    const feldB = zeileB.getByLabel('Titel bearbeiten')
    await feldB.fill('Beta bleibt')
    const zeileA = editor.locator('[data-personal-client-ref="preparation-a"]')
    await zeileA.getByRole('button', { name: 'Titel bearbeiten' }).click()
    await zeileA.getByRole('button', { name: 'Speichern' }).click()
    await editor.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    await feldB.focus()
    await editor.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await editor.waitForFunction(() => window.__PERSONAL__.lesen === 1)
    await editor.evaluate((wert) => window.__PERSONAL__.lesenFreigeben({ art: 'success', reise: wert }), editorReise)
    await editor.waitForFunction(() => document.querySelector('[data-personal-client-ref="preparation-a"]')?.getAttribute('data-personal-phase') === 'confirmed' || document.querySelector('[data-personal-client-ref="preparation-a"]')?.getAttribute('data-personal-phase') === 'reconciled')
    assert.equal(await feldB.inputValue(), 'Beta bleibt')
    assert.equal(await editor.evaluate(() => document.activeElement?.closest('[data-personal-client-ref]')?.getAttribute('data-personal-client-ref')), 'preparation-b')
    await editor.close()

    const filterReise = beispielreise({ id: 'fokus-filter', readinessItems: [] })
    const filter = await oeffnen(browser, bundle, { seam: 'guest', reise: filterReise })
    await filter.getByLabel('Eigene Vorbereitung').fill('Filter')
    await filter.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await filter.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const filterRef = await filter.evaluate(() => (window.__PERSONAL__.setzen[0] as { clientRef: string }).clientRef)
    await filter.getByRole('button', { name: 'Erledigt', exact: true }).click()
    await filter.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await filter.waitForFunction(() => window.__PERSONAL__.lesen === 1)
    await filter.evaluate((wert) => window.__PERSONAL__.lesenFreigeben({ art: 'success', reise: wert }), beispielreise({
      id: filterReise.id,
      readinessItems: [punkt(filterReise, filterRef, 'Filter')],
    }))
    await filter.waitForTimeout(40)
    assert.equal(await filter.evaluate(() => document.activeElement?.textContent), 'Erledigt')
    assert.equal(await filter.locator('[data-personal-client-ref]').count(), 0)
    await filter.close()

    const wegReise = beispielreise({ id: 'fokus-weg', readinessItems: [] })
    const weg = await oeffnen(browser, bundle, { seam: 'guest', reise: wegReise })
    await weg.getByLabel('Eigene Vorbereitung').fill('Verborgen')
    await weg.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await weg.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const wegRef = await weg.evaluate(() => (window.__PERSONAL__.setzen[0] as { clientRef: string }).clientRef)
    await weg.getByRole('button', { name: 'Ansicht wechseln' }).click()
    await weg.evaluate(() => window.__PERSONAL__.schreibenFreigeben(null))
    await weg.waitForFunction(() => window.__PERSONAL__.lesen === 1)
    await weg.evaluate((wert) => window.__PERSONAL__.lesenFreigeben({ art: 'success', reise: wert }), beispielreise({
      id: wegReise.id,
      readinessItems: [punkt(wegReise, wegRef, 'Verborgen')],
    }))
    await weg.getByRole('button', { name: 'Ansicht wechseln' }).click()
    await weg.waitForFunction(() => document.querySelector('[data-personal-phase="confirmed"]'))
    assert.notEqual(await weg.evaluate(() => document.activeElement?.getAttribute('data-personal-client-ref')), wegRef)
    await weg.close()
  })

  test('production wiring names the canonical prop and the workspace hook', () => {
    const workspace = readFileSync('components/trips/TripWorkspace.tsx', 'utf8')
    const konto = readFileSync('components/trips/KontoArbeitsbereich.tsx', 'utf8')
    const gast = readFileSync('components/trips/GastArbeitsbereich.tsx', 'utf8')
    const bereich = readFileSync('components/trips/Reisevorbereitung.tsx', 'utf8')
    assert.match(workspace, /usePersonalPreparationLifecycle/)
    assert.match(workspace, /eigeneSteuerung=\{eigeneSteuerung\}/)
    assert.match(konto, /readinessKanonischeReise=\{serverReise\}/)
    assert.match(gast, /aktiveV3GastreiseLesen\(tripId\)/)
    assert.match(bereich, /id="eigene-vorbereitung"/)
    assert.match(bereich, /Punkt hinzufügen/)
    writeFileSync(join(tmpdir(), 'personal-prep-wiring-ok.txt'), 'ok')
  })
})
