import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PasskeyManagement } from '@/components/account/PasskeyManagement'
import PasskeyAnmeldung from '@/components/auth/PasskeyAnmeldung'
import { PasskeySignIn } from '@/components/auth/PasskeySignIn'

const ID = '11111111-1111-4111-8111-111111111111'
const noop = () => undefined

const basis = {
  liste: { art: 'leer' as const },
  kontoBestaetigt: true,
  meldung: null,
  beschaeftigt: false,
  entfernenFuer: null,
  umbenennenFuer: null,
  nameEntwurf: '',
  nachweis: null,
}

function html(knoten: ReturnType<typeof createElement>) {
  return renderToStaticMarkup(knoten)
}

describe('Passkey-Oberfläche, MOCK_PASS', () => {
  test('geschlossene Anmeldung hat keine Schaltfläche', () => {
    const geschlossen = html(createElement(PasskeySignIn, {
      bereit: false,
      meldung: null,
      beschaeftigt: false,
      onAnmelden: noop,
    }))
    assert.match(geschlossen, /data-passkey-login="geschlossen"/)
    assert.equal(geschlossen.includes('<button'), false)
    assert.match(geschlossen, /nicht verfügbar/)
    assert.match(geschlossen, /Passwort/)

    const bereit = html(createElement(PasskeySignIn, {
      bereit: true,
      meldung: null,
      beschaeftigt: false,
      onAnmelden: noop,
    }))
    assert.match(bereit, /data-passkey-login="bereit"/)
    assert.match(bereit, /Mit Passkey anmelden/)

    const seite = html(createElement(PasskeyAnmeldung, {
      serverAktiviert: false,
      auth: {},
      sprache: 'en',
      onStepUp: async () => undefined,
      onWeiter: noop,
      onSitzungBeenden: async () => ({ beendet: true }),
    }))
    assert.match(seite, /data-passkey-login="geschlossen"/)
    assert.match(seite, /currently unavailable/)
    assert.equal(seite.includes('nicht verfügbar'), false)
    assert.equal(seite.includes('<button'), false)
    assert.match(seite, /data-passkey-login="geschlossen"/)
    assert.equal(seite.includes('<button'), false)
  })

  test('Verwaltung zeigt Registrierung nur bei bestätigtem Konto und bekannter Liste', () => {
    const leer = html(createElement(PasskeyManagement, {
      sprache: 'de',
      ansicht: basis,
      onRegistrieren: noop,
      onUmbenennenStart: noop,
      onName: noop,
      onUmbenennenSpeichern: noop,
      onUmbenennenAbbrechen: noop,
      onEntfernenStart: noop,
      onEntfernenBestaetigen: noop,
      onEntfernenAbbrechen: noop,
    }))
    assert.match(leer, /Passkey hinzufügen/)
    assert.match(leer, /ersetzt weder das Passwort/)

    const unbestaetigt = html(createElement(PasskeyManagement, {
      sprache: 'de',
      ansicht: { ...basis, kontoBestaetigt: false },
      onRegistrieren: noop,
      onUmbenennenStart: noop,
      onName: noop,
      onUmbenennenSpeichern: noop,
      onUmbenennenAbbrechen: noop,
      onEntfernenStart: noop,
      onEntfernenBestaetigen: noop,
      onEntfernenAbbrechen: noop,
    }))
    assert.equal(unbestaetigt.includes('Passkey hinzufügen'), false)
    assert.match(unbestaetigt, /bestätigt ist/)

    const fehler = html(createElement(PasskeyManagement, {
      sprache: 'de',
      ansicht: { ...basis, liste: { art: 'fehler', code: 'unbekannt' } },
      onRegistrieren: noop,
      onUmbenennenStart: noop,
      onName: noop,
      onUmbenennenSpeichern: noop,
      onUmbenennenAbbrechen: noop,
      onEntfernenStart: noop,
      onEntfernenBestaetigen: noop,
      onEntfernenAbbrechen: noop,
    }))
    assert.match(fehler, /unbekannt/)
    assert.equal(fehler.includes('Passkey hinzufügen'), false)
    assert.equal(fehler.includes('Noch kein Passkey'), false)
  })

  test('Entfernen braucht eine zweite Bestätigung und zeigt keine E-Mail', () => {
    const liste = html(createElement(PasskeyManagement, {
      sprache: 'de',
      ansicht: {
        ...basis,
        liste: { art: 'liste', eintraege: [{ id: ID, anzeigename: 'Arbeit', erstelltAm: '2026-11-18' }] },
        entfernenFuer: ID,
      },
      onRegistrieren: noop,
      onUmbenennenStart: noop,
      onName: noop,
      onUmbenennenSpeichern: noop,
      onUmbenennenAbbrechen: noop,
      onEntfernenStart: noop,
      onEntfernenBestaetigen: noop,
      onEntfernenAbbrechen: noop,
    }))
    assert.match(liste, /Endgültig entfernen/)
    assert.match(liste, /Passwort und Authenticator-App/)
    assert.match(liste, /Arbeit/)
    assert.equal(liste.includes('person@example.com'), false)
    assert.doesNotMatch(liste, /private key|credentialPrivate/i)
  })

  test('Security-Seite und Login behalten die bestehende TOTP-Verdrahtung', () => {
    const hier = dirname(fileURLToPath(import.meta.url))
    const mfa = readFileSync(join(hier, '../../components/account/SecurityMFA.tsx'), 'utf8')
    const login = readFileSync(join(hier, '../../components/auth/LoginForm.tsx'), 'utf8')
    assert.match(mfa, /data-passkey-lage=\{aktuellePasskeyLage\}/)
    assert.match(mfa, /passkeyHandlungErlaubt/)
    assert.equal(mfa.includes('Passkey hinzufügen'), false)
    assert.equal(mfa.includes('err.message'), false)
    assert.equal(mfa.includes('signInWithPasskey'), false)
    assert.match(login, /<PasskeyAnmeldung/)
    assert.match(login, /router\.replace\(nachErfolg\)/)
    assert.equal(login.includes('void supabase.auth.signOut'), false)
    assert.match(login, /passkeySitzungBeenden/)
    assert.match(login, /passkeyTotpDarfWeiterleiten/)
    assert.match(login, /signInWithPassword/)
  })
})
