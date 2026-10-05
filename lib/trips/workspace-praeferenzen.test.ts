import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { CREATE_PERSISTENZ_INTERESSEN, CREATE_PERSISTENZ_TEMPO } from '@/lib/trips/create-entry'
import {
  workspacePraeferenzHatInhalt,
  workspacePraeferenzSicht,
} from '@/lib/trips/workspace-praeferenzen'

const hier = dirname(fileURLToPath(import.meta.url))

describe('Workspace-Präferenzen bleiben truth-safe', () => {
  test('neuer Create mit internem balanced und leeren Interessen zeigt keine Tempo-Karte', () => {
    const sicht = workspacePraeferenzSicht({
      interests: CREATE_PERSISTENZ_INTERESSEN,
      travelWish: null,
    })
    assert.equal(CREATE_PERSISTENZ_TEMPO, 'balanced')
    assert.equal(sicht.zeigeTempo, false)
    assert.deepEqual(sicht.interessen, [])
    assert.equal(sicht.reisewunsch, null)
    assert.equal(workspacePraeferenzHatInhalt(sicht), false)
  })

  test('Reisewunsch bleibt sichtbar, ohne Tempo zu behaupten', () => {
    const sicht = workspacePraeferenzSicht({
      interests: [],
      travelWish: '  Langsam durch Kyoto  ',
    })
    assert.equal(sicht.zeigeTempo, false)
    assert.equal(sicht.reisewunsch, 'Langsam durch Kyoto')
    assert.deepEqual(sicht.interessen, [])
    assert.equal(workspacePraeferenzHatInhalt(sicht), true)
  })

  test('persistierte Interessen bleiben ohne Pace-Behauptung sichtbar', () => {
    const sicht = workspacePraeferenzSicht({
      interests: ['culture', 'food'],
      travelWish: null,
    })
    assert.equal(sicht.zeigeTempo, false)
    assert.deepEqual(sicht.interessen, ['culture', 'food'])
    assert.equal(sicht.reisewunsch, null)
    assert.equal(workspacePraeferenzHatInhalt(sicht), true)
  })

  test('leerer oder nur-Whitespace-Reisewunsch ist kein Inhalt', () => {
    const sicht = workspacePraeferenzSicht({
      interests: [],
      travelWish: '   ',
    })
    assert.equal(sicht.reisewunsch, null)
    assert.equal(workspacePraeferenzHatInhalt(sicht), false)
  })
})

describe('Workspace-Übersicht behauptet kein erfundenes Tempo', () => {
  test('Komponente zeigt balanced nicht als Ausgewogen und nutzt keine Tempo-Karte', () => {
    const datei = readFileSync(join(hier, '../../components/trips/TripWorkspaceUebersicht.tsx'), 'utf8')
    assert.equal(datei.includes('TEMPO_BEZEICHNUNG'), false)
    assert.equal(datei.includes('Tempo & Interessen'), false)
    assert.equal(datei.includes('Ausgewogen'), false)
    assert.equal(datei.includes('reise.pace'), false)
    assert.match(datei, /Zeitraum, Ziele oder Reisewünsche/)
    assert.equal(datei.includes('Zeitraum, Etappen oder Tempo'), false)
    assert.match(datei, /workspacePraeferenzSicht/)
    assert.match(datei, /Reisewunsch/)
  })
})
