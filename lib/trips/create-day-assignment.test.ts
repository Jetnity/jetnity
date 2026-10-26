import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { Ort } from '@/lib/places/domain'
import { createKontoTage, createZieleGraph } from '@/lib/trips/create-stages'
import {
  ZUORDNUNG_ANSPRUECHE_MAXIMUM,
  createDayPositions,
  tageszuordnungAngleichen,
} from '@/lib/trips/create-day-assignment'
import { GRENZEN, neueReiseSchema } from '@/lib/trips/schema'
import { REISEDAUER_MAXIMUM, TAGE_MAXIMUM, ZEITRAUM_ZU_LANG } from '@/lib/trips/tage'

function ort(teil: Partial<Ort> & Pick<Ort, 'id' | 'name' | 'countryCode'>): Ort {
  return {
    source: 'geonames',
    sourceId: teil.id.replace(/^geonames:/, ''),
    typ: 'city',
    country: teil.country ?? 'Thailand',
    region: null,
    lat: teil.lat ?? 13.75,
    lon: teil.lon ?? 100.5,
    iata: null,
    keywords: null,
    ...teil,
  }
}

const BANGKOK = ort({ id: 'geonames:1609350', name: 'Bangkok', countryCode: 'TH', lat: 13.75, lon: 100.5 })
const CHIANG = ort({ id: 'geonames:1153671', name: 'Chiang Mai', countryCode: 'TH', lat: 18.79, lon: 98.98 })
const PHUKET = ort({ id: 'geonames:1151254', name: 'Phuket', countryCode: 'TH', lat: 7.89, lon: 98.4 })
const ZEITRAUM = { startDate: '2026-11-01', endDate: '2026-11-14' }

const FORMULAR = {
  clientRef: 'trip-1',
  title: 'Bangkok',
  destination: 'Bangkok',
  destinationPlaceId: BANGKOK.id,
  origin: 'Zürich',
  originPlaceId: 'geonames:2657896',
  startDate: ZEITRAUM.startDate,
  endDate: ZEITRAUM.endDate,
  travellers: 2,
  currency: 'CHF',
  budgetAmount: null,
  pace: 'balanced',
  interests: [],
  travelWish: null,
}

