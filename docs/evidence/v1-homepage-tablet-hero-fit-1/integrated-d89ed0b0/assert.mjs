#!/usr/bin/env node
// Focused geometry/interaction assertions for the integrated-main refresh.
// Fails on incorrect measurements. No class-string tests.

import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HIER = dirname(fileURLToPath(import.meta.url))
const FIRST = join(HIER, '..')
const AFTER_BLOB = 'bc272ae9f82f591ea4c4b7540796e7652f6c2e19'
const INTEGRATED_MAIN = 'd89ed0b01070e47f93918fa64126ff0aeb18a17b'

function lade(pfad) {
  return JSON.parse(readFileSync(pfad, 'utf8'))
}

function szene(bericht, name) {
  const gefunden = bericht.scenes.find((eintrag) => eintrag.scene === name)
  assert.ok(gefunden, `missing integrated scene ${name}`)
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

const bericht = lade(join(HIER, 'audit-integrated.json'))
assert.equal(bericht.productTree.pageBlob, AFTER_BLOB)
assert.equal(bericht.preservedHeroPageBlob, AFTER_BLOB)
assert.ok(bericht.productTree.mergeParents.includes(INTEGRATED_MAIN))

const s1024 = szene(bericht, '1024x768')
assert.equal(s1024.geometry.grid.columnCount, 1)
assert.equal(s1024.geometry.card.visible, false)
assert.equal(s1024.geometry.card.emptySecondColumn, false)
assert.equal(s1024.geometry.document.overflowX, 0)
kontrollenNutzbar(s1024.geometry.destination, s1024.geometry.cta)
inHero(s1024.geometry.form, s1024.geometry.hero, '1024 form')
inHero(s1024.geometry.cta, s1024.geometry.hero, '1024 CTA')

const s1440 = szene(bericht, '1440x900')
assert.equal(s1440.geometry.grid.columnCount, 2)
assert.equal(s1440.geometry.card.visible, true)
assert.equal(s1440.geometry.card.emptySecondColumn, false)
assert.ok(s1440.geometry.card.width >= 380, `1440 card width ${s1440.geometry.card.width}`)
assert.ok(s1440.geometry.card.tags.every((tag) => tag.truncated === false), '1440 tags must be complete at 100% text')
assert.equal(s1440.geometry.document.overflowX, 0)
kontrollenNutzbar(s1440.geometry.destination, s1440.geometry.cta)
inHero(s1440.geometry.form, s1440.geometry.hero, '1440 form')

const t1024 = szene(bericht, '1024x768_text-200')
assert.equal(t1024.geometry.grid.columnCount, 1)
assert.equal(t1024.geometry.card.visible, false)
assert.equal(t1024.geometry.card.emptySecondColumn, false)
kontrollenNutzbar(t1024.geometry.destination, t1024.geometry.cta)
inHero(t1024.geometry.form, t1024.geometry.hero, '1024/200% form')
inHero(t1024.geometry.cta, t1024.geometry.hero, '1024/200% CTA')
assert.ok(t1024.geometry.containment.formBelowFirstViewport, '1024/200% form must sit below the first 768px paint')
assert.equal(
  t1024.geometry.overflowOffenders.filter((o) => o.firstHeroDescendant && o.painted).length,
  0,
  'integrated 1024/200% must not paint a first-hero descendant past the viewport',
)

const t1440 = szene(bericht, '1440x900_text-200')
assert.equal(t1440.geometry.grid.columnCount, 2)
assert.equal(t1440.geometry.card.visible, true)
kontrollenNutzbar(t1440.geometry.destination, t1440.geometry.cta)
inHero(t1440.geometry.form, t1440.geometry.hero, '1440/200% form')
inHero(t1440.geometry.cta, t1440.geometry.hero, '1440/200% CTA')
assert.ok(t1440.geometry.form.bottom > 900, '1440/200% form bottom must exceed the 900px viewport')

const inter = bericht.interaction
assert.ok(inter, '1024 interaction missing')
assert.equal(inter.focusedDestinationId, 'travel-idea')
assert.equal(inter.afterTab.tag, 'BUTTON')
assert.equal(inter.afterTab.type, 'submit')
assert.match(inter.afterTab.text, /Reise planen/)
assert.match(inter.validation, /Reiseziel/)
assert.equal(inter.mutations.completedUnexpectedMutations, 0)
assert.equal(inter.mutations.attemptedUnexpectedMutations, 0)

for (const name of [
  'screens/integrated_1024x768_viewport.png',
  'screens/integrated_1024x768_hero-full.png',
  'screens/integrated_1024x768_text-200_viewport.png',
  'screens/integrated_1024x768_text-200_hero-full.png',
  'screens/integrated_1024x768_text-200_form-cta.png',
  'screens/integrated_1440x900_viewport.png',
  'screens/integrated_1440x900_hero-full.png',
  'screens/integrated_1440x900_text-200_viewport.png',
  'screens/integrated_1440x900_text-200_hero-full.png',
  'screens/integrated_1440x900_text-200_form-cta.png',
]) {
  bild(name)
}

assert.ok(existsSync(join(FIRST, 'screens', 'after_1024x768_viewport.png')), 'first-round after 1024 must remain')
assert.ok(existsSync(join(FIRST, 'ht-e1-e2', 'screens', 'after_1024x768_text-200_form-cta.png')), 'HT-E1 form-cta must remain')
assert.ok(
  !existsSync(join(FIRST, 'screens', 'integrated_1024x768_viewport.png')),
  'must not write integrated screens into the first-round folder',
)

console.log('integrated-d89ed0b0 assertions PASS')
