import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { airportEventInstantsAufloesen } from '@/lib/flights/airport-event-instant'
import { OPTION_DIREKT, OPTION_GUENSTIG_LANG, SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import type { FlugOption, FlugSegment } from '@/lib/flights/domain'
import {
  FLUG_AIRPORT_EVENT_INSTANT_ISSUES,
  type FlugAirportTimezoneEvidence,
} from '@/lib/flights/provider'
import { optionenBewerten } from '@/lib/flights/ranking'

function segment(
  von: string,
  nach: string,
  abDatum: string,
  abZeit: string,
  anDatum: string,
  anZeit: string,
): FlugSegment {
  return {
    origin: von,
    destination: nach,
    departureDate: abDatum,
    departureTime: abZeit,
    arrivalDate: anDatum,
    arrivalTime: anZeit,
    airline: 'LX',
    airlineName: 'SWISS',
    operatingAirline: 'LX',
    operatingAirlineName: 'SWISS',
    flightNumber: 'LX180',
    durationMinutes: 120,
  }
}

function optionMit(teil: {
  id?: string
  origin?: string
  destination?: string
  departureDate?: string
  departureTime?: string
  arrivalDate?: string
  arrivalTime?: string
  legs?: FlugOption['legs']
}): FlugOption {
  const origin = teil.origin ?? 'ZRH'
  const destination = teil.destination ?? 'BKK'
  return {
    ...OPTION_DIREKT,
    id: teil.id ?? OPTION_DIREKT.id,
    legs:
      teil.legs ??
      [
        {
          segments: [
            segment(
              origin,
              destination,
              teil.departureDate ?? '2026-01-15',
              teil.departureTime ?? '09:15',
              teil.arrivalDate ?? '2026-01-15',
              teil.arrivalTime ?? '23:45',
            ),
          ],
          durationMinutes: 120,
          stops: 0,
        },
      ],
  }
}

function evidence(
  optionId: string,
  teil: Partial<FlugAirportTimezoneEvidence> & Pick<FlugAirportTimezoneEvidence, 'endpoint' | 'iata' | 'timeZone'>,
): FlugAirportTimezoneEvidence {
  return {
    optionId,
    legIndex: 0,
    segmentIndex: 0,
    ...teil,
  }
}

function aufloesen(option: FlugOption, ...eintraege: FlugAirportTimezoneEvidence[]) {
  return airportEventInstantsAufloesen({
    options: [option],
    airportTimezoneEvidence: eintraege,
  })
}

describe('Airport-Event-Instant – Zivilzeit', () => {
  test('Europe/Zurich Winter-Normalzeit ergibt den korrekten UTC-Instant', () => {
    const option = optionMit({ departureDate: '2026-01-15', departureTime: '09:15' })
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich' }),
    )
    assert.deepEqual(airportEventInstantIssues, [])
    assert.deepEqual(airportEventInstantEvidence, [
      {
        optionId: option.id,
        legIndex: 0,
        segmentIndex: 0,
        endpoint: 'departure',
        iata: 'ZRH',
        timeZone: 'Europe/Zurich',
        instant: '2026-01-15T08:15:00Z',
      },
    ])
  })

  test('Europe/Zurich Sommerzeit ergibt den korrekten UTC-Instant', () => {
    const option = optionMit({ departureDate: '2026-07-15', departureTime: '09:15' })
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich' }),
    )
    assert.deepEqual(airportEventInstantIssues, [])
    assert.equal(airportEventInstantEvidence[0]?.instant, '2026-07-15T07:15:00Z')
  })

  test('nicht-ganzstündige Zone Asia/Kathmandu ergibt den korrekten UTC-Instant', () => {
    const option = optionMit({
      origin: 'KTM',
      departureDate: '2026-01-15',
      departureTime: '09:15',
    })
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'KTM', timeZone: 'Asia/Kathmandu' }),
    )
    assert.deepEqual(airportEventInstantIssues, [])
    assert.equal(airportEventInstantEvidence[0]?.instant, '2026-01-15T03:30:00Z')
  })

  test('Pacific/Chatham (+12:45) bleibt offset-genau', () => {
    const option = optionMit({
      origin: 'CHT',
      departureDate: '2026-01-15',
      departureTime: '09:15',
    })
    const { airportEventInstantEvidence } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'CHT', timeZone: 'Pacific/Chatham' }),
    )
    assert.equal(airportEventInstantEvidence[0]?.instant, '2026-01-14T19:30:00Z')
  })

  test('Europe/Zurich DST-Lücke 02:30 erzeugt keinen Instant', () => {
    const option = optionMit({ departureDate: '2026-03-29', departureTime: '02:30' })
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich' }),
    )
    assert.deepEqual(airportEventInstantEvidence, [])
    assert.equal(airportEventInstantIssues[0]?.issue, 'nonexistent_local_time')
    assert.equal(airportEventInstantIssues.length, 1)
  })

  test('Europe/Zurich DST-Overlap 02:30 erzeugt keinen Instant und wählt keinen der beiden', () => {
    const option = optionMit({ departureDate: '2026-10-25', departureTime: '02:30' })
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich' }),
    )
    assert.deepEqual(airportEventInstantEvidence, [])
    assert.equal(airportEventInstantIssues[0]?.issue, 'ambiguous_local_time')
    assert.equal(JSON.stringify(airportEventInstantEvidence).includes('2026-10-25T00:30:00Z'), false)
    assert.equal(JSON.stringify(airportEventInstantEvidence).includes('2026-10-25T01:30:00Z'), false)
  })

  test('Lord-Howe 30-Minuten-DST-Lücke und Overlap bleiben fail-closed', () => {
    const luecke = optionMit({
      id: 'luecke',
      origin: 'LDH',
      departureDate: '2026-10-04',
      departureTime: '02:15',
    })
    const overlap = optionMit({
      id: 'overlap',
      origin: 'LDH',
      departureDate: '2026-04-05',
      departureTime: '01:45',
    })
    const lueckeErgebnis = aufloesen(
      luecke,
      evidence(luecke.id, { endpoint: 'departure', iata: 'LDH', timeZone: 'Australia/Lord_Howe' }),
    )
    const overlapErgebnis = aufloesen(
      overlap,
      evidence(overlap.id, { endpoint: 'departure', iata: 'LDH', timeZone: 'Australia/Lord_Howe' }),
    )
    assert.deepEqual(lueckeErgebnis.airportEventInstantEvidence, [])
    assert.equal(lueckeErgebnis.airportEventInstantIssues[0]?.issue, 'nonexistent_local_time')
    assert.deepEqual(overlapErgebnis.airportEventInstantEvidence, [])
    assert.equal(overlapErgebnis.airportEventInstantIssues[0]?.issue, 'ambiguous_local_time')
  })

  test('ungültiges Kalenderdatum erzeugt keinen Instant', () => {
    const option = optionMit({ departureDate: '2026-02-30', departureTime: '09:15' })
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich' }),
    )
    assert.deepEqual(airportEventInstantEvidence, [])
    assert.equal(airportEventInstantIssues[0]?.issue, 'invalid_local_date_time')
  })

  test('ungültige Uhrzeit erzeugt keinen Instant', () => {
    const faelle = ['24:00', '09:60', '25:15', '9:15', '09:15:00']
    for (const departureTime of faelle) {
      const option = optionMit({ departureDate: '2026-01-15', departureTime })
      const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
        option,
        evidence(option.id, { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich' }),
      )
      assert.deepEqual(airportEventInstantEvidence, [], departureTime)
      assert.equal(airportEventInstantIssues[0]?.issue, 'invalid_local_date_time', departureTime)
    }
  })

  test('derselbe Instant entsteht unabhängig von process.env.TZ', () => {
    const option = optionMit({ departureDate: '2026-01-15', departureTime: '09:15' })
    const evidenceEintrag = evidence(option.id, {
      endpoint: 'departure',
      iata: 'ZRH',
      timeZone: 'Europe/Zurich',
    })
    const vorherTz = process.env.TZ
    process.env.TZ = 'UTC'
    const utc = aufloesen(option, evidenceEintrag)
    process.env.TZ = 'Pacific/Auckland'
    const auckland = aufloesen(option, evidenceEintrag)
    process.env.TZ = 'America/New_York'
    const newYork = aufloesen(option, evidenceEintrag)
    if (vorherTz === undefined) delete process.env.TZ
    else process.env.TZ = vorherTz

    assert.equal(utc.airportEventInstantEvidence[0]?.instant, '2026-01-15T08:15:00Z')
    assert.deepEqual(utc.airportEventInstantEvidence, auckland.airportEventInstantEvidence)
    assert.deepEqual(utc.airportEventInstantEvidence, newYork.airportEventInstantEvidence)
  })
})

