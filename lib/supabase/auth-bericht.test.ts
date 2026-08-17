// lib/supabase/auth-bericht.test.ts
//
// Zwei Dinge werden hier geprüft, und das zweite ist der Grund, aus dem es
// diese Datei gibt.
//
// Erstens: Der Abgleich meldet, was er melden soll – eine Abweichung mit beiden
// Werten, einen unerwartet eingeschalteten Dienst, einen Schlüssel ohne Aussage
// im Repository.
//
// Zweitens: Er meldet nicht mehr als das. Ein Schlüssel, den das Repository
// nicht kennt, kann ein Geheimnis enthalten – `jwt_secret` und
// `security_captcha_secret` stehen bereits in derselben Antwort. Sein Wert darf
// deshalb in keiner Ausgabe erscheinen, weder im Text noch im JSON. Der Test
// speist genau so einen Wert ein und sucht ihn anschliessend in allem, was das
// Skript ausgeben würde.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { leseToml } from '@/lib/supabase/config-toml'
import { erwarteteAuthKonfiguration } from '@/lib/supabase/auth-erwartung'
import { alsJson, befund, bericht } from '@/lib/supabase/auth-bericht'

const CONFIG = leseToml(readFileSync(join(process.cwd(), 'supabase', 'config.toml'), 'utf8'))

/** Eine laufende Konfiguration, die genau dem Repository entspricht. */
function lebendeKonfiguration(zusatz: Record<string, unknown> = {}): Record<string, unknown> {
  const werte = Object.fromEntries(erwarteteAuthKonfiguration(CONFIG).map((e) => [e.api, e.wert]))
  return { ...werte, ...zusatz }
}

/** Alles, was ein Lauf ausgeben würde – Text und JSON zusammen. */
function jedeAusgabe(live: Record<string, unknown>): string {
  const b = befund(CONFIG, live)
  return `${bericht(b)}\n${alsJson(b)}`
}

// So könnte ein Schlüssel aussehen, den Supabase morgen hinzufügt: Der Name
// verrät nichts, der Wert ist ein Geheimnis. Genau dieser Fall ist der Grund
// für die Regel – bei einem unbekannten Schlüssel weiss niemand, was drinsteht.
const GEHEIM = 'sbp_v0_5f3c9a1e7d4b8f2a6c0e9b3d7a1f5c8e2b4d6a0f'

describe('Der Abgleich der Auth-Konfiguration', () => {
  test('eine Konfiguration, die dem Repository entspricht, ist sauber', () => {
    const b = befund(CONFIG, lebendeKonfiguration())

    assert.equal(b.sauber, true)
    assert.deepEqual(b.abweichungen, [])
    assert.deepEqual(b.fehlend, [])
    assert.deepEqual(b.verstoesse, [])
    assert.deepEqual(b.unklassifiziert, [])
  })

  test('ein abgeschalteter Schutz vor kompromittierten Passwörtern fällt auf', () => {
    // Der Sollwert steht in OHNE_TOML_SCHLUESSEL. Läuft er auseinander, ist
    // das der Befund auth_leaked_password_protection – und muss auffallen.
    const b = befund(CONFIG, lebendeKonfiguration({ password_hibp_enabled: false }))

    assert.equal(b.sauber, false)
    assert.equal(b.abweichungen.length, 1)
    assert.equal(b.abweichungen[0]?.api, 'password_hibp_enabled')
    assert.match(bericht(b), /password_hibp_enabled/)
  })

  test('ein fehlender Schlüssel der API wird als fehlend gemeldet, nicht als stimmig', () => {
    const live = lebendeKonfiguration()
    delete live.site_url

    const b = befund(CONFIG, live)

    assert.equal(b.sauber, false)
    assert.deepEqual(b.fehlend, ['site_url'])
  })

  test('ein Anmeldedienst, den config.toml nicht nennt, wird gemeldet', () => {
    const b = befund(CONFIG, lebendeKonfiguration({ external_notion_enabled: true }))

    assert.equal(b.sauber, false)
    assert.equal(b.verstoesse.length, 1)
    assert.equal(b.verstoesse[0]?.api, 'external_notion_enabled')
    assert.match(bericht(b), /external_notion_enabled/)
  })

  test('ein Schlüssel ohne Aussage im Repository wird gemeldet', () => {
    const b = befund(CONFIG, lebendeKonfiguration({ erfundener_neuer_schalter: true }))

    assert.equal(b.sauber, false)
    assert.deepEqual(b.unklassifiziert, ['erfundener_neuer_schalter'])
    assert.match(bericht(b), /erfundener_neuer_schalter/)
  })
})

