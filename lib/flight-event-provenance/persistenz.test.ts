// lib/flight-event-provenance/persistenz.test.ts
//
// E5-B3C Pflichtregressionen. Kein Production-Apply. Kein Writer. Keine Fake-Truth.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { airportEventInstantsAufloesen } from '@/lib/flights/airport-event-instant'
import { OPTION_DIREKT, OPTION_GUENSTIG_LANG } from '@/lib/flights/fixtures/optionen'
import type { FlugOption } from '@/lib/flights/domain'
import {
  leereFlugAirportEventInstantIssues,
  type FlugAirportEventInstantEvidence,
  type FlugAirportTimezoneEvidence,
  type FlugProviderTreffer,
} from '@/lib/flights/provider'
import {
  FLIGHT_EVENT_PERSISTENCE_FEHLER,
  FLIGHT_EVENT_PERSISTENCE_MINT,
  FLIGHT_EVENT_PERSISTENCE_VERTRAG,
  flightEventPersistenzNutzlastIstRohclient,
  flightEventPersistenzNutzlastMinten,
} from '@/lib/flight-event-provenance/persistenz'

const TRIP_ITEM_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
const RETRIEVED_AT = '2026-08-31T12:00:00.000Z'
const FREMDES_RETRIEVED_AT = '1999-01-01T00:00:00.000Z'
const FREMDES_OBSERVED_AT = '1999-12-31T23:59:59.000Z'

const persistenzSrc = readFileSync(join('lib/flight-event-provenance/persistenz.ts'), 'utf8')
const domainSrc = readFileSync(join('lib/flights/domain.ts'), 'utf8')
const providerSrc = readFileSync(join('lib/flights/provider.ts'), 'utf8')
const nachweisSrc = readFileSync(join('lib/flights/nachweis.ts'), 'utf8')
const sucheSrc = readFileSync(join('lib/flights/suche.ts'), 'utf8')
const clientSrc = readFileSync(join('lib/flights/client-sicht.ts'), 'utf8')
const e5b3aSrc = readFileSync(join('lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts'), 'utf8')
const sqlSrc = readFileSync(join('supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql'), 'utf8')
const readinessProviderSrc = readFileSync(join('lib/readiness/provider.ts'), 'utf8')

