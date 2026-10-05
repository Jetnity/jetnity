import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  LOGOUT_AKTIONEN,
  LOGOUT_ANFANG,
  LOGOUT_JWT_HINWEIS,
  LOGOUT_SCOPES,
  darfLogoutStarten,
  logoutBeendetLokaleSitzung,
  logoutErfolgBehaupten,
  logoutErfordertBestaetigung,
  logoutFehler,
  logoutFehlerEinordnen,
  logoutFehlerIstDicht,
  logoutIstBeschaeftigt,
  logoutNutzlast,
  logoutScopeAusAktion,
  logoutScopeAusfuehren,
  logoutScopeLesen,
  logoutSollLokalenAuthVerlassen,
  logoutStatusText,
  logoutWeiter,
  type LogoutAuth,
  type LogoutScope,
  type LogoutZustand,
} from '@/lib/auth/account-logout-scopes'

const ROH = [
  'AuthApiError: Failed to fetch refresh_token=sbp_secret',
  'unexpected GoTrue error access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb',
  'session_id=12 authorization: Bearer abc',
]

function lauf(start: LogoutZustand, ...ereignisse: Parameters<typeof logoutWeiter>[1][]): LogoutZustand {
  return ereignisse.reduce((zustand, ereignis) => logoutWeiter(zustand, ereignis), start)
}

function authAttrappe(teil: Partial<LogoutAuth> = {}): LogoutAuth {
  return {
    getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }),
    signOut: async () => ({ error: null }),
    ...teil,
  }
}

function sequenzGetUser(
  antworten: Awaited<ReturnType<LogoutAuth['getUser']>>[],
): LogoutAuth['getUser'] {
  let index = 0
  return async () => {
    const antwort = antworten[Math.min(index, antworten.length - 1)]
    index += 1
    return antwort
  }
}

describe('AP-5-S3 Logout-Scope-Zuordnung', () => {
  test('ordnet die drei UI-Aktionen exakt den Supabase-Scopes zu', () => {
    assert.deepEqual(LOGOUT_SCOPES.slice(), ['local', 'others', 'global'])
    assert.equal(logoutScopeAusAktion('Dieses Gerät abmelden'), 'local')
    assert.equal(logoutScopeAusAktion('Andere Geräte abmelden'), 'others')
    assert.equal(logoutScopeAusAktion('Überall abmelden'), 'global')
    assert.equal(logoutScopeAusAktion('Abmelden'), null)
    assert.deepEqual(logoutNutzlast('local'), { scope: 'local' })
    assert.deepEqual(logoutNutzlast('others'), { scope: 'others' })
    assert.deepEqual(logoutNutzlast('global'), { scope: 'global' })
  })

  test('lehnt unbekannte Scopes fail-closed ab', () => {
    assert.equal(logoutScopeLesen('local'), 'local')
    assert.equal(logoutScopeLesen('others'), 'others')
    assert.equal(logoutScopeLesen('global'), 'global')
    assert.equal(logoutScopeLesen('all'), null)
    assert.equal(logoutScopeLesen(''), null)
    assert.equal(logoutScopeLesen({ scope: 'global' }), null)
  })

  test('beendet die lokale Sitzung nur bei local und global', () => {
    assert.equal(logoutBeendetLokaleSitzung('local'), true)
    assert.equal(logoutBeendetLokaleSitzung('global'), true)
    assert.equal(logoutBeendetLokaleSitzung('others'), false)
    assert.equal(logoutErfordertBestaetigung('global'), true)
    assert.equal(logoutErfordertBestaetigung('local'), false)
    assert.equal(logoutErfordertBestaetigung('others'), false)
  })
})

