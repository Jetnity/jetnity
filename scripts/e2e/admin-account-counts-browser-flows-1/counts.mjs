#!/usr/bin/env node
// Compare rendered Admin counts to the runtime's independent expectedCounts().

import { COUNT_VALUE_SELECTORS, PATHS, SELECTORS, UI_COPY, WINDOW_HOURS } from './constants.mjs'
import { parseAbsoluteHttpUrl, sameExactOrigin } from './contract.mjs'
import { WINDOW_US, parsePgTimestamptz } from './payload.mjs'

export function normalizeCount(value) {
  return String(value ?? '').replace(/\./g, '').replace(/\s/g, '').trim()
}

export function parseCountDelta(before, after) {
  const a = BigInt(normalizeCount(before))
  const b = BigInt(normalizeCount(after))
  return { presentDelta: b - a, asNumber: Number(b - a) }
}

export async function sectionPresent(page) {
  const title = page.locator(SELECTORS.countsTitle)
  const count = typeof title.count === 'function' ? await title.count() : 0
  return count > 0
}

export async function readRenderedCounts(page) {
  const present = await page.locator(COUNT_VALUE_SELECTORS.present).innerText()
  const recent = await page.locator(COUNT_VALUE_SELECTORS.window).innerText()
  return {
    present: normalizeCount(present),
    recent: normalizeCount(recent),
    presentLabel: present,
    recentLabel: recent,
  }
}

async function locatorCount(locator) {
  return typeof locator.count === 'function' ? await locator.count() : 0
}

export async function bothAggregatesUndisclosed(page) {
  for (const key of ['present', 'window']) {
    const locator = page.locator(COUNT_VALUE_SELECTORS[key])
    const count = await locatorCount(locator)
    if (count > 0) {
      const value = normalizeCount(await locator.first().innerText())
      if (value !== '') {
        throw new Error(`protected ${key} aggregate ${value} was disclosed`)
      }
    }
  }
}

function exactPath(url) {
  const parsed = parseAbsoluteHttpUrl(url)
  if (!parsed) return ''
  return parsed.pathname.replace(/\/+$/, '') || '/'
}

function hasReadyNavigation(page) {
  const nav = page.lastNavigation ?? page.lastResponse ?? null
  if (!nav) return { ok: false, reason: 'missing-navigation' }
  const status = typeof nav.status === 'function' ? nav.status() : nav.status
  if (typeof status !== 'number') return { ok: false, reason: 'missing-navigation' }
  if (status >= 400) return { ok: false, reason: `navigation-${status}` }
  return { ok: true, status }
}

function hasAdminShell(text) {
  return text.includes(UI_COPY.adminShellTitle) && text.includes(UI_COPY.adminShellKicker)
}

export async function classifyDenialUi(page, { expectedOrigin } = {}) {
  const url = typeof page.url === 'function' ? String(page.url()) : ''
  const text = await page.locator('body').innerText()
  const trimmed = String(text ?? '')
  const path = exactPath(url)
  const originOk = expectedOrigin ? sameExactOrigin(url, expectedOrigin) : Boolean(parseAbsoluteHttpUrl(url))
  const navigation = hasReadyNavigation(page)

  if (!originOk) {
    return { kind: 'wrong-origin', url, text: trimmed, path, navigation }
  }
  if (trimmed.includes(UI_COPY.failed) || /internal server error/i.test(trimmed)) {
    return { kind: 'failed', url, text: trimmed, path, navigation }
  }
  if (!trimmed.trim()) {
    return { kind: 'blank', url, text: trimmed, path, navigation }
  }

  if (path === PATHS.login) {
    if (!trimmed.includes(UI_COPY.login)) {
      return { kind: 'unknown', url, text: trimmed, path, navigation }
    }
    if (trimmed.includes(UI_COPY.ordinaryDenied)) {
      return { kind: 'login-denied', url, text: trimmed, path, navigation }
    }
    return { kind: 'login', url, text: trimmed, path, navigation }
  }

  if (path === PATHS.stepUp) {
    if (!trimmed.includes(UI_COPY.stepUp)) {
      return { kind: 'unknown', url, text: trimmed, path, navigation }
    }
    return { kind: 'step-up', url, text: trimmed, path, navigation }
  }

  if (path === PATHS.unauthorized) {
    return { kind: 'unauthorized', url, text: trimmed, path, navigation }
  }

  if (path === PATHS.admin) {
    if (trimmed.includes(UI_COPY.forbidden)) {
      return { kind: 'forbidden', url, text: trimmed, path, navigation }
    }
    if (trimmed.includes(UI_COPY.unavailable)) {
      return { kind: 'unavailable', url, text: trimmed, path, navigation }
    }
    const counts = await sectionPresent(page)
    if (hasAdminShell(trimmed) && !counts) {
      return { kind: 'disabled', url, text: trimmed, path, navigation }
    }
    return { kind: 'unknown', url, text: trimmed, path, navigation }
  }

  return { kind: 'unknown', url, text: trimmed, path, navigation }
}

