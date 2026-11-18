import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { sicherheitText } from '@/lib/localization/account-security-texte'
import { brauchtLoginTotpStepUp } from '@/lib/auth/mfa'
import { passkeyFehlerSchluessel } from '@/lib/auth/passkey-meldungen'
import {
  passkeyAnmeldungAusfuehren,
  passkeyAuflisten,
  passkeyEntfernen,
  passkeyFehlerCode,
  passkeyRegistrieren,
  passkeyUmbenennen,
  type PasskeyAuthSchnittstelle,
  type PasskeyFehlerCode,
} from '@/lib/auth/passkey-port'

const ID = '11111111-1111-4111-8111-111111111111'
const ANDERE = '22222222-2222-4222-8222-222222222222'
const offen = {
  serverAktiviert: true,
  sdkVorhanden: true,
  browserWebAuthn: true as boolean | null,
  origin: 'https://jetnity.com',
}
const zu = { ...offen, serverAktiviert: false }
const bestaetigt = { email_confirmed_at: '2026-11-18T00:00:00Z', is_anonymous: false }

function protokoll() {
  const aufrufe: string[] = []
  const auth: PasskeyAuthSchnittstelle = {
    async getUser() {
      aufrufe.push('getUser')
      return { data: { user: bestaetigt }, error: null }
    },
    async registerPasskey() {
      aufrufe.push('registerPasskey')
      return { data: { id: ID, friendly_name: 'Arbeit', created_at: '2026-11-18T12:00:00Z' }, error: null }
    },
    async signInWithPasskey() {
      aufrufe.push('signInWithPasskey')
      return { data: { session: { access_token: 'nicht-loggen' }, user: { id: 'user' } }, error: null }
    },
    mfa: {
      async getAuthenticatorAssuranceLevel() {
        aufrufe.push('aal')
        return { data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null }
      },
    },
    passkey: {
      async list() {
        aufrufe.push('list')
        return { data: [{ id: ID, friendly_name: 'Arbeit', created_at: '2026-11-18T12:00:00Z' }], error: null }
      },
      async update(args) {
        aufrufe.push(`update:${args.passkeyId}:${args.friendlyName}`)
        return { data: {}, error: null }
      },
      async delete(args) {
        aufrufe.push(`delete:${args.passkeyId}`)
        return { data: {}, error: null }
      },
    },
  }
  return { auth, aufrufe }
}

