import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  GAST_COOKIE_VERTRAG,
  istGueltigeGastkennung,
} from '@/lib/modell/gast-cookie'

const hier = dirname(fileURLToPath(import.meta.url))

describe('Gast-Quota-Cookie-Vertrag', () => {
  test('bleibt der exakte jetnity_gast-Vertrag', () => {
    assert.equal(GAST_COOKIE_VERTRAG.name, 'jetnity_gast')
    assert.equal(GAST_COOKIE_VERTRAG.httpOnly, true)
    assert.equal(GAST_COOKIE_VERTRAG.sameSite, 'lax')
    assert.equal(GAST_COOKIE_VERTRAG.path, '/')
    assert.equal(GAST_COOKIE_VERTRAG.maxAgeTage, 30)
  })

  test('akzeptiert nur 32 Hexzeichen und ersetzt ungültige Kennungen', () => {
    assert.equal(istGueltigeGastkennung('0123456789abcdef0123456789abcdef'), true)
    assert.equal(istGueltigeGastkennung('0123456789ABCDEF0123456789ABCDEF'), false)
    assert.equal(istGueltigeGastkennung('0123456789abcdef0123456789abcde'), false)
    assert.equal(istGueltigeGastkennung('0123456789abcdef0123456789abcdef0'), false)
    assert.equal(istGueltigeGastkennung('not-a-guest-id'), false)
    assert.equal(istGueltigeGastkennung(''), false)
    assert.equal(istGueltigeGastkennung(undefined), false)
    assert.equal(istGueltigeGastkennung(' 0123456789abcdef0123456789abcdef'), false)
  })

  test('gastkennung bleibt async, awaited und fail-closed angebunden', () => {
    const datei = readFileSync(join(hier, 'kontingent.ts'), 'utf8')
    assert.match(datei, /async function gastkennung\(\): Promise<string>/)
    assert.match(datei, /const speicher = await cookies\(\)/)
    assert.match(datei, /_gastkennung: await gastkennung\(\)/)
    assert.match(datei, /secure: process\.env\.NODE_ENV === 'production'/)
    assert.match(datei, /const supabase = await createServerActionClient\(\)/)
    assert.match(datei, /auth\.getUser\(\)/)
    assert.equal(datei.includes('getSession()'), false)
    assert.match(datei, /function modelldienst\(\)/)
    assert.equal(datei.includes('export function modelldienst'), false)
    assert.match(datei, /persistSession: false/)
    assert.match(datei, /if \(!dienst\) return \{ ok: false, meldung: NICHT_KONFIGURIERT \}/)
  })
})
