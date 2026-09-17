// lib/reisebegleiter/erzeugen.test.ts
//
// Der Ablauf einer Assistant-Auskunft, gegen den Strich geprüft.
//
// Die Fragen sind nicht „funktioniert es", sondern:
//
//   · Kann ein bezahlter Aufruf ohne Reservierung zustande kommen?
//   · Kostet eine abgeschaltete Umgebung Geld?
//   · Kommt aus einer kaputten, verweigerten, abgeschnittenen oder
//     regelwidrigen Antwort ein Ergebnis?
//   · Gibt es einen zweiten Versuch, den niemand angefordert hat?
//   · Verändert der Weg die Reise?
//
// Die Werkzeuge werden übergeben. Diese Datei braucht deshalb kein Next, keine
// Datenbank und keinen Netzzugang – und keinen bezahlten Aufruf, um den Fall zu
// prüfen, in dem ein bezahlter Aufruf nicht stattfinden darf.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { anfragekoerper, type Modellanfrage } from '@/lib/modell/anfrage'
import type { Modellergebnis } from '@/lib/modell/aufruf'
import {
  MODELL_GRENZEN,
  modellZustand,
  type Ergebnisklasse,
  type Modellzustand,
} from '@/lib/modell/konfiguration'
import type { Tokennutzung } from '@/lib/modell/preise'
import { officialLeer } from '@/lib/readiness/official'
import { AMTLICHE_AUSSAGE_TEXT } from '@/lib/reisebegleiter/aussagen'
import { BEFUNDE, befundEintrag } from '@/lib/reisebegleiter/befunde'
import {
  assistantTruthContextProjizieren,
  type AssistantTruthContext,
} from '@/lib/reisebegleiter/kontext'
import {
  begleiterauskunftErzeugen,
  type Begleiterwerkzeuge,
} from '@/lib/reisebegleiter/erzeugen'
import { BEGLEITER_GRENZEN } from '@/lib/reisebegleiter/schema'
import type { Trip, TripStage, TripTraveller } from '@/types/trips'

const JETZT = '2026-09-17T10:00:00.000Z'
const HEUTE = '2026-09-17'
const FRAGE = 'Was ist bei dieser Reise noch offen?'

