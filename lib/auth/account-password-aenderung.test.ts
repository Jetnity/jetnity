import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { RICHTLINIE_TEXT, passwortAblehnung } from '@/lib/auth/passwort-richtlinie'
import {
  PASSWORT_AENDERUNG_ANFANG,
  darfAenderungSenden,
  darfPasswortFormularZeigen,
  darfReauthStarten,
  nonceIstAnnehmbar,
  passwortAenderungErfolgBehaupten,
  passwortAenderungFehler,
  passwortAenderungFehlerEinordnen,
  passwortAenderungFehlerIstDicht,
  passwortAenderungLokalPruefen,
  passwortAenderungReauthAusfuehren,
  passwortAenderungSitzungLesen,
  passwortAenderungStatusText,
  passwortAenderungUpdateAusfuehren,
  passwortAenderungUpdateNutzlast,
  passwortAenderungWeiter,
  type PasswortAenderungAuth,
  type PasswortAenderungZustand,
} from '@/lib/auth/account-password-aenderung'

const ROH = [
  'Invalid nonce provided for reauthentication',
  'Password is known to be weak and easy to guess, please choose a different one.',
  'reauth_nonce_missing token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb',
  'otpauth://totp/Jetnity:user@example.com?secret=JBSWY3DPEHPK3PXP',
  'unexpected GoTrue error nonce=abc123 factor_id=12',
]

function lauf(
  start: PasswortAenderungZustand,
  ...ereignisse: Parameters<typeof passwortAenderungWeiter>[1][]
): PasswortAenderungZustand {
  return ereignisse.reduce((zustand, ereignis) => passwortAenderungWeiter(zustand, ereignis), start)
}

function authAttrappe(teil: Partial<PasswortAenderungAuth> & Pick<PasswortAenderungAuth, 'getUser'>): PasswortAenderungAuth {
  return {
    updateUser: async () => ({ error: null }),
    ...teil,
  }
}

describe('AP-5-S2 Passwortänderungs-Zustände', () => {
  test('trennt idle, requesting_code, code_sent, verifying, updating, success und error', () => {
    const angefordert = passwortAenderungWeiter(PASSWORT_AENDERUNG_ANFANG, { typ: 'starte_reauth' })
    assert.equal(angefordert.schritt, 'requesting_code')
    assert.equal(passwortAenderungErfolgBehaupten(angefordert), false)

    const gesendet = passwortAenderungWeiter(angefordert, { typ: 'reauth_ok' })
    assert.equal(gesendet.schritt, 'code_sent')
    assert.equal(passwortAenderungErfolgBehaupten(gesendet), false)

    const geprueft = passwortAenderungWeiter(gesendet, { typ: 'starte_pruefung' })
    assert.equal(geprueft.schritt, 'verifying')

    const speichert = passwortAenderungWeiter(geprueft, { typ: 'starte_update' })
    assert.equal(speichert.schritt, 'updating')
    assert.equal(passwortAenderungErfolgBehaupten(speichert), false)

    const fertig = passwortAenderungWeiter(speichert, { typ: 'update_ok' })
    assert.equal(fertig.schritt, 'success')
    assert.equal(passwortAenderungErfolgBehaupten(fertig), true)
    assert.match(passwortAenderungStatusText(fertig), /geändert/i)
  })

  test('startet Reauthentication nicht still und nicht aus fremden Lagen', () => {
    assert.equal(darfReauthStarten(PASSWORT_AENDERUNG_ANFANG), true)
    const still = passwortAenderungWeiter(
      { schritt: 'code_sent', fehler: null },
      { typ: 'starte_reauth' },
    )
    assert.equal(still.schritt, 'code_sent')
    assert.equal(darfReauthStarten(still), false)
  })

  test('behauptet Erfolg nicht nach lokalem oder Auth-Fehler', () => {
    const lokal = lauf(PASSWORT_AENDERUNG_ANFANG, { typ: 'starte_reauth' }, { typ: 'reauth_ok' }, {
      typ: 'starte_pruefung',
    }, {
      typ: 'pruefung_fehler',
      fehler: passwortAenderungFehler('password_policy'),
    })
    assert.equal(lokal.schritt, 'error')
    assert.equal(passwortAenderungErfolgBehaupten(lokal), false)
    assert.equal(darfAenderungSenden(lokal), true)
    assert.equal(darfPasswortFormularZeigen(lokal), true)

    const authFehler = lauf(PASSWORT_AENDERUNG_ANFANG, { typ: 'starte_reauth' }, {
      typ: 'reauth_fehler',
      fehler: passwortAenderungFehler('reauth_failed'),
    })
    assert.equal(authFehler.schritt, 'error')
    assert.equal(passwortAenderungErfolgBehaupten(authFehler), false)
    assert.equal(darfReauthStarten(authFehler), true)
  })

  test('unsupported und unavailable bleiben eigene Lagen', () => {
    const fehlt = passwortAenderungWeiter(PASSWORT_AENDERUNG_ANFANG, { typ: 'client_unbekannt' })
    assert.equal(fehlt.schritt, 'unsupported')
    assert.equal(darfReauthStarten(fehlt), false)
    assert.equal(darfPasswortFormularZeigen(fehlt), false)

    const ohneMail = passwortAenderungWeiter(PASSWORT_AENDERUNG_ANFANG, { typ: 'client_ohne_email' })
    assert.equal(ohneMail.schritt, 'unavailable')
    assert.match(passwortAenderungStatusText(ohneMail), /E-Mail/i)
  })

  test('Abbruch löscht den laufenden Versuch, nicht aber eine laufende Speicherung', () => {
    const gesendet = lauf(PASSWORT_AENDERUNG_ANFANG, { typ: 'starte_reauth' }, { typ: 'reauth_ok' })
    assert.equal(passwortAenderungWeiter(gesendet, { typ: 'abbrechen' }).schritt, 'idle')

    const speichert = lauf(
      PASSWORT_AENDERUNG_ANFANG,
      { typ: 'starte_reauth' },
      { typ: 'reauth_ok' },
      { typ: 'starte_pruefung' },
      { typ: 'starte_update' },
    )
    assert.equal(passwortAenderungWeiter(speichert, { typ: 'abbrechen' }).schritt, 'updating')
  })
})

