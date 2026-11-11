import test from 'node:test'
import assert from 'node:assert/strict'
import { flughafenSuchbegriff } from './suchbegriffe'

test('German city names query the catalog without selecting an airport', () => {
  assert.equal(flughafenSuchbegriff(' Wien '), 'Vienna')
  assert.equal(flughafenSuchbegriff('MÜNCHEN'), 'Munich')
  assert.equal(flughafenSuchbegriff('Muenchen'), 'Munich')
  assert.equal(flughafenSuchbegriff('Genf'), 'Geneva')
  assert.equal(flughafenSuchbegriff('VIE'), 'VIE')
  assert.equal(
    flughafenSuchbegriff('Ralph Wien Memorial'),
    'Ralph Wien Memorial',
  )
  assert.equal(flughafenSuchbegriff('Wiener Neustadt'), 'Wiener Neustadt')
})
