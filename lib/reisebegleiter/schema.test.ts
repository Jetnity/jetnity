// lib/reisebegleiter/schema.test.ts
//
// Die dritte Schranke, und seit Runde 8 die tragende: Das Ausgabeschema hat
// kein Freitextfeld. Hier wird nicht geprüft, ob ein Satz *abgelehnt* wird,
// sondern dass es keine Stelle gibt, an der er stehen könnte.
//
// Das ist der Unterschied zu sieben Vorfassungen. Die haben behauptet, kein aus
// einer erlaubten Wortmenge bildbarer Satz sei eine amtliche Aussage – eine
// Behauptung über einen unendlichen Satzraum, die sich nicht belegen, nur
// widerlegen liess. Siebenmal geschehen, zuletzt mit vier gewöhnlichen
// Wörtern: `Du musst ein gültiges Reisedokument haben.`
//
// Die Zusicherung dieses Slice ist jetzt am Typ ablesbar und wird hier
// abgelesen.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { MODELL_GRENZEN } from '@/lib/modell/konfiguration'
import { AMTLICHE_AUSSAGEN } from '@/lib/reisebegleiter/aussagen'
import { BEFUNDE, BEFUND_SCHLUESSEL } from '@/lib/reisebegleiter/befunde'
import {
  BEGLEITER_GRENZEN,
  BEGLEITER_JSON_SCHEMA,
  begleiterfrageSchema,
  modellauskunftSchema,
  traegtLink,
} from '@/lib/reisebegleiter/schema'

function auskunft(teil: Record<string, unknown> = {}) {
  return {
    befunde: [],
    bezuege: ['E1'],
    amtlicheHinweise: [],
    ...teil,
  }
}

describe('Die Frage an den Reisebegleiter', () => {
  test('eine zu kurze Frage wird abgelehnt', () => {
    assert.equal(begleiterfrageSchema.safeParse('was?').success, false)
  })

  test('eine Frage über der Eingabegrenze wird abgelehnt', () => {
    assert.equal(
      begleiterfrageSchema.safeParse('a'.repeat(MODELL_GRENZEN.eingabeZeichen + 1)).success,
      false,
    )
  })

  test('eine gewöhnliche Frage geht durch', () => {
    assert.ok(begleiterfrageSchema.safeParse('Was ist bei dieser Reise noch offen?').success)
  })
})

describe('Es gibt kein Freitextfeld – die Sätze sind nicht darstellbar', () => {
  // Die vom Technical Lead verlangten Regressionen. Sie sind hier, weil sie
  // keine Frage der Prüfung mehr sind: Für keinen dieser Sätze existiert ein
  // Feld. Geprüft wird über alle drei früheren Prosafelder.
  const ANGRIFFE = [
    // 1–3: die benannten Fälle.
    'Du musst ein gültiges Reisedokument haben.',
    'Du brauchst ein Dokument.',
    'Dein Reisedokument muss gültig sein.',
    // 4: Paraphrasen, die in keiner Liste stehen – strukturell unmöglich, nicht
    // erkannt. Deshalb darf hier beliebig paraphrasiert werden.
    'Ohne ein gültiges Formular kommst du nicht weiter.',
    'Für diese Reise ist eine behördliche Anmeldung Voraussetzung.',
    'Es empfiehlt sich, ein zweites Ausweisdokument mitzunehmen.',
    'Deine Papiere sollten mindestens sechs Monate über das Reiseende hinaus gelten.',
    'Ein Visum ist notwendig.',
    'V I S U M ist P F L I C H T.',
    'You need a visa for Italy.',
    'İtalya için vize gerekli.',
  ]

  const FELDER = ['antwort', 'unsicherheiten', 'naechsteSchritte', 'text', 'hinweis', 'begruendung']

  for (const angriff of ANGRIFFE) {
    test(`kein Feld nimmt „${angriff.slice(0, 40)}…"`, () => {
      for (const feld of FELDER) {
        // Als Zeichenkette und als Liste – beide früheren Formen.
        for (const wert of [angriff, [angriff]]) {
          const geprueft = modellauskunftSchema.safeParse(auskunft({ [feld]: wert }))
          assert.equal(geprueft.success, false, `durchgelassen: ${feld} = ${String(wert)}`)
        }
      }
    })
  }

  test('kein Feld des Schemas nimmt überhaupt freien Text', () => {
    // Die allgemeine Form der Zusicherung, unabhängig von Beispielen: Jedes
    // Zeichenkettenfeld ist entweder eine Aufzählung oder eine Bezugskennung.
    // Ein neues Textfeld würde diesen Test brechen – genau dafür ist er da.
    const erlaubt = new Set(['befunde', 'bezuege', 'amtlicheHinweise'])
    assert.deepEqual(new Set(Object.keys(BEGLEITER_JSON_SCHEMA.properties)), erlaubt)

    const satz = 'Du musst ein gültiges Reisedokument haben.'
    for (const feld of erlaubt) {
      for (const wert of [satz, [satz], [{ schluessel: satz, ref: null }], [{ ref: satz }]]) {
        assert.equal(
          modellauskunftSchema.safeParse(auskunft({ [feld]: wert })).success,
          false,
          `durchgelassen: ${feld}`,
        )
      }
    }
  })

  test('das JSON-Schema nennt dieselben Felder und lässt keine weiteren zu', () => {
    assert.equal(BEGLEITER_JSON_SCHEMA.additionalProperties, false)
    assert.deepEqual(
      [...BEGLEITER_JSON_SCHEMA.required],
      ['befunde', 'bezuege', 'amtlicheHinweise'],
    )
    assert.equal(BEGLEITER_JSON_SCHEMA.properties.befunde.items.additionalProperties, false)
    assert.equal(BEGLEITER_JSON_SCHEMA.properties.amtlicheHinweise.items.additionalProperties, false)
  })

  test('die Aufzählungen stimmen mit den Katalogen überein', () => {
    // Das JSON-Schema geht an die Plattform, die Zod-Prüfung bleibt hier.
    // Gehen sie auseinander, ist eine der beiden Seiten blind.
    assert.deepEqual(
      [...BEGLEITER_JSON_SCHEMA.properties.befunde.items.properties.schluessel.enum],
      [...BEFUND_SCHLUESSEL],
    )
    assert.deepEqual(
      [...BEGLEITER_JSON_SCHEMA.properties.amtlicheHinweise.items.properties.aussage.enum],
      [...AMTLICHE_AUSSAGEN],
    )
    assert.equal(BEFUND_SCHLUESSEL.length, BEFUNDE.length)
  })
})

