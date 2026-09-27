// lib/account/kontoloeschung.test.ts

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { SCHLUESSEL } from '@/lib/trips/gastspeicher'
import { kontoLoeschungAusfuehren, type LoeschAbhaengigkeiten } from '@/lib/account/kontoloeschung-ausfuehrung'
import {
  KONTOLOESCHUNG_ANFANG,
  LOKALE_KONTO_SPUREN,
  kontoloeschungAnstossen,
  kontoloeschungAntwortHolen,
  kontoloeschungCodeSenden,
  kontoloeschungFunktionsUrl,
  kontoloeschungLoeschkoerper,
  kontoloeschungSendenGesperrt,
  kontoloeschungStatusText,
  kontoloeschungWeiter,
  type KontoloeschungPort,
} from '@/lib/account/kontoloeschung-client'
import {
  BESITZ_SQL,
  besitzAbfrage,
  eigeneSpeicherObjekteLoeschen,
  type SpeicherBesitz,
} from '@/lib/account/kontoloeschung-speicher'
import {
  direktZugangPruefen,
  entwicklungsUrl,
  nachweisGrund,
  zugangAufloesen,
} from '@/lib/account/kontoloeschung-direkt'
import {
  OBJEKT_ABWESENHEIT_FRIST_MS,
  OBJEKT_ABWESENHEIT_INTERVALL_MS,
  objektAbwesenheitWarten,
  objektAusInfoStatus,
  objektInfoAdresse,
} from '../../scripts/account/kontoloeschung-objekt-abwesenheit'
import {
  ENTWICKLUNGS_PROJEKT_REF,
  KONTO_GELOESCHT_PFAD,
  KONTO_LOESCHEN_BESTAETIGUNG,
  KONTO_LOESCHUNG_FRISCHE_SEKUNDEN,
  PRODUKTIONS_PROJEKT_REF,
  frischerAmr,
  jwtAnspruecheLesen,
  loeschAnfragePruefen,
  loeschBerechtigungPruefen,
  loeschProtokollZeile,
  loeschUmgebungErlaubt,
  type LoeschBeweis,
} from '@/lib/account/kontoloeschung-vertrag'

const hier = dirname(fileURLToPath(import.meta.url))
const NUTZER = '11111111-1111-4111-8111-111111111111'
const ANDERER = '22222222-2222-4222-8222-222222222222'
const JETZT = 1_700_000_000

function quelle(pfad: string): string {
  return readFileSync(join(hier, pfad), 'utf8')
}

function token(claims: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `kopf.${body}.sig`
}

function beweis(ueber: Partial<LoeschBeweis> = {}): LoeschBeweis {
  return {
    userId: NUTZER,
    tokenSub: NUTZER,
    providers: ['email'],
    aal: 'aal1',
    amr: [{ method: 'password', timestamp: JETZT }],
    verifiedFactorCount: 0,
    jetztSekunden: JETZT,
    ...ueber,
  }
}

describe('Kontolöschung – Anfrage, Umgebung, Beweis', () => {
  test('nimmt nur die exakte Bestätigung an und lehnt eine user_id ab', () => {
    assert.deepEqual(loeschAnfragePruefen({ confirmation: 'KONTO LÖSCHEN' }), { ok: true })
    assert.equal(loeschAnfragePruefen({ confirmation: 'konto löschen' }).ok, false)
    assert.equal(loeschAnfragePruefen({ confirmation: 'KONTO LÖSCHEN ' }).ok, false)
    assert.equal(loeschAnfragePruefen({ confirmation: 'KONTO LÖSCHEN', user_id: NUTZER }).ok, false)
    assert.equal(loeschAnfragePruefen({ user_id: NUTZER }).ok, false)
    assert.equal(loeschAnfragePruefen([ { confirmation: 'KONTO LÖSCHEN' } ]).ok, false)
    assert.equal(loeschAnfragePruefen(null).ok, false)
  })

  test('erlaubt nur Development und Loopback, nie Production oder ein fremdes Projekt', () => {
    assert.equal(loeschUmgebungErlaubt(`https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`), true)
    assert.equal(loeschUmgebungErlaubt('http://127.0.0.1:54321'), true)
    assert.equal(loeschUmgebungErlaubt('http://localhost:54321'), true)
    assert.equal(loeschUmgebungErlaubt(`https://${PRODUKTIONS_PROJEKT_REF}.supabase.co`), false)
    assert.equal(loeschUmgebungErlaubt('https://abcdefghijklmnopqrst.supabase.co'), false)
    assert.equal(loeschUmgebungErlaubt('http://evil.example'), false)
    assert.equal(loeschUmgebungErlaubt(null), false)
  })

  test('verlangt frisches Passwort und bei verifiziertem Faktor AAL2 plus frisches TOTP', () => {
    assert.equal(loeschBerechtigungPruefen(beweis()).ok, true)
    assert.equal(loeschBerechtigungPruefen(beweis({ providers: ['google'] })).ok, false)
    assert.equal(
      loeschBerechtigungPruefen(beweis({ providers: ['google'] }) as LoeschBeweis).ok === false &&
        (loeschBerechtigungPruefen(beweis({ providers: ['google'] })) as { klasse: string }).klasse,
      'oauth_nicht_unterstuetzt',
    )
    assert.equal(
      (loeschBerechtigungPruefen(beweis({
        amr: [{ method: 'password', timestamp: JETZT - KONTO_LOESCHUNG_FRISCHE_SEKUNDEN - 1 }],
      })) as { klasse: string }).klasse,
      'reauth_veraltet',
    )
    assert.equal(
      (loeschBerechtigungPruefen(beweis({ verifiedFactorCount: 1, aal: 'aal1' })) as { klasse: string }).klasse,
      'mfa_erforderlich',
    )
    assert.equal(
      loeschBerechtigungPruefen(beweis({
        verifiedFactorCount: 1,
        aal: 'aal2',
        amr: [
          { method: 'password', timestamp: JETZT },
          { method: 'totp', timestamp: JETZT },
        ],
      })).ok,
      true,
    )
    assert.equal(
      (loeschBerechtigungPruefen(beweis({
        verifiedFactorCount: 1,
        aal: 'aal2',
        amr: [
          { method: 'password', timestamp: JETZT },
          { method: 'totp', timestamp: JETZT - 301 },
        ],
      })) as { klasse: string }).klasse,
      'mfa_erforderlich',
    )
    assert.equal(loeschBerechtigungPruefen(beweis({ verifiedFactorCount: null })).ok, false)
    assert.equal(loeschBerechtigungPruefen(beweis({ tokenSub: ANDERER })).ok, false)
    assert.equal(frischerAmr([], ['password'], JETZT), false)
  })

  test('liest AAL und AMR nur aus der JWT-Nutzlast und schreibt kein Geheimnis ins Protokoll', () => {
    const gelesen = jwtAnspruecheLesen(token({
      sub: NUTZER,
      aal: 'aal2',
      amr: [{ method: 'password', timestamp: JETZT }],
    }))
    assert.equal(gelesen?.aal, 'aal2')
    assert.equal(jwtAnspruecheLesen('kein-jwt'), null)
    const zeile = loeschProtokollZeile('geloescht', 'fertig')
    assert.equal(zeile, 'kontoloeschung klasse=geloescht schritt=fertig')
    assert.equal(loeschProtokollZeile(`Bearer ${token({ sub: NUTZER })}`, 'speicher/geheim'), 'kontoloeschung klasse=unbekannt schritt=abbruch')
    assert.doesNotMatch(zeile, /eyJ|bearer|@|password|supabase\.co/i)
  })
})

