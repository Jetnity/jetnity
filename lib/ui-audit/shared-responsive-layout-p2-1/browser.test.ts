import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import { chromium, type Page } from 'playwright'

const base = process.env.SHARED_LAYOUT_AUDIT_BASE
const output = process.env.SHARED_LAYOUT_AUDIT_OUTPUT
const storageKey = 'jetnity:ui-audit:workspace'
const fixture = {
  quelle: 'guest',
  reise: {
    id: 'synthetic-layout-trip', clientRef: 'synthetic-layout-trip',
    title: 'Synthetische QA-Reise Florenz–Rom', origin: 'Zürich',
    originPlaceId: 'geonames:2657896', startDate: '2026-09-12', endDate: '2026-09-16',
    travellers: 2, currency: 'CHF', budgetAmount: null, status: 'draft', pace: 'calm',
    interests: [], travelWish: null, revision: 1, lastMutationId: null, party: [], ohneTag: [],
    createdAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z',
    stages: [{ id: 'stage-layout-1', position: 1, name: 'Florenz', countryCode: 'IT',
      arrivalDate: '2026-09-12', departureDate: '2026-09-16',
      latitude: 43.77, longitude: 11.25, placeId: 'geonames:3176959' }],
    days: Array.from({ length: 5 }, (_, index) => ({
      id: `day-layout-${index + 1}`, stageId: 'stage-layout-1', dayIndex: index + 1,
      dayDate: `2026-09-${12 + index}`, title: null, items: [],
    })),
  },
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(Array.from(document.images, image => image.decode().catch(() => undefined)))
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
}