describe('AP-5-S2 lokale Prüfung und Nutzlast', () => {
  test('nutzt die kanonische Passwortregel und kein Current-Password-Feld', () => {
    const nutzlast = passwortAenderungUpdateNutzlast({
      passwort: 'Reiseplanung1!',
      nonce: ' 123456 ',
    })
    assert.deepEqual(nutzlast, { password: 'Reiseplanung1!', nonce: '123456' })
    assert.equal('currentPassword' in nutzlast, false)
    assert.equal('current_password' in nutzlast, false)

    assert.equal(
      passwortAenderungLokalPruefen({
        nonce: '123456',
        passwort: 'kurz',
        wiederholung: 'kurz',
      })?.code,
      'password_policy',
    )
    assert.equal(
      passwortAenderungLokalPruefen({
        nonce: '123456',
        passwort: 'Reiseplanung1!',
        wiederholung: 'Reiseplanung2!',
      })?.code,
      'password_mismatch',
    )
    assert.equal(
      passwortAenderungLokalPruefen({
        nonce: '123456',
        passwort: 'Reiseplanung1!',
        wiederholung: 'Reiseplanung1!',
      }),
      null,
    )
  })

  test('Nonce bleibt nur annehmbar, wenn sie kurz und ohne Leerzeichen ist', () => {
    assert.equal(nonceIstAnnehmbar('123456'), true)
    assert.equal(nonceIstAnnehmbar('ab12'), true)
    assert.equal(nonceIstAnnehmbar(''), false)
    assert.equal(nonceIstAnnehmbar('12'), false)
    assert.equal(nonceIstAnnehmbar('12 34'), false)
    assert.equal(nonceIstAnnehmbar('n'.repeat(65)), false)
    assert.equal(passwortAenderungLokalPruefen({
      nonce: '',
      passwort: 'Reiseplanung1!',
      wiederholung: 'Reiseplanung1!',
    })?.code, 'nonce_missing')
  })
})

