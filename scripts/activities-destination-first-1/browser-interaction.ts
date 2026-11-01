import assert from 'node:assert/strict'
import type { Locator } from 'playwright'

/**
 * Production CSS uses smooth scrolling. Recent Chrome can return from the
 * protocol scroll before the viewport settles, then send the click into the
 * widget above the button. Observe the visible hit target before a real click;
 * do not disable animations, force a click or dispatch a synthetic DOM event.
 */
export async function ruhigKlicken(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded()
  const ruhig = await locator.evaluate(async (el) => {
    let vorher = ''
    let stabil = 0
    for (let frame = 0; frame < 180; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const box = el.getBoundingClientRect()
      const jetzt = [box.x, box.y, box.width, box.height].join('|')
      stabil = jetzt === vorher ? stabil + 1 : 0
      const treffer = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      if (stabil >= 3 && box.top >= 0 && box.bottom <= innerHeight && treffer && el.contains(treffer)) return true
      vorher = jetzt
    }
    return false
  })
  assert.equal(ruhig, true, 'search button must be stationary, visible and unobscured before the actual mouse click')
  await locator.click()
}
