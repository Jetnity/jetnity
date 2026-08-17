// lib/trips/gastspeicher.test.ts
//
// Der Gastspeicher trägt zwei Produktregeln, und beide sind teuer, wenn sie
// brechen:
//
//   · Ohne Konto gibt es genau eine aktive Gastreise.
//   · Was auf diesem Gerät liegt, geht bei einer Anmeldung vollständig ins
//     Konto – und wird erst gelöscht, wenn es dort bestätigt angekommen ist.
//
// Bis Phase 1.5 lagen bis zu zwanzig Entwürfe unter einem Schlüssel: Die erste
// Regel existierte, nur nicht im Code. Die Entwürfe zu verwerfen wäre der
// bequeme Weg gewesen und eine stille Datenlöschung – deshalb prüft dieser Test
// die Übernahme aus der alten Fassung Zeile für Zeile.
//
// Der `localStorage` wird gestellt. Das Modul liest ihn erst beim Aufruf
// (`verfuegbar()`), ein globaler Ersatz genügt also und braucht keinen Browser.

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  GastreiseBestehtFehler,
  SCHLUESSEL,
  gastPlanpunktAnlegen,
  gastPlanpunktEntfernen,
  gastreiseAnlegen,
  gastreiseEntfernen,
  gastreiseLadenNach,
  gastreiseSpeichern,
  gastspeicherLaden,
  kennungErzeugen,
  uebernommenStreichen,
  zurUebernahme,
} from '@/lib/trips/gastspeicher'
import type { CreateTripInput } from '@/types/trips'

/** Ein `localStorage`, der sich wie einer verhält – inklusive Wurf bei voller Ablage. */
function speicherStellen() {
  const ablage = new Map<string, string>()
  let gesperrt = false

  const localStorage = {
    getItem: (schluessel: string) => ablage.get(schluessel) ?? null,
    setItem: (schluessel: string, wert: string) => {
      if (gesperrt) throw new Error('QuotaExceededError')
      ablage.set(schluessel, wert)
    },
    removeItem: (schluessel: string) => {
      ablage.delete(schluessel)
    },
  }

  // `globalThis.window` existiert im Test nicht. Das Modul prüft genau darauf.
  Object.assign(globalThis, { window: { localStorage } })

  return {
    ablage,
    sperren: () => {
      gesperrt = true
    },
    roh: (schluessel: string) => ablage.get(schluessel) ?? null,
    setzen: (schluessel: string, wert: unknown) =>
      ablage.set(schluessel, typeof wert === 'string' ? wert : JSON.stringify(wert)),
  }
}

let speicher: ReturnType<typeof speicherStellen>

beforeEach(() => {
  speicher = speicherStellen()
})

function eingabe(abweichung: Partial<CreateTripInput> = {}): CreateTripInput {
  return {
    clientRef: kennungErzeugen('trip'),
    title: 'Japan im Herbst',
    destination: 'Japan',
    origin: 'Zürich',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4200,
    pace: 'balanced',
    interests: ['culture'],
    travelWish: null,
    ...abweichung,
  }
}

describe('Ein Gast ohne Reise', () => {
  test('der Speicher ist leer und kein Fehler', () => {
    const stand = gastspeicherLaden()

    assert.equal(stand.aktiv, null)
    assert.deepEqual(stand.warteschlange, [])
  })

  test('es gibt nichts zu übernehmen', () => {
    assert.deepEqual(zurUebernahme(), [])
  })

  test('ein unlesbarer Eintrag bricht das Laden nicht ab', () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')

    assert.equal(gastspeicherLaden().aktiv, null)
  })

  test('ein Eintrag, der keine gültige Reise ist, wird verworfen statt halb geladen', () => {
    // Eine Reise mit einem Tag ohne Nummer wäre in der Oberfläche ein Rätsel
    // und in der Übernahme eine Ablehnung.
    speicher.setzen(SCHLUESSEL.aktiv, { id: 'trip-1', title: 'Halb' })

    assert.equal(gastspeicherLaden().aktiv, null)
  })
})

