import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, type Browser, type Page } from 'playwright'

import { tageskontextAusReise, activitySucheEingabeAusReise } from '@/lib/activities/tageskontext'
import { timelineAbleiten } from '@/lib/trips/timeline'
import type { Trip } from '@/types/trips'

type Fall = { name: string; pass: boolean; detail?: unknown; error?: string }

const faelle: Fall[] = []
const externe: string[] = []
let browser: Browser | null = null
let seitenFehler: string[] = []

function ruhig() {
  assert.deepEqual(seitenFehler, [])
  assert.deepEqual(externe, [])
}

async function oeffnen(page: Page, pfad = '/') {
  seitenFehler = []
  externe.length = 0
  const origin = process.env.ALLOCATION_HARNESS_ORIGIN ?? ''
  await page.route('**/*', (route) => {
    let erlaubt = false
    try {
      erlaubt = new URL(route.request().url()).origin === new URL(origin).origin
    } catch {
      erlaubt = false
    }
    if (!erlaubt) {
      externe.push(route.request().url())
      return route.abort('blockedbyclient')
    }
    return route.continue()
  })
  page.on('pageerror', (error) => seitenFehler.push(error.message))
  await page.goto(`${origin}${pfad}`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#feld-ziel')
}

async function ursprung(page: Page) {
  const feld = page.locator('#feld-abreiseort')
  await feld.click()
  await feld.fill('Zürich')
  await page.waitForSelector('[role="option"]')
  await feld.press('ArrowDown')
  await feld.press('Enter')
  await page.waitForFunction(() => (document.querySelector('#feld-abreiseort') as HTMLInputElement).value === 'Zürich')
}

async function zeitraum(page: Page, start = '2026-11-01', ende = '2026-11-14') {
  await page.locator('#feld-start').fill(start)
  await page.locator('#feld-ende').fill(ende)
}

async function optIn(page: Page) {
  const schalter = page.locator('#zuordnung-aktiv')
  await schalter.focus()
  await schalter.press('Space')
  await page.waitForSelector('#zuordnung-primary-von')
  assert.equal(await schalter.isChecked(), true)
}

async function spanne(page: Page, key: string, von: string, bis: string) {
  await page.locator(`#zuordnung-${key}-von`).fill(von)
  await page.locator(`#zuordnung-${key}-bis`).fill(bis)
}

async function reiseLesen(page: Page): Promise<Trip> {
  const roh = await page.evaluate(() => window.localStorage.getItem('jetnity:reise:v3'))
  assert.equal(typeof roh, 'string')
  return JSON.parse(roh ?? '') as Trip
}

export function registerMounted() {
  const origin = process.env.ALLOCATION_HARNESS_ORIGIN
  const evidenceFile = process.env.ALLOCATION_EVIDENCE_FILE
  const screens = process.env.ALLOCATION_SCREENS
  if (!origin || !evidenceFile || !screens) throw new Error('Harness-Umgebung fehlt')
  mkdirSync(screens, { recursive: true })

  describe('Gemountete Tageszuordnung', { concurrency: 1 }, () => {
    before(async () => {
      browser = await chromium.launch({ headless: true, channel: 'chrome' })
    })

    after(async () => {
      const pass = faelle.filter((fall) => fall.pass).length
      writeFileSync(
        evidenceFile,
        `${JSON.stringify({ status: pass === faelle.length && faelle.length > 0 ? 'PASS' : 'FAIL', caseCount: faelle.length, pass, fail: faelle.length - pass, cases: faelle, externalRequests: externe }, null, 2)}\n`,
      )
      await browser?.close()
    })

    function fall(name: string, fn: (page: Page) => Promise<unknown>) {
      test(name, { timeout: 90000 }, async () => {
        if (!browser) throw new Error('Browser nicht gestartet')
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
        page.setDefaultTimeout(8000)
        try {
          const detail = await fn(page)
          faelle.push({ name, pass: true, detail: detail ?? undefined })
        } catch (error) {
          const message = error instanceof Error ? error.stack ?? error.message : String(error)
          faelle.push({ name, pass: false, error: message.slice(0, 2000) })
          await page.screenshot({ path: `${screens}/${name.replace(/[^\w.-]+/g, '_').slice(0, 80)}.png`, fullPage: true }).catch(() => undefined)
          throw error
        } finally {
          await page.close()
        }
      })
    }

    fall('Tastatur verteilt 3/4/7 und der Gastgraph bleibt 14 Tage', async (page) => {
      await oeffnen(page)
      await ursprung(page)
      await zeitraum(page)
      await optIn(page)
      const aktiv = await page.evaluate(() => document.activeElement?.id ?? null)
      await page.locator('#zuordnung-primary-von').focus()
      await spanne(page, 'primary', '2026-11-01', '2026-11-03')
      await spanne(page, 'handoff-1', '2026-11-04', '2026-11-07')
      await spanne(page, 'handoff-2', '2026-11-08', '2026-11-14')
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.waitForFunction(() => window.localStorage.getItem('jetnity:reise:v3') != null)
      const reise = await reiseLesen(page)
      const timeline = timelineAbleiten(reise)
      const erster = reise.days[0]
      const etappe = reise.stages.find((eintrag) => eintrag.id === erster?.stageId)
      assert.ok(etappe && erster)
      const kontext = tageskontextAusReise(activitySucheEingabeAusReise(reise, etappe, erster))
      assert.equal(reise.days.length, 14)
      assert.deepEqual(
        timeline.etappen.filter((eintrag) => eintrag.istNutzerziel).map((eintrag) => eintrag.tage.length),
        [3, 4, 7],
      )
      assert.equal(kontext.anfrage?.destinationName, 'Bangkok')
      assert.equal(kontext.anfrage?.dayDate, '2026-11-01')
      assert.equal(reise.stages.every((eintrag) => eintrag.arrivalDate === null), true)
      ruhig()
      return { fokusNachSchalter: aktiv, tage: reise.days.length }
    })

    fall('die ersten drei Tage bleiben explizit und elf Tage ohne Ziel', async (page) => {
      await oeffnen(page)
      await ursprung(page)
      await zeitraum(page)
      await optIn(page)
      await spanne(page, 'primary', '2026-11-01', '2026-11-03')
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.waitForFunction(() => window.localStorage.getItem('jetnity:reise:v3') != null)
      const reise = await reiseLesen(page)
      const timeline = timelineAbleiten(reise)
      assert.equal(reise.days.filter((tag) => tag.stageId == null).length, 11)
      assert.equal(timeline.etappen.find((etappe) => etappe.name === 'Noch keinem Ziel zugeordnet')?.tage.length, 11)
      ruhig()
    })

    fall('ein widersprüchlicher Tag erhält den Fokus und wird nicht gespeichert', async (page) => {
      await oeffnen(page)
      await ursprung(page)
      await zeitraum(page)
      await optIn(page)
      await spanne(page, 'handoff-2', '2026-11-01', '2026-11-01')
      await spanne(page, 'primary', '2026-11-10', '2026-11-10')
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.waitForSelector('#zuordnung-fehler')
      const fokus = await page.evaluate(() => document.activeElement?.id ?? null)
      const text = await page.locator('#zuordnung-fehler').innerText()
      assert.match(text, /Reihenfolge/)
      assert.equal(fokus, 'zuordnung-primary-von')
      assert.equal(await page.evaluate(() => window.localStorage.getItem('jetnity:reise:v3')), null)
      ruhig()
      return { fokus }
    })

    fall('Vertauschen erhält die Zielbindung und Zurücksetzen löscht sie', async (page) => {
      await oeffnen(page)
      await ursprung(page)
      await zeitraum(page)
      await optIn(page)
      await spanne(page, 'primary', '2026-11-01', '2026-11-03')
      await spanne(page, 'handoff-2', '2026-11-08', '2026-11-14')
      const phuketHoch = page.getByRole('button', { name: /Phuket, Ziel \d+, nach oben/ })
      await phuketHoch.click()
      await phuketHoch.click()
      await page.waitForSelector('#zuordnung-fehler')
      assert.match(await page.locator('#zuordnung-fehler').innerText(), /Reihenfolge/)
      const von = await page.locator('#zuordnung-primary-von').inputValue()
      assert.equal(von, '2026-11-01')
      await page.getByRole('button', { name: 'Zuordnung zurücksetzen' }).click()
      assert.equal(await page.locator('#zuordnung-aktiv').isChecked(), false)
      assert.equal(await page.locator('#zuordnung-primary-von').count(), 0)
      const fokus = await page.evaluate(() => document.activeElement?.id ?? null)
      assert.equal(fokus, 'zuordnung-aktiv')
      ruhig()
      return { fokus }
    })

    fall('das Konto erhält dieselbe Verteilung, ohne den Gastspeicher zu beschreiben', async (page) => {
      await oeffnen(page, '/konto')
      await ursprung(page)
      await zeitraum(page)
      await optIn(page)
      await spanne(page, 'primary', '2026-11-01', '2026-11-03')
      await spanne(page, 'handoff-1', '2026-11-04', '2026-11-07')
      await spanne(page, 'handoff-2', '2026-11-08', '2026-11-14')
      await page.getByRole('button', { name: 'Reise erstellen' }).click()
      await page.waitForFunction(() => (window as Window & { __reiseAufrufe?: unknown[] }).__reiseAufrufe?.length === 1)
      const aufruf = await page.evaluate(() => (window as Window & { __reiseAufrufe: { eingabe: { dayAllocation?: { claims: { occurrence: number }[] } } }[] }).__reiseAufrufe[0])
      assert.deepEqual(
        aufruf.eingabe.dayAllocation?.claims.map((anspruch) => anspruch.occurrence),
        [1, 2, 3],
      )
      assert.equal(await page.evaluate(() => window.localStorage.getItem('jetnity:reise:v3')), null)
    })

    fall('schmale, große und vergrößerte Schrift bleibt im Zuordnungsbereich', async (page) => {
      await oeffnen(page)
      await ursprung(page)
      await zeitraum(page)
      await optIn(page)
      await spanne(page, 'primary', '2026-11-01', '2026-11-03')
      const ansichten = [
        { name: 'narrow-320', width: 320, height: 800, schrift: '16px' },
        { name: 'phone-390', width: 390, height: 844, schrift: '16px' },
        { name: 'tablet-768', width: 768, height: 1024, schrift: '16px' },
        { name: 'desktop-1280', width: 1280, height: 900, schrift: '16px' },
        { name: 'narrow-320-200', width: 320, height: 800, schrift: '32px' },
        { name: 'desktop-1280-200', width: 1280, height: 900, schrift: '32px' },
      ]
      const masse: { name: string; ueberhang: number }[] = []
      for (const ansicht of ansichten) {
        await page.setViewportSize({ width: ansicht.width, height: ansicht.height })
        await page.evaluate((schrift) => {
          document.documentElement.style.fontSize = schrift
        }, ansicht.schrift)
        await page.locator('[data-zuordnung-root]').scrollIntoViewIfNeeded()
        const ueberhang = await page.evaluate(() => {
          const wurzel = document.querySelector('[data-zuordnung-root]')
          if (!(wurzel instanceof HTMLElement)) return 999
          return wurzel.scrollWidth - wurzel.clientWidth
        })
        masse.push({ name: ansicht.name, ueberhang })
        await page.screenshot({ path: `${screens}/${ansicht.name}.png`, fullPage: false })
        assert.ok(ueberhang <= 1, `${ansicht.name} überhängt um ${ueberhang}`)
      }
      ruhig()
      return masse
    })
  })
}

registerMounted()