describe('Der Wert eines unbekannten Schlüssels bleibt drinnen', () => {
  test('der Name steht in der Ausgabe, der Wert nicht', () => {
    const ausgabe = jedeAusgabe(lebendeKonfiguration({ zukunft_signing_key: GEHEIM }))

    assert.match(ausgabe, /zukunft_signing_key/)
    assert.equal(ausgabe.includes(GEHEIM), false)
  })

  test('auch nicht in Teilen: kein Stück des Wertes erscheint', () => {
    // Eine Kürzung auf 60 Zeichen hätte den Test oben bestehen lassen und den
    // Anfang des Geheimnisses trotzdem ins Protokoll geschrieben.
    const ausgabe = jedeAusgabe(lebendeKonfiguration({ zukunft_signing_key: GEHEIM }))

    assert.equal(ausgabe.includes(GEHEIM.slice(0, 12)), false)
    assert.equal(ausgabe.includes('sbp_'), false)
  })

  test('der Befund selbst führt den Wert nicht mit', () => {
    // Die Ausgabe kann nicht verlieren, was sie nie bekommt. Diese Prüfung
    // hält die Reihenfolge fest: Der Wert wird beim Befund weggelassen, nicht
    // beim Formatieren weggefiltert.
    const b = befund(CONFIG, lebendeKonfiguration({ zukunft_signing_key: GEHEIM }))

    assert.deepEqual(b.unklassifiziert, ['zukunft_signing_key'])
    assert.equal(JSON.stringify(b).includes(GEHEIM), false)
  })

  test('auch ein von einem Muster gedeckter Schlüssel gibt seinen Wert nicht her', () => {
    // `external_*_enabled` soll `false` sein. Steht dort etwas anderes, ist es
    // ein Verstoss – aber der Inhalt ist nicht begutachtet und bleibt drinnen.
    const ausgabe = jedeAusgabe(lebendeKonfiguration({ external_zukunft_enabled: GEHEIM }))

    assert.match(ausgabe, /external_zukunft_enabled/)
    assert.equal(ausgabe.includes(GEHEIM), false)
  })

  test('mehrere unbekannte Schlüssel gleichzeitig, keiner mit Wert', () => {
    const ausgabe = jedeAusgabe(
      lebendeKonfiguration({
        zukunft_signing_key: GEHEIM,
        zukunft_webhook_token: `${GEHEIM}-zwei`,
      }),
    )

    assert.match(ausgabe, /zukunft_signing_key/)
    assert.match(ausgabe, /zukunft_webhook_token/)
    assert.equal(ausgabe.includes(GEHEIM), false)
  })

  test('ein begutachteter Wert erscheint weiterhin – sonst wäre der Abgleich stumm', () => {
    // Die Gegenprobe zur Zurückhaltung: Bei einem Schlüssel, den das
    // Repository nennt, ist der gefundene Wert die Information, um die es geht.
    const ausgabe = jedeAusgabe(lebendeKonfiguration({ site_url: 'https://falsch.example' }))

    assert.match(ausgabe, /site_url/)
    assert.ok(ausgabe.includes('https://falsch.example'))
  })
})