describe('Genau eine aktive Gastreise', () => {
  test('die erste Reise entsteht', () => {
    const reise = gastreiseAnlegen(eingabe())

    assert.equal(reise.title, 'Japan im Herbst')
    assert.equal(reise.days.length, 5, 'die Tage entstehen aus dem Zeitraum')
    assert.equal(reise.stages[0].name, 'Japan', 'das Ziel wird die erste Etappe')
    assert.equal(gastspeicherLaden().aktiv?.id, reise.id)
  })

  test('die Kennung des Formulars wird die Kennung des Entwurfs', () => {
    // Sie trägt die Idempotenz weiter: Bei der Übernahme prüft dieselbe Kennung
    // in der Datenbank `unique (user_id, client_ref)`.
    const angaben = eingabe({ clientRef: 'trip-fest' })
    const reise = gastreiseAnlegen(angaben)

    assert.equal(reise.id, 'trip-fest')
    assert.equal(reise.clientRef, 'trip-fest')
  })

  test('eine zweite Reise wird abgelehnt und nennt die bestehende', () => {
    const erste = gastreiseAnlegen(eingabe())

    assert.throws(
      () => gastreiseAnlegen(eingabe()),
      (fehler: unknown) => {
        assert.ok(fehler instanceof GastreiseBestehtFehler)
        assert.equal(fehler.bestehendeId, erste.id)
        assert.match(fehler.message, /Konto/)
        return true
      },
    )
  })

  test('die abgelehnte zweite Reise überschreibt die erste nicht', () => {
    const erste = gastreiseAnlegen(eingabe({ title: 'Erste Reise' }))

    try {
      gastreiseAnlegen(eingabe({ title: 'Zweite Reise' }))
    } catch {
      // erwartet
    }

    assert.equal(gastspeicherLaden().aktiv?.title, 'Erste Reise')
    assert.equal(gastspeicherLaden().aktiv?.id, erste.id)
  })

  test('nach dem Verwerfen ist wieder Platz', () => {
    gastreiseAnlegen(eingabe())
    gastreiseEntfernen()

    assert.equal(gastspeicherLaden().aktiv, null)
    assert.doesNotThrow(() => gastreiseAnlegen(eingabe()))
  })
})

describe('Bearbeiten einer Gastreise', () => {
  test('ein Planpunkt landet am gewählten Tag', () => {
    const reise = gastreiseAnlegen(eingabe())
    const tag = reise.days[1]

    const danach = gastPlanpunktAnlegen(reise, {
      dayId: tag.id,
      kind: 'activity',
      title: 'Tsukiji Outer Market',
      note: null,
      startsAt: '09:30',
    })

    assert.equal(danach.days[1].items.length, 1)
    assert.equal(danach.days[1].items[0].title, 'Tsukiji Outer Market')
    assert.equal(danach.days[1].items[0].dayId, tag.id)
    assert.equal(danach.days[0].items.length, 0)
    assert.equal(gastspeicherLaden().aktiv?.days[1].items.length, 1, 'und ist gespeichert')
  })

  test('ein Punkt an einem fremden Tag wird abgelehnt', () => {
    const reise = gastreiseAnlegen(eingabe())

    assert.throws(() =>
      gastPlanpunktAnlegen(reise, {
        dayId: 'day-gibt-es-nicht',
        kind: 'note',
        title: 'Irgendwas',
        note: null,
        startsAt: null,
      }),
    )
  })

  test('nach dem Entfernen sind die Reihenfolgen wieder lückenlos', () => {
    // Eine Lücke in `position` wäre in der Datenbank erlaubt und in der Anzeige
    // eine Reihenfolge, die niemand erklären kann.
    let reise = gastreiseAnlegen(eingabe())
    const tag = reise.days[0].id

    for (const titel of ['Erster', 'Zweiter', 'Dritter']) {
      reise = gastPlanpunktAnlegen(reise, {
        dayId: tag,
        kind: 'note',
        title: titel,
        note: null,
        startsAt: null,
      })
    }

    const zweiter = reise.days[0].items[1].id
    reise = gastPlanpunktEntfernen(reise, zweiter)

    assert.deepEqual(
      reise.days[0].items.map((punkt) => [punkt.title, punkt.position]),
      [
        ['Erster', 1],
        ['Dritter', 2],
      ],
    )
  })

  test('updatedAt zieht bei jedem Schreiben nach', () => {
    const reise = gastreiseAnlegen(eingabe())
    const danach = gastreiseSpeichern({ ...reise, title: 'Neuer Titel' })

    assert.equal(danach.title, 'Neuer Titel')
    assert.ok(danach.updatedAt >= reise.updatedAt)
  })

  test('eine Änderung, die keine gültige Reise ergibt, wird nicht gespeichert', () => {
    const reise = gastreiseAnlegen(eingabe())

    assert.throws(() => gastreiseSpeichern({ ...reise, title: '   ' }))
    assert.equal(gastspeicherLaden().aktiv?.title, 'Japan im Herbst')
  })

  test('die Reise wird nur unter ihrer eigenen Kennung geliefert', () => {
    const reise = gastreiseAnlegen(eingabe())

    assert.equal(gastreiseLadenNach(reise.id)?.id, reise.id)
    assert.equal(gastreiseLadenNach('trip-fremd'), null)
  })
})

