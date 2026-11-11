import assert from 'node:assert/strict'
import { chromium, webkit, devices } from 'playwright'

// Run against a local production build. The iframe fixture has no hotel offers;
// real inventory, filters and partner handoff are verified separately.
const base = new URL(process.argv[2] || 'http://127.0.0.1:3970').origin
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Use a local test server')
const date = days => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
const trip = {
  id: 'trip-stay22-browser', clientRef: 'trip-stay22-browser', title: 'Hotelprüfung', origin: 'Zürich', originPlaceId: null,
  startDate: date(10), endDate: date(14), travellers: 2, currency: 'CHF', budgetAmount: null,
  status: 'draft', pace: 'calm', interests: [], travelWish: null, revision: 1, lastMutationId: null,
  stages: [{ id: 'bkk', position: 1, name: 'Bangkok', placeId: 'geonames:1609350', countryCode: 'TH', arrivalDate: date(10), departureDate: date(14), latitude: 13.75, longitude: 100.52 }],
  days: [{ id: 'day1', stageId: 'bkk', dayIndex: 1, dayDate: date(10), title: null, items: [] }],
  ohneTag: [], party: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}
trip.stages.push({ ...trip.stages[0], id: 'near', position: 2, name: 'Wat Pho', placeId: null, latitude: 13.7466, longitude: 100.4933, arrivalDate: null, departureDate: null }, { ...trip.stages[0], id: 'far', position: 3, name: 'Ko Chang', placeId: 'geonames:1611309', latitude: 12.05, longitude: 102.32, arrivalDate: date(14), departureDate: date(18) })
const target = `${base}/reisen/${trip.id}?ansicht=organisieren&kategorie=unterkunft`
const storageKey = 'jetnity:reise:v3'
const original = JSON.stringify(trip)