const AKTIV: Modellzustand = { aktiv: true, modell: 'gpt-5.6-terra', aufwand: 'low' }

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function reisender(): TripTraveller {
  return {
    id: 'traveller-1',
    clientRef: 'traveller:1',
    label: 'Alex',
    residenceCountryCode: 'DE',
    citizenships: [
      { id: 'cit:ch', clientRef: 'cit:ch', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
    ],
    documents: [],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Italien',
    origin: 'Zürich',
    originPlaceId: null,
    startDate: '2027-04-03',
    endDate: '2027-04-10',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'calm',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      etappe({
        id: 'stage-rm',
        position: 1,
        name: 'Rom',
        countryCode: 'IT',
        arrivalDate: '2027-04-03',
        departureDate: '2027-04-10',
      }),
    ],
    days: [],
    ohneTag: [],
    party: [reisender()],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function kontext(etappen = 1): AssistantTruthContext {
  return assistantTruthContextProjizieren({
    reise: reise({
      stages: Array.from({ length: etappen }, (_, stelle) =>
        etappe({
          id: `stage-${stelle}`,
          position: stelle + 1,
          name: `Etappe ${stelle + 1}`,
          countryCode: 'IT',
        }),
      ),
    }),
    officialEvaluations: [
      officialLeer({
        requirementType: 'visa',
        contextFingerprint: 'fp-1',
        travellerClientRef: 'traveller:1',
        credentialOptionRef: null,
        destinationCountryCode: 'IT',
        transitCountryCode: null,
        status: 'unknown',
        freshness: 'provider_unavailable',
      }),
    ],
    routeFacts: { quelle: 'none', destinationCountryCodes: ['IT'], transitCountryCodes: [] },
  })
}

/**
 * Eine gültige Auswahl für die Reise aus `kontext()`.
 *
 * Kein Satz darin: Seit Runde 8 hat das Ausgabeschema kein Freitextfeld. Was
 * hier steht, sind Schlüssel aus `BEFUNDE` und `AMTLICHE_AUSSAGEN` – und die
 * gewählten Paare treffen auf diese Reise zu, sonst verwirft sie die Prüfung.
 */
const GUELTIGE_AUSKUNFT = JSON.stringify({
  befunde: [
    { schluessel: 'etappe_ohne_daten', ref: 'E1' },
    { schluessel: 'reisende_ohne_dokument', ref: 'R1' },
    { schluessel: 'schritt_dokument_ergaenzen', ref: 'R1' },
  ],
  bezuege: ['E1', 'R1', 'O1'],
  amtlicheHinweise: [{ ref: 'O1', aussage: 'nicht_geprueft' }],
})

const NUTZUNG: Tokennutzung = { eingabeTokens: 1200, gecachteTokens: 0, ausgabeTokens: 300 }

type Protokoll = {
  schritte: string[]
  reservierungen: string[]
  anfragen: Modellanfrage[]
  abschluesse: Array<{ id: string; klasse: Ergebnisklasse }>
}

function werkzeuge(
  antwort: Modellergebnis | ((anfrage: Modellanfrage) => Modellergebnis),
  teil: Partial<Begleiterwerkzeuge> = {},
): { werkzeuge: Begleiterwerkzeuge; protokoll: Protokoll } {
  const protokoll: Protokoll = { schritte: [], reservierungen: [], anfragen: [], abschluesse: [] }
  let laufend = 0

  const gebaut: Begleiterwerkzeuge = {
    zustand: AKTIV,
    beanspruchen: async (modell) => {
      protokoll.schritte.push('beanspruchen')
      protokoll.reservierungen.push(modell)
      return { ok: true, id: `nutzung-${++laufend}` }
    },
    abschliessen: async (id, klasse) => {
      protokoll.schritte.push('abschliessen')
      protokoll.abschluesse.push({ id, klasse })
    },
    aufrufen: async (anfrage) => {
      protokoll.schritte.push('aufrufen')
      protokoll.anfragen.push(anfrage)
      return typeof antwort === 'function' ? antwort(anfrage) : antwort
    },
    heute: HEUTE,
    ...teil,
  }

  return { werkzeuge: gebaut, protokoll }
}

function erfolg(text = GUELTIGE_AUSKUNFT): Modellergebnis {
  return { ok: true, text, nutzung: NUTZUNG, laufzeitMs: 2400 }
}

function fehler(klasse: Ergebnisklasse): Modellergebnis {
  return { ok: false, klasse, hinweis: 'Testfall', nutzung: null, laufzeitMs: 900 }
}

// ---------------------------------------------------------------------------

describe('Die Reihenfolge der Schranken', () => {
  test('das Kontingent wird vor dem Aufruf gebucht', async () => {
    const { werkzeuge: w, protokoll } = werkzeuge(erfolg())
    const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)

    assert.equal(ergebnis.ok, true)
    assert.deepEqual(protokoll.schritte, ['beanspruchen', 'aufrufen', 'abschliessen'])
  })

  test('die Buchung nennt das Modell, das aufgerufen wird', async () => {
    const { werkzeuge: w, protokoll } = werkzeuge(erfolg())
    await begleiterauskunftErzeugen(FRAGE, kontext(), w)

    assert.deepEqual(protokoll.reservierungen, ['gpt-5.6-terra'])
    assert.equal(protokoll.anfragen[0].modell, 'gpt-5.6-terra')
  })

  test('ein abgelehntes Kontingent verhindert den Aufruf', async () => {
    const { werkzeuge: w, protokoll } = werkzeuge(erfolg(), {
      beanspruchen: async () => ({ ok: false, meldung: 'Heute ausgelastet.' }),
    })
    const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)

    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.ok === false && ergebnis.klasse, 'gesperrt')
    assert.equal(ergebnis.ok === false && ergebnis.meldung, 'Heute ausgelastet.')
    assert.deepEqual(protokoll.anfragen, [])
    assert.deepEqual(protokoll.abschluesse, [])
  })
})

