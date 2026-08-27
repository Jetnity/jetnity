import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { heutigesDatum, kalendertagAusInstant, naechsteReiseAus } from '@/lib/account/naechste-reise'
import type { TripSummary } from '@/types/trips'

function reise(teil: Partial<TripSummary> & Pick<TripSummary, 'id' | 'title'>): TripSummary {
  return {
    origin: null,
    startDate: null,
    endDate: null,
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    updatedAt: '2026-08-01T10:00:00.000Z',
    stages: [],
    stageCount: 1,
    dayCount: 0,
    itemCount: 0,
    ...teil,
  }
}

const HEUTE = '2026-08-24'
const NACH_UTC_MITTERNACHT = new Date('2026-08-24T00:30:00.000Z')
const VOR_UTC_MITTERNACHT = new Date('2026-08-23T23:30:00.000Z')

describe('kalendertagAusInstant', () => {
  test('nimmt nicht still den UTC-Kalendertag', () => {
    assert.equal(kalendertagAusInstant(NACH_UTC_MITTERNACHT, 0), '2026-08-24')
    assert.equal(kalendertagAusInstant(NACH_UTC_MITTERNACHT, 120), '2026-08-23')
  })

  test('dreht vor UTC-Mitternacht in östlicher Lage auf den nächsten Kalendertag', () => {
    assert.equal(kalendertagAusInstant(VOR_UTC_MITTERNACHT, 0), '2026-08-23')
    assert.equal(kalendertagAusInstant(VOR_UTC_MITTERNACHT, -180), '2026-08-24')
  })
})

describe('heutigesDatum', () => {
  test('folgt dem Geräte-Offset des Instant, nicht toISOString', () => {
    const instant = new Date('2026-08-24T01:30:00.000Z')
    assert.equal(heutigesDatum(instant), kalendertagAusInstant(instant, instant.getTimezoneOffset()))
    const quelle = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'naechste-reise.ts'), 'utf8')
    assert.equal(quelle.includes('.toISOString('), false)
  })
})

describe('Account-Übersicht: Empty, Error-Trennung und nächste Reise', () => {
  test('ohne Reisen gibt es keine nächste Reise', () => {
    assert.equal(naechsteReiseAus([], HEUTE), null)
  })

  test('bevorzugt die aktive Reise vor einer kommenden', () => {
    const aktiv = reise({
      id: 'aktiv',
      title: 'Lisbon',
      startDate: '2026-08-20',
      endDate: '2026-08-28',
      status: 'planned',
    })
    const kommend = reise({
      id: 'spaeter',
      title: 'Kyoto',
      startDate: '2026-09-01',
      endDate: '2026-09-08',
      status: 'planned',
      updatedAt: '2026-08-20T10:00:00.000Z',
    })
    const gewählt = naechsteReiseAus([kommend, aktiv], HEUTE)
    assert.equal(gewählt?.lage, 'aktiv')
    assert.equal(gewählt?.reise.id, 'aktiv')
  })

  test('wählt die nächste kommende Reise, wenn keine aktive läuft', () => {
    const spaeter = reise({
      id: 'spaeter',
      title: 'Kyoto',
      startDate: '2026-10-01',
      endDate: '2026-10-08',
      status: 'planned',
    })
    const naeher = reise({
      id: 'naeher',
      title: 'Porto',
      startDate: '2026-09-02',
      endDate: '2026-09-06',
      status: 'planned',
    })
    const gewählt = naechsteReiseAus([spaeter, naeher], HEUTE)
    assert.equal(gewählt?.lage, 'kommend')
    assert.equal(gewählt?.reise.id, 'naeher')
  })

  test('ein Entwurf ohne Datum bleibt Fortsetzen, nicht kommend oder aktiv', () => {
    const entwurf = reise({ id: 'entwurf', title: 'Noch offen' })
    const gewählt = naechsteReiseAus([entwurf], HEUTE)
    assert.equal(gewählt?.lage, 'fortsetzen')
    assert.equal(gewählt?.reise.id, 'entwurf')
  })

  test('archivierte Reisen sind keine nächste Reise', () => {
    const archiv = reise({
      id: 'alt',
      title: 'Rom',
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      status: 'archived',
    })
    assert.equal(naechsteReiseAus([archiv], HEUTE), null)
  })

  test('ohne Geräte-Kalendertag behauptet sie weder aktiv noch kommend', () => {
    const geplant = reise({
      id: 'lisbon',
      title: 'Lisbon',
      startDate: '2026-08-24',
      endDate: '2026-08-28',
      status: 'planned',
    })
    const gewählt = naechsteReiseAus([geplant], null)
    assert.equal(gewählt?.lage, 'fortsetzen')
    assert.equal(gewählt?.reise.id, 'lisbon')
  })
})

describe('UTC/lokaler Tageswechsel an der aktiv/kommend-Grenze', () => {
  const startetAmUtcTag = reise({
    id: 'start',
    title: 'Start heute',
    startDate: '2026-08-24',
    endDate: '2026-08-28',
    status: 'planned',
  })
  const endetAmVortag = reise({
    id: 'ende',
    title: 'Ende gestern',
    startDate: '2026-08-20',
    endDate: '2026-08-23',
    status: 'planned',
  })

  test('kurz nach UTC-Mitternacht bleibt die Reise kommend, solange der Geräte-Tag der Vortag ist', () => {
    const geraetetag = kalendertagAusInstant(NACH_UTC_MITTERNACHT, 120)
    assert.equal(geraetetag, '2026-08-23')
    const gewählt = naechsteReiseAus([startetAmUtcTag], geraetetag)
    assert.equal(gewählt?.lage, 'kommend')
    assert.equal(gewählt?.reise.id, 'start')
  })

  test('dieselbe UTC-Minute ist aktiv, sobald der Geräte-Tag der Reisetag ist', () => {
    const geraetetag = kalendertagAusInstant(NACH_UTC_MITTERNACHT, 0)
    assert.equal(geraetetag, '2026-08-24')
    const gewählt = naechsteReiseAus([startetAmUtcTag], geraetetag)
    assert.equal(gewählt?.lage, 'aktiv')
    assert.equal(gewählt?.reise.id, 'start')
  })

  test('kurz vor UTC-Mitternacht bleibt die Reise aktiv, solange der Geräte-Tag der Endtag ist', () => {
    const geraetetag = kalendertagAusInstant(VOR_UTC_MITTERNACHT, 0)
    assert.equal(geraetetag, '2026-08-23')
    const gewählt = naechsteReiseAus([endetAmVortag], geraetetag)
    assert.equal(gewählt?.lage, 'aktiv')
    assert.equal(gewählt?.reise.id, 'ende')
  })

  test('dieselbe UTC-Minute ist nach dem lokalen Tageswechsel nicht mehr aktiv', () => {
    const geraetetag = kalendertagAusInstant(VOR_UTC_MITTERNACHT, -180)
    assert.equal(geraetetag, '2026-08-24')
    const gewählt = naechsteReiseAus([endetAmVortag], geraetetag)
    assert.equal(gewählt?.lage, 'fortsetzen')
    assert.equal(gewählt?.reise.id, 'ende')
  })
})
