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

  test('impossible calendar days are not normalized into a real date', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-02-29', null), null)
    assert.equal(etappenZeitraumAnzeigen('2026-02-30', null), null)
    assert.equal(etappenZeitraumAnzeigen('2026-04-31', null), null)
    assert.equal(etappenZeitraumAnzeigen('2026-02-29', '2026-02-30'), null)
  })

  test('a valid leap day remains visible', () => {
    assert.equal(etappenZeitraumAnzeigen('2024-02-29', null), 'Ankunft 29. Feb. 2024')
    assert.equal(etappenZeitraumAnzeigen('2024-02-29', '2024-03-01'), '29. Feb. – 01. März')
  })

  test('one valid endpoint with one impossible day keeps only the valid side', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-10-12', '2026-02-30'), 'Ankunft 12. Okt. 2026')
    assert.equal(etappenZeitraumAnzeigen('2026-02-29', '2026-10-16'), 'Abreise 16. Okt. 2026')
    const ankunft = '2026-02-29'
    const abreise = '2026-10-16'
    assert.equal(etappenZeitraumAnzeigen(ankunft, abreise), 'Abreise 16. Okt. 2026')
    assert.equal(ankunft, '2026-02-29')
    assert.equal(abreise, '2026-10-16')
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
