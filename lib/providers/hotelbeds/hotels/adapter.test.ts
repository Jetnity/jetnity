import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { commercialEingabeLesen } from '@/lib/commercial-provenance/lesen'
import { hotelOptionLesen } from '@/lib/hotels/schema'
import { hbxHotelsFixtureNormalisieren } from '@/lib/providers/hotelbeds/hotels/adapter'
import {
  HBX_HOTELS_FIXTURE_SCHEMA,
  HBX_HOTELS_PROVIDER_ID,
} from '@/lib/providers/hotelbeds/hotels/contracts'

const RATE_KEY_A = 'SECRET-RATE-KEY-DO-NOT-LEAK-A'
const RATE_KEY_B = 'SECRET-RATE-KEY-DO-NOT-LEAK-B'
const DIR = dirname(fileURLToPath(import.meta.url))

function digest(rateKey: string): string {
  return createHash('sha256').update(rateKey, 'utf8').digest('hex').slice(0, 32)
}

function kontext(overrides: Record<string, unknown> = {}) {
  return {
    checkIn: '2026-09-22',
    checkOut: '2026-09-25',
    requestedCurrency: 'CHF',
    pricingModel: 'commissionable',
    ...overrides,
  }
}

function offer(overrides: Record<string, unknown> = {}) {
  return {
    hotelCode: 12345,
    hotelName: 'Hotel Catalunya',
    latitude: 41.3874,
    longitude: 2.1686,
    currency: 'CHF',
    net: 180,
    sellingRate: 210,
    hotelMandatory: false,
    taxesAllIncluded: true,
    rateKey: RATE_KEY_A,
    rateType: 'BOOKABLE',
    roomCode: 'DBL',
    roomName: 'Double Room',
    boardCode: 'BB',
    packaging: false,
    paymentType: 'AT_WEB',
    cancellationFrom: '2026-09-20T00:00:00+02:00',
    cancellationAmount: 50,
    retrievedAt: '2026-09-01T10:15:00.000Z',
    ...overrides,
  }
}

function fixture(offers: unknown[] = [offer()], extra: Record<string, unknown> = {}) {
  return {
    schema: HBX_HOTELS_FIXTURE_SCHEMA,
    offers,
    ...extra,
  }
}

function leer(ergebnis: ReturnType<typeof hbxHotelsFixtureNormalisieren>) {
  assert.equal(ergebnis.providerId, HBX_HOTELS_PROVIDER_ID)
  assert.equal(ergebnis.evidenceMode, 'fixture')
  assert.deepEqual(ergebnis.options, [])
  assert.equal(ergebnis.partial, false)
}

