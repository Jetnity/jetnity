import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ANDERE_SITZUNGEN_TEXT,
  LOKAL_HINWEIS_LABEL,
  SITZUNG_ANFANG,
  SITZUNG_ANDERE_LAGE,
  SITZUNG_ZUGANGSCODE_HINWEIS,
  andereSitzungenAnzahl,
  andereSitzungenLage,
  andereSitzungenSindLeer,
  aktuelleSitzungLesen,
  lokalenGeraeteHinweisAbleiten,
  sitzungAalLesen,
  sitzungAalText,
  sitzungFehlerIstDicht,
  sitzungFaktenTexte,
  sitzungIstBeschaeftigt,
  sitzungStatusText,
  sitzungWeiter,
  sitzungZugangscodeText,
  zugangscodeZeitLesen,
  type SitzungAuth,
  type SitzungZustand,
} from '@/lib/auth/account-session-view'

const JETZT = 1_777_000_000
const ROH = [
  'AuthApiError: Failed to fetch refresh_token=sbp_secret',
  'unexpected GoTrue error access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb',
  'session_id=12 authorization: Bearer abc cookie=sb-auth-token',
]

function authAttrappe(teil: Partial<SitzungAuth> = {}): SitzungAuth {
  return {
    getUser: async () => ({ data: { user: { id: 'user-secret-id' } }, error: null }),
    getSession: async () => ({
      data: {
        session: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb',
          refresh_token: 'rt_secret',
          expires_at: JETZT + 1800,
          user: { id: 'user-secret-id' },
        },
      },
      error: null,
    }),
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({
        data: { currentLevel: 'aal1' },
        error: null,
      }),
    },
    ...teil,
  }
}

function texteEines(zustand: SitzungZustand): string[] {
  return [
    sitzungStatusText(zustand),
    ...sitzungFaktenTexte(zustand),
    ANDERE_SITZUNGEN_TEXT,
    zustand.lokal?.text ?? '',
    JSON.stringify(zustand),
  ]
}

describe('AP-5-S5 aktuelle Sitzung', () => {
  test('zeigt nur erlaubte Fakten und lässt andere Sitzungen unsupported', async () => {
    const zustand = await aktuelleSitzungLesen(authAttrappe(), null, JETZT)
    assert.equal(zustand.lage, 'current')
    assert.equal(zustand.andere, 'unsupported')
    assert.equal(andereSitzungenLage(), 'unsupported')
    assert.equal(andereSitzungenSindLeer(zustand), false)
    assert.equal(andereSitzungenAnzahl(zustand), null)
    assert.equal(zustand.aktuelle?.zugangscodeBisUnix, JETZT + 1800)
    assert.equal(zustand.aktuelle?.aal, 'aal1')
    assert.equal(zustand.fehler, null)
    const texte = texteEines(zustand)
    for (const text of texte) {
      assert.doesNotMatch(text, /user-secret-id|rt_secret|eyJ|0 Geräte|0 andere|listSessions/i)
      assert.equal(sitzungFehlerIstDicht(text), true, text)
    }
    assert.match(sitzungZugangscodeText(JETZT + 1800) ?? '', new RegExp(SITZUNG_ZUGANGSCODE_HINWEIS))
    assert.equal(sitzungAalText('aal1'), 'Passwort oder gleichwertige Anmeldung')
  })

  test('fehlende oder fehlerhafte Auth ergibt keine Fake-Session', async () => {
    const ohneApi = await aktuelleSitzungLesen({}, null, JETZT)
    assert.equal(ohneApi.lage, 'unsupported')
    assert.equal(ohneApi.aktuelle, null)
    assert.equal(ohneApi.andere, SITZUNG_ANDERE_LAGE)
    assert.doesNotMatch(sitzungStatusText(ohneApi), /0 Geräte|0 andere|keine Geräte/i)
    assert.match(sitzungStatusText(ohneApi), /nicht, dass keine Sitzung besteht/)

    const ohneUser = await aktuelleSitzungLesen(
      authAttrappe({ getUser: async () => ({ data: { user: null }, error: null }) }),
      null,
      JETZT,
    )
    assert.equal(ohneUser.lage, 'unavailable')
    assert.equal(ohneUser.aktuelle, null)
    assert.equal(ohneUser.andere, 'unsupported')

    const netz = await aktuelleSitzungLesen(
      authAttrappe({
        getUser: async () => {
          throw { message: 'Failed to fetch', status: 0 }
        },
      }),
      null,
      JETZT,
    )
    assert.equal(netz.lage, 'error')
    assert.equal(netz.fehler?.code, 'network')
    assert.equal(netz.aktuelle, null)
    assert.equal(sitzungFehlerIstDicht(sitzungStatusText(netz), 'Failed to fetch'), true)
  })

  test('AAL- oder Session-Nebenfehler zerstören die bestätigte aktuelle Sitzung nicht', async () => {
    const zustand = await aktuelleSitzungLesen(
      authAttrappe({
        getSession: async () => ({
          data: { session: null },
          error: { message: 'access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb' },
        }),
        mfa: {
          getAuthenticatorAssuranceLevel: async () => ({
            data: null,
            error: { message: 'factor_id=abc session_id=xyz' },
          }),
        },
      }),
      null,
      JETZT,
    )
    assert.equal(zustand.lage, 'current')
    assert.equal(zustand.aktuelle?.zugangscodeBisUnix, null)
    assert.equal(zustand.aktuelle?.aal, null)
    assert.equal(zustand.andere, 'unsupported')
    for (const text of texteEines(zustand)) {
      assert.doesNotMatch(text, /eyJ|factor_id|session_id|access_token/i)
    }
  })

  test('Zugangscode-Zeit und AAL werden nur bei belastbarer Form übernommen', () => {
    assert.equal(zugangscodeZeitLesen(JETZT + 1800, JETZT), JETZT + 1800)
    assert.equal(zugangscodeZeitLesen('1777001800', JETZT), null)
    assert.equal(zugangscodeZeitLesen(JETZT + 48 * 3600, JETZT), null)
    assert.equal(zugangscodeZeitLesen(JETZT - 3 * 3600, JETZT), null)
    assert.equal(zugangscodeZeitLesen(0, JETZT), null)
    assert.equal(sitzungAalLesen('aal2'), 'aal2')
    assert.equal(sitzungAalLesen('aal3'), null)
    assert.equal(sitzungAalLesen('nextLevel'), null)
    assert.equal(sitzungAalText('aal2'), 'Zwei-Faktor-bestätigt für diese Sitzung')
  })
})