describe('Kontolöschung – Ausführung', () => {
  function deps(ueber: Partial<LoeschAbhaengigkeiten> = {}): LoeschAbhaengigkeiten & {
    rufe: string[]
  } {
    const rufe: string[] = []
    return {
      rufe,
      jetztSekunden: () => JETZT,
      nutzer: async () => {
        rufe.push('nutzer')
        return { art: 'ok', id: NUTZER, providers: ['email'] }
      },
      faktoren: async () => {
        rufe.push('faktoren')
        return 0
      },
      speicherLoeschen: async () => {
        rufe.push('speicher')
        return 'ok'
      },
      ereignisseLoeschen: async () => {
        rufe.push('ereignisse')
        return 'ok'
      },
      nutzerLoeschen: async () => {
        rufe.push('konto')
        return 'ok'
      },
      ...ueber,
    }
  }

  const jwt = token({
    sub: NUTZER,
    aal: 'aal1',
    amr: [{ method: 'password', timestamp: JETZT }],
  })

  test('löscht Speicher, Ereignisse und dann den Auth-Nutzer', async () => {
    const abh = deps()
    const ergebnis = await kontoLoeschungAusfuehren({
      jwt,
      koerper: { confirmation: 'KONTO LÖSCHEN' },
      supabaseUrl: `https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`,
      deps: abh,
    })
    assert.equal(ergebnis.klasse, 'geloescht')
    assert.deepEqual(abh.rufe, ['nutzer', 'faktoren', 'speicher', 'ereignisse', 'konto'])
  })

  test('stoppt vor dem Auth-Löschen, wenn der Speicher fehlschlägt', async () => {
    const abh = deps({
      speicherLoeschen: async () => {
        abh.rufe.push('speicher')
        return 'fehler'
      },
    })
    const ergebnis = await kontoLoeschungAusfuehren({
      jwt,
      koerper: { confirmation: 'KONTO LÖSCHEN' },
      supabaseUrl: `https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`,
      deps: abh,
    })
    assert.equal(ergebnis.klasse, 'aufraeumen_fehlgeschlagen')
    assert.equal(ergebnis.schritt, 'speicher')
    assert.deepEqual(abh.rufe, ['nutzer', 'faktoren', 'speicher'])
  })

  test('ein späterer Fehlschlag ist teilweise und löscht den Auth-Nutzer nicht als Erfolg', async () => {
    const speicher = deps({
      speicherLoeschen: async () => {
        speicher.rufe.push('speicher')
        return 'teilweise'
      },
    })
    const nachSpeicher = await kontoLoeschungAusfuehren({
      jwt,
      koerper: { confirmation: 'KONTO LÖSCHEN' },
      supabaseUrl: `https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`,
      deps: speicher,
    })
    assert.equal(nachSpeicher.klasse, 'teilweise_entfernt')
    assert.deepEqual(speicher.rufe, ['nutzer', 'faktoren', 'speicher'])

    const konto = deps({
      nutzerLoeschen: async () => {
        konto.rufe.push('konto')
        return 'fehler'
      },
    })
    const nachKonto = await kontoLoeschungAusfuehren({
      jwt,
      koerper: { confirmation: 'KONTO LÖSCHEN' },
      supabaseUrl: `https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`,
      deps: konto,
    })
    assert.equal(nachKonto.klasse, 'teilweise_entfernt')
    assert.equal(nachKonto.schritt, 'konto')
    assert.notEqual(nachKonto.klasse, 'geloescht')
  })

  test('lässt einen AAL1-Faktor nicht durch und löscht auf Production nichts', async () => {
    const mitFaktor = deps({
      faktoren: async () => {
        mitFaktor.rufe.push('faktoren')
        return 1
      },
    })
    const mfa = await kontoLoeschungAusfuehren({
      jwt,
      koerper: { confirmation: 'KONTO LÖSCHEN' },
      supabaseUrl: `https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`,
      deps: mitFaktor,
    })
    assert.equal(mfa.klasse, 'mfa_erforderlich')
    assert.deepEqual(mitFaktor.rufe, ['nutzer', 'faktoren'])

    const produktion = deps()
    const gesperrt = await kontoLoeschungAusfuehren({
      jwt,
      koerper: { confirmation: 'KONTO LÖSCHEN' },
      supabaseUrl: `https://${PRODUKTIONS_PROJEKT_REF}.supabase.co`,
      deps: produktion,
    })
    assert.equal(gesperrt.klasse, 'umgebung_gesperrt')
    assert.deepEqual(produktion.rufe, [])
  })

  test('eine zweite Löschung ohne Nutzer ist nicht gefunden und kein Erfolg', async () => {
    const abh = deps({
      nutzer: async () => ({ art: 'nicht_gefunden' }),
    })
    const ergebnis = await kontoLoeschungAusfuehren({
      jwt,
      koerper: { confirmation: 'KONTO LÖSCHEN' },
      supabaseUrl: 'http://127.0.0.1:54321',
      deps: abh,
    })
    assert.equal(ergebnis.klasse, 'nicht_gefunden')
    assert.equal(ergebnis.status, 404)
    assert.notEqual(ergebnis.klasse, 'geloescht')
  })

  test('fehlende Sitzung und falsche Bestätigung löschen nichts', async () => {
    const abh = deps()
    const ohne = await kontoLoeschungAusfuehren({
      jwt: null,
      koerper: { confirmation: 'KONTO LÖSCHEN' },
      supabaseUrl: `https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`,
      deps: abh,
    })
    const falsch = await kontoLoeschungAusfuehren({
      jwt,
      koerper: { confirmation: 'LOESCHEN', user_id: ANDERER },
      supabaseUrl: `https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`,
      deps: abh,
    })
    assert.equal(ohne.klasse, 'nicht_angemeldet')
    assert.equal(falsch.klasse, 'anfrage_ungueltig')
    assert.deepEqual(abh.rufe, [])
  })
})

