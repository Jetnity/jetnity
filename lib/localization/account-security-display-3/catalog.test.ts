import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ACCOUNT_SECURITY_KATALOG, sicherheitText } from '../account-security-texte'

const keys = Object.keys(ACCOUNT_SECURITY_KATALOG) as (keyof typeof ACCOUNT_SECURITY_KATALOG)[]

test('Security catalog has a complete DE/EN pair and identical interpolation fields for every used key', () => {
  const placeholders = (text: string) => [...text.matchAll(/\{([a-z]+)\}/g)].map((match) => match[1]).sort()
  assert.ok(keys.length > 150)
  for (const key of keys) {
    const entry = ACCOUNT_SECURITY_KATALOG[key]
    assert.deepEqual(Object.keys(entry).sort(), ['de', 'en'], key)
    assert.deepEqual(placeholders(entry.de), placeholders(entry.en), key)
    for (const lang of ['de', 'en'] as const) {
      assert.equal(entry[lang], entry[lang].trim(), key)
      assert.ok(entry[lang].length > 0, key)
      assert.doesNotMatch(entry[lang], /<script|https?:\/\/|eyJ[A-Za-z0-9_-]+\.|access_token=/, key)
      assert.doesNotMatch(sicherheitText(lang, key, { date: '15 Nov 2026', name: 'Personal name', minimum: 12, action: 'Sign out' }), /\{[a-z]+\}/, key)
    }
  }
})

test('Interpolation changes only the requested placeholders and preserves user-entered names verbatim', () => {
  assert.equal(sicherheitText('en', 'password.minimum', { minimum: 12 }), 'At least 12 characters')
  assert.equal(sicherheitText('de', 'password.minimum', { minimum: 12 }), 'Mind. 12 Zeichen')
  assert.equal(sicherheitText('en', 'totp.remove', { name: 'Authenticator-App <Mein Name> {date} $&' }), 'Remove Authenticator-App <Mein Name> {date} $&')
  assert.equal(sicherheitText('en', 'totp.remove'), 'Remove {name}', 'Missing data is never invented')
})
