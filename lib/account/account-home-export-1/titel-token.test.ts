import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { neueReiseSchema, reiseSchema } from '@/lib/trips/schema'

const title = 'W'.repeat(120)
const origin = 'Z'.repeat(120)

const formular = {
  clientRef: 'r5-token',
  title,
  destination: 'Lissabon',
  destinationPlaceId: 'geonames:2267057',
  origin,
  originPlaceId: 'geonames:2657896',
  startDate: '2026-11-02',
  endDate: '2026-11-06',
  travellers: 1,
  currency: 'CHF',
  budgetAmount: null,
  pace: 'balanced' as const,
  interests: [],
  travelWish: null,
}

describe('ungebrochenes Titel- und Herkunftstoken', () => {
  test('120 Zeichen ohne Leerzeichen bleiben gültig, 121 nicht', () => {
    const erstellt = neueReiseSchema.safeParse(formular)
    assert.equal(erstellt.success, true)
    if (!erstellt.success) return
    assert.equal(erstellt.data.title, title)
    assert.equal(erstellt.data.origin, origin)
    assert.equal(neueReiseSchema.safeParse({ ...formular, title: 'W'.repeat(121) }).success, false)
    assert.equal(neueReiseSchema.safeParse({ ...formular, origin: 'Z'.repeat(121) }).success, false)

    const gespeichert = reiseSchema.safeParse({
      id: 'r0',
      clientRef: 'r5-token',
      title,
      origin,
      startDate: '2026-11-02',
      endDate: '2026-11-06',
      travellers: 1,
      currency: 'CHF',
      budgetAmount: null,
      status: 'planned',
      pace: 'balanced',
      interests: [],
      travelWish: null,
      stages: [{ id: 's1', position: 1, name: 'Lissabon' }],
      days: [{ id: 'd1', dayIndex: 1, dayDate: '2026-11-02', items: [] }],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    })
    assert.equal(gespeichert.success, true)
    if (!gespeichert.success) return
    assert.equal(gespeichert.data.title, title)
    assert.equal(gespeichert.data.origin, origin)
  })
})
