import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { UEBERSICHT_SPALTEN, uebersichtAusZeile, type UebersichtZeile } from '@/lib/trips/reisen-uebersicht'

const hier = dirname(fileURLToPath(import.meta.url))

function zeile(teil: Partial<UebersichtZeile> = {}): UebersichtZeile {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Bern',
    origin: 'Zürich',
    start_date: '2026-09-12',
    end_date: '2026-09-14',
    travellers: 2,
    currency: 'CHF',
    budget_amount: '10.5',
    status: 'planned',
    updated_at: '2026-10-25T00:00:00.000001Z',
    metadata: { account_archive: { previous_status: 'draft' } },
    trip_stages: [
      {
        name: 'Ubud',
        position: 1,
        country_code: 'ID',
        place_id: 'geonames:1622786',
        latitude: '-8.5069',
        longitude: 115.2625,
      },
    ],
    trip_days: [{ count: 3 }],
    trip_items: [{ count: 4 }],
    ...teil,
  }
}

describe('gemeinsame Reiseübersicht', () => {
  test('bildet Etappen, Zähler und den früheren Status einmal ab', () => {
    const sicht = uebersichtAusZeile(zeile())
    assert.equal(sicht.stageCount, 1)
    assert.equal(sicht.itemCount, 4)
    assert.equal(sicht.dayCount, 3)
    assert.equal(sicht.archivePreviousStatus, 'draft')
    assert.equal(sicht.updatedAt, '2026-10-25T00:00:00.000001Z')
    assert.equal(sicht.budgetAmount, 10.5)
    assert.deepEqual(sicht.stages[0], {
      name: 'Ubud',
      position: 1,
      countryCode: 'ID',
      placeId: 'geonames:1622786',
      latitude: -8.5069,
      longitude: 115.2625,
    })
    assert.match(UEBERSICHT_SPALTEN, /trip_stages\(name, position, country_code, place_id, latitude, longitude\)/)
    assert.equal(UEBERSICHT_SPALTEN.includes('trip_stages(count)'), false)
  })

  test('reisenLaden benutzt die Übersicht und bleibt bei 200', () => {
    const daten = readFileSync(join(hier, 'daten.ts'), 'utf8')
    const laden = daten.slice(daten.indexOf('export async function reisenLaden'), daten.indexOf('export async function reiseLaden'))
    assert.match(laden, /UEBERSICHT_SPALTEN/)
    assert.match(laden, /uebersichtAusZeilen/)
    assert.match(laden, /REISEN_LISTE_GRENZE/)
    assert.match(laden, /lese</)
    assert.match(laden, /order\('updated_at', \{ ascending: false \}\)/)
    assert.equal((laden.match(/\.from\('trips'\)/g) ?? []).length, 1)
    assert.equal(laden.includes('createServiceRole'), false)
    assert.equal(laden.includes("eq('user_id'"), false)
    assert.match(daten, /accountGraphLesen/)
    const konto = readFileSync(join(hier, '../../app/account/page.tsx'), 'utf8')
    const welt = readFileSync(join(hier, '../../app/account/welt/page.tsx'), 'utf8')
    assert.match(konto, /reisenLaden/)
    assert.match(welt, /reisenLaden/)
    assert.equal(konto.includes('reisenSammlung'), false)
    assert.equal(welt.includes('reisenSammlung'), false)
  })
})
