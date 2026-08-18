// lib/reisevorschlag/fixtures/antworten.ts
//
// Modellantworten als Fixtures.
//
// Sie sind der Ersatz für einen bezahlten Aufruf im Test. Jede Antwort hier ist
// so geformt, wie die Responses API sie liefert – mit `output`, `usage`,
// `status` –, weil genau diese Form die Fehlerquelle ist: Der Text steht nicht
// in `output[0]`, sondern hinter einem `reasoning`-Eintrag, und `usage` kann
// fehlen.
//
// `npm test` erzeugt damit keine Kosten (AGENTS.md Regel 17: „CI darf nicht pro
// Lauf kostenpflichtige Modellrequests erzeugen“).
//
// Die Vorschläge sind bewusst klein. Ein Fixture mit dreissig Tagen prüft nichts,
// was ein Fixture mit drei nicht prüft, und macht jede Änderung unlesbar. Für die
// Grenzen gibt es `vorschlagMitTagen()`.

import type { Modellvorschlag } from '@/lib/reisevorschlag/schema'

/** Ein vollständiger, gültiger Vorschlag: eine Woche Thailand mit zwei Etappen. */
export const VORSCHLAG_THAILAND = {
  titel: 'Sieben Tage Thailand: Bangkok und Krabi',
  abreiseort: 'Zürich',
  reisende: 2,
  waehrung: 'CHF',
  budgetziel: 3000,
  tempo: 'calm',
  interessen: ['beach', 'food'],
  startdatum: null,
  annahmen: ['Reisezeit als Trockenzeit angenommen, da kein Datum genannt war.'],
  etappen: [
    { name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 3 },
    { name: 'Krabi', laendercode: 'TH', vonTag: 4, bisTag: 7 },
  ],
  tage: [
    {
      nummer: 1,
      titel: 'Ankunft in Bangkok',
      punkte: [
        { art: 'flight', titel: 'Flug Zürich – Bangkok', notiz: null, beginn: '22:10' },
        { art: 'stay', titel: 'Nacht in Bangkok, Riverside', notiz: 'Ruhig gelegen.', beginn: null },
      ],
    },
    {
      nummer: 2,
      titel: 'Tempel und Garküchen',
      punkte: [
        { art: 'activity', titel: 'Wat Pho und Wat Arun', notiz: null, beginn: '09:00' },
        { art: 'activity', titel: 'Abendessen in Chinatown', notiz: 'Garküchen an der Yaowarat.', beginn: '19:00' },
      ],
    },
    {
      nummer: 3,
      titel: 'Kanäle und Markt',
      punkte: [{ art: 'activity', titel: 'Bootsfahrt durch Thonburi', notiz: null, beginn: '10:00' }],
    },
    {
      nummer: 4,
      titel: 'Weiter nach Krabi',
      punkte: [
        { art: 'flight', titel: 'Flug Bangkok – Krabi', notiz: null, beginn: '11:30' },
        { art: 'stay', titel: 'Nächte am Ao Nang', notiz: null, beginn: null },
      ],
    },
    {
      nummer: 5,
      titel: 'Strandtag',
      punkte: [{ art: 'activity', titel: 'Railay Beach mit dem Longtail-Boot', notiz: null, beginn: '09:30' }],
    },
    {
      nummer: 6,
      titel: 'Inseln',
      punkte: [{ art: 'activity', titel: 'Tagestour zu den Hong-Inseln', notiz: null, beginn: '08:30' }],
    },
    {
      nummer: 7,
      titel: 'Rückreise',
      punkte: [
        { art: 'transfer', titel: 'Transfer zum Flughafen Krabi', notiz: null, beginn: '14:00' },
        { art: 'flight', titel: 'Rückflug nach Zürich', notiz: null, beginn: '17:45' },
      ],
    },
  ],
} satisfies Modellvorschlag

