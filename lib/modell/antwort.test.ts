// lib/modell/antwort.test.ts
//
// Die Antwort der Gegenseite ist die Stelle, an der ein Modellweg still versagt.
// Ein Fehler dort sieht nicht aus wie ein Fehler: Der Aufruf war erfolgreich, die
// Antwort kam, der HTTP-Status ist 200 – und der Text steht an einer anderen
// Stelle als erwartet, oder es ist eine Ablehnung, oder sie ist am
// Ausgabebudget abgeschnitten. In allen drei Fällen wäre das naive Ergebnis
// „leerer Vorschlag“, und ein leerer Vorschlag darf nach Abschnitt 10 der
// Aufgabenstellung nicht wie eine geplante Reise aussehen.
//
// Jeder Fall hier ist ohne einen bezahlten Aufruf erreichbar, weil
// `lib/modell/antwort.ts` von `fetch` getrennt ist. Genau dafür steht die Datei
// dort und nicht in `lib/modell/aufruf.ts`.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { antwortAus, nutzungAus, rohergebnisAus } from '@/lib/modell/antwort'
import {
  ANTWORT_ABGESCHNITTEN,
  ANTWORT_KAPUTT,
  ANTWORT_VERWEIGERT,
  VORSCHLAG_THAILAND,
  antwortMit,
} from '@/lib/reisevorschlag/fixtures/antworten'

describe('Die Tokennutzung einer Antwort', () => {
  test('vollständige Angaben werden gelesen', () => {
    assert.deepEqual(
      nutzungAus({
        input_tokens: 1800,
        input_tokens_details: { cached_tokens: 1024 },
        output_tokens: 900,
      }),
      { eingabeTokens: 1800, gecachteTokens: 1024, ausgabeTokens: 900 },
    )
  })

  test('ohne Cache-Angabe sind es null gecachte Tokens', () => {
    // Hier ist 0 richtig: Der Cache-Anteil ist bekannt und leer, wenn die API die
    // Eingabe berichtet, aber keine Details. Das ist die teurere Annahme.
    assert.deepEqual(nutzungAus({ input_tokens: 1800, output_tokens: 900 }), {
      eingabeTokens: 1800,
      gecachteTokens: 0,
      ausgabeTokens: 900,
    })
  })

  test('eine fehlende Nutzung ist null und nicht null Tokens', () => {
    // Der Unterschied entscheidet über Geld: `null` lässt die Reservierung des
    // schlechtesten Falls stehen, `0` würde sie auf nichts senken – für einen
    // Aufruf, der stattgefunden hat.
    assert.equal(nutzungAus(undefined), null)
    assert.equal(nutzungAus(null), null)
    assert.equal(nutzungAus({}), null)
    assert.equal(nutzungAus({ input_tokens: 'viele', output_tokens: 900 }), null)
    assert.equal(nutzungAus('1800'), null)
  })

  test('Bruchzahlen und negative Werte werden zurechtgebogen', () => {
    assert.deepEqual(nutzungAus({ input_tokens: 1799.6, output_tokens: -5 }), {
      eingabeTokens: 1800,
      gecachteTokens: 0,
      ausgabeTokens: 0,
    })
  })
})

describe('Der Text einer Antwort', () => {
  test('er wird auch hinter einem reasoning-Eintrag gefunden', () => {
    // Der eigentliche Grund für diese Funktion: `output[0]` ist bei einem
    // Denkmodell nicht die Nachricht. Ein `output[0].content[0].text` wäre die
    // häufigste Ursache für ein „die Antwort ist leer“, das keine ist.
    const gelesen = antwortAus([
      { type: 'reasoning', summary: [] },
      { type: 'message', content: [{ type: 'output_text', text: '{"titel":"Rom"}' }] },
    ])

    assert.deepEqual(gelesen, { text: '{"titel":"Rom"}' })
  })

  test('eine Ablehnung ist kein Text', () => {
    assert.deepEqual(
      antwortAus([{ type: 'message', content: [{ type: 'refusal', refusal: 'Nein.' }] }]),
      { verweigert: 'Nein.' },
    )
  })

  test('ohne Nachricht gibt es nichts zu lesen', () => {
    assert.equal(antwortAus([{ type: 'reasoning', summary: [] }]), null)
    assert.equal(antwortAus([]), null)
    assert.equal(antwortAus(null), null)
    assert.equal(antwortAus('{"titel":"Rom"}'), null)
    assert.equal(antwortAus([{ type: 'message', content: 'Rom' }]), null)
  })
})

