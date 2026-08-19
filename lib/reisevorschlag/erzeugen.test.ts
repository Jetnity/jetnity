// lib/reisevorschlag/erzeugen.test.ts
//
// Der Ablauf eines Reisevorschlags, Fall für Fall.
//
// Abschnitt 10 der Aufgabenstellung nennt dreizehn Fehlerfälle und einen Satz
// dazu: Ein Modellfehler darf niemals als „leere Reise" oder erfolgreiche
// Planung erscheinen. Genau das prüft diese Datei – jeder Fehlschlag endet mit
// `ok: false`, einer nachvollziehbaren Klasse und einem Satz, der einem Menschen
// sagt, was jetzt hilft.
//
// Der zweite Teil ist Geld. Ein bezahlter Aufruf muss protokolliert werden, und
// zwar genau einmal und mit dem, was wirklich geschehen ist. Zwei Abschlüsse
// wären eine doppelte Zeile, keiner eine dauerhaft offene Reservierung – und ein
// Abschluss mit der Klasse `erfolg` für eine schemawidrige Antwort wäre eine
// Zahl, die niemandem mehr erklärt, warum die Kosten gestiegen sind.
//
// Kein Test hier ruft ein Modell auf. `reisevorschlagErzeugen()` nimmt seine
// Werkzeuge als Argumente – genau deshalb.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { rohergebnisAus } from '@/lib/modell/antwort'
import type { Modellanfrage, Modellergebnis } from '@/lib/modell/aufruf'
import type { Ergebnisklasse, Modellzustand } from '@/lib/modell/konfiguration'
import type { Tokennutzung } from '@/lib/modell/preise'
import { reisevorschlagErzeugen, type Werkzeuge } from '@/lib/reisevorschlag/erzeugen'
import { VORSCHLAG_FASSUNG } from '@/lib/reisevorschlag/schema'
import {
  ANTWORT_ABGESCHNITTEN,
  ANTWORT_KAPUTT,
  ANTWORT_VERWEIGERT,
  VORSCHLAG_THAILAND,
  antwortMit,
  vorschlagMitTagen,
} from '@/lib/reisevorschlag/fixtures/antworten'
import { REISEIDEEN, zuLangerText } from '@/lib/reisevorschlag/fixtures/reiseideen'

const IDEE = '7 Tage Thailand ab Zürich, zwei Personen, maximal CHF 3’000, Strand und Essen.'
const HEUTE = '2026-08-18'

const AKTIV: Modellzustand = { aktiv: true, modell: 'gpt-5.6-luna', aufwand: 'low' }

type Protokoll = {
  klasse: Ergebnisklasse
  nutzung: Tokennutzung | null
  laufzeitMs: number
  id: string
}

/**
 * Werkzeuge, die einen bestimmten Fall herstellen – und mitschreiben, was mit
 * ihnen geschehen ist.
 *
 * `abschluesse` und `anfragen` sind der eigentliche Prüfgegenstand vieler Tests:
 * Wie oft wurde das Kontingent beansprucht, wie oft abgeschlossen, und mit
 * welcher Klasse.
 */
function werkzeuge(abweichung: Partial<Werkzeuge> = {}) {
  const abschluesse: Protokoll[] = []
  const anfragen: Modellanfrage[] = []
  let beansprucht = 0

  const gestellt: Werkzeuge = {
    zustand: AKTIV,
    beanspruchen: async () => {
      beansprucht += 1
      return { ok: true as const, id: 'nutzung-1' }
    },
    abschliessen: async (id, klasse, nutzung, laufzeitMs) => {
      abschluesse.push({ id, klasse, nutzung, laufzeitMs })
    },
    aufrufen: async (anfrage) => {
      anfragen.push(anfrage)
      return { ...rohergebnisAus(200, antwortMit(VORSCHLAG_THAILAND)), laufzeitMs: 4200 }
    },
    heute: HEUTE,
    ...abweichung,
  }

  return {
    gestellt,
    abschluesse,
    anfragen,
    beanspruchtWie: () => beansprucht,
  }
}

/** Ein Aufruf, der eine bestimmte Antwort der API liefert. */
function antwortet(status: number, koerper: unknown, laufzeitMs = 4200) {
  return async (): Promise<Modellergebnis> => ({
    ...rohergebnisAus(status, koerper),
    laufzeitMs,
  })
}

