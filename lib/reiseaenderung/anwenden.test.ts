// lib/reiseaenderung/anwenden.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { operationenAnwenden } from '@/lib/reiseaenderung/anwenden'
import type { Modelloperation } from '@/lib/reiseaenderung/schema'
import type { Reisegraph, TripDay, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-08-20T08:00:00.000Z'

function kennung() {
  let n = 0
  return (prefix: string) => `${prefix}-neu-${++n}`
}

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'title'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
    kind: 'activity',
    note: null,
    position: 1,
    startsOn: '2026-09-12',
    startsAt: '09:00',
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

function tag(teil: Partial<TripDay> & Pick<TripDay, 'id' | 'dayIndex'>): TripDay {
  return {
    stageId: 'stage-1',
    dayDate: `2026-09-${11 + teil.dayIndex}`,
    title: null,
    items: [],
    ...teil,
  }
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'position' | 'name'>): TripStage {
  return {
    countryCode: 'IT',
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function reise(abweichung: Partial<Reisegraph> = {}): Reisegraph {
  const stage1 = etappe({
    id: 'stage-1',
    position: 1,
    name: 'Florenz',
    arrivalDate: '2026-09-12',
    departureDate: '2026-09-14',
  })
  const stage2 = etappe({
    id: 'stage-2',
    position: 2,
    name: 'Rom',
    arrivalDate: '2026-09-15',
    departureDate: '2026-09-16',
    countryCode: 'IT',
  })
  const tage: TripDay[] = [
    tag({
      id: 'day-1',
      dayIndex: 1,
      stageId: 'stage-1',
      title: 'Anreise',
      items: [
        punkt({
          id: 'item-1',
          title: 'Dom',
          priceAmount: 18,
          priceCurrency: 'EUR',
          provider: 'getyourguide',
          externalRef: 'gyg-1',
          bookingUrl: 'https://example.com/dom',
          bookingStatus: 'unconfirmed',
          bookingSource: null,
          bookingConfirmedAt: null,
        }),
      ],
    }),
    tag({ id: 'day-2', dayIndex: 2, stageId: 'stage-1', items: [punkt({ id: 'item-2', title: 'Uffizien', dayId: 'day-2' })] }),
    tag({ id: 'day-3', dayIndex: 3, stageId: 'stage-1', items: [] }),
    tag({
      id: 'day-4',
      dayIndex: 4,
      stageId: 'stage-2',
      items: [punkt({ id: 'item-3', title: 'Kolosseum', dayId: 'day-4', stageId: 'stage-2' })],
    }),
    tag({ id: 'day-5', dayIndex: 5, stageId: 'stage-2', items: [] }),
  ]

  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Italien',
    origin: 'Zürich',
    originPlaceId: null,
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4000,
    status: 'draft',
    pace: 'balanced',
    interests: ['culture'],
    travelWish: 'Erst Florenz, dann Rom.',
    revision: 3,
    lastMutationId: null,
    stages: [stage1, stage2],
    days: tage,
    createdAt: JETZT,
    updatedAt: JETZT,
    ohneTag: [],
    ...abweichung,
  }
}

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

function anwenden(operationen: Modelloperation[], basis = reise()) {
  return operationenAnwenden(basis, operationen, kennung())
}

function offeneReise(zugeordneteTage = 0): Reisegraph {
  return reise({
    dayStageAssignmentMode: zugeordneteTage > 0 ? 'explicit' : 'unassigned',
    endDate: '2026-09-17',
    stages: [
      etappe({ id: 'stage-1', position: 1, name: 'Florenz', placeId: 'geonames:3176959', latitude: 43.77, longitude: 11.25 }),
      etappe({ id: 'stage-2', position: 2, name: 'Rom', placeId: 'geonames:3169070', latitude: 41.89, longitude: 12.51 }),
    ],
    days: Array.from({ length: 6 }, (_, i) => tag({
      id: `day-${i + 1}`, dayIndex: i + 1,
      stageId: i < zugeordneteTage ? 'stage-1' : null,
    })),
  })
}

describe('Bewusst offene Tageszuordnung', () => {
  for (const zugeordnet of [0, 2]) {
    test(`Kürzen erhält vorher taglose Ziele bei ${zugeordnet} zugeordneten Tagen`, () => {
      const basis = offeneReise(zugeordnet), original = structuredClone(basis)
      const ergebnis = anwenden([op({ art: 'dauer_aendern', tageDelta: -1 })], basis)
      assert(ergebnis.ok)
      assert.equal(ergebnis.reise.days.length, 5)
      assert.deepEqual(ergebnis.reise.stages[1], basis.stages[1])
      assert.deepEqual(ergebnis.reise.stages.map(s => s.id), ['stage-1', 'stage-2'])
      assert.deepEqual(ergebnis.reise.days.map(d => d.stageId), basis.days.slice(0, 5).map(d => d.stageId))
      assert.deepEqual(basis, original)
    })
  }

  test('Entfernen eines unzugeordneten Tages behält alle Ziele und Ortsdaten', () => {
    const basis = offeneReise()
    const ergebnis = anwenden([op({ art: 'tag_entfernen', tagId: 'day-3' })], basis)
    assert(ergebnis.ok)
    assert.deepEqual(ergebnis.reise.stages, basis.stages)
    assert.equal(ergebnis.reise.days.length, 5)
    assert(ergebnis.reise.days.every(d => d.stageId === null))
  })

  for (const operation of [op({ art: 'dauer_aendern', tageDelta: -1 }), op({ art: 'tag_entfernen', tagId: 'day-6' })]) {
    test(`${operation.art} entfernt nur die tatsächlich leer gewordene Etappe`, () => {
      const basis = offeneReise(5)
      basis.days[5]!.stageId = 'stage-2'
      const offen = etappe({ id: 'stage-3', position: 3, name: 'Florenz', placeId: 'geonames:3176959' })
      basis.stages.push(offen)
      const ergebnis = anwenden([operation], basis)
      assert(ergebnis.ok)
      assert.deepEqual(ergebnis.reise.stages.map(s => s.id), ['stage-1', 'stage-3'])
      assert.deepEqual(ergebnis.reise.stages[1], { ...offen, position: 2 })
    })
  }

  test('ausdrückliches Entfernen einer taglosen Etappe bleibt möglich', () => {
    const ergebnis = anwenden([op({ art: 'etappe_entfernen', etappeId: 'stage-2' })], offeneReise())
    assert(ergebnis.ok)
    assert.deepEqual(ergebnis.reise.stages.map(s => s.id), ['stage-1'])
    assert.equal(ergebnis.reise.days.length, 6)
  })

  test('Kürzen bis vor alle zugeordneten Tage erhält die gesamte Zielliste', () => {
    const basis = offeneReise()
    basis.dayStageAssignmentMode = 'explicit'
    basis.days[4]!.stageId = 'stage-1'
    basis.days[5]!.stageId = 'stage-2'
    const ergebnis = anwenden([op({ art: 'dauer_aendern', tageDelta: -2 })], basis)
    assert(ergebnis.ok)
    assert.equal(ergebnis.reise.days.length, 4)
    assert.deepEqual(ergebnis.reise.stages, basis.stages)
    assert(ergebnis.reise.days.every(d => d.stageId === null))
  })

  test('Betroffenheit wird nach einer vorherigen Operation im selben Batch bestimmt', () => {
    const basis = offeneReise()
    const ergebnis = anwenden([
      op({ art: 'etappe_hinzufuegen', name: 'Venedig', tage: 1 }),
      op({ art: 'dauer_aendern', tageDelta: -1 }),
    ], basis)
    assert(ergebnis.ok)
    assert.deepEqual(ergebnis.reise.stages, basis.stages)
    assert.deepEqual(ergebnis.reise.days, basis.days)
  })

  for (const zugeordnet of [0, 2]) {
    test(`Verlängern erfindet keine Zuordnung nach ${zugeordnet} zugeordneten Tagen und offenem Ende`, () => {
      const basis = offeneReise(zugeordnet)
      const ergebnis = anwenden([op({ art: 'dauer_aendern', tageDelta: 2 })], basis)
      assert(ergebnis.ok)
      assert.equal(ergebnis.reise.days.length, 8)
      assert.deepEqual(ergebnis.reise.days.map(d => d.stageId), [...basis.days.map(d => d.stageId), null, null])
      assert.equal(ergebnis.reise.dayStageAssignmentMode, basis.dayStageAssignmentMode)
    })
  }

  for (const nachTagId of [null, 'day-3']) {
    test(`Einfügen ${nachTagId ?? 'am Ende'} lässt einen offenen Abschnitt unzugeordnet`, () => {
      const basis = offeneReise(2)
      const ergebnis = anwenden([op({ art: 'tag_hinzufuegen', nachTagId })], basis)
      assert(ergebnis.ok)
      assert.equal(ergebnis.reise.days.find(d => !basis.days.some(alt => alt.id === d.id))?.stageId, null)
      assert.equal(ergebnis.reise.days.filter(d => d.stageId === 'stage-1').length, 2)
    })
  }

  test('eine vorhandene Zuordnung setzt sich fort, ohne zur letzten Reiseetappe zu wechseln', () => {
    const basis = offeneReise(6)
    const ergebnis = anwenden([op({ art: 'dauer_aendern', tageDelta: 1 })], basis)
    assert(ergebnis.ok)
    assert.equal(ergebnis.reise.days.at(-1)?.stageId, 'stage-1')
  })

  for (const operation of [op({ art: 'etappe_dauer', etappeId: 'stage-2', tageDelta: 1 }), op({ art: 'tag_hinzufuegen', etappeId: 'stage-2', nachTagId: 'day-3' })]) {
    test(`${operation.art} mit ausdrücklicher Etappe ordnet nur den neuen Tag zu`, () => {
      const basis = offeneReise()
      const ergebnis = anwenden([operation], basis)
      assert(ergebnis.ok)
      assert.equal(ergebnis.reise.days.find(d => !basis.days.some(alt => alt.id === d.id))?.stageId, 'stage-2')
      assert.equal(ergebnis.reise.days.filter(d => d.stageId === null).length, 6)
    })
  }

  test('Einzelziel und historischer Mehrzielbestand behalten ihren Zuordnungsvertrag', () => {
    const einzel = offeneReise()
    einzel.stages = [einzel.stages[0]!]
    einzel.dayStageAssignmentMode = 'single_destination'
    const alt = offeneReise()
    alt.dayStageAssignmentMode = 'legacy_fallback'
    for (const basis of [einzel, alt]) {
      const ergebnis = anwenden([op({ art: 'dauer_aendern', tageDelta: 1 })], basis)
      assert(ergebnis.ok)
      assert(ergebnis.reise.days.every(d => d.stageId !== null))
      assert.equal(ergebnis.reise.days.at(-1)?.stageId, basis.stages.at(-1)?.id)
    }
  })

  test('ein veralteter Einzelziel-Mode verteilt keine offenen Tage auf mehrere Ziele', () => {
    const basis = offeneReise()
    basis.dayStageAssignmentMode = 'single_destination'
    const ergebnis = anwenden([op({ art: 'dauer_aendern', tageDelta: 1 })], basis)
    assert(ergebnis.ok)
    assert(ergebnis.reise.days.every(d => d.stageId === null))
  })
})

describe('Stammdaten', () => {
  test('eine neue Abreise verliert die alte Place-ID', () => {
    const basis = reise()
    basis.originPlaceId = 'geonames:2657896'
    const ergebnis = anwenden([op({ art: 'stammdaten', abreiseort: 'Basel' })], basis)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.origin, 'Basel')
    assert.equal(ergebnis.reise.originPlaceId, null)
  })

  test('Reisende, Budget und Tempo', () => {
    const ergebnis = anwenden([
      op({ art: 'stammdaten', reisende: 3, budgetziel: 3000, tempo: 'calm' }),
    ])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.travellers, 3)
    assert.equal(ergebnis.reise.budgetAmount, 3000)
    assert.equal(ergebnis.reise.pace, 'calm')
    assert.equal(ergebnis.reise.days.length, 5)
  })

  test('ein neues Startdatum verschiebt den ganzen Zeitraum', () => {
    const ergebnis = anwenden([op({ art: 'stammdaten', startdatum: '2026-10-01' })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.startDate, '2026-10-01')
    assert.equal(ergebnis.reise.endDate, '2026-10-05')
    assert.equal(ergebnis.reise.days[0]?.dayDate, '2026-10-01')
  })
})

describe('Datumsverschiebung und Dauer', () => {
  test('zeitraum_verschieben hält die Struktur', () => {
    const ergebnis = anwenden([op({ art: 'zeitraum_verschieben', tageDelta: 7 })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.startDate, '2026-09-19')
    assert.equal(ergebnis.reise.endDate, '2026-09-23')
    assert.equal(ergebnis.reise.days.length, 5)
    assert.equal(ergebnis.reise.stages[0]?.arrivalDate, '2026-09-19')
  })

  test('zwei Tage länger hängt Tage an die letzte Etappe', () => {
    const ergebnis = anwenden([op({ art: 'dauer_aendern', tageDelta: 2 })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.days.length, 7)
    assert.equal(ergebnis.reise.endDate, '2026-09-18')
    assert.equal(ergebnis.reise.days[6]?.stageId, 'stage-2')
  })

  test('zwei Tage kürzer nimmt die letzten Tage', () => {
    const ergebnis = anwenden([op({ art: 'dauer_aendern', tageDelta: -2 })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.days.length, 3)
    assert.equal(ergebnis.reise.endDate, '2026-09-14')
    assert.equal(ergebnis.reise.stages.some((etappe) => etappe.id === 'stage-2'), false)
  })
})

describe('Etappen', () => {
  test('Los Angeles entfernen – analog Rom', () => {
    const ergebnis = anwenden([op({ art: 'etappe_entfernen', etappeId: 'stage-2' })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(
      ergebnis.reise.stages.map((etappe) => etappe.name),
      ['Florenz'],
    )
    assert.equal(ergebnis.reise.days.length, 3)
    assert.equal(ergebnis.reise.days.every((tag) => tag.stageId === 'stage-1'), true)
  })

  test('nach Florenz zwei Tage am Meer', () => {
    const ergebnis = anwenden([
      op({
        art: 'etappe_hinzufuegen',
        nachEtappeId: 'stage-1',
        name: 'Toskana-Küste',
        laendercode: 'IT',
        tage: 2,
      }),
    ])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(
      ergebnis.reise.stages.map((etappe) => etappe.name),
      ['Florenz', 'Toskana-Küste', 'Rom'],
    )
    assert.equal(ergebnis.reise.days.length, 7)
    const kueste = ergebnis.reise.stages.find((etappe) => etappe.name === 'Toskana-Küste')
    assert.ok(kueste)
    assert.equal(ergebnis.reise.days.filter((tag) => tag.stageId === kueste.id).length, 2)
  })

  test('Florenz einen Tag kürzer', () => {
    const ergebnis = anwenden([op({ art: 'etappe_dauer', etappeId: 'stage-1', tageDelta: -1 })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.days.filter((tag) => tag.stageId === 'stage-1').length, 2)
    assert.equal(ergebnis.reise.days.length, 4)
  })

  test('die letzte Etappe lässt sich nicht entfernen', () => {
    const eine = reise({
      stages: [etappe({ id: 'stage-1', position: 1, name: 'Florenz' })],
      days: [tag({ id: 'day-1', dayIndex: 1, items: [] })],
    })
    const ergebnis = anwenden([op({ art: 'etappe_entfernen', etappeId: 'stage-1' })], eine)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler.code, 'ungueltig')
  })
})

describe('Tage und Planpunkte', () => {
  test('einen Tag entfernen und einen hinzufügen', () => {
    const ergebnis = anwenden([
      op({ art: 'tag_entfernen', tagId: 'day-3' }),
      op({ art: 'tag_hinzufuegen', nachTagId: 'day-1', titel: 'Ruhetag' }),
    ])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.days.length, 5)
    assert.equal(ergebnis.reise.days[1]?.title, 'Ruhetag')
  })

  test('Punktlöschung neben einer Neuanlage wird ohne Seiteneffekte abgelehnt', () => {
    const basis = reise()
    const vorher = structuredClone(basis)
    const ergebnis = anwenden([
      op({ art: 'punkt_entfernen', punktId: 'item-2' }),
      op({
        art: 'punkt_hinzufuegen',
        tagId: 'day-2',
        titel: 'Spaziergang am Arno',
        punktArt: 'activity',
        beginn: '17:00',
      }),
    ], basis)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler.code, 'ungueltig')
    assert.match(ergebnis.fehler.meldung, /nicht übernommen/)
    assert.deepEqual(basis, vorher)
  })

  test('Planpunkt ohne Löschung weiterhin anlegen', () => {
    const ergebnis = anwenden([
      op({
        art: 'punkt_hinzufuegen',
        tagId: 'day-2',
        titel: 'Spaziergang am Arno',
        punktArt: 'activity',
        beginn: '17:00',
      }),
    ])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const tag2 = ergebnis.reise.days.find((tag) => tag.id === 'day-2')
    assert.equal(tag2?.items.some((punkt) => punkt.title === 'Uffizien'), true)
    assert.equal(tag2?.items.some((punkt) => punkt.title === 'Spaziergang am Arno'), true)
  })

  test('ein nicht-kommerzieller Planpunkt kann auf einen anderen Tag wandern', () => {
    const ergebnis = anwenden([op({ art: 'punkt_anpassen', punktId: 'item-2', tagId: 'day-3' })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const tag2 = ergebnis.reise.days.find((tag) => tag.id === 'day-2')
    const tag3 = ergebnis.reise.days.find((tag) => tag.id === 'day-3')
    assert.equal(tag2?.items.some((punkt) => punkt.id === 'item-2'), false)
    const verschoben = tag3?.items.find((punkt) => punkt.id === 'item-2')
    assert.equal(verschoben?.title, 'Uffizien')
    assert.equal(verschoben?.dayId, 'day-3')
  })
})

describe('Geschützte kommerzielle Felder', () => {
  test('unveränderte Punkte behalten Preis und Anbieter', () => {
    const ergebnis = anwenden([op({ art: 'stammdaten', reisende: 3 })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const dom = ergebnis.reise.days[0]?.items[0]
    assert.equal(dom?.priceAmount, 18)
    assert.equal(dom?.priceCurrency, 'EUR')
    assert.equal(dom?.provider, 'getyourguide')
    assert.equal(dom?.externalRef, 'gyg-1')
    assert.equal(dom?.bookingUrl, 'https://example.com/dom')
  })

  test('punkt_anpassen ändert einen kommerziellen Punkt nicht', () => {
    const ergebnis = anwenden([
      op({
        art: 'punkt_anpassen',
        punktId: 'item-1',
        titel: 'Dom von Florenz',
        notiz: 'neu',
        punktArt: 'note',
        beginn: '18:00',
        tagId: 'day-2',
      }),
    ])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const dom = ergebnis.reise.days[0]?.items.find((punkt) => punkt.id === 'item-1')
    assert.equal(dom?.title, 'Dom')
    assert.equal(dom?.kind, 'activity')
    assert.equal(dom?.note, null)
    assert.equal(dom?.startsAt, '09:00')
    assert.equal(dom?.startsOn, '2026-09-12')
    assert.equal(dom?.dayId, 'day-1')
    assert.equal(dom?.stageId, 'stage-1')
    assert.equal(dom?.priceAmount, 18)
    assert.equal(dom?.provider, 'getyourguide')
    assert.equal(ergebnis.reise.days[1]?.items.some((punkt) => punkt.id === 'item-1'), false)
  })

  test('zeitraum_verschieben lässt Termine eines kommerziellen Punkts stehen', () => {
    const ergebnis = anwenden([op({ art: 'zeitraum_verschieben', tageDelta: 7 })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const dom = ergebnis.reise.days[0]?.items.find((punkt) => punkt.id === 'item-1')
    assert.equal(ergebnis.reise.days[0]?.dayDate, '2026-09-19')
    assert.equal(dom?.startsOn, '2026-09-12')
    assert.equal(dom?.startsAt, '09:00')
    assert.equal(dom?.endsOn, null)
    assert.equal(dom?.dayId, 'day-1')
    assert.equal(dom?.title, 'Dom')
  })

  test('ein neues Startdatum verschiebt den kommerziellen Termin nicht', () => {
    const ergebnis = anwenden([op({ art: 'stammdaten', startdatum: '2026-10-01' })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const dom = ergebnis.reise.days[0]?.items.find((punkt) => punkt.id === 'item-1')
    assert.equal(ergebnis.reise.startDate, '2026-10-01')
    assert.equal(dom?.startsOn, '2026-09-12')
    assert.equal(dom?.dayId, 'day-1')
  })

  test('neue Punkte haben keine Handelsfelder', () => {
    const echt = anwenden([op({ art: 'punkt_hinzufuegen', tagId: 'day-2', titel: 'Gelato', punktArt: 'note' })])
    assert.equal(echt.ok, true)
    if (!echt.ok) return
    const neu = echt.reise.days[1]?.items.find((punkt) => punkt.title === 'Gelato')
    assert.equal(neu?.priceAmount, null)
    assert.equal(neu?.provider, null)
    assert.equal(neu?.bookingUrl, null)
  })

  test('eine allgemeine Umplanung lässt den kommerziellen Punkt stehen', () => {
    const ergebnis = anwenden([op({ art: 'stammdaten', tempo: 'calm' })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const dom = ergebnis.reise.days[0]?.items.find((punkt) => punkt.id === 'item-1')
    assert.equal(dom?.title, 'Dom')
    assert.equal(dom?.provider, 'getyourguide')
    assert.equal(dom?.priceAmount, 18)
  })

  test('auch die Löschung eines kommerziellen Punkts ist als KI-Operation gesperrt', () => {
    const basis = reise()
    const vorher = structuredClone(basis)
    const ergebnis = anwenden([op({ art: 'punkt_entfernen', punktId: 'item-1' })], basis)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler.code, 'ungueltig')
    assert.deepEqual(basis, vorher)
  })

  test('eine gekürzte Etappe bewahrt den kommerziellen Punkt ungeplant', () => {
    const ergebnis = anwenden([op({ art: 'etappe_entfernen', etappeId: 'stage-1' })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.days.some((tag) => tag.items.some((punkt) => punkt.id === 'item-1')), false)
    const dom = ergebnis.reise.ohneTag.find((punkt) => punkt.id === 'item-1')
    assert.equal(dom?.title, 'Dom')
    assert.equal(dom?.kind, 'activity')
    assert.equal(dom?.note, null)
    assert.equal(dom?.startsOn, '2026-09-12')
    assert.equal(dom?.startsAt, '09:00')
    assert.equal(dom?.endsOn, null)
    assert.equal(dom?.endsAt, null)
    assert.equal(dom?.provider, 'getyourguide')
    assert.equal(dom?.priceAmount, 18)
    assert.equal(dom?.bookingUrl, 'https://example.com/dom')
    assert.equal(dom?.dayId, null)
    assert.equal(dom?.stageId, null)
  })
})

describe('Geschützter kommerzieller stay', () => {
  function mitStay() {
    const basis = reise()
    basis.days[0]!.items.push({
      id: 'item-stay',
      dayId: 'day-1',
      stageId: 'stage-1',
      kind: 'stay',
      title: 'Hotel Eixample · Eixample',
      note: '2026-09-12 bis 2026-09-14',
      position: 2,
      startsOn: '2026-09-12',
      startsAt: null,
      endsOn: '2026-09-14',
      endsAt: null,
      priceAmount: 760,
      priceCurrency: 'CHF',
      provider: 'test-hotel',
      externalRef: 'ref-77',
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
    })
    return basis
  }

  test('punkt_anpassen ändert einen kommerziellen stay nicht', () => {
    const ergebnis = anwenden(
      [
        op({
          art: 'punkt_anpassen',
          punktId: 'item-stay',
          titel: 'Anderes Hotel',
          notiz: 'neu',
          punktArt: 'note',
          beginn: '18:00',
          tagId: 'day-2',
        }),
      ],
      mitStay(),
    )
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const stay = ergebnis.reise.days[0]?.items.find((punkt) => punkt.id === 'item-stay')
    assert.equal(stay?.title, 'Hotel Eixample · Eixample')
    assert.equal(stay?.kind, 'stay')
    assert.equal(stay?.priceAmount, 760)
    assert.equal(stay?.provider, 'test-hotel')
    assert.equal(stay?.startsOn, '2026-09-12')
    assert.equal(stay?.dayId, 'day-1')
  })

  test('die KI darf einen kommerziellen Stay auch isoliert nicht löschen', () => {
    const basis = mitStay()
    const vorher = structuredClone(basis)
    const ergebnis = anwenden([op({ art: 'punkt_entfernen', punktId: 'item-stay' })], basis)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler.code, 'ungueltig')
    assert.deepEqual(basis, vorher)
  })

  test('zeitraum_verschieben lässt den stay-Termin stehen', () => {
    const ergebnis = anwenden([op({ art: 'zeitraum_verschieben', tageDelta: 7 })], mitStay())
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const stay = ergebnis.reise.days[0]?.items.find((punkt) => punkt.id === 'item-stay')
    assert.equal(stay?.startsOn, '2026-09-12')
    assert.equal(stay?.endsOn, '2026-09-14')
  })
})

describe('Unbekannte Referenzen', () => {
  test('unbekannte Etappe', () => {
    const ergebnis = anwenden([op({ art: 'etappe_entfernen', etappeId: 'gibt-es-nicht' })])
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler.code, 'unbekannte-referenz')
  })

  test('unbekannter Tag', () => {
    const ergebnis = anwenden([op({ art: 'tag_entfernen', tagId: 'day-99' })])
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler.code, 'unbekannte-referenz')
  })

  test('unbekannter Planpunkt', () => {
    const ergebnis = anwenden([op({ art: 'punkt_anpassen', punktId: 'item-99', titel: 'Titel' })])
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler.code, 'unbekannte-referenz')
  })
})

describe('Mehrstufig ohne Kalenderdaten', () => {
  test('Tage bleiben ihrer Etappe zugeordnet', () => {
    const ohneDatum = reise({
      startDate: null,
      endDate: null,
      stages: [
        etappe({ id: 'stage-1', position: 1, name: 'Florenz', arrivalDate: null, departureDate: null }),
        etappe({ id: 'stage-2', position: 2, name: 'Rom', arrivalDate: null, departureDate: null }),
      ],
      days: [
        tag({ id: 'day-1', dayIndex: 1, dayDate: null, stageId: 'stage-1', items: [] }),
        tag({ id: 'day-2', dayIndex: 2, dayDate: null, stageId: 'stage-1', items: [] }),
        tag({ id: 'day-3', dayIndex: 3, dayDate: null, stageId: 'stage-2', items: [] }),
      ],
    })
    const ergebnis = anwenden([op({ art: 'etappe_dauer', etappeId: 'stage-1', tageDelta: 1 })], ohneDatum)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.days.filter((t) => t.stageId === 'stage-1').length, 3)
    assert.equal(ergebnis.reise.days.filter((t) => t.stageId === 'stage-2').length, 1)
    assert.equal(ergebnis.reise.days.every((t) => t.dayDate === null), true)
  })
})

describe('Bestehende Kennungen bleiben', () => {
  test('unveränderte Etappen, Tage und Punkte behalten ihre id', () => {
    const ergebnis = anwenden([op({ art: 'stammdaten', reisende: 4 })])
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.reise.stages[0]?.id, 'stage-1')
    assert.equal(ergebnis.reise.days[0]?.id, 'day-1')
    assert.equal(ergebnis.reise.days[0]?.items[0]?.id, 'item-1')
  })
})
