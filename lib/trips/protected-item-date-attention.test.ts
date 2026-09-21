// lib/trips/protected-item-date-attention.test.ts
//
// TA-R2: after a trip shift, a protected commercial item may keep startsOn
// while its owning dayDate moves. Attention must surface that mismatch
// without rewriting dates, protection or provenance.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { operationenAnwenden } from '@/lib/reiseaenderung/anwenden'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import type { Modelloperation } from '@/lib/reiseaenderung/schema'
import { attentionAbleiten } from '@/lib/trips/attention'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { leereSafetyEvidence } from '@/lib/safety/evidence'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import { leereSeasonalEvidence } from '@/lib/seasonal/evidence'
import { kalenderdatumLesen } from '@/lib/traveller/dokument-lebenszyklus'
import type { Trip, TripItem } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'

function kennung() {
  let n = 0
  return (prefix: string) => `${prefix}-neu-${++n}`
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

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
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

function safetyLeer(): SafetyEvaluation {
  return {
    factId: 'safety:checked_empty',
    factKey: 'checked_empty',
    category: 'unknown',
    eventStatus: 'unknown',
    evidenceStatus: 'current',
    freshness: 'current',
    relevance: 'not_affected',
    spatialPrecision: 'unknown',
    presentationClass: 'unknown',
    sourceSeverity: null,
    advisoryClass: null,
    authorityClass: 'unknown',
    affectedRefs: [],
    impact: [],
    reason: 'checked_empty',
    nextAction: 'observe',
    conflict: false,
    seasonalRejected: false,
    evidence: leereSafetyEvidence('fp-safety'),
    contextFingerprint: 'fp-safety',
    eventFingerprint: 'fp-safety',
  }
}

function seasonalLeer(): SeasonalEvaluation {
  return {
    factId: 'seasonal:checked_empty',
    factKey: 'checked_empty',
    category: 'unknown',
    evidenceClass: 'seasonal_pattern',
    outcome: 'unknown',
    evidenceStatus: 'current',
    freshness: 'current',
    relevance: 'not_applies',
    spatialPrecision: 'unknown',
    presentationClass: 'unknown',
    authorityClass: 'unknown',
    affectedRefs: [],
    impact: [],
    reason: 'checked_empty',
    nextAction: 'observe',
    conflict: false,
    acuteRejected: false,
    evidence: leereSeasonalEvidence(),
    contextFingerprint: 'fp-seasonal',
    factFingerprint: 'fp-seasonal',
  }
}

function ableiten(reise: Trip) {
  return attentionAbleiten({
    reise,
    safetyEvaluations: [safetyLeer()],
    seasonalEvaluations: [seasonalLeer()],
    officialEvaluations: [],
    orchestriereSafety: false,
    orchestriereSeasonal: false,
  })
}

function mismatchPunkte(reise: Trip) {
  return ableiten(reise).punkte.filter((eintrag) => eintrag.signal === 'item.date_mismatch')
}

function reiseMitTagen(
  tage: Array<{
    id: string
    dayDate: string | null
    items: TripItem[]
  }>,
  ohneTag: TripItem[] = [],
): Trip {
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
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      {
        id: 'stage-1',
        position: 1,
        name: 'Florenz',
        countryCode: 'IT',
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-16',
        latitude: null,
        longitude: null,
        placeId: null,
      },
    ],
    days: tage.map((tag, index) => ({
      id: tag.id,
      stageId: 'stage-1',
      dayIndex: index + 1,
      dayDate: tag.dayDate,
      title: null,
      items: tag.items.map((item) => ({ ...item, dayId: tag.id })),
    })),
    ohneTag,
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

function geschuetzt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'title'>): TripItem {
  return punkt({
    kind: 'activity',
    startsOn: '2026-09-12',
    priceAmount: 18,
    priceCurrency: 'EUR',
    provider: 'getyourguide',
    ...teil,
  })
}