describe('Aus Status und Körper wird ein Ergebnis', () => {
  test('eine gültige Antwort trägt Text und Nutzung', () => {
    const ergebnis = rohergebnisAus(200, antwortMit(VORSCHLAG_THAILAND))

    assert.equal(ergebnis.ok, true)
    if (ergebnis.ok) {
      assert.deepEqual(JSON.parse(ergebnis.text), VORSCHLAG_THAILAND)
      assert.deepEqual(ergebnis.nutzung, {
        eingabeTokens: 1800,
        gecachteTokens: 1024,
        ausgabeTokens: 900,
      })
    }
  })

  test('HTTP 4xx ist ein Defekt bei uns', () => {
    // Schema, Modellname, Kontingent des OpenAI-Kontos. Die Unterscheidung
    // entscheidet, wo gesucht wird – und was auf dem Bildschirm steht.
    const ergebnis = rohergebnisAus(400, { error: { message: 'Unknown parameter: foo' } })

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.klasse, 'anbieter-4xx')
  })

  test('HTTP 5xx ist ein Ausfall dort', () => {
    const ergebnis = rohergebnisAus(503, {})

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.klasse, 'anbieter-5xx')
  })

  test('ein Fehlerkörper wird nicht in den Hinweis übernommen', () => {
    // Eine Fehlermeldung der API kann die Anfrage zitieren, und die enthält den
    // Freitext des Nutzers. In einem Kostenprotokoll hat er nichts zu suchen.
    const ergebnis = rohergebnisAus(400, {
      error: { message: 'Invalid input: 7 Tage Thailand ab Zürich, zwei Personen' },
    })

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) {
      assert.doesNotMatch(ergebnis.hinweis, /Thailand/)
      assert.match(ergebnis.hinweis, /HTTP 400/)
    }
  })

  test('eine abgeschnittene Antwort ist kein Erfolg', () => {
    // `status: 'incomplete'` kommt mit HTTP 200. Ohne diese Prüfung wäre ein am
    // Ausgabebudget abgebrochener Vorschlag ein „ungültiges JSON“ – und die
    // Meldung an den Nutzer wäre die falsche.
    const ergebnis = rohergebnisAus(200, ANTWORT_ABGESCHNITTEN)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) {
      assert.equal(ergebnis.klasse, 'abgeschnitten')
      assert.match(ergebnis.hinweis, /max_output_tokens/)
      assert.deepEqual(ergebnis.nutzung, {
        eingabeTokens: 1800,
        gecachteTokens: 0,
        ausgabeTokens: 6000,
      })
    }
  })

  test('eine Ablehnung wird als Ablehnung gemeldet', () => {
    const ergebnis = rohergebnisAus(200, ANTWORT_VERWEIGERT)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.klasse, 'verweigert')
  })

  test('der Wortlaut einer Ablehnung bleibt im Protokoll aussen vor', () => {
    // Er stammt aus dem Modell und kann den Nutzertext aufgreifen.
    const ergebnis = rohergebnisAus(200, {
      status: 'completed',
      output: [
        {
          type: 'message',
          content: [{ type: 'refusal', refusal: 'Zu „Thailand ab Zürich“ sage ich nichts.' }],
        },
      ],
    })

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.doesNotMatch(ergebnis.hinweis, /Thailand/)
  })

  test('eine Antwort ohne Text ist unbrauchbar, nicht leer', () => {
    const ergebnis = rohergebnisAus(200, { status: 'completed', output: [] })

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.klasse, 'ungueltige-antwort')
  })

  test('ein Text aus Leerzeichen zählt nicht als Text', () => {
    const ergebnis = rohergebnisAus(200, {
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: '   ' }] }],
    })

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.klasse, 'ungueltige-antwort')
  })

  test('unlesbares JSON kommt hier noch durch – die Prüfung folgt später', () => {
    // Diese Funktion liest die Hülle, nicht den Inhalt. Dass der Text kein
    // gültiges JSON ist, entscheidet `reisevorschlagErzeugen()`.
    const ergebnis = rohergebnisAus(200, ANTWORT_KAPUTT)

    assert.equal(ergebnis.ok, true)
  })

  test('ein Körper, der kein Objekt ist, ist ein Fehlschlag und kein Absturz', () => {
    // `antwort.json()` kann `null` liefern, wenn die Gegenseite HTML schickt –
    // etwa die Fehlerseite eines Proxys.
    const ergebnis = rohergebnisAus(200, null)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) {
      assert.equal(ergebnis.klasse, 'ungueltige-antwort')
      assert.equal(ergebnis.nutzung, null)
    }
  })

  test('bei einem Fehlschlag wird eine berichtete Nutzung trotzdem gelesen', () => {
    // Ein abgelehnter oder abgeschnittener Aufruf hat Tokens verbraucht und wird
    // berechnet. Sie zu verwerfen hiesse, ihn als kostenlos zu protokollieren.
    const ergebnis = rohergebnisAus(200, ANTWORT_VERWEIGERT)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.nutzung?.ausgabeTokens, 12)
  })
})
