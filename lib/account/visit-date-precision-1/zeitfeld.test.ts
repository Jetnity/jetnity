import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import AccountBesuchFormular, {
  besuchEingabeAus,
  type BesuchFormularWert,
} from '@/components/account/AccountBesuchFormular'
import { BESUCHE_COPY } from '@/lib/account/besuche-copy'
import {
  BESUCH_MELDUNG,
  besuchAenderungLesen,
  besuchAnlageLesen,
  besuchZeitPruefen,
} from '@/lib/account/besuche-eingabe'
import { besuchZeitfeldSetzen } from '@/lib/account/visit-date-precision-1/zeitfeld'

const HEUTE = { jahr: 2026, monat: 10, tag: 23 }
const AENDERUNG_ID = '11111111-1111-4111-8111-111111111111'
const hier = dirname(fileURLToPath(import.meta.url))

const ort = { id: 'geonames:2267057', name: 'Lissabon' }

function wert(teil: Partial<BesuchFormularWert> = {}): BesuchFormularWert {
  return {
    ort,
    countryCode: '',
    jahr: '2004',
    monat: '5',
    tag: '9',
    ...teil,
  }
}

function zeit(eingabe: BesuchFormularWert) {
  const payload = besuchEingabeAus(eingabe)
  return { jahr: payload.jahr, monat: payload.monat, tag: payload.tag }
}

function anlage(eingabe: BesuchFormularWert) {
  return besuchAnlageLesen(besuchEingabeAus(eingabe), HEUTE)
}

function aenderung(eingabe: BesuchFormularWert) {
  return besuchAenderungLesen({ id: AENDERUNG_ID, ...besuchEingabeAus(eingabe) }, HEUTE)
}

function feldHtml(html: string, label: string): string {
  const start = html.indexOf(`>${label}<`)
  assert.notEqual(start, -1, label)
  const ende = html.indexOf('</label>', start)
  assert.notEqual(ende, -1, label)
  return html.slice(start, ende)
}

function formularHtml(eingabe: BesuchFormularWert, gestapelt: boolean): string {
  return renderToStaticMarkup(
    createElement(AccountBesuchFormular, {
      titel: gestapelt ? BESUCHE_COPY.aendernTitel : BESUCHE_COPY.anlegenTitel,
      aktionText: gestapelt ? BESUCHE_COPY.aendernAktion : BESUCHE_COPY.anlegenAktion,
      wert: eingabe,
      onWert: () => undefined,
      onAbsenden: () => undefined,
      laeuft: false,
      zeitNebeneinander: !gestapelt,
    }),
  )
}