describe('Eine abgeschaltete Umgebung kostet nichts', () => {
  for (const grund of ['abgeschaltet', 'kein-schluessel', 'unbekanntes-modell'] as const) {
    test(`${grund}: keine Buchung, kein Aufruf`, async () => {
      const { werkzeuge: w, protokoll } = werkzeuge(erfolg(), {
        zustand: { aktiv: false, grund },
      })
      const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)

      assert.equal(ergebnis.ok, false)
      assert.equal(ergebnis.ok === false && ergebnis.klasse, 'gesperrt')
      assert.deepEqual(protokoll.schritte, [])
    })
  }

  test('eine leere Serverumgebung ist abgeschaltet – der Production-Normalfall', () => {
    // `modellZustand()` bekommt die Umgebung übergeben, damit der Test sie
    // stellen kann, ohne `process.env` anzufassen. Eine Umgebung ohne
    // `JETNITY_MODELL_AKTIV` ist der Zustand von Production, solange der Weg
    // dort nicht freigegeben ist.
    assert.deepEqual(modellZustand({}), { aktiv: false, grund: 'abgeschaltet' })
    assert.deepEqual(modellZustand({ OPENAI_API_KEY: 'x', JETNITY_MODELL_NAME: 'gpt-5.6-terra' }), {
      aktiv: false,
      grund: 'abgeschaltet',
    })
    assert.deepEqual(modellZustand({ JETNITY_MODELL_AKTIV: 'true' }), {
      aktiv: false,
      grund: 'kein-schluessel',
    })
  })

  test('eine ungeprüfte Frage löst keine Buchung aus', async () => {
    const { werkzeuge: w, protokoll } = werkzeuge(erfolg())
    const ergebnis = await begleiterauskunftErzeugen('Visum?', kontext(), w)

    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.ok === false && ergebnis.klasse, 'eingabe')
    assert.deepEqual(protokoll.schritte, [])
  })

  test('eine Frage, die keine Zeichenkette ist, löst keine Buchung aus', async () => {
    for (const eingabe of [null, undefined, 42, { frage: 'x' }, ['x']]) {
      const { werkzeuge: w, protokoll } = werkzeuge(erfolg())
      const ergebnis = await begleiterauskunftErzeugen(eingabe, kontext(), w)
      assert.equal(ergebnis.ok, false)
      assert.deepEqual(protokoll.schritte, [])
    }
  })
})

describe('Die Eingabegrösse bleibt unter der Reservierung', () => {
  test('ein zu grosser Reisekontext führt zu keinem Aufruf', async () => {
    const { werkzeuge: w, protokoll } = werkzeuge(erfolg())
    const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(4000), w)

    assert.equal(ergebnis.ok, false)
    assert.equal(ergebnis.ok === false && ergebnis.klasse, 'gesperrt')
    assert.match(ergebnis.ok === false ? ergebnis.meldung : '', /zu umfangreich/)
    assert.deepEqual(protokoll.schritte, [])
  })

  test('der geschickte Prompt bleibt unter der Zeichengrenze', async () => {
    const { werkzeuge: w, protokoll } = werkzeuge(erfolg())
    await begleiterauskunftErzeugen(FRAGE, kontext(20), w)

    const anfrage = protokoll.anfragen[0]
    assert.ok(
      anfrage.systemregeln.length + anfrage.nutzertext.length <= BEGLEITER_GRENZEN.eingabeZeichen,
    )
  })

  test('das Ausgabebudget ist kleiner als der reservierte Fall', async () => {
    const { werkzeuge: w, protokoll } = werkzeuge(erfolg())
    await begleiterauskunftErzeugen(FRAGE, kontext(), w)

    assert.equal(protokoll.anfragen[0].ausgabeTokens, BEGLEITER_GRENZEN.ausgabeTokens)
    assert.ok(BEGLEITER_GRENZEN.ausgabeTokens < MODELL_GRENZEN.ausgabeTokens)

    const koerper = JSON.parse(anfragekoerper(protokoll.anfragen[0])) as {
      max_output_tokens: number
      store: boolean
      input: Array<{ role: string; content: string }>
    }
    assert.equal(koerper.max_output_tokens, BEGLEITER_GRENZEN.ausgabeTokens)
    // Die Frage bleibt nicht auf der Gegenseite liegen, und sie steht als
    // eigene Nachricht – nicht an die Systemregeln geklebt.
    assert.equal(koerper.store, false)
    assert.deepEqual(
      koerper.input.map((eintrag) => eintrag.role),
      ['system', 'user'],
    )
    assert.equal(koerper.input[1].content, FRAGE)
    assert.equal(koerper.input[0].content.includes(FRAGE), false)
  })
})

