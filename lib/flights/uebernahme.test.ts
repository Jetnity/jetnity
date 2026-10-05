import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { OPTION_DIREKT, OPTION_GUENSTIG_LANG } from '@/lib/flights/fixtures/optionen'
import { alsFlugMomentaufnahme, flugNotiz, flugTitel } from '@/lib/flights/uebernahme'
import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import { momentaufnahmeAlsPunkt } from '@/lib/flights/uebernahme'

describe('Flug in die Reise übernehmen', () => {
  test('die Momentaufnahme trägt Route, Termin, Preis und Ref – keinen Deeplink', () => {
    const aufnahme = alsFlugMomentaufnahme(OPTION_DIREKT)
    assert.ok(aufnahme)
    assert.equal(aufnahme?.kind, 'flight')
    assert.match(aufnahme?.title ?? '', /ZRH → BKK/)
    assert.equal(aufnahme?.startsOn, '2026-11-01')
    assert.equal(aufnahme?.startsAt, '09:15')
    assert.equal(aufnahme?.priceAmount, 892.5)
    assert.equal(aufnahme?.priceCurrency, 'CHF')
    assert.equal(aufnahme?.provider, 'duffel')
    assert.ok(aufnahme?.externalRef)
    assert.equal(aufnahme?.bookingUrl, null)
    assert.ok((aufnahme?.note.length ?? 0) <= 500)
  })

  test('ein Stopp steht in der Notiz, ohne Provider-Rohdaten', () => {
    const notiz = flugNotiz(OPTION_GUENSTIG_LANG)
    assert.match(notiz, /1 Stopp|Stopp/)
    assert.match(notiz, /BA715/)
    assert.equal(/travelerPricings|access_token|dictionaries/i.test(notiz), false)
    assert.match(flugTitel(OPTION_GUENSTIG_LANG), /ZRH → BKK/)
  })

  test('der Planpunkt gilt als kommerziell und bleibt damit modellgeschützt', () => {
    const aufnahme = alsFlugMomentaufnahme(OPTION_DIREKT)
    assert.ok(aufnahme)
    const punkt = momentaufnahmeAlsPunkt(aufnahme!, {
      id: 'item-flug',
      dayId: 'day-1',
      stageId: 'stage-1',
      position: 1,
    })
    assert.equal(istKommerziell(punkt), true)
    assert.equal(punkt.kind, 'flight')
    assert.equal(punkt.bookingUrl, null)
  })
})
