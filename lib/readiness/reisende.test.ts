// lib/readiness/reisende.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { partyAusZeilen, type TravellerZeile } from '@/lib/readiness/reisende'

const BASIS: TravellerZeile = {
  id: 'aaaaaaaa-0000-4000-8000-000000000007',
  client_ref: 'traveller:1',
  label: 'Sasa',
  residence_country_code: 'CH',
  nationality_country_code: 'CH',
  document_type: 'passport',
  document_issuing_country_code: 'CH',
  document_expires_on: '2030-01-01',
  created_at: '2026-08-22T10:00:00.000Z',
  updated_at: '2026-08-22T10:00:00.000Z',
}

describe('Account-Traveller-Mapper', () => {
  test('kanonisch leere Citizenships bleiben leer trotz Legacy-Nationalität', () => {
    const party = partyAusZeilen([
      {
        ...BASIS,
        trip_traveller_citizenships: [],
        trip_traveller_documents: [],
      },
    ])
    assert.equal(party[0]?.citizenships.length, 0)
    assert.equal(party[0]?.documents.length, 0)
  })

  test('kanonisch leere Documents bleiben leer trotz Legacy-Passport', () => {
    const party = partyAusZeilen([
      {
        ...BASIS,
        trip_traveller_citizenships: [
          {
            id: 'cit-1',
            client_ref: 'citizenship:CH',
            country_code: 'CH',
            created_at: BASIS.created_at,
            updated_at: BASIS.updated_at,
          },
        ],
        trip_traveller_documents: [],
      },
    ])
    assert.equal(party[0]?.citizenships[0]?.countryCode, 'CH')
    assert.equal(party[0]?.documents.length, 0)
  })

  test('ohne geladene Child-Relationen expandiert Legacy weiter', () => {
    const party = partyAusZeilen([BASIS])
    assert.equal(party[0]?.citizenships[0]?.countryCode, 'CH')
    assert.equal(party[0]?.documents[0]?.documentType, 'passport')
    assert.equal(party[0]?.documents[0]?.issuingCountryCode, 'CH')
    assert.equal(party[0]?.documents[0]?.citizenshipClientRef, null)
  })
})
