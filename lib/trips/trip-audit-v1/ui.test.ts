import assert from 'node:assert/strict'
import test from 'node:test'
import { chromium } from 'playwright'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

// Opt-in local browser evidence using the UNCHANGED existing audit route and
// real shared Workspace. This does not authenticate an account or qualify Auth.
// Run against a local dev server started with JETNITY_UI_AUDIT=true:
// TRIP_AUDIT_UI_URL=http://127.0.0.1:3465 node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/trip-audit-v1/ui.test.ts
test('T09: shared guest/account Workspace keyboard, pagination, 320px and 200% browser layout', {
  skip: !process.env.TRIP_AUDIT_UI_URL,
}, async () => {
  const url = new URL(process.env.TRIP_AUDIT_UI_URL!)
  assert(['localhost', '127.0.0.1'].includes(url.hostname), 'Synthetic browser fixture is local-only')
  assert.equal(url.protocol, 'http:')
  const browser = await chromium.launch({ headless: true })
  try {
    for (const quelle of ['guest', 'account'] as const) {
      const context = await browser.newContext({ viewport: { width: 320, height: 800 } })
      try {
        await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort())
        const reise = beispielreise()
        const base = reise.days[0].items[0]
        reise.days = [{ ...reise.days[0], items: Array.from({ length: 5 }, (_, i) => ({
          ...base, id: `synthetic-${i}`, title: `Planpunkt ${i}`, kind: 'transfer' as const,
          startsOn: '2026-09-12', endsOn: '2026-09-12', startsAt: '10:00', endsAt: '11:00',
          originPlaceId: 'airport:ZRH', destinationPlaceId: 'airport:ZRH', mobilityEvidence: 'user' as const,
        })) }]
        await context.addInitScript(data => sessionStorage.setItem('jetnity:ui-audit:workspace', JSON.stringify(data)), { reise, quelle })
        const page = await context.newPage()
        const errors: string[] = []
        page.on('pageerror', error => errors.push(error.name))
        await page.goto(`${url.origin}/ui-audit/trip-workspace`)
        const panel = page.getByRole('region', { name: 'Reise prüfen', exact: true })
        const trigger = panel.getByRole('button', { name: 'Reise prüfen', exact: true })
        await trigger.waitFor({ state: 'visible' })
        assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
        assert.equal(await panel.getByText('Nicht geprüft', { exact: true }).count(), 0)
        const requests: string[] = []
        page.on('request', request => { if (['fetch', 'xhr'].includes(request.resourceType())) requests.push(request.method()) })
        await trigger.focus()
        await page.keyboard.press('Enter')
        const close = panel.getByRole('button', { name: 'Prüfung schliessen', exact: true })
        assert.equal(await close.getAttribute('aria-expanded'), 'true')
        assert.equal(await close.evaluate(element => element === document.activeElement), true)
        assert(await close.evaluate(element => Number.parseFloat(getComputedStyle(element).outlineWidth) >= 2))
        assert((await close.boundingBox())!.height >= 44)
        await panel.getByText('Nicht geprüft', { exact: true }).waitFor({ state: 'visible' })
        assert(await panel.getByRole('heading', { name: 'Möglicher zeitlicher Konflikt', exact: true }).count() > 0)
        const total = await panel.getByText(/von \d+ ermittelten Befunden angezeigt/).innerText()
        assert.match(total, /^6 von /)
        const more = panel.getByRole('button', { name: 'Weitere anzeigen' })
        await more.click()
        assert.match(await panel.getByText(/von \d+ ermittelten Befunden angezeigt/).innerText(), /^12 von /)
        for (const zoom of [1, 2]) {
          await page.evaluate(factor => { document.documentElement.style.zoom = String(factor) }, zoom)
          assert.equal(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1), true)
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true)
        }
        await close.focus()
        await page.keyboard.press('Space')
        assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
        assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
        assert.deepEqual(requests, [], 'Opening, pagination and closing must not make API requests')
        assert.deepEqual(errors, [])
      } finally { await context.close() }
    }
  } finally { await browser.close() }
})
