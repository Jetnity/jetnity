import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  REISEN_SAMMLUNG_CURSOR_MAX,
  cursorCodieren,
  kanonischeAdresse,
  keysetOder,
  sammlungAnfrageAus,
  sammlungHref,
  suchOder,
  zeitstempelGueltig,
} from '@/lib/trips/reisen-sammlung-abfrage'

const ZEIT = '2026-10-25T23:59:59.123456+14:59'
const ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

function draht(nadel: string): string {
  const text = suchOder(nadel)
  assert.ok(text)
  return text
}

describe('literale imatch-Suche', () => {
  test('lässt Stern, Prozent, Unterstrich, Schrägstrich und Anführungszeichen literal', () => {
    assert.equal(draht('*'), 'title.imatch."\\\\*",origin.imatch."\\\\*"')
    assert.equal(draht('%'), 'title.imatch."%",origin.imatch."%"')
    assert.equal(draht('_'), 'title.imatch."_",origin.imatch."_"')
    assert.equal(draht('\\'), 'title.imatch."\\\\\\\\",origin.imatch."\\\\\\\\"')
    assert.equal(draht('"'), 'title.imatch."\\"",origin.imatch."\\""')
    assert.equal(draht(','), 'title.imatch.",",origin.imatch.","')
    assert.equal(draht('界'), 'title.imatch."界",origin.imatch."界"')
    assert.equal(draht('100%'), 'title.imatch."100%",origin.imatch."100%"')
    assert.equal(draht('a,b)'), 'title.imatch."a,b\\\\)",origin.imatch."a,b\\\\)"')
    assert.equal(draht('*').includes('ilike'), false)
    assert.equal(suchOder(''), null)
  })

  test('120 Meta-Zeichen bleiben unter der Cursor-Grenze und ohne ilike', () => {
    for (const zeichen of ['*', '%', '_', '\\', '"', ',']) {
      const nadel = zeichen.repeat(120)
      const filter = draht(nadel)
      assert.equal(filter.includes('ilike'), false)
      assert.match(filter, /imatch/)
      const token = cursorCodieren({ q: nadel, archiv: 'alle', zeit: '2024-02-29T00:00:00Z', id: ID })
      assert.ok(token)
      assert.ok(token.length <= REISEN_SAMMLUNG_CURSOR_MAX)
      const gelesen = sammlungAnfrageAus({ q: nadel, cursor: token })
      assert.equal(gelesen.ok && gelesen.q, nadel)
    }
    assert.equal(draht('*'.repeat(120)).length, 752)
    assert.equal(draht('\\'.repeat(120)).length, 992)
  })
})

