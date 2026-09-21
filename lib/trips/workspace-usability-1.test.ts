// lib/trips/workspace-usability-1.test.ts
//
// Focused display contracts for V1 Workspace Usability 1.
// No stored trip dates, coverage vocabulary or guest-storage semantics change.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'

describe('VUX-2 stage-date display', () => {
  test('same-year range matches the localized day-chip grammar', () => {
    const sichtbar = etappenZeitraumAnzeigen('2026-10-12', '2026-10-16')
    assert.equal(sichtbar?.includes('2026-10-12'), false)
    assert.equal(sichtbar?.includes('2026-10-16'), false)
    assert.match(sichtbar ?? '', /12\. Okt/)
    assert.match(sichtbar ?? '', /16\. Okt/)
  })

  test('cross-year range keeps both years', () => {
    const sichtbar = etappenZeitraumAnzeigen('2026-12-28', '2027-01-03')
    assert.match(sichtbar ?? '', /2026/)
    assert.match(sichtbar ?? '', /2027/)
  })

  test('does not invent an endpoint when only one date exists', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-10-12', undefined)?.startsWith('Ankunft'), true)
    assert.equal(etappenZeitraumAnzeigen(undefined, '2026-10-16')?.startsWith('Abreise'), true)
    assert.equal(etappenZeitraumAnzeigen(null, null), null)
  })
})