describe('Kontolöschung – Storage-Besitz', () => {
  const fremdPfad = `${ANDERER}/fremd.bin`

  function client(eigene: Array<{ bucketId: string; name: string }>, restlich = false): SpeicherBesitz & {
    entfernt: Array<{ bucket: string; pfade: string[] }>
    gelesen: string[]
  } {
    const entfernt: Array<{ bucket: string; pfade: string[] }> = []
    const gelesen: string[] = []
    let runde = 0
    return {
      entfernt,
      gelesen,
      async lesen(userId) {
        gelesen.push(userId)
        runde += 1
        if (runde > 1 && !restlich) return { zeilen: [] }
        return { zeilen: eigene.map((zeile) => ({ ...zeile })) }
      },
      async remove(bucket, pfade) {
        entfernt.push({ bucket, pfade: [...pfade] })
        assert.equal(pfade.includes(fremdPfad), false)
        return 'ok'
      },
    }
  }

  test('die Besitzabfrage ist parametrisiert und schreibt storage.objects nicht', () => {
    const eigene = besitzAbfrage(NUTZER)
    const fremde = besitzAbfrage(ANDERER)
    assert.ok(eigene)
    assert.ok(fremde)
    assert.equal(eigene.text, BESITZ_SQL)
    assert.equal(fremde.text, eigene.text)
    assert.equal(eigene.text.includes(NUTZER), false)
    assert.equal(eigene.text.includes(ANDERER), false)
    assert.deepEqual(eigene.werte, [NUTZER])
    assert.deepEqual(fremde.werte, [ANDERER])
    assert.match(eigene.text, /where owner_id = \$1$/)
    assert.equal(/\b(delete|update|insert|drop|alter)\b/i.test(eigene.text), false)
    assert.equal(besitzAbfrage('nicht-eine-uuid'), null)
    assert.equal(besitzAbfrage(`${NUTZER}' or true`), null)
    const quelleSpeicher = quelle('./kontoloeschung-speicher.ts')
    const funktion = quelle('../../supabase/functions/account-delete-v1/index.ts')
    assert.equal(/\bdelete\s+from\s+storage\.objects\b/i.test(quelleSpeicher + funktion), false)
    assert.equal(/\bupdate\s+storage\.objects\b/i.test(quelleSpeicher + funktion), false)
    assert.equal(funktion.includes('.list('), false)
    assert.equal(quelleSpeicher.includes('.list('), false)
    assert.match(funktion, /besitzAbfrage/)
    assert.match(funktion, /SUPABASE_DB_URL/)
    assert.equal(funktion.includes('console.log(dbUrl'), false)
    assert.equal(funktion.includes('console.log(userId'), false)
  })

  test('die Storage-API erhält nur Pfade des Besitzlesers und lässt fremde liegen', async () => {
    const speicher = client([
      { bucketId: 'beweise', name: `${NUTZER}/proof.bin` },
      { bucketId: 'beweise', name: `${NUTZER}/ordner/zweite.bin` },
      { bucketId: 'anderes', name: `${NUTZER}/nur-eigen.bin` },
    ])
    const ergebnis = await eigeneSpeicherObjekteLoeschen(speicher, NUTZER)
    assert.equal(ergebnis, 'ok')
    assert.deepEqual(speicher.gelesen, [NUTZER, NUTZER])
    assert.deepEqual(speicher.entfernt, [
      { bucket: 'beweise', pfade: [`${NUTZER}/proof.bin`, `${NUTZER}/ordner/zweite.bin`] },
      { bucket: 'anderes', pfade: [`${NUTZER}/nur-eigen.bin`] },
    ])
    assert.equal(JSON.stringify(speicher.entfernt).includes(fremdPfad), false)
  })

  test('ein kaputter Bucket oder Pfad löscht nichts', async () => {
    const kaputt = ['../x', 'a/../b', 'a\\b', 'a/\0/b', '/absolut', 'a/', 'a//b', '.']
    for (const name of kaputt) {
      const speicher = client([{ bucketId: 'beweise', name }])
      const ergebnis = await eigeneSpeicherObjekteLoeschen(speicher, NUTZER)
      assert.equal(ergebnis, 'fehler')
      assert.deepEqual(speicher.entfernt, [])
    }
    const bucket = client([{ bucketId: 'nicht sicher', name: 'proof.bin' }])
    assert.equal(await eigeneSpeicherObjekteLoeschen(bucket, NUTZER), 'fehler')
    assert.deepEqual(bucket.entfernt, [])
  })

  test('verbleibende eigene Zeilen nach dem Remove sind teilweise und kein Erfolg', async () => {
    const speicher = client([{ bucketId: 'beweise', name: `${NUTZER}/proof.bin` }], true)
    const ergebnis = await eigeneSpeicherObjekteLoeschen(speicher, NUTZER)
    assert.equal(ergebnis, 'teilweise')
    assert.notEqual(ergebnis, 'ok')
  })

  test('ein Remove-Fehler ist teilweise und ein Lesefehler davor ändert nichts', async () => {
    const speicher = client([{ bucketId: 'beweise', name: `${NUTZER}/proof.bin` }])
    speicher.remove = async () => 'fehler'
    assert.equal(await eigeneSpeicherObjekteLoeschen(speicher, NUTZER), 'teilweise')

    const lesefehler = client([])
    lesefehler.lesen = async () => ({ fehler: true })
    assert.equal(await eigeneSpeicherObjekteLoeschen(lesefehler, NUTZER), 'fehler')
    assert.deepEqual(lesefehler.entfernt, [])
    assert.equal(await eigeneSpeicherObjekteLoeschen(client([]), 'kein-uuid'), 'fehler')
  })
})

