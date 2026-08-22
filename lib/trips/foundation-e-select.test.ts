// lib/trips/foundation-e-select.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { foundationERelationFehlt } from '@/lib/trips/foundation-e-select'

describe('Foundation-E Expand/Contract Read', () => {
  test('fehlende Child-Relation darf auf Legacy-Select fallen', () => {
    assert.equal(
      foundationERelationFehlt({
        code: 'PGRST200',
        message: 'Could not find a relationship between \'trip_travellers\' and \'trip_traveller_citizenships\'',
      }),
      true,
    )
    assert.equal(
      foundationERelationFehlt({
        code: '42P01',
        message: 'relation "public.trip_traveller_documents" does not exist',
      }),
      true,
    )
    assert.equal(
      foundationERelationFehlt({
        code: 'PGRST205',
        message: "Could not find the table 'public.trip_traveller_citizenships' in the schema cache",
      }),
      true,
    )
  })

  test('anderer DB-Fehler fällt nicht still auf Legacy zurück', () => {
    assert.equal(
      foundationERelationFehlt({
        code: '42501',
        message: 'permission denied for table trip_travellers',
      }),
      false,
    )
    assert.equal(
      foundationERelationFehlt({
        code: '57014',
        message: 'canceling statement due to statement timeout',
      }),
      false,
    )
    assert.equal(
      foundationERelationFehlt({
        code: 'PGRST301',
        message: 'JWT expired',
      }),
      false,
    )
    assert.equal(foundationERelationFehlt({ code: 'PGRST200', message: 'something else' }), false)
    assert.equal(foundationERelationFehlt(null), false)
  })
})