async function geometry(page: Page) {
  return page.evaluate(() => {
    const rect = (element: Element) => {
      const r = element.getBoundingClientRect()
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }
    }
    const details = (element: Element) => {
      const style = getComputedStyle(element)
      return { tag: element.tagName, label: element.getAttribute('aria-label') ?? element.textContent?.trim(),
        ...rect(element), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
        overflowX: style.overflowX, overflowY: style.overflowY, minWidth: style.minWidth,
        gridTemplateColumns: style.gridTemplateColumns, objectFit: style.objectFit,
        display: style.display, visibility: style.visibility, opacity: style.opacity }
    }
    const selectors = ['header.sticky', 'header.sticky > div', 'header a[aria-label="Jetnity Startseite"]',
      'header img', 'footer', 'footer > div > div:first-child', 'footer > div > div:first-child > div:first-child',
      'footer a[aria-label="Jetnity Startseite"]', 'footer img', 'footer a[href^="mailto:"]',
      'footer a[href="/privacy"]', 'section[aria-label="Jetzt wichtig"]',
      'section[aria-label="Jetzt wichtig"] ul', 'section[aria-label="Jetzt wichtig"] ul > li',
      'section[aria-label="Jetzt wichtig"] ul > li button']
    const boxes = Object.fromEntries(selectors.map(selector => {
      const element = document.querySelector(selector)
      return [selector, element ? details(element) : null]
    }))
    const violations: string[] = []
    const width = document.documentElement.clientWidth
    if (document.documentElement.scrollWidth > width + 1) violations.push('document overflows')
    for (const selector of ['html', 'body', 'header.sticky', 'footer']) {
      if (['hidden', 'clip'].includes(getComputedStyle(document.querySelector(selector)!).overflowX)) {
        violations.push(`${selector} masks overflow`)
      }
    }
    const regions = document.querySelectorAll('header.sticky, footer, section[aria-label="Jetzt wichtig"]')
    for (const region of regions) {
      for (const element of region.querySelectorAll('a, button, img, strong, h2, h3, p, [data-attention-punkt]')) {
        if (!(element instanceof HTMLElement || element instanceof SVGElement)) continue
        if (!element.getClientRects().length || element.closest('[hidden], [inert]')) continue
        const r = rect(element)
        const name = element.getAttribute('aria-label') ?? element.textContent?.trim() ?? element.tagName
        if (r.left < -1 || r.right > width + 1) violations.push(`${name}: outside viewport`)
        if (element.matches('a, button')) {
          // CSS-zoom bounding boxes are scaled; target requirements use layout CSS px.
          const css = getComputedStyle(element)
          if (parseFloat(css.height) < 43.9 || parseFloat(css.width) < 43.9) violations.push(`${name}: target below 44px`)
        }
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent)
          const p = rect(parent)
          if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && (r.left < p.left - 1 || r.right > p.right + 1)) {
            violations.push(`${name}: clipped horizontally by ${parent.tagName}`)
          }
        }
      }
      // Inspect actual text fragments as well as element boxes: break-words can fit a box while its text overruns.
      const walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        const parent = node.parentElement
        if (!parent || !node.textContent?.trim() || parent.closest('[hidden], [inert], .sr-only')) continue
        if (!parent.getClientRects().length || getComputedStyle(parent).visibility === 'hidden') continue
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const r of range.getClientRects()) {
          if (r.left < -1 || r.right > width + 1) violations.push(`${node.textContent.trim()}: text outside viewport`)
          for (let ancestor: HTMLElement | null = parent; ancestor; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor)
            const a = rect(ancestor)
            if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && (r.left < a.left - 1 || r.right > a.right + 1)) {
              violations.push(`${node.textContent.trim()}: clipped text`)
            }
          }
        }
      }
    }
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('header img, footer img'), img => ({
      ...rect(img), complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
      objectFit: getComputedStyle(img).objectFit, filter: getComputedStyle(img).filter,
    }))
    for (const img of images) {
      if (!img.complete || img.naturalWidth !== 384 || img.naturalHeight !== 128) violations.push('logo not decoded')
      if (Math.abs(img.width / img.height - 3) > 0.02 && img.objectFit !== 'contain') violations.push('logo artwork distorted')
      if (Math.min(img.width, img.height * 3) < 80) violations.push('logo artwork unreadably small')
    }
    return { document: { scrollWidth: document.documentElement.scrollWidth, clientWidth: width },
      pointer: { coarse: matchMedia('(pointer: coarse)').matches, fine: matchMedia('(pointer: fine)').matches, touchPoints: navigator.maxTouchPoints },
      zoom: getComputedStyle(document.documentElement).zoom, boxes, images,
      footerLinks: Array.from(document.querySelectorAll('footer a'), a => ({ href: a.getAttribute('href'), text: a.textContent?.trim() })),
      violations: [...new Set(violations)] }
  })
}

