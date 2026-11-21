import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cancellationText } from './cancellation'

test('24h and 48h are offer-specific, never a global cancellation guarantee', () => {
  assert.equal(cancellationText({ type: 'free', details: { hours_before_pickup: 24 } }),
    'Kostenfrei bis 24 Std. vor Abholung (laut diesem Angebot)')
  assert.equal(cancellationText({ type: 'free', details: { hours_before_pickup: 48 } }),
    'Kostenfrei bis 48 Std. vor Abholung (laut diesem Angebot)')
  assert.equal(cancellationText({ type: 'free' }),
    'Kostenfrei gemäss Mietbedingungen (Frist nicht angegeben)')
  assert.equal(cancellationText({ type: 'free', details: null }),
    'Kostenfrei gemäss Mietbedingungen (Frist nicht angegeben)')
  assert.equal(cancellationText({ type: 'non_refundable' }), 'Nicht erstattbar')
  assert.equal(cancellationText({ type: null }), 'Siehe Mietbedingungen')
  assert.equal(cancellationText(null), 'Siehe Mietbedingungen')
})
