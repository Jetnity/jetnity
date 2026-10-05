import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { PARTY_GRENZEN, partyLimitUeberschritten } from '@/lib/readiness/party'

describe('partyLimitUeberschritten', () => {
  test('20 bestehende plus Update derselben Refs bleibt zulässig', () => {
    const refs = Array.from({ length: PARTY_GRENZEN.slots }, (_, i) => `traveller:${i + 1}`)
    assert.equal(partyLimitUeberschritten(refs, refs), false)
  })

  test('19 bestehende plus eine neue Ref bleibt zulässig', () => {
    const bestehend = Array.from({ length: 19 }, (_, i) => `traveller:${i + 1}`)
    assert.equal(partyLimitUeberschritten(bestehend, ['traveller:20']), false)
  })

  test('20 bestehende plus eine neue Ref wird abgelehnt', () => {
    const bestehend = Array.from({ length: PARTY_GRENZEN.slots }, (_, i) => `traveller:${i + 1}`)
    assert.equal(partyLimitUeberschritten(bestehend, ['traveller:neu']), true)
  })

  test('inkrementelles Übernehmen mehrerer neuer Refs kann das Limit sprengen', () => {
    const bestehend = Array.from({ length: 18 }, (_, i) => `traveller:${i + 1}`)
    assert.equal(partyLimitUeberschritten(bestehend, ['traveller:19', 'traveller:20', 'traveller:21']), true)
  })

  test('leere nächste Menge ändert das Limit nicht', () => {
    const bestehend = Array.from({ length: PARTY_GRENZEN.slots }, (_, i) => `traveller:${i + 1}`)
    assert.equal(partyLimitUeberschritten(bestehend, []), false)
  })
})
