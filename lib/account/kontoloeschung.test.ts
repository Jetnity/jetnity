import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { leseToml, tomlWert } from '@/lib/supabase/config-toml'
import { SITEMAP_OEFFENTLICHE_PFADE } from '@/lib/seo/index-grenze'
import {
  KONTO_LOESCHEN_PHRASE,
  KONTO_LOESCHUNG_CODES,
  KONTO_SPEICHER_FLAECHEN,
  anbieterAusBenutzer,
  authLoeschFehlerEinordnen,
  geschuetzterKontozugangNachGetUser,
  identitaetsBeweis,
  kontoLoeschungAnfrageLesen,
  kontoLoeschungProtokoll,
  mfaFreigabe,
  registrierteSpeicherRaeumen,
  suchparameterWaehlenZiel,
  verifizierteTotpAnzahl,
  type KontoLoeschungIdentitaet,
} from '@/lib/account/kontoloeschung'
import {
  kontoLoeschungAusfuehren,
  type KontoLoeschungPorts,
} from '@/lib/account/kontoloeschung-ausfuehren'
import {
  KONTO_LOESCHUNG_TEXTE,
  kontoLoeschungHttpAuftrag,
  loeschungAntwortLesen,
  loeschungKannAbsenden,
  loeschungMfaPlan,
  loeschungSatz,
  lokaleSitzungNachLoeschung,
  totpFuerLoeschungBestaetigen,
  zielNachLoeschung,
} from '@/lib/account/kontoloeschung-zustand'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const index = readFileSync(join(wurzel, 'supabase/functions/account-delete-v1/index.ts'), 'utf8')
const ablauf = readFileSync(join(wurzel, 'lib/account/kontoloeschung-ausfuehren.ts'), 'utf8')
const vertrag = readFileSync(join(wurzel, 'lib/account/kontoloeschung.ts'), 'utf8')
const oberflaeche = readFileSync(join(wurzel, 'components/account/KontoLoeschen.tsx'), 'utf8')
const einstellungen = readFileSync(join(wurzel, 'app/account/settings/page.tsx'), 'utf8')
const erfolg = readFileSync(join(wurzel, 'app/(public)/konto-geloescht/page.tsx'), 'utf8')
const proxy = readFileSync(join(wurzel, 'proxy.ts'), 'utf8')
const config = leseToml(readFileSync(join(wurzel, 'supabase/config.toml'), 'utf8'))

const BEARER = 'user-1'
const PASSWORT = 'korrektes-passwort'
const FREMDES_GEHEIMNIS = 'Sup3rSecret!'
const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig'

function identitaet(ueber: Partial<KontoLoeschungIdentitaet> = {}): KontoLoeschungIdentitaet {
  return {
    id: BEARER,
    email: 'person@example.com',
    anbieter: ['email'],
    aal: null,
    verifizierteTotp: 0,
    ...ueber,
  }
}

function ports(ueber: Partial<KontoLoeschungPorts> = {}): KontoLoeschungPorts & {
  reihe: string[]
  authIds: string[]
  ereignisIds: string[]
  speicherAufrufe: number
} {
  const reihe: string[] = []
  const authIds: string[] = []
  const ereignisIds: string[] = []
  const zusatz = {
    reihe,
    authIds,
    ereignisIds,
    get speicherAufrufe() {
      return reihe.filter((eintrag) => eintrag === 'speicher').length
    },
  }
  return {
    ...zusatz,
    identitaetPruefen: async () => ({ art: 'ok', identitaet: identitaet() }),
    bestaetigePasswort: async () => ({ art: 'ok', benutzerId: BEARER }),
    raeumeSpeicher: async () => {
      reihe.push('speicher')
      return { art: 'geleert' }
    },
    loescheAuthBenutzer: async (benutzerId) => {
      reihe.push('auth')
      authIds.push(benutzerId)
      return { art: 'geloescht' }
    },
    entferneSicherheitsereignisse: async (benutzerId) => {
      reihe.push('security_events')
      ereignisIds.push(benutzerId)
      return { art: 'entfernt' }
    },
    ...ueber,
  }
}

function aufruf(body: unknown, extra: { method?: string; url?: string; authorization?: string | null } = {}) {
  return {
    method: extra.method ?? 'POST',
    url: extra.url ?? 'https://example.supabase.co/functions/v1/account-delete-v1',
    authorization: extra.authorization === undefined ? `Bearer ${JWT}` : extra.authorization,
    bodyText: typeof body === 'string' ? body : JSON.stringify(body),
  }
}

const gueltig = { confirmation: KONTO_LOESCHEN_PHRASE, password: PASSWORT }

