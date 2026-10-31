import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import TwelveGoWidgetPruefung from '@/components/trips/TwelveGoWidgetPruefung'
import { twelveGoWidgetBesucherAnsicht, twelveGoWidgetPruefAnsicht } from '@/lib/providers/twelve-go/widget/ansicht'
import {
  TWELVE_GO_WIDGET_PHASEN,
  twelveGoWidgetAnfang,
  twelveGoWidgetReduzieren,
  type TwelveGoWidgetEreignis,
  type TwelveGoWidgetZustand,
} from '@/lib/providers/twelve-go/widget/entscheidung'
import { TWELVE_GO_WIDGET_FREIGABE } from '@/lib/providers/twelve-go/widget/freigabe'
import { twelveGoWidgetQuelleLesen } from '@/lib/providers/twelve-go/widget/quelle'
import { twelveGoWidgetDarfEinfuegen } from '@/lib/providers/twelve-go/widget/einfuegen'

function lauf(ereignisse: TwelveGoWidgetEreignis[], ausfuehrbar: boolean): TwelveGoWidgetZustand {
  return ereignisse.reduce(
    (zustand, ereignis) => twelveGoWidgetReduzieren(zustand, ereignis, ausfuehrbar),
    twelveGoWidgetAnfang('reise-1', 'a>b'),
  )
}

function html(zustand: TwelveGoWidgetZustand, ausfuehrbar: boolean, zweck = 'synthetische-pruefung'): string {
  return renderToStaticMarkup(createElement(TwelveGoWidgetPruefung, { zustand, ausfuehrbar, zweck }))
}