describe('Ein Vorschlag entsteht', () => {
  test('aus einer gültigen Beschreibung wird ein geprüfter Vorschlag', async () => {
    const werkzeug = werkzeuge()
    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(ergebnis.ok, true)
    if (ergebnis.ok) {
      assert.equal(ergebnis.vorschlag.titel, VORSCHLAG_THAILAND.titel)
      assert.equal(ergebnis.vorschlag.tage.length, 7)
      assert.equal(ergebnis.vorschlag.fassung, VORSCHLAG_FASSUNG)
    }
  })

  test('der Reisewunsch ist der Text des Nutzers, unverändert im Inhalt', async () => {
    // Nicht das, was das Modell daraus gemacht hat: Der Umweg über das Modell wäre
    // ein Weg, auf dem sich die Angabe ändern könnte. Der genannte Betrag bleibt
    // stehen – er ist die Angabe des Nutzers über sein Budget.
    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeuge().gestellt)

    assert.equal(ergebnis.ok, true)
    if (ergebnis.ok) assert.equal(ergebnis.vorschlag.reisewunsch, IDEE)
  })

  test('ein Reisewunsch über der Feldlänge wird gekürzt, nicht abgelehnt', async () => {
    // Die Beschreibung darf länger sein als das gespeicherte Feld
    // (`trips.travel_wish`, 1000 Zeichen). Eine Ablehnung an dieser Stelle wäre
    // eine Ablehnung nach einem bezahlten Aufruf.
    const lang = `${IDEE} ${'Und wir mögen kleine Hotels. '.repeat(40)}`.slice(0, 1900)
    const ergebnis = await reisevorschlagErzeugen(lang, werkzeuge().gestellt)

    assert.equal(ergebnis.ok, true)
    if (ergebnis.ok) assert.equal(ergebnis.vorschlag.reisewunsch?.length, 1000)
  })

  test('das heutige Datum steht in den Systemregeln', async () => {
    // Ohne es lässt sich „nächsten Sommer" nicht in einen Zeitraum übersetzen.
    const werkzeug = werkzeuge()
    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(werkzeug.anfragen.length, 1)
    assert.match(werkzeug.anfragen[0].systemregeln, new RegExp(HEUTE))
  })

  test('Regeln und Nutzertext gehen getrennt', async () => {
    // Verkettet wären sie die Einladung, Regeln durch Eingaben zu überschreiben.
    const werkzeug = werkzeuge()
    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    const anfrage = werkzeug.anfragen[0]
    assert.doesNotMatch(anfrage.systemregeln, /Thailand ab Zürich/)
    assert.match(anfrage.nutzertext, /Thailand ab Zürich/)
  })

  test('Modell und Denkaufwand kommen aus dem Zustand', async () => {
    const werkzeug = werkzeuge({ zustand: { aktiv: true, modell: 'gpt-5.6-luna', aufwand: 'none' } })
    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(werkzeug.anfragen[0].modell, 'gpt-5.6-luna')
    assert.equal(werkzeug.anfragen[0].aufwand, 'none')
  })

  test('der Erfolg wird als Erfolg protokolliert – mit den berichteten Tokens', async () => {
    const werkzeug = werkzeuge()
    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.deepEqual(werkzeug.abschluesse, [
      {
        id: 'nutzung-1',
        klasse: 'erfolg',
        nutzung: { eingabeTokens: 1800, gecachteTokens: 1024, ausgabeTokens: 900 },
        laufzeitMs: 4200,
      },
    ])
  })
})

