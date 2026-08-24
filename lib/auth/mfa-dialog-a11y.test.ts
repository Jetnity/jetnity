import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const quelle = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../components/auth/MFATotpDialog.tsx'),
  'utf8',
)

describe('MFA-Dialog Accessibility', () => {
  test('hat zugänglichen Namen, Beschreibung und Code-Label', () => {
    assert.equal(quelle.includes('role="dialog"'), true)
    assert.equal(quelle.includes('aria-modal="true"'), true)
    assert.equal(quelle.includes('aria-labelledby='), true)
    assert.equal(quelle.includes('aria-describedby='), true)
    assert.equal(quelle.includes('htmlFor="mfa-totp"'), true)
    assert.equal(quelle.includes('aria-invalid'), true)
  })

  test('hält Fokus und Tastatur im Sicherheitsflow', () => {
    assert.equal(quelle.includes('focus()'), true)
    assert.equal(quelle.includes("key === 'Escape'"), true)
    assert.equal(quelle.includes("key !== 'Tab'"), true)
    assert.equal(quelle.includes('min-h-11'), true)
  })
})
