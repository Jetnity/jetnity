// lib/reisevorschlag/uebernahme.test.ts
//
// Die Freigabe. Bis hierher hat ein Vorschlag Geld gekostet und nichts
// verändert; ab hier entsteht eine Reise – und zwar genau eine, auf einem der
// beiden bestehenden Wege aus Phase 1.5:
//
//   · ohne Konto  → `gastreiseAblegen()` im `localStorage`
//   · mit Konto   → `public.reise_anlegen()` über `vorschlagUebernehmen()`
//
// Für Modellreisen entsteht keine zweite Persistenz, und das ist der Grund,
// warum dieser Test vor allem eine Sache prüft: dass ein Doppelklick und ein
// erneuter Anlauf nach einem Abbruch **eine** Reise ergeben. Ein Reload nach
// der Übernahme trifft dieselbe gespeicherte Reise; ein Reload in der Vorschau
// verwirft den noch nicht übernommenen Vorschlag bewusst (ADR-0050).
//
// Der Gastweg läuft hier vollständig, mit einem gestellten `localStorage`. Der
// Kontoweg endet in einer Server Action mit echter Verbindung; geprüft wird
// deshalb, was sie an die Datenbank schickt – dieselbe Kennung ergibt dieselbe
// Nutzlast, und `unique (user_id, client_ref)` macht daraus einen Vorgang. Was
// die Datenbank damit tut, weisen `scripts/db/sicherheit.mjs`
// („reise_anlegen liefert bei zweitem Aufruf dieselbe Reise") und
// `scripts/db/parallelitaet.mjs` nach.

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { vorschlagAlsNutzlast, vorschlagAlsReise } from '@/lib/reisevorschlag/abbildung'
import { VORSCHLAG_FASSUNG, uebernahmeSchema, type Reisevorschlag } from '@/lib/reisevorschlag/schema'
import { VORSCHLAG_MIT_DATUM, VORSCHLAG_THAILAND } from '@/lib/reisevorschlag/fixtures/antworten'
import {
  GastreiseBestehtFehler,
  SpeicherFehler,
  gastreiseAblegen,
  gastreiseSpeichern,
  gastspeicherLaden,
  kennungErzeugen,
  zurUebernahme,
} from '@/lib/trips/gastspeicher'
import { reiseLesen } from '@/lib/trips/schema'

const JETZT = '2026-08-18T08:00:00.000Z'

/**
 * Ein `localStorage`, der sich wie einer verhält – inklusive der Arten, auf die
 * ein echter versagt: voller Speicher (`sperren`) und der private Modus, der
 * nichts behält und trotzdem nicht wirft (`stummschalten`).
 */
function speicherStellen() {
  const ablage = new Map<string, string>()
  let gesperrt = false
  let stumm = false

  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (schluessel: string) => ablage.get(schluessel) ?? null,
        setItem: (schluessel: string, wert: string) => {
          if (gesperrt) throw new Error('QuotaExceededError')
          if (stumm) return
          ablage.set(schluessel, wert)
        },
        removeItem: (schluessel: string) => ablage.delete(schluessel),
      },
    },
  })

  return {
    sperren: () => {
      gesperrt = true
    },
    stummschalten: () => {
      stumm = true
    },
    entsperren: () => {
      gesperrt = false
      stumm = false
    },
    leer: () => ablage.size === 0,
  }
}

let speicher: ReturnType<typeof speicherStellen>

beforeEach(() => {
  speicher = speicherStellen()
})

function vorschlag(
  roh: typeof VORSCHLAG_THAILAND | typeof VORSCHLAG_MIT_DATUM = VORSCHLAG_THAILAND,
): Reisevorschlag {
  return { ...roh, fassung: VORSCHLAG_FASSUNG, reisewunsch: '7 Tage Thailand ab Zürich.' }
}

/** Was die Oberfläche beim Übernehmen tut, ohne die Oberfläche. */
function uebernehmen(kennung: string, roh?: typeof VORSCHLAG_MIT_DATUM) {
  return gastreiseAblegen(
    vorschlagAlsReise(vorschlag(roh), kennung, kennungErzeugen, JETZT),
  )
}