describe('Ein Versuch, kein zweiter', () => {
  const klassen = [
    'zeitueberschreitung',
    'netz',
    'anbieter-4xx',
    'anbieter-5xx',
    'verweigert',
    'abgeschnitten',
    'ungueltige-antwort',
    'schema',
  ] as const satisfies readonly Ergebnisklasse[]

  for (const klasse of klassen) {
    test(`${klasse}: genau ein Aufruf, genau eine Buchung, genau ein Abschluss`, async () => {
      const { werkzeuge: w, protokoll } = werkzeuge(fehler(klasse))
      const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)

      assert.equal(ergebnis.ok, false)
      assert.equal(ergebnis.ok === false && ergebnis.klasse, klasse)
      assert.equal(protokoll.anfragen.length, 1)
      assert.equal(protokoll.reservierungen.length, 1)
      assert.deepEqual(protokoll.abschluesse, [{ id: 'nutzung-1', klasse }])
    })
  }

  test('kein Ausweichen auf ein anderes Modell', async () => {
    const { werkzeuge: w, protokoll } = werkzeuge(fehler('zeitueberschreitung'), {
      zustand: { aktiv: true, modell: 'gpt-5.6-sol', aufwand: 'low' },
    })
    await begleiterauskunftErzeugen(FRAGE, kontext(), w)

    assert.deepEqual(protokoll.reservierungen, ['gpt-5.6-sol'])
    assert.equal(protokoll.anfragen.length, 1)
  })

  test('jede Meldung ist für Reisende geschrieben und nennt keinen Hinweis aus dem Protokoll', async () => {
    for (const klasse of klassen) {
      const { werkzeuge: w } = werkzeuge(fehler(klasse))
      const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)
      assert.equal(ergebnis.ok, false)
      const meldung = ergebnis.ok === false ? ergebnis.meldung : ''
      assert.ok(meldung.length > 0, `${klasse} ohne Meldung`)
      assert.equal(meldung.includes('Testfall'), false)
    }
  })
})

