// lib/readiness/traveller-anfrage.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { travellerAnfrageStriktLesen } from '@/lib/readiness/traveller-anfrage'
import { travellerLegacyLesen } from '@/lib/readiness/traveller-kontext'

describe('Strikte Requirements-Traveller-Anfrage', () => {
  test('gültige Canonical-Form bleibt unverändert', () => {
    const roh = {
      clientRef: 'traveller:1',
      residenceCountryCode: 'CH',
      citizenships: [{ clientRef: 'citizenship:CH', countryCode: 'CH' }],
      documents: [
        {
          clientRef: 'document:passport:CH',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          expiresOn: '2030-01-01',
          citizenshipClientRef: 'citizenship:CH',
        },
      ],
    }
    const gelesen = travellerAnfrageStriktLesen(roh)
    assert.equal(gelesen?.clientRef, 'traveller:1')
    assert.equal(gelesen?.citizenships.length, 1)
    assert.equal(gelesen?.documents.length, 1)
    assert.equal(gelesen?.documents[0]?.citizenshipClientRef, 'citizenship:CH')
  })

  test('echte Legacy-Form ohne Canonical-Properties bleibt kompatibel', () => {
    const gelesen = travellerAnfrageStriktLesen({
      clientRef: 'traveller:1',
      nationalityCountryCode: 'CH',
      documentType: 'passport',
      documentIssuingCountryCode: 'CH',
    })
    assert.equal(gelesen?.citizenships[0]?.countryCode, 'CH')
    assert.equal(gelesen?.documents[0]?.documentType, 'passport')
  })

  test('gültiges plus malformed Citizenship-Child ist fail-closed', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        citizenships: [{ countryCode: 'CH' }, { country: 'DE' }],
      }),
      null,
    )
  })

  test('gültiges plus malformed Document-Child ist fail-closed', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        citizenships: [{ countryCode: 'CH' }],
        documents: [
          { clientRef: 'document:passport:CH', documentType: 'passport', issuingCountryCode: 'CH' },
          { clientRef: 'document:bad', typ: 'passport' },
        ],
      }),
      null,
    )
  })

  test('falscher Typ von citizenships oder documents löst keinen Legacy-Fallback aus', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        nationalityCountryCode: 'CH',
        citizenships: 'kaputt',
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documentType: 'passport',
        documents: { documentType: 'passport' },
      }),
      null,
    )
    const legacy = travellerLegacyLesen({
      clientRef: 'traveller:1',
      nationalityCountryCode: 'CH',
      citizenships: 'kaputt',
    })
    assert.equal(legacy?.citizenships[0]?.countryCode, 'CH')
  })

  test('Limits werden abgewiesen statt still gekürzt', () => {
    const citizenships = Array.from({ length: 9 }, (_, index) => ({
      countryCode: String.fromCharCode(65 + index) + 'A',
    }))
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        citizenships,
      }),
      null,
    )
    const documents = Array.from({ length: 13 }, (_, index) => ({
      clientRef: `document:${index}`,
      documentType: 'passport',
      issuingCountryCode: 'CH',
    }))
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documents,
      }),
      null,
    )
  })

  test('Duplicate-Child oder Duplicate-Ref ist fail-closed', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        citizenships: [
          { clientRef: 'citizenship:CH', countryCode: 'CH' },
          { clientRef: 'citizenship:CH-2', countryCode: 'CH' },
        ],
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documents: [
          { clientRef: 'document:same', documentType: 'passport', issuingCountryCode: 'CH' },
          { clientRef: 'document:same', documentType: 'national_id', issuingCountryCode: 'DE' },
        ],
      }),
      null,
    )
  })

  test('malformed Legacy-Singularfelder sind fail-closed', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documentType: 'foobar',
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        nationalityCountryCode: 'CH',
        documentType: 'passport',
        documentExpiresOn: 'kaputt',
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        nationalityCountryCode: 'Schweiz',
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        residenceCountryCode: 41,
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documentType: 'passport',
        documentIssuingCountryCode: 'CHH',
      }),
      null,
    )
    const tolerant = travellerLegacyLesen({
      clientRef: 'traveller:1',
      documentType: 'foobar',
      documentExpiresOn: 'kaputt',
      nationalityCountryCode: 'Schweiz',
    })
    assert.equal(tolerant?.clientRef, 'traveller:1')
    assert.equal(tolerant?.documents[0]?.documentType, 'foobar')
    assert.equal(tolerant?.documents[0]?.expiresOn, 'kaputt')
    assert.equal(tolerant?.citizenships.length, 0)
  })

  test('Passnummer oder MRZ an der API-Grenze wird nicht still ignoriert', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        nationalityCountryCode: 'CH',
        passportNumber: 'X1234567',
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documents: [
          {
            clientRef: 'document:passport:CH',
            documentType: 'passport',
            issuingCountryCode: 'CH',
            mrz: 'P<CHETEST',
          },
        ],
      }),
      null,
    )
  })
})
