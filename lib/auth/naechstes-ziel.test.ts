import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  SICHERES_NACH_ANMELDUNG,
  anmeldeSeiteZiel,
  erlaubtesNaechstesZiel,
} from '@/lib/auth/naechstes-ziel'

describe('erlaubtesNaechstesZiel', () => {
  test('erlaubt /account', () => {
    assert.equal(erlaubtesNaechstesZiel('/account'), '/account')
  })

  test('erlaubt /account/security mit Query', () => {
    assert.equal(
      erlaubtesNaechstesZiel('/account/security?tab=mfa'),
      '/account/security?tab=mfa',
    )
  })

  test('erlaubt /reisen', () => {
    assert.equal(erlaubtesNaechstesZiel('/reisen'), '/reisen')
  })

  test('erlaubt /reisen/<id>', () => {
    assert.equal(
      erlaubtesNaechstesZiel('/reisen/11111111-1111-4111-8111-111111111111'),
      '/reisen/11111111-1111-4111-8111-111111111111',
    )
  })

  test('verwirft einen fremden Host', () => {
    assert.equal(erlaubtesNaechstesZiel('https://evil.example/account'), SICHERES_NACH_ANMELDUNG)
    assert.equal(erlaubtesNaechstesZiel('http://evil.example/reisen'), SICHERES_NACH_ANMELDUNG)
  })

  test('verwirft protokoll-relative Ziele', () => {
    assert.equal(erlaubtesNaechstesZiel('//evil.example/account'), SICHERES_NACH_ANMELDUNG)
  })

  test('verwirft Pfade ausserhalb der Allowlist', () => {
    assert.equal(erlaubtesNaechstesZiel('/admin'), SICHERES_NACH_ANMELDUNG)
    assert.equal(erlaubtesNaechstesZiel('/planen'), SICHERES_NACH_ANMELDUNG)
    assert.equal(erlaubtesNaechstesZiel('/login'), SICHERES_NACH_ANMELDUNG)
  })

  test('ein Encoding- oder Slash-Trick umgeht die Allowlist nicht', () => {
    assert.equal(erlaubtesNaechstesZiel('/account/%2e%2e/admin'), SICHERES_NACH_ANMELDUNG)
    assert.equal(erlaubtesNaechstesZiel('/reisen/../admin'), SICHERES_NACH_ANMELDUNG)
    assert.equal(erlaubtesNaechstesZiel('/%2Fevil.example'), SICHERES_NACH_ANMELDUNG)
    assert.equal(erlaubtesNaechstesZiel('/account%2f../admin'), SICHERES_NACH_ANMELDUNG)
    assert.equal(erlaubtesNaechstesZiel('/account-evil'), SICHERES_NACH_ANMELDUNG)
    assert.equal(erlaubtesNaechstesZiel('/reisen%5c../admin'), SICHERES_NACH_ANMELDUNG)
    assert.equal(erlaubtesNaechstesZiel('\\/account'), SICHERES_NACH_ANMELDUNG)
  })

  test('leere oder fehlende Werte fallen auf den Default', () => {
    assert.equal(erlaubtesNaechstesZiel(null), SICHERES_NACH_ANMELDUNG)
    assert.equal(erlaubtesNaechstesZiel(''), SICHERES_NACH_ANMELDUNG)
  })
})

describe('anmeldeSeiteZiel', () => {
  test('ohne User bleibt die Seite stehen', () => {
    assert.equal(anmeldeSeiteZiel(null, '/account'), null)
    assert.equal(anmeldeSeiteZiel(undefined, '/reisen'), null)
    assert.equal(anmeldeSeiteZiel({ id: '' }, '/account'), null)
  })

  test('mit belegtem User folgt dem erlaubten next', () => {
    assert.equal(anmeldeSeiteZiel({ id: 'user-1' }, '/account'), '/account')
    assert.equal(anmeldeSeiteZiel({ id: 'user-1' }, 'https://evil.example'), SICHERES_NACH_ANMELDUNG)
  })
})
