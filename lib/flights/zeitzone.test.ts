import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { ianaZeitzoneLesen } from '@/lib/flights/zeitzone'

describe('ianaZeitzoneLesen', () => {
  test('akzeptiert explizite tz-database-Namen', () => {
    assert.equal(ianaZeitzoneLesen('Europe/London'), 'Europe/London')
    assert.equal(ianaZeitzoneLesen('America/New_York'), 'America/New_York')
    assert.equal(ianaZeitzoneLesen('America/Argentina/Buenos_Aires'), 'America/Argentina/Buenos_Aires')
    assert.equal(ianaZeitzoneLesen('Etc/UTC'), 'Etc/UTC')
    assert.equal(ianaZeitzoneLesen('Etc/GMT+12'), 'Etc/GMT+12')
  })

  test('lehnt fehlende, leere und Whitespace-Werte fail-closed ab', () => {
    assert.equal(ianaZeitzoneLesen(null), null)
    assert.equal(ianaZeitzoneLesen(undefined), null)
    assert.equal(ianaZeitzoneLesen(''), null)
    assert.equal(ianaZeitzoneLesen('   '), null)
    assert.equal(ianaZeitzoneLesen('Europe/London '), null)
    assert.equal(ianaZeitzoneLesen(' Europe/London'), null)
    assert.equal(ianaZeitzoneLesen('Europe/London\n'), null)
  })

  test('lehnt Offset, Z, einzelne Zonenkürzel und ungebundene Werte ab', () => {
    assert.equal(ianaZeitzoneLesen('Z'), null)
    assert.equal(ianaZeitzoneLesen('+02:00'), null)
    assert.equal(ianaZeitzoneLesen('-05:00'), null)
    assert.equal(ianaZeitzoneLesen('UTC'), null)
    assert.equal(ianaZeitzoneLesen('GMT'), null)
    assert.equal(ianaZeitzoneLesen('CET'), null)
    assert.equal(ianaZeitzoneLesen('Europe'), null)
    assert.equal(ianaZeitzoneLesen('Europe/'), null)
    assert.equal(ianaZeitzoneLesen('/London'), null)
    assert.equal(ianaZeitzoneLesen('europe/london'), null)
    assert.equal(ianaZeitzoneLesen('America/New York'), null)
    assert.equal(ianaZeitzoneLesen('Europe/London/Extra/City'), null)
    assert.equal(ianaZeitzoneLesen('Europe/../London'), null)
    assert.equal(ianaZeitzoneLesen('A'.repeat(80)), null)
    assert.equal(ianaZeitzoneLesen(12), null)
    assert.equal(ianaZeitzoneLesen({ name: 'Europe/London' }), null)
  })
})
