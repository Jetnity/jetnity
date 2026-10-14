import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { zielHref } from '@/lib/places/auswahl'
import { ENTDECKEN_ZIELE, entdeckerHref, entdeckerParams, entdeckerTreffer, suchtext } from './katalog'

describe('Reise-Inspiration Explorer: bounded URL and editorial search', () => {
  it('reuses precisely the four base identities, images, ideas and canonical handoffs', () => {
    assert.equal(ENTDECKEN_ZIELE.length, 4)
    ENTDECKEN_ZIELE.forEach((ziel, index) => {
      const basis = INSPIRATION_ZIELE[index]
      assert.ok(basis)
      for (const key of ['placeId', 'name', 'country', 'image', 'idea'] as const) assert.equal(ziel[key], basis[key])
      assert.equal(ziel.href, zielHref({ id: basis.placeId, name: basis.name }, basis.idea))
      assert.ok(ziel.beschreibung.length > 60)
      const url = new URL(ziel.href!, 'https://example.test')
      assert.deepEqual([...url.searchParams.keys()], ['zielId', 'idee'])
      assert.equal(url.searchParams.get('zielId'), basis.placeId)
      assert.equal(url.searchParams.get('idee'), basis.idea)
    })
    assert.equal(zielHref({ id: 'untrusted', name: 'Bali' }), null)
  })

  it('uses first repeated values, drops unknown params and defaults unknown themes', () => {
    assert.deepEqual(entdeckerParams({ q: [' Bali ', 'Zermatt'], thema: ['natur', 'strand'], target: '//evil.test' }), { q: 'Bali', thema: 'natur' })
    assert.deepEqual(entdeckerParams({ q: [], thema: ['__proto__'] }), { q: '', thema: 'alle' })
    assert.deepEqual(entdeckerParams({ thema: 'Natur' }), { q: '', thema: 'alle' })
  })

  it('bounds and cleans hostile input without caller-controlled navigation', () => {
    assert.equal(suchtext('x'.repeat(1000)).length, 120)
    assert.equal(suchtext(' \nBali\t '), 'Bali')
    const emojiGrenze = entdeckerParams({ q: 'x'.repeat(119) + '🌍' })
    assert.equal(emojiGrenze.q.length, 120)
    assert.equal(entdeckerParams(Object.fromEntries(new URL(entdeckerHref(emojiGrenze), 'https://example.test').searchParams)).q, emojiGrenze.q)
    const state = entdeckerParams({ q: '<script>alert(1)</script>&thema=natur', thema: 'strand' })
    const href = entdeckerHref(state)
    assert.ok(href.startsWith('/entdecken?'))
    assert.ok(!href.includes('<script>'))
    assert.deepEqual(entdeckerParams(Object.fromEntries(new URL(href, 'https://example.test').searchParams)), state)
    assert.equal(entdeckerTreffer(state).length, 0)
  })

  it('matches case, accents, whitespace, countries and editorial words', () => {
    for (const q of ['LÍSSABON', '  portugal  ', 'aussichtspunkte', 'Stadt Kultur Portugal']) {
      assert.deepEqual(entdeckerTreffer({ q, thema: 'alle' }).map((ziel) => ziel.name), ['Lissabon'])
    }
    assert.deepEqual(entdeckerTreffer({ q: 'Museen', thema: 'alle' }).map((ziel) => ziel.name), ['Amsterdam'])
    assert.deepEqual(entdeckerTreffer({ q: 'KUCHE', thema: 'alle' }).map((ziel) => ziel.name), ['Bali'])
  })

  it('combines themes and search without inventing matches; resets to all', () => {
    assert.deepEqual(entdeckerTreffer({ q: '', thema: 'natur' }).map((ziel) => ziel.name), ['Bali', 'Zermatt'])
    assert.equal(entdeckerTreffer({ q: 'Bali', thema: 'stadt-kultur' }).length, 0)
    assert.equal(entdeckerTreffer({ q: 'Antarktis', thema: 'alle' }).length, 0)
    assert.equal(entdeckerTreffer(entdeckerParams({})).length, 4)
    assert.equal(entdeckerHref({ q: '  ', thema: 'alle' }), '/entdecken')
  })
})