describe('AP-5-S5 lokale Hinweise und Dichte', () => {
  test('leitet nur Browser-/Plattformklasse ab und kennzeichnet sie als lokal', () => {
    const hints = lokalenGeraeteHinweisAbleiten({
      userAgentData: {
        brands: [
          { brand: 'Chromium', version: '128' },
          { brand: 'Google Chrome', version: '128' },
          { brand: 'Not.A/Brand', version: '99' },
        ],
        platform: 'macOS',
      },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) session_id=abc access_token=eyJ',
    })
    assert.ok(hints)
    assert.equal(hints.quelle, 'lokal')
    assert.match(hints.text, new RegExp(LOKAL_HINWEIS_LABEL))
    assert.match(hints.text, /Chrome · macOS/)
    assert.doesNotMatch(hints.text, /128|session_id|eyJ|Mozilla|user-agent/i)

    const ua = lokalenGeraeteHinweisAbleiten({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
    assert.ok(ua)
    assert.match(ua.text, /Safari · iOS/)

    assert.equal(lokalenGeraeteHinweisAbleiten({ userAgent: 'curl/8.0 session_id=1' }), null)
    assert.equal(lokalenGeraeteHinweisAbleiten(null), null)
  })

  test('Reducer und Loading behaupten keine leere Geräteliste', () => {
    assert.equal(SITZUNG_ANFANG.lage, 'loading')
    assert.equal(SITZUNG_ANFANG.andere, 'unsupported')
    assert.equal(sitzungIstBeschaeftigt(SITZUNG_ANFANG), true)
    assert.doesNotMatch(sitzungStatusText(SITZUNG_ANFANG), /0 Geräte|keine Geräte/i)

    const gelesen = sitzungWeiter(SITZUNG_ANFANG, {
      typ: 'gelesen',
      ergebnis: {
        lage: 'current',
        aktuelle: { zugangscodeBisUnix: null, aal: null },
        andere: 'unsupported',
        lokal: null,
        fehler: null,
      },
    })
    assert.equal(gelesen.andere, 'unsupported')
    assert.equal(andereSitzungenAnzahl(gelesen), null)
  })

  test('Rohfehler, Tokens und Cookies erscheinen nicht in Nutzertexten', async () => {
    for (const roh of ROH) {
      const zustand = await aktuelleSitzungLesen(
        authAttrappe({
          getUser: async () => ({
            data: { user: null },
            error: { message: roh, status: 401 },
          }),
        }),
        { userAgent: roh },
        JETZT,
      )
      const text = sitzungStatusText(zustand)
      assert.equal(sitzungFehlerIstDicht(text, roh), true, text)
      assert.doesNotMatch(text, /refresh_token|access_token|session_id|eyJ|Bearer|cookie|sbp_/i)
    }
  })
})