describe('Kontolöschung – Anfrage und Beweis', () => {
  test('ein mitgeschicktes user_id wählt das Ziel nicht', async () => {
    const rand = ports()
    const antwort = await kontoLoeschungAusfuehren(
      aufruf({ ...gueltig, user_id: '22222222-2222-2222-2222-222222222222' }),
      rand,
    )
    assert.equal(antwort.body.status, 'rejected')
    if (antwort.body.status !== 'rejected') return
    assert.equal(antwort.body.code, 'ziel_nicht_erlaubt')
    assert.deepEqual(rand.authIds, [])
    assert.equal(suchparameterWaehlenZiel('https://example.test/functions/v1/account-delete-v1?user_id=fremd'), true)
  })

  test('die Bestätigung muss genau KONTO LÖSCHEN sein', () => {
    assert.equal(kontoLoeschungAnfrageLesen({ ...gueltig, confirmation: 'konto löschen' }).ok, false)
    assert.equal(kontoLoeschungAnfrageLesen({ ...gueltig, confirmation: 'KONTO LOESCHEN' }).ok, false)
    assert.equal(kontoLoeschungAnfrageLesen({ ...gueltig, confirmation: ' KONTO LÖSCHEN' }).ok, false)
    assert.equal(kontoLoeschungAnfrageLesen(gueltig).ok, true)
  })

  test('fehlendes oder falsches Passwort löscht nichts', async () => {
    const fehlt = ports()
    const ohne = await kontoLoeschungAusfuehren(aufruf({ confirmation: KONTO_LOESCHEN_PHRASE }), fehlt)
    assert.equal(ohne.body.status, 'rejected')
    if (ohne.body.status === 'rejected') assert.equal(ohne.body.code, 'passwort_fehlt')
    assert.deepEqual(fehlt.authIds, [])

    const falsch = ports({
      bestaetigePasswort: async () => ({ art: 'falsch' }),
    })
    const abgelehnt = await kontoLoeschungAusfuehren(aufruf(gueltig), falsch)
    assert.equal(abgelehnt.status, 401)
    if (abgelehnt.body.status === 'rejected') assert.equal(abgelehnt.body.code, 'passwort_falsch')
    assert.deepEqual(falsch.authIds, [])
  })

  test('eine abweichende Beweis-Identität löscht nichts', async () => {
    const rand = ports({
      bestaetigePasswort: async () => ({ art: 'ok', benutzerId: 'anderer-nutzer' }),
    })
    const antwort = await kontoLoeschungAusfuehren(aufruf(gueltig), rand)
    assert.equal(antwort.status, 403)
    if (antwort.body.status === 'rejected') assert.equal(antwort.body.code, 'identitaet_weicht_ab')
    assert.deepEqual(rand.authIds, [])
  })

  test('nur OAuth oder ein unbekannter Beweis endet fail-closed', async () => {
    assert.equal(identitaetsBeweis(['google']), 'nur_oauth')
    assert.equal(identitaetsBeweis(['phone']), 'nicht_unterstuetzt')
    assert.equal(identitaetsBeweis(['email', 'google']), 'passwort')

    const oauth = ports({
      identitaetPruefen: async () => ({
        art: 'ok',
        identitaet: identitaet({ anbieter: ['google'], email: 'person@example.com' }),
      }),
    })
    const oauthAntwort = await kontoLoeschungAusfuehren(aufruf(gueltig), oauth)
    if (oauthAntwort.body.status === 'rejected') assert.equal(oauthAntwort.body.code, 'nur_oauth')
    assert.deepEqual(oauth.authIds, [])

    const telefon = ports({
      identitaetPruefen: async () => ({
        art: 'ok',
        identitaet: identitaet({ anbieter: ['phone'] }),
      }),
    })
    const telefonAntwort = await kontoLoeschungAusfuehren(aufruf(gueltig), telefon)
    if (telefonAntwort.body.status === 'rejected') assert.equal(telefonAntwort.body.code, 'nicht_unterstuetzt')
    assert.deepEqual(telefon.authIds, [])
  })

  test('verifiziertes TOTP verlangt AAL2, fehlendes TOTP erfindet keine Pflicht', () => {
    assert.deepEqual(mfaFreigabe(1, 'aal1'), { ok: false, code: 'aal2_erforderlich' })
    assert.deepEqual(mfaFreigabe(1, 'aal2'), { ok: true })
    assert.deepEqual(mfaFreigabe(0, 'aal1'), { ok: true })
    assert.equal(loeschungMfaPlan({ verifizierteTotp: 0, aal: null }), 'kein_faktor')
    assert.equal(KONTO_LOESCHUNG_CODES.includes('speicher_blockiert'), true)
    assert.equal(KONTO_LOESCHUNG_TEXTE.titel, 'Konto löschen')
    assert.deepEqual(mfaFreigabe(1, null), { ok: false, code: 'aal_unbekannt' })
  })

  test('AAL1 mit TOTP löscht nicht, AAL2 darf weiter', async () => {
    const aal1 = ports({
      identitaetPruefen: async () => ({
        art: 'ok',
        identitaet: identitaet({ verifizierteTotp: 1, aal: 'aal1' }),
      }),
    })
    const gesperrt = await kontoLoeschungAusfuehren(aufruf(gueltig), aal1)
    if (gesperrt.body.status === 'rejected') assert.equal(gesperrt.body.code, 'aal2_erforderlich')
    assert.deepEqual(aal1.authIds, [])

    const aal2 = ports({
      identitaetPruefen: async () => ({
        art: 'ok',
        identitaet: identitaet({ verifizierteTotp: 1, aal: 'aal2' }),
      }),
    })
    const frei = await kontoLoeschungAusfuehren(aufruf(gueltig), aal2)
    assert.equal(frei.body.status, 'deleted')
    assert.deepEqual(aal2.authIds, [BEARER])
  })
})

