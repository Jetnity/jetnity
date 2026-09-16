// lib/reisebegleiter/schema.test.ts
//
// Das Schema ist die Stelle, an der Modelloutput untrusted input bleibt.
// Geprüft wird nicht, ob eine Auskunft gut ist, sondern ob sie überhaupt eine
// Auskunft sein darf: kein Betrag, kein Link, keine erfundene Bezugskennung,
// keine unbegrenzte Länge.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { MODELL_GRENZEN } from '@/lib/modell/konfiguration'
import {
  BEGLEITER_GRENZEN,
  BEGLEITER_JSON_SCHEMA,
  begleiterfrageSchema,
  modellauskunftSchema,
  traegtLink,
} from '@/lib/reisebegleiter/schema'

function auskunft(teil: Record<string, unknown> = {}) {
  return {
    antwort: 'Für diese Reise ist der amtliche Prüfstand offen.',
    unsicherheiten: ['Die offizielle Quelle ist nicht aktiv.'],
    naechsteSchritte: ['Reisedokumente in der Reisevorbereitung ergänzen.'],
    bezuege: ['E1', 'O2'],
    ...teil,
  }
}

describe('Die Frage an den Reisebegleiter', () => {
  test('braucht ein paar Worte', () => {
    assert.equal(begleiterfrageSchema.safeParse('Visum?').success, false)
    assert.equal(begleiterfrageSchema.safeParse('   ').success, false)
  })

  test('teilt die Freitextgrenze mit den übrigen Modellwegen', () => {
    assert.equal(BEGLEITER_GRENZEN.frageMaximum, MODELL_GRENZEN.eingabeZeichen)
    assert.equal(
      begleiterfrageSchema.safeParse('a'.repeat(BEGLEITER_GRENZEN.frageMaximum)).success,
      true,
    )
    assert.equal(
      begleiterfrageSchema.safeParse('a'.repeat(BEGLEITER_GRENZEN.frageMaximum + 1)).success,
      false,
    )
  })

  test('vereinheitlicht Steuerzeichen statt sie weiterzugeben', () => {
    const geprueft = begleiterfrageSchema.safeParse('Brauche\tich\nein Dokument?')
    assert.equal(geprueft.success, true)
    assert.equal(geprueft.success && geprueft.data, 'Brauche ich ein Dokument?')
  })
})

describe('Die Auskunft des Modells', () => {
  test('wird in gültiger Form angenommen', () => {
    const geprueft = modellauskunftSchema.safeParse(auskunft())
    assert.equal(geprueft.success, true)
  })

  test('trägt keinen Betrag', () => {
    for (const text of ['Rechne mit CHF 400.', 'Etwa 1200 Euro pro Person.', 'ab ca. € 90']) {
      assert.equal(
        modellauskunftSchema.safeParse(auskunft({ antwort: text })).success,
        false,
        `Betrag durchgelassen: ${text}`,
      )
    }
  })

  test('trägt keinen Betrag in Unsicherheiten oder Schritten', () => {
    assert.equal(
      modellauskunftSchema.safeParse(auskunft({ unsicherheiten: ['Budget offen, ca. 300 EUR'] }))
        .success,
      false,
    )
    assert.equal(
      modellauskunftSchema.safeParse(auskunft({ naechsteSchritte: ['Visum für 50 USD beantragen'] }))
        .success,
      false,
    )
  })

  test('trägt keinen Link', () => {
    for (const text of [
      'Siehe https://beispiel.example/visa',
      'Mehr unter www.behoerde.test',
      'Quelle: konsulat.gov',
    ]) {
      assert.equal(traegtLink(text), true, `Link nicht erkannt: ${text}`)
      assert.equal(
        modellauskunftSchema.safeParse(auskunft({ antwort: text })).success,
        false,
        `Link durchgelassen: ${text}`,
      )
    }
  })

  test('hält gewöhnliche deutsche Sätze nicht für einen Link', () => {
    for (const text of [
      'Der Prüfstand ist offen. Ergänze zuerst die Reisedaten.',
      'Die Etappe in Rom ist vom 15. bis 20. September geplant.',
      'Es fehlen Angaben: Staatsangehörigkeit, Ausstellungsland.',
    ]) {
      assert.equal(traegtLink(text), false, `Fehlalarm: ${text}`)
    }
  })

  test('bleibt in den Längen- und Anzahlgrenzen', () => {
    assert.equal(
      modellauskunftSchema.safeParse(
        auskunft({ antwort: 'a'.repeat(BEGLEITER_GRENZEN.antwort + 1) }),
      ).success,
      false,
    )
    assert.equal(
      modellauskunftSchema.safeParse(
        auskunft({
          unsicherheiten: Array.from(
            { length: BEGLEITER_GRENZEN.unsicherheiten + 1 },
            (_, stelle) => `offen ${stelle}`,
          ),
        }),
      ).success,
      false,
    )
    assert.equal(
      modellauskunftSchema.safeParse(
        auskunft({
          bezuege: Array.from({ length: BEGLEITER_GRENZEN.bezuege + 1 }, (_, s) => `E${s + 1}`),
        }),
      ).success,
      false,
    )
  })

  test('nimmt eine leere Antwort nicht an', () => {
    assert.equal(modellauskunftSchema.safeParse(auskunft({ antwort: '   ' })).success, false)
  })

  test('nimmt nur Bezugskennungen in der ausgegebenen Form an', () => {
    for (const ref of ['stage-fl', 'O', '12', 'ETAPPE1', 'E1234', 'e1']) {
      assert.equal(
        modellauskunftSchema.safeParse(auskunft({ bezuege: [ref] })).success,
        false,
        `Bezugsform durchgelassen: ${ref}`,
      )
    }
    for (const ref of ['E1', 'R2', 'O12', 'S3', 'Z9']) {
      assert.equal(
        modellauskunftSchema.safeParse(auskunft({ bezuege: [ref] })).success,
        true,
        `Bezugsform abgelehnt: ${ref}`,
      )
    }
  })

  test('kennt kein Feld für Anforderung, Preis, Anbieter, Buchung oder Quelle', () => {
    // `additionalProperties: false` und `strict: true` machen ein solches Feld
    // auf der Plattformseite unaussprechbar. Diese Prüfung hält den Vertrag
    // fest, damit ein späteres Feld eine Entscheidung ist und kein Versehen.
    assert.deepEqual(
      [...BEGLEITER_JSON_SCHEMA.required],
      ['antwort', 'unsicherheiten', 'naechsteSchritte', 'bezuege'],
    )
    assert.deepEqual(
      Object.keys(BEGLEITER_JSON_SCHEMA.properties).sort(),
      ['antwort', 'bezuege', 'naechsteSchritte', 'unsicherheiten'],
    )
    assert.equal(BEGLEITER_JSON_SCHEMA.additionalProperties, false)
  })

  test('lehnt ein zusätzliches Feld ab, auch wenn die Plattform es durchliesse', () => {
    const geprueft = modellauskunftSchema.safeParse(
      auskunft({ visumErforderlich: false, preis: 120 }),
    )
    // Zod ist hier nicht strict; entscheidend ist, dass das Feld nicht in den
    // Wert übernommen wird und damit nirgends gelesen werden kann.
    assert.equal(geprueft.success, true)
    assert.equal(geprueft.success && 'visumErforderlich' in geprueft.data, false)
    assert.equal(geprueft.success && 'preis' in geprueft.data, false)
  })
})
