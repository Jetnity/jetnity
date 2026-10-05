import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { ActivityOption } from '@/lib/activities/domain'
import {
  activityNachweisAusKatalog,
  activityNachweisAusUmgebung,
  activityNachweisFehler,
  activityNachweisKontextAusGraph,
  activityNachweisKontextGleich,
  type ActivityNachweisKontext,
} from '@/lib/activities/nachweis'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

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

function katalog() {
  return activityNachweisAusKatalog({
    optionen: { 'opt-1': OPTION },
    kontexte: { 'opt-1': KONTEXT },
    abgelaufen: ['opt-alt'],
    geaendert: ['opt-neu'],
    fehler: { 'opt-err': 'error' },
  })
}

describe('Aktivitäts-Nachweis', () => {
  test('ohne Umgebung gibt es keinen Nachweis', () => {
    assert.equal(activityNachweisAusUmgebung(), null)
  })

  test('der erwartete Kontext kommt aus dem Reisegraphen, nicht aus dem Browser', () => {
    const reise = beispielreise()
    const kontext = activityNachweisKontextAusGraph(reise, {
      etappe: reise.stages[0]!,
      tag: reise.days[0]!,
    })
    assert.equal(kontext.destinationPlaceId, 'stage:stage-1')
    assert.equal(kontext.dayDate, '2026-09-12')
    assert.equal(kontext.participants, 2)
    assert.equal(kontext.currency, 'CHF')
  })

  test('eine unbekannte, abgelaufene oder geänderte Auswahl wird abgelehnt', async () => {
    const nachweis = katalog()
    const caller = { ...KONTEXT, timeslot: null }
    const unbekannt = await nachweis.nachweisen({ optionId: 'gibt-es-nicht', kontext: caller })
    const abgelaufen = await nachweis.nachweisen({ optionId: 'opt-alt', kontext: caller })
    const geaendert = await nachweis.nachweisen({ optionId: 'opt-neu', kontext: caller })
    const fehlerhaft = await nachweis.nachweisen({ optionId: 'opt-err', kontext: caller })
    assert.equal(unbekannt.ok, false)
    assert.equal(abgelaufen.ok, false)
    assert.equal(geaendert.ok, false)
    assert.equal(fehlerhaft.ok, false)
    if (unbekannt.ok || abgelaufen.ok || geaendert.ok || fehlerhaft.ok) return
    assert.equal(unbekannt.art, 'unbekannt')
    assert.equal(abgelaufen.art, 'abgelaufen')
    assert.equal(geaendert.art, 'geaendert')
    assert.equal(fehlerhaft.art, 'error')
  })

  test('gleiche optionId mit anderem Ziel, Datum, Teilnehmer oder Währung wird abgelehnt', async () => {
    const nachweis = katalog()
    const faelle: ActivityNachweisKontext[] = [
      { ...KONTEXT, destinationPlaceId: 'geonames:3176959', timeslot: null },
      { ...KONTEXT, dayDate: '2026-09-13', timeslot: null },
      { ...KONTEXT, participants: 4, timeslot: null },
      { ...KONTEXT, currency: 'EUR', timeslot: null },
    ]
    for (const kontext of faelle) {
      const ergebnis = await nachweis.nachweisen({ optionId: 'opt-1', kontext })
      assert.equal(ergebnis.ok, false)
      if (ergebnis.ok) return
      assert.equal(ergebnis.art, 'geaendert')
    }
  })

  test('eine gültige Katalogauswahl mit passendem Kontext liefert die Option', async () => {
    const nachweis = katalog()
    const ergebnis = await nachweis.nachweisen({
      optionId: 'opt-1',
      kontext: { ...KONTEXT, timeslot: null },
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.option.preis, 28)
    assert.equal(ergebnis.option.provider, 'test-activity')
  })

  test('ein geänderter Timeslot im Katalog fällt fail-closed', async () => {
    const nachweis = activityNachweisAusKatalog({
      optionen: { 'opt-1': OPTION },
      kontexte: {
        'opt-1': {
          ...KONTEXT,
          timeslot: {
            startsOn: '2026-09-12',
            startsAt: '10:00',
            endsOn: '2026-09-12',
            endsAt: '11:00',
          },
        },
      },
    })
    const ergebnis = await nachweis.nachweisen({
      optionId: 'opt-1',
      kontext: { ...KONTEXT, timeslot: null },
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'geaendert')
  })

  test('eine unvollständige Katalogzeile fällt fail-closed', async () => {
    const nachweis = activityNachweisAusKatalog({
      optionen: { 'opt-leer': { id: 'opt-leer', title: 'Ohne Provider' } },
      kontexte: { 'opt-leer': { ...KONTEXT, timeslot: null } },
    })
    const ergebnis = await nachweis.nachweisen({
      optionId: 'opt-leer',
      kontext: { ...KONTEXT, timeslot: null },
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'invalid')
  })

  test('unavailable bleibt die ehrliche Meldung ohne Nachweisquelle', () => {
    const fehler = activityNachweisFehler('unavailable')
    assert.equal(fehler.ok, false)
    if (fehler.ok) return
    assert.match(fehler.message, /noch nicht verbindlich/)
  })

  test('Kontextgleichheit prüft auch den Timeslot', () => {
    assert.equal(activityNachweisKontextGleich(KONTEXT, KONTEXT), true)
    assert.equal(
      activityNachweisKontextGleich(KONTEXT, { ...KONTEXT, timeslot: null }),
      false,
    )
  })
})
