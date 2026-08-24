import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { heutigesDatum, naechsteReiseAus } from '@/lib/account/naechste-reise'
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
    stageCount: 1,
    dayCount: 0,
    itemCount: 0,
    ...teil,
  }
}

const HEUTE = '2026-08-24'

describe('heutigesDatum', () => {
  test('nimmt den UTC-Kalendertag', () => {
    assert.equal(heutigesDatum(new Date('2026-08-24T01:30:00.000Z')), '2026-08-24')
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
})