describe('Die Auswahl des Modells', () => {
  test('eine leere Auswahl ist formal gültig', () => {
    assert.ok(modellauskunftSchema.safeParse(auskunft()).success)
  })

  test('eine Auswahl aus dem Katalog ist formal gültig', () => {
    assert.ok(
      modellauskunftSchema.safeParse(
        auskunft({ befunde: [{ schluessel: 'etappe_ohne_daten', ref: 'E1' }] }),
      ).success,
    )
  })

  test('ein Schlüssel ausserhalb des Katalogs wird abgelehnt', () => {
    assert.equal(
      modellauskunftSchema.safeParse(
        auskunft({ befunde: [{ schluessel: 'visum_erforderlich', ref: 'E1' }] }),
      ).success,
      false,
    )
  })

  test('ein unerwartetes Feld wird abgelehnt, nicht entfernt', () => {
    const geprueft = modellauskunftSchema.safeParse(auskunft({ lagen: ['irgendwas'] }))
    assert.equal(geprueft.success, false)
  })

  test('ein unerwartetes Feld innerhalb eines Befundes wird abgelehnt', () => {
    assert.equal(
      modellauskunftSchema.safeParse(
        auskunft({ befunde: [{ schluessel: 'etappe_ohne_daten', ref: 'E1', text: 'eigener Satz' }] }),
      ).success,
      false,
    )
  })

  test('eine formal unmögliche Bezugskennung wird abgelehnt', () => {
    assert.equal(modellauskunftSchema.safeParse(auskunft({ bezuege: ['etappe-1'] })).success, false)
  })

  test('mehr Einträge als erlaubt werden abgelehnt', () => {
    assert.equal(
      modellauskunftSchema.safeParse(
        auskunft({
          befunde: Array.from({ length: BEGLEITER_GRENZEN.befunde + 1 }, () => ({
            schluessel: 'etappe_ohne_daten',
            ref: 'E1',
          })),
        }),
      ).success,
      false,
    )
  })

  test('eine amtliche Aussage ausserhalb der Liste wird abgelehnt', () => {
    assert.equal(
      modellauskunftSchema.safeParse(
        auskunft({ amtlicheHinweise: [{ ref: 'O1', aussage: 'kein_visum_notwendig' }] }),
      ).success,
      false,
    )
  })
})

describe('Die Linkerkennung bleibt für die Nutzlast erhalten', () => {
  test('sie erkennt Links in nutzergeschriebenem Text', () => {
    // Gebraucht in `lib/reisebegleiter/nutzlast.ts`: Linkverdächtiger Freitext
    // aus der Projektion wird abgezogen, bevor das Modell ihn sieht.
    assert.ok(traegtLink('https://beispiel.example'))
    assert.ok(traegtLink('www.beispiel.example'))
    assert.ok(traegtLink('beispiel.com/pfad'))
    assert.equal(traegtLink('Etappe 1 · Rom, Italien'), false)
  })
})