describe('Erstzuordnung vorhandener Kalendertage', () => {
  test('die Anspruchsgrenze bleibt die kanonische Etappengrenze', () => {
    assert.equal(ZUORDNUNG_ANSPRUECHE_MAXIMUM, GRENZEN.etappenJeReise)
    assert.equal(TAGE_MAXIMUM, 366)
    assert.equal(REISEDAUER_MAXIMUM, GRENZEN.reisedauerInTagen)
  })

  test('ohne Opt-in bleiben mehrere Ziele unzugeordnet', () => {
    const graph = createZieleGraph([BANGKOK, CHIANG, PHUKET], ZEITRAUM)
    assert.equal(graph.assignmentMode, 'unassigned')
    assert.equal(graph.dayStagePosition, null)
    assert.equal(graph.dayStagePositions.every((position) => position == null), true)
    assert.equal(graph.stages.every((etappe) => etappe.arrivalDate === null && etappe.departureDate === null), true)
  })

  test('14 Tage mit 3/4/7 bleiben 14 Tage und folgen der Vorkommensreihenfolge', () => {
    const allocation = {
      claims: [
        { occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-03' },
        { occurrence: 2, startDate: '2026-11-04', endDate: '2026-11-07' },
        { occurrence: 3, startDate: '2026-11-08', endDate: '2026-11-14' },
      ],
    }
    const graph = createZieleGraph([BANGKOK, CHIANG, PHUKET], ZEITRAUM, allocation)
    const tage = createKontoTage(graph, ZEITRAUM)

    assert.equal(tage.length, 14)
    assert.equal(graph.assignmentMode, 'explicit')
    assert.deepEqual(
      tage.map((tag) => tag.stage_position),
      [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3],
    )
    assert.deepEqual(tage.map((tag) => tag.day_date).slice(0, 2), ['2026-11-01', '2026-11-02'])
    assert.equal(tage.at(-1)?.day_date, '2026-11-14')
    assert.equal(graph.stages.every((etappe) => etappe.arrivalDate === null && etappe.departureDate === null), true)
  })

  test('die ersten 3 Tage können zugeordnet sein und 11 bleiben leer', () => {
    const ergebnis = createDayPositions({
      stageCount: 3,
      ...ZEITRAUM,
      allocation: { claims: [{ occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-03' }] },
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.assigned, 3)
    assert.equal(ergebnis.unassigned, 11)
    assert.equal(ergebnis.mode, 'explicit')
    assert.equal(ergebnis.positions.filter((position) => position == null).length, 11)
  })

  test('Tag 1 nach Phuket und Tag 10 nach Bangkok widerspricht Bangkok → Chiang Mai → Phuket', () => {
    const ergebnis = createDayPositions({
      stageCount: 3,
      ...ZEITRAUM,
      allocation: {
        claims: [
          { occurrence: 3, startDate: '2026-11-01', endDate: '2026-11-01' },
          { occurrence: 1, startDate: '2026-11-10', endDate: '2026-11-10' },
        ],
      },
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.match(ergebnis.message, /Reihenfolge/)
  })

  test('dieselbe Wahl wird nach einem Zieltausch abgelehnt und nicht umsortiert', () => {
    const vorher = createDayPositions({
      stageCount: 3,
      ...ZEITRAUM,
      allocation: {
        claims: [
          { occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-03' },
          { occurrence: 3, startDate: '2026-11-08', endDate: '2026-11-14' },
        ],
      },
    })
    assert.equal(vorher.ok, true)
    const nachTausch = createDayPositions({
      stageCount: 3,
      ...ZEITRAUM,
      allocation: {
        claims: [
          { occurrence: 3, startDate: '2026-11-01', endDate: '2026-11-03' },
          { occurrence: 1, startDate: '2026-11-08', endDate: '2026-11-14' },
        ],
      },
    })
    assert.equal(nachTausch.ok, false)
  })

  test('ein Schaltjahr behält den 29. Februar und ein Monatswechsel die Kalendertage', () => {
    const schalt = createDayPositions({
      stageCount: 2,
      startDate: '2024-02-28',
      endDate: '2024-03-01',
      allocation: { claims: [{ occurrence: 2, startDate: '2024-02-29', endDate: '2024-02-29' }] },
    })
    assert.equal(schalt.ok, true)
    if (!schalt.ok) return
    assert.deepEqual(schalt.positions, [null, 2, null])

    const monat = createDayPositions({
      stageCount: 2,
      startDate: '2026-01-30',
      endDate: '2026-02-02',
      allocation: { claims: [{ occurrence: 2, startDate: '2026-01-31', endDate: '2026-02-01' }] },
    })
    assert.equal(monat.ok, true)
    if (!monat.ok) return
    assert.deepEqual(monat.positions, [null, 2, 2, null])
  })

  test('ein einzelnes Ziel bleibt vollständig zugeordnet und nimmt keine Verteilung an', () => {
    const graph = createZieleGraph([BANGKOK], ZEITRAUM)
    assert.equal(graph.assignmentMode, 'single_destination')
    assert.equal(graph.dayStagePositions.every((position) => position === 1), true)
    assert.throws(
      () =>
        createZieleGraph([BANGKOK], ZEITRAUM, {
          claims: [{ occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-03' }],
        }),
      /nur bei mehreren Zielen/,
    )
  })

  test('50 Ziele ohne Verteilung bleiben gültig, 51 nicht', () => {
    const maximum = Array.from({ length: GRENZEN.etappenJeReise }, (_, index) =>
      ort({ id: `geonames:${2000000 + index}`, name: `Ort ${index + 1}`, countryCode: 'TH' }),
    )
    const graph = createZieleGraph(maximum, ZEITRAUM)
    assert.equal(graph.stages.length, 50)
    assert.equal(graph.assignmentMode, 'unassigned')
    assert.throws(() => createZieleGraph([...maximum, BANGKOK], ZEITRAUM), /höchstens 50 Reiseziele/)
  })

  test('überlappende, fremde und dezimale Bezüge werden abgelehnt', () => {
    assert.equal(
      createDayPositions({
        stageCount: 2,
        ...ZEITRAUM,
        allocation: {
          claims: [
            { occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-02' },
            { occurrence: 2, startDate: '2026-11-02', endDate: '2026-11-03' },
          ],
        },
      }).ok,
      false,
    )
    assert.equal(
      createDayPositions({
        stageCount: 2,
        ...ZEITRAUM,
        allocation: { claims: [{ occurrence: 4, startDate: '2026-11-01', endDate: '2026-11-01' }] },
      }).ok,
      false,
    )
    assert.equal(
      createDayPositions({
        stageCount: 2,
        ...ZEITRAUM,
        allocation: { claims: [{ occurrence: 1.5, startDate: '2026-11-01', endDate: '2026-11-01' }] },
      }).ok,
      false,
    )
    const formular = neueReiseSchema.safeParse({
      ...FORMULAR,
      weitereDestinationPlaceIds: [CHIANG.id, PHUKET.id],
      dayAllocation: { claims: [{ occurrence: 1.5, startDate: '2026-11-01', endDate: '2026-11-01' }] },
    })
    assert.equal(formular.success, false)
  })

  test('ein geänderter Zeitraum oder ein entferntes Ziel überträgt keine Tage', () => {
    const zeit = tageszuordnungAngleichen({
      claims: [{ occurrenceKey: 'bangkok', startDate: '2026-11-01', endDate: '2026-11-03' }],
      occurrenceKeys: ['bangkok', 'chiang'],
      startDate: '2026-12-01',
      endDate: '2026-12-14',
    })
    assert.equal(zeit.claims.length, 0)
    assert.match(zeit.hinweis ?? '', /Zeitraum/)

    const entfernt = tageszuordnungAngleichen({
      claims: [
        { occurrenceKey: 'bangkok', startDate: '2026-11-01', endDate: '2026-11-03' },
        { occurrenceKey: 'phuket', startDate: '2026-11-08', endDate: '2026-11-10' },
      ],
      occurrenceKeys: ['bangkok', 'chiang'],
      ...ZEITRAUM,
    })
    assert.deepEqual(entfernt.claims.map((anspruch) => anspruch.occurrenceKey), ['bangkok'])
    assert.match(entfernt.hinweis ?? '', /entferntes Ziel/)
  })

  test('366 Kalendertage bleiben vollständig, 367 werden nicht gekürzt', () => {
    const ansatz = {
      claims: [{ occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-03' }],
    }
    const gueltig = createDayPositions({
      stageCount: 3,
      startDate: '2026-11-01',
      endDate: '2027-11-01',
      allocation: ansatz,
    })
    assert.equal(gueltig.ok, true)
    if (!gueltig.ok) return
    assert.equal(gueltig.positions.length, 366)
    assert.equal(gueltig.assigned, 3)
    assert.equal(gueltig.unassigned, 363)
    const graph = createZieleGraph([BANGKOK, CHIANG, PHUKET], {
      startDate: '2026-11-01',
      endDate: '2027-11-01',
    }, ansatz)
    const tage = createKontoTage(graph, { startDate: '2026-11-01', endDate: '2027-11-01' })
    assert.equal(tage.length, 366)
    assert.equal(tage[0]?.day_date, '2026-11-01')
    assert.equal(tage[365]?.day_date, '2027-11-01')
    assert.equal(tage.filter((tag) => tag.stage_position === 1).length, 3)

    const zuLang = createDayPositions({
      stageCount: 3,
      startDate: '2026-11-01',
      endDate: '2027-11-02',
      allocation: ansatz,
    })
    assert.equal(zuLang.ok, false)
    if (zuLang.ok) return
    assert.equal(zuLang.message, ZEITRAUM_ZU_LANG)
    assert.equal('positions' in zuLang, false)
    assert.throws(
      () => createZieleGraph([BANGKOK, CHIANG, PHUKET], { startDate: '2026-11-01', endDate: '2027-11-02' }, ansatz),
      new RegExp(ZEITRAUM_ZU_LANG),
    )
    assert.throws(
      () =>
        createKontoTage(graph, {
          startDate: '2026-11-01',
          endDate: '2027-11-02',
        }),
      new RegExp(ZEITRAUM_ZU_LANG),
    )

    const formularLang = neueReiseSchema.safeParse({
      ...FORMULAR,
      startDate: '2026-11-01',
      endDate: '2027-11-02',
      weitereDestinationPlaceIds: [CHIANG.id, PHUKET.id],
      dayAllocation: ansatz,
    })
    assert.equal(formularLang.success, false)
    if (formularLang.success) return
    assert.equal(formularLang.error.issues.some((issue) => issue.path[0] === 'endDate' && issue.message === ZEITRAUM_ZU_LANG), true)

    const formularKurz = neueReiseSchema.safeParse({
      ...FORMULAR,
      startDate: '2026-11-01',
      endDate: '2027-11-01',
      weitereDestinationPlaceIds: [CHIANG.id, PHUKET.id],
      dayAllocation: ansatz,
    })
    assert.equal(formularKurz.success, true)

    const ohneVerteilung = createDayPositions({
      stageCount: 3,
      startDate: '2026-11-01',
      endDate: '2027-11-01',
    })
    assert.equal(ohneVerteilung.ok, true)
    if (ohneVerteilung.ok) {
      assert.equal(ohneVerteilung.mode, 'unassigned')
      assert.equal(ohneVerteilung.positions.length, 366)
    }
    const einzeln = createDayPositions({
      stageCount: 1,
      startDate: '2026-11-01',
      endDate: '2027-11-01',
    })
    assert.equal(einzeln.ok, true)
    if (einzeln.ok) assert.equal(einzeln.positions.length, 366)
    assert.equal(
      createDayPositions({ stageCount: 1, startDate: '2026-11-01', endDate: '2027-11-02' }).ok,
      false,
    )
  })

  test('Schaltjahrgrenzen bleiben bei 366 Tagen und weisen 367 zurück', () => {
    const schaltjahr = createDayPositions({
      stageCount: 2,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    })
    assert.equal(schaltjahr.ok, true)
    if (schaltjahr.ok) assert.equal(schaltjahr.positions.length, 366)

    const ueberSchaltjahr = createDayPositions({
      stageCount: 2,
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      allocation: { claims: [{ occurrence: 1, startDate: '2024-01-01', endDate: '2024-01-03' }] },
    })
    assert.equal(ueberSchaltjahr.ok, false)

    const abSchaltag = createDayPositions({
      stageCount: 2,
      startDate: '2024-02-29',
      endDate: '2025-02-28',
    })
    assert.equal(abSchaltag.ok, true)
    if (abSchaltag.ok) {
      assert.equal(abSchaltag.positions.length, 366)
      assert.equal(abSchaltag.mode, 'unassigned')
    }

    const durchSchaltag = createDayPositions({
      stageCount: 2,
      startDate: '2023-03-01',
      endDate: '2024-03-01',
    })
    assert.equal(durchSchaltag.ok, false)
    if (!durchSchaltag.ok) assert.equal(durchSchaltag.message, ZEITRAUM_ZU_LANG)

    const formularSchalt = neueReiseSchema.safeParse({
      ...FORMULAR,
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      weitereDestinationPlaceIds: [CHIANG.id],
      dayAllocation: { claims: [{ occurrence: 1, startDate: '2024-01-01', endDate: '2024-01-03' }] },
    })
    assert.equal(formularSchalt.success, false)
    if (!formularSchalt.success) {
      assert.equal(
        formularSchalt.error.issues.some((issue) => issue.path[0] === 'endDate' && issue.message === ZEITRAUM_ZU_LANG),
        true,
      )
    }
    const formularSchaltGueltig = neueReiseSchema.safeParse({
      ...FORMULAR,
      startDate: '2024-02-29',
      endDate: '2025-02-28',
      weitereDestinationPlaceIds: [CHIANG.id],
    })
    assert.equal(formularSchaltGueltig.success, true)
  })
})