describe('Eine unbrauchbare Antwort wird nicht brauchbar gemacht', () => {
  const unbrauchbar: Array<{ name: string; text: string; klasse: Ergebnisklasse }> = [
    { name: 'kein JSON', text: 'Klar, gern! Hier deine Antwort …', klasse: 'ungueltige-antwort' },
    { name: 'abgeschnittenes JSON', text: '{"befunde":[{"schluessel', klasse: 'ungueltige-antwort' },
    { name: 'JSON-Liste statt Objekt', text: '[{"befunde":[]}]', klasse: 'schema' },
    { name: 'leeres Objekt', text: '{}', klasse: 'schema' },
    {
      name: 'fehlendes Feld',
      text: JSON.stringify({ befunde: [], bezuege: [] }),
      klasse: 'schema',
    },
    {
      // Die Fälle der Vorrunden – Betrag, Link, erfundene amtliche Anforderung,
      // behauptete Buchung, behauptete Änderung – brauchen hier keinen
      // eigenen Eintrag mehr. Sie waren alle Sätze, und es gibt kein Feld für
      // Sätze. Ein Modell, das es trotzdem versucht, landet genau hier.
      name: 'Freitext statt Auswahl',
      text: JSON.stringify({
        antwort: 'Du musst ein gültiges Reisedokument haben.',
        unsicherheiten: ['Für Italien bist du visumfrei.'],
        naechsteSchritte: ['Antrag unter https://visa.example/it stellen.'],
        bezuege: ['E1'],
      }),
      klasse: 'schema',
    },
    {
      name: 'Freitext neben gültiger Auswahl',
      text: JSON.stringify({
        befunde: [{ schluessel: 'etappe_ohne_daten', ref: 'E1' }],
        bezuege: ['E1'],
        amtlicheHinweise: [],
        antwort: 'Rechne mit etwa CHF 90 für das Visum.',
      }),
      klasse: 'schema',
    },
    {
      name: 'eigener Satz in einem Befund',
      text: JSON.stringify({
        befunde: [
          { schluessel: 'etappe_ohne_daten', ref: 'E1', text: 'Ein Visum ist notwendig.' },
        ],
        bezuege: ['E1'],
        amtlicheHinweise: [],
      }),
      klasse: 'schema',
    },
    {
      name: 'Schlüssel ausserhalb des Katalogs',
      text: JSON.stringify({
        befunde: [{ schluessel: 'visum_erforderlich', ref: 'E1' }],
        bezuege: ['E1'],
        amtlicheHinweise: [],
      }),
      klasse: 'schema',
    },
    {
      name: 'erfundener Bezug',
      text: JSON.stringify({ befunde: [], bezuege: ['O42'], amtlicheHinweise: [] }),
      klasse: 'schema',
    },
    {
      name: 'nicht angebotener Befund',
      text: JSON.stringify({
        befunde: [{ schluessel: 'etappe_daten_stehen', ref: 'E1' }],
        bezuege: ['E1'],
        amtlicheHinweise: [],
      }),
      klasse: 'schema',
    },
    {
      name: 'angebotener Befund am falschen Bezug',
      text: JSON.stringify({
        befunde: [{ schluessel: 'reisende_ohne_dokument', ref: 'E1' }],
        bezuege: ['E1'],
        amtlicheHinweise: [],
      }),
      klasse: 'schema',
    },
    {
      name: 'amtliche Aussage über eine ungeprüfte Lage als geprüft',
      text: JSON.stringify({
        befunde: [],
        bezuege: ['O1'],
        amtlicheHinweise: [{ ref: 'O1', aussage: 'geprueft_nicht_erforderlich' }],
      }),
      klasse: 'schema',
    },
    {
      name: 'zusätzliches zustandstragendes Feld',
      text: JSON.stringify({
        befunde: [],
        bezuege: ['O1'],
        amtlicheHinweise: [],
        lagen: [{ ref: 'O1', lage: 'Nicht erforderlich', belegt: true }],
      }),
      klasse: 'schema',
    },
  ]

  for (const fall of unbrauchbar) {
    test(`${fall.name} endet als ${fall.klasse}`, async () => {
      const { werkzeuge: w, protokoll } = werkzeuge(erfolg(fall.text))
      const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)

      assert.equal(ergebnis.ok, false)
      assert.equal(ergebnis.ok === false && ergebnis.klasse, fall.klasse)
      // Der Aufruf hat stattgefunden und ist bezahlt. Er wird mit seiner
      // Fehlerklasse abgeschlossen und nicht verschwiegen.
      assert.deepEqual(protokoll.abschluesse, [{ id: 'nutzung-1', klasse: fall.klasse }])
      assert.equal(protokoll.anfragen.length, 1)
    })
  }
})