describe('Airport-Event-Instant – Identity / Bindung', () => {
  test('optionId-Mismatch erzeugt keinen Instant', () => {
    const option = optionMit({})
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence('andere-option', { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich' }),
    )
    assert.deepEqual(airportEventInstantEvidence, [])
    assert.equal(airportEventInstantIssues[0]?.issue, 'evidence_mismatch')
  })

  test('ungültiger legIndex erzeugt keinen Instant', () => {
    const option = optionMit({})
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich', legIndex: 4 }),
    )
    assert.deepEqual(airportEventInstantEvidence, [])
    assert.equal(airportEventInstantIssues[0]?.issue, 'evidence_mismatch')
  })

  test('ungültiger segmentIndex erzeugt keinen Instant', () => {
    const option = optionMit({})
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich', segmentIndex: 1 }),
    )
    assert.deepEqual(airportEventInstantEvidence, [])
    assert.equal(airportEventInstantIssues[0]?.issue, 'evidence_mismatch')
  })

  test('Departure-IATA-Mismatch erzeugt keinen Instant', () => {
    const option = optionMit({ origin: 'ZRH', destination: 'BKK' })
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'BKK', timeZone: 'Europe/Zurich' }),
    )
    assert.deepEqual(airportEventInstantEvidence, [])
    assert.equal(airportEventInstantIssues[0]?.issue, 'evidence_mismatch')
  })

  test('Arrival-IATA-Mismatch erzeugt keinen Instant', () => {
    const option = optionMit({ origin: 'ZRH', destination: 'BKK' })
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'arrival', iata: 'ZRH', timeZone: 'Asia/Bangkok' }),
    )
    assert.deepEqual(airportEventInstantEvidence, [])
    assert.equal(airportEventInstantIssues[0]?.issue, 'evidence_mismatch')
  })

  test('Departure benutzt ausschließlich origin und departure date/time', () => {
    const option = optionMit({
      origin: 'ZRH',
      destination: 'BKK',
      departureDate: '2026-01-15',
      departureTime: '09:15',
      arrivalDate: '2026-03-29',
      arrivalTime: '02:30',
    })
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich' }),
    )
    assert.deepEqual(airportEventInstantIssues, [])
    assert.equal(airportEventInstantEvidence[0]?.instant, '2026-01-15T08:15:00Z')
    assert.equal(airportEventInstantEvidence[0]?.iata, 'ZRH')
  })

  test('Arrival benutzt ausschließlich destination und arrival date/time', () => {
    const option = optionMit({
      origin: 'ZRH',
      destination: 'BKK',
      departureDate: '2026-03-29',
      departureTime: '02:30',
      arrivalDate: '2026-01-15',
      arrivalTime: '23:45',
    })
    const { airportEventInstantEvidence, airportEventInstantIssues } = aufloesen(
      option,
      evidence(option.id, { endpoint: 'arrival', iata: 'BKK', timeZone: 'Asia/Bangkok' }),
    )
    assert.deepEqual(airportEventInstantIssues, [])
    assert.equal(airportEventInstantEvidence[0]?.instant, '2026-01-15T16:45:00Z')
    assert.equal(airportEventInstantEvidence[0]?.iata, 'BKK')
  })

  test('Multi-Leg/Multi-Segment bleibt exakt zugeordnet', () => {
    const option: FlugOption = {
      ...OPTION_GUENSTIG_LANG,
      legs: [
        {
          ...OPTION_GUENSTIG_LANG.legs[0]!,
          segments: [
            {
              ...OPTION_GUENSTIG_LANG.legs[0]!.segments[0]!,
              departureDate: '2026-01-15',
              departureTime: '05:10',
              arrivalDate: '2026-01-15',
              arrivalTime: '06:05',
            },
            {
              ...OPTION_GUENSTIG_LANG.legs[0]!.segments[1]!,
              departureDate: '2026-01-15',
              departureTime: '10:40',
              arrivalDate: '2026-01-16',
              arrivalTime: '05:55',
            },
          ],
        },
      ],
    }
    const { airportEventInstantEvidence, airportEventInstantIssues } = airportEventInstantsAufloesen({
      options: [option],
      airportTimezoneEvidence: [
        evidence(option.id, {
          endpoint: 'departure',
          iata: 'ZRH',
          timeZone: 'Europe/Zurich',
          legIndex: 0,
          segmentIndex: 0,
        }),
        evidence(option.id, {
          endpoint: 'arrival',
          iata: 'LHR',
          timeZone: 'Europe/London',
          legIndex: 0,
          segmentIndex: 0,
        }),
        evidence(option.id, {
          endpoint: 'departure',
          iata: 'LHR',
          timeZone: 'Europe/London',
          legIndex: 0,
          segmentIndex: 1,
        }),
        evidence(option.id, {
          endpoint: 'arrival',
          iata: 'BKK',
          timeZone: 'Asia/Bangkok',
          legIndex: 0,
          segmentIndex: 1,
        }),
      ],
    })
    assert.deepEqual(airportEventInstantIssues, [])
    assert.deepEqual(
      airportEventInstantEvidence.map((eintrag) => [
        eintrag.segmentIndex,
        eintrag.endpoint,
        eintrag.iata,
        eintrag.instant,
      ]),
      [
        [0, 'departure', 'ZRH', '2026-01-15T04:10:00Z'],
        [0, 'arrival', 'LHR', '2026-01-15T06:05:00Z'],
        [1, 'departure', 'LHR', '2026-01-15T10:40:00Z'],
        [1, 'arrival', 'BKK', '2026-01-15T22:55:00Z'],
      ],
    )
  })

  test('Option-Reihenfolge und Ranking vertauschen Evidence nicht', () => {
    const zuerich = optionMit({
      id: 'zrh-opt',
      departureDate: '2026-01-15',
      departureTime: '09:15',
    })
    const bangkok = optionMit({
      id: 'bkk-opt',
      origin: 'BKK',
      destination: 'ZRH',
      departureDate: '2026-01-15',
      departureTime: '23:45',
    })
    const evidenceSaetze = [
      evidence(zuerich.id, { endpoint: 'departure', iata: 'ZRH', timeZone: 'Europe/Zurich' }),
      evidence(bangkok.id, { endpoint: 'departure', iata: 'BKK', timeZone: 'Asia/Bangkok' }),
    ]
    const vorwaerts = airportEventInstantsAufloesen({
      options: [zuerich, bangkok],
      airportTimezoneEvidence: evidenceSaetze,
    })
    const rueckwaerts = airportEventInstantsAufloesen({
      options: [bangkok, zuerich],
      airportTimezoneEvidence: [...evidenceSaetze].reverse(),
    })
    const instantFuer = (
      satz: ReturnType<typeof airportEventInstantsAufloesen>,
      optionId: string,
    ) => satz.airportEventInstantEvidence.find((eintrag) => eintrag.optionId === optionId)?.instant

    assert.equal(instantFuer(vorwaerts, zuerich.id), '2026-01-15T08:15:00Z')
    assert.equal(instantFuer(vorwaerts, bangkok.id), '2026-01-15T16:45:00Z')
    assert.equal(instantFuer(rueckwaerts, zuerich.id), '2026-01-15T08:15:00Z')
    assert.equal(instantFuer(rueckwaerts, bangkok.id), '2026-01-15T16:45:00Z')

    const bewertet = optionenBewerten([bangkok, zuerich], SUCHANFRAGE)
    assert.equal(instantFuer(vorwaerts, bewertet.find((option) => option.id === zuerich.id)!.id), '2026-01-15T08:15:00Z')
    assert.equal(instantFuer(vorwaerts, bewertet.find((option) => option.id === bangkok.id)!.id), '2026-01-15T16:45:00Z')
  })

  test('fehlende Timezone-Evidence erzeugt keinen Instant und keine Inferenz', () => {
    const option = optionMit({})
    const { airportEventInstantEvidence, airportEventInstantIssues } = airportEventInstantsAufloesen({
      options: [option],
      airportTimezoneEvidence: [],
    })
    assert.deepEqual(airportEventInstantEvidence, [])
    assert.deepEqual(airportEventInstantIssues, [])
  })

  test('ungültige Timezone erzeugt Issue, verwirft die Option nicht', () => {
    const option = optionMit({})
    const { airportEventInstantEvidence, airportEventInstantIssues } = airportEventInstantsAufloesen({
      options: [option],
      airportTimezoneEvidence: [
        evidence(option.id, { endpoint: 'departure', iata: 'ZRH', timeZone: '+02:00' }),
      ],
    })
    assert.deepEqual(airportEventInstantEvidence, [])
    assert.equal(airportEventInstantIssues[0]?.issue, 'invalid_time_zone')
    assert.equal(option.priceAmount, 892.5)
  })

  test('Issue-Arten bleiben die verbindliche geschlossene Menge', () => {
    assert.deepEqual([...FLUG_AIRPORT_EVENT_INSTANT_ISSUES], [
      'invalid_local_date_time',
      'nonexistent_local_time',
      'ambiguous_local_time',
      'evidence_mismatch',
      'invalid_time_zone',
    ])
  })
})