describe('AP-5-S2 Fehlerabbildung', () => {
  test('bildet GoTrue- und HIBP-Fehler auf stabile Produktcopy ab', () => {
    const leck = passwortAenderungFehlerEinordnen({
      vorgang: 'update',
      meldung: 'Password is known to be weak and easy to guess, please choose a different one.',
    })
    assert.equal(leck.code, 'password_leaked')
    assert.equal(leck.text, passwortAblehnung('Password is known to be weak and easy to guess'))
    assert.notEqual(leck.text, RICHTLINIE_TEXT)

    const regel = passwortAenderungFehlerEinordnen({
      vorgang: 'update',
      meldung: 'Password should be at least 12 characters.',
    })
    assert.equal(regel.code, 'password_policy')
    assert.equal(regel.text, RICHTLINIE_TEXT)

    const nonce = passwortAenderungFehlerEinordnen({
      vorgang: 'update',
      code: 'reauthentication_not_valid',
      meldung: 'Reauthentication not valid',
    })
    assert.equal(nonce.code, 'nonce_invalid')

    const abgelaufen = passwortAenderungFehlerEinordnen({
      vorgang: 'update',
      code: 'otp_expired',
    })
    assert.equal(abgelaufen.code, 'nonce_expired')
    assert.equal(abgelaufen.erneut, 'idle')

    const gleich = passwortAenderungFehlerEinordnen({
      vorgang: 'update',
      code: 'same_password',
    })
    assert.equal(gleich.code, 'password_same')
    assert.doesNotMatch(gleich.text, /aktuelles Passwort|currentPassword/i)
  })

  test('Sitzungslesen trennt network, unknown und session_required', () => {
    const netz = passwortAenderungFehlerEinordnen({
      vorgang: 'sitzung',
      meldung: 'Failed to fetch',
      status: 0,
    })
    assert.equal(netz.code, 'network')

    const server = passwortAenderungFehlerEinordnen({
      vorgang: 'sitzung',
      meldung: 'unexpected_failure',
      code: 'unexpected_failure',
      status: 500,
    })
    assert.equal(server.code, 'unknown')
    assert.notEqual(server.code, 'session_required')

    const sitzung = passwortAenderungFehlerEinordnen({
      vorgang: 'sitzung',
      meldung: 'Auth session missing!',
      code: 'session_not_found',
      status: 401,
    })
    assert.equal(sitzung.code, 'session_required')
  })

  test('lässt keine Rohtexte, Tokens oder Nonces in die Nutzercopy', () => {
    for (const roh of ROH) {
      for (const vorgang of ['reauth', 'update', 'sitzung'] as const) {
        const ergebnis = passwortAenderungFehlerEinordnen({ vorgang, meldung: roh })
        assert.equal(passwortAenderungFehlerIstDicht(ergebnis.text, roh), true, `${vorgang}: ${roh}`)
        assert.doesNotMatch(ergebnis.text, /otpauth|nonce=|eyJ|GoTrue|factor_id|reauthenticate/i)
      }
    }
  })
})