describe('Ein Gast gibt einen Vorschlag frei', () => {
  test('vor der Freigabe liegt nichts im Speicher', () => {
    // Die Anforderung wörtlich: Ohne ausdrückliche Freigabe wird keine
    // modellgenerierte Reise übernommen. Ein Vorschlag entsteht, wird angesehen –
    // und existiert bis dahin nur im Speicher des Fensters.
    vorschlagAlsReise(vorschlag(), 'trip-1', kennungErzeugen, JETZT)

    assert.ok(speicher.leer())
    assert.equal(gastspeicherLaden().aktiv, null)
  })

  test('nach der Freigabe ist die Reise da', () => {
    const reise = uebernehmen('trip-1')

    assert.equal(reise.id, 'trip-1')
    assert.equal(gastspeicherLaden().aktiv?.id, 'trip-1')
  })

  test('sie überlebt einen Reload', () => {
    // Der Reload ist im Test ein zweites `gastspeicherLaden()`: Die Reise kommt
    // aus dem `localStorage` und nicht aus dem Zustand der Komponente.
    uebernehmen('trip-1')

    const nachReload = gastspeicherLaden().aktiv

    assert.equal(nachReload?.id, 'trip-1')
    assert.equal(nachReload?.days.length, 7)
    assert.equal(nachReload?.stages.length, 2)
  })

  test('sie ist vollständig – Etappen, Tage, Planpunkte', () => {
    const reise = gastspeicherLaden().aktiv ?? uebernehmen('trip-1')

    assert.equal(reise.title, VORSCHLAG_THAILAND.titel)
    assert.equal(reise.travellers, 2)
    assert.equal(reise.budgetAmount, 3000)
    assert.equal(reise.pace, 'calm')
    assert.deepEqual(reise.interests, ['beach', 'food'])
    assert.equal(
      reise.days.reduce((summe, tag) => summe + tag.items.length, 0),
      VORSCHLAG_THAILAND.tage.reduce((summe, tag) => summe + tag.punkte.length, 0),
    )
  })

  test('sie ist eine gültige Reise – dieselbe Prüfung wie jeder andere Weg', () => {
    uebernehmen('trip-1')

    assert.notEqual(reiseLesen(gastspeicherLaden().aktiv), null)
  })

  test('der Status ist ein Entwurf', () => {
    assert.equal(uebernehmen('trip-1').status, 'draft')
  })
})

describe('Doppelklick, Reload und Retry ergeben eine Reise', () => {
  test('zweimal übernehmen mit derselben Kennung ergibt dieselbe Reise', () => {
    // Der Doppelklick. Ohne diesen Vertrag wäre der zweite Klick ein
    // `GastreiseBestehtFehler` – eine Fehlermeldung für einen Vorgang, der
    // erfolgreich war.
    const erste = uebernehmen('trip-1')
    const zweite = uebernehmen('trip-1')

    assert.deepEqual(zweite, erste)
    assert.equal(gastspeicherLaden().aktiv?.id, 'trip-1')
  })

  test('der zweite Anlauf legt keine zweite Reise an', () => {
    uebernehmen('trip-1')
    uebernehmen('trip-1')

    assert.deepEqual(
      zurUebernahme().map((reise) => reise.clientRef),
      ['trip-1'],
    )
  })

  test('der zweite Anlauf überschreibt die Reise nicht', () => {
    // Der Fall dahinter: Der Nutzer hat die Reise nach der Übernahme bearbeitet
    // und drückt „Übernehmen" versehentlich erneut – etwa über den Zurück-Knopf
    // des Browsers. Die Bearbeitung darf nicht verloren gehen.
    const reise = uebernehmen('trip-1')
    gastreiseSpeichern({ ...reise, title: 'Von Hand umbenannt' })

    assert.equal(gastreiseAblegen(reise).title, 'Von Hand umbenannt')
    assert.equal(gastspeicherLaden().aktiv?.title, 'Von Hand umbenannt')
  })

  test('ein anderer Vorschlag wird abgelehnt und nennt die bestehende Reise', () => {
    // Ohne Konto gibt es genau eine aktive Gastreise. Das ist eine Produktregel
    // aus Phase 1.5, und der Modellweg umgeht sie nicht.
    uebernehmen('trip-1')

    assert.throws(
      () => uebernehmen('trip-2', VORSCHLAG_MIT_DATUM),
      (fehler: unknown) => {
        assert.ok(fehler instanceof GastreiseBestehtFehler)
        assert.equal(fehler.bestehendeId, 'trip-1')
        return true
      },
    )
  })

  test('die abgelehnte Übernahme lässt die bestehende Reise unberührt', () => {
    uebernehmen('trip-1')

    try {
      uebernehmen('trip-2', VORSCHLAG_MIT_DATUM)
    } catch {
      // erwartet
    }

    assert.equal(gastspeicherLaden().aktiv?.id, 'trip-1')
    assert.equal(gastspeicherLaden().aktiv?.title, VORSCHLAG_THAILAND.titel)
  })
})

