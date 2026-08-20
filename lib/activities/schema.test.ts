import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  activityKontoUebernahmeSchema,
  activityOptionLesen,
  activitySucheEingabeLesen,
  activitySucheEingabeSchema,
  activitySuchanfrageLesen,
  ersteActivitymeldung,
} from '@/lib/activities/schema'

const EINGABE = {
  stage: {
    id: 'stage-1',
    name: 'Florenz',
    placeId: 'geonames:3176959',
    latitude: 43.77,
    longitude: 11.25,
  },
  day: {
    id: 'day-1',
    dayDate: '2026-09-12',
    stageId: 'stage-1',
  },
  trip: {
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'chf',
    budgetAmount: 4000,
    interests: ['culture'],
    pace: 'balanced',
  },
  items: [
    {
      id: 'item-1',
      kind: 'activity',
      title: 'Dom',
      startsOn: '2026-09-12',
      startsAt: '09:00',
      endsOn: '2026-09-12',
      endsAt: '11:00',
    },
  ],
}

describe('Aktivitäts-Suchanfrage', () => {
  test('eine gültige Anfrage kommt durch und normiert die Währung', () => {
    const gelesen = activitySucheEingabeLesen(EINGABE)
    assert.equal(gelesen?.trip.currency, 'CHF')
    assert.equal(gelesen?.day?.dayDate, '2026-09-12')
  })

  test('ein erfundenes Datum fällt fail-closed', () => {
    const ergebnis = activitySucheEingabeSchema.safeParse({
      ...EINGABE,
      day: { ...EINGABE.day, dayDate: '2026-02-30' },
    })
    assert.equal(ergebnis.success, false)
    if (!ergebnis.success) assert.match(ersteActivitymeldung(ergebnis.error), /Datum/)
  })

  test('Wegezeiten und Öffnungszeiten aus dem Client sind kein akzeptiertes Feld', () => {
    const gelesen = activitySucheEingabeLesen({
      ...EINGABE,
      wegeMinuten: 12,
      oeffnungszeiten: { von: '09:00' },
    })
    assert.ok(gelesen)
    assert.equal('wegeMinuten' in gelesen, false)
    assert.equal('oeffnungszeiten' in gelesen, false)
  })

  test('eine Provider-Suchanfrage braucht Ziel und Teilnehmer', () => {
    assert.equal(
      activitySuchanfrageLesen({
        destinationPlaceId: 'geonames:3176959',
        destinationName: 'Florenz',
        dayDate: '2026-09-12',
        participants: 2,
        currency: 'CHF',
        budgetAmount: 4000,
        interests: ['culture'],
        pace: 'balanced',
      })?.destinationPlaceId,
      'geonames:3176959',
    )
    assert.equal(
      activitySuchanfrageLesen({
        destinationPlaceId: '',
        destinationName: 'Florenz',
        dayDate: '2026-09-12',
        participants: 2,
        currency: 'CHF',
        budgetAmount: null,
        interests: [],
        pace: null,
      }),
      null,
    )
  })

  test('eine Option ohne Preis bleibt gültig, ein Preis ohne Währung nicht', () => {
    const ohnePreis = activityOptionLesen({
      id: 'opt-1',
      provider: 'test',
      externalRef: 'ref-1',
      title: 'Uffizien',
    })
    assert.ok(ohnePreis)
    assert.equal(ohnePreis.preis, null)

    assert.equal(
      activityOptionLesen({
        id: 'opt-2',
        provider: 'test',
        externalRef: 'ref-2',
        title: 'Uffizien',
        preis: 28,
      }),
      null,
    )
  })

  test('Konto-Übernahme akzeptiert nur identifiers', () => {
    const geparst = activityKontoUebernahmeSchema.safeParse({
      tripId: '11111111-1111-4111-8111-111111111111',
      stageId: '22222222-2222-4222-8222-222222222222',
      dayId: '33333333-3333-4333-8333-333333333333',
      optionId: 'opt-1',
      option: { title: 'Gefälscht', preis: 1, provider: 'evil' },
      timeslot: { startsOn: '2020-01-01', startsAt: '08:00' },
    })
    assert.equal(geparst.success, true)
    if (!geparst.success) return
    assert.equal('option' in geparst.data, false)
    assert.equal('timeslot' in geparst.data, false)
  })
})
