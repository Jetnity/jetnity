import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  dokumentAblaufGegenReferenztag,
  dokumentAblaufGegenReise,
  dokumentKontoAblaufText,
  dokumentReiseAblaufText,
  dokumenteAblaufGegenReise,
  kalenderdatumLesen,
} from '@/lib/traveller/dokument-lebenszyklus'

const HEUTE = '2026-08-30'
const START = '2026-09-10'
const ENDE = '2026-09-20'

describe('kalenderdatumLesen', () => {
  test('nimmt nur echte ISO-Kalendertage an', () => {
    assert.equal(kalenderdatumLesen('2026-08-30'), '2026-08-30')
    assert.equal(kalenderdatumLesen('2028-02-29'), '2028-02-29')
  })

  test('lehnt fehlende, leere und nicht-string Werte fail-closed ab', () => {
    assert.equal(kalenderdatumLesen(null), null)
    assert.equal(kalenderdatumLesen(undefined), null)
    assert.equal(kalenderdatumLesen(''), null)
    assert.equal(kalenderdatumLesen(20260830), null)
    assert.equal(kalenderdatumLesen(new Date('2026-08-30T00:00:00.000Z')), null)
  })

  test('lehnt ungültige oder umdeutbare Schreibweisen ab, ohne sie umzuinterpretieren', () => {
    assert.equal(kalenderdatumLesen('01.01.2028'), null)
    assert.equal(kalenderdatumLesen('2026-8-30'), null)
    assert.equal(kalenderdatumLesen('2026-08-30T00:00:00Z'), null)
    assert.equal(kalenderdatumLesen('2026-08-30 '), null)
    assert.equal(kalenderdatumLesen(' 2026-08-30'), null)
    assert.equal(kalenderdatumLesen('2026/08/30'), null)
    assert.equal(kalenderdatumLesen('2026-02-31'), null)
    assert.equal(kalenderdatumLesen('2026-13-01'), null)
    assert.equal(kalenderdatumLesen('2025-02-29'), null)
    assert.equal(kalenderdatumLesen('2026-00-10'), null)
    assert.equal(kalenderdatumLesen('2026-04-31'), null)
  })

  test('bleibt der Kalendertag, auch wenn Date-Local-Parsing ihn verschieben würde', () => {
    const raw = '2026-08-30'
    const lokal = new Date(raw)
    const lokalKalender = [
      lokal.getFullYear(),
      String(lokal.getMonth() + 1).padStart(2, '0'),
      String(lokal.getDate()).padStart(2, '0'),
    ].join('-')
    assert.equal(kalenderdatumLesen(raw), raw)
    if (lokalKalender !== raw) {
      assert.notEqual(kalenderdatumLesen(raw), lokalKalender)
    }
  })
})

describe('dokumentAblaufGegenReferenztag', () => {
  test('fehlendes Ablaufdatum bleibt unknown und behauptet keine Gültigkeit', () => {
    const lage = dokumentAblaufGegenReferenztag(null, HEUTE)
    assert.deepEqual(lage, { art: 'unknown', grund: 'expiry_missing' })
    assert.match(dokumentKontoAblaufText(lage), /nicht hinterlegt/)
    assert.equal(/gültig|genügt|safe|valid/i.test(dokumentKontoAblaufText(lage)), false)
  })

  test('unlesbares Ablaufdatum bleibt fail-closed unknown', () => {
    assert.deepEqual(dokumentAblaufGegenReferenztag('2026-02-31', HEUTE), {
      art: 'unknown',
      grund: 'expiry_invalid',
    })
    assert.deepEqual(dokumentAblaufGegenReferenztag('01.01.2028', HEUTE), {
      art: 'unknown',
      grund: 'expiry_invalid',
    })
    assert.deepEqual(dokumentAblaufGegenReferenztag('2026-08-30T00:00:00Z', HEUTE), {
      art: 'unknown',
      grund: 'expiry_invalid',
    })
  })

  test('Ablauf vor dem Referenztag ist expired', () => {
    assert.deepEqual(dokumentAblaufGegenReferenztag('2026-08-29', HEUTE), {
      art: 'expired',
      expiresOn: '2026-08-29',
      referenztag: HEUTE,
    })
  })

  test('Referenztag-Grenze ist deterministisch: am Ablaufdatum noch nicht abgelaufen', () => {
    assert.deepEqual(dokumentAblaufGegenReferenztag(HEUTE, HEUTE), {
      art: 'not_expired',
      expiresOn: HEUTE,
      referenztag: HEUTE,
    })
    assert.deepEqual(dokumentAblaufGegenReferenztag('2026-08-31', HEUTE), {
      art: 'not_expired',
      expiresOn: '2026-08-31',
      referenztag: HEUTE,
    })
  })

  test('ohne gültigen Referenztag keine Ablauf-Einordnung', () => {
    assert.deepEqual(dokumentAblaufGegenReferenztag('2026-08-29', null), {
      art: 'unknown',
      grund: 'reference_missing',
    })
    assert.deepEqual(dokumentAblaufGegenReferenztag('2026-08-29', '2026-08-32'), {
      art: 'unknown',
      grund: 'reference_invalid',
    })
  })
})

