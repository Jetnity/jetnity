// lib/supabase/config-toml.test.ts
//
// Der Leser ist kein vollständiges TOML, sondern genau so viel davon, wie
// `supabase/config.toml` benutzt. Diese Tests halten beide Grenzen fest: was er
// lesen muss, und woran er absichtlich abbricht, statt still etwas Falsches zu
// liefern.
//
// Die heikelste Stelle ist das `#`. Es beginnt in TOML einen Kommentar – steht
// aber mitten im Wert von `password_requirements`, weil es ein erlaubtes
// Sonderzeichen ist. Ein Leser, der an jedem `#` abschneidet, liefert dort eine
// halbe Zeichenkette und der Abgleich meldet eine Abweichung, die es nicht gibt.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { leseToml, tomlWert } from '@/lib/supabase/config-toml'

describe('Werte', () => {
  test('Zeichenkette, Zahl und Wahrheitswert', () => {
    const t = leseToml(['name = "jetnity"', 'port = 54321', 'enabled = true', 'aus = false'].join('\n'))

    assert.equal(t.name, 'jetnity')
    assert.equal(t.port, 54321)
    assert.equal(t.enabled, true)
    assert.equal(t.aus, false)
  })

  test('negative Zahl und Unterstrich als Tausendertrenner', () => {
    const t = leseToml(['a = -10', 'b = 1_000'].join('\n'))

    assert.equal(t.a, -10)
    assert.equal(t.b, 1000)
  })

  test('einzeilige Liste aus Zeichenketten', () => {
    const t = leseToml('schemas = ["public", "graphql_public"]')

    assert.deepEqual(t.schemas, ['public', 'graphql_public'])
  })

  test('leere Liste bleibt eine leere Liste', () => {
    // `additional_redirect_urls = []` ist eine Aussage des Repositories und
    // darf nicht als „nicht gesetzt“ ankommen: Der Abgleich unterscheidet
    // beides (fehlender Schlüssel ist ein Fehler, leere Liste ein Sollwert).
    const t = leseToml('additional_redirect_urls = []')

    assert.deepEqual(t.additional_redirect_urls, [])
  })

  test('Maskierungen in Zeichenketten', () => {
    const t = leseToml('a = "eins\\nzwei\\t\\"drei\\"\\\\"')

    assert.equal(t.a, 'eins\nzwei\t"drei"\\')
  })

  test('Zeichenkette in einfachen Anführungszeichen bleibt wörtlich', () => {
    const t = leseToml("a = 'kein \\n Umbruch'")

    assert.equal(t.a, 'kein \\n Umbruch')
  })
})

describe('Kommentare', () => {
  test('Kommentar am Zeilenende fällt weg', () => {
    const t = leseToml('port = 54321 # Port der API')

    assert.equal(t.port, 54321)
  })

  test('ganze Kommentarzeile und Leerzeile werden übersprungen', () => {
    const t = leseToml(['# nur Text', '', 'a = 1'].join('\n'))

    assert.deepEqual(Object.keys(t), ['a'])
  })

  test('ein # innerhalb einer Zeichenkette bleibt stehen', () => {
    // Der Fall aus config.toml: die Symbolgruppe der Passwortregel.
    const t = leseToml('symbole = "!@#$%^&*()"')

    assert.equal(t.symbole, '!@#$%^&*()')
  })

  test('ein # nach dem Ende einer Zeichenkette schneidet ab', () => {
    const t = leseToml('a = "wert" # mit # im Kommentar')

    assert.equal(t.a, 'wert')
  })

  test('ein maskiertes Anführungszeichen beendet die Zeichenkette nicht', () => {
    const t = leseToml('a = "vor \\" # nach"')

    assert.equal(t.a, 'vor " # nach')
  })
})

describe('Tabellen', () => {
  test('verschachtelter Tabellenkopf legt die Ebenen an', () => {
    const t = leseToml(['[auth.email]', 'enable_confirmations = true'].join('\n'))

    assert.equal(tomlWert(t, 'auth.email.enable_confirmations'), true)
  })

  test('zwei Köpfe unter derselben Wurzel ergänzen sich', () => {
    const t = leseToml(
      ['[auth]', 'site_url = "http://localhost:3000"', '', '[auth.mfa.totp]', 'enroll_enabled = true'].join('\n'),
    )

    assert.equal(tomlWert(t, 'auth.site_url'), 'http://localhost:3000')
    assert.equal(tomlWert(t, 'auth.mfa.totp.enroll_enabled'), true)
  })

  test('ein Pfad ins Leere ist undefined, kein Fehler', () => {
    const t = leseToml(['[auth]', 'a = 1'].join('\n'))

    assert.equal(tomlWert(t, 'auth.gibtesnicht'), undefined)
    assert.equal(tomlWert(t, 'gibtesnicht.auch.nicht'), undefined)
  })

  test('ein Pfad auf eine Tabelle liefert keinen Wert', () => {
    // Sonst käme ein Objekt dort an, wo ein Sollwert erwartet wird.
    const t = leseToml(['[auth.email]', 'a = 1'].join('\n'))

    assert.equal(tomlWert(t, 'auth.email'), undefined)
  })
})

describe('Was nicht gelesen wird, bricht ab', () => {
  // Jeder dieser Fälle wäre ohne Abbruch eine stille Fehldeutung – und damit
  // ein Sollwert, der nicht das sagt, was in der Datei steht.

  test('Tabellen-Array', () => {
    assert.throws(() => leseToml('[[eintraege]]'), /Tabellen-Arrays/)
  })

  test('mehrzeilige Liste', () => {
    assert.throws(() => leseToml('a = [\n  "eins",\n]'), /mehrzeilige Listen/)
  })

  test('nicht geschlossene Zeichenkette', () => {
    assert.throws(() => leseToml('a = "offen'), /nicht geschlossen/)
  })

  test('Gleitkommazahl', () => {
    assert.throws(() => leseToml('a = 1.5'), /nicht lesbar/)
  })

  test('Zeile ohne Zuweisung', () => {
    assert.throws(() => leseToml('einfach nur Text'), /keine Zuweisung/)
  })

  test('unbekannte Maskierung', () => {
    assert.throws(() => leseToml('a = "\\q"'), /unbekannte Maskierung/)
  })

  test('die Zeilennummer steht in der Meldung', () => {
    assert.throws(() => leseToml(['a = 1', '', 'b = 1.5'].join('\n')), /Zeile 3/)
  })
})
