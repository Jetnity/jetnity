import { beforeEach, describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { activitySucheEingabeAusReise, tageskontextAusReise } from '@/lib/activities/tageskontext'
import type { Ort } from '@/lib/places/domain'
import { alsNutzlast } from '@/lib/trips/abbildung'
import { createKontoTage, createZieleGraph } from '@/lib/trips/create-stages'
import { gastreiseAnlegen } from '@/lib/trips/gastspeicher'
import { timelineAbleiten } from '@/lib/trips/timeline'
import { ZEITRAUM_ZU_LANG } from '@/lib/trips/tage'
import type { CreateTripInput } from '@/types/trips'

function ort(teil: Partial<Ort> & Pick<Ort, 'id' | 'name'>): Ort {
  return {
    source: 'geonames',
    sourceId: teil.id.replace(/^geonames:/, ''),
    typ: 'city',
    country: 'Thailand',
    countryCode: 'TH',
    region: null,
    lat: teil.lat ?? 13.75,
    lon: teil.lon ?? 100.5,
    iata: null,
    keywords: null,
    ...teil,
  }
}

const ZUERICH = ort({
  id: 'geonames:2657896',
  name: 'Zürich',
  country: 'Switzerland',
  countryCode: 'CH',
  lat: 47.37,
  lon: 8.55,
})
const BANGKOK = ort({ id: 'geonames:1609350', name: 'Bangkok', lat: 13.75, lon: 100.5 })
const CHIANG = ort({ id: 'geonames:1153671', name: 'Chiang Mai', lat: 18.79, lon: 98.98 })
const PHUKET = ort({ id: 'geonames:1151254', name: 'Phuket', lat: 7.89, lon: 98.4 })
const ZEITRAUM = { startDate: '2026-11-01', endDate: '2026-11-14' }
const VERTEILUNG = {
  claims: [
    { occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-03' },
    { occurrence: 2, startDate: '2026-11-04', endDate: '2026-11-07' },
    { occurrence: 3, startDate: '2026-11-08', endDate: '2026-11-14' },
  ],
}

function speicherStellen() {
  const ablage = new Map<string, string>()
  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (schluessel: string) => ablage.get(schluessel) ?? null,
        setItem: (schluessel: string, wert: string) => {
          ablage.set(schluessel, wert)
        },
        removeItem: (schluessel: string) => {
          ablage.delete(schluessel)
        },
      },
    },
  })
  return ablage
}

function eingabe(
  claims: CreateTripInput['dayAllocation'] = VERTEILUNG,
  endDate = ZEITRAUM.endDate,
): CreateTripInput {
  return {
    clientRef: 'trip-bangkok-chiang-mai-phuket',
    title: 'Bangkok',
    destination: 'Bangkok',
    destinationPlaceId: BANGKOK.id,
    weitereDestinationPlaceIds: [CHIANG.id, PHUKET.id],
    origin: 'Zürich',
    originPlaceId: ZUERICH.id,
    ...ZEITRAUM,
    endDate,
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    pace: 'balanced',
    interests: [],
    travelWish: null,
    dayAllocation: claims,
  }
}