/** Ein Vorschlag mit Zeitraum: prüft die Daten, die Jetnity daraus rechnet. */
export const VORSCHLAG_MIT_DATUM = {
  titel: 'Drei Tage Rom',
  abreiseort: 'Zürich',
  reisende: 3,
  waehrung: 'EUR',
  budgetziel: null,
  tempo: 'balanced',
  interessen: ['culture', 'food'],
  startdatum: '2027-06-01',
  annahmen: ['Der Text nennt 5 Tage und einen Zeitraum über 12 Tage; die kürzere Angabe wurde genommen.'],
  etappen: [{ name: 'Rom', laendercode: 'IT', vonTag: 1, bisTag: 3 }],
  tage: [
    {
      nummer: 1,
      titel: null,
      punkte: [{ art: 'flight', titel: 'Flug Zürich – Rom', notiz: null, beginn: '08:00' }],
    },
    {
      nummer: 2,
      titel: 'Antikes Rom',
      punkte: [{ art: 'activity', titel: 'Forum Romanum und Kolosseum', notiz: null, beginn: '09:00' }],
    },
    {
      nummer: 3,
      titel: null,
      punkte: [{ art: 'flight', titel: 'Rückflug nach Zürich', notiz: null, beginn: '18:20' }],
    },
  ],
} satisfies Modellvorschlag

/**
 * Ein Vorschlag mit Preisangaben im Freitext.
 *
 * Der Fall, gegen den `lib/reisevorschlag/normalisierung.ts` steht: Das Schema
 * kennt kein Preisfeld, also landet eine Preisbehauptung im Titel oder in einer
 * Notiz. Sie muss verschwinden, bevor sie gespeichert wird.
 */
export const VORSCHLAG_MIT_PREISEN = {
  ...VORSCHLAG_THAILAND,
  titel: 'Thailand ab CHF 1’890 pro Person',
  annahmen: ['Flüge derzeit ab CHF 412 verfügbar.'],
  tage: [
    {
      nummer: 1,
      titel: 'Anreise (ca. CHF 620)',
      punkte: [
        { art: 'flight', titel: 'Flug Zürich – Bangkok für CHF 412', notiz: 'Hotel 89 EUR/Nacht.', beginn: '22:10' },
      ],
    },
  ],
  etappen: [{ name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 1 }],
} satisfies Modellvorschlag

/** Ein Vorschlag mit `n` Tagen. Für die Prüfung der Grenzen. */
export function vorschlagMitTagen(anzahl: number): Modellvorschlag {
  return {
    ...VORSCHLAG_MIT_DATUM,
    startdatum: '2027-06-01',
    etappen: [{ name: 'Rom', laendercode: 'IT', vonTag: 1, bisTag: Math.max(1, anzahl) }],
    tage: Array.from({ length: anzahl }, (_, stelle) => ({
      nummer: stelle + 1,
      titel: null,
      punkte: [{ art: 'activity' as const, titel: `Tag ${stelle + 1}`, notiz: null, beginn: null }],
    })),
  }
}

// ---------------------------------------------------------------------------
// Antworten der Responses API
// ---------------------------------------------------------------------------

/**
 * Eine erfolgreiche Antwort.
 *
 * Der `reasoning`-Eintrag vor der Nachricht steht absichtlich da: Er ist der
 * Grund, warum `antwortAus()` die Liste durchsucht statt `output[0]` zu lesen.
 */
export function antwortMit(inhalt: unknown, tokens = { eingabe: 1800, gecacht: 1024, ausgabe: 900 }) {
  return {
    status: 'completed',
    output: [
      { type: 'reasoning', summary: [] },
      {
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text: JSON.stringify(inhalt) }],
      },
    ],
    usage: {
      input_tokens: tokens.eingabe,
      input_tokens_details: { cached_tokens: tokens.gecacht },
      output_tokens: tokens.ausgabe,
    },
  }
}

/** Eine Antwort mit unlesbarem Text – kein gültiges JSON. */
export const ANTWORT_KAPUTT = {
  status: 'completed',
  output: [
    {
      type: 'message',
      role: 'assistant',
      content: [{ type: 'output_text', text: '{"titel": "Rom", "tage": [' }],
    },
  ],
  usage: { input_tokens: 1800, output_tokens: 40 },
}

/** Eine abgelehnte Anfrage. */
export const ANTWORT_VERWEIGERT = {
  status: 'completed',
  output: [
    {
      type: 'message',
      role: 'assistant',
      content: [{ type: 'refusal', refusal: 'Dazu kann ich nichts sagen.' }],
    },
  ],
  usage: { input_tokens: 1800, output_tokens: 12 },
}

/** Eine Antwort, die am Ausgabebudget hängen geblieben ist. */
export const ANTWORT_ABGESCHNITTEN = {
  status: 'incomplete',
  incomplete_details: { reason: 'max_output_tokens' },
  output: [{ type: 'reasoning', summary: [] }],
  usage: { input_tokens: 1800, output_tokens: 6000 },
}
