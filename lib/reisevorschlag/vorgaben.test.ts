import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { VORSCHLAG_THAILAND } from '@/lib/reisevorschlag/fixtures/antworten'
import { VORSCHLAG_GRENZEN } from '@/lib/reisevorschlag/schema'
import { korrekturtext, vorgabenAus, vorgabenPruefen } from '@/lib/reisevorschlag/vorgaben'

describe('Harte Vorgaben aus dem Freitext', () => {
  test('liest Dauer, Reisende, Budget und Währung', () => {
    const vorgaben = vorgabenAus(
      '7 Tage Thailand ab Zürich, zwei Personen, maximal CHF 3’000, Strand.',
    )
    assert.equal(vorgaben.tage, 7)
    assert.equal(vorgaben.reisende, 2)
    assert.equal(vorgaben.budgetziel, 3000)
    assert.equal(vorgaben.waehrung, 'CHF')
    assert.equal(vorgaben.keinFlug, false)
  })

  test('liest ausgeschlossene Orte und verbotene Flüge', () => {
    const vorgaben = vorgabenAus(
      '5 Tage nach Mailand, eine Person, kein Flug, nicht nach Rom.',
    )
    assert.equal(vorgaben.keinFlug, true)
    assert.ok(vorgaben.ausgeschlossen.includes('Rom'))
    assert.ok(vorgaben.orte.includes('Mailand'))
  })

  test('schätzt keine subjektiven Wünsche', () => {
    const vorgaben = vorgabenAus('Irgendwann irgendwohin, schön und entspannt.')
    assert.equal(vorgaben.tage, null)
    assert.equal(vorgaben.reisende, null)
    assert.equal(vorgaben.budgetziel, null)
    assert.deepEqual(vorgaben.orte, [])
  })
})

describe('Die Prüfung gegen den Vorschlag', () => {
  test('der Thailand-Fixture erfüllt die zugehörige Beschreibung', () => {
    const vorgaben = vorgabenAus(
      '7 Tage Thailand ab Zürich, zwei Personen, maximal CHF 3’000, Strand.',
    )
    assert.deepEqual(vorgabenPruefen(VORSCHLAG_THAILAND, vorgaben), [])
  })

  test('eine falsche Dauer ist ein Verstoss', () => {
    const verstoesse = vorgabenPruefen(VORSCHLAG_THAILAND, {
      ...vorgabenAus('7 Tage Thailand'),
      tage: 5,
    })
    assert.equal(verstoesse.length, 1)
    assert.equal(verstoesse[0].art, 'tage')
  })

  test('ein Flug trotz Verbot ist ein Verstoss', () => {
    const verstoesse = vorgabenPruefen(VORSCHLAG_THAILAND, {
      ...vorgabenAus('7 Tage Thailand'),
      keinFlug: true,
    })
    assert.ok(verstoesse.some((verstoss) => verstoss.art === 'keinFlug'))
  })

  test('die Korrektur nennt die Verstösse und keine Preise', () => {
    const text = korrekturtext('7 Tage Thailand', [
      { art: 'tage', meldung: 'Die Reise sollte 7 Tage haben, der Entwurf hat 5.' },
    ])
    assert.match(text, /Korrektur, einmalig/)
    assert.match(text, /7 Tage/)
    assert.doesNotMatch(text, /CHF 412|noch frei|Verfügbarkeit|Buchungslink/)
  })

  test('eine lange Beschreibung bleibt in der Eingabegrenze', () => {
    const lang = '7 Tage Thailand. '.repeat(200)
    const text = korrekturtext(lang, [
      { art: 'tage', meldung: 'Die Reise sollte 7 Tage haben, der Entwurf hat 5.' },
    ])
    assert.ok(text.length <= VORSCHLAG_GRENZEN.freitextMaximum)
    assert.match(text, /Korrektur, einmalig/)
  })
})
