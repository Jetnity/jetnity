#!/usr/bin/env node
// Focused geometry/interaction assertions for HT-E2.
// Fails the process on incorrect measurements. No class-string tests.

import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HIER = dirname(fileURLToPath(import.meta.url))
const FIRST = join(HIER, '..')

function lade(pfad) {
  return JSON.parse(readFileSync(pfad, 'utf8'))
}

function szene(bericht, name) {
  const gefunden = bericht.scenes.find((eintrag) => eintrag.scene === name)
  assert.ok(gefunden, `missing first-round scene ${name}`)
  return gefunden
}

function bild(relativ) {
  const pfad = join(HIER, relativ)
  assert.ok(existsSync(pfad), `missing image ${relativ}`)
  assert.ok(statSync(pfad).size > 20_000, `image too small to be a real capture: ${relativ}`)
}

function kontrollenNutzbar(ziel, cta) {
  assert.ok(ziel && cta, 'destination and CTA must exist')
  assert.notEqual(ziel.display, 'none')
  assert.notEqual(cta.display, 'none')
  assert.ok(ziel.width >= 120, `destination width ${ziel.width}`)
  assert.ok(ziel.height >= 40, `destination height ${ziel.height}`)
  assert.ok(cta.width >= 120, `CTA width ${cta.width}`)
  assert.ok(cta.height >= 44, `CTA height ${cta.height}`)
}

function inHero(inner, hero, name) {
  assert.ok(inner && hero, `${name} and hero must exist`)
  assert.ok(inner.x >= hero.x - 1, `${name} x ${inner.x} < hero x ${hero.x}`)
  assert.ok(inner.right <= hero.right + 1, `${name} right ${inner.right} > hero right ${hero.right}`)
  assert.ok(inner.y >= hero.y - 1, `${name} y ${inner.y} < hero y ${hero.y}`)
  assert.ok(inner.bottom <= hero.bottom + 1, `${name} bottom ${inner.bottom} > hero bottom ${hero.bottom}`)
}

const firstAfter = lade(join(FIRST, 'audit-after.json'))
const korrektur = lade(join(HIER, 'audit-correction.json'))
const overflow = lade(join(HIER, 'overflow-attribution.json'))

const s1024 = szene(firstAfter, '1024x768')
assert.equal(s1024.geometry.grid.columnCount, 1)
assert.equal(s1024.geometry.card.visible, false)
assert.equal(s1024.geometry.card.emptySecondColumn, false)
assert.equal(s1024.geometry.document.overflowX, 0)
kontrollenNutzbar(s1024.geometry.destination, s1024.geometry.cta)
inHero(s1024.geometry.form, s1024.geometry.hero, '1024 form')
inHero(s1024.geometry.cta, s1024.geometry.hero, '1024 CTA')

const s1279 = szene(firstAfter, '1279x800')
assert.equal(s1279.geometry.grid.columnCount, 1)
assert.equal(s1279.geometry.card.visible, false)
assert.equal(s1279.geometry.card.emptySecondColumn, false)

for (const name of ['1280x800', '1440x900', '1920x1080']) {
  const s = szene(firstAfter, name)
  assert.equal(s.geometry.grid.columnCount, 2, `${name} must be two columns`)
  assert.equal(s.geometry.card.visible, true, `${name} card must show`)
  assert.equal(s.geometry.card.emptySecondColumn, false)
  assert.ok(s.geometry.card.width >= 380, `${name} card width ${s.geometry.card.width}`)
  assert.ok(s.geometry.card.tags.every((tag) => tag.truncated === false), `${name} tags must be complete at 100% text`)
  assert.equal(s.geometry.document.overflowX, 0, `${name} overflowX`)
}

for (const name of ['360x800', '390x844', '768x1024']) {
  const s = szene(firstAfter, name)
  assert.equal(s.geometry.card.visible, false)
  assert.equal(s.geometry.grid.columnCount, 1)
  assert.equal(s.geometry.card.emptySecondColumn, false)
  kontrollenNutzbar(s.geometry.destination, s.geometry.cta)
}

const inter = firstAfter.interaction
assert.equal(inter.focusedDestinationId, 'travel-idea')
assert.equal(inter.afterTab.tag, 'BUTTON')
assert.equal(inter.afterTab.type, 'submit')
assert.match(inter.afterTab.text, /Reise planen/)
assert.match(inter.validation, /Reiseziel/)
assert.equal(inter.mutations.completedUnexpectedMutations, 0)
assert.equal(inter.mutations.attemptedUnexpectedMutations, 0)

