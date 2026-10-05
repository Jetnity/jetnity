import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { leseToml } from '@/lib/supabase/config-toml'
import { oauthFreigabeLesen } from '@/lib/auth/oauth-anbieter-lesen'
import {
  oauthAnbieterAktiv,
  oauthFreigabeAusToml,
  sichtbareOauthAnbieter,
} from '@/lib/auth/oauth-anbieter'

const AUS = leseToml(`
[auth.external.google]
enabled = false
[auth.external.apple]
enabled = false
`)

const GOOGLE_AN = leseToml(`
[auth.external.google]
enabled = true
[auth.external.apple]
enabled = false
`)

describe('OAuth-Enablement', () => {
  test('ohne belegte Aktivierung erscheint kein Anbieter', () => {
    assert.deepEqual(sichtbareOauthAnbieter(oauthFreigabeAusToml(AUS)), [])
    assert.equal(oauthAnbieterAktiv(AUS, 'google'), false)
    assert.equal(oauthAnbieterAktiv(AUS, 'apple'), false)
  })

  test('nur der explizit aktivierte Anbieter ist sichtbar', () => {
    const freigabe = oauthFreigabeAusToml(GOOGLE_AN)
    assert.deepEqual(sichtbareOauthAnbieter(freigabe), ['google'])
    assert.equal(freigabe.apple, false)
  })

  test('ein fehlendes Flag ist fail-closed', () => {
    const leer = leseToml(`[auth]\nsite_url = "http://localhost:3000"\n`)
    assert.deepEqual(sichtbareOauthAnbieter(oauthFreigabeAusToml(leer)), [])
  })

  test('die Repository-config.toml aktiviert derzeit keinen Anbieter', () => {
    const live = oauthFreigabeLesen()
    assert.deepEqual(sichtbareOauthAnbieter(live), [])
  })
})