describe('Übernahme der Entwürfe aus der Fassung vor Phase 1.5', () => {
  /** Ein Entwurf, wie ihn `jetnity:guest-trips:v2` enthielt. */
  function legacyEntwurf(abweichung: Record<string, unknown> = {}) {
    return {
      id: 'trip-alt-1',
      title: 'Barcelona',
      destination: 'Barcelona',
      origin: 'Zürich',
      startDate: '2026-09-12',
      endDate: '2026-09-14',
      travelers: 2,
      pace: 'ruhig',
      interests: ['Kultur', 'Kulinarik'],
      budget: 1800,
      travelWish: 'Zwei ruhige Tage.',
      days: [
        {
          id: 'day-2026-09-12',
          date: '2026-09-12',
          items: [{ id: 'item-1', title: 'Sagrada Família', time: '10:00', createdAt: '2026-08-01' }],
        },
        { id: 'day-2026-09-13', date: '2026-09-13', items: [] },
        { id: 'day-2026-09-14', date: '2026-09-14', items: [] },
      ],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
      ...abweichung,
    }
  }

  test('ein einzelner Entwurf wird die aktive Gastreise', () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    const stand = gastspeicherLaden()

    assert.equal(stand.aktiv?.title, 'Barcelona')
    assert.deepEqual(stand.warteschlange, [])
  })

  test('alle Angaben bleiben erhalten – auch die deutschen Werte', () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    const reise = gastspeicherLaden().aktiv

    assert.equal(reise?.pace, 'calm', 'ruhig wird calm')
    assert.deepEqual(reise?.interests, ['culture', 'food'])
    assert.equal(reise?.travellers, 2)
    assert.equal(reise?.budgetAmount, 1800)
    assert.equal(reise?.currency, 'CHF')
    assert.equal(reise?.travelWish, 'Zwei ruhige Tage.')
    assert.equal(reise?.origin, 'Zürich')
  })

  test('das Ziel wird eine Etappe', () => {
    // `destination` war ein einzelnes Feld. Im neuen Modell ist ein Ziel eine
    // Etappe – so bleibt die Angabe erhalten und ist gleichzeitig erweiterbar.
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    assert.equal(gastspeicherLaden().aktiv?.stages[0].name, 'Barcelona')
  })

  test('Tage und Planpunkte kommen vollständig mit', () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    const reise = gastspeicherLaden().aktiv

    assert.equal(reise?.days.length, 3)
    assert.deepEqual(
      reise?.days.map((tag) => [tag.dayIndex, tag.dayDate]),
      [
        [1, '2026-09-12'],
        [2, '2026-09-13'],
        [3, '2026-09-14'],
      ],
    )
    assert.equal(reise?.days[0].items[0].title, 'Sagrada Família')
    assert.equal(reise?.days[0].items[0].startsAt, '10:00')
    assert.equal(reise?.days[0].items[0].kind, 'note', 'die alte Fassung kannte keine Arten')
  })

  test('mehrere Entwürfe: der neueste wird aktiv, die übrigen warten', () => {
    speicher.setzen(SCHLUESSEL.legacy, [
      legacyEntwurf({ id: 'trip-alt', title: 'Alt', updatedAt: '2026-08-01T10:00:00.000Z' }),
      legacyEntwurf({ id: 'trip-neu', title: 'Neu', updatedAt: '2026-08-10T10:00:00.000Z' }),
    ])

    const stand = gastspeicherLaden()

    assert.equal(stand.aktiv?.title, 'Neu')
    assert.deepEqual(
      stand.warteschlange.map((reise) => reise.title),
      ['Alt'],
    )
  })

  test('nichts wird verworfen: alle Entwürfe stehen zur Übernahme bereit', () => {
    speicher.setzen(SCHLUESSEL.legacy, [
      legacyEntwurf({ id: 'trip-a', title: 'A', updatedAt: '2026-08-01T10:00:00.000Z' }),
      legacyEntwurf({ id: 'trip-b', title: 'B', updatedAt: '2026-08-02T10:00:00.000Z' }),
      legacyEntwurf({ id: 'trip-c', title: 'C', updatedAt: '2026-08-03T10:00:00.000Z' }),
    ])

    gastspeicherLaden()

    assert.deepEqual(
      zurUebernahme().map((reise) => reise.title),
      ['C', 'B', 'A'],
      'die aktive Reise steht vorn, damit sie zuerst im Konto liegt',
    )
  })

  test('die Übernahme läuft genau einmal', () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    gastspeicherLaden()
    assert.equal(speicher.roh(SCHLUESSEL.legacy), null, 'der alte Schlüssel fällt weg')

    // Der zweite Aufruf darf die Warteschlange nicht erneut füllen.
    const zweiterStand = gastspeicherLaden()
    assert.equal(zweiterStand.aktiv?.title, 'Barcelona')
    assert.deepEqual(zweiterStand.warteschlange, [])
  })

  test('eine Reise dieser Fassung gewinnt gegen einen alten Entwurf', () => {
    // Sie wird gerade bearbeitet. Der alte Entwurf wandert in die
    // Warteschlange, statt sie zu überschreiben.
    const aktuell = gastreiseAnlegen(eingabe({ title: 'Diese Fassung' }))
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    const stand = gastspeicherLaden()

    assert.equal(stand.aktiv?.id, aktuell.id)
    assert.deepEqual(
      stand.warteschlange.map((reise) => reise.title),
      ['Barcelona'],
    )
  })

  test('ein unbrauchbarer alter Eintrag fällt heraus, die übrigen bleiben', () => {
    speicher.setzen(SCHLUESSEL.legacy, [{ id: 'kaputt' }, legacyEntwurf()])

    assert.equal(gastspeicherLaden().aktiv?.title, 'Barcelona')
  })

  test('ein alter Schlüssel ohne Liste wird weggeräumt', () => {
    speicher.setzen(SCHLUESSEL.legacy, { nicht: 'eine Liste' })

    assert.equal(gastspeicherLaden().aktiv, null)
    assert.equal(speicher.roh(SCHLUESSEL.legacy), null)
  })
})