describe('Die Eingabe wird geprüft, bevor Geld ausgegeben wird', () => {
  test('ein zu kurzer Text kostet kein Kontingent', async () => {
    const werkzeug = werkzeuge()
    const ergebnis = await reisevorschlagErzeugen('Rom', werkzeug.gestellt)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.klasse, 'eingabe')
    assert.equal(werkzeug.beanspruchtWie(), 0)
    assert.deepEqual(werkzeug.abschluesse, [])
  })

  test('ein zu langer Text ebenso', async () => {
    const werkzeug = werkzeuge()
    const ergebnis = await reisevorschlagErzeugen(zuLangerText(), werkzeug.gestellt)

    assert.equal(ergebnis.ok, false)
    assert.equal(werkzeug.beanspruchtWie(), 0)
  })

  test('etwas, das kein Text ist', async () => {
    // Eine Server Action ist ein öffentlicher HTTP-Endpunkt. Was dort ankommt,
    // muss kein String sein.
    for (const eingabe of [null, undefined, 42, { text: IDEE }, [IDEE]]) {
      const werkzeug = werkzeuge()
      const ergebnis = await reisevorschlagErzeugen(eingabe, werkzeug.gestellt)

      assert.equal(ergebnis.ok, false, JSON.stringify(eingabe))
      assert.equal(werkzeug.beanspruchtWie(), 0)
    }
  })

  test('jede Reiseidee wird behandelt wie erwartet', async () => {
    for (const idee of REISEIDEEN) {
      const werkzeug = werkzeuge()
      const ergebnis = await reisevorschlagErzeugen(idee.text, werkzeug.gestellt)

      if (idee.erwartet === 'angenommen') {
        assert.equal(ergebnis.ok, true, `„${idee.name}" wurde abgelehnt`)
        assert.equal(werkzeug.beanspruchtWie(), 1, `„${idee.name}" hat kein Kontingent gebucht`)
      } else {
        assert.equal(ergebnis.ok, false, `„${idee.name}" wurde angenommen`)
        assert.equal(werkzeug.beanspruchtWie(), 0, `„${idee.name}" hat Kontingent gebucht`)
      }
    }
  })

  test('eine Injection-artige Eingabe wird geplant, nicht ausgeführt', async () => {
    // Sie ist eine Reisebeschreibung wie jede andere: Sie geht als Nutzertext an
    // das Modell, und was zurückkommt, wird gegen dasselbe Schema geprüft.
    const injection = REISEIDEEN.find((idee) => idee.name === 'Prompt-Injection: Regeln ignorieren')
    assert.ok(injection)

    const werkzeug = werkzeuge()
    const ergebnis = await reisevorschlagErzeugen(injection.text, werkzeug.gestellt)

    assert.equal(ergebnis.ok, true)
    assert.equal(werkzeug.anfragen[0].nutzertext, injection.text)
    if (ergebnis.ok) {
      // Auch wenn das Modell der Anweisung gefolgt wäre: Ein `status` gibt es im
      // Vorschlag nicht, und ein Preis überlebt die Bereinigung nicht.
      assert.equal('status' in ergebnis.vorschlag, false)
      assert.doesNotMatch(JSON.stringify(ergebnis.vorschlag.tage), /412/)
    }
  })
})

describe('Der Kill Switch', () => {
  test('abgeschaltet: kein Kontingent, kein Aufruf', async () => {
    const werkzeug = werkzeuge({ zustand: { aktiv: false, grund: 'abgeschaltet' } })
    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) {
      assert.equal(ergebnis.klasse, 'gesperrt')
      assert.match(ergebnis.meldung, /Formular/, 'der Weg über das Formular bleibt offen')
    }
    assert.equal(werkzeug.beanspruchtWie(), 0)
    assert.equal(werkzeug.anfragen.length, 0)
  })

  test('ohne Schlüssel dasselbe – und ohne Hinweis auf ein Secret', async () => {
    // Die Meldung nennt nicht `OPENAI_API_KEY`. Eine Fehlmeldung, die die
    // Umgebung beschreibt, ist eine Auskunft an jeden.
    const werkzeug = werkzeuge({ zustand: { aktiv: false, grund: 'kein-schluessel' } })
    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) {
      assert.doesNotMatch(ergebnis.meldung, /OPENAI/i)
      assert.doesNotMatch(ergebnis.meldung, /key|Schlüssel/i)
    }
    assert.equal(werkzeug.anfragen.length, 0)
  })

  test('ein falsch konfiguriertes Modell wird nicht aufgerufen', async () => {
    const werkzeug = werkzeuge({ zustand: { aktiv: false, grund: 'unbekanntes-modell' } })
    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.match(ergebnis.meldung, /nicht richtig konfiguriert/)
    assert.equal(werkzeug.anfragen.length, 0)
  })
})

describe('Ein erschöpftes Kontingent hält den Aufruf auf', () => {
  test('die Meldung der Datenbank kommt durch', async () => {
    // Sie ist für Reisende geschrieben („Für heute ist die Zahl der
    // Reisevorschläge erreicht.") und sagt mehr als ein allgemeiner Satz.
    const werkzeug = werkzeuge({
      beanspruchen: async () => ({
        ok: false,
        meldung: 'Für heute ist die Zahl der Reisevorschläge erreicht. Morgen geht es weiter.',
      }),
    })

    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) {
      assert.equal(ergebnis.klasse, 'gesperrt')
      assert.match(ergebnis.meldung, /Morgen geht es weiter/)
    }
  })

  test('kein Aufruf und kein Abschluss', async () => {
    // Fail closed: Wer nicht zählen kann, ruft nicht auf. Und was nicht gebucht
    // wurde, wird nicht abgeschlossen – sonst entstünde ein Protokolleintrag ohne
    // Aufruf.
    const werkzeug = werkzeuge({
      beanspruchen: async () => ({ ok: false, meldung: 'Ausgelastet.' }),
    })

    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(werkzeug.anfragen.length, 0)
    assert.deepEqual(werkzeug.abschluesse, [])
  })

  test('ein technischer Fehlschlag der Buchung ist ebenfalls ein Nein', async () => {
    const werkzeug = werkzeuge({
      beanspruchen: async () => ({
        ok: false,
        meldung: 'Die intelligente Planung ist gerade nicht erreichbar.',
      }),
    })

    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(ergebnis.ok, false)
    assert.equal(werkzeug.anfragen.length, 0)
  })
})

