// lib/flights/duffel/fixtures/angebote.ts
//
// Sanitized Duffel-ähnliche Antworten. Keine echten Tokens, keine PII.

function airline(code: string, name: string) {
  return { iata_code: code, name }
}

function airport(code: string) {
  return { iata_code: code, type: 'airport', name: code }
}

function segment(teil: {
  von: string
  nach: string
  ab: string
  an: string
  carrier: string
  name: string
  nummer: string
  dauer: string
  operating?: { code: string; name: string }
  bags?: number
}) {
  return {
    origin: airport(teil.von),
    destination: airport(teil.nach),
    departing_at: teil.ab,
    arriving_at: teil.an,
    duration: teil.dauer,
    marketing_carrier: airline(teil.carrier, teil.name),
    operating_carrier: teil.operating
      ? airline(teil.operating.code, teil.operating.name)
      : airline(teil.carrier, teil.name),
    marketing_carrier_flight_number: teil.nummer,
    passengers: [
      {
        cabin_class: 'economy',
        baggages:
          typeof teil.bags === 'number' ? [{ type: 'checked', quantity: teil.bags }] : undefined,
      },
    ],
  }
}

/** Nonstop ZRH–BKK, teurer, tagsüber. */
export const ANGEBOT_DIREKT = {
  id: 'off_test_direkt',
  total_amount: '892.50',
  total_currency: 'CHF',
  owner: airline('LX', 'SWISS'),
  slices: [
    {
      duration: 'PT11H30M',
      fare_brand_name: 'Economy Classic',
      segments: [
        segment({
          von: 'ZRH',
          nach: 'BKK',
          ab: '2026-11-01T09:15:00',
          an: '2026-11-01T23:45:00',
          carrier: 'LX',
          name: 'SWISS',
          nummer: '180',
          dauer: 'PT11H30M',
          bags: 1,
        }),
      ],
    },
  ],
  conditions: { refund_before_departure: { allowed: false } },
}

/** Günstiger, 1 Stopp, lange Reisezeit, früher Abflug. */
export const ANGEBOT_MIT_STOPP = {
  id: 'off_test_stopp',
  total_amount: '850.00',
  total_currency: 'CHF',
  owner: airline('BA', 'British Airways'),
  slices: [
    {
      duration: 'PT18H45M',
      fare_brand_name: null,
      segments: [
        segment({
          von: 'ZRH',
          nach: 'LHR',
          ab: '2026-11-01T05:10:00',
          an: '2026-11-01T06:05:00',
          carrier: 'BA',
          name: 'British Airways',
          nummer: '715',
          dauer: 'PT1H55M',
          bags: 0,
        }),
        segment({
          von: 'LHR',
          nach: 'BKK',
          ab: '2026-11-01T10:40:00',
          an: '2026-11-02T05:55:00',
          carrier: 'BA',
          name: 'British Airways',
          nummer: '9',
          dauer: 'PT11H15M',
          bags: 1,
        }),
      ],
    },
  ],
}

/** Overnight-Umstieg: Ankunft 22:10, Weiterflug 08:40 am nächsten Tag. */
export const ANGEBOT_OVERNIGHT = {
  id: 'off_test_overnight',
  total_amount: '810.00',
  total_currency: 'CHF',
  owner: airline('LX', 'SWISS'),
  slices: [
    {
      duration: 'PT20H10M',
      segments: [
        segment({
          von: 'ZRH',
          nach: 'DOH',
          ab: '2026-11-01T16:00:00',
          an: '2026-11-01T22:10:00',
          carrier: 'LX',
          name: 'SWISS',
          nummer: '310',
          dauer: 'PT6H10M',
          operating: { code: 'QR', name: 'Qatar Airways' },
        }),
        segment({
          von: 'DOH',
          nach: 'BKK',
          ab: '2026-11-02T08:40:00',
          an: '2026-11-02T19:10:00',
          carrier: 'LX',
          name: 'SWISS',
          nummer: '7802',
          dauer: 'PT6H30M',
        }),
      ],
    },
  ],
}

/** Hin- und Rückflug, zwei Slices. */
export const ANGEBOT_RUECKFLUG = {
  id: 'off_test_rueck',
  total_amount: '1640.00',
  total_currency: 'CHF',
  owner: airline('LX', 'SWISS'),
  slices: [
    ANGEBOT_DIREKT.slices[0],
    {
      duration: 'PT12H05M',
      segments: [
        segment({
          von: 'BKK',
          nach: 'ZRH',
          ab: '2026-11-15T01:20:00',
          an: '2026-11-15T07:25:00',
          carrier: 'LX',
          name: 'SWISS',
          nummer: '181',
          dauer: 'PT12H05M',
        }),
      ],
    },
  ],
}

export const ANTWORT_GEMISCHT = {
  data: {
    id: 'orq_test_1',
    offers: [ANGEBOT_DIREKT, ANGEBOT_MIT_STOPP, ANGEBOT_OVERNIGHT],
  },
}

export const ANTWORT_MIT_UNGUELTIGEM = {
  data: {
    id: 'orq_test_2',
    offers: [ANGEBOT_DIREKT, { id: 'kaputt', total_amount: 'abc' }, ANGEBOT_MIT_STOPP],
  },
}

export const ANTWORT_LEER = {
  data: { id: 'orq_test_leer', offers: [] },
}

export const ANTWORT_NUR_MUELL = {
  data: {
    id: 'orq_test_muell',
    offers: [{ id: 'x' }, { total_amount: 'abc', total_currency: 'CHF' }],
  },
}
