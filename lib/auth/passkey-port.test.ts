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
  passkeySitzungBeenden,
  passkeyTotpDarfWeiterleiten,
  passkeyTotpDialogGeschlossen,
  passkeyTotpNachAbmeldung,
  passkeyUmbenennen,
  type PasskeyAuthSchnittstelle,
  type PasskeyFehlerCode,
  type PasskeyTotpLage,
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
const bestaetigt = { email: 'konto@example.com', email_confirmed_at: '2026-11-18T00:00:00Z', is_anonymous: false }
const FAKTOR = '33333333-3333-4333-8333-333333333333'
const CHALLENGE = 'challenge-1'
const passwortBeweis = { art: 'passwort' as const, passwort: 'frisches-passwort' }
const totpBeweis = { art: 'totp' as const, factorId: FAKTOR, challengeId: CHALLENGE, code: '123456' }

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
    async signInWithPassword() {
      aufrufe.push('signInWithPassword')
      return { data: {}, error: null }
    },
    async signOut() {
      aufrufe.push('signOut')
      return { error: null }
    },
    mfa: {
      async listFactors() {
        aufrufe.push('listFactors')
        return { data: { all: [] }, error: null }
      },
      async verify() {
        aufrufe.push('verify')
        return { error: null }
      },
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
    const registrierung = await passkeyRegistrieren(auth, zu, passwortBeweis)
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
      return { data: { user: { email: 'konto@example.com', is_anonymous: true, email_confirmed_at: '2026-11-18T00:00:00Z' } }, error: null }
    }
    const ohneNachweis = await passkeyRegistrieren(auth, offen, null)
    assert.deepEqual(ohneNachweis, { ok: false, code: 'nicht_erlaubt' })
    assert.equal(aufrufe.includes('registerPasskey'), false)

    const anonym = await passkeyRegistrieren(auth, offen, passwortBeweis)
    assert.deepEqual(anonym, { ok: false, code: 'konto_nicht_bestaetigt' })
    assert.equal(aufrufe.includes('registerPasskey'), false)

    auth.getUser = async () => {
      aufrufe.push('getUser')
      return { data: { user: bestaetigt }, error: null }
    }
    const ok = await passkeyRegistrieren(auth, offen, passwortBeweis)
    assert.deepEqual(ok, { ok: true })
    assert.equal(aufrufe.filter((aufruf) => aufruf === 'registerPasskey').length, 1)
    assert.equal(JSON.stringify(ok).includes('konto@example.com'), false)
    assert.equal(JSON.stringify(ok).includes('frisches-passwort'), false)
  })

  test('vorhandener TOTP lässt das Passwort als Schreibnachweis nicht zu', async () => {
    const { auth, aufrufe } = protokoll()
    auth.mfa = {
      ...auth.mfa,
      async listFactors() {
        aufrufe.push('listFactors')
        return { data: { all: [{ id: FAKTOR, factor_type: 'totp', status: 'verified' }] }, error: null }
      },
      async getAuthenticatorAssuranceLevel() {
        aufrufe.push('aal')
        return { data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null }
      },
    }
    const passwort = await passkeyRegistrieren(auth, offen, passwortBeweis)
    assert.deepEqual(passwort, { ok: false, code: 'nicht_erlaubt' })
    assert.equal(aufrufe.includes('signInWithPassword'), false)
    assert.equal(aufrufe.includes('registerPasskey'), false)

    auth.mfa = {
      ...auth.mfa,
      async getAuthenticatorAssuranceLevel() {
        aufrufe.push('aal')
        return { data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null }
      },
    }
    const totp = await passkeyRegistrieren(auth, offen, totpBeweis)
    assert.deepEqual(totp, { ok: true })
    assert.equal(aufrufe.includes('verify'), true)
    assert.equal(aufrufe.includes('registerPasskey'), true)
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
    const name = await passkeyUmbenennen(auth, offen, { id: ANDERE, name: 'Neu', gelisteteIds: [ID], beweis: passwortBeweis })
    assert.deepEqual(name, { ok: false, code: 'nicht_gelistet' })
    const mail = await passkeyUmbenennen(auth, offen, { id: ID, name: 'person@example.com', gelisteteIds: [ID], beweis: passwortBeweis })
    assert.deepEqual(mail, { ok: false, code: 'name_ungueltig' })
    const umbenannt = await passkeyUmbenennen(auth, offen, { id: ID, name: 'Arbeit', gelisteteIds: [ID], beweis: passwortBeweis })
    assert.deepEqual(umbenannt, { ok: true })

    const ohneNachweis = await passkeyEntfernen(auth, offen, {
      id: ID,
      gelisteteIds: [ID],
      beweis: null,
    })
    assert.deepEqual(ohneNachweis, { ok: false, code: 'nicht_erlaubt' })
    const entfernt = await passkeyEntfernen(auth, offen, {
      id: ID,
      gelisteteIds: [ID],
      beweis: passwortBeweis,
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
    assert.equal(aufrufe.includes('signOut'), false)
    assert.equal(brauchtLoginTotpStepUp({ currentLevel: 'aal1', nextLevel: 'aal2' }), true)
    assert.equal(JSON.stringify(ergebnis).includes('aal2'), false)
    assert.equal(JSON.stringify(ergebnis).includes('@'), false)
    assert.equal(JSON.stringify(ergebnis).includes('nicht-loggen'), false)
  })

  test('bereits AAL2 geht weiter, fehlende AAL-Lesung nicht', async () => {
    const { auth, aufrufe } = protokoll()
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
    auth.signOut = async () => {
      aufrufe.push('signOut')
      return { error: null }
    }
    const fehler = await passkeyAnmeldungAusfuehren(auth, offen)
    assert.deepEqual(fehler, { art: 'fehler', code: 'aal_unbekannt' })
    assert.equal(JSON.stringify(fehler).includes('@'), false)
    assert.equal(aufrufe.includes('signOut'), true)
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

  test('abgebrochener Passkey-TOTP leitet nicht weiter, auch wenn die Abmeldung fehlt oder scheitert', async () => {
    const passwort = passkeyTotpDialogGeschlossen('zu')
    assert.equal(passwort, 'zu')
    assert.equal(passkeyTotpDarfWeiterleiten(passwort), false)

    let lage: PasskeyTotpLage = passkeyTotpDialogGeschlossen('dialog')
    assert.equal(lage, 'beenden')
    assert.equal(passkeyTotpDarfWeiterleiten(lage), false)
    assert.equal(sicherheitText('de', 'logout.status.working'), 'Abmeldung wird ausgeführt.')
    assert.equal(sicherheitText('en', 'logout.status.working'), 'Signing out.')

    let freigabe: (wert: { error: { message: string } | null }) => void = () => undefined
    const verzoegert = passkeySitzungBeenden({
      signOut: () => new Promise<{ error: { message: string } | null }>((resolve) => {
        freigabe = resolve
      }),
    })
    assert.equal(passkeyTotpDarfWeiterleiten(lage), false)
    freigabe({ error: { message: 'Failed to fetch' } })
    const netz = await verzoegert
    assert.deepEqual(netz, { beendet: false })
    lage = passkeyTotpNachAbmeldung(lage, netz.beendet)
    assert.equal(lage, 'offen')
    assert.equal(passkeyTotpDarfWeiterleiten(lage), false)
    assert.equal(sicherheitText('de', 'logout.status.error'), 'Die Abmeldung konnte nicht bestätigt werden.')
    assert.equal(sicherheitText('en', 'logout.status.error'), 'Sign-out could not be confirmed.')

    assert.deepEqual(await passkeySitzungBeenden({}), { beendet: false })
    assert.deepEqual(await passkeySitzungBeenden({
      signOut: async () => {
        throw new Error('Failed to fetch')
      },
    }), { beendet: false })
    assert.deepEqual(await passkeySitzungBeenden({
      signOut: async () => ({ error: { message: 'network down' } }),
    }), { beendet: false })

    const bestaetigt = await passkeySitzungBeenden({
      signOut: async () => ({ error: null }),
    })
    assert.deepEqual(bestaetigt, { beendet: true })
    lage = passkeyTotpNachAbmeldung('beenden', bestaetigt.beendet)
    assert.equal(lage, 'zu')
    assert.equal(passkeyTotpDarfWeiterleiten(lage), false)
    assert.equal(sicherheitText('de', 'logout.status.success'), 'Die Abmeldung wurde bestätigt.')
    assert.equal(sicherheitText('en', 'logout.status.success'), 'Sign-out was confirmed.')
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
    assert.equal(login.includes('void supabase.auth.signOut'), false)
    assert.match(login, /passkeySitzungBeenden\(supabase\.auth\)/)
    assert.match(login, /passkeyTotpDarfWeiterleiten\(passkeyLageRef\.current\)/)
    assert.equal(anmeldung.includes('signInWithPassword'), false)
    assert.equal(anmeldung.includes('currentLevel'), false)
    assert.match(port, /brauchtLoginTotpStepUp\(aal\.data\)/)
    assert.equal(port.includes("currentLevel = 'aal2'"), false)
    assert.equal(port.includes('signInWithPasskey('), true)
    assert.match(guard, /applyAdminAal/)
    assert.match(config, /\[auth\.passkey\]\s*enabled = true/)
  })
})