describe('Jeder Fehlschlag des Aufrufs endet in einem Satz und einer Klasse', () => {
  const faelle: [string, () => Promise<Modellergebnis>, Ergebnisklasse][] = [
    [
      'Zeitüberschreitung',
      async () => ({
        ok: false,
        klasse: 'zeitueberschreitung',
        hinweis: 'Kein Ergebnis innerhalb von 40000 ms.',
        nutzung: null,
        laufzeitMs: 40_000,
      }),
      'zeitueberschreitung',
    ],
    [
      'Netzwerkfehler',
      async () => ({
        ok: false,
        klasse: 'netz',
        hinweis: 'Der Aufruf scheiterte (TypeError).',
        nutzung: null,
        laufzeitMs: 120,
      }),
      'netz',
    ],
    ['OpenAI 400', antwortet(400, { error: { message: 'Unknown parameter' } }), 'anbieter-4xx'],
    ['OpenAI 429', antwortet(429, {}), 'anbieter-4xx'],
    ['OpenAI 500', antwortet(500, {}), 'anbieter-5xx'],
    ['Ablehnung des Modells', antwortet(200, ANTWORT_VERWEIGERT), 'verweigert'],
    ['abgeschnittene Antwort', antwortet(200, ANTWORT_ABGESCHNITTEN), 'abgeschnitten'],
    ['unlesbares JSON', antwortet(200, ANTWORT_KAPUTT), 'ungueltige-antwort'],
    ['Antwort ohne Text', antwortet(200, { status: 'completed', output: [] }), 'ungueltige-antwort'],
    ['kein Antwortkörper', antwortet(200, null), 'ungueltige-antwort'],
  ]

  for (const [name, aufrufen, klasse] of faelle) {
    test(`${name}: kein Vorschlag, sondern ein Grund`, async () => {
      const werkzeug = werkzeuge({ aufrufen })
      const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

      assert.equal(ergebnis.ok, false)
      if (!ergebnis.ok) {
        assert.equal(ergebnis.klasse, klasse)
        assert.ok(ergebnis.meldung.length > 20, 'die Meldung muss etwas sagen')
      }
    })

    test(`${name}: wird mit seiner eigenen Klasse protokolliert`, async () => {
      // Nicht als `erfolg` und nicht als Sammelklasse: Wer später nachsieht, warum
      // die Kosten gestiegen sind, soll den Unterschied zwischen einer
      // Zeitüberschreitung und einer abgeschnittenen Antwort sehen.
      const werkzeug = werkzeuge({ aufrufen })
      await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

      assert.equal(werkzeug.abschluesse.length, 1)
      assert.equal(werkzeug.abschluesse[0].klasse, klasse)
    })
  }

  test('eine Antwort, die das Jetnity-Schema verletzt, ist keine Antwort', async () => {
    // Formgerecht und trotzdem keine Reise: `strict: true` hat die Form zugesagt,
    // nicht den Inhalt. Hier sind es 31 Tage – einer über der Grenze des
    // Modellwegs.
    const werkzeug = werkzeuge({ aufrufen: antwortet(200, antwortMit(vorschlagMitTagen(31))) })
    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.klasse, 'schema')
    assert.equal(werkzeug.abschluesse[0].klasse, 'schema')
  })

  test('JSON, das keine Reise ist', async () => {
    const werkzeug = werkzeuge({ aufrufen: antwortet(200, antwortMit({ hallo: 'welt' })) })
    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.klasse, 'schema')
  })

  test('kein Fehlschlag liefert einen leeren Vorschlag', async () => {
    // Die Anforderung wörtlich: Ein Modellfehler darf nicht wie eine geplante
    // Reise ohne Inhalt aussehen. Ein `ok: true` mit leeren Tagen wäre genau das.
    for (const [, aufrufen] of faelle) {
      const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeuge({ aufrufen }).gestellt)

      assert.equal(ergebnis.ok, false)
      assert.equal('vorschlag' in ergebnis, false)
    }
  })
})

