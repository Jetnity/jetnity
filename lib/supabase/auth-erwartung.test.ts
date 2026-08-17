// lib/supabase/auth-erwartung.test.ts
//
// Die Abbildung von `supabase/config.toml` auf die Schlüssel der Supabase
// Management API ist die Stelle, an der Phase 1.4c stehen oder fallen kann: Ist
// sie falsch, meldet `npm run auth:pruefen` entweder Abweichungen, die es nicht
// gibt, oder – schlimmer – Ruhe, wo etwas auseinandergelaufen ist.
//
// Geprüft wird deshalb dreierlei, alles ohne Netz und ohne Supabase-Zugang:
//
//   · die Umrechnungen, in denen die naheliegende Vermutung falsch ist
//     (`sessions_*` rechnet in Stunden, nicht in Sekunden),
//   · die echte `supabase/config.toml` – sie muss jeden Wert nennen, den die
//     Abbildung erwartet, und die Sollwerte müssen die Aussagen der Datei
//     wiedergeben,
//   · die Vollständigkeit: kein Schlüssel darf zugleich abgebildet und als
//     „nicht geprüft“ eingetragen sein, und die Passwortregel der Formulare
//     muss zu der der Datei passen.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { leseToml, tomlWert } from '@/lib/supabase/config-toml'
import {
  ABGEDECKTE_MUSTER,
  AUTH_ABBILDUNG,
  NICHT_GEPRUEFT,
  OHNE_TOML_SCHLUESSEL,
  ZEICHENGRUPPEN,
  ZEICHENGRUPPEN_ANZAHL,
  erwarteteAuthKonfiguration,
  inSekunden,
  inStunden,
  musterregeln,
  richtlinieStimmt,
  unklassifizierteSchluessel,
} from '@/lib/supabase/auth-erwartung'
import { GEFORDERTE_GRUPPEN, PASSWORT_RICHTLINIE } from '@/lib/auth/passwort-richtlinie'

const CONFIG = leseToml(readFileSync(join(process.cwd(), 'supabase', 'config.toml'), 'utf8'))

/** Die Erwartungen als Nachschlagetabelle, wie der Abgleich sie benutzt. */
function sollwerte() {
  return new Map(erwarteteAuthKonfiguration(CONFIG).map((e) => [e.api, e.wert]))
}

describe('Umrechnungen', () => {
  test('Sekunden, Minuten und Stunden werden zu Sekunden', () => {
    assert.equal(inSekunden('5s'), 5)
    assert.equal(inSekunden('1m'), 60)
    assert.equal(inSekunden('2h'), 7200)
  })

  test('eine Zahl bleibt eine Zahl', () => {
    assert.equal(inSekunden(10), 10)
  })

  test('sessions_* rechnet in Stunden', () => {
    // Die CLI schickt `.Hours()`. Wer hier Sekunden erwartet, vergleicht 3600
    // mit 1 und meldet eine Abweichung, die keine ist.
    assert.equal(inStunden('1h'), 1)
    assert.equal(inStunden('30m'), 0.5)
    assert.equal(inStunden('0s'), 0)
  })

  test('eine unlesbare Dauer bricht ab, statt 0 zu liefern', () => {
    // Eine stillschweigende 0 hiesse „aus“ – die Zwangsabmeldung wäre
    // abgeschaltet, ohne dass es jemand gesagt hat.
    assert.throws(() => inSekunden('1d'), /nicht lesbar/)
    assert.throws(() => inSekunden('bald'), /nicht lesbar/)
  })
})

describe('Zeichengruppen der Passwortregel', () => {
  test('vier Gruppen ergeben vier durch Doppelpunkt getrennte Mengen', () => {
    const wert = ZEICHENGRUPPEN.lower_upper_letters_digits_symbols

    assert.ok(wert.startsWith('abcdefghijklmnopqrstuvwxyz:'))
    assert.equal(ZEICHENGRUPPEN_ANZAHL.lower_upper_letters_digits_symbols, 4)
  })

  test('die Zahl der Gruppen kommt nicht aus dem Trenner', () => {
    // Die Symbolmenge enthält selbst einen Doppelpunkt. `split(':')` zählt
    // deshalb fünf Teile, obwohl es vier Gruppen sind.
    const teile = ZEICHENGRUPPEN.lower_upper_letters_digits_symbols.split(':')

    assert.equal(teile.length, 5)
    assert.equal(ZEICHENGRUPPEN_ANZAHL.lower_upper_letters_digits_symbols, 4)
  })

  test('jede benannte Anforderung hat eine Zeichenmenge und eine Anzahl', () => {
    for (const name of Object.keys(ZEICHENGRUPPEN)) {
      assert.equal(typeof ZEICHENGRUPPEN_ANZAHL[name], 'number', name)
    }
  })

  test('eine unbekannte Anforderung bricht ab', () => {
    const config = leseToml(
      [
        '[auth]',
        'site_url = "http://localhost:3000"',
        'password_requirements = "erfunden"',
      ].join('\n'),
    )

    assert.throws(() => erwarteteAuthKonfiguration(config), /password_requirements unbekannt|nennt/)
  })
})

