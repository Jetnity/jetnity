// lib/reiseaenderung/erzeugen.test.ts
//
// Der Ablauf einer Reiseänderung, Fall für Fall.
//
// Ein Modellfehler darf niemals als erfolgreiche Änderung erscheinen. Ein
// bezahlter Aufruf muss genau einmal abgeschlossen werden. Kein Test ruft ein
// Modell auf.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { rohergebnisAus } from '@/lib/modell/antwort'
import type { Modellanfrage, Modellergebnis } from '@/lib/modell/aufruf'
import type { Ergebnisklasse, Modellzustand } from '@/lib/modell/konfiguration'
import type { Tokennutzung } from '@/lib/modell/preise'
import { reiseaenderungErzeugen, type Aenderungswerkzeuge } from '@/lib/reiseaenderung/erzeugen'
import {
  ANTWORT_ZU_DRITT,
  ANTWORT_ZWEI_TAGE_LAENGER,
  aenderungAntwort,
  leereOperation,
} from '@/lib/reiseaenderung/fixtures/antworten'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { antwortMit } from '@/lib/reisevorschlag/fixtures/antworten'

const WUNSCH = 'Mach die Reise zwei Tage länger.'
const HEUTE = '2026-08-20'
const AKTIV: Modellzustand = { aktiv: true, modell: 'gpt-5.6-terra', aufwand: 'low' }

type Protokoll = {
  klasse: Ergebnisklasse
  nutzung: Tokennutzung | null
  laufzeitMs: number
  id: string
}

function antwortet(inhalt: unknown, laufzeitMs = 4200): Modellergebnis {
  return { ...rohergebnisAus(200, antwortMit(inhalt)), laufzeitMs }
}

function werkzeuge(abweichung: Partial<Aenderungswerkzeuge> = {}) {
  const abschluesse: Protokoll[] = []
  const anfragen: Modellanfrage[] = []
  let beansprucht = 0

  const gestellt: Aenderungswerkzeuge = {
    zustand: AKTIV,
    beanspruchen: async () => {
      beansprucht += 1
      return { ok: true as const, id: `nutzung-${beansprucht}` }
    },
    abschliessen: async (id, klasse, nutzung, laufzeitMs) => {
      abschluesse.push({ id, klasse, nutzung, laufzeitMs })
    },
    aufrufen: async () => antwortet(ANTWORT_ZWEI_TAGE_LAENGER),
    heute: HEUTE,
    kennung: (prefix) => `${prefix}-neu`,
    mutationId: 'mutation-1',
    ...abweichung,
  }

  const wirklichAufrufen = gestellt.aufrufen
  gestellt.aufrufen = async (anfrage) => {
    anfragen.push(anfrage)
    return wirklichAufrufen(anfrage)
  }

  return { gestellt, abschluesse, anfragen, zaehle: () => beansprucht }
}

describe('Ein gültiger Wunsch wird zur Vorschau', () => {
  test('Operationen werden auf die Reise angewendet', async () => {
    const { gestellt } = werkzeuge()
    const ergebnis = await reiseaenderungErzeugen(WUNSCH, beispielreise(), gestellt)

    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.vorschau.nachher.days.length, 7)
    assert.equal(ergebnis.vorschau.basisRevision, 3)
    assert.equal(ergebnis.vorschau.mutationId, 'mutation-1')
    assert.ok(ergebnis.vorschau.diff.some((eintrag) => eintrag.art === 'tag'))
  })

  test('bestehende Kennungen bleiben', async () => {
    const { gestellt } = werkzeuge()
    const ergebnis = await reiseaenderungErzeugen(WUNSCH, beispielreise(), gestellt)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.vorschau.nachher.days[0]?.id, 'day-1')
    assert.equal(ergebnis.vorschau.nachher.days[0]?.items[0]?.id, 'item-1')
  })

  test('kommerzielle Felder bleiben', async () => {
    const { gestellt } = werkzeuge()
    const ergebnis = await reiseaenderungErzeugen(WUNSCH, beispielreise(), gestellt)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const dom = ergebnis.vorschau.nachher.days[0]?.items[0]
    assert.equal(dom?.priceAmount, 18)
    assert.equal(dom?.provider, 'getyourguide')
  })
})