describe('Passkey-Port, MOCK_PASS, kein Hosted-E2E', () => {
  test('geschlossenes Gate ruft keine Zeremonie auf', async () => {
    const { auth, aufrufe } = protokoll()
    const liste = await passkeyAuflisten(auth, zu)
    const registrierung = await passkeyRegistrieren(auth, zu)
    const anmeldung = await passkeyAnmeldungAusfuehren(auth, zu)
    assert.equal(liste.art, 'geschlossen')
    assert.equal(registrierung.ok, false)
    assert.equal(anmeldung.art, 'geschlossen')
    assert.deepEqual(aufrufe, [])
  })

  test('Registrierung braucht ein bestätigtes Konto und die offizielle Methode', async () => {
    const { auth, aufrufe } = protokoll()
    auth.getUser = async () => {
      aufrufe.push('getUser')
      return { data: { user: { is_anonymous: true, email_confirmed_at: '2026-11-18T00:00:00Z' } }, error: null }
    }
    const anonym = await passkeyRegistrieren(auth, offen)
    assert.deepEqual(anonym, { ok: false, code: 'konto_nicht_bestaetigt' })
    assert.equal(aufrufe.includes('registerPasskey'), false)

    auth.getUser = async () => ({ data: { user: bestaetigt }, error: null })
    const ok = await passkeyRegistrieren(auth, offen)
    assert.deepEqual(ok, { ok: true })
    assert.equal(aufrufe.filter((aufruf) => aufruf === 'registerPasskey').length, 1)
  })

  test('Liste unterscheidet leer, Fehler und Eintrag; Kennungen werden nicht zum Namen', async () => {
    const { auth } = protokoll()
    auth.passkey = {
      ...auth.passkey,
      async list() {
        return { data: [{ id: ID, friendly_name: 'person@example.com', created_at: '2026-11-18T00:00:00Z' }], error: null }
      },
    }
    const liste = await passkeyAuflisten(auth, offen)
    assert.equal(liste.art, 'liste')
    if (liste.art !== 'liste') return
    assert.equal(liste.eintraege[0]?.anzeigename, 'Passkey')
    assert.equal(liste.eintraege[0]?.erstelltAm, '2026-11-18')

    auth.passkey = { ...auth.passkey, async list() { return { data: [], error: null } } }
    assert.equal((await passkeyAuflisten(auth, offen)).art, 'leer')

    auth.passkey = { ...auth.passkey, async list() { return { data: [{ id: 'kein-uuid' }], error: null } } }
    assert.deepEqual(await passkeyAuflisten(auth, offen), { art: 'fehler', code: 'unbekannt' })
  })

  test('Umbenennen und Entfernen gelten nur für die geladene Liste und eine Bestätigung', async () => {
    const { auth, aufrufe } = protokoll()
    const name = await passkeyUmbenennen(auth, offen, { id: ANDERE, name: 'Neu', gelisteteIds: [ID] })
    assert.deepEqual(name, { ok: false, code: 'nicht_gelistet' })
    const mail = await passkeyUmbenennen(auth, offen, { id: ID, name: 'person@example.com', gelisteteIds: [ID] })
    assert.deepEqual(mail, { ok: false, code: 'name_ungueltig' })
    const umbenannt = await passkeyUmbenennen(auth, offen, { id: ID, name: 'Arbeit', gelisteteIds: [ID] })
    assert.deepEqual(umbenannt, { ok: true })

    const ohneKlick = await passkeyEntfernen(auth, offen, {
      id: ID,
      gelisteteIds: [ID],
      bestaetigt: false,
      kontoBestaetigt: true,
    })
    assert.deepEqual(ohneKlick, { ok: false, code: 'nicht_erlaubt' })
    const entfernt = await passkeyEntfernen(auth, offen, {
      id: ID,
      gelisteteIds: [ID],
      bestaetigt: true,
      kontoBestaetigt: true,
    })
    assert.deepEqual(entfernt, { ok: true })
    assert.deepEqual(aufrufe.filter((aufruf) => aufruf.startsWith('delete:') || aufruf.startsWith('update:')), [
      `update:${ID}:Arbeit`,
      `delete:${ID}`,
    ])
  })

  test('Passkey-Login bleibt AAL1 und öffnet denselben TOTP-Step-up', async () => {
    const { auth, aufrufe } = protokoll()
    const ergebnis = await passkeyAnmeldungAusfuehren(auth, offen)
    assert.deepEqual(ergebnis, { art: 'totp_step_up' })
    assert.deepEqual(aufrufe, ['signInWithPasskey', 'aal'])
    assert.equal(brauchtLoginTotpStepUp({ currentLevel: 'aal1', nextLevel: 'aal2' }), true)
    assert.equal(JSON.stringify(ergebnis).includes('aal2'), false)
    assert.equal(JSON.stringify(ergebnis).includes('@'), false)
    assert.equal(JSON.stringify(ergebnis).includes('nicht-loggen'), false)
  })

  test('bereits AAL2 geht weiter, fehlende AAL-Lesung nicht', async () => {
    const { auth } = protokoll()
    auth.mfa = {
      async getAuthenticatorAssuranceLevel() {
        return { data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null }
      },
    }
    assert.deepEqual(await passkeyAnmeldungAusfuehren(auth, offen), { art: 'weiter' })

    auth.mfa = {
      async getAuthenticatorAssuranceLevel() {
        return { data: null, error: { message: 'Auth session missing for person@example.com' } }
      },
    }
    const fehler = await passkeyAnmeldungAusfuehren(auth, offen)
    assert.deepEqual(fehler, { art: 'fehler', code: 'aal_unbekannt' })
    assert.equal(JSON.stringify(fehler).includes('@'), false)
  })

  test('Fehlercodes bleiben feste Sätze und wiederholen keine Rohmeldung', () => {
    const faelle: Array<{ fehler: { name?: string; code?: string; message?: string; status?: number }; code: PasskeyFehlerCode }> = [
      { fehler: { name: 'NotAllowedError', message: 'user cancelled person@example.com' }, code: 'abgebrochen' },
      { fehler: { name: 'AbortError' }, code: 'abgebrochen' },
      { fehler: { code: 'webauthn_challenge_expired', message: 'challenge expired secret=abc' }, code: 'challenge_abgelaufen' },
      { fehler: { code: 'webauthn_credential_exists' }, code: 'bereits_vorhanden' },
      { fehler: { code: 'passkey_disabled' }, code: 'server_aus' },
      { fehler: { name: 'SecurityError', message: 'relying party mismatch' }, code: 'origin' },
      { fehler: { message: 'Failed to fetch' }, code: 'netz' },
      { fehler: { message: 'person@example.com token=sbp_secret' }, code: 'unbekannt' },
    ]
    for (const fall of faelle) {
      const code = passkeyFehlerCode(fall.fehler)
      assert.equal(code, fall.code)
      const text = sicherheitText('de', passkeyFehlerSchluessel(code))
      const roh = fall.fehler.message ?? ''
      if (roh.length >= 12) assert.equal(text.toLowerCase().includes(roh.toLowerCase()), false)
      assert.equal(text.includes('@'), false)
      assert.doesNotMatch(text, /sbp_|secret=|token=/i)
    }
  })

  test('Passwort-Login und Admin-AAL2-Quelle bleiben die bestehende Prüfung', () => {
    const hier = dirname(fileURLToPath(import.meta.url))
    const login = readFileSync(join(hier, '../../components/auth/LoginForm.tsx'), 'utf8')
    const anmeldung = readFileSync(join(hier, '../../components/auth/PasskeyAnmeldung.tsx'), 'utf8')
    const port = readFileSync(join(hier, './passkey-port.ts'), 'utf8')
    const guard = readFileSync(join(hier, './admin-guard.ts'), 'utf8')
    const config = readFileSync(join(hier, '../../supabase/config.toml'), 'utf8')
    assert.match(login, /signInWithPassword\(\{ email: em, password \}\)/)
    assert.match(login, /brauchtLoginTotpStepUp\(aal\)/)
    assert.match(login, /startTotpChallenge\(supabase\)/)
    assert.equal(anmeldung.includes('signInWithPassword'), false)
    assert.equal(anmeldung.includes('currentLevel'), false)
    assert.match(port, /brauchtLoginTotpStepUp\(aal\.data\)/)
    assert.equal(port.includes("currentLevel = 'aal2'"), false)
    assert.equal(port.includes('signInWithPasskey('), true)
    assert.match(guard, /applyAdminAal/)
    assert.match(config, /\[auth\.passkey\]\s*enabled = false/)
  })
})