describe('Kontolöschung – Ausführung', () => {
  test('Passwort, Token und Kennungen landen nicht im Protokoll oder in der Antwort', async () => {
    const zeilen: string[] = []
    const antwort = await kontoLoeschungAusfuehren(aufruf(gueltig), ports(), (zeile) => zeilen.push(zeile))
    const text = `${zeilen.join('\n')}\n${JSON.stringify(antwort)}`
    for (const geheim of [PASSWORT, 'person@example.com', BEARER, JWT, 'Bearer']) {
      assert.equal(text.includes(geheim), false, geheim)
    }

    const protokoll = kontoLoeschungProtokoll('eingang', {
      password: FREMDES_GEHEIMNIS,
      authorization: `Bearer ${JWT}`,
      email: 'person@example.com',
      user_id: '11111111-1111-1111-1111-111111111111',
      factorId: 'factor-123',
      challengeId: 'challenge-456',
      serviceRoleKey: 'sb_secret_test_value',
      url: 'https://example.com/callback?token=abc',
    })
    for (const geheim of [
      FREMDES_GEHEIMNIS,
      JWT,
      'person@example.com',
      '11111111-1111-1111-1111-111111111111',
      'factor-123',
      'challenge-456',
      'sb_secret_test_value',
      'token=abc',
    ]) {
      assert.equal(protokoll.includes(geheim), false, geheim)
    }
    assert.equal(kontoLoeschungProtokoll(FREMDES_GEHEIMNIS).includes(FREMDES_GEHEIMNIS), false)
  })

  test('nur Hard-Delete, keine Kaskaden-Kopie und kein Storage-SQL', async () => {
    const rand = ports()
    const antwort = await kontoLoeschungAusfuehren(aufruf(gueltig), rand)
    assert.equal(antwort.body.status, 'deleted')
    assert.deepEqual(rand.reihe, ['auth', 'security_events'])
    assert.deepEqual(rand.authIds, [BEARER])
    assert.deepEqual(rand.ereignisIds, [BEARER])
    assert.equal(rand.speicherAufrufe, 0)
    assert.deepEqual([...KONTO_SPEICHER_FLAECHEN], [])

    for (const datei of [index, ablauf, vertrag]) {
      for (const tabelle of [
        'profiles',
        'trips',
        'trip_stages',
        'account_travellers',
        'account_visits',
      ]) {
        assert.equal(datei.includes(`.from('${tabelle}')`), false, tabelle)
      }
      assert.equal(/delete\s+from/i.test(datei), false)
    }
    assert.match(index, /deleteUser\(benutzerId, false\)/)
    assert.equal(index.includes('deleteUser(benutzerId, true)'), false)
    assert.match(index, /storage\.from\(/)
    assert.match(index, /\.remove\(/)
    assert.match(index, /\.from\('security_events'\)/)
    assert.match(index, /\.eq\('user_id', benutzerId\)/)
    assert.match(index, /auth\.getUser\(\)/)
    assert.equal(/auth\.getSession\s*\(/.test(index), false)
    assert.match(index, /persistSession: false/)
    assert.match(index, /signOut\(\{ scope: 'local' \}\)/)
    assert.equal(index.includes("scope: 'global'"), false)
    assert.equal(index.includes('jetnity-legacy-recovery'), false)
    assert.equal(ablauf.includes('createAdminClient'), false)
    assert.equal(index.includes('export function'), false)
  })

  test('Storage-Besitz, der die Auth-Löschung blockiert, ist kein Erfolg', async () => {
    assert.equal(
      authLoeschFehlerEinordnen({ message: 'Database error deleting user' }),
      'fehler',
    )
    assert.equal(
      authLoeschFehlerEinordnen({ message: 'User owns storage objects' }),
      'speicher_blockiert',
    )
    const rand = ports({
      loescheAuthBenutzer: async (benutzerId) => {
        rand.authIds.push(benutzerId)
        return { art: 'speicher_blockiert' }
      },
    })
    const antwort = await kontoLoeschungAusfuehren(aufruf(gueltig), rand)
    assert.equal(antwort.status, 409)
    if (antwort.body.status === 'rejected') assert.equal(antwort.body.code, 'speicher_blockiert')
    assert.equal(antwort.body.status === 'deleted', false)
    assert.deepEqual(rand.ereignisIds, [])

    let auth = 0
    const unbekannt = ports({
      raeumeSpeicher: async () => ({ art: 'unbekannt' }),
      loescheAuthBenutzer: async () => {
        auth += 1
        return { art: 'geloescht' }
      },
    })
    const gestoppt = await kontoLoeschungAusfuehren(
      aufruf(gueltig),
      unbekannt,
      () => {},
      [{ bucket: 'konto-dateien', prefix: 'user' }],
    )
    if (gestoppt.body.status === 'rejected') assert.equal(gestoppt.body.code, 'speicher_unbekannt')
    assert.equal(auth, 0)
    assert.equal(gestoppt.body.status === 'deleted', false)
  })

  test('Sicherheitsereignisse bleiben ehrlich, ein zweiter Versuch trifft kein anderes Konto', async () => {
    const residual = ports({
      entferneSicherheitsereignisse: async (benutzerId) => {
        residual.ereignisIds.push(benutzerId)
        return { art: 'fehler' }
      },
    })
    const offen = await kontoLoeschungAusfuehren(aufruf(gueltig), residual)
    assert.equal(offen.status, 500)
    assert.equal(offen.body.status, 'deleted_security_events_residual')
    assert.deepEqual(residual.ereignisIds, [BEARER])

    const weg = ports({
      identitaetPruefen: async () => ({ art: 'keine_sitzung' }),
    })
    const replay = await kontoLoeschungAusfuehren(
      aufruf({ ...gueltig, user_id: '33333333-3333-3333-3333-333333333333' }),
      weg,
    )
    if (replay.body.status === 'rejected') assert.equal(replay.body.code, 'ziel_nicht_erlaubt')
    assert.deepEqual(weg.authIds, [])

    const erneut = ports({
      loescheAuthBenutzer: async (benutzerId) => {
        erneut.authIds.push(benutzerId)
        return { art: 'nicht_gefunden' }
      },
    })
    const nichtDa = await kontoLoeschungAusfuehren(aufruf(gueltig), erneut)
    assert.equal(nichtDa.status, 404)
    assert.equal(nichtDa.body.status, 'not_found')
    assert.deepEqual(erneut.authIds, [BEARER])
    assert.deepEqual(erneut.ereignisIds, [BEARER])
  })

  test('registrierte Speicherflächen laufen nur über den Storage-Port', async () => {
    const gesehen: string[] = []
    const leer = await registrierteSpeicherRaeumen(
      [],
      {
        loescheUeberStorageApi: async () => {
          gesehen.push('unerwartet')
          return { art: 'geleert' }
        },
      },
      BEARER,
    )
    assert.equal(leer.art, 'geleert')
    assert.deepEqual(gesehen, [])

    const unbekannt = await registrierteSpeicherRaeumen(
      [{ bucket: 'konto-dateien', prefix: 'eigen' }],
      { loescheUeberStorageApi: async () => ({ art: 'unbekannt' }) },
      BEARER,
    )
    assert.equal(unbekannt.art, 'unbekannt')
  })
})

describe('Kontolöschung – Oberfläche und stale Token', () => {
  test('Einstellungen zeigen den Export vor der dauerhaften Löschung', () => {
    const exportBei = einstellungen.indexOf('id="account-datenexport-title"')
    const loeschBei = einstellungen.indexOf('<KontoLoeschen')
    assert.ok(exportBei > 0)
    assert.ok(loeschBei > exportBei)
    assert.match(einstellungen, /dauerhaft entfernt|dauerhaft/)
    assert.match(oberflaeche, /KONTO_LOESCHUNG_TEXTE\.erklaerung/)
    assert.match(oberflaeche, /href="\/api\/account\/export"/)
    assert.ok(oberflaeche.indexOf('href="/api/account/export"') < oberflaeche.indexOf('type="submit"'))
    assert.match(erfolg, /index: false/)
    assert.match(erfolg, /Wiederherstellung gibt es nicht/)
    assert.equal(SITEMAP_OEFFENTLICHE_PFADE.includes('/konto-geloescht' as never), false)
    assert.equal(tomlWert(config, 'functions.account-delete-v1.verify_jwt'), true)
  })

  test('Erfolg verlässt das Konto und versucht die lokale Sitzung zu löschen', async () => {
    assert.equal(zielNachLoeschung('geloescht').startsWith('/account'), false)
    assert.equal(zielNachLoeschung('residual'), '/konto-geloescht?stand=ereignisse')
    assert.match(oberflaeche, /lokaleSitzungNachLoeschung/)
    assert.match(oberflaeche, /router\.push\(zielNachLoeschung/)
    assert.equal(oberflaeche.includes('kontoloeschung-ausfuehren'), false)
    assert.equal(oberflaeche.includes('SERVICE_ROLE'), false)

    const ohne = await lokaleSitzungNachLoeschung(undefined)
    assert.deepEqual(ohne, { versucht: true, bereinigt: false })
    let scope = ''
    const mit = await lokaleSitzungNachLoeschung(async (options) => {
      scope = options.scope
      return { error: null }
    })
    assert.equal(scope, 'local')
    assert.equal(mit.bereinigt, true)

    const auftrag = kontoLoeschungHttpAuftrag({
      supabaseUrl: 'https://example.supabase.co',
      accessToken: JWT,
      confirmation: KONTO_LOESCHEN_PHRASE,
      password: PASSWORT,
    })
    if ('art' in auftrag) throw new Error('Auftrag sollte entstehen')
    assert.equal(auftrag.url.includes('user'), false)
    assert.deepEqual(Object.keys(JSON.parse(auftrag.init.body)).sort(), ['confirmation', 'password'])
    assert.equal(auftrag.init.headers.Authorization, `Bearer ${JWT}`)

    const satz = loeschungSatz(loeschungAntwortLesen(500, { status: 'rejected', message: FREMDES_GEHEIMNIS, code: 'passwort_falsch' }))
    assert.equal(satz.includes(FREMDES_GEHEIMNIS), false)
    assert.equal(loeschungKannAbsenden({
      confirmation: 'falsch',
      password: PASSWORT,
      beweis: 'passwort',
      mfa: 'kein_faktor',
      totpCode: '',
      arbeitet: false,
    }), false)
  })

  test('ein gelöschter Nutzer kommt über das alte Token nicht ins Konto', () => {
    assert.equal(
      geschuetzterKontozugangNachGetUser({
        user: null,
        fehlerIstSitzungFehlend: true,
        pruefungAusgefallen: false,
      }),
      'abgelehnt',
    )
    assert.equal(
      geschuetzterKontozugangNachGetUser({
        user: null,
        fehlerIstSitzungFehlend: false,
        pruefungAusgefallen: false,
      }),
      'abgelehnt',
    )
    assert.match(proxy, /supabase\.auth\.getUser\(\)/)
    assert.match(proxy, /pathname\.startsWith\('\/account'\)/)
    assert.match(proxy, /if \(!user\) return scope\.deny\(req\)/)
    assert.equal(/auth\.getSession\s*\(/.test(proxy), false)
  })

  test('TOTP-Step-up liest Faktor-IDs nicht in den Satz', async () => {
    const ergebnis = await totpFuerLoeschungBestaetigen(
      {
        mfa: {
          challenge: async () => ({ data: { id: 'challenge-geheim' }, error: null }),
          verify: async () => ({ error: { message: 'factor-geheim ungültig' } }),
          getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal1' }, error: null }),
        },
      },
      'factor-geheim',
      '123456',
    )
    assert.equal(ergebnis, 'bestaetigung_fehlgeschlagen')
    assert.equal(loeschungSatz({ art: 'abgelehnt', code: ergebnis }).includes('factor-geheim'), false)
    assert.equal(verifizierteTotpAnzahl({ all: [{ id: 'f1', factor_type: 'totp', status: 'verified' }] }), 1)
    assert.equal(verifizierteTotpAnzahl({ all: [{ id: 'f1', factor_type: 'totp', status: 'unverified' }] }), 0)
    assert.equal(verifizierteTotpAnzahl(null), null)
    assert.deepEqual(
      anbieterAusBenutzer({ identities: [{ provider: 'email' }], app_metadata: { providers: ['email'] } }),
      ['email'],
    )
  })
})