describe('Kontolöschung – Browser', () => {
  function port(ueber: Partial<KontoloeschungPort> = {}): KontoloeschungPort & {
    rufe: string[]
    pfade: string[]
    schluessel: string[]
  } {
    const rufe: string[] = []
    const pfade: string[] = []
    const schluessel: string[] = []
    return {
      rufe,
      pfade,
      schluessel,
      getUser: async () => {
        rufe.push('getUser')
        return { user: { id: NUTZER, email: 'person@example.com', providers: ['email'] } }
      },
      signInWithPassword: async () => {
        rufe.push('passwort')
        return { ok: true, rateLimited: false, accessToken: 'frisches-token-aaaaaaaa' }
      },
      faktorenUndAal: async () => {
        rufe.push('aal')
        return { ok: true, verifiedTotpIds: [], verifiedAndere: 0, currentLevel: 'aal1' }
      },
      mfaChallenge: async () => ({ challengeId: 'challenge-1' }),
      mfaVerify: async () => ({ ok: true, accessToken: 'aal2-token-aaaaaaaaaa', currentLevel: 'aal2' }),
      loeschen: async () => {
        rufe.push('loeschen')
        return { klasse: 'geloescht', netz: false }
      },
      lokaleSitzungBeenden: async () => {
        rufe.push('signOut')
      },
      speicher: {
        removeItem: (key) => schluessel.push(key),
      },
      ortWechseln: (pfad) => pfade.push(pfad),
      ...ueber,
    }
  }

  test('eine falsche Bestätigung bleibt lokal und ruft Auth nicht an', async () => {
    const ziel = port()
    const ereignis = await kontoloeschungAnstossen(ziel, { bestaetigung: 'nein', passwort: 'geheim' })
    assert.equal(ereignis.typ, 'bestaetigung_ungueltig')
    assert.deepEqual(ziel.rufe, [])
    assert.equal(kontoloeschungSendenGesperrt(KONTOLOESCHUNG_ANFANG, 'nein', 'x', ''), true)
  })

  test('ein falsches Passwort löscht nicht', async () => {
    const ziel = port({
      signInWithPassword: async () => ({ ok: false, rateLimited: false, accessToken: null }),
    })
    const ereignis = await kontoloeschungAnstossen(ziel, {
      bestaetigung: KONTO_LOESCHEN_BESTAETIGUNG,
      passwort: 'falsch',
    })
    assert.equal(ereignis.typ, 'passwort')
    assert.equal(ziel.rufe.includes('loeschen'), false)
  })

  test('ein verifizierter Faktor auf AAL1 fordert den Code, bevor gelöscht wird', async () => {
    const ziel = port({
      faktorenUndAal: async () => ({
        ok: true,
        verifiedTotpIds: ['faktor-1'],
        verifiedAndere: 0,
        currentLevel: 'aal1',
      }),
      mfaChallenge: async () => ({ challengeId: 'challenge-1' }),
    })
    const vorbereitet = await kontoloeschungAnstossen(ziel, {
      bestaetigung: KONTO_LOESCHEN_BESTAETIGUNG,
      passwort: 'richtig-passwort',
    })
    assert.equal(vorbereitet.typ, 'mfa_noetig')
    assert.equal(ziel.rufe.includes('loeschen'), false)
    const zustand = kontoloeschungWeiter(
      kontoloeschungWeiter(KONTOLOESCHUNG_ANFANG, { typ: 'starte' }),
      vorbereitet,
    )
    assert.equal(zustand.phase, 'mfa')
    const fertig = await kontoloeschungCodeSenden(ziel, {
      code: '123456',
      faktorId: 'faktor-1',
      challengeId: 'challenge-1',
    })
    assert.equal(fertig.typ, 'geloescht')
    assert.deepEqual(ziel.schluessel, [...LOKALE_KONTO_SPUREN])
    assert.deepEqual(ziel.pfade, [KONTO_GELOESCHT_PFAD])
  })

  test('Erfolg ohne Faktor beendet die lokale Sitzung und leitet aus dem Konto', async () => {
    const ziel = port()
    const ereignis = await kontoloeschungAnstossen(ziel, {
      bestaetigung: KONTO_LOESCHEN_BESTAETIGUNG,
      passwort: 'richtig-passwort',
    })
    assert.equal(ereignis.typ, 'geloescht')
    assert.deepEqual(ziel.schluessel, [SCHLUESSEL.aktiv, SCHLUESSEL.warteschlange, SCHLUESSEL.legacy])
    const zustand = kontoloeschungWeiter(
      kontoloeschungWeiter(KONTOLOESCHUNG_ANFANG, { typ: 'starte' }),
      ereignis,
    )
    assert.equal(zustand.phase, 'fertig')
    assert.match(kontoloeschungStatusText(zustand), /gelöscht/)
  })

  test('ein Fehler bestätigt keinen Erfolg und räumt die Sitzung nicht ab', async () => {
    const ziel = port({
      loeschen: async () => ({ klasse: 'aufraeumen_fehlgeschlagen', netz: false }),
    })
    const ereignis = await kontoloeschungAnstossen(ziel, {
      bestaetigung: KONTO_LOESCHEN_BESTAETIGUNG,
      passwort: 'richtig-passwort',
    })
    assert.equal(ereignis.typ, 'aufraeumen')
    assert.deepEqual(ziel.schluessel, [])
    assert.deepEqual(ziel.pfade, [])
    assert.equal(ziel.rufe.includes('signOut'), false)
  })

  test('eine teilweise Löschung bestätigt keinen Erfolg und sagt nicht, nichts habe sich geändert', async () => {
    const ziel = port({
      loeschen: async () => ({ klasse: 'teilweise_entfernt', netz: false }),
    })
    const ereignis = await kontoloeschungAnstossen(ziel, {
      bestaetigung: KONTO_LOESCHEN_BESTAETIGUNG,
      passwort: 'richtig-passwort',
    })
    assert.equal(ereignis.typ, 'teilweise')
    const text = kontoloeschungStatusText(kontoloeschungWeiter(KONTOLOESCHUNG_ANFANG, ereignis))
    assert.match(text, /kann bereits entfernt sein/)
    assert.match(text, /Support/)
    assert.equal(text.includes('keine bestätigte Datenänderung'), false)
    assert.equal(ziel.rufe.includes('signOut'), false)
    assert.deepEqual(ziel.pfade, [])
  })

  test('der Löschkörper enthält keine user_id und die Copy kein Rechtsversprechen', async () => {
    const koerper = kontoloeschungLoeschkoerper()
    assert.deepEqual(Object.keys(koerper), ['confirmation'])
    assert.equal(koerper.confirmation, 'KONTO LÖSCHEN')
    let gesehen = ''
    const geholt = await kontoloeschungAntwortHolen(
      'https://example.test/functions/v1/account-delete-v1',
      'token-aaaaaaaaaaaaaaaa',
      'anon',
      async (_url, init) => {
        gesehen = String(init?.body)
        return new Response(JSON.stringify({ klasse: 'geloescht', user_id: NUTZER }), { status: 200 })
      },
    )
    assert.equal(gesehen, JSON.stringify({ confirmation: 'KONTO LÖSCHEN' }))
    assert.equal(geholt.klasse, 'geloescht')
    assert.equal(kontoloeschungFunktionsUrl(`https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`), `https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co/functions/v1/account-delete-v1`)
    assert.equal(kontoloeschungFunktionsUrl(`https://${PRODUKTIONS_PROJEKT_REF}.supabase.co`), null)
    assert.equal(kontoloeschungFunktionsUrl('http://evil.example'), null)

    const oberflaeche = quelle('../../components/account/KontoLoeschen.tsx')
    const einstellungen = quelle('../../app/account/settings/page.tsx')
    const seite = quelle('../../app/(public)/konto-geloescht/page.tsx')
    const funktion = quelle('../../supabase/functions/account-delete-v1/index.ts')
    for (const text of [oberflaeche, seite]) {
      assert.equal(/DSGVO|GDPR|CH-DSG|30 Tage|wiederherstellen/i.test(text), false)
    }
    assert.match(oberflaeche, /Daten zuerst exportieren/)
    assert.match(oberflaeche, /href="\/api\/account\/export"/)
    assert.match(oberflaeche, /Konto löschen/)
    assert.match(oberflaeche, /dazu gespeicherten Reisen, Reisenden/)
    assert.equal(oberflaeche.includes('übrigen'), false)
    assert.equal(oberflaeche.includes('unwiderruflich'), false)
    assert.match(oberflaeche, /loeschUmgebungErlaubt\(process\.env\.NEXT_PUBLIC_SUPABASE_URL\)/)
    assert.match(einstellungen, /loeschUmgebungErlaubt\(process\.env\.NEXT_PUBLIC_SUPABASE_URL\)/)
    assert.match(einstellungen, /loeschungAngeboten \? <KontoLoeschen \/> : null/)
    assert.equal(einstellungen.includes('headers('), false)
    assert.equal(einstellungen.includes('next/headers'), false)
    assert.match(oberflaeche, /KONTO LÖSCHEN/)
    assert.match(oberflaeche, /Aktuelles Passwort/)
    assert.match(oberflaeche, /aria-live="polite"/)
    assert.match(oberflaeche, /variant="destructive"/)
    assert.equal(oberflaeche.includes('unenroll'), false)
    assert.equal(oberflaeche.includes('user_id'), false)
    assert.match(funktion, /deleteUser\(userId, false\)/)
    assert.match(funktion, /auth\.getUser\(jwt\)/)
    assert.match(funktion, /\.from\('security_events'\)\.delete\(\)\.eq\('user_id', userId\)/)
    assert.match(funktion, /eigeneSpeicherObjekteLoeschen/)
    assert.equal(funktion.includes('storage.objects'), false)
    const nachweis = quelle('../../scripts/account/kontoloeschung-nachweis.ts')
    const direkt = quelle('./kontoloeschung-direkt.ts')
    assert.equal(nachweis.includes("'/auth/v1/factors', 'GET'"), false)
    assert.match(nachweis, /'\/auth\/v1\/factors', 'POST'/)
    assert.match(nachweis, /\/auth\/v1\/user/)
    assert.match(nachweis, /randomUUID\(\)/)
    assert.equal(nachweis.includes('delete from storage.objects'), false)
    assert.equal(nachweis.includes('owner_id'), false)
    assert.equal(nachweis.includes('object/list'), false)
    assert.match(direkt, /management_401/)
    assert.match(direkt, /nachweisGrund/)
    assert.match(nachweis, /zugangAufloesen/)
    assert.equal(direkt.includes('api.supabase.com'), false)
    assert.equal(direkt.includes('process.env.SUPABASE_ACCESS_TOKEN'), false)
    assert.equal(direkt.includes(PRODUKTIONS_PROJEKT_REF) || direkt.includes('PRODUKTIONS_PROJEKT_REF'), true)
    assert.equal(funktion.includes('kontoloeschung-direkt'), false)
    assert.equal(funktion.includes('user_id:'), false)
    assert.match(seite, /Konto gelöscht/)
    assert.match(seite, /index: false/)
  })

  test('relative Importe im Edge-Bundle enden auf .ts', () => {
    const dateien = [
      quelle('../../supabase/functions/account-delete-v1/index.ts'),
      quelle('./kontoloeschung-ausfuehrung.ts'),
      quelle('./kontoloeschung-speicher.ts'),
      quelle('./kontoloeschung-vertrag.ts'),
    ]
    const importe = dateien.flatMap((text) =>
      [...text.matchAll(/from\s+['"](\.[^'"]+)['"]/g)].map((treffer) => treffer[1] ?? ''),
    )
    assert.deepEqual(importe.filter((pfad) => !pfad.endsWith('.ts')), [])
    assert.ok(importe.some((pfad) => pfad.endsWith('kontoloeschung-vertrag.ts')))
    assert.match(quelle('../../supabase/config.toml'), /\[functions\.account-delete-v1\][\s\S]*verify_jwt = true/)
  })
})

