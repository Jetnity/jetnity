import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { flugKontoUebernahmePruefen } from '@/lib/flights/konto-uebernahme'
import { OPTION_DIREKT } from '@/lib/flights/fixtures/optionen'
import { flugNachweisAusKatalog, type FlugNachweisKontext } from '@/lib/flights/nachweis'
import { flugKontoUebernahmeSchema } from '@/lib/flights/schema'
import { itineraryAusFlugOption } from '@/lib/route/itinerary'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

const KONTEXT: FlugNachweisKontext = {
  legs: [{ origin: 'ZRH', destination: 'BKK', date: '2026-11-01' }],
  passengers: { adults: 2, children: 0, infants: 0 },
  cabin: 'economy',
  currency: 'CHF',
}

const SUCHE = { legs: KONTEXT.legs, cabin: KONTEXT.cabin } as const

function nachweisMit(
  extra: { geaendert?: readonly string[]; abgelaufen?: readonly string[] } = {},
) {
  return flugNachweisAusKatalog({
    optionen: { direkt: OPTION_DIREKT },
    kontexte: { direkt: KONTEXT },
    ...extra,
  })
}

const EINGABE = {
  tripId: 'trip-1',
  dayId: 'day-1',
  optionId: 'direkt',
}

describe('Konto-Flugübernahme', () => {
  test('ohne Nachweis wird keine kommerzielle Option gespeichert', async () => {
    const ergebnis = await flugKontoUebernahmePruefen(EINGABE, {
      nachweis: null,
      reise: beispielreise(),
      suche: SUCHE,
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unavailable')
  })

  test('ohne serverseitigen Suchkontext bleibt die Übernahme fail-closed', async () => {
    const ergebnis = await flugKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: null,
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unavailable')
  })

  test('eine vom Browser erfundene Option mit fremdem Preis wird nicht übernommen', async () => {
    const ergebnis = await flugKontoUebernahmePruefen(
      { ...EINGABE, optionId: 'opt-erfunden' },
      { nachweis: nachweisMit(), reise: beispielreise(), suche: SUCHE },
    )
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unbekannt')
  })

  test('manipulierte Browserfelder ändern die persistierte Momentaufnahme nicht', async () => {
    const geparst = flugKontoUebernahmeSchema.safeParse({
      tripId: '11111111-1111-4111-8111-111111111111',
      dayId: null,
      optionId: 'direkt',
      option: {
        ...OPTION_DIREKT,
        priceAmount: 1,
        provider: 'evil',
        externalRef: 'hack',
        legs: [
          {
            ...OPTION_DIREKT.legs[0]!,
            segments: [
              {
                ...OPTION_DIREKT.legs[0]!.segments[0]!,
                departureTime: '00:01',
                arrivalTime: '00:02',
              },
            ],
          },
        ],
      },
      priceAmount: 1,
      provider: 'evil',
      access_token: 'secret',
    })
    assert.equal(geparst.success, true)
    if (!geparst.success) return
    assert.deepEqual(Object.keys(geparst.data).sort(), ['dayId', 'optionId', 'tripId'])
    assert.equal('option' in geparst.data, false)
    assert.equal('priceAmount' in geparst.data, false)

    const ergebnis = await flugKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: SUCHE,
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.aufnahme.priceAmount, 892.5)
    assert.equal(ergebnis.aufnahme.provider, 'duffel')
    assert.equal(ergebnis.aufnahme.externalRef, OPTION_DIREKT.externalRef)
    assert.equal(ergebnis.aufnahme.startsAt, '09:15')
    assert.equal(ergebnis.aufnahme.endsAt, '21:40')
    assert.equal(ergebnis.aufnahme.bookingUrl, null)
  })

  test('eine serverseitig vertrauenswürdige Auswahl wird als flight abgebildet', async () => {
    const ergebnis = await flugKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: SUCHE,
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.aufnahme.kind, 'flight')
    assert.equal(ergebnis.dayId, 'day-1')
    assert.equal(ergebnis.option.id, 'direkt')
  })

  test('eine Option eines anderen Suchkontexts oder anderer Legs wird nicht persistiert', async () => {
    const ergebnis = await flugKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: { legs: [{ origin: 'ZRH', destination: 'SIN', date: '2026-11-01' }], cabin: 'economy' },
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'geaendert')
  })

  test('Passagier-, Kabinen- oder Währungsdrift wird abgewiesen', async () => {
    const ports = { nachweis: nachweisMit(), suche: SUCHE }
    const passagiere = await flugKontoUebernahmePruefen(EINGABE, {
      ...ports,
      reise: beispielreise({ travellers: 4 }),
    })
    const waehrung = await flugKontoUebernahmePruefen(EINGABE, {
      ...ports,
      reise: beispielreise({ currency: 'EUR' }),
    })
    const kabine = await flugKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: { legs: KONTEXT.legs, cabin: 'business' },
    })
    assert.equal(passagiere.ok, false)
    assert.equal(waehrung.ok, false)
    assert.equal(kabine.ok, false)
    if (passagiere.ok || waehrung.ok || kabine.ok) return
    assert.equal(passagiere.art, 'geaendert')
    assert.equal(waehrung.art, 'geaendert')
    assert.equal(kabine.art, 'geaendert')
  })

  test('fremde Reise oder fremder Tag werden abgewiesen', async () => {
    const ports = { nachweis: nachweisMit(), reise: beispielreise(), suche: SUCHE }
    const fremd = await flugKontoUebernahmePruefen({ ...EINGABE, tripId: 'trip-fremd' }, ports)
    const andererTag = await flugKontoUebernahmePruefen({ ...EINGABE, dayId: 'day-fehlt' }, ports)
    assert.equal(fremd.ok, false)
    assert.equal(andererTag.ok, false)
    if (fremd.ok || andererTag.ok) return
    assert.equal(fremd.art, 'reise-fremd')
    assert.equal(andererTag.art, 'tag-fremd')
  })

  test('Preisänderung oder nicht mehr verfügbare Option werden abgelehnt', async () => {
    const nachweis = nachweisMit({ geaendert: ['opt-preis'], abgelaufen: ['opt-weg'] })
    const ports = { nachweis, reise: beispielreise(), suche: SUCHE }
    const preis = await flugKontoUebernahmePruefen({ ...EINGABE, optionId: 'opt-preis' }, ports)
    const weg = await flugKontoUebernahmePruefen({ ...EINGABE, optionId: 'opt-weg' }, ports)
    assert.equal(preis.ok, false)
    assert.equal(weg.ok, false)
    if (preis.ok || weg.ok) return
    assert.equal(preis.art, 'geaendert')
    assert.equal(weg.art, 'abgelaufen')
  })

  test('Route Truth bleibt Foundation-D-konsistent und erfindet keine Surface-Evidence', async () => {
    const ergebnis = await flugKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
      suche: SUCHE,
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const itinerary = itineraryAusFlugOption(ergebnis.option, {})
    assert.equal(itinerary?.legs[0]?.segments[0]?.origin, 'ZRH')
    assert.equal(
      itinerary?.legs[0]?.segments.some((segment) => segment.surfaceFromAirportCode != null),
      false,
    )
    assert.equal(ergebnis.aufnahme.bookingUrl, null)
  })
})