describe('geschützte Terminabweichung nach Reiseverschiebung', () => {
  test('+7 Tage: kommerzieller Termin bleibt, Attention meldet Abweichung', () => {
    const vorher = structuredClone(beispielreise())
    const ergebnis = operationenAnwenden(vorher, [op({ art: 'zeitraum_verschieben', tageDelta: 7 })], kennung())
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return

    const tag = ergebnis.reise.days[0]
    const dom = tag?.items.find((item) => item.id === 'item-1')
    const uffizien = ergebnis.reise.days[1]?.items.find((item) => item.id === 'item-2')
    assert.equal(tag?.dayDate, '2026-09-19')
    assert.equal(dom?.startsOn, '2026-09-12')
    assert.equal(dom?.dayId, 'day-1')
    assert.equal(istKommerziell(dom!), true)
    assert.equal(uffizien?.startsOn, '2026-09-20')
    assert.equal(istKommerziell(uffizien!), false)

    const sicht = ableiten(ergebnis.reise)
    const abweichung = sicht.punkte.find((eintrag) => eintrag.id === 'item.date_mismatch:item-1')
    assert.ok(abweichung)
    assert.equal(abweichung.ebene, 'item')
    assert.equal(abweichung.signal, 'item.date_mismatch')
    assert.equal(abweichung.lage, 'stale')
    assert.equal(abweichung.schwere, 'bald')
    assert.equal(abweichung.aktion, null)
    assert.match(abweichung.titel, /Dom/)
    assert.match(abweichung.titel, /12\. Sept\. 2026/)
    assert.match(abweichung.titel, /19\. Sept\. 2026/)
    assert.equal(abweichung.titel.includes('startsOn'), false)
    assert.equal(abweichung.titel.includes('dayDate'), false)
    assert.equal(abweichung.titel.includes('item-1'), false)
    assert.equal(/abgelaufen|storniert|Anbieter|Buchung geändert/i.test(abweichung.titel), false)
    assert.equal(
      sicht.punkte.some((eintrag) => eintrag.signal === 'item.date_mismatch' && eintrag.id.includes('item-2')),
      false,
    )
    assert.equal(sicht.leerstand, null)
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
    assert.deepEqual(vorher, beispielreise())
  })

  test('neues Startdatum: kommerzieller Termin bleibt, Attention meldet Abweichung', () => {
    const ergebnis = operationenAnwenden(
      beispielreise(),
      [op({ art: 'stammdaten', startdatum: '2026-10-01' })],
      kennung(),
    )
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const dom = ergebnis.reise.days[0]?.items.find((item) => item.id === 'item-1')
    assert.equal(ergebnis.reise.startDate, '2026-10-01')
    assert.equal(ergebnis.reise.days[0]?.dayDate, '2026-10-01')
    assert.equal(dom?.startsOn, '2026-09-12')
    const abweichung = mismatchPunkte(ergebnis.reise).find((eintrag) => eintrag.id === 'item.date_mismatch:item-1')
    assert.ok(abweichung)
    assert.match(abweichung.titel, /1\. Okt\. 2026/)
  })
})

describe('kanonischer Schutz ohne Schutz-Neudefinition', () => {
  test('Nullpreis und nur-gebucht bleiben geschützt und erzeugen die Abweichung', () => {
    const nullpreis = geschuetzt({
      id: 'zero',
      title: 'Gratis-Ticket',
      priceAmount: 0,
      provider: null,
      bookingUrl: null,
      externalRef: null,
      bookingStatus: 'unconfirmed',
    })
    const gebucht = geschuetzt({
      id: 'booked',
      title: 'Reservierung',
      priceAmount: null,
      priceCurrency: null,
      provider: null,
      bookingUrl: null,
      externalRef: null,
      bookingStatus: 'booked',
    })
    assert.equal(istKommerziell(nullpreis), true)
    assert.equal(istKommerziell(gebucht), true)

    const sicht = ableiten(
      reiseMitTagen([
        {
          id: 'day-1',
          dayDate: '2026-09-19',
          items: [nullpreis, gebucht],
        },
      ]),
    )
    const ids = sicht.punkte.filter((eintrag) => eintrag.signal === 'item.date_mismatch').map((eintrag) => eintrag.id)
    assert.deepEqual(ids.sort(), ['item.date_mismatch:booked', 'item.date_mismatch:zero'])
  })

  test('Anbieter, Buchungslink und Fremdkennung bleiben jeweils kanonisch geschützt', () => {
    const varianten: TripItem[] = [
      geschuetzt({ id: 'prov', title: 'Anbieter', priceAmount: null, provider: 'getyourguide' }),
      geschuetzt({
        id: 'url',
        title: 'Link',
        priceAmount: null,
        provider: null,
        bookingUrl: 'https://example.com/x',
      }),
      geschuetzt({
        id: 'ext',
        title: 'Kennung',
        priceAmount: null,
        provider: null,
        externalRef: 'gyg-9',
      }),
    ]
    for (const item of varianten) assert.equal(istKommerziell(item), true)
    const sicht = ableiten(reiseMitTagen([{ id: 'day-1', dayDate: '2026-09-19', items: varianten }]))
    assert.equal(
      sicht.punkte
        .filter((eintrag) => eintrag.signal === 'item.date_mismatch')
        .map((eintrag) => eintrag.id)
        .sort()
        .join(','),
      'item.date_mismatch:ext,item.date_mismatch:prov,item.date_mismatch:url',
    )
  })
})

