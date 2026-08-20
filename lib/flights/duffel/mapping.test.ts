import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  ANGEBOT_DIREKT,
  ANGEBOT_MIT_STOPP,
  ANGEBOT_RUECKFLUG,
  ANTWORT_GEMISCHT,
  ANTWORT_MIT_UNGUELTIGEM,
  ANTWORT_NUR_MUELL,
} from '@/lib/flights/duffel/fixtures/angebote'
import { duffelAngebotMappen, duffelAntwortMappen } from '@/lib/flights/duffel/mapping'
import { betragAusText } from '@/lib/flights/zeit'

describe('Duffel → FlugOption', () => {
  test('ein Direktflug behält lokale Zeiten und den Preis', () => {
    const option = duffelAngebotMappen(ANGEBOT_DIREKT)
    assert.ok(option)
    assert.equal(option?.airline, 'LX')
    assert.equal(option?.airlineName, 'SWISS')
    assert.equal(option?.stops, 0)
    assert.equal(option?.priceAmount, 892.5)
    assert.equal(option?.priceCurrency, 'CHF')
    assert.equal(option?.legs[0]?.segments[0]?.departureTime, '09:15')
    assert.equal(option?.legs[0]?.segments[0]?.arrivalTime, '23:45')
    assert.equal(option?.baggage?.checkedBags, 1)
    assert.equal(option?.refundable, false)
    assert.equal(option?.provider, 'duffel')
  })

  test('ein Stopp ergibt zwei Segmente und einen Stopp', () => {
    const option = duffelAngebotMappen(ANGEBOT_MIT_STOPP)
    assert.ok(option)
    assert.equal(option?.legs[0]?.segments.length, 2)
    assert.equal(option?.stops, 1)
    assert.equal(option?.legs[0]?.segments[0]?.destination, 'LHR')
    assert.equal(option?.legs[0]?.segments[1]?.origin, 'LHR')
    assert.equal(option?.legs[0]?.segments[0]?.operatingAirline, 'BA')
  })

  test('Multi-Leg bleibt zwei Teilstrecken', () => {
    const option = duffelAngebotMappen(ANGEBOT_RUECKFLUG)
    assert.ok(option)
    assert.equal(option?.legs.length, 2)
    assert.equal(option?.legs[0]?.segments[0]?.origin, 'ZRH')
    assert.equal(option?.legs[1]?.segments[0]?.origin, 'BKK')
    assert.equal(option?.priceAmount, 1640)
  })

  test('Dezimalpreise bleiben auf Rappen genau', () => {
    assert.equal(betragAusText('892.50'), 892.5)
    assert.equal(betragAusText('892.5'), 892.5)
    assert.equal(betragAusText('10.999'), null)
    assert.equal(betragAusText('abc'), null)
  })

  test('Ortszeit mit Offset bleibt die lokale Uhr, keine Umrechnung', () => {
    const option = duffelAngebotMappen({
      ...ANGEBOT_DIREKT,
      slices: [
        {
          ...ANGEBOT_DIREKT.slices[0],
          segments: [
            {
              ...ANGEBOT_DIREKT.slices[0]!.segments[0],
              departing_at: '2026-11-01T09:15:00+02:00',
              arriving_at: '2026-11-01T23:45:00+07:00',
            },
          ],
        },
      ],
    })
    assert.equal(option?.legs[0]?.segments[0]?.departureTime, '09:15')
    assert.equal(option?.legs[0]?.segments[0]?.arrivalTime, '23:45')
  })

  test('eine gemischte Antwort liefert alle gültigen Angebote', () => {
    const { options, partial, invalid } = duffelAntwortMappen(ANTWORT_GEMISCHT)
    assert.equal(options.length, 3)
    assert.equal(partial, false)
    assert.equal(invalid, false)
  })

  test('ungültige Angebote werden verworfen, gültige bleiben (partial)', () => {
    const { options, partial } = duffelAntwortMappen(ANTWORT_MIT_UNGUELTIGEM)
    assert.equal(options.length, 2)
    assert.equal(partial, true)
  })

  test('nur unbrauchbare Angebote sind invalid', () => {
    const { options, invalid } = duffelAntwortMappen(ANTWORT_NUR_MUELL)
    assert.equal(options.length, 0)
    assert.equal(invalid, true)
  })

  test('die gemappte Option enthält keine Duffel-Rohfelder', () => {
    const option = duffelAngebotMappen(ANGEBOT_DIREKT) as Record<string, unknown>
    assert.equal('slices' in option, false)
    assert.equal('total_amount' in option, false)
    assert.equal('conditions' in option, false)
    assert.equal('owner' in option, false)
  })
})
