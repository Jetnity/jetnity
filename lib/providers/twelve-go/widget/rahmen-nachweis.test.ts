import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import TwelveGoWidgetRahmen from '@/components/trips/TwelveGoWidgetRahmen'
import {
  nachweisOrdner,
  rahmenBeweis,
  rahmenSeite,
  type RahmenMasse,
} from '@/scripts/twelve-go-widget-v2/rahmen-nachweis'

function masse(teil: Partial<RahmenMasse> = {}): RahmenMasse {
  return {
    vorhanden: true,
    anzahl: 1,
    width: 390,
    height: 800,
    sandbox: 'allow-scripts',
    inhalt: 'null',
    felderImFenster: true,
    tastatur: true,
    ...teil,
  }
}

describe('12Go-Rahmen-Nachweis bindet die Komponente', () => {
  test('die Prüfseite enthält genau den gelieferten Rahmen', () => {
    const komponente = renderToStaticMarkup(createElement(TwelveGoWidgetRahmen, { zweck: 'synthetische-pruefung' }))
    const seite = rahmenSeite(komponente)
    assert.equal(seite.includes('data-twelve-go-rahmen="leer"'), true)
    assert.equal((seite.match(/<iframe\b/g) ?? []).length, 1)
    assert.equal(seite.includes('src='), false)
    assert.equal(seite.includes("frame.src = '/stub'"), true)
    assert.equal(rahmenBeweis(masse(), 390), null)
  })

  test('ein ersetzter, beschnittener oder lesbarer Rahmen besteht nicht', () => {
    const ohne = rahmenSeite('<p>kein Rahmen</p>')
    assert.equal(ohne.includes('<iframe'), false)
    assert.equal(rahmenBeweis(masse({ vorhanden: false, anzahl: 0 }), 390), 'Rahmen fehlt oder ist ersetzt')
    assert.equal(rahmenBeweis(masse({ anzahl: 2 }), 390), 'Rahmen fehlt oder ist ersetzt')
    assert.equal(rahmenBeweis(masse({ height: 150 }), 390), 'Rahmen beschnitten')
    assert.equal(rahmenBeweis(masse({ sandbox: 'allow-scripts allow-same-origin' }), 390), 'Sandbox')
    assert.equal(rahmenBeweis(masse({ inhalt: 'readable' }), 390), 'Ursprung lesbar')
    assert.equal(rahmenBeweis(masse({ width: 200 }), 390), 'Breite')
    assert.equal(rahmenBeweis(masse({ felderImFenster: false }), 390), 'Felder ausserhalb')
    assert.equal(rahmenBeweis(masse({ tastatur: false }), 390), 'Tastatur')
  })

  test('ohne Umgebungsvariable liegt die Ausgabe im temporären Ordner', () => {
    const ordner = nachweisOrdner({})
    assert.equal(ordner.endsWith('twelve-go-widget-v2'), true)
    assert.equal(ordner.includes('/opt/cursor'), false)
    assert.equal(nachweisOrdner({ TWELVE_GO_WIDGET_NACHWEIS_DIR: 'ausgabe' }), 'ausgabe')
  })
})
