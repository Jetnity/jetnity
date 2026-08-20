import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { activityKontoUebernahmePruefen } from '@/lib/activities/konto-uebernahme'
import { activityNachweisAusKatalog, type ActivityNachweisKontext } from '@/lib/activities/nachweis'
import { activityKontoUebernahmeSchema } from '@/lib/activities/schema'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { ActivityOption } from '@/lib/activities/domain'

const OPTION: ActivityOption = {
  id: 'opt-1',
  provider: 'test-activity',
  externalRef: 'ref-77',
  title: 'Uffizien',
  description: null,
  locationName: 'Florenz',
  punkt: { lat: 43.77, lon: 11.25 },
  dauerMinuten: 90,
  timeslot: {
    startsOn: '2026-09-12',
    startsAt: '15:00',
    endsOn: '2026-09-12',
    endsAt: '16:30',
  },
  preis: 28,
  preisWaehrung: 'CHF',
  bewertung: 9.1,
  bewertungenAnzahl: 1400,
  stornierbar: true,
  kategorien: ['culture'],
  tags: ['museum'],
}

const KONTEXT: ActivityNachweisKontext = {
  destinationPlaceId: 'stage:stage-1',
  dayDate: '2026-09-12',
  participants: 2,
  currency: 'CHF',
  timeslot: OPTION.timeslot,
}

function nachweisMit(
  extra: { geaendert?: readonly string[]; abgelaufen?: readonly string[] } = {},
) {
  return activityNachweisAusKatalog({
    optionen: { 'opt-1': OPTION },
    kontexte: { 'opt-1': KONTEXT },
    ...extra,
  })
}

const EINGABE = {
  tripId: 'trip-1',
  stageId: 'stage-1',
  dayId: 'day-1',
  optionId: 'opt-1',
}

describe('Konto-Aktivitätsübernahme', () => {
  test('ohne Nachweis wird keine kommerzielle Option gespeichert', async () => {
    const ergebnis = await activityKontoUebernahmePruefen(EINGABE, {
      nachweis: null,
      reise: beispielreise(),
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unavailable')
  })

  test('eine vom Browser erfundene Option mit fremdem Preis wird nicht übernommen', async () => {
    const ergebnis = await activityKontoUebernahmePruefen(
      { ...EINGABE, optionId: 'opt-erfunden' },
      { nachweis: nachweisMit(), reise: beispielreise() },
    )
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'unbekannt')
  })

  test('manipulierte Preise im Request ändern die persistierte Momentaufnahme nicht', async () => {
    const geparst = activityKontoUebernahmeSchema.safeParse({
      tripId: '11111111-1111-4111-8111-111111111111',
      stageId: '22222222-2222-4222-8222-222222222222',
      dayId: '33333333-3333-4333-8333-333333333333',
      optionId: 'opt-1',
      option: { ...OPTION, preis: 1, provider: 'evil', externalRef: 'hack' },
    })
    assert.equal(geparst.success, true)
    if (!geparst.success) return
    assert.equal('option' in geparst.data, false)

    const ergebnis = await activityKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.aufnahme.priceAmount, 28)
    assert.equal(ergebnis.aufnahme.provider, 'test-activity')
    assert.equal(ergebnis.aufnahme.externalRef, 'ref-77')
    assert.equal(ergebnis.aufnahme.startsAt, '15:00')
    assert.equal(ergebnis.aufnahme.bookingUrl, null)
  })

  test('eine serverseitig vertrauenswürdige Auswahl wird als activity abgebildet', async () => {
    const ergebnis = await activityKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit(),
      reise: beispielreise(),
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.aufnahme.kind, 'activity')
    assert.equal(ergebnis.stageId, 'stage-1')
    assert.equal(ergebnis.dayId, 'day-1')
  })

  test('eine Option eines anderen Tages oder einer anderen Etappe wird nicht persistiert', async () => {
    const andererTag = await activityKontoUebernahmePruefen(
      { ...EINGABE, dayId: 'day-4' },
      { nachweis: nachweisMit(), reise: beispielreise() },
    )
    const andereEtappe = await activityKontoUebernahmePruefen(
      { ...EINGABE, stageId: 'stage-2', dayId: 'day-4' },
      { nachweis: nachweisMit(), reise: beispielreise() },
    )
    assert.equal(andererTag.ok, false)
    assert.equal(andereEtappe.ok, false)
  })

  test('abgelaufene oder geänderte Nachweise werden abgewiesen', async () => {
    const abgelaufen = await activityKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit({ abgelaufen: ['opt-1'] }),
      reise: beispielreise(),
    })
    const geaendert = await activityKontoUebernahmePruefen(EINGABE, {
      nachweis: nachweisMit({ geaendert: ['opt-1'] }),
      reise: beispielreise(),
    })
    assert.equal(abgelaufen.ok, false)
    assert.equal(geaendert.ok, false)
    if (abgelaufen.ok || geaendert.ok) return
    assert.equal(abgelaufen.art, 'abgelaufen')
    assert.equal(geaendert.art, 'geaendert')
  })
})
