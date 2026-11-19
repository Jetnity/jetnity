// lib/reiseaenderung/datenverlust.test.ts
//
// Synthetische 7-Tage-Reise Bangkok/Krabi. Keine echten Konten, keine Provider,
// kein Modellaufruf. Der Graph ist erfunden und nur für diesen Schutz da.

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import AenderungVorschau from '@/components/trips/AenderungVorschau'
import { operationenAnwenden } from '@/lib/reiseaenderung/anwenden'
import { bedeutung } from '@/lib/reiseaenderung/direct/bestaetigung'
import { reiseDiff, strukturVergleich } from '@/lib/reiseaenderung/diff'
import { reiseaenderungErzeugen, type Aenderungswerkzeuge } from '@/lib/reiseaenderung/erzeugen'
import { aenderungAntwort, leereOperation } from '@/lib/reiseaenderung/fixtures/antworten'
import { antwortMit } from '@/lib/reisevorschlag/fixtures/antworten'
import { rohergebnisAus } from '@/lib/modell/antwort'
import type { Modelloperation } from '@/lib/reiseaenderung/schema'
import { reiseLesen } from '@/lib/trips/schema'
import type { Reisegraph, TripDay, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-11-01T08:00:00.000Z'

function op(teil: Partial<Modelloperation> & Pick<Modelloperation, 'art'>): Modelloperation {
  return {
    etappeId: null,
    tagId: null,
    punktId: null,
    nachEtappeId: null,
    nachTagId: null,
    name: null,
    laendercode: null,
    titel: null,
    notiz: null,
    beginn: null,
    punktArt: null,
    tageDelta: null,
    tage: null,
    reisende: null,
    budgetziel: null,
    tempo: null,
    interessen: null,
    reisewunsch: null,
    abreiseort: null,
    startdatum: null,
    ...teil,
  }
}

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'title' | 'dayId' | 'kind'>): TripItem {
  return {
    stageId: null,
    note: null,
    position: 1,
    startsOn: null,
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
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

function tag(id: string, dayIndex: number, stageId: string, items: TripItem[], title: string | null = null): TripDay {
  return {
    id,
    stageId,
    dayIndex,
    dayDate: `2026-11-${String(dayIndex).padStart(2, '0')}`,
    title,
    items,
  }
}

function etappe(id: string, position: number, name: string, ankunft: string, abreise: string): TripStage {
  return {
    id,
    position,
    name,
    countryCode: 'TH',
    arrivalDate: ankunft,
    departureDate: abreise,
    latitude: name === 'Bangkok' ? 13.75 : 8.06,
    longitude: name === 'Bangkok' ? 100.5 : 98.92,
    placeId: null,
  }
}

/** Sieben erfundene Tage: drei Bangkok, vier Krabi. Zwei Personen, je zwei Staatsbürgerschaften. */
function bangkokKrabi(): Reisegraph {
  const vormittag = punkt({
    id: 'item-vormittag',
    dayId: 'day-3',
    stageId: 'stage-bkk',
    kind: 'activity',
    title: 'Freier Vormittag für Flussufer, Märkte oder Museen',
    note: 'Ohne Reservierung.',
    position: 1,
    startsOn: '2026-11-03',
    startsAt: '09:00',
  })
  const abend = punkt({
    id: 'item-abend',
    dayId: 'day-3',
    stageId: 'stage-bkk',
    kind: 'note',
    title: 'Entspannter Abend in Bangkok',
    note: 'Zeit noch offen.',
    position: 2,
    startsOn: null,
    startsAt: null,
  })
  const aufenthalt = punkt({
    id: 'item-aufenthalt',
    dayId: 'day-3',
    stageId: 'stage-bkk',
    kind: 'stay',
    title: 'Aufenthalt in Bangkok',
    note: 'Eigene Notiz, keine Buchung.',
    position: 3,
    startsOn: '2026-11-01',
    endsOn: '2026-11-04',
  })
  const transfer = punkt({
    id: 'item-transfer',
    dayId: 'day-3',
    stageId: 'stage-bkk',
    kind: 'transfer',
    title: 'Transfer zum Pier',
    note: null,
    position: 4,
    startsOn: null,
    mobilityMode: 'ferry',
    originName: 'Bangkok',
    destinationName: 'Pier',
  })
  const nacht = punkt({
    id: 'item-nacht',
    dayId: 'day-3',
    stageId: 'stage-bkk',
    kind: 'stay',
    title: 'Nacht in Bangkok',
    note: 'Noch nicht gebucht.',
    position: 5,
    startsOn: '2026-11-02',
    endsOn: '2026-11-03',
  })
  const schnorcheln = punkt({
    id: 'item-schnorcheln',
    dayId: 'day-5',
    stageId: 'stage-kb',
    kind: 'activity',
    title: 'Schnorcheln',
    position: 1,
    startsOn: '2026-11-05',
    startsAt: '10:00',
  })
  const strandhaus = punkt({
    id: 'item-strandhaus',
    dayId: 'day-4',
    stageId: 'stage-kb',
    kind: 'stay',
    title: 'Strandhaus Krabi',
    note: 'Bestätigt im Testgraphen.',
    position: 1,
    startsOn: '2026-11-04',
    endsOn: '2026-11-08',
    priceAmount: 420,
    priceCurrency: 'CHF',
    provider: 'test-hotel',
    externalRef: 'stay-synthetic-1',
    bookingUrl: 'https://example.com/strandhaus',
    bookingStatus: 'booked',
    bookingSource: 'user',
    bookingConfirmedAt: '2026-10-01T10:00:00.000Z',
  })
  const letzteNotiz = punkt({
    id: 'item-letzte',
    dayId: 'day-7',
    stageId: 'stage-kb',
    kind: 'note',
    title: 'Offener letzter Tag',
    position: 1,
  })
  const offen = punkt({
    id: 'item-offen',
    dayId: null,
    stageId: null,
    kind: 'note',
    title: 'Schon ungeplante Idee',
    position: 1,
  })

  const roh: Reisegraph = {
    id: 'trip-bangkok-krabi',
    clientRef: 'trip-bangkok-krabi',
    title: 'Thailand – Bangkok und Strand',
    origin: 'Zürich',
    originPlaceId: null,
    startDate: '2026-11-01',
    endDate: '2026-11-07',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: ['culture'],
    travelWish: null,
    revision: 4,
    lastMutationId: null,
    stages: [
      etappe('stage-bkk', 1, 'Bangkok', '2026-11-01', '2026-11-03'),
      etappe('stage-kb', 2, 'Krabi', '2026-11-04', '2026-11-07'),
    ],
    days: [
      tag('day-1', 1, 'stage-bkk', []),
      tag('day-2', 2, 'stage-bkk', []),
      tag('day-3', 3, 'stage-bkk', [vormittag, abend, aufenthalt, transfer, nacht], 'Bangkok'),
      tag('day-4', 4, 'stage-kb', [strandhaus]),
      tag('day-5', 5, 'stage-kb', [schnorcheln]),
      tag('day-6', 6, 'stage-kb', []),
      tag('day-7', 7, 'stage-kb', [letzteNotiz]),
    ],
    ohneTag: [offen],
    party: [
      {
        id: 'traveller-1',
        clientRef: 'traveller-1',
        label: 'Reisende 1',
        residenceCountryCode: 'CH',
        citizenships: [
          { id: 'cit-ch', clientRef: 'cit-ch', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
          { id: 'cit-de', clientRef: 'cit-de', countryCode: 'DE', createdAt: JETZT, updatedAt: JETZT },
        ],
        documents: [
          {
            id: 'doc-1',
            clientRef: 'doc-1',
            documentType: 'passport',
            issuingCountryCode: 'CH',
            citizenshipClientRef: 'cit-ch',
            expiresOn: null,
            createdAt: JETZT,
            updatedAt: JETZT,
          },
        ],
        createdAt: JETZT,
        updatedAt: JETZT,
      },
      {
        id: 'traveller-2',
        clientRef: 'traveller-2',
        label: 'Reisende 2',
        residenceCountryCode: 'TH',
        citizenships: [
          { id: 'cit-th', clientRef: 'cit-th', countryCode: 'TH', createdAt: JETZT, updatedAt: JETZT },
          { id: 'cit-gb', clientRef: 'cit-gb', countryCode: 'GB', createdAt: JETZT, updatedAt: JETZT },
        ],
        documents: [],
        createdAt: JETZT,
        updatedAt: JETZT,
      },
    ],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
  const gelesen = reiseLesen(roh)
  if (!gelesen) throw new Error('Die synthetische Bangkok/Krabi-Reise ist kein gültiger Graph.')
  return gelesen
}

function ids(reise: Reisegraph): string[] {
  return [...reise.days.flatMap((tag) => tag.items), ...reise.ohneTag].map((punkt) => punkt.id).sort()
}

function finden(reise: Reisegraph, id: string): TripItem | undefined {
  return [...reise.days.flatMap((tag) => tag.items), ...reise.ohneTag].find((punkt) => punkt.id === id)
}

function inhalt(punkt: TripItem) {
  const { dayId: _day, stageId: _stage, ...rest } = punkt
  void _day
  void _stage
  return rest
}

function anwenden(operationen: Modelloperation[], basis = bangkokKrabi()) {
  return operationenAnwenden(basis, operationen, (prefix) => `${prefix}-neu`)
}

const NACHTWECHSEL = [
  op({ art: 'etappe_dauer', etappeId: 'stage-bkk', tageDelta: -1 }),
  op({ art: 'etappe_dauer', etappeId: 'stage-kb', tageDelta: 1 }),
]

const BETROFFEN = ['item-vormittag', 'item-abend', 'item-aufenthalt', 'item-transfer', 'item-nacht']

describe('Strukturelle KI-Änderung behält Planpunkte', () => {
  test('eine Nacht weniger in Bangkok und eine mehr in Krabi löscht keine Punkt-IDs', () => {
    const basis = bangkokKrabi()
    const vorher = structuredClone(basis)
    const ergebnis = anwenden(NACHTWECHSEL, basis)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(basis, vorher)
    assert.deepEqual(ids(ergebnis.reise), ids(basis))
    assert.equal(new Set(ids(ergebnis.reise)).size, ids(ergebnis.reise).length)
    assert.equal(ergebnis.reise.days.length, 7)
    assert.equal(ergebnis.reise.days.filter((tag) => tag.stageId === 'stage-bkk').length, 2)
    assert.equal(ergebnis.reise.days.filter((tag) => tag.stageId === 'stage-kb').length, 5)
    assert.equal(ergebnis.reise.days.some((tag) => tag.id === 'day-3'), false)
    const neu = ergebnis.reise.days.find((tag) => !basis.days.some((alt) => alt.id === tag.id))
    assert.ok(neu)
    assert.deepEqual(neu.items, [])
    for (const id of BETROFFEN) {
      const alt = finden(basis, id)
      const neuPunkt = finden(ergebnis.reise, id)
      assert.ok(alt && neuPunkt)
      assert.equal(neuPunkt.dayId, null)
      assert.equal(neuPunkt.stageId, null)
      assert.deepEqual(inhalt(neuPunkt), inhalt(alt))
    }
    const strand = finden(ergebnis.reise, 'item-strandhaus')
    assert.equal(strand?.dayId, 'day-4')
    assert.equal(strand?.provider, 'test-hotel')
    assert.equal(strand?.priceAmount, 420)
    assert.equal(strand?.bookingStatus, 'booked')
    assert.equal(strand?.bookingConfirmedAt, '2026-10-01T10:00:00.000Z')
    assert.equal(strand?.startsOn, '2026-11-04')
    assert.equal(strand?.endsOn, '2026-11-08')
    const schnorcheln = finden(ergebnis.reise, 'item-schnorcheln')
    assert.equal(schnorcheln?.dayId, 'day-5')
    assert.equal(schnorcheln?.startsOn, '2026-11-05')
    assert.equal(finden(ergebnis.reise, 'item-offen')?.dayId, null)
    assert.deepEqual(ergebnis.reise.party, basis.party)
    assert.equal(ergebnis.reise.travellers, 2)
    const stayIds = ids(ergebnis.reise).filter((id) => finden(ergebnis.reise, id)?.kind === 'stay')
    assert.deepEqual(stayIds, ['item-aufenthalt', 'item-nacht', 'item-strandhaus'])
  })

  for (const [name, operation] of [
    ['tag_entfernen', op({ art: 'tag_entfernen', tagId: 'day-3' })],
    ['dauer_aendern', op({ art: 'dauer_aendern', tageDelta: -1 })],
    ['etappe_entfernen', op({ art: 'etappe_entfernen', etappeId: 'stage-bkk' })],
  ] as const) {
    test(`${name} behält jede ursprüngliche Punkt-ID`, () => {
      const basis = bangkokKrabi()
      const ergebnis = anwenden([operation], basis)
      assert.equal(ergebnis.ok, true)
      if (!ergebnis.ok) return
      assert.deepEqual(ids(ergebnis.reise), ids(basis))
    })
  }

  test('ein zweiter struktureller Schritt im selben Batch löscht ebenfalls nichts', () => {
    const basis = bangkokKrabi()
    const ergebnis = anwenden([
      ...NACHTWECHSEL,
      op({ art: 'tag_entfernen', tagId: 'day-2' }),
    ], basis)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(ids(ergebnis.reise), ids(basis))
    assert.equal(finden(ergebnis.reise, 'item-vormittag')?.dayId, null)
  })

  test('offene Daten bleiben offen und werden nicht zu einer Hotelnacht', () => {
    const basis = bangkokKrabi()
    basis.startDate = null
    basis.endDate = null
    for (const tag of basis.days) tag.dayDate = null
    for (const etappe of basis.stages) {
      etappe.arrivalDate = null
      etappe.departureDate = null
    }
    const ergebnis = anwenden([op({ art: 'etappe_dauer', etappeId: 'stage-bkk', tageDelta: -1 })], basis)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const abend = finden(ergebnis.reise, 'item-abend')
    assert.equal(abend?.startsOn, null)
    assert.equal(abend?.startsAt, null)
    assert.equal(abend?.dayId, null)
    assert.equal(ergebnis.reise.days.every((tag) => tag.dayDate === null), true)
    assert.deepEqual(ids(ergebnis.reise), ids(basis))
  })

  test('nur der Titel ändert keine Punkte', () => {
    const basis = bangkokKrabi()
    const ergebnis = anwenden([op({ art: 'stammdaten', titel: 'Thailand – Bangkok und Strand (KI-Test)' })], basis)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.title, 'Thailand – Bangkok und Strand (KI-Test)')
    assert.deepEqual(ids(ergebnis.reise), ids(basis))
    assert.equal(finden(ergebnis.reise, 'item-vormittag')?.dayId, 'day-3')
    const texte = reiseDiff(basis, ergebnis.reise).map((eintrag) => eintrag.text)
    assert.deepEqual(texte, ['Titel: „Thailand – Bangkok und Strand“ → „Thailand – Bangkok und Strand (KI-Test)“'])
  })

  test('punkt_entfernen neben einer Kürzung wird vor dem Apply abgelehnt', () => {
    const basis = bangkokKrabi()
    const vorher = structuredClone(basis)
    const ergebnis = anwenden([
      ...NACHTWECHSEL,
      op({ art: 'punkt_entfernen', punktId: 'item-vormittag' }),
    ], basis)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler.code, 'ungueltig')
    assert.match(ergebnis.fehler.meldung, /nicht übernommen/)
    assert.deepEqual(basis, vorher)
  })

  test('ein ausdrücklich einzelner punkt_entfernen bleibt für nichtkommerzielle Punkte möglich', () => {
    const ergebnis = anwenden([op({ art: 'punkt_entfernen', punktId: 'item-abend' })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(finden(ergebnis.reise, 'item-abend'), undefined)
    assert.ok(finden(ergebnis.reise, 'item-vormittag'))
  })

  test('Readback und Bedeutung behalten die verschobenen IDs', () => {
    const basis = bangkokKrabi()
    const ergebnis = anwenden(NACHTWECHSEL, basis)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const gespeichert = reiseLesen({
      ...ergebnis.reise,
      revision: basis.revision + 1,
      lastMutationId: 'mut-nacht',
      updatedAt: '2026-11-19T00:00:00.000Z',
    })
    assert.ok(gespeichert)
    const gelesen = reiseLesen(JSON.parse(JSON.stringify(gespeichert)))
    assert.ok(gelesen)
    assert.deepEqual(ids(gelesen), ids(basis))
    const spur = bedeutung(gelesen)
    for (const id of ids(basis)) assert.equal(spur.includes(id), true)
  })
})

describe('Die Vorschau zählt Reisetage und keine erfundenen Nächte', () => {
  test('ungeplante Punkte stehen getrennt von echten Löschungen', () => {
    const basis = bangkokKrabi()
    const ergebnis = anwenden(NACHTWECHSEL, basis)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const texte = reiseDiff(basis, ergebnis.reise).map((eintrag) => eintrag.text)
    for (const titel of [
      'Freier Vormittag für Flussufer, Märkte oder Museen',
      'Entspannter Abend in Bangkok',
      'Aufenthalt in Bangkok',
      'Nacht in Bangkok',
    ]) {
      assert.equal(texte.some((text) => text.startsWith('Entfernt: ' + titel)), false)
      assert.equal(texte.some((text) => text.includes('Ungeplant, nicht gelöscht: ' + titel)), true)
    }
    assert.equal(texte.some((text) => /\d+\s+Nächte/.test(text)), false)
    const plan = strukturVergleich(basis, ergebnis.reise)
    assert.equal(plan.tageVorher, 7)
    assert.equal(plan.tageNachher, 7)
    assert.equal(plan.entfernt.length, 0)
    assert.equal(plan.ungeplant.length, BETROFFEN.length)
    const bangkok = plan.etappen.find((etappe) => etappe.name === 'Bangkok')
    const krabi = plan.etappen.find((etappe) => etappe.name === 'Krabi')
    assert.ok(bangkok && krabi)
    assert.match(bangkok.vorher, /Tag 3/)
    assert.doesNotMatch(bangkok.nachher, /Tag 3 ·/)
    assert.match(krabi.nachher, /zugeordneten Reisetage|Tag /)
    assert.equal(plan.strukturell, true)
  })

  test('die Oberfläche nennt die Folgen aus dem Graphen und bricht Zeilen um', () => {
    const basis = bangkokKrabi()
    const ergebnis = anwenden(NACHTWECHSEL, basis)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const html = renderToStaticMarkup(createElement(AenderungVorschau, {
      vorschau: {
        aenderung: {
          fassung: 1,
          zusammenfassung: 'Bangkok um eine Nacht verkürzt und Krabi um eine Nacht verlängert.',
          annahmen: [],
          warnungen: [],
          operationen: NACHTWECHSEL,
        },
        vorher: basis,
        nachher: ergebnis.reise,
        diff: reiseDiff(basis, ergebnis.reise),
        mutationId: 'mut-nacht',
        basisRevision: basis.revision,
      },
      laeuft: false,
      onUebernehmen: () => undefined,
      onVerwerfen: () => undefined,
    }))
    assert.match(html, /Reiseplan vorher und nachher/)
    assert.match(html, /keine Nachtzahl/)
    assert.match(html, /Ungeplant, nicht gelöscht/)
    assert.match(html, /Bangkok/)
    assert.match(html, /Krabi/)
    assert.match(html, /break-words/)
    assert.doesNotMatch(html, /whitespace-nowrap/)
    assert.doesNotMatch(html, /\d+\s+Nächte/)
    assert.match(html, /Änderung übernehmen/)
    assert.doesNotMatch(html, /Löschung übernehmen/)
  })
})

describe('Der Modellantwort-Pfad erzeugt keine Löschvorschau', () => {
  test('Kürzung plus punkt_entfernen bleibt ohne zweiten Modellaufruf erfolglos', async () => {
    let aufrufe = 0
    const werkzeuge: Aenderungswerkzeuge = {
      zustand: { aktiv: true, modell: 'gpt-5.6-terra', aufwand: 'low' },
      beanspruchen: async () => ({ ok: true, id: 'nutzung-1' }),
      abschliessen: async () => undefined,
      aufrufen: async () => {
        aufrufe += 1
        return {
          ...rohergebnisAus(200, antwortMit(aenderungAntwort([
            leereOperation('etappe_dauer', { etappeId: 'stage-bkk', tageDelta: -1 }),
            leereOperation('punkt_entfernen', { punktId: 'item-vormittag' }),
          ]))),
          laufzeitMs: 20,
        }
      },
      heute: '2026-11-19',
      kennung: (prefix) => `${prefix}-neu`,
      mutationId: 'mut-1',
    }
    const ergebnis = await reiseaenderungErzeugen('Eine Nacht weniger in Bangkok.', bangkokKrabi(), werkzeuge)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.klasse, 'schema')
    assert.match(ergebnis.meldung, /nicht übernommen/)
    assert.equal(aufrufe, 1)
  })
})