describe('dokumentAblaufGegenReise', () => {
  test('Ablauf vor Reisebeginn ist Warnzustand', () => {
    assert.deepEqual(dokumentAblaufGegenReise('2026-09-09', START, ENDE), {
      art: 'expires_before_trip_start',
      expiresOn: '2026-09-09',
      tripStart: START,
      tripEnd: ENDE,
    })
  })

  test('Ablauf genau am Reisebeginn gilt als während der Reise', () => {
    assert.deepEqual(dokumentAblaufGegenReise(START, START, ENDE), {
      art: 'expires_during_trip',
      expiresOn: START,
      tripStart: START,
      tripEnd: ENDE,
    })
  })

  test('Ablauf während der Reise, vor Reiseende, ist Warnzustand', () => {
    assert.deepEqual(dokumentAblaufGegenReise('2026-09-15', START, ENDE), {
      art: 'expires_during_trip',
      expiresOn: '2026-09-15',
      tripStart: START,
      tripEnd: ENDE,
    })
    assert.deepEqual(dokumentAblaufGegenReise('2026-09-19', START, ENDE), {
      art: 'expires_during_trip',
      expiresOn: '2026-09-19',
      tripStart: START,
      tripEnd: ENDE,
    })
  })

  test('Ablauf genau am Reiseende liegt nicht vor Reiseende', () => {
    assert.deepEqual(dokumentAblaufGegenReise(ENDE, START, ENDE), {
      art: 'expires_on_or_after_trip_end',
      expiresOn: ENDE,
      tripStart: START,
      tripEnd: ENDE,
    })
  })

  test('Ablauf nach Reiseende ist neutral und keine Reise-Zulässigkeit', () => {
    const lage = dokumentAblaufGegenReise('2026-09-21', START, ENDE)
    assert.deepEqual(lage, {
      art: 'expires_on_or_after_trip_end',
      expiresOn: '2026-09-21',
      tripStart: START,
      tripEnd: ENDE,
    })
    assert.equal(/visa|einreise|bordkarte|best|preferred|chosen|gültig für/i.test(dokumentReiseAblaufText(lage)), false)
  })

  test('unvollständige Reisedaten erfinden keine volle Reise-Einordnung', () => {
    assert.deepEqual(dokumentAblaufGegenReise('2026-09-15', START, null), {
      art: 'unknown',
      grund: 'trip_dates_incomplete',
    })
    assert.deepEqual(dokumentAblaufGegenReise('2026-09-15', null, ENDE), {
      art: 'unknown',
      grund: 'trip_dates_incomplete',
    })
    assert.deepEqual(dokumentAblaufGegenReise('2026-09-15', '', ''), {
      art: 'unknown',
      grund: 'trip_dates_incomplete',
    })
    assert.deepEqual(dokumentAblaufGegenReise('2026-09-09', START, null).art, 'unknown')
  })

  test('ungültiger oder widersprüchlicher Reisezeitraum bleibt fail-closed', () => {
    assert.deepEqual(dokumentAblaufGegenReise('2026-09-15', '2026-09-20', '2026-09-10'), {
      art: 'unknown',
      grund: 'trip_dates_invalid',
    })
    assert.deepEqual(dokumentAblaufGegenReise('2026-09-15', '2026-09-32', ENDE), {
      art: 'unknown',
      grund: 'trip_dates_invalid',
    })
  })

  test('eintägige Reise: Ablauf am einzigen Tag liegt nicht vor Reiseende', () => {
    assert.deepEqual(dokumentAblaufGegenReise(START, START, START), {
      art: 'expires_on_or_after_trip_end',
      expiresOn: START,
      tripStart: START,
      tripEnd: START,
    })
    assert.deepEqual(dokumentAblaufGegenReise('2026-09-09', START, START).art, 'expires_before_trip_start')
  })
})

describe('dokumenteAblaufGegenReise', () => {
  test('wertet mehrere Dokumente unabhängig aus und wählt keines aus', () => {
    const dokumente = [
      { expiresOn: '2026-09-01', issuingCountryCode: 'CH', citizenshipClientRef: 'citizenship:CH' },
      { expiresOn: '2026-09-15', issuingCountryCode: 'DE', citizenshipClientRef: 'citizenship:DE' },
      { expiresOn: '2026-09-30', issuingCountryCode: 'IT', citizenshipClientRef: null },
      { expiresOn: null, issuingCountryCode: 'FR', citizenshipClientRef: 'citizenship:FR' },
    ]
    const lagen = dokumenteAblaufGegenReise(dokumente, START, ENDE)
    assert.equal(lagen.length, 4)
    assert.equal(lagen[0]?.art, 'expires_before_trip_start')
    assert.equal(lagen[1]?.art, 'expires_during_trip')
    assert.equal(lagen[2]?.art, 'expires_on_or_after_trip_end')
    assert.deepEqual(lagen[3], { art: 'unknown', grund: 'expiry_missing' })
    assert.equal(lagen.some((lage) => lage.art === 'expires_on_or_after_trip_end' && lagen[0] === lage), false)
  })

  test('ändert das Ergebnis nicht, wenn nur Issuer oder Staatsbürgerschaft variieren', () => {
    const basis = dokumentAblaufGegenReise('2026-09-15', START, ENDE)
    const mitAnderemKontext = dokumenteAblaufGegenReise(
      [
        { expiresOn: '2026-09-15', issuingCountryCode: 'US', citizenshipClientRef: 'citizenship:US' },
        { expiresOn: '2026-09-15', issuingCountryCode: 'CH', citizenshipClientRef: 'citizenship:CH' },
      ],
      START,
      ENDE,
    )
    assert.deepEqual(mitAnderemKontext[0], basis)
    assert.deepEqual(mitAnderemKontext[1], basis)
  })
})
