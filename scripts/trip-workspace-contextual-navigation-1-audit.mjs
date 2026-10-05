#!/usr/bin/env node
// Bounded U02/U03 audit of the real workspace through the existing local audit route.
// AUDIT_BASE=http://127.0.0.1:3481 node --import tsx scripts/trip-workspace-contextual-navigation-1-audit.mjs
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { chromium } from 'playwright'
const require = createRequire(import.meta.url)
const { beispielreise } = require('../lib/reiseaenderung/fixtures/reise.ts')
const { credentialOptionsAus } = require('../lib/readiness/traveller-kontext.ts')
const { OFFICIAL_REQUIREMENT_TYPES } = require('../types/trips.ts')

const base = process.env.AUDIT_BASE || 'http://127.0.0.1:3481'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'local audit only')
const evidence = process.env.AUDIT_EVIDENCE_DIR || join(process.cwd(), 'docs/evidence/trip-workspace-contextual-navigation-1')
mkdirSync(evidence, { recursive: true })
const stamp = '2026-10-05T09:00:00.000Z'
const refs = ['opaque:alpha?[]', 'opaque:beta&=']
const party = refs.map((clientRef, i) => ({
  id: `person-${i}`, clientRef, label: i === 0 ? 'Ada' : 'Ben', residenceCountryCode: 'CH',
  citizenships: [{ id: `cit-${i}`, clientRef: `cit-${i}`, countryCode: 'CH', createdAt: stamp, updatedAt: stamp }],
  documents: [], createdAt: stamp, updatedAt: stamp,
}))
const reise = beispielreise({ party })
reise.ohneTag = [{ ...reise.days[0].items[0], id: 'loose-item', title: 'Ungeplanter Punkt', dayId: null }]
const officialEvaluations = party.flatMap((person, i) => credentialOptionsAus(person).flatMap((option) =>
  OFFICIAL_REQUIREMENT_TYPES.map((requirementType) => ({
    travellerClientRef: person.clientRef, credentialOptionRef: option.optionRef,
    destinationCountryCode: 'IT', transitCountryCode: null, requirementType,
    result: 'unknown', status: i === 0 ? 'insufficient_context' : 'unavailable',
    freshness: i === 0 ? 'never_checked' : 'provider_unavailable', officialClass: 'unknown',
    missingFacts: i === 0 ? ['document_type'] : [], visaMode: null,
    evidence: { provider: null, authority: null, sourceUrl: null, checkedAt: null, validFrom: null,
      validUntil: null, ruleReference: null, contextFingerprint: 'synthetic-navigation-audit' },
    action: null, temporalRule: null,
  })),
))
const payload = { reise, mitReadiness: true, officialEvaluations }
const browser = await chromium.launch({
  headless: true,
  ...(process.env.AUDIT_CHROME ? { executablePath: process.env.AUDIT_CHROME } : { channel: 'chrome' }),
})
const results = []
try {
  for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
    const errors = []
    const blocked = []
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url())
      if (url.origin !== new URL(base).origin || url.pathname.startsWith('/api/') || route.request().method() !== 'GET') {
        blocked.push(`${route.request().method()} ${url.origin}${url.pathname}`)
        return route.abort()
      }
      return route.continue()
    })
    await context.addInitScript((data) => {
      sessionStorage.setItem('jetnity:ui-audit:workspace', JSON.stringify(data))
      window.auditPushes = 0
      const push = history.pushState.bind(history)
      history.pushState = (...args) => { window.auditPushes++; return push(...args) }
    }, payload)
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    const mode = page.locator('[data-workspace-ansicht]')
    const modes = page.locator('[data-workspace-mode-nav]')
    const detail = page.locator('[data-workspace-detail]')
    const cases = []
    const state = async (ansicht, item = null) => {
      await page.waitForFunction(({ ansicht, item }) => {
        const root = document.querySelector('[data-workspace-ansicht]')
        const detail = document.querySelector('[data-workspace-detail]')
        return root?.getAttribute('data-workspace-ansicht') === ansicht &&
          (item ? detail?.getAttribute('data-detail-item') === item : !detail)
      }, { ansicht, item })
    }
    const safety = async () => {
      const actual = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        hiddenFocus: !!document.activeElement?.closest('[hidden], [inert]'),
        positiveTabindex: [...document.querySelectorAll('[tabindex]')].some((el) => el.tabIndex > 0),
      }))
      assert(actual.overflow <= 1, JSON.stringify(actual))
      assert.equal(actual.hiddenFocus, false)
      assert.equal(actual.positiveTabindex, false)
    }
    const goto = async (query = '') => {
      await page.goto(`${base}/ui-audit/trip-workspace${query}`, { waitUntil: 'networkidle' })
      await mode.waitFor()
    }
    const backButton = (name) => page.getByRole('button', { name, exact: true }).filter({ visible: true }).first()
    const count = () => page.evaluate(() => window.auditPushes)
    const remember = async (name) => { await safety(); cases.push(name) }

    for (const close of ['visible', 'browser', 'escape']) {
      await goto('?foreign=one&foreign=two#keep')
      const parent = page.url()
      const before = await count()
      await page.locator('[data-workspace-trip-parts]').getByRole('button', { name: 'Flüge', exact: true }).click()
      await detail.waitFor()
      assert.equal(await count(), before + 1)
      await backButton('Zur Übersicht').waitFor()
      if (close === 'visible') await backButton('Zur Übersicht').click()
      if (close === 'browser') await page.goBack()
      if (close === 'escape') await page.keyboard.press('Escape')
      await state('uebersicht')
      assert.equal(page.url(), parent)
      assert.equal(await count(), before + 1, 'popstate must not push')
      assert.equal(await page.locator('[data-workspace-modus-heading]').evaluate((el) => el === document.activeElement), true)
      await remember(`overview-gap-${close}`)
    }
    await goto('?ansicht=organisieren&bereich=fluege')
    await backButton('Zur Organisation').click()
    await state('organisieren')
    assert.equal(new URL(page.url()).search, '?ansicht=organisieren')
    await remember('direct-gap-parent')

    for (const close of ['visible', 'browser', 'escape']) {
      await goto('?ansicht=plan&tag=day-2&foreign=keep')
      const parent = page.url()
      const before = await count()
      const trigger = page.locator('[data-tagesplan-modul]').getByRole('button', { name: /Uffizien/ }).first()
      await trigger.click()
      await state('plan', 'item-2')
      assert.equal(new URL(page.url()).searchParams.get('tag'), 'day-2')
      assert.equal(await count(), before + 1)
      await backButton('Zum Tagesplan').waitFor()
      await safety()
      if (close === 'visible') await backButton('Zum Tagesplan').click()
      if (close === 'browser') await page.goBack()
      if (close === 'escape') await page.keyboard.press('Escape')
      await state('plan')
      assert.equal(page.url(), parent)
      assert.equal(await count(), before + 1)
      assert.equal(await trigger.evaluate((el) => el === document.activeElement), true, 'restore mounted source')
      await remember(`plan-item-${close}`)
      await page.goForward()
      await state('plan', 'item-2')
      assert.equal(await count(), before + 1)
      await remember(`plan-item-forward-${close}`)
    }
    await goto('?ansicht=plan&tag=day-1&punkt=item-2&foreign=keep')
    await state('plan', 'item-2')
    assert.equal(new URL(page.url()).searchParams.get('tag'), 'day-2')
    await page.screenshot({ path: join(evidence, `${viewport.width}-item.png`), fullPage: false })
    await backButton('Zum Tagesplan').click()
    await state('plan')
    assert.equal(new URL(page.url()).searchParams.get('tag'), 'day-2')
    assert.equal(await page.locator('[data-workspace-modus-heading]').evaluate((el) => el === document.activeElement), true)
    await remember('direct-item-correct-day-parent')
    await goto('?ansicht=plan&tag=day-1&punkt=loose-item')
    await state('plan', 'loose-item')
    assert.equal(new URL(page.url()).searchParams.has('tag'), false)
    await remember('unplanned-item-no-invented-day')
    await goto('?ansicht=plan&tag=day-2&punkt=deleted')
    await state('plan')
    assert.equal(new URL(page.url()).searchParams.get('tag'), 'day-2')
    assert.equal(new URL(page.url()).searchParams.has('punkt'), false)
    await remember('deleted-item-safe-parent')

    const section = (id) => page.locator(`details[data-preparation-section="${id}"]`)
    const focused = async (id, ref = null) => {
      await page.waitForFunction(({ id, ref }) => {
        const active = document.activeElement
        return active?.closest('[data-preparation-section]')?.getAttribute('data-preparation-section') === id &&
          (ref ? active.closest('[data-preparation-traveller]')?.getAttribute('data-preparation-traveller') === ref
            : active.hasAttribute('data-preparation-heading'))
      }, { id, ref })
      assert.equal(await section(id).getAttribute('open'), '')
      const box = await page.locator(':focus').boundingBox()
      assert(box && box.y >= 72 && box.y + box.height < viewport.height, JSON.stringify(box))
    }
    await goto('?ansicht=vorbereitung')
    assert.equal(await page.getByRole('button', { name: /^Vorbereitung (öffnen|schliessen)$/ }).count(), 0)
    await section('reisende-dokumente').locator('[data-preparation-heading]').focus()
    await page.keyboard.press('Enter')
    assert.equal(await section('reisende-dokumente').getAttribute('open'), null)
    for (const name of ['Reiseplan', 'Übersicht', 'Organisieren']) {
      await modes.getByRole('button', { name, exact: true }).click()
      await modes.getByRole('button', { name: 'Vorbereitung', exact: true }).click()
      assert.equal(await section('reisende-dokumente').getAttribute('open'), null)
    }
    await remember('immediate-preparation-preserves-collapse')
    await modes.getByRole('button', { name: 'Übersicht', exact: true }).click()
    const expand = page.getByRole('button', { name: /weitere Hinweisgruppen? anzeigen/ })
    if (await expand.count()) await expand.click()
    await page.locator('[data-attention-lage="insufficient_context"]').filter({ hasText: 'Offizielle' }).first().click()
    await focused('reisende-dokumente', refs[0])
    assert.equal(new URL(page.url()).searchParams.get('reisender'), refs[0])
    await remember('attention-exact-traveller-opens-collapsed-section')
    const saved = page.url()
    await page.reload({ waitUntil: 'networkidle' })
    await focused('reisende-dokumente', refs[0])
    assert.equal(page.url(), saved)
    await page.screenshot({ path: join(evidence, `${viewport.width}-preparation.png`), fullPage: false })
    const visibleText = await page.locator('body').innerText()
    for (const ref of refs) assert.equal(visibleText.includes(ref), false)
    await remember('saved-target-and-no-visible-raw-ref')
    await modes.getByRole('button', { name: 'Übersicht', exact: true }).click()
    if (await expand.count()) await expand.click()
    await page.locator('[data-attention-lage="unavailable"]').filter({ hasText: 'Offizielle' }).first().click()
    await focused('offizielle-anforderungen')
    assert.equal(new URL(page.url()).searchParams.get('reisender'), refs[1])
    await remember('unavailable-official-section-fallback')
    await goto('?ansicht=vorbereitung&vorbereitung=reisende-dokumente&reisender=stale')
    await focused('reisende-dokumente')
    assert.equal(new URL(page.url()).searchParams.has('reisender'), false)
    await remember('stale-traveller-section-only')
    const nav = page.getByRole('navigation', { name: 'Bereiche der Vorbereitung' })
    const link = nav.locator('a[href="#preparation-reisende-dokumente"]')
    for (let i = 0; i < 2; i++) {
      const before = await count()
      await link.focus()
      await page.keyboard.press('Enter')
      await focused('reisende-dokumente')
      assert.equal(await count(), before, 'repeat target must focus without duplicate history')
    }
    await remember('repeated-target-refocus')
    assert.deepEqual(errors, [])
    assert.deepEqual(blocked, [], 'no API/provider/mutation request should even be attempted')
    results.push({ viewport, cases, pageErrors: errors, blockedRequests: blocked })
    await context.close()
  }
  writeFileSync(join(evidence, 'result.json'), `${JSON.stringify({
    status: 'PASS', checkedAt: new Date().toISOString(),
    checkout: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    serverMode: process.env.AUDIT_SERVER_MODE || 'unspecified',
    scope: 'working-tree U02/U03; synthetic local audit, no production/data writes', results,
  }, null, 2)}\n`)
  console.log(`PASS: ${results.reduce((sum, run) => sum + run.cases.length, 0)} cases across 360/390/1440px`)
} finally {
  await browser.close()
}
