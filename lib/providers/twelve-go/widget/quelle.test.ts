import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'

import { twelveGoWidgetDarfEinfuegen } from '@/lib/providers/twelve-go/widget/einfuegen'
import {
  TWELVE_GO_WIDGET_ALLGEMEIN_DATEI,
  TWELVE_GO_WIDGET_ALLGEMEIN_LAENGE,
  TWELVE_GO_WIDGET_ALLGEMEIN_SHA256,
  TWELVE_GO_WIDGET_LOADER_HOST,
  TWELVE_GO_WIDGET_PARTNER_ID,
  TWELVE_GO_WIDGET_REFERENZ_DATEI,
  TWELVE_GO_WIDGET_REFERENZ_LAENGE,
  TWELVE_GO_WIDGET_REFERENZ_SHA256,
  TWELVE_GO_WIDGET_SUB_ID_ALLGEMEIN,
  TWELVE_GO_WIDGET_SUB_ID_REFERENZ,
} from '@/lib/providers/twelve-go/widget/kennungen'
import {
  twelveGoWidgetQuelleBeschreiben,
  twelveGoWidgetQuelleLesen,
  type TwelveGoWidgetAttribut,
} from '@/lib/providers/twelve-go/widget/quelle'

function namen(attribute: readonly TwelveGoWidgetAttribut[]): string[] {
  return attribute.map((eintrag) => eintrag.name)
}

function attribut(attribute: readonly TwelveGoWidgetAttribut[], name: string): TwelveGoWidgetAttribut {
  const treffer = attribute.filter((eintrag) => eintrag.name === name)
  assert.equal(treffer.length, 1)
  return treffer[0]!
}

describe('12Go-Widget-Quelle', () => {
  test('beide Exporte liegen bytegenau ohne zusätzliche Datei', () => {
    const dateien = readdirSync(new URL('./quelle/', import.meta.url)).sort()
    assert.deepEqual(dateien, [TWELVE_GO_WIDGET_ALLGEMEIN_DATEI, TWELVE_GO_WIDGET_REFERENZ_DATEI].sort())
  })

  test('allgemeine Quelle ist leer und die Referenz bleibt eine Beispielstrecke', () => {
    const allgemeinBytes = twelveGoWidgetQuelleLesen('allgemein')
    const referenzBytes = twelveGoWidgetQuelleLesen('referenz')
    const allgemein = twelveGoWidgetQuelleBeschreiben(allgemeinBytes)
    const referenz = twelveGoWidgetQuelleBeschreiben(referenzBytes)

    assert.equal(allgemein.art, 'allgemein')
    assert.equal(allgemein.laenge, TWELVE_GO_WIDGET_ALLGEMEIN_LAENGE)
    assert.equal(allgemein.sha256, TWELVE_GO_WIDGET_ALLGEMEIN_SHA256)
    assert.equal(allgemein.beispielstrecke, false)
    assert.equal(allgemein.subId, TWELVE_GO_WIDGET_SUB_ID_ALLGEMEIN)
    assert.equal(referenz.art, 'referenz')
    assert.equal(referenz.laenge, TWELVE_GO_WIDGET_REFERENZ_LAENGE)
    assert.equal(referenz.sha256, TWELVE_GO_WIDGET_REFERENZ_SHA256)
    assert.equal(referenz.beispielstrecke, true)
    assert.equal(referenz.subId, TWELVE_GO_WIDGET_SUB_ID_REFERENZ)

    assert.deepEqual(namen(allgemein.attribute), [
      'src',
      'data-one2go',
      'data-color',
      'data-language',
      'data-adaptive',
      'data-border',
      'data-origin-empty',
      'data-destination-empty',
      'data-caption',
      'data-sub_id',
      'data-domain',
      'data-curr',
    ])
    assert.deepEqual(namen(referenz.attribute), [
      'src',
      'data-one2go',
      'data-color',
      'data-language',
      'data-adaptive',
      'data-border',
      'data-origin',
      'data-destination',
      'data-caption',
      'data-sub_id',
      'data-domain',
      'data-curr',
    ])
    assert.notEqual(allgemein.attribute.length, 26)
    assert.notEqual(referenz.attribute.length, 26)
    assert.notDeepEqual(namen(allgemein.attribute), namen(referenz.attribute))

    const leerStart = attribut(allgemein.attribute, 'data-origin-empty')
    const leerZiel = attribut(allgemein.attribute, 'data-destination-empty')
    assert.equal(leerStart.quoted, false)
    assert.equal(leerStart.value, 'true')
    assert.equal(leerZiel.quoted, false)
    assert.equal(leerZiel.value, 'true')
    assert.equal(allgemein.attribute.some((eintrag) => eintrag.name === 'data-origin'), false)
    assert.equal(new TextDecoder('utf-8', { fatal: true }).decode(allgemeinBytes).includes('Bangkok'), false)

    assert.equal(attribut(referenz.attribute, 'data-origin').value, 'Bangkok')
    assert.equal(attribut(referenz.attribute, 'data-destination').value, 'Koh Chang')
    assert.equal(allgemein.src, referenz.src)
    assert.equal(allgemein.src.startsWith(`//${TWELVE_GO_WIDGET_LOADER_HOST}/tools/form/de/?id=${TWELVE_GO_WIDGET_PARTNER_ID}&domain=12go.asia`), true)
    assert.equal(allgemein.poweredId, 'powered')
    assert.equal(referenz.poweredId, 'powered')
    assert.equal(allgemein.poweredHref, `https://12go.asia/?z=${TWELVE_GO_WIDGET_PARTNER_ID}&sub_id=${TWELVE_GO_WIDGET_SUB_ID_ALLGEMEIN}`)
    assert.equal(referenz.poweredHref, `https://12go.asia/?z=${TWELVE_GO_WIDGET_PARTNER_ID}&sub_id=${TWELVE_GO_WIDGET_SUB_ID_REFERENZ}`)
    assert.equal(attribut(allgemein.attribute, 'data-one2go').value, TWELVE_GO_WIDGET_PARTNER_ID)
  })

  test('ein Zeilenumbruch oder die Referenz dürfen nicht als allgemeines Formular gelten', () => {
    const allgemein = twelveGoWidgetQuelleLesen('allgemein')
    const referenz = twelveGoWidgetQuelleLesen('referenz')
    assert.throws(() => twelveGoWidgetQuelleBeschreiben(Buffer.concat([allgemein, Buffer.from('\n')])), /12Go-Quelle/)
    assert.throws(() => twelveGoWidgetQuelleBeschreiben(Buffer.from('')), /12Go-Quelle/)
    assert.equal(twelveGoWidgetDarfEinfuegen(true, 'allgemein', 1, allgemein), true)
    assert.equal(twelveGoWidgetDarfEinfuegen(true, 'allgemein', 1, referenz), false)
    assert.equal(twelveGoWidgetDarfEinfuegen(false, 'allgemein', 1, allgemein), false)
    assert.equal(twelveGoWidgetDarfEinfuegen(true, 'keins', 1, allgemein), false)
    assert.equal(twelveGoWidgetDarfEinfuegen(true, 'allgemein', 0, allgemein), false)
    assert.equal(twelveGoWidgetDarfEinfuegen(true, 'allgemein', 2, allgemein), false)
  })
})