describe('Ein Fehler beim Speichern lässt den Vorschlag nicht verschwinden', () => {
  test('ein voller Speicher wirft, statt Erfolg zu melden', () => {
    // Der Aufruf hat Geld gekostet. Ein stiller Fehlschlag hiesse: Die Oberfläche
    // wechselt in den Arbeitsbereich, und dort ist nichts.
    speicher.sperren()

    assert.throws(() => uebernehmen('trip-1'), SpeicherFehler)
    assert.equal(gastspeicherLaden().aktiv, null)
  })

  test('ein stummer Speicher fällt trotz fehlender Ausnahme auf', () => {
    // Der private Modus mancher Browser: `setItem` wirft nicht und behält nichts.
    // Nur das Zurücklesen bemerkt es.
    speicher.stummschalten()

    assert.throws(() => uebernehmen('trip-1'), SpeicherFehler)
  })

  test('nach dem Fehlschlag gelingt derselbe Vorschlag', () => {
    // Der Vorschlag bleibt in der Vorschau stehen, der Nutzer drückt erneut. Kein
    // Phantom: Der zweite Anlauf scheitert nicht an einer „bestehenden" Reise, die
    // niemand sehen kann.
    speicher.sperren()
    assert.throws(() => uebernehmen('trip-1'))

    speicher.entsperren()
    const reise = uebernehmen('trip-1')

    assert.equal(reise.id, 'trip-1')
    assert.equal(gastspeicherLaden().aktiv?.id, 'trip-1')
  })
})

describe('Die Gastreise trägt die Idempotenz weiter ins Konto', () => {
  test('sie steht mit ihrer Kennung zur Übernahme bereit', () => {
    // Nach einer Anmeldung läuft der bestehende Weg aus Phase 1.5. Dass die
    // Kennung des Vorschlags die des Entwurfs ist, macht die spätere Übernahme
    // idempotent: `unique (user_id, client_ref)`.
    uebernehmen('trip-1')

    const bereit = zurUebernahme()

    assert.equal(bereit.length, 1)
    assert.equal(bereit[0].clientRef, 'trip-1')
  })
})

describe('Was der Kontoweg an die Datenbank schickt', () => {
  const fertig = vorschlag()

  test('dieselbe Kennung ergibt dieselbe Nutzlast', () => {
    // Der Grund, warum ein Doppelklick im Konto eine Reise ergibt: Zwei Anfragen
    // sind byteweise dieselbe, und `public.reise_anlegen()` liefert beim zweiten
    // Aufruf die Kennung der bestehenden Reise.
    assert.deepEqual(
      vorschlagAlsNutzlast(fertig, 'trip-1'),
      vorschlagAlsNutzlast(fertig, 'trip-1'),
    )
  })

  test('eine andere Kennung ist eine andere Reise', () => {
    assert.notEqual(
      vorschlagAlsNutzlast(fertig, 'trip-1').client_ref,
      vorschlagAlsNutzlast(fertig, 'trip-2').client_ref,
    )
  })

  test('ohne Kennung kommt die Übernahme nicht zustande', () => {
    assert.equal(uebernahmeSchema.safeParse({ vorschlag: fertig }).success, false)
  })

  test('ein im Browser verändeter Vorschlag wird abgelehnt, nicht gespeichert', () => {
    // Der Vorschlag kommt aus dem Browser zurück und ist damit unbekannte
    // Eingabe. Hier ist die Etappenreihe gebrochen – die Reise hätte einen Tag
    // ohne Aufenthaltsort.
    const manipuliert = {
      ...fertig,
      etappen: [{ name: 'Bangkok', laendercode: 'TH', vonTag: 1, bisTag: 2 }],
    }

    assert.equal(
      uebernahmeSchema.safeParse({ clientRef: 'trip-1', vorschlag: manipuliert }).success,
      false,
    )
  })

  test('eine mitgeschickte Kontokennung wird nicht übernommen', () => {
    // Die Eigentümerkennung kommt aus `auth.uid()`, und die Nutzlast trägt keine.
    const ergebnis = uebernahmeSchema.safeParse({
      clientRef: 'trip-1',
      vorschlag: { ...fertig, user_id: '11111111-1111-4111-8111-111111111111' },
    })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) {
      const nutzlast = vorschlagAlsNutzlast(ergebnis.data.vorschlag, ergebnis.data.clientRef)
      assert.equal('user_id' in nutzlast, false)
      assert.equal('status' in nutzlast, false)
    }
  })
})