describe('AP-5-S3 Logout-Zustände', () => {
  test('trennt idle, working, success, error, unavailable und unsupported', () => {
    const start = logoutWeiter(LOGOUT_ANFANG, { typ: 'starte', scope: 'local' })
    assert.equal(start.lage, 'working')
    assert.equal(logoutErfolgBehaupten(start), false)
    assert.equal(logoutIstBeschaeftigt(start), true)

    const ok = logoutWeiter(start, { typ: 'ausfuehren_ok', scope: 'local' })
    assert.equal(ok.lage, 'success')
    assert.equal(logoutErfolgBehaupten(ok), true)
    assert.equal(logoutSollLokalenAuthVerlassen(ok), true)

    const fehler = lauf(LOGOUT_ANFANG, { typ: 'starte', scope: 'others' }, {
      typ: 'ausfuehren_fehler',
      fehler: logoutFehler('network'),
    })
    assert.equal(fehler.lage, 'error')
    assert.equal(logoutErfolgBehaupten(fehler), false)
    assert.equal(logoutSollLokalenAuthVerlassen(fehler), false)

    const unbekannt = lauf(LOGOUT_ANFANG, { typ: 'starte', scope: 'local' }, { typ: 'client_unbekannt' })
    assert.equal(unbekannt.lage, 'unsupported')
    assert.equal(logoutErfolgBehaupten(unbekannt), false)

    const ohneSitzung = lauf(LOGOUT_ANFANG, { typ: 'starte', scope: 'local' }, { typ: 'client_ohne_sitzung' })
    assert.equal(ohneSitzung.lage, 'unavailable')
    assert.equal(logoutErfolgBehaupten(ohneSitzung), false)
  })

  test('others löst keinen lokalen Signed-Out-Pfad aus', () => {
    const fertig = lauf(LOGOUT_ANFANG, { typ: 'starte', scope: 'others' }, {
      typ: 'ausfuehren_ok',
      scope: 'others',
    })
    assert.equal(fertig.lage, 'success')
    assert.equal(logoutSollLokalenAuthVerlassen(fertig), false)
    assert.equal(darfLogoutStarten(fertig), true)
    assert.match(logoutStatusText(fertig), /Diese Sitzung bleibt aktiv/)
    assert.doesNotMatch(logoutStatusText(fertig), /\d+/)
  })

  test('local und global verlassen den lokalen Auth-Zustand nur nach bestätigtem Erfolg', () => {
    for (const scope of ['local', 'global'] as LogoutScope[]) {
      const start = scope === 'global'
        ? lauf(LOGOUT_ANFANG, { typ: 'verlange_bestaetigung', scope: 'global' }, { typ: 'starte', scope })
        : logoutWeiter(LOGOUT_ANFANG, { typ: 'starte', scope })
      assert.equal(logoutSollLokalenAuthVerlassen(start), false)
      const fertig = logoutWeiter(start, { typ: 'ausfuehren_ok', scope })
      assert.equal(logoutSollLokalenAuthVerlassen(fertig), true)
      assert.equal(darfLogoutStarten(fertig), false)
    }
  })

  test('global startet nicht ohne Bestätigung', () => {
    const still = logoutWeiter(LOGOUT_ANFANG, { typ: 'starte', scope: 'global' })
    assert.equal(still.lage, 'idle')
    assert.equal(still.bestaetigungFuer, null)

    const frage = logoutWeiter(LOGOUT_ANFANG, { typ: 'verlange_bestaetigung', scope: 'global' })
    assert.equal(frage.bestaetigungFuer, 'global')
    assert.equal(logoutErfolgBehaupten(frage), false)

    const start = logoutWeiter(frage, { typ: 'starte', scope: 'global' })
    assert.equal(start.lage, 'working')
    assert.equal(start.scope, 'global')
  })

  test('behauptet Erfolg nicht nach Netz-, Server- oder Sessionfehler', () => {
    const netz = lauf(LOGOUT_ANFANG, { typ: 'starte', scope: 'others' }, {
      typ: 'ausfuehren_fehler',
      fehler: logoutFehler('network'),
    })
    assert.equal(netz.lage, 'error')
    assert.equal(logoutErfolgBehaupten(netz), false)
    assert.match(logoutStatusText(netz), /unbestätigt/)

    const sitzung = lauf(LOGOUT_ANFANG, { typ: 'starte', scope: 'local' }, { typ: 'client_ohne_sitzung' })
    assert.equal(sitzung.lage, 'unavailable')
    assert.equal(logoutErfolgBehaupten(sitzung), false)
    assert.equal(logoutSollLokalenAuthVerlassen(sitzung), false)
  })

  test('ignoriert Erfolg oder Start aus fremden Lagen', () => {
    const fremd = logoutWeiter(LOGOUT_ANFANG, { typ: 'ausfuehren_ok', scope: 'local' })
    assert.equal(fremd.lage, 'idle')
    assert.equal(logoutErfolgBehaupten(fremd), false)

    const working = logoutWeiter(LOGOUT_ANFANG, { typ: 'starte', scope: 'local' })
    const nochmal = logoutWeiter(working, { typ: 'starte', scope: 'others' })
    assert.equal(nochmal.lage, 'working')
    assert.equal(nochmal.scope, 'local')
  })
})

