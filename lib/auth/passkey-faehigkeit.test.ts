import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  PASSKEY_RP_ID_GEPLANT,
  passkeyAnzeigename,
  passkeyHandlungErlaubt,
  passkeyHandlungSperre,
  passkeyKontoBestaetigt,
  passkeyNameGueltig,
  passkeyOriginErlaubt,
  passkeySdkVorhanden,
} from '@/lib/auth/passkey-faehigkeit'

const hier = dirname(fileURLToPath(import.meta.url))
const offen = {
  serverAktiviert: true,
  sdkVorhanden: true,
  browserWebAuthn: true as boolean | null,
  origin: 'https://jetnity.com',
}

describe('Passkey-Fähigkeit, MOCK und fail-closed', () => {
  test('installiertes SDK kann Passkeys, der Server und die Preview bleiben zu', () => {
    const lock = readFileSync(join(hier, '../../package-lock.json'), 'utf8')
    assert.match(lock, /"node_modules\/@supabase\/supabase-js": \{\s*"version": "2\.119\.2"/)
    assert.match(lock, /"node_modules\/@supabase\/auth-js": \{\s*"version": "2\.119\.2"/)
    assert.match(lock, /"node_modules\/@supabase\/ssr": \{\s*"version": "0\.6\.1"/)
    const quelle = readFileSync(join(hier, '../../node_modules/@supabase/auth-js/src/GoTrueClient.ts'), 'utf8')
    assert.equal(quelle.includes('registerPasskey'), true)
    assert.equal(quelle.includes('signInWithPasskey'), true)
    const client = readFileSync(join(hier, '../supabase/client.ts'), 'utf8')
    assert.match(client, /experimental: \{ passkey: true \}/)
    assert.equal(client.includes('createBrowserClient(url, anon)'), false)
    const config = readFileSync(join(hier, '../../supabase/config.toml'), 'utf8')
    assert.match(config, /\[auth\.passkey\]\nenabled = false/)
    assert.equal(PASSKEY_RP_ID_GEPLANT, 'jetnity.com')
    assert.equal(passkeyOriginErlaubt('https://jetnity-app.vercel.app'), false)
  })

  test('Server, SDK, Browser und Origin müssen gleichzeitig passen', () => {
    assert.equal(passkeyHandlungSperre({ ...offen, serverAktiviert: false }), 'server_aus')
    assert.equal(passkeyHandlungSperre({ ...offen, sdkVorhanden: false }), 'sdk_fehlt')
    assert.equal(passkeyHandlungSperre({ ...offen, browserWebAuthn: false }), 'browser_fehlt')
    assert.equal(passkeyHandlungSperre({ ...offen, browserWebAuthn: null }), 'browser_unbekannt')
    assert.equal(passkeyHandlungSperre({ ...offen, origin: null }), 'origin_unbekannt')
    assert.equal(passkeyHandlungSperre({ ...offen, origin: 'https://jetnity-app.vercel.app' }), 'origin_passt_nicht')
    assert.equal(passkeyHandlungErlaubt(offen), true)
    assert.equal(
      passkeyHandlungErlaubt({ ...offen, serverAktiviert: false, sdkVorhanden: true, browserWebAuthn: true }),
      false,
    )
  })

  test('RP-ID jetnity.com lässt weder Preview noch Loopback zu', () => {
    assert.equal(passkeyOriginErlaubt('https://jetnity.com'), true)
    assert.equal(passkeyOriginErlaubt('https://www.jetnity.com'), true)
    assert.equal(passkeyOriginErlaubt('https://dev.jetnity.com'), true)
    assert.equal(passkeyOriginErlaubt('https://jetnity.com/account/security'), true)
    assert.equal(passkeyOriginErlaubt('http://localhost:3000'), false)
    assert.equal(passkeyOriginErlaubt('http://127.0.0.1:3000'), false)
    assert.equal(passkeyOriginErlaubt('https://localhost'), false)
    assert.equal(passkeyOriginErlaubt('https://jetnity-app.vercel.app'), false)
    assert.equal(passkeyOriginErlaubt('https://preview.vercel.app'), false)
    assert.equal(passkeyOriginErlaubt('https://eviljetnity.com'), false)
    assert.equal(passkeyOriginErlaubt('https://jetnity.com.evil.example'), false)
    assert.equal(passkeyOriginErlaubt('https://user:secret@jetnity.com'), false)
    assert.equal(passkeyOriginErlaubt('not a url'), false)
  })

  test('SDK-Probe verlangt die fünf offiziellen Methoden', () => {
    assert.equal(passkeySdkVorhanden(null), false)
    assert.equal(passkeySdkVorhanden({ registerPasskey() {}, signInWithPasskey() {} }), false)
    assert.equal(
      passkeySdkVorhanden({
        registerPasskey() {},
        signInWithPasskey() {},
        passkey: { list() {}, update() {}, delete() {} },
      }),
      true,
    )
  })

  test('nur ein bestätigtes, nicht anonymes Konto darf registrieren', () => {
    assert.equal(passkeyKontoBestaetigt(null), false)
    assert.equal(passkeyKontoBestaetigt({ is_anonymous: true, email_confirmed_at: '2026-11-18T00:00:00Z' }), false)
    assert.equal(passkeyKontoBestaetigt({ email_confirmed_at: null, phone_confirmed_at: null }), false)
    assert.equal(passkeyKontoBestaetigt({ email_confirmed_at: '2026-11-18T00:00:00Z' }), true)
    assert.equal(passkeyKontoBestaetigt({ phone_confirmed_at: '2026-11-18T00:00:00Z' }), true)
  })

  test('Namen bleiben kurz und ohne E-Mail oder Kennung', () => {
    assert.equal(passkeyNameGueltig('Arbeit'), true)
    assert.equal(passkeyNameGueltig(''), false)
    assert.equal(passkeyNameGueltig('a'.repeat(121)), false)
    assert.equal(passkeyNameGueltig('person@example.com'), false)
    assert.equal(passkeyNameGueltig('11111111-1111-1111-1111-111111111111'), false)
    assert.equal(passkeyAnzeigename('person@example.com'), 'Passkey')
    assert.equal(passkeyAnzeigename('Arbeit'), 'Arbeit')
  })
})
