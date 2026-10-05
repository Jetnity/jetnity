import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { COUNTRY_COPY } from '@/lib/country/copy'
import { landAuswahlUebernehmen } from '@/lib/country/darstellung'
import { landFeldHatAuswahl, landFeldOptionen } from '@/lib/country/land-feld'

describe('LandFeld-Optionsvertrag', () => {
  test('Auswahl liefert den Code, nicht den Namen', () => {
    const optionen = landFeldOptionen({ locale: 'de' })
    const schweiz = optionen.katalog.find((eintrag) => eintrag.code === 'CH')
    assert.ok(schweiz)
    assert.equal(schweiz.code, 'CH')
    assert.equal(schweiz.label, '🇨🇭 Schweiz')
    assert.equal(landAuswahlUebernehmen(schweiz.code, ''), 'CH')
    assert.notEqual(landAuswahlUebernehmen(schweiz.label, ''), 'CH')
  })

  test('sucht nach lokalisiertem Namen und lässt den Code als Power-User-Hilfe zu', () => {
    const nachName = landFeldOptionen({ suche: 'kroatien', locale: 'de' })
    assert.deepEqual(
      nachName.katalog.map((eintrag) => eintrag.code),
      ['HR'],
    )
    const nachCode = landFeldOptionen({ suche: 'hr', locale: 'de' })
    assert.equal(nachCode.katalog.some((eintrag) => eintrag.code === 'HR'), true)
    assert.equal(landFeldOptionen({ suche: 'xyz', locale: 'de' }).katalog.length, 0)
  })

  test('optionaler Leerwert bleibt möglich und wählt nichts automatisch', () => {
    const leer = landFeldOptionen({ optional: true, aktuellerCode: '', locale: 'de' })
    assert.equal(leer.leerLabel, COUNTRY_COPY.nichtHinterlegt)
    assert.equal(leer.bestehend, null)
    assert.equal(landFeldHatAuswahl(''), false)
    assert.equal(landFeldOptionen({ optional: false }).leerLabel, COUNTRY_COPY.waehlen)
    assert.equal(leer.katalog.length > 0, true)
  })

  test('kein Auto-Select: Filter ändert den aktuellen Wert nicht', () => {
    const gefiltert = landFeldOptionen({
      suche: 'kroat',
      aktuellerCode: '',
      optional: true,
      locale: 'de',
    })
    assert.equal(gefiltert.bestehend, null)
    assert.equal(gefiltert.katalog.some((eintrag) => eintrag.code === 'HR'), true)
    assert.equal(landAuswahlUebernehmen('', ''), '')
  })

  test('hält einen Legacy-Wert sichtbar und überschreibt ihn nicht still', () => {
    const optionen = landFeldOptionen({
      suche: 'kroat',
      aktuellerCode: 'XX',
      optional: true,
      locale: 'de',
    })
    assert.equal(optionen.bestehend?.code, 'XX')
    assert.equal(optionen.bestehend?.art, 'unbekannt')
    assert.match(optionen.bestehend?.label ?? '', /Bestehender Code XX/)
    assert.equal(landAuswahlUebernehmen('XX', 'XX'), 'XX')
    assert.equal(landAuswahlUebernehmen('HR', 'XX'), 'HR')
  })
})