test('shared responsive layout: real Guest Workspace, CSS zoom, text, targets and menu', {
  skip: !base ? 'NOT VERIFIED: set SHARED_LAYOUT_AUDIT_BASE to an explicitly enabled loopback UI-audit server' : false,
  timeout: 180_000,
}, async () => {
  const url = new URL(base!)
  assert.equal(url.protocol, 'http:')
  assert.equal(url.hostname, '127.0.0.1', 'synthetic audit is loopback only')
  assert.equal(url.pathname, '/')
  assert.equal(url.search + url.hash + url.username + url.password, '')
  if (output) await mkdir(output, { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome', headless: true, chromiumSandbox: true })
  const failures: string[] = []
  const records: unknown[] = []
  const expectedLinks = ['/', '/planen', '/reisen', '/entdecken', '/#pro', 'mailto:info@jetnity.ch', '/privacy', '/terms', '/impressum', 'https://www.geonames.org/']
  try {
    for (const width of [320, 360, 375, 390, 768, 1024, 1280]) {
      for (const zoom of [1, 2]) {
        const context = await browser.newContext({ viewport: { width, height: 800 }, hasTouch: true,
          deviceScaleFactor: 1, locale: 'de-CH', timezoneId: 'Europe/Zurich', serviceWorkers: 'block' })
        try {
          const errors: string[] = []
          await context.route('**/*', async route => {
            const request = route.request(), target = new URL(request.url())
            if (target.origin !== url.origin || target.pathname.startsWith('/api/') || request.method() !== 'GET') {
              errors.push(`forbidden request: ${request.method()} ${target.origin}${target.pathname}`)
              await route.abort()
            } else await route.continue()
          })
          await context.addInitScript(({ key, value }) => sessionStorage.setItem(key, value), { key: storageKey, value: JSON.stringify(fixture) })
          // tsx names nested functions with this identity helper when serializing evaluate callbacks.
          await context.addInitScript('globalThis.__name = (fn) => fn')
          const page = await context.newPage()
          page.on('pageerror', error => errors.push(error.message))
          page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
          const response = await page.goto(`${url.origin}/ui-audit/trip-workspace`, { waitUntil: 'networkidle' })
          assert.equal(response?.status(), 200)
          await page.locator('main[data-workspace-premium]').waitFor()
          await page.evaluate(value => { document.documentElement.style.zoom = String(value) }, zoom)
          await settle(page)
          const label = `${width}-zoom${zoom}`
          const closed = await geometry(page)
          failures.push(...closed.violations.map(v => `${label}: ${v}`))
          assert.deepEqual([...closed.footerLinks.map(link => link.href)].sort(), [...expectedLinks].sort())
          const menu = page.locator('button[aria-controls="oeffentliche-mobile-navigation"]')
          const menuEvidence: Record<string, unknown> = {}
          if (await menu.isVisible()) {
            // Reach the actual trigger via Tab; Enter/Space and Escape use native keyboard events.
            await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }) })
            for (let i = 0; i < 20 && !(await menu.evaluate(e => e === document.activeElement)); i++) await page.keyboard.press('Tab')
            assert.equal(await menu.evaluate(e => e === document.activeElement), true, 'menu reachable with Tab')
            menuEvidence.focus = await menu.evaluate(e => ({ visible: e.matches(':focus-visible'), shadow: getComputedStyle(e).boxShadow }))
            assert.equal((menuEvidence.focus as { visible: boolean }).visible, true)
            assert.notEqual((menuEvidence.focus as { shadow: string }).shadow, 'none')
            await page.keyboard.press('Enter')
            assert.equal(await menu.getAttribute('aria-expanded'), 'true')
            const open = await geometry(page)
            failures.push(...open.violations.map(v => `${label} open: ${v}`))
            menuEvidence.open = open
            const nav = page.locator('#oeffentliche-mobile-navigation')
            for (const link of await nav.locator('a').all()) {
              await link.scrollIntoViewIfNeeded()
              const hit = await link.evaluate(e => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) })
              if (!hit) failures.push(`${label}: mobile link not reachable`)
            }
            await page.keyboard.press('Escape')
            assert.equal(await menu.getAttribute('aria-expanded'), 'false')
            assert.equal(await menu.evaluate(e => e === document.activeElement), true)
            await page.keyboard.press('Space')
            assert.equal(await menu.getAttribute('aria-expanded'), 'true')
            await page.keyboard.press('Space')
            assert.equal(await menu.getAttribute('aria-expanded'), 'false')
          }
          // Check reachable hit areas and visible focus without following external/legal links.
          const targets = []
          for (const target of await page.locator('footer a, section[aria-label="Jetzt wichtig"] button').all()) {
            // A sticky header can cover a target that is technically inside the viewport.
            await target.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' }))
            await target.evaluate(e => (e as HTMLElement).focus({ preventScroll: true }))
            await settle(page)
            const targetEvidence = await target.evaluate(e => {
              const r = e.getBoundingClientRect()
              const headerBottom = document.querySelector('header.sticky')!.getBoundingClientRect().bottom
              const top = Math.max(r.top, headerBottom), bottom = Math.min(r.bottom, innerHeight)
              const x = (r.left + r.right) / 2, y = (top + bottom) / 2
              const shadow = getComputedStyle(e).boxShadow
              const hit = document.elementFromPoint(x, y)
              return { text: e.textContent?.trim(), hit: hit?.tagName, hitLabel: hit?.getAttribute('aria-label'),
                reachable: bottom > top && e.contains(hit), focusVisible: e.matches(':focus-visible'), shadow }
            })
            targets.push(targetEvidence)
            if (!targetEvidence.reachable || !targetEvidence.focusVisible || targetEvidence.shadow === 'none') {
              failures.push(`${label}: unreachable or unfocused target ${JSON.stringify(targetEvidence)}`)
            }
          }
          // Long translation/contact stress changes text only, never dimensions or overflow rules.
          const originalCopy = await page.evaluate(() => {
            const privacy = document.querySelector('footer a[href="/privacy"]')!
            const mail = document.querySelector('footer a[href^="mailto:"]')!
            const text = Array.from(mail.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
            const mailText = text ?? mail.querySelector('span')!
            const original = { privacy: privacy.textContent, mail: mailText.textContent }
            privacy.textContent = 'DatenschutzerklärungMitZusätzlichenInformationen'
            mailText.textContent = 'synthetischer.layoutkontakt@example.invalid'
            return original
          })
          await settle(page)
          const longText = await geometry(page)
          failures.push(...longText.violations.map(v => `${label} long: ${v}`))
          assert.deepEqual(longText.pointer, closed.pointer, 'input emulation remains stable throughout interaction checks')
          assert.equal(closed.pointer.coarse, true, '44px assertions run with a coarse pointer')
          assert.equal(await page.evaluate(key => sessionStorage.getItem(key), storageKey), JSON.stringify(fixture))
          assert.equal((await context.cookies()).length, 0)
          failures.push(...errors.map(error => `${label}: ${error}`))
          records.push({ width, zoom, closed, menu: menuEvidence, targets, longText, errors })
          // Restore only the synthetic text, keeping the measured context and input emulation intact.
          if (output && width === 320 && zoom === 2) {
            await page.evaluate(copy => {
              document.querySelector('footer a[href="/privacy"]')!.textContent = copy.privacy
              const mail = document.querySelector('footer a[href^="mailto:"]')!
              const text = Array.from(mail.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
              ;(text ?? mail.querySelector('span')!).textContent = copy.mail
              window.scrollTo({ top: 0, behavior: 'instant' })
            }, originalCopy)
            await settle(page)
            const cdp = await context.newCDPSession(page)
            const shots = [
              ['navbar', 'header.sticky'],
              ['attention-flight', 'section[aria-label="Jetzt wichtig"] ul > li:nth-child(1)'],
              ['attention-stay', 'section[aria-label="Jetzt wichtig"] ul > li:nth-child(2)'],
              ['attention-person', 'section[aria-label="Jetzt wichtig"] ul > li:nth-child(3)'],
              ['footer-brand', 'footer a[aria-label="Jetnity Startseite"]'],
              ['footer-contact', 'footer a[href^="mailto:"]'],
              ['footer-legal', 'footer a[href="/privacy"]'],
            ]
            for (const [name, selector] of shots) {
              await page.evaluate(selector => {
                const r = document.querySelector(selector)!.getBoundingClientRect()
                const headerHeight = document.querySelector('header.sticky')!.getBoundingClientRect().height
                window.scrollTo({ top: selector === 'header.sticky' ? 0 : scrollY + r.top - headerHeight - 16, behavior: 'instant' })
              }, selector)
              await settle(page)
              // captureBeyondViewport resets pointer media in host Chrome 155; actual viewport captures preserve it.
              const capture = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
              await writeFile(join(output, `${label}-${name}.png`), Buffer.from(capture.data, 'base64'))
              assert.deepEqual((await geometry(page)).pointer, closed.pointer, 'screenshot preserves coarse-pointer emulation')
            }
            await cdp.detach()
          }
        } finally { await context.close() }
      }
    }
  } finally {
    const report = { date: new Date().toISOString(), browser: browser.version(), method: 'CSS zoom; synthetic Guest; no real account; no native zoom/device claim', records, failures }
    if (output) await writeFile(join(output, 'measurements.json'), JSON.stringify(report, null, 2) + '\n')
    await browser.close()
  }
  assert.deepEqual(failures, [])
})