describe('Aufräumen erst nach bestätigter Übernahme', () => {
  test('eine bestätigte Reise wird gestrichen', () => {
    const reise = gastreiseAnlegen(eingabe({ clientRef: 'trip-bestaetigt' }))

    uebernommenStreichen(reise.clientRef ?? reise.id)

    assert.equal(gastspeicherLaden().aktiv, null)
  })

  test('eine fremde Kennung streicht nichts', () => {
    // Der Aufrufer räumt je Reise einzeln auf, nachdem der Server ihre Kennung
    // gemeldet hat. Eine unbekannte Kennung darf nichts löschen – sonst wäre
    // ein Tippfehler ein Datenverlust.
    const reise = gastreiseAnlegen(eingabe())

    uebernommenStreichen('trip-eine-andere')

    assert.equal(gastspeicherLaden().aktiv?.id, reise.id)
  })

  test('aus der Warteschlange wird genau ein Eintrag gestrichen', () => {
    speicher.setzen(SCHLUESSEL.aktiv, null)
    const entwuerfe = ['A', 'B', 'C'].map((titel, nr) => ({
      id: `trip-${titel}`,
      clientRef: `trip-${titel}`,
      title: titel,
      origin: null,
      startDate: null,
      endDate: null,
      travellers: 1,
      currency: 'CHF',
      budgetAmount: null,
      status: 'draft',
      pace: 'balanced',
      interests: [],
      travelWish: null,
      stages: [],
      days: [{ id: `day-${nr}`, dayIndex: 1, dayDate: null, title: null, items: [] }],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    }))

    speicher.setzen(SCHLUESSEL.warteschlange, entwuerfe)

    uebernommenStreichen('trip-B')

    assert.deepEqual(
      gastspeicherLaden().warteschlange.map((reise) => reise.title),
      ['A', 'C'],
    )
  })

  test('ein Abbruch mitten in der Übernahme lässt den Rest liegen', () => {
    // Der Fall, für den die einzelne Streichung existiert: Reise 1 ist im
    // Konto, Reise 2 scheiterte. Nur Reise 1 verschwindet.
    speicher.setzen(SCHLUESSEL.legacy, [
      legacyMini('trip-1', 'Erste', '2026-08-02T10:00:00.000Z'),
      legacyMini('trip-2', 'Zweite', '2026-08-01T10:00:00.000Z'),
    ])

    gastspeicherLaden()
    uebernommenStreichen('trip-1')

    assert.deepEqual(
      zurUebernahme().map((reise) => reise.title),
      ['Zweite'],
      'der Rest bleibt für den nächsten Versuch liegen',
    )
  })
})

describe('Ein gesperrter Browserspeicher reisst die Oberfläche nicht ab', () => {
  test('das Anlegen wirft nicht, wenn nicht geschrieben werden kann', () => {
    speicher.sperren()

    // Die Reise entsteht im Speicher des Fensters und lässt sich anzeigen. Beim
    // nächsten Laden ist sie weg – das ist ehrlicher als eine Ausnahme mitten
    // in einer Eingabe.
    assert.doesNotThrow(() => gastreiseAnlegen(eingabe()))
  })
})

/** Ein minimaler Entwurf der alten Fassung, nur mit dem, was der Test braucht. */
function legacyMini(id: string, title: string, updatedAt: string) {
  return {
    id,
    title,
    destination: title,
    origin: 'Zürich',
    startDate: '2026-09-12',
    endDate: '2026-09-12',
    travelers: 1,
    pace: 'ausgewogen',
    interests: [],
    days: [{ id: 'day-1', date: '2026-09-12', items: [] }],
    createdAt: updatedAt,
    updatedAt,
  }
}