describe('Die echte config.toml', () => {
  test('nennt jeden Wert, den die Abbildung erwartet', () => {
    // Ein fehlender Schlüssel ist kein „Standardwert“, sondern eine Lücke in
    // der Beschreibung des Branches – und muss auffallen.
    assert.doesNotThrow(() => erwarteteAuthKonfiguration(CONFIG))
  })

  test('ein fehlender Schlüssel bricht mit Namen ab', () => {
    const config = leseToml(['[auth]', 'site_url = "http://localhost:3000"'].join('\n'))

    assert.throws(() => erwarteteAuthKonfiguration(config), /auth\.additional_redirect_urls/)
  })

  test('E-Mail-Bestätigung an heisst mailer_autoconfirm aus', () => {
    // Der Schlüssel der API ist die Umkehrung des Schlüssels der Datei. Ohne
    // diese Prüfung wäre eine abgeschaltete Bestätigung als „stimmt“ zu lesen.
    assert.equal(tomlWert(CONFIG, 'auth.email.enable_confirmations'), true)
    assert.equal(sollwerte().get('mailer_autoconfirm'), false)
  })

  test('offene Registrierung heisst disable_signup aus', () => {
    assert.equal(tomlWert(CONFIG, 'auth.enable_signup'), true)
    assert.equal(sollwerte().get('disable_signup'), false)
  })

  test('die leere Redirect-Liste wird eine leere Zeichenkette', () => {
    // Die API führt `uri_allow_list` als Zeichenkette mit Kommas. Aus `[]`
    // muss `""` werden, nicht `"[]"` und nicht `undefined`.
    assert.deepEqual(tomlWert(CONFIG, 'auth.additional_redirect_urls'), [])
    assert.equal(sollwerte().get('uri_allow_list'), '')
  })

  test('secure_password_change verlangt erneute Anmeldung, nicht das alte Passwort', () => {
    // Zwei ähnlich klingende Schlüssel mit verschiedener Wirkung. Der zweite
    // muss aus bleiben, sonst scheitert der Weg über den Rücksetzlink.
    const soll = sollwerte()

    assert.equal(soll.get('security_update_password_require_reauthentication'), true)
    assert.equal(soll.get('security_update_password_require_current_password'), false)
  })

  test('keine Zwangsabmeldung nach Zeit', () => {
    const soll = sollwerte()

    assert.equal(soll.get('sessions_timebox'), 0)
    assert.equal(soll.get('sessions_inactivity_timeout'), 0)
  })

  test('der Schutz vor kompromittierten Passwörtern ist gefordert', () => {
    // Der offene Befund aus Phase 1.4: `auth_leaked_password_protection`.
    // `config.toml` kann ihn nicht ausdrücken, deshalb steht er als
    // API-Erwartung – und muss dort stehen bleiben.
    assert.equal(sollwerte().get('password_hibp_enabled'), true)
  })

  test('kein fremder Anmeldedienst ist eingeschaltet', () => {
    const soll = sollwerte()

    assert.equal(soll.get('external_google_enabled'), false)
    assert.equal(soll.get('external_apple_enabled'), false)
    assert.equal(soll.get('external_anonymous_users_enabled'), false)
  })

  test('kein Wert ohne Herkunft: jede Erwartung nennt ihre Quelle', () => {
    for (const e of erwarteteAuthKonfiguration(CONFIG)) {
      assert.ok(e.quelle.length > 0, e.api)
    }
  })

  test('jeder Schlüssel ohne CLI-Entsprechung nennt einen Grund', () => {
    // Ohne Begründung wäre die Liste ein Ort, an dem beliebige Werte
    // festgeschrieben werden könnten.
    for (const e of OHNE_TOML_SCHLUESSEL) {
      assert.ok((e.grund ?? '').length > 20, e.api)
    }
  })
})