describe('Cursor und Kalender', () => {
  test('U+754C mal 120 ergibt 626 und rundet zurück', () => {
    const q = '界'.repeat(120)
    const token = cursorCodieren({ q, archiv: 'archiv', zeit: ZEIT, id: ID })
    assert.ok(token)
    assert.equal(token.length, 626)
    const gelesen = sammlungAnfrageAus({ q, archiv: 'archiv', cursor: token })
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    assert.equal(gelesen.q, q)
    assert.match(gelesen.keysetOder ?? '', new RegExp(ZEIT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.equal(token.includes('='), false)
  })

  test('627 Zeichen und abweichende Filter werden vor der Abfrage abgelehnt', () => {
    assert.equal(sammlungAnfrageAus({ cursor: 'a'.repeat(627) }).ok, false)
    const token = cursorCodieren({ q: 'alpha', archiv: 'alle', zeit: ZEIT, id: ID })
    assert.equal(sammlungAnfrageAus({ q: 'beta', cursor: token ?? '' }).ok, false)
  })

  test('nur Zeilentrenner werden zur leeren Suche, innen bleiben sie erhalten', () => {
    for (const zeichen of ['\u2028', '\u2029']) {
      const anfrage = sammlungAnfrageAus({ q: zeichen.repeat(120) })
      assert.equal(anfrage.ok && anfrage.q, '')
      assert.equal(anfrage.ok ? sammlungHref(anfrage) : '', '/reisen')
    }
    const nadel = `A${'\u2028'.repeat(118)}B`
    const token = cursorCodieren({ q: nadel, archiv: 'offen', zeit: '2024-02-29T00:00:00.10Z', id: ID })
    assert.ok(token)
    assert.ok(token.length < 626)
    const gelesen = sammlungAnfrageAus({ q: nadel, archiv: 'offen', cursor: token })
    assert.equal(gelesen.ok && gelesen.q, nadel)
  })

  test('prüft Datum, Zeit und Offset ohne den Text umzuschreiben', () => {
    assert.equal(zeitstempelGueltig('2024-02-29T00:00:00.1Z'), true)
    assert.equal(zeitstempelGueltig('2024-02-29T00:00:00.10Z'), true)
    assert.notEqual(
      cursorCodieren({ q: '', archiv: 'alle', zeit: '2024-02-29T00:00:00.1Z', id: ID }),
      cursorCodieren({ q: '', archiv: 'alle', zeit: '2024-02-29T00:00:00.10Z', id: ID }),
    )
    assert.equal(zeitstempelGueltig('2026-02-29T00:00:00Z'), false)
    assert.equal(zeitstempelGueltig('2026-04-31T00:00:00Z'), false)
    assert.equal(zeitstempelGueltig('2026-01-01T24:00:00Z'), false)
    assert.equal(zeitstempelGueltig('2026-01-01T00:00:60Z'), false)
    assert.equal(zeitstempelGueltig('2026-01-01T00:00:00.1234567Z'), false)
    assert.equal(zeitstempelGueltig('2026-01-01T00:00:00+15:59'), true)
    assert.equal(zeitstempelGueltig('2026-01-01T00:00:00+16:00'), false)
    assert.equal(zeitstempelGueltig('2026-01-01T00:00:00+15:60'), false)
    assert.equal(zeitstempelGueltig('2026-01-01T00:00:00+24:00'), false)
    assert.equal(zeitstempelGueltig('0000-01-01T00:00:00Z'), false)
  })

  test('lehnt Form, Steuerung und Wiederholung ab', () => {
    assert.equal(sammlungAnfrageAus({ q: 'a'.repeat(121) }).ok, false)
    assert.equal(sammlungAnfrageAus({ q: 'a\u0000' }).ok, false)
    assert.equal(sammlungAnfrageAus({ q: '\t' }).ok, false)
    assert.equal(sammlungAnfrageAus({ q: '\uD800' }).ok, false)
    assert.equal(sammlungAnfrageAus({ archiv: 'archived' }).ok, false)
    assert.equal(sammlungAnfrageAus({ archiv: 'draft' }).ok, false)
    assert.equal(sammlungAnfrageAus({ q: ['a', 'b'] }).ok, false)
    assert.equal(sammlungAnfrageAus({ cursor: '!!!' }).ok, false)
    const json = JSON.stringify({ v: '1', q: '', a: 'alle', t: ZEIT, i: ID })
    const falsch = Buffer.from(json).toString('base64url')
    assert.equal(sammlungAnfrageAus({ cursor: falsch }).ok, false)
    const extra = Buffer.from(JSON.stringify({ v: 1, q: '', a: 'alle', t: ZEIT, i: ID, x: 1 })).toString('base64url')
    assert.equal(sammlungAnfrageAus({ cursor: extra }).ok, false)
    assert.equal(sammlungAnfrageAus({ cursor: cursorCodieren({ q: '', archiv: 'alle', zeit: ZEIT, id: ID.toUpperCase() }) ?? 'X' }).ok, false)
    assert.equal(keysetOder(ZEIT, ID), `updated_at.lt."${ZEIT}",and(updated_at.eq."${ZEIT}",id.lt."${ID}")`)
  })

  test('kanonische Adresse folgt der gültigen Suche und behält ungültige Rohwerte', () => {
    assert.equal(kanonischeAdresse(new URLSearchParams('q=beta&archiv=offen')), '/reisen?q=beta&archiv=offen')
    assert.equal(kanonischeAdresse(new URLSearchParams('archiv=archived')), '/reisen?archiv=archived')
    const bern = sammlungAnfrageAus({ q: '  Bern  ' })
    assert.equal(bern.ok && bern.q, 'Bern')
    assert.equal(bern.ok ? sammlungHref(bern) : '', '/reisen?q=Bern')
  })
})
