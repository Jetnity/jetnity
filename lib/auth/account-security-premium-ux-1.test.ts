import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { SICHERHEIT_EINGABE_16, SICHERHEIT_ZIEL_44 } from '@/lib/auth/account-security-premium-ux-1'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const lese = (pfad: string) => readFileSync(join(wurzel, pfad), 'utf8')

const einstellungen = lese('app/account/settings/page.tsx')
const sicherheit = lese('app/account/security/page.tsx')
const loeschen = lese('components/account/KontoLoeschen.tsx')
const passwort = lese('components/account/SecurityPasswort.tsx')
const sitzung = lese('components/account/SecuritySitzung.tsx')
const logout = lese('components/account/SecurityLogout.tsx')
const mfa = lese('components/account/SecurityMFA.tsx')
const darstellung = lese('lib/auth/account-security-premium-ux-1.ts')

describe('Account Settings + Security Premium UX 1', () => {
  test('Darstellungsklassen bleiben ohne Auth-Semantik', () => {
    assert.match(SICHERHEIT_ZIEL_44, /min-h-11/)
    assert.match(SICHERHEIT_ZIEL_44, /pointer-fine:min-h-11/)
    assert.match(SICHERHEIT_EINGABE_16, /text-base/)
    assert.match(SICHERHEIT_EINGABE_16, /pointer-fine:text-base/)
    assert.equal(darstellung.includes('createBrowserClient'), false)
    assert.equal(darstellung.includes('signOut'), false)
    assert.equal(darstellung.includes('reauthenticate'), false)
  })

  test('Lösch-Zugangsdaten stehen hinter ausdrücklicher Vorbereitung', () => {
    assert.match(loeschen, /Kontolöschung vorbereiten/)
    assert.match(loeschen, /formularSichtbar/)
    assert.match(loeschen, /KONTO LÖSCHEN/)
    assert.match(loeschen, /Aktuelles Passwort/)
    assert.match(loeschen, /Daten zuerst exportieren/)
    assert.match(loeschen, /href="\/api\/account\/export"/)
    assert.match(loeschen, /variant="destructive"/)
    assert.equal(loeschen.includes('autoFocus'), false)
    assert.match(loeschen, /if \(zustand\.phase !== 'bereit'\) return/)
    const formular = loeschen.slice(loeschen.indexOf('formularSichtbar ?'))
    assert.match(formular, /id="konto-loeschen-passwort"/)
    assert.match(formular, /id="konto-loeschen-bestaetigung"/)
    assert.match(einstellungen, /loeschungAngeboten \? <KontoLoeschen \/> : null/)
    assert.match(einstellungen, /href="\/account\/security"/)
    assert.match(einstellungen, /Gefahrenbereich/)
    assert.equal(einstellungen.includes('Sicherheitsbewertung'), false)
  })

  test('Passwort, Sitzung, Abmelden, TOTP und Passkeys bleiben ehrlich', () => {
    assert.match(passwort, /Passwort ändern/)
    assert.match(passwort, /reauthenticate/)
    assert.equal(passwort.includes('current-password'), false)
    assert.equal(passwort.includes('currentPassword'), false)
    assert.match(sicherheit, /diese Sitzung/)
    assert.match(sicherheit, /aria-label="Sicherheitsbereiche"/)
    assert.match(sicherheit, /passkeysServerAktiviertLesen\(\)/)
    assert.equal(sicherheit.includes('listSessions'), false)
    assert.equal(sicherheit.includes('Sicherheitsbewertung'), false)
    assert.match(sitzung, /ANDERE_SITZUNGEN_TEXT/)
    assert.equal(sitzung.includes('0 Geräte'), false)
    assert.equal(sitzung.includes('<ul'), false)
    assert.match(logout, /data-logout-action=\{scope\}/)
    assert.match(logout, /LOGOUT_JWT_HINWEIS/)
    assert.match(logout, /Abmeldeoptionen/)
    assert.match(logout, /optionenSichtbar/)
    assert.match(logout, /if \(zustand\.lage !== "idle" \|\| zustand\.bestaetigungFuer !== null\) return/)
    assert.equal(logout.includes('listSessions'), false)
    assert.match(mfa, /data-security-lage=\{totpLage\}/)
    assert.match(mfa, /data-passkey-lage=\{aktuellePasskeyLage\}/)
    assert.match(mfa, /mfaUnenrollVorbereiten/)
    assert.match(mfa, /mfa\.enroll/)
    assert.equal(mfa.includes('Passkey hinzufügen'), false)
    assert.equal(mfa.includes('Gerät'), false)
    assert.equal(mfa.includes('otpauth'), false)
  })
})
