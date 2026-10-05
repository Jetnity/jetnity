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
import { SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import { optionenBewerten } from '@/lib/flights/ranking'
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

function ortMitZone(code: string, time_zone: unknown) {
  return { iata_code: code, time_zone }
}

function direktMitZonen(teil: { origin?: unknown; destination?: unknown; originString?: string; destinationString?: string }) {
  const basis = ANGEBOT_DIREKT.slices[0]!.segments[0]!
  return {
    ...ANGEBOT_DIREKT,
    slices: [
      {
        ...ANGEBOT_DIREKT.slices[0],
        segments: [
          {
            ...basis,
            origin: teil.originString ?? teil.origin ?? basis.origin,
            destination: teil.destinationString ?? teil.destination ?? basis.destination,
          },
        ],
      },
    ],
  }
}

describe('Duffel → flüchtige Airport-Timezone-Evidence', () => {
  test('strukturierter Origin mit gültigem time_zone ergibt Departure-Evidence', () => {
    const { options, airportTimezoneEvidence, partial, invalid } = duffelAntwortMappen({
      data: { offers: [direktMitZonen({ origin: ortMitZone('ZRH', 'Europe/Zurich') })] },
    })
    assert.equal(options.length, 1)
    assert.equal(partial, false)
    assert.equal(invalid, false)
    assert.deepEqual(airportTimezoneEvidence, [
      {
        optionId: options[0]!.id,
        legIndex: 0,
        segmentIndex: 0,
        endpoint: 'departure',
        iata: 'ZRH',
        timeZone: 'Europe/Zurich',
      },
    ])
    assert.equal(options[0]!.legs[0]!.segments[0]!.departureTime, '09:15')
    assert.equal('timeZone' in (options[0]!.legs[0]!.segments[0] as object), false)
    assert.equal('departureTimezone' in (options[0] as object), false)
  })

  test('strukturierte Destination mit gültigem time_zone ergibt Arrival-Evidence', () => {
    const { options, airportTimezoneEvidence } = duffelAntwortMappen({
      data: { offers: [direktMitZonen({ destination: ortMitZone('BKK', 'Asia/Bangkok') })] },
    })
    assert.deepEqual(airportTimezoneEvidence, [
      {
        optionId: options[0]!.id,
        legIndex: 0,
        segmentIndex: 0,
        endpoint: 'arrival',
        iata: 'BKK',
        timeZone: 'Asia/Bangkok',
      },
    ])
    assert.equal(options[0]!.legs[0]!.segments[0]!.arrivalTime, '23:45')
  })

  test('IATA-String liefert niemals Timezone-Evidence', () => {
    const { options, airportTimezoneEvidence } = duffelAntwortMappen({
      data: {
        offers: [
          direktMitZonen({
            originString: 'ZRH',
            destinationString: 'BKK',
          }),
        ],
      },
    })
    assert.equal(options.length, 1)
    assert.deepEqual(airportTimezoneEvidence, [])
  })

  test('fehlendes time_zone erzeugt keine Evidence und keine Inferenz', () => {
    const { options, airportTimezoneEvidence } = duffelAntwortMappen({
      data: { offers: [ANGEBOT_DIREKT] },
    })
    assert.equal(options.length, 1)
    assert.deepEqual(airportTimezoneEvidence, [])
  })

  test('invalid / Offset / Z / Whitespace / unbounded erzeugen keine Evidence', () => {
    const faelle = ['+02:00', 'Z', ' Europe/Zurich', 'x'.repeat(65), '../Europe/Zurich', 12, { name: 'Zurich' }]
    for (const time_zone of faelle) {
      const { options, airportTimezoneEvidence } = duffelAntwortMappen({
        data: { offers: [direktMitZonen({ origin: ortMitZone('ZRH', time_zone) })] },
      })
      assert.equal(options.length, 1, `Offer muss bei ${String(time_zone)} gültig bleiben`)
      assert.deepEqual(airportTimezoneEvidence, [])
      assert.equal(options[0]!.legs[0]!.segments[0]!.departureTime, '09:15')
      assert.equal(options[0]!.legs[0]!.segments[0]!.arrivalTime, '23:45')
    }
  })

  test('ungültige Timezone verwirft kein sonst gültiges Offer', () => {
    const option = duffelAngebotMappen(direktMitZonen({ origin: ortMitZone('ZRH', '+02:00') }))
    assert.ok(option)
    assert.equal(option?.priceAmount, 892.5)
    assert.equal(option?.legs[0]?.segments[0]?.origin, 'ZRH')
  })

  test('Multi-Segment bindet Evidence an exakten Leg/Segment/Endpunkt/IATA', () => {
    const angebot = {
      ...ANGEBOT_MIT_STOPP,
      slices: [
        {
          ...ANGEBOT_MIT_STOPP.slices[0],
          segments: [
            {
              ...ANGEBOT_MIT_STOPP.slices[0]!.segments[0],
              origin: ortMitZone('ZRH', 'Europe/Zurich'),
              destination: ortMitZone('LHR', 'Europe/London'),
            },
            {
              ...ANGEBOT_MIT_STOPP.slices[0]!.segments[1],
              origin: ortMitZone('LHR', 'Europe/London'),
              destination: ortMitZone('BKK', 'Asia/Bangkok'),
            },
          ],
        },
      ],
    }
    const { options, airportTimezoneEvidence } = duffelAntwortMappen({ data: { offers: [angebot] } })
    assert.equal(options.length, 1)
    assert.deepEqual(
      airportTimezoneEvidence.map((eintrag) => [
        eintrag.legIndex,
        eintrag.segmentIndex,
        eintrag.endpoint,
        eintrag.iata,
        eintrag.timeZone,
      ]),
      [
        [0, 0, 'departure', 'ZRH', 'Europe/Zurich'],
        [0, 0, 'arrival', 'LHR', 'Europe/London'],
        [0, 1, 'departure', 'LHR', 'Europe/London'],
        [0, 1, 'arrival', 'BKK', 'Asia/Bangkok'],
      ],
    )
    assert.equal(airportTimezoneEvidence.every((eintrag) => eintrag.optionId === options[0]!.id), true)
  })

  test('Multi-Leg verwechselt keine Endpunkte über Legs hinweg', () => {
    const angebot = {
      ...ANGEBOT_RUECKFLUG,
      slices: [
        {
          ...ANGEBOT_RUECKFLUG.slices[0],
          segments: [
            {
              ...ANGEBOT_RUECKFLUG.slices[0]!.segments[0],
              origin: ortMitZone('ZRH', 'Europe/Zurich'),
              destination: ortMitZone('BKK', 'Asia/Bangkok'),
            },
          ],
        },
        {
          ...ANGEBOT_RUECKFLUG.slices[1],
          segments: [
            {
              ...ANGEBOT_RUECKFLUG.slices[1]!.segments[0],
              origin: ortMitZone('BKK', 'Asia/Bangkok'),
              destination: ortMitZone('ZRH', 'Europe/Zurich'),
            },
          ],
        },
      ],
    }
    const { options, airportTimezoneEvidence } = duffelAntwortMappen({ data: { offers: [angebot] } })
    assert.equal(options[0]!.legs.length, 2)
    assert.deepEqual(
      airportTimezoneEvidence.map((eintrag) => [eintrag.legIndex, eintrag.endpoint, eintrag.iata]),
      [
        [0, 'departure', 'ZRH'],
        [0, 'arrival', 'BKK'],
        [1, 'departure', 'BKK'],
        [1, 'arrival', 'ZRH'],
      ],
    )
  })

  test('Option-Reihenfolge hängt Evidence nicht an eine andere Option um', () => {
    const teuer = direktMitZonen({ origin: ortMitZone('ZRH', 'Europe/Zurich') })
    const billig = {
      ...ANGEBOT_MIT_STOPP,
      slices: [
        {
          ...ANGEBOT_MIT_STOPP.slices[0],
          segments: [
            {
              ...ANGEBOT_MIT_STOPP.slices[0]!.segments[0],
              origin: ortMitZone('ZRH', 'Europe/London'),
            },
            ANGEBOT_MIT_STOPP.slices[0]!.segments[1],
          ],
        },
      ],
    }
    const vorwaerts = duffelAntwortMappen({ data: { offers: [teuer, billig] } })
    const rueckwaerts = duffelAntwortMappen({ data: { offers: [billig, teuer] } })
    const zoneFuer = (
      satz: typeof vorwaerts,
      optionId: string,
    ) => satz.airportTimezoneEvidence.find((eintrag) => eintrag.optionId === optionId)?.timeZone
    const teuerId = vorwaerts.options.find((option) => option.priceAmount === 892.5)!.id
    const billigId = vorwaerts.options.find((option) => option.priceAmount === 850)!.id
    assert.equal(zoneFuer(vorwaerts, teuerId), 'Europe/Zurich')
    assert.equal(zoneFuer(vorwaerts, billigId), 'Europe/London')
    assert.equal(zoneFuer(rueckwaerts, teuerId), 'Europe/Zurich')
    assert.equal(zoneFuer(rueckwaerts, billigId), 'Europe/London')
    assert.notEqual(teuerId, billigId)

    const bewertet = optionenBewerten([...vorwaerts.options].reverse(), SUCHANFRAGE)
    assert.equal(zoneFuer(vorwaerts, bewertet.find((option) => option.id === teuerId)!.id), 'Europe/Zurich')
    assert.equal(zoneFuer(vorwaerts, bewertet.find((option) => option.id === billigId)!.id), 'Europe/London')
  })

  test('FlugOption und FlugSegment bleiben timezone-frei', () => {
    const option = duffelAngebotMappen(
      direktMitZonen({
        origin: ortMitZone('ZRH', 'Europe/Zurich'),
        destination: ortMitZone('BKK', 'Asia/Bangkok'),
      }),
    )
    assert.ok(option)
    const roh = JSON.stringify(option)
    assert.equal(/time[_-]?zone|Timezone/i.test(roh), false)
    assert.deepEqual(Object.keys(option!.legs[0]!.segments[0]!).sort(), [
      'airline',
      'airlineName',
      'arrivalDate',
      'arrivalTime',
      'departureDate',
      'departureTime',
      'destination',
      'durationMinutes',
      'flightNumber',
      'operatingAirline',
      'operatingAirlineName',
      'origin',
    ])
  })

  test('partial / invalid bleibt unabhängig von Timezone-Evidence', () => {
    const gemischt = duffelAntwortMappen(ANTWORT_MIT_UNGUELTIGEM)
    assert.equal(gemischt.partial, true)
    assert.equal(gemischt.invalid, false)
    assert.deepEqual(gemischt.airportTimezoneEvidence, [])
    const muell = duffelAntwortMappen(ANTWORT_NUR_MUELL)
    assert.equal(muell.invalid, true)
    assert.deepEqual(muell.airportTimezoneEvidence, [])
  })
})