describe('Guest, Konto-Nutzlast und Folgekontext derselben Erstzuordnung', () => {
  let ablage = new Map<string, string>()

  beforeEach(() => {
    ablage = speicherStellen()
  })

  test('3/4/7 bleibt auf beiden Wegen 14 Tage, ohne Hotel- oder Transferzeiten', () => {
    const reise = gastreiseAnlegen(eingabe(), {
      ziel: BANGKOK,
      abreise: ZUERICH,
      weitereZiele: [CHIANG, PHUKET],
    })
    const nutzlast = alsNutzlast(reise)
    const graph = createZieleGraph([BANGKOK, CHIANG, PHUKET], ZEITRAUM, VERTEILUNG)
    const konto = createKontoTage(graph, ZEITRAUM)

    assert.equal(reise.days.length, 14)
    assert.equal(reise.dayStageAssignmentMode, 'explicit')
    assert.equal(reise.clientRef, 'trip-bangkok-chiang-mai-phuket')
    assert.deepEqual(
      reise.stages.map((etappe) => etappe.placeId),
      [BANGKOK.id, CHIANG.id, PHUKET.id],
    )
    assert.equal(reise.stages.every((etappe) => etappe.arrivalDate === null && etappe.departureDate === null), true)
    assert.deepEqual(
      nutzlast.days.map((tag) => tag.stage_position),
      konto.map((tag) => tag.stage_position),
    )
    assert.equal(nutzlast.day_stage_assignment_mode, 'explicit')
    assert.deepEqual(
      nutzlast.days.map((tag) => tag.stage_position),
      [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3],
    )

    const timeline = timelineAbleiten(reise)
    assert.equal(timeline.etappen.filter((etappe) => etappe.istNutzerziel).length, 3)
    assert.deepEqual(
      timeline.etappen.filter((etappe) => etappe.istNutzerziel).map((etappe) => etappe.tage.length),
      [3, 4, 7],
    )
    assert.equal(timeline.etappen.some((etappe) => etappe.name === 'Noch keinem Ziel zugeordnet'), false)

    const erster = reise.days[0]
    const etappe = reise.stages.find((eintrag) => eintrag.id === erster?.stageId)
    assert.ok(etappe)
    const kontext = tageskontextAusReise(activitySucheEingabeAusReise(reise, etappe, erster ?? null))
    assert.equal(kontext.anfrage?.destinationName, 'Bangkok')
    assert.equal(kontext.anfrage?.dayDate, '2026-11-01')
    assert.equal(kontext.anfrage?.destinationPlaceId.includes(BANGKOK.id) || kontext.anfrage?.destinationName === 'Bangkok', true)
  })

  test('Bangkok → Chiang Mai → Bangkok bindet Tage an das Vorkommen, nicht an die Place-ID', () => {
    const reise = gastreiseAnlegen(
      eingabe({
        claims: [
          { occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-02' },
          { occurrence: 2, startDate: '2026-11-03', endDate: '2026-11-04' },
          { occurrence: 3, startDate: '2026-11-05', endDate: '2026-11-06' },
        ],
      }),
      { ziel: BANGKOK, abreise: ZUERICH, weitereZiele: [CHIANG, BANGKOK] },
    )
    assert.equal(reise.stages.length, 3)
    assert.equal(reise.stages[0]?.placeId, reise.stages[2]?.placeId)
    assert.notEqual(reise.stages[0]?.id, reise.stages[2]?.id)
    assert.equal(reise.days[0]?.stageId, reise.stages[0]?.id)
    assert.equal(reise.days[4]?.stageId, reise.stages[2]?.id)
    assert.equal(reise.days[0]?.stageId === reise.days[4]?.stageId, false)
    assert.equal(reise.stages.every((etappe) => etappe.arrivalDate === null), true)
  })

  test('teilweise Zuordnung lässt die übrigen Tage ungesucht', () => {
    const reise = gastreiseAnlegen(
      {
        ...eingabe({ claims: [{ occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-03' }] }),
        clientRef: 'trip-teilweise',
      },
      { ziel: BANGKOK, abreise: ZUERICH, weitereZiele: [CHIANG, PHUKET] },
    )
    assert.equal(reise.days.filter((tag) => tag.stageId === reise.stages[0]?.id).length, 3)
    assert.equal(reise.days.filter((tag) => tag.stageId == null).length, 11)
    const timeline = timelineAbleiten(reise)
    const offen = timeline.etappen.find((etappe) => etappe.name === 'Noch keinem Ziel zugeordnet')
    assert.equal(offen?.tage.length, 11)
    assert.equal(offen?.tage.every((tag) => tag.stageId == null), true)
    const belegt = reise.days.find((tag) => tag.stageId != null)
    const etappe = reise.stages.find((eintrag) => eintrag.id === belegt?.stageId)
    assert.ok(belegt && etappe)
    const kontext = tageskontextAusReise(activitySucheEingabeAusReise(reise, etappe, belegt))
    assert.equal(kontext.anfrage?.destinationName, 'Bangkok')
    assert.equal(kontext.anfrage?.dayDate, belegt.dayDate)
  })

  test('ein Widerspruch wird nicht gespeichert', () => {
    assert.throws(
      () =>
        gastreiseAnlegen(
          eingabe({
            claims: [
              { occurrence: 3, startDate: '2026-11-01', endDate: '2026-11-01' },
              { occurrence: 1, startDate: '2026-11-10', endDate: '2026-11-10' },
            ],
          }),
          { ziel: BANGKOK, abreise: ZUERICH, weitereZiele: [CHIANG, PHUKET] },
        ),
      /Reihenfolge/,
    )
  })

  test('367 Tage werden nicht geschrieben, 366 Tage bleiben vollständig', () => {
    assert.throws(
      () =>
        gastreiseAnlegen(
          eingabe({ claims: [{ occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-03' }] }, '2027-11-02'),
          { ziel: BANGKOK, abreise: ZUERICH, weitereZiele: [CHIANG, PHUKET] },
        ),
      new RegExp(ZEITRAUM_ZU_LANG),
    )
    assert.equal(ablage.size, 0)

    const reise = gastreiseAnlegen(
      eingabe({ claims: [{ occurrence: 1, startDate: '2026-11-01', endDate: '2026-11-03' }] }, '2027-11-01'),
      { ziel: BANGKOK, abreise: ZUERICH, weitereZiele: [CHIANG, PHUKET] },
    )
    assert.equal(reise.days.length, 366)
    assert.equal(reise.startDate, '2026-11-01')
    assert.equal(reise.endDate, '2027-11-01')
    assert.equal(reise.days[365]?.dayDate, '2027-11-01')
    assert.equal(reise.days.filter((tag) => tag.stageId === reise.stages[0]?.id).length, 3)
    assert.equal(reise.days.filter((tag) => tag.stageId == null).length, 363)
  })
})