describe('hbxHotelsFixtureNormalisieren — pricing matrix', () => {
  test('commissionable uses sellingRate only and never displays net', () => {
    const ergebnis = hbxHotelsFixtureNormalisieren(fixture(), kontext())
    assert.equal(ergebnis.options.length, 1)
    const option = ergebnis.options[0]!
    assert.equal(option.provider, HBX_HOTELS_PROVIDER_ID)
    assert.equal(option.externalRef, '12345')
    assert.equal(option.name, 'Hotel Catalunya')
    assert.equal(option.preisGesamt, 210)
    assert.equal(option.preisProNacht, 70)
    assert.equal(option.preisWaehrung, 'CHF')
    assert.equal(option.steuernEnthalten, true)
    assert.equal(option.zimmerName, 'Double Room')
    assert.equal(option.id, `hbx:12345:${digest(RATE_KEY_A)}`)
    assert.equal(hotelOptionLesen(option)?.id, option.id)
    const roh = JSON.stringify(option)
    assert.equal(roh.includes(RATE_KEY_A), false)
    assert.equal(roh.includes('180'), false)
  })

  test('unknown pricing model mints no HotelOption even when prices exist', () => {
    const ergebnis = hbxHotelsFixtureNormalisieren(
      fixture([
        offer({ sellingRate: 210, net: 180, hotelMandatory: true, packaging: false }),
      ]),
      kontext({ pricingModel: 'unknown' }),
    )
    leer(ergebnis)
  })

  test('net model uses sellingRate only when hotelMandatory is strictly true', () => {
    const akzeptiert = hbxHotelsFixtureNormalisieren(
      fixture([offer({ hotelMandatory: true, sellingRate: 240, net: 190 })]),
      kontext({ pricingModel: 'net' }),
    )
    assert.equal(akzeptiert.options.length, 1)
    assert.equal(akzeptiert.options[0]?.preisGesamt, 240)
    assert.equal(akzeptiert.options[0]?.preisProNacht, 80)

    for (const hotelMandatory of [false, null, 'true', 1, undefined]) {
      const abgelehnt = hbxHotelsFixtureNormalisieren(
        fixture([offer({ hotelMandatory, sellingRate: 240, net: 190 })]),
        kontext({ pricingModel: 'net' }),
      )
      leer(abgelehnt)
    }
  })

  test('missing or invalid sellingRate never falls back to net or markup', () => {
    const faelle = [
      { sellingRate: null, net: 180 },
      { sellingRate: undefined, net: 180 },
      { sellingRate: Number.NaN, net: 180 },
      { sellingRate: Number.POSITIVE_INFINITY, net: 180 },
      { sellingRate: -1, net: 180 },
      { sellingRate: '210', net: 180 },
      { sellingRate: 10_000_000_000, net: 180 },
    ]
    for (const felder of faelle) {
      const ergebnis = hbxHotelsFixtureNormalisieren(fixture([offer(felder)]), kontext())
      leer(ergebnis)
    }
  })

  test('packaging true and malformed control booleans do not silently permit', () => {
    for (const packaging of [true, null, 'false', 0, undefined, 'true']) {
      const ergebnis = hbxHotelsFixtureNormalisieren(fixture([offer({ packaging })]), kontext())
      leer(ergebnis)
    }
  })

  test('currency mismatch and invalid currency reject without FX', () => {
    assert.equal(
      hbxHotelsFixtureNormalisieren(fixture([offer({ currency: 'EUR' })]), kontext()).options.length,
      0,
    )
    assert.equal(
      hbxHotelsFixtureNormalisieren(fixture([offer({ currency: 'EURO' })]), kontext()).options.length,
      0,
    )
    const normiert = hbxHotelsFixtureNormalisieren(
      fixture([offer({ currency: ' chf ' })]),
      kontext({ requestedCurrency: 'chf' }),
    )
    assert.equal(normiert.options[0]?.preisWaehrung, 'CHF')
  })
})

describe('hbxHotelsFixtureNormalisieren — shape, identity, numbers', () => {
  test('invalid top-level, schema or context returns empty result without throw', () => {
    const faelle: Array<[unknown, unknown]> = [
      [null, kontext()],
      [undefined, kontext()],
      ['fixture', kontext()],
      [{ schema: 'other.schema', offers: [offer()] }, kontext()],
      [{ schema: HBX_HOTELS_FIXTURE_SCHEMA, offers: { hotel: offer() } }, kontext()],
      [fixture(), null],
      [fixture(), { ...kontext(), pricingModel: 'gross' }],
      [fixture(), { ...kontext(), requestedCurrency: 'EURO' }],
      [fixture(), { ...kontext(), checkIn: '2026-02-30', checkOut: '2026-03-01' }],
    ]
    for (const [input, context] of faelle) {
      assert.doesNotThrow(() => hbxHotelsFixtureNormalisieren(input, context))
      leer(hbxHotelsFixtureNormalisieren(input, context))
    }
  })

  test('identifiers, coordinates and timestamps fail closed', () => {
    const faelle = [
      { hotelCode: 0 },
      { hotelCode: -3 },
      { hotelCode: 1.5 },
      { hotelCode: '0123' },
      { hotelCode: 'abc' },
      { hotelName: '   ' },
      { rateKey: '' },
      { rateKey: '   ' },
      { latitude: 91 },
      { longitude: 181 },
      { latitude: Number.NaN, longitude: 2 },
      { latitude: '41.3874', longitude: 2.1686 },
      { retrievedAt: '2026-09-01T10:15:00' },
      { retrievedAt: '2026-09-01' },
      { retrievedAt: 'not-a-date' },
      { retrievedAt: '2026-02-30T12:00:00Z' },
    ]
    for (const felder of faelle) {
      leer(hbxHotelsFixtureNormalisieren(fixture([offer(felder)]), kontext()))
    }
  })

  test('offset-bearing retrievedAt is retained only as local validation, never copied', () => {
    const ergebnis = hbxHotelsFixtureNormalisieren(
      fixture([offer({ retrievedAt: '2026-09-01T12:15:00+02:00' })]),
      kontext(),
    )
    assert.equal(ergebnis.options.length, 1)
    assert.equal('retrievedAt' in ergebnis.options[0]!, false)
    assert.equal('rateKey' in ergebnis.options[0]!, false)
    assert.equal('providerOfferId' in ergebnis.options[0]!, false)
  })

  test('hotelCode string and number canonicalize to the same externalRef', () => {
    const alsZahl = hbxHotelsFixtureNormalisieren(fixture([offer({ hotelCode: 99 })]), kontext())
    const alsText = hbxHotelsFixtureNormalisieren(fixture([offer({ hotelCode: '99' })]), kontext())
    assert.equal(alsZahl.options[0]?.externalRef, '99')
    assert.equal(alsText.options[0]?.externalRef, '99')
    assert.equal(alsZahl.options[0]?.id, alsText.options[0]?.id)
  })
})

