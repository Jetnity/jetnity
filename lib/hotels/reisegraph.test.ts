import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { hotelReisegraphPruefen, hotelZeitraumAusEtappe } from '@/lib/hotels/reisegraph'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

describe('Hotel-Reisegraph', () => {
  test('Check-in und Check-out kommen aus der Etappe, sonst aus der Reise', () => {
    const reise = beispielreise()
    const florenz = reise.stages[0]
    assert.ok(florenz)
    assert.deepEqual(hotelZeitraumAusEtappe(reise, florenz), {
      checkIn: '2026-09-12',
      checkOut: '2026-09-14',
    })
  })

  test('eine fremde Etappe oder ein Tag einer anderen Etappe wird abgewiesen', () => {
    const reise = beispielreise()
    const fremd = hotelReisegraphPruefen(reise, { tripId: reise.id, stageId: 'stage-fremd', dayId: null })
    const andererTag = hotelReisegraphPruefen(reise, { tripId: reise.id, stageId: 'stage-1', dayId: 'day-4' })
    const fehlt = hotelReisegraphPruefen(reise, { tripId: reise.id, stageId: 'stage-1', dayId: 'day-fehlt' })
    assert.equal(fremd.ok, false)
    assert.equal(andererTag.ok, false)
    assert.equal(fehlt.ok, false)
    if (fremd.ok || andererTag.ok || fehlt.ok) return
    assert.equal(fremd.art, 'etappe-fremd')
    assert.equal(andererTag.art, 'tag-etappe')
    assert.equal(fehlt.art, 'tag-fremd')
  })

  test('ein Tag, der nicht der Check-in-Tag ist, wird nicht still korrigiert', () => {
    const reise = beispielreise()
    const ergebnis = hotelReisegraphPruefen(reise, {
      tripId: reise.id,
      stageId: 'stage-1',
      dayId: 'day-2',
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'tag-zeitraum')
  })

  test('ohne belastbaren Zeitraum fällt die Prüfung fail-closed', () => {
    const reise = beispielreise({ startDate: null, endDate: null })
    reise.stages[0] = { ...reise.stages[0]!, arrivalDate: null, departureDate: null }
    const ergebnis = hotelReisegraphPruefen(reise, {
      tripId: reise.id,
      stageId: 'stage-1',
      dayId: null,
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'zeitraum-unvollstaendig')
  })

  test('mehrere Etappen ohne eigene Daten übernehmen nicht die ganze Reise', () => {
    const reise = beispielreise()
    const florenz = { ...reise.stages[0]!, arrivalDate: null, departureDate: null }
    reise.stages = [florenz, reise.stages[1]!]
    assert.equal(hotelZeitraumAusEtappe(reise, florenz), null)
    assert.deepEqual(hotelZeitraumAusEtappe(reise, reise.stages[1]!), {
      checkIn: '2026-09-15',
      checkOut: '2026-09-16',
    })
    const pruefung = hotelReisegraphPruefen(reise, { tripId: reise.id, stageId: florenz.id, dayId: null })
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.art, 'zeitraum-unvollstaendig')
  })

  test('eine Etappe ohne eigene Daten behält den Reisezeitraum', () => {
    const reise = beispielreise()
    const nur = { ...reise.stages[0]!, arrivalDate: null, departureDate: null }
    reise.stages = [nur]
    assert.deepEqual(hotelZeitraumAusEtappe(reise, nur), {
      checkIn: '2026-09-12',
      checkOut: '2026-09-16',
    })
  })

  test('eine passende Etappe und der Check-in-Tag werden angenommen', () => {
    const reise = beispielreise()
    const ergebnis = hotelReisegraphPruefen(reise, {
      tripId: reise.id,
      stageId: 'stage-1',
      dayId: 'day-1',
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.checkIn, '2026-09-12')
    assert.equal(ergebnis.checkOut, '2026-09-14')
    assert.equal(ergebnis.tag?.id, 'day-1')
  })
})


describe('Workspace W1 – Etappe und Reisetermin bilden denselben Kalender', () => {
  test('eine Etappe vor der Hinreise oder nach der Rückreise ist kein Hoteltermin', () => {
    for (const patch of [
      {arrivalDate: '2026-09-11', departureDate: '2026-09-14'},
      {arrivalDate: '2026-09-12', departureDate: '2026-09-17'},
      {arrivalDate: '2026-02-30', departureDate: '2026-09-14'},
    ]) {
      const trip = beispielreise()
      trip.stages[0] = {...trip.stages[0]!, ...patch}
      assert.equal(hotelZeitraumAusEtappe(trip, trip.stages[0]!), null)
      const checked = hotelReisegraphPruefen(trip, {tripId: trip.id, stageId: trip.stages[0]!.id, dayId: null})
      assert.equal(checked.ok, false)
      if (!checked.ok) assert.equal(checked.art, 'zeitraum-unvollstaendig')
    }
  })

  test('eine einzelne Etappe darf eine fehlende Grenze nur innerhalb des Reisezeitraums ergänzen', () => {
    const trip = beispielreise()
    const only = {...trip.stages[0]!, arrivalDate: '2026-09-13', departureDate: null}
    trip.stages = [only]
    assert.deepEqual(hotelZeitraumAusEtappe(trip, only), {
      checkIn: '2026-09-13', checkOut: '2026-09-16',
    })
    assert.equal(hotelZeitraumAusEtappe({...trip, endDate: '2026-09-12'}, only), null)
  })
})
