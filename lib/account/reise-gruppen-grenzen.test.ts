import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { REISEN_LISTE_GRENZE } from '@/lib/trips/liste-grenze'

const hier = dirname(fileURLToPath(import.meta.url))

const VERBOTENE_IMPORTS = [
  'TripWorkspace',
  'TripWorkspaceUebersicht',
  'Reisevorbereitung',
  'ReiseSicherheit',
  'FlugSuche',
  'lib/safety',
  'lib/seasonal',
  'lib/readiness',
  'lib/billing',
  'citizenship',
  'staatsangehoerigkeit',
]

describe('AP-3 Meine Reisen bleibt ableitend', () => {
  test('teilt Error und Empty auf der Server-Seite', () => {
    const seite = readFileSync(join(hier, '../../app/(public)/reisen/page.tsx'), 'utf8')
    assert.equal(seite.includes('Deine Reisen konnten nicht geladen werden.'), true)
    assert.equal(seite.includes('Noch keine Reise in deinem Konto.'), true)
    assert.equal(seite.includes('KontoReisenGruppen'), true)
    assert.equal(seite.includes('GastReisen'), true)
    assert.match(seite, /if \(problem\)/)
  })

  test('schreibt keinen archived-Status', () => {
    const lage = readFileSync(join(hier, 'reise-lage.ts'), 'utf8')
    const gruppen = readFileSync(join(hier, '../../components/trips/KontoReisenGruppen.tsx'), 'utf8')
    const seite = readFileSync(join(hier, '../../app/(public)/reisen/page.tsx'), 'utf8')
    for (const quelle of [lage, gruppen, seite]) {
      assert.equal(quelle.includes("status = 'archived'"), false)
      assert.equal(quelle.includes('archived'), false)
    }
  })

  test('lädt keinen Workspace und setzt kein Citizenship-Default', () => {
    const gruppen = readFileSync(join(hier, '../../components/trips/KontoReisenGruppen.tsx'), 'utf8')
    const seite = readFileSync(join(hier, '../../app/(public)/reisen/page.tsx'), 'utf8')
    for (const verboten of VERBOTENE_IMPORTS) {
      assert.equal(gruppen.includes(verboten), false, `unerlaubter Bezug in Gruppen: ${verboten}`)
      assert.equal(seite.includes(verboten), false, `unerlaubter Bezug in Seite: ${verboten}`)
    }
  })

  test('nennt die 200-Grenze ehrlich', () => {
    assert.equal(REISEN_LISTE_GRENZE, 200)
    const daten = readFileSync(join(hier, '../../lib/trips/daten.ts'), 'utf8')
    const gruppen = readFileSync(join(hier, '../../components/trips/KontoReisenGruppen.tsx'), 'utf8')
    assert.equal(daten.includes('REISEN_LISTE_GRENZE'), true)
    assert.equal(gruppen.includes('REISEN_LISTE_GRENZE'), true)
    assert.equal(gruppen.includes('zuletzt geänderten Reisen angezeigt'), true)
  })

  test('klassifiziert erst am Geräte-Kalendertag', () => {
    const gruppen = readFileSync(join(hier, '../../components/trips/KontoReisenGruppen.tsx'), 'utf8')
    assert.equal(gruppen.includes('heutigesDatum'), true)
    assert.equal(gruppen.includes("useState<string | null>(null)"), true)
  })
})