describe('AP-5-S3 Logout-Ausführung', () => {
  test('übergibt den Scope explizit und erfindet keine Sessionzahl', async () => {
    const gesehen: Array<{ scope: LogoutScope }> = []
    const ereignis = await logoutScopeAusfuehren(
      authAttrappe({
        signOut: async (options) => {
          gesehen.push(options)
          return { error: null }
        },
      }),
      'others',
    )
    assert.deepEqual(gesehen, [{ scope: 'others' }])
    assert.deepEqual(ereignis, { typ: 'ausfuehren_ok', scope: 'others' })
    assert.doesNotMatch(JSON.stringify(LOGOUT_AKTIONEN), /\b\d+\s+(Geräte|Sitzungen)\b/)
  })

  test('others prüft, dass die aktuelle Sitzung erhalten bleibt', async () => {
    const ereignis = await logoutScopeAusfuehren(
      authAttrappe({
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
      }),
      'others',
    )
    assert.deepEqual(ereignis, { typ: 'client_ohne_sitzung' })

    const zerstoert = await logoutScopeAusfuehren(
      authAttrappe({
        getUser: sequenzGetUser([
          { data: { user: { id: 'user-1' } }, error: null },
          { data: { user: null }, error: null },
        ]),
      }),
      'others',
    )
    assert.equal(zerstoert.typ, 'ausfuehren_fehler')
    if (zerstoert.typ === 'ausfuehren_fehler') {
      assert.equal(zerstoert.fehler.code, 'others_ended_local')
    }

    const unbestaetigt = await logoutScopeAusfuehren(
      authAttrappe({
        getUser: sequenzGetUser([
          { data: { user: { id: 'user-1' } }, error: null },
          { data: { user: null }, error: { message: 'Failed to fetch', status: 0 } },
        ]),
      }),
      'others',
    )
    assert.equal(unbestaetigt.typ, 'ausfuehren_fehler')
    if (unbestaetigt.typ === 'ausfuehren_fehler') {
      assert.equal(unbestaetigt.fehler.code, 'network')
    }
  })

  test('Netz- oder API-Fehler sind kein Erfolg und rufen keinen stillen Scope-Default auf', async () => {
    const gesehen: unknown[] = []
    const netz = await logoutScopeAusfuehren(
      authAttrappe({
        signOut: async (options) => {
          gesehen.push(options)
          return { error: { message: 'Failed to fetch', status: 0 } }
        },
      }),
      'global',
    )
    assert.deepEqual(gesehen, [{ scope: 'global' }])
    assert.equal(netz.typ, 'ausfuehren_fehler')
    if (netz.typ === 'ausfuehren_fehler') {
      assert.equal(netz.fehler.code, 'network')
    }

    const unbekannt = await logoutScopeAusfuehren({ getUser: async () => ({ data: { user: { id: '1' } }, error: null }) }, 'local')
    assert.deepEqual(unbekannt, { typ: 'client_unbekannt' })

    const ungueltig = await logoutScopeAusfuehren(authAttrappe(), 'all')
    assert.equal(ungueltig.typ, 'ausfuehren_fehler')
    if (ungueltig.typ === 'ausfuehren_fehler') {
      assert.equal(ungueltig.fehler.code, 'invalid_scope')
    }
  })

  test('getUser-Netzfehler ist kein Sitzungsverlust', async () => {
    const ereignis = await logoutScopeAusfuehren(
      authAttrappe({
        getUser: async () => ({ data: { user: null }, error: { message: 'Failed to fetch', status: 0 } }),
      }),
      'local',
    )
    assert.equal(ereignis.typ, 'ausfuehren_fehler')
    if (ereignis.typ === 'ausfuehren_fehler') {
      assert.equal(ereignis.fehler.code, 'network')
    }
  })
})

describe('AP-5-S3 Logout-Fehlercopy', () => {
  test('lässt GoTrue-, Token- und Session-Rohtexte nicht durch', () => {
    for (const roh of ROH) {
      const fehler = logoutFehlerEinordnen({ meldung: roh })
      assert.equal(logoutFehlerIstDicht(fehler.text, roh), true)
      assert.doesNotMatch(fehler.text, /refresh_token|access_token|eyJ|GoTrue|Bearer/i)
    }
    assert.equal(logoutFehlerEinordnen({ status: 401 }).code, 'session_required')
    assert.equal(logoutFehlerEinordnen({ status: 429 }).code, 'rate_limited')
    assert.equal(logoutFehlerEinordnen({ meldung: 'not supported' }).code, 'unsupported')
  })

  test('Erfolgs- und Ruhetexte erfinden keine Sessionzahl und kein JWT-Kill', () => {
    assert.match(LOGOUT_JWT_HINWEIS, /nicht, dass sie sofort ungültig/)
    assert.match(LOGOUT_AKTIONEN.others.beschreibung, /nicht, wie viele/)
    assert.doesNotMatch(logoutStatusText(LOGOUT_ANFANG), /\d+/)
    for (const scope of LOGOUT_SCOPES) {
      const text = logoutStatusText({
        lage: 'success',
        scope,
        bestaetigungFuer: null,
        fehler: null,
      })
      assert.doesNotMatch(text, /\b\d+\b/)
      assert.match(text, /Zugangscodes können noch/)
    }
  })
})
