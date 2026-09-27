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
import { eigeneSpeicherObjekteLoeschen, type SpeicherClient, type SpeicherEintrag } from '@/lib/account/kontoloeschung-speicher'
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

describe('Kontolöschung – Storage-API', () => {
  function client(dateien: Record<string, SpeicherEintrag[]>): SpeicherClient & { entfernt: string[] } {
    const entfernt: string[] = []
    return {
      entfernt,
      async buckets() {
        return { ids: Object.keys(dateien) }
      },
      async list(bucket, prefix) {
        const alle = dateien[bucket] ?? []
        const eintraege = alle.filter((eintrag) => {
          const ordner = eintrag.name.includes('/') ? eintrag.name.slice(0, eintrag.name.lastIndexOf('/')) : ''
          const name = eintrag.name.includes('/') ? eintrag.name.slice(eintrag.name.lastIndexOf('/') + 1) : eintrag.name
          if (ordner !== prefix) return false
          return name.length > 0
        }).map((eintrag) => ({
          ...eintrag,
          name: eintrag.name.includes('/') ? eintrag.name.slice(eintrag.name.lastIndexOf('/') + 1) : eintrag.name,
        }))
        const ordner = new Set<string>()
        for (const eintrag of alle) {
          if (!eintrag.name.startsWith(prefix ? `${prefix}/` : '')) continue
          const rest = prefix ? eintrag.name.slice(prefix.length + 1) : eintrag.name
          if (rest.includes('/')) ordner.add(rest.slice(0, rest.indexOf('/')))
        }
        for (const name of ordner) {
          if (!eintraege.some((eintrag) => eintrag.name === name)) {
            eintraege.push({ name, id: null, owner: null, ownerId: null })
          }
        }
        return { eintraege }
      },
      async remove(bucket, pfade) {
        entfernt.push(...pfade)
        const vorhanden = dateien[bucket] ?? []
        dateien[bucket] = vorhanden.filter((eintrag) => !pfade.includes(eintrag.name))
        return 'ok'
      },
    }
  }

  test('löscht nur Objekte dieser Nutzer-ID, auch in Ordnern, und lässt fremde liegen', async () => {
    const speicher = client({
      beweise: [
        { name: `${NUTZER}/proof.bin`, id: 'datei-1', owner: NUTZER, ownerId: null },
        { name: `${ANDERER}/fremd.bin`, id: 'datei-2', owner: ANDERER, ownerId: null },
        { name: 'verwaist.bin', id: 'datei-3', owner: null, ownerId: null },
      ],
    })
    const ergebnis = await eigeneSpeicherObjekteLoeschen(speicher, NUTZER)
    assert.equal(ergebnis, 'ok')
    assert.deepEqual(speicher.entfernt, [`${NUTZER}/proof.bin`])
  })

  test('bricht ab, wenn nach dem Entfernen noch ein eigenes Objekt liegt', async () => {
    const speicher = client({
      beweise: [{ name: 'bleibt.bin', id: 'datei-1', owner: NUTZER, ownerId: null }],
    })
    speicher.remove = async () => 'ok'
    const ergebnis = await eigeneSpeicherObjekteLoeschen(speicher, NUTZER)
    assert.equal(ergebnis, 'teilweise')
  })

  test('ein Fehler vor dem ersten Remove bestätigt keine Datenänderung', async () => {
    const speicher = client({
      beweise: [{ name: 'bleibt.bin', id: 'datei-1', owner: NUTZER, ownerId: null }],
    })
    speicher.buckets = async () => ({ fehler: true })
    const ergebnis = await eigeneSpeicherObjekteLoeschen(speicher, NUTZER)
    assert.equal(ergebnis, 'fehler')
    assert.deepEqual(speicher.entfernt, [])
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
    assert.equal(nachweis.includes("'/auth/v1/factors', 'GET'"), false)
    assert.match(nachweis, /'\/auth\/v1\/factors', 'POST'/)
    assert.match(nachweis, /\/auth\/v1\/user/)
    assert.match(nachweis, /randomUUID\(\)/)
    assert.equal(nachweis.includes('delete from storage.objects'), false)
    assert.match(nachweis, /management_401/)
    assert.match(nachweis, /grundAusFehler/)
    assert.equal(nachweis.includes(PRODUKTIONS_PROJEKT_REF) || nachweis.includes('PRODUKTIONS_PROJEKT_REF'), true)
    assert.equal(funktion.includes('user_id:'), false)
    assert.match(seite, /Konto gelöscht/)
    assert.match(seite, /index: false/)
  })
})