for (const [engine, options, label] of [
  [chromium, { viewport: { width: 1440, height: 1000 } }, 'Desktop Chromium'],
  [chromium, devices['iPhone 13'], 'Mobile Chromium'],
  [webkit, devices['iPhone 13'], 'iPhone WebKit'],
  [chromium, { ...devices['iPhone SE'], viewport: { width: 320, height: 568 } }, 'Small mobile Chromium'],
]) {
  if (process.env.STAY22_BROWSER_CASE && process.env.STAY22_BROWSER_CASE !== label) continue
  const browser = await engine.launch()
  try {
    const context = await browser.newContext({ ...options, locale: 'de-CH' })
    await context.addInitScript(({ storageKey, original }) => localStorage.setItem(storageKey, original), { storageKey, original })
    const page = await context.newPage()
    page.setDefaultTimeout(15000)
    const calls = []
    await page.route('https://www.stay22.com/**', route => {
      calls.push(new URL(route.request().url()))
      return route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html lang="de"><meta charset="utf-8"><title>Kontrollierter Rahmen</title><body style="margin:0"><p style="margin:70px 12px">Keine Testangebote</p><button style="position:fixed;top:10px;right:10px;min-height:44px" onclick="this.textContent=\'Filter geöffnet\'">Filter prüfen</button><button style="position:fixed;bottom:10px;right:10px;min-height:44px" onclick="this.textContent=\'Karte geöffnet\'">Karte prüfen</button></body></html>' })
    })
    await page.route('**/api/search/places?**', route => route.fulfill({ contentType: 'application/json', body: '[]' }))
    await page.goto(target, { waitUntil: 'domcontentloaded' })
    const search = page.locator('form.stay22-search')
    await search.waitFor()
    const submit = search.getByRole('button', { name: 'Suchen', exact: true })
    const frame = page.locator('iframe.stay22-frame')
    const absent = async () => { assert.equal(await frame.count(), 0) }
    assert.equal(calls.length, 0, 'no provider request before explicit search')
    await search.screenshot({ path: `/tmp/stay22-form-${label.replaceAll(' ', '-')}.png` })
    const stagebar = page.getByRole('group', { name: 'Aufenthalt wählen' })
    await search.getByRole('combobox', { name: 'Hotelsterne', exact: true }).selectOption('4')
    await search.getByRole('combobox', { name: 'Gästebewertung', exact: true }).selectOption('8')
    await search.getByLabel('Anreise', { exact: true }).fill(date(11))
    await stagebar.getByRole('button', { name: /Ko Chang/ }).click()
    assert.equal(await search.getByLabel('Anreise', { exact: true }).inputValue(), date(14))
    assert.equal(await search.getByRole('combobox', { name: 'Hotelsterne', exact: true }).inputValue(), '0')
    await stagebar.getByRole('button', { name: /Bangkok/ }).click()
    assert.equal(await search.getByLabel('Anreise', { exact: true }).inputValue(), date(11))
    assert.equal(await search.getByRole('combobox', { name: 'Hotelsterne', exact: true }).inputValue(), '4')
    await search.getByRole('button', { name: 'Reisedaten übernehmen', exact: true }).click()
    await search.getByRole('button', { name: 'Filter zurücksetzen', exact: true }).click()
    assert.equal(calls.length, 0)
    await stagebar.getByRole('button', { name: /Ko Chang/ }).click()
    await page.getByText('Alle Reiseziele ansehen', { exact: true }).click()
    await page.locator('.org-stages').getByRole('button', { name: /Bangkok/ }).click()
    assert.equal(await search.getByRole('combobox', { name: 'Reiseziel', exact: true }).inputValue(), 'bkk', 'external card selection can return to initial stage')
    await search.getByLabel('Abreise', { exact: true }).fill(date(10))
    await submit.click()
    await search.getByRole('alert').waitFor()
    assert.equal(await search.getByLabel('Abreise', { exact: true }).getAttribute('aria-invalid'), 'true')
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('name')), 'abreise')
    await absent()
    await search.getByLabel('Abreise', { exact: true }).fill(date(14))
    await search.getByRole('button', { name: /Gäste/ }).click()
    await search.getByRole('combobox', { name: 'Kinder', exact: true }).selectOption('1')
    await search.getByRole('combobox', { name: 'Zimmer', exact: true }).selectOption('2')
    await submit.click()
    await page.locator('[data-stay22-phase="rahmen"]').waitFor()
    assert.equal(calls.length, 1)
    for (const [key, value] of Object.entries({ checkin: date(10), checkout: date(14), children: '1', adults: '2', rooms: '2', aid: 'jetnity', priceper: 'total' })) assert.equal(calls[0].searchParams.get(key), value)
    assert.match(await frame.getAttribute('sandbox'), /allow-popups-to-escape-sandbox/)
    const content = page.frameLocator('iframe.stay22-frame')
    await content.getByRole('button', { name: 'Filter prüfen', exact: true }).waitFor()
    // Align the frame between the persistent bars, as with an outer-page scroll.
    // Click actual screen coordinates: locator.click would scroll the parent
    // again for a fixed-position control inside a cross-origin frame.
    await page.waitForFunction(() => {
      const frame = document.querySelector('iframe.stay22-frame')
      const header = document.querySelector('.workspace-header')
      if (!frame || !header) return false
      const top = getComputedStyle(header).position === 'sticky' ? header.getBoundingClientRect().bottom : 0
      const distance = frame.getBoundingClientRect().top - top - 20
      if (Math.abs(distance) < 2) return true
      // Safari applies scrolling/viewport updates asynchronously. Remeasure
      // before the next scroll instead of clicking at an old screen position.
      window.scrollBy(0, distance)
      return false
    })
    for (const [before, after] of [['Filter prüfen', 'Filter geöffnet'], ['Karte prüfen', 'Karte geöffnet']]) {
      const button = content.getByRole('button', { name: before, exact: true })
      await button.waitFor()
      const box = await button.boundingBox()
      assert.ok(box)
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      const unobscured = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.matches('iframe.stay22-frame'), point)
      assert.equal(unobscured, true, `${label}: ${before} is not obscured`)
      await page.mouse.click(point.x, point.y)
      await content.getByRole('button', { name: after, exact: true }).waitFor()
    }
    await frame.evaluate(el => { el.dataset.stay22Test = 'same-frame' })
    const beforeExpand = calls.length
    await page.getByRole('button', { name: 'Vergrössern', exact: true }).click()
    const modal = page.getByRole('dialog', { name: 'Hotelkarte und Ergebnisliste' })
    await modal.waitFor()
    assert.equal(await modal.evaluate(el => el.matches(':modal')), true)
    assert.equal(await frame.getAttribute('data-stay22-test'), 'same-frame')
    await page.keyboard.press('Escape')
    await page.getByRole('region', { name: 'Hotelkarte und Ergebnisliste' }).waitFor()
    assert.equal(await frame.getAttribute('data-stay22-test'), 'same-frame')
    assert.equal(calls.length, beforeExpand, 'enlargement and close preserve supplier frame')
    assert.equal(await page.getByRole('button', { name: 'Vergrössern', exact: true }).evaluate(el => el === document.activeElement), true)
    await submit.click()
    await page.waitForFunction(() => document.querySelector('[data-stay22-phase="rahmen"]'))
    assert.equal(calls.length, 2, 'same search opens a new provider frame')
    await search.getByLabel('Anreise', { exact: true }).fill(date(11))
    await absent()
    await submit.click()
    await page.locator('[data-stay22-phase="rahmen"]').waitFor()
    await page.getByRole('button', { name: 'Ausblenden', exact: true }).click()
    await absent()
    await submit.click()
    await page.locator('[data-stay22-phase="rahmen"]').waitFor()
    await page.getByRole('tab', { name: 'Flüge', exact: true }).click()
    await absent()
    await page.getByRole('tab', { name: 'Unterkunft', exact: true }).click()
    await absent()
    await search.getByRole('combobox', { name: 'Reiseziel', exact: true }).selectOption('anderer-ort')
    await search.getByLabel('Anreise', { exact: true }).fill(date(10))
    await search.getByLabel('Abreise', { exact: true }).fill(date(14))
    await search.getByLabel('Stadt, Insel oder Region').fill('unbestätigter Ort')
    await submit.click()
    await search.getByRole('alert').waitFor()
    assert.equal(await search.getByLabel('Stadt, Insel oder Region').getAttribute('aria-invalid'), 'true')
    await absent()
    await search.getByRole('combobox', { name: 'Reiseziel', exact: true }).selectOption('bkk')
    await submit.click()
    await page.locator('[data-stay22-phase="rahmen"]').waitFor()
    // Documented filters, plan POIs and view switching use the same search.
    await search.getByRole('combobox', { name: 'Hotelsterne', exact: true }).selectOption('4')
    await absent()
    await search.getByRole('combobox', { name: 'Gästebewertung', exact: true }).selectOption('8')
    await search.getByRole('combobox', { name: 'Preisanzeige', exact: true }).selectOption('nightly')
    await search.getByRole('combobox', { name: 'Suchumgebung', exact: true }).selectOption('etappe:near')
    await submit.click()
    await page.locator('[data-stay22-phase="rahmen"]').waitFor()
    const near = calls.at(-1)
    assert.equal(near.searchParams.get('lat'), '13.7466')
    assert.equal(near.searchParams.get('minstarrating'), '4')
    assert.equal(near.searchParams.get('minguestrating'), '8')
    assert.equal(near.searchParams.get('priceper'), 'nightly')
    assert.ok(JSON.parse(near.searchParams.get('poi')).length >= 2)
    assert.equal(near.href.includes(trip.id), false)
    const views = page.getByRole('group', { name: 'Ergebnisansicht' })
    for (const [name, mode] of [['Karte', 'map'], ['Liste', 'listview'], ['Karte & Liste', 'all']]) {
      await views.getByRole('button', { name, exact: true }).click()
      await page.waitForFunction(mode => new URL(document.querySelector('iframe.stay22-frame').src).searchParams.get('viewmode') === mode, mode)
      await page.locator('[data-stay22-phase="rahmen"]').waitFor()
      assert.equal(calls.at(-1).searchParams.get('viewmode'), mode)
      for (const key of ['checkin','checkout','lat','lng','poi','minstarrating','minguestrating']) assert.equal(calls.at(-1).searchParams.get(key), near.searchParams.get(key))
    }
    await search.getByRole('combobox', { name: 'Suchumgebung', exact: true }).selectOption('text')
    await search.getByLabel('Ort in Bangkok', { exact: true }).fill('Hauptbahnhof')
    await submit.click()
    await page.locator('[data-stay22-phase="rahmen"]').waitFor()
    assert.match(calls.at(-1).searchParams.get('address'), /^Hauptbahnhof, Bangkok/)
    assert.equal(calls.at(-1).searchParams.has('lat'), false, 'explicit text is geocoded by supplier, no invented coordinates')
    await search.getByLabel('Reiseorte auf der Karte zeigen', { exact: true }).uncheck()
    await submit.click()
    await page.locator('[data-stay22-phase="rahmen"]').waitFor()
    assert.equal(calls.at(-1).searchParams.has('poi'), false)
    // Actual itinerary entry and browser back use the context, no provider request on navigation.
    const beforeNav = calls.length
    await page.goto(`${base}/reisen/${trip.id}?ansicht=plan&tag=day1`, { waitUntil: 'domcontentloaded' })
    await page.locator('.et-tabs').getByRole('button', { name: 'Übersicht', exact: true }).click()
    await page.getByRole('combobox', { name: 'Unterkunft nahe einem Reiseort', exact: true }).selectOption('etappe:near')
    await search.waitFor()
    assert.equal(await search.getByRole('combobox', { name: 'Suchumgebung', exact: true }).inputValue(), 'etappe:near')
    assert.equal(await search.getByLabel('Anreise', { exact: true }).inputValue(), date(10))
    assert.equal(calls.length, beforeNav)
    await page.goBack()
    await page.locator('.et-tabs').getByRole('button', { name: 'Übersicht', exact: true }).click()
    await page.getByRole('combobox', { name: 'Unterkunft nahe einem Reiseort', exact: true }).waitFor()
    await page.goForward()
    await search.waitFor()
    await submit.click()
    await page.locator('[data-stay22-phase="rahmen"]').waitFor()
    if (label === 'Desktop Chromium') {
      // Controlled first-party response: exercise a delayed confirmation, not a real city lookup.
      await page.route('**/api/search/places?**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ id: 'geonames:2988507', label: 'Paris', description: 'Frankreich', typ: 'city' }]) }))
      let release, received
      const gate = new Promise(resolve => { release = resolve })
      const requested = new Promise(resolve => { received = resolve })
      let hold = true
      await page.route(`${base}/reisen/**`, async route => {
        if (route.request().method() !== 'POST' || !route.request().headers()['next-action']) return route.continue()
        received()
        if (hold) await gate
        return route.fulfill({ contentType: 'text/x-component', body: '0:' + JSON.stringify({ a: { ok: true, wert: { id: 'geonames:2988507', name: 'Paris', region: 'Île-de-France', country: 'Frankreich', lat: 48.8534, lon: 2.3488, typ: 'city' } }, f: null }) + '\n' })
      })
      await search.getByRole('combobox', { name: 'Reiseziel', exact: true }).selectOption('anderer-ort')
      await search.getByLabel('Stadt, Insel oder Region').fill('Paris')
      await page.getByRole('option', { name: /Paris/ }).click()
      await requested
      assert.equal(await submit.isDisabled(), true)
      await stagebar.getByRole('button', { name: /Bangkok/ }).click()
      hold = false; release()
      await search.getByRole('combobox', { name: 'Reiseziel', exact: true }).selectOption('anderer-ort')
      assert.equal(await search.getByLabel('Stadt, Insel oder Region').inputValue(), '', 'unfinished selection is not retained')
      await search.getByLabel('Anreise', { exact: true }).fill(date(10))
      await search.getByLabel('Abreise', { exact: true }).fill(date(14))
      await search.getByLabel('Stadt, Insel oder Region').fill('Paris')
      await page.getByRole('option', { name: /Paris/ }).click()
      await page.waitForFunction(() => !document.querySelector('form.stay22-search button[type=submit]').disabled)
      await submit.click()
      await page.locator('[data-stay22-phase="rahmen"]').waitFor()
      assert.equal(calls.at(-1).searchParams.get('lat'), '48.8534')
      assert.equal(calls.at(-1).searchParams.get('lng'), '2.3488')
      assert.match(calls.at(-1).searchParams.get('address'), /^Paris, Île-de-France, Frankreich$/)
      await stagebar.getByRole('button', { name: /Bangkok/ }).click()
      await search.getByRole('combobox', { name: 'Reiseziel', exact: true }).selectOption('anderer-ort')
      assert.equal(await search.getByLabel('Stadt, Insel oder Region').inputValue(), 'Paris', 'confirmed selection is retained')
      await submit.click()
      await page.locator('[data-stay22-phase="rahmen"]').waitFor()
    }
    const beforeRefusal = calls.length
    await page.evaluate(() => {
      window.PrivacyBee = { getAllConsents: () => ({ SECURITY_STORAGE: true, FUNCTIONALITY_STORAGE: true, ANALYTICS_STORAGE: false, AD_STORAGE: false, AD_USER_DATA: false, AD_PERSONALIZATION: false, PERSONALIZATION_STORAGE: false }), getConsent: () => false, hasExplicitConsent: () => true }
      document.dispatchEvent(new Event('privacybee:consent-changed'))
    })
    await page.locator('[data-stay22-phase="datenschutz"]').waitFor()
    await absent()
    await submit.click()
    await page.locator('[data-stay22-phase="datenschutz"]').waitFor()
    assert.equal(calls.length, beforeRefusal)
    await page.evaluate(() => { delete window.PrivacyBee })
    await page.getByRole('button', { name: 'Erneut laden', exact: true }).click()
    await absent()
    assert.equal(calls.length, beforeRefusal, 'missing previously observed CMP stays closed')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
    assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), original, 'search does not mutate trip')
    console.log(`${label}: validation, stage drafts and card return, POIs, views, modal preservation/focus, itinerary handoff/back, consent and unchanged graph passed${label === 'Desktop Chromium' ? '; delayed city confirmation and recovery passed' : ''}`)
  } finally { await browser.close() }
}
