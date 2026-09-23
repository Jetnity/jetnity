#!/usr/bin/env node
// Compare rendered Admin counts to the runtime's independent expectedCounts().

import { COUNT_VALUE_SELECTORS, SELECTORS, UI_COPY, WINDOW_HOURS } from './constants.mjs'

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

export async function assertDefinitionAndWindow(page) {
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
  const times = page.locator(`${COUNT_VALUE_SELECTORS.section} time`)
  const timeCount = typeof times.count === 'function' ? await times.count() : 0
  if (timeCount < 2) {
    throw new Error('measured-at and window-start <time> stamps missing')
  }
}

export async function assertNoCountDisclosure(page, { allowForbidden = false, allowUnavailable = false } = {}) {
  const presentValues = page.locator(COUNT_VALUE_SELECTORS.present)
  const presentCount = typeof presentValues.count === 'function' ? await presentValues.count() : 0
  if (presentCount > 0) {
    const value = normalizeCount(await presentValues.first().innerText())
    throw new Error(`protected aggregate ${value} was disclosed`)
  }
  const text = await page.locator('body').innerText()
  if (text.includes(UI_COPY.failed)) {
    throw new Error('generic failed count load cannot become a denial PASS')
  }
  if (allowForbidden && text.includes(UI_COPY.forbidden)) return { kind: 'forbidden' }
  if (allowUnavailable && text.includes(UI_COPY.unavailable)) {
    if (/\b0\b/.test(UI_COPY.unavailable)) {
      throw new Error('unavailable copy must not be a zero statistic')
    }
    return { kind: 'unavailable' }
  }
  if (await sectionPresent(page) && !allowForbidden && !allowUnavailable) {
    throw new Error('counts section rendered without an allowed denial state')
  }
  return { kind: 'absent' }
}

export async function assertUnavailableNotZero(page) {
  const text = await page.locator('body').innerText()
  if (!text.includes(UI_COPY.unavailable)) {
    throw new Error('missing wrapper did not render the honest unavailable state')
  }
  if (text.includes('0 accounts') || text.includes('0 Konten')) {
    throw new Error('unavailable wrapper must not present 0 accounts')
  }
  return assertNoCountDisclosure(page, { allowUnavailable: true })
}

export async function screenshotCountSection(page, filePath) {
  const section = page.locator(COUNT_VALUE_SELECTORS.section)
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
