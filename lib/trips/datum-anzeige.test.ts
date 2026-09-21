// lib/trips/datum-anzeige.test.ts
//
// Display-only UTC date-only labels. Stored ISO dates stay unchanged.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { datumKurz, etappenZeitraumAnzeigen, zeitraumKurz } from '@/lib/trips/datum-anzeige'

describe('etappenZeitraumAnzeigen', () => {
  test('localizes a same-year range without inventing a year', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-10-12', '2026-10-16'), '12. Okt. – 16. Okt.')
  })

  test('keeps the year on a cross-year range', () => {
    assert.equal(
      etappenZeitraumAnzeigen('2026-12-28', '2027-01-03'),
      '28. Dez. 2026 – 03. Jan. 2027',
    )
  })

  test('same-day keeps a single dated label', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-10-12', '2026-10-12'), '12. Okt. 2026')
  })

  test('one arrival endpoint stays dated and does not invent departure', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-10-12', null), 'Ankunft 12. Okt. 2026')
  })

  test('one departure endpoint stays dated and does not invent arrival', () => {
    assert.equal(etappenZeitraumAnzeigen(null, '2026-10-16'), 'Abreise 16. Okt. 2026')
  })

  test('absent endpoints stay empty so the caller keeps its copy', () => {
    assert.equal(etappenZeitraumAnzeigen(null, null), null)
    assert.equal(etappenZeitraumAnzeigen('', ''), null)
  })

  test('invalid values are not shown as raw ISO', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-99-99', 'nicht-datum'), null)
    assert.equal(etappenZeitraumAnzeigen('2026-10-12T18:00:00Z', 'nicht-datum'), null)
    assert.equal(etappenZeitraumAnzeigen('2026-10-12T18:00:00Z', '2026-10-16'), 'Abreise 16. Okt. 2026')
  })

  test('does not shift a date-only day across a timezone', () => {
    const text = etappenZeitraumAnzeigen('2026-10-12', '2026-10-16')
    assert.match(text ?? '', /12\. Okt/)
    assert.match(text ?? '', /16\. Okt/)
    assert.equal((text ?? '').includes('11.'), false)
    assert.equal((text ?? '').includes('13. Okt'), false)
  })

  test('existing helpers stay display-only and do not rewrite inputs', () => {
    const start = '2026-10-12'
    const ende = '2026-10-16'
    assert.match(datumKurz(start), /12\. Okt/)
    assert.match(zeitraumKurz(start, ende), /12\. Okt/)
    assert.equal(start, '2026-10-12')
    assert.equal(ende, '2026-10-16')
  })
})