export async function assertNoCountDisclosure(page, options = {}) {
  await bothAggregatesUndisclosed(page)
  const classified = await classifyDenialUi(page, { expectedOrigin: options.expectedOrigin })
  if (['failed', 'blank', 'unknown', 'wrong-origin'].includes(classified.kind)) {
    throw new Error(`generic ${classified.kind} page cannot become a denial PASS`)
  }
  if (classified.navigation && classified.navigation.ok === false) {
    throw new Error(`navigation was not a ready application response (${classified.navigation.reason})`)
  }

  let allowed
  if (options.expectKind) {
    allowed = Array.isArray(options.expectKind) ? options.expectKind : [options.expectKind]
  } else if (options.allowUnavailable) {
    allowed = ['unavailable']
  } else if (options.allowForbidden) {
    allowed = ['forbidden', 'login-denied', 'unauthorized', 'login']
  } else {
    allowed = ['step-up', 'login', 'login-denied', 'disabled']
  }

  if (!allowed.includes(classified.kind)) {
    throw new Error(`expected denial ${allowed.join('|')}, got ${classified.kind}`)
  }
  return classified
}

export async function readDisplayedTimestamps(page) {
  const times = page.locator(`${COUNT_VALUE_SELECTORS.section} time`)
  const timeCount = await locatorCount(times)
  if (timeCount < 2) {
    throw new Error('measured-at and window-start <time> stamps missing')
  }
  const first = typeof times.nth === 'function' ? times.nth(0) : times.first()
  const second = typeof times.nth === 'function' ? times.nth(1) : times.locator?.(':nth-of-type(2)') ?? times.first()
  const measuredAt =
    (typeof first.getAttribute === 'function' ? await first.getAttribute('dateTime') : null) ??
    (await first.innerText())
  const windowStart =
    (typeof second.getAttribute === 'function' ? await second.getAttribute('dateTime') : null) ??
    (await second.innerText())
  return { measuredAt: String(measuredAt ?? '').trim(), windowStart: String(windowStart ?? '').trim() }
}

export async function assertDisplayedTimestamps(page, expected = null) {
  const displayed = await readDisplayedTimestamps(page)
  const measured = parsePgTimestamptz(displayed.measuredAt)
  const windowStart = parsePgTimestamptz(displayed.windowStart)
  if (!measured || !windowStart) {
    throw new Error('displayed timestamps failed the accepted timestamptz contract')
  }
  if (windowStart.utcUs >= measured.utcUs) {
    throw new Error('displayed window_start is not before measured_at')
  }
  if (measured.utcUs - windowStart.utcUs !== WINDOW_US) {
    throw new Error('displayed window is not the exact 720h contract')
  }
  if (expected?.measuredAt && displayed.measuredAt !== expected.measuredAt) {
    throw new Error('displayed measured_at != independent expected')
  }
  if (expected?.windowStart && displayed.windowStart !== expected.windowStart) {
    throw new Error('displayed window_start != independent expected')
  }
  return displayed
}

export async function assertCountsMatchExpected(page, expected) {
  const rendered = await readRenderedCounts(page)
  const wantPresent = normalizeCount(expected.present)
  const wantRecent = normalizeCount(expected.recent)
  if (rendered.present !== wantPresent || rendered.recent !== wantRecent) {
    throw new Error(
      `rendered counts ${rendered.present}/${rendered.recent} != independent ${wantPresent}/${wantRecent}`,
    )
  }
  if (rendered.present === '0' && wantPresent !== '0') {
    throw new Error('fake zero rendered on a non-zero independent count')
  }
  return rendered
}

export async function assertDefinitionAndWindow(page, expected = null) {
  const text = await page.locator(COUNT_VALUE_SELECTORS.section).innerText()
  if (!text.includes(UI_COPY.countsTitle)) {
    throw new Error('count section title missing')
  }
  if (!text.includes(String(WINDOW_HOURS))) {
    throw new Error(`720h window presentation missing from ${text.slice(0, 180)}`)
  }
  if (!text.includes(UI_COPY.measuredLabel) || !text.includes(UI_COPY.windowStartLabel)) {
    throw new Error('measured-time / window-start presentation missing')
  }
  await assertDisplayedTimestamps(page, expected)
}

export async function assertUnavailableNotZero(page, options = {}) {
  const classified = await assertNoCountDisclosure(page, { expectKind: 'unavailable', ...options })
  if (classified.text.includes('0 accounts') || classified.text.includes('0 Konten')) {
    throw new Error('unavailable wrapper must not present 0 accounts')
  }
  return classified
}

export async function screenshotCountSection(page, filePath, timing = {}) {
  const section = page.locator(COUNT_VALUE_SELECTORS.section)
  if (timing.budget?.action) {
    await timing.budget.action('screenshot.wait', (timeoutMs) =>
      section.waitFor({ state: 'visible', timeout: timeoutMs }),
    )
    await timing.budget.action('screenshot.write', () =>
      section.screenshot({ path: filePath, animations: 'disabled' }),
    )
    return
  }
  await section.waitFor({ state: 'visible' })
  await section.screenshot({ path: filePath, animations: 'disabled' })
}

export async function assertNoHorizontalOverflow(page, viewport) {
  const box = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  if (box.scrollWidth > box.clientWidth + 1) {
    throw new Error(`horizontal overflow ${box.scrollWidth} > ${viewport.width}`)
  }
}