function timezoneEvidence(
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

function direktTimezone(): FlugAirportTimezoneEvidence[] {
  return [
    timezoneEvidence(OPTION_DIREKT.id, {
      endpoint: 'departure',
      iata: 'ZRH',
      timeZone: 'Europe/Zurich',
    }),
    timezoneEvidence(OPTION_DIREKT.id, {
      endpoint: 'arrival',
      iata: 'BKK',
      timeZone: 'Asia/Bangkok',
    }),
  ]
}

function guenstigTimezone(): FlugAirportTimezoneEvidence[] {
  return [
    timezoneEvidence(OPTION_GUENSTIG_LANG.id, {
      endpoint: 'departure',
      iata: 'ZRH',
      timeZone: 'Europe/Zurich',
    }),
    timezoneEvidence(OPTION_GUENSTIG_LANG.id, {
      endpoint: 'arrival',
      iata: 'LHR',
      timeZone: 'Europe/London',
    }),
    timezoneEvidence(OPTION_GUENSTIG_LANG.id, {
      legIndex: 0,
      segmentIndex: 1,
      endpoint: 'departure',
      iata: 'LHR',
      timeZone: 'Europe/London',
    }),
    timezoneEvidence(OPTION_GUENSTIG_LANG.id, {
      legIndex: 0,
      segmentIndex: 1,
      endpoint: 'arrival',
      iata: 'BKK',
      timeZone: 'Asia/Bangkok',
    }),
  ]
}

function instantsFuer(
  options: FlugOption[],
  timezone: FlugAirportTimezoneEvidence[],
): FlugAirportEventInstantEvidence[] {
  return airportEventInstantsAufloesen({
    options,
    airportTimezoneEvidence: timezone,
  }).airportEventInstantEvidence
}

function trefferMit(teil: {
  options?: FlugOption[]
  retrievedAt?: string
  airportTimezoneEvidence?: FlugAirportTimezoneEvidence[]
  airportEventInstantEvidence?: FlugAirportEventInstantEvidence[]
  extra?: Record<string, unknown>
}): FlugProviderTreffer {
  const options = teil.options ?? [OPTION_DIREKT]
  const airportTimezoneEvidence = teil.airportTimezoneEvidence ?? direktTimezone()
  const airportEventInstantEvidence =
    teil.airportEventInstantEvidence ?? instantsFuer(options, airportTimezoneEvidence)
  return {
    options,
    partial: false,
    retrievedAt: teil.retrievedAt ?? RETRIEVED_AT,
    airportTimezoneEvidence,
    airportEventInstantEvidence,
    airportEventInstantIssues: leereFlugAirportEventInstantIssues(),
    ...teil.extra,
  } as FlugProviderTreffer
}

function minten(teil: {
  tripItemId?: string
  optionId?: string
  treffer?: FlugProviderTreffer
}) {
  return flightEventPersistenzNutzlastMinten({
    tripItemId: teil.tripItemId ?? TRIP_ITEM_ID,
    optionId: teil.optionId ?? OPTION_DIREKT.id,
    treffer: teil.treffer ?? trefferMit({}),
  })
}

function optionKopie(option: FlugOption, aenderung: Partial<FlugOption> = {}): FlugOption {
  return {
    ...option,
    ...aenderung,
    legs: aenderung.legs ?? option.legs.map((leg) => ({
      ...leg,
      segments: leg.segments.map((segment) => ({ ...segment })),
    })),
  }
}

describe('E5-B3C Persistence-Mint – erfolgreiche Bindung', () => {
  test('1. Direktflug mintet genau Departure + Arrival bei exakter B1R+B2A-Evidence', () => {
    const ergebnis = minten({})
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(ergebnis.unresolved, [])
    assert.equal(ergebnis.nutzlast.vertrag, FLIGHT_EVENT_PERSISTENCE_VERTRAG)
    assert.equal(ergebnis.nutzlast.mint, FLIGHT_EVENT_PERSISTENCE_MINT)
    assert.equal(ergebnis.nutzlast.trip_item_id, TRIP_ITEM_ID)
    assert.equal(ergebnis.nutzlast.domain, 'flights')
    assert.equal(ergebnis.nutzlast.provider_id, OPTION_DIREKT.provider)
    assert.equal(ergebnis.nutzlast.source_kind, 'persisted_snapshot')
    assert.equal(ergebnis.nutzlast.persistenz, 'snapshot')
    assert.equal(ergebnis.nutzlast.source_label, null)
    assert.equal(ergebnis.nutzlast.external_ref, OPTION_DIREKT.externalRef)
    assert.equal(ergebnis.nutzlast.occurrences.length, 2)
    assert.deepEqual(
      ergebnis.nutzlast.occurrences.map((occ) => [occ.leg_index, occ.segment_index, occ.endpoint, occ.iata]),
      [
        [0, 0, 'departure', 'ZRH'],
        [0, 0, 'arrival', 'BKK'],
      ],
    )
    assert.equal(ergebnis.nutzlast.occurrences[0]?.local_date, '2026-11-01')
    assert.equal(ergebnis.nutzlast.occurrences[0]?.local_time, '09:15')
    assert.equal(ergebnis.nutzlast.occurrences[0]?.time_zone, 'Europe/Zurich')
    assert.equal(ergebnis.nutzlast.occurrences[0]?.event_instant, '2026-11-01T08:15:00Z')
    assert.equal(ergebnis.nutzlast.occurrences[1]?.local_date, '2026-11-01')
    assert.equal(ergebnis.nutzlast.occurrences[1]?.local_time, '21:40')
    assert.equal(ergebnis.nutzlast.occurrences[1]?.time_zone, 'Asia/Bangkok')
    assert.equal(ergebnis.nutzlast.occurrences[1]?.event_instant, '2026-11-01T14:40:00Z')
  })

  test('2. Multi-Segment bewahrt deterministische Identität und Reihenfolge', () => {
    const timezone = guenstigTimezone()
    const ergebnis = minten({
      optionId: OPTION_GUENSTIG_LANG.id,
      treffer: trefferMit({
        options: [OPTION_DIREKT, OPTION_GUENSTIG_LANG],
        airportTimezoneEvidence: [...direktTimezone(), ...timezone],
      }),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(
      ergebnis.nutzlast.occurrences.map((occ) => [
        occ.leg_index,
        occ.segment_index,
        occ.endpoint,
        occ.iata,
        occ.local_date,
        occ.local_time,
        occ.time_zone,
      ]),
      [
        [0, 0, 'departure', 'ZRH', '2026-11-01', '05:10', 'Europe/Zurich'],
        [0, 0, 'arrival', 'LHR', '2026-11-01', '06:05', 'Europe/London'],
        [0, 1, 'departure', 'LHR', '2026-11-01', '10:40', 'Europe/London'],
        [0, 1, 'arrival', 'BKK', '2026-11-02', '05:55', 'Asia/Bangkok'],
      ],
    )
  })
})

describe('E5-B3C Persistence-Mint – Fail-closed Identität', () => {
  test('3. Option B konsumiert keine Evidence von Option A', () => {
    const ergebnis = minten({
      optionId: OPTION_GUENSTIG_LANG.id,
      treffer: trefferMit({
        options: [OPTION_DIREKT, OPTION_GUENSTIG_LANG],
        airportTimezoneEvidence: direktTimezone(),
        airportEventInstantEvidence: instantsFuer([OPTION_DIREKT], direktTimezone()),
      }),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(ergebnis.nutzlast.occurrences, [])
    assert.equal(ergebnis.unresolved.length, 4)
    assert.ok(
      ergebnis.unresolved.every((eintrag) => eintrag.code === 'unresolved_occurrence_evidence'),
    )
    assert.ok(ergebnis.unresolved.every((eintrag) => eintrag.optionId === OPTION_GUENSTIG_LANG.id))
  })

  test('4. Doppelte selected option-id schlägt fehl, kein first-match', () => {
    const ergebnis = minten({
      treffer: trefferMit({
        options: [OPTION_DIREKT, optionKopie(OPTION_DIREKT, { externalRef: 'andere-ref' })],
      }),
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler[0]?.code, 'selected_option_ambiguous')
  })

  test('fehlende selected option schlägt fehl', () => {
    const ergebnis = minten({ optionId: 'gibt-es-nicht' })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler[0]?.code, 'selected_option_missing')
  })

  test('5. Falsche B1R-Identität bindet nicht', () => {
    const timezone = [
      timezoneEvidence(OPTION_DIREKT.id, {
        endpoint: 'departure',
        iata: 'ZRH',
        timeZone: 'Europe/Zurich',
        legIndex: 1,
      }),
      timezoneEvidence(OPTION_DIREKT.id, {
        endpoint: 'arrival',
        iata: 'BKK',
        timeZone: 'Asia/Bangkok',
        segmentIndex: 4,
      }),
    ]
    const ergebnis = minten({
      treffer: trefferMit({
        airportTimezoneEvidence: timezone,
        airportEventInstantEvidence: instantsFuer([OPTION_DIREKT], direktTimezone()),
      }),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(ergebnis.nutzlast.occurrences, [])
    assert.ok(ergebnis.unresolved.every((eintrag) => eintrag.code === 'unresolved_occurrence_evidence'))
  })

  test('6. Falsche B2A-Identität bindet nicht', () => {
    const timezone = direktTimezone()
    const instants = instantsFuer([OPTION_DIREKT], timezone).map((eintrag) => ({
      ...eintrag,
      legIndex: eintrag.legIndex + 3,
    }))
    const ergebnis = minten({
      treffer: trefferMit({
        airportTimezoneEvidence: timezone,
        airportEventInstantEvidence: instants,
      }),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(ergebnis.nutzlast.occurrences, [])
    assert.ok(ergebnis.unresolved.every((eintrag) => eintrag.code === 'unresolved_occurrence_evidence'))
  })

  test('falsche IATA an sonst gleicher Identität ist identity mismatch', () => {
    const timezone = [
      timezoneEvidence(OPTION_DIREKT.id, {
        endpoint: 'departure',
        iata: 'FRA',
        timeZone: 'Europe/Zurich',
      }),
      timezoneEvidence(OPTION_DIREKT.id, {
        endpoint: 'arrival',
        iata: 'BKK',
        timeZone: 'Asia/Bangkok',
      }),
    ]
    const instants = instantsFuer(
      [OPTION_DIREKT],
      [
        timezoneEvidence(OPTION_DIREKT.id, {
          endpoint: 'departure',
          iata: 'ZRH',
          timeZone: 'Europe/Zurich',
        }),
        timezone[1]!,
      ],
    )
    const ergebnis = minten({
      treffer: trefferMit({
        airportTimezoneEvidence: timezone,
        airportEventInstantEvidence: instants,
      }),
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.ok(ergebnis.fehler.some((eintrag) => eintrag.code === 'occurrence_identity_mismatch'))
    assert.ok(!ergebnis.fehler.some((eintrag) => eintrag.code === 'duplicate_timezone_evidence'))
  })
})

describe('E5-B3C Persistence-Mint – Evidence-Konflikte', () => {
  test('7. Doppelte/konfligierende B1R-Evidence schlägt fehl, kein first-match', () => {
    const timezone = [
      ...direktTimezone(),
      timezoneEvidence(OPTION_DIREKT.id, {
        endpoint: 'departure',
        iata: 'ZRH',
        timeZone: 'Europe/Berlin',
      }),
    ]
    const ergebnis = minten({
      treffer: trefferMit({
        airportTimezoneEvidence: timezone,
        airportEventInstantEvidence: instantsFuer([OPTION_DIREKT], direktTimezone()),
      }),
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.deepEqual(
      ergebnis.fehler.filter((eintrag) => eintrag.code === 'duplicate_timezone_evidence').map((eintrag) => eintrag.endpoint),
      ['departure'],
    )
  })

  test('identische doppelte B1R-Zeilen sind trotzdem kein first-match', () => {
    const timezone = [...direktTimezone(), direktTimezone()[0]!]
    const ergebnis = minten({
      treffer: trefferMit({
        airportTimezoneEvidence: timezone,
        airportEventInstantEvidence: instantsFuer([OPTION_DIREKT], direktTimezone()),
      }),
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler[0]?.code, 'duplicate_timezone_evidence')
  })

  test('8. Doppelte/konfligierende B2A-Evidence schlägt fehl, kein first-match', () => {
    const timezone = direktTimezone()
    const instants = instantsFuer([OPTION_DIREKT], timezone)
    const ergebnis = minten({
      treffer: trefferMit({
        airportTimezoneEvidence: timezone,
        airportEventInstantEvidence: [
          ...instants,
          { ...instants[0]!, instant: '2020-01-01T00:00:00Z' },
        ],
      }),
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler[0]?.code, 'duplicate_event_instant_evidence')
  })

  test('9. B1R/B2A-Timezone-Widerspruch schlägt fehl', () => {
    const timezone = direktTimezone()
    const instants = instantsFuer([OPTION_DIREKT], timezone).map((eintrag, index) =>
      index === 0 ? { ...eintrag, timeZone: 'Europe/Berlin' } : eintrag,
    )
    const ergebnis = minten({
      treffer: trefferMit({
        airportTimezoneEvidence: timezone,
        airportEventInstantEvidence: instants,
      }),
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler[0]?.code, 'timezone_instant_evidence_mismatch')
  })
})

describe('E5-B3C Persistence-Mint – lokale Wanduhr und Observation', () => {
  test('10. local_date/local_time kommen nur vom ausgewählten Segment-Endpunkt', () => {
    const option = optionKopie(OPTION_DIREKT)
    option.legs[0]!.segments[0] = {
      ...option.legs[0]!.segments[0]!,
      departureDate: '2026-11-03',
      departureTime: '11:45',
      arrivalDate: '2026-11-04',
      arrivalTime: '02:05',
    }
    const timezone = direktTimezone()
    const ergebnis = minten({
      treffer: trefferMit({
        options: [option],
        airportTimezoneEvidence: timezone,
        airportEventInstantEvidence: instantsFuer([option], timezone),
      }),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.nutzlast.occurrences[0]?.local_date, '2026-11-03')
    assert.equal(ergebnis.nutzlast.occurrences[0]?.local_time, '11:45')
    assert.equal(ergebnis.nutzlast.occurrences[1]?.local_date, '2026-11-04')
    assert.equal(ergebnis.nutzlast.occurrences[1]?.local_time, '02:05')
    assert.notEqual(ergebnis.nutzlast.occurrences[0]?.local_date, OPTION_DIREKT.legs[0]?.segments[0]?.departureDate)
  })

  test('11. kein Z an lokale Wanduhr und keine Zeitzonen-Neurechnung', () => {
    const ergebnis = minten({})
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    for (const occ of ergebnis.nutzlast.occurrences) {
      assert.equal(occ.local_date.includes('T'), false)
      assert.equal(occ.local_date.endsWith('Z'), false)
      assert.equal(occ.local_time.includes('Z'), false)
      assert.equal(occ.local_time.includes('T'), false)
      assert.notEqual(occ.event_instant, `${occ.local_date}T${occ.local_time}Z`)
    }
    assert.doesNotMatch(persistenzSrc, /\|\|\s*['"]Z['"]/)
    assert.doesNotMatch(persistenzSrc, /\+\s*['"]Z['"]/)
    assert.doesNotMatch(persistenzSrc, /airportEventInstantsAufloesen/)
    assert.doesNotMatch(persistenzSrc, /Intl\.DateTimeFormat/)
    assert.doesNotMatch(persistenzSrc, /temporal-projection/)
  })

  test('12. retrieved_at === observed_at === treffer.retrievedAt', () => {
    const ergebnis = minten({})
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.nutzlast.retrieved_at, RETRIEVED_AT)
    assert.equal(ergebnis.nutzlast.observed_at, RETRIEVED_AT)
    assert.equal(ergebnis.nutzlast.retrieved_at, ergebnis.nutzlast.observed_at)
  })

  test('13. timestamp-ähnliche Payload-Felder ersetzen retrievedAt nicht', () => {
    const option = {
      ...OPTION_DIREKT,
      retrievedAt: FREMDES_RETRIEVED_AT,
      retrieved_at: FREMDES_RETRIEVED_AT,
      observedAt: FREMDES_OBSERVED_AT,
      observed_at: FREMDES_OBSERVED_AT,
    } as FlugOption
    const ergebnis = minten({
      treffer: trefferMit({
        options: [option],
        extra: {
          retrieved_at: FREMDES_RETRIEVED_AT,
          observedAt: FREMDES_OBSERVED_AT,
          observed_at: FREMDES_OBSERVED_AT,
          freshUntil: '2099-01-01T00:00:00.000Z',
        },
      }),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.nutzlast.retrieved_at, RETRIEVED_AT)
    assert.equal(ergebnis.nutzlast.observed_at, RETRIEVED_AT)
    assert.notEqual(ergebnis.nutzlast.retrieved_at, FREMDES_RETRIEVED_AT)
    assert.notEqual(ergebnis.nutzlast.observed_at, FREMDES_OBSERVED_AT)
  })

  test('14. kein Date.now(); identische Eingabe ist deterministisch', () => {
    const original = Date.now
    let nowCalls = 0
    Date.now = () => {
      nowCalls += 1
      return original()
    }
    try {
      const erstes = minten({})
      const zweites = minten({})
      assert.deepEqual(erstes, zweites)
      assert.equal(nowCalls, 0)
    } finally {
      Date.now = original
    }
    const ohneKommentare = persistenzSrc.replace(/\/\/[^\n]*/g, '')
    assert.doesNotMatch(ohneKommentare, /Date\.now\s*\(/)
    assert.doesNotMatch(ohneKommentare, /new Date\(\s*\)/)
  })

  test('15. fresh_until bleibt null', () => {
    const ergebnis = minten({})
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.nutzlast.fresh_until, null)
  })

  test('ungültige lokale Wanduhr am Segment-Endpunkt schlägt fehl', () => {
    const option = optionKopie(OPTION_DIREKT)
    option.legs[0]!.segments[0] = {
      ...option.legs[0]!.segments[0]!,
      departureDate: '2026-02-30',
      departureTime: '09:15',
    }
    const timezone = direktTimezone()
    const ergebnis = minten({
      treffer: trefferMit({
        options: [option],
        airportTimezoneEvidence: timezone,
        airportEventInstantEvidence: [
          {
            optionId: option.id,
            legIndex: 0,
            segmentIndex: 0,
            endpoint: 'departure',
            iata: 'ZRH',
            timeZone: 'Europe/Zurich',
            instant: '2026-02-30T08:15:00Z',
          },
        ],
      }),
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.ok(ergebnis.fehler.some((eintrag) => eintrag.code === 'invalid_local_endpoint_wall_clock'))
  })

  test('ungültiges retrievedAt schlägt fehl', () => {
    const ergebnis = minten({
      treffer: trefferMit({ retrievedAt: '2026-08-31T12:00:00Z' }),
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.fehler[0]?.code, 'invalid_retrieved_at')
  })
})

describe('E5-B3C Persistence-Mint – Partial und leerer Snapshot', () => {
  test('16. fehlender Endpunkt bleibt explizit und erzeugt keine Fake-Occurrence', () => {
    const timezone = [
      timezoneEvidence(OPTION_DIREKT.id, {
        endpoint: 'departure',
        iata: 'ZRH',
        timeZone: 'Europe/Zurich',
      }),
    ]
    const ergebnis = minten({
      treffer: trefferMit({
        airportTimezoneEvidence: timezone,
        airportEventInstantEvidence: instantsFuer([OPTION_DIREKT], timezone),
      }),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.nutzlast.occurrences.length, 1)
    assert.equal(ergebnis.nutzlast.occurrences[0]?.endpoint, 'departure')
    assert.equal(ergebnis.unresolved.length, 1)
    assert.equal(ergebnis.unresolved[0]?.code, 'unresolved_occurrence_evidence')
    assert.equal(ergebnis.unresolved[0]?.endpoint, 'arrival')
    assert.equal(
      ergebnis.nutzlast.occurrences.some((occ) => occ.endpoint === 'arrival'),
      false,
    )
  })

  test('17. null proven Occurrences bleiben explizit und snapshot-clear-fähig', () => {
    const ergebnis = minten({
      treffer: trefferMit({
        airportTimezoneEvidence: [],
        airportEventInstantEvidence: [],
      }),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(ergebnis.nutzlast.occurrences, [])
    assert.equal(ergebnis.unresolved.length, 2)
    assert.ok(ergebnis.unresolved.every((eintrag) => eintrag.code === 'unresolved_occurrence_evidence'))
    assert.equal(flightEventPersistenzNutzlastIstRohclient(ergebnis.nutzlast), false)
  })
})

describe('E5-B3C Persistence-Mint – SQL-Grenzen und Client-Reject', () => {
  test('18. Provider-Id und external_ref folgen den E5-B3A-SQL-Grenzen', () => {
    const zuLang = 'x'.repeat(41)
    const provider = minten({
      treffer: trefferMit({ options: [optionKopie(OPTION_DIREKT, { provider: zuLang })] }),
    })
    assert.equal(provider.ok, false)
    if (!provider.ok) assert.equal(provider.fehler[0]?.code, 'invalid_provider_identity')

    const erfunden = minten({
      treffer: trefferMit({ options: [optionKopie(OPTION_DIREKT, { provider: 'user' })] }),
    })
    assert.equal(erfunden.ok, false)
    if (!erfunden.ok) assert.equal(erfunden.fehler[0]?.code, 'invalid_provider_identity')

    const ref = minten({
      treffer: trefferMit({
        options: [optionKopie(OPTION_DIREKT, { externalRef: 'x'.repeat(201) })],
      }),
    })
    assert.equal(ref.ok, false)
    if (!ref.ok) assert.equal(ref.fehler[0]?.code, 'invalid_external_ref')

    const trip = minten({ tripItemId: 'kein-uuid' })
    assert.equal(trip.ok, false)
    if (!trip.ok) assert.equal(trip.fehler[0]?.code, 'invalid_trip_item_id')

    assert.match(sqlSrc, /char_length\(btrim\(provider_id\)\) between 1 and 40/)
    assert.match(sqlSrc, /char_length\(btrim\(external_ref\)\) between 1 and 200/)
  })

  test('19. TypeScript akzeptiert und mintet keine occurrence_event_ref', () => {
    const ergebnis = minten({})
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal('occurrence_event_ref' in ergebnis.nutzlast, false)
    assert.ok(ergebnis.nutzlast.occurrences.every((occ) => !('occurrence_event_ref' in occ)))
    assert.equal(
      flightEventPersistenzNutzlastIstRohclient({
        ...ergebnis.nutzlast,
        occurrence_event_ref: 'jetnity.flight_event.v1:x',
      }),
      true,
    )
    assert.equal(
      flightEventPersistenzNutzlastIstRohclient({
        ...ergebnis.nutzlast,
        occurrences: [
          {
            ...ergebnis.nutzlast.occurrences[0]!,
            eventRef: 'client-event',
          },
        ],
      }),
      true,
    )
    assert.equal(flightEventPersistenzNutzlastIstRohclient(ergebnis.nutzlast), false)
  })

  test('roher Client-Stil ist kein Persistenzvertrag', () => {
    assert.equal(
      flightEventPersistenzNutzlastIstRohclient({
        sourceKind: 'live_api',
        providerId: 'duffel',
        retrievedAt: RETRIEVED_AT,
        optionId: OPTION_DIREKT.id,
      }),
      true,
    )
    assert.equal(
      flightEventPersistenzNutzlastIstRohclient({
        vertrag: FLIGHT_EVENT_PERSISTENCE_VERTRAG,
        mint: FLIGHT_EVENT_PERSISTENCE_MINT,
        retrievedAt: RETRIEVED_AT,
      }),
      true,
    )
    assert.equal(flightEventPersistenzNutzlastIstRohclient(null), true)
    assert.ok(
      FLIGHT_EVENT_PERSISTENCE_FEHLER.includes('invalid_retrieved_at'),
    )
  })
})

describe('E5-B3C Persistence-Mint – unveränderte Verträge und Grenzen', () => {
  test('20. FlugOption, FlugSegment, Browser-Antwort und Route bleiben unverändert', () => {
    assert.match(domainSrc, /export type FlugSegment = \{/)
    assert.match(domainSrc, /departureDate: string/)
    assert.match(domainSrc, /arrivalTime: string/)
    assert.doesNotMatch(domainSrc, /timeZone|eventInstant|eventRef|time_zone/)
    assert.match(domainSrc, /export type FlugOption = \{/)
    assert.doesNotMatch(sucheSrc, /flightEventPersistenzNutzlastMinten/)
    assert.doesNotMatch(clientSrc, /timeZone|eventInstant|eventRef|retrievedAt/)
    assert.doesNotMatch(persistenzSrc, /from '@\/lib\/route/)
    assert.doesNotMatch(persistenzSrc, /from '@\/lib\/trips/)
  })

  test('21. flugNachweisAusUmgebung bleibt null', () => {
    assert.match(
      nachweisSrc,
      /export function flugNachweisAusUmgebung\(\): FlugNachweis \| null \{\n  return null\n\}/,
    )
    assert.match(
      readinessProviderSrc,
      /export function requirementsProviderAus\(\): RequirementsProvider \| null \{\n  return null\n\}/,
    )
  })

  test('22. kein Supabase-, API- oder privater Writer-Aufruf', () => {
    assert.doesNotMatch(persistenzSrc, /from '@\/lib\/supabase/)
    assert.doesNotMatch(persistenzSrc, /createClient/)
    assert.doesNotMatch(persistenzSrc, /trip_item_flight_event_provenance_schreiben/)
    assert.doesNotMatch(persistenzSrc, /fetch\s*\(/)
    assert.doesNotMatch(persistenzSrc.replace(/\/\/[^\n]*/g, ''), /process\.env/)
    assert.doesNotMatch(persistenzSrc, /from 'next/)
    assert.doesNotMatch(persistenzSrc, /from '@duffel/)
    assert.doesNotMatch(persistenzSrc, /from '@\/lib\/commercial-provenance/)
    assert.doesNotMatch(persistenzSrc, /from '@\/lib\/readiness\/temporal-projection/)
  })

  test('23./24. bestehende E5-B1R/B2A/B3B- und E5-B3A-Verträge bleiben im Mint unberührt', () => {
    assert.match(providerSrc, /retrievedAt: string/)
    assert.match(providerSrc, /airportTimezoneEvidence: FlugAirportTimezoneEvidence\[\]/)
    assert.match(providerSrc, /airportEventInstantEvidence: FlugAirportEventInstantEvidence\[\]/)
    assert.match(sqlSrc, /jetnity\.flight_event_persistence\.v1/)
    assert.match(sqlSrc, /e5b2a_validated_snapshot/)
    assert.match(e5b3aSrc, /flugNachweisAusUmgebung/)
    assert.match(sqlSrc, /Niemals aus Client-eventRef übernommen/)
  })
})
