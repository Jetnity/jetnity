import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const hier = dirname(fileURLToPath(import.meta.url))

const VERBOTENE_IMPORTS = [
  'TripWorkspace',
  'TripWorkspaceUebersicht',
  'TripWorkspaceDestinationEssentials',
  'destination-essentials',
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
    const dateien = [
      '../../components/account/AccountUebersicht.tsx',
      '../../components/account/AccountUebersichtLive.tsx',
      '../../components/account/AccountWeltKarte.tsx',
      'world-map.ts',
    ]
    for (const datei of dateien) {
      const quelle = readFileSync(join(hier, datei), 'utf8')
      for (const verboten of VERBOTENE_IMPORTS) {
        assert.equal(quelle.includes(verboten), false, `unerlaubter Bezug in ${datei}: ${verboten}`)
      }
    }
  })

  test('behauptet bei 503 keinen geprüften Speicherstand', () => {
    const quelle = readFileSync(join(hier, '../../components/account/AccountUebersicht.tsx'), 'utf8')
    assert.equal(quelle.includes('Deine Reisen sind gespeichert'), false)
    assert.equal(
      quelle.includes('Wir konnten deinen aktuellen Speicherstand gerade nicht prüfen; bitte lade später neu.'),
      true,
    )
  })

  test('bietet nur einen kleinen Buchungs-Einstieg ohne Booking-Karten', () => {
    const quelle = readFileSync(join(hier, '../../components/account/AccountUebersicht.tsx'), 'utf8')
    assert.equal(quelle.includes('/account/bookings'), true)
    assert.equal(quelle.includes('AccountBuchungen'), false)
    assert.equal(quelle.includes('priceAmount'), false)
    assert.equal(quelle.includes('bookingUrl'), false)
  })
})