describe('AP-5-S2 Auth-Aufrufe', () => {
  test('liest die Sitzung über getUser und startet dabei keine Reauthentication', async () => {
    let reauth = 0
    const ereignis = await passwortAenderungSitzungLesen(
      authAttrappe({
        getUser: async () => ({ data: { user: { email: 'alex@example.com' } }, error: null }),
        reauthenticate: async () => {
          reauth += 1
          return { error: null }
        },
      }),
    )
    assert.equal(ereignis.typ, 'client_bereit')
    assert.equal(reauth, 0)
  })

  test('behauptet bei getUser()-Netzfehlern keinen Sitzungsverlust', async () => {
    const antwort = await passwortAenderungSitzungLesen(
      authAttrappe({
        getUser: async () => ({
          data: { user: null },
          error: { message: 'TypeError: Failed to fetch', status: 0 },
        }),
        reauthenticate: async () => ({ error: null }),
      }),
    )
    assert.equal(antwort.typ, 'sitzung_fehler')
    if (antwort.typ !== 'sitzung_fehler') return
    assert.equal(antwort.fehler.code, 'network')
    const lage = passwortAenderungWeiter(PASSWORT_AENDERUNG_ANFANG, antwort)
    assert.equal(lage.fehler?.code, 'network')
    assert.notEqual(lage.fehler?.code, 'session_required')
    assert.match(passwortAenderungStatusText(lage), /Verbindung/i)
    assert.doesNotMatch(passwortAenderungStatusText(lage), /Sitzung ist nicht mehr gültig/i)

    const geworfen = await passwortAenderungSitzungLesen(
      authAttrappe({
        getUser: async () => {
          throw new Error('Failed to fetch')
        },
        reauthenticate: async () => ({ error: null }),
      }),
    )
    assert.equal(geworfen.typ, 'sitzung_fehler')
    if (geworfen.typ !== 'sitzung_fehler') return
    assert.equal(geworfen.fehler.code, 'network')
  })

  test('behauptet bei unbekanntem oder 5xx-getUser()-Fehler keinen Sitzungsverlust', async () => {
    const ereignis = await passwortAenderungSitzungLesen(
      authAttrappe({
        getUser: async () => ({
          data: { user: null },
          error: { message: 'unexpected GoTrue failure', code: 'unexpected_failure', status: 500 },
        }),
        reauthenticate: async () => ({ error: null }),
      }),
    )
    assert.equal(ereignis.typ, 'sitzung_fehler')
    if (ereignis.typ !== 'sitzung_fehler') return
    assert.equal(ereignis.fehler.code, 'unknown')
    const lage = passwortAenderungWeiter(PASSWORT_AENDERUNG_ANFANG, ereignis)
    assert.equal(lage.fehler?.code, 'unknown')
    assert.notEqual(lage.fehler?.code, 'session_required')
    assert.doesNotMatch(passwortAenderungStatusText(lage), /Sitzung ist nicht mehr gültig/i)
    assert.equal(passwortAenderungFehlerIstDicht(lage.fehler?.text ?? '', 'unexpected GoTrue failure'), true)
  })

  test('behält session_required nur bei belegter Session-Evidence', async () => {
    const fehlt = await passwortAenderungSitzungLesen(
      authAttrappe({
        getUser: async () => ({
          data: { user: null },
          error: { message: 'Auth session missing!', code: 'session_not_found', status: 401 },
        }),
        reauthenticate: async () => ({ error: null }),
      }),
    )
    assert.equal(fehlt.typ, 'client_ohne_sitzung')
    const fehltLage = passwortAenderungWeiter(PASSWORT_AENDERUNG_ANFANG, fehlt)
    assert.equal(fehltLage.fehler?.code, 'session_required')

    const ohneUser = await passwortAenderungSitzungLesen(
      authAttrappe({
        getUser: async () => ({ data: { user: null }, error: null }),
        reauthenticate: async () => ({ error: null }),
      }),
    )
    assert.equal(ohneUser.typ, 'client_ohne_sitzung')
  })

  test('erkennt fehlende reauthenticate()-API als unsupported', async () => {
    const ereignis = await passwortAenderungSitzungLesen(
      authAttrappe({
        getUser: async () => ({ data: { user: { email: 'alex@example.com' } }, error: null }),
      }),
    )
    assert.equal(ereignis.typ, 'client_unbekannt')
  })

  test('sendet updateUser nur mit password und nonce', async () => {
    let nutzlast: { password?: string; nonce?: string; currentPassword?: string } | null = null
    const ereignis = await passwortAenderungUpdateAusfuehren(
      authAttrappe({
        getUser: async () => ({ data: { user: { email: 'alex@example.com' } }, error: null }),
        reauthenticate: async () => ({ error: null }),
        updateUser: async (eingabe) => {
          nutzlast = eingabe
          return { error: null }
        },
      }),
      { passwort: 'Reiseplanung1!', nonce: '654321' },
    )
    assert.equal(ereignis.typ, 'update_ok')
    assert.deepEqual(nutzlast, { password: 'Reiseplanung1!', nonce: '654321' })
  })

  test('mappt fehlgeschlagenes reauthenticate() ohne Rohtext', async () => {
    const ereignis = await passwortAenderungReauthAusfuehren(
      authAttrappe({
        getUser: async () => ({ data: { user: { email: 'alex@example.com' } }, error: null }),
        reauthenticate: async () => ({
          error: { message: 'unexpected GoTrue error nonce=secret', status: 500 },
        }),
      }),
    )
    assert.equal(ereignis.typ, 'reauth_fehler')
    if (ereignis.typ !== 'reauth_fehler') return
    assert.equal(ereignis.fehler.code, 'reauth_failed')
    assert.equal(passwortAenderungFehlerIstDicht(ereignis.fehler.text, 'nonce=secret'), true)
  })
})