describe('Genauigkeit reduzieren verwirft abhängige Felder', () => {
  test('Monat leeren aus 2004/5/9 serialisiert Jahr ohne Monat und Tag', () => {
    const alt = { ...wert(), monat: '' }
    assert.deepEqual(zeit(alt), { jahr: 2004, monat: null, tag: 9 })
    assert.deepEqual(besuchZeitPruefen(zeit(alt), HEUTE), {
      ok: false,
      meldung: BESUCH_MELDUNG.tagOhneMonat,
    })

    const neu = besuchZeitfeldSetzen(wert(), 'monat', '')
    assert.deepEqual(
      { jahr: neu.jahr, monat: neu.monat, tag: neu.tag },
      { jahr: '2004', monat: '', tag: '' },
    )
    assert.equal(neu.ort, ort)
    assert.equal(neu.countryCode, '')
    assert.deepEqual(zeit(neu), { jahr: 2004, monat: null, tag: null })
    assert.equal(anlage(neu).ok, true)
    assert.equal(aenderung(neu).ok, true)
  })

  test('Jahr leeren serialisiert keine Zeit und behält Ort und Land', () => {
    const land = wert({ ort: null, countryCode: 'PT' })
    const alt = { ...land, jahr: '' }
    assert.deepEqual(zeit(alt), { jahr: null, monat: 5, tag: 9 })
    assert.equal(besuchZeitPruefen(zeit(alt), HEUTE).ok, false)

    const neu = besuchZeitfeldSetzen(land, 'jahr', '   ')
    assert.deepEqual(
      { jahr: neu.jahr, monat: neu.monat, tag: neu.tag, countryCode: neu.countryCode, ort: neu.ort },
      { jahr: '   ', monat: '', tag: '', countryCode: 'PT', ort: null },
    )
    assert.deepEqual(zeit(neu), { jahr: null, monat: null, tag: null })
    const gelesen = anlage(neu)
    assert.equal(gelesen.ok, true)
    if (gelesen.ok) {
      assert.equal(gelesen.wert.countryCode, 'PT')
      assert.equal(gelesen.wert.placeId, null)
    }
    assert.equal(aenderung(neu).ok, true)
  })

  test('neues Jahr oder neuer Monat stellt verworfene Kinder nicht wieder her', () => {
    const ohneMonat = besuchZeitfeldSetzen(wert(), 'monat', '')
    const monatWieder = besuchZeitfeldSetzen(ohneMonat, 'monat', '5')
    assert.deepEqual(zeit(monatWieder), { jahr: 2004, monat: 5, tag: null })
    assert.equal(anlage(monatWieder).ok, true)

    const ohneJahr = besuchZeitfeldSetzen(wert(), 'jahr', '')
    const jahrWieder = besuchZeitfeldSetzen(ohneJahr, 'jahr', '2004')
    assert.deepEqual(zeit(jahrWieder), { jahr: 2004, monat: null, tag: null })
    const monatNachJahr = besuchZeitfeldSetzen(jahrWieder, 'monat', '5')
    assert.deepEqual(zeit(monatNachJahr), { jahr: 2004, monat: 5, tag: null })
    assert.equal(anlage(jahrWieder).ok, true)
  })

  test('unberührte volle, Monats-, Jahres- und leere Angaben bleiben gültig', () => {
    const faelle = [
      wert(),
      wert({ tag: '' }),
      wert({ monat: '', tag: '' }),
      wert({ jahr: '', monat: '', tag: '' }),
    ]
    assert.deepEqual(
      faelle.map((eintrag) => zeit(eintrag)),
      [
        { jahr: 2004, monat: 5, tag: 9 },
        { jahr: 2004, monat: 5, tag: null },
        { jahr: 2004, monat: null, tag: null },
        { jahr: null, monat: null, tag: null },
      ],
    )
    for (const eintrag of faelle) {
      assert.equal(anlage(eintrag).ok, true)
      assert.equal(aenderung(eintrag).ok, true)
    }
  })

  test('gewöhnliche Änderungen lassen die übrigen Felder stehen', () => {
    const tag = besuchZeitfeldSetzen(wert(), 'tag', '10')
    const monat = besuchZeitfeldSetzen(wert(), 'monat', '6')
    const jahr = besuchZeitfeldSetzen(wert(), 'jahr', '2005')
    assert.deepEqual(zeit(tag), { jahr: 2004, monat: 5, tag: 10 })
    assert.deepEqual(zeit(monat), { jahr: 2004, monat: 6, tag: 9 })
    assert.deepEqual(zeit(jahr), { jahr: 2005, monat: 5, tag: 9 })
    assert.equal(anlage(tag).ok, true)
    assert.equal(anlage(monat).ok, true)
    assert.equal(anlage(jahr).ok, true)
    assert.deepEqual(zeit(besuchZeitfeldSetzen(wert(), 'tag', '')), {
      jahr: 2004,
      monat: 5,
      tag: null,
    })
  })

  test('Schaltjahrwechsel und Zukunft bleiben ungültig und unverändert', () => {
    const schalt = besuchZeitfeldSetzen(wert({ jahr: '2024', monat: '2', tag: '29' }), 'jahr', '2023')
    assert.deepEqual(
      { jahr: schalt.jahr, monat: schalt.monat, tag: schalt.tag },
      { jahr: '2023', monat: '2', tag: '29' },
    )
    assert.deepEqual(besuchZeitPruefen(zeit(schalt), HEUTE), {
      ok: false,
      meldung: BESUCH_MELDUNG.datumUngueltig,
    })
    assert.equal(besuchZeitPruefen({ jahr: 2024, monat: 2, tag: 29 }, HEUTE).ok, true)

    const zuLang = besuchZeitfeldSetzen(wert({ jahr: '2026', monat: '1', tag: '31' }), 'monat', '2')
    assert.equal(zuLang.tag, '31')
    assert.equal(besuchZeitPruefen(zeit(zuLang), HEUTE).ok, false)

    const zukunft = wert({ jahr: '2026', monat: '12', tag: '1' })
    assert.deepEqual(besuchZeitPruefen(zeit(zukunft), HEUTE), {
      ok: false,
      meldung: BESUCH_MELDUNG.datumZukunft,
    })
    assert.deepEqual(zeit(besuchZeitfeldSetzen(zukunft, 'tag', '2')), {
      jahr: 2026,
      monat: 12,
      tag: 2,
    })
  })
})