describe('12Go-Widget-Einwilligung', () => {
  test('die Produktionsfreigabe bleibt geschlossen', () => {
    assert.deepEqual(TWELVE_GO_WIDGET_PHASEN, [
      'wahl',
      'abgelehnt',
      'wartet',
      'sichtbar',
      'zurueckgezogen',
      'fehler',
      'blockiert',
    ])
    assert.equal(TWELVE_GO_WIDGET_FREIGABE.status, 'CONSENT_BLOCKED')
    assert.equal(TWELVE_GO_WIDGET_FREIGABE.ausfuehrbar, false)
    assert.equal(TWELVE_GO_WIDGET_FREIGABE.isolation, 'NOT_ESTABLISHED')
    const ansicht = twelveGoWidgetBesucherAnsicht()
    assert.equal(ansicht.marker, 'consent-blocked')
    assert.equal(ansicht.skript, 'keins')
    assert.deepEqual(ansicht.aktionen, [])
    assert.equal(ansicht.text.includes('bleibt aus'), true)
    assert.equal(ansicht.text.includes('Beispielstrecke wird nicht vorausgefüllt'), true)
  })

  test('Ablehnen, erneutes Öffnen und fehlende Freigabe laden nichts', () => {
    const abgelehnt = lauf([{ typ: 'ablehnen' }], true)
    assert.equal(abgelehnt.phase, 'abgelehnt')
    assert.equal(abgelehnt.skript, 'keins')
    assert.match(html(abgelehnt, true), /Hinweis erneut zeigen/)
    assert.equal(html(abgelehnt, true).includes('<script'), false)

    const wieder = twelveGoWidgetReduzieren(abgelehnt, { typ: 'erneut' }, true)
    assert.equal(wieder.phase, 'wahl')
    const wahl = html(wieder, true)
    assert.match(wahl, /Formular nicht laden/)
    assert.match(wahl, /Allgemeines Formular nach Hinweis laden/)
    assert.equal(wahl.includes('<script'), false)
    assert.equal(wahl.includes('src='), false)
    assert.equal(wahl.includes('Bangkok'), false)
    assert.equal(wahl.includes('CHF'), false)

    const blockiert = lauf([{ typ: 'einwilligen' }], false)
    assert.equal(blockiert.phase, 'blockiert')
    assert.equal(blockiert.skript, 'keins')
    assert.equal(twelveGoWidgetReduzieren(blockiert, { typ: 'geladen', generation: blockiert.generation }, false), blockiert)
    const geschlossen = html(blockiert, false)
    assert.equal(geschlossen.includes('consent-blocked'), true)
    assert.equal(geschlossen.includes('<button'), false)
    assert.equal(geschlossen.includes('data-twelve-go-widget-skript="keins"'), true)
  })

  test('Grant in der Prüfhnaht bleibt eine Instanz und zieht das Formular zurück', () => {
    const wartet = lauf([{ typ: 'einwilligen' }], true)
    assert.equal(wartet.phase, 'wartet')
    assert.equal(wartet.skript, 'keins')
    assert.equal(html(wartet, true).includes('data-twelve-go-widget-skript="keins"'), true)
    assert.equal(twelveGoWidgetReduzieren(wartet, { typ: 'ablehnen' }, true), wartet)
    assert.equal(twelveGoWidgetReduzieren(wartet, { typ: 'fehlgeschlagen', generation: wartet.generation - 1 }, true), wartet)

    const fehler = twelveGoWidgetReduzieren(wartet, { typ: 'fehlgeschlagen', generation: wartet.generation }, true)
    assert.equal(fehler.phase, 'fehler')
    assert.equal(fehler.skript, 'keins')
    assert.match(html(fehler, true), /nicht angezeigt/)

    const erneut = twelveGoWidgetReduzieren(fehler, { typ: 'erneut' }, true)
    const zweiteWarte = twelveGoWidgetReduzieren(erneut, { typ: 'einwilligen' }, true)
    const sichtbar = twelveGoWidgetReduzieren(zweiteWarte, { typ: 'geladen', generation: zweiteWarte.generation }, true)
    assert.equal(sichtbar.phase, 'sichtbar')
    assert.equal(sichtbar.skript, 'allgemein')
    assert.equal(sichtbar.instanz, 1)
    assert.equal(twelveGoWidgetReduzieren(sichtbar, { typ: 'einwilligen' }, true), sichtbar)
    assert.equal(twelveGoWidgetReduzieren(sichtbar, { typ: 'geladen', generation: sichtbar.generation }, true), sichtbar)

    const ansicht = twelveGoWidgetPruefAnsicht(sichtbar, true)
    assert.equal(ansicht.skript, 'allgemein')
    assert.match(ansicht.text, /löscht das nicht/)
    const markup = html(sichtbar, true)
    assert.equal(markup.includes('data-twelve-go-widget-skript="allgemein"'), true)
    assert.equal(markup.includes('<script'), false)
    assert.equal(markup.includes('src='), false)
    assert.equal(markup.includes('trainbusferry'), false)
    assert.equal(twelveGoWidgetDarfEinfuegen(true, sichtbar.skript, sichtbar.instanz, twelveGoWidgetQuelleLesen('allgemein')), true)
    assert.equal(twelveGoWidgetDarfEinfuegen(false, sichtbar.skript, sichtbar.instanz, twelveGoWidgetQuelleLesen('allgemein')), false)

    const zurueck = twelveGoWidgetReduzieren(sichtbar, { typ: 'schliessen' }, true)
    assert.equal(zurueck.phase, 'zurueckgezogen')
    assert.equal(zurueck.skript, 'keins')
    assert.equal(zurueck.instanz, 0)
    assert.match(html(zurueck, true), /bleibt dort/)
    assert.equal(twelveGoWidgetReduzieren(zurueck, { typ: 'erneut' }, true).phase, 'wahl')
  })

  test('Reisewechsel und neue Reihenfolge verwerfen ein verspätetes Laden', () => {
    const wartet = lauf([{ typ: 'einwilligen' }], true)
    const andereReise = twelveGoWidgetReduzieren(wartet, { typ: 'reise', reiseId: 'reise-2' }, true)
    assert.equal(andereReise.phase, 'wahl')
    assert.equal(andereReise.skript, 'keins')
    assert.equal(andereReise.generation > wartet.generation, true)
    const veraltet = twelveGoWidgetReduzieren(andereReise, { typ: 'geladen', generation: wartet.generation }, true)
    assert.equal(veraltet, andereReise)

    const sichtbar = twelveGoWidgetReduzieren(wartet, { typ: 'geladen', generation: wartet.generation }, true)
    assert.equal(twelveGoWidgetReduzieren(sichtbar, { typ: 'reise', reiseId: 'reise-1' }, true), sichtbar)
    const neu = twelveGoWidgetReduzieren(sichtbar, { typ: 'reihenfolge', schluessel: 'b>a' }, true)
    assert.equal(neu.phase, 'wahl')
    assert.equal(neu.skript, 'keins')
    assert.equal(neu.instanz, 0)
    assert.equal(twelveGoWidgetReduzieren(sichtbar, { typ: 'reihenfolge', schluessel: 'a>b' }, true), sichtbar)
    assert.equal(twelveGoWidgetReduzieren(neu, { typ: 'geladen', generation: wartet.generation }, true), neu)
  })

  test('ein fremder Zweck rendert nichts', () => {
    assert.equal(html(twelveGoWidgetAnfang(null, null), true, 'besucher'), '')
  })
})