describe('Fehlerfälle speichern nichts und erscheinen nicht als Erfolg', () => {
  test('ein zu kurzer Wunsch', async () => {
    const { gestellt, zaehle } = werkzeuge()
    const ergebnis = await reiseaenderungErzeugen('länger', beispielreise(), gestellt)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.klasse, 'eingabe')
    assert.equal(zaehle(), 0)
  })

  test('abgeschaltetes Modell', async () => {
    const { gestellt, zaehle } = werkzeuge({
      zustand: { aktiv: false, grund: 'abgeschaltet' },
    })
    const ergebnis = await reiseaenderungErzeugen(WUNSCH, beispielreise(), gestellt)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.klasse, 'gesperrt')
    assert.equal(zaehle(), 0)
  })

  test('erschöpftes Kontingent ruft das Modell nicht', async () => {
    const { gestellt, anfragen } = werkzeuge({
      beanspruchen: async () => ({
        ok: false,
        meldung: 'Heute sind keine weiteren Planungen möglich.',
      }),
    })
    const ergebnis = await reiseaenderungErzeugen(WUNSCH, beispielreise(), gestellt)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.klasse, 'gesperrt')
    assert.equal(anfragen.length, 0)
  })

  test('eine schemawidrige Antwort wird abgeschlossen, nicht übernommen', async () => {
    const { gestellt, abschluesse } = werkzeuge({
      aufrufen: async () => antwortet({ zusammenfassung: 'x' }, 100),
    })
    const ergebnis = await reiseaenderungErzeugen(WUNSCH, beispielreise(), gestellt)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.klasse, 'schema')
    assert.deepEqual(
      abschluesse.map((eintrag) => eintrag.klasse),
      ['schema'],
    )
  })

  test('unbekannte Referenzen werden nicht gespeichert', async () => {
    const { gestellt } = werkzeuge({
      aufrufen: async () =>
        antwortet(aenderungAntwort([leereOperation('etappe_entfernen', { etappeId: 'fehlt' })]), 80),
    })
    const ergebnis = await reiseaenderungErzeugen(WUNSCH, beispielreise(), gestellt)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.klasse, 'schema')
  })

  test('eine Änderung, die nichts ändert, wird verworfen', async () => {
    const { gestellt } = werkzeuge({
      aufrufen: async () => antwortet(ANTWORT_ZU_DRITT, 80),
    })
    const ergebnis = await reiseaenderungErzeugen(
      'Wir reisen jetzt zu dritt.',
      beispielreise({ travellers: 3 }),
      gestellt,
    )
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.match(ergebnis.meldung, /keine Änderung/)
  })
})

describe('Sol fällt genau einmal auf Terra zurück', () => {
  test('nach Zeitüberschreitung kommt Terra zum Zug', async () => {
    const { gestellt, anfragen, zaehle } = werkzeuge({
      zustand: { aktiv: true, modell: 'gpt-5.6-sol', aufwand: 'low' },
      aufrufen: async (anfrage) => {
        if (anfrage.modell === 'gpt-5.6-sol') {
          return {
            ok: false,
            klasse: 'zeitueberschreitung',
            nutzung: null,
            laufzeitMs: 120_000,
          } satisfies Modellergebnis
        }
        return antwortet(ANTWORT_ZWEI_TAGE_LAENGER, 4000)
      },
    })

    const ergebnis = await reiseaenderungErzeugen(WUNSCH, beispielreise(), gestellt)
    assert.equal(ergebnis.ok, true)
    assert.deepEqual(
      anfragen.map((anfrage) => anfrage.modell),
      ['gpt-5.6-sol', 'gpt-5.6-terra'],
    )
    assert.equal(zaehle(), 2)
  })
})
