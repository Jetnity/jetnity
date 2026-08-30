import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  GLOBALES_SIGN_OUT_ZIEL_ADMIN,
  GLOBALES_SIGN_OUT_ZIEL_PUBLIC,
  globalesSignOutAusAntwort,
  globalesSignOutAusfuehren,
  globalesSignOutAusWurf,
  globalesSignOutDarfWeiterleiten,
  globalesSignOutFehler,
  globalesSignOutFehlerEinordnen,
  globalesSignOutFehlerIstDicht,
  globalesSignOutWeiterleitungsziel,
  globalesSignOutZielLesen,
} from '@/lib/auth/globales-sign-out'

const ROH = [
  'AuthApiError: Failed to fetch refresh_token=sbp_secret',
  'unexpected GoTrue error access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb',
  'session_id=12 authorization: Bearer abc',
]

describe('AP-5-R1 allgemeines Sign-Out', () => {
  test('öffentlicher Erfolg bleibt auf / und ruft signOut ohne Argumente auf', async () => {
    const gesehen: unknown[] = []
    const ergebnis = await globalesSignOutAusfuehren(
      {
        signOut: async (...args: unknown[]) => {
          gesehen.push(args)
          return { error: null }
        },
      },
      GLOBALES_SIGN_OUT_ZIEL_PUBLIC,
    )
    assert.deepEqual(gesehen, [[]])
    assert.deepEqual(ergebnis, { ok: true, ziel: '/' })
    assert.equal(globalesSignOutDarfWeiterleiten(ergebnis), true)
    assert.equal(globalesSignOutWeiterleitungsziel(ergebnis), '/')
  })

  test('Admin-Erfolg bleibt auf /admin/login', async () => {
    const ergebnis = await globalesSignOutAusfuehren(
      { signOut: async () => ({ error: null }) },
      GLOBALES_SIGN_OUT_ZIEL_ADMIN,
    )
    assert.deepEqual(ergebnis, { ok: true, ziel: '/admin/login' })
    assert.equal(globalesSignOutDarfWeiterleiten(ergebnis), true)
    assert.equal(globalesSignOutWeiterleitungsziel(ergebnis), '/admin/login')
  })

  test('zurückgegebener Auth-Fehler verhindert den Success-Redirect', async () => {
    const ergebnis = await globalesSignOutAusfuehren(
      {
        signOut: async () => ({
          error: { message: 'AuthApiError: session revoke failed refresh_token=sbp_secret', code: 'unexpected_failure' },
        }),
      },
      '/',
    )
    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) {
      assert.equal(ergebnis.fehler.code, 'failed')
      assert.equal(ergebnis.fehler.text.includes('nicht bestätigt'), true)
      assert.equal(ergebnis.fehler.text.includes('refresh_token'), false)
      assert.equal(ergebnis.fehler.text.includes('sbp_secret'), false)
      assert.equal(globalesSignOutFehlerIstDicht(ergebnis.fehler.text, 'refresh_token=sbp_secret'), true)
    }
    assert.equal(globalesSignOutDarfWeiterleiten(ergebnis), false)
    assert.equal(globalesSignOutWeiterleitungsziel(ergebnis), null)
  })

  test('geworfener Netzfehler ist kein Erfolg', async () => {
    const ergebnis = await globalesSignOutAusfuehren(
      {
        signOut: async () => {
          throw new Error('Failed to fetch')
        },
      },
      '/admin/login',
    )
    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) {
      assert.equal(ergebnis.fehler.code, 'network')
      assert.equal(ergebnis.fehler.text.includes('unbestätigt'), true)
      assert.equal(ergebnis.fehler.text.includes('Failed to fetch'), false)
    }
    assert.equal(globalesSignOutDarfWeiterleiten(ergebnis), false)
    assert.equal(globalesSignOutWeiterleitungsziel(ergebnis), null)
  })

  test('lehnt anfragegesteuerte oder fremde Ziele fail-closed ab', async () => {
    assert.equal(globalesSignOutZielLesen('/'), '/')
    assert.equal(globalesSignOutZielLesen('/admin/login'), '/admin/login')
    assert.equal(globalesSignOutZielLesen('https://evil.example'), null)
    assert.equal(globalesSignOutZielLesen('//evil.example'), null)
    assert.equal(globalesSignOutZielLesen('/admin'), null)
    assert.equal(globalesSignOutZielLesen('/admin/login?next=https://evil.example'), null)
    assert.equal(globalesSignOutZielLesen('/account'), null)
    assert.equal(globalesSignOutZielLesen(''), null)

    const trotzErfolg = await globalesSignOutAusfuehren(
      { signOut: async () => ({ error: null }) },
      'https://evil.example',
    )
    assert.equal(trotzErfolg.ok, false)
    assert.equal(globalesSignOutDarfWeiterleiten(trotzErfolg), false)
    assert.equal(globalesSignOutWeiterleitungsziel(trotzErfolg), null)
  })

  test('Antwort- und Wurf-Pfad bleiben provider-dicht', () => {
    const antwort = globalesSignOutAusAntwort(
      { message: ROH[1], code: 'bad_jwt' },
      '/',
    )
    assert.equal(antwort.ok, false)
    if (!antwort.ok) {
      assert.equal(antwort.fehler.code, 'failed')
      for (const roh of ROH) {
        assert.equal(antwort.fehler.text.includes(roh), false)
        assert.equal(globalesSignOutFehlerIstDicht(antwort.fehler.text, roh), true)
      }
    }

    const wurf = globalesSignOutAusWurf(new Error(ROH[1]))
    assert.equal(wurf.ok, false)
    if (!wurf.ok) {
      assert.equal(wurf.fehler.text.includes('eyJ'), false)
      assert.equal(globalesSignOutFehlerIstDicht(wurf.fehler.text, ROH[1]), true)
    }

    const rate = globalesSignOutFehlerEinordnen({ message: 'Too many requests', status: 429 })
    assert.deepEqual(rate, globalesSignOutFehler('rate_limited'))
    assert.equal(globalesSignOutFehlerIstDicht(rate.text), true)
  })

  test('fehlende signOut-Funktion ist kein Erfolg', async () => {
    const ergebnis = await globalesSignOutAusfuehren(
      { signOut: undefined as unknown as () => Promise<{ error?: unknown }> },
      '/',
    )
    assert.equal(ergebnis.ok, false)
    assert.equal(globalesSignOutDarfWeiterleiten(ergebnis), false)
  })
})
