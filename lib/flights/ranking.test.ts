import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { OPTION_DIREKT, OPTION_GUENSTIG_LANG, OPTION_OVERNIGHT, SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import { optionenBewerten, RANGLISTE_GEWICHTE } from '@/lib/flights/ranking'

describe('Jetnity-Ranking', () => {
  test('dieselbe Menge ergibt dieselbe Reihenfolge', () => {
    const a = optionenBewerten([OPTION_OVERNIGHT, OPTION_DIREKT, OPTION_GUENSTIG_LANG], SUCHANFRAGE)
    const b = optionenBewerten([OPTION_GUENSTIG_LANG, OPTION_OVERNIGHT, OPTION_DIREKT], SUCHANFRAGE)
    assert.deepEqual(
      a.map((option) => option.id),
      b.map((option) => option.id),
    )
    assert.deepEqual(
      a.map((option) => option.score),
      b.map((option) => option.score),
    )
  })

  test('die günstigste Option ist nicht automatisch die Empfehlung', () => {
    const bewertet = optionenBewerten([OPTION_DIREKT, OPTION_GUENSTIG_LANG, OPTION_OVERNIGHT], SUCHANFRAGE)
    const jetnity = bewertet.find((option) => option.labels.includes('jetnity'))
    const cheapest = bewertet.find((option) => option.labels.includes('cheapest'))
    const fastest = bewertet.find((option) => option.labels.includes('fastest'))

    assert.equal(cheapest?.id, 'overnight')
    assert.equal(fastest?.id, 'direkt')
    assert.equal(jetnity?.id, 'direkt')
    assert.notEqual(jetnity?.id, cheapest?.id)
  })

  test('Jetnity-Gründe sind nachvollziehbar und ohne Provision', () => {
    const bewertet = optionenBewerten([OPTION_DIREKT, OPTION_GUENSTIG_LANG, OPTION_OVERNIGHT], SUCHANFRAGE)
    const jetnity = bewertet.find((option) => option.labels.includes('jetnity'))
    assert.ok(jetnity)
    assert.ok(jetnity!.reasons.length >= 2)
    assert.ok(jetnity!.reasons.length <= 4)
    const text = jetnity!.reasons.join(' ')
    assert.match(text, /schneller|Direktflug|teurer|Umstieg/i)
    assert.equal(/provision|duffel|amadeus|skyscanner|aviasales|marge|affiliate/i.test(text), false)
  })

  test('die Gewichte sind fest und provisionsneutral', () => {
    assert.equal(RANGLISTE_GEWICHTE.preis > 0, true)
    assert.equal('provision' in RANGLISTE_GEWICHTE, false)
  })

  test('Score enthält keine Provider- oder Provisionskomponente', () => {
    const mitProvider = optionenBewerten([{ ...OPTION_DIREKT, provider: 'skyscanner' }], SUCHANFRAGE)
    const original = optionenBewerten([OPTION_DIREKT], SUCHANFRAGE)
    assert.equal(mitProvider[0]?.score, original[0]?.score)
  })
})