describe('Die Auskunft', () => {
  test('trägt ihre Wahrheitsklasse und die Fassung des Kontexts', async () => {
    const { werkzeuge: w } = werkzeuge(erfolg())
    const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)

    assert.ok(ergebnis.ok)
    assert.equal(ergebnis.auskunft.wahrheitsklasse, 'generated_suggestion')
    assert.equal(ergebnis.auskunft.kontextFassung, 'assistant-truth-context-v1')
    assert.equal(ergebnis.auskunft.fassung, 1)
  })

  test('zeigt nur Bezüge, auf die sie zeigt – mit dem Zustand aus Jetnity', async () => {
    const { werkzeuge: w } = werkzeuge(
      erfolg(
        JSON.stringify({ befunde: [], bezuege: ['O1'], amtlicheHinweise: [] }),
      ),
    )
    const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)

    assert.ok(ergebnis.ok)
    assert.deepEqual(
      ergebnis.auskunft.bezuege.map((bezug) => bezug.ref),
      ['O1'],
    )
    assert.equal(ergebnis.auskunft.bezuege[0].belegt, false)
    assert.match(ergebnis.auskunft.bezuege[0].lage, /Noch nicht verlässlich bestimmbar/)
  })

  test('jeder angezeigte Satz stammt aus einem Jetnity-Katalog', async () => {
    // Die tragende Zusicherung von Runde 8, am Ergebnis geprüft: Kein Text in
    // der Auskunft ist vom Modell geschrieben. Jeder Satz muss sich in
    // `BEFUNDE` oder `AMTLICHE_AUSSAGE_TEXT` wiederfinden – die Titel der
    // Bezüge kommen aus der Projektion und sind gesondert geprüft.
    const { werkzeuge: w } = werkzeuge(erfolg())
    const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)

    assert.ok(ergebnis.ok)
    assert.ok(ergebnis.auskunft.befunde.length > 0)

    const katalog = new Set<string>([
      ...BEFUNDE.map((eintrag) => eintrag.text),
      ...Object.values(AMTLICHE_AUSSAGE_TEXT),
    ])
    for (const eintrag of ergebnis.auskunft.befunde) {
      assert.ok(katalog.has(eintrag.text), `nicht aus dem Katalog: ${eintrag.text}`)
      assert.equal(eintrag.text, befundEintrag(eintrag.schluessel).text)
    }
    for (const hinweis of ergebnis.auskunft.amtlicheHinweise) {
      assert.ok(katalog.has(hinweis.text), `nicht aus dem Katalog: ${hinweis.text}`)
    }
  })

  test('die Rolle eines Befundes kommt aus dem Katalog, nicht aus der Antwort', async () => {
    const { werkzeuge: w } = werkzeuge(erfolg())
    const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)

    assert.ok(ergebnis.ok)
    for (const eintrag of ergebnis.auskunft.befunde) {
      assert.equal(eintrag.rolle, befundEintrag(eintrag.schluessel).rolle)
    }
  })

  test('der angezeigte Zustand kommt aus der Projektion, nicht aus der Antwort', async () => {
    // Die Auskunft hat kein Feld für einen Zustand. Was die Oberfläche unter
    // „Jetnity-Stand" zeigt, stammt aus `begleiternutzlastAus()` und trägt
    // hier `belegt: false`.
    const { werkzeuge: w } = werkzeuge(
      erfolg(
        JSON.stringify({
          befunde: [],
          bezuege: ['O1'],
          amtlicheHinweise: [{ ref: 'O1', aussage: 'nicht_geprueft' }],
        }),
      ),
    )
    const ergebnis = await begleiterauskunftErzeugen(FRAGE, kontext(), w)

    assert.ok(ergebnis.ok)
    assert.equal(ergebnis.auskunft.bezuege[0].belegt, false)
    assert.match(ergebnis.auskunft.bezuege[0].lage, /Noch nicht verlässlich bestimmbar/)
    assert.deepEqual(
      ergebnis.auskunft.amtlicheHinweise.map((hinweis) => hinweis.text),
      ['Diese amtliche Lage ist derzeit nicht geprüft.'],
    )
    assert.equal(Object.keys(ergebnis.auskunft).includes('lagen'), false)
    assert.equal(Object.keys(ergebnis.auskunft).includes('antwort'), false)
  })
})

describe('Der Weg ändert nichts', () => {
  test('der übergebene Kontext bleibt unverändert', async () => {
    const eingang = kontext()
    const vorher = JSON.stringify(eingang)
    const { werkzeuge: w } = werkzeuge(erfolg())

    await begleiterauskunftErzeugen(FRAGE, eingang, w)

    assert.equal(JSON.stringify(eingang), vorher)
  })

  test('die Werkzeuge kennen keinen schreibenden Vorgang', () => {
    // Der Vertrag selbst ist der Beweis: Es gibt kein Werkzeug, mit dem dieser
    // Weg eine Reise anlegen, ändern, löschen oder eine Buchung auslösen
    // könnte. Ein späteres Werkzeug wäre eine Entscheidung und kein Versehen.
    const { werkzeuge: w } = werkzeuge(erfolg())
    assert.deepEqual(Object.keys(w).sort(), [
      'abschliessen',
      'aufrufen',
      'beanspruchen',
      'heute',
      'zustand',
    ])
  })
})
