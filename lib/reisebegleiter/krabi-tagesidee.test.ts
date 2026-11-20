import assert from 'node:assert/strict'
import { test } from 'node:test'

import { angeboteneBefunde, befundEintrag } from '@/lib/reisebegleiter/befunde'
import { begleiterauskunftErzeugen, type Begleiterwerkzeuge } from '@/lib/reisebegleiter/erzeugen'
import type { AssistantTruthContext } from '@/lib/reisebegleiter/kontext'

const KRABI: AssistantTruthContext = {
  version: 'assistant-truth-context-v1',
  trip: { startDate: null, endDate: null },
  stages: [{
    stageId: 'stage-krabi', position: 2, name: 'Krabi', countryCode: 'TH',
    placeId: null, arrivalDate: null, departureDate: null, latitude: null, longitude: null,
  }],
  travellers: [],
  route: { vorhanden: false, quelle: null, destinationCountryCodes: ['TH'], transitCountryCodes: [] },
  official: [], safety: [], seasonal: [], generatedSuggestion: [], unfilledTruthClasses: [],
}
const FRAGE = 'Was empfiehlst du mir für einen Tag in Krabi? Bitte ändere meine Reise nicht.'

function tools(answer: unknown, log: string[]): Begleiterwerkzeuge {
  return {
    zustand: { aktiv: true, modell: 'gpt-5.6-terra', aufwand: 'low' },
    beanspruchen: async () => { log.push('reserve'); return { ok: true, id: 'usage-test' } },
    abschliessen: async (_id, klasse) => { log.push('finish:' + klasse) },
    aufrufen: async () => {
      log.push('model')
      return { ok: true, text: JSON.stringify(answer), nutzung: null, laufzeitMs: 5 }
    },
    heute: '2026-11-20',
  }
}

test('#1237: Krabi-Tagesidee wird nur als geschlossene, nichtamtliche Jetnity-Aussage angeboten', () => {
  const offered = angeboteneBefunde(KRABI)
  const idea = offered.find(v => v.schluessel === 'schritt_krabi_tagesidee')
  assert.deepEqual(idea, { schluessel: 'schritt_krabi_tagesidee', ref: 'E1' })
  const entry = befundEintrag('schritt_krabi_tagesidee')
  assert.equal(entry.rolle, 'schritt')
  assert.match(entry.text, /Strand|Natur|Bootstour/)
  assert.doesNotMatch(entry.text, /Visum|Einreise|gebucht|CHF|EUR|https?:/i)
  const wrong = structuredClone(KRABI)
  wrong.stages[0]!.countryCode = 'DE'
  assert.equal(angeboteneBefunde(wrong).some(v => v.schluessel === 'schritt_krabi_tagesidee'), false)
})

test('#1237: Modell wählt passende Krabi-Tagesidee aus dem Angebot; keine erfundenen Textfelder', async () => {
  const log: string[] = []
  const ergebnis = await begleiterauskunftErzeugen(FRAGE, KRABI, tools({
    befunde: [{ schluessel: 'schritt_krabi_tagesidee', ref: 'E1' }],
    bezuege: ['E1'], amtlicheHinweise: [],
  }, log))
  assert.equal(ergebnis.ok, true, JSON.stringify(ergebnis))
  if (ergebnis.ok) {
    assert.equal(ergebnis.auskunft.befunde.length, 1)
    assert.equal(ergebnis.auskunft.befunde[0]?.rolle, 'schritt')
    assert.match(ergebnis.auskunft.befunde[0]?.text ?? '', /Krabi/)
    assert.equal(ergebnis.auskunft.amtlicheHinweise.length, 0)
  }
  assert.deepEqual(log, ['reserve', 'model', 'finish:erfolg'])
})

test('#1237: nur Krabi-Etappenreferenz ohne konkrete Tagesidee wird ehrlich abgelehnt', async () => {
  const log: string[] = []
  const ergebnis = await begleiterauskunftErzeugen(FRAGE, KRABI,
    tools({ befunde: [], bezuege: ['E1'], amtlicheHinweise: [] }, log))
  assert.equal(ergebnis.ok, false)
  if (!ergebnis.ok) {
    assert.equal(ergebnis.klasse, 'verweigert')
    assert.match(ergebnis.meldung, /keine konkrete Tagesidee/)
  }
  assert.deepEqual(log, ['reserve', 'model', 'finish:verweigert'])
})