describe('kein erfundenes Mismatch', () => {
  test('gleicher geschützter Termin erzeugt kein Signal', () => {
    const sicht = ableiten(
      reiseMitTagen([
        {
          id: 'day-1',
          dayDate: '2026-09-12',
          items: [geschuetzt({ id: 'same', title: 'Dom' })],
        },
      ]),
    )
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'item.date_mismatch'), false)
  })

  test('nicht-kommerzieller abweichender Termin erzeugt dieses Signal nicht', () => {
    const frei = punkt({
      id: 'note-1',
      kind: 'note',
      title: 'Spaziergang',
      startsOn: '2026-09-12',
    })
    assert.equal(istKommerziell(frei), false)
    const sicht = ableiten(reiseMitTagen([{ id: 'day-1', dayDate: '2026-09-19', items: [frei] }]))
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'item.date_mismatch'), false)
  })

  test('fehlendes startsOn, fehlendes dayDate und ungeplante Punkte sind kein Antwort-Mismatch', () => {
    const ohneStart = geschuetzt({ id: 'nostart', title: 'Ohne Start', startsOn: null })
    const ungeplant = geschuetzt({ id: 'loose', title: 'Ungeplant', dayId: null, stageId: null })
    const sicht = ableiten(
      reiseMitTagen(
        [
          { id: 'day-1', dayDate: '2026-09-19', items: [ohneStart] },
          { id: 'day-2', dayDate: null, items: [geschuetzt({ id: 'nodate', title: 'Tag ohne Datum' })] },
        ],
        [ungeplant],
      ),
    )
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'item.date_mismatch'), false)
  })

  test('ungültige Kalenderwerte werden nicht über Date.parse normalisiert', () => {
    assert.equal(kalenderdatumLesen('2026-02-31'), null)
    assert.equal(kalenderdatumLesen('2025-02-29'), null)
    assert.equal(kalenderdatumLesen('2026-13-01'), null)
    assert.equal(kalenderdatumLesen('12.09.2026'), null)
    assert.equal(kalenderdatumLesen('2028-02-29'), '2028-02-29')

    const ungueltig = [
      geschuetzt({ id: 'feb31', title: '31. Feb', startsOn: '2026-02-31' }),
      geschuetzt({ id: 'leap-bad', title: 'Kein Schalttag', startsOn: '2025-02-29' }),
      geschuetzt({ id: 'iso-bad', title: 'Lokal', startsOn: '12.09.2026' }),
    ]
    const sicht = ableiten(reiseMitTagen([{ id: 'day-1', dayDate: '2026-03-01', items: ungueltig }]))
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'item.date_mismatch'), false)

    const schalt = ableiten(
      reiseMitTagen([
        {
          id: 'day-1',
          dayDate: '2028-03-01',
          items: [geschuetzt({ id: 'leap', title: 'Schalttag', startsOn: '2028-02-29' })],
        },
      ]),
    )
    assert.equal(schalt.punkte.some((eintrag) => eintrag.id === 'item.date_mismatch:leap'), true)
  })
})

describe('mehrere Abweichungen, Ordnung und reine Projektion', () => {
  test('mehrere abweichende Punkte bleiben getrennt und nach id geordnet', () => {
    const zeta = geschuetzt({ id: 'item-z', title: 'Zeta', position: 1 })
    const alpha = geschuetzt({ id: 'item-a', title: 'Alpha', position: 2 })
    const erste = mismatchPunkte(
      reiseMitTagen([{ id: 'day-1', dayDate: '2026-09-19', items: [zeta, alpha] }]),
    )
    const zweite = mismatchPunkte(
      reiseMitTagen([{ id: 'day-1', dayDate: '2026-09-19', items: [alpha, zeta] }]),
    )
    assert.deepEqual(
      erste.map((eintrag) => eintrag.id),
      ['item.date_mismatch:item-a', 'item.date_mismatch:item-z'],
    )
    assert.deepEqual(
      zweite.map((eintrag) => eintrag.id),
      erste.map((eintrag) => eintrag.id),
    )
    assert.equal(erste.length, 2)
  })

  test('Ableitung verändert den Eingabegraphen nicht', () => {
    const reise = reiseMitTagen([
      {
        id: 'day-1',
        dayDate: '2026-09-19',
        items: [geschuetzt({ id: 'dom', title: 'Dom' })],
      },
    ])
    const vorher = structuredClone(reise)
    Object.freeze(reise)
    Object.freeze(reise.days)
    Object.freeze(reise.days[0])
    Object.freeze(reise.days[0]!.items)
    Object.freeze(reise.days[0]!.items[0])
    const sicht = ableiten(reise)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'item.date_mismatch'), true)
    assert.deepEqual(reise, vorher)
    assert.equal(reise.days[0]!.items[0]!.startsOn, '2026-09-12')
    assert.equal(reise.days[0]!.dayDate, '2026-09-19')
  })
})