describe('Vollständigkeit der Einordnung', () => {
  test('kein Schlüssel wird doppelt erwartet', () => {
    const alle = erwarteteAuthKonfiguration(CONFIG).map((e) => e.api)

    assert.equal(new Set(alle).size, alle.length)
  })

  test('kein erwarteter Schlüssel steht zugleich unter NICHT_GEPRUEFT', () => {
    // Sonst wäre unklar, ob er geprüft wird – und die Liste der Verzichte
    // würde eine Erwartung stillschweigend aushebeln.
    const doppelt = erwarteteAuthKonfiguration(CONFIG)
      .map((e) => e.api)
      .filter((api) => api in NICHT_GEPRUEFT)
      // rate_limit_otp und smtp_max_frequency stehen bewusst in beiden Listen:
      // Der Eintrag unter NICHT_GEPRUEFT verweist auf die Abbildung und
      // erklärt den Namen, der nicht zum TOML-Schlüssel passt.
      .filter((api) => !['rate_limit_otp', 'smtp_max_frequency'].includes(api))

    assert.deepEqual(doppelt, [])
  })

  test('jeder Verzicht nennt einen Grund', () => {
    for (const [api, grund] of Object.entries(NICHT_GEPRUEFT)) {
      assert.ok(grund.length > 10, api)
    }
  })

  test('ein unbekannter Schlüssel der API wird gemeldet', () => {
    const offen = unklassifizierteSchluessel(
      ['site_url', 'erfundener_neuer_schalter'],
      erwarteteAuthKonfiguration(CONFIG),
    )

    assert.deepEqual(offen, ['erfundener_neuer_schalter'])
  })

  test('abgebildete, begründete und von Mustern gedeckte Schlüssel gelten als eingeordnet', () => {
    const offen = unklassifizierteSchluessel(
      [
        'site_url', // abgebildet
        'sms_provider', // begründet nicht geprüft
        'external_github_client_id', // Muster: Zugangsdaten eines abgeschalteten Dienstes
        'external_github_enabled', // Musterregel: darf nur aus sein
        'smtp_host', // Muster: Mailversand
      ],
      erwarteteAuthKonfiguration(CONFIG),
    )

    assert.deepEqual(offen, [])
  })

  test('jedes Muster nennt einen Grund', () => {
    for (const m of ABGEDECKTE_MUSTER) {
      assert.ok(m.grund.length > 10, String(m.muster))
    }
    for (const r of musterregeln()) {
      assert.ok(r.grund.length > 20, r.name)
    }
  })

  test('die Musterregeln fangen einen neuen Anmeldedienst und einen neuen Hook', () => {
    const regeln = musterregeln()
    const treffer = (api: string) => regeln.filter((r) => r.muster.test(api))

    assert.equal(treffer('external_notion_enabled').length, 1)
    assert.equal(treffer('hook_send_email_enabled').length, 1)
    assert.equal(treffer('site_url').length, 0)
    // Nur der Schalter, nicht seine Zugangsdaten: Eine Client-ID an einem
    // abgeschalteten Dienst ist harmlos, `enabled = true` ist es nicht.
    assert.equal(treffer('external_notion_client_id').length, 0)
  })

  test('jede Musterregel erwartet „aus"', () => {
    for (const r of musterregeln()) {
      assert.equal(r.erwartet, false, r.name)
    }
  })

  test('die Abbildung ist in beide Richtungen eindeutig', () => {
    const toml = AUTH_ABBILDUNG.map((a) => a.toml)
    const api = AUTH_ABBILDUNG.map((a) => a.api)

    assert.equal(new Set(toml).size, toml.length)
    assert.equal(new Set(api).size, api.length)
  })
})

describe('Die Passwortregel der Formulare und die der Datei', () => {
  test('stimmen überein', () => {
    // Weicht das ab, verspricht die Oberfläche etwas, das der Auth-Server
    // ablehnt – oder lehnt etwas ab, das er annehmen würde.
    assert.deepEqual(richtlinieStimmt(CONFIG), { stimmt: true })
  })

  test('eine andere Mindestlänge in der Datei wird gemeldet', () => {
    const config = leseToml(
      ['[auth]', 'minimum_password_length = 8', 'password_requirements = "lower_upper_letters_digits_symbols"'].join('\n'),
    )
    const ergebnis = richtlinieStimmt(config)

    assert.equal(ergebnis.stimmt, false)
    assert.match(String(ergebnis.meldung), /Mindestlänge/)
  })

  test('weniger geforderte Zeichengruppen werden gemeldet', () => {
    const config = leseToml(
      ['[auth]', `minimum_password_length = ${PASSWORT_RICHTLINIE.mindestlaenge}`, 'password_requirements = "letters_digits"'].join('\n'),
    )
    const ergebnis = richtlinieStimmt(config)

    assert.equal(ergebnis.stimmt, false)
    assert.match(String(ergebnis.meldung), /Zeichengruppen/)
  })

  test('eine unbekannte Anforderung wird gemeldet, nicht durchgelassen', () => {
    const config = leseToml(
      ['[auth]', `minimum_password_length = ${PASSWORT_RICHTLINIE.mindestlaenge}`, 'password_requirements = "erfunden"'].join('\n'),
    )

    assert.equal(richtlinieStimmt(config).stimmt, false)
  })

  test('die Datei fordert genau die vier Gruppen, die die Formulare zeigen', () => {
    const anforderung = String(tomlWert(CONFIG, 'auth.password_requirements'))

    assert.equal(ZEICHENGRUPPEN_ANZAHL[anforderung], GEFORDERTE_GRUPPEN)
  })
})