const basis = korrektur.baseline1024Text200
const after1024 = korrektur.after1024Text200
const after1440 = korrektur.after1440Text200

assert.equal(basis.productTree.pageBlob, overflow.baseline.pageBlob)
assert.equal(after1024.productTree.pageBlob, overflow.after.pageBlob)
assert.equal(overflow.baseline.pageBlob, '1bd46c82674e727b122d1798f842a8d57a99d62f')
assert.equal(overflow.after.pageBlob, 'bc272ae9f82f591ea4c4b7540796e7652f6c2e19')

assert.ok(Array.isArray(overflow.baseline.overflowOffenders))
assert.ok(Array.isArray(overflow.after.overflowOffenders))
assert.ok(overflow.baseline.overflowOffenders.length > 0, 'baseline offenders must be recorded, not summarized away')
assert.ok(overflow.baseline.overflowOffenders.every((o) => o.selector && o.bounds && typeof o.firstHeroDescendant === 'boolean' && typeof o.painted === 'boolean'))
assert.ok(overflow.after.overflowOffenders.every((o) => o.selector && o.bounds && typeof o.firstHeroDescendant === 'boolean' && typeof o.painted === 'boolean'))
assert.equal(overflow.comparison.newlyIntroducedDocumentOverflow, false)
assert.ok(
  after1024.geometry.document.overflowX <= basis.geometry.document.overflowX,
  `after overflowX ${after1024.geometry.document.overflowX} exceeded baseline ${basis.geometry.document.overflowX}`,
)
assert.ok(
  overflow.comparison.firstHeroPaintedOffendersBaseline.length > 0,
  'matched baseline 1024/200% must still show the squeezed painted decorative card overflowing',
)
assert.equal(
  overflow.comparison.firstHeroPaintedOffendersAfter.length,
  0,
  'after 1024/200% must not paint a first-hero descendant past the viewport',
)

kontrollenNutzbar(after1024.geometry.destination, after1024.geometry.cta)
kontrollenNutzbar(after1440.geometry.destination, after1440.geometry.cta)
inHero(after1024.geometry.form, after1024.geometry.hero, '1024/200% form')
inHero(after1024.geometry.cta, after1024.geometry.hero, '1024/200% CTA')
inHero(after1440.geometry.form, after1440.geometry.hero, '1440/200% form')
inHero(after1440.geometry.cta, after1440.geometry.hero, '1440/200% CTA')
assert.equal(after1024.geometry.containment.formInsideHero, true)
assert.equal(after1024.geometry.containment.ctaInsideHero, true)
assert.equal(after1440.geometry.containment.formInsideHero, true)

assert.ok(after1024.geometry.containment.formBelowFirstViewport, '1024/200% form must be below the first 768px paint so the form-cta scroll image is required')
assert.ok(after1440.geometry.form.bottom > 900, '1440/200% form bottom must exceed the 900px viewport')

const inter2 = after1024.interaction
assert.ok(inter2, 'correction-round 1024/200% interaction missing')
assert.equal(inter2.focusedDestinationId, 'travel-idea')
assert.equal(inter2.afterTab.type, 'submit')
assert.match(inter2.validation, /Reiseziel/)
assert.equal(inter2.mutations.completedUnexpectedMutations, 0)

for (const name of [
  'screens/baseline_1024x768_text-200_viewport.png',
  'screens/baseline_1024x768_text-200_hero-full.png',
  'screens/baseline_1024x768_text-200_form-cta.png',
  'screens/after_1024x768_text-200_viewport.png',
  'screens/after_1024x768_text-200_hero-full.png',
  'screens/after_1024x768_text-200_form-cta.png',
  'screens/after_1440x900_text-200_viewport.png',
  'screens/after_1440x900_text-200_hero-full.png',
  'screens/after_1440x900_text-200_form-cta.png',
]) {
  bild(name)
}

assert.ok(
  !existsSync(join(FIRST, 'screens', 'after_1024x768_text-200_form-cta.png')),
  'must not overwrite first-round screens',
)

console.log('HT-E1/HT-E2 assertions PASS')
