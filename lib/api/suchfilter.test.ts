// lib/api/suchfilter.test.ts
//
// Diese Ausdrücke waren defekt, und niemand konnte es sehen: Die Route fing
// die Ablehnung der Datenbank ab und lieferte eine leere Trefferliste. Eine
// Suche, die nie etwas findet, sieht aus wie eine Suche ohne Treffer.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { ereignisSuchfilter, textSuchfilter } from '@/lib/api/suchfilter'

describe('Suche über Textspalten', () => {
  test('jede Spalte bekommt ein eigenes Glied', () => {
    assert.equal(
      textSuchfilter(['id', 'customer_email'], 'anna'),
      'id.ilike."%anna%",customer_email.ilike."%anna%"',
    )
  })

  test('ein Komma im Begriff zerlegt den Ausdruck nicht', () => {
    // Ohne Anführungszeichen läse PostgREST `a` und `b)` als zwei weitere
    // Glieder und führte eine andere Abfrage aus als die gemeinte.
    assert.equal(textSuchfilter(['id'], 'a,b)'), 'id.ilike."%a,b)%"')
  })

  test('Anführungszeichen und Rückstrich werden entwertet', () => {
    assert.equal(textSuchfilter(['id'], 'a"b\\c'), 'id.ilike."%a\\"b\\\\c%"')
  })
})

describe('Suche über Sicherheitsereignisse', () => {
  test('ein gewöhnlicher Begriff sucht in Typ und IP', () => {
    assert.equal(
      ereignisSuchfilter('auth_failed'),
      'type.ilike."%auth_failed%",ip.ilike."%auth_failed%"',
    )
  })

  test('user_id kommt nicht als ilike vor', () => {
    // Die Spalte ist `uuid`. `ilike` darauf ist der Fehler, der die gesamte
    // Ereignissuche wirkungslos gemacht hat.
    assert.ok(!ereignisSuchfilter('198.51.100.14').includes('user_id'))
  })

  test('eine vollständige UUID wird exakt gesucht', () => {
    const id = '9a8e9fa5-1d9f-493f-88fa-dbf0e2f64a71'

    assert.ok(ereignisSuchfilter(id).endsWith(`,user_id.eq.${id}`))
  })

  test('ein Teilstück einer UUID gilt nicht als UUID', () => {
    assert.ok(!ereignisSuchfilter('9a8e9fa5-1d9f').includes('user_id'))
  })
})
