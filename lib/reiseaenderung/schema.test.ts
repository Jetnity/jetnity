// lib/reiseaenderung/schema.test.ts
//
// Grenze zwischen Modell und deterministischer Anwendung. Was hier durchkommt,
// wird auf die vertrauenswürdige Reise angewendet. Preise und Anbieter kommen
// in diesem Schema nicht vor.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { ANTWORT_ZU_DRITT, aenderungAntwort, leereOperation } from '@/lib/reiseaenderung/fixtures/antworten'
import {
  AENDERUNG_ARTEN,
  AENDERUNG_FASSUNG,
  AENDERUNG_GRENZEN,
  AENDERUNG_JSON_SCHEMA,
  aenderungstextSchema,
  modellaenderungSchema,
  reiseaenderungSchema,
} from '@/lib/reiseaenderung/schema'
import { TRIP_ITEM_KINDS, TRIP_PACES } from '@/types/trips'

function gelesen(abweichung: Record<string, unknown> = {}) {
  return modellaenderungSchema.safeParse({ ...ANTWORT_ZU_DRITT, ...abweichung })
}

describe('Ein vollständiger Änderungsvorschlag kommt durch', () => {
  test('die Vorlage ist gültig', () => {
    const ergebnis = modellaenderungSchema.safeParse(ANTWORT_ZU_DRITT)
    assert.equal(ergebnis.success, true)
  })

  test('eine Fassung gehört zur übernommenen Änderung', () => {
    const ergebnis = reiseaenderungSchema.safeParse({
      ...ANTWORT_ZU_DRITT,
      fassung: AENDERUNG_FASSUNG,
    })
    assert.equal(ergebnis.success, true)
  })

  test('eine fremde Fassung fällt durch', () => {
    assert.equal(
      reiseaenderungSchema.safeParse({ ...ANTWORT_ZU_DRITT, fassung: 99 }).success,
      false,
    )
  })
})

describe('Fachliche Grenzen', () => {
  test('ohne Operationen gibt es keine Änderung', () => {
    assert.equal(gelesen({ operationen: [] }).success, false)
  })

  test('Stammdaten ohne jedes Feld fallen durch', () => {
    assert.equal(
      gelesen(aenderungAntwort([leereOperation('stammdaten')])).success,
      false,
    )
  })

  test('Dauer um 0 Tage ändert nichts und fällt durch', () => {
    assert.equal(
      gelesen(aenderungAntwort([leereOperation('dauer_aendern', { tageDelta: 0 })])).success,
      false,
    )
  })

  test('eine Etappe ohne Ort fällt durch', () => {
    assert.equal(
      gelesen(aenderungAntwort([leereOperation('etappe_hinzufuegen', { tage: 2 })])).success,
      false,
    )
  })

  test('ein zu langer Wunsch fällt durch', () => {
    assert.equal(aenderungstextSchema.safeParse('kurz').success, false)
    assert.equal(
      aenderungstextSchema.safeParse('x'.repeat(AENDERUNG_GRENZEN.freitextMaximum + 1)).success,
      false,
    )
    assert.equal(aenderungstextSchema.safeParse('Mach die Reise zwei Tage länger.').success, true)
  })
})

describe('JSON-Schema und Zod sagen dasselbe', () => {
  test('dieselben Wurzel-Felder', () => {
    const ausJson = Object.keys(AENDERUNG_JSON_SCHEMA.properties).sort()
    assert.deepEqual(ausJson, ['annahmen', 'operationen', 'warnungen', 'zusammenfassung'])
  })

  test('jede Eigenschaft steht in required – strict: true verlangt es', () => {
    const pruefen = (schema: Record<string, unknown>, pfad: string) => {
      if (schema.type === 'object' && schema.properties) {
        const eigenschaften = Object.keys(schema.properties as object)
        const verlangt = ((schema.required ?? []) as string[]).slice().sort()
        assert.deepEqual(verlangt, eigenschaften.slice().sort(), `${pfad}: required unvollständig`)
        assert.equal(schema.additionalProperties, false, `${pfad}: additionalProperties fehlt`)
        for (const [name, kind] of Object.entries(schema.properties as Record<string, Record<string, unknown>>)) {
          pruefen(kind, `${pfad}.${name}`)
          if (kind.items && typeof kind.items === 'object') {
            pruefen(kind.items as Record<string, unknown>, `${pfad}.${name}[]`)
          }
        }
      }
    }
    pruefen(AENDERUNG_JSON_SCHEMA as unknown as Record<string, unknown>, 'aenderung')
  })

  test('keine Längenangabe im JSON-Schema', () => {
    const roh = JSON.stringify(AENDERUNG_JSON_SCHEMA)
    assert.doesNotMatch(roh, /minLength/)
    assert.doesNotMatch(roh, /maxLength/)
  })

  test('dieselben Aufzählungen', () => {
    const op = AENDERUNG_JSON_SCHEMA.properties.operationen.items
    assert.deepEqual([...op.properties.art.enum], [...AENDERUNG_ARTEN])
    assert.deepEqual([...op.properties.tempo.enum], [...TRIP_PACES, null])
    assert.deepEqual([...op.properties.punktArt.enum], [...TRIP_ITEM_KINDS, null])
  })

  test('keine Preise, Anbieter oder Buchungsfelder', () => {
    const namen: string[] = []
    const sammeln = (schema: Record<string, unknown>) => {
      if (schema.properties && typeof schema.properties === 'object') {
        for (const [name, kind] of Object.entries(schema.properties as Record<string, Record<string, unknown>>)) {
          namen.push(name)
          sammeln(kind)
          if (kind.items && typeof kind.items === 'object') sammeln(kind.items as Record<string, unknown>)
        }
      }
    }
    sammeln(AENDERUNG_JSON_SCHEMA as unknown as Record<string, unknown>)
    assert.equal(
      namen.some((name) => /price|preis|provider|anbieter|booking|buchung|external/i.test(name)),
      false,
    )
  })
})