describe('Das gemeinsame Formular zeigt die reduzierte Genauigkeit', () => {
  test('Anlegen und Bearbeiten nutzen dieselbe geleerte Darstellung', () => {
    const jahrNur = besuchZeitfeldSetzen(wert(), 'monat', '')
    const ohneZeit = besuchZeitfeldSetzen(wert(), 'jahr', '')

    for (const gestapelt of [false, true]) {
      const voll = formularHtml(wert(), gestapelt)
      assert.match(feldHtml(voll, BESUCHE_COPY.jahrLabel), /value="2004"/)
      assert.match(feldHtml(voll, BESUCHE_COPY.monatLabel), /<option value="5" selected="">Mai<\/option>/)
      assert.equal(feldHtml(voll, BESUCHE_COPY.monatLabel).includes('disabled'), false)
      assert.match(feldHtml(voll, BESUCHE_COPY.tagLabel), /value="9"/)
      assert.equal(feldHtml(voll, BESUCHE_COPY.tagLabel).includes('disabled'), false)
      assert.match(voll, new RegExp(gestapelt ? BESUCHE_COPY.aendernTitel : BESUCHE_COPY.anlegenTitel))

      const jahr = formularHtml(jahrNur, gestapelt)
      assert.match(feldHtml(jahr, BESUCHE_COPY.jahrLabel), /value="2004"/)
      const monatLeer = feldHtml(jahr, BESUCHE_COPY.monatLabel)
      assert.equal(monatLeer.includes('disabled'), false)
      assert.match(monatLeer, /<option value="" selected="">Weiss ich nicht mehr<\/option>/)
      assert.equal(/<option value="5" selected/.test(monatLeer), false)
      const tagLeer = feldHtml(jahr, BESUCHE_COPY.tagLabel)
      assert.match(tagLeer, /disabled/)
      assert.match(tagLeer, /value=""/)
      assert.equal(tagLeer.includes('value="9"'), false)

      const leer = formularHtml(ohneZeit, gestapelt)
      assert.match(feldHtml(leer, BESUCHE_COPY.jahrLabel), /value=""/)
      assert.match(feldHtml(leer, BESUCHE_COPY.monatLabel), /disabled/)
      assert.match(feldHtml(leer, BESUCHE_COPY.monatLabel), /<option value="" selected="">Weiss ich nicht mehr<\/option>/)
      assert.match(feldHtml(leer, BESUCHE_COPY.tagLabel), /disabled/)
      assert.match(feldHtml(leer, BESUCHE_COPY.tagLabel), /value=""/)
      assert.match(leer, /Lissabon/)
    }
  })

  test('die geladene Formularfunktion setzt die Zeit über denselben Helfer', () => {
    const funktion = AccountBesuchFormular.toString()
    assert.match(funktion, /besuchZeitfeldSetzen\)\(wert,"jahr"/)
    assert.match(funktion, /besuchZeitfeldSetzen\)\(wert,"monat"/)
    assert.match(funktion, /besuchZeitfeldSetzen\)\(wert,"tag"/)
  })

  test('Anlegen und Bearbeiten schicken beide die Formular-Nutzlast', () => {
    const besuche = readFileSync(join(hier, '../../../components/account/AccountBesuche.tsx'), 'utf8')
    assert.equal((besuche.match(/<AccountBesuchFormular/g) ?? []).length, 2)
    assert.match(besuche, /onWert=\{setNeu\}/)
    assert.match(besuche, /onWert=\{\(wert\) => onBearbeiten\(\{ id: bearbeitet\.id, wert \}\)\}/)
    assert.match(besuche, /besuchBestaetigen\(besuchEingabeAus\(neu\)\)/)
    assert.match(besuche, /besuchAendern\(\{\s*id: bearbeitet\.id,\s*\.\.\.besuchEingabeAus\(bearbeitet\.wert\),/s)
    assert.equal(besuche.includes('besuchZeitfeldSetzen'), false)
  })
})