describe('hbxHotelsFixtureNormalisieren — stay dates and nightly math', () => {
  test('leap-day stay yields DST-independent integer nights', () => {
    const leap = hbxHotelsFixtureNormalisieren(
      fixture(),
      kontext({ checkIn: '2024-02-28', checkOut: '2024-03-01' }),
    )
    assert.equal(leap.options[0]?.preisGesamt, 210)
    assert.equal(leap.options[0]?.preisProNacht, 105)

    const leapNight = hbxHotelsFixtureNormalisieren(
      fixture(),
      kontext({ checkIn: '2024-02-29', checkOut: '2024-03-01' }),
    )
    assert.equal(leapNight.options[0]?.preisProNacht, 210)
  })

  test('invalid, equal or reversed dates empty the whole fixture result', () => {
    for (const stay of [
      { checkIn: '2023-02-29', checkOut: '2023-03-01' },
      { checkIn: '2026-09-31', checkOut: '2026-10-01' },
      { checkIn: '2026-09-22', checkOut: '2026-09-22' },
      { checkIn: '2026-09-25', checkOut: '2026-09-22' },
      { checkIn: '2026/09/22', checkOut: '2026-09-25' },
      { checkIn: '2026-9-22', checkOut: '2026-09-25' },
    ]) {
      leer(hbxHotelsFixtureNormalisieren(fixture(), kontext(stay)))
    }
  })

  test('Europe DST transitions still count whole UTC calendar nights', () => {
    const fruehling = hbxHotelsFixtureNormalisieren(
      fixture(),
      kontext({ checkIn: '2026-03-28', checkOut: '2026-03-30' }),
    )
    assert.equal(fruehling.options[0]?.preisProNacht, 105)
    const herbst = hbxHotelsFixtureNormalisieren(
      fixture(),
      kontext({ checkIn: '2026-10-24', checkOut: '2026-10-26' }),
    )
    assert.equal(herbst.options[0]?.preisProNacht, 105)
  })
})

