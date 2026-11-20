import assert from 'node:assert/strict'
import { test } from 'node:test'

import { vorschlagAlsNutzlast, vorschlagAlsReise } from '@/lib/reisevorschlag/abbildung'
import { reisevorschlagErzeugen, type Werkzeuge } from '@/lib/reisevorschlag/erzeugen'
import { VORSCHLAG_THAILAND, antwortMit } from '@/lib/reisevorschlag/fixtures/antworten'
import { rohergebnisAus } from '@/lib/modell/antwort'
import {
  VORSCHLAG_FASSUNG, modellvorschlagSchema, reisevorschlagSchema,
  type Modellvorschlag,
} from '@/lib/reisevorschlag/schema'

const FEHLKLASSIFIZIERT = 'Letzter Morgen in Krabi'

function unzutreffendeUnterkunft(): Modellvorschlag {
  const kopie: Modellvorschlag = structuredClone(VORSCHLAG_THAILAND)
  kopie.tage.at(-1)!.punkte.unshift({
    art: 'stay',
    titel: FEHLKLASSIFIZIERT,
    notiz: 'Freier Vormittag vor dem Rückflug.',
    beginn: '09:00',
  })
  return kopie
}

test('#1237: Modell- und Konto-Schema korrigieren letzten Morgen, nicht echte Nächte', () => {
  const original = unzutreffendeUnterkunft()
  const originalBytes = JSON.stringify(original)
  const vorschlag = modellvorschlagSchema.parse(original)
  assert.equal(vorschlag.tage.length, 7)
  assert.equal(vorschlag.tage.at(-1)!.punkte[0]!.art, 'activity')
  assert.equal(vorschlag.tage.at(-1)!.punkte[0]!.titel, FEHLKLASSIFIZIERT)
  assert.equal(vorschlag.tage.at(-1)!.punkte[0]!.beginn, '09:00')
  assert.ok(vorschlag.tage[0]!.punkte.some(p => p.titel.includes('Nacht') && p.art === 'stay'))
  assert.ok(vorschlag.tage[3]!.punkte.some(p => p.titel.includes('Nächte') && p.art === 'stay'))
  assert.equal(JSON.stringify(original), originalBytes, 'untrusted model input is not mutated')

  const gespeichert = reisevorschlagSchema.parse({
    ...original, fassung: VORSCHLAG_FASSUNG, reisewunsch: 'Eine Woche Bangkok und Krabi',
  })
  const eingabe = vorschlagAlsNutzlast(gespeichert, 'separate-new-test-trip')
  assert.equal(eingabe.days.length, 7)
  assert.equal(eingabe.days.at(-1)!.items[0]!.kind, 'activity')
  assert.equal(eingabe.days[0]!.items[1]!.kind, 'stay')
  assert.equal(eingabe.days.at(-1)!.items.filter(p => p.kind === 'stay').length, 0)
  assert.equal(eingabe.client_ref, 'separate-new-test-trip')

  let count = 0
  const gast = vorschlagAlsReise(
    gespeichert, 'separate-new-test-trip',
    prefix => prefix + '-' + ++count, '2026-11-20T12:00:00Z',
  )
  assert.equal(gast.days.at(-1)!.items[0]!.kind, 'activity')
  assert.equal(gast.days[0]!.items[1]!.kind, 'stay')
  // Parsing a stale browser draft again cannot resurrect the wrong stay type.
  assert.deepEqual(reisevorschlagSchema.parse(gespeichert), gespeichert)
})

test('#1237: Schema does not reclassify a genuine last-day stay or unrelated activities', () => {
  const sample = unzutreffendeUnterkunft()
  sample.tage.at(-1)!.punkte[0] = {
    art: 'stay', titel: 'Nacht in Krabi', notiz: null, beginn: null,
  }
  const parsed = modellvorschlagSchema.parse(sample)
  assert.equal(parsed.tage.at(-1)!.punkte[0]!.art, 'stay')
})

test('#1237: one existing model attempt, zero extra quota reservations for classification repair', async () => {
  let booked = 0
  let calls = 0
  let completed = 0
  const w: Werkzeuge = {
    zustand: { aktiv: true, modell: 'gpt-5.6-terra', aufwand: 'low' },
    beanspruchen: async () => { booked++; return { ok: true, id: 'synthetic' } },
    abschliessen: async () => { completed++ },
    aufrufen: async () => {
      calls++
      return { ...rohergebnisAus(200, antwortMit(unzutreffendeUnterkunft())), laufzeitMs: 50 }
    },
    heute: '2026-11-20',
  }
  const result = await reisevorschlagErzeugen(
    '7 Tage Thailand ab Zürich, zwei Personen, maximal CHF 3’000, Strand und Essen.',
    w,
  )
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.vorschlag.tage.at(-1)!.punkte[0]!.art, 'activity')
  assert.equal(booked, 1)
  assert.equal(calls, 1)
  assert.equal(completed, 1)
})
