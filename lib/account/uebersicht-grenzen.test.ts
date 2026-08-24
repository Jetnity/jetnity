import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const hier = dirname(fileURLToPath(import.meta.url))

const VERBOTENE_IMPORTS = [
  'TripWorkspace',
  'TripWorkspaceUebersicht',
  'Reisevorbereitung',
  'ReiseSicherheit',
  'FlugSuche',
  'FlugBestand',
  'HotelBereich',
  'UnterkunftBestand',
  'AktivitaetenBereich',
  'MobilitaetBereich',
  'lib/safety',
  'lib/seasonal',
  'lib/readiness',
]

describe('Account-Übersicht bleibt kein Workspace', () => {
  test('lädt keine Flug-/Hotel-/Readiness-/Safety-/Seasonal-Widgets', () => {
    const quelle = readFileSync(join(hier, '../../components/account/AccountUebersicht.tsx'), 'utf8')
    for (const verboten of VERBOTENE_IMPORTS) {
      assert.equal(quelle.includes(verboten), false, `unerlaubter Bezug: ${verboten}`)
    }
  })
})
