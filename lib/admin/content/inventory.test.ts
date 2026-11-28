import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ContentInventory from '@/components/admin/content/ContentInventory'
import { inspirationsbild } from '@/lib/inspiration/bildfreigabe'
import { ENTDECKEN_ZIELE, entdeckerHref } from '@/lib/inspiration/explorer-1/katalog'
import { readContentInventory } from './inventory'

test('inventory returns original catalogue entries and existing planning/image destinations', () => {
  const inventory = readContentInventory({})
  assert.equal(inventory.total, ENTDECKEN_ZIELE.length)
  assert.deepEqual(inventory.entries, ENTDECKEN_ZIELE)
  for (const [index, entry] of inventory.entries.entries()) {
    assert.equal(entry, ENTDECKEN_ZIELE[index])
    assert.ok(entry.href)
    const planning = new URL(entry.href, 'https://jetnity.example')
    assert.equal(planning.pathname, '/planen')
    assert.equal(planning.searchParams.get('zielId'), entry.zielId)
    assert.equal(planning.searchParams.get('idee'), entry.idea)
    const bild = inspirationsbild(entry.image)
    if (bild.neutral) assert.equal(entry.name, 'Zermatt')
    else assert.ok(existsSync(join(process.cwd(), 'public', bild.src)), bild.src)
  }
  const zermatt = inventory.entries.find((entry) => entry.name === 'Zermatt')!
  assert.equal(zermatt.placeId, 'geonames:2657915')
  assert.equal(zermatt.zielId, 'geonames:2657928')
  assert.equal(new URL(zermatt.href!, 'https://jetnity.example').searchParams.get('zielId'), 'geonames:2657928')
})

test('catalogue image link uses the corrected delivery path; the withheld Zermatt image links to the proof instead', () => {
  const html = renderToStaticMarkup(React.createElement(ContentInventory, { inventory: readContentInventory({}), observedAt: '2026-11-15T10:00:00Z' }))
  assert.ok(html.includes('href="/images/bali.png"'))
  assert.ok(html.includes('href="/images/lisbon.png"'))
  assert.ok(html.includes('href="/images/amsterdam.png"'))
  assert.doesNotMatch(html, /\/images\/(?:bali|lisbon|zermatt|amsterdam)\.jpg/)
  assert.doesNotMatch(html, /\/images\/zermatt/)
  assert.match(html, /Zermatt: Bildnachweis öffnen, Katalogbild nicht freigegeben \(neuer Tab\)/)
  const neutral = ENTDECKEN_ZIELE.filter((entry) => inspirationsbild(entry.image).neutral)
  assert.deepEqual(neutral.map((entry) => entry.name), ['Zermatt'])
  assert.equal((html.match(/href="\/images\//g) ?? []).length, ENTDECKEN_ZIELE.length - neutral.length)
  assert.equal((html.match(/href="\/datenquellen#ki-illustrationen"/g) ?? []).length, neutral.length)
  assert.ok(html.includes('Kuratierte Inspiration · geonames:2657915 · Planungsziel geonames:2657928'))
  assert.ok(html.includes('Kuratierte Inspiration · geonames:1650535<'))
})

test('inventory search combines the public catalogue topic and original text contract', () => {
  assert.deepEqual(readContentInventory({ q: 'strand', thema: 'natur' }).entries.map((item) => item.name), ['Bali'])
  assert.deepEqual(readContentInventory({ q: 'SCHWEIZ', thema: 'erholung' }).entries.map((item) => item.name), ['Zermatt'])
  const empty = readContentInventory({ q: 'no-such-destination', thema: 'natur' })
  assert.equal(empty.entries.length, 0)
  assert.equal(empty.total, ENTDECKEN_ZIELE.length)
  assert.equal(readContentInventory({ thema: 'unknown' }).selection.thema, 'alle')
  assert.equal(readContentInventory({ q: ['Bali', 'Zermatt'] }).selection.q, 'Bali')
})

test('render keeps actual originals and explicit missing editorial evidence', () => {
  const html = renderToStaticMarkup(React.createElement(ContentInventory, { inventory: readContentInventory({ q: 'Bali' }), observedAt: '2026-11-15T10:00:00Z' }))
  assert.match(html, /1 von 4 Reiseideen/)
  assert.match(html, /Redaktioneller Owner/)
  assert.match(html, /im Katalog nicht erfasst/)
  assert.match(html, /keine Messdaten/)
  assert.match(html, /keine redaktionelle Prüfung/)
  assert.match(html, /noindex\/nofollow/)
  assert.ok(html.includes(ENTDECKEN_ZIELE[0].beschreibung))
  assert.ok(html.includes(ENTDECKEN_ZIELE[0].idea))
  assert.ok(html.includes(`href="${entdeckerHref({ q: 'Bali', thema: 'alle' })}"`))
  const form = html.match(/<form\b[^>]*>/)?.[0]
  assert.ok(form)
  assert.match(form, /\bmethod="get"/)
  assert.match(form, /\baction="\/admin\/content"/)
  assert.doesNotMatch(html, /<h2[^>]*>Amsterdam<\/h2>/)
})

test('empty selection remains a usable filtered-empty state', () => {
  const html = renderToStaticMarkup(React.createElement(ContentInventory, { inventory: readContentInventory({ q: 'no-such-destination' }), observedAt: '2026-11-15T10:00:00Z' }))
  assert.match(html, /Keine passende Reiseidee/)
  assert.match(html, /Filter zurücksetzen/)
  assert.doesNotMatch(html, /<article/)
})

test('page guard and documented SEO source stay aligned with the inventory claims', () => {
  const page = readFileSync(join(process.cwd(), 'app/(admin)/admin/content/page.tsx'), 'utf8')
  assert.match(page, /await requireAdminPage\(\{ surface: 'content', capability: 'inhalte-moderieren' \}\)/)
  assert.ok(page.indexOf('await requireAdminPage') < page.indexOf('const inventory = readContentInventory'))
  const publicPage = readFileSync(join(process.cwd(), 'app/(public)/entdecken/page.tsx'), 'utf8')
  assert.match(publicPage, /robots: \{ index: false, follow: false/)
})
