// Rendered lodging coverage and stored booking controls.
// The canonical evaluator stays unchanged; these tests fail the previous panel.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

import UnterkunftBestand from '@/components/trips/UnterkunftBestand'
import { gebuchteBuchung, unbestaetigteBuchung } from '@/lib/trips/buchung'
import { zeitraumKurz } from '@/lib/trips/datum-anzeige'
import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const JETZT = '2026-08-21T00:00:00.000Z'
const BEKANNT = /\d+ von \d+ Nächten abgedeckt/
const FEHLT = /Nacht fehlt|Nächte fehlen/
const VORLAEUFIG = /noch nicht als fehlend bestimmbar/

function stay(teil: Partial<TripItem> & Pick<TripItem, 'id'>): TripItem {
  return {
    dayId: null,
    stageId: 'stage-1',
    kind: 'stay',
    title: 'Hotel',
    note: null,
    position: 1,
    startsOn: '2026-08-30',
    startsAt: null,
    endsOn: '2026-09-05',
    endsAt: null,
    priceAmount: 800,
    priceCurrency: 'CHF',
    provider: 'test',
    externalRef: 'stay-1',
    bookingUrl: null,
    ...unbestaetigteBuchung(),
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    ...teil,
  }
}

function etappe(teil: Partial<TripStage> = {}): TripStage {
  return {
    id: 'stage-1',
    name: 'Bali',
    position: 1,
    countryCode: 'ID',
    arrivalDate: '2026-08-30',
    departureDate: '2026-09-13',
    latitude: null,
    longitude: null,
    placeId: 'geonames:1650535',
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-08-30',
    endDate: '2026-09-13',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [etappe()],
    days: [],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function manuell(teil: Partial<TripItem> & Pick<TripItem, 'id'>): TripItem {
  return stay({ provider: null, externalRef: null, bookingUrl: null, ...teil })
}

const ZEITRAUM_UNKLAR = /Der Zeitraum fehlt oder ist unvollständig bzw\. ungültig/

function zeile(markup: string, titel: string) {
  const row = (markup.match(/<li\b[\s\S]*?<\/li>/g) ?? []).find(item => item.includes(titel))
  assert.ok(row, titel)
  return row
}

function html(trip: Trip, optionen: { buchung?: boolean; zeitraum?: boolean } = {}) {
  return renderToStaticMarkup(React.createElement(UnterkunftBestand, {
    reise: trip,
    onBuchungsstatus: optionen.buchung === false ? undefined : async () => null,
    onUnterkunftZeitraum: optionen.zeitraum ? async () => null : undefined,
  }))
}

type Props = { children?: React.ReactNode; type?: string; onClick?: () => void; disabled?: boolean; role?: string }
function elements(node: React.ReactNode, match: (el: React.ReactElement<Props>) => boolean): React.ReactElement<Props>[] {
  const found: React.ReactElement<Props>[] = []
  React.Children.forEach(node, child => {
    if (!React.isValidElement<Props>(child)) return
    if (match(child)) found.push(child)
    found.push(...elements(child.props.children, match))
  })
  return found
}

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

function laden<T>(path: string, dependencies: Record<string, unknown>): T {
  const filename = resolve(root, path)
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const loaded = { exports: {} }
  new Function('require', 'module', 'exports', code)((name: string) =>
    Object.hasOwn(dependencies, name) ? dependencies[name] : require(name.startsWith('@/') ? resolve(root, name.slice(2)) : name),
  loaded, loaded.exports)
  return loaded.exports as T
}

function bedienung(trip: Trip, outcome: string | null = null) {
  const states: unknown[] = []
  let index = 0
  const calls: Array<[string, boolean]> = []
  const ui = laden<{ default: typeof UnterkunftBestand }>('components/trips/UnterkunftBestand.tsx', {
    react: {
      ...React,
      useState: (initial: unknown) => {
        const slot = index++
        if (!(slot in states)) states[slot] = initial
        return [states[slot], (value: unknown) => {
          states[slot] = typeof value === 'function' ? (value as (current: unknown) => unknown)(states[slot]) : value
        }]
      },
    },
  })
  const onBuchungsstatus = async (itemId: string, gebucht: boolean) => {
    calls.push([itemId, gebucht])
    return outcome
  }
  const render = () => {
    index = 0
    return ui.default({ reise: trip, onBuchungsstatus })
  }
  const buttonFor = (titel: string) => {
    const row = elements(render(), el => el.type === 'li').find(li => textOf(li).includes(titel))
    assert.ok(row, titel)
    const button = elements(row, el => el.type === 'button' && (
      el.props.children === 'Buchung korrigieren' || el.props.children === 'Als gebucht markieren'
    ))[0]
    assert.ok(button, titel)
    return button
  }
  return { calls, render, buttonFor }
}

describe('Unterkunftsabdeckung bleibt unbekannt und folgt der gespeicherten Buchung', () => {
  test('gebuchte Unterkunft ohne Daten zeigt die kanonische Unklarheit und korrigiert diese Buchung', async () => {
    const trip = reise({ ohneTag: [manuell({
      id: 'stay-booked', title: 'Gebuchtes Hotel', startsOn: null, endsOn: null, ...gebuchteBuchung(JETZT),
    })] })
    const abdeckung = unterkunftAbdeckung(trip)
    assert.equal(abdeckung.bekannt, true)
    assert.equal(abdeckung.naechteGesamt, 14)
    assert.equal(abdeckung.naechteAbgedeckt, 0)
    assert.equal(abdeckung.aufenthalte[0]?.status, 'unknown')
    assert.equal(abdeckung.aufenthalte[0]?.item.bookingStatus, 'booked')
    assert.equal(abdeckung.zusammenfassung, 'Unterkunftsstand noch unklar')

    const text = html(trip, { zeitraum: true })
    assert.match(text, /Unterkunftsstand noch unklar/)
    assert.doesNotMatch(text, BEKANNT)
    assert.doesNotMatch(text, FEHLT)
    assert.match(text, /14 Nächte noch nicht als fehlend bestimmbar/)
    assert.match(text, /Noch nicht vollständig bestimmbar/)
    assert.match(text, /Zeitraum noch nicht bestimmbar/)
    assert.match(text, /Der Zeitraum fehlt oder ist unvollständig bzw\. ungültig/)
    assert.match(text, /Gebucht/)
    assert.match(text, /Buchung korrigieren/)
    assert.doesNotMatch(text, /Als gebucht markieren|Zahlung|bezahlt|Anbieter bestätigt/)

    const ui = bedienung(trip)
    assert.equal(ui.buttonFor('Gebuchtes Hotel').props.children, 'Buchung korrigieren')
    ui.buttonFor('Gebuchtes Hotel').props.onClick!()
    assert.deepEqual(ui.calls, [['stay-booked', false]])

    const ohneAktion = html(trip, { buchung: false, zeitraum: true })
    assert.match(ohneAktion, /Gebucht/)
    assert.match(ohneAktion, /Unterkunftsstand noch unklar/)
    assert.doesNotMatch(ohneAktion, /Buchung korrigieren|Als gebucht markieren/)
  })

  test('unbestätigte Unterkunft ohne Daten markiert genau diese Buchung', () => {
    const trip = reise({ ohneTag: [stay({ id: 'stay-open', title: 'Offenes Hotel', startsOn: null, endsOn: null })] })
    const text = html(trip)
    assert.match(text, /Unterkunftsstand noch unklar/)
    assert.doesNotMatch(text, BEKANNT)
    assert.doesNotMatch(text, FEHLT)
    assert.match(text, /Ausgewählt/)
    assert.match(text, /Als gebucht markieren/)
    assert.doesNotMatch(text, /Buchung korrigieren/)
    assert.doesNotMatch(text, />Gebucht</)

    const ui = bedienung(trip)
    ui.buttonFor('Offenes Hotel').props.onClick!()
    assert.deepEqual(ui.calls, [['stay-open', true]])
  })

  test('fehlende, ungültige und umgekehrte Daten bleiben unklar', () => {
    const faelle = [
      { id: 'fehlt', startsOn: '2026-09-01', endsOn: null },
      { id: 'ungueltig', startsOn: '2026-02-29', endsOn: '2026-03-02' },
      { id: 'umgekehrt', startsOn: '2026-09-10', endsOn: '2026-09-01' },
    ]
    for (const fall of faelle) {
      const text = html(reise({ ohneTag: [manuell({ ...fall, title: fall.id })] }), { zeitraum: true })
      assert.match(text, /Unterkunftsstand noch unklar/, fall.id)
      assert.doesNotMatch(text, BEKANNT, fall.id)
      assert.doesNotMatch(text, FEHLT, fall.id)
      assert.match(text, VORLAEUFIG, fall.id)
      assert.match(text, /Der Zeitraum fehlt oder ist unvollständig bzw\. ungültig/, fall.id)
    }
    assert.match(html(reise({ ohneTag: [manuell({ id: 'fehlt', title: 'Offen', startsOn: '2026-09-01', endsOn: null })] })), /Zeitraum noch nicht bestimmbar/)
  })

  test('gemischte und einzelne unbestimmte Nächte werden nicht als fehlend behauptet', async () => {
    const gemischt = reise({ ohneTag: [
      stay({ id: 'stay-known', title: 'Bekanntes Hotel', startsOn: '2026-08-30', endsOn: '2026-09-05' }),
      manuell({ id: 'stay-unknown', title: 'Undatiertes Hotel', startsOn: null, endsOn: null, ...gebuchteBuchung(JETZT) }),
    ] })
    const text = html(gemischt)
    assert.match(text, /Unterkunftsstand noch unklar/)
    assert.doesNotMatch(text, BEKANNT)
    assert.doesNotMatch(text, FEHLT)
    assert.match(text, /8 Nächte noch nicht als fehlend bestimmbar/)
    assert.doesNotMatch(text, /Noch offen/)
    const ui = bedienung(gemischt)
    assert.equal(ui.buttonFor('Bekanntes Hotel').props.children, 'Als gebucht markieren')
    ui.buttonFor('Bekanntes Hotel').props.onClick!()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(ui.buttonFor('Undatiertes Hotel').props.children, 'Buchung korrigieren')
    ui.buttonFor('Undatiertes Hotel').props.onClick!()
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(ui.calls, [['stay-known', true], ['stay-unknown', false]])

    const kurz = reise({
      endDate: '2026-09-01',
      stages: [etappe({ departureDate: '2026-09-01' })],
      ohneTag: [
        stay({ id: 'eine', title: 'Eine Nacht', startsOn: '2026-08-30', endsOn: '2026-08-31' }),
        stay({ id: 'offen', title: 'Ohne Datum', startsOn: null, endsOn: null, position: 2 }),
      ],
    })
    const kurzText = html(kurz)
    assert.match(kurzText, /1 Nacht noch nicht als fehlend bestimmbar/)
    assert.doesNotMatch(kurzText, FEHLT)
    assert.doesNotMatch(kurzText, BEKANNT)
  })

  function unklareGebuchteZeile(fall: { id: string; title: string; startsOn: string; endsOn: string }) {
    const anzeige = zeitraumKurz(fall.startsOn, fall.endsOn)
    assert.notEqual(anzeige, 'Zeitraum noch nicht bestimmbar', fall.id)
    const trip = reise({ ohneTag: [
      stay({ id: 'stay-full', title: 'Volle Abdeckung', startsOn: '2026-08-30', endsOn: '2026-09-13' }),
      stay({ id: fall.id, title: fall.title, startsOn: fall.startsOn, endsOn: fall.endsOn, position: 2, ...gebuchteBuchung(JETZT) }),
    ] })
    const abdeckung = unterkunftAbdeckung(trip)
    assert.equal(abdeckung.luecken.length, 0, fall.id)
    assert.equal(abdeckung.zusammenfassung, 'Unterkunftsstand noch unklar', fall.id)
    assert.equal(abdeckung.aufenthalte.find(item => item.item.id === fall.id)?.status, 'unknown', fall.id)
    const text = html(trip)
    assert.match(text, /Unterkunftsstand noch unklar/, fall.id)
    assert.doesNotMatch(text, BEKANNT, fall.id)
    assert.doesNotMatch(text, FEHLT, fall.id)
    assert.doesNotMatch(text, VORLAEUFIG, fall.id)
    assert.doesNotMatch(text, /Zeitraum ergänzen|Zeitraum ändern/, fall.id)
    const volleZeile = zeile(text, 'Volle Abdeckung')
    const unklareZeile = zeile(text, fall.title)
    const falscheSpanne = new RegExp(anzeige.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    assert.match(volleZeile, /30\. Aug\./, fall.id)
    assert.doesNotMatch(volleZeile, ZEITRAUM_UNKLAR, fall.id)
    assert.doesNotMatch(unklareZeile, falscheSpanne, fall.id)
    assert.match(unklareZeile, ZEITRAUM_UNKLAR, fall.id)
    assert.match(unklareZeile, /Gebucht/, fall.id)
    assert.match(unklareZeile, /Buchung korrigieren/, fall.id)
    const ui = bedienung(trip)
    ui.buttonFor(fall.title).props.onClick!()
    assert.deepEqual(ui.calls, [[fall.id, false]])
  }

  test('gebuchte ungültige Daten bleiben in der eigenen Zeile unklar', () => {
    unklareGebuchteZeile({ id: 'stay-invalid', title: 'Ungültig gebucht', startsOn: '2026-02-29', endsOn: '2026-03-02' })
  })

  test('gebuchte umgekehrte Daten bleiben in der eigenen Zeile unklar', () => {
    unklareGebuchteZeile({ id: 'stay-reversed', title: 'Umgekehrt gebucht', startsOn: '2026-09-10', endsOn: '2026-09-01' })
  })

  test('volle datierte Abdeckung plus undatierter Aufenthalt bleibt unklar', async () => {
    const trip = reise({ ohneTag: [
      stay({ id: 'stay-full', title: 'Volle Abdeckung', startsOn: '2026-08-30', endsOn: '2026-09-13', ...gebuchteBuchung(JETZT) }),
      stay({ id: 'stay-extra', title: 'Zusatz ohne Datum', startsOn: null, endsOn: null, position: 2 }),
    ] })
    assert.equal(unterkunftAbdeckung(trip).luecken.length, 0)
    assert.equal(unterkunftAbdeckung(trip).zusammenfassung, 'Unterkunftsstand noch unklar')
    const text = html(trip)
    assert.match(text, /Unterkunftsstand noch unklar/)
    assert.doesNotMatch(text, BEKANNT)
    assert.doesNotMatch(text, FEHLT)
    assert.doesNotMatch(text, VORLAEUFIG)
    const ui = bedienung(trip)
    ui.buttonFor('Volle Abdeckung').props.onClick!()
    await new Promise(resolve => setImmediate(resolve))
    ui.buttonFor('Zusatz ohne Datum').props.onClick!()
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(ui.calls, [['stay-full', false], ['stay-extra', true]])
  })

  test('bekannte Lücken, leerer Bestand, volle Abdeckung und Aufenthalte ausserhalb bleiben bestimmt', () => {
    const teilweise = reise({ ohneTag: [stay({ id: 'stay-part', title: 'Teilhotel' })] })
    const teilweiseText = html(teilweise)
    assert.match(teilweiseText, /6 von 14 Nächten abgedeckt/)
    assert.match(teilweiseText, /8 Nächte fehlen/)
    assert.match(teilweiseText, /Noch offen/)
    assert.match(teilweiseText, /Ausgewählt/)
    assert.doesNotMatch(teilweiseText, /Unterkunftsstand noch unklar/)
    assert.doesNotMatch(teilweiseText, VORLAEUFIG)
    const teilweiseUi = bedienung(teilweise)
    teilweiseUi.buttonFor('Teilhotel').props.onClick!()
    assert.deepEqual(teilweiseUi.calls, [['stay-part', true]])

    const voll = reise({ ohneTag: [stay({
      id: 'stay-covered', title: 'Komplett', startsOn: '2026-08-30', endsOn: '2026-09-13', ...gebuchteBuchung(JETZT),
    })] })
    const vollText = html(voll)
    assert.match(vollText, /14 von 14 Nächten abgedeckt/)
    assert.match(vollText, /Gebucht/)
    assert.match(vollText, /Buchung korrigieren/)
    assert.doesNotMatch(vollText, FEHLT)
    assert.doesNotMatch(vollText, /Unterkunftsstand noch unklar/)
    const vollUi = bedienung(voll)
    vollUi.buttonFor('Komplett').props.onClick!()
    assert.deepEqual(vollUi.calls, [['stay-covered', false]])

    const leer = html(reise())
    assert.match(leer, /0 von 14 Nächten abgedeckt/)
    assert.match(leer, /14 Nächte fehlen/)
    assert.match(leer, /Noch offen/)
    assert.doesNotMatch(leer, /Unterkunftsstand noch unklar|Als gebucht markieren|Buchung korrigieren/)

    const aussen = reise({ ohneTag: [stay({
      id: 'stay-out', title: 'Anderes Hotel', startsOn: '2026-07-01', endsOn: '2026-07-08', ...gebuchteBuchung(JETZT),
    })] })
    const aussenText = html(aussen)
    assert.match(aussenText, /ausserhalb des Reisezeitraums/)
    assert.match(aussenText, /0 von 14 Nächten abgedeckt/)
    assert.match(aussenText, /14 Nächte fehlen/)
    assert.match(aussenText, /Gebucht/)
    const aussenUi = bedienung(aussen)
    aussenUi.buttonFor('Anderes Hotel').props.onClick!()
    assert.deepEqual(aussenUi.calls, [['stay-out', false]])

    const unbestimmt = reise({
      startDate: null,
      endDate: null,
      stages: [etappe({ arrivalDate: null, departureDate: null })],
      ohneTag: [stay({ id: 'stay-blank', title: 'Ohne Reisezeit', startsOn: null, endsOn: null })],
    })
    const unbestimmtText = html(unbestimmt)
    assert.match(unbestimmtText, /Unterkunftsstand noch unklar/)
    assert.doesNotMatch(unbestimmtText, BEKANNT)
    assert.doesNotMatch(unbestimmtText, FEHLT)
  })

  test('eine zurückgewiesene Buchung bleibt als Fehler sichtbar', async () => {
    const trip = reise({ ohneTag: [stay({ id: 'stay-part', title: 'Teilhotel' })] })
    const ui = bedienung(trip, 'Die Buchung konnte nicht gespeichert werden.')
    ui.buttonFor('Teilhotel').props.onClick!()
    await new Promise(resolve => setImmediate(resolve))
    const text = renderToStaticMarkup(React.createElement(React.Fragment, null, ui.render()))
    assert.match(text, /Die Buchung konnte nicht gespeichert werden/)
    assert.match(text, /role="alert"/)
    assert.deepEqual(ui.calls, [['stay-part', true]])
    assert.doesNotMatch(text, /Zahlung|bezahlt/)
  })
})