describe('Kontolöschung Direktmodus', () => {
  const anon = 'anon-test-material'
  const geheim = 'service-test-material'
  const entwicklung = {
    SUPABASE_PROJECT_REF: ENTWICKLUNGS_PROJEKT_REF,
    NEXT_PUBLIC_SUPABASE_URL: entwicklungsUrl(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
    SUPABASE_SERVICE_ROLE_KEY: geheim,
  }

  test('Development-Ref, URL und beide Schlüssel öffnen den Direktmodus ohne Netz', async () => {
    const vorher = globalThis.fetch
    let netz = false
    globalThis.fetch = (async () => {
      netz = true
      throw new Error('netz')
    }) as typeof fetch
    try {
      const entscheidung = direktZugangPruefen(entwicklung)
      assert.equal(entscheidung.modus, 'direkt')
      const text = JSON.stringify(entscheidung)
      assert.equal(text.includes(anon), false)
      assert.equal(text.includes(geheim), false)
      let management = 0
      const zugang = await zugangAufloesen(entwicklung, async () => {
        management += 1
        throw new Error('management')
      })
      assert.equal(management, 0)
      assert.equal(netz, false)
      assert.equal(zugang.modus, 'direkt')
      assert.equal(zugang.token, '')
      assert.equal(zugang.url, entwicklungsUrl())
    } finally {
      globalThis.fetch = vorher
    }
  })

  test('ein fehlender Schlüssel und Production scheitern vor dem Netz', async () => {
    const vorher = globalThis.fetch
    let netz = false
    globalThis.fetch = (async () => {
      netz = true
      throw new Error('netz')
    }) as typeof fetch
    try {
      const faelle = [
        { ...entwicklung, SUPABASE_SERVICE_ROLE_KEY: undefined },
        { ...entwicklung, NEXT_PUBLIC_SUPABASE_ANON_KEY: '   ' },
        {
          ...entwicklung,
          SUPABASE_PROJECT_REF: PRODUKTIONS_PROJEKT_REF,
          NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUKTIONS_PROJEKT_REF}.supabase.co`,
        },
        {
          ...entwicklung,
          NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUKTIONS_PROJEKT_REF}.supabase.co`,
        },
        { ...entwicklung, NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' },
        { ...entwicklung, SUPABASE_PROJECT_REF: 'aaaaaaaaaaaaaaaaaaaa' },
        { SUPABASE_PROJECT_REF: PRODUKTIONS_PROJEKT_REF },
      ]
      const grunde = [
        'direkt_unvollstaendig',
        'direkt_unvollstaendig',
        'produktion',
        'produktion',
        'url_abweichung',
        'projekt_ref',
        'produktion',
      ]
      for (let i = 0; i < faelle.length; i += 1) {
        let management = 0
        await assert.rejects(
          () =>
            zugangAufloesen(faelle[i] ?? {}, async () => {
              management += 1
              return { anon, geheim, token: 'management-token' }
            }),
          (fehler: unknown) => {
            assert.ok(fehler instanceof Error)
            assert.equal(fehler.message, grunde[i])
            assert.equal(fehler.message.includes(anon), false)
            assert.equal(fehler.message.includes(geheim), false)
            assert.equal(fehler.message.includes('management-token'), false)
            return true
          },
        )
        assert.equal(management, 0)
      }
      assert.equal(netz, false)
      assert.equal(nachweisGrund(`abgelehnt ${geheim}`), 'ausnahme')
      assert.equal(nachweisGrund(geheim), 'ausnahme')
      assert.equal(nachweisGrund('auth_admin'), 'auth_admin')
    } finally {
      globalThis.fetch = vorher
    }
  })

  test('ohne beide Schlüssel bleibt der Management-Weg', async () => {
    let management = 0
    const zugang = await zugangAufloesen(
      { SUPABASE_PROJECT_REF: ENTWICKLUNGS_PROJEKT_REF },
      async () => {
        management += 1
        return { anon: 'geladen-anon', geheim: 'geladen-geheim', token: 'geladen-token' }
      },
    )
    assert.equal(management, 1)
    assert.equal(zugang.modus, 'management')
    assert.equal(zugang.ref, ENTWICKLUNGS_PROJEKT_REF)
  })
})

describe('Kontolöschung Speicher-Abwesenheit im Nachweis', () => {
  function uhr() {
    let zeit = 0
    const pausen: number[] = []
    return {
      jetzt: () => zeit,
      warten: async (ms: number) => {
        pausen.push(ms)
        zeit += ms
      },
      pausen,
    }
  }

  test('sofort weg: ein Blick, keine Pause', async () => {
    const zeit = uhr()
    let blicke = 0
    const weg = await objektAbwesenheitWarten(async () => {
      blicke += 1
      return false
    }, zeit)
    assert.equal(weg, true)
    assert.equal(blicke, 1)
    assert.deepEqual(zeit.pausen, [])
  })

  test('verzögert weg: innerhalb der Frist, danach nicht weiter', async () => {
    const zeit = uhr()
    const folgen = [true, true, false]
    let blicke = 0
    const weg = await objektAbwesenheitWarten(async () => folgen[blicke++] ?? true, zeit)
    assert.equal(weg, true)
    assert.equal(blicke, 3)
    assert.equal(zeit.pausen.length, 2)
    assert.ok(zeit.pausen.every((ms) => ms === OBJEKT_ABWESENHEIT_INTERVALL_MS))
    const summe = zeit.pausen.reduce((gesamt, ms) => gesamt + ms, 0)
    assert.ok(summe < OBJEKT_ABWESENHEIT_FRIST_MS)
  })

  test('bleibt vorhanden: endet an der Frist und meldet nicht entfernt', async () => {
    const zeit = uhr()
    let blicke = 0
    const weg = await objektAbwesenheitWarten(async () => {
      blicke += 1
      return true
    }, zeit)
    assert.equal(weg, false)
    const summe = zeit.pausen.reduce((gesamt, ms) => gesamt + ms, 0)
    assert.equal(summe, OBJEKT_ABWESENHEIT_FRIST_MS)
    assert.ok(blicke > 1)
    assert.ok(blicke < 100)
  })

  test('eine stehenbleibende Uhr beendet die Warteschleife', async () => {
    let blicke = 0
    const weg = await objektAbwesenheitWarten(
      async () => {
        blicke += 1
        return true
      },
      { jetzt: () => 0, warten: async () => undefined },
    )
    assert.equal(weg, false)
    assert.equal(blicke, 1)
  })

  test('ein Lesefehler bricht ab und zählt nicht als entfernt', async () => {
    const zeit = uhr()
    await assert.rejects(
      () => objektAbwesenheitWarten(async () => {
        throw new Error('speicher')
      }, zeit),
      (fehler: unknown) => {
        assert.ok(fehler instanceof Error)
        assert.equal(fehler.message, 'speicher')
        return true
      },
    )
    assert.deepEqual(zeit.pausen, [])
  })

  test('Object Info 200 ist vorhanden, 404 ist sofort weg', async () => {
    assert.equal(objektAusInfoStatus(200), true)
    assert.equal(objektAusInfoStatus(404), false)
    assert.equal(objektAusInfoStatus(400), false)
    const adresse = objektInfoAdresse(
      'https://example.test',
      'jetnity-erasure-proof',
      '11111111-1111-4111-8111-111111111111',
    )
    assert.equal(
      adresse,
      'https://example.test/storage/v1/object/info/jetnity-erasure-proof/11111111-1111-4111-8111-111111111111/proof.bin',
    )
    assert.equal(adresse.includes('/object/info/'), true)
    assert.equal(/\/object\/jetnity-erasure-proof\//.test(adresse), false)

    const zeit = uhr()
    let blicke = 0
    const weg = await objektAbwesenheitWarten(async () => {
      blicke += 1
      return objektAusInfoStatus(404)
    }, zeit)
    assert.equal(weg, true)
    assert.equal(blicke, 1)
    assert.deepEqual(zeit.pausen, [])
  })

  test('verspätetes Verschwinden über Object Info endet innerhalb der Frist', async () => {
    const zeit = uhr()
    const stati = [200, 200, 404]
    let blicke = 0
    const weg = await objektAbwesenheitWarten(async () => objektAusInfoStatus(stati[blicke++] ?? 200), zeit)
    assert.equal(weg, true)
    assert.equal(blicke, 3)
    assert.equal(zeit.pausen.length, 2)
    const summe = zeit.pausen.reduce((gesamt, ms) => gesamt + ms, 0)
    assert.ok(summe < OBJEKT_ABWESENHEIT_FRIST_MS)
  })

  test('ein anderer Info-Status ist ein Fehler und keine Abwesenheit', async () => {
    const zeit = uhr()
    await assert.rejects(
      () => objektAbwesenheitWarten(async () => objektAusInfoStatus(500), zeit),
      (fehler: unknown) => fehler instanceof Error && fehler.message === 'speicher',
    )
    assert.throws(() => objektAusInfoStatus(401), (fehler: unknown) => {
      assert.ok(fehler instanceof Error)
      assert.equal(fehler.message, 'speicher')
      return true
    })
    assert.deepEqual(zeit.pausen, [])
  })

  test('bleibendes Info 200 endet an der Frist ohne Entfernt-Meldung', async () => {
    const zeit = uhr()
    let blicke = 0
    const weg = await objektAbwesenheitWarten(async () => {
      blicke += 1
      return objektAusInfoStatus(200)
    }, zeit)
    assert.equal(weg, false)
    const summe = zeit.pausen.reduce((gesamt, ms) => gesamt + ms, 0)
    assert.equal(summe, OBJEKT_ABWESENHEIT_FRIST_MS)
    assert.ok(blicke > 1)
  })

  test('nur die eigene Fixture nach dem Löschen wartet; fremdes Objekt und Aufräumen nicht', () => {
    assert.ok(OBJEKT_ABWESENHEIT_INTERVALL_MS > 0)
    assert.ok(OBJEKT_ABWESENHEIT_INTERVALL_MS <= 100)
    assert.ok(OBJEKT_ABWESENHEIT_FRIST_MS >= 200)
    assert.ok(OBJEKT_ABWESENHEIT_FRIST_MS <= 2000)

    const nachweis = quelle('../../scripts/account/kontoloeschung-nachweis.ts')
    const blick = nachweis.slice(nachweis.indexOf('async function objektDa'), nachweis.indexOf('function totpFenster'))
    assert.match(blick, /objektInfoAdresse\(url, BUCKET, id\)/)
    assert.match(blick, /objektAusInfoStatus\(res\.status\)/)
    assert.equal(blick.includes('/storage/v1/object/${BUCKET}/'), false)
    assert.equal(blick.includes('console.'), false)
    assert.match(
      nachweis,
      /speicher_entfernt = await objektAbwesenheitWarten\(\(\) => objektDa\(url, geheim, zielNutzer\.id\)\)/,
    )
    assert.match(nachweis, /await objektDa\(url, geheim, fremd\.id\)/)
    assert.equal(nachweis.includes('objektAbwesenheitWarten(() => objektDa(url, geheim, fremd.id)'), false)
    const aufraeumen = nachweis.slice(nachweis.indexOf('async function speicherEntfernen'))
    assert.equal(aufraeumen.includes('objektAbwesenheitWarten'), false)
    assert.match(aufraeumen, /method: 'DELETE'/)

    for (const datei of [
      './kontoloeschung-speicher.ts',
      './kontoloeschung-ausfuehrung.ts',
      '../../supabase/functions/account-delete-v1/index.ts',
    ]) {
      const text = quelle(datei)
      assert.equal(text.includes('objektAbwesenheitWarten'), false)
      assert.equal(text.includes('object/info'), false)
    }
  })
})