describe('hbxHotelsFixtureNormalisieren — identities, partial, truth boundary', () => {
  test('same hotel with multiple rates gets distinct deterministic IDs', () => {
    const input = fixture([
      offer({ rateKey: RATE_KEY_A, sellingRate: 210, roomName: 'Double Room' }),
      offer({ rateKey: RATE_KEY_B, sellingRate: 300, roomName: 'Suite' }),
    ])
    const einmal = hbxHotelsFixtureNormalisieren(input, kontext())
    const nochmal = hbxHotelsFixtureNormalisieren(input, kontext())
    assert.equal(einmal.options.length, 2)
    assert.equal(einmal.options[0]?.id, `hbx:12345:${digest(RATE_KEY_A)}`)
    assert.equal(einmal.options[1]?.id, `hbx:12345:${digest(RATE_KEY_B)}`)
    assert.notEqual(einmal.options[0]?.id, einmal.options[1]?.id)
    assert.deepEqual(
      einmal.options.map((option) => option.id),
      nochmal.options.map((option) => option.id),
    )
    assert.equal(JSON.stringify(einmal).includes(RATE_KEY_A), false)
    assert.equal(JSON.stringify(einmal).includes(RATE_KEY_B), false)
  })

  test('duplicate rate identity keeps the first option and stays deterministic', () => {
    const input = fixture([
      offer({ rateKey: RATE_KEY_A, sellingRate: 210, roomName: 'First' }),
      offer({ rateKey: RATE_KEY_A, sellingRate: 199, roomName: 'Duplicate' }),
    ])
    const ergebnis = hbxHotelsFixtureNormalisieren(input, kontext())
    assert.equal(ergebnis.options.length, 1)
    assert.equal(ergebnis.partial, true)
    assert.equal(ergebnis.options[0]?.zimmerName, 'First')
    assert.equal(ergebnis.options[0]?.preisGesamt, 210)
    assert.equal(hbxHotelsFixtureNormalisieren(input, kontext()).options[0]?.id, ergebnis.options[0]?.id)
  })

  test('mixed valid/invalid is partial; all invalid is empty and not partial', () => {
    const gemischt = hbxHotelsFixtureNormalisieren(
      fixture([offer(), offer({ sellingRate: Number.NaN })]),
      kontext(),
    )
    assert.equal(gemischt.options.length, 1)
    assert.equal(gemischt.partial, true)

    const alle = hbxHotelsFixtureNormalisieren(
      fixture([offer({ hotelName: '' }), offer({ packaging: true })]),
      kontext(),
    )
    leer(alle)
  })

  test('injected forbidden truth fields stay absent at result and option level', () => {
    const input = fixture([
      offer({
        sourceKind: 'live_api',
        persistenz: 'persisted_snapshot',
        akteur: 'provider',
        freshUntil: '2026-09-02T00:00:00Z',
        availability: 'available',
        affiliate: { partnerId: 'x' },
        live_api: true,
        persisted_snapshot: true,
        categoryCode: '4EST',
        stars: 4,
        adresse: 'Rambla 1',
        quartierName: 'Eixample',
        bewertung: 9.1,
        bewertungenAnzahl: 1200,
        fruehstueckEnthalten: true,
        stornierbar: true,
        stornierungBis: '2026-09-20',
      }),
    ])
    const ergebnis = hbxHotelsFixtureNormalisieren(input, {
      ...kontext(),
      sourceKind: 'live_api',
      persistenz: 'persisted_snapshot',
    })
    const verboten = [
      'sourceKind',
      'persistenz',
      'akteur',
      'freshUntil',
      'availability',
      'affiliate',
      'live_api',
      'persisted_snapshot',
    ]
    const runtime = ergebnis as unknown as Record<string, unknown>
    for (const feld of verboten) {
      assert.equal(feld in runtime, false)
      assert.equal(feld in (ergebnis.options[0] as unknown as Record<string, unknown>), false)
    }
    const option = ergebnis.options[0]!
    assert.equal(option.adresse, null)
    assert.equal(option.sterne, null)
    assert.equal(option.bewertung, null)
    assert.equal(option.bewertungenAnzahl, null)
    assert.equal(option.quartierName, null)
    assert.equal(option.fruehstueckEnthalten, null)
    assert.equal(option.stornierbar, null)
    assert.equal(option.stornierungBis, null)
    assert.equal(commercialEingabeLesen(ergebnis), null)
  })

  test('empty roomName falls back to roomCode; unknown board/category stay null', () => {
    const ergebnis = hbxHotelsFixtureNormalisieren(
      fixture([offer({ roomName: '  ', roomCode: 'STE', boardCode: 'BB', categoryCode: '4EST' })]),
      kontext(),
    )
    assert.equal(ergebnis.options[0]?.zimmerName, 'STE')
    assert.equal(ergebnis.options[0]?.fruehstueckEnthalten, null)
    assert.equal(ergebnis.options[0]?.sterne, null)
  })

  test('taxesAllIncluded passes only a real boolean; otherwise null', () => {
    assert.equal(
      hbxHotelsFixtureNormalisieren(fixture([offer({ taxesAllIncluded: false })]), kontext()).options[0]
        ?.steuernEnthalten,
      false,
    )
    assert.equal(
      hbxHotelsFixtureNormalisieren(fixture([offer({ taxesAllIncluded: 'true' })]), kontext()).options[0]
        ?.steuernEnthalten,
      null,
    )
  })

  test('adapter sources have no runtime registration, network, env or live constructor', () => {
    const adapter = readFileSync(join(DIR, 'adapter.ts'), 'utf8')
    const contracts = readFileSync(join(DIR, 'contracts.ts'), 'utf8')
    const factory = readFileSync(join(DIR, '../../../hotels/factory.ts'), 'utf8')
    for (const quelle of [adapter, contracts]) {
      assert.equal(/process\.env/.test(quelle), false)
      assert.equal(/\bfetch\s*\(/.test(quelle), false)
      assert.equal(/https?:\/\//.test(quelle), false)
      assert.equal(/hotelProviderAus/.test(quelle), false)
      assert.equal(/new\s+HotelProvider/.test(quelle), false)
      assert.equal(/createHmac/.test(quelle), false)
      assert.equal(/X-Signature/.test(quelle), false)
    }
    assert.equal(/hotelbeds|hbxHotels/.test(factory), false)
  })
})
