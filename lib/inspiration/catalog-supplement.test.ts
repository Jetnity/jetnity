import assert from 'node:assert/strict'
import { test } from 'node:test'
import { supplementInspirationCatalog } from './catalog-supplement'

// Synthetic public selections exercise the threshold without expanding the
// four-entry CMS contract or passing unvalidated CMS responses to this helper.
type PublicIdea = Readonly<{ placeId: string; title: string; href: string }>
function idea(placeId: string, source: string): PublicIdea {
  return Object.freeze({ placeId, title: `${source}: ${placeId}`, href: `/planen?zielId=${placeId}&idee=${source}` })
}
const catalog = Object.freeze(Array.from({ length: 4 }, (_, index) => idea(`catalog-${index}`, 'static')))

test('zero published ideas retain the four static choices in catalogue order', () => {
  const selected = supplementInspirationCatalog<PublicIdea>([], catalog)
  assert.deepEqual(selected, catalog)
  assert.equal(selected.length, 4)
})

test('one published idea wins over its static copy including the planning handoff', () => {
  const published = idea(catalog[2].placeId, 'published')
  const selected = supplementInspirationCatalog([published], catalog)
  assert.deepEqual(selected, [published, catalog[0], catalog[1], catalog[3]])
  assert.strictEqual(selected[0], published)
  assert.equal(selected[0].href, published.href)
  assert.notEqual(selected[0].href, catalog[2].href)
})

test('seven distinct published ideas receive every missing static choice without a display cap', () => {
  const published = Array.from({ length: 7 }, (_, index) => idea(`published-${index}`, 'published'))
  const selected = supplementInspirationCatalog(published, catalog)
  assert.deepEqual(selected, [...published, ...catalog])
  assert.equal(selected.length, 11)
})

for (const count of [8, 9]) {
  test(`${count} distinct published ideas receive no static additions`, () => {
    const published = Array.from({ length: count }, (_, index) => idea(`published-${index}`, 'published'))
    assert.deepEqual(supplementInspirationCatalog(published, catalog), published)
  })
}

test('duplicate published IDs are removed before the threshold and the first version wins', () => {
  const published = Array.from({ length: 7 }, (_, index) => idea(`published-${index}`, 'first'))
  const duplicate = idea(published[0].placeId, 'later')
  const selected = supplementInspirationCatalog([...published, duplicate], catalog)
  assert.deepEqual(selected, [...published, ...catalog])
  assert.strictEqual(selected[0], published[0])
  assert.ok(!selected.includes(duplicate))
})

test('catalogue duplicates never duplicate a published ID or replace the first static version', () => {
  const published = idea('shared', 'published')
  const firstStatic = idea('static-only', 'first-static')
  const selected = supplementInspirationCatalog([published], [
    idea('shared', 'static'), firstStatic, idea('static-only', 'later-static'),
    catalog[0], catalog[0], idea('shared', 'later-static'),
  ])
  assert.deepEqual(selected, [published, firstStatic, catalog[0]])
  assert.strictEqual(selected[1], firstStatic)
})

test('frozen inputs and their entries remain unchanged on both sides of the threshold', () => {
  for (const count of [1, 8]) {
    const published = Object.freeze(Array.from({ length: count }, (_, index) => idea(`published-${index}`, 'published')))
    const before = [...published]
    const selected = supplementInspirationCatalog(published, catalog)
    assert.deepEqual(published, before)
    assert.equal(catalog.length, 4)
    assert.notStrictEqual(selected, published)
    assert.notStrictEqual(selected, catalog)
    published.forEach((entry, index) => assert.strictEqual(selected[index], entry))
  }
})