describe('Das Protokoll eines bezahlten Aufrufs', () => {
  test('genau ein Abschluss, auch beim Erfolg', async () => {
    // Zwei wären eine doppelte Zeile im Kostenprotokoll, keiner eine
    // Reservierung, die für immer offen bleibt und den Tagesdeckel belastet.
    const werkzeug = werkzeuge()
    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(werkzeug.abschluesse.length, 1)
  })

  test('die Kennung der Buchung wird zum Abschluss weitergegeben', async () => {
    const werkzeug = werkzeuge({
      beanspruchen: async () => ({ ok: true, id: 'nutzung-abc' }),
    })
    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(werkzeug.abschluesse[0].id, 'nutzung-abc')
  })

  test('eine fehlende Nutzung bleibt null und wird nicht zu null Tokens', async () => {
    // Der Unterschied entscheidet über Geld: `null` lässt die Reservierung des
    // schlechtesten Falls stehen, `0` würde sie auf nichts senken – für einen
    // Aufruf, der stattgefunden hat und berechnet wird.
    const werkzeug = werkzeuge({
      aufrufen: antwortet(200, {
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [{ type: 'output_text', text: JSON.stringify(VORSCHLAG_THAILAND) }],
          },
        ],
      }),
    })

    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(ergebnis.ok, true)
    assert.equal(werkzeug.abschluesse[0].nutzung, null)
  })

  test('die Laufzeit wird mitgeschrieben', async () => {
    const werkzeug = werkzeuge({ aufrufen: antwortet(200, antwortMit(VORSCHLAG_THAILAND), 7321) })
    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(werkzeug.abschluesse[0].laufzeitMs, 7321)
  })

  test('auch ein Fehlschlag mit Tokens wird mit ihnen protokolliert', async () => {
    // Ein abgelehnter oder abgeschnittener Aufruf hat Tokens verbraucht und wird
    // berechnet. Ihn als kostenlos zu protokollieren wäre ein zu niedriger
    // Tagesstand.
    const werkzeug = werkzeuge({ aufrufen: antwortet(200, ANTWORT_ABGESCHNITTEN) })
    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.deepEqual(werkzeug.abschluesse[0].nutzung, {
      eingabeTokens: 1800,
      gecachteTokens: 0,
      ausgabeTokens: 6000,
    })
  })

  test('ein Aufruf, der nicht stattfand, wird nicht protokolliert', async () => {
    for (const zustand of [
      { aktiv: false as const, grund: 'abgeschaltet' as const },
      { aktiv: false as const, grund: 'kein-schluessel' as const },
    ]) {
      const werkzeug = werkzeuge({ zustand })
      await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

      assert.deepEqual(werkzeug.abschluesse, [])
    }
  })

  test('ein gescheitertes Protokoll verhindert den Vorschlag nicht', async () => {
    // Der Aufruf ist geschehen und bezahlt. Ob seine Zeile vollständig wurde, ist
    // eine Frage der Kostenübersicht – und die Reservierung bleibt in diesem Fall
    // stehen, also in der sicheren Richtung.
    const werkzeug = werkzeuge({
      abschliessen: async () => {
        throw new Error('PostgREST nicht erreichbar')
      },
    })

    await assert.rejects(() => reisevorschlagErzeugen(IDEE, werkzeug.gestellt))
  })

  test('zwei Anläufe buchen zweimal', async () => {
    // Ein zweiter Versuch ist ein zweiter bezahlter Aufruf, und er soll auch als
    // solcher gezählt werden. Der Ablauf wiederholt nichts von selbst: Diese
    // Entscheidung gehört dem Menschen vor dem Bildschirm.
    const werkzeug = werkzeuge()

    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)
    await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(werkzeug.beanspruchtWie(), 2)
    assert.equal(werkzeug.abschluesse.length, 2)
  })
})

describe('Der Vorschlag wird nicht gespeichert', () => {
  test('der Ablauf hat keinen Weg in eine Persistenz', async () => {
    // Die Werkzeuge sind vollständig: Zustand, Kontingent, Abschluss, Aufruf,
    // Datum. Keines davon schreibt eine Reise. Was gespeichert wird, entscheidet
    // erst `vorschlagUebernehmen()` bzw. `gastreiseAblegen()` – nach einer
    // ausdrücklichen Freigabe.
    const werkzeug = werkzeuge()
    const ergebnis = await reisevorschlagErzeugen(IDEE, werkzeug.gestellt)

    assert.equal(ergebnis.ok, true)
    assert.deepEqual(Object.keys(werkzeug.gestellt).sort(), [
      'abschliessen',
      'aufrufen',
      'beanspruchen',
      'heute',
      'zustand',
    ])
  })
})
